import React from 'react';
import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/PlusJakartaSans';
import { Bell, Calendar, Check, FileText, Printer, Users, Wallet, inr } from './ui';

/**
 * Promo-reel layout (hook -> one feature per beat with a ✓ headline + phone mockup -> ticked recap -> "One app" end card).
 * Text-and-music style, no voiceover. 1080x1920.
 */

const FONT = loadFont('normal', { weights: ['500', '700', '800'] }).fontFamily;
const K = {
  bg1: '#0d0b2b', bg2: '#241d6b', indigo: '#5a4ee9', indigoL: '#8b8cfb', amber: '#f59e0b', amberL: '#fcd34d',
  green: '#16a34a', greenBg: '#dcfce7', red: '#ef4444', redBg: '#fee2e2', ink: '#0f172a', muted: '#64748b', line: '#e8eaf2', canvas: '#f5f6fb',
  wa: '#25d366',
};
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const useSpring = (delay = 0, damping = 14) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping } });
};
const lerp = (fr: number, i: number[], o: number[]) => interpolate(fr, i, o, clamp);

export type CkLang = 'en' | 'hi';
type Feature = { title: React.ReactNode; sub: string; short: string };
type Copy = {
  hook1: string; hookItems: string[]; hook2: React.ReactNode;
  intro: React.ReactNode; features: Feature[]; recap: string; one: React.ReactNode; from: string; cta: string;
};
const A: React.FC<{ children: React.ReactNode }> = ({ children }) => <span style={{ color: K.amber }}>{children}</span>;

const COPY: Record<CkLang, Copy> = {
  en: {
    hook1: 'Still running your institute on…',
    hookItems: ['Paper registers?', 'Excel sheets?', 'WhatsApp chats?'],
    hook2: <>Meet <A>EduBuddy</A></>,
    intro: <>Students, fees &amp; admissions<br />in <A>one place</A>.</>,
    features: [
      { title: <>Attendance in <A>one tap</A></>, sub: 'Parents get a WhatsApp alert the same day', short: 'One-tap attendance + parent alerts' },
      { title: <>Fees, <A>always on record</A></>, sub: 'Record payments, print receipts, see who owes', short: 'Fee tracking & instant receipts' },
      { title: <>Every enquiry <A>followed up</A></>, sub: 'Calls and walk-ins tracked till they join', short: 'Enquiry follow-ups till admission' },
      { title: <>Test papers in <A>5 minutes</A></>, sub: 'NCERT, Class 6 to 12, with answer key', short: 'NCERT test papers with answer key' },
      { title: <>Your institute, <A>at a glance</A></>, sub: 'Batches, teachers and growth on one dashboard', short: 'One dashboard for everything' },
    ],
    recap: 'Everything your institute needs',
    one: <>One app.<br /><A>From enquiry to results.</A></>,
    from: 'EduBuddy',
    cta: 'Book a free demo',
  },
  hi: {
    hook1: 'Abhi bhi institute chal raha hai…',
    hookItems: ['Register pe?', 'Excel sheets pe?', 'WhatsApp chats pe?'],
    hook2: <>Milo <A>EduBuddy</A> se</>,
    intro: <>Students, fees aur admissions,<br /><A>ek hi jagah</A>.</>,
    features: [
      { title: <>Attendance <A>ek tap</A> mein</>, sub: 'Parents ko usi din WhatsApp alert', short: 'Ek tap attendance + parent alert' },
      { title: <>Har payment ka <A>pakka hisaab</A></>, sub: 'Payment record, receipt print, pending list', short: 'Fees tracking aur turant receipt' },
      { title: <>Har enquiry ka <A>follow-up</A></>, sub: 'Call aur walk-in, admission tak track', short: 'Admission tak enquiry follow-up' },
      { title: <>Test paper <A>5 minute</A> mein</>, sub: 'NCERT, Class 6 se 12, answer key ke saath', short: 'NCERT test paper + answer key' },
      { title: <>Poora institute, <A>ek nazar</A> mein</>, sub: 'Batches, teachers aur growth ek dashboard pe', short: 'Sab kuch ek dashboard pe' },
    ],
    recap: 'Institute ki har zarurat',
    one: <>Ek app.<br /><A>Enquiry se result tak.</A></>,
    from: 'EduBuddy',
    cta: 'Free demo book karein',
  },
};
const LangCtx = React.createContext<Copy>(COPY.en);
const useCopy = () => React.useContext(LangCtx);

/* -------------------------------------------------------------- timing */
const HOOK = 105, INTRO = 75, FEAT = 105, RECAP = 120, END = 105;
const BEATS = [HOOK, INTRO, ...Array(5).fill(FEAT), RECAP, END];
export const checklistFrames = BEATS.reduce((a, b) => a + b, 0);

/* -------------------------------------------------------------- shared bits */
const Background: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: `linear-gradient(170deg, ${K.bg2}, ${K.bg1} 60%)`, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: -300 + Math.sin(f / 50) * 120, top: -250, width: 1000, height: 1000, borderRadius: '50%', background: `radial-gradient(circle, ${K.indigo}99, transparent 65%)` }} />
      <div style={{ position: 'absolute', left: 450, top: 1150 + Math.cos(f / 60) * 120, width: 900, height: 900, borderRadius: '50%', background: `radial-gradient(circle, ${K.amber}33, transparent 65%)` }} />
      <AbsoluteFill style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 2px, transparent 2px)', backgroundSize: '46px 46px' }} />
    </AbsoluteFill>
  );
};

const Fade: React.FC<{ dur: number; children: React.ReactNode }> = ({ dur, children }) => {
  const f = useCurrentFrame();
  const o = lerp(f, [0, 6, dur - 6, dur], [0, 1, 1, 0]);
  const s = lerp(f, [0, 8], [1.04, 1]);
  return <AbsoluteFill style={{ opacity: o, transform: `scale(${s})` }}>{children}</AbsoluteFill>;
};

const Tick: React.FC<{ size: number; p: number }> = ({ size, p }) => (
  <div style={{ width: size, height: size, borderRadius: size / 2, background: K.green, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${p})`, boxShadow: `0 0 ${size / 2}px ${K.green}88` }}>
    <Check size={size * 0.62} color="#fff" />
  </div>
);

const Logo: React.FC<{ size: number }> = ({ size }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.28, background: `linear-gradient(135deg, ${K.indigoL}, ${K.indigo})`, color: '#fff', fontWeight: 800, fontSize: size * 0.58, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 20px 60px ${K.indigo}` }}>E</div>
);

/** Phone frame; children render inside the 720x1180 screen. */
const PhoneFrame: React.FC<{ children: React.ReactNode; title: string }> = ({ children, title }) => {
  const p = useSpring(6, 16);
  const f = useCurrentFrame();
  return (
    <div style={{ position: 'absolute', left: 170, top: 610, width: 740, height: 1200, borderRadius: 80, background: '#0b0b14', padding: 18, boxShadow: '0 60px 120px rgba(0,0,0,0.6), 0 0 0 3px #3a3a52', transform: `translateY(${(1 - p) * 700 + Math.sin(f / 25) * 6}px) rotate(${(1 - p) * 6}deg)` }}>
      <div style={{ width: '100%', height: '100%', borderRadius: 64, background: K.canvas, overflow: 'hidden', position: 'relative', color: K.ink }}>
        <div style={{ height: 150, background: K.indigo, color: '#fff', padding: '64px 40px 0', display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 30 }}>E</div>
          <div style={{ fontSize: 34, fontWeight: 800 }}>{title}</div>
        </div>
        <div style={{ padding: 30 }}>{children}</div>
        <div style={{ position: 'absolute', top: 20, left: '50%', marginLeft: -80, width: 160, height: 36, borderRadius: 18, background: '#0b0b14' }} />
      </div>
    </div>
  );
};

const Row: React.FC<{ children: React.ReactNode; delay: number; style?: React.CSSProperties }> = ({ children, delay, style }) => {
  const s = useSpring(delay, 16);
  return (
    <div style={{ background: '#fff', borderRadius: 24, padding: '22px 26px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 18, fontSize: 30, fontWeight: 700, boxShadow: '0 4px 14px rgba(15,23,42,0.06)', opacity: s, transform: `translateX(${(1 - s) * 80}px)`, ...style }}>
      {children}
    </div>
  );
};
const Badge: React.FC<{ bg: string; color: string; children: React.ReactNode; p?: number }> = ({ bg, color, children, p = 1 }) => (
  <div style={{ marginLeft: 'auto', padding: '8px 18px', borderRadius: 999, background: bg, color, fontSize: 24, fontWeight: 800, transform: `scale(${p})` }}>{children}</div>
);

/* -------------------------------------------------------------- phone screens */
const NAMES = ['Aarav Sharma', 'Diya Patel', 'Rahul Verma', 'Isha Gupta', 'Kabir Singh', 'Meera Joshi'];

const AttendanceScreen: React.FC = () => {
  const f = useCurrentFrame();
  const tap = 30;
  const toast = useSpring(62, 13);
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: K.muted }}>Class 10 · Batch A</div>
        <div style={{ padding: '14px 24px', borderRadius: 18, background: f > tap ? K.green : K.indigo, color: '#fff', fontSize: 24, fontWeight: 800, transform: `scale(${f > tap && f < tap + 6 ? 0.92 : 1})` }}>Mark all present</div>
      </div>
      {NAMES.map((n, i) => {
        const absent = i === 3;
        const on = f > tap + 3 + i * 2;
        return (
          <Row key={n} delay={10 + i * 2}>
            {n}
            {on && <Badge bg={absent && f > 48 ? K.redBg : K.greenBg} color={absent && f > 48 ? K.red : K.green}>{absent && f > 48 ? 'Absent' : 'Present'}</Badge>}
          </Row>
        );
      })}
      <div style={{ position: 'absolute', left: 30, right: 30, bottom: 40, background: '#fff', borderRadius: 26, padding: 24, display: 'flex', gap: 18, alignItems: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.25)', opacity: toast, transform: `translateY(${(1 - toast) * 200}px)` }}>
        <div style={{ width: 64, height: 64, borderRadius: 32, background: K.wa, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Bell size={34} color="#fff" /></div>
        <div style={{ fontSize: 24, fontWeight: 600, lineHeight: 1.3 }}><b>WhatsApp sent</b><br />Isha was absent today, 10 Nov</div>
      </div>
    </>
  );
};

const FeesScreen: React.FC = () => {
  const f = useCurrentFrame();
  const paid = f > 50;
  const receipt = useSpring(64, 14);
  return (
    <>
      <div style={{ display: 'flex', gap: 18, marginBottom: 22 }}>
        {[['Collected', 340000 + (paid ? 4500 : 0), K.green], ['Pending', 124500 - (paid ? 4500 : 0), K.red]].map(([l, v, c]) => (
          <div key={l as string} style={{ flex: 1, background: '#fff', borderRadius: 24, padding: 24 }}>
            <div style={{ fontSize: 24, color: K.muted, fontWeight: 700 }}>{l}</div>
            <div style={{ fontSize: 42, fontWeight: 800, color: c as string }}>₹{inr(lerp(f, [8, 34], [0, v as number]))}</div>
          </div>
        ))}
      </div>
      {[['Aarav Sharma', 'Paid'], ['Diya Patel', paid ? 'Paid' : 'Due ₹4,500'], ['Rahul Verma', 'Paid'], ['Kabir Singh', 'Due ₹3,000']].map(([n, s], i) => (
        <Row key={n} delay={14 + i * 3}>
          <Wallet size={34} color={K.indigo} />{n}
          <Badge bg={s === 'Paid' ? K.greenBg : K.redBg} color={s === 'Paid' ? K.green : K.red} p={i === 1 && paid ? lerp(f, [50, 56], [1.3, 1]) : 1}>{s}</Badge>
        </Row>
      ))}
      <div style={{ position: 'absolute', left: 60, right: 60, bottom: 40, background: '#fff', borderRadius: 26, padding: 30, boxShadow: '0 20px 50px rgba(0,0,0,0.25)', opacity: receipt, transform: `translateY(${(1 - receipt) * 300}px)`, border: `3px dashed ${K.line}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 30, fontWeight: 800 }}><Printer size={36} color={K.indigo} />Receipt #1042</div>
        <div style={{ fontSize: 26, color: K.muted, fontWeight: 600, marginTop: 10 }}>Diya Patel · November fee · ₹4,500</div>
      </div>
    </>
  );
};

const STAGES = ['New', 'Called', 'Demo class', 'Joined'];
const LeadsScreen: React.FC = () => {
  const f = useCurrentFrame();
  const stage = Math.min(3, Math.floor(lerp(f, [24, 78], [0, 4])));
  return (
    <>
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        {STAGES.map((s, i) => (
          <div key={s} style={{ flex: 1, textAlign: 'center', padding: '14px 4px', borderRadius: 16, fontSize: 22, fontWeight: 800, background: i <= stage ? (i === 3 ? K.green : K.indigo) : '#fff', color: i <= stage ? '#fff' : K.muted }}>{s}</div>
        ))}
      </div>
      <Row delay={8} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
        <div>Neha Kapoor (parent)</div>
        <div style={{ fontSize: 24, color: K.muted, fontWeight: 600 }}>Class 9 · Maths + Science · Walk-in</div>
        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
          <Badge bg={stage === 3 ? K.greenBg : '#eef0ff'} color={stage === 3 ? K.green : K.indigo}>{STAGES[stage]}</Badge>
        </div>
      </Row>
      {[['Follow-up call', 'Today, 5:00 PM'], ['Demo class', 'Sat, 11:00 AM'], ['Admission', 'Mon']].map(([a, b], i) => (
        <Row key={a} delay={20 + i * 14}>
          <Calendar size={32} color={K.amber} />{a}
          <span style={{ marginLeft: 'auto', fontSize: 24, color: K.muted }}>{b}</span>
          {stage > i && <Check size={30} color={K.green} />}
        </Row>
      ))}
      <Row delay={14}><Users size={32} color={K.indigo} />12 enquiries this week<Badge bg={K.amber + '33'} color="#b45309">3 due today</Badge></Row>
    </>
  );
};

const TestScreen: React.FC = () => {
  const f = useCurrentFrame();
  const gen = lerp(f, [44, 70], [0, 1]);
  return (
    <>
      <Row delay={6}><FileText size={32} color={K.indigo} />Class 10 · Science<Badge bg="#eef0ff" color={K.indigo}>NCERT</Badge></Row>
      {['Ch 1 · Chemical Reactions', 'Ch 2 · Acids, Bases & Salts', 'Ch 6 · Life Processes'].map((c, i) => (
        <Row key={c} delay={12 + i * 4} style={{ fontSize: 26 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: f > 24 + i * 5 ? K.indigo : K.line, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{f > 24 + i * 5 && <Check size={26} color="#fff" />}</div>{c}
        </Row>
      ))}
      <div style={{ height: 14, borderRadius: 7, background: K.line, margin: '10px 0 22px' }}>
        <div style={{ width: `${gen * 100}%`, height: '100%', borderRadius: 7, background: K.amber }} />
      </div>
      <div style={{ background: '#fff', borderRadius: 24, padding: 28, opacity: lerp(f, [66, 76], [0, 1]) }}>
        <div style={{ fontSize: 30, fontWeight: 800, textAlign: 'center' }}>Unit Test · 40 marks</div>
        {[100, 92, 96, 70, 88, 60].map((w, i) => <div key={i} style={{ height: 14, width: `${w}%`, background: K.line, borderRadius: 7, marginTop: 16 }} />)}
        <div style={{ display: 'flex', gap: 12, marginTop: 22 }}><Badge bg={K.greenBg} color={K.green}>Answer key ready</Badge></div>
      </div>
    </>
  );
};

const DashScreen: React.FC = () => {
  const f = useCurrentFrame();
  const bars = [40, 52, 48, 66, 74, 90];
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {[['Students', inr(lerp(f, [6, 34], [0, 248]))], ['Attendance', `${Math.round(lerp(f, [6, 34], [0, 92]))}%`], ['Batches', `${Math.round(lerp(f, [6, 34], [0, 14]))}`], ['Teachers', `${Math.round(lerp(f, [6, 34], [0, 9]))}`]].map(([l, v], i) => {
          const s = useSpring(6 + i * 3, 14);
          return (
            <div key={l} style={{ background: '#fff', borderRadius: 24, padding: 24, transform: `scale(${s})` }}>
              <div style={{ fontSize: 24, color: K.muted, fontWeight: 700 }}>{l}</div>
              <div style={{ fontSize: 48, fontWeight: 800 }}>{v}</div>
            </div>
          );
        })}
      </div>
      <div style={{ background: '#fff', borderRadius: 24, padding: 28 }}>
        <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 20 }}>Admissions growth</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, height: 280 }}>
          {bars.map((h, i) => (
            <div key={i} style={{ flex: 1, height: `${h * lerp(f, [20 + i * 4, 40 + i * 4], [0, 1])}%`, borderRadius: 12, background: i === bars.length - 1 ? K.amber : K.indigo }} />
          ))}
        </div>
      </div>
    </>
  );
};

const SCREENS: [React.FC, string][] = [
  [AttendanceScreen, 'Attendance'], [FeesScreen, 'Fees'], [LeadsScreen, 'Enquiries'], [TestScreen, 'Test Generator'], [DashScreen, 'Dashboard'],
];

/* -------------------------------------------------------------- beats */
const Hook: React.FC = () => {
  const c = useCopy();
  const f = useCurrentFrame();
  const q = useSpring(0, 14);
  const swap = 66;
  const out = lerp(f, [swap - 4, swap + 6], [1, 0]);
  const meet = useSpring(swap, 12);
  return (
    <AbsoluteFill style={{ color: '#fff', fontWeight: 800 }}>
      <div style={{ opacity: out }}>
        <div style={{ position: 'absolute', top: 340, left: 80, right: 80, fontSize: 72, lineHeight: 1.1, letterSpacing: -2, opacity: q, transform: `translateY(${(1 - q) * 40}px)` }}>{c.hook1}</div>
        {c.hookItems.map((it, i) => {
          const s = useSpring(14 + i * 9, 10);
          const strike = lerp(f, [44 + i * 4, 52 + i * 4], [0, 100]);
          return (
            <div key={it} style={{ position: 'absolute', top: 700 + i * 190, left: 80, fontSize: 96, letterSpacing: -2, color: i === 1 ? K.amberL : '#fff', opacity: s, transform: `scale(${1.6 - 0.6 * s}) rotate(${i % 2 ? 2 : -2}deg)`, transformOrigin: 'left center' }}>
              <span style={{ position: 'relative' }}>
                {it}
                <span style={{ position: 'absolute', left: -8, top: '52%', height: 12, borderRadius: 6, background: K.red, width: `${strike}%` }} />
              </span>
            </div>
          );
        })}
      </div>
      <div style={{ position: 'absolute', top: 760, left: 0, right: 0, textAlign: 'center', opacity: meet, transform: `scale(${0.6 + 0.4 * meet})` }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}><Logo size={170} /></div>
        <div style={{ fontSize: 110, letterSpacing: -3 }}>{c.hook2}</div>
      </div>
    </AbsoluteFill>
  );
};

const Intro: React.FC = () => {
  const c = useCopy();
  const s = useSpring(2, 14);
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
      <div style={{ fontSize: 88, fontWeight: 800, lineHeight: 1.12, letterSpacing: -2, textAlign: 'center', padding: '0 70px', opacity: s, transform: `translateY(${(1 - s) * 60}px)` }}>{c.intro}</div>
    </AbsoluteFill>
  );
};

const FeatureBeat: React.FC<{ i: number }> = ({ i }) => {
  const c = useCopy();
  const ft = c.features[i];
  const [Screen, title] = SCREENS[i];
  const tick = useSpring(4, 9);
  const head = useSpring(2, 14);
  const sub = useSpring(10, 14);
  return (
    <AbsoluteFill style={{ color: '#fff' }}>
      {/* progress dots */}
      <div style={{ position: 'absolute', top: 120, left: 80, display: 'flex', gap: 12 }}>
        {c.features.map((_, j) => <div key={j} style={{ width: j === i ? 64 : 22, height: 22, borderRadius: 11, background: j <= i ? K.amber : 'rgba(255,255,255,0.25)' }} />)}
      </div>
      <div style={{ position: 'absolute', top: 210, left: 80, right: 80, display: 'flex', gap: 28, alignItems: 'flex-start' }}>
        <div style={{ marginTop: 8 }}><Tick size={88} p={tick} /></div>
        <div>
          <div style={{ fontSize: 74, fontWeight: 800, lineHeight: 1.08, letterSpacing: -2, opacity: head, transform: `translateX(${(1 - head) * 60}px)` }}>{ft.title}</div>
          <div style={{ fontSize: 36, fontWeight: 600, color: '#d3d6ff', marginTop: 18, lineHeight: 1.3, opacity: sub }}>{ft.sub}</div>
        </div>
      </div>
      <PhoneFrame title={title}><Screen /></PhoneFrame>
    </AbsoluteFill>
  );
};

const Recap: React.FC = () => {
  const c = useCopy();
  const h = useSpring(0, 14);
  return (
    <AbsoluteFill style={{ color: '#fff' }}>
      <div style={{ position: 'absolute', top: 300, left: 80, right: 80, fontSize: 80, fontWeight: 800, letterSpacing: -2, lineHeight: 1.1, opacity: h }}>{c.recap}</div>
      {c.features.map((ft, i) => {
        const s = useSpring(14 + i * 12, 12);
        const t = useSpring(20 + i * 12, 8);
        return (
          <div key={i} style={{ position: 'absolute', top: 640 + i * 190, left: 80, right: 80, display: 'flex', alignItems: 'center', gap: 30, background: 'rgba(255,255,255,0.08)', border: '2px solid rgba(255,255,255,0.15)', borderRadius: 32, padding: '30px 34px', opacity: s, transform: `translateX(${(1 - s) * 200}px)` }}>
            <Tick size={70} p={t} />
            <div style={{ fontSize: 44, fontWeight: 700 }}>{ft.short}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const EndCard: React.FC = () => {
  const c = useCopy();
  const f = useCurrentFrame();
  const l = useSpring(0, 12);
  const t = useSpring(10, 14);
  const b = useSpring(26, 12);
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', color: '#fff', textAlign: 'center' }}>
      <div style={{ transform: `scale(${l})` }}><Logo size={200} /></div>
      <div style={{ fontSize: 64, fontWeight: 800, marginTop: 30, opacity: l }}>{c.from}</div>
      <div style={{ fontSize: 92, fontWeight: 800, lineHeight: 1.1, letterSpacing: -2, marginTop: 70, padding: '0 60px', opacity: t, transform: `translateY(${(1 - t) * 50}px)` }}>{c.one}</div>
      <div style={{ marginTop: 90, padding: '34px 70px', borderRadius: 999, background: K.amber, color: K.ink, fontSize: 50, fontWeight: 800, transform: `scale(${b * (1 + Math.sin(f / 6) * 0.03)})`, boxShadow: `0 20px 60px ${K.amber}66` }}>{c.cta}</div>
    </AbsoluteFill>
  );
};

/* -------------------------------------------------------------- composition */
export const Checklist: React.FC<{ lang: CkLang }> = ({ lang }) => {
  const parts: React.ReactNode[] = [<Hook />, <Intro />, ...[0, 1, 2, 3, 4].map((i) => <FeatureBeat i={i} />), <Recap />, <EndCard />];
  let from = 0;
  return (
    <LangCtx.Provider value={COPY[lang]}>
      <AbsoluteFill style={{ fontFamily: FONT }}>
        <Background />
        {parts.map((p, i) => {
          const start = from;
          from += BEATS[i];
          return (
            <Sequence key={i} from={start} durationInFrames={BEATS[i]} name={`Beat ${i}`}>
              <Fade dur={BEATS[i]}>{p}</Fade>
            </Sequence>
          );
        })}
      </AbsoluteFill>
    </LangCtx.Provider>
  );
};
