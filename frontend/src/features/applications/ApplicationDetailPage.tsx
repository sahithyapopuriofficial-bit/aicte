// src/features/applications/ApplicationDetailPage.tsx
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  GitBranch,
  ShieldAlert,
  UserCheck,
  Send,
} from 'lucide-react';
import { useApplicationDetail, useWorkflowTransition, useAssignOfficer } from './api';
import StatusBadge from '../../components/common/StatusBadge';

export const ApplicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: application, isLoading, isError } = useApplicationDetail(id || '');
  const transitionMutation = useWorkflowTransition(id || '');

  // Workflow Action Modal States
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [transitionReason, setTransitionReason] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="p-8 space-y-4 animate-pulse">
        <div className="h-6 bg-neutral-200 rounded w-1/4" />
        <div className="h-40 bg-neutral-200 rounded" />
        <div className="h-64 bg-neutral-200 rounded" />
      </div>
    );
  }

  if (isError || !application) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
        Application record not found or inaccessible under your jurisdiction.
        <div className="mt-4">
          <Link to="/applications" className="underline font-medium">
            ← Return to Application List
          </Link>
        </div>
      </div>
    );
  }

  const handleExecuteTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAction) return;

    // Reason validation for deficiencies or rejections
    const requiresReason =
      selectedAction.includes('DEFICIENCY') ||
      selectedAction.includes('REJECT') ||
      selectedAction.includes('RETURN');

    if (requiresReason && (!transitionReason || transitionReason.trim().length < 10)) {
      setValidationError('Regulatory justification must be at least 10 characters.');
      return;
    }

    setValidationError(null);

    await transitionMutation.mutateAsync({
      action: selectedAction,
      reason: transitionReason || undefined,
    });

    setSelectedAction(null);
    setTransitionReason('');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back button and Meta Heading */}
      <div className="flex items-center gap-3">
        <Link
          to="/applications"
          className="p-1.5 text-[#59655E] hover:text-[#202923] hover:bg-neutral-200 rounded transition-colors"
          aria-label="Back to application list"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-[#202923] font-mono">
              {application.application_ref}
            </h1>
            <StatusBadge status={application.status} size="sm" />
          </div>
          <p className="text-xs text-[#59655E] mt-0.5">
            Registered: {new Date(application.created_at).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Case Overview & SLA Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Institution Context */}
        <div className="bg-white border border-[#DCE2DC] rounded p-4 shadow-xs space-y-2">
          <span className="text-xs font-semibold text-[#59655E] uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-[#246B52]" /> Institution
          </span>
          <p className="text-sm font-bold text-[#202923]">
            {application.institution_name || 'Affiliated Institution'}
          </p>
          <p className="text-xs text-[#59655E]">Category: {application.category}</p>
        </div>

        {/* Card 2: Current Stage & SLA */}
        <div className="bg-white border border-[#DCE2DC] rounded p-4 shadow-xs space-y-2">
          <span className="text-xs font-semibold text-[#59655E] uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#246B52]" /> Stage SLA Tracking
          </span>
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-bold text-[#202923]">{application.current_stage}</p>
            {application.is_overdue ? (
              <span className="text-xs font-bold text-[#B42318] flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> SLA Breached
              </span>
            ) : (
              <span className="text-xs font-medium text-[#237547]">Within Target SLA</span>
            )}
          </div>
          <p className="text-xs text-[#59655E]">
            Spent {application.days_at_current_stage} days at stage (Target: 15d)
          </p>
        </div>

        {/* Card 3: Action Execution Trigger */}
        <div className="bg-white border border-[#DCE2DC] rounded p-4 shadow-xs space-y-2 flex flex-col justify-between">
          <span className="text-xs font-semibold text-[#59655E] uppercase tracking-wider flex items-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5 text-[#246B52]" /> Permitted Stage Actions
          </span>
          <div className="flex flex-wrap gap-2">
            {application.applicable_actions.length === 0 ? (
              <span className="text-xs text-[#59655E] italic">
                No procedural transitions available for your active role.
              </span>
            ) : (
              application.applicable_actions.map((act) => (
                <button
                  key={act}
                  onClick={() => {
                    setSelectedAction(act);
                    setValidationError(null);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold bg-[#EEF4F2] text-[#246B52] border border-[#C8DBD3] hover:bg-[#246B52] hover:text-white rounded transition-colors"
                >
                  Execute: {act.replace(/_/g, ' ')}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Layout: Stage Timeline & Scrutiny Records */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Immutable Stage History Timeline */}
        <div className="lg:col-span-2 bg-white border border-[#DCE2DC] rounded p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#202923] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#246B52]" />
            Regulatory Stage History & Audit Trail
          </h2>

          <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#DCE2DC]">
            {application.stage_history.map((hist, idx) => (
              <div key={hist.id} className="relative text-xs">
                {/* Node icon */}
                <div className="absolute -left-[29px] top-0.5 w-4 h-4 rounded-full bg-white border-2 border-[#246B52] flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-[#246B52] rounded-full" />
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-[#202923]">
                    {hist.action.replace(/_/g, ' ')} ({hist.previous_stage} → {hist.new_stage})
                  </span>
                  <span className="text-[#59655E] text-[11px]">
                    {new Date(hist.created_at).toLocaleString()}
                  </span>
                </div>
                {hist.reason && (
                  <div className="mt-1.5 p-2 bg-[#F6F7F5] border border-[#DCE2DC] rounded text-[#59655E]">
                    <span className="font-semibold text-[#202923]">Documented Reason: </span>
                    {hist.reason}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Case Officers & Direct Actions */}
        <div className="space-y-4">
          <div className="bg-white border border-[#DCE2DC] rounded p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#202923] flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-[#246B52]" /> Officer Assignment
            </h3>
            <p className="text-xs text-[#59655E]">
              Assigned Officer:{' '}
              <span className="font-semibold text-[#202923]">
                {application.assigned_officer_id ? 'Officer Assigned' : 'Unassigned / Bureau Queue'}
              </span>
            </p>
          </div>

          <div className="bg-[#EEF4F2] border border-[#C8DBD3] rounded p-4 text-xs text-[#1D5743] space-y-2">
            <span className="font-bold block">Procedural Safeguard Notice</span>
            <p className="leading-relaxed">
              Every workflow transition is written transactionally into the permanent audit
              subsystem with the actor's identity, IP address, and correlation tracking.
            </p>
          </div>
        </div>
      </div>

      {/* Transaction Modal Dialog */}
      {selectedAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-[#DCE2DC] rounded-lg max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-[#202923]">
              Confirm Transition: {selectedAction.replace(/_/g, ' ')}
            </h3>
            <p className="text-xs text-[#59655E]">
              Target stage: Application will transition from{' '}
              <span className="font-semibold text-[#202923]">{application.current_stage}</span> according
              to published rule version specifications.
            </p>

            <form onSubmit={handleExecuteTransition} className="space-y-4">
              <div>
                <label
                  htmlFor="transition-reason"
                  className="block text-xs font-semibold text-[#202923] uppercase tracking-wider mb-1"
                >
                  Regulatory Reason / Deficiency Justification
                </label>
                <textarea
                  id="transition-reason"
                  rows={4}
                  value={transitionReason}
                  onChange={(e) => setTransitionReason(e.target.value)}
                  placeholder="State the statutory justification or specific deficiencies observed (mandatory for returns or rejections)..."
                  className="w-full text-xs p-2.5 border border-[#DCE2DC] rounded focus:outline-none focus:ring-1 focus:ring-[#246B52]"
                />
                {validationError && (
                  <p className="text-xs text-[#B42318] font-medium mt-1">{validationError}</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#DCE2DC]">
                <button
                  type="button"
                  onClick={() => setSelectedAction(null)}
                  className="px-3 py-1.5 text-xs text-[#59655E] hover:bg-neutral-100 rounded font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transitionMutation.isPending}
                  className="px-4 py-1.5 text-xs bg-[#246B52] hover:bg-[#1D5743] text-white font-medium rounded transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {transitionMutation.isPending ? 'Committing...' : 'Commit Transition'}
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationDetailPage;