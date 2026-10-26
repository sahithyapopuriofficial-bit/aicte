// frontend/src/components/layout/Sidebar.tsx
import React, { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileSpreadsheet,
  GitMerge,
  CalendarDays,
  ShieldCheck,
  FileCheck2,
  AlertOctagon,
  BarChart3,
  History,
  Building2,
  X,
  LucideIcon,
} from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';

interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
  allowedRoles: string[];
}

const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    name: 'Overview',
    href: '/',
    icon: LayoutDashboard,
    allowedRoles: [
      'SYSTEM_ADMIN',
      'BUREAU_OFFICER',
      'REGIONAL_OFFICER',
      'COMMITTEE_MEMBER',
      'INSTITUTIONAL_ADMIN',
      'COMPLIANCE_VERIFICATION_OFFICER',
    ],
  },
  {
    name: 'Applications',
    href: '/applications',
    icon: FileSpreadsheet,
    allowedRoles: [
      'SYSTEM_ADMIN',
      'BUREAU_OFFICER',
      'REGIONAL_OFFICER',
      'INSTITUTIONAL_ADMIN',
    ],
  },
  {
    name: 'Workflow Monitor',
    href: '/workflow',
    icon: GitMerge,
    allowedRoles: ['SYSTEM_ADMIN', 'BUREAU_OFFICER', 'REGIONAL_OFFICER'],
  },
  {
    name: 'EVC Scheduling',
    href: '/evc',
    icon: CalendarDays,
    allowedRoles: [
      'SYSTEM_ADMIN',
      'BUREAU_OFFICER',
      'REGIONAL_OFFICER',
      'COMMITTEE_MEMBER',
      'INSTITUTIONAL_ADMIN',
    ],
  },
  {
    name: 'Institutional Compliance',
    href: '/compliance',
    icon: ShieldCheck,
    allowedRoles: [
      'SYSTEM_ADMIN',
      'BUREAU_OFFICER',
      'REGIONAL_OFFICER',
      'COMPLIANCE_VERIFICATION_OFFICER',
      'INSTITUTIONAL_ADMIN',
    ],
  },
  {
    name: 'Document Validity',
    href: '/documents',
    icon: FileCheck2,
    allowedRoles: [
      'SYSTEM_ADMIN',
      'BUREAU_OFFICER',
      'REGIONAL_OFFICER',
      'COMPLIANCE_VERIFICATION_OFFICER',
      'INSTITUTIONAL_ADMIN',
    ],
  },
  {
    name: 'Escalations & Alerts',
    href: '/escalations',
    icon: AlertOctagon,
    allowedRoles: [
      'SYSTEM_ADMIN',
      'BUREAU_OFFICER',
      'REGIONAL_OFFICER',
      'COMPLIANCE_VERIFICATION_OFFICER',
    ],
  },
  {
    name: 'Reports & Analytics',
    href: '/reports',
    icon: BarChart3,
    allowedRoles: [
      'SYSTEM_ADMIN',
      'BUREAU_OFFICER',
      'REGIONAL_OFFICER',
      'INSTITUTIONAL_ADMIN',
    ],
  },
  {
    name: 'Audit Trail',
    href: '/audit',
    icon: History,
    allowedRoles: ['SYSTEM_ADMIN', 'BUREAU_OFFICER', 'REGIONAL_OFFICER'],
  },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  mobileOpen = false,
  onMobileClose,
}) => {
  const { user } = useAuth();
  const location = useLocation();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Auto-close mobile drawer when location updates
  useEffect(() => {
    if (mobileOpen && onMobileClose) {
      onMobileClose();
    }
  }, [location.pathname]);

  // Handle keyboard escape closure
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen && onMobileClose) {
        onMobileClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, onMobileClose]);

  // Filter routes according to the active role
  const userRole = user?.role || '';
  const filteredNavItems = NAVIGATION_ITEMS.filter((item) =>
    item.allowedRoles.includes(userRole)
  );

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#FFFFFF] border-r border-[#DCE2DC] select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-[#DCE2DC] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#246B52] flex items-center justify-center text-white shadow-xs">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight text-[#202923] block leading-none">
              AICTE ComplianceFlow
            </span>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-[#59655E] block mt-1">
              Approval & SLA Engine
            </span>
          </div>
        </div>

        {/* Mobile Dismiss Button */}
        {onMobileClose && (
          <button
            type="button"
            onClick={onMobileClose}
            className="lg:hidden p-1.5 text-[#59655E] hover:text-[#202923] hover:bg-[#F6F7F5] rounded transition-colors"
            aria-label="Close navigation sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav
        className="flex-1 overflow-y-auto px-3 py-4 space-y-1 focus:outline-none"
        aria-label="Sidebar Primary Navigation"
      >
        <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-[#8E9B93]">
          Administrative Modules
        </div>

        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isExactActive =
            item.href === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.href);

          return (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/'}
              className={({ isActive }) => {
                const activeState = isActive || isExactActive;
                return [
                  'group flex items-center gap-3 px-3 py-2 text-xs font-medium rounded transition-all duration-150',
                  activeState
                    ? 'bg-[#EEF4F2] text-[#246B52] font-semibold border border-[#C8DBD3]'
                    : 'text-[#59655E] hover:bg-[#F6F7F5] hover:text-[#202923] border border-transparent',
                ].join(' ');
              }}
              aria-current={isExactActive ? 'page' : undefined}
            >
              {({ isActive }) => {
                const activeState = isActive || isExactActive;
                return (
                  <>
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        activeState
                          ? 'text-[#246B52]'
                          : 'text-[#8E9B93] group-hover:text-[#202923]'
                      }`}
                      aria-hidden="true"
                    />
                    <span className="truncate">{item.name}</span>
                  </>
                );
              }}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer System Status Banner */}
      <div className="p-4 border-t border-[#DCE2DC] bg-[#F6F7F5] shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#237547]" aria-hidden="true" />
          <span className="text-[11px] font-semibold text-[#202923]">
            SLA Monitor Online
          </span>
        </div>
        <p className="text-[10px] text-[#59655E] mt-1">
          Automated 15-min sweep cycle active.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 h-full">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop and Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation drawer"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-neutral-900/50 backdrop-blur-xs transition-opacity"
            onClick={onMobileClose}
            aria-hidden="true"
          />

          {/* Drawer Element */}
          <div
            ref={drawerRef}
            className="relative flex-1 flex flex-col max-w-xs w-full bg-[#FFFFFF] shadow-xl z-50 focus:outline-none"
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;