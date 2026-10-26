# backend/app/api/v1/workflow.py
from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, RequireRole
from app.models.user import User
from app.models.workflow import WorkflowRuleVersion
from app.schemas.workflow import (
    SimulationRequest,
    SimulationResponse,
    SimulationStepResult,
    WorkflowRuleCreateRequest,
    WorkflowRuleResponse,
)
from app.services.audit_service import AuditService

router = APIRouter(prefix="/workflows", tags=["Workflow Engine & Rules Management"])


@router.get(
    "/rules",
    response_model=List[WorkflowRuleResponse],
    summary="List all workflow rule definitions and published versions",
)
def list_workflow_rules(
    is_active_only: bool = Query(False, description="Filter for currently active versions"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(WorkflowRuleVersion)
    if is_active_only:
        query = query.filter(WorkflowRuleVersion.is_active == True)
    
    return query.order_by(WorkflowRuleVersion.created_at.desc()).all()


@router.get(
    "/rules/{rule_id}",
    response_model=WorkflowRuleResponse,
    summary="Fetch complete stage configuration graph for a specific rule version",
)
def get_workflow_rule(
    rule_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rule = db.query(WorkflowRuleVersion).filter(WorkflowRuleVersion.id == rule_id).first()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow rule specification not found.",
        )
    return rule


@router.post(
    "/rules",
    response_model=WorkflowRuleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Draft a new workflow rule version",
    dependencies=[Depends(RequireRole("SYSTEM_ADMIN", "BUREAU_OFFICER"))],
)
def create_workflow_rule_draft(
    payload: WorkflowRuleCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Check for duplicate version tag
    existing = db.query(WorkflowRuleVersion).filter(
        WorkflowRuleVersion.version_tag == payload.version_tag
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Workflow version tag '{payload.version_tag}' already exists.",
        )

    new_rule = WorkflowRuleVersion(
        version_tag=payload.version_tag,
        name=payload.name,
        description=payload.description,
        is_active=False,
        is_published=False,
        rules_graph=payload.rules_graph.model_dump(),
        effective_from=payload.effective_from,
        created_by_id=current_user.id,
    )
    db.add(new_rule)
    db.flush()

    audit = AuditService(db)
    audit.log(
        actor_id=current_user.id,
        action="WORKFLOW_RULE_DRAFT_CREATED",
        resource_type="WORKFLOW_RULE",
        resource_id=str(new_rule.id),
        outcome="SUCCESS",
        metadata={"version_tag": payload.version_tag},
    )

    db.commit()
    db.refresh(new_rule)
    return new_rule


@router.post(
    "/rules/{rule_id}/publish",
    response_model=WorkflowRuleResponse,
    summary="Publish and lock a workflow rule version (Immutable)",
    dependencies=[Depends(RequireRole("SYSTEM_ADMIN", "BUREAU_OFFICER"))],
)
def publish_workflow_rule(
    rule_id: UUID,
    set_as_active: bool = Query(True, description="Deactivates previous active versions and enables this one"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rule = db.query(WorkflowRuleVersion).with_for_update().filter(WorkflowRuleVersion.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule version not found.")

    if rule.is_published:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This workflow rule version is already published and immutable.",
        )

    now = datetime.now(timezone.utc)
    rule.is_published = True
    rule.published_at = now

    if set_as_active:
        # Deactivate all current versions atomically
        db.query(WorkflowRuleVersion).filter(WorkflowRuleVersion.is_active == True).update({"is_active": False})
        rule.is_active = True
        if not rule.effective_from:
            rule.effective_from = now

    audit = AuditService(db)
    audit.log(
        actor_id=current_user.id,
        action="WORKFLOW_RULE_PUBLISHED",
        resource_type="WORKFLOW_RULE",
        resource_id=str(rule.id),
        outcome="SUCCESS",
        metadata={"version_tag": rule.version_tag, "is_active": rule.is_active},
    )

    db.commit()
    db.refresh(rule)
    return rule


@router.post(
    "/simulate",
    response_model=SimulationResponse,
    summary="Dry-run a transition sequence through a workflow rule version without committing data",
)
def simulate_workflow_execution(
    payload: SimulationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rule = db.query(WorkflowRuleVersion).filter(WorkflowRuleVersion.id == payload.rule_version_id).first()
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow rule version not found.")

    graph = rule.rules_graph
    stages = graph.get("stages", {})
    current_stage = payload.initial_stage

    if current_stage not in stages:
        return SimulationResponse(
            is_valid=False,
            terminal_reached=False,
            steps=[],
            error_detail=f"Initial stage '{current_stage}' not present in rule version {rule.version_tag}.",
        )

    simulated_steps: List[SimulationStepResult] = []

    for idx, action in enumerate(payload.actions_sequence, start=1):
        stage_cfg = stages.get(current_stage)
        if not stage_cfg:
            return SimulationResponse(
                is_valid=False,
                terminal_reached=False,
                steps=simulated_steps,
                error_detail=f"Stage '{current_stage}' definition missing at step {idx}.",
            )

        transitions = stage_cfg.get("transitions", {})
        if action not in transitions:
            return SimulationResponse(
                is_valid=False,
                terminal_reached=False,
                steps=simulated_steps,
                error_detail=f"Action '{action}' is invalid from stage '{current_stage}' at step {idx}.",
            )

        transition_spec = transitions[action]
        next_stage = transition_spec["next_stage"]

        simulated_steps.append(
            SimulationStepResult(
                step=idx,
                action=action,
                from_stage=current_stage,
                to_stage=next_stage,
                status=transition_spec.get("next_status", "UNKNOWN"),
                sla_days=transition_spec.get("sla_days", 15),
                allowed_roles=transition_spec.get("allowed_roles", []),
            )
        )

        current_stage = next_stage
        if current_stage == "TERMINAL":
            break

    return SimulationResponse(
        is_valid=True,
        terminal_reached=(current_stage == "TERMINAL"),
        steps=simulated_steps,
        error_detail=None,
    )