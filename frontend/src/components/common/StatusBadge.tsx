// frontend/src/components/common/StatusBadge.tsx
import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  FileSearch,
  Calendar,
  AlertOctagon,
  ShieldAlert,
  FileCheck,
  RotateCcw,
  MinusCircle,
  LucideIcon,
} from 'lucide-react';

export type StatusType =
  // Application & General Statuses
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_SCRUTINY'
  | 'SCRUTINY'
  | 'SCRUTINY_DEFICIENT'
  | 'DEFICIENT'
  | 'DEFICIENCY_REPORTED'
  | 'EVC_REQUIRED'
  | 'EVC_SCHEDULED'
  | 'EVC_COMPLETED'
  | 'SAC_SHC_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'LOCKED'
  // Compliance Obligation Statuses
  | 'NOT_YET_DUE'
  | 'DUE_SOON'
  | 'AWAITING_SUBMISSION'
  | 'UNDER_VERIFICATION'
  | 'VERIFIED'
  | 'OVERDUE'
  | 'CLOSED'
  // EVC Scheduling
  | 'PENDING'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'RESCHEDULED'
  | 'CANCELLED'
  // Document Validity
  | 'EXPIRED'
  // Escalation Tiers
  | 'LEVEL_1'
  | 'LEVEL_2'
  | 'LEVEL_3'
  | string;

interface BadgeConfig {
  label: string;
  icon: LucideIcon;
  badgeClass: string;
  iconClass: string;
}

const STATUS_REGISTRY: Record<string, BadgeConfig> = {
  // Positive / Approved States (Dark Green / Forest Accent)
  APPROVED: {
    label: 'Approved',
    icon: CheckCircle2,
    badgeClass: 'bg-[#EBF5F0] text-[#1E5E3A] border-[#C2E2D1]',
    iconClass: 'text-[#1E5E3A]',
  },
  VERIFIED: {
    label: 'Verified & Compliant',
    icon: FileCheck,
    badgeClass: 'bg-[#EBF5F0] text-[#1E5E3A] border-[#C2E2D1]',
    iconClass: 'text-[#1E5E3A]',
  },
  COMPLETED: {
    label: 'Completed',
    icon: CheckCircle2,
    badgeClass: 'bg-[#EBF5F0] text-[#1E5E3A] border-[#C2E2D1]',
    iconClass: 'text-[#1E5E3A]',
  },
  EVC_COMPLETED: {
    label: 'EVC Completed',
    icon: CheckCircle2,
    badgeClass: 'bg-[#EBF5F0] text-[#1E5E3A] border-[#C2E2D1]',
    iconClass: 'text-[#1E5E3A]',
  },
  ACTIVE: {
    label: 'Active',
    icon: CheckCircle2,
    badgeClass: 'bg-[#EBF5F0] text-[#1E5E3A] border-[#C2E2D1]',
    iconClass: 'text-[#1E5E3A]',
  },
  CLOSED: {
    label: 'Closed',
    icon: CheckCircle2,
    badgeClass: 'bg-neutral-100 text-neutral-700 border-neutral-300',
    iconClass: 'text-neutral-600',
  },

  // Active Processing / Informational States (Slate & Technical Teal)
  SUBMITTED: {
    label: 'Submitted',
    icon: Clock,
    badgeClass: 'bg-[#EEF4F2] text-[#1D5743] border-[#C8DBD3]',
    iconClass: 'text-[#1D5743]',
  },
  UNDER_SCRUTINY: {
    label: 'Under Scrutiny',
    icon: FileSearch,
    badgeClass: 'bg-[#EBF3FA] text-[#1E4D8A] border-[#BDD7F1]',
    iconClass: 'text-[#1E4D8A]',
  },
  SCRUTINY: {
    label: 'Scrutiny Stage',
    icon: FileSearch,
    badgeClass: 'bg-[#EBF3FA] text-[#1E4D8A] border-[#BDD7F1]',
    iconClass: 'text-[#1E4D8A]',
  },
  UNDER_VERIFICATION: {
    label: 'Under Verification',
    icon: FileSearch,
    badgeClass: 'bg-[#EBF3FA] text-[#1E4D8A] border-[#BDD7F1]',
    iconClass: 'text-[#1E4D8A]',
  },
  SAC_SHC_REVIEW: {
    label: 'SAC / SHC Review',
    icon: Clock,
    badgeClass: 'bg-[#F2EFF8] text-[#553C9A] border-[#D6CCE8]',
    iconClass: 'text-[#553C9A]',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    icon: Clock,
    badgeClass: 'bg-[#EBF3FA] text-[#1E4D8A] border-[#BDD7F1]',
    iconClass: 'text-[#1E4D8A]',
  },

  // Schedules & Calendar Actions
  EVC_REQUIRED: {
    label: 'EVC Required',
    icon: Calendar,
    badgeClass: 'bg-[#F4F1EA] text-[#6E4F18] border-[#DFD3BE]',
    iconClass: 'text-[#6E4F18]',
  },
  EVC_SCHEDULED: {
    label: 'EVC Scheduled',
    icon: Calendar,
    badgeClass: 'bg-[#EBF5F0] text-[#1D5743] border-[#C2E2D1]',
    iconClass: 'text-[#1D5743]',
  },
  SCHEDULED: {
    label: 'Scheduled',
    icon: Calendar,
    badgeClass: 'bg-[#EEF4F2] text-[#1D5743] border-[#C8DBD3]',
    iconClass: 'text-[#1D5743]',
  },
  RESCHEDULED: {
    label: 'Rescheduled',
    icon: RotateCcw,
    badgeClass: 'bg-[#FAF3E8] text-[#825300] border-[#EED7B0]',
    iconClass: 'text-[#825300]',
  },

  // Warnings, Cautions & Pendencies
  DUE_SOON: {
    label: 'Due Soon',
    icon: AlertTriangle,
    badgeClass: 'bg-[#FAF3E8] text-[#825300] border-[#EED7B0]',
    iconClass: 'text-[#825300]',
  },
  AWAITING_SUBMISSION: {
    label: 'Awaiting Evidence',
    icon: Clock,
    badgeClass: 'bg-[#FAF3E8] text-[#825300] border-[#EED7B0]',
    iconClass: 'text-[#825300]',
  },
  PENDING: {
    label: 'Pending Review',
    icon: Clock,
    badgeClass: 'bg-neutral-100 text-neutral-700 border-neutral-300',
    iconClass: 'text-neutral-600',
  },
  NOT_YET_DUE: {
    label: 'Not Yet Due',
    icon: MinusCircle,
    badgeClass: 'bg-neutral-100 text-neutral-700 border-neutral-300',
    iconClass: 'text-neutral-500',
  },

  // Deficiencies, Breaches, and Rejections (Strict WCAG Contrast Red/Amber)
  DEFICIENT: {
    label: 'Deficiency Flagged',
    icon: AlertTriangle,
    badgeClass: 'bg-[#FDF0EE] text-[#911D13] border-[#F6CBC5]',
    iconClass: 'text-[#911D13]',
  },
  SCRUTINY_DEFICIENT: {
    label: 'Scrutiny Deficient',
    icon: AlertTriangle,
    badgeClass: 'bg-[#FDF0EE] text-[#911D13] border-[#F6CBC5]',
    iconClass: 'text-[#911D13]',
  },
  DEFICIENCY_REPORTED: {
    label: 'Deficiency Reported',
    icon: AlertTriangle,
    badgeClass: 'bg-[#FDF0EE] text-[#911D13] border-[#F6CBC5]',
    iconClass: 'text-[#911D13]',
  },
  OVERDUE: {
    label: 'SLA Overdue',
    icon: AlertOctagon,
    badgeClass: 'bg-[#FDF0EE] text-[#911D13] border-[#F6CBC5]',
    iconClass: 'text-[#911D13]',
  },
  EXPIRED: {
    label: 'Expired Document',
    icon: AlertOctagon,
    badgeClass: 'bg-[#FDF0EE] text-[#911D13] border-[#F6CBC5]',
    iconClass: 'text-[#911D13]',
  },
  REJECTED: {
    label: 'Rejected',
    icon: XCircle,
    badgeClass: 'bg-[#FDF0EE] text-[#911D13] border-[#F6CBC5]',
    iconClass: 'text-[#911D13]',
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: XCircle,
    badgeClass: 'bg-neutral-100 text-neutral-700 border-neutral-300',
    iconClass: 'text-neutral-600',
  },
  LOCKED: {
    label: 'Account Locked',
    icon: XCircle,
    badgeClass: 'bg-[#FDF0EE] text-[#911D13] border-[#F6CBC5]',
    iconClass: 'text-[#911D13]',
  },
  SUSPENDED: {
    label: 'Suspended',
    icon: XCircle,
    badgeClass: 'bg-[#FDF0EE] text-[#911D13] border-[#F6CBC5]',
    iconClass: 'text-[#911D13]',
  },

  // Hierarchical Escalation Tiers
  LEVEL_1: {
    label: 'Escalation: Level 1 (RO)',
    icon: AlertTriangle,
    badgeClass: 'bg-[#FAF3E8] text-[#825300] border-[#EED7B0]',
    iconClass: 'text-[#825300]',
  },
  LEVEL_2: {
    label: 'Escalation: Level 2 (Bureau)',
    icon: AlertOctagon,
    badgeClass: 'bg-[#FDF0EE] text-[#911D13] border-[#F6CBC5]',
    iconClass: 'text-[#911D13]',
  },
  LEVEL_3: {
    label: 'Escalation: Level 3 (Member Secy)',
    icon: ShieldAlert,
    badgeClass: 'bg-[#55100B] text-[#FFFFFF] border-[#380B07]',
    iconClass: 'text-[#FFFFFF]',
  },
};

interface StatusBadgeProps {
  status: StatusType;
  customLabel?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  customLabel,
  size = 'md',
  className = '',
}) => {
  const normalizedKey = (status || '').toUpperCase().trim();
  const config = STATUS_REGISTRY[normalizedKey] || {
    label: customLabel || status || 'Unknown',
    icon: MinusCircle,
    badgeClass: 'bg-neutral-100 text-neutral-700 border-neutral-300',
    iconClass: 'text-neutral-500',
  };

  const IconComponent = config.icon;
  const displayLabel = customLabel || config.label;

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-xs gap-1'
      : 'px-2.5 py-1 text-xs gap-1.5 font-medium';

  const iconSizes = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  return (
    <span
      className={`inline-flex items-center rounded border tracking-wide whitespace-nowrap select-none ${sizeClasses} ${config.badgeClass} ${className}`}
      role="status"
      aria-label={`Status: ${displayLabel}`}
    >
      <IconComponent
        className={`${iconSizes} ${config.iconClass} shrink-0`}
        aria-hidden="true"
      />
      <span>{displayLabel}</span>
    </span>
  );
};

export default StatusBadge;