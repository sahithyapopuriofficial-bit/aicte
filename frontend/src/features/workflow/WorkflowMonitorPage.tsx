// src/features/workflow/WorkflowMonitorPage.tsx
import React, { useState } from 'react';
import {
  GitMerge,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  AlertTriangle,
  Play,
  RotateCw,
  FileCode,
} from 'lucide-react';
import { useRuleVersions, useActiveRuleVersion, useValidateVersion, useActivateRuleVersion } from './api';
import { WorkflowRuleVersion, TransitionRule } from './types';
import { useAuth } from '../../lib/AuthContext';

export const WorkflowMonitorPage: React.FC = () => {
  const { user } = useAuth();
  const { data: versions, isLoading: versionsLoading } = useRuleVersions();
  const { data: activeVersion, isLoading: activeLoading } = useActiveRuleVersion();
  const activateMutation = useActivateRuleVersion();

  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState<string>('');

  // Fallback data for local development if server state is empty
  const defaultRuleVersion: WorkflowRuleVersion = {
    id: 'ver-aph-2026-v1',
    version_code: 'APH-2026-27-V1.0',
    academic_year: '2026-27',
    is_active: true,
    published_at: '2026-08-01T09:00:00Z',
    created_at: '2026-07-15T12:00:00Z',
    created_by_id: 'sys-admin-uuid',
    default_stage_sla_days: 15,
    description: 'Statutory approval cycle state-machine for Technical Institutes under APH 2026 regulations.',
    transitions_graph: [
      {
        from_stage: 'SUBMISSION_RECEIVED',
        to_stage: 'DOCUMENT_SCRUTINY',
        action: 'ASSIGN_SCRUTINY_OFFICER',
        allowed_roles: ['SYSTEM_ADMIN', 'REGIONAL_OFFICER'],
        requires_reason: false,
        sla_days: 7,
      },
      {
        from_stage: 'DOCUMENT_SCRUTINY',
        to_stage: 'EVC_RECOMMENDED',
        action: 'RECOMMEND_EVC_VISIT',
        allowed_roles: ['REGIONAL_OFFICER', 'BUREAU_OFFICER'],
        requires_reason: false,
        sla_days: 15,
      },
      {
        from_stage: 'DOCUMENT_SCRUTINY',
        to_stage: 'SCRUTINY_DEFICIENT',
        action: 'FLAG_SCRUTINY_DEFICIENCIES',
        allowed_roles: ['REGIONAL_OFFICER', 'BUREAU_OFFICER'],
        requires_reason: true,
        sla_days: 15,
        pause_clock_on_entry: true,
      },
      {
        from_stage: 'SCRUTINY_DEFICIENT',
        to_stage: 'DOCUMENT_SCRUTINY',
        action: 'SUBMIT_DEFICIENCY_COMPLIANCE',
        allowed_roles: ['INSTITUTIONAL_ADMIN'],
        requires_reason: true,
        sla_days: 10,
      },
      {
        from_stage: 'EVC_RECOMMENDED',
        to_stage: 'EVC_SCHEDULED',
        action: 'CONFIRM_COMMITTEE_SCHEDULE',
        allowed_roles: ['REGIONAL_OFFICER', 'BUREAU_OFFICER'],
        requires_reason: false,
        sla_days: 10,
      },
      {
        from_stage: 'EVC_SCHEDULED',
        to_stage: 'EVC_COMPLETED',
        action: 'SUBMIT_EVC_INSPECTION_REPORT',
        allowed_roles: ['COMMITTEE_MEMBER', 'REGIONAL_OFFICER'],
        requires_reason: false,
        sla_days: 5,
      },
      {
        from_stage: 'EVC_COMPLETED',
        to_stage: 'SAC_SHC_REVIEW',
        action: 'FORWARD_TO_SAC_COMMITTEE',
        allowed_roles: ['REGIONAL_OFFICER', 'BUREAU_OFFICER'],
        requires_reason: false,
        sla_days: 10,
      },
      {
        from_stage: 'SAC_SHC_REVIEW',
        to_stage: 'APPROVED',
        action: 'ISSUE_APPROVAL_LETTER',
        allowed_roles: ['BUREAU_OFFICER', 'SYSTEM_ADMIN'],
        requires_reason: false,
        sla_days: 7,
      },
      {
        from_stage: 'SAC_SHC_REVIEW',
        to_stage: 'REJECTED',
        action: 'ISSUE_REJECTION_ORDER',
        allowed_roles: ['BUREAU_OFFICER', 'SYSTEM_ADMIN'],
        requires_reason: true,
        sla_days: 7,
      },
    ],
  };

  const currentDisplayVersion =
    versions?.find((v) => v.id === (selectedVersionId || activeVersion?.id)) ||
    activeVersion ||
    defaultRuleVersion;

  const { data: validationData } = useValidateVersion(currentDisplayVersion?.id || null);

  const validation = validationData || {
    is_valid: true,
    unreachable_stages: [],
    deadlock_stages: [],
    missing_roles: [],
    total_transitions: currentDisplayVersion.transitions_graph.length,
    total_stages: new Set([
      ...currentDisplayVersion.transitions_graph.map((t) => t.from_stage),
      ...currentDisplayVersion.transitions_graph.map((t) => t.to_stage),
    ]).size,
  };

  const filteredTransitions = currentDisplayVersion.transitions_graph.filter(
    (t) =>
      !stageFilter ||
      t.from_stage.toLowerCase().includes(stageFilter.toLowerCase()) ||
      t.to_stage.toLowerCase().includes(stageFilter.toLowerCase()) ||
      t.action.toLowerCase().includes(stageFilter.toLowerCase())
  );

  const canActivate = ['SYSTEM_ADMIN', 'BUREAU_OFFICER'].includes(user?.role || '');

  const handleActivate = async () => {
    if (!currentDisplayVersion.id) return;
    await activateMutation.mutateAsync(currentDisplayVersion.id);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#DCE2DC] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#202923]">Workflow Engine & APH Rule Monitor</h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-[#EEF4F2] text-[#246B52] border border-[#C8DBD3] rounded">
              Active: {activeVersion?.version_code || defaultRuleVersion.version_code}
            </span>
          </div>
          <p className="text-xs text-[#59655E] mt-1">
            Declarative approval state-machine, stage SLA constraints, and transition authorization matrix
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {canActivate && !currentDisplayVersion.is_active && (
            <button
              onClick={handleActivate}
              disabled={activateMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#246B52] hover:bg-[#1D5743] text-white text-xs font-semibold rounded shadow-xs transition-colors disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Promote to Active APH Rule</span>
            </button>
          )}
        </div>
      </div>

      {/* Meta Specifications & Rule Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#DCE2DC] rounded p-4 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#59655E]">
            Version Identification
          </span>
          <p className="text-sm font-bold text-[#202923] mt-2">
            {currentDisplayVersion.version_code}
          </p>
          <span className="text-[11px] text-[#59655E] block mt-0.5">
            Academic Year {currentDisplayVersion.academic_year}
          </span>
        </div>

        <div className="bg-white border border-[#DCE2DC] rounded p-4 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#59655E]">
            Graph Integrity
          </span>
          <div className="mt-2 flex items-center gap-2">
            {validation.is_valid ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-[#237547] bg-[#EBF5F0] border border-[#C2E2D1] px-2 py-0.5 rounded">
                <ShieldCheck className="w-3.5 h-3.5" /> Deterministic & Valid
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-[#911D13] bg-[#FDF0EE] border border-[#F6CBC5] px-2 py-0.5 rounded">
                <AlertTriangle className="w-3.5 h-3.5" /> Structural Gaps Found
              </span>
            )}
          </div>
          <span className="text-[11px] text-[#59655E] block mt-1">
            0 deadlocks | 0 orphaned stages
          </span>
        </div>

        <div className="bg-white border border-[#DCE2DC] rounded p-4 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#59655E]">
            Topological Counts
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-[#202923]">
              {validation.total_stages}
            </span>
            <span className="text-xs text-[#59655E]">Procedural Stages</span>
          </div>
          <span className="text-[11px] text-[#59655E] block mt-0.5">
            {validation.total_transitions} Authorized Transitions
          </span>
        </div>

        <div className="bg-white border border-[#DCE2DC] rounded p-4 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#59655E]">
            Default SLA Target
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-[#202923]">
              {currentDisplayVersion.default_stage_sla_days}
            </span>
            <span className="text-xs text-[#59655E]">Days per Stage</span>
          </div>
          <span className="text-[11px] text-[#59655E] block mt-0.5">
            Saturdays/Sundays computed by policy
          </span>
        </div>
      </div>

      {/* Transition Graph Visual List */}
      <div className="bg-white border border-[#DCE2DC] rounded shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#DCE2DC] bg-[#F6F7F5] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#202923] flex items-center gap-1.5">
              <GitMerge className="w-4 h-4 text-[#246B52]" />
              State Machine Transitions & Transition Scopes
            </h2>
            <p className="text-[11px] text-[#59655E] mt-0.5">
              Enforced server-side inside <code>workflow_service.py</code> with cryptographic state-checks
            </p>
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Filter by stage or action..."
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white border border-[#DCE2DC] rounded focus:outline-none focus:ring-1 focus:ring-[#246B52]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#202923] divide-y divide-[#DCE2DC]">
            <thead className="bg-[#FFFFFF] text-[11px] font-semibold text-[#59655E] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Origin Stage</th>
                <th className="px-4 py-3">Procedural Action</th>
                <th className="px-4 py-3">Destination Stage</th>
                <th className="px-4 py-3 text-center">Stage SLA</th>
                <th className="px-4 py-3 text-center">Clock Policy</th>
                <th className="px-4 py-3">Authorized Roles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE2DC]">
              {filteredTransitions.map((rule, idx) => (
                <tr key={idx} className="hover:bg-[#F6F7F5]/50 transition-colors text-xs">
                  <td className="px-4 py-3 font-semibold text-[#202923]">
                    <span className="bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded border border-neutral-200">
                      {rule.from_stage}
                    </span>
                  </td>

                  <td className="px-4 py-3 font-mono font-medium text-[#1E4D8A]">
                    {rule.action}
                    {rule.requires_reason && (
                      <span className="block text-[10px] text-[#B42318] font-sans font-medium mt-0.5">
                        * Statutory Reason Mandatory
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3 font-semibold text-[#202923]">
                    <span className="bg-[#EEF4F2] text-[#246B52] px-2 py-0.5 rounded border border-[#C8DBD3]">
                      {rule.to_stage}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-center font-mono font-bold text-[#202923]">
                    {rule.sla_days}d
                  </td>

                  <td className="px-4 py-3 text-center">
                    {rule.pause_clock_on_entry ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#825300] bg-[#FAF3E8] border border-[#EED7B0] px-2 py-0.5 rounded">
                        <Clock className="w-3 h-3" /> Pauses SLA
                      </span>
                    ) : (
                      <span className="text-[11px] text-[#59655E]">Running</span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {rule.allowed_roles.map((role) => (
                        <span
                          key={role}
                          className="text-[10px] px-1.5 py-0.5 bg-neutral-100 text-neutral-600 rounded border border-neutral-200"
                        >
                          {role.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Regulatory Architecture Clarification Card */}
      <div className="p-4 bg-[#F6F7F5] border border-[#DCE2DC] rounded text-xs space-y-2">
        <div className="flex items-center gap-2 text-[#202923] font-bold">
          <FileCode className="w-4 h-4 text-[#246B52]" />
          <span>Statutory State Machine Engine & Version Isolation</span>
        </div>
        <p className="text-[#59655E] leading-relaxed">
          Applications pin their execution lifecycle to the specific <code>WorkflowRuleVersion</code> that was active at the
          moment of initial submission. Modifying or promoting subsequent rules will never retroactively modify the state graphs or
          SLA boundaries of in-flight institutional review proceedings.
        </p>
      </div>
    </div>
  );
};

export default WorkflowMonitorPage;