import React, { useState } from 'react';
import { CheckCircle2, UserPlus, Info } from 'lucide-react';
import {
  DEFAULT_PLAN_FEES,
  LibraryMember,
  PLAN_MONTHS,
  PlanType,
  SHIFTS,
  ShiftType,
} from '../types/library';
import {
  addMonths,
  createMemberPayload,
  getTodayKolkataIso,
  normalizePhone,
} from '../utils/libraryLogic';

interface MemberEntryViewProps {
  ownerId: string;
  members: LibraryMember[];
  onSaveMember: (member: LibraryMember, isUpdate: boolean) => Promise<void>;
}

export const MemberEntryView: React.FC<MemberEntryViewProps> = ({
  ownerId,
  members,
  onSaveMember,
}) => {
  const today = getTodayKolkataIso();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [plan, setPlan] = useState<PlanType>('Monthly');
  const [fee, setFee] = useState<number>(DEFAULT_PLAN_FEES.Monthly);
  const [startDate, setStartDate] = useState(today);
  const [seatNo, setSeatNo] = useState('A-15');
  const [shift, setShift] = useState<ShiftType>('Full Day');
  const [whatsappOptIn, setWhatsappOptIn] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  const normalizedPhone = normalizePhone(phone);
  const duplicateMatch = normalizedPhone.length >= 10
    ? members.find((m) => m.phone === normalizedPhone)
    : undefined;

  const computedMonths = PLAN_MONTHS[plan];
  const computedExpiry = addMonths(startDate, computedMonths);

  const previewJson = createMemberPayload({
    ownerId,
    name: name || 'Priya Sharma',
    phone: phone || '9876543210',
    plan,
    fee,
    start_date: startDate,
    seat_no: seatNo,
    shift,
    whatsapp_opt_in: whatsappOptIn,
    existingMemberId: duplicateMatch?.member_id,
  });

  const handlePlanChange = (nextPlan: PlanType) => {
    setPlan(nextPlan);
    setFee(DEFAULT_PLAN_FEES[nextPlan]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || normalizedPhone.length < 10) return;
    setSubmitting(true);
    try {
      const payload = createMemberPayload({
        ownerId,
        name,
        phone,
        plan,
        fee,
        start_date: startDate,
        seat_no: seatNo,
        shift,
        whatsapp_opt_in: whatsappOptIn,
        existingMemberId: duplicateMatch?.member_id,
      });

      const docId = duplicateMatch ? duplicateMatch.docId : payload.member_id;
      const mergedMember: LibraryMember = duplicateMatch
        ? {
            ...duplicateMatch,
            name: payload.name,
            phone: payload.phone,
            plan: payload.plan,
            plan_months: payload.plan_months,
            fee: payload.fee,
            start_date: payload.start_date,
            expiry_date: payload.expiry_date,
            seat_no: payload.seat_no,
            shift: payload.shift,
            whatsapp_opt_in: payload.whatsapp_opt_in,
          }
        : { docId, ...payload };

      await onSaveMember(mergedMember, Boolean(duplicateMatch));

      setSavedFeedback(
        duplicateMatch
          ? `Phone matched ${duplicateMatch.member_id}: Existing row updated cleanly (no duplicate created).`
          : `Saved ${payload.member_id} (${payload.name}) with expiry ${payload.expiry_date}.`
      );
      setName('');
      setPhone('');
      setTimeout(() => setSavedFeedback(null), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left: Front Desk Library Registration Form (Workflow 1) */}
      <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
        <div>
          <div className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
            Workflow 1 · Front Desk Registration Form
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 font-['Outfit']">
            Library Registration (n8n Form Trigger Equivalent)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Formats phone to 91XXXXXXXXXX, calculates month-end safe expiry_date, and prevents duplicate rows by matching on phone.
          </p>
        </div>

        {savedFeedback && (
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{savedFeedback}</span>
          </div>
        )}

        {duplicateMatch && (
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Phone {normalizedPhone} already exists ({duplicateMatch.member_id} · {duplicateMatch.name}). Submitting will update this existing record instead of creating a duplicate row (Append or Update behavior).
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Student / Member Name
              </label>
              <input
                type="text"
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                WhatsApp Phone (10 digits or 91...)
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Membership Plan
              </label>
              <select
                value={plan}
                onChange={(e) => handlePlanChange(e.target.value as PlanType)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              >
                <option value="Monthly">Monthly (1 Month)</option>
                <option value="Quarterly">Quarterly (3 Months)</option>
                <option value="Half-yearly">Half-yearly (6 Months)</option>
                <option value="Yearly">Yearly (12 Months)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Plan Fee (₹)
              </label>
              <input
                type="number"
                required
                min={0}
                max={1000000}
                value={fee}
                onChange={(e) => setFee(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono tabular-nums text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Start Date (YYYY-MM-DD)
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Auto-Computed Expiry Date
              </label>
              <div className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/60 font-mono tabular-nums text-emerald-700 dark:text-emerald-400 font-semibold">
                {computedExpiry}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Seat / Desk Number
              </label>
              <input
                type="text"
                required
                maxLength={20}
                value={seatNo}
                onChange={(e) => setSeatNo(e.target.value)}
                placeholder="e.g. A-15"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Study Shift
              </label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value as ShiftType)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              >
                {SHIFTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mandatory Opt-In Checkbox (Chapter 5 & 8 DPDP Compliance) */}
          <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 cursor-pointer">
            <input
              type="checkbox"
              checked={whatsappOptIn}
              onChange={(e) => setWhatsappOptIn(e.target.checked)}
              className="mt-0.5"
            />
            <span className="text-xs text-slate-700 dark:text-slate-300">
              Mujhe WhatsApp par library membership updates chahiye (WhatsApp reminder opt-in consent)
            </span>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>
              {submitting
                ? 'Saving...'
                : duplicateMatch
                ? 'Update Existing Member'
                : 'Save Library Member'}
            </span>
          </button>
        </form>
      </div>

      {/* Right: Live Code Node Output Preview */}
      <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white font-['Outfit']">
            Live Workflow 1 Transform Output
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Exact JSON output produced by the Code node before appending to the Members table.
          </p>
        </div>

        <pre className="p-4 rounded-lg bg-slate-950 text-slate-100 text-[11px] font-mono overflow-x-auto leading-relaxed border border-slate-800">
          {JSON.stringify(
            {
              member_id: previewJson.member_id,
              name: previewJson.name,
              phone: previewJson.phone,
              plan: previewJson.plan,
              plan_months: previewJson.plan_months,
              fee: previewJson.fee,
              start_date: previewJson.start_date,
              expiry_date: previewJson.expiry_date,
              payment_status: previewJson.payment_status,
              seat_no: previewJson.seat_no,
              shift: previewJson.shift,
              whatsapp_opt_in: previewJson.whatsapp_opt_in,
            },
            null,
            2
          )}
        </pre>

        <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="font-semibold text-slate-800 dark:text-slate-200">
            Edge Case Guaranteed:
          </div>
          <p>
            Month-end safe math: <span className="font-mono">2026-01-31 + 1 month = 2026-02-28</span>. Phone numbers with spaces, dashes, or +91 are stripped and standardized to <span className="font-mono">91XXXXXXXXXX</span>.
          </p>
        </div>
      </div>
    </div>
  );
};
