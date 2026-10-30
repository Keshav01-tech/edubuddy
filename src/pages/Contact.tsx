import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Contact.css';

export default function Contact() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [instituteName, setInstituteName] = useState('');
  const [cityState, setCityState] = useState('');
  const [studentCapacity, setStudentCapacity] = useState('150-300 Students');
  const [selectedCourses, setSelectedCourses] = useState<string[]>([
    'Class 9-10 (Board)',
    'Class 11-12 (Science)',
  ]);
  const [primaryInterest, setPrimaryInterest] = useState('Full Platform Walkthrough');
  const [contactMode, setContactMode] = useState<'whatsapp' | 'call' | 'email'>('whatsapp');
  const [message, setMessage] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');

  const toggleCourse = (course: string) => {
    setSelectedCourses((prev) =>
      prev.includes(course) ? prev.filter((c) => c !== course) : [...prev, course]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate reliable inquiry submission
    setTimeout(() => {
      const generatedTicket = `EDU-INQ-${Math.floor(1000 + Math.random() * 9000)}`;
      setTicketId(generatedTicket);
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 700);
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setFullName('');
    setEmail('');
    setPhone('');
    setInstituteName('');
    setCityState('');
    setMessage('');
  };

  const coursesList = [
    'Class 6-8 (Middle)',
    'Class 9-10 (Board)',
    'Class 11-12 (Science)',
    'Class 11-12 (Commerce)',
    'NEET/JEE Foundation',
    'State Board / Other',
  ];

  const capacityOptions = [
    '<50 Students',
    '50-150 Students',
    '150-300 Students',
    '300-500 Students',
    '500+ Students',
  ];

  const whatsappMessage = encodeURIComponent(
    `Hi EduBuddy Team! My name is ${fullName || 'Director'}, from ${instituteName || 'my coaching academy'} (${cityState || 'India'}). I am interested in ${primaryInterest}. Please share details / schedule a demo.`
  );

  return (
    <div className="contact-page-root">
      {/* 1. Header Bar */}
      <header className="contact-page-header">
        <Link to="/" className="contact-nav-brand">
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
          </svg>
          <span className="contact-brand-title">
            Edu<span>Buddy</span>
          </span>
          <span className="contact-tag-badge">INSTITUTE OS</span>
        </Link>

        <nav className="contact-nav-links">
          <Link to="/" className="contact-nav-link">
            Home Overview
          </Link>
          <a href="/#features" className="contact-nav-link">
            Modules
          </a>
          <a href="/#pricing" className="contact-nav-link">
            Pricing
          </a>
          <a href="/#faq" className="contact-nav-link">
            FAQ
          </a>
          <Link to="/dashboard" className="contact-nav-link">
            Live App
          </Link>
        </nav>

        <Link to="/" className="contact-nav-cta">
          Back to Terminal ↗
        </Link>
      </header>

      {/* 2. Hero Section */}
      <section className="contact-hero-wrap">
        <span className="contact-hero-badge">
          💬 DIRECTOR CONSULTATION & ADVISORY DESK
        </span>
        <h1 className="contact-hero-title">
          Let’s Scale Your Coaching Center with <em>Conviction.</em>
        </h1>
        <p className="contact-hero-lede">
          Have questions about 1-Tap WhatsApp Haziri, NCERT question papers, or custom multi-branch setup? Connect with our dedicated institute success specialists.
        </p>
      </section>

      {/* 3. Main Grid (Form + Contact Sidebar) */}
      <main className="contact-main-grid">
        {/* Left Card: Form or Success */}
        <div className="contact-form-card">
          <div className="form-header-bar">
            <div>
              <h2>Institute Inquiry Form</h2>
              <p style={{ fontSize: '11px', color: '#887d96', margin: '3px 0 0' }}>
                Fill in your coaching details to receive a customized demo & pricing.
              </p>
            </div>
            <span className="guarantee-chip">⚡ 15-Min WhatsApp Response</span>
          </div>

          {!isSubmitted ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Row 1: Director Name & Email */}
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="fullName">
                    Director / Admin Name <span className="required-star">*</span>
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    placeholder="e.g. Er. Rajesh Sharma"
                    className="form-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="email">
                    Official Email Address <span className="required-star">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="director@sharmaclasses.com"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Row 2: Phone/WhatsApp & Institute Name */}
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="phone">
                    WhatsApp Phone Number <span className="required-star">*</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    className="form-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="instituteName">
                    Coaching / Academy Name <span className="required-star">*</span>
                  </label>
                  <input
                    id="instituteName"
                    type="text"
                    required
                    placeholder="e.g. Apex Science Tutorials"
                    className="form-input"
                    value={instituteName}
                    onChange={(e) => setInstituteName(e.target.value)}
                  />
                </div>
              </div>

              {/* Row 3: City & State + Primary Interest */}
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="cityState">
                    City & State <span className="required-star">*</span>
                  </label>
                  <input
                    id="cityState"
                    type="text"
                    required
                    placeholder="e.g. Jaipur, Rajasthan"
                    className="form-input"
                    value={cityState}
                    onChange={(e) => setCityState(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="primaryInterest">
                    Primary Area of Interest
                  </label>
                  <select
                    id="primaryInterest"
                    className="form-select"
                    value={primaryInterest}
                    onChange={(e) => setPrimaryInterest(e.target.value)}
                  >
                    <option value="Full Platform Walkthrough">Full Platform Walkthrough & Demo</option>
                    <option value="1-Tap Daily WhatsApp Haziri">1-Tap WhatsApp Haziri & Absent Alerts</option>
                    <option value="NCERT AI Question Paper Generator">30-Second NCERT AI Question Paper Maker</option>
                    <option value="Fee Management & GST Receipts">Fee Invoicing, Receipts & WhatsApp Reminders</option>
                    <option value="Multi-Branch Management">Multi-Branch Academy Custom Setup</option>
                  </select>
                </div>
              </div>

              {/* Enrolled Students Capacity */}
              <div className="form-group">
                <label className="form-label">
                  Current Enrolled Student Count <span className="required-star">*</span>
                </label>
                <div className="chips-group">
                  {capacityOptions.map((opt) => (
                    <button
                      type="button"
                      key={opt}
                      className={`chip-selector ${studentCapacity === opt ? 'active' : ''}`}
                      onClick={() => setStudentCapacity(opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Classes & Courses Handled */}
              <div className="form-group">
                <label className="form-label">
                  Classes / Courses Taught (Select all that apply)
                </label>
                <div className="chips-group">
                  {coursesList.map((course) => (
                    <button
                      type="button"
                      key={course}
                      className={`chip-selector ${selectedCourses.includes(course) ? 'active' : ''}`}
                      onClick={() => toggleCourse(course)}
                    >
                      {selectedCourses.includes(course) ? '✓ ' : '+ '}
                      {course}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preferred Contact Mode */}
              <div className="form-group">
                <label className="form-label">Preferred Contact Channel</label>
                <div className="contact-mode-radios">
                  <div
                    className={`radio-card ${contactMode === 'whatsapp' ? 'active' : ''}`}
                    onClick={() => setContactMode('whatsapp')}
                  >
                    <span>💬</span> WhatsApp (Fastest)
                  </div>
                  <div
                    className={`radio-card ${contactMode === 'call' ? 'active' : ''}`}
                    onClick={() => setContactMode('call')}
                  >
                    <span>📞</span> Phone Call
                  </div>
                  <div
                    className={`radio-card ${contactMode === 'email' ? 'active' : ''}`}
                    onClick={() => setContactMode('email')}
                  >
                    <span>✉️</span> Email Quote
                  </div>
                </div>
              </div>

              {/* Message / Special Requirements */}
              <div className="form-group">
                <label className="form-label" htmlFor="message">
                  Specific Requirements or Questions (Optional)
                </label>
                <textarea
                  id="message"
                  className="form-textarea"
                  placeholder="Tell us about your batch timings, number of faculty members, or special requirements (e.g. migration from existing registers)..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting Inquiry...' : 'Submit Institute Inquiry ↗'}
              </button>

              <p style={{ fontSize: '10px', color: '#7e758c', textAlign: 'center', margin: 0 }}>
                🔒 100% Privacy Guarantee: Your institute phone number is never shared with third parties.
              </p>
            </form>
          ) : (
            /* Submission Success Screen */
            <div className="success-screen-card">
              <div className="success-icon-bubble">✓</div>
              <h3>Thank You, {fullName || 'Director'}!</h3>
              <p>
                Your inquiry for <strong>{instituteName}</strong> ({cityState}) has been received. Our senior product consultant will contact you via {contactMode.toUpperCase()} within 15 minutes.
              </p>

              <span className="ref-ticket-pill">
                Reference ID: {ticketId}
              </span>

              {/* Instant WhatsApp Connect Button */}
              <div className="instant-wa-box">
                <p>Want an immediate answer right now without waiting?</p>
                <a
                  href={`https://wa.me/919876543210?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noreferrer"
                  className="wa-instant-btn"
                >
                  <span>💬</span> Continue on WhatsApp Now ↗
                </a>
              </div>

              <button
                type="button"
                className="reset-form-btn"
                onClick={handleReset}
              >
                Submit Another Request
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Direct Help & Trust Cards */}
        <aside className="contact-sidebar">
          {/* Card 1: 1-Tap WhatsApp Desk */}
          <div className="sidebar-info-card sidebar-wa-card">
            <div className="sidebar-card-top">
              <div className="sidebar-icon-circle">💬</div>
              <div>
                <h3>Director WhatsApp Desk</h3>
                <p>Instant chat with our onboarding team</p>
              </div>
            </div>
            <p className="sidebar-body-text">
              Have a quick question about fee receipts, NCERT question papers, or student limits? Skip the form and chat with us on WhatsApp immediately.
            </p>
            <a
              href="https://wa.me/919876543210?text=Hi%20EduBuddy%20Team%2C%20I%20run%20a%20coaching%20institute%20and%20want%20to%20explore%20EduBuddy."
              target="_blank"
              rel="noreferrer"
              className="sidebar-wa-btn"
            >
              <span>💬</span> Open WhatsApp Chat ↗
            </a>
          </div>

          {/* Card 2: Official Contact Details */}
          <div className="sidebar-info-card">
            <div className="sidebar-card-top">
              <div className="sidebar-icon-circle">🏢</div>
              <div>
                <h3>Official Help & Support</h3>
                <p>EduBuddy Technologies Pvt Ltd</p>
              </div>
            </div>

            <div className="channels-list">
              <div className="channel-item">
                <span className="ch-icon">📞</span>
                <div className="ch-info">
                  <span className="ch-label">Director Helpline</span>
                  <a href="tel:+919876543210" className="ch-val">
                    +91 98765 43210
                  </a>
                </div>
              </div>

              <div className="channel-item">
                <span className="ch-icon">✉️</span>
                <div className="ch-info">
                  <span className="ch-label">Support Email</span>
                  <a href="mailto:director-support@edubuddy.ai" className="ch-val">
                    director-support@edubuddy.ai
                  </a>
                </div>
              </div>

              <div className="channel-item">
                <span className="ch-icon">📍</span>
                <div className="ch-info">
                  <span className="ch-label">Head Office</span>
                  <span className="ch-val">
                    EduBuddy Tower, Tonk Road, Jaipur, Rajasthan 302015
                  </span>
                </div>
              </div>

              <div className="channel-item">
                <span className="ch-icon">⏰</span>
                <div className="ch-info">
                  <span className="ch-label">Advisory Timings</span>
                  <span className="ch-val">
                    Monday – Saturday (9:00 AM – 8:00 PM IST)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Free Migration Guarantee */}
          <div className="sidebar-info-card">
            <div className="sidebar-card-top">
              <div className="sidebar-icon-circle">🚀</div>
              <div>
                <h3>Free Migration Guarantee</h3>
                <p>Zero effort for your coaching staff</p>
              </div>
            </div>
            <ul className="perks-list">
              <li>
                <span className="perk-bullet">✓</span>
                <span>Send us your existing Excel or scanned paper ledger.</span>
              </li>
              <li>
                <span className="perk-bullet">✓</span>
                <span>Our team uploads your entire student roster within 2 hours.</span>
              </li>
              <li>
                <span className="perk-bullet">✓</span>
                <span>Includes a 15-minute 1-on-1 video call to train your receptionist.</span>
              </li>
            </ul>
          </div>
        </aside>
      </main>

      {/* 4. Bottom Quick FAQ Strip */}
      <section className="contact-faq-strip">
        <div className="contact-faq-box">
          <div className="contact-faq-head">
            <h3>Quick Answers Before You Reach Out</h3>
            <Link to="/#faq">View All FAQs ↗</Link>
          </div>
          <div className="contact-faq-grid">
            <div className="contact-faq-card">
              <h4>Can I test the platform with sample students?</h4>
              <p>Yes! Click "Live App" in the top bar to immediately test the interactive terminal with Kartik, Priya, and Aman's records.</p>
            </div>
            <div className="contact-faq-card">
              <h4>Is WhatsApp messaging extra paid?</h4>
              <p>No! Our 1-tap WhatsApp attendance and fee reminder integration works directly with your regular WhatsApp Web / App.</p>
            </div>
            <div className="contact-faq-card">
              <h4>Can we get a custom quote for 3+ branches?</h4>
              <p>Yes. Select "500+ Students" above and our multi-branch account executive will share an enterprise tier quote.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Footer Bar */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '24px', textAlign: 'center', fontSize: '11px', color: '#7a7088' }}>
        © 2026 EduBuddy Technologies Pvt Ltd · Crafted for Coaching Institutes Across Bharat 🇮🇳
      </footer>
    </div>
  );
}
