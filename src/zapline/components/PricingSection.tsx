import React, { useState } from 'react';
import { DialogKey } from '../types';

interface PricingSectionProps {
  onOpenDialog: (key: DialogKey) => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onOpenDialog }) => {
  const [isAnnual, setIsAnnual] = useState(true);

  const plans = [
    {
      name: 'Starter',
      badge: 'Home Tuitions & Small Centers',
      price: isAnnual ? '399' : '499',
      period: '/ month',
      subtext: isAnnual ? 'Billed annually (₹4,788/yr)' : 'Billed monthly',
      featured: false,
      capacity: 'Up to 50 Active Students',
      features: [
        'Up to 50 enrolled students',
        '1-Tap Daily WhatsApp Attendance',
        'Unlimited NCERT Question Papers (Class 6-12)',
        'Basic PDF Fee Receipts with Institute Name',
        'Single Director / Admin Login',
        'Standard Email & Chat Support',
      ],
      cta: 'Start 14-Day Free Trial',
      dialogKey: 'start' as DialogKey,
    },
    {
      name: 'Growth',
      badge: 'MOST POPULAR FOR COACHING',
      price: isAnnual ? '799' : '999',
      period: '/ month',
      subtext: isAnnual ? 'Billed annually (₹9,588/yr)' : 'Billed monthly',
      featured: true,
      capacity: 'Up to 250 Active Students',
      features: [
        'Up to 250 enrolled students across 10 batches',
        'Automated WhatsApp Absentee Alerts to parents',
        'Unlimited AI NCERT Question Papers with Answer Keys',
        'Branded GST Invoices with Institute Logo & QR Code',
        'Admission Inquiries & Demo Class CRM',
        '5 Staff & Teacher Logins with restricted access',
        'Priority WhatsApp Director Support',
      ],
      cta: 'Start 14-Day Free Trial',
      dialogKey: 'pro' as DialogKey,
    },
    {
      name: 'Pro Institute',
      badge: 'Multi-Branch & Large Academies',
      price: isAnnual ? '1,599' : '1,999',
      period: '/ month',
      subtext: isAnnual ? 'Billed annually (₹19,188/yr)' : 'Billed monthly',
      featured: false,
      capacity: 'Unlimited Students & Branches',
      features: [
        'Unlimited students across unlimited branches',
        'Dedicated WhatsApp Business API Gateway',
        'Custom Student & Parent Web Portal',
        'Biometric machine & RFID card sync',
        'Unlimited faculty & counselor accounts',
        'Detailed financial analytics & audit logs',
        'Dedicated Institute Success Manager',
      ],
      cta: 'Contact for Enterprise',
      dialogKey: 'pro' as DialogKey,
    },
  ];

  return (
    <section className="section-block" id="pricing">
      <div className="section-header">
        <span className="section-badge">TRANSPARENT PRICING</span>
        <h2 className="section-title">
          Simple Plans for <span className="highlight-lime">Every Institute Size.</span>
        </h2>
        <p className="section-lede">
          No hidden setup costs or high annual contracts. Free 14-day trial with full feature access, no credit card needed.
        </p>

        {/* Billing Toggle */}
        <div className="pricing-toggle-wrap">
          <span className={!isAnnual ? 'active' : ''}>Monthly Billing</span>
          <button
            type="button"
            className={`pricing-toggle-pill ${isAnnual ? 'annual' : 'monthly'}`}
            onClick={() => setIsAnnual((prev) => !prev)}
            aria-label="Toggle annual or monthly billing"
          >
            <span className="toggle-dot" />
          </button>
          <span className={isAnnual ? 'active' : ''}>
            Annual Billing <span className="save-badge">Save 20%</span>
          </span>
        </div>
      </div>

      <div className="pricing-cards-grid">
        {plans.map((p, idx) => (
          <div
            key={idx}
            className={`pricing-card ${p.featured ? 'popular-card' : ''}`}
          >
            {p.featured && (
              <div className="popular-banner">
                <span>★ {p.badge}</span>
              </div>
            )}

            <div className="pricing-top">
              <h3 className="plan-name">{p.name}</h3>
              {!p.featured && <span className="plan-badge">{p.badge}</span>}

              <div className="price-display">
                <span className="currency">₹</span>
                <span className="amount">{p.price}</span>
                <span className="period">{p.period}</span>
              </div>
              <small className="billing-sub">{p.subtext}</small>

              <div className="capacity-pill">
                👥 {p.capacity}
              </div>
            </div>

            <ul className="plan-features-list">
              {p.features.map((f, fIdx) => (
                <li key={fIdx}>
                  <span className="feat-check">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              className={`pill ${p.featured ? 'primary' : 'secondary'} plan-cta`}
              onClick={() => onOpenDialog(p.dialogKey)}
            >
              {p.cta} <span className="arrow">↗</span>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};
