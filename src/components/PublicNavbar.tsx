import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './PublicNavbar.css';

export default function PublicNavbar() {
  const location = useLocation();
  const isHomePage =
    location.pathname === '/' ||
    location.pathname === '/mobile' ||
    location.pathname === '/landing';

  // Smooth-scroll on hash changes or direct URL visits with hash
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.replace('#', '');
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' });
        }, 120);
      }
    }
  }, [location]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    if (isHomePage) {
      e.preventDefault();
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        window.history.pushState(null, '', `#${targetId}`);
      }
    }
  };

  return (
    <header className="ref-nav">
      <div className="ref-nav-inner">
        {/* Brand Logo */}
        <Link to="/" className="ref-brand" aria-label="EduBuddy Home">
          <img src="/logo.png" alt="EduBuddy" className="ref-brand-img-logo" />
        </Link>

        {/* Center / Desktop Links */}
        <nav className="ref-nav-links">
          <a
            href={isHomePage ? '#how-it-works' : '/#how-it-works'}
            onClick={(e) => handleNavClick(e, 'how-it-works')}
          >
            How it works
          </a>
          <a
            href={isHomePage ? '#terminal' : '/#terminal'}
            onClick={(e) => handleNavClick(e, 'terminal')}
          >
            Terminal
          </a>
          <a
            href={isHomePage ? '#pricing' : '/#pricing'}
            onClick={(e) => handleNavClick(e, 'pricing')}
          >
            Pricing
          </a>
          <a
            href={isHomePage ? '#faq' : '/#faq'}
            onClick={(e) => handleNavClick(e, 'faq')}
          >
            FAQ
          </a>
          <Link
            to="/contact"
            className={location.pathname === '/contact' ? 'ref-nav-link-active' : ''}
          >
            Contact
          </Link>
        </nav>

        {/* Right Action: Pill Log in Button */}
        <div className="ref-nav-right">
          <Link to="/login" className="ref-nav-login">
            Log in
          </Link>
        </div>
      </div>
    </header>
  );
}
