import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  LayoutDashboard,
  Table2,
  UserPlus,
  BellRing,
  CreditCard,
  FileBarChart,
  Workflow,
  Sun,
  Moon,
  LogIn,
  LogOut,
  Menu,
  X,
  AlertCircle,
} from 'lucide-react';
import {
  auth,
  googleSignIn,
  logoutGoogle,
  onAuthStateChanged,
  User,
} from './lib/firebase';
import {
  AppView,
  LibraryConfig,
  LibraryMember,
  PaymentMode,
  PaymentRecord,
  ReminderLog,
} from './types/library';
import {
  buildSampleMembers,
  buildSamplePayments,
  buildSampleReminders,
} from './data/libraryGuideData';
import {
  buildWhatsAppReminderText,
  computeDaysLeft,
  computeNextExpiryAfterPayment,
  getTodayKolkataIso,
} from './utils/libraryLogic';
import {
  deleteMemberFromFirestore,
  ensureOwnerWorkspace,
  recordPaymentBatchInFirestore,
  recordRemindersBatchInFirestore,
  saveConfigToFirestore,
  saveMemberToFirestore,
  subscribeOwnerConfig,
  subscribeOwnerMembers,
  subscribeOwnerPayments,
  subscribeOwnerReminders,
} from './services/libraryFirestore';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DashboardView } from './components/DashboardView';
import { MembersSheetView } from './components/MembersSheetView';
import { MemberEntryView } from './components/MemberEntryView';
import { RemindersView } from './components/RemindersView';
import { PaymentsView } from './components/PaymentsView';
import { DailyReportView } from './components/DailyReportView';
import { AutomationGuideView } from './components/AutomationGuideView';

const NAV_ITEMS: Array<{
  id: AppView;
  label: string;
  breadcrumb: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'dashboard', label: '01. Dashboard', breadcrumb: 'Dashboard', icon: LayoutDashboard },
  { id: 'members', label: '02. Members Sheet', breadcrumb: 'Members Sheet', icon: Table2 },
  { id: 'entry', label: '03. Member Entry', breadcrumb: 'Member Entry', icon: UserPlus },
  { id: 'reminders', label: '04. Expiry Reminders', breadcrumb: 'Expiry Reminders', icon: BellRing },
  { id: 'payments', label: '05. Payment Update', breadcrumb: 'Payment Update', icon: CreditCard },
  { id: 'report', label: '06. Daily Report', breadcrumb: 'Daily Report', icon: FileBarChart },
  { id: 'guide', label: '07. n8n Setup Guide', breadcrumb: 'n8n Setup Guide', icon: Workflow },
];

const DEFAULT_CONFIG: LibraryConfig = {
  ownerId: 'local-preview',
  libraryName: 'My Study Library',
  ownerEmail: '',
  ownerPhone: '',
  totalSeats: 80,
  completedSteps: [],
};

function LibraryDeskWorkspace() {
  const [activeView, setActiveView] = useState<AppView>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [members, setMembers] = useState<LibraryMember[]>(() =>
    buildSampleMembers('local-preview')
  );
  const [payments, setPayments] = useState<PaymentRecord[]>(() =>
    buildSamplePayments('local-preview')
  );
  const [reminders, setReminders] = useState<ReminderLog[]>(() =>
    buildSampleReminders()
  );
  const [config, setConfig] = useState<LibraryConfig>(DEFAULT_CONFIG);

  // Sync Tailwind dark mode class
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  // Listen to Firebase Auth state & attach Firestore subscriptions only when signed in
  useEffect(() => {
    let unsubMembers: (() => void) | undefined;
    let unsubPayments: (() => void) | undefined;
    let unsubReminders: (() => void) | undefined;
    let unsubConfig: (() => void) | undefined;
    let cancelled = false;

    const cleanupSubs = () => {
      unsubMembers?.();
      unsubPayments?.();
      unsubReminders?.();
      unsubConfig?.();
      unsubMembers = undefined;
      unsubPayments = undefined;
      unsubReminders = undefined;
      unsubConfig = undefined;
    };

    const unsubAuth = onAuthStateChanged(auth, async (nextUser) => {
      cleanupSubs();
      setAuthError(null);
      setActionError(null);

      if (!nextUser) {
        setUser(null);
        setMembers(buildSampleMembers('local-preview'));
        setPayments(buildSamplePayments('local-preview'));
        setReminders(buildSampleReminders());
        setConfig(DEFAULT_CONFIG);
        setIsDataLoading(false);
        setAuthReady(true);
        return;
      }

      if (!nextUser.emailVerified) {
        setUser(nextUser);
        setAuthError('Please verify your Google account email to enable Cloud Firestore sync.');
        setIsDataLoading(false);
        setAuthReady(true);
        return;
      }

      setUser(nextUser);
      setIsDataLoading(true);
      try {
        await ensureOwnerWorkspace(nextUser);
        if (cancelled) return;

        unsubMembers = subscribeOwnerMembers(nextUser.uid, (list) => {
          setMembers(list);
          setIsDataLoading(false);
        });
        unsubPayments = subscribeOwnerPayments(nextUser.uid, (list) => {
          setPayments(list);
        });
        unsubReminders = subscribeOwnerReminders(nextUser.uid, (list) => {
          setReminders(list);
        });
        unsubConfig = subscribeOwnerConfig(nextUser.uid, (cfg) => {
          setConfig(cfg);
        });
      } catch (err) {
        setIsDataLoading(false);
        setActionError(err instanceof Error ? err.message : 'Could not load cloud workspace.');
      } finally {
        if (!cancelled) setAuthReady(true);
      }
    });

    return () => {
      cancelled = true;
      cleanupSubs();
      unsubAuth();
    };
  }, []);

  const handleSignIn = async () => {
    setAuthError(null);
    try {
      await googleSignIn();
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'Google Sign-In was cancelled or failed.'
      );
    }
  };

  const handleSignOut = async () => {
    setAuthError(null);
    await logoutGoogle();
  };

  const isCloudSynced = Boolean(user && user.emailVerified);
  const activeOwnerId = isCloudSynced && user ? user.uid : 'local-preview';

  const handleSaveMember = async (member: LibraryMember, isUpdate: boolean) => {
    setActionError(null);
    if (isCloudSynced && user) {
      await saveMemberToFirestore(user.uid, member, isUpdate);
      return;
    }

    setMembers((prev) => {
      const exists = prev.some((m) => m.docId === member.docId);
      if (exists) {
        return prev.map((m) => (m.docId === member.docId ? member : m));
      }
      return [...prev, member];
    });
  };

  const handleDeleteMember = async (docId: string) => {
    setActionError(null);
    if (isCloudSynced && user) {
      await deleteMemberFromFirestore(user.uid, docId);
      return;
    }
    setMembers((prev) => prev.filter((m) => m.docId !== docId));
  };

  const handleRunReminderBatch = async (
    eligible: Array<{ member: LibraryMember; daysLeft: number }>
  ) => {
    if (eligible.length === 0) return;
    setActionError(null);
    const today = getTodayKolkataIso();

    const batchItems = eligible.map(({ member, daysLeft }) => {
      const msg = buildWhatsAppReminderText(
        member.name,
        member.expiry_date,
        config.libraryName
      );
      const log: ReminderLog = {
        reminder_id: `rem_${Date.now()}_${member.member_id}`,
        ownerId: activeOwnerId,
        member_id: member.member_id,
        member_name: member.name,
        phone: member.phone,
        expiry_date: member.expiry_date,
        days_left: daysLeft,
        message_preview: msg,
        sent_date: today,
        status: isCloudSynced ? 'Sent' : 'Simulated',
      };
      return { member, log };
    });

    if (isCloudSynced && user) {
      await recordRemindersBatchInFirestore(user.uid, batchItems);
      return;
    }

    const updatedIds = new Set(batchItems.map((i) => i.member.docId));
    setMembers((prev) =>
      prev.map((m) =>
        updatedIds.has(m.docId) ? { ...m, last_reminder_date: today } : m
      )
    );
    setReminders((prev) => [...batchItems.map((i) => i.log), ...prev]);
  };

  const handleQuickSendReminder = async (member: LibraryMember) => {
    const today = getTodayKolkataIso();
    if (member.last_reminder_date === today) return;
    const daysLeft = computeDaysLeft(member.expiry_date, today);
    await handleRunReminderBatch([{ member, daysLeft }]);
  };

  const handleRecordPayment = async (
    member: LibraryMember,
    amount: number,
    mode: PaymentMode,
    linkId: string
  ): Promise<{ skipped: boolean; newExpiry: string }> => {
    setActionError(null);
    const today = getTodayKolkataIso();

    // Idempotency guard from Chapter 6 (Workflow 3)
    if (member.last_payment_ref && member.last_payment_ref === linkId) {
      return { skipped: true, newExpiry: member.expiry_date };
    }

    const newExpiry = computeNextExpiryAfterPayment(member, today);
    const payment: PaymentRecord = {
      payment_id: `pay_${Date.now()}_${member.member_id}`,
      ownerId: activeOwnerId,
      member_doc_id: member.docId,
      member_id: member.member_id,
      member_name: member.name,
      amount: Math.max(0, Number(amount) || 0),
      mode,
      link_id: linkId,
      payment_date: today,
      previous_expiry: member.expiry_date,
      new_expiry: newExpiry,
    };

    if (isCloudSynced && user) {
      await recordPaymentBatchInFirestore(user.uid, member, payment, newExpiry);
      return { skipped: false, newExpiry };
    }

    setMembers((prev) =>
      prev.map((m) =>
        m.docId === member.docId
          ? {
              ...m,
              payment_status: 'Paid',
              last_payment_date: today,
              expiry_date: newExpiry,
              last_payment_ref: linkId,
            }
          : m
      )
    );
    setPayments((prev) => [payment, ...prev]);
    return { skipped: false, newExpiry };
  };

  const handleUpdateConfig = async (nextConfig: LibraryConfig) => {
    setActionError(null);
    if (isCloudSynced && user) {
      await saveConfigToFirestore(user.uid, nextConfig);
      return;
    }
    setConfig(nextConfig);
  };

  const handleToggleStep = async (stepId: string) => {
    const exists = config.completedSteps.includes(stepId);
    const nextSteps = exists
      ? config.completedSteps.filter((id) => id !== stepId)
      : [...config.completedSteps, stepId];
    await handleUpdateConfig({
      ...config,
      completedSteps: nextSteps,
    });
  };

  const activeNavItem =
    NAV_ITEMS.find((n) => n.id === activeView) || NAV_ITEMS[0];

  const handleSelectNav = (id: AppView) => {
    setActiveView(id);
    setMobileMenuOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full justify-between">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="px-4 pt-5 pb-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-900 dark:text-white font-['Outfit'] truncate">
                Library Desk
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {config.libraryName}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            aria-label="Close navigation menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="px-3 space-y-1" aria-label="Primary Sidebar Navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectNav(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${
                  active
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Workspace Sync Card */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
          <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">
            {isCloudSynced ? 'Cloud Firestore Synced' : 'Local Preview Mode'}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            {isCloudSynced
              ? `Signed in as ${user?.email || 'Library Owner'}`
              : 'Sign in with Google to save members, payments, and checklist permanently.'}
          </p>
        </div>

        {isCloudSynced ? (
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSignIn}
            disabled={!authReady}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign in with Google</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
      {/* Desktop Sidebar (240px) */}
      <aside className="hidden lg:block w-60 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-64 max-w-[80vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-full z-10">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar Contract: Breadcrumb Left — Actions Right */}
        <header className="sticky top-0 z-30 h-14 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 text-xs truncate">
              <span className="font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                Library Desk
              </span>
              <span className="text-slate-400" aria-hidden="true">/</span>
              <span className="text-slate-600 dark:text-slate-300 font-medium truncate">
                {activeNavItem.breadcrumb}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsDark((prev) => !prev)}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Light Mode' : 'Dark Mode'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {!isCloudSynced && (
              <button
                type="button"
                onClick={handleSignIn}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sync Cloud</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveView('entry')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>New Member</span>
            </button>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-5">
          {(authError || actionError) && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError || actionError}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAuthError(null);
                  setActionError(null);
                }}
                className="text-xs font-semibold underline cursor-pointer shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          {activeView === 'dashboard' && (
            <DashboardView
              members={members}
              payments={payments}
              config={config}
              isLoading={isDataLoading}
              onNavigate={setActiveView}
              onUpdateConfig={handleUpdateConfig}
              onQuickSendReminder={handleQuickSendReminder}
            />
          )}

          {activeView === 'members' && (
            <MembersSheetView
              members={members}
              onSaveMember={handleSaveMember}
              onDeleteMember={handleDeleteMember}
              onNavigateToEntry={() => setActiveView('entry')}
            />
          )}

          {activeView === 'entry' && (
            <MemberEntryView
              ownerId={activeOwnerId}
              members={members}
              onSaveMember={handleSaveMember}
            />
          )}

          {activeView === 'reminders' && (
            <RemindersView
              members={members}
              reminders={reminders}
              libraryName={config.libraryName}
              onRunReminderBatch={handleRunReminderBatch}
            />
          )}

          {activeView === 'payments' && (
            <PaymentsView
              members={members}
              payments={payments}
              onRecordPayment={handleRecordPayment}
            />
          )}

          {activeView === 'report' && (
            <DailyReportView members={members} config={config} />
          )}

          {activeView === 'guide' && (
            <AutomationGuideView
              completedSteps={config.completedSteps}
              onToggleStep={handleToggleStep}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LibraryDeskWorkspace />
    </ErrorBoundary>
  );
}
