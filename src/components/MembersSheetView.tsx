import React, { useState } from 'react';
import {
  Search,
  Download,
  Edit3,
  Trash2,
  UserPlus,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import {
  LibraryMember,
  PLAN_MONTHS,
  PlanType,
  SHIFTS,
  ShiftType,
} from '../types/library';
import {
  addMonths,
  computeDaysLeft,
  exportMembersCsv,
  getTodayKolkataIso,
  normalizePhone,
} from '../utils/libraryLogic';

interface MembersSheetViewProps {
  members: LibraryMember[];
  onSaveMember: (member: LibraryMember, isUpdate: boolean) => Promise<void>;
  onDeleteMember: (docId: string) => Promise<void>;
  onNavigateToEntry: () => void;
}

type StatusFilter = 'all' | 'active' | 'expiring' | 'expired' | 'pending';

export const MembersSheetView: React.FC<MembersSheetViewProps> = ({
  members,
  onSaveMember,
  onDeleteMember,
  onNavigateToEntry,
}) => {
  const today = getTodayKolkataIso();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [editing, setEditing] = useState<LibraryMember | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = members.filter((m) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      m.name.toLowerCase().includes(q) ||
      m.member_id.toLowerCase().includes(q) ||
      m.phone.includes(q) ||
      m.seat_no.toLowerCase().includes(q);
    if (!matchesSearch) return false;

    const daysLeft = computeDaysLeft(m.expiry_date, today);
    if (statusFilter === 'active') return m.expiry_date >= today;
    if (statusFilter === 'expiring') return daysLeft >= 0 && daysLeft <= 3;
    if (statusFilter === 'expired') return m.expiry_date < today;
    if (statusFilter === 'pending') return m.payment_status === 'Pending';
    return true;
  });

  const handleDownloadCsv = () => {
    const csv = exportMembersCsv(members);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `library_members_${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      const months = PLAN_MONTHS[editing.plan] || 1;
      await onSaveMember(
        {
          ...editing,
          phone: normalizePhone(editing.phone),
          plan_months: months,
        },
        true
      );
      setEditing(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, LIB-ID, phone, seat..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 overflow-x-auto">
            {(
              [
                ['all', 'All'],
                ['active', 'Active'],
                ['expiring', 'Expiring ≤3d'],
                ['expired', 'Expired'],
                ['pending', 'Pending'],
              ] as Array<[StatusFilter, string]>
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(key)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  statusFilter === key
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={onNavigateToEntry}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>New Member</span>
          </button>
        </div>
      </div>

      {/* 12-Column Google Sheet Mirror Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Members Sheet (12 Automation Columns + Seat &amp; Shift)
            </span>
          </div>
          <span className="font-mono tabular-nums">
            {filtered.length} of {members.length} rows
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              No library members match your filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                  <th className="py-2.5 px-3">member_id</th>
                  <th className="py-2.5 px-3">name</th>
                  <th className="py-2.5 px-3">seat / shift</th>
                  <th className="py-2.5 px-3">phone</th>
                  <th className="py-2.5 px-3">plan (mo)</th>
                  <th className="py-2.5 px-3 text-right">fee</th>
                  <th className="py-2.5 px-3">start_date</th>
                  <th className="py-2.5 px-3">expiry_date</th>
                  <th className="py-2.5 px-3">payment_status</th>
                  <th className="py-2.5 px-3">last_payment_date</th>
                  <th className="py-2.5 px-3">last_reminder_date</th>
                  <th className="py-2.5 px-3">last_payment_ref</th>
                  <th className="py-2.5 px-3 text-right">actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filtered.map((m) => {
                  const expired = m.expiry_date < today;
                  return (
                    <tr
                      key={m.docId}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {m.member_id}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">
                        {m.name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                        <span className="font-mono font-semibold">{m.seat_no}</span>
                        <span className="mx-1 text-slate-400">·</span>
                        <span>{m.shift}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-slate-600 dark:text-slate-300">
                        {m.phone}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                        {m.plan} ({m.plan_months})
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-900 dark:text-white">
                        ₹{m.fee}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-slate-600 dark:text-slate-400">
                        {m.start_date}
                      </td>
                      <td
                        className={`py-2.5 px-3 font-mono tabular-nums font-semibold ${
                          expired
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        {m.expiry_date}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`font-semibold ${
                            m.payment_status === 'Paid'
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {m.payment_status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-slate-500">
                        {m.last_payment_date || '—'}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-slate-500">
                        {m.last_reminder_date || '—'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 max-w-[140px] truncate">
                        {m.last_payment_ref || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {confirmDeleteId === m.docId ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={async () => {
                                await onDeleteMember(m.docId);
                                setConfirmDeleteId(null);
                              }}
                              className="px-2 py-1 rounded bg-rose-600 text-white text-[11px] font-semibold cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-[11px] cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setEditing({ ...m })}
                              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                              title="Edit Member"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(m.docId)}
                              className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-500 hover:text-rose-600 cursor-pointer"
                              title="Delete Member"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEdit}
            className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Outfit']">
                  Edit Member · {editing.member_id}
                </h3>
                <p className="text-xs text-slate-500">
                  Update profile, seat, shift, or plan dates
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Phone (91...)
                </label>
                <input
                  type="text"
                  required
                  value={editing.phone}
                  onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Seat No
                </label>
                <input
                  type="text"
                  required
                  value={editing.seat_no}
                  onChange={(e) => setEditing({ ...editing, seat_no: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Shift
                </label>
                <select
                  value={editing.shift}
                  onChange={(e) =>
                    setEditing({ ...editing, shift: e.target.value as ShiftType })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                >
                  {SHIFTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Plan
                </label>
                <select
                  value={editing.plan}
                  onChange={(e) => {
                    const p = e.target.value as PlanType;
                    const months = PLAN_MONTHS[p];
                    setEditing({
                      ...editing,
                      plan: p,
                      plan_months: months,
                      expiry_date: addMonths(editing.start_date, months),
                    });
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                >
                  {Object.keys(PLAN_MONTHS).map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Fee (₹)
                </label>
                <input
                  type="number"
                  required
                  value={editing.fee}
                  onChange={(e) =>
                    setEditing({ ...editing, fee: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Start Date (YYYY-MM-DD)
                </label>
                <input
                  type="date"
                  required
                  value={editing.start_date}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      start_date: e.target.value,
                      expiry_date: addMonths(
                        e.target.value,
                        PLAN_MONTHS[editing.plan]
                      ),
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Expiry Date (YYYY-MM-DD)
                </label>
                <input
                  type="date"
                  required
                  value={editing.expiry_date}
                  onChange={(e) =>
                    setEditing({ ...editing, expiry_date: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={editing.whatsapp_opt_in}
                onChange={(e) =>
                  setEditing({ ...editing, whatsapp_opt_in: e.target.checked })
                }
              />
              <span>Mujhe WhatsApp par library membership updates chahiye (Opt-in)</span>
            </label>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
