# backend/app/api/v1/evc.py
from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, and_
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.dependencies import get_current_user, RequireRole
from app.models.application import Application, ApplicationStatus
from app.models.evc import EVCSchedule, EVCSchedulingStatus, evc_committee_members
from app.models.user import User
from app.schemas.evc import (
    EVCScheduleCreateRequest,
    EVCScheduleResponse,
    EVCScheduleUpdateRequest,
    EVCRecordOutcomeRequest,
    CommitteeMemberSummary,
)
from app.services.audit_service import AuditService

router = APIRouter(prefix="/evc", tags=["Expert Visiting Committee (EVC) Operations"])


def verify_committee_conflicts(
    db: Session, member_ids: List[UUID], target_date: datetime, exclude_schedule_id: Optional[UUID] = None
):
    """
    Ensure no assigned committee member is double-booked for another inspection on the target calendar date.
    """
    inspection_day = target_date.date()

    query = (
        db.query(User.full_name, EVCSchedule.proposed_date)
        .join(evc_committee_members, User.id == evc_committee_members.c.user_id)
        .join(EVCSchedule, EVCSchedule.id == evc_committee_members.c.evc_schedule_id)
        .filter(
            User.id.in_(member_ids),
            EVCSchedule.status.in_([EVCSchedulingStatus.SCHEDULED, EVCSchedulingStatus.IN_PROGRESS]),
        )
    )

    if exclude_schedule_id:
        query = query.filter(EVCSchedule.id != exclude_schedule_id)

    conflicting_assignments = query.all()

    for expert_name, existing_date in conflicting_assignments:
        if existing_date.date() == inspection_day:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Scheduling conflict: Committee member {expert_name} is already assigned to a visit on {inspection_day}.",
            )


@router.get("", response_model=List[EVCScheduleResponse], summary="List EVC schedules matching role scope")
def list_schedules(
    status_filter: Optional[EVCSchedulingStatus] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(EVCSchedule).options(
        joinedload(EVCSchedule.application).joinedload(Application.institution),
        joinedload(EVCSchedule.committee_members),
    )

    # Scope permissions
    if current_user.role.name == "INSTITUTIONAL_ADMIN":
        query = query.join(Application).filter(Application.institution_id == current_user.institution_id)
    elif current_user.role.name == "REGIONAL_OFFICER":
        query = query.join(Application).filter(Application.assigned_region_id == current_user.region_id)
    elif current_user.role.name == "COMMITTEE_MEMBER":
        query = query.filter(EVCSchedule.committee_members.any(User.id == current_user.id))

    if status_filter:
        query = query.filter(EVCSchedule.status == status_filter)

    records = query.order_by(EVCSchedule.proposed_date.asc()).all()

    response = []
    for rec in records:
        response.append(
            EVCScheduleResponse(
                id=rec.id,
                application_id=rec.application_id,
                application_ref=rec.application.application_ref if rec.application else None,
                institution_name=rec.application.institution.name if (rec.application and rec.application.institution) else None,
                proposed_date=rec.proposed_date,
                confirmed_date=rec.confirmed_date,
                status=rec.status,
                visit_purpose=rec.visit_purpose,
                observations_summary=rec.observations_summary,
                deficiencies_found=rec.deficiencies_found,
                committee_members=[
                    CommitteeMemberSummary(id=m.id, full_name=m.full_name, email=m.email)
                    for m in rec.committee_members
                ],
                scheduled_by_id=rec.scheduled_by_id,
                completed_at=rec.completed_at,
                created_at=rec.created_at,
            )
        )
    return response


@router.post(
    "",
    response_model=EVCScheduleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Schedule an EVC inspection visit",
    dependencies=[Depends(RequireRole("REGIONAL_OFFICER", "BUREAU_OFFICER", "SYSTEM_ADMIN"))],
)
def create_schedule(
    payload: EVCScheduleCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    app = db.query(Application).filter(Application.id == payload.application_id).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")

    if current_user.role.name == "REGIONAL_OFFICER" and app.assigned_region_id != current_user.region_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot schedule EVC for another region.")

    # Prevent duplicate active EVC visits
    active_exists = db.query(EVCSchedule.id).filter(
        EVCSchedule.application_id == payload.application_id,
        EVCSchedule.status.in_([EVCSchedulingStatus.SCHEDULED, EVCSchedulingStatus.IN_PROGRESS]),
    ).first()
    if active_exists:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An active EVC schedule already exists for this application.",
        )

    # Check for member schedule collisions on target date
    verify_committee_conflicts(db, payload.committee_member_ids, payload.proposed_date)

    assigned_users = db.query(User).filter(User.id.in_(payload.committee_member_ids)).all()
    if len(assigned_users) != len(payload.committee_member_ids):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="One or more committee members do not exist.")

    schedule = EVCSchedule(
        application_id=payload.application_id,
        proposed_date=payload.proposed_date,
        confirmed_date=payload.proposed_date,
        status=EVCSchedulingStatus.SCHEDULED,
        visit_purpose=payload.visit_purpose,
        scheduled_by_id=current_user.id,
    )
    schedule.committee_members = assigned_users
    db.add(schedule)

    # Synchronize application status
    app.status = ApplicationStatus.EVC_SCHEDULED

    audit = AuditService(db)
    audit.log(
        actor_id=current_user.id,
        action="EVC_SCHEDULED",
        resource_type="EVC_SCHEDULE",
        resource_id=str(schedule.id),
        outcome="SUCCESS",
        metadata={
            "application_ref": app.application_ref,
            "date": payload.proposed_date.isoformat(),
            "members_count": len(assigned_users),
        },
    )

    db.commit()
    db.refresh(schedule)

    return EVCScheduleResponse(
        id=schedule.id,
        application_id=schedule.application_id,
        application_ref=app.application_ref,
        institution_name=app.institution.name if app.institution else None,
        proposed_date=schedule.proposed_date,
        confirmed_date=schedule.confirmed_date,
        status=schedule.status,
        visit_purpose=schedule.visit_purpose,
        observations_summary=schedule.observations_summary,
        deficiencies_found=schedule.deficiencies_found,
        committee_members=[
            CommitteeMemberSummary(id=m.id, full_name=m.full_name, email=m.email)
            for m in schedule.committee_members
        ],
        scheduled_by_id=schedule.scheduled_by_id,
        completed_at=schedule.completed_at,
        created_at=schedule.created_at,
    )


@router.patch(
    "/{schedule_id}",
    response_model=EVCScheduleResponse,
    summary="Update or reschedule an EVC visit",
    dependencies=[Depends(RequireRole("REGIONAL_OFFICER", "BUREAU_OFFICER", "SYSTEM_ADMIN"))],
)
def update_schedule(
    schedule_id: UUID,
    payload: EVCScheduleUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    schedule = db.query(EVCSchedule).filter(EVCSchedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="EVC schedule record not found.")

    target_date = payload.confirmed_date or schedule.confirmed_date or schedule.proposed_date
    current_member_ids = [m.id for m in schedule.committee_members]
    target_members = payload.committee_member_ids if payload.committee_member_ids is not None else current_member_ids

    # Recheck conflicts if date or roster changes
    if payload.confirmed_date or payload.committee_member_ids is not None:
        verify_committee_conflicts(db, target_members, target_date, exclude_schedule_id=schedule.id)

    if payload.committee_member_ids is not None:
        assigned_users = db.query(User).filter(User.id.in_(target_members)).all()
        schedule.committee_members = assigned_users

    if payload.confirmed_date:
        schedule.confirmed_date = payload.confirmed_date
        schedule.status = EVCSchedulingStatus.RESCHEDULED

    if payload.status:
        schedule.status = payload.status

    audit = AuditService(db)
    audit.log(
        actor_id=current_user.id,
        action="EVC_UPDATED",
        resource_type="EVC_SCHEDULE",
        resource_id=str(schedule.id),
        outcome="SUCCESS",
        metadata={"reason": payload.reschedule_reason, "new_status": schedule.status.value},
    )

    db.commit()
    db.refresh(schedule)

    return EVCScheduleResponse(
        id=schedule.id,
        application_id=schedule.application_id,
        application_ref=schedule.application.application_ref if schedule.application else None,
        institution_name=schedule.application.institution.name if (schedule.application and schedule.application.institution) else None,
        proposed_date=schedule.proposed_date,
        confirmed_date=schedule.confirmed_date,
        status=schedule.status,
        visit_purpose=schedule.visit_purpose,
        observations_summary=schedule.observations_summary,
        deficiencies_found=schedule.deficiencies_found,
        committee_members=[
            CommitteeMemberSummary(id=m.id, full_name=m.full_name, email=m.email)
            for m in schedule.committee_members
        ],
        scheduled_by_id=schedule.scheduled_by_id,
        completed_at=schedule.completed_at,
        created_at=schedule.created_at,
    )


@router.post(
    "/{schedule_id}/complete",
    response_model=EVCScheduleResponse,
    summary="Record EVC inspection completion and submit report observations",
    dependencies=[Depends(RequireRole("COMMITTEE_MEMBER", "REGIONAL_OFFICER", "SYSTEM_ADMIN"))],
)
def record_visit_outcome(
    schedule_id: UUID,
    payload: EVCRecordOutcomeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    schedule = db.query(EVCSchedule).filter(EVCSchedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="EVC schedule record not found.")

    if current_user.role.name == "COMMITTEE_MEMBER":
        is_assigned = any(m.id == current_user.id for m in schedule.committee_members)
        if not is_assigned:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You are not assigned as an expert to this visiting committee.",
            )

    now = datetime.now(timezone.utc)
    schedule.observations_summary = payload.observations_summary
    schedule.deficiencies_found = payload.deficiencies_found
    schedule.report_document_id = payload.report_document_id
    schedule.status = EVCSchedulingStatus.COMPLETED
    schedule.completed_at = now

    # Update attached application status
    if schedule.application:
        schedule.application.status = ApplicationStatus.EVC_COMPLETED

    audit = AuditService(db)
    audit.log(
        actor_id=current_user.id,
        action="EVC_REPORT_SUBMITTED",
        resource_type="EVC_SCHEDULE",
        resource_id=str(schedule.id),
        outcome="SUCCESS",
        metadata={
            "application_ref": schedule.application.application_ref if schedule.application else None,
            "has_deficiencies": bool(payload.deficiencies_found),
        },
    )

    db.commit()
    db.refresh(schedule)

    return EVCScheduleResponse(
        id=schedule.id,
        application_id=schedule.application_id,
        application_ref=schedule.application.application_ref if schedule.application else None,
        institution_name=schedule.application.institution.name if (schedule.application and schedule.application.institution) else None,
        proposed_date=schedule.proposed_date,
        confirmed_date=schedule.confirmed_date,
        status=schedule.status,
        visit_purpose=schedule.visit_purpose,
        observations_summary=schedule.observations_summary,
        deficiencies_found=schedule.deficiencies_found,
        committee_members=[
            CommitteeMemberSummary(id=m.id, full_name=m.full_name, email=m.email)
            for m in schedule.committee_members
        ],
        scheduled_by_id=schedule.scheduled_by_id,
        completed_at=schedule.completed_at,
        created_at=schedule.created_at,
    )