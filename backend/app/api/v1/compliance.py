# backend/app/api/v1/compliance.py
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
from app.models.compliance import ComplianceObligation, ComplianceStatus, ObligationType
from app.models.institution import Institution
from app.models.user import User
from app.schemas.compliance import (
    ObligationCreateRequest,
    ObligationResponse,
    ObligationSubmitEvidenceRequest,
    ObligationVerificationRequest,
    PaginatedObligationResponse,
)
from app.services.audit_service import AuditService

router = APIRouter(prefix="/compliance", tags=["Undertakings & Institutional Compliance"])


def get_authorized_obligation_query(user: User, db: Session):
    """
    Scope obligation queries:
    - Institutional Admins view only their own institution's obligations.
    - Regional Officers view obligations linked to institutions/applications in their assigned Region.
    - Bureau Officers and System Admins have national scope.
    """
    query = db.query(ComplianceObligation).options(
        joinedload(ComplianceObligation.institution),
        joinedload(ComplianceObligation.application),
    )

    if user.role.name == "INSTITUTIONAL_ADMIN":
        if not user.institution_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User profile has no associated institution.",
            )
        return query.filter(ComplianceObligation.institution_id == user.institution_id)

    if user.role.name == "REGIONAL_OFFICER":
        if not user.region_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Regional Officer has no assigned Region.",
            )
        return query.join(Institution).filter(Institution.region_id == user.region_id)

    return query


def map_obligation_to_response(ob: ComplianceObligation) -> ObligationResponse:
    now = datetime.now(timezone.utc)
    is_overdue = (
        ob.status not in [ComplianceStatus.VERIFIED, ComplianceStatus.CLOSED]
        and now > ob.due_date
    )
    return ObligationResponse(
        id=ob.id,
        institution_id=ob.institution_id,
        institution_name=ob.institution.name if ob.institution else None,
        application_id=ob.application_id,
        application_ref=ob.application.application_ref if ob.application else None,
        obligation_type=ob.obligation_type,
        description=ob.description,
        applicable_condition=ob.applicable_condition,
        issue_date=ob.issue_date,
        due_date=ob.due_date,
        status=ob.status,
        submitted_document_id=ob.submitted_document_id,
        submission_notes=ob.submission_notes,
        submitted_at=ob.submitted_at,
        submitted_by_id=ob.submitted_by_id,
        verified_by_id=ob.verified_by_id,
        verification_date=ob.verification_date,
        deficiency_reason=ob.deficiency_reason,
        verification_remarks=ob.verification_remarks,
        is_overdue=is_overdue,
        created_at=ob.created_at,
    )


@router.get("", response_model=PaginatedObligationResponse, summary="List institutional compliance obligations")
def list_obligations(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(15, ge=1, le=100, description="Items per page"),
    status_filter: Optional[ComplianceStatus] = Query(None, alias="status"),
    obligation_type: Optional[ObligationType] = None,
    institution_id: Optional[UUID] = None,
    application_id: Optional[UUID] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = get_authorized_obligation_query(current_user, db)

    if status_filter:
        query = query.filter(ComplianceObligation.status == status_filter)
    if obligation_type:
        query = query.filter(ComplianceObligation.obligation_type == obligation_type)
    if institution_id and current_user.role.name in ["SYSTEM_ADMIN", "BUREAU_OFFICER", "REGIONAL_OFFICER"]:
        query = query.filter(ComplianceObligation.institution_id == institution_id)
    if application_id:
        query = query.filter(ComplianceObligation.application_id == application_id)

    total = query.with_entities(func.count(ComplianceObligation.id)).scalar() or 0
    records = (
        query.order_by(ComplianceObligation.due_date.asc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )

    return PaginatedObligationResponse(
        items=[map_obligation_to_response(r) for r in records],
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total > 0 else 1,
    )


@router.post(
    "",
    response_model=ObligationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a compliance undertaking or condition",
    dependencies=[Depends(RequireRole("REGIONAL_OFFICER", "BUREAU_OFFICER", "SYSTEM_ADMIN"))],
)
def create_obligation(
    payload: ObligationCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    inst = db.query(Institution).filter(Institution.id == payload.institution_id).first()
    if not inst:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target institution not found.")

    if current_user.role.name == "REGIONAL_OFFICER" and inst.region_id != current_user.region_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot create obligations for institutions outside your assigned region.",
        )

    if payload.application_id:
        app = db.query(Application).filter(Application.id == payload.application_id).first()
        if not app or app.institution_id != payload.institution_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Application does not belong to the specified institution.",
            )

    obligation = ComplianceObligation(
        institution_id=payload.institution_id,
        application_id=payload.application_id,
        obligation_type=payload.obligation_type,
        description=payload.description,
        applicable_condition=payload.applicable_condition,
        due_date=payload.due_date,
        status=ComplianceStatus.AWAITING_SUBMISSION,
    )
    db.add(obligation)
    db.flush()

    audit = AuditService(db)
    audit.log(
        actor_id=current_user.id,
        action="COMPLIANCE_OBLIGATION_CREATED",
        resource_type="COMPLIANCE_OBLIGATION",
        resource_id=str(obligation.id),
        outcome="SUCCESS",
        metadata={
            "institution_id": str(payload.institution_id),
            "obligation_type": payload.obligation_type.value,
            "due_date": payload.due_date.isoformat(),
        },
    )

    db.commit()
    db.refresh(obligation)
    return map_obligation_to_response(obligation)


@router.post(
    "/{obligation_id}/submit-evidence",
    response_model=ObligationResponse,
    summary="Submit documentary evidence for compliance curing",
)
def submit_evidence(
    obligation_id: UUID,
    payload: ObligationSubmitEvidenceRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = get_authorized_obligation_query(current_user, db)
    obligation = query.filter(ComplianceObligation.id == obligation_id).first()
    if not obligation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Obligation not found or unauthorized.")

    if obligation.status in [ComplianceStatus.VERIFIED, ComplianceStatus.CLOSED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot submit evidence against an obligation in status '{obligation.status.value}'.",
        )

    now = datetime.now(timezone.utc)
    obligation.submitted_document_id = payload.document_id
    obligation.submission_notes = payload.submission_notes
    obligation.submitted_at = now
    obligation.submitted_by_id = current_user.id
    obligation.status = ComplianceStatus.SUBMITTED

    audit = AuditService(db)
    audit.log(
        actor_id=current_user.id,
        action="COMPLIANCE_EVIDENCE_SUBMITTED",
        resource_type="COMPLIANCE_OBLIGATION",
        resource_id=str(obligation.id),
        outcome="SUCCESS",
        metadata={"document_id": str(payload.document_id)},
    )

    db.commit()
    db.refresh(obligation)
    return map_obligation_to_response(obligation)


@router.post(
    "/{obligation_id}/verify",
    response_model=ObligationResponse,
    summary="Record regulatory verification outcome on submitted evidence",
    dependencies=[
        Depends(
            RequireRole(
                "COMPLIANCE_VERIFICATION_OFFICER",
                "REGIONAL_OFFICER",
                "BUREAU_OFFICER",
                "SYSTEM_ADMIN",
            )
        )
    ],
)
def verify_obligation(
    obligation_id: UUID,
    payload: ObligationVerificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    obligation = (
        db.query(ComplianceObligation)
        .options(joinedload(ComplianceObligation.institution))
        .filter(ComplianceObligation.id == obligation_id)
        .first()
    )
    if not obligation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Obligation not found.")

    if current_user.role.name == "REGIONAL_OFFICER" and obligation.institution.region_id != current_user.region_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot verify compliance records outside your assigned region.",
        )

    if payload.outcome == "FLAG_DEFICIENCY" and (not payload.deficiency_reason or len(payload.deficiency_reason.strip()) < 10):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Deficiency reason of at least 10 characters must be documented when returning evidence.",
        )

    now = datetime.now(timezone.utc)
    obligation.verified_by_id = current_user.id
    obligation.verification_date = now
    obligation.verification_remarks = payload.remarks

    if payload.outcome == "VERIFY":
        obligation.status = ComplianceStatus.VERIFIED
        obligation.deficiency_reason = None
    elif payload.outcome == "FLAG_DEFICIENCY":
        obligation.status = ComplianceStatus.DEFICIENT
        obligation.deficiency_reason = payload.deficiency_reason
    elif payload.outcome == "CLOSE":
        obligation.status = ComplianceStatus.CLOSED

    audit = AuditService(db)
    audit.log(
        actor_id=current_user.id,
        action=f"COMPLIANCE_{payload.outcome}",
        resource_type="COMPLIANCE_OBLIGATION",
        resource_id=str(obligation.id),
        outcome="SUCCESS",
        metadata={
            "outcome": payload.outcome,
            "deficiency_reason": payload.deficiency_reason if payload.outcome == "FLAG_DEFICIENCY" else None,
        },
    )

    db.commit()
    db.refresh(obligation)
    return map_obligation_to_response(obligation)