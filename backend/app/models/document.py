# backend/app/models/document.py
import datetime
import enum
import uuid

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    Uuid,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


# -----------------------------------------------------------------------------
# Enums
# -----------------------------------------------------------------------------
class DocumentCategory(str, enum.Enum):
    LEGAL_LAND = "LEGAL_LAND"
    BUILDING_PLAN = "BUILDING_PLAN"
    SAFETY_AFFIDAVITS = "SAFETY_AFFIDAVITS"
    FINANCIAL_RESOURCES = "FINANCIAL_RESOURCES"
    FACULTY_STAFF = "FACULTY_STAFF"
    ACADEMIC_FACILITIES = "ACADEMIC_FACILITIES"
    EVC_REPORT = "EVC_REPORT"
    MISCELLANEOUS = "MISCELLANEOUS"


class DocumentType(str, enum.Enum):
    LAND_DEED = "LAND_DEED"
    BUILDING_PLAN = "BUILDING_PLAN"
    STABILITY_CERTIFICATE = "STABILITY_CERTIFICATE"
    FIRE_NOC = "FIRE_NOC"
    CORPUS_FDR = "CORPUS_FDR"
    EVC_REPORT = "EVC_REPORT"
    AFFIDAVIT = "AFFIDAVIT"
    OTHER = "OTHER"


class DocumentVerificationStatus(str, enum.Enum):
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"
    DEFICIENT = "DEFICIENT"


# -----------------------------------------------------------------------------
# SQLAlchemy 2.0 Document Model
# -----------------------------------------------------------------------------
class Document(Base):
    __tablename__ = "documents"
    __table_args__ = (
        Index("ix_documents_entity", "entity_type", "entity_id"),
        Index("ix_documents_category_status", "category", "verification_status"),
        {"extend_existing": True},
    )

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    mime_type = Column(String(128), nullable=False)
    sha256_checksum = Column(String(64), nullable=False)

    category = Column(
        SQLEnum(DocumentCategory),
        default=DocumentCategory.MISCELLANEOUS,
        nullable=False,
    )
    document_type = Column(
        SQLEnum(DocumentType),
        default=DocumentType.OTHER,
        nullable=False,
    )
    verification_status = Column(
        SQLEnum(DocumentVerificationStatus),
        default=DocumentVerificationStatus.PENDING,
        nullable=False,
    )

    entity_type = Column(String(64), nullable=True)  # e.g., "application", "institution", "evc_schedule"
    entity_id = Column(Uuid, nullable=True)

    expiry_date = Column(DateTime(timezone=True), nullable=True, index=True)
    is_archived = Column(Boolean, default=False, nullable=False)

    uploaded_by_id = Column(Uuid, nullable=True)
    verified_by_id = Column(Uuid, nullable=True)
    verification_remarks = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
        onupdate=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False,
    )