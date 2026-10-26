// frontend/src/App.jsx
import React, { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  ShieldCheck,
  CalendarCheck,
  FolderArchive,
  BarChart3,
  Bell,
  Settings,
  Search,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  ArrowLeft,
  Download,
  Calendar,
  Eye,
  LogOut,
  Sparkles,
  Lock,
  Mail,
  UserCheck,
  Building,
  Check,
  FileCheck,
  Upload,
  Filter,
  Users,
  Shield,
  FileSpreadsheet,
  AlertOctagon,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [activeTab, setActiveTab] = useState('All');
  const [selectedApp, setSelectedApp] = useState({
    id: 'AICTE-APP-2025-001',
    name: 'ABC College of Engineering',
    type: 'New Approval',
    discipline: 'Engineering & Technology',
    status: 'In Progress',
    currentStage: 'EVC',
    submittedOn: '10 Mar 2025',
    region: 'Western Region',
    address: 'Survey No. 121, Knowledge Park, Pune - 411001',
    institutionType: 'Private'
  });

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'applications', label: 'Applications', icon: FileText },
    { id: 'compliance', label: 'Compliance', icon: ShieldCheck },
    { id: 'evc', label: 'EVC Scheduling', icon: CalendarCheck },
    { id: 'documents', label: 'Documents', icon: FolderArchive },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: 3 },
    { id: 'admin', label: 'Administration', icon: Settings },
  ];

  const applications = [
    { id: 'AICTE-APP-2025-001', name: 'ABC College of Engineering', type: 'New Approval', stage: 'EVC', date: '10 Mar 2025', status: 'In Progress' },
    { id: 'AICTE-APP-2025-002', name: 'XYZ Technical Institute', type: 'Extension of Approval', stage: 'Scrutiny', date: '05 Mar 2025', status: 'Under Process' },
    { id: 'AICTE-APP-2025-003', name: 'PQR Institute of Technology', type: 'New Approval', stage: 'SAC/SHC', date: '28 Feb 2025', status: 'In Progress' },
    { id: 'AICTE-APP-2025-004', name: 'LMN Polytechnic', type: 'Extension of Approval', stage: 'EVC', date: '20 Feb 2025', status: 'On Hold' },
    { id: 'AICTE-APP-2025-005', name: 'DEF Engineering College', type: 'New Approval', stage: 'Final Approval', date: '15 Feb 2025', status: 'Approved' }
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
      case 'Verified':
        return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200"><CheckCircle2 className="h-3 w-3" /> {status}</span>;
      case 'In Progress':
      case 'Scheduled':
        return <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200"><Clock className="h-3 w-3" /> {status}</span>;
      case 'Under Process':
      case 'Pending Review':
        return <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200"><Clock className="h-3 w-3" /> {status}</span>;
      case 'On Hold':
      case 'Deficient':
      case 'Overdue':
        return <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 border border-red-200"><AlertTriangle className="h-3 w-3" /> {status}</span>;
      default:
        return <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">{status}</span>;
    }
  };

  // --- SCREEN: LOGIN ---
  if (currentScreen === 'login') {
    return (
      <div className="flex min-h-screen bg-slate-900 font-sans">
        <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0c1f38] via-[#08182b] to-[#040d1a] p-12 text-white lg:flex">
          <div className="z-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 font-bold text-slate-950 shadow-lg">
              AICTE
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">AICTE</h2>
              <p className="text-xs text-slate-400">All India Council for Technical Education</p>
            </div>
          </div>

          <div className="z-10 my-auto max-w-lg space-y-4">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              AICTE ComplianceFlow
            </h1>
            <p className="text-sm font-medium text-amber-400">
              Automated Approvals | Real-time Monitoring | Greater Transparency
            </p>
            <p className="text-sm leading-relaxed text-slate-300">
              A unified digital regulatory platform for end-to-end automation of AICTE approval workflows and institutional statutory compliance.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-6">
              {[
                { title: 'Workflow Automation', icon: Sparkles },
                { title: 'Compliance Monitoring', icon: ShieldCheck },
                { title: 'Smart Alerts', icon: Bell },
                { title: 'Transparent & Accountable', icon: CheckCircle2 }
              ].map((feat, i) => (
                <div key={i} className="flex items-center gap-2.5 rounded-lg border border-slate-700/50 bg-slate-800/40 p-3 backdrop-blur-sm">
                  <feat.icon className="h-4 w-4 text-teal-400" />
                  <span className="text-xs font-medium text-slate-200">{feat.title}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="z-10 text-xs text-slate-500">
            © 2026 All India Council for Technical Education. All rights reserved.
          </div>
        </div>

        <div className="flex w-full items-center justify-center bg-white p-8 lg:w-1/2">
          <div className="w-full max-w-md space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
              <p className="mt-1 text-sm text-slate-500">Sign in to your account to continue</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700">Email Address</label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    defaultValue="rajesh.kumar@aicte-india.org"
                    className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Password</label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    defaultValue="••••••••••••"
                    className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-slate-600">
                  <input type="checkbox" defaultChecked className="rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                  Remember me
                </label>
                <a href="#forgot" className="text-teal-600 hover:underline">Forgot password?</a>
              </div>

              <button
                onClick={() => setCurrentScreen('dashboard')}
                className="w-full rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-teal-700 focus:outline-none"
              >
                Sign In
              </button>

              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                <span className="relative bg-white px-2 text-xs text-slate-400">OR</span>
              </div>

              <button
                onClick={() => setCurrentScreen('dashboard')}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <UserCheck className="h-4 w-4 text-slate-500" />
                Login with AICTE SSO
              </button>
            </div>

            <p className="text-center text-xs text-slate-500">
              Don't have an account? <span className="font-medium text-teal-600 hover:underline cursor-pointer">Contact your administrator</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN LAYOUT ---
  return (
    <div className="flex min-h-screen bg-slate-100 font-sans">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col bg-[#0b1728] text-white">
        <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-amber-500 to-orange-400 font-extrabold text-slate-950 text-sm shadow">
            AICTE
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">AICTE</h1>
            <p className="text-[10px] text-teal-400 font-medium">ComplianceFlow</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = currentScreen === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentScreen(item.id)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 font-bold text-xs text-white">
                RK
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Dr. Rajesh Kumar</p>
                <p className="text-[10px] text-slate-400">Regional Officer - North</p>
              </div>
            </div>
            <button
              onClick={() => setCurrentScreen('login')}
              title="Sign Out"
              className="text-slate-400 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="ml-64 flex flex-1 flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8">
          <div className="relative w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search applications, institutions, or reference no..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-4 text-xs focus:border-teal-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentScreen('notifications')}
              className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500"></span>
            </button>

            <div className="h-6 w-px bg-slate-200"></div>

            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                RK
              </div>
              <div className="text-left text-xs">
                <span className="font-semibold text-slate-800">Dr. Rajesh Kumar</span>
                <span className="block text-[10px] text-slate-400">Regional Officer - North</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Route Pages */}
        <main className="p-8">
          {/* ============================================================= */}
          {/* SCREEN: DASHBOARD                                             */}
          {/* ============================================================= */}
          {currentScreen === 'dashboard' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
                  <p className="text-xs text-slate-500">Here's what's happening with your approvals today.</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">Last updated: 14 Apr 2025, 11:30 AM</span>
                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm cursor-pointer hover:bg-slate-50">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>Last 30 days</span>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-4 gap-5">
                {[
                  { label: 'Total Applications', value: '248', change: '+12% from last 30 days', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Approved', value: '156', change: '+18%', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: 'Pending', value: '68', change: '-4%', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                  { label: 'Overdue', value: '24', change: '+1%', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' }
                ].map((stat, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">{stat.label}</span>
                      <div className={`rounded-lg p-2 ${stat.bg}`}>
                        <stat.icon className={`h-4 w-4 ${stat.color}`} />
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className="text-2xl font-bold text-slate-900">{stat.value}</span>
                      <p className="mt-1 text-[11px] font-medium text-slate-400">{stat.change}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* 3-Column Visual Grid */}
              <div className="grid grid-cols-12 gap-6">
                {/* 1. Status Overview Donut Chart */}
                <div className="col-span-4 flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Application Status Overview
                  </h3>
                  
                  <div className="my-6 flex flex-col items-center justify-center">
                    <div className="relative flex h-44 w-44 items-center justify-center">
                      <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 36 36">
                        <path
                          className="text-slate-100"
                          strokeWidth="3.8"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-emerald-500"
                          strokeDasharray="63, 100"
                          strokeWidth="3.8"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-blue-500"
                          strokeDasharray="21, 100"
                          strokeDashoffset="-63"
                          strokeWidth="3.8"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-amber-500"
                          strokeDasharray="5, 100"
                          strokeDashoffset="-84"
                          strokeWidth="3.8"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-rose-400"
                          strokeDasharray="3.2, 100"
                          strokeDashoffset="-89"
                          strokeWidth="3.8"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-3xl font-extrabold text-slate-800">248</span>
                        <span className="block text-[11px] font-medium text-slate-400">Total Applications</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                      <span className="text-slate-600 font-medium">Approved <strong className="text-slate-800">156</strong> (63%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-blue-500"></span>
                      <span className="text-slate-600 font-medium">Under Process <strong className="text-slate-800">52</strong> (21%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
                      <span className="text-slate-600 font-medium">On Hold <strong className="text-slate-800">12</strong> (4.8%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-400"></span>
                      <span className="text-slate-600 font-medium">Rejected <strong className="text-slate-800">8</strong> (3.2%)</span>
                    </div>
                  </div>
                </div>

                {/* 2. Stage-wise Pending Progress Bars */}
                <div className="col-span-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Stage-wise Pending Applications
                  </h3>
                  <div className="mt-8 space-y-6">
                    {[
                      { stage: 'Scrutiny', count: 32, max: 40, color: 'bg-blue-600' },
                      { stage: 'EVC', count: 18, max: 40, color: 'bg-teal-500' },
                      { stage: 'SAC / SHC', count: 11, max: 40, color: 'bg-indigo-500' },
                      { stage: 'Final Approval', count: 7, max: 40, color: 'bg-emerald-500' },
                    ].map((st, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                          <span>{st.stage}</span>
                          <span className="text-slate-900 font-bold">{st.count}</span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full ${st.color} rounded-full transition-all duration-500`}
                            style={{ width: `${(st.count / st.max) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Upcoming Deadlines */}
                <div className="col-span-4 flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Upcoming Deadlines
                      </h3>
                      <button
                        onClick={() => setCurrentScreen('compliance')}
                        className="text-[11px] font-semibold text-teal-600 hover:text-teal-700"
                      >
                        View All
                      </button>
                    </div>

                    <div className="mt-4 space-y-3">
                      {[
                        {
                          title: 'EVC Visit (New Institution)',
                          inst: 'ABC College of Engineering',
                          date: '15 Apr 2025',
                          alert: 'bg-amber-500',
                          type: 'Inspection'
                        },
                        {
                          title: 'Compliance Submission',
                          inst: 'XYZ Technical Institute',
                          date: '18 Apr 2025',
                          alert: 'bg-rose-500',
                          type: 'Regulatory'
                        },
                        {
                          title: 'Lease Document Renewal',
                          inst: 'PQR Institute of Technology',
                          date: '22 Apr 2025',
                          alert: 'bg-blue-500',
                          type: 'Affidavit'
                        },
                      ].map((dl, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3 hover:bg-slate-100/60 transition-colors"
                        >
                          <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${dl.alert}`}></span>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-slate-800">{dl.title}</p>
                            <p className="text-[11px] text-slate-500 font-medium">{dl.inst}</p>
                            <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                              <Calendar className="h-3 w-3" /> {dl.date}
                            </span>
                          </div>
                          <span className="rounded bg-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 border border-slate-200">
                            {dl.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setCurrentScreen('evc')}
                    className="mt-4 w-full rounded-lg border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Manage Committee Calendar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* SCREEN: APPLICATIONS                                          */}
          {/* ============================================================= */}
          {currentScreen === 'applications' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Applications</h1>
                  <p className="text-xs text-slate-500">Manage and track AICTE approval applications across all stages.</p>
                </div>
                <button className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-700">
                  <span>+ New Application</span>
                </button>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold">
                {['All (248)', 'Under Process (68)', 'Approved (156)', 'On Hold (12)', 'Rejected (8)'].map((tab) => {
                  const name = tab.split(' ')[0];
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(name)}
                      className={`pb-3 ${
                        activeTab === name
                          ? 'border-b-2 border-teal-600 text-teal-600'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>

              {/* Filter Controls */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <select className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 focus:outline-none">
                    <option>Region: All</option>
                    <option>Western Region</option>
                    <option>Northern Region</option>
                  </select>
                  <select className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 focus:outline-none">
                    <option>Stage: All</option>
                    <option>Scrutiny</option>
                    <option>EVC</option>
                    <option>SAC / SHC</option>
                  </select>
                  <select className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 focus:outline-none">
                    <option>Institution Type: All</option>
                    <option>Government</option>
                    <option>Private</option>
                  </select>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by application number or institute..."
                    className="w-full rounded-lg border border-slate-200 py-1.5 pl-8 pr-3 text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Applications Table */}
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                    <tr>
                      <th className="px-5 py-3">Application No.</th>
                      <th className="px-5 py-3">Institution Name</th>
                      <th className="px-5 py-3">Type</th>
                      <th className="px-5 py-3">Current Stage</th>
                      <th className="px-5 py-3">Submitted On</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {applications.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5 font-semibold text-slate-900">{app.id}</td>
                        <td className="px-5 py-3.5 font-medium">{app.name}</td>
                        <td className="px-5 py-3.5 text-slate-500">{app.type}</td>
                        <td className="px-5 py-3.5 font-semibold text-teal-700">{app.stage}</td>
                        <td className="px-5 py-3.5 text-slate-500">{app.date}</td>
                        <td className="px-5 py-3.5">{getStatusBadge(app.status)}</td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => {
                              setSelectedApp({ ...selectedApp, id: app.id, name: app.name, type: app.type });
                              setCurrentScreen('details');
                            }}
                            className="inline-flex items-center gap-1 font-semibold text-teal-600 hover:text-teal-800"
                          >
                            <span>View</span>
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* SCREEN: COMPLIANCE MONITORING                                 */}
          {/* ============================================================= */}
          {currentScreen === 'compliance' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Institutional Compliance Monitoring</h1>
                  <p className="text-xs text-slate-500">Track covenants, statutory deadlines, affidavits, and deficiency remediations.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
                    <Download className="h-3.5 w-3.5 text-slate-500" />
                    <span>Export Deficiencies</span>
                  </button>
                  <button className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-700">
                    <span>+ Issue Notice</span>
                  </button>
                </div>
              </div>

              {/* Compliance Stat Strip */}
              <div className="grid grid-cols-4 gap-4">
                {[
                  { title: 'Total Covenants Tracked', value: '1,420', sub: 'Across 248 institutions', color: 'border-l-teal-600' },
                  { title: 'Fully Compliant', value: '1,185', sub: '83.4% adherence rate', color: 'border-l-emerald-500' },
                  { title: 'Under Review', value: '147', sub: 'Pending regional scrutiny', color: 'border-l-amber-500' },
                  { title: 'Deficient / Overdue', value: '88', sub: 'Escalation triggered', color: 'border-l-red-500' },
                ].map((card, i) => (
                  <div key={i} className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm border-l-4 ${card.color}`}>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{card.title}</span>
                    <p className="mt-1 text-2xl font-bold text-slate-800">{card.value}</p>
                    <span className="text-[10px] text-slate-500">{card.sub}</span>
                  </div>
                ))}
              </div>

              {/* Obligations Records Table */}
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-700">Statutory Obligation Records</span>
                  </div>
                  <div className="flex gap-2">
                    <select className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600">
                      <option>All Covenant Types</option>
                      <option>Fire Safety NOC</option>
                      <option>Building Stability</option>
                      <option>Corpus Fund Deposit</option>
                      <option>Faculty Cadre Ratio</option>
                    </select>
                  </div>
                </div>

                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                    <tr>
                      <th className="px-5 py-3">Obligation ID</th>
                      <th className="px-5 py-3">Institution</th>
                      <th className="px-5 py-3">Covenant / Requirement</th>
                      <th className="px-5 py-3">Statutory Due Date</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {[
                      { id: 'OBL-2025-091', inst: 'ABC College of Engineering', cov: 'Fire & Life Safety NOC Renewal', due: '18 Apr 2025', status: 'Pending Review' },
                      { id: 'OBL-2025-092', inst: 'XYZ Technical Institute', cov: 'Corpus FDR 10-Yr Auto-Rollover Lien', due: '10 Apr 2025', status: 'Overdue' },
                      { id: 'OBL-2025-088', inst: 'PQR Institute of Technology', cov: 'Land Lease Deed Continuity Guarantee', due: '22 Apr 2025', status: 'Verified' },
                      { id: 'OBL-2025-074', inst: 'LMN Polytechnic', cov: 'Faculty Cadre Ratio 1:20 Audit', due: '15 Mar 2025', status: 'Deficient' },
                      { id: 'OBL-2025-063', inst: 'DEF Engineering College', cov: 'Barrier-Free Disabled Environment Cert', due: '28 Feb 2025', status: 'Verified' },
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        <td className="px-5 py-3.5 font-bold text-slate-900">{row.id}</td>
                        <td className="px-5 py-3.5 font-medium">{row.inst}</td>
                        <td className="px-5 py-3.5 text-slate-600">{row.cov}</td>
                        <td className="px-5 py-3.5 text-slate-500">{row.due}</td>
                        <td className="px-5 py-3.5">{getStatusBadge(row.status)}</td>
                        <td className="px-5 py-3.5 text-right">
                          <button className="font-semibold text-teal-600 hover:text-teal-800">Review</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* SCREEN: EVC SCHEDULING                                        */}
          {/* ============================================================= */}
          {currentScreen === 'evc' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Expert Visiting Committee (EVC) Scheduling</h1>
                  <p className="text-xs text-slate-500">Form panels, manage surprise physical inspection dates, and verify signed reports.</p>
                </div>
                <button className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-700">
                  <CalendarCheck className="h-4 w-4" />
                  <span>+ Constitute New Committee</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-5">
                {[
                  {
                    app: 'AICTE-APP-2025-001',
                    inst: 'ABC College of Engineering',
                    date: '15 Apr 2025',
                    panel: ['Prof. H. R. Deshmukh (IIT Bombay)', 'Dr. M. S. Swamy (NIT Trichy)', 'Ar. Ananya Sen (Council of Architecture)'],
                    status: 'Scheduled',
                    type: 'Physical Verification'
                  },
                  {
                    app: 'AICTE-APP-2025-004',
                    inst: 'LMN Polytechnic',
                    date: '21 Apr 2025',
                    panel: ['Dr. Ramesh Iyer (COEP)', 'Prof. Sneha Patil (VJTI Mumbai)'],
                    status: 'Pending Review',
                    type: 'Deficiency Verification'
                  },
                  {
                    app: 'AICTE-APP-2025-008',
                    inst: 'Kirloskar Institute of Technology',
                    date: '28 Apr 2025',
                    panel: ['Panel Constitution in Progress'],
                    status: 'In Progress',
                    type: 'New Extension Inspection'
                  }
                ].map((evc, i) => (
                  <div key={i} className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{evc.type}</span>
                        {getStatusBadge(evc.status)}
                      </div>
                      <h3 className="mt-2 text-sm font-bold text-slate-800">{evc.inst}</h3>
                      <p className="text-[11px] text-teal-600 font-semibold">{evc.app}</p>

                      <div className="mt-4 rounded-lg bg-slate-50 p-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span>Inspection: {evc.date}</span>
                        </div>
                        <div className="mt-2 space-y-1">
                          <span className="block text-[10px] font-bold uppercase text-slate-400">Assigned Experts:</span>
                          {evc.panel.map((p, idx) => (
                            <p key={idx} className="text-[11px] text-slate-600">• {p}</p>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex gap-2 border-t border-slate-100 pt-3">
                      <button className="flex-1 rounded-lg border border-slate-200 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Modify Panel</button>
                      <button className="flex-1 rounded-lg bg-teal-600 py-1.5 text-xs font-semibold text-white hover:bg-teal-700">Dispatch Order</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* SCREEN: DOCUMENTS STORAGE & EVIDENCE                          */}
          {/* ============================================================= */}
          {currentScreen === 'documents' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Institutional Document Repository</h1>
                  <p className="text-xs text-slate-500">Secure vault for affidavits, land deeds, building approvals, and fire NOCs.</p>
                </div>
                <button className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-700">
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload Document</span>
                </button>
              </div>

              <div className="grid grid-cols-4 gap-4">
                {[
                  { name: 'Legal & Land Deeds', count: '342 Files', size: '2.4 GB' },
                  { name: 'Building & Stability Plans', count: '289 Files', size: '4.8 GB' },
                  { name: 'Fire & Safety NOCs', count: '215 Files', size: '890 MB' },
                  { name: 'EVC Signed Reports', count: '184 Files', size: '1.2 GB' },
                ].map((cat, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-teal-500 cursor-pointer transition-colors">
                    <FolderArchive className="h-6 w-6 text-teal-600" />
                    <h4 className="mt-2 text-xs font-bold text-slate-800">{cat.name}</h4>
                    <div className="mt-1 flex justify-between text-[11px] text-slate-400">
                      <span>{cat.count}</span>
                      <span>{cat.size}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 bg-slate-50/70 p-4 font-semibold text-xs text-slate-700">
                  Recently Uploaded Evidentiary Documents
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                    <tr>
                      <th className="px-5 py-3">File Name</th>
                      <th className="px-5 py-3">Category</th>
                      <th className="px-5 py-3">Institution</th>
                      <th className="px-5 py-3">Checksum (SHA-256)</th>
                      <th className="px-5 py-3">Verification</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {[
                      { file: 'Land_Title_Deed_Pune_Plot.pdf', cat: 'Legal & Land', inst: 'ABC College of Eng', hash: 'e3b0c44298fc1c149afb...', stat: 'Verified' },
                      { file: 'PWD_Building_Stability_Certificate_2025.pdf', cat: 'Building Plan', inst: 'ABC College of Eng', hash: '8f434346648f6b96df89...', stat: 'Verified' },
                      { file: 'Fire_NOC_Renewal_NMMC.pdf', cat: 'Fire & Safety', inst: 'XYZ Technical Inst', hash: '7c8d9e0f1a2b3c4d5e6f...', stat: 'Pending Review' },
                      { file: 'FDR_Pledge_Letter_SBI_Treasury.pdf', cat: 'Financial Corpus', inst: 'PQR Inst of Tech', hash: '1a2b3c4d5e6f7a8b9c0d...', stat: 'Verified' },
                    ].map((doc, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        <td className="px-5 py-3.5 font-bold text-slate-800 flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-400" />
                          <span>{doc.file}</span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-500">{doc.cat}</td>
                        <td className="px-5 py-3.5 font-medium">{doc.inst}</td>
                        <td className="px-5 py-3.5 font-mono text-[11px] text-slate-400">{doc.hash}</td>
                        <td className="px-5 py-3.5">{getStatusBadge(doc.stat)}</td>
                        <td className="px-5 py-3.5 text-right">
                          <button className="font-semibold text-teal-600 hover:text-teal-800">Download</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* SCREEN: REPORTS & AUDIT ANALYTICS                             */}
          {/* ============================================================= */}
          {currentScreen === 'reports' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Regulatory Analytics & Statutory Reports</h1>
                  <p className="text-xs text-slate-500">Generate executive MIS reports, regional officer workload distributions, and APH SLA compliance metrics.</p>
                </div>
                <button className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-700">
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Generate MIS Export</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Statutory SLA Adherence (APH Guidelines)</h3>
                  <div className="mt-4 space-y-4">
                    {[
                      { type: 'New Institution Approval (45 Days)', met: '92%', count: '46/50 Met' },
                      { type: 'Extension of Approval (EoA) (21 Days)', met: '98%', count: '142/145 Met' },
                      { type: 'Increase in Intake / New Course (30 Days)', met: '88%', count: '38/43 Met' },
                      { type: 'Closure of Course / Institute (30 Days)', met: '95%', count: '19/20 Met' },
                    ].map((rep, idx) => (
                      <div key={idx} className="border-b border-slate-100 pb-2">
                        <div className="flex justify-between text-xs font-medium text-slate-700">
                          <span>{rep.type}</span>
                          <span className="font-bold text-teal-600">{rep.met}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">{rep.count} within statutory SLA limits</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Regional Caseload & Throughput</h3>
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                      <tr>
                        <th className="px-3 py-2">Regional Office</th>
                        <th className="px-3 py-2">Total Received</th>
                        <th className="px-3 py-2">Cleared</th>
                        <th className="px-3 py-2">In Scrutiny / EVC</th>
                        <th className="px-3 py-2">Avg. Turnaround</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {[
                        { ro: 'Western Regional Office (Mumbai)', total: 84, cleared: 62, active: 22, avg: '14.2 Days' },
                        { ro: 'Northern Regional Office (Kanpur)', total: 68, cleared: 48, active: 20, avg: '16.5 Days' },
                        { ro: 'Southern Regional Office (Chennai)', total: 92, cleared: 80, active: 12, avg: '11.8 Days' },
                        { ro: 'Eastern Regional Office (Kolkata)', total: 42, cleared: 31, active: 11, avg: '18.1 Days' },
                      ].map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50/70">
                          <td className="px-3 py-2.5 font-bold text-slate-800">{r.ro}</td>
                          <td className="px-3 py-2.5">{r.total}</td>
                          <td className="px-3 py-2.5 text-emerald-600 font-semibold">{r.cleared}</td>
                          <td className="px-3 py-2.5 text-amber-600 font-semibold">{r.active}</td>
                          <td className="px-3 py-2.5 font-medium">{r.avg}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* SCREEN: ADMINISTRATION & SYSTEM ROLES                         */}
          {/* ============================================================= */}
          {currentScreen === 'admin' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Administration & System Configuration</h1>
                  <p className="text-xs text-slate-500">Configure approval rule versions, role-based access permissions, and regional assignments.</p>
                </div>
                <button className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-700">
                  <Users className="h-4 w-4" />
                  <span>+ Add Officer / User</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Rule Version (APH)</h3>
                  <div className="rounded-lg border border-teal-200 bg-teal-50/50 p-4">
                    <span className="rounded bg-teal-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">Active</span>
                    <h4 className="mt-2 text-sm font-bold text-slate-900">AICTE Approval Process Handbook 2025–2027</h4>
                    <p className="mt-1 text-xs text-slate-500">Version 2.4 (Statutory transition matrix enabled)</p>
                  </div>
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-xs text-slate-600"><span>State Machine Transitions</span><span className="font-bold">18 Enabled</span></div>
                    <div className="flex justify-between text-xs text-slate-600"><span>Automatic Escalation Threshold</span><span className="font-bold">72 Hours</span></div>
                    <div className="flex justify-between text-xs text-slate-600"><span>Checksum Verification</span><span className="font-bold text-emerald-600">SHA-256 Enforced</span></div>
                  </div>
                </div>

                <div className="col-span-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 bg-slate-50/70 p-4 font-semibold text-xs text-slate-700">
                    System User Accounts & Delegated Roles
                  </div>
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                      <tr>
                        <th className="px-4 py-3">Officer Name</th>
                        <th className="px-4 py-3">Assigned Role</th>
                        <th className="px-4 py-3">Jurisdiction</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Settings</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {[
                        { name: 'Dr. Rajesh Kumar', email: 'rajesh.kumar@aicte-india.org', role: 'REGIONAL_OFFICER', reg: 'Northern Region', stat: 'Active' },
                        { name: 'Dr. Sunita Sharma', email: 'sunita.sharma@aicte-india.org', role: 'BUREAU_OFFICER', reg: 'Headquarters (New Delhi)', stat: 'Active' },
                        { name: 'Prof. Ramesh Kulkarni', email: 'ramesh.k@aicte-india.org', role: 'EVC_PANEL_CHAIR', reg: 'Western Region', stat: 'Active' },
                        { name: 'SysAdmin Central', email: 'admin@aicte-india.org', role: 'SYSTEM_ADMIN', reg: 'All Jurisdictions', stat: 'Active' },
                      ].map((u, i) => (
                        <tr key={i} className="hover:bg-slate-50/70">
                          <td className="px-4 py-3">
                            <span className="font-bold text-slate-800 block">{u.name}</span>
                            <span className="text-[10px] text-slate-400">{u.email}</span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-teal-700">{u.role}</td>
                          <td className="px-4 py-3 text-slate-600">{u.reg}</td>
                          <td className="px-4 py-3"><span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">{u.stat}</span></td>
                          <td className="px-4 py-3 text-right"><button className="text-slate-400 hover:text-slate-800">Edit</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* SCREEN: NOTIFICATIONS & ALERTS                                */}
          {/* ============================================================= */}
          {currentScreen === 'notifications' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
                  <p className="text-xs text-slate-500">Stay updated with your latest alerts and reminders.</p>
                </div>
                <button className="text-xs font-semibold text-teal-600 hover:underline">Mark all as read</button>
              </div>

              <div className="flex border-b border-slate-200 gap-8 text-xs font-semibold">
                <button className="border-b-2 border-teal-600 pb-3 text-teal-600">All (12)</button>
                <button className="pb-3 text-slate-500 hover:text-slate-800">Alerts (5)</button>
                <button className="pb-3 text-slate-500 hover:text-slate-800">Reminders (4)</button>
                <button className="pb-3 text-slate-500 hover:text-slate-800">Updates (3)</button>
              </div>

              <div className="space-y-3">
                {[
                  { title: 'EVC Visit Reminder', desc: 'EVC visit for ABC College of Engineering is scheduled on 15 Apr 2025.', time: '2 hours ago', icon: AlertTriangle, bg: 'bg-amber-100 text-amber-700' },
                  { title: 'Compliance Deadline Approaching', desc: 'Time-bound undertaking for XYZ Technical Institute is due in 3 days.', time: '4 hours ago', icon: Clock, bg: 'bg-blue-100 text-blue-700' },
                  { title: 'Document Expiry Alert', desc: 'Lease document for PQR Institute of Technology will expire in 10 days.', time: '6 hours ago', icon: AlertTriangle, bg: 'bg-red-100 text-red-700' },
                  { title: 'Application Escalated', desc: 'Application AICTE-APP-2025-004 has been escalated to Regional Director.', time: '8 hours ago', icon: ArrowLeft, bg: 'bg-purple-100 text-purple-700' },
                  { title: 'New Application Assigned', desc: 'You have been assigned 3 new applications in your region.', time: '12 hours ago', icon: FileText, bg: 'bg-teal-100 text-teal-700' }
                ].map((notif, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:bg-slate-50">
                    <div className="flex items-center gap-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${notif.bg}`}>
                        <notif.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{notif.title}</p>
                        <p className="text-xs text-slate-500">{notif.desc}</p>
                        <span className="text-[10px] text-slate-400">{notif.time}</span>
                      </div>
                    </div>
                    <button className="text-xs font-semibold text-teal-600 hover:underline">View</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* SCREEN: APPLICATION DETAILS                                   */}
          {/* ============================================================= */}
          {currentScreen === 'details' && (
            <div className="space-y-6">
              <button
                onClick={() => setCurrentScreen('applications')}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Applications</span>
              </button>

              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold text-slate-900">{selectedApp.id}</h1>
                    {getStatusBadge(selectedApp.status)}
                  </div>
                  <p className="mt-1 text-sm font-semibold text-slate-700">{selectedApp.name}</p>
                  <p className="text-xs text-slate-400">{selectedApp.type} • {selectedApp.discipline}</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right text-xs">
                    <span className="block text-slate-400">Submitted On</span>
                    <span className="font-semibold text-slate-700">{selectedApp.submittedOn}</span>
                  </div>
                  <div className="text-right text-xs">
                    <span className="block text-slate-400">Current Stage</span>
                    <span className="rounded-full bg-blue-50 px-3 py-1 font-bold text-blue-700">EVC Scheduled</span>
                  </div>
                  <button className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">
                    <Download className="h-3.5 w-3.5 text-slate-500" />
                    <span>Download Summary</span>
                  </button>
                </div>
              </div>

              {/* Detail Navigation Tabs */}
              <div className="flex border-b border-slate-200 gap-8 text-xs font-semibold">
                <button className="border-b-2 border-teal-600 pb-3 text-teal-600">Overview</button>
                <button onClick={() => setCurrentScreen('workflow')} className="pb-3 text-slate-500 hover:text-slate-800">Stage History</button>
                <button className="pb-3 text-slate-500 hover:text-slate-800">Documents</button>
                <button className="pb-3 text-slate-500 hover:text-slate-800">Compliance</button>
                <button className="pb-3 text-slate-500 hover:text-slate-800">Undertakings</button>
                <button className="pb-3 text-slate-500 hover:text-slate-800">Audit Trail</button>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 space-y-6">
                  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Institution Details</h3>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400">Institution Name</span>
                        <p className="font-semibold text-slate-800 mt-0.5">{selectedApp.name}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Type</span>
                        <p className="font-semibold text-slate-800 mt-0.5">{selectedApp.institutionType}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">State</span>
                        <p className="font-semibold text-slate-800 mt-0.5">Maharashtra</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Region</span>
                        <p className="font-semibold text-slate-800 mt-0.5">{selectedApp.region}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400">Address</span>
                        <p className="font-semibold text-slate-800 mt-0.5">{selectedApp.address}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Application Progress</h3>
                    <div className="space-y-6 pl-2">
                      {[
                        { title: 'Application Submitted', date: '10 Mar 2025 | 11:34 AM', done: true },
                        { title: 'Scrutiny Completed', date: '12 Mar 2025 | 04:32 PM', done: true },
                        { title: 'EVC Scheduled', date: '15 Apr 2025', current: true },
                        { title: 'SAC / SHC', date: 'Pending' },
                        { title: 'Final Approval', date: 'Pending' }
                      ].map((step, i) => (
                        <div key={i} className="relative flex items-start gap-4">
                          <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                            step.done ? 'bg-emerald-500 text-white' : step.current ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-slate-200 text-slate-500'
                          }`}>
                            {step.done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">{step.title}</p>
                            <span className="text-[11px] text-slate-400">{step.date}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Quick Actions</h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => setCurrentScreen('workflow')}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-teal-600 py-2.5 text-xs font-semibold text-white hover:bg-teal-700"
                      >
                        <CalendarCheck className="h-4 w-4" />
                        <span>Schedule EVC</span>
                      </button>
                      <button className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-200 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                        <FileCheck className="h-4 w-4" />
                        <span>Return for Clarification</span>
                      </button>
                      <button className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-200 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                        <FileText className="h-4 w-4" />
                        <span>Add Note</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* SCREEN: WORKFLOW TRACKER                                      */}
          {/* ============================================================= */}
          {currentScreen === 'workflow' && (
            <div className="space-y-6">
              <button
                onClick={() => setCurrentScreen('details')}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Application Details</span>
              </button>

              <div>
                <h1 className="text-xl font-bold text-slate-900">Application Workflow</h1>
                <p className="text-xs text-slate-500">Track stage-wise movement and actions taken for this application.</p>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                {[
                  { title: 'Application Submitted', date: '10 Mar 2025', done: true },
                  { title: 'Scrutiny Completed', date: '12 Mar 2025', done: true },
                  { title: 'EVC Scheduled', date: '15 Apr 2025', current: true },
                  { title: 'SAC / SHC', date: 'Pending' },
                  { title: 'Final Approval', date: 'Pending' }
                ].map((step, idx) => (
                  <div key={idx} className="flex flex-1 items-center">
                    <div className="flex flex-col items-center">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                        step.done ? 'bg-emerald-500 text-white' : step.current ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-slate-200 text-slate-400'
                      }`}>
                        {step.done ? <Check className="h-4 w-4" /> : idx + 1}
                      </div>
                      <span className="mt-2 text-xs font-semibold text-slate-800">{step.title}</span>
                      <span className="text-[10px] text-slate-400">{step.date}</span>
                    </div>
                    {idx < 4 && <div className={`h-0.5 flex-1 mx-4 ${step.done ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 bg-slate-50 px-5 py-3 font-semibold text-xs text-slate-700">
                    Stage Details
                  </div>
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-100 text-slate-500">
                      <tr>
                        <th className="px-5 py-2.5">Stage</th>
                        <th className="px-5 py-2.5">Status</th>
                        <th className="px-5 py-2.5">Assigned To</th>
                        <th className="px-5 py-2.5">Completed On</th>
                        <th className="px-5 py-2.5">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="px-5 py-3 font-semibold">Application Submission</td>
                        <td className="px-5 py-3"><span className="text-emerald-600 font-semibold">Completed</span></td>
                        <td className="px-5 py-3">Institution</td>
                        <td className="px-5 py-3 text-slate-500">10 Mar 2025 | 11:34 AM</td>
                        <td className="px-5 py-3 text-slate-500">Application received successfully.</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-3 font-semibold">Scrutiny</td>
                        <td className="px-5 py-3"><span className="text-emerald-600 font-semibold">Completed</span></td>
                        <td className="px-5 py-3">Regional Officer</td>
                        <td className="px-5 py-3 text-slate-500">12 Mar 2025 | 04:32 PM</td>
                        <td className="px-5 py-3 text-slate-500">No deficiencies.</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-3 font-semibold">EVC</td>
                        <td className="px-5 py-3"><span className="text-blue-600 font-semibold">Scheduled</span></td>
                        <td className="px-5 py-3">EVC Committee</td>
                        <td className="px-5 py-3 text-slate-500">15 Apr 2025</td>
                        <td className="px-5 py-3 text-slate-500">EVC visit scheduled for 15 Apr 2025.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Actions & Notes</h3>
                  <div className="space-y-4 text-xs">
                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                      <p className="font-semibold text-slate-800">EVC Scheduled</p>
                      <span className="text-[10px] text-slate-400">15 Mar 2025, 02:15 PM by Dr. Rajesh Kumar</span>
                    </div>
                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                      <p className="font-semibold text-slate-800">Clarification Required</p>
                      <span className="text-[11px] text-slate-400">11 Mar 2025, 03:12 PM by Dr. Sunita Sharma</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}