# backend/app/api/v1/escalations.py
import math
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.dependencies import get_current_user, RequireRole
from app.models.application import Application
from app.models.compliance import Escalation, EscalationLevel
from app.models.user import User
from app.schemas.escalation import (
    EscalationResolveRequest,
    EscalationResponse,
    EscalationRunResult,
    PaginatedEscalationResponse,
)
from app.services.audit_service import AuditService
from app.services.escalation_service import EscalationEngineService

router = APIRouter(
    prefix="/escalations",
    tags=["Escalations & Pendency Alerts"],
    dependencies=[
        Depends(
            RequireRole(
                "SYSTEM_ADMIN",
                "BUREAU_OFFICER",
                "REGIONAL_OFFICER",
                "COMPLIANCE_VERIFICATION_OFFICER",
            )
        )
    ],
)


def map_escalation_to_response(esc: Escalation) -> EscalationResponse:
    app_ref = esc.application.application_ref if esc.application else None
    inst_id = None
    inst_name = None

    if esc.application and esc.application.institution:
        inst_id = esc.application.institution.id
        inst_name = esc.application.institution.name

    resolved_by_name = esc.resolved_by.full_name if esc.resolved_by else None

    return EscalationResponse(
        id=esc.id,
        application_id=esc.application_id,
        application_ref=app_ref,
        institution_id=inst_id,
        institution_name=inst_name,
        obligation_id=esc.obligation_id,
        level=esc.level,
        triggering_rule=esc.triggering_rule,
        responsible_role=esc.responsible_role,
        trigger_timestamp=esc.trigger_timestamp,
        is_resolved=esc.is_resolved,
        resolution_notes=esc.resolution_notes,
        resolved_by_id=esc.resolved_by_id,
        resolved_by_name=resolved_by_name,
        resolved_at=esc.resolved_at,
    )


@router.get("", response_model=PaginatedEscalationResponse, summary="List regulatory escalations with scope filters")
def list_escalations(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(15, ge=1, le=100, description="Items per page"),
    level: Optional[EscalationLevel] = None,
    is_resolved: Optional[bool] = Query(None, description="Filter by resolution state"),
    application_id: Optional[UUID] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = (
        db.query(Escalation)
        .options(
            joinedload(Escalation.application).joinedload(Application.institution),
            joinedload(Escalation.resolved_by),
        )
    )

    # Scoped Data Isolation: Regional Officers only see escalations within their jurisdiction
    if current_user.role.name == "REGIONAL_OFFICER":
        if not current_user.region_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Regional Officer has no assigned geographic region.",
            )
        query = query.join(Escalation.application).filter(
            Application.assigned_region_id == current_user.region_id
        )

    if level:
        query = query.filter(Escalation.level == level)
    if is_resolved is not None:
        query = query.filter(Escalation.is_resolved == is_resolved)
    if application_id:
        query = query.filter(Escalation.application_id == application_id)

    total = query.with_entities(func.count(Escalation.id)).scalar() or 0
    records = (
        query.order_by(Escalation.is_resolved.asc(), Escalation.trigger_timestamp.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )

    return PaginatedEscalationResponse(
        items=[map_escalation_to_response(e) for e in records],
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total > 0 else 1,
    )


@router.get("/{escalation_id}", response_model=EscalationResponse, summary="Inspect individual escalation record")
def get_escalation(
    escalation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    esc = (
        db.query(Escalation)
        .options(
            joinedload(Escalation.application).joinedload(Application.institution),
            joinedload(Escalation.resolved_by),
        )
        .filter(Escalation.id == escalation_id)
        .first()
    )
    if not esc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Escalation record not found.",
        )

    if current_user.role.name == "REGIONAL_OFFICER":
        if esc.application and esc.application.assigned_region_id != current_user.region_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Escalation is outside your assigned region.",
            )

    return map_escalation_to_response(esc)


@router.post(
    "/{escalation_id}/resolve",
    response_model=EscalationResponse,
    summary="Acknowledge and mark an active escalation as resolved",
    dependencies=[Depends(RequireRole("REGIONAL_OFFICER", "BUREAU_OFFICER", "SYSTEM_ADMIN"))],
)
def resolve_escalation(
    escalation_id: UUID,
    payload: EscalationResolveRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    esc = (
        db.query(Escalation)
        .options(
            joinedload(Escalation.application).joinedload(Application.institution),
            joinedload(Escalation.resolved_by),
        )
        .filter(Escalation.id == escalation_id)
        .first()
    )
    if not esc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Escalation record not found.")

    if esc.is_resolved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This escalation has already been resolved and recorded.",
        )

    if current_user.role.name == "REGIONAL_OFFICER":
        if esc.application and esc.application.assigned_region_id != current_user.region_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot resolve escalations for another region.",
            )
        if esc.level in [EscalationLevel.LEVEL_2, EscalationLevel.LEVEL_3]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Regional Officers cannot resolve Level 2 or Level 3 Bureau-tier escalations.",
            )

    now = datetime.now(timezone.utc)
    esc.is_resolved = True
    esc.resolution_notes = payload.resolution_notes.strip()
    esc.resolved_by_id = current_user.id
    esc.resolved_at = now

    audit = AuditService(db)
    audit.log(
        actor_id=current_user.id,
        action="ESCALATION_RESOLVED",
        resource_type="ESCALATION",
        resource_id=str(esc.id),
        outcome="SUCCESS",
        metadata={
            "application_id": str(esc.application_id) if esc.application_id else None,
            "level": esc.level.value,
            "resolution_summary": esc.resolution_notes[:100],
        },
    )

    db.commit()
    db.refresh(esc)
    return map_escalation_to_response(esc)


@router.post(
    "/trigger-evaluation",
    response_model=EscalationRunResult,
    summary="Execute on-demand SLA scan and escalation sweep",
    dependencies=[Depends(RequireRole("SYSTEM_ADMIN", "BUREAU_OFFICER"))],
)
def trigger_escalation_sweep(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Manually invoke the background escalation scanner.
    Used during scheduled cron jobs or by administrative mandate.
    """
    engine = EscalationEngineService(db)
    checked, new_esc, notifs = engine.run_deadline_evaluation()

    audit = AuditService(db)
    audit.log(
        actor_id=current_user.id,
        action="ESCALATION_SWEEP_EXECUTED",
        resource_type="SYSTEM_TASK",
        resource_id="MANUAL_SWEEP",
        outcome="SUCCESS",
        metadata={
            "evaluations_checked": checked,
            "new_escalations": new_esc,
            "notifications_dispatched": notifs,
        },
    )

    return EscalationRunResult(
        timestamp=datetime.now(timezone.utc),
        evaluations_checked=checked,
        new_escalations_created=new_esc,
        notifications_dispatched=notifs,
    )