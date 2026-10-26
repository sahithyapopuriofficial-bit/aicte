# backend/app/api/v1/audit.py
import math
from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, RequireRole
from app.models.user import User
from app.repositories.audit_repository import AuditRepository
from app.schemas.audit import AuditEventResponse, PaginatedAuditResponse

router = APIRouter(prefix="/audit", tags=["Regulatory Audit Trail"])


@router.get(
    "",
    response_model=PaginatedAuditResponse,
    summary="Query compliance & security audit trail with filtering",
    dependencies=[Depends(RequireRole("SYSTEM_ADMIN", "BUREAU_OFFICER", "REGIONAL_OFFICER"))],
)
def query_audit_trail(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(25, ge=1, le=100, description="Items per page"),
    action: Optional[str] = Query(None, description="Action identifier (e.g. WORKFLOW_TRANSITION, LOGIN_SUCCESS)"),
    resource_type: Optional[str] = Query(None, description="Resource type (e.g. APPLICATION, EVC_SCHEDULE)"),
    resource_id: Optional[str] = Query(None, description="Exact resource identifier"),
    actor_id: Optional[UUID] = Query(None, description="UUID of actor who triggered event"),
    outcome: Optional[str] = Query(None, description="Outcome filter: SUCCESS, FAILURE, DENIED"),
    correlation_id: Optional[str] = Query(None, description="Correlation identifier across multi-step execution"),
    start_date: Optional[datetime] = Query(None, description="Earliest ISO timestamp boundary"),
    end_date: Optional[datetime] = Query(None, description="Latest ISO timestamp boundary"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = AuditRepository(db)

    # Scoped access controls: Regional Officers cannot inspect administrative accounts/roles audits
    allowed_types = None
    if current_user.role.name == "REGIONAL_OFFICER":
        allowed_types = ["APPLICATION", "EVC_SCHEDULE", "COMPLIANCE", "DOCUMENT"]

    offset = (page - 1) * size
    records, total = repo.search_events(
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        actor_id=actor_id,
        outcome=outcome,
        correlation_id=correlation_id,
        start_date=start_date,
        end_date=end_date,
        allowed_resource_types=allowed_types,
        offset=offset,
        limit=size,
    )

    items = []
    for r in records:
        actor_name = r.actor.full_name if r.actor else "SYSTEM / AUTOMATION"
        actor_email = r.actor.email if r.actor else None
        actor_role = r.actor.role.name if (r.actor and r.actor.role) else "SYSTEM"

        items.append(
            AuditEventResponse(
                id=r.id,
                actor_id=r.actor_id,
                actor_name=actor_name,
                actor_email=actor_email,
                actor_role=actor_role,
                action=r.action,
                resource_type=r.resource_type,
                resource_id=r.resource_id,
                outcome=r.outcome,
                correlation_id=r.correlation_id,
                metadata_json=r.metadata_json,
                timestamp=r.timestamp,
            )
        )

    return PaginatedAuditResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total > 0 else 1,
    )


@router.get(
    "/{event_id}",
    response_model=AuditEventResponse,
    summary="Inspect individual audit record details",
    dependencies=[Depends(RequireRole("SYSTEM_ADMIN", "BUREAU_OFFICER", "REGIONAL_OFFICER"))],
)
def get_audit_record(
    event_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = AuditRepository(db)
    event = repo.get_by_id(event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audit record not found.",
        )

    if current_user.role.name == "REGIONAL_OFFICER" and event.resource_type not in [
        "APPLICATION", "EVC_SCHEDULE", "COMPLIANCE", "DOCUMENT"
    ]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You do not have permission to view internal administrative logs.",
        )

    actor_name = event.actor.full_name if event.actor else "SYSTEM / AUTOMATION"
    actor_email = event.actor.email if event.actor else None
    actor_role = event.actor.role.name if (event.actor and event.actor.role) else "SYSTEM"

    return AuditEventResponse(
        id=event.id,
        actor_id=event.actor_id,
        actor_name=actor_name,
        actor_email=actor_email,
        actor_role=actor_role,
        action=event.action,
        resource_type=event.resource_type,
        resource_id=event.resource_id,
        outcome=event.outcome,
        correlation_id=event.correlation_id,
        metadata_json=event.metadata_json,
        timestamp=event.timestamp,
    )