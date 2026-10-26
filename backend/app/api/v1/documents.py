# backend/app/api/v1/documents.py
import math
import os
import re
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import (
    APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
)
from fastapi.responses import FileResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, RequireRole
from app.models.application import Application
from app.models.document import (
    Document, DocumentCategory, DocumentVerificationStatus
)
from app.models.institution import Institution
from app.models.user import User
from app.schemas.document import (
    DocumentResponse, DocumentVerifyRequest, PaginatedDocumentResponse
)
from app.services.audit_service import AuditService
from app.services.storage_service import StorageService

router = APIRouter(prefix="/documents", tags=["Document Validity & Storage Management"])
storage_service = StorageService()


def calculate_validity(expiry_date: Optional[datetime]):
    if not expiry_date:
        return False, None
    now = datetime.now(timezone.utc)
    diff_days = (expiry_date - now).days
    is_expired = now > expiry_date
    return is_expired, diff_days


def map_document_to_response(doc: Document) -> DocumentResponse:
    is_expired, days_until_expiry = calculate_validity(doc.expiry_date)
    return DocumentResponse(
        id=doc.id,
        institution_id=doc.institution_id,
        application_id=doc.application_id,
        category=doc.category,
        original_filename=doc.original_filename,
        mime_type=doc.mime_type,
        file_size_bytes=doc.file_size_bytes,
        sha256_checksum=doc.sha256_checksum,
        issue_date=doc.issue_date,
        expiry_date=doc.expiry_date,
        verification_status=doc.verification_status,
        deficiency_reason=doc.deficiency_reason,
        verified_by_id=doc.verified_by_id,
        verified_at=doc.verified_at,
        previous_version_id=doc.previous_version_id,
        is_expired=is_expired,
        days_until_expiry=days_until_expiry,
        created_at=doc.created_at,
    )


def get_scoped_document_query(user: User, db: Session):
    """
    Enforce tenant isolation:
    - Institutional Admins can only access documents belonging to their institution.
    - Regional Officers can access documents belonging to institutions in their region.
    - Bureau Officers and System Admins have national cross-region access.
    """
    query = db.query(Document)
    if user.role.name == "INSTITUTIONAL_ADMIN":
        if not user.institution_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User has no associated institution context.",
            )
        return query.filter(Document.institution_id == user.institution_id)

    if user.role.name == "REGIONAL_OFFICER":
        if not user.region_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Regional Officer has no assigned region.",
            )
        return query.join(Institution).filter(Institution.region_id == user.region_id)

    return query


@router.post("", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED, summary="Upload and register document metadata")
def upload_document(
    file: UploadFile = File(...),
    institution_id: UUID = Form(...),
    category: DocumentCategory = Form(...),
    application_id: Optional[UUID] = Form(None),
    issue_date: Optional[datetime] = Form(None),
    expiry_date: Optional[datetime] = Form(None),
    previous_version_id: Optional[UUID] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role.name == "INSTITUTIONAL_ADMIN":
        if current_user.institution_id != institution_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot upload documents for other institutions.",
            )

    inst = db.query(Institution).filter(Institution.id == institution_id).first()
    if not inst:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target institution not found.")

    if application_id:
        app = db.query(Application).filter(Application.id == application_id).first()
        if not app or app.institution_id != institution_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Specified application reference does not belong to this institution.",
            )

    if issue_date and expiry_date and expiry_date <= issue_date:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Document expiry date must be strictly after the issue date.",
        )

    # Sanitize original filename (keep only alphanumeric characters, dots, underscores, hyphens)
    safe_filename = re.sub(r"[^a-zA-Z0-9._-]", "_", os.path.basename(file.filename or "upload.bin"))

    # Store file payload through isolated StorageService
    storage_key, checksum, size_bytes = storage_service.save_file(
        file_obj=file.file,
        declared_mime_type=file.content_type or "application/octet-stream",
        original_filename=safe_filename,
    )

    doc = Document(
        institution_id=institution_id,
        application_id=application_id,
        category=category,
        original_filename=safe_filename,
        storage_key=storage_key,
        mime_type=file.content_type or "application/octet-stream",
        file_size_bytes=size_bytes,
        sha256_checksum=checksum,
        issue_date=issue_date,
        expiry_date=expiry_date,
        verification_status=DocumentVerificationStatus.PENDING,
        previous_version_id=previous_version_id,
        submitted_by_id=current_user.id,
    )
    db.add(doc)
    db.flush()

    audit = AuditService(db)
    audit.log(
        actor_id=current_user.id,
        action="DOCUMENT_UPLOADED",
        resource_type="DOCUMENT",
        resource_id=str(doc.id),
        outcome="SUCCESS",
        metadata={
            "filename": safe_filename,
            "category": category.value,
            "size_bytes": size_bytes,
            "sha256": checksum,
        },
    )

    db.commit()
    db.refresh(doc)
    return map_document_to_response(doc)


@router.get("", response_model=PaginatedDocumentResponse, summary="Query and filter documents")
def list_documents(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(15, ge=1, le=100, description="Items per page"),
    category: Optional[DocumentCategory] = None,
    verification_status: Optional[DocumentVerificationStatus] = None,
    institution_id: Optional[UUID] = None,
    application_id: Optional[UUID] = None,
    expiring_within_days: Optional[int] = Query(None, ge=1, le=365, description="Filter for documents expiring within N days"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = get_scoped_document_query(current_user, db)

    if category:
        query = query.filter(Document.category == category)
    if verification_status:
        query = query.filter(Document.verification_status == verification_status)
    if institution_id and current_user.role.name in ["SYSTEM_ADMIN", "BUREAU_OFFICER", "REGIONAL_OFFICER"]:
        query = query.filter(Document.institution_id == institution_id)
    if application_id:
        query = query.filter(Document.application_id == application_id)
    if expiring_within_days:
        threshold = datetime.now(timezone.utc)
        query = query.filter(
            Document.expiry_date != None,
            Document.expiry_date >= threshold,
            func.date_part("day", Document.expiry_date - threshold) <= expiring_within_days,
        )

    total = query.with_entities(func.count(Document.id)).scalar() or 0
    records = (
        query.order_by(Document.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )

    return PaginatedDocumentResponse(
        items=[map_document_to_response(d) for d in records],
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total > 0 else 1,
    )


@router.get("/{document_id}/download", summary="Securely stream document content")
def download_document(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = get_scoped_document_query(current_user, db)
    doc = query.filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or unauthorized.",
        )

    file_path = storage_service.get_file_path(doc.storage_key)

    audit = AuditService(db)
    audit.log(
        actor_id=current_user.id,
        action="DOCUMENT_DOWNLOADED",
        resource_type="DOCUMENT",
        resource_id=str(doc.id),
        outcome="SUCCESS",
        metadata={"filename": doc.original_filename},
    )

    # Force download disposition and set nosniff to prevent mime-sniffing exploits
    return FileResponse(
        path=file_path,
        media_type=doc.mime_type,
        filename=doc.original_filename,
        headers={"X-Content-Type-Options": "nosniff"},
    )


@router.post(
    "/{document_id}/verify",
    response_model=DocumentResponse,
    summary="Record regulatory verification or deficiency on document",
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
def verify_document(
    document_id: UUID,
    payload: DocumentVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = get_scoped_document_query(current_user, db)
    doc = query.filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or outside administrative region.",
        )

    if payload.outcome == "FLAG_DEFICIENCY" and not payload.deficiency_reason:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Deficiency reason must be recorded when returning a document.",
        )

    now = datetime.now(timezone.utc)
    doc.verified_by_id = current_user.id
    doc.verified_at = now

    if payload.outcome == "VERIFY":
        doc.verification_status = DocumentVerificationStatus.VERIFIED
        doc.deficiency_reason = None
    elif payload.outcome == "FLAG_DEFICIENCY":
        doc.verification_status = DocumentVerificationStatus.DEFICIENT
        doc.deficiency_reason = payload.deficiency_reason

    audit = AuditService(db)
    audit.log(
        actor_id=current_user.id,
        action=f"DOCUMENT_{payload.outcome}",
        resource_type="DOCUMENT",
        resource_id=str(doc.id),
        outcome="SUCCESS",
        metadata={
            "outcome": payload.outcome,
            "deficiency_reason": payload.deficiency_reason if payload.outcome == "FLAG_DEFICIENCY" else None,
        },
    )

    db.commit()
    db.refresh(doc)
    return map_document_to_response(doc)