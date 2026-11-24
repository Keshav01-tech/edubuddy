// 15-second vertical "3 tips for institute owners" video — reads as helpful advice, the app appears quietly.
// Compositions: tips-hi / tips-en, 1080x1920, exactly 15s.
// Voice: tts.py tips-hinglish.txt tips-hi / tips-en.txt tips-en, then trim_silence.py tips-hi tips-en.
import React from 'react';
import { AbsoluteFill, Easing, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/PlusJakartaSans';
import hiT from './timings-tips-hi.json';
import enT from './timings-tips-en.json';
import { Logo } from './Story';
import { BLang, LangCtx, Line, Voice } from './BeforeAfter';

const { fontFamily } = loadFont('normal', { weights: ['500', '600', '700', '800'], subsets: ['latin'] });

const TIM = { hi: hiT as { scenes: Line[] }, en: enT as { scenes: Line[] } };
const FPS = 30;
export const TIPS_TOTAL = 15 * FPS;
const LEAD = 4;
const GAP = 6;
const INK = '#16181d';
const MUTED = '#5f6672';
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ease = Easing.bezier(0.45, 0, 0.2, 1);

const TIPS = [
  { file: 'screens/m-attendance.mp4', from: 1.0, to: 7.6, bg: '#e7f1fc', accent: '#005a9c',
    hi: ['Absent bachchon ke parents ko ek saath message', 'Ek ek call ki zarurat nahi'], en: ['Message all absent parents at once', 'No more calling one by one'] },
  { file: 'screens/m-fees.mp4', from: 1.9, to: 9.6, bg: '#e7f6ec', accent: '#15803d',
    hi: ['Fees lete hi receipt bana do', 'Mahine ke end ka hisaab khatam'], en: ['Make the receipt the moment fees come in', 'No month-end counting'] },
  { file: 'screens/m-leads.mp4', from: 5.8, to: 12.8, bg: '#fdf1e1', accent: '#c2410c',
    hi: ['Har inquiry pe follow-up date', 'Koi admission miss nahi hoga'], en: ['A follow-up date on every inquiry', 'No admission slips away'] },
];

const len = (l: Line) => Math.ceil((l.end - l.start) * FPS) + GAP;
export const tipsFrames = (lang: BLang) => {
  const s = TIM[lang].scenes;
  const close = Math.ceil((s[4].end - s[4].start) * FPS) + 32;
  const tips = [len(s[1]), len(s[2]), len(s[3])];
  // Spread any spare time over the three tips so the app screens get it, not the end card.
  const spare = Math.max(0, TIPS_TOTAL - (LEAD + len(s[0])) - tips.reduce((a, b) => a + b, 0) - close);
  const first = [LEAD + len(s[0]), ...tips.map((t) => t + Math.floor(spare / 3))];
  return [...first, TIPS_TOTAL - first.reduce((a, b) => a + b, 0)];
};

const useSpring = (delay = 0, damping = 200, dur = 14) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - delay, fps, config: { damping }, durationInFrames: dur });
};
const Rise: React.FC<{ delay?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ delay = 0, children, style }) => {
  const p = useSpring(delay);
  return <div style={{ opacity: p, transform: `translateY(${(1 - p) * 26}px)`, ...style }}>{children}</div>;
};
const Bookmark: React.FC<{ size?: number; color?: string }> = ({ size = 34, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
);

/* ───── phone (stays on screen through the three tips) ───── */
const SW = 520;
const SH = Math.round((SW * 844) / 390);
const PhoneScreens: React.FC<{ durs: number[] }> = ({ durs }) => {
  const f = useCurrentFrame();
  const total = durs.reduce((a, b) => a + b, 0);
  const y = interpolate(f, [0, 14, total - 8, total], [1300, 0, 0, 60], { ...clamp, easing: ease });
  const o = interpolate(f, [total - 8, total], [1, 0], clamp);
  let at = 0;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 660, display: 'flex', justifyContent: 'center', transform: `translateY(${y}px)`, opacity: o }}>
      <div style={{ padding: 14, borderRadius: 66, background: '#11141b', boxShadow: '0 40px 80px rgba(20,30,50,.30), inset 0 0 0 3px #2b303b' }}>
        <div style={{ width: SW, height: SH, borderRadius: 52, overflow: 'hidden', background: '#fff', position: 'relative' }}>
          {TIPS.map((t, i) => {
            const start = at;
            at += durs[i];
            const rate = Math.max(1, (t.to - t.from) / (durs[i] / FPS));
            return (
              <Sequence key={t.file} from={start} durationInFrames={durs[i] + (i < 2 ? 6 : 0)}>
                <Fade in={i > 0}><OffthreadVideo src={staticFile(t.file)} startFrom={Math.round(t.from * FPS)} playbackRate={rate} muted style={{ width: SW, height: SH, display: 'block' }} /></Fade>
              </Sequence>
            );
          })}
          <div style={{ position: 'absolute', top: 12, left: '50%', marginLeft: -54, width: 108, height: 30, borderRadius: 15, background: '#11141b' }} />
        </div>
      </div>
    </div>
  );
};
const Fade: React.FC<{ in: boolean; children: React.ReactNode }> = ({ in: fadeIn, children }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ opacity: fadeIn ? interpolate(f, [0, 6], [0, 1], clamp) : 1 }}>{children}</AbsoluteFill>;
};

/* ───── scenes ───── */
const Hook: React.FC = () => {
  const hi = React.useContext(LangCtx) === 'hi';
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: '#f6f1ea', alignItems: 'center', justifyContent: 'center', padding: '0 80px', textAlign: 'center' }}>
      <Rise><div style={{ fontSize: 34, fontWeight: 800, letterSpacing: 5, color: '#b45309' }}>{hi ? 'INSTITUTE OWNERS KE LIYE' : 'FOR INSTITUTE OWNERS'}</div></Rise>
      <Rise delay={4}><div style={{ fontSize: 112, fontWeight: 800, color: INK, lineHeight: 1.05, marginTop: 30, letterSpacing: -2 }}>{hi ? 'Coaching chalate ho?' : 'Run an institute?'}</div></Rise>
      <Rise delay={12}>
        <div style={{ marginTop: 44, display: 'inline-flex', alignItems: 'center', gap: 18, background: INK, color: '#fff', borderRadius: 999, padding: '20px 44px', fontSize: 52, fontWeight: 800 }}>
          <span style={{ display: 'inline-block', transform: `rotate(${Math.sin(f / 5) * 8}deg)` }}>⏱</span>
          {hi ? '3 kaam ki tips' : '3 time-saving tips'}
        </div>
      </Rise>
    </AbsoluteFill>
  );
};

const TipText: React.FC<{ i: number }> = ({ i }) => {
  const lang = React.useContext(LangCtx);
  const t = TIPS[i];
  const [title, sub] = t[lang];
  return (
    <AbsoluteFill style={{ padding: '120px 80px 0' }}>
      <Rise style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <span style={{ width: 84, height: 84, borderRadius: 26, background: t.accent, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 48, fontWeight: 800 }}>{i + 1}</span>
        <span style={{ fontSize: 34, fontWeight: 800, letterSpacing: 4, color: t.accent }}>TIP {i + 1}/3</span>
      </Rise>
      <Rise delay={4}><div style={{ fontSize: 74, fontWeight: 800, color: INK, lineHeight: 1.1, marginTop: 30, letterSpacing: -1.5 }}>{title}</div></Rise>
      <Rise delay={10}><div style={{ fontSize: 42, fontWeight: 600, color: MUTED, marginTop: 18 }}>{sub}</div></Rise>
    </AbsoluteFill>
  );
};

const Close: React.FC = () => {
  const hi = React.useContext(LangCtx) === 'hi';
  return (
    <AbsoluteFill style={{ background: '#f6f1ea', alignItems: 'center', justifyContent: 'center', padding: '0 80px', textAlign: 'center' }}>
      <Rise><div style={{ fontSize: 96, fontWeight: 800, color: INK, lineHeight: 1.08, letterSpacing: -2 }}>{hi ? 'Kaam aasaan,\npadhai pe dhyan.' : 'Less paperwork,\nmore teaching.'}</div></Rise>
      <Rise delay={10}>
        <div style={{ marginTop: 50, display: 'inline-flex', alignItems: 'center', gap: 14, border: `3px solid ${INK}`, borderRadius: 999, padding: '16px 36px', fontSize: 40, fontWeight: 700, color: INK }}>
          <Bookmark /> {hi ? 'Save karke rakho' : 'Save this for later'}
        </div>
      </Rise>
      <Rise delay={18} style={{ position: 'absolute', bottom: 120, display: 'flex', alignItems: 'center', gap: 16 }}>
        <Logo size={64} />
        <span style={{ fontSize: 36, fontWeight: 700, color: MUTED }}>{hi ? 'Ye sab EduBuddy app mein' : 'All done in the EduBuddy app'}</span>
      </Rise>
    </AbsoluteFill>
  );
};

export const HelpfulTips: React.FC<{ lang?: BLang }> = ({ lang = 'hi' }) => {
  const s = TIM[lang].scenes;
  const fr = tipsFrames(lang);
  const starts = fr.map((_, i) => fr.slice(0, i).reduce((a, b) => a + b, 0));
  const tipDurs = [fr[1], fr[2], fr[3]];
  return (
    <LangCtx.Provider value={lang}>
      <AbsoluteFill style={{ fontFamily, background: '#f6f1ea', whiteSpace: 'pre-line' }}>
        <Sequence from={0} durationInFrames={fr[0]}><Hook /><Voice line={s[0]} at={LEAD} /></Sequence>
        {[0, 1, 2].map((i) => (
          <Sequence key={i} from={starts[i + 1]} durationInFrames={fr[i + 1]}>
            <AbsoluteFill style={{ background: TIPS[i].bg }} />
            <TipText i={i} />
            <Voice line={s[i + 1]} at={0} />
          </Sequence>
        ))}
        <Sequence from={starts[1]} durationInFrames={tipDurs.reduce((a, b) => a + b, 0)}><PhoneScreens durs={tipDurs} /></Sequence>
        <Sequence from={starts[4]} durationInFrames={fr[4]}><Close /><Voice line={s[4]} at={2} /></Sequence>
      </AbsoluteFill>
    </LangCtx.Provider>
  );
};
