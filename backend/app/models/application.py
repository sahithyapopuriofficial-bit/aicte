# backend/app/models/application.py
import datetime
import enum
import uuid

from sqlalchemy import (
    Column,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    Uuid,
    Boolean,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


# -----------------------------------------------------------------------------
# Enums
# -----------------------------------------------------------------------------
class ApplicationCategory(str, enum.Enum):
    NEW_INSTITUTE = "NEW_INSTITUTE"
    EXTENSION_OF_APPROVAL = "EXTENSION_OF_APPROVAL"
    INCREASE_IN_INTAKE = "INCREASE_IN_INTAKE"
    NEW_PROGRAM = "NEW_PROGRAM"


class ApplicationStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    UNDER_SCRUTINY = "UNDER_SCRUTINY"
    SCRUTINY_DEFICIENT = "SCRUTINY_DEFICIENT"
    EVC_SCHEDULED = "EVC_SCHEDULED"
    EVC_COMPLETED = "EVC_COMPLETED"
    SAC_SHC_REVIEW = "SAC_SHC_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


# -----------------------------------------------------------------------------
# Models
# -----------------------------------------------------------------------------
class Application(Base):
    __tablename__ = "applications"
    __table_args__ = (
        Index("ix_applications_ref_status", "application_ref", "status"),
        Index("ix_applications_inst_stage", "institution_id", "current_stage"),
        {"extend_existing": True},
    )

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    application_ref = Column(String(64), unique=True, nullable=False, index=True)
    institution_id = Column(Uuid, ForeignKey("institutions.id"), nullable=False, index=True)
    category = Column(SQLEnum(ApplicationCategory), nullable=False)
    status = Column(SQLEnum(ApplicationStatus), default=ApplicationStatus.SUBMITTED, nullable=False, index=True)
    current_stage = Column(String(64), default="SUBMISSION_RECEIVED", nullable=False, index=True)

    assigned_region_id = Column(Uuid, nullable=True, index=True)
    assigned_officer_id = Column(Uuid, nullable=True, index=True)
    rule_version_id = Column(Uuid, nullable=True, index=True)

    stage_entered_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False,
    )
    stage_deadline = Column(DateTime(timezone=True), nullable=True)
    is_overdue = Column(Boolean, default=False, nullable=False)
    days_at_current_stage = Column(Integer, default=0, nullable=False)

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

    # Relationships
    institution = relationship("Institution", back_populates="applications")
    stage_history = relationship(
        "ApplicationStageHistory",
        back_populates="application",
        cascade="all, delete-orphan",
        order_by="ApplicationStageHistory.created_at",
    )


class ApplicationStageHistory(Base):
    __tablename__ = "application_stage_history"
    __table_args__ = (
        Index("ix_stage_hist_app_created", "application_id", "created_at"),
        {"extend_existing": True},
    )

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    application_id = Column(Uuid, ForeignKey("applications.id"), nullable=False, index=True)
    previous_stage = Column(String(64), nullable=False)
    new_stage = Column(String(64), nullable=False)
    actor_id = Column(Uuid, nullable=True)
    action = Column(String(128), nullable=False)
    reason = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False,
    )

    application = relationship("Application", back_populates="stage_history")