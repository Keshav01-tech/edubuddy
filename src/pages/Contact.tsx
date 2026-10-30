import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Contact.css';
import { useAuth } from '../context/AuthContext';
import PublicNavbar from '../components/PublicNavbar';

export default function Contact() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [instituteName, setInstituteName] = useState('');
  const [interest, setInterest] = useState('Full Platform Walkthrough & Demo');
  const [message, setMessage] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleStartTrial = async () => {
    if (user) {
      navigate('/dashboard');
      return;
    }
    try {
      await signIn('demo@edubuddy.ai', 'demo123');
      navigate('/dashboard');
    } catch {
      navigate('/login');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setIsSubmitted(true);
        setIsSubmitting(false);
      } else {
        // If client AJAX is restricted on free tier, fallback to native POST submission
        form.submit();
      }
    } catch {
      // Fallback to standard form submission
      form.submit();
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setFullName('');
    setEmail('');
    setPhone('');
    setInstituteName('');
    setMessage('');
    setErrorMessage(null);
  };

  const whatsappMessage = encodeURIComponent(
    `Hi EduBuddy Team! My name is ${fullName || 'Director'}, from ${instituteName || 'my coaching academy'}. I am interested in ${interest}. Please share details / schedule a demo.`
  );

  return (
    <div className="contact-page-root">
      {/* 1. COMMON PUBLIC NAVBAR (SAME AS LANDING PAGE) */}
      <PublicNavbar />

      {/* 2. HERO SECTION WITH SKY GRADIENT AMBIENCE */}
      <section className="contact-hero">
        <div className="contact-hero-inner">
          <div className="contact-rating-pill">
            <span className="contact-gold-stars">★★★★★</span>
            <span className="contact-rating-text">Director Advisory & Support Desk</span>
          </div>

          <h1 className="contact-hero-headline">
            We're here to help your institute grow.
          </h1>

          <p className="contact-hero-sub">
            Have questions about 1-Tap WhatsApp Haziri, board-pattern NCERT question papers, or need a customized setup for your coaching center? Send us a message and our team will get in touch within minutes.
          </p>
        </div>
      </section>

      {/* 3. MAIN CONTENT GRID: FORM (LEFT) + DIRECT SUPPORT CARDS (RIGHT) */}
      <main className="contact-main-container">
        <div className="contact-grid">
          {/* Left Column: Web3Forms Contact Form */}
          <div className="contact-form-card">
            <div className="contact-card-header">
              <div>
                <h2 className="contact-card-title">Send Us a Message</h2>
                <p className="contact-card-sub">
                  Fill in your coaching details below. All inquiries receive direct attention from our product consultants.
                </p>
              </div>
              <span className="contact-speed-badge">⚡ 15-Min Response SLA</span>
            </div>

            {!isSubmitted ? (
              <form
                action="https://api.web3forms.com/submit"
                method="POST"
                onSubmit={handleSubmit}
                className="contact-actual-form"
              >
                {/* Web3Forms Access Key */}
                <input
                  type="hidden"
                  name="access_key"
                  value="98474fca-20d3-4e56-b11c-b5544b1b584c"
                />
                {/* Form Subject */}
                <input
                  type="hidden"
                  name="subject"
                  value="New Inquiry from EduBuddy Contact Page"
                />
                <input
                  type="hidden"
                  name="from_name"
                  value="EduBuddy Website"
                />
                {/* Honeypot Anti-Spam */}
                <input
                  type="checkbox"
                  name="botcheck"
                  style={{ display: 'none' }}
                />

                {/* Row 1: Name & Email */}
                <div className="form-grid-2">
                  <div className="form-field-group">
                    <label className="form-label" htmlFor="name">
                      Your Name / Director Name <span className="req">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      name="name"
                      required
                      placeholder="e.g. Er. Rajesh Sharma"
                      className="form-input"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>

                  <div className="form-field-group">
                    <label className="form-label" htmlFor="email">
                      Official Email Address <span className="req">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      required
                      placeholder="director@sharmaclasses.com"
                      className="form-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* Row 2: WhatsApp Phone & Coaching Name */}
                <div className="form-grid-2">
                  <div className="form-field-group">
                    <label className="form-label" htmlFor="phone">
                      WhatsApp Phone Number <span className="req">*</span>
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      name="phone"
                      required
                      placeholder="+91 98765 43210"
                      className="form-input"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  <div className="form-field-group">
                    <label className="form-label" htmlFor="coaching_name">
                      Coaching / Institute Name
                    </label>
                    <input
                      id="coaching_name"
                      type="text"
                      name="coaching_name"
                      placeholder="e.g. Sharma Science Academy"
                      className="form-input"
                      value={instituteName}
                      onChange={(e) => setInstituteName(e.target.value)}
                    />
                  </div>
                </div>

                {/* Area of Interest */}
                <div className="form-field-group">
                  <label className="form-label" htmlFor="interest">
                    Primary Area of Interest
                  </label>
                  <select
                    id="interest"
                    name="interest"
                    className="form-select"
                    value={interest}
                    onChange={(e) => setInterest(e.target.value)}
                  >
                    <option value="Full Platform Walkthrough & Demo">
                      Full Platform Walkthrough & Live Demo
                    </option>
                    <option value="1-Tap Daily WhatsApp Haziri">
                      1-Tap Daily WhatsApp Haziri & Absent Parent Alerts
                    </option>
                    <option value="30-Second NCERT AI Question Paper Generator">
                      30-Second NCERT AI Question Paper Maker
                    </option>
                    <option value="Fee Management & GST Receipts">
                      Fee Management, UPI Receipts & WhatsApp Reminders
                    </option>
                    <option value="Multi-Branch Management">
                      Multi-Branch Coaching Custom Setup
                    </option>
                  </select>
                </div>

                {/* Message Textarea */}
                <div className="form-field-group">
                  <label className="form-label" htmlFor="message">
                    Your Message / Specific Requirements <span className="req">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={4}
                    placeholder="Tell us about your batch sizes, classes taught (e.g. Class 10 Foundation, NEET/JEE), or any special migration requests..."
                    className="form-textarea"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>

                {errorMessage && (
                  <div className="form-error-banner">
                    ⚠️ {errorMessage}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  className="contact-submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span>Submitting Message...</span>
                  ) : (
                    <>
                      <span>Send Message to EduBuddy</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </>
                  )}
                </button>

                <p className="form-guarantee-note">
                  🔒 100% Privacy Guarantee: Your institute contact information is strictly confidential and never shared with third parties.
                </p>
              </form>
            ) : (
              /* Submission Success Screen */
              <div className="contact-success-box">
                <div className="success-icon-ring">✓</div>
                <h3 className="success-title">Message Received!</h3>
                <p className="success-desc">
                  Thank you, <strong>{fullName || 'Director'}</strong>! Your message regarding{' '}
                  <strong>{instituteName || 'your coaching center'}</strong> has been routed to our senior product team. We will reach out to you via WhatsApp or Email within 15 minutes.
                </p>

                <div className="success-wa-action">
                  <p>Need an instant response right now?</p>
                  <a
                    href={`https://wa.me/919876543210?text=${whatsappMessage}`}
                    target="_blank"
                    rel="noreferrer"
                    className="success-btn-wa"
                  >
                    <span>💬</span> Chat on WhatsApp Immediately ↗
                  </a>
                </div>

                <button
                  type="button"
                  className="success-reset-btn"
                  onClick={handleReset}
                >
                  Send Another Message
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Direct Help & Fast Channels */}
          <aside className="contact-sidebar-col">
            {/* 1. Fast WhatsApp Desk Card */}
            <div className="sidebar-contact-card wa-accent-card">
              <div className="sidebar-card-top">
                <div className="sidebar-card-icon wa">💬</div>
                <div>
                  <h3 className="sidebar-card-heading">Director WhatsApp Desk</h3>
                  <span className="sidebar-card-subhead">Instant 1-on-1 direct line</span>
                </div>
              </div>

              <p className="sidebar-card-p">
                Skip the email queue! Chat directly with our product specialist for batch pricing, student migrations, or customized demonstrations.
              </p>

              <a
                href="https://wa.me/919876543210?text=Hi%20EduBuddy%2C%20I%20run%20a%20coaching%20center%20and%20want%20to%20explore%20EduBuddy."
                target="_blank"
                rel="noreferrer"
                className="sidebar-wa-pill-btn"
              >
                <span>💬</span>
                <span>Chat on WhatsApp (+91 98765 43210) ↗</span>
              </a>

              <div className="sidebar-card-footer">
                <span className="sidebar-live-dot" />
                <span>Typical reply time: Under 5 minutes</span>
              </div>
            </div>

            {/* 2. Official Channels & Hours */}
            <div className="sidebar-contact-card">
              <div className="sidebar-card-top">
                <div className="sidebar-card-icon office">🏢</div>
                <div>
                  <h3 className="sidebar-card-heading">Official Support & Head Office</h3>
                  <span className="sidebar-card-subhead">EduBuddy Technologies Pvt Ltd</span>
                </div>
              </div>

              <div className="contact-channels-stack">
                <div className="channel-row">
                  <span className="ch-icon">📞</span>
                  <div className="ch-body">
                    <span className="ch-title">Director Helpline</span>
                    <a href="tel:+919876543210" className="ch-value">
                      +91 98765 43210
                    </a>
                  </div>
                </div>

                <div className="channel-row">
                  <span className="ch-icon">✉️</span>
                  <div className="ch-body">
                    <span className="ch-title">Official Inquiries & Support</span>
                    <a href="mailto:director-support@edubuddy.ai" className="ch-value">
                      director-support@edubuddy.ai
                    </a>
                  </div>
                </div>

                <div className="channel-row">
                  <span className="ch-icon">📍</span>
                  <div className="ch-body">
                    <span className="ch-title">Corporate Headquarters</span>
                    <span className="ch-value text-muted">
                      EduBuddy Tower, Tonk Road, Jaipur, Rajasthan 302015
                    </span>
                  </div>
                </div>

                <div className="channel-row">
                  <span className="ch-icon">⏰</span>
                  <div className="ch-body">
                    <span className="ch-title">Operational Hours</span>
                    <span className="ch-value text-muted">
                      Monday to Saturday · 09:00 AM – 08:00 PM IST
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Director Trust Guarantee */}
            <div className="sidebar-trust-box">
              <div className="trust-box-header">
                <span className="trust-badge">🇮🇳 BUILT FOR BHARAT</span>
                <strong>Trusted by 1,400+ Coaching Institutes</strong>
              </div>
              <p className="trust-box-p">
                From local 30-student tuition batches to 2,000+ student NEET/JEE academies, EduBuddy delivers 98% parent engagement with zero number ban risk.
              </p>
            </div>
          </aside>
        </div>
      </main>

      {/* 4. CINEMATIC GRAND 3D FOOTER (EXACT SAME AS LANDING PAGE) */}
      <footer className="ref-grand-footer">
        {/* Soft Ambient Crimson & Blue Underglow */}
        <div className="ref-footer-ambient-glow" />

        <div className="ref-footer-container">
          {/* 5-Column Navigation Grid */}
          <div className="ref-footer-grid">
            {/* Column 1: Core Navigation */}
            <div className="ref-footer-col">
              <Link to="/#how-it-works">How it works</Link>
              <Link to="/#terminal">Terminal</Link>
              <Link to="/#pricing">Pricing</Link>
              <Link to="/#faq">FAQ</Link>
              <Link to="/contact">Contact Us</Link>
              <Link to="/login">Log in</Link>
            </div>

            {/* Column 2: Comparisons 1 */}
            <div className="ref-footer-col">
              <Link to="/dashboard">Classplus</Link>
              <Link to="/dashboard">Teachmint</Link>
              <Link to="/dashboard">Proctur</Link>
              <Link to="/dashboard">Winuall</Link>
              <Link to="/dashboard">Paper Registers</Link>
              <Link to="/#pricing" className="ref-footer-gold-link">All comparisons →</Link>
            </div>

            {/* Column 3: Tools & Systems (with vertical drop line) */}
            <div className="ref-footer-col ref-col-center">
              <Link to="/contact">WhatsApp Business</Link>
              <Link to="/contact">Excel Spreadsheets</Link>
              <Link to="/contact">Google Forms</Link>
              <Link to="/contact">Tally ERP</Link>
              <Link to="/contact">Biometric Attendance</Link>
              <Link to="/#pricing" className="ref-footer-gold-link">All comparisons →</Link>
            </div>

            {/* Column 4: Features */}
            <div className="ref-footer-col">
              <Link to="/#how-it-works">AI NCERT Question Papers</Link>
              <Link to="/#how-it-works">Daily Haziri Roll Call</Link>
              <Link to="/#how-it-works">Branded GST Invoices</Link>
              <Link to="/#how-it-works">Admission Leads CRM</Link>
              <Link to="/#how-it-works">Fee Reminder Automation</Link>
              <Link to="/#how-it-works" className="ref-footer-gold-link">All lists →</Link>
            </div>

            {/* Column 5: Company */}
            <div className="ref-footer-col">
              <span className="ref-footer-col-header">Resources</span>
              <Link to="/contact">Blog</Link>
              <Link to="/contact">Changelog</Link>
              <Link to="/contact">Mission</Link>
              <Link to="/contact">Team</Link>
            </div>
          </div>

          {/* Vertical Drop Line connecting from Center Column towards EduBuddy */}
          <div className="ref-drop-line-wrap">
            <div className="ref-drop-line" />
            <div className="ref-drop-point" />
          </div>

          {/* Giant 3D Extruded Brand Typography "EduBuddy" in Blue */}
          <div className="ref-giant-brand-wrap">
            <h1 className="ref-giant-3d-text">
              EduBuddy
            </h1>
          </div>

          {/* Bottom Copyright Strip */}
          <div className="ref-footer-bottom">
            <span>© 2026 EduBuddy Technologies Pvt Ltd · Bharat's #1 Coaching OS</span>
            <div className="ref-footer-legal-links">
              <Link to="/contact">Privacy</Link>
              <span>·</span>
              <Link to="/contact">Terms</Link>
              <span>·</span>
              <a href="https://wa.me/919876543210" target="_blank" rel="noreferrer">WhatsApp Helpline</a>
            </div>
          </div>
        </div>
      </footer>

      {/* 5. STICKY MOBILE CONVERSION BAR (FOR PHONE THUMB USERS) */}
      <div className="ref-sticky-mobile">
        <a
          href="https://wa.me/919876543210?text=Hi%20EduBuddy%2C%20I%20run%20a%20coaching%20center%20and%20want%20to%20see%20a%20demo."
          target="_blank"
          rel="noreferrer"
          className="ref-sticky-wa"
        >
          <span>💬</span> WhatsApp Demo
        </a>
        <button
          type="button"
          className="ref-sticky-trial"
          onClick={handleStartTrial}
        >
          <span>⚡</span> Start Free Trial →
        </button>
      </div>
    </div>
  );
}
