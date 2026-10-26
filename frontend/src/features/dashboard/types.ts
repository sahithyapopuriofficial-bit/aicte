// src/features/dashboard/types.ts

export interface MetricCardData {
  title: string;
  value: number;
  deltaText: string;
  trend: 'up' | 'down' | 'neutral';
  tone: 'neutral' | 'danger' | 'warning' | 'success';
}

export interface StageDistributionItem {
  stage: string;
  count: number;
  overdue_count: number;
  average_days: number;
}

export interface RegionalWorkloadItem {
  region_code: string;
  region_name: string;
  total_applications: number;
  active_scrutiny: number;
  evc_pending: number;
  breached_sla: number;
}

export interface CriticalActionItem {
  id: string;
  reference_no: string;
  institution_name: string;
  action_type: 'SLA_BREACH' | 'EVC_CONFLICT' | 'DOCUMENT_EXPIRING' | 'DEFICIENCY_OVERDUE';
  description: string;
  severity: 'HIGH' | 'CRITICAL' | 'MEDIUM';
  due_date: string;
  link: string;
}

export interface DashboardMetricsResponse {
  summary: {
    total_active_applications: number;
    sla_breaches_count: number;
    evc_visits_pending: number;
    expiring_documents_30d: number;
    unresolved_deficiencies: number;
  };
  stage_distribution: StageDistributionItem[];
  regional_workload: RegionalWorkloadItem[];
  critical_actions: CriticalActionItem[];
  generated_at: string;
}