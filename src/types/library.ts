export type PlanType = 'Monthly' | 'Quarterly' | 'Half-yearly' | 'Yearly';
export type PaymentStatus = 'Pending' | 'Paid';
export type ShiftType = 'Morning' | 'Afternoon' | 'Evening' | 'Full Day' | 'Night';
export type PaymentMode = 'Razorpay' | 'UPI' | 'Cash';

export const PLAN_MONTHS: Record<PlanType, number> = {
  Monthly: 1,
  Quarterly: 3,
  'Half-yearly': 6,
  Yearly: 12,
};

export const DEFAULT_PLAN_FEES: Record<PlanType, number> = {
  Monthly: 800,
  Quarterly: 2200,
  'Half-yearly': 4200,
  Yearly: 8000,
};

export const SHIFTS: ShiftType[] = ['Morning', 'Afternoon', 'Evening', 'Full Day', 'Night'];

export interface LibraryMember {
  docId: string;
  member_id: string;
  ownerId: string;
  name: string;
  phone: string;
  plan: PlanType;
  plan_months: number;
  fee: number;
  start_date: string;
  expiry_date: string;
  payment_status: PaymentStatus;
  last_payment_date: string;
  last_reminder_date: string;
  last_payment_ref: string;
  seat_no: string;
  shift: ShiftType;
  whatsapp_opt_in: boolean;
}

export interface PaymentRecord {
  payment_id: string;
  ownerId: string;
  member_doc_id: string;
  member_id: string;
  member_name: string;
  amount: number;
  mode: PaymentMode;
  link_id: string;
  payment_date: string;
  previous_expiry: string;
  new_expiry: string;
}

export interface ReminderLog {
  reminder_id: string;
  ownerId: string;
  member_id: string;
  member_name: string;
  phone: string;
  expiry_date: string;
  days_left: number;
  message_preview: string;
  sent_date: string;
  status: 'Sent' | 'Simulated';
}

export interface LibraryConfig {
  ownerId: string;
  libraryName: string;
  ownerEmail: string;
  ownerPhone: string;
  totalSeats: number;
  completedSteps: string[];
}

export type AppView =
  | 'dashboard'
  | 'members'
  | 'entry'
  | 'reminders'
  | 'payments'
  | 'report'
  | 'guide';
