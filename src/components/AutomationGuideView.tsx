import React, { useState } from 'react';
import { Copy, Check, CheckSquare, Square, FileText } from 'lucide-react';
import {
  COMMON_ERRORS_TABLE,
  DASHBOARD_FORMULAS,
  IMPLEMENTATION_CHECKLIST,
  OWNER_PROPOSAL_TEMPLATE,
  SHEET_COLUMNS_SPEC,
  WHATSAPP_TEMPLATES,
  WORKFLOW_CODES,
} from '../data/libraryGuideData';

interface AutomationGuideViewProps {
  completedSteps: string[];
  onToggleStep: (stepId: string) => Promise<void>;
}

type GuideTab = 'sheet' | 'workflows' | 'checklist' | 'proposal';

export const AutomationGuideView: React.FC<AutomationGuideViewProps> = ({
  completedSteps,
  onToggleStep,
}) => {
  const [tab, setTab] = useState<GuideTab>('sheet');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header & Section Tabs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            n8n Library Manager Automation · Complete Setup Kit
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 font-['Outfit']">
            Google Sheet Design, 4 n8n Workflows, Checklist &amp; Proposal
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Every workflow, formula, template, and script from the guide—converted cleanly from Gym to Library (LIB-001).
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 overflow-x-auto shrink-0">
          {(
            [
              ['sheet', 'Sheet & Formulas'],
              ['workflows', '4 Workflow Codes'],
              ['checklist', 'Checklist & Errors'],
              ['proposal', 'Proposal & Pricing'],
            ] as Array<[GuideTab, string]>
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                tab === id
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Google Sheet Design & Dashboard Formulas */}
      {tab === 'sheet' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Tab 1: Members (12 Exact Headings)
                </h3>
                <p className="text-xs text-slate-500">
                  Zaroori rule: Saari dates plain text <span className="font-mono">YYYY-MM-DD</span> format mein rakho.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  copyText(
                    'headers',
                    SHEET_COLUMNS_SPEC.map((c) => c.name).join(',')
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium cursor-pointer"
              >
                {copiedId === 'headers' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>Copy Header Row</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-500">
                    <th className="py-2.5 px-4 font-semibold">Col</th>
                    <th className="py-2.5 px-4 font-semibold">Column Heading</th>
                    <th className="py-2.5 px-4 font-semibold">Description</th>
                    <th className="py-2.5 px-4 font-semibold">Written By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {SHEET_COLUMNS_SPEC.map((row) => (
                    <tr key={row.name}>
                      <td className="py-2.5 px-4 font-mono text-slate-500">{row.col}</td>
                      <td className="py-2.5 px-4 font-mono font-semibold text-slate-900 dark:text-white">
                        {row.name}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">
                        {row.desc}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">{row.writer}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Tab 2: Dashboard Formulas (Sirf Formulas — n8n ise nahi chhuega)
              </h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {DASHBOARD_FORMULAS.map((f) => (
                <div
                  key={f.label}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {f.label}
                    </div>
                    <code className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 break-all">
                      {f.formula}
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText(f.label, f.formula)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium shrink-0 cursor-pointer"
                  >
                    {copiedId === f.label ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>Copy Formula</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: All 4 n8n Copy-Paste Code Nodes */}
      {tab === 'workflows' && (
        <div className="space-y-6">
          {[
            {
              id: 'wf1',
              title: 'Workflow 1: Member Entry (Form Trigger -> Code -> Google Sheets)',
              desc: 'Formats phone with 91, generates LIB-XXXXXX ID, computes month-end safe expiry_date.',
              code: WORKFLOW_CODES.workflow1,
            },
            {
              id: 'wf2',
              title: 'Workflow 2: Expiry Reminder Filter (Schedule 9 AM -> Get Rows -> Code -> WhatsApp -> Update Row)',
              desc: 'Sends reminders at REMIND_DAYS = [3, 0] in Asia/Kolkata and prevents same-day duplicates.',
              code: WORKFLOW_CODES.workflow2,
            },
            {
              id: 'wf3a',
              title: 'Workflow 3 (Step 5): Extract Razorpay payment_link.paid Payload',
              desc: 'Extracts member_id (reference_id), link_id, and amount in INR.',
              code: WORKFLOW_CODES.workflow3Extract,
            },
            {
              id: 'wf3b',
              title: 'Workflow 3 (Step 7): Compute Renewal Expiry & Idempotency Guard',
              desc: 'Skips duplicate webhook retries via last_payment_ref and extends expiry safely.',
              code: WORKFLOW_CODES.workflow3Compute,
            },
            {
              id: 'wf4',
              title: 'Workflow 4: Daily Owner Report Code Node',
              desc: 'Counts active, expired, and pending members for Email and 1-line WhatsApp summary.',
              code: WORKFLOW_CODES.workflow4,
            },
          ].map((block) => (
            <div
              key={block.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden"
            >
              <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {block.title}
                  </h3>
                  <p className="text-xs text-slate-500">{block.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => copyText(block.id, block.code)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium shrink-0 cursor-pointer"
                >
                  {copiedId === block.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>Copy Code</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-950 text-slate-100 text-[11px] font-mono overflow-x-auto leading-relaxed">
                {block.code}
              </pre>
            </div>
          ))}

          {/* Approved WhatsApp Templates */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Approved WhatsApp Utility Templates (Library Wording)
            </h3>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Expiry Reminder Template (Utility Category)
                  </div>
                  <code className="font-mono text-slate-800 dark:text-slate-200">
                    {WHATSAPP_TEMPLATES.reminderUtility}
                  </code>
                </div>
                <button
                  type="button"
                  onClick={() => copyText('tpl1', WHATSAPP_TEMPLATES.reminderUtility)}
                  className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 shrink-0 cursor-pointer"
                >
                  {copiedId === 'tpl1' ? 'Copied' : 'Copy'}
                </button>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Daily Owner Report Template (1-Line)
                  </div>
                  <code className="font-mono text-slate-800 dark:text-slate-200">
                    {WHATSAPP_TEMPLATES.dailyReportOneLine}
                  </code>
                </div>
                <button
                  type="button"
                  onClick={() => copyText('tpl2', WHATSAPP_TEMPLATES.dailyReportOneLine)}
                  className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 shrink-0 cursor-pointer"
                >
                  {copiedId === 'tpl2' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Interactive Implementation Checklist & Troubleshooting */}
      {tab === 'checklist' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Complete Implementation Checklist (12 Steps)
                </h3>
                <p className="text-xs text-slate-500">
                  Track your n8n + Google Sheet + WhatsApp setup progress before handover.
                </p>
              </div>
              <span className="text-xs font-mono tabular-nums font-semibold text-emerald-700 dark:text-emerald-400">
                {completedSteps.length}/{IMPLEMENTATION_CHECKLIST.length} Complete
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {IMPLEMENTATION_CHECKLIST.map((item) => {
                const done = completedSteps.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onToggleStep(item.id)}
                    className="w-full py-3 flex items-center gap-3 text-left text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-lg transition-colors cursor-pointer"
                  >
                    {done ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span
                      className={
                        done
                          ? 'line-through text-slate-400'
                          : 'text-slate-800 dark:text-slate-200 font-medium'
                      }
                    >
                      {item.text}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Common Errors &amp; Troubleshooting
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-500">
                    <th className="py-2.5 px-4 font-semibold">Problem</th>
                    <th className="py-2.5 px-4 font-semibold">Wajah</th>
                    <th className="py-2.5 px-4 font-semibold">Solution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {COMMON_ERRORS_TABLE.map((e) => (
                    <tr key={e.problem}>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {e.problem}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {e.cause}
                      </td>
                      <td className="py-3 px-4 text-emerald-700 dark:text-emerald-400 font-medium">
                        {e.solution}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Library Owner Proposal & Pricing */}
      {tab === 'proposal' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Library Manager Automation Proposal Template</span>
              </div>
              <button
                type="button"
                onClick={() => copyText('proposal', OWNER_PROPOSAL_TEMPLATE)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium cursor-pointer"
              >
                {copiedId === 'proposal' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>Copy Proposal</span>
              </button>
            </div>
            <pre className="p-4 rounded-lg bg-slate-950 text-slate-100 text-xs font-mono whitespace-pre-wrap leading-relaxed border border-slate-800">
              {OWNER_PROPOSAL_TEMPLATE}
            </pre>
          </div>

          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Pricing Structure &amp; Demo Flow (10 Minutes)
            </h3>
            <div className="space-y-3 text-slate-600 dark:text-slate-300">
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="font-bold text-slate-900 dark:text-white">
                  Setup Fee (One-time): ₹10,000 – ₹15,000
                </div>
                <p className="mt-1">
                  Includes Sheet design, 4 workflows, WhatsApp template setup, testing, and 30-min owner training.
                </p>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="font-bold text-slate-900 dark:text-white">
                  Running Costs: Client Accounts
                </div>
                <p className="mt-1">
                  n8n hosting, Meta WhatsApp Utility messages (~₹0.115/msg + GST), and Razorpay fees stay on the library owner&apos;s accounts.
                </p>
              </div>
              <div className="space-y-1.5 pt-2">
                <div className="font-bold text-slate-900 dark:text-white">
                  10-Minute Library Demo Steps:
                </div>
                <p>1. Open dummy Sheet with 5 sample students.</p>
                <p>2. Submit front desk form and show LIB-ID row appear automatically.</p>
                <p>3. Run Workflow 2 for a student expiring in 3 days and show WhatsApp reminder.</p>
                <p>4. Record payment and show Status = Paid + extended expiry.</p>
                <p>5. Show Daily Report summary (Active, Expired, Pending).</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
