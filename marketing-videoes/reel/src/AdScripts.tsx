// Four 30-second Instagram ad concepts (English, 9:16) for testing demand. Scripts: ../ig-ad-scripts.md
//   ig-leak      "The Fee Leak"
//   ig-9pm       "9 PM"
//   ig-call      "This call wasn't made by a human"
//   ig-monthend  "Month-end in 30 seconds"
// Real app clips (screens/m-*.mp4) show what exists today. AI fee calls, photo-to-record, fee/attendance reports and
// PYQ PDFs are animated screens in the app's style (features planned, not built yet).
// Voice: ../ad-scripts/*.txt via tts.py (names s1, s2, s3, s4, call-ai, call-parent) + trim_silence.py.
import React from 'react';
import { AbsoluteFill, Audio, Easing, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/PlusJakartaSans';
import { loadFont as loadHand } from '@remotion/google-fonts/Caveat';
import s1T from './timings-s1.json';
import s2T from './timings-s2.json';
import s3T from './timings-s3.json';
import s4T from './timings-s4.json';
import aiT from './timings-call-ai.json';
import parentT from './timings-call-parent.json';
import { Check } from './ui';
import { Logo } from './Story';
import { LangCtx, Line } from './BeforeAfter';
import { AiScreen, Manual } from './ManualVertical';

const { fontFamily } = loadFont('normal', { weights: ['400', '500', '600', '700', '800'], subsets: ['latin'] });
const { fontFamily: hand } = loadHand('normal', { weights: ['600', '700'], subsets: ['latin'] });

const FPS = 30;
export const IG_TOTAL = 30 * FPS;
const GAP = 5;
const BRAND = '#005a9c';
const NAVY = '#1b365d';
const INK = '#15171f';
const MUTED = '#6b7280';
const RED = '#d0342c';
const GREEN = '#16a34a';
const AMBER = '#ffb020';
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ease = Easing.bezier(0.45, 0, 0.2, 1);
const L = (t: unknown) => (t as { scenes: Line[] }).scenes;
const frames = (l: Line) => Math.ceil((l.end - l.start) * FPS);

/* ───────────── shared bits ───────────── */
const useSpring = (delay = 0, damping = 200, dur = 14) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - delay, fps, config: { damping }, durationInFrames: dur });
};
const Rise: React.FC<{ delay?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ delay = 0, children, style }) => {
  const p = useSpring(delay);
  return <div style={{ opacity: p, transform: `translateY(${(1 - p) * 22}px)`, ...style }}>{children}</div>;
};
const Say: React.FC<{ line: Line; at?: number; volume?: number }> = ({ line, at = 0, volume = 1 }) => (
  <Sequence from={at}><Audio src={staticFile(line.file)} startFrom={Math.round(line.start * FPS)} volume={volume} /></Sequence>
);
const money = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');
const Header: React.FC<{ title: string; right?: React.ReactNode }> = ({ title, right }) => (
  <div style={{ height: 52, display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', background: '#fff', borderBottom: '1px solid #e8ebf0', paddingTop: 6 }}>
    <span style={{ fontSize: 18, color: MUTED }}>☰</span>
    <span style={{ width: 22, height: 22, borderRadius: 6, background: INK, color: '#fff', fontSize: 12, fontWeight: 800, display: 'grid', placeItems: 'center' }}>E</span>
    <span style={{ fontSize: 15, fontWeight: 700 }}>{title}</span>
    <span style={{ marginLeft: 'auto' }}>{right}</span>
  </div>
);
const Btn: React.FC<{ children: React.ReactNode; color?: string; pulse?: number }> = ({ children, color = BRAND, pulse = 0 }) => (
  <div style={{ height: 44, borderRadius: 12, background: color, color: '#fff', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transform: `scale(${1 + pulse * 0.04})` }}>{children}</div>
);
const Tap: React.FC<{ x: number; y: number; at: number }> = ({ x, y, at }) => {
  const f = useCurrentFrame();
  const t = f - at;
  if (t < -12 || t > 14) return null;
  const o = t < 0 ? interpolate(t, [-12, 0], [0, 1]) : interpolate(t, [0, 14], [1, 0]);
  return <div style={{ position: 'absolute', left: x - 22, top: y - 22, width: 44, height: 44, borderRadius: 22, background: 'rgba(30,30,30,.25)', border: '3px solid rgba(255,255,255,.9)', opacity: o, transform: `scale(${t < 0 ? 1 : 1 + t / 20})` }} />;
};

/* ───────────── animated app screens (390x844 css) ───────────── */
type MockProps = { dur: number };

// Snap a paper receipt → fields read → record updated.
const ScanScreen: React.FC<MockProps> = ({ dur }) => {
  const f = useCurrentFrame();
  const p = f / dur;
  const scan = interpolate(p, [0.08, 0.42], [0, 1], clamp);
  const sheet = interpolate(p, [0.42, 0.55], [0, 1], { ...clamp, easing: ease });
  const done = p > 0.78;
  const rows = [['Student', 'Devansh Gupta'], ['Amount', '₹10,000'], ['Paid by', 'Cash'], ['Date', '17 Nov 2026']];
  return (
    <div style={{ width: 390, height: 844, background: '#0e1117', position: 'relative', overflow: 'hidden', fontFamily }}>
      <div style={{ position: 'absolute', top: 60, left: 0, right: 0, textAlign: 'center', color: '#fff', fontSize: 14, fontWeight: 600 }}>Scan receipt · AI</div>
      <div style={{ position: 'absolute', left: 50, top: 120, width: 290, height: 380, background: '#fbf6e9', transform: 'rotate(-3deg)', padding: 22, boxShadow: '0 10px 30px rgba(0,0,0,.5)' }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: '#3a2f1e', letterSpacing: 1 }}>KMC CLASSES</div>
        <div style={{ fontSize: 11, color: '#8a7652', marginBottom: 14 }}>Receipt No. 148</div>
        <div style={{ fontFamily: hand, fontSize: 30, color: '#23315e', lineHeight: 1.35 }}>Received Rs 10,000/- from Devansh Gupta (Class 11). Cash. 17/11/26</div>
        <div style={{ fontFamily: hand, fontSize: 26, color: '#23315e', marginTop: 26, textAlign: 'right' }}>— K. M. Choudhary</div>
      </div>
      {['0 0', '100% 0', '0 100%', '100% 100%'].map((pos, i) => (
        <div key={i} style={{ position: 'absolute', left: i % 2 ? 330 : 36, top: i < 2 ? 108 : 498, width: 26, height: 26, borderColor: '#7cc4f2', borderStyle: 'solid', borderWidth: `${i < 2 ? 4 : 0}px ${i % 2 ? 4 : 0}px ${i < 2 ? 0 : 4}px ${i % 2 ? 0 : 4}px`, borderRadius: 4 }} />
      ))}
      {scan > 0 && scan < 1 && <div style={{ position: 'absolute', left: 40, right: 40, top: 112 + scan * 390, height: 4, background: '#7cc4f2', boxShadow: '0 0 18px 6px rgba(124,196,242,.6)' }} />}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 360, background: '#fff', borderRadius: '22px 22px 0 0', padding: 18, transform: `translateY(${(1 - sheet) * 380}px)` }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: BRAND }}>✓ Read from photo</div>
        <div style={{ marginTop: 10, border: '1px solid #e8ebf0', borderRadius: 14 }}>
          {rows.map(([k, v], i) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 14px', borderBottom: i < 3 ? '1px solid #f0f2f5' : 'none', fontSize: 14, opacity: interpolate(p, [0.5 + i * 0.05, 0.56 + i * 0.05], [0, 1], clamp) }}>
              <span style={{ color: MUTED }}>{k}</span><span style={{ fontWeight: 700, color: INK }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14 }}><Btn color={done ? GREEN : BRAND}>{done ? '✓ Record updated' : 'Save to record'}</Btn></div>
      </div>
      <Tap x={195} y={796} at={Math.round(dur * 0.74)} />
    </div>
  );
};

// Fee report: collection climbs, overdue drops, by-class bars fill.
const FeeReportScreen: React.FC<MockProps> = ({ dur }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [4, Math.max(20, dur - 10)], [0, 1], { ...clamp, easing: ease });
  const pct = 60 + p * 27;
  const classes = [['Class 8', 0.92], ['Class 9', 0.88], ['Class 10', 0.84], ['Class 11', 0.79], ['Class 12', 0.9]] as const;
  return (
    <div style={{ width: 390, height: 844, background: '#f4f6f9', fontFamily, color: INK }}>
      <Header title="Fee report" right={<span style={{ fontSize: 11, fontWeight: 700, color: BRAND, background: '#e6f0fa', borderRadius: 999, padding: '4px 10px' }}>November</span>} />
      <div style={{ padding: 14 }}>
        <div style={{ background: NAVY, color: '#fff', borderRadius: 18, padding: 16 }}>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Collected this month</div>
          <div style={{ fontSize: 32, fontWeight: 800, marginTop: 2 }}>{money(995200 + p * 485000)}</div>
          <div style={{ height: 10, borderRadius: 5, background: 'rgba(255,255,255,.2)', marginTop: 12 }}>
            <div style={{ height: 10, borderRadius: 5, width: `${pct}%`, background: '#7cc4f2' }} />
          </div>
          <div style={{ fontSize: 12, marginTop: 6, opacity: 0.85 }}>{Math.round(pct)}% of ₹17L collected</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
          {[['Pending', money(658300 - p * 485000), '#b45309'], ['Overdue', money(304900 - p * 256900), RED]].map(([k, v, c]) => (
            <div key={k} style={{ background: '#fff', borderRadius: 14, padding: 12, border: '1px solid #e8ebf0' }}>
              <div style={{ fontSize: 11, color: MUTED }}>{k}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: c }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ background: '#fff', borderRadius: 16, padding: 14, border: '1px solid #e8ebf0', marginTop: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 800 }}>By class</div>
          {classes.map(([c, v], i) => (
            <div key={c} style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}><span>{c}</span><span style={{ color: MUTED }}>{Math.round(v * 100 * Math.min(1, p * 1.2 + 0.4))}%</span></div>
              <div style={{ height: 8, borderRadius: 4, background: '#eef1f5', marginTop: 5 }}>
                <div style={{ height: 8, borderRadius: 4, background: i % 2 ? BRAND : GREEN, width: `${v * 100 * Math.min(1, p * 1.2 + 0.4)}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12 }}><Btn>⤓ Download report PDF</Btn></div>
      </div>
    </div>
  );
};

// Monthly attendance report: heatmap fills day by day.
const AttendanceReportScreen: React.FC<MockProps> = ({ dur }) => {
  const f = useCurrentFrame();
  const days = 20;
  const shown = Math.floor(interpolate(f, [2, Math.max(16, dur * 0.7)], [0, days], clamp));
  const names = ['Ayaan Sharma', 'Dhruv Agarwal', 'Ishita Kumawat', 'Muskan Jain', 'Parth Sethi', 'Prachi Mittal', 'Riya Meena', 'Tanvi Singhal'];
  const absent = (r: number, d: number) => ((r * 7 + d * 13) % 23) === 0 || (r === 2 && d % 6 === 3);
  return (
    <div style={{ width: 390, height: 844, background: '#f4f6f9', fontFamily, color: INK }}>
      <Header title="Attendance report" right={<span style={{ fontSize: 11, fontWeight: 700, color: GREEN, background: '#dcfce7', borderRadius: 999, padding: '4px 10px' }}>Avg 94%</span>} />
      <div style={{ padding: 14 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {['10D · Maths', 'November'].map((c) => <span key={c} style={{ fontSize: 12, fontWeight: 700, background: '#fff', border: '1px solid #e8ebf0', borderRadius: 999, padding: '6px 12px' }}>{c}</span>)}
        </div>
        <div style={{ background: '#fff', borderRadius: 16, padding: 12, border: '1px solid #e8ebf0', marginTop: 12 }}>
          {names.map((n, r) => {
            const pres = Array.from({ length: shown }, (_, d) => !absent(r, d)).filter(Boolean).length;
            return (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
                <span style={{ width: 98, fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden' }}>{n}</span>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${days}, 1fr)`, gap: 2, flex: 1 }}>
                  {Array.from({ length: days }, (_, d) => (
                    <span key={d} style={{ height: 14, borderRadius: 3, background: d >= shown ? '#eef1f5' : absent(r, d) ? '#f87171' : '#4ade80' }} />
                  ))}
                </div>
                <span style={{ width: 34, fontSize: 11, fontWeight: 700, textAlign: 'right', color: shown && pres / shown < 0.85 ? RED : INK }}>{shown ? Math.round((pres / shown) * 100) : 0}%</span>
              </div>
            );
          })}
        </div>
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 14, padding: 12, marginTop: 12, fontSize: 12.5, opacity: interpolate(f, [dur * 0.6, dur * 0.7], [0, 1], clamp) }}>
          <b style={{ color: '#c2410c' }}>Needs attention:</b> Ishita Kumawat is below 80% this month.
        </div>
        <div style={{ marginTop: 12 }}><Btn pulse={Math.max(0, Math.sin(f / 5))}>⤓ Download attendance PDF</Btn></div>
      </div>
    </div>
  );
};

// PYQ PDFs: list, tap one, share with batch.
const PyqScreen: React.FC<MockProps> = ({ dur }) => {
  const f = useCurrentFrame();
  const items = [['CBSE 2025', 'Mathematics · Class 10', '24 pages'], ['CBSE 2024', 'Mathematics · Class 10', '22 pages'], ['CBSE 2024', 'Science · Class 10', '26 pages'], ['CBSE 2023', 'Mathematics · Class 10', '21 pages'], ['CBSE 2022', 'Mathematics · Class 10', '20 pages']];
  const tapAt = Math.round(dur * 0.45);
  const toast = interpolate(f, [tapAt + 6, tapAt + 14], [0, 1], clamp);
  return (
    <div style={{ width: 390, height: 844, background: '#f4f6f9', fontFamily, color: INK, position: 'relative' }}>
      <Header title="PYQ PDFs" />
      <div style={{ padding: 14 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {['Class 10', 'Mathematics', 'CBSE'].map((c, i) => <span key={c} style={{ fontSize: 12, fontWeight: 700, background: i < 2 ? BRAND : '#fff', color: i < 2 ? '#fff' : INK, border: '1px solid #e8ebf0', borderRadius: 999, padding: '6px 12px' }}>{c}</span>)}
        </div>
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8ebf0', marginTop: 12 }}>
          {items.map(([y, s, pg], i) => (
            <Rise key={y + s} delay={i * 3}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 12px', borderBottom: i < 4 ? '1px solid #f0f2f5' : 'none', background: i === 1 && f > tapAt && f < tapAt + 10 ? '#eef5fc' : 'transparent' }}>
                <div style={{ width: 40, height: 48, borderRadius: 8, background: '#fde8e8', color: RED, fontSize: 11, fontWeight: 800, display: 'grid', placeItems: 'center' }}>PDF</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{y} Question Paper</div>
                  <div style={{ fontSize: 11.5, color: MUTED }}>{s} · {pg}</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: BRAND, border: '1px solid #cfe0f1', borderRadius: 999, padding: '5px 10px' }}>Share</span>
              </div>
            </Rise>
          ))}
        </div>
      </div>
      <Tap x={330} y={200} at={tapAt} />
      <div style={{ position: 'absolute', left: 14, right: 14, bottom: 30, background: INK, color: '#fff', borderRadius: 14, padding: '14px 16px', fontSize: 13.5, fontWeight: 600, opacity: toast, transform: `translateY(${(1 - toast) * 20}px)` }}>
        ✓ Shared with batch 10D · 32 students
      </div>
    </div>
  );
};

// Incoming fee-reminder call on the parent's phone, with live transcript.
const CALL_LINES = () => {
  const ai = L(aiT);
  const parent = L(parentT);
  const a0 = 18;
  const p0 = a0 + frames(ai[0]) + 6;
  const a1 = p0 + frames(parent[0]) + 6;
  return { ai, parent, a0, p0, a1, end: a1 + frames(ai[1]) + 8 };
};
const CallScreen: React.FC = () => {
  const f = useCurrentFrame();
  const { a0, p0, a1 } = CALL_LINES();
  const answered = f >= 14;
  const secs = Math.max(0, Math.floor((f - 14) / FPS));
  const bubbles: [string, string, number][] = [
    ['ai', "Hi! KMC Classes here. Devansh's fee of ₹32,600 is due this week.", a0],
    ['p', "Oh, yes. I'll pay by Friday.", p0],
    ['ai', "Thank you! I've noted Friday.", a1],
  ];
  return (
    <div style={{ width: 390, height: 844, background: 'linear-gradient(180deg,#1d2a44,#0d1422)', fontFamily, color: '#fff', position: 'relative', overflow: 'hidden' }}>
      <div style={{ textAlign: 'center', marginTop: 90 }}>
        <div style={{ width: 92, height: 92, borderRadius: 46, margin: '0 auto', background: 'linear-gradient(135deg,#8fd3f4,#4aa8dc)', display: 'grid', placeItems: 'center', fontSize: 30, fontWeight: 800, color: NAVY, boxShadow: answered ? 'none' : `0 0 0 ${8 + Math.abs(Math.sin(f / 4)) * 16}px rgba(124,196,242,.25)` }}>K</div>
        <div style={{ fontSize: 26, fontWeight: 700, marginTop: 16 }}>KMC Classes</div>
        <div style={{ fontSize: 14, opacity: 0.7, marginTop: 4 }}>{answered ? `0:${String(secs).padStart(2, '0')}` : 'Incoming call…'}</div>
      </div>
      <div style={{ position: 'absolute', left: 18, right: 18, top: 290 }}>
        {bubbles.map(([who, text, at]) => {
          const o = interpolate(f, [at, at + 8], [0, 1], clamp);
          const ai = who === 'ai';
          return (
            <div key={text} style={{ display: 'flex', justifyContent: ai ? 'flex-start' : 'flex-end', marginTop: 12, opacity: o, transform: `translateY(${(1 - o) * 10}px)` }}>
              <div style={{ maxWidth: 290, background: ai ? 'rgba(124,196,242,.18)' : 'rgba(255,255,255,.92)', color: ai ? '#e8f4fd' : INK, borderRadius: 16, padding: '11px 14px', fontSize: 15, lineHeight: 1.4 }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, opacity: 0.7, marginBottom: 3 }}>{ai ? 'AI ASSISTANT' : 'PARENT'}</div>{text}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ position: 'absolute', bottom: 70, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 90 }}>
        {answered ? (
          <div style={{ width: 70, height: 70, borderRadius: 35, background: '#ef4444', display: 'grid', placeItems: 'center', fontSize: 26 }}>✕</div>
        ) : (
          <>
            <div style={{ width: 70, height: 70, borderRadius: 35, background: '#ef4444', display: 'grid', placeItems: 'center', fontSize: 26 }}>✕</div>
            <div style={{ width: 70, height: 70, borderRadius: 35, background: '#22c55e', display: 'grid', placeItems: 'center', fontSize: 26, transform: `scale(${1 + Math.abs(Math.sin(f / 3)) * 0.08})` }}>✆</div>
          </>
        )}
      </div>
      <Tap x={240} y={809} at={12} />
    </div>
  );
};

/* ───────────── phone frame ───────────── */
type Screen = { clip: { file: string; from: number; to: number; zoom?: number } } | { mock: React.FC<MockProps> };
const SW = 440;
const SH = Math.round((SW * 844) / 390);
const ScreenView: React.FC<{ s: Screen; dur: number }> = ({ s, dur }) => {
  if ('clip' in s) {
    const c = s.clip;
    const rate = Math.min(3, Math.max(1, (c.to - c.from) / (dur / FPS)));
    return (
      <div style={{ width: SW, height: SH, transform: `scale(${c.zoom ?? 1})`, transformOrigin: '50% 0' }}>
        <OffthreadVideo src={staticFile(c.file)} startFrom={Math.round(c.from * FPS)} playbackRate={rate} muted style={{ width: SW, height: SH, display: 'block' }} />
      </div>
    );
  }
  const M = s.mock;
  return <div style={{ transform: `scale(${SW / 390})`, transformOrigin: '0 0' }}><M dur={dur} /></div>;
};
const Fade: React.FC<{ children: React.ReactNode; first?: boolean }> = ({ children, first }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ opacity: first ? 1 : interpolate(f, [0, 6], [0, 1], clamp) }}>{children}</AbsoluteFill>;
};
// One phone that stays on screen across consecutive app beats; screens swap inside it.
const PhoneRun: React.FC<{ segs: { s: Screen; from: number; dur: number }[]; total: number }> = ({ segs, total }) => {
  const f = useCurrentFrame();
  const y = interpolate(f, [0, 14, total - 6, total], [700, 0, 0, 40], { ...clamp, easing: ease });
  const o = interpolate(f, [0, 6, total - 6, total], [0, 1, 1, 0], clamp);
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 620, display: 'flex', justifyContent: 'center', transform: `translateY(${y}px)`, opacity: o }}>
      <div style={{ padding: 13, borderRadius: 60, background: '#11141b', boxShadow: '0 40px 80px rgba(15,30,60,.32), inset 0 0 0 3px #2b303b' }}>
        <div style={{ width: SW, height: SH, borderRadius: 48, overflow: 'hidden', background: '#fff', position: 'relative' }}>
          {segs.map((g, i) => (
            <Sequence key={i} from={g.from} durationInFrames={g.dur + (i < segs.length - 1 ? 6 : 0)}>
              <Fade first={i === 0}><ScreenView s={g.s} dur={g.dur} /></Fade>
            </Sequence>
          ))}
          <div style={{ position: 'absolute', top: 10, left: '50%', marginLeft: -48, width: 96, height: 26, borderRadius: 13, background: '#11141b' }} />
        </div>
      </div>
    </div>
  );
};

/* ───────────── full-screen scenes ───────────── */
type SceneProps = { dur: number };

const PendingCounter: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();
  const n = interpolate(f, [4, 60], [0, 658300], { ...clamp, easing: Easing.out(Easing.cubic) });
  const rows = [['Devansh Gupta', 32600], ['Aadhya Jain', 31600], ['Anika Agarwal', 30600], ['Yash Mittal', 29500], ['Zoya Bhatt', 29300]] as const;
  return (
    <AbsoluteFill style={{ alignItems: 'center', paddingTop: 640 }}>
      <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: 6, color: RED }}>PENDING FEES</div>
      <div style={{ fontSize: 150, fontWeight: 800, color: RED, letterSpacing: -4, fontVariantNumeric: 'tabular-nums' }}>{money(n)}</div>
      <div style={{ width: 800, marginTop: 30, background: '#fff', borderRadius: 28, padding: '10px 30px', boxShadow: '0 24px 50px rgba(120,30,20,.12)' }}>
        {rows.map(([name, due], i) => (
          <Rise key={name} delay={10 + i * 5}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '18px 0', borderBottom: i < 4 ? '1px solid #f1e3e1' : 'none', fontSize: 36 }}>
              <span style={{ flex: 1, fontWeight: 700, color: INK }}>{name}</span>
              <span style={{ fontWeight: 800, color: RED, marginRight: 20 }}>{money(due)}</span>
              <span style={{ fontSize: 24, fontWeight: 800, color: RED, background: '#fdecec', borderRadius: 999, padding: '6px 16px' }}>Pending</span>
            </div>
          </Rise>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const ManualScene: React.FC<SceneProps & { k: number }> = ({ k }) => (
  <AbsoluteFill style={{ alignItems: 'center', paddingTop: 640 }}><Manual k={k} /></AbsoluteFill>
);
const Montage: React.FC<SceneProps> = ({ dur }) => {
  const parts = [0, 1, 3];
  const each = Math.floor(dur / parts.length);
  return (
    <AbsoluteFill>
      {parts.map((k, i) => (
        <Sequence key={k} from={i * each} durationInFrames={i === parts.length - 1 ? dur - i * each : each}>
          <Fade><ManualScene k={k} dur={each} /></Fade>
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

const ClockFace: React.FC<{ h: number; m: number; size?: number; dark?: boolean }> = ({ h, m, size = 360, dark }) => {
  const ha = ((h % 12) + m / 60) * 30;
  const ma = m * 6;
  const c = dark ? '#e8eef7' : INK;
  return (
    <svg width={size} height={size} viewBox="0 0 200 200">
      <circle cx="100" cy="100" r="92" fill={dark ? '#1f2b40' : '#fff'} stroke={c} strokeWidth="6" />
      {Array.from({ length: 12 }, (_, i) => <line key={i} x1="100" y1="16" x2="100" y2="28" stroke={c} strokeWidth="4" transform={`rotate(${i * 30} 100 100)`} />)}
      <line x1="100" y1="100" x2="100" y2="52" stroke={c} strokeWidth="8" strokeLinecap="round" transform={`rotate(${ha} 100 100)`} />
      <line x1="100" y1="100" x2="100" y2="30" stroke={AMBER} strokeWidth="5" strokeLinecap="round" transform={`rotate(${ma} 100 100)`} />
      <circle cx="100" cy="100" r="7" fill={c} />
    </svg>
  );
};
const fmtTime = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = Math.floor(mins % 60);
  return `${h > 12 ? h - 12 : h}:${String(m).padStart(2, '0')} PM`;
};
const NightScene: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();
  const mins = 21 * 60 + 4 + f / 20;
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 62%, #33405a 0%, #121826 65%)', alignItems: 'center', paddingTop: 650 }}>
      <ClockFace h={21} m={4 + f / 20} dark />
      <div style={{ fontSize: 110, fontWeight: 800, color: '#fff', marginTop: 30, fontVariantNumeric: 'tabular-nums' }}>{fmtTime(mins)}</div>
      <Rise delay={20}>
        <div style={{ marginTop: 30, display: 'flex', gap: 18 }}>
          {['Fee register open', 'Call 23 of 52'].map((t) => <span key={t} style={{ background: 'rgba(255,255,255,.1)', color: '#dbe4f0', borderRadius: 999, padding: '14px 28px', fontSize: 34, fontWeight: 700 }}>{t}</span>)}
        </div>
      </Rise>
    </AbsoluteFill>
  );
};
const RewindScene: React.FC<SceneProps> = ({ dur }) => {
  const f = useCurrentFrame();
  const t = interpolate(f, [0, dur * 0.7], [0, 1], { ...clamp, easing: ease });
  const mins = 21 * 60 + 4 - t * 119; // 9:04 → 7:05
  const bright = t;
  return (
    <AbsoluteFill style={{ alignItems: 'center', paddingTop: 650 }}>
      <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 62%, #33405a 0%, #121826 65%)', opacity: 1 - bright }} />
      <AbsoluteFill style={{ background: 'linear-gradient(170deg,#fff6e0,#fdfbf5 60%,#e8f2fc)', opacity: bright }} />
      <div style={{ position: 'relative', textAlign: 'center' }}>
        <ClockFace h={Math.floor(mins / 60)} m={mins % 60} dark={bright < 0.5} />
        <div style={{ fontSize: 110, fontWeight: 800, color: bright < 0.5 ? '#fff' : INK, marginTop: 30, fontVariantNumeric: 'tabular-nums' }}>{fmtTime(mins)}</div>
        <div style={{ fontSize: 40, fontWeight: 800, color: bright < 0.5 ? '#9fb3cc' : AMBER, letterSpacing: 4, marginTop: 6 }}>◀◀ REWIND</div>
      </div>
    </AbsoluteFill>
  );
};

const CallIntro: React.FC<SceneProps> = () => {
  const { ai, parent, a0, p0, a1 } = CALL_LINES();
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 620, display: 'flex', justifyContent: 'center' }}>
        <div style={{ padding: 13, borderRadius: 60, background: '#11141b', boxShadow: '0 40px 80px rgba(15,30,60,.35)' }}>
          <div style={{ width: SW, height: SH, borderRadius: 48, overflow: 'hidden', position: 'relative' }}>
            <div style={{ transform: `scale(${SW / 390})`, transformOrigin: '0 0' }}><CallScreen /></div>
            <div style={{ position: 'absolute', top: 10, left: '50%', marginLeft: -48, width: 96, height: 26, borderRadius: 13, background: '#000' }} />
          </div>
        </div>
      </div>
      <Say line={ai[0]} at={a0} volume={0.95} />
      <Say line={parent[0]} at={p0} />
      <Say line={ai[1]} at={a1} volume={0.95} />
    </AbsoluteFill>
  );
};

const CallReport: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();
  const n = (to: number) => Math.round(interpolate(f, [4, 40], [0, to], { ...clamp, easing: Easing.out(Easing.cubic) }));
  const rows: [string, string, string][] = [
    ['Parents called', String(n(52)), INK],
    ['Promised to pay', `${n(31)} · ₹4.1L`, BRAND],
    ['Paid right away', `${n(12)} · ₹1.9L`, GREEN],
    ['Call back later', String(n(9)), '#b45309'],
  ];
  return (
    <AbsoluteFill style={{ alignItems: 'center', paddingTop: 640 }}>
      <div style={{ width: 860, background: '#fff', borderRadius: 34, padding: 40, boxShadow: '0 30px 60px rgba(15,30,60,.14)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 70, height: 70, borderRadius: 35, background: 'linear-gradient(135deg,#7cc4f2,#005a9c)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 26, fontWeight: 800 }}>AI</div>
          <div>
            <div style={{ fontSize: 40, fontWeight: 800, color: INK }}>Today's call report</div>
            <div style={{ fontSize: 28, color: MUTED }}>Fee reminders · 17 Nov</div>
          </div>
        </div>
        {rows.map(([k, v, c], i) => (
          <Rise key={k} delay={6 + i * 6}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '26px 0', borderBottom: i < 3 ? '2px solid #f0f2f5' : 'none' }}>
              <span style={{ fontSize: 38, color: INK, fontWeight: 600 }}>{k}</span>
              <span style={{ fontSize: 48, fontWeight: 800, color: c }}>{v}</span>
            </div>
          </Rise>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const StopwatchHook: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();
  const sweep = (f * 12) % 360;
  return (
    <AbsoluteFill style={{ alignItems: 'center', paddingTop: 640 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 60 }}>
        <Rise>
          <div style={{ textAlign: 'center' }}>
            <div style={{ position: 'relative', width: 260, height: 300 }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{ position: 'absolute', left: 20 + i * 6, top: 140 - i * 46, width: 220, height: 60, borderRadius: 8, background: ['#9b3d2e', '#2e5c8a', '#3f6b3a', '#8a6a3c'][i], transform: `rotate(${[-4, 3, -2, 5][i]}deg)`, boxShadow: '0 8px 16px rgba(0,0,0,.2)' }} />
              ))}
            </div>
            <div style={{ fontSize: 64, fontWeight: 800, color: RED, marginTop: 10, textDecoration: f > 40 ? 'line-through' : 'none' }}>3 DAYS</div>
          </div>
        </Rise>
        <div style={{ fontSize: 80, color: MUTED, fontWeight: 800 }}>→</div>
        <Rise delay={8}>
          <div style={{ textAlign: 'center' }}>
            <svg width="300" height="300" viewBox="0 0 200 200">
              <rect x="88" y="2" width="24" height="16" rx="4" fill={INK} />
              <circle cx="100" cy="110" r="84" fill="#fff" stroke={INK} strokeWidth="8" />
              <path d={`M100 110 L${100 + 70 * Math.sin((sweep * Math.PI) / 180)} ${110 - 70 * Math.cos((sweep * Math.PI) / 180)}`} stroke={RED} strokeWidth="6" strokeLinecap="round" />
              <circle cx="100" cy="110" r="7" fill={INK} />
            </svg>
            <div style={{ fontSize: 64, fontWeight: 800, color: GREEN, marginTop: 10 }}>30 SEC</div>
          </div>
        </Rise>
      </div>
    </AbsoluteFill>
  );
};

const EndCard: React.FC<SceneProps & { tagline: string; extra?: React.ReactNode }> = ({ tagline, extra }) => {
  const p = useSpring(0, 12, 20);
  const f = useCurrentFrame();
  const pulse = 1 + Math.max(0, Math.sin((f - 24) / 6)) * 0.035;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 40%, #0f5d9e, ${NAVY} 72%)`, alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '270px 70px 560px' }}>
      {extra}
      <div style={{ transform: `scale(${p})` }}><Logo size={140} /></div>
      <Rise delay={4}><div style={{ fontSize: 112, fontWeight: 800, color: '#fff', letterSpacing: -3, marginTop: 14 }}>EduBuddy</div></Rise>
      <Rise delay={8}><div style={{ fontSize: 58, fontWeight: 800, color: '#cfe7f8', lineHeight: 1.15, marginTop: 6 }}>{tagline}</div></Rise>
      <Rise delay={16}>
        <div style={{ marginTop: 44, background: AMBER, color: INK, borderRadius: 999, padding: '28px 60px', fontSize: 50, fontWeight: 800, transform: `scale(${pulse})`, boxShadow: '0 18px 40px rgba(0,0,0,.3)' }}>Book a free demo →</div>
      </Rise>
      <Rise delay={24}><div style={{ marginTop: 20, fontSize: 32, color: '#a9cbe6', fontWeight: 600 }}>Tap "Book now" below</div></Rise>
    </AbsoluteFill>
  );
};

/* ───────────── script engine ───────────── */
type Beat = {
  line?: number;          // narrator line index (omit for the call beat)
  call?: boolean;         // script 3 hook: two-voice call audio
  caption?: string;       // on-screen headline (defaults to the line text)
  tag?: string;           // small label above the headline
  bg?: string;
  dark?: boolean;
  scene?: React.FC<SceneProps>;
  screens?: Screen[];
  end?: { tagline: string };
};
type Script = { voice: unknown; beats: Beat[]; timer?: boolean };

const CLIP = {
  fees: { clip: { file: 'screens/m-fees.mp4', from: 2.6, to: 8.6 } },
  attendance: { clip: { file: 'screens/m-attendance.mp4', from: 0.3, to: 3.4, zoom: 1.1 } },
  leads: { clip: { file: 'screens/m-leads.mp4', from: 9.0, to: 12.8 } },
  dashboard: { clip: { file: 'screens/m-dashboard.mp4', from: 6.4, to: 11.6 } },
} satisfies Record<string, Screen>;
const AI: Screen = { mock: () => <AiScreen /> };
const SCAN: Screen = { mock: ScanScreen };
const FEEREP: Screen = { mock: FeeReportScreen };
const ATTREP: Screen = { mock: AttendanceReportScreen };
const PYQ: Screen = { mock: PyqScreen };
const LIGHT = 'linear-gradient(170deg,#eaf3fc 0%,#f7f9fc 50%,#e4eef9 100%)';
const WARM = 'linear-gradient(170deg,#fdf2ef 0%,#fbf8f6 55%,#f7ece8 100%)';
const DESK = '#efe8dc';

const SCRIPTS: Record<string, Script> = {
  leak: {
    voice: s1T,
    beats: [
      { line: 0, tag: 'FOR INSTITUTE OWNERS', bg: WARM, scene: PendingCounter },
      { line: 1, tag: 'EVERY MONTH', bg: DESK, scene: ({ dur }) => <ManualScene k={2} dur={dur} /> },
      { line: 2, tag: 'AI FEE REMINDER CALLS', bg: LIGHT, screens: [AI] },
      { line: 3, tag: 'ONE-TAP RECEIPTS', bg: LIGHT, screens: [CLIP.fees] },
      { line: 4, tag: 'PHOTO → RECORD', bg: LIGHT, screens: [SCAN] },
      { line: 5, tag: 'FEE REPORTS', bg: LIGHT, screens: [FEEREP] },
      { line: 6, tag: 'ALSO IN THE APP', bg: LIGHT, screens: [ATTREP, CLIP.leads, PYQ] },
      { line: 7, end: { tagline: 'Collect more.\nChase less.' } },
    ],
  },
  '9pm': {
    voice: s2T,
    beats: [
      { line: 0, bg: '#121826', dark: true, scene: NightScene },
      { line: 1, bg: DESK, scene: Montage },
      { line: 2, bg: 'transparent', scene: RewindScene },
      { line: 3, tag: 'AI FEE REMINDER CALLS', bg: LIGHT, screens: [AI] },
      { line: 4, tag: 'ONE TAP · OR A PHOTO', bg: LIGHT, screens: [CLIP.fees, SCAN] },
      { line: 5, tag: 'ATTENDANCE & ENQUIRIES', bg: LIGHT, screens: [ATTREP, CLIP.leads] },
      { line: 6, end: { tagline: 'Go home at 7.' } },
    ],
  },
  call: {
    voice: s3T,
    beats: [
      { call: true, caption: "This fee reminder call wasn't made by a human.", tag: 'LISTEN', bg: '#0d1422', dark: true, scene: CallIntro },
      { line: 0, tag: 'AI FEE REMINDER CALLS', bg: LIGHT, screens: [AI] },
      { line: 1, tag: 'YOUR DAILY REPORT', bg: LIGHT, scene: CallReport },
      { line: 2, tag: 'ONE TAP · OR A PHOTO', bg: LIGHT, screens: [CLIP.fees, SCAN] },
      { line: 3, tag: 'GROW YOUR INSTITUTE', bg: LIGHT, screens: [CLIP.dashboard, ATTREP, PYQ] },
      { line: 4, end: { tagline: 'Let AI chase fees.\nYou teach.' } },
    ],
  },
  monthend: {
    voice: s4T,
    timer: true,
    beats: [
      { line: 0, tag: 'MONTH-END CLOSING', bg: WARM, scene: StopwatchHook },
      { line: 1, tag: 'STEP 1', bg: LIGHT, screens: [AI] },
      { line: 2, tag: 'STEP 2', bg: LIGHT, screens: [CLIP.fees, SCAN] },
      { line: 3, tag: 'STEP 3', bg: LIGHT, screens: [FEEREP] },
      { line: 4, tag: 'BONUS', bg: LIGHT, screens: [ATTREP, PYQ] },
      { line: 5, tag: 'GROWTH', bg: LIGHT, screens: [CLIP.leads] },
      { line: 6, end: { tagline: '00:29.\nYour move.' } },
    ],
  },
};

const beatSpeech = (sc: Script, b: Beat) => (b.call ? CALL_LINES().end : frames(L(sc.voice)[b.line!]));
const plan = (sc: Script) => {
  const body = sc.beats.slice(0, -1).map((b, i) => beatSpeech(sc, b) + GAP + (i === 0 && !b.call ? 4 : 0));
  const endNeed = beatSpeech(sc, sc.beats[sc.beats.length - 1]) + 24;
  const spare = Math.max(0, IG_TOTAL - body.reduce((a, b) => a + b, 0) - endNeed);
  const durs = body.map((d) => d + Math.floor(spare / body.length));
  durs.push(IG_TOTAL - durs.reduce((a, b) => a + b, 0));
  const starts = durs.map((_, i) => durs.slice(0, i).reduce((a, b) => a + b, 0));
  return { durs, starts };
};

const Caption: React.FC<{ text: string; tag?: string; dark?: boolean }> = ({ text, tag, dark }) => (
  <div style={{ position: 'absolute', left: 60, right: 60, top: 270, textAlign: 'center' }}>
    {tag && <Rise><div style={{ display: 'inline-block', background: dark ? 'rgba(255,255,255,.12)' : BRAND, color: '#fff', borderRadius: 999, padding: '10px 26px', fontSize: 30, fontWeight: 800, letterSpacing: 2 }}>{tag}</div></Rise>}
    <Rise delay={3}><div style={{ fontSize: 66, fontWeight: 800, color: dark ? '#fff' : INK, lineHeight: 1.12, marginTop: 22, letterSpacing: -1.2 }}>{text}</div></Rise>
  </div>
);

export const IgAd: React.FC<{ script: keyof typeof SCRIPTS }> = ({ script }) => {
  const sc = SCRIPTS[script];
  const lines = L(sc.voice);
  const { durs, starts } = plan(sc);
  const endIdx = sc.beats.length - 1;

  // Group consecutive screen beats into one phone run.
  const runs: { from: number; to: number }[] = [];
  sc.beats.forEach((b, i) => {
    if (!b.screens) return;
    const last = runs[runs.length - 1];
    if (last && last.to === i - 1) last.to = i; else runs.push({ from: i, to: i });
  });

  return (
    <LangCtx.Provider value="en">
      <AbsoluteFill style={{ fontFamily, background: LIGHT, whiteSpace: 'pre-line' }}>
        {sc.beats.map((b, i) => (
          <Sequence key={i} from={starts[i]} durationInFrames={durs[i]}>
            {b.end ? (
              <EndCard dur={durs[i]} tagline={b.end.tagline} />
            ) : (
              <>
                <Fade first={i === 0}><AbsoluteFill style={{ background: b.bg ?? LIGHT }} /></Fade>
                {b.scene && <Fade first={i === 0}>{React.createElement(b.scene, { dur: durs[i] })}</Fade>}
                <Caption text={b.caption ?? lines[b.line!].text} tag={b.tag} dark={b.dark} />
              </>
            )}
            {b.line !== undefined && <Say line={lines[b.line]} at={i === 0 ? 4 : 0} />}
          </Sequence>
        ))}
        {runs.map((r) => {
          const from = starts[r.from];
          const total = starts[r.to] + durs[r.to] - from;
          const segs: { s: Screen; from: number; dur: number }[] = [];
          for (let i = r.from; i <= r.to; i += 1) {
            const list = sc.beats[i].screens!;
            const each = Math.floor(durs[i] / list.length);
            list.forEach((s, k) => segs.push({ s, from: starts[i] - from + k * each, dur: k === list.length - 1 ? durs[i] - k * each : each }));
          }
          return <Sequence key={r.from} from={from} durationInFrames={total}><PhoneRun segs={segs} total={total} /></Sequence>;
        })}
        {sc.timer && (
          <Sequence from={starts[1]} durationInFrames={starts[endIdx] - starts[1]}>
            <TimerFromStart offset={starts[1]} />
          </Sequence>
        )}
      </AbsoluteFill>
    </LangCtx.Provider>
  );
};
// Timer shows real elapsed video time (the voice line at the end says "twenty-nine seconds").
const TimerFromStart: React.FC<{ offset: number }> = ({ offset }) => {
  const f = useCurrentFrame() + offset;
  const s = Math.min(29, Math.floor(f / FPS));
  return (
    <div style={{ position: 'absolute', right: 40, top: 640, background: INK, color: '#fff', borderRadius: 18, padding: '12px 20px', fontSize: 44, fontWeight: 800, fontVariantNumeric: 'tabular-nums', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 12px 30px rgba(0,0,0,.25)' }}>
      <span style={{ width: 14, height: 14, borderRadius: 7, background: RED }} />
      00:{String(s).padStart(2, '0')}
    </div>
  );
};
export const IG_SCRIPTS = Object.keys(SCRIPTS) as (keyof typeof SCRIPTS)[];
