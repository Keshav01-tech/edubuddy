// "Register lost" story video: the old paper-register problem, then real EduBuddy screens.
// Compositions: story-hi (Hinglish) and story-en (English), 1920x1080.
// Screens come from ../capture/record-screens.mjs, voice from tts.py (story-hinglish.txt / story-en.txt).
import React from 'react';
import { AbsoluteFill, Audio, Easing, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/PlusJakartaSans';
import hiT from './timings-story-hi.json';
import enT from './timings-story-en.json';
import { Check } from './ui';

const { fontFamily } = loadFont('normal', { weights: ['400', '500', '600', '700', '800'], subsets: ['latin'] });

export type SLang = 'hi' | 'en';
const FPS = 30;
const LEAD = 5;
const TAIL = 16;
const RMAX = 2.2; // fastest the screen clips are played
const BRAND = '#005a9c';
const NAVY = '#1b365d';
const INK = '#15171f';
const MUTED = '#5c6475';
const RED = '#d93636';
const PAPER = '#f4efe4';
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ease = Easing.bezier(0.45, 0, 0.2, 1);
const TIM = { hi: hiT, en: enT };
const Lang = React.createContext<SLang>('hi');
const useLang = () => React.useContext(Lang);

/* ───── screen clips: length (s), where to start, and zoom keys [clip second, focusX, focusY, scale] ───── */
type Clip = { file: string; length: number; from: number; keys: [number, number, number, number][]; label: Record<SLang, string> };
const CLIPS: Record<number, Clip> = {
  4: { file: 'screens/dashboard.mp4', length: 16.2, from: 1.2, label: { hi: 'Dashboard', en: 'Dashboard' },
    keys: [[0, 0.74, 0.42, 1.55], [7.2, 0.74, 0.42, 1.55], [8.4, 0.5, 0.5, 1], [10.5, 0.42, 0.42, 1.12], [13, 0.5, 0.55, 1.08], [16.2, 0.5, 0.5, 1]] },
  5: { file: 'screens/attendance.mp4', length: 8.8, from: 0, label: { hi: 'Attendance', en: 'Attendance' },
    keys: [[0, 0.5, 0.5, 1], [1.2, 0.5, 0.58, 1.18], [4.6, 0.5, 0.58, 1.18], [5.8, 0.58, 0.3, 1.32], [8.8, 0.58, 0.3, 1.32]] },
  6: { file: 'screens/fees.mp4', length: 12.77, from: 0.3, label: { hi: 'Fees & receipt', en: 'Fees & receipts' },
    keys: [[0, 0.55, 0.28, 1.25], [2.6, 0.55, 0.28, 1.25], [3.8, 0.5, 0.5, 1.55], [7.4, 0.5, 0.5, 1.55], [8.4, 0.5, 0.53, 1.38], [12.77, 0.5, 0.53, 1.38]] },
  7: { file: 'screens/students.mp4', length: 7.23, from: 0, label: { hi: 'Students', en: 'Students' },
    keys: [[0, 0.5, 0.5, 1], [1.3, 0.5, 0.36, 1.22], [7.23, 0.5, 0.42, 1.22]] },
  8: { file: 'screens/leads.mp4', length: 17.33, from: 0, label: { hi: 'Inquiries', en: 'Inquiries' },
    keys: [[0, 0.5, 0.45, 1.1], [3, 0.5, 0.45, 1.1], [4.2, 0.5, 0.5, 1.5], [17.33, 0.5, 0.5, 1.5]] },
};

const voiceFrames = (s: number) => LEAD + Math.ceil(s * FPS) + TAIL;
export const storyFrames = (lang: SLang) =>
  TIM[lang].scenes.map((s, i) => {
    const v = voiceFrames(s.seconds) + (i === 10 ? 45 : 0);
    const c = CLIPS[i];
    return c ? Math.max(v, Math.ceil(((c.length - c.from) / RMAX) * FPS)) : v;
  });

/* ───── small helpers ───── */
const useSpring = (delay = 0, damping = 14, dur?: number) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - delay, fps, config: { damping }, durationInFrames: dur });
};
const Pop: React.FC<{ delay?: number; children: React.ReactNode; style?: React.CSSProperties; y?: number }> = ({ delay = 0, children, style, y = 30 }) => {
  const p = useSpring(delay, 200, 18);
  return <div style={{ opacity: p, transform: `translateY(${(1 - p) * y}px)`, ...style }}>{children}</div>;
};

export const Register: React.FC<{ color: string; title: string; w?: number }> = ({ color, title, w = 300 }) => (
  <div style={{ width: w, height: w * 1.3, borderRadius: '10px 18px 18px 10px', background: color, position: 'relative', boxShadow: '0 30px 50px rgba(60,40,10,.25), inset 14px 0 0 rgba(0,0,0,.18)' }}>
    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 26, background: 'repeating-linear-gradient(180deg, rgba(255,255,255,.25) 0 6px, transparent 6px 22px)' }} />
    <div style={{ position: 'absolute', left: 48, right: 26, top: 60, background: '#fffaf0', borderRadius: 8, padding: '18px 16px', textAlign: 'center', fontWeight: 800, fontSize: w * 0.085, color: '#3a2f1e', letterSpacing: 1, lineHeight: 1.15 }}>{title}</div>
    <div style={{ position: 'absolute', left: 60, right: 40, bottom: 50, height: 6, borderRadius: 3, background: 'rgba(255,255,255,.35)' }} />
    <div style={{ position: 'absolute', left: 60, right: 90, bottom: 30, height: 6, borderRadius: 3, background: 'rgba(255,255,255,.25)' }} />
  </div>
);

const Caption: React.FC<{ text: string; dark?: boolean }> = ({ text, dark }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [LEAD - 2, LEAD + 6], [0, 1], clamp);
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 38, display: 'flex', justifyContent: 'center', opacity: o, transform: `translateY(${(1 - o) * 12}px)` }}>
      <div style={{ maxWidth: 1500, background: dark ? 'rgba(255,255,255,.12)' : 'rgba(17,22,36,.88)', color: '#fff', borderRadius: 18, padding: '14px 30px', fontSize: 34, fontWeight: 600, lineHeight: 1.3, textAlign: 'center', backdropFilter: 'blur(6px)' }}>{text}</div>
    </div>
  );
};

/* ───── 0: the old way ───── */
const OldWay: React.FC = () => {
  const hi = useLang() === 'hi';
  const books = hi
    ? [['ATTENDANCE REGISTER', '#9b3d2e'], ['FEES REGISTER', '#2e5c8a'], ['ADMISSION DIARY', '#3f6b3a']]
    : [['ATTENDANCE REGISTER', '#9b3d2e'], ['FEES REGISTER', '#2e5c8a'], ['ADMISSIONS DIARY', '#3f6b3a']];
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', paddingBottom: 90 }}>
      <Pop><div style={{ fontSize: 30, fontWeight: 700, letterSpacing: 6, color: '#8a7652', textAlign: 'center' }}>{hi ? 'PURANA TAREEKA' : 'THE OLD WAY'}</div></Pop>
      <div style={{ display: 'flex', gap: 70, marginTop: 50 }}>
        {books.map(([t, c], k) => {
          const p = useSpring(8 + k * 9, 11);
          const rot = [-6, 2, 7][k] + Math.sin((f + k * 20) / 22) * 0.8;
          return (
            <div key={t} style={{ transform: `translateY(${(1 - p) * -700}px) rotate(${rot}deg)` }}>
              <Register title={t} color={c} />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ───── 1: register lost ───── */
const Lost: React.FC = () => {
  const hi = useLang() === 'hi';
  const f = useCurrentFrame();
  const shake = f < 22 ? Math.sin(f * 1.6) * 7 : 0;
  const fall = interpolate(f, [22, 46], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const q = useSpring(44, 9);
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', paddingBottom: 90 }}>
      <div style={{ position: 'relative', width: 330, height: 430 }}>
        <div style={{ position: 'absolute', inset: 0, border: '6px dashed #b9a682', borderRadius: 18, opacity: fall, display: 'grid', placeItems: 'center' }}>
          <div style={{ fontSize: 230, fontWeight: 800, color: RED, transform: `scale(${q}) rotate(${Math.sin(f / 7) * 5}deg)` }}>?</div>
        </div>
        <div style={{ position: 'absolute', left: 15, top: 0, transform: `translate(${shake + fall * 380}px, ${fall * 900}px) rotate(${fall * 70}deg)`, opacity: 1 - fall * 0.4 }}>
          <Register title="FEES REGISTER" color="#2e5c8a" />
        </div>
      </div>
      <Pop delay={48}><div style={{ marginTop: 36, fontSize: 64, fontWeight: 800, color: RED }}>{hi ? 'Register gum!' : 'Register lost!'}</div></Pop>
    </AbsoluteFill>
  );
};

/* ───── 2: headache ───── */
const Headache: React.FC = () => {
  const hi = useLang() === 'hi';
  const f = useCurrentFrame();
  const qs = hi
    ? ['Kisne fees di?', 'Kaun absent tha?', 'Kitni fees baaki?', 'Parent ka number?', 'Follow-up kab tha?', 'Receipt kahan hai?']
    : ['Who paid?', 'Who was absent?', 'How much is due?', "Parent's number?", 'When to follow up?', 'Where is the receipt?'];
  const spots = [[-560, -250], [520, -270], [-640, 40], [600, 30], [-470, 280], [470, 290]];
  const pulse = 1 + Math.sin(f / 4) * 0.06;
  const shake = f > 60 ? Math.sin(f * 2.1) * 2.5 : 0;
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', paddingBottom: 90, transform: `translateX(${shake}px)` }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, transparent 35%, rgba(217,54,54,${interpolate(f, [0, 90], [0, 0.18], clamp)}) 100%)` }} />
      <div style={{ position: 'relative', transform: `scale(${pulse})` }}>
        <svg width="300" height="300" viewBox="0 0 300 300">
          <circle cx="150" cy="160" r="110" fill="#ffd9a8" stroke="#3a2f1e" strokeWidth="8" />
          <path d="M95 128 L130 140 M205 128 L170 140" stroke="#3a2f1e" strokeWidth="9" strokeLinecap="round" />
          <circle cx="115" cy="165" r="10" fill="#3a2f1e" /><circle cx="185" cy="165" r="10" fill="#3a2f1e" />
          <path d="M105 225 q15 -18 30 0 t30 0 t30 0" fill="none" stroke="#3a2f1e" strokeWidth="8" strokeLinecap="round" />
          {[[40, 40], [250, 35], [20, 120], [280, 115]].map(([x, y], k) => (
            <path key={k} d={`M${x} ${y} l14 -18 l6 16 l16 -14`} fill="none" stroke={RED} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" opacity={0.5 + 0.5 * Math.sin(f / 3 + k)} />
          ))}
        </svg>
      </div>
      {qs.map((t, k) => {
        const p = useSpring(6 + k * 10, 10);
        const [x, y] = spots[k];
        return (
          <div key={t} style={{ position: 'absolute', left: '50%', top: '46%', transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y + Math.sin((f + k * 13) / 15) * 8}px)) scale(${p})`,
            background: '#fff', border: `3px solid ${k % 2 ? RED : '#e7b9b9'}`, color: INK, borderRadius: 22, padding: '16px 28px', fontSize: 38, fontWeight: 700, boxShadow: '0 16px 30px rgba(80,20,20,.12)', whiteSpace: 'nowrap' }}>{t}</div>
        );
      })}
    </AbsoluteFill>
  );
};

/* ───── 3: EduBuddy reveal ───── */
export const Logo: React.FC<{ size?: number }> = ({ size = 150 }) => (
  <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg,#8fd3f4,#4aa8dc)', display: 'grid', placeItems: 'center', boxShadow: '0 20px 50px rgba(0,90,156,.35)' }}>
    <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10 12 5 2 10l10 5 10-5Z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  </div>
);
const Reveal: React.FC = () => {
  const hi = useLang() === 'hi';
  const f = useCurrentFrame();
  const r = interpolate(f, [0, 22], [0, 150], { ...clamp, easing: ease });
  const p = useSpring(10, 11);
  return (
    <AbsoluteFill style={{ clipPath: `circle(${r}% at 50% 50%)`, background: `radial-gradient(circle at 50% 40%, #0f5d9e, ${NAVY} 70%)`, alignItems: 'center', justifyContent: 'center', paddingBottom: 90 }}>
      <div style={{ transform: `scale(${p})` }}><Logo size={170} /></div>
      <Pop delay={16}><div style={{ fontSize: 130, fontWeight: 800, color: '#fff', letterSpacing: -3, marginTop: 30 }}>EduBuddy</div></Pop>
      <Pop delay={26}><div style={{ fontSize: 40, color: '#bfe0f7', fontWeight: 500 }}>{hi ? 'Institute ka poora hisaab, ek app mein.' : 'Your whole institute, in one app.'}</div></Pop>
    </AbsoluteFill>
  );
};

/* ───── 4–8: real screens ───── */
const VW = 1520;
const VH = 950;
const Screen: React.FC<{ i: number; dur: number; n: number }> = ({ i, dur, n }) => {
  const lang = useLang();
  const clip = CLIPS[i];
  const f = useCurrentFrame();
  const rate = Math.max(1, (clip.length - clip.from) / (dur / FPS));
  const t = clip.from + (f / FPS) * rate;
  const ks = clip.keys;
  const times = ks.map((k) => k[0]);
  const at = (idx: number) => interpolate(t, times, ks.map((k) => k[idx]), { ...clamp, easing: ease });
  const s = at(3);
  const tx = Math.min(0, Math.max(VW - VW * s, VW / 2 - at(1) * VW * s));
  const ty = Math.min(0, Math.max(VH - VH * s, VH / 2 - at(2) * VH * s));
  const enter = useSpring(0, 200, 16);
  return (
    <AbsoluteFill style={{ alignItems: 'center', paddingTop: 34 }}>
      <div style={{ width: VW, borderRadius: 18, overflow: 'hidden', background: '#fff', boxShadow: '0 40px 90px rgba(10,30,60,.35)', transform: `scale(${0.94 + enter * 0.06})`, opacity: enter }}>
        <div style={{ height: 34, background: '#eef1f6', display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', borderBottom: '1px solid #dde2ea' }}>
          {['#ff5f57', '#febc2e', '#28c840'].map((c) => <span key={c} style={{ width: 12, height: 12, borderRadius: 6, background: c }} />)}
          <div style={{ marginLeft: 18, height: 22, flex: 0.5, borderRadius: 11, background: '#fff', fontSize: 14, color: MUTED, display: 'flex', alignItems: 'center', paddingLeft: 14 }}>EduBuddy · KMC Classes</div>
        </div>
        <div style={{ width: VW, height: VH, overflow: 'hidden', position: 'relative' }}>
          <div style={{ width: VW, height: VH, transform: `translate(${tx}px, ${ty}px) scale(${s})`, transformOrigin: '0 0' }}>
            <OffthreadVideo src={staticFile(clip.file)} startFrom={Math.round(clip.from * FPS)} playbackRate={rate} muted style={{ width: VW, height: VH }} />
          </div>
        </div>
      </div>
      <Pop delay={4} style={{ position: 'absolute', left: 120, top: 70 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: BRAND, color: '#fff', borderRadius: 999, padding: '10px 26px 10px 10px', fontSize: 30, fontWeight: 700, boxShadow: '0 12px 30px rgba(0,90,156,.4)' }}>
          <span style={{ width: 42, height: 42, borderRadius: 21, background: '#fff', color: BRAND, display: 'grid', placeItems: 'center', fontSize: 24, fontWeight: 800 }}>{n}</span>
          {clip.label[lang]}
        </div>
      </Pop>
      {rate > 1.15 && (
        <div style={{ position: 'absolute', right: 120, top: 76, background: 'rgba(17,22,36,.75)', color: '#fff', borderRadius: 999, padding: '8px 18px', fontSize: 22, fontWeight: 700, opacity: enter }}>
          ▶▶ {rate.toFixed(1)}×
        </div>
      )}
    </AbsoluteFill>
  );
};

/* ───── 9: safe in the cloud ───── */
const Cloud: React.FC = () => {
  const hi = useLang() === 'hi';
  const f = useCurrentFrame();
  const cross = interpolate(f, [18, 30], [0, 1], clamp);
  const arrow = interpolate(f, [30, 50], [0, 1], { ...clamp, easing: ease });
  const c = useSpring(46, 10);
  const tick = useSpring(62, 9);
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', paddingBottom: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 70 }}>
        <div style={{ position: 'relative', opacity: 1 - cross * 0.45, transform: 'scale(.75)' }}>
          <Register title="REGISTER" color="#8a6a3c" />
          <svg width="300" height="390" viewBox="0 0 300 390" style={{ position: 'absolute', inset: 0 }}>
            <path d={`M30 40 L${30 + 240 * cross} ${40 + 310 * cross}`} stroke={RED} strokeWidth="18" strokeLinecap="round" />
            <path d={`M270 40 L${270 - 240 * cross} ${40 + 310 * cross}`} stroke={RED} strokeWidth="18" strokeLinecap="round" opacity={cross > 0 ? 1 : 0} />
          </svg>
        </div>
        <svg width="220" height="40" viewBox="0 0 220 40">
          <path d={`M0 20 H${200 * arrow}`} stroke={BRAND} strokeWidth="8" strokeLinecap="round" strokeDasharray="2 18" />
          {arrow > 0.95 && <path d="M190 4 L212 20 L190 36" fill="none" stroke={BRAND} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />}
        </svg>
        <div style={{ position: 'relative', transform: `scale(${c})` }}>
          <svg width="420" height="290" viewBox="0 0 420 290">
            <path d="M110 260 a90 90 0 0 1 -6 -180 a120 120 0 0 1 224 30 a75 75 0 0 1 -8 150 Z" fill="#e6f2fb" stroke={BRAND} strokeWidth="10" strokeLinejoin="round" />
          </svg>
          <div style={{ position: 'absolute', left: '50%', top: '57%', transform: `translate(-50%,-50%) scale(${tick})`, width: 110, height: 110, borderRadius: 55, background: '#16a34a', display: 'grid', placeItems: 'center', boxShadow: '0 14px 30px rgba(22,163,74,.4)' }}>
            <Check size={66} color="#fff" />
          </div>
        </div>
      </div>
      <Pop delay={70}>
        <div style={{ marginTop: 40, display: 'flex', alignItems: 'center', gap: 14, fontSize: 56, fontWeight: 800, color: INK }}>
          {hi ? 'Data hamesha safe. Har device pe.' : 'Always safe. On every device.'}
        </div>
      </Pop>
    </AbsoluteFill>
  );
};

/* ───── 10: outro ───── */
const Outro: React.FC = () => {
  const hi = useLang() === 'hi';
  const p = useSpring(0, 11);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 40%, #0f5d9e, ${NAVY} 70%)`, alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ transform: `scale(${p})` }}><Logo size={140} /></div>
      <Pop delay={8}><div style={{ fontSize: 120, fontWeight: 800, color: '#fff', letterSpacing: -3, marginTop: 26 }}>EduBuddy</div></Pop>
      <Pop delay={18}><div style={{ fontSize: 52, color: '#cfe7f8', fontWeight: 600 }}>{hi ? 'Register chhodo, institute chalao.' : 'Drop the register. Run your institute.'}</div></Pop>
      <Pop delay={30}>
        <div style={{ marginTop: 34, display: 'flex', gap: 18, justifyContent: 'center', fontSize: 28, color: '#9fc9e8', fontWeight: 600 }}>
          {(hi ? ['Attendance', 'Fees', 'Students', 'Inquiries', 'AI Test Papers'] : ['Attendance', 'Fees', 'Students', 'Inquiries', 'AI test papers']).map((x) => (
            <span key={x} style={{ border: '2px solid rgba(255,255,255,.2)', borderRadius: 999, padding: '8px 20px' }}>{x}</span>
          ))}
        </div>
      </Pop>
      <Pop delay={44}><div style={{ marginTop: 50, background: '#fff', color: NAVY, borderRadius: 999, padding: '24px 60px', fontSize: 42, fontWeight: 800, boxShadow: '0 20px 40px rgba(0,0,0,.25)' }}>{hi ? 'Free demo book karein →' : 'Book a free demo →'}</div></Pop>
    </AbsoluteFill>
  );
};

/* ───── timeline ───── */
const Fade: React.FC<{ dur: number; children: React.ReactNode; inF?: number }> = ({ dur, children, inF = 7 }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ opacity: interpolate(f, [0, Math.max(1, inF), dur - 7, dur], [inF ? 0 : 1, 1, 1, 0], clamp) }}>{children}</AbsoluteFill>;
};
const bgFor = (i: number) => (i <= 2 ? PAPER : i === 3 || i === 10 ? NAVY : 'linear-gradient(160deg,#eaf3fb 0%,#f7f9fc 55%,#e3eef8 100%)');

export const Story: React.FC<{ lang?: SLang }> = ({ lang = 'hi' }) => {
  const frames = storyFrames(lang);
  const scenes = TIM[lang].scenes;
  const f = useCurrentFrame();
  const total = frames.reduce((a, b) => a + b, 0);
  let from = 0;
  return (
    <Lang.Provider value={lang}>
      <AbsoluteFill style={{ fontFamily, background: PAPER }}>
        {scenes.map((s, i) => {
          const start = from;
          from += frames[i];
          const dur = frames[i];
          const body =
            i === 0 ? <OldWay /> : i === 1 ? <Lost /> : i === 2 ? <Headache /> : i === 3 ? <Reveal /> :
            CLIPS[i] ? <Screen i={i} dur={dur} n={i - 3} /> : i === 9 ? <Cloud /> : <Outro />;
          return (
            <Sequence key={i} from={start} durationInFrames={dur}>
              <AbsoluteFill style={{ background: bgFor(i) }} />
              <Fade dur={dur} inF={i === 3 ? 0 : 7}>{body}</Fade>
              {i < 10 && <Caption text={s.text} dark={i === 3} />}
              <Sequence from={LEAD}><Audio src={staticFile(s.file)} /></Sequence>
            </Sequence>
          );
        })}
        <div style={{ position: 'absolute', left: 0, bottom: 0, height: 6, width: `${(f / total) * 100}%`, background: BRAND }} />
      </AbsoluteFill>
    </Lang.Provider>
  );
};
