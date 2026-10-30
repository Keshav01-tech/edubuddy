export type DialogKey =
  | 'features'
  | 'attendance'
  | 'testgen'
  | 'fees'
  | 'leads'
  | 'faq'
  | 'settings'
  | 'pro'
  | 'start';

export type DashboardSection =
  | 'Dashboard'
  | 'Students'
  | 'Attendance'
  | 'Fees'
  | 'Tests'
  | 'Leads';

export type ChartPeriod = 'month' | 'week';

export interface DialogContent {
  title: string;
  copy: string;
}

export const DIALOG_COPY: Record<DialogKey, [string, string]> = {
  start: [
    'Sharma Coaching Classes · Live Institute Terminal',
    'Experience how EduBuddy simplifies coaching operations: 1-Tap daily WhatsApp Haziri alerts, automated fee dues tracking with branded GST receipts, and instant 30-second NCERT question paper generation for CBSE/ICSE classes.',
  ],
  features: [
    'Complete Coaching OS. Zero Paperwork.',
    'From student admissions and batch schedules to automated parent WhatsApp notifications, printable fee receipts, and AI exam paper generation—everything runs effortlessly from one unified dashboard.',
  ],
  attendance: [
    '1-Tap Daily Haziri & Parent WhatsApp Alerts',
    'Mark attendance in under 15 seconds. Absent students immediately receive a personalized WhatsApp notification sent to their parent’s phone with student name, batch, date, and institute sign-off.',
  ],
  testgen: [
    'AI NCERT Question Paper Maker (Classes 6-12)',
    'Create printable question papers for Maths, Science, Physics, Chemistry, and Biology in 30 seconds. Choose chapters, select difficulty blueprint, and get a ready-to-print PDF with marking scheme & answer key.',
  ],
  fees: [
    'Fee Dues & Branded Institute Receipts',
    'Track monthly tuition fees, pending installments, and send payment reminders over WhatsApp. Generate professional receipts with your coaching institute’s logo, address, and GSTIN in one click.',
  ],
  leads: [
    'Inquiry CRM & Demo Class Pipeline',
    'Never lose a prospective student. Track walk-in inquiries and calling leads, schedule demo classes, set automated follow-ups, and convert inquiries into paid admissions.',
  ],
  faq: [
    'Frequently Asked Questions by Coaching Directors',
    'Q: Can we print test papers? Yes, download clean printable PDFs with institute headers. Q: Does WhatsApp messaging require extra software? No, works with 1-tap WhatsApp Web/App. Q: Can we brand receipts with our logo? Yes, easily configure from Institute Profile.',
  ],
  settings: [
    'Institute Profile & Preferences',
    'Configure coaching name, address, logo, GSTIN, receipt prefix, batch timings, and pause cosmic background effects if preferred.',
  ],
  pro: [
    'EduBuddy Growth & Multi-Branch Plan',
    'Designed for expanding institutes (100 to 5,000+ students). Includes multi-branch centralized control, separate teacher & receptionist logins, automated WhatsApp gateway, and student portal.',
  ],
};
