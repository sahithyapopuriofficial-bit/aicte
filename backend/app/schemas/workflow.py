# backend/app/schemas/workflow.py
from datetime import datetime
from typing import Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, Field, model_validator


class StageTransitionRule(BaseModel):
    next_stage: str = Field(..., description="Target stage identifier")
    next_status: str = Field(..., description="Target ApplicationStatus value")
    allowed_roles: List[str] = Field(..., min_length=1, description="Roles permitted to trigger this transition")
    requires_reason: bool = Field(False, description="Whether a justification is mandatory")
    sla_days: int = Field(15, ge=1, le=180, description="Stage deadline SLA in calendar days")


class StageDefinition(BaseModel):
    stage_name: str
    display_title: str
    transitions: Dict[str, StageTransitionRule] = Field(
        ..., description="Map of action name (e.g. APPROVE, RETURN_DEFICIENT) to transition rules"
    )


class WorkflowGraphPayload(BaseModel):
    initial_stage: str
    stages: Dict[str, StageDefinition]

    @model_validator(mode="after")
    def validate_graph_integrity(self):
        initial = self.initial_stage
        stages = self.stages

        if initial not in stages:
            raise ValueError(f"Initial stage '{initial}' does not exist in stages definition.")

        # Detect dangling references
        for stage_key, stage_def in stages.items():
            for action_key, trans in stage_def.transitions.items():
                if trans.next_stage != "TERMINAL" and trans.next_stage not in stages:
                    raise ValueError(
                        f"Stage '{stage_key}' action '{action_key}' references non-existent target stage '{trans.next_stage}'."
                    )
        return self


class WorkflowRuleCreateRequest(BaseModel):
    version_tag: str = Field(..., pattern=r"^[A-Z0-9_\-\.]{3,32}$")
    name: str = Field(..., min_length=3, max_length=128)
    description: Optional[str] = None
    effective_from: Optional[datetime] = None
    rules_graph: WorkflowGraphPayload


class WorkflowRuleResponse(BaseModel):
    id: UUID
    version_tag: str
    name: str
    description: Optional[str] = None
    is_active: bool
    is_published: bool
    effective_from: Optional[datetime] = None
    rules_graph: Dict
    created_at: datetime
    published_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SimulationRequest(BaseModel):
    initial_stage: str
    actions_sequence: List[str]
    rule_version_id: UUID


class SimulationStepResult(BaseModel):
    step: int
    action: str
    from_stage: str
    to_stage: str
    status: str
    sla_days: int
    allowed_roles: List[str]


class SimulationResponse(BaseModel):
    is_valid: bool
    terminal_reached: bool
    steps: List[SimulationStepResult]
    error_detail: Optional[str] = None