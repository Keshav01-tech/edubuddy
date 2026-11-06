import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { useT } from './themes';

export const C = {
  indigo: '#5a4ee9',
  indigoLight: '#8b8cfb',
  indigoDark: '#352f84',
  night: '#0d0b2b',
  amber: '#f59e0b',
  amberLight: '#fcd34d',
  green: '#16a34a',
  greenBg: '#dcfce7',
  red: '#ef4444',
  redBg: '#fee2e2',
  ink: '#0f172a',
  muted: '#64748b',
  line: '#e8eaf2',
  canvas: '#f5f6fb',
};

/** 0→1 spring that starts at `delay` frames. */
export const useIn = (delay = 0, damping = 200, durationInFrames?: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping }, durationInFrames });
};

export const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

export const Card: React.FC<{ style?: React.CSSProperties; children: React.ReactNode }> = ({ style, children }) => {
  const T = useT();
  return (
    <div style={{ background: T.cardBg, borderRadius: T.radius, boxShadow: T.cardShadow, border: T.cardBorder, padding: 44, color: T.ink, ...style }}>
      {children}
    </div>
  );
};

/** Kicker pill + headline shown at the top of each feature scene. */
export const Heading: React.FC<{ kicker: string; title: React.ReactNode; delay?: number }> = ({ kicker, title, delay = 0 }) => {
  const a = useIn(delay);
  const b = useIn(delay + 5);
  const T = useT();
  return (
    <div style={{ position: 'absolute', top: 140, left: 70, right: 70 }}>
      <div
        style={{
          display: 'inline-block',
          padding: '12px 26px',
          borderRadius: 999,
          ...T.kicker,
          fontSize: 30,
          fontWeight: 800,
          letterSpacing: 4,
          opacity: a,
          transform: `translateY(${(1 - a) * 30}px)`,
        }}
      >
        {kicker}
      </div>
      <div
        style={{
          marginTop: 26,
          fontSize: 76,
          lineHeight: 1.08,
          fontFamily: T.headFont,
          fontWeight: T.headWeight,
          color: T.fg,
          letterSpacing: T.headSpacing,
          opacity: b,
          transform: `translateY(${(1 - b) * 40}px)`,
        }}
      >
        {title}
      </div>
    </div>
  );
};

export const Pill: React.FC<{ bg: string; color: string; children: React.ReactNode; style?: React.CSSProperties }> = ({
  bg,
  color,
  children,
  style,
}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 22px',
      borderRadius: 999,
      background: bg,
      color,
      fontSize: 28,
      fontWeight: 700,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Avatar: React.FC<{ name: string; hue: number; size?: number }> = ({ name, hue, size = 68 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      background: `hsl(${hue} 80% 92%)`,
      color: `hsl(${hue} 60% 38%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 800,
      fontSize: size * 0.42,
      flexShrink: 0,
    }}
  >
    {name
      .split(' ')
      .map((w) => w[0])
      .join('')}
  </div>
);

/* ---------- icons (inline SVG so nothing depends on system emoji fonts) ---------- */
type IconProps = { size?: number; color?: string };
const svg = (size: number, children: React.ReactNode, color: string) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);
export const Check = ({ size = 28, color = 'currentColor' }: IconProps) => svg(size, <path d="M5 12.5l4.5 4.5L19 7.5" />, color);
export const Cross = ({ size = 28, color = 'currentColor' }: IconProps) => svg(size, <path d="M6 6l12 12M18 6L6 18" />, color);
export const Bell = ({ size = 28, color = 'currentColor' }: IconProps) =>
  svg(size, <><path d="M6 9a6 6 0 1112 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9z" /><path d="M10 20a2 2 0 004 0" /></>, color);
export const Download = ({ size = 28, color = 'currentColor' }: IconProps) =>
  svg(size, <><path d="M12 4v11M7 10.5l5 5 5-5" /><path d="M5 20h14" /></>, color);
export const Sparkle = ({ size = 28, color = 'currentColor' }: IconProps) =>
  svg(size, <path d="M12 3l2.2 6.3L20.5 12l-6.3 2.2L12 20.5l-2.2-6.3L3.5 12l6.3-2.7z" />, color);
export const Phone = ({ size = 28, color = 'currentColor' }: IconProps) =>
  svg(size, <><rect x="7" y="2.5" width="10" height="19" rx="2.5" /><path d="M11 18.5h2" /></>, color);
export const Laptop = ({ size = 28, color = 'currentColor' }: IconProps) =>
  svg(size, <><rect x="4" y="5" width="16" height="11" rx="1.5" /><path d="M2 19.5h20" /></>, color);
export const Clock = ({ size = 28, color = 'currentColor' }: IconProps) =>
  svg(size, <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>, color);

export const Cursor: React.FC<{ x: number; y: number; pressed: number; opacity?: number }> = ({ x, y, pressed, opacity = 1 }) => (
  <div style={{ position: 'absolute', left: x, top: y, opacity, transform: `scale(${1 - pressed * 0.15})`, transformOrigin: '0 0' }}>
    <svg width={64} height={64} viewBox="0 0 24 24">
      <path d="M4 2.5l15 9-6.6 1.6 3.8 7-2.8 1.4-3.8-7L4 18.5z" fill="#fff" stroke={C.ink} strokeWidth={1.4} strokeLinejoin="round" />
    </svg>
  </div>
);

/** Indian-style number formatting: 124500 -> 1,24,500 */
export const inr = (n: number) => Math.round(n).toLocaleString('en-IN');

export const lerp = (frame: number, input: number[], output: number[]) => interpolate(frame, input, output, clamp);

export const Wallet = ({ size = 28, color = 'currentColor' }: IconProps) =>
  svg(size, <><rect x="3" y="6" width="18" height="13" rx="2.5" /><path d="M3 10h18M16 14.5h2" /></>, color);
export const Users = ({ size = 28, color = 'currentColor' }: IconProps) =>
  svg(size, <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5" /><path d="M16 4.8a3.4 3.4 0 010 6.4M18 14.8c2 .7 3.2 2.5 3.6 5.2" /></>, color);
export const FileText = ({ size = 28, color = 'currentColor' }: IconProps) =>
  svg(size, <><path d="M6 2.5h8l4.5 4.5v14.5H6z" /><path d="M14 2.5V7h4.5M9 12h6M9 16h6" /></>, color);
export const Calendar = ({ size = 28, color = 'currentColor' }: IconProps) =>
  svg(size, <><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>, color);
export const Printer = ({ size = 28, color = 'currentColor' }: IconProps) =>
  svg(size, <><path d="M7 9V3h10v6" /><rect x="3" y="9" width="18" height="8" rx="2" /><path d="M7 14h10v7H7z" /></>, color);
