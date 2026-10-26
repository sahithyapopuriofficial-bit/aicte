# backend/app/schemas/document.py
from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, Field

from app.models.document import DocumentCategory, DocumentVerificationStatus


class DocumentVerifyRequest(BaseModel):
    outcome: str = Field(..., pattern="^(VERIFY|FLAG_DEFICIENCY)$")
    deficiency_reason: Optional[str] = Field(None, min_length=10)


class DocumentResponse(BaseModel):
    id: UUID
    institution_id: UUID
    application_id: Optional[UUID] = None
    category: DocumentCategory
    original_filename: str
    mime_type: str
    file_size_bytes: int
    sha256_checksum: str
    issue_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    verification_status: DocumentVerificationStatus
    deficiency_reason: Optional[str] = None
    verified_by_id: Optional[UUID] = None
    verified_at: Optional[datetime] = None
    previous_version_id: Optional[UUID] = None
    is_expired: bool
    days_until_expiry: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PaginatedDocumentResponse(BaseModel):
    items: List[DocumentResponse]
    total: int
    page: int
    size: int
    pages: int