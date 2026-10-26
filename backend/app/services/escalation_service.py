# backend/app/services/escalation_service.py
from datetime import datetime, timezone, timedelta
from typing import Tuple
from uuid import uuid4
from sqlalchemy.orm import Session, joinedload

from app.models.application import Application, ApplicationStatus
from app.models.compliance import ComplianceObligation, ComplianceStatus, Escalation, EscalationLevel, Notification
from app.services.audit_service import AuditService


class EscalationEngineService:
    def __init__(self, db: Session):
        self.db = db
        self.audit = AuditService(db)

    def run_deadline_evaluation(self) -> Tuple[int, int, int]:
        """
        Scan active applications and undertakings for SLA breaches.
        Returns: (checked_count, new_escalations_count, notifications_count)
        """
        now = datetime.now(timezone.utc)
        checked_count = 0
        new_escalations = 0
        notifications_sent = 0

        # ---------------------------------------------------------
        # 1. Evaluate Application Workflow SLA Breaches
        # ---------------------------------------------------------
        active_apps = (
            self.db.query(Application)
            .filter(
                Application.stage_deadline != None,
                Application.status.notin_([
                    ApplicationStatus.APPROVED,
                    ApplicationStatus.REJECTED,
                    ApplicationStatus.DRAFT,
                ]),
            )
            .all()
        )

        for app in active_apps:
            checked_count += 1
            if now > app.stage_deadline:
                overdue_duration = now - app.stage_deadline

                # Determine escalation hierarchy level based on overdue margin
                if overdue_duration > timedelta(days=14):
                    target_level = EscalationLevel.LEVEL_3
                    target_role = "MEMBER_SECRETARY"
                elif overdue_duration > timedelta(days=7):
                    target_level = EscalationLevel.LEVEL_2
                    target_role = "BUREAU_OFFICER"
                else:
                    target_level = EscalationLevel.LEVEL_1
                    target_role = "REGIONAL_OFFICER"

                # Idempotency Guard: Ensure no open escalation already exists for this level
                existing_escalation = (
                    self.db.query(Escalation)
                    .filter(
                        Escalation.application_id == app.id,
                        Escalation.level == target_level,
                        Escalation.is_resolved == False,
                    )
                    .first()
                )

                if not existing_escalation:
                    escalation = Escalation(
                        id=uuid4(),
                        application_id=app.id,
                        level=target_level,
                        triggering_rule=f"STAGE_SLA_BREACH_{app.current_stage}",
                        responsible_role=target_role,
                        trigger_timestamp=now,
                        is_resolved=False,
                    )
                    self.db.add(escalation)
                    new_escalations += 1

                    # Create corresponding notification
                    notification = Notification(
                        id=uuid4(),
                        recipient_role=target_role,
                        application_id=app.id,
                        notification_type=f"ESCALATION_{target_level.value}",
                        message=(
                            f"URGENT: Application {app.application_ref} has exceeded the {app.current_stage} "
                            f"stage deadline by {overdue_duration.days} days. Level: {target_level.value}."
                        ),
                        scheduled_at=now,
                        sent_at=now,
                        delivery_status="DELIVERED",
                    )
                    self.db.add(notification)
                    notifications_sent += 1

                    self.audit.log(
                        action="ESCALATION_TRIGGERED",
                        resource_type="APPLICATION",
                        resource_id=str(app.id),
                        outcome="SUCCESS",
                        metadata={
                            "escalation_id": str(escalation.id),
                            "level": target_level.value,
                            "responsible_role": target_role,
                            "days_overdue": overdue_duration.days,
                        },
                        commit=False,
                    )

        # ---------------------------------------------------------
        # 2. Evaluate Compliance Undertaking Due Dates
        # ---------------------------------------------------------
        overdue_obligations = (
            self.db.query(ComplianceObligation)
            .filter(
                ComplianceObligation.status.in_([
                    ComplianceStatus.AWAITING_SUBMISSION,
                    ComplianceStatus.DEFICIENT,
                ]),
                ComplianceObligation.due_date < now,
            )
            .all()
        )

        for ob in overdue_obligations:
            checked_count += 1
            ob.status = ComplianceStatus.OVERDUE

            existing_ob_esc = (
                self.db.query(Escalation)
                .filter(
                    Escalation.obligation_id == ob.id,
                    Escalation.level == EscalationLevel.LEVEL_1,
                    Escalation.is_resolved == False,
                )
                .first()
            )

            if not existing_ob_esc:
                esc = Escalation(
                    id=uuid4(),
                    obligation_id=ob.id,
                    institution_id=ob.institution_id,
                    application_id=ob.application_id,
                    level=EscalationLevel.LEVEL_1,
                    triggering_rule=f"UNDERTAKING_DEADLINE_BREACH_{ob.obligation_type.value}",
                    responsible_role="REGIONAL_OFFICER",
                    trigger_timestamp=now,
                    is_resolved=False,
                )
                self.db.add(esc)
                new_escalations += 1

                notif = Notification(
                    id=uuid4(),
                    recipient_role="REGIONAL_OFFICER",
                    obligation_id=ob.id,
                    notification_type="COMPLIANCE_OVERDUE_ALERT",
                    message=(
                        f"Compliance obligation {ob.obligation_type.value} for institution "
                        f"is now overdue past due date {ob.due_date.strftime('%Y-%m-%d')}."
                    ),
                    scheduled_at=now,
                    sent_at=now,
                    delivery_status="DELIVERED",
                )
                self.db.add(notif)
                notifications_sent += 1

        self.db.commit()
        return checked_count, new_escalations, notifications_sent