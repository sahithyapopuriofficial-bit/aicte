// src/features/dashboard/DashboardOverview.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileSpreadsheet,
  AlertOctagon,
  CalendarDays,
  FileWarning,
  ArrowRight,
  TrendingUp,
  Clock,
  Building2,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { useDashboardMetrics } from './api';
import { useAuth } from '../../lib/AuthContext';

export const DashboardOverview: React.FC = () => {
  const { user } = useAuth();
  const { data, isLoading, isError, refetch, isFetching } = useDashboardMetrics();

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="h-8 bg-neutral-200 rounded w-1/3 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white border border-[#DCE2DC] rounded animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-96 bg-white border border-[#DCE2DC] rounded lg:col-span-2 animate-pulse" />
          <div className="h-96 bg-white border border-[#DCE2DC] rounded animate-pulse" />
        </div>
      </div>
    );
  }

  // Graceful fallback for initial development or offline backend
  const metrics = data?.summary || {
    total_active_applications: 142,
    sla_breaches_count: 9,
    evc_visits_pending: 28,
    expiring_documents_30d: 14,
    unresolved_deficiencies: 19,
  };

  const stageDistribution = data?.stage_distribution || [
    { stage: 'SUBMISSION_RECEIVED', count: 32, overdue_count: 0, average_days: 2.1 },
    { stage: 'DOCUMENT_SCRUTINY', count: 48, overdue_count: 4, average_days: 9.4 },
    { stage: 'EVC_RECOMMENDED', count: 26, overdue_count: 2, average_days: 14.8 },
    { stage: 'SAC_SHC_REVIEW', count: 21, overdue_count: 3, average_days: 11.2 },
    { stage: 'FINAL_APPROVAL_DECISION', count: 15, overdue_count: 0, average_days: 3.5 },
  ];

  const regionalWorkload = data?.regional_workload || [
    { region_code: 'NRO', region_name: 'Northern Regional Office (Delhi)', total_applications: 38, active_scrutiny: 16, evc_pending: 7, breached_sla: 2 },
    { region_code: 'WRO', region_name: 'Western Regional Office (Mumbai)', total_applications: 44, active_scrutiny: 14, evc_pending: 9, breached_sla: 4 },
    { region_code: 'SRO', region_name: 'Southern Regional Office (Chennai)', total_applications: 36, active_scrutiny: 11, evc_pending: 8, breached_sla: 1 },
    { region_code: 'ERO', region_name: 'Eastern Regional Office (Kolkata)', total_applications: 24, active_scrutiny: 7, evc_pending: 4, breached_sla: 2 },
  ];

  const criticalActions = data?.critical_actions || [
    {
      id: 'act-1',
      reference_no: 'AICTE-2026-NRO-8491',
      institution_name: 'Dr. B.R. Ambedkar Institute of Technology',
      action_type: 'SLA_BREACH',
      description: 'Document Scrutiny exceeded standard SLA (19 days at stage; 15 days SLA target)',
      severity: 'CRITICAL',
      due_date: '2026-10-24T18:30:00Z',
      link: '/applications',
    },
    {
      id: 'act-2',
      reference_no: 'AICTE-2026-WRO-2204',
      institution_name: 'Pune Institute of Applied Informatics',
      action_type: 'EVC_CONFLICT',
      description: 'Expert panelist declined inspection scheduled for 28-Oct-2026; replacement required',
      severity: 'HIGH',
      due_date: '2026-10-27T12:00:00Z',
      link: '/evc',
    },
    {
      id: 'act-3',
      reference_no: 'AICTE-2026-SRO-5192',
      institution_name: 'Karpagam Polytechnic College',
      action_type: 'DOCUMENT_EXPIRING',
      description: 'Building Structural Stability Certificate reaches expiry within 12 days',
      severity: 'MEDIUM',
      due_date: '2026-11-07T00:00:00Z',
      link: '/documents',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Refresh Control */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#DCE2DC] pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#202923]">Regulatory Operations Overview</h1>
          <p className="text-xs text-[#59655E] mt-1">
            Real-time pendency monitoring, statutory SLAs, and jurisdictional workloads
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#DCE2DC] hover:bg-[#F6F7F5] text-[#202923] text-xs font-semibold rounded shadow-xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#246B52] ${isFetching ? 'animate-spin' : ''}`} />
            <span>Sync Snapshot</span>
          </button>
        </div>
      </div>

      {/* KPI Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white border border-[#DCE2DC] rounded p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#59655E]">
              Active Applications
            </span>
            <div className="w-8 h-8 rounded bg-[#EEF4F2] text-[#246B52] flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#202923]">
              {metrics.total_active_applications}
            </span>
            <span className="text-xs font-medium text-[#237547]">Across all regions</span>
          </div>
          <p className="text-[11px] text-[#59655E] mt-1">Under formal administrative scrutiny</p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-[#F6CBC5] bg-[#FDF0EE]/30 rounded p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#911D13]">
              SLA Breaches
            </span>
            <div className="w-8 h-8 rounded bg-[#FDF0EE] text-[#911D13] flex items-center justify-center">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#911D13]">
              {metrics.sla_breaches_count}
            </span>
            <span className="text-xs font-medium text-[#911D13]">Escalated to RO/Bureau</span>
          </div>
          <p className="text-[11px] text-[#59655E] mt-1">Exceeded standard 15-day stage target</p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-[#DCE2DC] rounded p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#59655E]">
              Pending EVC Visits
            </span>
            <div className="w-8 h-8 rounded bg-[#EEF4F2] text-[#246B52] flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#202923]">
              {metrics.evc_visits_pending}
            </span>
            <span className="text-xs font-medium text-[#59655E]">Queued / In-progress</span>
          </div>
          <p className="text-[11px] text-[#59655E] mt-1">Committee inspection dates allocated</p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-[#EED7B0] bg-[#FAF3E8]/30 rounded p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#825300]">
              Expiring Documents
            </span>
            <div className="w-8 h-8 rounded bg-[#FAF3E8] text-[#825300] flex items-center justify-center">
              <FileWarning className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#825300]">
              {metrics.expiring_documents_30d}
            </span>
            <span className="text-xs font-medium text-[#825300]">Expiring in ≤30 days</span>
          </div>
          <p className="text-[11px] text-[#59655E] mt-1">Land leases, stability & NOCs</p>
        </div>
      </div>

      {/* Main Grid: Stage Distribution & Action Required Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Workflow Stage Pendency Table */}
        <div className="lg:col-span-2 bg-white border border-[#DCE2DC] rounded shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#DCE2DC] bg-[#F6F7F5] flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#202923]">
                Workflow Stage Distribution & Pendency
              </h2>
              <p className="text-[11px] text-[#59655E] mt-0.5">
                Active cases segmented by statutory procedural stage
              </p>
            </div>
            <Link
              to="/applications"
              className="text-xs font-semibold text-[#246B52] hover:underline flex items-center gap-1"
            >
              View Detailed Matrix <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#202923] divide-y divide-[#DCE2DC]">
              <thead className="bg-[#FFFFFF] text-[11px] font-semibold text-[#59655E] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Procedural Stage</th>
                  <th className="px-4 py-3 text-center">Active Volume</th>
                  <th className="px-4 py-3 text-center">Avg. Days</th>
                  <th className="px-4 py-3 text-center">Breached (&gt;15d)</th>
                  <th className="px-4 py-3 text-right">Progress Bar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE2DC]">
                {stageDistribution.map((item) => {
                  const maxVolume = Math.max(...stageDistribution.map((s) => s.count), 1);
                  const barWidth = Math.round((item.count / maxVolume) * 100);

                  return (
                    <tr key={item.stage} className="hover:bg-[#F6F7F5]/50 transition-colors">
                      <td className="px-4 py-3 text-xs font-semibold text-[#202923]">
                        {item.stage.replace(/_/g, ' ')}
                      </td>
                      <td className="px-4 py-3 text-center text-xs font-mono font-medium">
                        {item.count}
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-[#59655E]">
                        {item.average_days}d
                      </td>
                      <td className="px-4 py-3 text-center text-xs">
                        {item.overdue_count > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#FDF0EE] text-[#911D13] border border-[#F6CBC5]">
                            {item.overdue_count} breached
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#237547] font-medium">Clear</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right w-36">
                        <div className="w-full bg-[#EEF4F2] h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              item.overdue_count > 0 ? 'bg-[#911D13]' : 'bg-[#246B52]'
                            }`}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Urgent Attention Items */}
        <div className="bg-white border border-[#DCE2DC] rounded shadow-xs flex flex-col">
          <div className="p-4 border-b border-[#DCE2DC] bg-[#F6F7F5]">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#202923] flex items-center gap-1.5">
              <AlertOctagon className="w-3.5 h-3.5 text-[#911D13]" /> Priority Action Queue
            </h2>
            <p className="text-[11px] text-[#59655E] mt-0.5">Cases requiring direct administrative intervention</p>
          </div>

          <div className="p-4 flex-1 space-y-3 overflow-y-auto">
            {criticalActions.map((action) => (
              <div
                key={action.id}
                className="p-3 bg-white border border-[#DCE2DC] hover:border-[#246B52] rounded transition-all shadow-xs text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-semibold text-[#1E4D8A]">
                    {action.reference_no}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                      action.severity === 'CRITICAL'
                        ? 'bg-[#FDF0EE] text-[#911D13] border border-[#F6CBC5]'
                        : action.severity === 'HIGH'
                        ? 'bg-[#FAF3E8] text-[#825300] border border-[#EED7B0]'
                        : 'bg-[#EBF3FA] text-[#1E4D8A] border border-[#BDD7F1]'
                    }`}
                  >
                    {action.severity}
                  </span>
                </div>
                <div className="font-medium text-[#202923] line-clamp-1">{action.institution_name}</div>
                <p className="text-[#59655E] text-[11px] leading-relaxed">{action.description}</p>
                <div className="pt-1 flex items-center justify-between border-t border-neutral-100">
                  <span className="text-[10px] text-[#8E9B93]">
                    Due: {new Date(action.due_date).toLocaleDateString()}
                  </span>
                  <Link
                    to={action.link}
                    className="text-[11px] font-semibold text-[#246B52] hover:underline flex items-center gap-0.5"
                  >
                    Inspect <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-[#DCE2DC] bg-[#F6F7F5] text-center">
            <Link
              to="/escalations"
              className="text-xs font-semibold text-[#246B52] hover:underline"
            >
              View All Escalated Breaches →
            </Link>
          </div>
        </div>
      </div>

      {/* Regional Workload Summary Matrix */}
      <div className="bg-white border border-[#DCE2DC] rounded shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#DCE2DC] bg-[#F6F7F5]">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#202923]">
            Regional Jurisdiction Workload Balance
          </h2>
          <p className="text-[11px] text-[#59655E] mt-0.5">
            Operational distribution across Northern, Western, Southern, and Eastern Regional Offices
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#202923] divide-y divide-[#DCE2DC]">
            <thead className="bg-[#FFFFFF] text-[11px] font-semibold text-[#59655E] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Jurisdiction</th>
                <th className="px-4 py-3 text-center">Total Load</th>
                <th className="px-4 py-3 text-center">Under Scrutiny</th>
                <th className="px-4 py-3 text-center">EVC Scheduled</th>
                <th className="px-4 py-3 text-center">SLA Breaches</th>
                <th className="px-4 py-3 text-right">Compliance Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE2DC]">
              {regionalWorkload.map((reg) => {
                const isHighBreach = reg.breached_sla >= 3;
                return (
                  <tr key={reg.region_code} className="hover:bg-[#F6F7F5]/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-xs text-[#202923]">{reg.region_name}</div>
                      <span className="text-[10px] font-mono text-[#8E9B93]">Code: {reg.region_code}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-xs font-mono font-bold text-[#202923]">
                      {reg.total_applications}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-[#59655E]">
                      {reg.active_scrutiny}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-[#59655E]">
                      {reg.evc_pending}
                    </td>
                    <td className="px-4 py-3 text-center text-xs">
                      {reg.breached_sla > 0 ? (
                        <span className="font-bold text-[#911D13] font-mono">
                          {reg.breached_sla}
                        </span>
                      ) : (
                        <span className="text-[#237547] text-xs font-medium">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          isHighBreach
                            ? 'bg-[#FDF0EE] text-[#911D13] border border-[#F6CBC5]'
                            : 'bg-[#EBF5F0] text-[#1E5E3A] border-[#C2E2D1]'
                        }`}
                      >
                        {isHighBreach ? 'Attention Required' : 'Optimal'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;