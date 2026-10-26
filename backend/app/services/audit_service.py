# backend/app/services/audit_service.py
import datetime
import logging
import re
import uuid
from typing import Any, Dict, List, Optional

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models.audit import AuditActionType, AuditEvent, AuditSeverity

logger = logging.getLogger("complianceflow.audit")


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
        sanitized_meta = (
            cls.sanitize_metadata(extra_metadata) if extra_metadata else None
        )

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

    @classmethod
    def get_audit_trail(
        cls,
        db: Session,
        entity_name: Optional[str] = None,
        entity_id: Optional[str] = None,
        actor_id: Optional[uuid.UUID] = None,
        action_type: Optional[AuditActionType] = None,
        severity: Optional[AuditSeverity] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> Dict[str, Any]:
        """Queries paginated audit logs with optional filtering criteria."""
        query = db.query(AuditEvent)

        if entity_name:
            query = query.filter(AuditEvent.entity_name == entity_name)
        if entity_id:
            query = query.filter(AuditEvent.entity_id == str(entity_id))
        if actor_id:
            query = query.filter(AuditEvent.actor_id == actor_id)
        if action_type:
            query = query.filter(AuditEvent.action_type == action_type)
        if severity:
            query = query.filter(AuditEvent.severity == severity)

        total = query.count()
        items = (
            query.order_by(desc(AuditEvent.created_at))
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        pages = (total + page_size - 1) // page_size if total > 0 else 0

        return {
            "items": items,
            "total": total,
            "page": page,
            "size": page_size,
            "pages": pages,
        }