import React, { useState } from 'react';
import { DialogKey } from '../types';

interface FeatureModulesProps {
  onOpenDialog: (key: DialogKey) => void;
}

export const FeatureModules: React.FC<FeatureModulesProps> = ({ onOpenDialog }) => {
  const [activeModule, setActiveModule] = useState(0);

  const modules = [
    {
      id: 'tests',
      icon: '📄',
      tag: 'NCERT AI ENGINE',
      title: '30-Second Question Paper Maker',
      badge: 'Classes 6 to 12',
      desc: 'Generate customized test papers for Maths, Science, Physics, Chemistry and Biology directly from latest NCERT chapters with blueprint marking schemes.',
      points: [
        'Full NCERT syllabus with chapter-wise and topic-wise questions',
        'Presets for 20 Marks, 40 Marks, 80 Marks or custom board patterns',
        'Ready-to-print branded PDF with institute header & student details',
        'Complete answer key and step-by-step solutions included',
      ],
      ctaText: 'Test Paper Demo',
      dialogKey: 'testgen' as DialogKey,
    },
    {
      id: 'attendance',
      icon: '💬',
      tag: 'AUTOMATED WHATSAPP',
      title: '1-Tap Daily Haziri & Absent Alerts',
      badge: 'Zero Bunking',
      desc: 'Complete roll call in 15 seconds. If a student is absent, their parents instantly receive an automated WhatsApp notification with time, date, and batch name.',
      points: [
        'Single tap daily roll call on your phone or computer',
        'Instant WhatsApp absentee alert sent to parent’s phone',
        'Builds 100% parent confidence and stops bunking completely',
        'Monthly attendance % and exportable attendance matrix',
      ],
      ctaText: 'Explore WhatsApp Haziri',
      dialogKey: 'attendance' as DialogKey,
    },
    {
      id: 'fees',
      icon: '🧾',
      tag: 'GST & RECEIPTS',
      title: 'Smart Fee Collection & Invoices',
      badge: 'Zero Pending Dues',
      desc: 'Track monthly tuition fees, installments, and pending dues per batch. Send polite payment reminders on WhatsApp and generate professional GST receipts.',
      points: [
        'Automated WhatsApp fee reminders with UPI payment links',
        'Custom PDF fee receipts with your institute logo, phone & GSTIN',
        'Installment management and partial fee payment records',
        'Real-time collection reports: Daily, Weekly, and Monthly',
      ],
      ctaText: 'View Fee Invoices',
      dialogKey: 'fees' as DialogKey,
    },
    {
      id: 'batches',
      icon: '👥',
      tag: 'BATCH SCHEDULING',
      title: 'Batch & Classroom Management',
      badge: 'Morning & Evening',
      desc: 'Organize students by class, subject, and time slots. Manage student capacity, prevent batch clashes, and swap batches with a single click.',
      points: [
        'Create Target NEET, Foundation JEE, Class 10 & 12 Batches',
        'Batch seat limits and capacity alerts to prevent overcrowding',
        'Quick student batch transfer without losing past attendance',
        'Weekly timetable overview for teachers and classrooms',
      ],
      ctaText: 'Batch Controls',
      dialogKey: 'features' as DialogKey,
    },
    {
      id: 'leads',
      icon: '🎯',
      tag: 'ADMISSION CRM',
      title: 'Inquiry CRM & Demo Class Pipeline',
      badge: 'Grow Enrollments',
      desc: 'Never lose a prospective student. Track walk-in inquiries and calling leads, schedule demo classes, set automated follow-ups, and convert leads into paid admissions.',
      points: [
        'Visual pipeline: Walk-in → Demo Scheduled → Enrolled',
        'Automated reminder calls and WhatsApp invites for demo lectures',
        'Track lead sources: Referrals, hoardings, social media or walk-ins',
        'Convert demo students into enrolled batch members in 1 click',
      ],
      ctaText: 'Inquiry Pipeline',
      dialogKey: 'leads' as DialogKey,
    },
    {
      id: 'roles',
      icon: '🛡️',
      tag: 'SECURITY & FACULTY',
      title: 'Teacher Logins & Financial Privacy',
      badge: 'Multi-Role Access',
      desc: 'Give separate logins to subject teachers and reception staff. Teachers only see attendance and tests; fee registers and profits remain private to the Director.',
      points: [
        'Teacher logins restricted to attendance and test mark entry',
        'Receptionist logins for student inquiry and fee collection',
        'Financial books and institute analytics secured with Director PIN',
        'Complete audit logs of every edit and fee receipt generated',
      ],
      ctaText: 'Institute Security',
      dialogKey: 'settings' as DialogKey,
    },
  ];

  return (
    <section className="section-block" id="features">
      <div className="section-header">
        <span className="section-badge">COMPLETE COACHING OPERATING SYSTEM</span>
        <h2 className="section-title">
          Everything You Need to Run an <span className="highlight-lime">Elite Coaching Institute.</span>
        </h2>
        <p className="section-lede">
          Replace fragmented paper registers, handwritten fee slips, and confusing school software with six unified modules built specifically for Indian coaching centers.
        </p>
      </div>

      <div className="modules-grid">
        {modules.map((m, idx) => (
          <div
            key={m.id}
            className={`module-card ${activeModule === idx ? 'featured' : ''}`}
            onMouseEnter={() => setActiveModule(idx)}
          >
            <div className="module-top">
              <div className="module-icon-wrap">
                <span className="module-icon">{m.icon}</span>
                <span className="module-tag">{m.tag}</span>
              </div>
              <span className="module-badge">{m.badge}</span>
            </div>

            <h3 className="module-title">{m.title}</h3>
            <p className="module-desc">{m.desc}</p>

            <ul className="module-points">
              {m.points.map((pt, pIdx) => (
                <li key={pIdx}>
                  <span className="point-bullet">✓</span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              className="module-action-btn"
              onClick={() => onOpenDialog(m.dialogKey)}
            >
              {m.ctaText} <span className="arrow">↗</span>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};
