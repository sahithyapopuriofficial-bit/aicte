# backend/app/models/base.py
import datetime
import uuid

from sqlalchemy import Column, DateTime, Uuid
from app.core.database import Base


# -----------------------------------------------------------------------------
# Common Model Mixins
# -----------------------------------------------------------------------------
class UUIDPrimaryKeyMixin:
    """
    Standardizes primary keys to cross-compatible UUIDs.
    Generates v4 UUIDs automatically across both SQLite and PostgreSQL.
    """
    id = Column(Uuid, primary_key=True, default=uuid.uuid4)


class TimestampMixin:
    """
    Provides standard UTC audit timestamps across all regulatory records.
    """
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


# -----------------------------------------------------------------------------
# Declarative Model Registry
# Explicitly imports every model so Base.metadata constructs the complete schema graph
# and resolves all foreign key dependencies without circular/hidden failures.
# -----------------------------------------------------------------------------

# 1. Access Control, Geographic & Jurisdictional Entities
from app.models.user import (  # noqa: F401
    User,
    Role,
    Region,
    Permission,
    RolePermission,
    AccountStatus,
)

# 2. Institutional Registry
from app.models.institution import (  # noqa: F401
    Institution,
    InstitutionStatus,
)

# 3. Document Storage & Evidence Registry (Loaded before foreign key dependencies)
from app.models.document import (  # noqa: F401
    Document,
    DocumentCategory,
    DocumentType,
    DocumentVerificationStatus,
)

# 4. Regulatory Application Lifecycle & Stage History
from app.models.application import (  # noqa: F401
    Application,
    ApplicationStageHistory,
    ApplicationCategory,
    ApplicationStatus,
)

# 5. Declarative State Machine & Rule Versions (APH)
from app.models.workflow import (  # noqa: F401
    WorkflowRuleVersion,
    RuleVersionStatus,
    TransitionRule,
)

# 6. Expert Visiting Committee (EVC) Scheduling & Panels
from app.models.evc import (  # noqa: F401
    EVCSchedule,
    EVCStatus,
    MemberRole,
    EVCCommitteeMember,
)

# 7. Immutable Regulatory Audit Log
from app.models.audit import (  # noqa: F401
    AuditEvent,
    AuditActionType,
    AuditSeverity,
)

# 8. Institutional Compliance, Covenants, Escalations & Notifications
from app.models.compliance import (  # noqa: F401
    ComplianceObligation,
    ComplianceStatus,
    ObligationType,
    Escalation,
    EscalationLevel,
    EscalationStatus,
    Notification,
    NotificationChannel,
    NotificationStatus,
)
