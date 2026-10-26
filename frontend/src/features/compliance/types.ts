// src/features/compliance/types.ts

export type ComplianceStatus =
  | 'NOT_YET_DUE'
  | 'DUE_SOON'
  | 'AWAITING_SUBMISSION'
  | 'SUBMITTED'
  | 'UNDER_VERIFICATION'
  | 'DEFICIENT'
  | 'VERIFIED'
  | 'OVERDUE'
  | 'CLOSED';

export type ObligationType =
  | 'LAND_LEASE_CONTINUITY'
  | 'FACULTY_CADRE_RATIO'
  | 'CORPUS_FUND_DEPOSIT'
  | 'FIRE_SAFETY_CERTIFICATE'
  | 'BUILDING_STABILITY_CERTIFICATE'
  | 'BARRIER_FREE_ENVIRONMENT'
  | 'ANTI_RAGGING_AFFIDAVIT';

export interface ObligationItem {
  id: string;
  institution_id: string;
  institution_name: string | null;
  application_id: string | null;
  application_ref: string | null;
  obligation_type: ObligationType;
  description: string;
  applicable_condition: string | null;
  issue_date: string;
  due_date: string;
  status: ComplianceStatus;
  submitted_document_id: string | null;
  submission_notes: string | null;
  submitted_at: string | null;
  submitted_by_id: string | null;
  verified_by_id: string | null;
  verification_date: string | null;
  deficiency_reason: string | null;
  verification_remarks: string | null;
  is_overdue: boolean;
  created_at: string;
}

export interface PaginatedObligations {
  items: ObligationItem[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface ComplianceQueryParams {
  page?: number;
  size?: number;
  status?: string;
  obligation_type?: string;
  institution_id?: string;
  application_id?: string;
}

export interface SubmitEvidencePayload {
  document_id: string;
  submission_notes?: string;
}

export interface VerifyObligationPayload {
  outcome: 'VERIFY' | 'FLAG_DEFICIENCY' | 'CLOSE';
  remarks?: string;
  deficiency_reason?: string;
}