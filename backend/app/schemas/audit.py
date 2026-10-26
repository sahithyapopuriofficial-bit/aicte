# backend/app/schemas/audit.py
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel


class AuditActorSummary(BaseModel):
    id: UUID
    full_name: str
    email: str
    role_name: str

    class Config:
        from_attributes = True


class AuditEventResponse(BaseModel):
    id: UUID
    actor_id: Optional[UUID] = None
    actor_name: Optional[str] = "SYSTEM"
    actor_email: Optional[str] = None
    actor_role: Optional[str] = None
    action: str
    resource_type: str
    resource_id: str
    outcome: str
    correlation_id: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None
    timestamp: datetime

    class Config:
        from_attributes = True


class PaginatedAuditResponse(BaseModel):
    items: List[AuditEventResponse]
    total: int
    page: int
    size: int
    pages: int