# backend/app/schemas/application.py
from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, Field

from app.models.application import ApplicationCategory, ApplicationStatus


class ApplicationCreateRequest(BaseModel):
    category: ApplicationCategory
    rule_version_id: UUID
    assigned_region_id: UUID


class ApplicationUpdateRequest(BaseModel):
    assigned_officer_id: Optional[UUID] = None


class WorkflowTransitionRequest(BaseModel):
    action: str = Field(..., description="Action identifier defined in the rule matrix, e.g., APPROVE, FLAG_DEFICIENCY")
    reason: Optional[str] = Field(None, min_length=10, description="Mandatory detailed justification when returning or rejecting")


class StageHistoryResponse(BaseModel):
    id: UUID
    previous_stage: str
    new_stage: str
    actor_id: UUID
    action: str
    reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ApplicationSummaryResponse(BaseModel):
    id: UUID
    application_ref: str
    institution_id: UUID
    institution_name: Optional[str] = None
    category: ApplicationCategory
    current_stage: str
    status: ApplicationStatus
    assigned_region_id: UUID
    assigned_officer_id: Optional[UUID] = None
    stage_entered_at: datetime
    stage_deadline: Optional[datetime] = None
    is_overdue: bool
    days_at_current_stage: int
    created_at: datetime

    class Config:
        from_attributes = True


class ApplicationDetailResponse(ApplicationSummaryResponse):
    stage_history: List[StageHistoryResponse] = []
    applicable_actions: List[str] = []


class PaginatedApplicationResponse(BaseModel):
    items: List[ApplicationSummaryResponse]
    total: int
    page: int
    size: int
    pages: int