// src/features/applications/ApplicationsListPage.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertTriangle,
  Building2,
  FileSpreadsheet,
} from 'lucide-react';
import { useApplicationsList } from './api';
import { ApplicationCategory, ApplicationStatus } from './types';
import StatusBadge from '../../components/common/StatusBadge';

export const ApplicationsListPage: React.FC = () => {
  const [page, setPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  const { data, isLoading, isError, refetch } = useApplicationsList({
    page,
    size: 15,
    search: searchTerm || undefined,
    status: statusFilter || undefined,
    category: categoryFilter || undefined,
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    refetch();
  };

  const formatCategory = (cat: ApplicationCategory) => {
    const labels: Record<ApplicationCategory, string> = {
      NEW_INSTITUTE: 'New Technical Institute',
      EXTENSION_OF_APPROVAL: 'Extension of Approval (EoA)',
      INCREASE_IN_INTAKE: 'Increase in Intake',
      NEW_PROGRAM: 'Introduction of New Program',
    };
    return labels[cat] || cat;
  };

  return (
    <div className="space-y-6">
      {/* Header & Description */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#DCE2DC] pb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#202923]">Institutional Applications</h1>
          <p className="text-sm text-[#59655E] mt-1">
            Track stage pendency, regulatory deadlines, and procedural scrutinies
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#DCE2DC] rounded p-4 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-[#59655E] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search reference (e.g. AICTE-2026-EOA) or institution..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-[#DCE2DC] rounded focus:outline-none focus:ring-1 focus:ring-[#246B52]"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-1.5 text-sm bg-white border border-[#DCE2DC] rounded focus:outline-none focus:ring-1 focus:ring-[#246B52] text-[#202923]"
            >
              <option value="">All Application Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_SCRUTINY">Under Scrutiny</option>
              <option value="SCRUTINY_DEFICIENT">Scrutiny Deficient</option>
              <option value="EVC_SCHEDULED">EVC Scheduled</option>
              <option value="EVC_COMPLETED">EVC Completed</option>
              <option value="SAC_SHC_REVIEW">SAC / SHC Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-1.5 text-sm bg-white border border-[#DCE2DC] rounded focus:outline-none focus:ring-1 focus:ring-[#246B52] text-[#202923]"
            >
              <option value="">All Approval Categories</option>
              <option value="NEW_INSTITUTE">New Technical Institute</option>
              <option value="EXTENSION_OF_APPROVAL">Extension of Approval</option>
              <option value="INCREASE_IN_INTAKE">Increase in Intake</option>
              <option value="NEW_PROGRAM">New Program Addition</option>
            </select>
          </div>
        </form>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-[#DCE2DC] rounded shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-neutral-100 rounded animate-pulse" />
            ))}
          </div>
        ) : isError || !data ? (
          <div className="p-8 text-center text-sm text-[#B42318] bg-red-50/50">
            Failed to load application registry from API. Ensure backend connectivity.
          </div>
        ) : data.items.length === 0 ? (
          <div className="p-12 text-center text-[#59655E]">
            <FileSpreadsheet className="w-10 h-10 mx-auto text-[#8E9B93] mb-3" />
            <p className="text-sm font-medium text-[#202923]">No applications match your criteria.</p>
            <p className="text-xs mt-1">Adjust search terms or clear applied status filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#202923] divide-y divide-[#DCE2DC]">
              <thead className="bg-[#F6F7F5] text-xs font-semibold text-[#59655E] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Reference No.</th>
                  <th className="px-4 py-3">Institution</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Current Stage</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Stage Pendency</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE2DC] bg-white">
                {data.items.map((app) => (
                  <tr key={app.id} className="hover:bg-[#F6F7F5]/60 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-xs text-[#1E4D8A]">
                      {app.application_ref}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#202923] truncate max-w-xs">
                        {app.institution_name || 'Unassigned / Default'}
                      </div>
                      <div className="text-[11px] text-[#59655E]">
                        Submitted {new Date(app.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#59655E]">
                      {formatCategory(app.category)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-xs bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded border border-neutral-200">
                        {app.current_stage}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={app.status} size="sm" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs">
                        {app.is_overdue ? (
                          <span className="text-[#B42318] flex items-center gap-1 font-semibold">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {app.days_at_current_stage}d (Overdue)
                          </span>
                        ) : (
                          <span className="text-[#59655E] flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[#246B52]" />
                            {app.days_at_current_stage}d at stage
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/applications/${app.id}`}
                        className="text-xs font-semibold text-[#246B52] hover:text-[#1D5743] hover:underline"
                      >
                        Inspect & Process →
                      </Link>
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
              <span className="font-semibold text-[#202923]">{data.pages}</span> ({data.total} Total)
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
    </div>
  );
};

export default ApplicationsListPage;