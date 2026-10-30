import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DialogKey } from '../types';

interface FooterSectionProps {
  onOpenDialog: (key: DialogKey) => void;
}

export const FooterSection: React.FC<FooterSectionProps> = ({ onOpenDialog }) => {
  const navigate = useNavigate();

  return (
    <footer className="footer-container">
      {/* 1. Final High-Impact CTA Banner */}
      <div className="closing-cta-card">
        <span className="section-badge" style={{ margin: '0 auto 12px' }}>
          JOIN 1,200+ COACHING DIRECTORS
        </span>
        <h2 className="cta-headline">
          Ready to Run Your Coaching Like an <span className="highlight-lime">Elite Academy?</span>
        </h2>
        <p className="cta-sub">
          Stop wasting hours on paper registers and handwritten fee slips. Take digital WhatsApp Haziri, print NCERT test papers, and watch your institute grow.
        </p>

        <div className="cta-action-row">
          <button
            type="button"
            className="pill primary"
            onClick={() => onOpenDialog('start')}
          >
            Start 14-Day Free Trial <span className="arrow">↗</span>
          </button>
          <button
            type="button"
            className="pill secondary"
            onClick={() => navigate('/dashboard')}
          >
            Launch EduBuddy Dashboard ↗
          </button>
        </div>

        <div className="cta-guarantees">
          <span>✓ Instant 5-Minute Setup</span>
          <span>✓ No Credit Card Needed</span>
          <span>✓ 100% WhatsApp Connected</span>
        </div>
      </div>

      {/* 2. Ruled 4-Column Footer */}
      <div className="footer-links-grid">
        <div className="footer-brand-col">
          <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
            <span style={{ fontWeight: 700, fontSize: '18px', letterSpacing: '-0.5px' }}>
              Edu<span style={{ color: 'var(--lime)' }}>Buddy</span>
            </span>
            <span style={{ color: '#8f839c', fontSize: '9px', fontWeight: 600, padding: '2px 5px', border: '1px solid #ffffff18', borderRadius: '4px' }}>
              INSTITUTE OS
            </span>
          </div>
          <p className="footer-tagline">
            Bharat's #1 Coaching Institute & Tuition Management System. Built with pride for Indian educators and academy founders.
          </p>
          <div className="footer-contact-pill">
            <span>💬 Director Helpline:</span>
            <strong>+91 98765 43210</strong>
          </div>
        </div>

        <div className="footer-col">
          <h4>Core Modules</h4>
          <ul>
            <li><button type="button" onClick={() => onOpenDialog('testgen')}>NCERT Test Maker</button></li>
            <li><button type="button" onClick={() => onOpenDialog('attendance')}>WhatsApp Haziri</button></li>
            <li><button type="button" onClick={() => onOpenDialog('fees')}>Fee GST Receipts</button></li>
            <li><button type="button" onClick={() => onOpenDialog('features')}>Batch Scheduler</button></li>
            <li><button type="button" onClick={() => onOpenDialog('leads')}>Admission CRM</button></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Syllabus & Boards</h4>
          <ul>
            <li><a href="#features">CBSE Class 10 Board</a></li>
            <li><a href="#features">CBSE Class 12 PCM/PCB</a></li>
            <li><a href="#features">ICSE Class 9 & 10</a></li>
            <li><a href="#features">Target NEET Foundation</a></li>
            <li><a href="#features">JEE Main Test Blueprints</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Institute Trust</h4>
          <ul>
            <li><Link to="/contact" style={{ color: 'var(--lime)', fontWeight: 600 }}>Contact & Advisory Desk ↗</Link></li>
            <li><button type="button" onClick={() => onOpenDialog('faq')}>Coaching FAQ</button></li>
            <li><button type="button" onClick={() => onOpenDialog('settings')}>Data Security & Privacy</button></li>
            <li><button type="button" onClick={() => onOpenDialog('pro')}>Multi-Branch Academies</button></li>
            <li><a href="https://wa.me/919876543210" target="_blank" rel="noreferrer">Director WhatsApp Helpline</a></li>
            <li><button type="button" onClick={() => onOpenDialog('start')}>Instant Live Demo</button></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom-bar">
        <span>© 2026 EduBuddy Technologies Pvt Ltd. All rights reserved.</span>
        <span>Crafted for Coaching Institutes & Academies across Bharat 🇮🇳</span>
      </div>
    </footer>
  );
};
