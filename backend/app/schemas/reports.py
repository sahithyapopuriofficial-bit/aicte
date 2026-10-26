# backend/app/schemas/reports.py
from datetime import datetime
from typing import Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, Field

from app.models.application import ApplicationCategory, ApplicationStatus


class PendencyReportRow(BaseModel):
    region_id: UUID
    region_name: str
    total_active_applications: int
    under_scrutiny: int
    evc_pending: int
    sac_shc_review: int
    overdue_count: int
    average_days_at_stage: float


class StageAgeingRow(BaseModel):
    stage_name: str
    application_count: int
    less_than_7_days: int
    between_7_and_15_days: int
    between_15_and_30_days: int
    greater_than_30_days: int
    oldest_pending_days: int


class OfficerWorkloadRow(BaseModel):
    officer_id: UUID
    officer_name: str
    officer_email: str
    region_name: str
    assigned_active_count: int
    overdue_count: int
    completed_this_month: int


class ComplianceUndertakingSummary(BaseModel):
    total_obligations: int
    awaiting_submission: int
    submitted_under_verification: int
    verified_compliant: int
    deficient_returned: int
    overdue_non_compliant: int


class ExecutiveSummaryReport(BaseModel):
    generated_at: datetime
    active_rule_version: str
    total_applications: int
    approved_count: int
    rejected_count: int
    in_process_count: int
    pendency_by_region: List[PendencyReportRow]
    stage_ageing: List[StageAgeingRow]
    compliance_summary: ComplianceUndertakingSummary