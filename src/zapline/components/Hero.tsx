import React from 'react';
import { DialogKey } from '../types';

interface HeroProps {
  onOpenDialog: (key: DialogKey) => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenDialog }) => {
  return (
    <>
      <section className="hero" aria-labelledby="title">
        <div className="badge">✨ Bharat's #1 Coaching Institute & Tuition OS</div>

        <h1 className="headline" id="title">
          <span className="line-mask">
            <span>Teach with clarity.</span>
          </span>
          <span className="line-mask">
            <span>
              Grow with <em>conviction.</em>
            </span>
          </span>
        </h1>

        <p>
          Less admin headache. Total focus on student results.
          <br />
          One unified terminal for WhatsApp Haziri, Fee Receipts, and 30-Second NCERT Question Papers.
        </p>

        <div className="hero-actions">
          <button
            type="button"
            className="pill primary"
            onClick={() => onOpenDialog('start')}
          >
            Explore Live Institute <span className="arrow">↗</span>
          </button>
          <button
            type="button"
            className="pill secondary"
            onClick={() => {
              const el = document.getElementById('features');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
              } else {
                onOpenDialog('features');
              }
            }}
          >
            See how it works <span className="arrow">↓</span>
          </button>
        </div>

        <div className="micro">
          <span>CBSE · ICSE · State Boards (Class 6-12)</span>
          <span>1-Tap WhatsApp Connected</span>
          <span>Zero Paperwork</span>
        </div>
      </section>

      {/* Decorative Side Coordinates (desktop only) */}
      <span className="side-caption" aria-hidden="true">
        Built for Indian Coaching Institutes — 01
      </span>
      <span className="side-coordinate" aria-hidden="true">
        SAVE 15+ HRS/WEEK.
        <br />
        GROW ENROLLMENTS.
      </span>
    </>
  );
};
