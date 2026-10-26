# backend/app/services/workflow_engine.py
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.application import Application, ApplicationStatus, ApplicationStageHistory
from app.services.audit_service import AuditService

ALLOWED_TRANSITIONS: Dict[str, Dict[str, Any]] = {
    "SCRUTINY": {
        "APPROVE": {"next_stage": "EVC_REQUIRED", "next_status": ApplicationStatus.UNDER_SCRUTINY, "allowed_roles": ["REGIONAL_OFFICER", "BUREAU_OFFICER"]},
        "FLAG_DEFICIENCY": {"next_stage": "DEFICIENCY_REPORTED", "next_status": ApplicationStatus.SCRUTINY_DEFICIENT, "allowed_roles": ["REGIONAL_OFFICER"]},
        "FAST_TRACK_APPROVE": {"next_stage": "APPROVED", "next_status": ApplicationStatus.APPROVED, "allowed_roles": ["BUREAU_OFFICER"]}
    },
    "EVC_REQUIRED": {
        "SCHEDULE": {"next_stage": "EVC_SCHEDULED", "next_status": ApplicationStatus.EVC_SCHEDULED, "allowed_roles": ["REGIONAL_OFFICER"]},
    },
    "EVC_SCHEDULED": {
        "RECORD_VISIT": {"next_stage": "SAC_SHC_REVIEW", "next_status": ApplicationStatus.EVC_COMPLETED, "allowed_roles": ["COMMITTEE_MEMBER", "REGIONAL_OFFICER"]},
        "REQUEST_RESCHEDULE": {"next_stage": "EVC_REQUIRED", "next_status": ApplicationStatus.UNDER_SCRUTINY, "allowed_roles": ["COMMITTEE_MEMBER", "REGIONAL_OFFICER"]}
    },
    "SAC_SHC_REVIEW": {
        "GRANT_APPROVAL": {"next_stage": "APPROVED", "next_status": ApplicationStatus.APPROVED, "allowed_roles": ["BUREAU_OFFICER"]},
        "REJECT": {"next_stage": "REJECTED", "next_status": ApplicationStatus.REJECTED, "allowed_roles": ["BUREAU_OFFICER"]}
    }
}

class WorkflowEngine:
    def __init__(self, db: Session):
        self.db = db
        self.audit = AuditService(db)

    def transition(
        self,
        application_id: UUID,
        action: str,
        actor_id: UUID,
        actor_role: str,
        reason: Optional[str] = None
    ) -> Application:
        app = self.db.query(Application).with_for_update().filter(Application.id == application_id).first()
        if not app:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

        current_stage = app.current_stage
        stage_rules = ALLOWED_TRANSITIONS.get(current_stage)
        
        if not stage_rules or action not in stage_rules:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Action '{action}' is not permitted from current stage '{current_stage}'"
            )

        transition_spec = stage_rules[action]
        if actor_role not in transition_spec["allowed_roles"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{actor_role}' unauthorized to execute '{action}'"
            )

        if "DEFICIENCY" in action or action == "REJECT":
            if not reason or len(reason.strip()) < 10:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="A substantive reason (min 10 characters) is required for returns/deficiencies/rejections."
                )

        # Update application state
        prev_stage = app.current_stage
        app.current_stage = transition_spec["next_stage"]
        app.status = transition_spec["next_status"]
        app.stage_entered_at = datetime.now(timezone.utc)
        app.stage_deadline = datetime.now(timezone.utc) + timedelta(days=15)  # Default 15-day SLA

        # Record history
        history = ApplicationStageHistory(
            application_id=app.id,
            previous_stage=prev_stage,
            new_stage=app.current_stage,
            actor_id=actor_id,
            action=action,
            reason=reason
        )
        self.db.add(history)

        # Write immutable audit
        self.audit.log(
            actor_id=actor_id,
            action="WORKFLOW_TRANSITION",
            resource_type="APPLICATION",
            resource_id=str(app.id),
            outcome="SUCCESS",
            metadata={"prev_stage": prev_stage, "new_stage": app.current_stage, "action": action, "reason": reason}
        )

        self.db.commit()
        self.db.refresh(app)
        return app