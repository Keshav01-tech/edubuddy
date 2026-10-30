import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { DialogKey, DashboardSection, ChartPeriod } from '../types';

const GLOW_URL = 'https://media.scrollhaus.ai/sites/zapline/assets/dashboard-glow.png';

const SECTION_TITLES: Record<DashboardSection, string> = {
  Dashboard: 'Institute Performance & Live Haziri.',
  Students: 'Enrolled Students & Batch Roster.',
  Attendance: "Today's Haziri & Parent WhatsApp Alerts.",
  Fees: 'Monthly Fee Collections & Invoices.',
  Tests: '30-Second NCERT AI Question Paper Maker.',
  Leads: 'Admission Inquiries & Demo Class CRM.',
};

const MONTH_PATH =
  'M0 130 30 126 60 130 90 112 120 117 150 100 180 109 210 80 240 87 270 65 300 83 330 65 360 74 390 41 420 54 450 30 480 39 510 15 540 30 570 12 600 20';
const WEEK_PATH =
  'M0 120 60 126 120 98 180 106 240 67 300 82 360 39 420 52 480 15 540 30 600 20';

interface DashboardProps {
  onOpenDialog: (key: DialogKey) => void;
}

export interface DashboardHandle {
  focusRange: () => void;
  scrollIntoView: () => void;
}

export const Dashboard = forwardRef<DashboardHandle, DashboardProps>(({ onOpenDialog }, ref) => {
  const [activeSection, setActiveSection] = useState<DashboardSection>('Dashboard');
  const [period, setPeriod] = useState<ChartPeriod>('month');
  const [selectedBatch, setSelectedBatch] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [alertSuccess, setAlertSuccess] = useState<string | null>(null);

  const [tooltipState, setTooltipState] = useState<{
    visible: boolean;
    left: number;
    text: string;
  }>({
    visible: false,
    left: 40,
    text: 'Daily Attendance: 96% · 137 Present',
  });

  const dashboardContainerRef = useRef<HTMLElement | null>(null);
  const rangeSelectRef = useRef<HTMLSelectElement | null>(null);
  const chartRef = useRef<HTMLDivElement | null>(null);

  useImperativeHandle(ref, () => ({
    focusRange: () => {
      rangeSelectRef.current?.focus({ preventScroll: true });
    },
    scrollIntoView: () => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      dashboardContainerRef.current?.scrollIntoView({
        behavior: reduced ? 'instant' : 'smooth',
        block: 'nearest',
      });
    },
  }));

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const chart = chartRef.current;
    if (!chart) return;
    const rect = chart.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const x = Math.max(5, Math.min(70, ratio * 100));
    const attendancePct = Math.min(99, Math.max(88, Math.round(88 + ratio * 11)));
    const presentCount = Math.round((142 * attendancePct) / 100);
    setTooltipState({
      visible: true,
      left: x,
      text: `Daily Attendance: ${attendancePct}% · ${presentCount} Present`,
    });
  };

  const handleSendWhatsAppAlert = (studentName: string) => {
    setAlertSuccess(`WhatsApp alert queued for ${studentName}'s parent!`);
    setTimeout(() => setAlertSuccess(null), 3000);
  };

  const isWeek = period === 'week';
  const currentPath = isWeek ? WEEK_PATH : MONTH_PATH;
  const currentArea = `${currentPath}V150H0Z`;
  const chartLabels = isWeek
    ? ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
    : ['01 JAN', '08 JAN', '15 JAN', '22 JAN', '31 JAN'];

  return (
    <section
      ref={dashboardContainerRef}
      className="dashboard"
      aria-label="EduBuddy Coaching Institute Terminal"
    >
      <img
        className="panel-glow"
        src={GLOW_URL}
        alt=""
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          Sharma Classes{' '}
          <button
            type="button"
            className="icon-button"
            onClick={() => onOpenDialog('settings')}
            aria-label="Institute settings"
          >
            ⚙
          </button>
        </div>

        <div className="side-label">Institute OS</div>
        <nav className="side-nav" aria-label="Dashboard sections">
          <button
            type="button"
            data-section="Dashboard"
            aria-pressed={activeSection === 'Dashboard'}
            onClick={() => setActiveSection('Dashboard')}
          >
            <span>◫</span>Dashboard
          </button>
          <button
            type="button"
            data-section="Students"
            aria-pressed={activeSection === 'Students'}
            onClick={() => setActiveSection('Students')}
          >
            <span>👥</span>Students (142)
          </button>
          <button
            type="button"
            data-section="Attendance"
            aria-pressed={activeSection === 'Attendance'}
            onClick={() => setActiveSection('Attendance')}
          >
            <span>⌁</span>Haziri (Attendance)
          </button>
          <button
            type="button"
            data-section="Fees"
            aria-pressed={activeSection === 'Fees'}
            onClick={() => setActiveSection('Fees')}
          >
            <span>▣</span>Fees & Receipts
          </button>
          <button
            type="button"
            data-section="Tests"
            aria-pressed={activeSection === 'Tests'}
            onClick={() => setActiveSection('Tests')}
          >
            <span>📄</span>AI Test Maker
          </button>
          <button
            type="button"
            data-section="Leads"
            aria-pressed={activeSection === 'Leads'}
            onClick={() => setActiveSection('Leads')}
          >
            <span>🎯</span>Admission Leads
          </button>
        </nav>

        <div className="side-label">Manage</div>
        <nav className="side-nav secondary-nav" aria-label="Institute tools">
          <button
            type="button"
            onClick={() => onOpenDialog('settings')}
          >
            <span>🏢</span>Institute Profile
          </button>
          <button
            type="button"
            onClick={() => onOpenDialog('faq')}
          >
            <span>💬</span>Coaching FAQ
          </button>
          <button
            type="button"
            onClick={() => onOpenDialog('pro')}
          >
            <span>⚡</span>Multi-Branch Pro
          </button>
        </nav>

        <div className="promo">
          <p>NCERT Test Maker in 30s</p>
          <small>Create printable Math & Science question papers with answer keys instantly.</small>
          <button
            type="button"
            onClick={() => onOpenDialog('testgen')}
          >
            Try Test Maker ↗
          </button>
        </div>
      </aside>

      {/* Workspace Panel */}
      <div className="workspace">
        {/* Topbar */}
        <div className="topbar">
          <div className="breadcrumb">
            Sharma Academy / Jaipur Campus / <strong id="crumb">{activeSection}</strong>
          </div>
          <div className="profile">
            <span className="demo">COACHING OS</span>
            <span className="avatar">RS</span>
            <span>
              Rajesh Sharma (Director)
              <small id="wallet-status">
                CBSE & Foundation · 142 Active Students
              </small>
            </span>
          </div>
        </div>

        {/* Overview Header */}
        <div className="overview-head">
          <h2 id="panel-title">{SECTION_TITLES[activeSection]}</h2>
          <select
            ref={rangeSelectRef}
            className="range"
            aria-label="Filter period"
            value={period}
            onChange={(e) => setPeriod(e.target.value as ChartPeriod)}
          >
            <option value="month">This month</option>
            <option value="week">This week</option>
          </select>
        </div>

        {/* Stats Grid */}
        <div className="stats">
          <div className="stat">
            <div className="stat-label">Total Fee Collection</div>
            <div className="stat-value" id="volume">
              {isWeek ? '₹62,400' : '₹2,48,500'}{' '}
              <small>↗ {isWeek ? '8.4%' : '14.2%'}</small>
            </div>
            <div style={{ fontSize: '8px', color: '#887d95', marginTop: '4px' }}>
              ₹28,000 pending dues (WhatsApp reminders active)
            </div>
          </div>
          <div className="stat">
            <div className="stat-label">Today's Haziri (Attendance)</div>
            <div className="stat-value">
              94.2% <small>134 / 142 Present</small>
            </div>
            <div style={{ fontSize: '8px', color: '#887d95', marginTop: '4px' }}>
              8 Absent WhatsApp alerts delivered
            </div>
          </div>
          <div className="stat">
            <div className="stat-label">Active Batches & System</div>
            <div className="stat-value" style={{ fontSize: '20px' }}>
              <span style={{ color: 'var(--lime)', fontSize: '11px' }}>●</span>{' '}
              6 Batches Live
            </div>
            <div style={{ fontSize: '8px', color: '#887d95', marginTop: '4px' }}>
              WhatsApp 1-Tap Ready · Local Privacy
            </div>
          </div>
        </div>

        {/* Alert Banner if action triggered */}
        {alertSuccess && (
          <div
            style={{
              padding: '6px 12px',
              background: '#123422',
              color: '#4ce586',
              borderRadius: '6px',
              fontSize: '10px',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>✓</span> {alertSuccess}
          </div>
        )}

        {/* 1. DASHBOARD VIEW (CHART & OPERATIONS) */}
        {activeSection === 'Dashboard' && (
          <div className="chart-layout">
            <div className="chart-box">
              <div className="chart-heading">
                Attendance & Test Performance Rate{' '}
                <span id="chart-period">{isWeek ? 'LAST 7 DAYS' : 'JAN 2026'}</span>
              </div>

              <div
                ref={chartRef}
                className="chart"
                tabIndex={0}
                role="img"
                aria-label="Attendance and academic performance trend upwards. All metrics synced with institute records."
                onPointerMove={handlePointerMove}
                onPointerLeave={() =>
                  setTooltipState((prev) => ({ ...prev, visible: false }))
                }
                onFocus={() =>
                  setTooltipState({
                    visible: true,
                    left: 40,
                    text: 'Daily Attendance: 96% · 137 Present',
                  })
                }
                onBlur={() =>
                  setTooltipState((prev) => ({ ...prev, visible: false }))
                }
              >
                <svg viewBox="0 0 600 150" preserveAspectRatio="none" aria-hidden="true">
                  <defs>
                    <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                      <stop stopColor="#a66cff" stopOpacity=".28" />
                      <stop offset="1" stopColor="#a66cff" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path className="chart-grid" d="M0 10H600M0 50H600M0 90H600M0 130H600" />
                  <path className="chart-area" d={currentArea} />
                  <path className="chart-line" d={currentPath} />
                  <circle className="chart-dot" cx="450" cy="30" r="4" />
                </svg>

                <div
                  className="chart-tooltip"
                  hidden={!tooltipState.visible}
                  style={{ left: `${tooltipState.left}%` }}
                >
                  {tooltipState.text}
                </div>
              </div>

              <div className="chart-labels">
                {chartLabels.map((lbl) => (
                  <span key={lbl}>{lbl}</span>
                ))}
              </div>

              <p className="demo-note">
                Live Institute Terminal. Auto-synced with daily attendance register, fee collection receipts, and NCERT test evaluations.
              </p>
            </div>

            <aside className="metric-list">
              <h3>{isWeek ? 'Last seven days' : 'January 2026'}</h3>
              <p>{isWeek ? 'Weekly Operations Report' : 'Monthly Academic Report'}</p>
              <div className="metric">
                <span>Question papers generated</span>
                <strong>
                  48 Papers <small>+14 this week</small>
                </strong>
              </div>
              <div className="metric">
                <span>Avg student test score</span>
                <strong>
                  78.4% <small>+5.8%</small>
                </strong>
              </div>
              <div className="metric">
                <span>Parent WhatsApp alerts</span>
                <strong>
                  1,284 Sent <small>100%</small>
                </strong>
              </div>
              <div className="apps">
                <i />
                EduBuddy AI Engine
                <br />
                NCERT Math & Science · WhatsApp API Ready
              </div>
            </aside>
          </div>
        )}

        {/* 2. STUDENTS VIEW (ROSTER MATCHING THE USER SCREENSHOT) */}
        {activeSection === 'Students' && (
          <div className="institute-view">
            <div className="search-filter-row">
              <input
                type="text"
                className="terminal-search"
                placeholder="Search by name, class, batch or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  className={`filter-chip ${selectedBatch === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedBatch('all')}
                >
                  All classes (142)
                </button>
                <button
                  type="button"
                  className={`filter-chip ${selectedBatch === 'class6' ? 'active' : ''}`}
                  onClick={() => setSelectedBatch('class6')}
                >
                  Class 6-Batch A (24)
                </button>
                <button
                  type="button"
                  className={`filter-chip ${selectedBatch === 'class10' ? 'active' : ''}`}
                  onClick={() => setSelectedBatch('class10')}
                >
                  Class 10-Foundation (48)
                </button>
                <button
                  type="button"
                  className={`filter-chip ${selectedBatch === 'class12' ? 'active' : ''}`}
                  onClick={() => setSelectedBatch('class12')}
                >
                  Class 12-PCM (36)
                </button>
              </div>
            </div>

            <div className="institute-card-list">
              {/* Kartik - matching exact screenshot */}
              <div className="institute-row-card">
                <div className="student-meta">
                  <div className="student-avatar" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                    K
                  </div>
                  <div className="student-details">
                    <h4>
                      Kartik <span className="badge-pill present">Active</span>
                    </h4>
                    <p>Class Class 6 · Batch Batch A · Total fee ₹1,200 · 100% present (14 days)</p>
                  </div>
                </div>
                <div className="action-cluster">
                  <button
                    type="button"
                    className="wa-btn"
                    onClick={() => handleSendWhatsAppAlert('Kartik')}
                  >
                    <span>💬</span> WhatsApp
                  </button>
                  <button type="button" className="icon-pill" title="Call Parent">
                    📞
                  </button>
                  <button type="button" className="icon-pill" title="Edit Profile">
                    ✏️
                  </button>
                </div>
              </div>

              {/* Priya Sharma */}
              <div className="institute-row-card">
                <div className="student-meta">
                  <div className="student-avatar" style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}>
                    P
                  </div>
                  <div className="student-details">
                    <h4>
                      Priya Sharma <span className="badge-pill present">Active</span>
                    </h4>
                    <p>Class Class 10 · Batch Foundation A · Total fee ₹3,500 · 96% present (28 days)</p>
                  </div>
                </div>
                <div className="action-cluster">
                  <button
                    type="button"
                    className="wa-btn"
                    onClick={() => handleSendWhatsAppAlert('Priya Sharma')}
                  >
                    <span>💬</span> WhatsApp
                  </button>
                  <button type="button" className="icon-pill" title="Call Parent">
                    📞
                  </button>
                  <button type="button" className="icon-pill" title="Edit Profile">
                    ✏️
                  </button>
                </div>
              </div>

              {/* Aman Verma */}
              <div className="institute-row-card">
                <div className="student-meta">
                  <div className="student-avatar" style={{ background: 'linear-gradient(135deg, #d97706, #ea580c)' }}>
                    A
                  </div>
                  <div className="student-details">
                    <h4>
                      Aman Verma <span className="badge-pill due">Pending ₹800</span>
                    </h4>
                    <p>Class Class 12 · Batch Target JEE · Total fee ₹5,000 · 92% present (26 days)</p>
                  </div>
                </div>
                <div className="action-cluster">
                  <button
                    type="button"
                    className="wa-btn"
                    onClick={() => handleSendWhatsAppAlert('Aman Verma')}
                  >
                    <span>💬</span> WhatsApp
                  </button>
                  <button type="button" className="icon-pill" title="Call Parent">
                    📞
                  </button>
                  <button type="button" className="icon-pill" title="Edit Profile">
                    ✏️
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. ATTENDANCE VIEW (HAZIRI REGISTER) */}
        {activeSection === 'Attendance' && (
          <div className="institute-view">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '11px', color: '#c4bdd0' }}>
                Daily Roll Call: <strong>Today, 29 Jan 2026</strong> · Class 10 Foundation (Batch A)
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span className="badge-pill present">46 Present</span>
                <span className="badge-pill absent">2 Absent</span>
              </div>
            </div>

            <div className="institute-card-list">
              <div className="institute-row-card">
                <div className="student-meta">
                  <div className="student-avatar" style={{ background: '#163625', color: '#4ce586' }}>
                    ✓
                  </div>
                  <div className="student-details">
                    <h4>Kartik (Roll #01)</h4>
                    <p>Status: Present · In Time 09:00 AM · WhatsApp: No absence alert needed</p>
                  </div>
                </div>
                <span className="badge-pill present">PRESENT</span>
              </div>

              <div className="institute-row-card">
                <div className="student-meta">
                  <div className="student-avatar" style={{ background: '#163625', color: '#4ce586' }}>
                    ✓
                  </div>
                  <div className="student-details">
                    <h4>Priya Sharma (Roll #02)</h4>
                    <p>Status: Present · In Time 08:58 AM · 96% cumulative monthly attendance</p>
                  </div>
                </div>
                <span className="badge-pill present">PRESENT</span>
              </div>

              <div className="institute-row-card">
                <div className="student-meta">
                  <div className="student-avatar" style={{ background: '#39151c', color: '#ff6e85' }}>
                    ✗
                  </div>
                  <div className="student-details">
                    <h4>Aman Verma (Roll #03)</h4>
                    <p style={{ color: '#ff8a9e' }}>
                      Status: Absent · Auto-WhatsApp Sent: "Dear Parent, Aman was absent in Class 10 today."
                    </p>
                  </div>
                </div>
                <div className="action-cluster">
                  <span className="badge-pill absent">ABSENT</span>
                  <button
                    type="button"
                    className="wa-btn"
                    onClick={() => handleSendWhatsAppAlert('Aman Verma')}
                  >
                    Resend Alert ↗
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. FEES VIEW (INVOICES & RECEIPTS) */}
        {activeSection === 'Fees' && (
          <div className="institute-view">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '11px', color: '#c4bdd0' }}>
                Latest Fee Invoices & GST Receipts (Sharma Coaching Classes)
              </div>
              <button
                type="button"
                className="filter-chip active"
                onClick={() => onOpenDialog('fees')}
              >
                + Issue New Receipt
              </button>
            </div>

            <div className="institute-card-list">
              <div className="institute-row-card">
                <div className="student-meta">
                  <div className="icon-pill">🧾</div>
                  <div className="student-details">
                    <h4>
                      Receipt #EDU-2026-084 · Kartik <span className="badge-pill paid">Paid ₹1,200</span>
                    </h4>
                    <p>Class 6 Maths & Science · Mode: UPI (Google Pay) · Date: 28 Jan 2026</p>
                  </div>
                </div>
                <div className="action-cluster">
                  <button
                    type="button"
                    className="wa-btn"
                    onClick={() => handleSendWhatsAppAlert('Kartik')}
                  >
                    Share WhatsApp PDF ↗
                  </button>
                </div>
              </div>

              <div className="institute-row-card">
                <div className="student-meta">
                  <div className="icon-pill">🧾</div>
                  <div className="student-details">
                    <h4>
                      Receipt #EDU-2026-083 · Priya Sharma <span className="badge-pill paid">Paid ₹3,500</span>
                    </h4>
                    <p>Class 10 Foundation Batch · Mode: Cash · Date: 26 Jan 2026 · Invoice Signed</p>
                  </div>
                </div>
                <div className="action-cluster">
                  <button
                    type="button"
                    className="wa-btn"
                    onClick={() => handleSendWhatsAppAlert('Priya Sharma')}
                  >
                    Share WhatsApp PDF ↗
                  </button>
                </div>
              </div>

              <div className="institute-row-card">
                <div className="student-meta">
                  <div className="icon-pill" style={{ color: '#ffb44c' }}>⚠️</div>
                  <div className="student-details">
                    <h4>
                      Pending Dues · Aman Verma <span className="badge-pill due">Due ₹800</span>
                    </h4>
                    <p>Class 12 Target JEE · Installment #2 · Due Date: 30 Jan 2026</p>
                  </div>
                </div>
                <div className="action-cluster">
                  <button
                    type="button"
                    className="wa-btn"
                    style={{ background: '#3b2812', color: '#ffb44c', borderColor: '#6b441a' }}
                    onClick={() => handleSendWhatsAppAlert('Aman Verma')}
                  >
                    Send Due Reminder 💬
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. TESTS VIEW (NCERT QUESTION PAPER GENERATOR) */}
        {activeSection === 'Tests' && (
          <div className="institute-view">
            <div className="paper-box">
              <div className="paper-header">
                <div>
                  <strong style={{ color: 'var(--lime)', fontSize: '13px' }}>
                    NCERT Class 10 Science: Light — Reflection & Refraction
                  </strong>
                  <div style={{ color: '#8d8299', fontSize: '9px', marginTop: '2px' }}>
                    Preset: Mixed Blueprint · 25 Marks · Duration: 45 Mins · CBSE Pattern
                  </div>
                </div>
                <button
                  type="button"
                  className="pill primary"
                  style={{ padding: '6px 12px', fontSize: '10px' }}
                  onClick={() => onOpenDialog('testgen')}
                >
                  Generate New Paper ↗
                </button>
              </div>

              <div className="paper-sections">
                <div className="paper-sec">
                  Section A: Objective
                  <strong>5 MCQs (5 Marks)</strong>
                  <span style={{ color: '#887d95', fontSize: '8px' }}>Refractive index, concave mirror</span>
                </div>
                <div className="paper-sec">
                  Section B: Short
                  <strong>4 Short Qs (8 Marks)</strong>
                  <span style={{ color: '#887d95', fontSize: '8px' }}>Snell's Law, focal length formula</span>
                </div>
                <div className="paper-sec">
                  Section C: Long
                  <strong>2 Long Qs (12 Marks)</strong>
                  <span style={{ color: '#887d95', fontSize: '8px' }}>Ray diagram & lens numerical</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                  type="button"
                  className="pill secondary"
                  style={{ fontSize: '9px', padding: '6px 12px' }}
                  onClick={() => onOpenDialog('testgen')}
                >
                  Download Printable PDF (with Logo) ⬇
                </button>
                <button
                  type="button"
                  className="filter-chip"
                  style={{ alignSelf: 'center' }}
                  onClick={() => onOpenDialog('testgen')}
                >
                  View Complete Answer Key & Marking Scheme
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 6. LEADS CRM VIEW */}
        {activeSection === 'Leads' && (
          <div className="institute-view">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '11px', color: '#c4bdd0' }}>
                Admission Inquiries & Demo Class Pipeline (Month: January)
              </div>
              <button
                type="button"
                className="filter-chip active"
                onClick={() => onOpenDialog('leads')}
              >
                + Add Walk-in Lead
              </button>
            </div>

            <div className="institute-card-list">
              <div className="institute-row-card">
                <div className="student-meta">
                  <div className="student-avatar" style={{ background: '#4338ca' }}>R</div>
                  <div className="student-details">
                    <h4>Rohan Gupta (Class 11 Science)</h4>
                    <p>Source: Walk-in Inquiry · Demo Lecture Scheduled: Tomorrow 4:30 PM</p>
                  </div>
                </div>
                <span className="badge-pill due">Demo Scheduled</span>
              </div>

              <div className="institute-row-card">
                <div className="student-meta">
                  <div className="student-avatar" style={{ background: '#0e7490' }}>A</div>
                  <div className="student-details">
                    <h4>Ananya Sen (Class 9 Foundation)</h4>
                    <p>Source: Phone Calling · Interested in Maths & Science Batch</p>
                  </div>
                </div>
                <span className="filter-chip">Follow-up Call</span>
              </div>

              <div className="institute-row-card">
                <div className="student-meta">
                  <div className="student-avatar" style={{ background: '#15803d' }}>V</div>
                  <div className="student-details">
                    <h4>Vikas Yadav (Class 10 Foundation)</h4>
                    <p>Source: Parent Referral · Demo Attended · ₹1,500 token paid 🎉</p>
                  </div>
                </div>
                <span className="badge-pill present">Enrolled Today</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
});

Dashboard.displayName = 'Dashboard';
