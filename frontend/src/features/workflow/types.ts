// src/features/workflow/types.ts

export interface TransitionRule {
  from_stage: string;
  to_stage: string;
  action: string;
  allowed_roles: string[];
  requires_reason: boolean;
  sla_days: number;
  pause_clock_on_entry?: boolean;
}

export interface WorkflowRuleVersion {
  id: string;
  version_code: string; // e.g. "APH-2026-27-V1"
  academic_year: string; // e.g. "2026-27"
  is_active: boolean;
  published_at: string | null;
  created_at: string;
  created_by_id: string | null;
  transitions_graph: TransitionRule[];
  default_stage_sla_days: number;
  description: string | null;
}

export interface WorkflowValidationResult {
  is_valid: boolean;
  unreachable_stages: string[];
  deadlock_stages: string[];
  missing_roles: string[];
  total_transitions: number;
  total_stages: number;
}