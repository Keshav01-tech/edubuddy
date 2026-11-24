// 30-second "Before EduBuddy / After EduBuddy" split-screen video.
// Compositions: ba-hi (Hinglish) and ba-en (English), 1920x1080.
// Voice: tts.py ba-hinglish.txt / ba-en.txt. Lines: intro, then before/after pairs (attendance, fees, inquiries, records), outro.
// Right-hand screens are the real app clips from ../capture/record-screens.mjs.
import React from 'react';
import { AbsoluteFill, Audio, Easing, Freeze, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/PlusJakartaSans';
import { loadFont as loadHand } from '@remotion/google-fonts/Caveat';
import hiT from './timings-ba-hi.json';
import enT from './timings-ba-en.json';
import { Check, Cross } from './ui';
import { Logo, Register } from './Story';

const { fontFamily } = loadFont('normal', { weights: ['500', '600', '700', '800'], subsets: ['latin'] });
const { fontFamily: hand } = loadHand('normal', { weights: ['600', '700'], subsets: ['latin'] });

export type BLang = 'hi' | 'en';
export type Line = { text: string; file: string; seconds: number; start: number; end: number };
export const TIM = { hi: hiT as { scenes: Line[] }, en: enT as { scenes: Line[] } };
const FPS = 30;
const GAP = 10; // frames of breath after each line
const INTRO_LEAD = 6;
const OUTRO_HOLD = 36;
const BRAND = '#005a9c';
const NAVY = '#1b365d';
const INK = '#15171f';
const RED = '#c9352b';
const PAPER = '#f3ecdd';
const PEN = '#23315e';
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ease = Easing.bezier(0.45, 0, 0.2, 1);
export const LangCtx = React.createContext<BLang>('hi');
const useLang = () => React.useContext(LangCtx);

export const speech = (l: Line) => Math.ceil((l.end - l.start) * FPS);
export const lineFrames = (l: Line) => speech(l) + GAP;

/* ───── topics: real clip window + zoom keys [clip s, focusX, focusY, scale] ───── */
type Topic = { name: Record<BLang, string>; file: string; from: number; to: number; keys: [number, number, number, number][] };
const TOPICS: Topic[] = [
  { name: { hi: 'Attendance', en: 'Attendance' }, file: 'screens/attendance.mp4', from: 0.8, to: 8.8,
    keys: [[0.8, 0.5, 0.58, 1.2], [4.6, 0.5, 0.58, 1.2], [5.8, 0.6, 0.3, 1.45], [8.8, 0.6, 0.3, 1.45]] },
  { name: { hi: 'Fees', en: 'Fees' }, file: 'screens/fees.mp4', from: 3.0, to: 10.6,
    keys: [[3, 0.5, 0.45, 1.2], [3.9, 0.5, 0.5, 1.65], [7.4, 0.5, 0.5, 1.65], [8.4, 0.5, 0.53, 1.45], [10.6, 0.5, 0.53, 1.45]] },
  { name: { hi: 'Inquiries', en: 'Inquiries' }, file: 'screens/leads.mp4', from: 6.0, to: 16.8,
    keys: [[6, 0.5, 0.5, 1.65], [16.8, 0.5, 0.5, 1.65]] },
  { name: { hi: 'Records', en: 'Records' }, file: 'screens/dashboard.mp4', from: 8.2, to: 16.2,
    keys: [[8.2, 0.5, 0.5, 1], [10.5, 0.42, 0.42, 1.15], [13, 0.5, 0.55, 1.1], [16.2, 0.5, 0.5, 1]] },
];

export const baFrames = (lang: BLang) => {
  const s = TIM[lang].scenes;
  const pairs = [1, 3, 5, 7].map((k) => lineFrames(s[k]) + lineFrames(s[k + 1]));
  return [INTRO_LEAD + lineFrames(s[0]), ...pairs, speech(s[9]) + OUTRO_HOLD];
};

/* ───── helpers ───── */
const useSpring = (delay = 0, damping = 14, dur?: number) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - delay, fps, config: { damping }, durationInFrames: dur });
};
const Pop: React.FC<{ delay?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ delay = 0, children, style }) => {
  const p = useSpring(delay, 200, 16);
  return <div style={{ opacity: p, transform: `translateY(${(1 - p) * 24}px)`, ...style }}>{children}</div>;
};
export const Voice: React.FC<{ line: Line; at: number }> = ({ line, at }) => (
  <Sequence from={at}><Audio src={staticFile(line.file)} startFrom={Math.round(line.start * FPS)} /></Sequence>
);
const Caption: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ position: 'absolute', left: 0, right: 0, bottom: 44, display: 'flex', justifyContent: 'center' }}>
    <div style={{ maxWidth: 1500, background: 'rgba(17,22,36,.9)', color: '#fff', borderRadius: 18, padding: '14px 32px', fontSize: 36, fontWeight: 700, textAlign: 'center' }}>{text}</div>
  </div>
);

/* ───── paper page for the "before" side ───── */
const Page: React.FC<{ title: string; rows: React.ReactNode[]; rowDelay?: number }> = ({ title, rows, rowDelay = 7 }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ width: 640, height: 520, background: '#fffdf6', borderRadius: 10, boxShadow: '0 24px 50px rgba(70,50,20,.22)', position: 'relative', overflow: 'hidden', transform: 'rotate(-2deg)',
      backgroundImage: 'repeating-linear-gradient(180deg, transparent 0 51px, #c9d6ea 51px 53px)', backgroundPosition: '0 90px' }}>
      <div style={{ position: 'absolute', left: 78, top: 0, bottom: 0, width: 3, background: '#e7a3a3' }} />
      <div style={{ position: 'absolute', left: 100, top: 22, fontFamily: hand, fontSize: 58, fontWeight: 700, color: PEN }}>{title}</div>
      {rows.map((r, k) => {
        const w = interpolate(f, [6 + k * rowDelay, 14 + k * rowDelay], [0, 100], clamp);
        return (
          <div key={k} style={{ position: 'absolute', left: 100, right: 30, top: 100 + k * 53, height: 50, display: 'flex', alignItems: 'center', fontFamily: hand, fontSize: 40, fontWeight: 600, color: PEN, clipPath: `inset(0 ${100 - w}% 0 0)` }}>{r}</div>
        );
      })}
    </div>
  );
};
const Bubble: React.FC<{ delay: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ delay, children, style }) => {
  const p = useSpring(delay, 10);
  const f = useCurrentFrame();
  return (
    <div style={{ position: 'absolute', transform: `scale(${p}) rotate(${Math.sin(f / 6) * 2}deg)`, background: '#fff', border: `4px solid ${RED}`, color: RED, borderRadius: 22, padding: '12px 26px', fontSize: 40, fontWeight: 800, boxShadow: '0 16px 30px rgba(120,30,20,.18)', whiteSpace: 'nowrap', ...style }}>{children}</div>
  );
};

const PhoneRing: React.FC<{ hi: boolean }> = ({ hi }) => {
  const f = useCurrentFrame();
  const n = Math.min(12, 1 + Math.floor(Math.max(0, f - 20) / 9));
  const p = useSpring(18, 11);
  return (
    <div style={{ position: 'absolute', right: 10, bottom: 30, transform: `scale(${p})`, display: 'flex', alignItems: 'center', gap: 14, background: '#fff', borderRadius: 20, padding: '14px 22px', boxShadow: '0 16px 30px rgba(0,0,0,.15)' }}>
      <div style={{ transform: `rotate(${Math.sin(f * 1.4) * 14}deg)` }}>
        <svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
        </svg>
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color: INK }}>{hi ? `Call ${n}/12…` : `Calling ${n}/12…`}</div>
    </div>
  );
};

export const Before: React.FC<{ k: number }> = ({ k }) => {
  const hi = useLang() === 'hi';
  const f = useCurrentFrame();
  if (k === 0) {
    const names = ['Aarav', 'Diya', 'Kabir', 'Meera', 'Rohan', 'Sana'];
    return (
      <div style={{ position: 'relative' }}>
        <Page title="Attendance – Nov" rows={names.map((n, i) => <><span style={{ width: 260 }}>{n}</span><span style={{ color: i === 2 || i === 4 ? RED : PEN }}>{i === 2 || i === 4 ? 'A' : 'P'}</span><span style={{ marginLeft: 40, opacity: .5 }}>P P A P</span></>)} />
        <PhoneRing hi={hi} />
      </div>
    );
  }
  if (k === 1) {
    const rows = [['Rohit', '₹3000 ✓'], ['Meera', '₹2000 ?'], ['Kabir', '₹ ? ? ?'], ['Diya', '₹1500'], ['Aarav', '— —']];
    return (
      <div style={{ position: 'relative' }}>
        <Page title="Fees Register" rows={rows.map(([n, a], i) => <><span style={{ width: 260 }}>{n}</span><span style={{ textDecoration: i === 2 || i === 4 ? 'line-through' : 'none', color: i === 1 || i === 2 ? RED : PEN }}>{a}</span></>)} />
        <Bubble delay={42} style={{ right: -10, top: 40 }}>{hi ? 'Kisne diya?' : 'Who paid?'}</Bubble>
      </div>
    );
  }
  if (k === 2) {
    const fall = interpolate(f, [50, 80], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
    return (
      <div style={{ position: 'relative' }}>
        <Page title="Inquiry Diary" rows={['Priya – Class 9 – 98xxx', 'Mr. Gupta – call back??', 'Sneha – JEE batch', '~~~~~~~~ (smudged)']} />
        <div style={{ position: 'absolute', right: 20, top: 120, width: 230, padding: 18, background: '#ffe766', fontFamily: hand, fontSize: 38, fontWeight: 700, color: PEN, boxShadow: '0 12px 20px rgba(0,0,0,.18)',
          transform: `translateY(${fall * 500}px) rotate(${6 + fall * 50}deg)`, opacity: 1 - fall }}>
          {hi ? 'Sunday ko call karna!' : 'Call back Sunday!'}
        </div>
        <Bubble delay={70} style={{ right: 0, top: 380 }}>{hi ? 'Follow-up miss!' : 'Follow-up missed!'}</Bubble>
      </div>
    );
  }
  const shake = f < 20 ? Math.sin(f * 1.6) * 7 : 0;
  const fall = interpolate(f, [20, 44], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  return (
    <div style={{ position: 'relative', width: 640, height: 520, display: 'grid', placeItems: 'center' }}>
      <div style={{ position: 'absolute', width: 300, height: 390, border: '6px dashed #b9a682', borderRadius: 18, opacity: fall, display: 'grid', placeItems: 'center', fontSize: 200, fontWeight: 800, color: RED }}>?</div>
      <div style={{ position: 'absolute', transform: `translate(${shake + fall * 300}px, ${fall * 800}px) rotate(${fall * 70}deg)` }}>
        <Register title="REGISTER" color="#2e5c8a" />
      </div>
      <Bubble delay={46} style={{ bottom: 0 }}>{hi ? 'Sab kuch gaya!' : 'Everything gone!'}</Bubble>
    </div>
  );
};

/* ───── real screen for the "after" side ───── */
const AW = 880;
const AH = 550;
const After: React.FC<{ topic: Topic; play: boolean; dur: number }> = ({ topic, play, dur }) => {
  const f = useCurrentFrame();
  const rate = Math.max(1, (topic.to - topic.from) / (dur / FPS));
  const t = play ? topic.from + (f / FPS) * rate : topic.from;
  const times = topic.keys.map((k) => k[0]);
  const at = (i: number) => interpolate(t, times, topic.keys.map((k) => k[i]), { ...clamp, easing: ease });
  const s = at(3);
  const tx = Math.min(0, Math.max(AW - AW * s, AW / 2 - at(1) * AW * s));
  const ty = Math.min(0, Math.max(AH - AH * s, AH / 2 - at(2) * AH * s));
  return (
    <div style={{ width: AW, borderRadius: 16, overflow: 'hidden', background: '#fff', boxShadow: '0 30px 70px rgba(10,30,60,.35)' }}>
      <div style={{ height: 30, background: '#eef1f6', display: 'flex', alignItems: 'center', gap: 7, padding: '0 14px', borderBottom: '1px solid #dde2ea' }}>
        {['#ff5f57', '#febc2e', '#28c840'].map((c) => <span key={c} style={{ width: 11, height: 11, borderRadius: 6, background: c }} />)}
        <span style={{ marginLeft: 12, fontSize: 14, color: '#5c6475', fontWeight: 600 }}>EduBuddy</span>
        {play && rate > 1.15 && <span style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 800, color: BRAND }}>▶▶ {rate.toFixed(1)}×</span>}
      </div>
      <div style={{ width: AW, height: AH, overflow: 'hidden' }}>
        <div style={{ width: AW, height: AH, transform: `translate(${tx}px, ${ty}px) scale(${s})`, transformOrigin: '0 0' }}>
          {play
            ? <OffthreadVideo src={staticFile(topic.file)} startFrom={Math.round(topic.from * FPS)} playbackRate={rate} muted style={{ width: AW, height: AH }} />
            : <Freeze frame={0}><OffthreadVideo src={staticFile(topic.file)} startFrom={Math.round(topic.from * FPS)} muted style={{ width: AW, height: AH }} /></Freeze>}
        </div>
      </div>
    </div>
  );
};

/* ───── one before/after pair ───── */
const Pair: React.FC<{ k: number; before: Line; after: Line }> = ({ k, before, after }) => {
  const lang = useLang();
  const f = useCurrentFrame();
  const switchAt = lineFrames(before);
  const afterDur = lineFrames(after);
  const flip = interpolate(f, [switchAt - 4, switchAt + 8], [0, 1], { ...clamp, easing: ease });
  const enter = useSpring(0, 200, 14);
  const topic = TOPICS[k];
  const label = (txt: string, color: string, on: number) => (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: color, color: '#fff', borderRadius: 999, padding: '10px 26px', fontSize: 30, fontWeight: 800, letterSpacing: 2, opacity: 0.45 + on * 0.55, transform: `scale(${0.92 + on * 0.08})` }}>{txt}</div>
  );
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ width: 960, background: PAPER }} />
      <AbsoluteFill style={{ left: 960, width: 960, background: 'linear-gradient(160deg,#e6f1fb,#f6f9fd 60%,#dfecf8)' }} />
      <div style={{ position: 'absolute', left: 958, top: 120, bottom: 150, width: 4, borderRadius: 2, background: 'rgba(0,0,0,.08)' }} />

      <div style={{ position: 'absolute', top: 40, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: enter }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#fff', borderRadius: 999, padding: '10px 30px 10px 10px', boxShadow: '0 10px 30px rgba(0,0,0,.12)', fontSize: 38, fontWeight: 800, color: INK }}>
          <span style={{ width: 50, height: 50, borderRadius: 25, background: NAVY, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 26 }}>{k + 1}</span>
          {topic.name[lang]}
        </div>
      </div>

      {/* before */}
      <div style={{ position: 'absolute', left: 0, width: 960, top: 150, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {label(lang === 'hi' ? 'PEHLE' : 'BEFORE', RED, 1 - flip)}
        <div style={{ marginTop: 34, opacity: 1 - flip * 0.5, filter: `grayscale(${flip})`, transform: `scale(${1 - flip * 0.05})`, position: 'relative' }}>
          <Before k={k} />
          <div style={{ position: 'absolute', left: '50%', top: '50%', width: 130, height: 130, marginLeft: -65, marginTop: -65, borderRadius: 65, background: RED, color: '#fff', display: 'grid', placeItems: 'center', opacity: flip, transform: `scale(${flip})`, boxShadow: '0 14px 30px rgba(150,30,20,.4)' }}>
            <Cross size={80} />
          </div>
        </div>
      </div>

      {/* after */}
      <div style={{ position: 'absolute', left: 960, width: 960, top: 150, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {label(lang === 'hi' ? 'AB · EDUBUDDY' : 'AFTER · EDUBUDDY', BRAND, flip)}
        <div style={{ marginTop: 34, opacity: 0.4 + flip * 0.6, filter: `grayscale(${1 - flip})`, transform: `scale(${0.95 + flip * 0.05})`, position: 'relative' }}>
          <After topic={topic} play={false} dur={afterDur} />
          <Sequence from={switchAt} layout="none">
            <div style={{ position: 'absolute', inset: 0 }}><After topic={topic} play dur={afterDur} /></div>
          </Sequence>
          <div style={{ position: 'absolute', right: -22, top: -22, width: 72, height: 72, borderRadius: 36, background: '#16a34a', color: '#fff', display: 'grid', placeItems: 'center', opacity: flip, transform: `scale(${flip})`, boxShadow: '0 10px 24px rgba(22,163,74,.4)' }}>
            <Check size={44} />
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
  const hi = useLang() === 'hi';
  const f = useCurrentFrame();
  const l = interpolate(f, [0, 14], [-960, 0], { ...clamp, easing: ease });
  const r = interpolate(f, [22, 36], [960, 0], { ...clamp, easing: ease });
  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 960, height: 1080, background: PAPER, transform: `translateX(${l}px)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 40 }}>
        <div style={{ display: 'flex', gap: 20, transform: 'rotate(-4deg) scale(.55)', height: 240, alignItems: 'center' }}>
          <Register title="ATTENDANCE" color="#9b3d2e" /><Register title="FEES" color="#2e5c8a" />
        </div>
        <div style={{ fontSize: 76, fontWeight: 800, color: RED, textAlign: 'center', lineHeight: 1.1 }}>{hi ? 'EduBuddy se pehle' : 'Before EduBuddy'}</div>
      </div>
      <div style={{ position: 'absolute', left: 960, top: 0, width: 960, height: 1080, background: `radial-gradient(circle at 50% 40%, #0f5d9e, ${NAVY} 75%)`, transform: `translateX(${r}px)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 40 }}>
        <div style={{ height: 240, display: 'grid', placeItems: 'center' }}><Logo size={170} /></div>
        <div style={{ fontSize: 76, fontWeight: 800, color: '#fff', textAlign: 'center', lineHeight: 1.1 }}>{hi ? 'EduBuddy ke baad' : 'After EduBuddy'}</div>
      </div>
      <Voice line={line} at={INTRO_LEAD} />
    </AbsoluteFill>
  );
};

const Outro: React.FC<{ line: Line }> = ({ line }) => {
  const hi = useLang() === 'hi';
  const p = useSpring(0, 11);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 40%, #0f5d9e, ${NAVY} 70%)`, alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ transform: `scale(${p})` }}><Logo size={140} /></div>
      <Pop delay={6}><div style={{ fontSize: 120, fontWeight: 800, color: '#fff', letterSpacing: -3, marginTop: 24 }}>EduBuddy</div></Pop>
      <Pop delay={14}><div style={{ fontSize: 48, color: '#cfe7f8', fontWeight: 600 }}>{hi ? 'Register chhodo, institute chalao.' : 'Drop the register. Run your institute.'}</div></Pop>
      <Pop delay={24}><div style={{ marginTop: 46, background: '#fff', color: NAVY, borderRadius: 999, padding: '24px 60px', fontSize: 42, fontWeight: 800 }}>{hi ? 'Free demo book karein →' : 'Book a free demo →'}</div></Pop>
      <Voice line={line} at={0} />
    </AbsoluteFill>
  );
};

/* ───── timeline ───── */
export const BeforeAfter: React.FC<{ lang?: BLang }> = ({ lang = 'hi' }) => {
  const s = TIM[lang].scenes;
  const frames = baFrames(lang);
  const f = useCurrentFrame();
  const total = frames.reduce((a, b) => a + b, 0);
  const starts = frames.map((_, i) => frames.slice(0, i).reduce((a, b) => a + b, 0));
  return (
    <LangCtx.Provider value={lang}>
      <AbsoluteFill style={{ fontFamily, background: PAPER }}>
        <Sequence from={starts[0]} durationInFrames={frames[0]}><Intro line={s[0]} /></Sequence>
        {[0, 1, 2, 3].map((k) => (
          <Sequence key={k} from={starts[k + 1]} durationInFrames={frames[k + 1]}>
            <Pair k={k} before={s[1 + k * 2]} after={s[2 + k * 2]} />
          </Sequence>
        ))}
        <Sequence from={starts[5]} durationInFrames={frames[5]}><Outro line={s[9]} /></Sequence>
        <div style={{ position: 'absolute', left: 0, bottom: 0, height: 6, width: `${(f / total) * 100}%`, background: BRAND }} />
      </AbsoluteFill>
    </LangCtx.Provider>
  );
};
