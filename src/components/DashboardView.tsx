import React, { useState } from 'react';
import {
  Users,
  UserCheck,
  AlertCircle,
  Clock,
  Armchair,
  IndianRupee,
  ArrowUpRight,
  Send,
  CreditCard,
  FileBarChart,
  UserPlus,
  Settings,
  Check,
} from 'lucide-react';
import {
  AppView,
  LibraryConfig,
  LibraryMember,
  PaymentRecord,
} from '../types/library';
import {
  buildWhatsAppReminderText,
  computeDailyReportStats,
  computeDaysLeft,
  getTodayKolkataIso,
} from '../utils/libraryLogic';

interface DashboardViewProps {
  members: LibraryMember[];
  payments: PaymentRecord[];
  config: LibraryConfig;
  isLoading: boolean;
  onNavigate: (view: AppView) => void;
  onUpdateConfig: (next: LibraryConfig) => Promise<void>;
  onQuickSendReminder: (member: LibraryMember) => Promise<void>;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  members,
  payments,
  config,
  isLoading,
  onNavigate,
  onUpdateConfig,
  onQuickSendReminder,
}) => {
  const today = getTodayKolkataIso();
  const stats = computeDailyReportStats(members, today);
  const totalCollected = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const occupiedSeats = stats.active.length;

  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [libName, setLibName] = useState(config.libraryName);
  const [totalSeats, setTotalSeats] = useState(config.totalSeats);
  const [ownerEmail, setOwnerEmail] = useState(config.ownerEmail);
  const [ownerPhone, setOwnerPhone] = useState(config.ownerPhone);
  const [savingConfig, setSavingConfig] = useState(false);

  const watchlist = members
    .map((m) => ({ member: m, daysLeft: computeDaysLeft(m.expiry_date, today) }))
    .filter((item) => item.daysLeft <= 3 || item.member.payment_status === 'Pending')
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      await onUpdateConfig({
        ...config,
        libraryName: libName.trim() || 'My Study Library',
        totalSeats: Math.max(1, Number(totalSeats) || 80),
        ownerEmail: ownerEmail.trim(),
        ownerPhone: ownerPhone.trim(),
      });
      setIsEditingConfig(false);
    } finally {
      setSavingConfig(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-28 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse"
            />
          ))}
        </div>
        <div className="h-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Library Identity & Seat Capacity Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Sheet Dashboard Summary</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{today} (Asia/Kolkata)</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1 font-['Outfit']">
            {config.libraryName}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Seat Capacity: <span className="font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">{occupiedSeats}/{config.totalSeats}</span> occupied
            <span className="mx-2" aria-hidden="true">·</span>
            Recorded Revenue: <span className="font-mono tabular-nums font-semibold text-emerald-700 dark:text-emerald-400">₹{totalCollected.toLocaleString('en-IN')}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setLibName(config.libraryName);
              setTotalSeats(config.totalSeats);
              setOwnerEmail(config.ownerEmail);
              setOwnerPhone(config.ownerPhone);
              setIsEditingConfig(!isEditingConfig);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Library Settings</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('entry')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* Inline Settings Editor */}
      {isEditingConfig && (
        <form
          onSubmit={handleSaveConfig}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Library Name
            </label>
            <input
              type="text"
              required
              value={libName}
              onChange={(e) => setLibName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Total Study Seats
            </label>
            <input
              type="number"
              min={1}
              max={5000}
              required
              value={totalSeats}
              onChange={(e) => setTotalSeats(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-mono tabular-nums text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Owner Report Email
            </label>
            <input
              type="email"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              placeholder="owner@library.com"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Owner WhatsApp (with 91)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                placeholder="919876543210"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-mono text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                disabled={savingConfig}
                className="px-3 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold shrink-0 cursor-pointer"
              >
                {savingConfig ? '...' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* 4 Core KPI Cards (Mirroring Chapter 3 Dashboard Tab Formulas) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Total Members</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {stats.total}
          </div>
          <div className="mt-1 text-[11px] font-mono text-slate-400 truncate">
            =COUNTA(Members!A2:A)
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Active Members</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            {stats.active.length}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            expiry_date &gt;= today
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Expired Members</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400">
            {stats.expired.length}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            expiry_date &lt; today
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Pending Payments</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
            {stats.pending.length}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            payment_status = Pending
          </div>
        </div>
      </div>

      {/* 4 Workflow Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => onNavigate('entry')}
          className="text-left p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              01. Member Entry
            </span>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            Front desk form, seat assignment, month-end safe expiry calculation.
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('reminders')}
          className="text-left p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
              02. Expiry Reminder
            </span>
            <Send className="w-4 h-4 text-slate-400 group-hover:text-amber-600" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            3-day &amp; same-day WhatsApp Utility reminder queue with duplicate guard.
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('payments')}
          className="text-left p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-700 dark:text-sky-400">
              03. Payment Update
            </span>
            <CreditCard className="w-4 h-4 text-slate-400 group-hover:text-sky-600" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            Razorpay webhook or Cash/UPI confirmation with auto expiry renewal.
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('report')}
          className="text-left p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              04. Daily Report
            </span>
            <FileBarChart className="w-4 h-4 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            Email &amp; WhatsApp daily owner summary of active, expired, pending fees.
          </p>
        </button>
      </div>

      {/* Expiry & Pending Watchlist Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Attention Required: Expiring Soon, Expired &amp; Pending Fees
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Members within REMIND_DAYS = [3, 0], overdue seats, or unpaid status
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('members')}
            className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
          >
            View All Members
          </button>
        </div>

        {watchlist.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <Check className="w-6 h-6 text-emerald-600 mx-auto" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              All library memberships and payments are up to date.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 bg-slate-50/60 dark:bg-slate-950/40">
                  <th className="py-2.5 px-4 font-semibold">Member</th>
                  <th className="py-2.5 px-4 font-semibold">Seat / Shift</th>
                  <th className="py-2.5 px-4 font-semibold">Plan</th>
                  <th className="py-2.5 px-4 font-semibold">Expiry Date</th>
                  <th className="py-2.5 px-4 font-semibold">Payment</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {watchlist.map(({ member, daysLeft }) => {
                  const alreadyRemindedToday = member.last_reminder_date === today;
                  const waText = encodeURIComponent(
                    buildWhatsAppReminderText(member.name, member.expiry_date, config.libraryName)
                  );
                  return (
                    <tr
                      key={member.docId}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {member.name}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 tabular-nums">
                          {member.member_id} · {member.phone}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-1.5 font-mono tabular-nums text-slate-800 dark:text-slate-200">
                          <Armchair className="w-3.5 h-3.5 text-slate-400" />
                          <span>{member.seat_no}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">{member.shift}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {member.plan}
                        </div>
                        <div className="text-[11px] font-mono tabular-nums text-slate-500 inline-flex items-center">
                          <IndianRupee className="w-3 h-3" />
                          {member.fee}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums">
                        <div className="text-slate-900 dark:text-white">{member.expiry_date}</div>
                        <div
                          className={`text-[11px] font-semibold ${
                            daysLeft < 0
                              ? 'text-rose-600 dark:text-rose-400'
                              : daysLeft <= 3
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {daysLeft < 0
                            ? `Expired ${Math.abs(daysLeft)}d ago`
                            : daysLeft === 0
                            ? 'Expires today'
                            : `In ${daysLeft} day${daysLeft === 1 ? '' : 's'}`}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-xs font-semibold ${
                            member.payment_status === 'Paid'
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-amber-700 dark:text-amber-400'
                          }`}
                        >
                          {member.payment_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          {member.whatsapp_opt_in && (
                            <button
                              type="button"
                              disabled={alreadyRemindedToday}
                              onClick={() => onQuickSendReminder(member)}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                                alreadyRemindedToday
                                  ? 'border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed'
                                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer'
                              }`}
                              title={
                                alreadyRemindedToday
                                  ? 'Reminder already logged today'
                                  : 'Log WhatsApp reminder'
                              }
                            >
                              {alreadyRemindedToday ? 'Reminded Today' : 'Send Reminder'}
                            </button>
                          )}
                          <a
                            href={`https://wa.me/${member.phone}?text=${waText}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 rounded-md text-[11px] font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60"
                          >
                            WhatsApp
                          </a>
                          <button
                            type="button"
                            onClick={() => onNavigate('payments')}
                            className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 cursor-pointer"
                          >
                            Collect Fee
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
