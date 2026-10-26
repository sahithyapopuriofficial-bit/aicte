# backend/app/models/compliance.py
import datetime
import enum
import uuid
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field
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
    JSON,
    desc,
    func,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


# -----------------------------------------------------------------------------
# Enums
# -----------------------------------------------------------------------------
class ComplianceStatus(str, enum.Enum):
    NOT_YET_DUE = "NOT_YET_DUE"
    DUE_SOON = "DUE_SOON"
    AWAITING_SUBMISSION = "AWAITING_SUBMISSION"
    SUBMITTED = "SUBMITTED"
    UNDER_VERIFICATION = "UNDER_VERIFICATION"
    DEFICIENT = "DEFICIENT"
    VERIFIED = "VERIFIED"
    OVERDUE = "OVERDUE"
    CLOSED = "CLOSED"


class ObligationType(str, enum.Enum):
    LAND_LEASE_CONTINUITY = "LAND_LEASE_CONTINUITY"
    FACULTY_CADRE_RATIO = "FACULTY_CADRE_RATIO"
    CORPUS_FUND_DEPOSIT = "CORPUS_FUND_DEPOSIT"
    FIRE_SAFETY_CERTIFICATE = "FIRE_SAFETY_CERTIFICATE"
    BUILDING_STABILITY_CERTIFICATE = "BUILDING_STABILITY_CERTIFICATE"
    BARRIER_FREE_ENVIRONMENT = "BARRIER_FREE_ENVIRONMENT"
    ANTI_RAGGING_AFFIDAVIT = "ANTI_RAGGING_AFFIDAVIT"


class EscalationLevel(str, enum.Enum):
    LEVEL_1_RO = "LEVEL_1_RO"
    LEVEL_2_BUREAU = "LEVEL_2_BUREAU"
    LEVEL_3_CHAIRMAN = "LEVEL_3_CHAIRMAN"


class EscalationStatus(str, enum.Enum):
    OPEN = "OPEN"
    IN_REVIEW = "IN_REVIEW"
    RESOLVED = "RESOLVED"
    DISMISSED = "DISMISSED"


class NotificationChannel(str, enum.Enum):
    EMAIL = "EMAIL"
    SMS = "SMS"
    PORTAL = "PORTAL"
    SYSTEM = "SYSTEM"


class NotificationStatus(str, enum.Enum):
    PENDING = "PENDING"
    SENT = "SENT"
    FAILED = "FAILED"
    READ = "READ"


# -----------------------------------------------------------------------------
# SQLAlchemy 2.0 ComplianceObligation Model
# -----------------------------------------------------------------------------
class ComplianceObligation(Base):
    __tablename__ = "compliance_obligations"
    __table_args__ = (
        Index("ix_compliance_inst_status", "institution_id", "status"),
        Index("ix_compliance_due_status", "due_date", "status"),
        {"extend_existing": True},
    )

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    institution_id = Column(Uuid, nullable=False, index=True)
    institution_name = Column(String(255), nullable=True)
    application_id = Column(Uuid, nullable=True, index=True)
    application_ref = Column(String(64), nullable=True)

    obligation_type = Column(SQLEnum(ObligationType), nullable=False, index=True)
    description = Column(Text, nullable=False)
    applicable_condition = Column(Text, nullable=True)

    issue_date = Column(DateTime(timezone=True), nullable=False)
    due_date = Column(DateTime(timezone=True), nullable=False, index=True)
    status = Column(
        SQLEnum(ComplianceStatus),
        default=ComplianceStatus.AWAITING_SUBMISSION,
        nullable=False,
        index=True,
    )

    # Document Evidence Reference
    submitted_document_id = Column(Uuid, nullable=True)
    submission_notes = Column(Text, nullable=True)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    submitted_by_id = Column(Uuid, nullable=True)

    # Verification Decision Audit
    verified_by_id = Column(Uuid, nullable=True)
    verification_date = Column(DateTime(timezone=True), nullable=True)
    deficiency_reason = Column(Text, nullable=True)
    verification_remarks = Column(Text, nullable=True)

    is_overdue = Column(Boolean, default=False, nullable=False, index=True)

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

    escalations = relationship("Escalation", back_populates="obligation", cascade="all, delete-orphan")


# -----------------------------------------------------------------------------
# SQLAlchemy 2.0 Escalation Model
# -----------------------------------------------------------------------------
class Escalation(Base):
    __tablename__ = "escalations"
    __table_args__ = (
        Index("ix_escalations_entity", "entity_type", "entity_id"),
        Index("ix_escalations_level_status", "level", "status"),
        {"extend_existing": True},
    )

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    entity_type = Column(String(64), nullable=False)  # e.g., "application", "compliance_obligation"
    entity_id = Column(Uuid, nullable=False, index=True)

    obligation_id = Column(Uuid, ForeignKey("compliance_obligations.id"), nullable=True, index=True)
    application_id = Column(Uuid, nullable=True, index=True)
    institution_id = Column(Uuid, nullable=True, index=True)

    level = Column(SQLEnum(EscalationLevel), default=EscalationLevel.LEVEL_1_RO, nullable=False, index=True)
    status = Column(SQLEnum(EscalationStatus), default=EscalationStatus.OPEN, nullable=False, index=True)

    reason = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    trigger_sla_hours = Column(Integer, default=72, nullable=False)

    assigned_to_id = Column(Uuid, nullable=True)
    resolution_notes = Column(Text, nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

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

    obligation = relationship("ComplianceObligation", back_populates="escalations")


# -----------------------------------------------------------------------------
# SQLAlchemy 2.0 Notification Model
# -----------------------------------------------------------------------------
class Notification(Base):
    __tablename__ = "notifications"
    __table_args__ = (
        Index("ix_notifications_user_status", "recipient_id", "status"),
        {"extend_existing": True},
    )

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    recipient_id = Column(Uuid, nullable=True, index=True)
    recipient_email = Column(String(255), nullable=True)
    channel = Column(SQLEnum(NotificationChannel), default=NotificationChannel.EMAIL, nullable=False)
    status = Column(SQLEnum(NotificationStatus), default=NotificationStatus.PENDING, nullable=False)

    subject = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    entity_type = Column(String(64), nullable=True)
    entity_id = Column(Uuid, nullable=True)

    sent_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False,
    )


# -----------------------------------------------------------------------------
# Pydantic Schemas
# -----------------------------------------------------------------------------
class ObligationItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    institution_id: uuid.UUID
    institution_name: Optional[str] = None
    application_id: Optional[uuid.UUID] = None
    application_ref: Optional[str] = None
    obligation_type: ObligationType
    description: str
    applicable_condition: Optional[str] = None
    issue_date: datetime.datetime
    due_date: datetime.datetime
    status: ComplianceStatus
    submitted_document_id: Optional[uuid.UUID] = None
    submission_notes: Optional[str] = None
    submitted_at: Optional[datetime.datetime] = None
    submitted_by_id: Optional[uuid.UUID] = None
    verified_by_id: Optional[uuid.UUID] = None
    verification_date: Optional[datetime.datetime] = None
    deficiency_reason: Optional[str] = None
    verification_remarks: Optional[str] = None
    is_overdue: bool
    created_at: datetime.datetime


class PaginatedObligations(BaseModel):
    items: List[ObligationItemResponse]
    total: int
    page: int
    size: int
    pages: int


class SubmitEvidencePayload(BaseModel):
    document_id: uuid.UUID
    submission_notes: Optional[str] = Field(None, max_length=1000)


class VerifyObligationPayload(BaseModel):
    outcome: str = Field(..., pattern="^(VERIFY|FLAG_DEFICIENCY|CLOSE)$")
    remarks: Optional[str] = Field(None, max_length=1000)
    deficiency_reason: Optional[str] = Field(None, min_length=10, max_length=2000)


class EscalationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    entity_type: str
    entity_id: uuid.UUID
    obligation_id: Optional[uuid.UUID] = None
    application_id: Optional[uuid.UUID] = None
    institution_id: Optional[uuid.UUID] = None
    level: EscalationLevel
    status: EscalationStatus
    reason: str
    description: Optional[str] = None
    trigger_sla_hours: int
    assigned_to_id: Optional[uuid.UUID] = None
    resolution_notes: Optional[str] = None
    resolved_at: Optional[datetime.datetime] = None
    created_at: datetime.datetime


class PaginatedEscalations(BaseModel):
    items: List[EscalationResponse]
    total: int
    page: int
    size: int
    pages: int


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    recipient_id: Optional[uuid.UUID] = None
    recipient_email: Optional[str] = None
    channel: NotificationChannel
    status: NotificationStatus
    subject: str
    message: str
    entity_type: Optional[str] = None
    entity_id: Optional[uuid.UUID] = None
    sent_at: Optional[datetime.datetime] = None
    created_at: datetime.datetime