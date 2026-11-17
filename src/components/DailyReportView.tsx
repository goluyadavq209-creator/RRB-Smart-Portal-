import React, { useState } from 'react';
import { Copy, Check, Mail, MessageCircle } from 'lucide-react';
import { LibraryConfig, LibraryMember } from '../types/library';
import { computeDailyReportStats, getTodayKolkataIso } from '../utils/libraryLogic';

interface DailyReportViewProps {
  members: LibraryMember[];
  config: LibraryConfig;
}

export const DailyReportView: React.FC<DailyReportViewProps> = ({
  members,
  config,
}) => {
  const today = getTodayKolkataIso();
  const stats = computeDailyReportStats(members, today);
  const [copiedKey, setCopiedKey] = useState<'email' | 'wa' | null>(null);

  const handleCopy = (key: 'email' | 'wa', text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
          Workflow 4 · Scheduled Daily Owner Summary ({today})
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 font-['Outfit']">
          Daily Library Owner Report
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Exact counts matching Chapter 7 rules so owner numbers and automated reports stay 100% synchronized.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
          <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
            <div className="text-xs text-slate-500">Active Members</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
              {stats.active.length}
            </div>
            <div className="text-[11px] font-mono text-slate-400 mt-1">
              expiry_date &gt;= {today}
            </div>
          </div>

          <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
            <div className="text-xs text-slate-500">Expired Memberships</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400 mt-1">
              {stats.expired.length}
            </div>
            <div className="text-[11px] font-mono text-slate-400 mt-1">
              expiry_date &lt; {today}
            </div>
          </div>

          <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
            <div className="text-xs text-slate-500">Pending Payments</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-1">
              {stats.pending.length}
            </div>
            <div className="text-[11px] font-mono text-slate-400 mt-1">
              payment_status === &quot;Pending&quot;
            </div>
          </div>
        </div>
      </div>

      {/* Tareeka 1 (Email) & Tareeka 2 (WhatsApp) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tareeka 1: Email Report */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white font-['Outfit']">
                <Mail className="w-4 h-4 text-emerald-600" />
                <span>Tareeka 1: Daily Email Report (Includes Names)</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('email', stats.emailReportText)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-xs font-medium cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                {copiedKey === 'email' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-xs text-slate-500">
              Subject: <span className="font-mono text-slate-800 dark:text-slate-200">Library report {today}</span>
            </div>

            <pre className="p-4 rounded-lg bg-slate-950 text-slate-100 text-xs font-mono whitespace-pre-wrap leading-relaxed border border-slate-800">
              {stats.emailReportText}
            </pre>
          </div>

          <div className="pt-2">
            <a
              href={`mailto:${encodeURIComponent(config.ownerEmail || '')}?subject=${encodeURIComponent(
                `Library report ${today}`
              )}&body=${encodeURIComponent(stats.emailReportText)}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Open in Email Client</span>
            </a>
          </div>
        </div>

        {/* Tareeka 2: WhatsApp 1-line Template */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white font-['Outfit']">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Tareeka 2: WhatsApp 1-Line Approved Template</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('wa', stats.whatsappOneLine)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-xs font-medium cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                {copiedKey === 'wa' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-slate-500">
              WhatsApp template body parameters do not allow newlines, so this single-line format maps cleanly to parameters {'{{1}}'}..{'{{4}}'}.
            </p>

            <pre className="p-4 rounded-lg bg-slate-950 text-slate-100 text-xs font-mono whitespace-pre-wrap leading-relaxed border border-slate-800">
              {stats.whatsappOneLine}
            </pre>
          </div>

          <div className="pt-2">
            <a
              href={`https://wa.me/${(config.ownerPhone || '').replace(/\D/g, '')}?text=${encodeURIComponent(
                stats.whatsappOneLine
              )}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Send to Owner WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
