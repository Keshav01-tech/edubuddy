import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './MobileLandingPage.css';
import { useAuth } from '../context/AuthContext';
import PublicNavbar from '../components/PublicNavbar';
import BrightFutureInvoice from '../components/BrightFutureInvoice';
import BrightFutureExamPaper from '../components/BrightFutureExamPaper';

export default function MobileLandingPage() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();

  const [darkViewMode, setDarkViewMode] = useState<'edubuddy' | 'typical' | 'test' | 'fees'>('edubuddy');
  const [waNotice, setWaNotice] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Phone Mockup Active Tab & Interactive State (Fees, NCERT, Haziri)
  const [phoneMode, setPhoneMode] = useState<'fees' | 'ncert' | 'haziri'>('fees');
  const [feeReminderSent, setFeeReminderSent] = useState(false);
  const [ncertPdfReady, setNcertPdfReady] = useState(false);
  const [studentAbsent, setStudentAbsent] = useState(true);

  const handleSendFeeReminder = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFeeReminderSent(true);
    setTimeout(() => setFeeReminderSent(false), 3500);
  };

  const handleGeneratePdf = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNcertPdfReady(true);
    setTimeout(() => setNcertPdfReady(false), 3500);
  };

  const toggleStudentStatus = () => {
    setStudentAbsent((prev) => !prev);
  };

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

  const triggerWaNotice = (studentName: string) => {
    setWaNotice(`WhatsApp absentee alert delivered to ${studentName}'s parent!`);
    setTimeout(() => setWaNotice(null), 3000);
  };

  return (
    <div className="ref-landing-page">
      {/* 1. COMMON PUBLIC NAVBAR */}
      <PublicNavbar />

      {/* 2. HERO SECTION — CENTERED SAAS LAYOUT WITH AURA & CONCENTRIC ARCS */}
      <section className="ref-hero ref-hero-centered">
        {/* Soft Radial Ambient Glow & Concentric Orbital Arcs in EduBuddy Electric Blue */}
        <div className="ref-hero-aura-wrap" aria-hidden="true">
          <div className="ref-hero-radial-glow" />
          <svg
            className="ref-hero-concentric-rings"
            viewBox="0 0 1440 760"
            fill="none"
            preserveAspectRatio="xMidYMid slice"
          >
            <circle cx="720" cy="700" r="300" stroke="rgba(0, 122, 255, 0.22)" strokeWidth="1.2" />
            <circle cx="720" cy="700" r="500" stroke="rgba(0, 122, 255, 0.15)" strokeWidth="1.2" />
            <circle cx="720" cy="700" r="700" stroke="rgba(0, 122, 255, 0.09)" strokeWidth="1.2" />
            <circle cx="720" cy="700" r="900" stroke="rgba(0, 122, 255, 0.05)" strokeWidth="1.2" />
            <circle cx="720" cy="700" r="1100" stroke="rgba(0, 122, 255, 0.03)" strokeWidth="1.2" />
          </svg>
        </div>

        <div className="ref-hero-container ref-hero-centered-content">
          {/* Main Centered Headline with Gradient Highlights (matching reference UX) */}
          <h1 className="ref-hero-title-centered">
            <span className="ref-hero-title-line">
              Effortless Coaching <span className="ref-hero-highlight-word">Management</span>
            </span>
            <span className="ref-hero-title-line">
              That Makes your Life <span className="ref-hero-highlight-word">Easier</span>
            </span>
          </h1>

          {/* Centered Subtitle */}
          <p className="ref-hero-sub-centered">
            Schedule daily haziri with a single tap, generate NCERT test papers in 30 seconds, and collect batch fees with automatic GST receipts dispatched straight to parents' WhatsApp.
          </p>

          {/* Centered CTA Button & WhatsApp Demo */}
          <div className="ref-hero-cta-wrap">
            <button
              type="button"
              className="ref-hero-main-cta"
              onClick={handleStartTrial}
            >
              <span>Get Started</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
            <div className="ref-hero-cta-subtext">
              <span>No credit card required · Free 14-day trial</span>
              <span className="ref-hero-sub-dot">•</span>
              <a
                href="https://wa.me/919876543210?text=Hi%20EduBuddy%2C%20I%20run%20a%20coaching%20center%20and%20want%20a%20demo"
                target="_blank"
                rel="noreferrer"
                className="ref-hero-wa-chat"
              >
                <span className="ref-wa-live-dot" />
                or chat on WhatsApp
              </a>
            </div>
          </div>

          {/* Social Proof Trust Stack */}
          <div className="ref-hero-trust-badge">
            <div className="ref-avatar-stack">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80"
                alt="Director"
                className="ref-avatar-img"
              />
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80"
                alt="Director"
                className="ref-avatar-img"
              />
              <img
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&auto=format&fit=crop&q=80"
                alt="Director"
                className="ref-avatar-img"
              />
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=80"
                alt="Director"
                className="ref-avatar-img"
              />
            </div>
            <div className="ref-trust-text">
              <span className="ref-trust-stars">★★★★★</span>
              <span>Trusted by <strong>1,200+ coaching institutes</strong> across India</span>
            </div>
          </div>

          {/* Centered iPhone Mockup Emerging at Bottom of Hero */}
          <div className="ref-hero-phone-centered-container">
            <div className="ref-iphone-frame">
                {/* Physical buttons on bezel */}
                <div className="ref-btn-volume-up" />
                <div className="ref-btn-volume-down" />
                <div className="ref-btn-power" />

                <div className="ref-iphone-inner">
                  {/* Status Bar */}
                  <div className="ref-ios-status">
                    <span className="ref-ios-time">9:41</span>
                    <div className="ref-dynamic-island" />
                    <div className="ref-ios-icons">
                      {/* Signal */}
                      <svg width="13" height="10" viewBox="0 0 17 11" fill="currentColor">
                        <rect x="0" y="7" width="2.5" height="4" rx="0.8" />
                        <rect x="4.5" y="5" width="2.5" height="6" rx="0.8" />
                        <rect x="9" y="2.5" width="2.5" height="8.5" rx="0.8" />
                        <rect x="13.5" y="0" width="2.5" height="11" rx="0.8" />
                      </svg>
                      {/* Wifi */}
                      <svg width="12" height="10" viewBox="0 0 16 12" fill="currentColor">
                        <path d="M8 9.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm-3.5-3a5 5 0 0 1 7 0l-.9.9a3.7 3.7 0 0 0-5.2 0l-.9-.9zm-3-3a9.2 9.2 0 0 1 13 0l-.9.9a7.9 7.9 0 0 0-11.2 0l-.9-.9z" />
                      </svg>
                      {/* Battery */}
                      <div className="ref-ios-battery">
                        <div className="ref-battery-level" />
                      </div>
                    </div>
                  </div>

                  {/* App Header: Coaching Institute & Live Batch */}
                  <div className="phone-app-header">
                    <div className="phone-app-brand">
                      <div className="phone-brand-avatar">🏫</div>
                      <div>
                        <div className="phone-brand-name">Sharma Science Academy</div>
                        <div className="phone-brand-batch">Class 10 Foundation (Batch A)</div>
                      </div>
                    </div>
                    <div className="phone-live-indicator">
                      <span className="phone-live-dot" />
                      <span>Live OS</span>
                    </div>
                  </div>

                  {/* Feature Switcher Tabs inside Phone */}
                  <div className="phone-tab-bar">
                    <button
                      type="button"
                      className={`phone-tab-btn ${phoneMode === 'fees' ? 'active' : ''}`}
                      onClick={() => setPhoneMode('fees')}
                    >
                      💳 Fees
                    </button>
                    <button
                      type="button"
                      className={`phone-tab-btn ${phoneMode === 'ncert' ? 'active' : ''}`}
                      onClick={() => setPhoneMode('ncert')}
                    >
                      📑 NCERT Tests
                    </button>
                    <button
                      type="button"
                      className={`phone-tab-btn ${phoneMode === 'haziri' ? 'active' : ''}`}
                      onClick={() => setPhoneMode('haziri')}
                    >
                      ⚡ Haziri
                    </button>
                  </div>

                  {/* Phone Screen Dynamic Content */}
                  <div className="phone-screen-body">
                    {/* 1. FEES MANAGEMENT VIEW (BRIGHT FUTURE OFFICIAL INVOICE / RECEIPT) */}
                    {phoneMode === 'fees' && (
                      <div className="phone-view-container">
                        <div className="phone-doc-card">
                          <BrightFutureInvoice compact={true} />
                        </div>

                        <div className="phone-item-action" style={{ marginTop: '2px' }}>
                          {feeReminderSent ? (
                            <div className="phone-success-toast">
                              ✓ WhatsApp Fee Receipt with UPI QR Sent to Aditya Paswan!
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="phone-action-btn wa-btn"
                              onClick={handleSendFeeReminder}
                            >
                              <span>💬</span> 1-Tap WhatsApp Receipt & UPI QR
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 2. NCERT QUESTION PAPER MAKER VIEW (BRIGHT FUTURE ANNUAL EXAM) */}
                    {phoneMode === 'ncert' && (
                      <div className="phone-view-container">
                        <div className="phone-doc-card">
                          <BrightFutureExamPaper compact={true} />
                        </div>

                        <div className="phone-paper-actions" style={{ marginTop: '2px' }}>
                          {ncertPdfReady ? (
                            <div className="phone-success-toast">
                              ✓ Printable PDF with "Bright Future" Header & Set-A Ready!
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="phone-action-btn print-btn"
                              onClick={handleGeneratePdf}
                            >
                              <span>🖨️</span> Print Set-A Paper with Header
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 3. 1-TAP HAZIRI (ATTENDANCE) VIEW */}
                    {phoneMode === 'haziri' && (
                      <div className="phone-view-container">
                        {/* Attendance Metric Card */}
                        <div className="phone-hero-card green-accent">
                          <div className="phone-card-eyebrow">
                            <span>Today's Morning Haziri</span>
                            <span className="phone-badge-green">Batch 10-A</span>
                          </div>
                          <div className="phone-haziri-stats">
                            <div className="phone-h-stat">
                              <span className="h-val text-green">{studentAbsent ? '46' : '47'}</span>
                              <span className="h-lbl">Present</span>
                            </div>
                            <div className="phone-h-divider" />
                            <div className="phone-h-stat">
                              <span className="h-val text-red">{studentAbsent ? '2' : '1'}</span>
                              <span className="h-lbl">Absent</span>
                            </div>
                            <div className="phone-h-divider" />
                            <div className="phone-h-stat">
                              <span className="h-val">18s</span>
                              <span className="h-lbl">Roll Call Time</span>
                            </div>
                          </div>
                        </div>

                        {/* Student Roll Call Interactive List */}
                        <div className="phone-haziri-list">
                          <div className="phone-hz-row">
                            <div className="hz-avatar">KP</div>
                            <div className="hz-info">
                              <span className="hz-name">Kartik Pandey (Roll #01)</span>
                              <span className="hz-sub">100% Monthly Haziri</span>
                            </div>
                            <span className="hz-badge present">PRESENT ✓</span>
                          </div>

                          <div className="phone-hz-row" onClick={toggleStudentStatus} style={{ cursor: 'pointer' }}>
                            <div className="hz-avatar red">AV</div>
                            <div className="hz-info">
                              <span className="hz-name">Aman Verma (Roll #03)</span>
                              <span className="hz-sub text-red">
                                {studentAbsent ? 'Parent WhatsApp Alert Sent 09:02' : 'Marked Present ✓'}
                              </span>
                            </div>
                            <span className={`hz-badge ${studentAbsent ? 'absent' : 'present'}`}>
                              {studentAbsent ? 'ABSENT ❌' : 'PRESENT ✓'}
                            </span>
                          </div>

                          <div className="phone-hz-row">
                            <div className="hz-avatar">RM</div>
                            <div className="hz-info">
                              <span className="hz-name">Rohan Mehra (Roll #04)</span>
                              <span className="hz-sub">In-Class · Physics Batch</span>
                            </div>
                            <span className="hz-badge present">PRESENT ✓</span>
                          </div>
                        </div>

                        {/* WhatsApp Delivery Note */}
                        <div className="phone-wa-status-box">
                          <span>📱 2 Parent Absentees alerted on WhatsApp with zero typing</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* App Bottom Navigation Strip */}
                  <div className="phone-app-bottom">
                    <button
                      type="button"
                      className={`phone-bottom-tab ${phoneMode === 'fees' ? 'active' : ''}`}
                      onClick={() => setPhoneMode('fees')}
                    >
                      <span className="tab-icon">💳</span>
                      <span>Fees</span>
                    </button>
                    <button
                      type="button"
                      className={`phone-bottom-tab ${phoneMode === 'ncert' ? 'active' : ''}`}
                      onClick={() => setPhoneMode('ncert')}
                    >
                      <span className="tab-icon">📑</span>
                      <span>NCERT</span>
                    </button>
                    <button
                      type="button"
                      className={`phone-bottom-tab ${phoneMode === 'haziri' ? 'active' : ''}`}
                      onClick={() => setPhoneMode('haziri')}
                    >
                      <span className="tab-icon">⚡</span>
                      <span>Haziri</span>
                    </button>
                  </div>

                  {/* iOS Home Indicator Bar */}
                  <div className="ref-home-bar" />
                </div>
              </div>
            </div>
          </div>
      </section>

      {/* 3. HIGHLIGHT EMOJIS & FEATURES ROW */}
      <div className="ref-highlight-row">
        <span className="ref-highlight-chip">🔥 1-Tap Daily WhatsApp Haziri</span>
        <span className="ref-highlight-chip">📚 NCERT Class 6-12 Blueprints</span>
        <span className="ref-highlight-chip">🧾 Branded GST Fee Receipts</span>
        <span className="ref-highlight-chip">⚡ 15-Sec Daily Roll Call</span>
        <span className="ref-highlight-chip">👥 Zero Batch Clashes</span>
        <span className="ref-highlight-chip">🎯 98% On-Time Fee Recovery</span>
      </div>

      {/* 4. "HOW IT WORKS" — 6 PASTEL CARDS (EXACT PIXEL-TO-PIXEL MATCH OF SCREENSHOT) */}
      <section className="ref-section" id="how-it-works">
        <div className="ref-section-head">
          <h2 className="ref-section-title">How it works.</h2>
          <p className="ref-section-sub">
            Say goodbye to paper registers, WhatsApp broadcast chaos, and awkward fee follow-ups. Everything your coaching center needs to run on autopilot.
          </p>
        </div>

        <div className="ref-pastel-grid">
          {/* Card 1: Warm Peach — Daily Haziri */}
          <div className="ref-card-item">
            <div className="ref-card-box ref-box-peach">
              <div className="ref-card-screen">
                <div className="ref-screen-head">
                  <span className="card-mock-tag tag-peach">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <polyline points="16 11 18 13 22 9" />
                    </svg>
                    <span>Daily Haziri</span>
                  </span>
                  <span className="card-mock-status green">
                    <span className="status-dot green" />
                    46 / 48 Present
                  </span>
                </div>

                <div className="card-mock-content">
                  <div className="card-batch-row">
                    <span className="batch-name">Class 10 Foundation (Batch A)</span>
                    <span className="batch-time">Today · 09:00 AM</span>
                  </div>

                  <div className="clean-roster-list">
                    <div className="clean-roster-item">
                      <div className="roster-avatar">KP</div>
                      <div className="roster-info">
                        <span className="roster-name">Kartik Pandey</span>
                        <span className="roster-sub">Roll #01 · 100% Monthly</span>
                      </div>
                      <span className="roster-pill present">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Present
                      </span>
                    </div>

                    <div className="clean-roster-item absent-item">
                      <div className="roster-avatar red">AV</div>
                      <div className="roster-info">
                        <span className="roster-name">Aman Verma</span>
                        <span className="roster-sub text-red">Roll #03 · WA alert sent</span>
                      </div>
                      <span className="roster-pill absent">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        Absent
                      </span>
                    </div>

                    <div className="clean-roster-item">
                      <div className="roster-avatar">RM</div>
                      <div className="roster-info">
                        <span className="roster-name">Rohan Mehra</span>
                        <span className="roster-sub">Roll #04 · In-Class</span>
                      </div>
                      <span className="roster-pill present">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Present
                      </span>
                    </div>
                  </div>

                  <div className="clean-alert-bar">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    <span>Absentee alerts dispatched to parents via WhatsApp</span>
                  </div>
                </div>

                <div className="card-mock-footer">
                  <button type="button" className="card-btn-action dark">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                    <span>1-Tap Attendance Broadcast</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="ref-card-caption">
              <h3 className="ref-card-heading">
                <span className="ref-card-num">1</span>
                Tell it about your coaching & take 1-tap haziri
              </h3>
              <p className="ref-card-desc">
                Mark 50 students in under 15 seconds. Instant WhatsApp notifications are automatically dispatched to absent students' parents with zero manual typing.
              </p>
            </div>
          </div>

          {/* Card 2: Fresh Mint — NCERT Test Paper */}
          <div className="ref-card-item">
            <div className="ref-card-box ref-box-mint">
              <div className="ref-card-screen">
                <div className="ref-screen-head">
                  <span className="card-mock-tag tag-mint">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                    <span>NCERT Test Maker</span>
                  </span>
                  <span className="card-mock-status blue">
                    Class 11 Maths · Set A
                  </span>
                </div>

                <div className="card-mock-content">
                  <div className="clean-paper-sheet">
                    <div className="paper-head-row">
                      <div className="paper-title-col">
                        <span className="paper-inst-name">BRIGHT FUTURE INSTITUTE</span>
                        <span className="paper-exam-name">Annual Examination 2026–27 · Mathematics</span>
                      </div>
                      <span className="paper-set-pill">SET - A</span>
                    </div>

                    <div className="paper-meta-row">
                      <span>Time: <strong>3 Hours</strong></span>
                      <span>Max Marks: <strong>100</strong></span>
                      <span className="paper-blueprint-tag">CBSE Blueprint</span>
                    </div>

                    <div className="paper-questions-list">
                      <div className="paper-q-item">
                        <span className="paper-q-num">Q1</span>
                        <div className="paper-q-text">
                          If A = &#123;1, 2, 3&#125;, number of subsets of A is:
                          <span className="paper-q-answer">
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            (c) 8 subsets
                          </span>
                        </div>
                      </div>
                      <div className="paper-q-item">
                        <span className="paper-q-num">Q2</span>
                        <div className="paper-q-text">
                          The value of sin 60°:
                          <span className="paper-q-answer">
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            √3 / 2
                          </span>
                        </div>
                      </div>
                      <div className="paper-q-item">
                        <span className="paper-q-num">Q6</span>
                        <div className="paper-q-text">
                          Solve log₂ 8:
                          <span className="paper-q-answer">
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            3 (Teacher key included)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card-mock-footer">
                  <button type="button" className="card-btn-action dark">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    <span>Download Print-Ready PDF</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="ref-card-caption">
              <h3 className="ref-card-heading">
                <span className="ref-card-num">2</span>
                It drafts NCERT tests & printable PDFs
              </h3>
              <p className="ref-card-desc">
                Every morning it picks chapters from Class 6-12 Maths & Science. Generates printable PDFs with your institute logo, blueprint marks, and complete answer keys.
              </p>
            </div>
          </div>

          {/* Card 3: Sky Blue — Branded Fee Receipt */}
          <div className="ref-card-item">
            <div className="ref-card-box ref-box-sky">
              <div className="ref-card-screen">
                <div className="ref-screen-head">
                  <span className="card-mock-tag tag-sky">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                    </svg>
                    <span>Official Fee Receipt</span>
                  </span>
                  <span className="card-mock-status green">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Paid · ₹42,000
                  </span>
                </div>

                <div className="card-mock-content">
                  <div className="clean-receipt-sheet">
                    <div className="receipt-brand-row">
                      <div className="receipt-brand-meta">
                        <span className="receipt-inst-name">BRIGHT FUTURE INSTITUTE</span>
                        <span className="receipt-num-text">Invoice #BFIT/2026/1048 · 25 Oct 2026</span>
                      </div>
                      <span className="receipt-tax-pill">GST Tax Invoice</span>
                    </div>

                    <div className="receipt-student-bar">
                      <div className="receipt-student-info">
                        <strong>Aditya Paswan</strong>
                        <span>BCA 1st Year (BFIT20260124)</span>
                      </div>
                      <span className="receipt-upi-pill">UPI Verified</span>
                    </div>

                    <div className="receipt-breakdown">
                      <div className="receipt-line">
                        <span>Tuition Fee (Semester 1)</span>
                        <strong>₹35,000.00</strong>
                      </div>
                      <div className="receipt-line">
                        <span>Registration & Exam Fee</span>
                        <strong>₹7,000.00</strong>
                      </div>
                      <div className="receipt-line total-line">
                        <span>Total Amount Paid</span>
                        <span className="receipt-total-val">₹42,000.00</span>
                      </div>
                    </div>

                    <div className="receipt-audit-bar">
                      <span className="audit-ref">HDFC A/C: 50201234567890</span>
                      <span className="audit-status">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                          <polyline points="20 11 13 18 10 15" />
                        </svg>
                        Delivered on WhatsApp
                      </span>
                    </div>
                  </div>
                </div>

                <div className="card-mock-footer">
                  <button type="button" className="card-btn-action dark">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="18" cy="5" r="3"/>
                      <circle cx="6" cy="12" r="3"/>
                      <circle cx="18" cy="19" r="3"/>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                    </svg>
                    <span>Share Branded PDF on WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="ref-card-caption">
              <h3 className="ref-card-heading">
                <span className="ref-card-num">3</span>
                It drafts branded fee receipts
              </h3>
              <p className="ref-card-desc">
                It calculates batch fees, adds GST details, generates unique UPI QR codes, and drafts polite WhatsApp messages ready for parent delivery.
              </p>
            </div>
          </div>

          {/* Card 4: Lavender — WhatsApp Automation */}
          <div className="ref-card-item">
            <div className="ref-card-box ref-box-lavender">
              <div className="ref-card-screen">
                <div className="ref-screen-head">
                  <span className="card-mock-tag tag-lavender">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    <span>WhatsApp Automation</span>
                  </span>
                  <span className="card-mock-status blue">
                    Delivered 10:14 AM
                  </span>
                </div>

                <div className="card-mock-content">
                  <div className="clean-wa-chat">
                    <div className="wa-recipient-strip">
                      <div className="wa-user-avatar">RV</div>
                      <div className="wa-user-meta">
                        <span className="wa-user-name">Mr. Rajesh Verma</span>
                        <span className="wa-user-sub">Kartik's Father · Class 10</span>
                      </div>
                    </div>

                    <div className="wa-speech-bubble">
                      <p className="wa-bubble-text">
                        Namaste Mr. Verma, Kartik scored <strong>24/25</strong> in today's Class 10 NCERT Science Test (Rank #2 in batch). Progress report and fee receipt are attached.
                      </p>
                      <div className="wa-pdf-attachment">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/>
                          <line x1="16" y1="17" x2="8" y2="17"/>
                        </svg>
                        <div className="wa-file-meta">
                          <span className="wa-file-name">Kartik_Class10_Report.pdf</span>
                          <span className="wa-file-size">148 KB · Signed by Director</span>
                        </div>
                      </div>
                      <div className="wa-time-row">
                        <span>10:14 AM</span>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                          <polyline points="20 11 13 18 10 15" />
                        </svg>
                      </div>
                    </div>

                    <div className="wa-metric-note">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                      </svg>
                      <span>142 parent updates dispatched in 4 seconds</span>
                    </div>
                  </div>
                </div>

                <div className="card-mock-footer">
                  <button type="button" className="card-btn-action dark">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                    <span>Send Batch Broadcast</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="ref-card-caption">
              <h3 className="ref-card-heading">
                <span className="ref-card-num">4</span>
                Automated 1-click WhatsApp delivery
              </h3>
              <p className="ref-card-desc">
                Approve drafts with a single tap. Receipts, test reports, and fee links are dispatched from your institute's WhatsApp with zero manual typing.
              </p>
            </div>
          </div>

          {/* Card 5: Honey Yellow — Admission Leads CRM */}
          <div className="ref-card-item">
            <div className="ref-card-box ref-box-honey">
              <div className="ref-card-screen">
                <div className="ref-screen-head">
                  <span className="card-mock-tag tag-honey">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    <span>Admission Leads CRM</span>
                  </span>
                  <span className="card-mock-status orange">
                    3 Inquiries Today
                  </span>
                </div>

                <div className="card-mock-content">
                  <div className="clean-crm-leads">
                    <div className="clean-lead-card">
                      <div className="lead-top-row">
                        <div className="lead-info">
                          <span className="lead-name">Rohan Gupta</span>
                          <span className="lead-class">Class 11 Science · Tonk Road</span>
                        </div>
                        <span className="lead-status-pill booked">Demo Booked</span>
                      </div>
                      <div className="lead-time-line">Trial: Tuesday 4:30 PM (Physics & Maths)</div>
                      <div className="lead-actions-row">
                        <button type="button" className="lead-quick-btn">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                          </svg>
                          Call Parent
                        </button>
                        <button type="button" className="lead-quick-btn wa">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                          </svg>
                          Send Demo Link
                        </button>
                      </div>
                    </div>

                    <div className="clean-lead-card secondary">
                      <div className="lead-top-row">
                        <div className="lead-info">
                          <span className="lead-name">Ananya Sen</span>
                          <span className="lead-class">Class 10 Foundation · NEET Target</span>
                        </div>
                        <span className="lead-status-pill intent">High Intent</span>
                      </div>
                      <div className="lead-time-line">Walk-in inquiry · Fee discussion scheduled tomorrow</div>
                    </div>
                  </div>
                </div>

                <div className="card-mock-footer">
                  <button type="button" className="card-btn-action dark">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    <span>Add Walk-In Admission</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="ref-card-caption">
              <h3 className="ref-card-heading">
                <span className="ref-card-num">5</span>
                Inquiry CRM & demo class booking
              </h3>
              <p className="ref-card-desc">
                Never lose a prospective student. Track walk-ins, phone calls, schedule demo classes, and automatically convert inquiries into paid admissions.
              </p>
            </div>
          </div>

          {/* Card 6: Blush Pink — Director Intelligence */}
          <div className="ref-card-item">
            <div className="ref-card-box ref-box-rose">
              <div className="ref-card-screen">
                <div className="ref-screen-head">
                  <span className="card-mock-tag tag-rose">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="20" x2="18" y2="10"/>
                      <line x1="12" y1="20" x2="12" y2="4"/>
                      <line x1="6" y1="20" x2="6" y2="14"/>
                    </svg>
                    <span>Director Intelligence</span>
                  </span>
                  <span className="card-mock-status live">
                    <span className="status-dot green" />
                    Institute on Track
                  </span>
                </div>

                <div className="card-mock-content">
                  <div className="clean-director-dashboard">
                    <div className="clean-kpi-row">
                      <div className="clean-kpi-card">
                        <span className="kpi-label">Fees Collected</span>
                        <span className="kpi-value text-green">₹2,48,500</span>
                        <span className="kpi-target">94% of monthly goal</span>
                      </div>
                      <div className="clean-kpi-card">
                        <span className="kpi-label">Weekly Haziri</span>
                        <span className="kpi-value text-blue">98.4%</span>
                        <span className="kpi-target">142 active students</span>
                      </div>
                    </div>

                    <div className="clean-ai-insight">
                      <div className="insight-top">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                          <polyline points="17 6 23 6 23 12"/>
                        </svg>
                        <strong>Institute Recommendation</strong>
                      </div>
                      <p className="insight-para">
                        Class 10-A Maths average improved by <strong>+14%</strong> after formula revision. Batch 12-B has 2 pending fee payments.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="card-mock-footer">
                  <button type="button" className="card-btn-action dark">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="20" x2="18" y2="10"/>
                      <line x1="12" y1="20" x2="12" y2="4"/>
                      <line x1="6" y1="20" x2="6" y2="14"/>
                    </svg>
                    <span>Open Director Dashboard</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="ref-card-caption">
              <h3 className="ref-card-heading">
                <span className="ref-card-num">6</span>
                Director dashboard & weekly summary
              </h3>
              <p className="ref-card-desc">
                Get high-level clarity on fee collections, batch attendance percentages, and student test rankings while teacher and staff views stay securely restricted.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. DEEP CONTRAST SECTION ("Humanized parent updates. Not robotic SMS.") */}
      <section className="ref-dark-section" id="terminal">
        <div className="ref-dark-inner">
          {/* Editorial Display Heading with red squiggly strikethrough doodle */}
          <div className="ref-dark-head-wrap">
            <h2 className="ref-dark-title">
              Humanized parent updates.{' '}
              <span className="ref-dark-muted-title">
                Not{' '}
                <span className="ref-strike-wrap">
                  robotic SMS
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 200 20"
                    preserveAspectRatio="none"
                    className="ref-strike-svg"
                  >
                    <path
                      d="M3 13 C 45 6, 90 15, 130 9 S 185 7, 197 10"
                      fill="none"
                      stroke="#ff5a4e"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                .
              </span>
            </h2>
          </div>

          {/* Interactive Mode Switcher Tabs */}
          <div className="ref-dark-switcher-bar">
            <div className="ref-switcher-pills">
              <button
                type="button"
                className={`ref-switcher-btn ${darkViewMode === 'edubuddy' ? 'active-good' : ''}`}
                onClick={() => setDarkViewMode('edubuddy')}
              >
                <span className="ref-dot-indicator dot-green" />
                ✨ EduBuddy WhatsApp Report
                <span className="ref-rate-badge">98% Open Rate</span>
              </button>

              <button
                type="button"
                className={`ref-switcher-btn ${darkViewMode === 'typical' ? 'active-bad' : ''}`}
                onClick={() => setDarkViewMode('typical')}
              >
                <span className="ref-dot-indicator dot-amber" />
                ⚠️ Typical Coaching SMS
                <span className="ref-rate-badge bad">Ignored</span>
              </button>

              <button
                type="button"
                className={`ref-switcher-btn ${darkViewMode === 'test' ? 'active-blue' : ''}`}
                onClick={() => setDarkViewMode('test')}
              >
                <span className="ref-dot-indicator dot-blue" />
                📄 NCERT Test Maker
              </button>

              <button
                type="button"
                className={`ref-switcher-btn ${darkViewMode === 'fees' ? 'active-purple' : ''}`}
                onClick={() => setDarkViewMode('fees')}
              >
                <span className="ref-dot-indicator dot-purple" />
                🧾 GST Fee Receipt
              </button>
            </div>
          </div>

          {/* Notice Feedback Pill if triggered */}
          {waNotice && (
            <div className="ref-terminal-notice">
              ✓ {waNotice}
            </div>
          )}

          {/* White High-Contrast Broadcast / Message Composer Window */}
          <div className="ref-composer-window">
            {/* macOS Chrome Header Bar */}
            <div className="ref-composer-topbar">
              <div className="ref-composer-dots">
                <span className="ref-mac-dot dot-red" />
                <span className="ref-mac-dot dot-yellow" />
                <span className="ref-mac-dot dot-green" />
              </div>
              <div className="ref-composer-title-center">
                {darkViewMode === 'typical' && 'Traditional SMS Gateway · Batch Notice'}
                {darkViewMode === 'edubuddy' && 'Sharma Classes · Verified WhatsApp Broadcast'}
                {darkViewMode === 'test' && 'Sharma Classes · NCERT Question Paper Generator'}
                {darkViewMode === 'fees' && 'Sharma Classes · GST Tax Invoice Preview'}
              </div>
              <div className="ref-composer-window-actions">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14" />
                </svg>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                </svg>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </div>
            </div>

            {/* Recipient & Metadata Headers */}
            <div className="ref-composer-headers">
              <div className="ref-header-row">
                <span className="ref-header-label">To</span>
                <div className="ref-recipient-pill">
                  <span className="ref-avatar-initial">A</span>
                  <span>Mrs. Anita Verma (Mother of Kartik, Class 10 Foundation)</span>
                </div>
                <div className="ref-header-tags">
                  <span className="ref-verified-tag">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#25d366">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                    WhatsApp Business API
                  </span>
                  <span className="ref-sub-hint">Cc Bcc</span>
                </div>
              </div>

              <div className="ref-header-row">
                <span className="ref-header-label">Subject</span>
                <div className="ref-subject-line">
                  {darkViewMode === 'typical' ? (
                    <div className="ref-highlight-wrap">
                      <span className="ref-strike-text">URGENT: Fee due and absent warning</span>
                      <span className="ref-annot-pill annot-amber">Vague, triggers panic</span>
                    </div>
                  ) : darkViewMode === 'edubuddy' ? (
                    <div className="ref-highlight-wrap">
                      <span className="ref-good-text">Kartik's Weekly Haziri (100%) & NCERT Science Unit Test Rank #2 🌟</span>
                      <span className="ref-annot-pill annot-blue">Personalized + Positive</span>
                    </div>
                  ) : darkViewMode === 'test' ? (
                    <span className="ref-good-text">Class 10 Science Unit Assessment: Light (Reflection & Refraction)</span>
                  ) : (
                    <span className="ref-good-text">Official GST Receipt #EDU-2026-084 · Paid via UPI QR</span>
                  )}
                </div>
              </div>
            </div>

            {/* Composer Body Content */}
            <div className="ref-composer-body">
              {/* VIEW 1: TYPICAL ROBOTIC SMS */}
              {darkViewMode === 'typical' && (
                <div className="ref-mode-content ref-content-typical">
                  <div className="ref-composer-intro-strip bad">
                    <span>⚠️ A typical coaching automated SMS — ignored or muted by 82% of parents</span>
                  </div>

                  <p className="ref-msg-salutation">Dear Parent,</p>

                  <div className="ref-msg-paragraph">
                    Your ward was{' '}
                    <span className="ref-annot-target annot-target-bad">
                      marked absent in class today
                      <span className="ref-floating-badge badge-amber">Zero explanation</span>
                    </span>
                    . Kindly ensure regular attendance.
                  </div>

                  <div className="ref-msg-paragraph">
                    Also, tuition fee of{' '}
                    <span className="ref-annot-target annot-target-bad">
                      ₹1,200 is outstanding
                      <span className="ref-floating-badge badge-amber">Cold demand</span>
                    </span>{' '}
                    for the ongoing month. Pay immediately to avoid removal from student roster.
                  </div>

                  <div className="ref-msg-paragraph">
                    <span className="ref-annot-target annot-target-bad">
                      Regards, Coaching Administration
                      <span className="ref-floating-badge badge-amber">Faceless robot</span>
                    </span>
                  </div>
                </div>
              )}

              {/* VIEW 2: EDUBUDDY HUMANIZED WHATSAPP REPORT */}
              {darkViewMode === 'edubuddy' && (
                <div className="ref-mode-content ref-content-good">
                  <div className="ref-composer-intro-strip good">
                    <span>✨ What EduBuddy delivers — 98.4% open rate, instant parent appreciation</span>
                  </div>

                  <p className="ref-msg-salutation">Namaste Mrs. Anita Verma! 🌟</p>

                  <div className="ref-msg-paragraph">
                    Here is Kartik's weekly academic and attendance update from <strong>Sharma Classes</strong>:
                  </div>

                  <div className="ref-msg-card-point">
                    <div className="ref-point-line">
                      <span className="ref-point-bullet">📈</span>
                      <span>
                        <strong>Class 10 Foundation Haziri:</strong>{' '}
                        <span className="ref-annot-target annot-target-good">
                          100% Present this week
                          <span className="ref-floating-badge badge-green">Punctual</span>
                        </span>{' '}
                        (Monthly consistency: <strong>98.4%</strong>)
                      </span>
                    </div>

                    <div className="ref-point-line">
                      <span className="ref-point-bullet">🏆</span>
                      <span>
                        <strong>NCERT Science Assessment:</strong> Scored{' '}
                        <span className="ref-annot-target annot-target-good">
                          24/25 in Chapter 10 Light
                          <span className="ref-floating-badge badge-blue">Batch Rank #2</span>
                        </span>{' '}
                        🎉
                      </span>
                    </div>

                    <div className="ref-point-line">
                      <span className="ref-point-bullet">💡</span>
                      <span>
                        <strong>Teacher Note:</strong> "Kartik solved all convex lens ray diagrams with zero calculation errors."
                      </span>
                    </div>
                  </div>

                  <div className="ref-msg-paragraph">
                    Kartik's verified PDF answer sheet with step-wise marks and answer keys is attached below:
                    <div className="ref-pdf-pill-link">
                      <span className="ref-pdf-icon">📄</span>
                      <span>Kartik_Verma_Class10_Light_Scorecard.pdf (2 pages)</span>
                      <span className="ref-pdf-view">View ↗</span>
                    </div>
                  </div>

                  <div className="ref-msg-paragraph">
                    Tuition fee of ₹1,200 for October is logged.{' '}
                    <span className="ref-annot-target annot-target-good">
                      Pay in 1 tap via UPI QR
                      <span className="ref-floating-badge badge-green">Zero friction</span>
                    </span>{' '}
                    or tap <em>edubuddy.me/pay/84</em>.
                  </div>
                </div>
              )}

              {/* VIEW 3: NCERT TEST MAKER (BRIGHT FUTURE OFFICIAL ANNUAL EXAM PAPER) */}
              {darkViewMode === 'test' && (
                <div className="ref-mode-content" style={{ padding: '0' }}>
                  <BrightFutureExamPaper compact={false} />
                </div>
              )}

              {/* VIEW 4: GST FEE RECEIPT (BRIGHT FUTURE OFFICIAL FEE INVOICE) */}
              {darkViewMode === 'fees' && (
                <div className="ref-mode-content" style={{ padding: '0' }}>
                  <BrightFutureInvoice compact={false} />
                </div>
              )}
            </div>

            {/* Window Bottom Action Bar */}
            <div className="ref-composer-bottombar">
              <div className="ref-composer-actions-left">
                <button
                  type="button"
                  className="ref-composer-btn-send"
                  onClick={() => triggerWaNotice('Class 10 Foundation')}
                >
                  <span>Send Broadcast</span>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>

                <div className="ref-composer-tools">
                  <button type="button" className="ref-tool-icon" title="Format Text"><strong>A</strong></button>
                  <button type="button" className="ref-tool-icon" title="Attach PDF Paper">📎</button>
                  <button type="button" className="ref-tool-icon" title="Attach Performance Chart">📊</button>
                  <button type="button" className="ref-tool-icon" title="Add UPI Pay QR">💳</button>
                  <button type="button" className="ref-tool-icon" title="Insert Emoji">😊</button>
                </div>
              </div>

              <div className="ref-composer-actions-right">
                <span className="ref-sync-badge">
                  <span className="ref-live-green-pulse" /> 142/142 Parent Numbers Active
                </span>
                <button type="button" className="ref-tool-icon" title="Discard Draft">🗑️</button>
              </div>
            </div>
          </div>

          {/* Under-Window Horizontal Trust Proof Strip (Exact match of backdoorai) */}
          <ul className="ref-dark-trust-strip">
            <li className="ref-dark-trust-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="ref-trust-svg">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span>WhatsApp Official Business API: 100% parent inbox delivery, zero number ban risk.</span>
            </li>
            <li className="ref-dark-trust-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="ref-trust-svg">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>Nothing goes out until Director taps approve.</span>
            </li>
            <li className="ref-dark-trust-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="ref-trust-svg">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <span>Instant 1-tap broadcast to 500+ parents in under 10 seconds.</span>
            </li>
          </ul>
        </div>
      </section>

      {/* 6. PRICING SECTION ("Plans from ₹15 a day.") */}
      <section className="ref-pricing-section" id="pricing">
        <h2 className="ref-pricing-headline">Plans from ₹15 a day.</h2>
        <p className="ref-pricing-sub">
          Includes 1-Tap WhatsApp Haziri, 30-Second NCERT Question Papers, Branded GST Fee Receipts, and Batch Scheduling.
        </p>

        <div className="ref-pricing-cards">
          {/* Starter */}
          <div className="ref-pricing-card">
            <div>
              <div className="ref-plan-name">Starter</div>
              <div className="ref-plan-price">
                ₹399 <small>/ month (~₹15/day)</small>
              </div>
            </div>

            <ul className="ref-features-list">
              <li>✓ Up to 50 active students</li>
              <li>✓ 1-Tap WhatsApp Attendance</li>
              <li>✓ Unlimited NCERT Test Maker</li>
              <li>✓ Basic PDF Fee Receipts</li>
            </ul>

            <button
              type="button"
              className="ref-btn-plan grey"
              onClick={handleStartTrial}
            >
              Start 14-Day Free Trial
            </button>
          </div>

          {/* Growth */}
          <div className="ref-pricing-card popular">
            <div>
              <div style={{ fontSize: '9px', fontWeight: 800, color: '#2563eb', letterSpacing: '0.08em' }}>MOST POPULAR</div>
              <div className="ref-plan-name">Growth Academy</div>
              <div className="ref-plan-price">
                ₹799 <small>/ month (~₹29/day)</small>
              </div>
            </div>

            <ul className="ref-features-list">
              <li>✓ Up to 250 students & 10 batches</li>
              <li>✓ Automated WhatsApp Absent Alerts</li>
              <li>✓ Branded GST Invoices with Logo</li>
              <li>✓ AI NCERT Question Papers with Keys</li>
              <li>✓ Admission Leads CRM</li>
            </ul>

            <button
              type="button"
              className="ref-btn-plan black"
              onClick={handleStartTrial}
            >
              Start 14-Day Free Trial →
            </button>
          </div>

          {/* Pro */}
          <div className="ref-pricing-card">
            <div>
              <div className="ref-plan-name">Pro Enterprise</div>
              <div className="ref-plan-price">
                ₹1,599 <small>/ month (~₹59/day)</small>
              </div>
            </div>

            <ul className="ref-features-list">
              <li>✓ Unlimited students & branches</li>
              <li>✓ Dedicated WhatsApp API Gateway</li>
              <li>✓ Student & Parent Web Portal</li>
              <li>✓ Multi-role staff access control</li>
            </ul>

            <Link
              to="/contact"
              className="ref-btn-plan grey"
            >
              Contact Enterprise Desk ↗
            </Link>
          </div>
        </div>
      </section>

      {/* 7. FAQ SECTION ("Questions, answered.") */}
      <section className="ref-faq-section" id="faq">
        <h2 className="ref-faq-headline">Questions, answered.</h2>

        <div className="ref-faq-accordion">
          {[
            {
              q: "Who is EduBuddy for?",
              a: "Coaching institutes, tuition centers, batch academies, and private tutors teaching Class 6–12, JEE, NEET, or Foundation. Whether you manage 30 students or 2,000 across multiple branches, EduBuddy automates your daily operations."
            },
            {
              q: "How is this different from old coaching ERP apps?",
              a: "Old coaching ERPs are bloated, expensive, and require teachers and parents to download heavy apps that nobody opens. EduBuddy runs directly on WhatsApp — attendance, test reports, and fee reminders are delivered where parents actually read them (98% open rate)."
            },
            {
              q: "Does it send WhatsApp messages without my permission?",
              a: "No. EduBuddy prepares all student reports, attendance alerts, and fee receipts automatically, but broadcasts require Director 1-tap approval. You retain 100% control over every message sent."
            },
            {
              q: "Is there any risk of our institute WhatsApp number getting banned?",
              a: "Zero. EduBuddy connects through the official Meta WhatsApp Business Cloud API with pre-verified templates. Unlike unofficial scraping bots that get banned, your institute number is 100% compliant, green-tick ready, and secure."
            },
            {
              q: "How does the NCERT Test Paper generator work?",
              a: "Pick any Class 6–12 chapter in Maths, Science, Physics, Chemistry, or Biology. EduBuddy instantly drafts a board-pattern question paper with MCQs, short answers, numericals, and step-by-step teacher marking keys with your institute logo in 30 seconds."
            },
            {
              q: "Can my staff or teachers see my fee collections and financial data?",
              a: "Never. EduBuddy has strict role-based access control. Teachers can only mark attendance and enter test marks. Your total fee collections, GST ledger, bank accounts, and student contact lists remain strictly private to the Director."
            },
            {
              q: "How does fee collection and UPI QR work?",
              a: "When fees are due, EduBuddy generates a branded digital receipt with a direct UPI payment link. When parents pay via GPay, PhonePe, or Paytm, the money goes 100% directly into your institute's bank account with 0% platform commission."
            },
            {
              q: "How do I get started, and is there a free trial?",
              a: "You get a 14-day full-access free trial with zero setup fees or credit card required. Upload your student list via Excel, WhatsApp, or voice note, and our onboarding team sets up your institute in under 15 minutes."
            }
          ].map((item, index) => {
            const isOpen = openFaq === index;
            return (
              <div key={item.q} className={`ref-faq-item ${isOpen ? 'is-open' : ''}`}>
                <h3>
                  <button
                    type="button"
                    className="ref-faq-trigger"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    aria-expanded={isOpen}
                  >
                    <span className="ref-faq-question">{item.q}</span>
                    <span className={`ref-faq-toggle-icon ${isOpen ? 'rotate' : ''}`}>
                      <svg viewBox="0 0 16 16" fill="none" width="14" height="14" aria-hidden="true">
                        <path
                          d="M8 3v10M3 8h10"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                  </button>
                </h3>

                <div className={`ref-faq-answer-collapse ${isOpen ? 'expanded' : ''}`}>
                  <div className="ref-faq-answer-inner">
                    <p className="ref-faq-answer-text">{item.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. GRAND DYNAMIC CTA CARD (EXACT BACKDOORAI REPLICA) */}
      <section className="ref-grand-cta-section">
        <div className="ref-grand-cta-card">
          {/* Left Column: Copy & Actions */}
          <div className="ref-cta-content-col">
            <p className="ref-cta-badge-pill">
              Free 14-day trial · No credit card · 15-min setup
            </p>

            <h2 className="ref-cta-display-title">
              Your institute on autopilot is one text away.
            </h2>

            <p className="ref-cta-subtext">
              Say hi on WhatsApp or start your free trial. EduBuddy takes care of daily haziri, NCERT question papers, and polite fee follow-ups from day one.
            </p>

            <div className="ref-cta-actions-wrap">
              <a
                href="https://wa.me/919876543210?text=Hi%20EduBuddy%2C%20I%20run%20a%20coaching%20center%20and%20want%20to%20automate%20it."
                target="_blank"
                rel="noreferrer"
                className="ref-cta-btn-wa"
              >
                <div className="ref-cta-wa-icon">
                  <svg viewBox="0 0 448 512" fill="currentColor" width="18" height="18">
                    <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
                  </svg>
                </div>
                <span>Start Free on WhatsApp</span>
              </a>

              <button
                type="button"
                className="ref-cta-btn-secondary"
                onClick={handleStartTrial}
              >
                <span>Launch Director Web App ↗</span>
              </button>
            </div>

            {/* Social proof avatars row */}
            <div className="ref-cta-proof-row">
              <div className="ref-avatar-stack">
                <span className="ref-stack-avatar" style={{ background: '#3b82f6' }}>R</span>
                <span className="ref-stack-avatar" style={{ background: '#10b981' }}>P</span>
                <span className="ref-stack-avatar" style={{ background: '#f59e0b' }}>A</span>
                <span className="ref-stack-avatar" style={{ background: '#8b5cf6' }}>S</span>
              </div>
              <div className="ref-cta-proof-text">
                <strong>★★★★★ 1,400+ Coaching Institutes</strong>
                <span>Trust EduBuddy daily across Bharat</span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual iPhone Mockup */}
          <div className="ref-cta-mockup-col">
            <div className="ref-cta-phone-frame">
              {/* Phone Dynamic Island / Camera */}
              <div className="ref-phone-notch">
                <div className="ref-notch-pill" />
              </div>

              {/* Phone Chat Topbar */}
              <div className="ref-phone-top-pill">
                <span className="ref-phone-back">‹ 3</span>
                <div className="ref-phone-center-brand">
                  <div className="ref-phone-brand-avatar">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                  </div>
                  <span>EduBuddy ›</span>
                </div>
                <span className="ref-phone-video-call">📹</span>
              </div>

              {/* Phone Chat Flow */}
              <div className="ref-phone-chat-body">
                <div className="ref-mini-date">Today 09:15 AM</div>

                {/* Director Voice Note */}
                <div className="ref-phone-msg msg-right">
                  <div className="ref-phone-audio-row">
                    <span className="ref-audio-play-icon">▶</span>
                    <span className="ref-audio-waveform">|||l||l|||l||l|||l||</span>
                    <span className="ref-audio-time-label">0:14</span>
                  </div>
                  <div style={{ fontSize: '11px', marginTop: '4px' }}>
                    mark Class 10 Foundation haziri, 46 present today!
                  </div>
                  <div className="ref-phone-status">Delivered 09:15 AM</div>
                </div>

                {/* EduBuddy Response */}
                <div className="ref-phone-msg msg-left">
                  <div className="ref-reaction-bubble top-right">🎉</div>
                  <div>
                    Done! 46 attendance alerts sent via WhatsApp. 2 absentees notified with parent confirmation.
                  </div>
                </div>

                {/* Parent Reply */}
                <div className="ref-phone-msg msg-left">
                  <div className="ref-reaction-bubble top-left">❤️</div>
                  <div>
                    <strong>Mrs. Anita Verma (Kartik's Mother):</strong><br />
                    "Thank you Sharma Sir, received Kartik's NCERT scorecard! October fee of ₹1,200 paid via UPI QR."
                  </div>
                  <div className="ref-phone-status">Read 09:18 AM</div>
                </div>

                <div className="ref-phone-msg msg-right msg-short">
                  LET'S GOOO 🔥
                </div>
              </div>

              {/* Phone Input Bar */}
              <div className="ref-phone-bottom-bar">
                <span className="ref-phone-plus">+</span>
                <div className="ref-phone-input-fake">
                  <span>Message EduBuddy...</span>
                  <span>🎤</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. CINEMATIC GRAND 3D FOOTER (EXACT PIXEL-TO-PIXEL REPLICA OF SCREENSHOT) */}
      <footer className="ref-grand-footer">
        {/* Soft Ambient Crimson & Red Underglow */}
        <div className="ref-footer-ambient-glow" />

        <div className="ref-footer-container">
          {/* 5-Column Navigation Grid */}
          <div className="ref-footer-grid">
            {/* Column 1: Core Navigation */}
            <div className="ref-footer-col">
              <a href="#how-it-works">How it works</a>
              <a href="#terminal">Terminal</a>
              <a href="#pricing">Pricing</a>
              <a href="#faq">FAQ</a>
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
              <a href="#pricing" className="ref-footer-gold-link">All comparisons →</a>
            </div>

            {/* Column 3: Tools & Systems (with vertical drop line) */}
            <div className="ref-footer-col ref-col-center">
              <Link to="/contact">WhatsApp Business</Link>
              <Link to="/contact">Excel Spreadsheets</Link>
              <Link to="/contact">Google Forms</Link>
              <Link to="/contact">Tally ERP</Link>
              <Link to="/contact">Biometric Attendance</Link>
              <a href="#pricing" className="ref-footer-gold-link">All comparisons →</a>
            </div>

            {/* Column 4: Features */}
            <div className="ref-footer-col">
              <a href="#how-it-works">AI NCERT Question Papers</a>
              <a href="#how-it-works">Daily Haziri Roll Call</a>
              <a href="#how-it-works">Branded GST Invoices</a>
              <a href="#how-it-works">Admission Leads CRM</a>
              <a href="#how-it-works">Fee Reminder Automation</a>
              <a href="#how-it-works" className="ref-footer-gold-link">All lists →</a>
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

      {/* 8. STICKY MOBILE CONVERSION BAR (FOR PHONE THUMB USERS) */}
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
