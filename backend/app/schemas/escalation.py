# backend/app/schemas/escalation.py
from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, Field

from app.models.compliance import EscalationLevel


class EscalationResolveRequest(BaseModel):
    resolution_notes: str = Field(
        ...,
        min_length=15,
        max_length=2000,
        description="Detailed administrative justification and corrective actions taken",
    )


class EscalationResponse(BaseModel):
    id: UUID
    application_id: Optional[UUID] = None
    application_ref: Optional[str] = None
    institution_id: Optional[UUID] = None
    institution_name: Optional[str] = None
    obligation_id: Optional[UUID] = None
    level: EscalationLevel
    triggering_rule: str
    responsible_role: str
    trigger_timestamp: datetime
    is_resolved: bool
    resolution_notes: Optional[str] = None
    resolved_by_id: Optional[UUID] = None
    resolved_by_name: Optional[str] = None
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PaginatedEscalationResponse(BaseModel):
    items: List[EscalationResponse]
    total: int
    page: int
    size: int
    pages: int


class EscalationRunResult(BaseModel):
    timestamp: datetime
    evaluations_checked: int
    new_escalations_created: int
    notifications_dispatched: int