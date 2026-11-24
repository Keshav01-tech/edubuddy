// Vertical 9:16 "Manual work vs EduBuddy" (~32s), phone view of the app.
// Compositions: manual-vertical-hi / manual-vertical-en, 1080x1920.
// Voice: tts.py manual-hinglish.txt mv-hi / manual-en.txt mv-en, then trim_silence.py mv-hi mv-en.
// Topics 1, 2 and 4 use real phone clips (screens/m-*.mp4). Topic 3, the AI fee-calling agent, is an animated
// screen drawn in the app's style (the feature is not built in the app yet).
import React from 'react';
import { AbsoluteFill, Easing, Freeze, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/PlusJakartaSans';
import { loadFont as loadHand } from '@remotion/google-fonts/Caveat';
import hiT from './timings-mv-hi.json';
import enT from './timings-mv-en.json';
import { Check, Cross } from './ui';
import { Logo } from './Story';
import { BLang, LangCtx, Line, Voice, lineFrames, speech } from './BeforeAfter';

const { fontFamily } = loadFont('normal', { weights: ['400', '500', '600', '700', '800'], subsets: ['latin'] });
const { fontFamily: hand } = loadHand('normal', { weights: ['600', '700'], subsets: ['latin'] });

const TIM = { hi: hiT as { scenes: Line[] }, en: enT as { scenes: Line[] } };
const FPS = 30;
const INTRO_LEAD = 6;
const OUTRO_HOLD = 36;
const AI_HOLD = 40; // extra time so the AI call screen can play out
const RMAX = 3.2;
const BRAND = '#005a9c';
const NAVY = '#1b365d';
const INK = '#15171f';
const MUTED = '#6b7280';
const RED = '#c9352b';
const GREEN = '#16a34a';
const DESK = '#efe8dc';
const PEN = '#23315e';
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ease = Easing.bezier(0.45, 0, 0.2, 1);
const useLang = () => React.useContext(LangCtx);

type Topic = { name: Record<BLang, string>; clip?: { file: string; from: number; to: number } };
const TOPICS: Topic[] = [
  { name: { hi: 'Attendance', en: 'Attendance' }, clip: { file: 'screens/m-attendance.mp4', from: 0.3, to: 8.0 } },
  { name: { hi: 'Fees & receipts', en: 'Fees & receipts' }, clip: { file: 'screens/m-fees.mp4', from: 0.3, to: 10.7 } },
  { name: { hi: 'AI fee calls', en: 'AI fee calls' } },
  { name: { hi: 'Inquiries', en: 'Inquiries' }, clip: { file: 'screens/m-leads.mp4', from: 1.6, to: 13.8 } },
];
const afterHold = (k: number) => (k === 2 ? AI_HOLD : 0);

export const mvFrames = (lang: BLang) => {
  const s = TIM[lang].scenes;
  return [INTRO_LEAD + lineFrames(s[0]), ...[0, 1, 2, 3].map((k) => lineFrames(s[1 + k * 2]) + lineFrames(s[2 + k * 2]) + afterHold(k)), speech(s[9]) + OUTRO_HOLD];
};

/* ───── helpers ───── */
const useSpring = (delay = 0, damping = 14, dur?: number) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - delay, fps, config: { damping }, durationInFrames: dur });
};
const Pop: React.FC<{ delay?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ delay = 0, children, style }) => {
  const p = useSpring(delay, 200, 14);
  return <div style={{ opacity: p, transform: `translateY(${(1 - p) * 20}px)`, ...style }}>{children}</div>;
};
const Caption: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ position: 'absolute', left: 40, right: 40, bottom: 70, display: 'flex', justifyContent: 'center' }}>
    <div style={{ background: 'rgba(17,22,36,.92)', color: '#fff', borderRadius: 22, padding: '18px 30px', fontSize: 40, fontWeight: 700, lineHeight: 1.3, textAlign: 'center' }}>{text}</div>
  </div>
);
const Icon: React.FC<{ d: React.ReactNode; size?: number; color?: string; sw?: number }> = ({ d, size = 40, color = 'currentColor', sw = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const PHONE_D = <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />;

/* Time-wasted stopwatch chip */
const Clock: React.FC<{ label: (n: number) => string; to: number; delay?: number }> = ({ label, to, delay = 10 }) => {
  const f = useCurrentFrame();
  const p = useSpring(delay, 12);
  const n = Math.round(interpolate(f, [delay, delay + 70], [0, to], clamp));
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 16, background: INK, color: '#fff', borderRadius: 999, padding: '14px 30px 14px 18px', fontSize: 42, fontWeight: 800, transform: `scale(${p})`, boxShadow: '0 16px 30px rgba(0,0,0,.25)' }}>
      <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#ffb020" strokeWidth="2.2" strokeLinecap="round">
        <circle cx="12" cy="13" r="8" /><path d="M10 2h4M12 5v1" />
        <path d={`M12 13 L${12 + 5 * Math.sin(f / 4)} ${13 - 5 * Math.cos(f / 4)}`} />
      </svg>
      {label(n)}
    </div>
  );
};
const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ background: '#fffdf7', borderRadius: 26, boxShadow: '0 24px 50px rgba(70,50,20,.18)', padding: 34, ...style }}>{children}</div>
);

/* ───── the four "manual" scenes (each ~860 wide) ───── */
export const Manual: React.FC<{ k: number }> = ({ k }) => {
  const hi = useLang() === 'hi';
  const f = useCurrentFrame();

  if (k === 0) {
    const names = ['Kabir ke papa', 'Rohan ki mummy', 'Sana ke papa', 'Ishita ki mummy', 'Parth ke papa'];
    const enNames = ["Kabir's father", "Rohan's mother", "Sana's father", "Ishita's mother", "Parth's father"];
    const at = Math.floor(Math.max(0, f - 6) / 14);
    const results = hi ? ['Busy', 'Utha nahi', 'Baad mein', 'Utha nahi', '…'] : ['Busy', 'No answer', 'Call later', 'No answer', '…'];
    return (
      <div style={{ width: 860, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34 }}>
        <Card style={{ width: 760, padding: '26px 34px' }}>
          {(hi ? names : enNames).map((n, i) => {
            const calling = i === at;
            const done = i < at;
            return (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '16px 0', borderBottom: i < 4 ? '2px dashed #e6dccb' : 'none' }}>
                <div style={{ width: 62, height: 62, borderRadius: 31, display: 'grid', placeItems: 'center', background: calling ? RED : '#efe6d6', transform: calling ? `rotate(${Math.sin(f * 1.5) * 14}deg)` : 'none' }}>
                  <Icon d={PHONE_D} size={32} color={calling ? '#fff' : '#9a8a6c'} />
                </div>
                <div style={{ flex: 1, fontFamily: hand, fontSize: 48, fontWeight: 700, color: PEN }}>{n}</div>
                <div style={{ fontSize: 30, fontWeight: 800, color: done ? RED : calling ? INK : '#b8ab92' }}>{done ? results[i] : calling ? (hi ? 'Call…' : 'Calling…') : ''}</div>
              </div>
            );
          })}
        </Card>
        <Clock delay={8} to={45} label={(n) => (hi ? `${n} min roz` : `${n} min a day`)} />
      </div>
    );
  }

  if (k === 1) {
    const sums = ['32600', '+31600', '+30600', '+29500', '= ?'];
    const shown = Math.min(sums.length, 1 + Math.floor(Math.max(0, f - 4) / 13));
    const pen = interpolate(f, [20, 80], [0, 100], clamp);
    return (
      <div style={{ width: 860, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34 }}>
        <div style={{ display: 'flex', gap: 30, alignItems: 'flex-start' }}>
          <div style={{ width: 330, background: '#2d3340', borderRadius: 30, padding: 24, boxShadow: '0 24px 50px rgba(0,0,0,.25)', transform: 'rotate(-4deg)' }}>
            <div style={{ background: '#c9d8b6', borderRadius: 12, padding: '14px 18px', fontFamily: 'monospace', fontSize: 36, color: '#26311c', textAlign: 'right', height: 64, overflow: 'hidden' }}>{sums[shown - 1]}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 20 }}>
              {['7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '−', '0', '.', '=', '+'].map((x, i) => {
                const pressed = (Math.floor(f / 5) % 16) === i;
                return <div key={x} style={{ height: 54, borderRadius: 12, background: pressed ? '#ffb020' : i % 4 === 3 ? '#4b5468' : '#3c4352', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 28, fontWeight: 700 }}>{x}</div>;
              })}
            </div>
          </div>
          <Card style={{ width: 430, padding: 26, transform: 'rotate(3deg)', marginTop: 40 }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#9a8a6c', letterSpacing: 3 }}>RECEIPT No. 147</div>
            <div style={{ clipPath: `inset(0 ${100 - pen}% 0 0)`, fontFamily: hand, fontSize: 44, fontWeight: 700, color: PEN, lineHeight: 1.35, marginTop: 10 }}>
              {hi ? 'Devansh Gupta se ₹10,000 mile. Fees — Nov' : 'Received ₹10,000 from Devansh Gupta. Fees — Nov'}
            </div>
            <div style={{ marginTop: 16, borderTop: '2px dashed #e6dccb', paddingTop: 10, fontFamily: hand, fontSize: 36, color: '#9a8a6c' }}>Sign: ________</div>
          </Card>
        </div>
        <Clock delay={8} to={3} label={(n) => (hi ? `${n} din har mahine` : `${n} days every month`)} />
      </div>
    );
  }

  if (k === 2) {
    const n = Math.min(52, 1 + Math.floor(Math.max(0, f - 6) / 4));
    const replies = hi ? ['Kal dunga', 'Not reachable', 'Busy hoon', 'Agle hafte'] : ['Tomorrow', 'Not reachable', "I'm busy", 'Next week'];
    const spots = [[-200, -280], [200, -210], [-215, 150], [205, 200]];
    return (
      <div style={{ width: 860, height: 760, position: 'relative', display: 'grid', placeItems: 'center' }}>
        <div style={{ width: 300, height: 300, borderRadius: 150, background: '#fff', boxShadow: '0 24px 50px rgba(70,50,20,.2)', display: 'grid', placeItems: 'center', transform: `rotate(${Math.sin(f * 1.4) * 6}deg)` }}>
          <div style={{ textAlign: 'center' }}>
            <Icon d={PHONE_D} size={90} color={RED} />
            <div style={{ fontSize: 46, fontWeight: 800, color: INK, marginTop: 8 }}>{hi ? 'Call' : 'Call'} {n}/52</div>
          </div>
        </div>
        {replies.map((r, i) => {
          const p = useSpring(10 + i * 11, 10);
          const [x, y] = spots[i];
          return (
            <div key={r} style={{ position: 'absolute', left: '50%', top: '50%', transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${p})`, background: '#fff', border: `4px solid ${RED}`, color: RED, borderRadius: 24, padding: '12px 26px', fontSize: 36, fontWeight: 800, whiteSpace: 'nowrap', boxShadow: '0 14px 26px rgba(120,30,20,.15)' }}>“{r}”</div>
          );
        })}
        <div style={{ position: 'absolute', bottom: -10 }}><Clock delay={6} to={7} label={(h) => (hi ? `${h} ghante phone pe` : `${h} hours on the phone`)} /></div>
      </div>
    );
  }

  const notes = hi
    ? [['Priya — Class 9', '#ffe766', -8], ['Mr. Gupta call back?', '#ffd0e1', 6], ['Sneha — JEE', '#c9f0d8', -4], ['Aman — Sunday?', '#cfe3ff', 9]]
    : [['Priya — Class 9', '#ffe766', -8], ['Mr. Gupta call back?', '#ffd0e1', 6], ['Sneha — JEE', '#c9f0d8', -4], ['Aman — Sunday?', '#cfe3ff', 9]];
  const pos = [[-200, -200], [190, -170], [-180, 120], [200, 140]];
  const bubble = useSpring(64, 10);
  return (
    <div style={{ width: 860, height: 760, position: 'relative' }}>
      {notes.map(([t, c, r], i) => {
        const p = useSpring(4 + i * 7, 12);
        const fall = i === 1 ? interpolate(f, [44, 72], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) }) : 0;
        const [x, y] = pos[i];
        return (
          <div key={String(t)} style={{ position: 'absolute', left: '50%', top: '50%', width: 330, height: 250, marginLeft: -165, marginTop: -125, background: String(c), boxShadow: '0 16px 24px rgba(0,0,0,.18)', padding: 26,
            fontFamily: hand, fontSize: 48, fontWeight: 700, color: PEN, lineHeight: 1.15, opacity: 1 - fall,
            transform: `translate(${x}px, ${y + fall * 700}px) rotate(${Number(r) + fall * 60}deg) scale(${p})` }}>{t}</div>
        );
      })}
      <div style={{ position: 'absolute', left: '50%', top: '50%', transform: `translate(-50%, 230px) scale(${bubble})`, background: '#fff', border: `5px solid ${RED}`, color: RED, borderRadius: 26, padding: '14px 32px', fontSize: 44, fontWeight: 800, whiteSpace: 'nowrap' }}>
        {hi ? 'Follow-up miss! Admission gaya.' : 'Follow-up missed! Admission lost.'}
      </div>
    </div>
  );
};

/* ───── AI fee-calling screen, drawn at phone size (390 css px wide) ───── */
const AI_STUDENTS = [
  { name: 'Devansh Gupta', due: '₹32,600' },
  { name: 'Aadhya Jain', due: '₹31,600' },
  { name: 'Anika Agarwal', due: '₹30,600' },
  { name: 'Yash Mittal', due: '₹29,500' },
  { name: 'Zoya Bhatt', due: '₹29,300' },
];
export const AiScreen: React.FC = () => {
  const hi = useLang() === 'hi';
  const f = useCurrentFrame();
  const called = Math.round(interpolate(f, [0, 120], [0, 18], clamp));
  const promised = interpolate(f, [10, 125], [0, 2.4], clamp);
  const paid = Math.round(interpolate(f, [40, 125], [0, 5], clamp));
  const progress = interpolate(f, [0, 125], [4, 35], clamp);
  const lines = hi
    ? [['ai', 'Namaste! KMC Classes se bol rahi hoon. Devansh ki ₹32,600 fees baaki hai.'], ['p', 'Haan ji, Friday tak de denge.'], ['ai', 'Dhanyavaad! UPI link WhatsApp pe bhej diya hai.']]
    : [['ai', "Hello! Calling from KMC Classes. Devansh's fee of ₹32,600 is pending."], ['p', "Yes, we'll pay by Friday."], ['ai', "Thank you! I've sent the UPI link on WhatsApp."]];
  const status = (i: number) => {
    const t = f - (i === 0 ? 0 : 20 + i * 18);
    if (t < 0) return ['Queued', '#eef0f4', MUTED];
    if (i === 0 ? f < 95 : t < 18) return [hi ? 'Calling…' : 'Calling…', '#e6f0fa', BRAND];
    return [[hi ? 'Friday tak' : 'Pays Friday', 'UPI paid ✓', hi ? 'Kal tak' : 'Pays tomorrow', 'UPI paid ✓', hi ? '6 PM call back' : 'Call back 6 PM'][i], i % 2 ? '#dcfce7' : '#e6f0fa', i % 2 ? GREEN : BRAND];
  };
  return (
    <div style={{ width: 390, height: 844, background: '#f4f6f9', fontFamily, color: INK, overflow: 'hidden' }}>
      <div style={{ height: 52, display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', background: '#fff', borderBottom: '1px solid #e8ebf0', marginTop: 0 }}>
        <span style={{ fontSize: 18, color: MUTED }}>☰</span>
        <span style={{ width: 22, height: 22, borderRadius: 6, background: INK, color: '#fff', fontSize: 12, fontWeight: 800, display: 'grid', placeItems: 'center' }}>E</span>
        <span style={{ fontSize: 15, fontWeight: 700 }}>AI fee calls</span>
        <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: RED, background: '#fdecec', borderRadius: 999, padding: '4px 9px' }}>
          <span style={{ width: 7, height: 7, borderRadius: 4, background: RED, opacity: 0.5 + 0.5 * Math.sin(f / 3) }} /> LIVE
        </span>
      </div>
      <div style={{ padding: 14 }}>
        <div style={{ background: NAVY, color: '#fff', borderRadius: 16, padding: 14 }}>
          <div style={{ fontSize: 12, opacity: 0.8 }}>{hi ? 'AI agent call kar raha hai' : 'AI agent is calling'}</div>
          <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>{hi ? '52 parents · fees pending' : '52 parents · fees pending'}</div>
          <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,.2)', marginTop: 10 }}>
            <div style={{ height: 6, borderRadius: 3, width: `${progress}%`, background: '#7cc4f2' }} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 10 }}>
          {[[hi ? 'Calls' : 'Called', String(called), INK], [hi ? 'Promised' : 'Promised', `₹${promised.toFixed(1)}L`, BRAND], [hi ? 'Paid now' : 'Paid now', String(paid), GREEN]].map(([l, v, c]) => (
            <div key={l} style={{ background: '#fff', borderRadius: 12, padding: '9px 10px', border: '1px solid #e8ebf0' }}>
              <div style={{ fontSize: 10, color: MUTED }}>{l}</div>
              <div style={{ fontSize: 19, fontWeight: 800, color: c }}>{v}</div>
            </div>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8ebf0', padding: 12, marginTop: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 19, background: 'linear-gradient(135deg,#7cc4f2,#005a9c)', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 12, fontWeight: 800 }}>AI</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{hi ? 'Devansh Gupta ke parent' : "Devansh Gupta's parent"}</div>
              <div style={{ fontSize: 11, color: MUTED }}>{hi ? 'Fees baaki ₹32,600 · 0:' : 'Due ₹32,600 · 0:'}{String(Math.min(59, Math.floor(f / 3))).padStart(2, '0')}</div>
            </div>
            <div style={{ display: 'flex', gap: 3, alignItems: 'center', height: 24 }}>
              {[0, 1, 2, 3, 4].map((b) => <span key={b} style={{ width: 4, borderRadius: 2, background: BRAND, height: 6 + Math.abs(Math.sin(f / 3 + b * 1.3)) * 16 }} />)}
            </div>
          </div>
          {lines.map(([who, text], i) => {
            const p = interpolate(f, [8 + i * 26, 16 + i * 26], [0, 1], clamp);
            const ai = who === 'ai';
            return (
              <div key={i} style={{ display: 'flex', justifyContent: ai ? 'flex-start' : 'flex-end', marginTop: 8, opacity: p, transform: `translateY(${(1 - p) * 8}px)` }}>
                <div style={{ maxWidth: 280, background: ai ? '#eef5fc' : '#e9f8ee', color: INK, borderRadius: 12, borderTopLeftRadius: ai ? 3 : 12, borderTopRightRadius: ai ? 12 : 3, padding: '8px 11px', fontSize: 12.5, lineHeight: 1.35 }}>{text}</div>
              </div>
            );
          })}
        </div>

        <div style={{ fontSize: 12, fontWeight: 700, color: MUTED, margin: '14px 4px 6px' }}>{hi ? 'AAJ KI CALLS' : "TODAY'S CALLS"}</div>
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8ebf0' }}>
          {AI_STUDENTS.map((s, i) => {
            const [label, bg, color] = status(i);
            return (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderBottom: i < 4 ? '1px solid #f0f2f5' : 'none' }}>
                <div style={{ width: 30, height: 30, borderRadius: 15, background: '#eef1f5', fontSize: 11, fontWeight: 700, display: 'grid', placeItems: 'center' }}>{s.name.split(' ').map((w) => w[0]).join('')}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: RED, fontWeight: 600 }}>{s.due}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, background: String(bg), color: String(color), borderRadius: 999, padding: '5px 10px' }}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ margin: '12px 14px 0', background: '#ecfdf3', border: '1px solid #bbf0cf', borderRadius: 16, padding: 12, opacity: interpolate(f, [95, 110], [0, 1], clamp), transform: `translateY(${interpolate(f, [95, 110], [14, 0], clamp)}px)` }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: GREEN }}>{hi ? '✓ Aaj ki report ready' : "✓ Today's report is ready"}</div>
        <div style={{ fontSize: 12, color: INK, marginTop: 4, lineHeight: 1.45 }}>
          {hi ? '18 calls · ₹2.4L ka promise · 5 ne UPI se pay kiya · 3 ko call back' : '18 calls · ₹2.4L promised · 5 paid by UPI · 3 call-backs'}
        </div>
      </div>
    </div>
  );
};

/* ───── phone ───── */
const SW = 600;
const SH = Math.round((SW * 844) / 390);
const Phone: React.FC<{ topic: Topic; play: boolean; dur: number }> = ({ topic, play, dur }) => {
  const c = topic.clip;
  const rate = c ? Math.min(RMAX, Math.max(1, (c.to - c.from) / (dur / FPS))) : 1;
  let screen: React.ReactNode;
  if (c) {
    const video = <OffthreadVideo src={staticFile(c.file)} startFrom={Math.round(c.from * FPS)} playbackRate={play ? rate : 1} muted style={{ width: SW, height: SH, display: 'block' }} />;
    screen = play ? video : <Freeze frame={0}>{video}</Freeze>;
  } else {
    screen = <div style={{ transform: `scale(${SW / 390})`, transformOrigin: '0 0' }}>{play ? <AiScreen /> : <Freeze frame={0}><AiScreen /></Freeze>}</div>;
  }
  return (
    <div style={{ padding: 16, borderRadius: 74, background: '#11141b', boxShadow: '0 50px 100px rgba(10,30,60,.45), inset 0 0 0 3px #2b303b', position: 'relative' }}>
      <div style={{ width: SW, height: SH, borderRadius: 58, overflow: 'hidden', background: '#fff', position: 'relative' }}>
        {screen}
        <div style={{ position: 'absolute', top: 14, left: '50%', marginLeft: -60, width: 120, height: 34, borderRadius: 17, background: '#11141b' }} />
      </div>
      {play && rate > 1.15 && (
        <div style={{ position: 'absolute', right: -14, bottom: 90, background: BRAND, color: '#fff', borderRadius: 999, padding: '8px 18px', fontSize: 26, fontWeight: 800, boxShadow: '0 10px 24px rgba(0,90,156,.4)' }}>▶▶ {rate.toFixed(1)}×</div>
      )}
    </div>
  );
};

/* ───── one topic ───── */
const Pair: React.FC<{ k: number; before: Line; after: Line }> = ({ k, before, after }) => {
  const lang = useLang();
  const f = useCurrentFrame();
  const switchAt = lineFrames(before);
  const afterDur = lineFrames(after) + afterHold(k);
  const t = interpolate(f, [switchAt - 4, switchAt + 12], [0, 1], { ...clamp, easing: ease });
  const enter = useSpring(0, 200, 14);
  const topic = TOPICS[k];
  const bx = interpolate(t, [0, 1], [540, 190]);
  const by = interpolate(t, [0, 1], [900, 330]);
  const bs = interpolate(t, [0, 1], [1, 0.34]);
  const br = interpolate(t, [0, 1], [0, -7]);
  const phoneY = interpolate(t, [0, 1], [1750, 0]);
  const isAi = k === 2;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: DESK }} />
      <AbsoluteFill style={{ background: isAi ? 'linear-gradient(170deg,#e9e6fb,#f6f7fd 55%,#e1ecf8)' : 'linear-gradient(170deg,#e6f1fb,#f6f9fd 55%,#dcebf8)', opacity: t }} />

      <div style={{ position: 'absolute', top: 70, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: enter, zIndex: 5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#fff', borderRadius: 999, padding: '12px 34px 12px 12px', boxShadow: '0 10px 30px rgba(0,0,0,.12)', fontSize: 46, fontWeight: 800, color: INK }}>
          <span style={{ width: 60, height: 60, borderRadius: 30, background: isAi ? '#5b3fd6' : NAVY, color: '#fff', display: 'grid', placeItems: 'center', fontSize: isAi ? 24 : 30 }}>{isAi ? 'AI' : k + 1}</span>
          {topic.name[lang]}
        </div>
      </div>

      <div style={{ position: 'absolute', top: 200, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: 1 - t }}>
        <div style={{ background: RED, color: '#fff', borderRadius: 999, padding: '12px 36px', fontSize: 40, fontWeight: 800, letterSpacing: 3 }}>{lang === 'hi' ? 'PEHLE · MANUAL' : 'BEFORE · MANUAL'}</div>
      </div>
      <div style={{ position: 'absolute', top: 205, right: 60, opacity: t, transform: `scale(${0.8 + t * 0.2})`, zIndex: 4 }}>
        <div style={{ background: isAi ? '#5b3fd6' : BRAND, color: '#fff', borderRadius: 999, padding: '12px 30px', fontSize: 34, fontWeight: 800, letterSpacing: 2 }}>{isAi ? (lang === 'hi' ? 'AB · AI AGENT' : 'AFTER · AI AGENT') : lang === 'hi' ? 'AB · EDUBUDDY' : 'AFTER · EDUBUDDY'}</div>
      </div>

      <div style={{ position: 'absolute', left: 0, right: 0, top: 300, display: 'flex', justifyContent: 'center', transform: `translateY(${phoneY}px)` }}>
        <div style={{ position: 'relative' }}>
          <Phone topic={topic} play={false} dur={afterDur} />
          <Sequence from={switchAt} layout="none">
            <div style={{ position: 'absolute', inset: 0 }}><Phone topic={topic} play dur={afterDur} /></div>
          </Sequence>
          <div style={{ position: 'absolute', right: -26, top: 60, width: 90, height: 90, borderRadius: 45, background: GREEN, color: '#fff', display: 'grid', placeItems: 'center', transform: `scale(${t})`, boxShadow: '0 12px 26px rgba(22,163,74,.45)' }}>
            <Check size={54} />
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', left: bx, top: by, width: 0, height: 0, zIndex: 3 }}>
        <div style={{ position: 'absolute', left: -430, top: -400, width: 860, height: 800, display: 'grid', placeItems: 'center', transform: `scale(${bs}) rotate(${br}deg)`, filter: `grayscale(${t * 0.9})`, overflow: 'hidden', borderRadius: 40, background: t > 0.5 ? DESK : 'transparent', boxShadow: t > 0.5 ? '0 20px 40px rgba(0,0,0,.2)' : 'none' }}>
          <Manual k={k} />
          <div style={{ position: 'absolute', left: '50%', top: '50%', width: 260, height: 260, marginLeft: -130, marginTop: -130, borderRadius: 130, background: RED, color: '#fff', display: 'grid', placeItems: 'center', transform: `scale(${t})`, opacity: t, boxShadow: '0 16px 36px rgba(150,30,20,.45)' }}>
            <Cross size={150} />
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
  const top = interpolate(f, [0, 14], [-960, 0], { ...clamp, easing: ease });
  const bottom = interpolate(f, [22, 36], [960, 0], { ...clamp, easing: ease });
  const chips = hi ? ['Ek ek call', 'Calculator', 'Haath se receipt', 'Kaagaz ke notes'] : ['Endless calls', 'Calculator', 'Handwritten receipts', 'Paper notes'];
  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 960, background: DESK, transform: `translateY(${top}px)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 40 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, justifyContent: 'center', width: 900 }}>
          {chips.map((c, i) => (
            <div key={c} style={{ background: '#fff', border: `4px solid ${RED}`, color: RED, borderRadius: 999, padding: '14px 30px', fontSize: 40, fontWeight: 800, transform: `rotate(${[-4, 3, -2, 5][i]}deg)` }}>{c}</div>
          ))}
        </div>
        <div style={{ fontSize: 110, fontWeight: 800, color: INK }}>{hi ? 'Manual kaam' : 'Manual work'}</div>
      </div>
      <div style={{ position: 'absolute', left: 0, top: 960, width: 1080, height: 960, background: `radial-gradient(circle at 50% 45%, #0f5d9e, ${NAVY} 75%)`, transform: `translateY(${bottom}px)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 34 }}>
        <Logo size={190} />
        <div style={{ fontSize: 110, fontWeight: 800, color: '#fff' }}>EduBuddy</div>
      </div>
      <div style={{ position: 'absolute', left: '50%', top: 960, width: 150, height: 150, marginLeft: -75, marginTop: -75, borderRadius: 75, background: '#fff', display: 'grid', placeItems: 'center', fontSize: 56, fontWeight: 800, color: INK, boxShadow: '0 16px 40px rgba(0,0,0,.25)', transform: `scale(${interpolate(f, [34, 44], [0, 1], clamp)})` }}>VS</div>
      <Voice line={line} at={INTRO_LEAD} />
    </AbsoluteFill>
  );
};

const Outro: React.FC<{ line: Line }> = ({ line }) => {
  const hi = useLang() === 'hi';
  const p = useSpring(0, 11);
  const feats = hi ? ['Attendance', 'Fees & receipt', 'AI fee calls', 'Inquiries', 'AI test papers'] : ['Attendance', 'Fees & receipts', 'AI fee calls', 'Inquiries', 'AI test papers'];
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 42%, #0f5d9e, ${NAVY} 70%)`, alignItems: 'center', justifyContent: 'center', padding: '0 60px', textAlign: 'center' }}>
      <div style={{ transform: `scale(${p})` }}><Logo size={190} /></div>
      <Pop delay={6}><div style={{ fontSize: 140, fontWeight: 800, color: '#fff', letterSpacing: -4, marginTop: 30 }}>EduBuddy</div></Pop>
      <Pop delay={14}><div style={{ fontSize: 56, color: '#cfe7f8', fontWeight: 700 }}>{hi ? 'Kaam kam, growth zyada.' : 'Less manual work, more growth.'}</div></Pop>
      <Pop delay={22}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center', marginTop: 40, width: 920 }}>
          {feats.map((x) => <span key={x} style={{ border: '2px solid rgba(255,255,255,.3)', color: '#d9ecfa', borderRadius: 999, padding: '10px 24px', fontSize: 32, fontWeight: 700 }}>{x}</span>)}
        </div>
      </Pop>
      <Pop delay={32}><div style={{ marginTop: 56, background: '#fff', color: NAVY, borderRadius: 999, padding: '28px 64px', fontSize: 48, fontWeight: 800 }}>{hi ? 'Free demo book karein →' : 'Book a free demo →'}</div></Pop>
      <Voice line={line} at={0} />
    </AbsoluteFill>
  );
};

export const ManualVertical: React.FC<{ lang?: BLang }> = ({ lang = 'hi' }) => {
  const s = TIM[lang].scenes;
  const frames = mvFrames(lang);
  const f = useCurrentFrame();
  const total = frames.reduce((a, b) => a + b, 0);
  const starts = frames.map((_, i) => frames.slice(0, i).reduce((a, b) => a + b, 0));
  return (
    <LangCtx.Provider value={lang}>
      <AbsoluteFill style={{ fontFamily, background: DESK }}>
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
