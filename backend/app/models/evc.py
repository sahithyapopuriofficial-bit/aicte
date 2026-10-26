# backend/app/models/evc.py
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
    String,
    Table,
    Text,
    Uuid,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


# -----------------------------------------------------------------------------
# Enums
# -----------------------------------------------------------------------------
class EVCSchedulingStatus(str, enum.Enum):
    PENDING_CONSTITUTION = "PENDING_CONSTITUTION"
    SCHEDULED = "SCHEDULED"
    IN_PROGRESS = "IN_PROGRESS"
    REPORT_SUBMITTED = "REPORT_SUBMITTED"
    SCRUTINIZED = "SCRUTINIZED"
    CANCELLED = "CANCELLED"


# Backward compatibility alias
EVCStatus = EVCSchedulingStatus


class MemberRole(str, enum.Enum):
    CHAIRMAN = "CHAIRMAN"
    MEMBER_SECRETARY = "MEMBER_SECRETARY"
    EXPERT_ACADEMICIAN = "EXPERT_ACADEMICIAN"
    ARCHITECT_CIVIL_EXPERT = "ARCHITECT_CIVIL_EXPERT"
    INSTITUTION_REPRESENTATIVE = "INSTITUTION_REPRESENTATIVE"


# -----------------------------------------------------------------------------
# EVC Committee Member Declarative Model
# -----------------------------------------------------------------------------
class EVCCommitteeMember(Base):
    __tablename__ = "evc_committee_members"
    __table_args__ = (
        Index("ix_evc_member_schedule_user", "schedule_id", "user_id"),
        {"extend_existing": True},
    )

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    schedule_id = Column(Uuid, ForeignKey("evc_schedules.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Uuid, ForeignKey("users.id"), nullable=True)

    member_name = Column(String(255), nullable=False)
    member_designation = Column(String(255), nullable=True)
    organization = Column(String(255), nullable=True)
    role = Column(SQLEnum(MemberRole), default=MemberRole.EXPERT_ACADEMICIAN, nullable=False)
    has_signed = Column(Boolean, default=False, nullable=False)
    attendance_confirmed = Column(Boolean, default=False, nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False,
    )

    # Relationships
    schedule = relationship("EVCSchedule", back_populates="committee_members")


# Expose table object for direct SQL table queries if imported as `evc_committee_members`
evc_committee_members = EVCCommitteeMember.__table__


# -----------------------------------------------------------------------------
# EVC Visit Scheduling Model
# -----------------------------------------------------------------------------
class EVCSchedule(Base):
    __tablename__ = "evc_schedules"
    __table_args__ = (
        Index("ix_evc_app_status", "application_id", "status"),
        {"extend_existing": True},
    )

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    application_id = Column(Uuid, ForeignKey("applications.id"), nullable=False, index=True)
    scheduled_date = Column(DateTime(timezone=True), nullable=False)
    status = Column(SQLEnum(EVCSchedulingStatus), default=EVCSchedulingStatus.PENDING_CONSTITUTION, nullable=False)

    report_document_id = Column(Uuid, ForeignKey("documents.id"), nullable=True)
    deficiency_count = Column(String(32), default="0", nullable=False)
    remarks = Column(Text, nullable=True)

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
    committee_members = relationship(
        "EVCCommitteeMember",
        back_populates="schedule",
        cascade="all, delete-orphan",
    )