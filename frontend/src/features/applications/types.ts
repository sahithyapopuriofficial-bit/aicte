// src/features/applications/types.ts

export type ApplicationCategory =
  | 'NEW_INSTITUTE'
  | 'EXTENSION_OF_APPROVAL'
  | 'INCREASE_IN_INTAKE'
  | 'NEW_PROGRAM';

export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_SCRUTINY'
  | 'SCRUTINY_DEFICIENT'
  | 'EVC_SCHEDULED'
  | 'EVC_COMPLETED'
  | 'SAC_SHC_REVIEW'
  | 'APPROVED'
  | 'REJECTED';

export interface StageHistoryItem {
  id: string;
  previous_stage: string;
  new_stage: string;
  actor_id: string;
  action: string;
  reason: string | null;
  created_at: string;
}

export interface ApplicationSummary {
  id: string;
  application_ref: string;
  institution_id: string;
  institution_name: string | null;
  category: ApplicationCategory;
  current_stage: string;
  status: ApplicationStatus;
  assigned_region_id: string;
  assigned_officer_id: string | null;
  stage_entered_at: string;
  stage_deadline: string | null;
  is_overdue: boolean;
  days_at_current_stage: number;
  created_at: string;
}

export interface ApplicationDetail extends ApplicationSummary {
  stage_history: StageHistoryItem[];
  applicable_actions: string[];
}

export interface PaginatedApplications {
  items: ApplicationSummary[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface ApplicationQueryParams {
  page?: number;
  size?: number;
  search?: string;
  status?: string;
  category?: string;
  stage?: string;
  region_id?: string;
}

export interface WorkflowTransitionPayload {
  action: string;
  reason?: string;
}