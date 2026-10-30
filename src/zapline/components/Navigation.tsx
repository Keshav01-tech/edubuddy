import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DialogKey } from '../types';

interface NavigationProps {
  onOpenDialog: (key: DialogKey) => void;
  onScrollToTop: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ onOpenDialog, onScrollToTop }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen]);

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleMobileClick = (action: () => void) => {
    setMobileOpen(false);
    action();
  };

  return (
    <>
      <header className="nav">
        <a
          className="brand"
          href="#"
          aria-label="EduBuddy home"
          onClick={(e) => {
            e.preventDefault();
            onScrollToTop();
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {/* Education Graduation Cap SVG */}
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
          </svg>
          <span style={{ fontWeight: 700, letterSpacing: '-0.5px' }}>
            Edu<span style={{ color: 'var(--lime)' }}>Buddy</span>
          </span>
          <span style={{ color: '#8f839c', fontSize: '9px', fontWeight: 600, padding: '2px 5px', border: '1px solid #ffffff18', borderRadius: '4px', letterSpacing: '0.06em' }}>
            INSTITUTE OS
          </span>
        </a>

        <nav className="nav-links" aria-label="Main navigation">
          <button
            type="button"
            className="selected"
            onClick={onScrollToTop}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => scrollTo('features')}
          >
            Modules
          </button>
          <button
            type="button"
            onClick={() => scrollTo('workflow')}
          >
            How It Works
          </button>
          <button
            type="button"
            onClick={() => scrollTo('calculator')}
          >
            ROI Calculator
          </button>
          <button
            type="button"
            onClick={() => scrollTo('pricing')}
          >
            Pricing
          </button>
          <button
            type="button"
            onClick={() => scrollTo('faq')}
          >
            FAQ
          </button>
          <Link
            to="/contact"
            style={{
              color: 'inherit',
              padding: '6px 10px',
              fontSize: '11px',
              fontWeight: 500,
              textDecoration: 'none',
              opacity: 0.85,
            }}
          >
            Contact
          </Link>
        </nav>

        <button
          type="button"
          className="pill primary"
          onClick={() => onOpenDialog('start')}
        >
          Try Live Demo <span className="arrow">↗</span>
        </button>

        <button
          type="button"
          className="mobile-menu"
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
          onClick={() => setMobileOpen((prev) => !prev)}
        >
          {mobileOpen ? 'Menu −' : 'Menu +'}
        </button>
      </header>

      {/* Accessible Mobile Nav Drawer */}
      <nav
        id="mobile-nav"
        className={`mobile-nav ${mobileOpen ? 'open' : ''}`}
        aria-label="Mobile navigation"
      >
        <button
          type="button"
          className="selected"
          onClick={() => handleMobileClick(onScrollToTop)}
        >
          Overview
        </button>
        <button
          type="button"
          onClick={() => scrollTo('features')}
        >
          Modules
        </button>
        <button
          type="button"
          onClick={() => scrollTo('workflow')}
        >
          How It Works
        </button>
        <button
          type="button"
          onClick={() => scrollTo('calculator')}
        >
          ROI Calculator
        </button>
        <button
          type="button"
          onClick={() => scrollTo('pricing')}
        >
          Pricing
        </button>
        <button
          type="button"
          onClick={() => scrollTo('faq')}
        >
          FAQ
        </button>
        <Link
          to="/contact"
          style={{
            padding: '10px 14px',
            color: 'inherit',
            textDecoration: 'none',
            fontSize: '13px',
            display: 'block',
          }}
          onClick={() => setMobileOpen(false)}
        >
          Contact Support
        </Link>
        <button
          type="button"
          className="pill primary"
          style={{ marginTop: '12px', justifyContent: 'center' }}
          onClick={() => handleMobileClick(() => onOpenDialog('start'))}
        >
          Try Live Demo ↗
        </button>
      </nav>
    </>
  );
};
