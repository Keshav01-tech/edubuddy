import React from 'react';
import './BrightFutureDocs.css';

interface ExamPaperProps {
  compact?: boolean;
}

export default function BrightFutureExamPaper({ compact = false }: ExamPaperProps) {
  return (
    <div className={`bf-exam-doc ${compact ? 'compact' : ''}`}>
      {/* Top Header with Set A and Roll No */}
      <div className="bf-exam-top">
        <div className="bf-exam-brand">
          <svg className="bf-logo-icon" viewBox="0 0 48 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="24,3 46,14 24,23 2,14" fill="#0a2540" />
            <path d="M10 19v6c0 3.8 6.27 7 14 7s14-3.2 14-7v-6" stroke="#0a2540" strokeWidth="2.5" fill="#2563eb" fillOpacity="0.2" />
            <path d="M42 15v11c0 1.5-1 2-2 2s-2-.5-2-2v-11" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" />
            <path d="M6 34c6-3 12-1 18 3 6-4 12-6 18-3" stroke="#0a2540" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M6 37c6-3 12-1 18 3 6-4 12-6 18-3" stroke="#0a2540" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          </svg>
          <div>
            <h2 className="bf-brand-name">BRIGHT FUTURE</h2>
            <span className="bf-brand-sub">INSTITUTE OF TECHNOLOGY</span>
            <p className="bf-exam-address">123, Education Road, Sector 15, Noida - 201301, India</p>
          </div>
        </div>

        <div className="bf-set-roll-box">
          <div className="bf-set-badge">SET - A</div>
          <div className="bf-roll-line">
            Roll No. : <span className="roll-fill">__________________</span>
          </div>
        </div>
      </div>

      {/* Center Title */}
      <div className="bf-exam-title-center">
        <h1 className="bf-exam-main-title">ANNUAL EXAMINATION (2026 - 2027)</h1>
        <h3 className="bf-exam-class">Class 11 (Senior Secondary)</h3>
        <h2 className="bf-exam-subject">MATHEMATICS</h2>
      </div>

      {/* Time & Marks Bar */}
      <div className="bf-time-marks-bar">
        <span>Time : 3 Hours</span>
        <span>Maximum Marks : 100</span>
      </div>

      {/* General Instructions */}
      {!compact && (
        <>
          <div className="bf-banner-bar">General Instructions:</div>
          <ol className="bf-instructions-list">
            <li>This question paper consists of 4 sections – A, B, C and D.</li>
            <li>All questions are compulsory.</li>
            <li>Section A contains multiple choice questions (MCQs) of 1 mark each.</li>
            <li>Section B contains short answer questions of 2 marks each.</li>
            <li>Section C contains long answer questions of 5 marks each.</li>
            <li>Section D contains case based / application based questions of 4 marks each.</li>
            <li>Use of calculator is not allowed.</li>
            <li>Neat and clear work should be shown in the answer booklet.</li>
          </ol>
        </>
      )}

      {/* SECTION A */}
      <div className="bf-banner-bar section-bar">
        <span>SECTION – A (Multiple Choice Questions)</span>
        <span>(1 × 10 = 10 Marks)</span>
      </div>
      {!compact && <p className="bf-section-note">Choose the correct option from the given options.</p>}

      <div className="bf-questions-list">
        {/* Q1 */}
        <div className="bf-q-item">
          <div className="bf-q-text">
            <strong>1.</strong> If A = &#123;1, 2, 3&#125;, then the number of subsets of A is
          </div>
          <div className="bf-mcq-grid">
            <span>(a) 6</span>
            <span>(b) 7</span>
            <span className="correct-opt">(c) 8 ✓</span>
            <span>(d) 9</span>
          </div>
        </div>

        {/* Q2 */}
        <div className="bf-q-item">
          <div className="bf-q-text">
            <strong>2.</strong> The value of sin 60° is
          </div>
          <div className="bf-mcq-grid">
            <span>(a) 1/2</span>
            <span>(b) √2/2</span>
            <span className="correct-opt">(c) √3/2 ✓</span>
            <span>(d) 1</span>
          </div>
        </div>

        {/* Q3 */}
        <div className="bf-q-item">
          <div className="bf-q-text">
            <strong>3.</strong> The domain of the function f(x) = 1 / (x - 3) is
          </div>
          <div className="bf-mcq-grid">
            <span>(a) R</span>
            <span>(b) R – &#123;0&#125;</span>
            <span className="correct-opt">(c) R – &#123;3&#125; ✓</span>
            <span>(d) (0, ∞)</span>
          </div>
        </div>

        {/* Q4 */}
        <div className="bf-q-item">
          <div className="bf-q-text">
            <strong>4.</strong> If the first term of an AP is 5 and common difference is 3, then 10th term is
          </div>
          <div className="bf-mcq-grid">
            <span className="correct-opt">(a) 32 ✓</span>
            <span>(b) 35</span>
            <span>(c) 30</span>
            <span>(d) 28</span>
          </div>
        </div>

        {/* Q5 */}
        {!compact && (
          <div className="bf-q-item">
            <div className="bf-q-text">
              <strong>5.</strong> The slope of the line 2x + 3y – 6 = 0 is
            </div>
            <div className="bf-mcq-grid">
              <span>(a) 2/3</span>
              <span className="correct-opt">(b) -2/3 ✓</span>
              <span>(c) 3/2</span>
              <span>(d) -3/2</span>
            </div>
          </div>
        )}
      </div>

      {/* SECTION B */}
      <div className="bf-banner-bar section-bar">
        <span>SECTION – B (Short Answer Questions)</span>
        <span>(2 × 5 = 10 Marks)</span>
      </div>
      <div className="bf-questions-list">
        <div className="bf-q-item">
          <div className="bf-q-text">
            <strong>6.</strong> Find the value of log₂ 8.
          </div>
        </div>
        {!compact && (
          <>
            <div className="bf-q-item">
              <div className="bf-q-text">
                <strong>7.</strong> If A = &#123;1, 2, 3, 4&#125; and B = &#123;3, 4, 5, 6&#125;, find A ∪ B and A ∩ B.
              </div>
            </div>
            <div className="bf-q-item">
              <div className="bf-q-text">
                <strong>8.</strong> Solve for x: 3x – 5 = 16.
              </div>
            </div>
            <div className="bf-q-item">
              <div className="bf-q-text">
                <strong>9.</strong> If tan θ = 3/4, find the value of sin θ.
              </div>
            </div>
            <div className="bf-q-item">
              <div className="bf-q-text">
                <strong>10.</strong> Find the 15th term of the arithmetic progression: 7, 12, 17, ...
              </div>
            </div>
          </>
        )}
      </div>

      {!compact && (
        <>
          {/* SECTION C */}
          <div className="bf-banner-bar section-bar">
            <span>SECTION – C (Long Answer Questions)</span>
            <span>(5 × 4 = 20 Marks)</span>
          </div>
          <div className="bf-questions-list">
            <div className="bf-q-item">
              <div className="bf-q-text">
                <strong>11.</strong> Solve the quadratic equation 2x² – 7x + 3 = 0 using the quadratic formula.
              </div>
            </div>
            <div className="bf-q-item">
              <div className="bf-q-text">
                <strong>12.</strong> Prove that (sin A + cos A)² = 1 + sin 2A.
              </div>
            </div>
            <div className="bf-q-item">
              <div className="bf-q-text">
                <strong>13.</strong> Find the equation of a straight line passing through points (2, 3) and (5, 7).
              </div>
            </div>
          </div>

          {/* SECTION D */}
          <div className="bf-banner-bar section-bar">
            <span>SECTION – D (Case Based / Application Questions)</span>
            <span>(4 × 5 = 20 Marks)</span>
          </div>
          <div className="bf-questions-list">
            <div className="bf-q-item">
              <div className="bf-q-text">
                <strong>15.</strong> A school wants to organize an inter-school sports event. There are 12 schools participating. Each school can send a team in football, basketball or volleyball...
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
