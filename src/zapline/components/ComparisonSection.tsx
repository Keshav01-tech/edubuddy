import React from 'react';

export const ComparisonSection: React.FC = () => {
  const rows = [
    {
      feature: 'Daily Attendance Speed',
      edubuddy: '15 seconds (1-tap on mobile phone)',
      registers: '15-20 mins per batch (paper registers)',
      legacyErp: '5-10 mins (slow sync, complex menus)',
    },
    {
      feature: 'Parent Absence Alerts',
      edubuddy: 'Instant 1-tap WhatsApp message to parent',
      registers: 'Manual calling (awkward & time-consuming)',
      legacyErp: 'Expensive SMS or requires parents to install app',
    },
    {
      feature: 'NCERT Question Paper Maker',
      edubuddy: 'Built-in 30s AI generator with marking scheme',
      registers: 'Manual typing / Google search / typist fees',
      legacyErp: 'Not available (requires external tools)',
    },
    {
      feature: 'Branded Fee Receipts',
      edubuddy: 'Instant PDF with your institute logo, GST & phone',
      registers: 'Handwritten slips (frequently lost by students)',
      legacyErp: 'Rigid generic templates, difficult to customize',
    },
    {
      feature: 'Fee Dues Follow-up',
      edubuddy: 'Automated WhatsApp reminder with UPI pay link',
      registers: 'Awkward phone reminders by staff',
      legacyErp: 'Generic SMS with low open rates',
    },
    {
      feature: 'Setup & Learning Curve',
      edubuddy: '5 minutes setup · Simple Hindi & English UI',
      registers: 'Manual ledger writing every academic year',
      legacyErp: 'Weeks of faculty training & complex menus',
    },
  ];

  return (
    <section className="section-block" id="comparison">
      <div className="section-header">
        <span className="section-badge">HONEST COMPARISON</span>
        <h2 className="section-title">
          Built for Coaching Centers. <span className="highlight-lime">Not Bureaucracy.</span>
        </h2>
        <p className="section-lede">
          See why over 1,200 tuition centers and competitive exam academies prefer EduBuddy over paper registers and bloated school software.
        </p>
      </div>

      <div className="comparison-table-wrapper">
        <table className="comparison-table">
          <thead>
            <tr>
              <th className="feature-col">Feature / Workflow</th>
              <th className="highlight-col">
                <div className="col-brand-header">
                  <span className="brand-dot">●</span>
                  EduBuddy Institute OS
                  <span className="col-badge">RECOMMENDED</span>
                </div>
              </th>
              <th>Paper Ledgers & Registers</th>
              <th>Bloated School ERPs</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}>
                <td className="feature-name">
                  <strong>{row.feature}</strong>
                </td>
                <td className="highlight-cell">
                  <span className="check-icon">✓</span> {row.edubuddy}
                </td>
                <td className="muted-cell">
                  <span className="cross-icon">✗</span> {row.registers}
                </td>
                <td className="muted-cell">
                  <span className="neutral-icon">−</span> {row.legacyErp}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
