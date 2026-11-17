import React from 'react';

/**
 * EduBuddy brand logo, rebuilt as a scalable SVG from the official artwork:
 * a deep‑navy rounded square holding a white "e" with a blue dot in its mouth.
 * Using an SVG (not the raster file) keeps it crisp at every size and lets it
 * sit on any background.
 */

export const LOGO_NAVY = '#1b2b4d';
export const LOGO_BLUE = '#4d90e4';

/** The icon mark on its own navy tile. Size it with a className like `h-9 w-9`. */
export function LogoMark({ className = 'h-9 w-9', title = 'EduBuddy' }) {
  return (
    <svg viewBox="0 0 64 64" className={`shrink-0 ${className}`} role="img" aria-label={title}>
      <rect width="64" height="64" rx="16" fill={LOGO_NAVY} />
      {/* ring of the "e" */}
      <circle cx="31" cy="32" r="15" fill="none" stroke="#fff" strokeWidth="7" />
      {/* the horizontal crossbar */}
      <rect x="13.5" y="28.5" width="36" height="7" fill="#fff" />
      {/* open the lower‑right to turn the ring into an "e" */}
      <rect x="31" y="35.5" width="23" height="23" fill={LOGO_NAVY} />
      {/* blue dot terminal sitting in the mouth */}
      <circle cx="41" cy="41" r="4" fill={LOGO_BLUE} />
    </svg>
  );
}

/** Full horizontal lockup: the mark plus the "edubuddy.ai" wordmark. */
export function Wordmark({
  className = '',
  markClass = 'h-9 w-9',
  textClass = 'text-xl',
  onDark = false,
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className={markClass} />
      <span className={`font-bold tracking-tight ${textClass} ${onDark ? 'text-white' : 'text-[#1b2b4d]'}`}>
        edubuddy<span style={{ color: LOGO_BLUE }}>.ai</span>
      </span>
    </span>
  );
}

export default LogoMark;
