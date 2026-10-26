# backend/app/repositories/audit_repository.py
from datetime import datetime
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.audit import AuditEvent
from app.models.user import User


class AuditRepository:
    """
    Data-access repository for regulatory audit trails.
    Strictly provides creation and retrieval interfaces; update and delete operations
    are intentionally omitted to preserve data immutability.
    """

    def __init__(self, db: Session):
        self.db = db

    def create(self, event: AuditEvent) -> AuditEvent:
        """Persists a new immutable audit record."""
        self.db.add(event)
        self.db.flush()
        return event

    def get_by_id(self, event_id: UUID) -> Optional[AuditEvent]:
        """Fetches a specific audit event by ID including joined actor profile."""
        return (
            self.db.query(AuditEvent)
            .options(joinedload(AuditEvent.actor).joinedload(User.role))
            .filter(AuditEvent.id == event_id)
            .first()
        )

    def search_events(
        self,
        action: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        actor_id: Optional[UUID] = None,
        outcome: Optional[str] = None,
        correlation_id: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        allowed_resource_types: Optional[List[str]] = None,
        offset: int = 0,
        limit: int = 25,
    ) -> Tuple[List[AuditEvent], int]:
        """
        Executes a paginated, filtered audit search with strict index usage.
        Returns a tuple of (records_list, total_matching_count).
        """
        query = self.db.query(AuditEvent).options(
            joinedload(AuditEvent.actor).joinedload(User.role)
        )

        # Enforce jurisdictional scoping constraints
        if allowed_resource_types is not None:
            query = query.filter(AuditEvent.resource_type.in_(allowed_resource_types))

        # Filter criteria
        if action:
            query = query.filter(AuditEvent.action == action.upper())
        if resource_type:
            query = query.filter(AuditEvent.resource_type == resource_type.upper())
        if resource_id:
            query = query.filter(AuditEvent.resource_id == str(resource_id))
        if actor_id:
            query = query.filter(AuditEvent.actor_id == actor_id)
        if outcome:
            query = query.filter(AuditEvent.outcome == outcome.upper())
        if correlation_id:
            query = query.filter(AuditEvent.correlation_id == correlation_id)
        if start_date:
            query = query.filter(AuditEvent.timestamp >= start_date)
        if end_date:
            query = query.filter(AuditEvent.timestamp <= end_date)

        # Efficient total record count calculation
        total = query.with_entities(func.count(AuditEvent.id)).scalar() or 0

        # Ordered by chronological order descending
        records = (
            query.order_by(AuditEvent.timestamp.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

        return records, total