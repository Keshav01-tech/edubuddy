// Kinetic-typography Instagram ads: white screen, big text, slow pace. No app screens.
// Structure: question hook → magnify the pain → EduBuddy solves it → CTA.
// Compositions: kin-1 … kin-4 (1080x1920, 30s). Scripts: ../ad-scripts/k*.txt
// Script line format: "[q|pain|solve|cta] caption with *highlight* and ' / ' line breaks || speech"
import React from 'react';
import { AbsoluteFill, Audio, Easing, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { loadFont } from '@remotion/google-fonts/PlusJakartaSans';
import k1 from './timings-k1.json';
import k2 from './timings-k2.json';
import k3 from './timings-k3.json';
import k4 from './timings-k4.json';
import { Logo } from './Story';

const { fontFamily } = loadFont('normal', { weights: ['500', '700', '800'], subsets: ['latin'] });

type Line = { text: string; file: string; seconds: number; start: number; end: number };
const FPS = 30;
export const KIN_TOTAL = 30 * FPS;
const INK = '#111318';
const BRAND = '#005a9c';
const ease = Easing.bezier(0.33, 0, 0.2, 1);
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
export const KIN = { 'kin-1': k1, 'kin-2': k2, 'kin-3': k3, 'kin-4': k4 } as const;

type Kind = 'q' | 'pain' | 'solve' | 'cta';
const parse = (text: string) => {
  const m = text.match(/^\[(\w+)\]\s*(.*)$/);
  const kind = (m ? m[1] : 'q') as Kind;
  const lines = (m ? m[2] : text).split(' / ').map((l) => l.trim());
  return { kind, lines };
};
// Marker colour per mood: amber for the question, red for pain, blue for the answer.
const MARK: Record<Kind, { bg: string; fg: string }> = {
  q: { bg: '#ffe066', fg: INK },
  pain: { bg: '#ffb3ad', fg: INK },
  solve: { bg: '#cfe6fb', fg: BRAND },
  cta: { bg: '#cfe6fb', fg: BRAND },
};

const speechFrames = (l: Line) => Math.ceil((l.end - l.start) * FPS);
export const kinPlan = (lines: Line[]) => {
  const base = lines.map((l, i) => speechFrames(l) + (i === lines.length - 1 ? 60 : 10) + (i === 0 ? 8 : 0));
  const spare = Math.max(0, KIN_TOTAL - base.reduce((a, b) => a + b, 0));
  const durs = base.map((d, i) => (i < lines.length - 1 ? d + Math.floor(spare / (lines.length - 1)) : d));
  durs[durs.length - 1] += KIN_TOTAL - durs.reduce((a, b) => a + b, 0);
  return { durs, starts: durs.map((_, i) => durs.slice(0, i).reduce((a, b) => a + b, 0)) };
};

/* One line of text with *highlighted* words that get a marker sweep. */
const TextLine: React.FC<{ text: string; kind: Kind; appear: number; markAt: number; size: number }> = ({ text, kind, appear, markAt, size }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [appear, appear + 16], [0, 1], { ...clamp, easing: ease });
  const parts = text.split(/(\*[^*]+\*)/g).filter(Boolean);
  return (
    <div style={{ opacity: p, transform: `translateY(${(1 - p) * 40}px)`, fontSize: size, fontWeight: 800, lineHeight: 1.12, letterSpacing: -size * 0.025, color: INK }}>
      {parts.map((part, i) => {
        if (!part.startsWith('*')) return <span key={i}>{part}</span>;
        const sweep = interpolate(f, [markAt, markAt + 14], [0, 100], { ...clamp, easing: ease });
        return (
          <span key={i} style={{ position: 'relative', display: 'inline-block', color: MARK[kind].fg }}>
            <span style={{ position: 'absolute', left: -8, right: -8, bottom: size * 0.06, height: size * 0.42, background: MARK[kind].bg, borderRadius: 6, zIndex: 0, clipPath: `inset(0 ${100 - sweep}% 0 0)` }} />
            <span style={{ position: 'relative' }}>{part.slice(1, -1)}</span>
          </span>
        );
      })}
    </div>
  );
};

const Card: React.FC<{ line: Line; dur: number; first: boolean }> = ({ line, dur, first }) => {
  const f = useCurrentFrame();
  const { kind, lines } = parse(line.text);
  const talk = speechFrames(line);
  const longest = Math.max(...lines.map((l) => l.replace(/\*/g, '').length));
  const size = longest > 30 ? 84 : longest > 22 ? 100 : longest > 15 ? 118 : 136;
  const step = Math.max(8, Math.min(22, (talk * 0.75) / lines.length));
  const exit = interpolate(f, [dur - 8, dur], [1, 0], clamp);
  const drift = interpolate(f, [0, dur], [1, 1.035]);
  const isCta = kind === 'cta';
  const pulse = 1 + Math.max(0, Math.sin((f - 50) / 7)) * 0.03;
  return (
    <AbsoluteFill style={{ opacity: exit }}>
      <div style={{ position: 'absolute', left: 80, right: 80, top: isCta ? 330 : 300, height: isCta ? 560 : 950, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: size * 0.12, transform: `scale(${drift})` }}>
        {lines.map((l, i) => (
          <TextLine key={i} text={l} kind={kind} size={size} appear={(first ? 8 : 1) + i * step} markAt={(first ? 8 : 1) + i * step + 12} />
        ))}
      </div>
      {isCta && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 900, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26 }}>
          <div style={{ opacity: interpolate(f, [30, 46], [0, 1], clamp), transform: `scale(${pulse})`, background: BRAND, color: '#fff', borderRadius: 999, padding: '30px 64px', fontSize: 54, fontWeight: 800, boxShadow: '0 20px 40px rgba(0,90,156,.25)' }}>
            Book a free demo →
          </div>
          <div style={{ opacity: interpolate(f, [44, 60], [0, 1], clamp), display: 'flex', alignItems: 'center', gap: 16 }}>
            <Logo size={70} />
            <span style={{ fontSize: 46, fontWeight: 800, color: INK }}>EduBuddy</span>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

export const KineticAd: React.FC<{ id: keyof typeof KIN }> = ({ id }) => {
  const lines = (KIN[id] as { scenes: Line[] }).scenes;
  const { durs, starts } = kinPlan(lines);
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: '#ffffff', fontFamily }}>
      {lines.map((l, i) => (
        <Sequence key={i} from={starts[i]} durationInFrames={durs[i]}>
          <Card line={l} dur={durs[i]} first={i === 0} />
          <Sequence from={i === 0 ? 8 : 4}><Audio src={staticFile(l.file)} startFrom={Math.round(l.start * FPS)} /></Sequence>
        </Sequence>
      ))}
      <div style={{ position: 'absolute', left: 0, top: 0, height: 6, width: `${(f / KIN_TOTAL) * 100}%`, background: '#e9ecf1' }} />
    </AbsoluteFill>
  );
};
