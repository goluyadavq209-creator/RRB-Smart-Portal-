import React, { useState } from 'react';
import { CreditCard, CheckCircle2, AlertTriangle, IndianRupee } from 'lucide-react';
import { LibraryMember, PaymentMode, PaymentRecord } from '../types/library';
import {
  computeNextExpiryAfterPayment,
  getTodayKolkataIso,
} from '../utils/libraryLogic';

interface PaymentsViewProps {
  members: LibraryMember[];
  payments: PaymentRecord[];
  onRecordPayment: (
    member: LibraryMember,
    amount: number,
    mode: PaymentMode,
    linkId: string
  ) => Promise<{ skipped: boolean; newExpiry: string }>;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  members,
  payments,
  onRecordPayment,
}) => {
  const today = getTodayKolkataIso();
  const [routeMode, setRouteMode] = useState<'cash_upi' | 'razorpay'>('cash_upi');
  const [selectedDocId, setSelectedDocId] = useState<string>(members[0]?.docId || '');
  const [manualMode, setManualMode] = useState<'UPI' | 'Cash'>('UPI');
  const [amount, setAmount] = useState<number>(members[0]?.fee || 800);
  const [razorpayLinkId, setRazorpayLinkId] = useState<string>(
    'plink_' + String(Date.now()).slice(-6)
  );
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'warn'; text: string } | null>(
    null
  );

  const selectedMember =
    members.find((m) => m.docId === selectedDocId) || members[0];

  const predictedNewExpiry = selectedMember
    ? computeNextExpiryAfterPayment(selectedMember, today)
    : today;

  const isDuplicateRef = Boolean(
    selectedMember &&
      routeMode === 'razorpay' &&
      razorpayLinkId.trim() &&
      selectedMember.last_payment_ref === razorpayLinkId.trim()
  );

  const handleSelectMember = (docId: string) => {
    setSelectedDocId(docId);
    const found = members.find((m) => m.docId === docId);
    if (found) {
      setAmount(found.fee);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    setSubmitting(true);
    try {
      const mode: PaymentMode = routeMode === 'razorpay' ? 'Razorpay' : manualMode;
      const linkId =
        routeMode === 'razorpay'
          ? razorpayLinkId.trim() || `plink_${Date.now()}`
          : `manual-${Date.now()}`;

      const result = await onRecordPayment(selectedMember, amount, mode, linkId);
      if (result.skipped) {
        setFeedback({
          type: 'warn',
          text: `Duplicate event ignored: last_payment_ref (${linkId}) was already processed for ${selectedMember.member_id}. Expiry was NOT extended twice.`,
        });
      } else {
        setFeedback({
          type: 'ok',
          text: `Payment recorded for ${selectedMember.name} (${selectedMember.member_id}). Status = Paid · New Expiry = ${result.newExpiry}.`,
        });
        if (routeMode === 'razorpay') {
          setRazorpayLinkId('plink_' + String(Date.now()).slice(-6));
        }
      }
      setTimeout(() => setFeedback(null), 6000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Raasta A & Raasta B Payment Form */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs text-sky-700 dark:text-sky-400 font-semibold">
                Workflow 3 · Payment Update &amp; Idempotent Renewal
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 font-['Outfit']">
                Record Payment or Simulate Webhook
              </h2>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setRouteMode('cash_upi')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                  routeMode === 'cash_upi'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Raasta B: Cash / UPI
              </button>
              <button
                type="button"
                onClick={() => setRouteMode('razorpay')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                  routeMode === 'razorpay'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Raasta A: Razorpay Webhook
              </button>
            </div>
          </div>

          {feedback && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                feedback.type === 'ok'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300'
                  : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300'
              }`}
            >
              {feedback.type === 'ok' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          {members.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
              Add a library member first in &ldquo;Member Entry&rdquo; before recording payments.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Library Member
                </label>
                <select
                  value={selectedMember?.docId || ''}
                  onChange={(e) => handleSelectMember(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                >
                  {members.map((m) => (
                    <option key={m.docId} value={m.docId}>
                      {m.member_id} · {m.name} ({m.seat_no}) · {m.payment_status} · Exp:{' '}
                      {m.expiry_date}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Amount Paid (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={1000000}
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono tabular-nums text-slate-900 dark:text-white"
                  />
                </div>

                {routeMode === 'cash_upi' ? (
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Payment Mode
                    </label>
                    <select
                      value={manualMode}
                      onChange={(e) =>
                        setManualMode(e.target.value as 'UPI' | 'Cash')
                      }
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                    >
                      <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                      <option value="Cash">Cash at Library Desk</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Razorpay link_id (Idempotency Key)
                    </label>
                    <input
                      type="text"
                      required
                      value={razorpayLinkId}
                      onChange={(e) => setRazorpayLinkId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                )}
              </div>

              {selectedMember && (
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Payment Type Detected:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {!selectedMember.last_payment_date
                        ? 'First Payment (Keeps initial expiry)'
                        : `Renewal (+${selectedMember.plan_months} month${
                            selectedMember.plan_months > 1 ? 's' : ''
                          })`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Current Expiry Date:</span>
                    <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {selectedMember.expiry_date}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Computed New Expiry:</span>
                    <span className="font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-400">
                      {predictedNewExpiry}
                    </span>
                  </div>
                  {isDuplicateRef && (
                    <div className="text-amber-700 dark:text-amber-400 font-medium pt-1">
                      Note: This link_id matches last_payment_ref. Triggering will test duplicate-retry protection.
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>
                  {submitting
                    ? 'Processing...'
                    : routeMode === 'razorpay'
                    ? 'Simulate payment_link.paid Event'
                    : 'Confirm Payment & Update Sheet'}
                </span>
              </button>
            </form>
          )}
        </div>

        {/* Right: Razorpay Payload & Logic Explainer */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white font-['Outfit']">
              {routeMode === 'razorpay'
                ? 'Razorpay Webhook Event Payload'
                : 'Chapter 6 Renewal Compute Rule'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Prevents double expiry extension using <span className="font-mono">last_payment_ref</span>.
            </p>
          </div>

          <pre className="p-4 rounded-lg bg-slate-950 text-slate-100 text-[11px] font-mono overflow-x-auto leading-relaxed border border-slate-800">
            {JSON.stringify(
              {
                event: routeMode === 'razorpay' ? 'payment_link.paid' : 'manual_desk_payment',
                reference_id: selectedMember?.member_id || 'LIB-001',
                link_id:
                  routeMode === 'razorpay'
                    ? razorpayLinkId
                    : 'manual-' + today.replace(/-/g, ''),
                amount_inr: amount,
                previous_expiry: selectedMember?.expiry_date || today,
                new_expiry: predictedNewExpiry,
                payment_status: 'Paid',
              },
              null,
              2
            )}
          </pre>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            If the library member’s membership is still active (<span className="font-mono">expiry_date &gt; today</span>), renewal adds <span className="font-mono">plan_months</span> from their existing expiry date so they lose zero days. If expired, it extends from today.
          </p>
        </div>
      </div>

      {/* Payment Ledger Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Payment &amp; Renewal Ledger
          </h3>
          <span className="text-xs font-mono tabular-nums text-slate-500">
            {payments.length} transactions
          </span>
        </div>

        {payments.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No payments recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-500">
                  <th className="py-2.5 px-4 font-semibold">Date</th>
                  <th className="py-2.5 px-4 font-semibold">Member</th>
                  <th className="py-2.5 px-4 font-semibold">Mode</th>
                  <th className="py-2.5 px-4 font-semibold">Reference ID</th>
                  <th className="py-2.5 px-4 font-semibold">New Expiry</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {payments.map((p) => (
                  <tr key={p.payment_id}>
                    <td className="py-2.5 px-4 font-mono tabular-nums text-slate-600 dark:text-slate-400">
                      {p.payment_date}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {p.member_name}
                      </span>
                      <span className="ml-1.5 font-mono text-[11px] text-slate-500">
                        {p.member_id}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                      {p.mode}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">
                      {p.link_id}
                    </td>
                    <td className="py-2.5 px-4 font-mono tabular-nums text-emerald-700 dark:text-emerald-400 font-semibold">
                      {p.new_expiry}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                      <span className="inline-flex items-center">
                        <IndianRupee className="w-3 h-3" />
                        {p.amount}
                      </span>
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
