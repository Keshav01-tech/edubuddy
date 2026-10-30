import React, { useState } from 'react';

export const RoiCalculator: React.FC = () => {
  const [studentCount, setStudentCount] = useState<number>(140);

  const hoursSavedPerWeek = Math.round(studentCount * 0.12 + 2);
  const extraFeesRecovered = Math.round(studentCount * 190);
  const paperPrintingSaved = Math.round(studentCount * 45 + 500);
  const testsPerMonth = Math.round(studentCount > 100 ? 16 : 8);

  return (
    <section className="section-block" id="calculator">
      <div className="section-header">
        <span className="section-badge">INTERACTIVE INSTITUTE ROI</span>
        <h2 className="section-title">
          Calculate Your <span className="highlight-lime">Time & Revenue Savings.</span>
        </h2>
        <p className="section-lede">
          See how much administrative time and pending fee revenue EduBuddy unlocks for your coaching academy every single month.
        </p>
      </div>

      <div className="calculator-box">
        <div className="calc-controls">
          <div className="calc-slider-header">
            <div>
              <span className="calc-label">Total Enrolled Students</span>
              <p className="calc-hint">Drag slider to match your institute capacity</p>
            </div>
            <div className="calc-count-display">
              <span className="count-num">{studentCount}</span>
              <span className="count-unit">Students</span>
            </div>
          </div>

          <input
            type="range"
            min="20"
            max="600"
            step="10"
            value={studentCount}
            onChange={(e) => setStudentCount(Number(e.target.value))}
            className="calc-slider"
            aria-label="Enrolled student count slider"
          />

          <div className="calc-scale-markers">
            <span>20 Students</span>
            <span>150 Students</span>
            <span>300 Students</span>
            <span>600+ Students</span>
          </div>
        </div>

        <div className="calc-results-grid">
          <div className="calc-metric-card">
            <span className="metric-icon">⏱️</span>
            <div className="metric-info">
              <span className="metric-tag">Admin Time Reclaimed</span>
              <div className="metric-big-num">
                {hoursSavedPerWeek} <small>hrs / week</small>
              </div>
              <p className="metric-note">
                Replaces manual roll-call registers, paper drafting, and phone calls.
              </p>
            </div>
          </div>

          <div className="calc-metric-card featured-roi">
            <span className="metric-icon">💰</span>
            <div className="metric-info">
              <span className="metric-tag">Extra Fee Recovery</span>
              <div className="metric-big-num">
                ₹{extraFeesRecovered.toLocaleString('en-IN')} <small>/ month</small>
              </div>
              <p className="metric-note">
                Recovered via automated WhatsApp due date reminders with UPI links.
              </p>
            </div>
          </div>

          <div className="calc-metric-card">
            <span className="metric-icon">📄</span>
            <div className="metric-info">
              <span className="metric-tag">Test Maker Value</span>
              <div className="metric-big-num">
                {testsPerMonth} <small>papers / mo</small>
              </div>
              <p className="metric-note">
                Instant NCERT blueprints for weekly tests, saving ₹{paperPrintingSaved.toLocaleString('en-IN')}/mo in typist fees.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
