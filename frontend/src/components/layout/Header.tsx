// frontend/src/components/layout/Header.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Bell,
  ChevronRight,
  User as UserIcon,
  LogOut,
  Shield,
  Building,
  MapPin,
  Check,
  AlertTriangle,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import axios from 'axios';

interface NotificationItem {
  id: string;
  notification_type: string;
  message: string;
  scheduled_at: string;
  is_read: boolean;
}

const ROUTE_LABELS: Record<string, string> = {
  applications: 'Applications',
  workflow: 'Workflow Monitor',
  evc: 'EVC Scheduling',
  compliance: 'Institutional Compliance',
  documents: 'Document Validity',
  escalations: 'Escalations & Pendency',
  reports: 'Reports & Analytics',
  audit: 'Audit Trail',
};

const formatRoleLabel = (role: string = ''): string => {
  return role
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const Header: React.FC<{ onMobileMenuToggle?: () => void }> = ({
  onMobileMenuToggle,
}) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click or Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setNotificationsOpen(false);
        setProfileOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch pending notifications
  const { data: notifications = [], refetch: refetchNotifs } = useQuery<NotificationItem[]>({
    queryKey: ['notifications', 'preview'],
    queryFn: async () => {
      try {
        const res = await axios.get('/api/v1/notifications?limit=5', { withCredentials: true });
        return res.data?.items || [];
      } catch {
        return [];
      }
    },
    refetchInterval: 30000,
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAllAsRead = async () => {
    try {
      await axios.post('/api/v1/notifications/mark-read', {}, { withCredentials: true });
      refetchNotifs();
    } catch {
      // Graceful fallback
    }
  };

  // Build dynamic breadcrumb paths
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => {
    const url = `/${pathSegments.slice(0, index + 1).join('/')}`;
    const isLast = index === pathSegments.length - 1;
    const label = ROUTE_LABELS[segment] || segment.toUpperCase();
    return { url, label, isLast };
  });

  return (
    <header className="h-16 bg-[#FFFFFF] border-b border-[#DCE2DC] flex items-center justify-between px-4 sm:px-6 lg:px-8 z-20 shrink-0">
      {/* Left: Mobile Toggle & Contextual Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onMobileMenuToggle}
          className="lg:hidden p-1.5 text-[#59655E] hover:text-[#202923] hover:bg-[#F6F7F5] rounded transition-colors focus:outline-none focus:ring-2 focus:ring-[#246B52]"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <nav aria-label="Breadcrumb" className="flex items-center space-x-1.5 text-xs sm:text-sm text-[#59655E] truncate">
          <Link
            to="/"
            className="hover:text-[#246B52] transition-colors font-medium text-[#202923]"
          >
            ComplianceFlow
          </Link>
          {breadcrumbs.map((crumb) => (
            <React.Fragment key={crumb.url}>
              <ChevronRight className="w-3.5 h-3.5 text-[#8E9B93] shrink-0" aria-hidden="true" />
              {crumb.isLast ? (
                <span className="font-semibold text-[#202923] truncate" aria-current="page">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.url}
                  className="hover:text-[#246B52] transition-colors truncate"
                >
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right: Actions, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* User Scope Metadata Pill (Desktop) */}
        {user?.region_id && (
          <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#246B52] bg-[#EEF4F2] border border-[#C8DBD3] rounded">
            <MapPin className="w-3 h-3" />
            Regional Scope Active
          </span>
        )}

        {user?.institution_id && (
          <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#1E4D8A] bg-[#EBF3FA] border border-[#BDD7F1] rounded">
            <Building className="w-3 h-3" />
            Institution Portal
          </span>
        )}

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setNotificationsOpen((prev) => !prev)}
            className="relative p-2 text-[#59655E] hover:text-[#202923] hover:bg-[#F6F7F5] rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#246B52]"
            aria-label={`Notifications, ${unreadCount} unread`}
            aria-expanded={notificationsOpen}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B42318] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#B42318]" />
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#FFFFFF] border border-[#DCE2DC] rounded shadow-lg overflow-hidden z-30">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#DCE2DC] bg-[#F6F7F5]">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#202923]">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-[#B42318] text-white rounded">
                      {unreadCount} New
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-[#246B52] hover:text-[#1D5743] font-medium flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Mark read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-[#DCE2DC]">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#59655E]">
                    No recent alerts or pending tasks.
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 text-xs flex gap-2.5 transition-colors ${
                        item.is_read ? 'bg-white' : 'bg-[#FAF3E8]/40'
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4 text-[#825300] shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[#202923] font-medium leading-tight">
                          {item.message}
                        </p>
                        <span className="text-[10px] text-[#59655E] mt-1 block">
                          {new Date(item.scheduled_at).toLocaleDateString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-[#DCE2DC] p-2 bg-[#F6F7F5] text-center">
                <Link
                  to="/escalations"
                  onClick={() => setNotificationsOpen(false)}
                  className="text-xs font-medium text-[#246B52] hover:underline"
                >
                  View all alerts & escalations
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Account / Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((prev) => !prev)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded hover:bg-[#F6F7F5] border border-transparent hover:border-[#DCE2DC] transition-all focus:outline-none focus:ring-2 focus:ring-[#246B52]"
            aria-label="User account menu"
            aria-expanded={profileOpen}
          >
            <div className="w-8 h-8 rounded bg-[#246B52] text-white flex items-center justify-center font-semibold text-xs tracking-wide">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="text-left hidden sm:block">
              <span className="text-xs font-semibold text-[#202923] block leading-tight max-w-[140px] truncate">
                {user?.full_name || 'Authenticated User'}
              </span>
              <span className="text-[10px] font-medium text-[#59655E] block leading-tight">
                {formatRoleLabel(user?.role)}
              </span>
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-[#FFFFFF] border border-[#DCE2DC] rounded shadow-lg overflow-hidden z-30">
              <div className="p-3 border-b border-[#DCE2DC] bg-[#F6F7F5]">
                <p className="text-xs font-semibold text-[#202923] truncate">
                  {user?.full_name}
                </p>
                <p className="text-[11px] text-[#59655E] truncate mt-0.5">{user?.email}</p>
                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-[#246B52] font-medium">
                  <Shield className="w-3 h-3" />
                  <span>{formatRoleLabel(user?.role)}</span>
                </div>
              </div>

              <div className="p-1">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-[#B42318] hover:bg-red-50 rounded flex items-center gap-2 font-medium transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign out of system
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;