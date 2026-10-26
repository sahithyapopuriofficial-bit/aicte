# backend/app/services/deadline_service.py
from datetime import date, datetime, time, timedelta, timezone
from typing import Dict, List, Optional, Tuple
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.application import Application, ApplicationStatus
from app.models.compliance import ComplianceObligation, ComplianceStatus
from app.models.document import Document, DocumentVerificationStatus


class DeadlineCalculationPolicy:
    """
    Encapsulates policies for calendar vs. working day computations,
    clock pause offsets, and statutory cutoff points.
    """

    @staticmethod
    def add_calendar_days(start_dt: datetime, days: int) -> datetime:
        """Adds a fixed duration of calendar days maintaining timezone integrity."""
        return start_dt + timedelta(days=days)

    @staticmethod
    def add_working_days(
        start_dt: datetime,
        working_days: int,
        gazetted_holidays: Optional[List[date]] = None,
    ) -> datetime:
        """
        Adds working days excluding weekends (Saturday, Sunday)
        and designated statutory/gazetted holidays.
        """
        holidays_set = set(gazetted_holidays or [])
        current_date = start_dt.date()
        added_days = 0

        while added_days < working_days:
            current_date += timedelta(days=1)
            # Monday is 0, Sunday is 6. 5 and 6 are weekend days.
            if current_date.weekday() < 5 and current_date not in holidays_set:
                added_days += 1

        # Return target date preserving original time and timezone
        return datetime.combine(
            current_date, start_dt.timetz()
        )


class DeadlineService:
    """
    Central service for computing pendency, evaluating deadline thresholds,
    managing paused clocks, and scanning overdue entities.
    """

    def __init__(self, db: Session, reference_time: Optional[datetime] = None):
        """
        db: Database session.
        reference_time: Optional controllable clock parameter for deterministic unit tests.
        """
        self.db = db
        self._reference_time = reference_time

    @property
    def now(self) -> datetime:
        """Returns the current UTC time or the mock clock set for testing."""
        return self._reference_time or datetime.now(timezone.utc)

    # -------------------------------------------------------------------------
    # Application Workflow Deadlines & SLA Calculations
    # -------------------------------------------------------------------------

    def calculate_stage_deadline(
        self,
        stage_entered_at: datetime,
        sla_days: int = 15,
        policy: str = "CALENDAR_DAYS",
        holidays: Optional[List[date]] = None,
    ) -> datetime:
        """
        Calculates the definitive due timestamp for a workflow stage.
        """
        if policy == "WORKING_DAYS":
            return DeadlineCalculationPolicy.add_working_days(
                stage_entered_at, sla_days, holidays
            )
        return DeadlineCalculationPolicy.add_calendar_days(
            stage_entered_at, sla_days
        )

    def compute_pendency(
        self,
        stage_entered_at: datetime,
        stage_deadline: Optional[datetime],
        clock_paused_duration: timedelta = timedelta(0),
    ) -> Dict[str, any]:
        """
        Calculates granular pendency metrics for an application:
        - Active time spent at the stage (excluding authorized pause durations).
        - Whether the case has breached SLA.
        - Days/hours remaining or overdue.
        """
        active_elapsed = (self.now - stage_entered_at) - clock_paused_duration
        active_elapsed = max(timedelta(0), active_elapsed)

        is_overdue = False
        remaining_time = timedelta(0)
        overdue_duration = timedelta(0)

        if stage_deadline:
            effective_deadline = stage_deadline + clock_paused_duration
            if self.now > effective_deadline:
                is_overdue = True
                overdue_duration = self.now - effective_deadline
            else:
                remaining_time = effective_deadline - self.now

        return {
            "days_at_stage": active_elapsed.days,
            "hours_at_stage": int(active_elapsed.total_seconds() // 3600),
            "is_overdue": is_overdue,
            "days_overdue": overdue_duration.days if is_overdue else 0,
            "days_remaining": remaining_time.days if not is_overdue else 0,
            "hours_remaining": int(remaining_time.total_seconds() // 3600)
            if not is_overdue
            else 0,
        }

    def is_approaching_deadline(
        self,
        deadline: Optional[datetime],
        threshold_hours: int = 48,
    ) -> bool:
        """
        Identifies whether a milestone falls within the critical advance warning window.
        """
        if not deadline or self.now >= deadline:
            return False
        delta = deadline - self.now
        return delta <= timedelta(hours=threshold_hours)

    # -------------------------------------------------------------------------
    # Batch Processing & Scan Operations
    # -------------------------------------------------------------------------

    def get_overdue_applications(self) -> List[Application]:
        """
        Returns all active applications where the current time has surpassed the stage deadline.
        Excludes drafts, terminal approvals, and rejections.
        """
        return (
            self.db.query(Application)
            .filter(
                Application.stage_deadline.is_not(None),
                Application.stage_deadline < self.now,
                Application.status.notin_([
                    ApplicationStatus.APPROVED,
                    ApplicationStatus.REJECTED,
                    ApplicationStatus.DRAFT,
                ]),
            )
            .all()
        )

    def get_applications_approaching_deadline(
        self, threshold_hours: int = 48
    ) -> List[Application]:
        """
        Queries applications whose deadline expires within the configured warning window.
        """
        window_end = self.now + timedelta(hours=threshold_hours)
        return (
            self.db.query(Application)
            .filter(
                Application.stage_deadline.is_not(None),
                Application.stage_deadline >= self.now,
                Application.stage_deadline <= window_end,
                Application.status.notin_([
                    ApplicationStatus.APPROVED,
                    ApplicationStatus.REJECTED,
                    ApplicationStatus.DRAFT,
                ]),
            )
            .all()
        )

    def get_overdue_obligations(self) -> List[ComplianceObligation]:
        """
        Returns compliance undertakings where the due date has lapsed
        without verified curing evidence.
        """
        return (
            self.db.query(ComplianceObligation)
            .filter(
                ComplianceObligation.status.in_([
                    ComplianceStatus.AWAITING_SUBMISSION,
                    ComplianceStatus.DEFICIENT,
                ]),
                ComplianceObligation.due_date < self.now,
            )
            .all()
        )

    def get_expiring_documents(self, advance_days: int = 30) -> List[Document]:
        """
        Identifies institutional land leases, stability certificates,
        and NOCs reaching expiry within the specified alert threshold.
        """
        threshold_dt = self.now + timedelta(days=advance_days)
        return (
            self.db.query(Document)
            .filter(
                Document.expiry_date.is_not(None),
                Document.expiry_date >= self.now,
                Document.expiry_date <= threshold_dt,
                Document.verification_status != DocumentVerificationStatus.EXPIRED,
            )
            .all()
        )

    # -------------------------------------------------------------------------
    # State Synchronization Helpers
    # -------------------------------------------------------------------------

    def sync_overdue_statuses(self) -> Tuple[int, int]:
        """
        Scans and updates persistent statuses for obligations and expired documents.
        Returns: (obligations_updated_count, documents_updated_count)
        """
        # 1. Update lapsed obligations to OVERDUE
        overdue_obs = self.get_overdue_obligations()
        for ob in overdue_obs:
            ob.status = ComplianceStatus.OVERDUE

        # 2. Update expired documents to EXPIRED
        expired_docs = (
            self.db.query(Document)
            .filter(
                Document.expiry_date.is_not(None),
                Document.expiry_date < self.now,
                Document.verification_status != DocumentVerificationStatus.EXPIRED,
            )
            .all()
        )
        for doc in expired_docs:
            doc.verification_status = DocumentVerificationStatus.EXPIRED

        total_obs = len(overdue_obs)
        total_docs = len(expired_docs)

        if total_obs > 0 or total_docs > 0:
            self.db.commit()

        return total_obs, total_docs