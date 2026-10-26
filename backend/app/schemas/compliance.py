# backend/app/schemas/compliance.py
from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, Field

from app.models.compliance import ComplianceStatus, ObligationType


class ObligationCreateRequest(BaseModel):
    institution_id: UUID
    application_id: Optional[UUID] = None
    obligation_type: ObligationType
    description: str = Field(..., min_length=10)
    applicable_condition: Optional[str] = None
    due_date: datetime


class ObligationSubmitEvidenceRequest(BaseModel):
    document_id: UUID
    submission_notes: Optional[str] = Field(None, max_length=1000)


class ObligationVerificationRequest(BaseModel):
    outcome: str = Field(..., pattern="^(VERIFY|FLAG_DEFICIENCY|CLOSE)$")
    remarks: Optional[str] = None
    deficiency_reason: Optional[str] = Field(
        None, min_length=10, description="Mandatory when outcome is FLAG_DEFICIENCY"
    )


class ObligationResponse(BaseModel):
    id: UUID
    institution_id: UUID
    institution_name: Optional[str] = None
    application_id: Optional[UUID] = None
    application_ref: Optional[str] = None
    obligation_type: ObligationType
    description: str
    applicable_condition: Optional[str] = None
    issue_date: datetime
    due_date: datetime
    status: ComplianceStatus
    submitted_document_id: Optional[UUID] = None
    submission_notes: Optional[str] = None
    submitted_at: Optional[datetime] = None
    submitted_by_id: Optional[UUID] = None
    verified_by_id: Optional[UUID] = None
    verification_date: Optional[datetime] = None
    deficiency_reason: Optional[str] = None
    verification_remarks: Optional[str] = None
    is_overdue: bool
    created_at: datetime

    class Config:
        from_attributes = True


class PaginatedObligationResponse(BaseModel):
    items: List[ObligationResponse]
    total: int
    page: int
    size: int
    pages: int