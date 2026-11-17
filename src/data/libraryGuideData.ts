import { LibraryMember, PaymentRecord, ReminderLog } from '../types/library';
import { addMonths, getTodayKolkataIso } from '../utils/libraryLogic';

export function buildSampleMembers(ownerId: string = 'local-preview'): LibraryMember[] {
  const today = getTodayKolkataIso();
  // Shift dates relative to today so user immediately sees Active, Expiring in 3 days, and Expired/Pending
  const addDays = (iso: string, delta: number) => {
    const [y, m, d] = iso.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d + delta));
    return dt.toISOString().slice(0, 10);
  };

  return [
    {
      docId: 'LIB-001',
      member_id: 'LIB-001',
      ownerId,
      name: 'Rohit Kumar',
      phone: '919000000001',
      plan: 'Monthly',
      plan_months: 1,
      fee: 800,
      start_date: addMonths(addDays(today, 22), -1),
      expiry_date: addDays(today, 22),
      payment_status: 'Paid',
      last_payment_date: addMonths(addDays(today, 22), -1),
      last_reminder_date: '',
      last_payment_ref: 'plink_demo_001',
      seat_no: 'A-12',
      shift: 'Full Day',
      whatsapp_opt_in: true,
    },
    {
      docId: 'LIB-002',
      member_id: 'LIB-002',
      ownerId,
      name: 'Neha Singh',
      phone: '919000000002',
      plan: 'Quarterly',
      plan_months: 3,
      fee: 2200,
      start_date: addMonths(addDays(today, 3), -3),
      expiry_date: addDays(today, 3),
      payment_status: 'Paid',
      last_payment_date: addMonths(addDays(today, 3), -3),
      last_reminder_date: '',
      last_payment_ref: 'plink_demo_002',
      seat_no: 'B-04',
      shift: 'Morning',
      whatsapp_opt_in: true,
    },
    {
      docId: 'LIB-003',
      member_id: 'LIB-003',
      ownerId,
      name: 'Amit Verma',
      phone: '919000000003',
      plan: 'Monthly',
      plan_months: 1,
      fee: 800,
      start_date: addMonths(addDays(today, -4), -1),
      expiry_date: addDays(today, -4),
      payment_status: 'Pending',
      last_payment_date: '',
      last_reminder_date: '',
      last_payment_ref: '',
      seat_no: 'C-09',
      shift: 'Evening',
      whatsapp_opt_in: true,
    },
  ];
}

export function buildSamplePayments(ownerId: string = 'local-preview'): PaymentRecord[] {
  const today = getTodayKolkataIso();
  return [
    {
      payment_id: 'pay_demo_001',
      ownerId,
      member_doc_id: 'LIB-001',
      member_id: 'LIB-001',
      member_name: 'Rohit Kumar',
      amount: 800,
      mode: 'UPI',
      link_id: 'plink_demo_001',
      payment_date: today,
      previous_expiry: today,
      new_expiry: addMonths(today, 1),
    },
    {
      payment_id: 'pay_demo_002',
      ownerId,
      member_doc_id: 'LIB-002',
      member_id: 'LIB-002',
      member_name: 'Neha Singh',
      amount: 2200,
      mode: 'Razorpay',
      link_id: 'plink_demo_002',
      payment_date: today,
      previous_expiry: today,
      new_expiry: addMonths(today, 3),
    },
  ];
}

export function buildSampleReminders(): ReminderLog[] {
  return [];
}

export const SHEET_COLUMNS_SPEC = [
  { col: 'A', name: 'member_id', desc: 'Unique ID, jaise LIB-001', writer: 'n8n (Workflow 1)' },
  { col: 'B', name: 'name', desc: 'Student / Member ka naam', writer: 'n8n (Workflow 1)' },
  { col: 'C', name: 'phone', desc: 'WhatsApp number country code ke saath, jaise 919876543210, bina + aur space ke', writer: 'n8n (Workflow 1)' },
  { col: 'D', name: 'plan', desc: 'Monthly, Quarterly, Half-yearly, Yearly', writer: 'n8n (Workflow 1)' },
  { col: 'E', name: 'plan_months', desc: '1, 3, 6 ya 12', writer: 'n8n (Workflow 1)' },
  { col: 'F', name: 'fee', desc: 'Plan ki fees rupaye mein', writer: 'n8n (Workflow 1)' },
  { col: 'G', name: 'start_date', desc: 'Membership shuru hone ki date, YYYY-MM-DD format mein', writer: 'n8n (Workflow 1)' },
  { col: 'H', name: 'expiry_date', desc: 'start_date plus plan_months, YYYY-MM-DD', writer: 'n8n (Workflow 1 aur 3)' },
  { col: 'I', name: 'payment_status', desc: 'Pending ya Paid', writer: 'n8n (Workflow 1 aur 3)' },
  { col: 'J', name: 'last_payment_date', desc: 'Aakhri payment ki date', writer: 'n8n (Workflow 3)' },
  { col: 'K', name: 'last_reminder_date', desc: 'Aakhri reminder kab gaya', writer: 'n8n (Workflow 2)' },
  { col: 'L', name: 'last_payment_ref', desc: 'Payment link ki ID (retry par double extension rokne ke liye)', writer: 'n8n (Workflow 3)' },
];

export const DASHBOARD_FORMULAS = [
  { label: 'Total members', formula: '=COUNTA(Members!A2:A)' },
  { label: 'Active members', formula: '=SUMPRODUCT((Members!H2:H<>"")*(Members!H2:H>=TEXT(TODAY(),"yyyy-mm-dd")))' },
  { label: 'Expired members', formula: '=SUMPRODUCT((Members!H2:H<>"")*(Members!H2:H<TEXT(TODAY(),"yyyy-mm-dd")))' },
  { label: 'Pending payments', formula: '=COUNTIF(Members!I2:I,"Pending")' },
];

export const WORKFLOW_CODES = {
  workflow1: `const planMonths = { 'Monthly': 1, 'Quarterly': 3, 'Half-yearly': 6, 'Yearly': 12 };

function addMonths(isoDate, months) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const total = (m - 1) + months;
  const ny = y + Math.floor(total / 12);
  const nm = total % 12;
  const lastDay = new Date(Date.UTC(ny, nm + 1, 0)).getUTCDate();
  const nd = Math.min(d, lastDay);
  return ny + '-' + String(nm + 1).padStart(2, '0') + '-' + String(nd).padStart(2, '0');
}

return $input.all().map(item => {
  const f = item.json;
  let phone = String(f['Phone']).replace(/\\D/g, '');
  if (phone.length === 10) phone = '91' + phone;
  const months = planMonths[f['Plan']] || 1;
  const start = String(f['Start Date']).slice(0, 10);
  return {
    json: {
      member_id: 'LIB-' + String(Date.now()).slice(-6),
      name: f['Name'],
      phone: phone,
      plan: f['Plan'],
      plan_months: months,
      fee: f['Fee'],
      start_date: start,
      expiry_date: addMonths(start, months),
      payment_status: 'Pending'
    }
  };
});`,
  workflow2: `const REMIND_DAYS = [3, 0]; // expiry se kitne din pehle reminder bhejna hai
const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

function toUtc(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

return $input.all().filter(item => {
  const r = item.json;
  if (!r.expiry_date || !r.phone) return false;
  if (r.last_reminder_date === today) return false;
  const daysLeft = Math.round((toUtc(r.expiry_date) - toUtc(today)) / 86400000);
  return REMIND_DAYS.includes(daysLeft);
});`,
  workflow3Extract: `const b = $input.first().json.body;
const e = b.payload.payment_link.entity;
return [{ json: {
  event: b.event,
  member_id: e.reference_id,
  link_id: e.id,
  amount_paid: e.amount_paid / 100 // Razorpay amount paise mein deta hai
}}];`,
  workflow3Compute: `function addMonths(isoDate, months) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const total = (m - 1) + months;
  const ny = y + Math.floor(total / 12);
  const nm = total % 12;
  const lastDay = new Date(Date.UTC(ny, nm + 1, 0)).getUTCDate();
  const nd = Math.min(d, lastDay);
  return ny + '-' + String(nm + 1).padStart(2, '0') + '-' + String(nd).padStart(2, '0');
}

const row = $input.first().json;
const pay = $('Extract Payment').first().json;
const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

if (row.last_payment_ref === pay.link_id) return []; // yeh payment pehle process ho chuki

const firstPayment = !row.last_payment_date;
const base = row.expiry_date > today ? row.expiry_date : today;
const newExpiry = firstPayment ? row.expiry_date : addMonths(base, Number(row.plan_months));

return [{ json: {
  member_id: row.member_id,
  payment_status: 'Paid',
  last_payment_date: today,
  expiry_date: newExpiry,
  last_payment_ref: pay.link_id
}}];`,
  workflow4: `const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
const rows = $input.all().map(i => i.json).filter(r => r.member_id);

const active = rows.filter(r => r.expiry_date >= today);
const expired = rows.filter(r => r.expiry_date && r.expiry_date < today);
const pending = rows.filter(r => r.payment_status === 'Pending');

const names = list => list.length ? list.map(r => r.name).join(', ') : 'Koi nahi';

const text =
  'Library report ' + today + '\\n' +
  'Active members: ' + active.length + '\\n' +
  'Expired memberships: ' + expired.length + ' (' + names(expired) + ')\\n' +
  'Pending payments: ' + pending.length + ' (' + names(pending) + ')';

return [{ json: {
  date: today,
  active: active.length,
  expired: expired.length,
  pending: pending.length,
  text
}}];`,
};

export const WHATSAPP_TEMPLATES = {
  reminderUtility: `Namaste {{1}}, aapki library membership {{2}} ko khatam ho rahi hai. Renew karne ke liye library par aayein ya hamse sampark karein. Dhanyavaad!`,
  dailyReportOneLine: `Library report {{1}}: Active {{2}}, Expired {{3}}, Pending payments {{4}}. Poori list Sheet ke Dashboard tab par dekhein.`,
};

export const IMPLEMENTATION_CHECKLIST = [
  { id: 'step_1', text: 'n8n Cloud trial ya self-hosted Community Edition ready hai.' },
  { id: 'step_2', text: 'Google Sheet mein Members tab (12 columns) aur Dashboard tab bana hai.' },
  { id: 'step_3', text: 'Date columns plain text YYYY-MM-DD mein hain.' },
  { id: 'step_4', text: 'Workflow 1 (member entry) test ho chuka hai, duplicate phone par bhi.' },
  { id: 'step_5', text: 'WhatsApp template approved hai aur reminder test number par pahunch gaya.' },
  { id: 'step_6', text: 'Consent checkbox ("Mujhe WhatsApp par membership updates chahiye") form mein hai.' },
  { id: 'step_7', text: 'Workflow 3 (payment update) ka test payment ho chuka hai aur double-event par expiry ek hi baar badhti hai.' },
  { id: 'step_8', text: 'Webhook signature verify ho raha hai.' },
  { id: 'step_9', text: 'Workflow 4 ki report ke numbers haath se gine hue numbers se match karte hain.' },
  { id: 'step_10', text: 'Error Trigger workflow set hai.' },
  { id: 'step_11', text: 'Saare workflows publish/activate hain aur timezone Asia/Kolkata hai.' },
  { id: 'step_12', text: 'Client ko accounts, ownership aur handover document mil gaya hai.' },
];

export const COMMON_ERRORS_TABLE = [
  {
    problem: 'WhatsApp node "invalid parameter" error de raha hai',
    cause: 'Template ke parameters ka order ya count galat hai',
    solution: 'Template aur n8n ke parameters ka order milao, khali value par fallback value rakho',
  },
  {
    problem: 'Reminder bilkul nahi gaya',
    cause: 'Phone mein + ya space hai, ya member ne pehle kabhi consent nahi diya',
    solution: 'Chapter 4 ka code phone saaf karta hai; consent checkbox check karo',
  },
  {
    problem: 'Schedule wale workflow ne kuch nahi chalaya',
    cause: 'Workflow publish/activate nahi hai ya timezone galat hai',
    solution: 'Workflow ko publish karo aur Asia/Kolkata timezone set karo',
  },
  {
    problem: 'Dashboard ke numbers galat aaye',
    cause: 'Date column plain text nahi hai ya alag format mein hai',
    solution: 'Sab dates YYYY-MM-DD plain text mein karo',
  },
  {
    problem: 'Expiry galat date par aayi',
    cause: 'Month-end ka case ya galat plan_months',
    solution: 'Chapter 4 ke addMonths code ko use karo aur plan ke naam spelling se match karo',
  },
];

export const OWNER_PROPOSAL_TEMPLATE = `**Library Manager Automation: Proposal**

**Client:** [Library ka naam]
**Scope:**
1. Naye student/member ki entry Google Sheet mein apne aap (seat & shift ke saath)
2. Expiry se pehle WhatsApp reminder (approved template ke saath)
3. Payment hone par status update aur renewal expiry extension
4. Roz ki report (active, expired, pending payments)

**Shamil nahi hai:** biometric/attendance machine ka integration, ya kuch bhi jo upar list mein nahi hai

**Setup fee:** ₹10,000 se ₹15,000, ek baar
**Delivery time:** 5 din, jab client ke accounts aur WhatsApp approval taiyaar ho
**Client ki zimmedari:** WhatsApp Business account verification, purane members ka data, ek test number
**Running costs:** client ke accounts par, alag se
**Support:** setup ke baad 15 din tak free bug fixes`;
