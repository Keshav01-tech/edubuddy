import React from 'react';
import { DialogKey } from '../types';

interface WorkflowSectionProps {
  onOpenDialog: (key: DialogKey) => void;
}

export const WorkflowSection: React.FC<WorkflowSectionProps> = ({ onOpenDialog }) => {
  const steps = [
    {
      step: '01',
      title: 'Import Students & Set Up Batches',
      timeTag: 'Takes 2 Minutes',
      summary: 'Upload your current student list using Excel, a scanned PDF, or quick entry.',
      details:
        'Configure morning & evening batches (e.g. Class 10 Foundation, Class 12 PCM). Add your institute logo, phone number, and address for branded receipts.',
      icon: '📥',
    },
    {
      step: '02',
      title: 'Take 1-Tap Haziri & Generate NCERT Tests',
      timeTag: 'Daily Operations',
      summary: 'Mark class attendance in 15 seconds on mobile. Absent parents notified on WhatsApp.',
      details:
        'Eliminate bunking completely. Pick NCERT chapters to generate formatted question papers with full marking schemes in 30 seconds for weekly weekend tests.',
      icon: '⚡',
    },
    {
      step: '03',
      title: 'Collect Fees on Time & Expand Admissions',
      timeTag: 'Zero Headaches',
      summary: 'Send polite WhatsApp fee reminders with UPI payment links and issue GST receipts.',
      details:
        'Clear pending dues without awkward phone calls. Parents praise your professional updates and refer friends, driving consistent batch growth.',
      icon: '📈',
    },
  ];

  return (
    <section className="section-block" id="workflow">
      <div className="section-header">
        <span className="section-badge">RAPID 5-MINUTE ONBOARDING</span>
        <h2 className="section-title">
          Modernize Your Institute in <span className="highlight-lime">3 Simple Steps.</span>
        </h2>
        <p className="section-lede">
          No complex software setup, expensive hardware, or weeks of teacher training. Start running your institute digitally today.
        </p>
      </div>

      <div className="workflow-steps-grid">
        {steps.map((item) => (
          <div key={item.step} className="workflow-step-card">
            <div className="step-card-top">
              <span className="step-number">{item.step}</span>
              <span className="step-time-badge">{item.timeTag}</span>
            </div>
            <div className="step-icon-circle">{item.icon}</div>
            <h3 className="step-card-title">{item.title}</h3>
            <p className="step-card-summary">{item.summary}</p>
            <p className="step-card-details">{item.details}</p>
          </div>
        ))}
      </div>

      <div className="workflow-cta-strip">
        <div>
          <h4>Ready to see it in action?</h4>
          <p>Explore the live Sharma Coaching Classes workspace with real sample data.</p>
        </div>
        <button
          type="button"
          className="pill primary"
          onClick={() => onOpenDialog('start')}
        >
          Launch Interactive Demo <span className="arrow">↗</span>
        </button>
      </div>
    </section>
  );
};
