// frontend/src/app/router.tsx
import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';

// ============================================================================
// Implemented Feature Modules (Mapped from src/features/)
// ============================================================================

// 1. Dashboard Module
const DashboardOverview = lazy(() =>
  import('../features/dashboard/DashboardOverview').then((m) => ({
    default: m.DashboardOverview,
  }))
);

// 2. Applications Module
const ApplicationsListPage = lazy(() =>
  import('../features/applications/ApplicationsListPage').then((m) => ({
    default: m.ApplicationsListPage,
  }))
);

const ApplicationDetailPage = lazy(() =>
  import('../features/applications/ApplicationDetailPage').then((m) => ({
    default: m.ApplicationDetailPage,
  }))
);

// 3. Compliance Module
const ComplianceTrackingPage = lazy(() =>
  import('../features/compliance/ComplianceTrackingPage').then((m) => ({
    default: m.ComplianceTrackingPage,
  }))
);

// 4. Workflow Module
const WorkflowMonitorPage = lazy(() =>
  import('../features/workflow/WorkflowMonitorPage').then((m) => ({
    default: m.WorkflowMonitorPage,
  }))
);

// ============================================================================
// Stubs for Modules Pending Implementation
// ============================================================================
interface ModuleStubProps {
  title: string;
  subtitle: string;
  code: string;
}

const ModuleStub: React.FC<ModuleStubProps> = ({ title, subtitle, code }) => (
  <div className="space-y-4 max-w-5xl mx-auto">
    <div className="border-b border-[#DCE2DC] pb-4">
      <div className="flex items-center gap-2">
        <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-[#EEF4F2] text-[#246B52] border border-[#C8DBD3] rounded">
          {code}
        </span>
        <h1 className="text-xl font-bold text-[#202923]">{title}</h1>
      </div>
      <p className="text-xs text-[#59655E] mt-1">{subtitle}</p>
    </div>

    <div className="bg-white border border-[#DCE2DC] rounded p-8 text-center shadow-xs">
      <div className="max-w-md mx-auto space-y-3">
        <div className="w-10 h-10 rounded-full bg-[#EEF4F2] text-[#246B52] flex items-center justify-center mx-auto font-bold text-sm">
          ✓
        </div>
        <h2 className="text-sm font-semibold text-[#202923]">Module Initialized & Route Bound</h2>
        <p className="text-xs text-[#59655E] leading-relaxed">
          This regulatory operational subsystem is registered. Implement the component under
          its respective feature directory to replace this placeholder.
        </p>
      </div>
    </div>
  </div>
);

const EVCSchedulingPage = () => (
  <ModuleStub
    title="Expert Visiting Committee (EVC) Scheduling"
    subtitle="Manage committee inspection queues, resolve date conflicts, and log visit reports."
    code="MOD-EVC"
  />
);

const DocumentValidityPage = () => (
  <ModuleStub
    title="Document Validity & Storage Registry"
    subtitle="Audit land lease deeds, structural safety certificates, and track automated expiry windows."
    code="MOD-DOCUMENTS"
  />
);

const EscalationsPage = () => (
  <ModuleStub
    title="Pendency Alerts & Regulatory Escalations"
    subtitle="Active SLA breach alerts routed across Level 1 (RO), Level 2 (Bureau), and Level 3 hierarchies."
    code="MOD-ESCALATIONS"
  />
);

const ReportsPage = () => (
  <ModuleStub
    title="Regulatory Reports & Analytics"
    subtitle="Regional ageing breakdowns, officer workload distribution, and formula-injection-safe CSV exports."
    code="MOD-REPORTS"
  />
);

const AuditTrailPage = () => (
  <ModuleStub
    title="Regulatory Audit Trail & Tamper-Evident Logs"
    subtitle="Immutable append-only activity records linked to correlation IDs, timestamps, and actors."
    code="MOD-AUDIT"
  />
);

const LoginPage = () => (
  <div className="min-h-screen bg-[#F6F7F5] flex flex-col justify-center items-center p-4">
    <div className="max-w-md w-full bg-white border border-[#DCE2DC] rounded p-6 shadow-sm space-y-4 text-center">
      <div className="w-10 h-10 bg-[#246B52] text-white rounded flex items-center justify-center font-bold text-sm mx-auto">
        CF
      </div>
      <div>
        <h1 className="text-lg font-bold text-[#202923]">AICTE ComplianceFlow</h1>
        <p className="text-xs text-[#59655E] mt-1">Single Sign-On & Administrative Portal Access</p>
      </div>
      <p className="text-xs text-[#59655E] bg-[#F6F7F5] p-3 rounded border border-[#DCE2DC]">
        Active session not detected. Authenticate via{' '}
        <code className="text-[#246B52] font-semibold">/api/v1/auth/login</code>.
      </p>
    </div>
  </div>
);

// ============================================================================
// Protected Layout Wrapper
// ============================================================================
const ProtectedLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F6F7F5] space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#246B52]" />
        <span className="text-xs font-medium text-[#59655E]">Validating regulatory session...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-[#F6F7F5] overflow-hidden">
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header onMobileMenuToggle={() => setMobileMenuOpen((prev) => !prev)} />
        <main className="flex-1 overflow-y-auto focus:outline-none p-4 sm:p-6 lg:p-8">
          <Suspense
            fallback={
              <div className="space-y-4 animate-pulse max-w-5xl mx-auto">
                <div className="h-6 bg-neutral-200 rounded w-1/4" />
                <div className="h-32 bg-neutral-200 rounded" />
                <div className="h-64 bg-neutral-200 rounded" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
};

// ============================================================================
// Router Definition
// ============================================================================
export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <ProtectedLayout />,
    children: [
      {
        index: true,
        element: <DashboardOverview />,
      },
      {
        path: 'applications',
        element: <ApplicationsListPage />,
      },
      {
        path: 'applications/:id',
        element: <ApplicationDetailPage />,
      },
      {
        path: 'workflow',
        element: <WorkflowMonitorPage />,
      },
      {
        path: 'compliance',
        element: <ComplianceTrackingPage />,
      },
      {
        path: 'evc',
        element: <EVCSchedulingPage />,
      },
      {
        path: 'documents',
        element: <DocumentValidityPage />,
      },
      {
        path: 'escalations',
        element: <EscalationsPage />,
      },
      {
        path: 'reports',
        element: <ReportsPage />,
      },
      {
        path: 'audit',
        element: <AuditTrailPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export default router;