import React, { useState } from 'react';
import { 
  Home, 
  Building2, 
  FileText, 
  Tag, 
  BarChart3, 
  FileUp, 
  Bell, 
  RefreshCw, 
  Users, 
  TrendingUp, 
  Search, 
  Newspaper, 
  Link2, 
  Settings, 
  Shield, 
  ScrollText, 
  HardDrive, 
  ChevronRight, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  LogOut, 
  Lock, 
  Sparkles, 
  CheckCircle2, 
  ExternalLink,
  Layers
} from 'lucide-react';
import { FullRRBDatabase, TabView } from '../types';
import { logoutAdmin } from '../utils/auth';
import { RailwayLogo } from './RailwayLogo';
import { AdminDashboardView } from './admin/AdminDashboardView';
import { AdminPdfPipelineView } from './admin/AdminPdfPipelineView';
import { AdminZonesView } from './admin/AdminZonesView';
import { AdminExamsView } from './admin/AdminExamsView';
import { AdminCenView } from './admin/AdminCenView';
import { AdminCutoffView } from './admin/AdminCutoffView';
import { AdminNoticesView } from './admin/AdminNoticesView';
import { AdminAutoUpdateView } from './admin/AdminAutoUpdateView';
import { AdminUsersView } from './admin/AdminUsersView';
import { AdminAnalyticsView } from './admin/AdminAnalyticsView';
import { AdminSearchMgmtView } from './admin/AdminSearchMgmtView';
import { AdminContentView } from './admin/AdminContentView';
import { AdminSettingsView } from './admin/AdminSettingsView';
import { AdminRolesView } from './admin/AdminRolesView';
import { AdminAuditLogsView } from './admin/AdminAuditLogsView';
import { AdminBackupView } from './admin/AdminBackupView';
import { AdminRollNumbersView } from './admin/AdminRollNumbersView';

export type AdminMenuTab = 
  | 'dashboard'
  | 'zones'
  | 'exams'
  | 'cen'
  | 'cutoffs'
  | 'roll_numbers'
  | 'pdf_pipeline'
  | 'notices'
  | 'auto_update'
  | 'users'
  | 'analytics'
  | 'search_mgmt'
  | 'content'
  | 'links'
  | 'settings'
  | 'roles'
  | 'audit_logs'
  | 'backup';

interface AdminPanelProps {
  database: FullRRBDatabase;
  setDatabase: (db: FullRRBDatabase) => void;
  setCurrentTab: (tab: TabView) => void;
  onLogout?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  database,
  setDatabase,
  setCurrentTab,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<AdminMenuTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleLogout = () => {
    logoutAdmin();
    if (onLogout) onLogout();
    else setCurrentTab('home');
  };

  // Navigation Items matching the reference specification
  const navItems: { id: AdminMenuTab; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'zones', label: 'RRB Zones', icon: Building2 },
    { id: 'exams', label: 'Exams Management', icon: FileText },
    { id: 'cen', label: 'CEN Management', icon: Tag },
    { id: 'cutoffs', label: 'Cut-off Management', icon: BarChart3 },
    { id: 'roll_numbers', label: 'Roll Numbers & Merit Lists', icon: Layers },
    { id: 'pdf_pipeline', label: 'PDF / Document Manager', icon: FileUp },
    { id: 'notices', label: 'Official Notices', icon: Bell },
    { id: 'auto_update', label: 'Automatic Data Update', icon: RefreshCw },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'analytics', label: 'Analytics & Reports', icon: TrendingUp },
    { id: 'search_mgmt', label: 'Search Management', icon: Search },
    { id: 'content', label: 'Content Management', icon: Newspaper },
    { id: 'links', label: 'Official Links', icon: Link2 },
    { id: 'settings', label: 'System Settings', icon: Settings },
    { id: 'roles', label: 'Admin & Roles', icon: Shield },
    { id: 'audit_logs', label: 'Audit Logs', icon: ScrollText },
    { id: 'backup', label: '1 TB Memory & Backup', icon: HardDrive },
  ];

  return (
    <div className="bg-[#f4f6f9] -mx-4 -mt-6 -mb-12 min-h-[calc(100vh-100px)] flex flex-col lg:flex-row">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-950 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-800 flex items-center space-x-2.5 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* MOBILE BACKDROP */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* LEFT SIDEBAR (Dark Navy / Black #081028) */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-[#081028] text-slate-300 flex flex-col justify-between shrink-0 transition-transform duration-200 ease-in-out border-r border-slate-800 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {/* Logo Header */}
          <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 p-0.5 border border-slate-700 flex items-center justify-center shrink-0">
                <RailwayLogo className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-sm font-black tracking-wider text-white uppercase">
                  RRB PORTAL
                </h2>
                <span className="text-[11px] text-slate-400 font-medium block">
                  Admin Panel
                </span>
              </div>
            </div>

            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#ef4444] text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <ChevronRight
                    className={`w-3.5 h-3.5 opacity-50 shrink-0 ${
                      isActive ? 'text-white' : 'text-slate-500'
                    }`}
                  />
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Indian Railways Status Box */}
        <div className="p-4 border-t border-slate-800/80 bg-[#050b1d]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
              <RailwayLogo className="w-6 h-6" />
            </div>
            <div className="overflow-hidden">
              <span className="text-xs font-bold text-white block truncate">Indian Railways</span>
              <a
                href="https://indianrailways.gov.in"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-slate-400 hover:text-amber-400 truncate block hover:underline"
              >
                www.indianrailways.gov.in
              </a>
            </div>
          </div>
          <div className="mt-2.5 flex items-center space-x-1.5 text-[10px] text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Connected</span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center space-x-3 flex-1">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global Search Bar */}
            <div className="relative max-w-md w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Search anything across portal..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* View User Site Button */}
            <button
              onClick={() => setCurrentTab('home')}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              title="Return to public candidate portal"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>User Website</span>
            </button>

            {/* Notification Bell with Badge 12 */}
            <button
              onClick={() => setActiveTab('notices')}
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
              title="Official Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 px-1 py-0.2 bg-red-600 text-white rounded-full text-[9px] font-extrabold min-w-[16px] text-center">
                12
              </span>
            </button>

            {/* Admin User Badge + Logout */}
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-950 text-white flex items-center justify-center text-xs font-bold">
                AU
              </div>
              <div className="hidden md:block text-left">
                <span className="text-xs font-bold text-slate-900 block leading-tight">Admin User</span>
                <span className="text-[10px] text-slate-400 block font-medium">Super Admin</span>
              </div>

              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                title="Lock & Logout Admin Session"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Body View Container */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <AdminDashboardView
              database={database}
              onNavigateTab={(tab) => setActiveTab(tab as AdminMenuTab)}
              onOpenPdfPipeline={() => setActiveTab('pdf_pipeline')}
              onQuickAddCutoff={() => setActiveTab('cutoffs')}
              onQuickAddNotice={() => setActiveTab('notices')}
              onQuickAddExam={() => setActiveTab('exams')}
              onSwitchUserSite={setCurrentTab}
            />
          )}

          {activeTab === 'pdf_pipeline' && (
            <AdminPdfPipelineView
              database={database}
              setDatabase={setDatabase}
              onSuccessMessage={showToast}
              onSwitchToUserSite={setCurrentTab}
            />
          )}

          {activeTab === 'zones' && (
            <AdminZonesView
              database={database}
              setDatabase={setDatabase}
              onSuccessMessage={showToast}
            />
          )}

          {activeTab === 'exams' && (
            <AdminExamsView
              database={database}
              setDatabase={setDatabase}
              onSuccessMessage={showToast}
            />
          )}

          {activeTab === 'cen' && (
            <AdminCenView
              database={database}
              onSuccessMessage={showToast}
            />
          )}

          {activeTab === 'cutoffs' && (
            <AdminCutoffView
              database={database}
              setDatabase={setDatabase}
              onSuccessMessage={showToast}
              onOpenPdfPipeline={() => setActiveTab('pdf_pipeline')}
            />
          )}

          {activeTab === 'roll_numbers' && (
            <AdminRollNumbersView
              database={database}
              setDatabase={setDatabase}
              onSuccessMessage={showToast}
            />
          )}

          {activeTab === 'notices' && (
            <AdminNoticesView
              database={database}
              setDatabase={setDatabase}
              onSuccessMessage={showToast}
            />
          )}

          {activeTab === 'auto_update' && (
            <AdminAutoUpdateView
              database={database}
              onSuccessMessage={showToast}
            />
          )}

          {activeTab === 'users' && (
            <AdminUsersView
              onSuccessMessage={showToast}
            />
          )}

          {activeTab === 'analytics' && (
            <AdminAnalyticsView
              database={database}
            />
          )}

          {activeTab === 'search_mgmt' && (
            <AdminSearchMgmtView />
          )}

          {activeTab === 'content' && (
            <AdminContentView
              database={database}
              onSuccessMessage={showToast}
            />
          )}

          {activeTab === 'links' && (
            <AdminContentView
              database={database}
              onSuccessMessage={showToast}
            />
          )}

          {activeTab === 'settings' && (
            <AdminSettingsView
              database={database}
              onSuccessMessage={showToast}
            />
          )}

          {activeTab === 'roles' && (
            <AdminRolesView
              onSuccessMessage={showToast}
            />
          )}

          {activeTab === 'audit_logs' && (
            <AdminAuditLogsView />
          )}

          {activeTab === 'backup' && (
            <AdminBackupView
              database={database}
              setDatabase={setDatabase}
              onSuccessMessage={showToast}
            />
          )}
        </div>

        {/* Footer */}
        <footer className="mt-auto px-6 py-4 border-t border-slate-200 bg-white text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2025 RRB Portal Admin Panel. All rights reserved.</span>
          <span className="font-semibold text-slate-700">Version 2.0.0 (Production Release)</span>
        </footer>
      </div>
    </div>
  );
};
