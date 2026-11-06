import React from 'react';
import { useT } from './themes';

/** On-screen text per language. App mockups (names, buttons) stay in English like the real UI. */
export type Copy = {
  hook: { q: React.ReactNode; items: string[]; a: React.ReactNode };
  attendance: React.ReactNode;
  fees: React.ReactNode;
  leads: React.ReactNode;
  test: React.ReactNode;
  tagline: string;
  cta: string;
  /** numbered how-it-works steps shown in each feature scene */
  steps: { attendance: string[]; fees: string[]; leads: string[]; test: string[] };
};

const Hi: React.FC<{ children: React.ReactNode }> = ({ children }) => <span style={{ color: useT().hi }}>{children}</span>;

export const COPY: Record<'en' | 'hi', Copy> = {
  en: {
    hook: { q: <>Still running your<br />institute on…</>, items: ['Registers', 'Excel sheets', 'Fee diaries'], a: <>There's a <Hi>smarter</Hi> way.</> },
    attendance: <>Attendance<br />in <Hi>one tap</Hi>.</>,
    fees: <>Every payment,<br /><Hi>on record</Hi>.</>,
    leads: <>No enquiry<br /><Hi>forgotten</Hi>.</>,
    test: <>Test papers<br />in <Hi>seconds</Hi>.</>,
    tagline: 'Run your institute, not paperwork.',
    cta: 'Book a free demo',
    steps: {
      attendance: ['Tap “Mark all present” for the batch', 'Tap a student to mark them absent', "See today's attendance and who's absent"],
      fees: ['See collected and pending fees', 'Record a payment in seconds', 'Receipt ready: print or save as PDF'],
      leads: ['Add every new enquiry', 'Set a follow-up date, so no one is missed', 'Mark them Joined when they take admission'],
      test: ['Choose the class and subject', 'Tick one chapter, several, or the whole book', 'Set the marks: MCQ, short and long', 'Question paper and answer key, ready'],
    },
  },
  hi: {
    hook: { q: <>Abhi bhi institute<br />chal raha hai…</>, items: ['Register', 'Excel sheets', 'Fee diary'], a: <>Ab hai ek <Hi>smart</Hi> tareeka.</> },
    attendance: <>Attendance,<br /><Hi>ek tap</Hi> mein.</>,
    fees: <>Har payment ka<br /><Hi>pakka hisaab</Hi>.</>,
    leads: <>Har enquiry<br />ka <Hi>follow-up</Hi>.</>,
    test: <>Test paper,<br /><Hi>seconds</Hi> mein.</>,
    tagline: 'Institute chalao, paperwork nahi.',
    cta: 'Free demo book karein',
    steps: {
      attendance: ['Batch ke liye “Mark all present” tap karo', 'Absent student par tap karo', 'Aaj ki attendance aur absent list dekho'],
      fees: ['Collected aur pending fees ek saath', 'Payment seconds mein record karo', 'Receipt ready: print ya PDF save karo'],
      leads: ['Har nayi enquiry add karo', 'Follow-up date set karo, koi chhoot na jaaye', 'Admission hone par Joined mark karo'],
      test: ['Class aur subject chuno', 'Ek chapter, kai chapters, ya poori book', 'Marks set karo: MCQ, short, long', 'Question paper aur answer key ready'],
    },
  },
};
