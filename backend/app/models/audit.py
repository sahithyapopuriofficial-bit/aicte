# backend/app/models/audit.py
import datetime
import enum
import logging
import re
import uuid
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import (
    Column,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Index,
    String,
    Text,
    Uuid,
    JSON,
)
from sqlalchemy.orm import Session, relationship

from app.core.database import Base

logger = logging.getLogger("complianceflow.audit")


# -----------------------------------------------------------------------------
# Enums
# -----------------------------------------------------------------------------
class AuditActionType(str, enum.Enum):
    LOGIN = "LOGIN"
    LOGOUT = "LOGOUT"
    LOGIN_FAILED = "LOGIN_FAILED"
    APPLICATION_CREATED = "APPLICATION_CREATED"
    STAGE_TRANSITION = "STAGE_TRANSITION"
    OFFICER_ASSIGNED = "OFFICER_ASSIGNED"
    EVC_SCHEDULED = "EVC_SCHEDULED"
    EVC_REPORT_SUBMITTED = "EVC_REPORT_SUBMITTED"
    EVALUATION_RECORDED = "EVALUATION_RECORDED"
    COMPLIANCE_EVIDENCE_SUBMITTED = "COMPLIANCE_EVIDENCE_SUBMITTED"
    COMPLIANCE_VERIFIED = "COMPLIANCE_VERIFIED"
    COMPLIANCE_DEFICIENCY_FLAGGED = "COMPLIANCE_DEFICIENCY_FLAGGED"
    DOCUMENT_UPLOADED = "DOCUMENT_UPLOADED"
    DOCUMENT_DELETED = "DOCUMENT_DELETED"
    SLA_BREACH_DETECTED = "SLA_BREACH_DETECTED"
    ESCALATION_TRIGGERED = "ESCALATION_TRIGGERED"
    SYSTEM_CONFIG_UPDATED = "SYSTEM_CONFIG_UPDATED"


class AuditSeverity(str, enum.Enum):
    INFO = "INFO"
    NOTICE = "NOTICE"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"


# -----------------------------------------------------------------------------
# SQLAlchemy 2.0 AuditEvent Model
# -----------------------------------------------------------------------------
class AuditEvent(Base):
    __tablename__ = "audit_events"
    __table_args__ = (
        Index("ix_audit_events_created_actor", "created_at", "actor_id"),
        Index("ix_audit_events_entity", "entity_name", "entity_id"),
        {"extend_existing": True},
    )

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    correlation_id = Column(String(64), nullable=True, index=True)
    actor_id = Column(Uuid, nullable=True, index=True)
    actor_email = Column(String(255), nullable=True)
    actor_role = Column(String(64), nullable=True)
    action_type = Column(SQLEnum(AuditActionType), nullable=False, index=True)
    severity = Column(SQLEnum(AuditSeverity), default=AuditSeverity.INFO, nullable=False)
    entity_name = Column(String(64), nullable=False, index=True)
    entity_id = Column(String(64), nullable=True, index=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(255), nullable=True)
    description = Column(Text, nullable=False)
    extra_metadata = Column(JSON, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False,
        index=True,
    )


# -----------------------------------------------------------------------------
# Pydantic Schemas
# -----------------------------------------------------------------------------
class AuditEventBase(BaseModel):
    action_type: AuditActionType
    severity: AuditSeverity = AuditSeverity.INFO
    entity_name: str
    entity_id: Optional[str] = None
    description: str
    extra_metadata: Optional[Dict[str, Any]] = None


class AuditEventCreate(AuditEventBase):
    correlation_id: Optional[str] = None
    actor_id: Optional[uuid.UUID] = None
    actor_email: Optional[str] = None
    actor_role: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None


class AuditEventResponse(AuditEventBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    correlation_id: Optional[str] = None
    actor_id: Optional[uuid.UUID] = None
    actor_email: Optional[str] = None
    actor_role: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime.datetime


class PaginatedAuditEvents(BaseModel):
    items: List[AuditEventResponse]
    total: int
    page: int
    size: int
    pages: int


# -----------------------------------------------------------------------------
# Audit Service & PII Redaction
# -----------------------------------------------------------------------------
class AuditService:
    SENSITIVE_KEYS = {
        "password",
        "secret",
        "token",
        "auth",
        "authorization",
        "hash",
        "pan",
        "aadhaar",
        "bank_account",
        "fdr_number",
    }
    EMAIL_REGEX = re.compile(r"[\w\.-]+@[\w\.-]+\.\w+")

    @classmethod
    def sanitize_metadata(cls, data: Any) -> Any:
        """Recursively redact sensitive tokens, passwords, and PII keys."""
        if isinstance(data, dict):
            cleaned = {}
            for k, v in data.items():
                if any(secret in k.lower() for secret in cls.SENSITIVE_KEYS):
                    cleaned[k] = "[REDACTED]"
                else:
                    cleaned[k] = cls.sanitize_metadata(v)
            return cleaned
        elif isinstance(data, list):
            return [cls.sanitize_metadata(item) for item in data]
        elif isinstance(data, str) and len(data) > 255:
            return data[:255] + "... [TRUNCATED]"
        return data

    @classmethod
    def log_event(
        cls,
        db: Session,
        action_type: AuditActionType,
        entity_name: str,
        description: str,
        actor_id: Optional[uuid.UUID] = None,
        actor_email: Optional[str] = None,
        actor_role: Optional[str] = None,
        entity_id: Optional[str] = None,
        correlation_id: Optional[str] = None,
        severity: AuditSeverity = AuditSeverity.INFO,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        extra_metadata: Optional[Dict[str, Any]] = None,
    ) -> AuditEvent:
        """Appends an immutable, sanitized audit entry."""
        sanitized_meta = cls.sanitize_metadata(extra_metadata) if extra_metadata else None

        event = AuditEvent(
            correlation_id=correlation_id,
            actor_id=actor_id,
            actor_email=actor_email,
            actor_role=actor_role,
            action_type=action_type,
            severity=severity,
            entity_name=entity_name,
            entity_id=str(entity_id) if entity_id else None,
            ip_address=ip_address,
            user_agent=user_agent,
            description=description,
            extra_metadata=sanitized_meta,
        )
        db.add(event)
        try:
            db.flush()
        except Exception as e:
            logger.error("Failed to write to audit log: %s", e)
            db.rollback()
            raise
        return event