# backend/app/schemas/evc.py
from datetime import datetime, date
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, Field, model_validator

from app.models.evc import EVCSchedulingStatus


class CommitteeMemberSummary(BaseModel):
    id: UUID
    full_name: str
    email: str

    class Config:
        from_attributes = True


class EVCScheduleCreateRequest(BaseModel):
    application_id: UUID
    proposed_date: datetime
    committee_member_ids: List[UUID] = Field(..., min_length=1, description="At least one EVC expert must be assigned")
    visit_purpose: Optional[str] = "Physical Infrastructure & Faculty Scrutiny"

    @model_validator(mode="after")
    def validate_future_date(self):
        if self.proposed_date.date() < date.today():
            raise ValueError("Proposed inspection date cannot be in the past.")
        return self


class EVCScheduleUpdateRequest(BaseModel):
    confirmed_date: Optional[datetime] = None
    committee_member_ids: Optional[List[UUID]] = None
    status: Optional[EVCSchedulingStatus] = None
    reschedule_reason: Optional[str] = None


class EVCRecordOutcomeRequest(BaseModel):
    observations_summary: str = Field(..., min_length=20, description="Comprehensive report notes")
    deficiencies_found: Optional[str] = None
    report_document_id: Optional[UUID] = None


class EVCScheduleResponse(BaseModel):
    id: UUID
    application_id: UUID
    application_ref: Optional[str] = None
    institution_name: Optional[str] = None
    proposed_date: datetime
    confirmed_date: Optional[datetime] = None
    status: EVCSchedulingStatus
    visit_purpose: str
    observations_summary: Optional[str] = None
    deficiencies_found: Optional[str] = None
    committee_members: List[CommitteeMemberSummary] = []
    scheduled_by_id: UUID
    completed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True