import React, { createContext, useContext } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { loadFont as jakarta } from '@remotion/google-fonts/PlusJakartaSans';
import { loadFont as grotesk } from '@remotion/google-fonts/SpaceGrotesk';
import { loadFont as archivo } from '@remotion/google-fonts/ArchivoBlack';
import { loadFont as kalam } from '@remotion/google-fonts/Kalam';

const F = {
  jakarta: jakarta('normal', { weights: ['400', '500', '600', '700', '800'] }).fontFamily,
  grotesk: grotesk('normal', { weights: ['500', '600', '700'] }).fontFamily,
  archivo: archivo('normal', { weights: ['400'] }).fontFamily,
  kalam: kalam('normal', { weights: ['400', '700'] }).fontFamily,
};

export type Theme = {
  name: string;
  // brand palette (used inside cards / app mockups)
  indigo: string; indigoLight: string; indigoDark: string;
  amber: string; amberLight: string;
  green: string; greenBg: string; red: string; redBg: string;
  ink: string; muted: string; line: string; canvas: string;
  // things drawn directly on the background
  fg: string; fgSoft: string; hi: string; // text, secondary text, highlighted word
  panel: string; panelBorder: string; // translucent chips / columns
  kicker: React.CSSProperties;
  // cards
  cardBg: string; cardShadow: string; cardBorder: string; radius: number;
  // type
  font: string; headFont: string; headWeight: number; headSpacing: number;
  // captions
  caption: React.CSSProperties; captionDim: string; captionHi: string;
  onAccent: string; // text on an amber/accent button
  logo: React.CSSProperties;
  Background: React.FC;
};

const brand = {
  indigo: '#5a4ee9', indigoLight: '#8b8cfb', indigoDark: '#352f84',
  amber: '#f59e0b', amberLight: '#fcd34d',
  green: '#16a34a', greenBg: '#dcfce7', red: '#ef4444', redBg: '#fee2e2',
  ink: '#0f172a', muted: '#64748b', line: '#e8eaf2', canvas: '#f5f6fb',
};

const Blob: React.FC<{ x: number; y: number; size: number; color: string }> = ({ x, y, size, color }) => (
  <div style={{ position: 'absolute', left: x, top: y, width: size, height: size, borderRadius: '50%', background: `radial-gradient(circle, ${color}, transparent 65%)` }} />
);
const useDrift = () => {
  const f = useCurrentFrame();
  return [Math.sin(f / 60) * 120, Math.cos(f / 75) * 140];
};

/* ---------------- 1. Midnight (original) ---------------- */
const midnight: Theme = {
  name: 'midnight', ...brand,
  fg: '#fff', fgSoft: '#d3d6ff', hi: brand.amber,
  panel: 'rgba(255,255,255,0.07)', panelBorder: 'rgba(255,255,255,0.16)',
  kicker: { background: 'rgba(245,158,11,0.16)', border: `2px solid ${brand.amber}`, color: brand.amberLight },
  cardBg: '#fff', cardShadow: '0 30px 80px -20px rgba(10,8,40,0.55), 0 8px 24px rgba(10,8,40,0.25)', cardBorder: 'none', radius: 40,
  font: F.jakarta, headFont: F.jakarta, headWeight: 800, headSpacing: -2,
  caption: { background: 'rgba(8,6,30,0.78)', color: '#fff', borderRadius: 26 }, captionDim: 'rgba(255,255,255,0.45)', captionHi: brand.amber,
  onAccent: brand.ink,
  logo: { background: `linear-gradient(135deg, ${brand.indigoLight}, ${brand.indigo})`, color: '#fff', borderRadius: 60, boxShadow: `0 30px 80px ${brand.indigo}` },
  Background: () => {
    const [a, b] = useDrift();
    return (
      <AbsoluteFill style={{ background: '#0d0b2b', overflow: 'hidden' }}>
        <Blob x={-400 + a} y={-300} size={1100} color={`${brand.indigo}aa`} />
        <Blob x={530} y={900 + b} size={1000} color="#8b5cf688" />
        <Blob x={200 - b} y={1570} size={700} color={`${brand.amber}33`} />
        <AbsoluteFill style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 2px, transparent 2px)', backgroundSize: '48px 48px' }} />
      </AbsoluteFill>
    );
  },
};

/* ---------------- 2. Daylight: light, airy, pastel ---------------- */
const daylight: Theme = {
  ...midnight, name: 'daylight',
  fg: '#14123a', fgSoft: '#4b4a72', hi: '#e8590c',
  panel: 'rgba(255,255,255,0.7)', panelBorder: 'rgba(90,78,233,0.18)',
  kicker: { background: 'rgba(90,78,233,0.1)', border: `2px solid ${brand.indigo}`, color: brand.indigo },
  cardShadow: '0 30px 60px -24px rgba(60,50,160,0.35), 0 2px 8px rgba(60,50,160,0.08)', cardBorder: '2px solid #ecebff',
  caption: { background: '#fff', color: '#14123a', borderRadius: 26, boxShadow: '0 12px 30px rgba(60,50,160,0.2)' },
  captionDim: 'rgba(20,18,58,0.35)', captionHi: brand.indigo,
  logo: { background: `linear-gradient(135deg, ${brand.indigoLight}, ${brand.indigo})`, color: '#fff', borderRadius: 60, boxShadow: '0 30px 60px rgba(90,78,233,0.4)' },
  Background: () => {
    const [a, b] = useDrift();
    return (
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, #f7f6ff 0%, #eef0ff 55%, #fff6ea 100%)', overflow: 'hidden' }}>
        <Blob x={-350 + a} y={-250} size={1000} color="#c9c4ffcc" />
        <Blob x={520} y={850 + b} size={950} color="#ffd9a8aa" />
        <Blob x={-200 - b} y={1300} size={800} color="#bde7ffaa" />
        <AbsoluteFill style={{ backgroundImage: 'radial-gradient(rgba(90,78,233,0.12) 2px, transparent 2px)', backgroundSize: '48px 48px' }} />
      </AbsoluteFill>
    );
  },
};

/* ---------------- 3. Pop: neo-brutalist yellow ---------------- */
const pop: Theme = {
  ...brand, name: 'pop',
  indigo: '#2f4bff', indigoLight: '#9fb0ff', indigoDark: '#1a2aa8', amber: '#ff4d8d', amberLight: '#ff9cc0',
  ink: '#111', line: '#ececec',
  fg: '#111', fgSoft: '#333', hi: '#2f4bff',
  panel: '#fff', panelBorder: '#111',
  kicker: { background: '#111', border: '3px solid #111', color: '#ffe14d' },
  cardBg: '#fff', cardShadow: '14px 14px 0 #111', cardBorder: '5px solid #111', radius: 28,
  font: F.grotesk, headFont: F.archivo, headWeight: 400, headSpacing: -1,
  caption: { background: '#111', color: '#fff', borderRadius: 14, boxShadow: '8px 8px 0 #ff4d8d' },
  captionDim: 'rgba(255,255,255,0.45)', captionHi: '#ffe14d',
  onAccent: '#fff',
  logo: { background: '#2f4bff', color: '#ffe14d', borderRadius: 36, border: '6px solid #111', boxShadow: '14px 14px 0 #111' },
  Background: () => {
    const f = useCurrentFrame();
    const shapes = [
      { x: 860, y: 120, s: 120, r: 'circle' }, { x: 60, y: 1700, s: 150, r: 'square' },
      { x: 920, y: 1790, s: 90, r: 'circle' }, { x: 40, y: 80, s: 80, r: 'square' },
    ];
    return (
      <AbsoluteFill style={{ background: '#ffe14d', overflow: 'hidden' }}>
        <AbsoluteFill style={{ backgroundImage: 'linear-gradient(#11111114 2px, transparent 2px), linear-gradient(90deg, #11111114 2px, transparent 2px)', backgroundSize: '72px 72px' }} />
        {shapes.map((s, i) => (
          <div key={i} style={{
            position: 'absolute', left: s.x, top: s.y + Math.sin((f + i * 30) / 20) * 14, width: s.s, height: s.s,
            borderRadius: s.r === 'circle' ? '50%' : 18, border: '5px solid #111', background: i % 2 ? '#ff4d8d' : '#2f4bff',
            transform: `rotate(${f * (i % 2 ? 0.6 : -0.4)}deg)`,
          }} />
        ))}
      </AbsoluteFill>
    );
  },
};

/* ---------------- 4. Chalkboard: classroom ---------------- */
const chalk: Theme = {
  ...brand, name: 'chalk',
  indigo: '#2563eb', indigoLight: '#93c5fd', indigoDark: '#1e3a8a', amber: '#f2c94c', amberLight: '#ffe38a',
  canvas: '#f3efe2', line: '#e7e1cf',
  fg: '#f7f5ea', fgSoft: '#d9e6dc', hi: '#ffe38a',
  panel: 'rgba(255,255,255,0.06)', panelBorder: 'rgba(247,245,234,0.45)',
  kicker: { background: 'transparent', border: '3px dashed #ffe38a', color: '#ffe38a' },
  cardBg: '#fffdf4', cardShadow: '0 24px 50px rgba(0,0,0,0.45)', cardBorder: 'none', radius: 14,
  font: F.jakarta, headFont: F.kalam, headWeight: 700, headSpacing: 0,
  caption: { background: 'rgba(0,0,0,0.35)', color: '#f7f5ea', borderRadius: 16, fontFamily: F.kalam, fontWeight: 700, border: '2px dashed rgba(247,245,234,0.4)' },
  captionDim: 'rgba(247,245,234,0.4)', captionHi: '#ffe38a',
  onAccent: '#1f2d25',
  logo: { background: '#fffdf4', color: '#1d3a2e', borderRadius: 30, fontFamily: F.kalam, transform: 'rotate(-4deg)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' },
  Background: () => {
    const f = useCurrentFrame();
    return (
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 40%, #2f5a45 0%, #1d3a2e 60%, #142a21 100%)', overflow: 'hidden' }}>
        {/* chalk smudges */}
        <Blob x={-200} y={200} size={900} color="rgba(255,255,255,0.06)" />
        <Blob x={400} y={1100} size={800} color="rgba(255,255,255,0.05)" />
        {/* doodles */}
        <div style={{ position: 'absolute', left: 820, top: 70, fontFamily: F.kalam, fontSize: 64, color: 'rgba(247,245,234,0.22)', transform: `rotate(${8 + Math.sin(f / 30) * 2}deg)` }}>a² + b² = c²</div>
        <div style={{ position: 'absolute', left: 60, top: 1720, fontFamily: F.kalam, fontSize: 56, color: 'rgba(247,245,234,0.18)', transform: 'rotate(-6deg)' }}>E = mc²</div>
        <div style={{ position: 'absolute', left: 760, top: 1690, fontFamily: F.kalam, fontSize: 60, color: 'rgba(247,245,234,0.18)', transform: 'rotate(5deg)' }}>π ≈ 3.14</div>
        {/* wooden frame */}
        <AbsoluteFill style={{ border: '22px solid #7a5230', boxShadow: 'inset 0 0 0 4px #5b3b20, inset 0 0 60px rgba(0,0,0,0.5)' }} />
      </AbsoluteFill>
    );
  },
};

export const THEMES = { midnight, daylight, pop, chalk };
export type ThemeName = keyof typeof THEMES;

const Ctx = createContext<Theme>(midnight);
export const ThemeProvider = Ctx.Provider;
export const useT = () => useContext(Ctx);
