// Vertical 9:16 "Before EduBuddy / After EduBuddy" (~30s) with the app's real PHONE view.
// Compositions: ba-vertical-hi and ba-vertical-en, 1080x1920. Same voice lines as BeforeAfter.tsx.
// Phone clips: reel/public/screens/m-*.mp4 from ../capture/record-screens.mjs.
import React from 'react';
import { AbsoluteFill, Easing, Freeze, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/PlusJakartaSans';
import { Check, Cross } from './ui';
import { Logo, Register } from './Story';
import { BLang, Before, LangCtx, Line, TIM, Voice, lineFrames, speech } from './BeforeAfter';

const { fontFamily } = loadFont('normal', { weights: ['500', '600', '700', '800'], subsets: ['latin'] });

const FPS = 30;
const INTRO_LEAD = 6;
const OUTRO_HOLD = 36;
const RMAX = 3.2;
const BRAND = '#005a9c';
const NAVY = '#1b365d';
const INK = '#15171f';
const RED = '#c9352b';
const PAPER = '#f3ecdd';
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ease = Easing.bezier(0.45, 0, 0.2, 1);

type MClip = { name: Record<BLang, string>; file: string; from: number; to: number };
const TOPICS: MClip[] = [
  { name: { hi: 'Attendance', en: 'Attendance' }, file: 'screens/m-attendance.mp4', from: 0.3, to: 8.0 },
  { name: { hi: 'Fees', en: 'Fees' }, file: 'screens/m-fees.mp4', from: 0.3, to: 10.7 },
  { name: { hi: 'Inquiries', en: 'Inquiries' }, file: 'screens/m-leads.mp4', from: 1.6, to: 13.8 },
  { name: { hi: 'Records', en: 'Records' }, file: 'screens/m-dashboard.mp4', from: 6.3, to: 14.0 },
];

export const baVFrames = (lang: BLang) => {
  const s = TIM[lang].scenes;
  return [INTRO_LEAD + lineFrames(s[0]), ...[1, 3, 5, 7].map((k) => lineFrames(s[k]) + lineFrames(s[k + 1])), speech(s[9]) + OUTRO_HOLD];
};

const useSpring = (delay = 0, damping = 14, dur?: number) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - delay, fps, config: { damping }, durationInFrames: dur });
};
const Pop: React.FC<{ delay?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ delay = 0, children, style }) => {
  const p = useSpring(delay, 200, 16);
  return <div style={{ opacity: p, transform: `translateY(${(1 - p) * 24}px)`, ...style }}>{children}</div>;
};
const Caption: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ position: 'absolute', left: 40, right: 40, bottom: 70, display: 'flex', justifyContent: 'center' }}>
    <div style={{ background: 'rgba(17,22,36,.92)', color: '#fff', borderRadius: 22, padding: '18px 30px', fontSize: 40, fontWeight: 700, lineHeight: 1.3, textAlign: 'center' }}>{text}</div>
  </div>
);

/* ───── phone with the real app ───── */
const SW = 600;
const SH = Math.round((SW * 844) / 390); // 1298
const Phone: React.FC<{ clip: MClip; play: boolean; dur: number }> = ({ clip, play, dur }) => {
  const rate = Math.min(RMAX, Math.max(1, (clip.to - clip.from) / (dur / FPS)));
  const video = <OffthreadVideo src={staticFile(clip.file)} startFrom={Math.round(clip.from * FPS)} playbackRate={play ? rate : 1} muted style={{ width: SW, height: SH, display: 'block' }} />;
  return (
    <div style={{ padding: 16, borderRadius: 74, background: '#11141b', boxShadow: '0 50px 100px rgba(10,30,60,.45), inset 0 0 0 3px #2b303b', position: 'relative' }}>
      <div style={{ width: SW, height: SH, borderRadius: 58, overflow: 'hidden', background: '#fff', position: 'relative' }}>
        {play ? video : <Freeze frame={0}>{video}</Freeze>}
        <div style={{ position: 'absolute', top: 14, left: '50%', marginLeft: -60, width: 120, height: 34, borderRadius: 17, background: '#11141b' }} />
      </div>
      {play && rate > 1.15 && (
        <div style={{ position: 'absolute', right: -14, bottom: 90, background: BRAND, color: '#fff', borderRadius: 999, padding: '8px 18px', fontSize: 26, fontWeight: 800, boxShadow: '0 10px 24px rgba(0,90,156,.4)' }}>▶▶ {rate.toFixed(1)}×</div>
      )}
    </div>
  );
};

/* ───── one topic: full-screen "before", then phone "after" ───── */
const Pair: React.FC<{ k: number; before: Line; after: Line }> = ({ k, before, after }) => {
  const lang = React.useContext(LangCtx);
  const f = useCurrentFrame();
  const switchAt = lineFrames(before);
  const afterDur = lineFrames(after);
  const t = interpolate(f, [switchAt - 4, switchAt + 12], [0, 1], { ...clamp, easing: ease });
  const enter = useSpring(0, 200, 14);
  const clip = TOPICS[k];
  // Before card: big in the middle, then a small tilted sticker at the top-left.
  const bx = interpolate(t, [0, 1], [540, 205]);
  const by = interpolate(t, [0, 1], [880, 330]);
  const bs = interpolate(t, [0, 1], [1.4, 0.48]);
  const br = interpolate(t, [0, 1], [0, -7]);
  const phoneY = interpolate(t, [0, 1], [1750, 0]);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: PAPER }} />
      <AbsoluteFill style={{ background: 'linear-gradient(170deg,#e6f1fb,#f6f9fd 55%,#dcebf8)', opacity: t }} />

      <div style={{ position: 'absolute', top: 70, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: enter, zIndex: 5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#fff', borderRadius: 999, padding: '12px 34px 12px 12px', boxShadow: '0 10px 30px rgba(0,0,0,.12)', fontSize: 46, fontWeight: 800, color: INK }}>
          <span style={{ width: 60, height: 60, borderRadius: 30, background: NAVY, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 30 }}>{k + 1}</span>
          {clip.name[lang]}
        </div>
      </div>

      {/* labels */}
      <div style={{ position: 'absolute', top: 200, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: 1 - t }}>
        <div style={{ background: RED, color: '#fff', borderRadius: 999, padding: '12px 36px', fontSize: 40, fontWeight: 800, letterSpacing: 3 }}>{lang === 'hi' ? 'PEHLE' : 'BEFORE'}</div>
      </div>
      <div style={{ position: 'absolute', top: 205, right: 60, opacity: t, transform: `scale(${0.8 + t * 0.2})`, zIndex: 4 }}>
        <div style={{ background: BRAND, color: '#fff', borderRadius: 999, padding: '12px 30px', fontSize: 34, fontWeight: 800, letterSpacing: 2 }}>{lang === 'hi' ? 'AB · EDUBUDDY' : 'AFTER · EDUBUDDY'}</div>
      </div>

      {/* phone */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 300, display: 'flex', justifyContent: 'center', transform: `translateY(${phoneY}px)` }}>
        <div style={{ position: 'relative' }}>
          <Phone clip={clip} play={false} dur={afterDur} />
          <Sequence from={switchAt} layout="none">
            <div style={{ position: 'absolute', inset: 0 }}><Phone clip={clip} play dur={afterDur} /></div>
          </Sequence>
          <div style={{ position: 'absolute', right: -26, top: 60, width: 90, height: 90, borderRadius: 45, background: '#16a34a', color: '#fff', display: 'grid', placeItems: 'center', transform: `scale(${t})`, boxShadow: '0 12px 26px rgba(22,163,74,.45)' }}>
            <Check size={54} />
          </div>
        </div>
      </div>

      {/* before card */}
      <div style={{ position: 'absolute', left: bx, top: by, width: 0, height: 0, zIndex: 3 }}>
        <div style={{ position: 'absolute', left: -320, top: -260, width: 640, height: 520, transform: `scale(${bs}) rotate(${br}deg)`, filter: `grayscale(${t * 0.9})`, overflow: k === 3 ? 'hidden' : 'visible' }}>
          <Before k={k} />
          <div style={{ position: 'absolute', left: '50%', top: '50%', width: 200, height: 200, marginLeft: -100, marginTop: -100, borderRadius: 100, background: RED, color: '#fff', display: 'grid', placeItems: 'center', transform: `scale(${t})`, opacity: t, boxShadow: '0 16px 36px rgba(150,30,20,.45)' }}>
            <Cross size={120} />
          </div>
        </div>
      </div>

      <Sequence durationInFrames={switchAt}><Caption text={before.text} /></Sequence>
      <Sequence from={switchAt}><Caption text={after.text} /></Sequence>
      <Voice line={before} at={0} />
      <Voice line={after} at={switchAt} />
    </AbsoluteFill>
  );
};

/* ───── intro & outro ───── */
const Intro: React.FC<{ line: Line }> = ({ line }) => {
  const hi = React.useContext(LangCtx) === 'hi';
  const f = useCurrentFrame();
  const top = interpolate(f, [0, 14], [-960, 0], { ...clamp, easing: ease });
  const bottom = interpolate(f, [22, 36], [960, 0], { ...clamp, easing: ease });
  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 960, background: PAPER, transform: `translateY(${top}px)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 30 }}>
        <div style={{ display: 'flex', gap: 30, transform: 'rotate(-4deg) scale(.75)', height: 340, alignItems: 'center' }}>
          <Register title="ATTENDANCE" color="#9b3d2e" /><Register title="FEES" color="#2e5c8a" />
        </div>
        <div style={{ fontSize: 92, fontWeight: 800, color: RED }}>{hi ? 'EduBuddy se pehle' : 'Before EduBuddy'}</div>
      </div>
      <div style={{ position: 'absolute', left: 0, top: 960, width: 1080, height: 960, background: `radial-gradient(circle at 50% 45%, #0f5d9e, ${NAVY} 75%)`, transform: `translateY(${bottom}px)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 40 }}>
        <Logo size={200} />
        <div style={{ fontSize: 92, fontWeight: 800, color: '#fff' }}>{hi ? 'EduBuddy ke baad' : 'After EduBuddy'}</div>
      </div>
      <Voice line={line} at={INTRO_LEAD} />
    </AbsoluteFill>
  );
};

const Outro: React.FC<{ line: Line }> = ({ line }) => {
  const hi = React.useContext(LangCtx) === 'hi';
  const p = useSpring(0, 11);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 42%, #0f5d9e, ${NAVY} 70%)`, alignItems: 'center', justifyContent: 'center', padding: '0 60px', textAlign: 'center' }}>
      <div style={{ transform: `scale(${p})` }}><Logo size={190} /></div>
      <Pop delay={6}><div style={{ fontSize: 140, fontWeight: 800, color: '#fff', letterSpacing: -4, marginTop: 30 }}>EduBuddy</div></Pop>
      <Pop delay={14}><div style={{ fontSize: 52, color: '#cfe7f8', fontWeight: 600, lineHeight: 1.3 }}>{hi ? 'Register chhodo,\ninstitute chalao.' : 'Drop the register.\nRun your institute.'}</div></Pop>
      <Pop delay={24}><div style={{ marginTop: 60, background: '#fff', color: NAVY, borderRadius: 999, padding: '28px 64px', fontSize: 48, fontWeight: 800 }}>{hi ? 'Free demo book karein →' : 'Book a free demo →'}</div></Pop>
      <Voice line={line} at={0} />
    </AbsoluteFill>
  );
};

export const BAVertical: React.FC<{ lang?: BLang }> = ({ lang = 'hi' }) => {
  const s = TIM[lang].scenes;
  const frames = baVFrames(lang);
  const f = useCurrentFrame();
  const total = frames.reduce((a, b) => a + b, 0);
  const starts = frames.map((_, i) => frames.slice(0, i).reduce((a, b) => a + b, 0));
  return (
    <LangCtx.Provider value={lang}>
      <AbsoluteFill style={{ fontFamily, background: PAPER, whiteSpace: 'pre-line' }}>
        <Sequence from={starts[0]} durationInFrames={frames[0]}><Intro line={s[0]} /></Sequence>
        {[0, 1, 2, 3].map((k) => (
          <Sequence key={k} from={starts[k + 1]} durationInFrames={frames[k + 1]}>
            <Pair k={k} before={s[1 + k * 2]} after={s[2 + k * 2]} />
          </Sequence>
        ))}
        <Sequence from={starts[5]} durationInFrames={frames[5]}><Outro line={s[9]} /></Sequence>
        <div style={{ position: 'absolute', left: 0, bottom: 0, height: 8, width: `${(f / total) * 100}%`, background: BRAND }} />
      </AbsoluteFill>
    </LangCtx.Provider>
  );
};
