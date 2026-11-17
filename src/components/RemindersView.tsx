import React, { useState } from 'react';
import { Send, CheckCircle2, MessageSquare, ExternalLink } from 'lucide-react';
import { LibraryMember, ReminderLog } from '../types/library';
import {
  buildWhatsAppReminderText,
  getEligibleMembersForReminder,
  getTodayKolkataIso,
  REMIND_DAYS,
} from '../utils/libraryLogic';
import { WHATSAPP_TEMPLATES } from '../data/libraryGuideData';

interface RemindersViewProps {
  members: LibraryMember[];
  reminders: ReminderLog[];
  libraryName: string;
  onRunReminderBatch: (
    eligible: Array<{ member: LibraryMember; daysLeft: number }>
  ) => Promise<void>;
}

export const RemindersView: React.FC<RemindersViewProps> = ({
  members,
  reminders,
  libraryName,
  onRunReminderBatch,
}) => {
  const today = getTodayKolkataIso();
  const eligible = getEligibleMembersForReminder(members, today);
  const [running, setRunning] = useState(false);
  const [batchResult, setBatchResult] = useState<string | null>(null);

  const handleRunBatch = async () => {
    setRunning(true);
    try {
      await onRunReminderBatch(eligible);
      setBatchResult(
        eligible.length > 0
          ? `Dispatched ${eligible.length} WhatsApp reminder${eligible.length === 1 ? '' : 's'} and stamped last_reminder_date = ${today}. Re-running today will skip them automatically.`
          : 'No eligible reminders pending for today. Duplicate guard prevented extra messages.'
      );
      setTimeout(() => setBatchResult(null), 6000);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Workflow 2 Control Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-amber-700 dark:text-amber-400 font-semibold">
              Workflow 2 · Daily 9:00 AM Schedule Trigger (Asia/Kolkata)
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 font-['Outfit']">
              WhatsApp Expiry Reminder Queue
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Filters opted-in members matching <span className="font-mono">REMIND_DAYS = [{REMIND_DAYS.join(', ')}]</span> where <span className="font-mono">last_reminder_date !== {today}</span>.
            </p>
          </div>

          <button
            type="button"
            disabled={running}
            onClick={handleRunBatch}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>
              {running
                ? 'Running Workflow 2...'
                : `Run Reminder Batch (${eligible.length})`}
            </span>
          </button>
        </div>

        {batchResult && (
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{batchResult}</span>
          </div>
        )}

        {/* Approved Utility Template Box */}
        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Meta WhatsApp Utility Template (No Promotional Words — ~₹0.115/msg + GST)
          </div>
          <p className="text-xs font-mono text-slate-800 dark:text-slate-200">
            {WHATSAPP_TEMPLATES.reminderUtility}
          </p>
        </div>
      </div>

      {/* Eligible Today Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Eligible for Reminder Today ({eligible.length})
          </h3>
          <span className="text-xs font-mono text-slate-500">
            Today: {today}
          </span>
        </div>

        {eligible.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
            No pending reminders for today ({today}). Members who already received a reminder today or lack opt-in consent are skipped automatically.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {eligible.map(({ member, daysLeft }) => {
              const msg = buildWhatsAppReminderText(
                member.name,
                member.expiry_date,
                libraryName
              );
              return (
                <div
                  key={member.docId}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {member.name}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="font-mono text-slate-600 dark:text-slate-400">
                        {member.member_id}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="font-mono text-slate-600 dark:text-slate-400">
                        {member.phone}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        {daysLeft === 0 ? 'Expires Today' : `${daysLeft} Days Left`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      “{msg}”
                    </p>
                  </div>

                  <a
                    href={`https://wa.me/${member.phone}?text=${encodeURIComponent(msg)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-950/40 shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open WhatsApp</span>
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dispatch Log History */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Reminder Dispatch History
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {reminders.length} logged
          </span>
        </div>

        {reminders.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No reminders logged yet. Click &ldquo;Run Reminder Batch&rdquo; above to log dispatches.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-500">
                  <th className="py-2.5 px-4 font-semibold">Date</th>
                  <th className="py-2.5 px-4 font-semibold">Member</th>
                  <th className="py-2.5 px-4 font-semibold">Expiry Date</th>
                  <th className="py-2.5 px-4 font-semibold">Message Sent</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {reminders.map((log) => (
                  <tr key={log.reminder_id}>
                    <td className="py-2.5 px-4 font-mono tabular-nums text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {log.sent_date}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {log.member_name}
                      </span>
                      <span className="ml-1.5 font-mono text-[11px] text-slate-500">
                        ({log.member_id})
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono tabular-nums text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {log.expiry_date}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300 max-w-md truncate">
                      {log.message_preview}
                    </td>
                    <td className="py-2.5 px-4 text-right font-semibold text-emerald-700 dark:text-emerald-400">
                      {log.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
