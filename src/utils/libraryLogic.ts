import { LibraryMember, PLAN_MONTHS, PlanType } from '../types/library';

export const REMIND_DAYS = [3, 0];

export function getTodayKolkataIso(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

export function normalizePhone(rawPhone: string): string {
  let digits = String(rawPhone || '').replace(/\D/g, '');
  if (digits.length === 10) {
    digits = '91' + digits;
  }
  return digits.slice(0, 15);
}

// Month-end safe date calculation from Chapter 4 (e.g., 31 Jan + 1 month = 28 Feb)
export function addMonths(isoDate: string, months: number): string {
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    return isoDate;
  }
  const [y, m, d] = parts;
  const total = m - 1 + months;
  const ny = y + Math.floor(total / 12);
  const nm = total % 12;
  const lastDay = new Date(Date.UTC(ny, nm + 1, 0)).getUTCDate();
  const nd = Math.min(d, lastDay);
  return `${ny}-${String(nm + 1).padStart(2, '0')}-${String(nd).padStart(2, '0')}`;
}

export function toUtcMs(isoDate: string): number {
  const [y, m, d] = isoDate.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

export function computeDaysLeft(expiryDate: string, todayIso: string = getTodayKolkataIso()): number {
  if (!expiryDate) return 0;
  return Math.round((toUtcMs(expiryDate) - toUtcMs(todayIso)) / 86400000);
}

export function getMemberStatus(
  member: LibraryMember,
  todayIso: string = getTodayKolkataIso()
): 'Active' | 'Expiring Soon' | 'Expired' {
  const daysLeft = computeDaysLeft(member.expiry_date, todayIso);
  if (daysLeft < 0) return 'Expired';
  if (daysLeft <= 3) return 'Expiring Soon';
  return 'Active';
}

// Exact Chapter 6 renewal expiry rule:
// First payment keeps initial expiry_date calculated from start_date;
// Subsequent payments extend from max(expiry_date, today) by plan_months
export function computeNextExpiryAfterPayment(
  member: LibraryMember,
  todayIso: string = getTodayKolkataIso()
): string {
  const isFirstPayment = !member.last_payment_date;
  if (isFirstPayment) {
    return member.expiry_date;
  }
  const base = member.expiry_date > todayIso ? member.expiry_date : todayIso;
  return addMonths(base, Number(member.plan_months) || PLAN_MONTHS[member.plan] || 1);
}

export function buildWhatsAppReminderText(
  name: string,
  expiryDate: string,
  libraryName: string = 'Library'
): string {
  return `Namaste ${name}, aapki ${libraryName} membership ${expiryDate} ko khatam ho rahi hai. Renew karne ke liye library par aayein ya hamse sampark karein. Dhanyavaad!`;
}

export function getEligibleMembersForReminder(
  members: LibraryMember[],
  todayIso: string = getTodayKolkataIso()
): Array<{ member: LibraryMember; daysLeft: number }> {
  return members
    .filter((r) => {
      if (!r.expiry_date || !r.phone || !r.whatsapp_opt_in) return false;
      if (r.last_reminder_date === todayIso) return false;
      const daysLeft = computeDaysLeft(r.expiry_date, todayIso);
      return REMIND_DAYS.includes(daysLeft);
    })
    .map((member) => ({
      member,
      daysLeft: computeDaysLeft(member.expiry_date, todayIso),
    }));
}

export function computeDailyReportStats(
  members: LibraryMember[],
  todayIso: string = getTodayKolkataIso()
) {
  const valid = members.filter((r) => r.member_id);
  const active = valid.filter((r) => r.expiry_date >= todayIso);
  const expired = valid.filter((r) => r.expiry_date && r.expiry_date < todayIso);
  const pending = valid.filter((r) => r.payment_status === 'Pending');
  const expiringSoon = valid.filter((r) => {
    const d = computeDaysLeft(r.expiry_date, todayIso);
    return d >= 0 && d <= 3;
  });

  const formatNames = (list: LibraryMember[]) =>
    list.length ? list.map((r) => `${r.name} (${r.seat_no})`).join(', ') : 'Koi nahi';

  const emailReportText =
    `Library report ${todayIso}\n` +
    `Active members: ${active.length}\n` +
    `Expiring within 3 days: ${expiringSoon.length} (${formatNames(expiringSoon)})\n` +
    `Expired memberships: ${expired.length} (${formatNames(expired)})\n` +
    `Pending payments: ${pending.length} (${formatNames(pending)})`;

  const whatsappOneLine = `Library report ${todayIso}: Active ${active.length}, Expired ${expired.length}, Pending payments ${pending.length}. Poori list Sheet ke Dashboard tab par dekhein.`;

  return {
    todayIso,
    total: valid.length,
    active,
    expired,
    pending,
    expiringSoon,
    emailReportText,
    whatsappOneLine,
  };
}

export function createMemberPayload(input: {
  ownerId: string;
  name: string;
  phone: string;
  plan: PlanType;
  fee: number;
  start_date: string;
  seat_no: string;
  shift: LibraryMember['shift'];
  whatsapp_opt_in: boolean;
  existingMemberId?: string;
}): Omit<LibraryMember, 'docId'> {
  const normalizedPhone = normalizePhone(input.phone);
  const months = PLAN_MONTHS[input.plan] || 1;
  const start = String(input.start_date).slice(0, 10);
  const memberId =
    input.existingMemberId || 'LIB-' + String(Date.now()).slice(-6);

  return {
    member_id: memberId,
    ownerId: input.ownerId,
    name: input.name.trim().slice(0, 100),
    phone: normalizedPhone,
    plan: input.plan,
    plan_months: months,
    fee: Math.max(0, Number(input.fee) || 0),
    start_date: start,
    expiry_date: addMonths(start, months),
    payment_status: 'Pending',
    last_payment_date: '',
    last_reminder_date: '',
    last_payment_ref: '',
    seat_no: input.seat_no.trim().slice(0, 20) || 'S-01',
    shift: input.shift,
    whatsapp_opt_in: Boolean(input.whatsapp_opt_in),
  };
}

export function exportMembersCsv(members: LibraryMember[]): string {
  const headers = [
    'member_id',
    'name',
    'phone',
    'plan',
    'plan_months',
    'fee',
    'start_date',
    'expiry_date',
    'payment_status',
    'last_payment_date',
    'last_reminder_date',
    'last_payment_ref',
    'seat_no',
    'shift',
  ];
  const escape = (v: unknown) => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const rows = members.map((m) =>
    [
      m.member_id,
      m.name,
      m.phone,
      m.plan,
      m.plan_months,
      m.fee,
      m.start_date,
      m.expiry_date,
      m.payment_status,
      m.last_payment_date,
      m.last_reminder_date,
      m.last_payment_ref,
      m.seat_no,
      m.shift,
    ]
      .map(escape)
      .join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}
