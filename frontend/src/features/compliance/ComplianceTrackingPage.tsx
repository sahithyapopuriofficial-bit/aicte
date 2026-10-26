// src/features/compliance/ComplianceTrackingPage.tsx
import React, { useState } from 'react';
import {
  ShieldCheck,
  Calendar,
  AlertTriangle,
  Upload,
  CheckCircle2,
  FileCheck2,
  XCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
  Send,
} from 'lucide-react';
import { useObligationsList, useSubmitEvidence, useVerifyObligation } from './api';
import { ObligationItem, ObligationType, ComplianceStatus } from './types';
import StatusBadge from '../../components/common/StatusBadge';
import { useAuth } from '../../lib/AuthContext';

export const ComplianceTrackingPage: React.FC = () => {
  const { user } = useAuth();
  const [page, setPage] = useState<number>(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  // Selected item modal states
  const [selectedForEvidence, setSelectedForEvidence] = useState<ObligationItem | null>(null);
  const [evidenceDocId, setEvidenceDocId] = useState<string>('');
  const [submissionNotes, setSubmissionNotes] = useState<string>('');

  const [selectedForVerification, setSelectedForVerification] = useState<ObligationItem | null>(null);
  const [verifyOutcome, setVerifyOutcome] = useState<'VERIFY' | 'FLAG_DEFICIENCY' | 'CLOSE'>('VERIFY');
  const [deficiencyReason, setDeficiencyReason] = useState<string>('');
  const [verificationRemarks, setVerificationRemarks] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading, isError } = useObligationsList({
    page,
    size: 15,
    status: statusFilter || undefined,
    obligation_type: typeFilter || undefined,
  });

  const submitEvidenceMutation = useSubmitEvidence(selectedForEvidence?.id || '');
  const verifyObligationMutation = useVerifyObligation(selectedForVerification?.id || '');

  const canVerify = [
    'SYSTEM_ADMIN',
    'BUREAU_OFFICER',
    'REGIONAL_OFFICER',
    'COMPLIANCE_VERIFICATION_OFFICER',
  ].includes(user?.role || '');

  const isInstitution = user?.role === 'INSTITUTIONAL_ADMIN';

  const formatObligationType = (type: ObligationType) => {
    const titles: Record<ObligationType, string> = {
      LAND_LEASE_CONTINUITY: 'Land Lease Continuity Covenant',
      FACULTY_CADRE_RATIO: 'Faculty Cadre Ratio Maintenance',
      CORPUS_FUND_DEPOSIT: 'Joint FDR / Corpus Fund Maintenance',
      FIRE_SAFETY_CERTIFICATE: 'Fire Safety Certificate Renewal',
      BUILDING_STABILITY_CERTIFICATE: 'Structural Stability Certificate',
      BARRIER_FREE_ENVIRONMENT: 'Barrier-Free Environment Proof',
      ANTI_RAGGING_AFFIDAVIT: 'Statutory Anti-Ragging Affidavit',
    };
    return titles[type] || type.replace(/_/g, ' ');
  };

  const handleSubmitEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceDocId.trim()) {
      setFormError('A valid Document Storage UUID must be provided.');
      return;
    }
    setFormError(null);

    await submitEvidenceMutation.mutateAsync({
      document_id: evidenceDocId.trim(),
      submission_notes: submissionNotes.trim() || undefined,
    });

    setSelectedForEvidence(null);
    setEvidenceDocId('');
    setSubmissionNotes('');
  };

  const handleExecuteVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyOutcome === 'FLAG_DEFICIENCY' && (!deficiencyReason || deficiencyReason.trim().length < 10)) {
      setFormError('Statutory deficiency explanation must be at least 10 characters.');
      return;
    }
    setFormError(null);

    await verifyObligationMutation.mutateAsync({
      outcome: verifyOutcome,
      deficiency_reason: deficiencyReason.trim() || undefined,
      remarks: verificationRemarks.trim() || undefined,
    });

    setSelectedForVerification(null);
    setDeficiencyReason('');
    setVerificationRemarks('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#DCE2DC] pb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#202923]">Institutional Compliance & Undertakings</h1>
          <p className="text-sm text-[#59655E] mt-1">
            Track mandatory covenants, deficiency curing timelines, and formal verification records
          </p>
        </div>
      </div>

      {/* Filter Matrix */}
      <div className="bg-white border border-[#DCE2DC] rounded p-4 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="compliance-status-filter" className="block text-xs font-semibold text-[#59655E] uppercase tracking-wider mb-1">
            Compliance Status
          </label>
          <select
            id="compliance-status-filter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-1.5 text-sm bg-white border border-[#DCE2DC] rounded focus:outline-none focus:ring-1 focus:ring-[#246B52] text-[#202923]"
          >
            <option value="">All Lifecycle Statuses</option>
            <option value="AWAITING_SUBMISSION">Awaiting Submission</option>
            <option value="SUBMITTED">Submitted (Pending Verification)</option>
            <option value="DEFICIENT">Deficient / Returned</option>
            <option value="VERIFIED">Verified & Compliant</option>
            <option value="OVERDUE">Overdue Covenant</option>
            <option value="CLOSED">Closed by Authority</option>
          </select>
        </div>

        <div>
          <label htmlFor="obligation-type-filter" className="block text-xs font-semibold text-[#59655E] uppercase tracking-wider mb-1">
            Obligation Category
          </label>
          <select
            id="obligation-type-filter"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-1.5 text-sm bg-white border border-[#DCE2DC] rounded focus:outline-none focus:ring-1 focus:ring-[#246B52] text-[#202923]"
          >
            <option value="">All Obligation Categories</option>
            <option value="LAND_LEASE_CONTINUITY">Land Lease Continuity</option>
            <option value="FACULTY_CADRE_RATIO">Faculty Cadre Ratio</option>
            <option value="CORPUS_FUND_DEPOSIT">Corpus Fund / FDR</option>
            <option value="FIRE_SAFETY_CERTIFICATE">Fire Safety Certificate</option>
            <option value="BUILDING_STABILITY_CERTIFICATE">Structural Stability</option>
            <option value="BARRIER_FREE_ENVIRONMENT">Barrier-Free Environment</option>
            <option value="ANTI_RAGGING_AFFIDAVIT">Anti-Ragging Affidavit</option>
          </select>
        </div>

        <div className="flex items-end">
          <div className="text-xs text-[#59655E] bg-[#F6F7F5] border border-[#DCE2DC] p-2 rounded w-full">
            <span className="font-semibold text-[#202923]">Statutory Guard: </span>
            Submitting evidence updates state to <span className="font-semibold">SUBMITTED</span>; verified compliance requires designated officer review.
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-[#DCE2DC] rounded shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-10 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-neutral-100 rounded animate-pulse" />
            ))}
          </div>
        ) : isError || !data ? (
          <div className="p-8 text-center text-sm text-[#B42318] bg-red-50/50">
            Failed to fetch compliance obligations. Check server connectivity.
          </div>
        ) : data.items.length === 0 ? (
          <div className="p-12 text-center text-[#59655E]">
            <ShieldCheck className="w-10 h-10 mx-auto text-[#8E9B93] mb-3" />
            <p className="text-sm font-medium text-[#202923]">No obligations match your search parameters.</p>
            <p className="text-xs mt-1">Adjust filters above to see broader records.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#202923] divide-y divide-[#DCE2DC]">
              <thead className="bg-[#F6F7F5] text-xs font-semibold text-[#59655E] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Obligation & Institution</th>
                  <th className="px-4 py-3">Associated Case</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Evidence Details</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE2DC] bg-white">
                {data.items.map((ob) => (
                  <tr key={ob.id} className="hover:bg-[#F6F7F5]/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#202923]">
                        {formatObligationType(ob.obligation_type)}
                      </div>
                      <div className="text-xs text-[#59655E] truncate max-w-sm">
                        {ob.institution_name || 'Institution Reference Available'}
                      </div>
                      <div className="text-[11px] text-[#8E9B93] mt-0.5 line-clamp-1">
                        {ob.description}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-xs font-mono text-[#1E4D8A]">
                      {ob.application_ref || 'Standalone Institutional Covenant'}
                    </td>

                    <td className="px-4 py-3 text-xs">
                      <div className="flex items-center gap-1 text-[#202923]">
                        <Calendar className="w-3.5 h-3.5 text-[#59655E]" />
                        {new Date(ob.due_date).toLocaleDateString()}
                      </div>
                      {ob.is_overdue && (
                        <span className="text-[10px] font-bold text-[#B42318] flex items-center gap-0.5 mt-0.5">
                          <AlertTriangle className="w-3 h-3" /> SLA Breached
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge status={ob.status} size="sm" />
                    </td>

                    <td className="px-4 py-3 text-xs text-[#59655E]">
                      {ob.submitted_document_id ? (
                        <div className="space-y-0.5">
                          <span className="text-[#246B52] font-semibold flex items-center gap-1">
                            <FileCheck2 className="w-3.5 h-3.5" /> Evidence Linked
                          </span>
                          <span className="text-[10px] text-[#8E9B93]">
                            On {new Date(ob.submitted_at || '').toLocaleDateString()}
                          </span>
                        </div>
                      ) : (
                        <span className="italic text-[#8E9B93]">No evidence uploaded</span>
                      )}

                      {ob.deficiency_reason && (
                        <div className="mt-1 text-[11px] text-[#B42318] font-medium bg-red-50 p-1.5 rounded border border-red-200">
                          Deficiency: {ob.deficiency_reason}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Institutional Submit Evidence Trigger */}
                        {isInstitution && ob.status !== 'VERIFIED' && ob.status !== 'CLOSED' && (
                          <button
                            onClick={() => {
                              setSelectedForEvidence(ob);
                              setFormError(null);
                            }}
                            className="px-2.5 py-1 text-xs bg-[#EEF4F2] text-[#246B52] border border-[#C8DBD3] hover:bg-[#246B52] hover:text-white rounded font-medium transition-colors flex items-center gap-1"
                          >
                            <Upload className="w-3 h-3" /> Submit Curing Evidence
                          </button>
                        )}

                        {/* Regulatory Officer Verification Trigger */}
                        {canVerify && ob.status === 'SUBMITTED' && (
                          <button
                            onClick={() => {
                              setSelectedForVerification(ob);
                              setFormError(null);
                            }}
                            className="px-2.5 py-1 text-xs bg-[#246B52] text-white hover:bg-[#1D5743] rounded font-medium transition-colors flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Verify Record
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {data && data.pages > 1 && (
          <div className="px-4 py-3 border-t border-[#DCE2DC] bg-[#F6F7F5] flex items-center justify-between text-xs text-[#59655E]">
            <div>
              Showing Page <span className="font-semibold text-[#202923]">{data.page}</span> of{' '}
              <span className="font-semibold text-[#202923]">{data.pages}</span> ({data.total} Total Records)
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 bg-white border border-[#DCE2DC] rounded disabled:opacity-50 hover:bg-neutral-50 flex items-center gap-1 font-medium"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <button
                disabled={page >= data.pages}
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                className="px-2.5 py-1 bg-white border border-[#DCE2DC] rounded disabled:opacity-50 hover:bg-neutral-50 flex items-center gap-1 font-medium"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal 1: Submit Supporting Document Evidence */}
      {selectedForEvidence && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-[#DCE2DC] rounded max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-[#202923]">Submit Undertaking Evidence</h3>
            <p className="text-xs text-[#59655E]">
              Attaching document to covenant:{' '}
              <span className="font-semibold text-[#202923]">
                {formatObligationType(selectedForEvidence.obligation_type)}
              </span>
            </p>

            <form onSubmit={handleSubmitEvidence} className="space-y-4">
              <div>
                <label htmlFor="evidence-doc-id" className="block text-xs font-semibold text-[#202923] uppercase tracking-wider mb-1">
                  Document Reference UUID
                </label>
                <input
                  id="evidence-doc-id"
                  type="text"
                  placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                  value={evidenceDocId}
                  onChange={(e) => setEvidenceDocId(e.target.value)}
                  className="w-full text-xs p-2 border border-[#DCE2DC] rounded focus:outline-none focus:ring-1 focus:ring-[#246B52]"
                />
                <span className="text-[10px] text-[#8E9B93] mt-1 block">
                  Reference an existing document uploaded via the Document Registry.
                </span>
              </div>

              <div>
                <label htmlFor="submission-notes" className="block text-xs font-semibold text-[#202923] uppercase tracking-wider mb-1">
                  Institution Submission Notes
                </label>
                <textarea
                  id="submission-notes"
                  rows={3}
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  placeholder="Provide context regarding the cured deficiency or updated covenant compliance..."
                  className="w-full text-xs p-2 border border-[#DCE2DC] rounded focus:outline-none focus:ring-1 focus:ring-[#246B52]"
                />
              </div>

              {formError && (
                <p className="text-xs text-[#B42318] font-medium">{formError}</p>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-[#DCE2DC]">
                <button
                  type="button"
                  onClick={() => setSelectedForEvidence(null)}
                  className="px-3 py-1.5 text-xs text-[#59655E] hover:bg-neutral-100 rounded font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitEvidenceMutation.isPending}
                  className="px-4 py-1.5 text-xs bg-[#246B52] hover:bg-[#1D5743] text-white font-medium rounded transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitEvidenceMutation.isPending ? 'Submitting...' : 'Confirm Submission'}
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Regulatory Verification Decision */}
      {selectedForVerification && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-[#DCE2DC] rounded max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-[#202923]">Execute Regulatory Verification</h3>
            <p className="text-xs text-[#59655E]">
              Reviewing evidence submitted for{' '}
              <span className="font-semibold text-[#202923]">
                {formatObligationType(selectedForVerification.obligation_type)}
              </span>
            </p>

            <form onSubmit={handleExecuteVerification} className="space-y-4">
              <div>
                <label htmlFor="verify-outcome" className="block text-xs font-semibold text-[#202923] uppercase tracking-wider mb-1">
                  Determination Decision
                </label>
                <select
                  id="verify-outcome"
                  value={verifyOutcome}
                  onChange={(e) => setVerifyOutcome(e.target.value as any)}
                  className="w-full text-xs p-2 border border-[#DCE2DC] rounded focus:outline-none focus:ring-1 focus:ring-[#246B52]"
                >
                  <option value="VERIFY">Approve & Mark Verified (Compliant)</option>
                  <option value="FLAG_DEFICIENCY">Flag Deficiency & Return to Institution</option>
                  <option value="CLOSE">Administrative Closure (Procedural)</option>
                </select>
              </div>

              {verifyOutcome === 'FLAG_DEFICIENCY' && (
                <div>
                  <label htmlFor="deficiency-reason" className="block text-xs font-semibold text-[#B42318] uppercase tracking-wider mb-1">
                    Mandatory Statutory Deficiency Reason (Min 10 chars)
                  </label>
                  <textarea
                    id="deficiency-reason"
                    rows={3}
                    value={deficiencyReason}
                    onChange={(e) => setDeficiencyReason(e.target.value)}
                    placeholder="Clearly articulate why the submitted evidence fails regulatory criteria..."
                    className="w-full text-xs p-2 border border-[#F6CBC5] bg-[#FDF0EE] rounded focus:outline-none focus:ring-1 focus:ring-[#B42318]"
                  />
                </div>
              )}

              <div>
                <label htmlFor="verification-remarks" className="block text-xs font-semibold text-[#202923] uppercase tracking-wider mb-1">
                  Officer Inspection Remarks
                </label>
                <textarea
                  id="verification-remarks"
                  rows={2}
                  value={verificationRemarks}
                  onChange={(e) => setVerificationRemarks(e.target.value)}
                  placeholder="Optional internal remarks or directives..."
                  className="w-full text-xs p-2 border border-[#DCE2DC] rounded focus:outline-none focus:ring-1 focus:ring-[#246B52]"
                />
              </div>

              {formError && (
                <p className="text-xs text-[#B42318] font-medium">{formError}</p>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-[#DCE2DC]">
                <button
                  type="button"
                  onClick={() => setSelectedForVerification(null)}
                  className="px-3 py-1.5 text-xs text-[#59655E] hover:bg-neutral-100 rounded font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifyObligationMutation.isPending}
                  className="px-4 py-1.5 text-xs bg-[#246B52] hover:bg-[#1D5743] text-white font-medium rounded transition-colors disabled:opacity-50"
                >
                  {verifyObligationMutation.isPending ? 'Recording Decision...' : 'Commit Determination'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceTrackingPage;