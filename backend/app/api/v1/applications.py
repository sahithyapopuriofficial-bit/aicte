# backend/app/api/v1/applications.py
import math
import random
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.application import (
    Application,
    ApplicationCategory,
    ApplicationStatus,
    ApplicationStageHistory,
)
from app.models.institution import Institution
from app.models.user import User
from app.schemas.application import (
    ApplicationCreateRequest,
    ApplicationDetailResponse,
    ApplicationSummaryResponse,
    ApplicationUpdateRequest,
    PaginatedApplicationResponse,
    WorkflowTransitionRequest,
)
from app.services.audit_service import AuditService
from app.services.workflow_engine import ALLOWED_TRANSITIONS, WorkflowEngine

router = APIRouter(prefix="/applications", tags=["Applications Management"])


def generate_unique_reference(db: Session, category: ApplicationCategory) -> str:
    """Generate deterministic, human-readable reference: AICTE-YYYY-CAT-RANDOM."""
    year = datetime.now(timezone.utc).year
    cat_prefix = {
        ApplicationCategory.NEW_INSTITUTE: "NEW",
        ApplicationCategory.EXTENSION_OF_APPROVAL: "EOA",
        ApplicationCategory.INCREASE_IN_INTAKE: "INT",
        ApplicationCategory.NEW_PROGRAM: "PRG",
    }.get(category, "APP")

    while True:
        rand_num = random.randint(100000, 999999)
        ref = f"AICTE-{year}-{cat_prefix}-{rand_num}"
        exists = db.query(Application.id).filter(Application.application_ref == ref).first()
        if not exists:
            return ref


def calculate_pendency(stage_entered_at: datetime, stage_deadline: Optional[datetime]):
    now = datetime.now(timezone.utc)
    days_at_stage = (now - stage_entered_at).days
    is_overdue = stage_deadline is not None and now > stage_deadline
    return max(0, days_at_stage), is_overdue


def get_authorized_query(user: User, db: Session):
    """Enforce data isolation boundaries per role before querying."""
    query = db.query(Application).options(joinedload(Application.institution))

    if user.role.name == "INSTITUTIONAL_ADMIN":
        if not user.institution_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User profile has no associated institution.",
            )
        return query.filter(Application.institution_id == user.institution_id)

    if user.role.name == "REGIONAL_OFFICER":
        if not user.region_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Regional Officer profile has no assigned Region.",
            )
        return query.filter(Application.assigned_region_id == user.region_id)

    # BUREAU_OFFICER, SYSTEM_ADMIN, and COMPLIANCE_VERIFICATION_OFFICER have broader visibility
    return query


@router.get("", response_model=PaginatedApplicationResponse, summary="List and filter applications")
def list_applications(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(15, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search by application reference or institution name"),
    status_filter: Optional[ApplicationStatus] = Query(None, alias="status"),
    category: Optional[ApplicationCategory] = None,
    stage: Optional[str] = None,
    region_id: Optional[UUID] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = get_authorized_query(current_user, db)

    # Multi-field search
    if search:
        search_expr = f"%{search.strip()}%"
        query = query.join(Application.institution).filter(
            or_(
                Application.application_ref.ilike(search_expr),
                Institution.name.ilike(search_expr),
            )
        )

    if status_filter:
        query = query.filter(Application.status == status_filter)
    if category:
        query = query.filter(Application.category == category)
    if stage:
        query = query.filter(Application.current_stage == stage)
    if region_id and current_user.role.name in ["SYSTEM_ADMIN", "BUREAU_OFFICER"]:
        query = query.filter(Application.assigned_region_id == region_id)

    total = query.with_entities(func.count(Application.id)).scalar() or 0
    records = (
        query.order_by(Application.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )

    items = []
    for app in records:
        days_at_stage, is_overdue = calculate_pendency(app.stage_entered_at, app.stage_deadline)
        items.append(
            ApplicationSummaryResponse(
                id=app.id,
                application_ref=app.application_ref,
                institution_id=app.institution_id,
                institution_name=app.institution.name if app.institution else None,
                category=app.category,
                current_stage=app.current_stage,
                status=app.status,
                assigned_region_id=app.assigned_region_id,
                assigned_officer_id=app.assigned_officer_id,
                stage_entered_at=app.stage_entered_at,
                stage_deadline=app.stage_deadline,
                is_overdue=is_overdue,
                days_at_current_stage=days_at_stage,
                created_at=app.created_at,
            )
        )

    return PaginatedApplicationResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total > 0 else 1,
    )


@router.post("", response_model=ApplicationSummaryResponse, status_code=status.HTTP_201_CREATED, summary="Create a new institutional approval application")
def create_application(
    payload: ApplicationCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role.name not in ["INSTITUTIONAL_ADMIN", "SYSTEM_ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Institutional Administrators or System Admins can initiate applications.",
        )

    target_institution_id = current_user.institution_id
    if current_user.role.name == "SYSTEM_ADMIN" and not target_institution_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="System Administrator must specify an affiliated institution context.",
        )

    app_ref = generate_unique_reference(db, payload.category)
    now = datetime.now(timezone.utc)

    new_app = Application(
        application_ref=app_ref,
        institution_id=target_institution_id,
        category=payload.category,
        rule_version_id=payload.rule_version_id,
        current_stage="SCRUTINY",
        status=ApplicationStatus.SUBMITTED,
        assigned_region_id=payload.assigned_region_id,
        stage_entered_at=now,
    )
    db.add(new_app)
    db.flush()

    # Create initial stage entry
    history = ApplicationStageHistory(
        application_id=new_app.id,
        previous_stage="NONE",
        new_stage="SCRUTINY",
        actor_id=current_user.id,
        action="APPLICATION_SUBMITTED",
        reason="Initial application lodgement.",
    )
    db.add(history)

    # Log audit trail
    audit = AuditService(db)
    audit.log(
        actor_id=current_user.id,
        action="APPLICATION_CREATED",
        resource_type="APPLICATION",
        resource_id=str(new_app.id),
        outcome="SUCCESS",
        metadata={"application_ref": app_ref, "category": payload.category.value},
    )

    db.commit()
    db.refresh(new_app)

    days_at_stage, is_overdue = calculate_pendency(new_app.stage_entered_at, new_app.stage_deadline)
    return ApplicationSummaryResponse(
        id=new_app.id,
        application_ref=new_app.application_ref,
        institution_id=new_app.institution_id,
        institution_name=new_app.institution.name if new_app.institution else None,
        category=new_app.category,
        current_stage=new_app.current_stage,
        status=new_app.status,
        assigned_region_id=new_app.assigned_region_id,
        assigned_officer_id=new_app.assigned_officer_id,
        stage_entered_at=new_app.stage_entered_at,
        stage_deadline=new_app.stage_deadline,
        is_overdue=is_overdue,
        days_at_current_stage=days_at_stage,
        created_at=new_app.created_at,
    )


@router.get("/{application_id}", response_model=ApplicationDetailResponse, summary="Get comprehensive application details")
def get_application(
    application_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = get_authorized_query(current_user, db)
    app = query.options(
        joinedload(Application.stage_history),
        joinedload(Application.institution),
    ).filter(Application.id == application_id).first()

    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found or unauthorized.")

    days_at_stage, is_overdue = calculate_pendency(app.stage_entered_at, app.stage_deadline)

    # Compute valid actions the current user's role can invoke right now
    stage_rules = ALLOWED_TRANSITIONS.get(app.current_stage, {})
    permitted_actions = [
        action_name
        for action_name, config in stage_rules.items()
        if current_user.role.name in config["allowed_roles"]
    ]

    return ApplicationDetailResponse(
        id=app.id,
        application_ref=app.application_ref,
        institution_id=app.institution_id,
        institution_name=app.institution.name if app.institution else None,
        category=app.category,
        current_stage=app.current_stage,
        status=app.status,
        assigned_region_id=app.assigned_region_id,
        assigned_officer_id=app.assigned_officer_id,
        stage_entered_at=app.stage_entered_at,
        stage_deadline=app.stage_deadline,
        is_overdue=is_overdue,
        days_at_current_stage=days_at_stage,
        created_at=app.created_at,
        stage_history=app.stage_history,
        applicable_actions=permitted_actions,
    )


@router.patch("/{application_id}/assign", response_model=ApplicationSummaryResponse, summary="Assign processing officer to application")
def assign_officer(
    application_id: UUID,
    payload: ApplicationUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role.name not in ["REGIONAL_OFFICER", "BUREAU_OFFICER", "SYSTEM_ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized to assign processing officers.",
        )

    query = get_authorized_query(current_user, db)
    app = query.filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")

    if payload.assigned_officer_id:
        target_officer = db.query(User).filter(User.id == payload.assigned_officer_id).first()
        if not target_officer:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Target officer not found.")
        app.assigned_officer_id = target_officer.id
    else:
        app.assigned_officer_id = None

    audit = AuditService(db)
    audit.log(
        actor_id=current_user.id,
        action="OFFICER_ASSIGNED",
        resource_type="APPLICATION",
        resource_id=str(app.id),
        outcome="SUCCESS",
        metadata={"assigned_officer_id": str(app.assigned_officer_id)},
    )

    db.commit()
    db.refresh(app)

    days_at_stage, is_overdue = calculate_pendency(app.stage_entered_at, app.stage_deadline)
    return ApplicationSummaryResponse(
        id=app.id,
        application_ref=app.application_ref,
        institution_id=app.institution_id,
        institution_name=app.institution.name if app.institution else None,
        category=app.category,
        current_stage=app.current_stage,
        status=app.status,
        assigned_region_id=app.assigned_region_id,
        assigned_officer_id=app.assigned_officer_id,
        stage_entered_at=app.stage_entered_at,
        stage_deadline=app.stage_deadline,
        is_overdue=is_overdue,
        days_at_current_stage=days_at_stage,
        created_at=app.created_at,
    )


@router.post("/{application_id}/transitions", response_model=ApplicationDetailResponse, summary="Execute authorized workflow transition")
def execute_transition(
    application_id: UUID,
    payload: WorkflowTransitionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Verify access to application
    query = get_authorized_query(current_user, db)
    app_exists = query.filter(Application.id == application_id).first()
    if not app_exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found or inaccessible.")

    workflow = WorkflowEngine(db)
    updated_app = workflow.transition(
        application_id=application_id,
        action=payload.action,
        actor_id=current_user.id,
        actor_role=current_user.role.name,
        reason=payload.reason,
    )

    # Return refreshed detail view
    return get_application(application_id=updated_app.id, current_user=current_user, db=db)