# backend/app/models/workflow.py
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
    JSON,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


# -----------------------------------------------------------------------------
# Enums
# -----------------------------------------------------------------------------
class RuleVersionStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    ARCHIVED = "ARCHIVED"


# -----------------------------------------------------------------------------
# Workflow Rule Version (APH Handbook Versioning)
# -----------------------------------------------------------------------------
class WorkflowRuleVersion(Base):
    __tablename__ = "workflow_rule_versions"
    __table_args__ = {"extend_existing": True}

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    academic_year = Column(String(16), nullable=False, index=True)  # e.g., "2026-2027"
    version_tag = Column(String(32), unique=True, nullable=False)   # e.g., "APH-v2026.1"
    description = Column(Text, nullable=True)
    status = Column(
        SQLEnum(RuleVersionStatus),
        default=RuleVersionStatus.DRAFT,
        nullable=False,
        index=True,
    )
    published_at = Column(DateTime(timezone=True), nullable=True)

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
    transition_rules = relationship(
        "TransitionRule",
        back_populates="rule_version",
        cascade="all, delete-orphan",
    )


# -----------------------------------------------------------------------------
# Declarative State Transition Rule Model
# -----------------------------------------------------------------------------
class TransitionRule(Base):
    __tablename__ = "workflow_transition_rules"
    __table_args__ = (
        Index("ix_transition_from_to", "from_stage", "to_stage"),
        {"extend_existing": True},
    )

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    rule_version_id = Column(
        Uuid,
        ForeignKey("workflow_rule_versions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    from_stage = Column(String(64), nullable=False)
    to_stage = Column(String(64), nullable=False)
    action_name = Column(String(128), nullable=False)
    required_role = Column(String(64), nullable=False)  # Role allowed to execute transition
    sla_hours = Column(Integer, default=72, nullable=False)  # Statutory turnaround SLA
    condition_expression = Column(JSON, nullable=True)  # JSON predicates for auto-validation
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False,
    )

    # Relationships
    rule_version = relationship("WorkflowRuleVersion", back_populates="transition_rules")