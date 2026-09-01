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
  ChevronDown,
  Menu, 
  X, 
  Sun, 
  Moon, 
  LogOut, 
  Lock, 
  Sparkles, 
  CheckCircle2, 
  ExternalLink,
  Layers,
  Monitor,
  Share2,
  BookOpen,
  Mail,
  HelpCircle,
  KeyRound,
  FileCheck2,
  CheckSquare
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
import { AdminTelegramAutoPublishView } from './admin/AdminTelegramAutoPublishView';
import { Send, Bot, Radio, Zap } from 'lucide-react';

export type AdminMenuTab = 
  | 'dashboard'
  | 'telegram_auto_publish'
  | 'analytics'
  | 'users'
  | 'content'
  | 'exams'
  | 'cen'
  | 'cutoffs'
  | 'roll_numbers'
  | 'pdf_pipeline'
  | 'mock_test'
  | 'study_material'
  | 'pages'
  | 'subscribers'
  | 'zones'
  | 'notices'
  | 'auto_update'
  | 'search_mgmt'
  | 'links'
  | 'settings'
  | 'roles'
  | 'audit_logs'
  | 'backup'
  | 'support';

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

  // Collapsible Sub-menu states
  const [contentMenuOpen, setContentMenuOpen] = useState(false);
  const [examMenuOpen, setExamMenuOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const isWebsiteLive = database.settings?.isWebsiteLive !== false;

  const toggleWebsiteLive = () => {
    const newLiveStatus = !isWebsiteLive;
    const updatedDb: FullRRBDatabase = {
      ...database,
      settings: {
        ...(database.settings || {
          maintenanceTitle: 'RRB Portal - Official Gateway Upgrade',
          maintenanceMessage: 'हम पोर्टल को और बेहतर और तीव्र बनाने के लिए तकनीकी अपडेट कर रहे हैं। जल्द ही सभी परीक्षा परिणाम, कट-ऑफ और उत्तर कुंजी उपलब्ध होंगे।',
          expectedLaunchDate: 'Coming Very Soon (जल्द आ रहे हैं)',
          supportContactEmail: 'helpdesk@rrb.gov.in',
          telegramChannelUrl: 'https://t.me/railway_recruitment_updates',
        }),
        isWebsiteLive: newLiveStatus,
      },
    };
    setDatabase(updatedDb);
    showToast(
      newLiveStatus 
        ? '🟢 Website is now LIVE (ON) for all public users!' 
        : '🔴 Website is now OFF (Coming Soon Mode)! Public users will see Coming Soon page.'
    );
  };

  const handleLogout = () => {
    logoutAdmin();
    if (onLogout) onLogout();
    else setCurrentTab('home');
  };

  return (
    <div className="bg-[#f4f6f9] -mx-4 -mt-6 -mb-12 min-h-[calc(100vh-100px)] flex flex-col lg:flex-row font-sans">
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

      {/* LEFT SIDEBAR (Dark Navy #0b1426) */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-[#0b1426] text-slate-300 flex flex-col justify-between shrink-0 transition-transform duration-200 ease-in-out border-r border-slate-800/80 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {/* Logo Header */}
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                <RailwayLogo className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-sm font-black tracking-wider text-white flex items-center space-x-1">
                  <span>RRB</span>
                  <span className="text-blue-400">Smart Portal</span>
                </h2>
              </div>
            </div>

            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Card */}
          <div className="p-4 border-b border-slate-800/60 bg-[#080f1d] flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
              AU
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-extrabold text-white truncate block">Admin User</span>
              </div>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="text-[10px] text-slate-400 font-medium">Super Admin</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                <span className="text-[9px] text-emerald-400 font-bold">Online</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 text-xs font-semibold">
            
            {/* 1. Dashboard */}
            <button
              onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
              className={`w-full flex items-center px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Home className="w-4 h-4 mr-3 shrink-0" />
              <span>Dashboard</span>
            </button>

            {/* Telegram Auto Publish (AI System) */}
            <button
              onClick={() => { setActiveTab('telegram_auto_publish'); setSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'telegram_auto_publish'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-blue-500/20'
                  : 'text-blue-300 hover:text-white hover:bg-blue-900/30 border border-blue-500/20'
              }`}
            >
              <div className="flex items-center">
                <Send className="w-4 h-4 mr-3 shrink-0 text-blue-400" />
                <span className="text-xs">Telegram Auto Publish</span>
              </div>
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-400/20 text-blue-200 border border-blue-400/30 uppercase tracking-wider">
                AI Live
              </span>
            </button>

            {/* 2. Website Analytics */}
            <button
              onClick={() => { setActiveTab('analytics'); setSidebarOpen(false); }}
              className={`w-full flex items-center px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <TrendingUp className="w-4 h-4 mr-3 shrink-0" />
              <span>Website Analytics</span>
            </button>

            {/* 3. User Management */}
            <button
              onClick={() => { setActiveTab('users'); setSidebarOpen(false); }}
              className={`w-full flex items-center px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Users className="w-4 h-4 mr-3 shrink-0" />
              <span>User Management</span>
            </button>

            {/* 4. Content Management (Dropdown) */}
            <div>
              <button
                onClick={() => setContentMenuOpen(!contentMenuOpen)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all cursor-pointer"
              >
                <div className="flex items-center">
                  <Newspaper className="w-4 h-4 mr-3 shrink-0" />
                  <span>Content Management</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${contentMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {contentMenuOpen && (
                <div className="pl-9 pr-2 py-1 space-y-1 text-[11px]">
                  <button
                    onClick={() => { setActiveTab('notices'); setSidebarOpen(false); }}
                    className={`w-full text-left py-1.5 px-2 rounded-lg ${activeTab === 'notices' ? 'text-white font-bold bg-blue-600/30' : 'text-slate-400 hover:text-white'}`}
                  >
                    • Official Notices
                  </button>
                  <button
                    onClick={() => { setActiveTab('cen'); setSidebarOpen(false); }}
                    className={`w-full text-left py-1.5 px-2 rounded-lg ${activeTab === 'cen' ? 'text-white font-bold bg-blue-600/30' : 'text-slate-400 hover:text-white'}`}
                  >
                    • CEN Notices
                  </button>
                  <button
                    onClick={() => { setActiveTab('links'); setSidebarOpen(false); }}
                    className={`w-full text-left py-1.5 px-2 rounded-lg ${activeTab === 'links' ? 'text-white font-bold bg-blue-600/30' : 'text-slate-400 hover:text-white'}`}
                  >
                    • Portal Links
                  </button>
                </div>
              )}
            </div>

            {/* 5. Exam / Result (Dropdown) */}
            <div>
              <button
                onClick={() => setExamMenuOpen(!examMenuOpen)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all cursor-pointer"
              >
                <div className="flex items-center">
                  <FileText className="w-4 h-4 mr-3 shrink-0" />
                  <span>Exam / Result</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${examMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {examMenuOpen && (
                <div className="pl-9 pr-2 py-1 space-y-1 text-[11px]">
                  <button
                    onClick={() => { setActiveTab('exams'); setSidebarOpen(false); }}
                    className={`w-full text-left py-1.5 px-2 rounded-lg ${activeTab === 'exams' ? 'text-white font-bold bg-blue-600/30' : 'text-slate-400 hover:text-white'}`}
                  >
                    • Active Exams
                  </button>
                  <button
                    onClick={() => { setActiveTab('zones'); setSidebarOpen(false); }}
                    className={`w-full text-left py-1.5 px-2 rounded-lg ${activeTab === 'zones' ? 'text-white font-bold bg-blue-600/30' : 'text-slate-400 hover:text-white'}`}
                  >
                    • RRB Regional Zones
                  </button>
                </div>
              )}
            </div>

            {/* 6. Answer Key */}
            <button
              onClick={() => { setActiveTab('roll_numbers'); setSidebarOpen(false); }}
              className={`w-full flex items-center px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'roll_numbers'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <KeyRound className="w-4 h-4 mr-3 shrink-0" />
              <span>Answer Key</span>
            </button>

            {/* 7. Cut-Off */}
            <button
              onClick={() => { setActiveTab('cutoffs'); setSidebarOpen(false); }}
              className={`w-full flex items-center px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'cutoffs'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <BarChart3 className="w-4 h-4 mr-3 shrink-0" />
              <span>Cut-Off</span>
            </button>

            {/* 8. Mock Test */}
            <button
              onClick={() => { setActiveTab('mock_test'); setSidebarOpen(false); }}
              className={`w-full flex items-center px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'mock_test'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <CheckSquare className="w-4 h-4 mr-3 shrink-0" />
              <span>Mock Test</span>
            </button>

            {/* 9. Study Material */}
            <button
              onClick={() => { setActiveTab('study_material'); setSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all cursor-pointer`}
            >
              <div className="flex items-center">
                <BookOpen className="w-4 h-4 mr-3 shrink-0" />
                <span>Study Material</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 opacity-50" />
            </button>

            {/* Pages */}
            <button
              onClick={() => { setActiveTab('pages'); setSidebarOpen(false); }}
              className={`w-full flex items-center px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'pages'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <FileCheck2 className="w-4 h-4 mr-3 shrink-0" />
              <span>Pages</span>
            </button>

            {/* 12. Subscribers */}
            <button
              onClick={() => { setActiveTab('subscribers'); setSidebarOpen(false); }}
              className={`w-full flex items-center px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'subscribers'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Mail className="w-4 h-4 mr-3 shrink-0" />
              <span>Subscribers</span>
            </button>

            {/* 13. Settings */}
            <button
              onClick={() => { setActiveTab('settings'); setSidebarOpen(false); }}
              className={`w-full flex items-center px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Settings className="w-4 h-4 mr-3 shrink-0" />
              <span>Settings</span>
            </button>

            {/* 14. Backup */}
            <button
              onClick={() => { setActiveTab('backup'); setSidebarOpen(false); }}
              className={`w-full flex items-center px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'backup'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <HardDrive className="w-4 h-4 mr-3 shrink-0" />
              <span>Backup</span>
            </button>

            {/* 15. Support */}
            <button
              onClick={() => { setActiveTab('support'); setSidebarOpen(false); }}
              className={`w-full flex items-center px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'support'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <HelpCircle className="w-4 h-4 mr-3 shrink-0" />
              <span>Support</span>
            </button>

            {/* 16. Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2.5 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-all cursor-pointer pt-2"
            >
              <LogOut className="w-4 h-4 mr-3 shrink-0" />
              <span>Logout</span>
            </button>

          </nav>
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

            {/* Title / Search */}
            <div className="hidden sm:block">
              <h2 className="text-sm font-extrabold text-slate-900">
                RRB Admin Control Portal
              </h2>
              <span className="text-[11px] text-slate-500 font-medium block">
                Official Railway Recruitment Board - Centralized Administration & Database System
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Master Website ON/OFF Switch */}
            <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-black text-slate-700 pl-1.5 hidden md:inline">
                Site:
              </span>
              <button
                type="button"
                onClick={toggleWebsiteLive}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer shadow-xs ${
                  isWebsiteLive
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                }`}
                title={isWebsiteLive ? 'Website is LIVE (Click to turn OFF / Coming Soon)' : 'Website is OFF (Click to turn ON / LIVE)'}
              >
                <span className={`w-2 h-2 rounded-full ${isWebsiteLive ? 'bg-white' : 'bg-yellow-300'}`} />
                <span>{isWebsiteLive ? '🟢 LIVE (ON)' : '🔴 OFF (Coming Soon)'}</span>
              </button>
            </div>

            {/* Visit Website Button */}
            <button
              onClick={() => setCurrentTab('home')}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
              title="Return to public candidate portal"
            >
              <span>Visit Website</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {/* Notification Bell with Badge 5 */}
            <button
              onClick={() => setActiveTab('notices')}
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 px-1 py-0.2 bg-rose-600 text-white rounded-full text-[9px] font-extrabold min-w-[16px] text-center">
                5
              </span>
            </button>

            {/* Admin User Badge + Logout */}
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                AU
              </div>
              <div className="hidden md:block text-left">
                <span className="text-xs font-bold text-slate-900 block leading-tight">Admin</span>
                <span className="text-[10px] text-slate-400 block font-medium">Super Admin</span>
              </div>

              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer ml-1"
                title="Logout Admin Session"
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
              onToggleWebsiteLive={toggleWebsiteLive}
            />
          )}

          {activeTab === 'telegram_auto_publish' && (
            <AdminTelegramAutoPublishView
              database={database}
              setDatabase={setDatabase}
              showToast={showToast}
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
              setDatabase={setDatabase}
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

          {activeTab === 'mock_test' && (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4">
              <CheckSquare className="w-12 h-12 text-blue-600 mx-auto" />
              <h3 className="text-lg font-black text-slate-900">Mock Tests & Question Bank</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Configure online CBT mock tests, test series packages, timer settings, and score evaluation engines.
              </p>
            </div>
          )}

          {activeTab === 'study_material' && (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4">
              <BookOpen className="w-12 h-12 text-teal-600 mx-auto" />
              <h3 className="text-lg font-black text-slate-900">Study Material & PDF Notes</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Upload and manage downloadable notes, syllabus PDFs, and previous years question papers.
              </p>
            </div>
          )}

          {activeTab === 'pages' && (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4">
              <FileCheck2 className="w-12 h-12 text-indigo-600 mx-auto" />
              <h3 className="text-lg font-black text-slate-900">Custom Static Pages</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Manage Privacy Policy, Terms of Service, Disclaimer, Contact Us, and About Us pages.
              </p>
            </div>
          )}

          {activeTab === 'subscribers' && (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4">
              <Mail className="w-12 h-12 text-purple-600 mx-auto" />
              <h3 className="text-lg font-black text-slate-900">Newsletter & Email Subscribers</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Send daily exam alerts, result broadcasts, and admit card notices to 48,200+ registered candidates.
              </p>
            </div>
          )}

          {activeTab === 'support' && (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4">
              <HelpCircle className="w-12 h-12 text-amber-600 mx-auto" />
              <h3 className="text-lg font-black text-slate-900">Helpdesk & Support Inquiries</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Resolve candidate tickets, grievance appeals, roll number retrieval queries, and contact form submissions.
              </p>
            </div>
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
