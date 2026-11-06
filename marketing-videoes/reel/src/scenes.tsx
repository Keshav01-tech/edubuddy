import React from 'react';
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import {
  Avatar, Calendar, Card, Check, Cross, Cursor, FileText, Heading, Pill, Printer, Sparkle, Users, Wallet, clamp, inr, lerp, useIn,
} from './ui';
import type { Copy } from './copy';
import { Theme, useT } from './themes';

type P = { t: Copy; dur: number };

const outline = (T: Theme, w = 4) => (T.name === 'pop' ? `${w}px solid #111` : 'none');
const hard = (T: Theme, soft: string) => (T.name === 'pop' ? '8px 8px 0 #111' : soft);
const f = (dur: number, x: number) => Math.round(dur * x);

/* ---------------------------------------------------------------- explainer pieces */

/** "1 · Tap Mark all present" bar under the headline; swaps as the steps advance. */
const StepBar: React.FC<{ steps: string[]; starts: number[]; dur: number }> = ({ steps, starts, dur }) => {
  const T = useT();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  let idx = -1;
  starts.forEach((s, i) => {
    if (frame >= f(dur, s)) idx = i;
  });
  if (idx < 0) return null;
  const s = spring({ frame: frame - f(dur, starts[idx]), fps, config: { damping: 14 } });
  return (
    <div style={{ position: 'absolute', top: 432, left: 70, right: 70, display: 'flex', alignItems: 'center', gap: 18 }}>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 20, background: T.cardBg, color: T.ink, borderRadius: Math.min(T.radius, 40),
          padding: '14px 30px 14px 14px', border: outline(T), boxShadow: hard(T, '0 16px 40px rgba(0,0,0,0.22)'),
          opacity: s, transform: `translateY(${(1 - s) * -16}px) scale(${0.92 + 0.08 * s})`, transformOrigin: 'left center', maxWidth: 940,
        }}
      >
        <div
          style={{
            width: 60, height: 60, borderRadius: 30, background: T.amber, color: T.onAccent, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 800,
          }}
        >
          {idx + 1}
        </div>
        <div style={{ fontSize: 33, fontWeight: 700, lineHeight: 1.2 }}>{steps[idx]}</div>
      </div>
    </div>
  );
};

/** Pulsing highlight box that dims everything around the thing being explained. */
const Spot: React.FC<{ x: number; y: number; w: number; h: number; from: number; to: number; r?: number }> = ({ x, y, w, h, from, to, r = 22 }) => {
  const T = useT();
  const frame = useCurrentFrame();
  const o = interpolate(frame, [from, from + 6, to - 5, to], [0, 1, 1, 0], clamp);
  const pulse = 1 + Math.sin(frame / 4) * 0.012;
  return (
    <div
      style={{
        position: 'absolute', left: x - 12, top: y - 12, width: w + 24, height: h + 24, borderRadius: r, opacity: o,
        border: `5px solid ${T.amber}`, transform: `scale(${pulse})`, pointerEvents: 'none',
        boxShadow: `0 0 0 3000px rgba(5,5,20,0.28), 0 0 40px ${T.amber}aa`,
      }}
    />
  );
};

const featureKicker = (n: number, name: string) => `${n} OF 4 · ${name}`;

/* ---------------------------------------------------------------- 0. HOOK (problem -> answer) */

export const Hook: React.FC<P> = ({ t, dur }) => {
  const T = useT();
  const frame = useCurrentFrame();
  const swap = f(dur, 0.5);
  const q = useIn(2, 14);
  const out = lerp(frame, [swap, swap + 12], [0, 1]);
  const a = useIn(swap + 6, 14);
  return (
    <>
      <div style={{ position: 'absolute', top: 230, left: 70, right: 70, fontFamily: T.headFont, fontWeight: T.headWeight, color: T.fg }}>
        <div style={{ fontSize: 76, lineHeight: 1.1, letterSpacing: T.headSpacing, opacity: q * (1 - out), transform: `translateY(${(1 - q) * 40 - out * 60}px)` }}>
          {t.hook.q}
        </div>
        <div style={{ position: 'absolute', top: 30, fontSize: 88, lineHeight: 1.05, letterSpacing: T.headSpacing, opacity: a, transform: `translateY(${(1 - a) * 60}px)` }}>
          {t.hook.a}
        </div>
      </div>
      {t.hook.items.map((item, i) => {
        const s = useIn(8 + i * 7, 9);
        const strike = lerp(frame, [swap - 22 + i * 4, swap - 12 + i * 4], [0, 100]);
        const fall = lerp(frame, [swap + i * 3, swap + 16 + i * 3], [0, 1]);
        return (
          <div
            key={i}
            style={{
              position: 'absolute', left: 70, top: 560 + i * 200, fontSize: 108, fontFamily: T.headFont, fontWeight: T.headWeight,
              color: T.fg, whiteSpace: 'nowrap', opacity: Math.min(1, s * 1.3) * (1 - fall), transformOrigin: 'left center',
              transform: `scale(${2 - s}) rotate(${(i % 2 ? 3 : -3) + fall * (i % 2 ? 25 : -25)}deg) translateY(${fall * 500}px)`,
            }}
          >
            <span style={{ position: 'relative' }}>
              {item}
              <span style={{ position: 'absolute', left: -10, top: '52%', height: 12, borderRadius: 6, background: T.red, width: `calc(${strike}% + ${strike > 0 ? 20 : 0}px)` }} />
            </span>
          </div>
        );
      })}
      <DashCard start={swap + 4} />
    </>
  );
};

const DashCard: React.FC<{ start: number }> = ({ start }) => {
  const T = useT();
  const frame = useCurrentFrame();
  const p = useIn(start, 16);
  const tiles = [
    { I: Users, l: 'Total students', v: 248, fmt: (n: number) => inr(n), c: T.ink },
    { I: Check, l: "Today's attendance", v: 92, fmt: (n: number) => `${Math.round(n)}%`, c: T.green },
    { I: Wallet, l: 'Fee collected', v: 340000, fmt: (n: number) => `₹${inr(n)}`, c: T.ink },
    { I: Calendar, l: 'Pending fees', v: 124500, fmt: (n: number) => `₹${inr(n)}`, c: T.red },
  ];
  return (
    <Card style={{ position: 'absolute', top: 560, left: 70, width: 940, opacity: p, transform: `translateY(${(1 - p) * 300}px) scale(${0.9 + 0.1 * p})` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 28 }}>
        <div style={{ ...T.logo, width: 64, height: 64, borderRadius: 18, fontSize: 38, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'none', transform: 'none', border: outline(T, 3) }}>E</div>
        <div style={{ fontSize: 38, fontWeight: 800 }}>EduBuddy</div>
        <div style={{ marginLeft: 'auto', fontSize: 28, color: T.muted, fontWeight: 600 }}>Dashboard</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {tiles.map(({ I, l, v, fmt, c }, i) => {
          const s = useIn(start + 8 + i * 4, 12);
          return (
            <div key={l} style={{ background: T.canvas, borderRadius: Math.min(24, T.radius), padding: 28, border: outline(T, 3), transform: `scale(${s})` }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: T.indigo, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <I size={32} color="#fff" />
              </div>
              <div style={{ fontSize: 26, color: T.muted, fontWeight: 600, marginTop: 18 }}>{l}</div>
              <div style={{ fontSize: 54, fontWeight: 800, color: c, letterSpacing: -1 }}>{fmt(lerp(frame, [start + 10, start + 40], [0, v]))}</div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 22, display: 'flex', justifyContent: 'space-between', fontSize: 28, fontWeight: 600, color: T.muted }}>
        <span>Active inquiries</span>
        <span style={{ color: T.indigo, fontWeight: 800 }}>{Math.round(lerp(frame, [start + 10, start + 40], [0, 12]))}</span>
      </div>
    </Card>
  );
};

/* ---------------------------------------------------------------- 1. ATTENDANCE */

const NAMES = ['Aarav', 'Diya', 'Rahul', 'Isha', 'Kabir', 'Meera', 'Arjun', 'Sara', 'Vivaan', 'Anaya', 'Rohan', 'Priya', 'Aditya', 'Neha', 'Kunal', 'Tara'];
const ABSENT = [5, 10];
const GX = 110, GY = 704, TW = 203, TH = 112, GAP = 16;
const tileCenter = (i: number) => [GX + (i % 4) * (TW + GAP) + TW / 2, GY + Math.floor(i / 4) * (TH + GAP) + TH / 2];

export const Attendance: React.FC<P> = ({ t, dur }) => {
  const T = useT();
  const frame = useCurrentFrame();
  const card = useIn(4);
  const starts = [0.1, 0.36, 0.6];
  const tap = f(dur, 0.17);
  const absentAt = [f(dur, 0.41), f(dur, 0.51)];
  const press = (at: number) => lerp(frame, [at - 2, at, at + 5], [0, 1, 0]);
  const [ax, ay] = tileCenter(ABSENT[0]);
  const [bx, by] = tileCenter(ABSENT[1]);
  const keys = [f(dur, 0.06), f(dur, 0.16), f(dur, 0.26), f(dur, 0.4), f(dur, 0.44), f(dur, 0.5)];
  const cx = interpolate(frame, keys, [920, 830, 830, ax, ax, bx], clamp);
  const cy = interpolate(frame, keys, [1380, 630, 630, ay, ay, by], clamp);
  const cursorO = interpolate(frame, [keys[0], keys[0] + 5, f(dur, 0.55), f(dur, 0.59)], [0, 1, 1, 0], clamp);
  const status = (i: number) => {
    const k = ABSENT.indexOf(i);
    if (k >= 0 && frame >= absentAt[k]) return 'absent';
    return frame >= tap + 4 + ((i % 4) + Math.floor(i / 4)) * 2 ? 'present' : 'none';
  };
  const present = NAMES.filter((_, i) => status(i) === 'present').length;
  const ring = lerp(frame, [f(dur, 0.58), f(dur, 0.75)], [0, 14 / 16]);
  const absentList = useIn(f(dur, 0.62), 12);
  return (
    <>
      <Heading kicker={featureKicker(1, 'ATTENDANCE')} title={t.attendance} />
      <Card style={{ position: 'absolute', top: 560, left: 70, width: 940, padding: 40, opacity: card, transform: `translateY(${(1 - card) * 120}px)` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 80, marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 38, fontWeight: 800 }}>Class 10 · Batch A</div>
            <div style={{ fontSize: 26, color: T.muted, fontWeight: 500 }}>Today · 16 students</div>
          </div>
          <Pill bg={T.indigo} color="#fff" style={{ fontSize: 28, padding: '16px 26px', transform: `scale(${1 - press(tap) * 0.08})` }}>
            <Check size={28} />Mark all present
          </Pill>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(4, ${TW}px)`, gap: GAP }}>
          {NAMES.map((n, i) => {
            const st = status(i);
            const flip = st === 'none' ? 0 : 1;
            const bg = st === 'present' ? T.greenBg : st === 'absent' ? T.redBg : T.canvas;
            const fg = st === 'present' ? T.green : st === 'absent' ? T.red : T.muted;
            return (
              <div
                key={n}
                style={{
                  height: TH, borderRadius: Math.min(20, T.radius), background: bg, border: `3px solid ${st === 'none' ? T.line : fg}`,
                  display: 'flex', alignItems: 'center', gap: 12, padding: '0 14px', position: 'relative',
                  transform: `scale(${1 + (st !== 'none' ? 0 : 0) - (ABSENT.includes(i) ? press(absentAt[ABSENT.indexOf(i)]) * 0.08 : 0)})`,
                }}
              >
                <Avatar name={n} hue={(i * 47) % 360} size={52} />
                <div style={{ fontSize: 27, fontWeight: 700, color: T.ink }}>{n}</div>
                <div style={{ position: 'absolute', top: 8, right: 8, transform: `scale(${flip})`, color: fg }}>
                  {st === 'absent' ? <Cross size={24} /> : <Check size={24} />}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 30, marginTop: 30, height: 140 }}>
          <svg width={130} height={130} viewBox="0 0 130 130">
            <circle cx={65} cy={65} r={52} fill="none" stroke={T.line} strokeWidth={16} />
            <circle cx={65} cy={65} r={52} fill="none" stroke={T.green} strokeWidth={16} strokeLinecap="round"
              strokeDasharray={`${ring * 2 * Math.PI * 52} 999`} transform="rotate(-90 65 65)" />
            <text x={65} y={74} textAnchor="middle" fontSize={28} fontWeight={800} fill={T.ink} fontFamily="inherit">{Math.round(ring * 100)}%</text>
          </svg>
          <div>
            <div style={{ fontSize: 32, fontWeight: 800 }}>{present}/16 present</div>
            <div style={{ display: 'flex', gap: 12, marginTop: 12, opacity: absentList, transform: `translateX(${(1 - absentList) * 30}px)` }}>
              <span style={{ fontSize: 26, color: T.muted, fontWeight: 600, alignSelf: 'center' }}>Absent:</span>
              {ABSENT.map((i) => (
                <Pill key={i} bg={T.redBg} color={T.red} style={{ fontSize: 26, padding: '8px 18px' }}>{NAMES[i]}</Pill>
              ))}
            </div>
          </div>
        </div>
      </Card>
      <Spot x={660} y={604} w={310} h={72} from={f(dur, 0.1)} to={f(dur, 0.32)} r={40} />
      <Spot x={GX} y={GY + TH + GAP} w={860} h={TH * 2 + GAP} from={f(dur, 0.36)} to={f(dur, 0.58)} />
      <Spot x={GX} y={1230} w={860} h={140} from={f(dur, 0.6)} to={dur} />
      <StepBar steps={t.steps.attendance} starts={starts} dur={dur} />
      <Cursor x={cx} y={cy} pressed={Math.max(press(tap), press(absentAt[0]), press(absentAt[1]))} opacity={cursorO} />
    </>
  );
};

/* ---------------------------------------------------------------- 2. FEES */

export const Fees: React.FC<P> = ({ t, dur }) => {
  const T = useT();
  const frame = useCurrentFrame();
  const card = useIn(4);
  const collected = 340000, pending = 124500;
  const share = collected / (collected + pending);
  const draw = lerp(frame, [f(dur, 0.05), f(dur, 0.3)], [0, 1]);
  const C = 2 * Math.PI * 95;
  const save = f(dur, 0.38);
  const press = lerp(frame, [save - 2, save, save + 5], [0, 1, 0]);
  const saved = frame >= save;
  const printY = lerp(frame, [f(dur, 0.42), f(dur, 0.7)], [-440, 0]);
  const stamp = useIn(f(dur, 0.72), 10);
  const cursorO = interpolate(frame, [f(dur, 0.26), f(dur, 0.3), save + 6, save + 12], [0, 1, 1, 0], clamp);
  const row = (label: string, value: string, strong?: boolean) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: `2px dashed ${T.line}`, fontSize: 27 }}>
      <span style={{ color: T.muted, fontWeight: 600 }}>{label}</span>
      <span style={{ fontWeight: strong ? 800 : 700, color: strong ? T.indigo : T.ink }}>{value}</span>
    </div>
  );
  return (
    <>
      <Heading kicker={featureKicker(2, 'FEES')} title={t.fees} />
      <Card style={{ position: 'absolute', top: 560, left: 70, width: 940, padding: 40, opacity: card, transform: `translateY(${(1 - card) * 120}px)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 40, height: 240 }}>
          <svg width={240} height={240} viewBox="0 0 240 240">
            <circle cx={120} cy={120} r={95} fill="none" stroke={T.line} strokeWidth={40} />
            <circle cx={120} cy={120} r={95} fill="none" stroke={T.indigo} strokeWidth={40}
              strokeDasharray={`${C * share * draw} 999`} transform="rotate(-90 120 120)" />
            <circle cx={120} cy={120} r={95} fill="none" stroke={T.amber} strokeWidth={40}
              strokeDasharray={`0 ${C * share} ${C * (1 - share) * draw} 999`} transform="rotate(-90 120 120)" />
          </svg>
          <div style={{ flex: 1 }}>
            {[
              { l: 'Collected', v: collected, c: T.indigo },
              { l: 'Pending', v: pending, c: T.amber },
            ].map((x) => (
              <div key={x.l} style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 28, color: T.muted, fontWeight: 600 }}>
                  <span style={{ width: 20, height: 20, borderRadius: 6, background: x.c }} />{x.l}
                </div>
                <div style={{ fontSize: 58, fontWeight: 800, letterSpacing: -1 }}>₹{inr(x.v * draw)}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 24, height: 110, borderRadius: Math.min(22, T.radius), background: T.canvas, border: outline(T, 3), display: 'flex', alignItems: 'center', gap: 20, padding: '0 22px' }}>
          <Avatar name="Diya Patel" hue={330} size={62} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 30, fontWeight: 700 }}>Diya Patel</div>
            <div style={{ fontSize: 24, color: T.muted, fontWeight: 600 }}>₹4,500 · UPI · Today</div>
          </div>
          <Pill bg={saved ? T.green : T.indigo} color="#fff" style={{ fontSize: 27, transform: `scale(${1 - press * 0.08})` }}>
            {saved ? <><Check size={26} />Saved</> : 'Save payment'}
          </Pill>
        </div>
      </Card>
      {/* printer slot + receipt */}
      <div style={{ position: 'absolute', left: 120, top: 1040, width: 840, height: 26, borderRadius: 13, background: T.name === 'pop' ? '#111' : '#1e1b3a', opacity: card }} />
      <div style={{ position: 'absolute', left: 160, top: 1053, width: 760, height: 450, overflow: 'hidden' }}>
        <div style={{ transform: `translateY(${printY}px)`, background: '#fff', color: T.ink, padding: '30px 38px', height: 440, boxShadow: '0 20px 40px rgba(0,0,0,0.3)', position: 'relative', border: outline(T, 3) }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{ fontSize: 36, fontWeight: 800 }}>Fee Receipt</div>
            <div style={{ fontSize: 24, color: T.muted, fontWeight: 600 }}>Receipt no. 0142</div>
          </div>
          <div style={{ marginTop: 10 }}>
            {row('Student', 'Diya Patel')}
            {row('Batch', 'Class 10 · A')}
            {row('Amount received', '₹4,500', true)}
            {row('Paid by', 'UPI')}
          </div>
          <Pill bg={T.indigo} color="#fff" style={{ marginTop: 26, fontSize: 26 }}>
            <Printer size={26} />Print or save PDF
          </Pill>
          <div style={{ position: 'absolute', right: 40, bottom: 44, transform: `scale(${stamp}) rotate(-14deg)`, border: `5px solid ${T.green}`, color: T.green, fontSize: 44, fontWeight: 800, padding: '4px 22px', borderRadius: 12, letterSpacing: 4 }}>
            PAID
          </div>
        </div>
      </div>
      <Spot x={110} y={600} w={860} h={240} from={f(dur, 0.05)} to={f(dur, 0.28)} />
      <Spot x={110} y={864} w={860} h={110} from={f(dur, 0.3)} to={f(dur, 0.52)} />
      <Spot x={160} y={1053} w={760} h={440} from={f(dur, 0.55)} to={dur} r={10} />
      <StepBar steps={t.steps.fees} starts={[0.05, 0.3, 0.55]} dur={dur} />
      <Cursor x={lerp(frame, [f(dur, 0.26), save], [900, 860])} y={lerp(frame, [f(dur, 0.26), save], [1300, 920])} pressed={press} opacity={cursorO} />
    </>
  );
};

/* ---------------------------------------------------------------- 3. LEADS */

const STAGES = [
  { label: 'New', c: '#0284c7', bg: '#e0f2fe' },
  { label: 'Contacted', c: '#b45309', bg: '#fef3c7' },
  { label: 'Visit planned', c: '#6d28d9', bg: '#ede9fe' },
  { label: 'Joined', c: '#047857', bg: '#d1fae5' },
];
const NODE_Y = [700, 880, 1060, 1240];

export const Leads: React.FC<P> = ({ t, dur }) => {
  const T = useT();
  const frame = useCurrentFrame();
  const at = [0.05, 0.3, 0.52, 0.72].map((x) => f(dur, x));
  const reached = at.filter((a) => frame >= a).length - 1;
  const moves = [useIn(at[1], 14), useIn(at[2], 14), useIn(at[3], 14)];
  const CH = 250;
  const cardY = NODE_Y[0] + (moves[0] + moves[1] + moves[2]) * 180 - CH / 2;
  const appear = useIn(at[0], 13);
  const fill = lerp(frame, [at[0], at[3] + 10], [0, 1]);
  const joined = reached >= 3;
  const fu = useIn(at[1] + 6, 12);
  const stage = STAGES[Math.max(0, reached)];
  const stat = useIn(at[3] + 14, 12);
  return (
    <>
      <Heading kicker={featureKicker(3, 'LEADS')} title={t.leads} />
      {/* pipeline */}
      <div style={{ position: 'absolute', left: 146, top: NODE_Y[0], width: 8, height: NODE_Y[3] - NODE_Y[0], borderRadius: 4, background: T.panelBorder }} />
      <div style={{ position: 'absolute', left: 146, top: NODE_Y[0], width: 8, height: (NODE_Y[3] - NODE_Y[0]) * fill, borderRadius: 4, background: T.amber }} />
      {STAGES.map((s, i) => {
        const on = reached >= i;
        const pop = useIn(at[i], 10);
        return (
          <React.Fragment key={s.label}>
            <div
              style={{
                position: 'absolute', left: 150 - 34, top: NODE_Y[i] - 34, width: 68, height: 68, borderRadius: 34,
                background: on ? T.amber : T.panel, border: `4px solid ${on ? T.amber : T.panelBorder}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.onAccent, fontWeight: 800, fontSize: 30,
                transform: `scale(${on ? 1 + (1 - pop) * 0.4 : 1})`,
              }}
            >
              {on ? <Check size={34} /> : <span style={{ color: T.fgSoft }}>{i + 1}</span>}
            </div>
            <div style={{ position: 'absolute', left: 205, top: NODE_Y[i] - 26, fontSize: 38, fontWeight: 800, color: T.fg, opacity: on ? 1 : 0.45, width: 260 }}>
              {s.label}
            </div>
          </React.Fragment>
        );
      })}
      {/* the lead */}
      <div
        style={{
          position: 'absolute', left: 480, top: cardY, width: 530, height: CH, background: T.cardBg, color: T.ink,
          borderRadius: Math.min(30, T.radius), padding: 26, boxShadow: hard(T, '0 24px 50px rgba(0,0,0,0.35)'), border: outline(T),
          opacity: appear, transform: `scale(${0.7 + appear * 0.3})`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <Avatar name="Meera Iyer" hue={270} size={64} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 32, fontWeight: 800 }}>Meera Iyer</div>
            <div style={{ fontSize: 23, color: T.muted, fontWeight: 600 }}>Class 10 · Came from Instagram</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 20, alignItems: 'center' }}>
          <Pill bg={stage.bg} color={stage.c} style={{ fontSize: 25, padding: '8px 18px' }}>{stage.label}</Pill>
          {joined ? (
            <Pill bg={T.greenBg} color={T.green} style={{ fontSize: 25, padding: '8px 18px' }}><Check size={24} />Admission done</Pill>
          ) : (
            <div style={{ opacity: fu, transform: `scale(${fu})`, transformOrigin: 'left' }}>
              <Pill bg={T.canvas} color={T.ink} style={{ fontSize: 24, padding: '8px 16px', whiteSpace: 'nowrap' }}><Calendar size={24} color={T.indigo} />Follow-up: Tomorrow</Pill>
            </div>
          )}
        </div>
      </div>
      <Confetti at={at[3] + 8} x={745} y={NODE_Y[3]} />
      <div style={{ position: 'absolute', top: 1400, left: 70, right: 70, display: 'flex', justifyContent: 'center', opacity: stat, transform: `scale(${0.7 + stat * 0.3})` }}>
        <Pill bg={T.amber} color={T.onAccent} style={{ fontSize: 36, padding: '16px 34px', border: outline(T), boxShadow: hard(T, 'none') }}>
          <Sparkle size={32} />38 joined this month
        </Pill>
      </div>
      <Spot x={480} y={NODE_Y[0] - 125} w={530} h={250} from={at[0] + 4} to={at[1] - 2} r={34} />
      <Spot x={500} y={NODE_Y[1] - 125 + 166} w={330} h={50} from={at[1] + 10} to={at[2] + 6} r={34} />
      <Spot x={480} y={NODE_Y[3] - 125} w={530} h={250} from={at[3] + 8} to={dur} r={34} />
      <StepBar steps={t.steps.leads} starts={[0.05, 0.3, 0.55]} dur={dur} />
    </>
  );
};

const Confetti: React.FC<{ at: number; x: number; y: number }> = ({ at, x, y }) => {
  const T = useT();
  const frame = useCurrentFrame();
  const tt = frame - at;
  if (tt < 0 || tt > 60) return null;
  const colors = [T.amber, T.indigo, T.green, T.red, T.indigoLight];
  return (
    <>
      {Array.from({ length: 30 }).map((_, i) => {
        const ang = (i / 30) * Math.PI * 2 + (i % 3) * 0.3;
        const sp = 14 + (i % 5) * 4;
        return (
          <div
            key={i}
            style={{
              position: 'absolute', width: 16, height: 26, borderRadius: 4, background: colors[i % colors.length],
              left: x + Math.cos(ang) * sp * tt, top: y + Math.sin(ang) * sp * tt * 0.8 + 0.6 * tt * tt,
              transform: `rotate(${tt * (8 + i)}deg)`, opacity: 1 - tt / 60,
            }}
          />
        );
      })}
    </>
  );
};

/* ---------------------------------------------------------------- 4. TEST GENERATOR (real screenshots) */

// crop regions (source px in the 1280x720 screenshots) — tooltips at the bottom are cut off
const SHOTS = [
  { src: 'shots/02-class.png', x: 310, y: 80, w: 660, end: 610, spot: { y: 250, h: 46 } },
  { src: 'shots/03-chapters.png', x: 310, y: 60, w: 660, end: 610, spot: { y: 280, h: 96 } },
  { src: 'shots/04-pattern.png', x: 310, y: 60, w: 660, end: 580, spot: { y: 320, h: 222 } },
  { src: 'shots/05-paper.png', x: 240, y: 130, w: 800, end: 580, spot: null },
];
const FX = 70, FY = 560, FW = 940, BAR = 60, FH = 740;

const Shot: React.FC<{ src: string; x: number; y: number; w: number; width: number; height: number }> = ({ src, x, y, w, width, height }) => {
  const s = width / w;
  return (
    <div style={{ width, height, overflow: 'hidden', background: '#eeedeb', position: 'relative' }}>
      <Img src={staticFile(src)} style={{ position: 'absolute', width: 1280 * s, left: -x * s, top: -y * s }} />
    </div>
  );
};

export const TestGen: React.FC<P> = ({ t, dur }) => {
  const T = useT();
  const frame = useCurrentFrame();
  const starts = [0.03, 0.25, 0.47, 0.68];
  const frame0 = useIn(2);
  const key = useIn(f(dur, 0.84), 14);
  return (
    <>
      <Heading kicker={featureKicker(4, 'TEST GENERATOR')} title={t.test} />
      <div
        style={{
          position: 'absolute', left: FX, top: FY, width: FW, borderRadius: Math.min(T.radius, 28), overflow: 'hidden', background: '#fff',
          boxShadow: hard(T, '0 40px 90px rgba(0,0,0,0.45)'), border: outline(T, 5),
          opacity: frame0, transform: `translateY(${(1 - frame0) * 120}px)`,
        }}
      >
        <div style={{ height: BAR, background: '#f1f2f7', display: 'flex', alignItems: 'center', gap: 10, padding: '0 22px', borderBottom: '2px solid #e3e5ee' }}>
          {['#ff5f57', '#febc2e', '#28c840'].map((c) => <span key={c} style={{ width: 16, height: 16, borderRadius: 8, background: c }} />)}
          <span style={{ marginLeft: 20, fontSize: 24, fontWeight: 700, color: '#475569' }}>EduBuddy · New test paper</span>
        </div>
        <div style={{ position: 'relative', height: FH }}>
          {SHOTS.map((s, i) => {
            const from = f(dur, starts[i]);
            const to = i < SHOTS.length - 1 ? f(dur, starts[i + 1]) : dur + 10;
            const o = interpolate(frame, [from - 2, from + 6, to, to + 8], [0, 1, 1, 0], clamp);
            return (
              <div key={s.src} style={{ position: 'absolute', inset: 0, opacity: i === 0 ? Math.max(o, frame < from ? 1 : 0) : o }}>
                <Shot src={s.src} x={s.x} y={s.y} w={s.w} width={FW} height={Math.min(FH, (s.end - s.y) * (FW / s.w))} />
              </div>
            );
          })}
        </div>
      </div>
      {/* "Question paper" + answer key cards for the final step */}
      <div style={{ position: 'absolute', left: FX + 24, top: FY + BAR + 20, opacity: interpolate(frame, [f(dur, 0.7), f(dur, 0.74)], [0, 1], clamp) }}>
        <Pill bg={T.indigo} color="#fff" style={{ fontSize: 26 }}><FileText size={26} />Question paper</Pill>
      </div>
      <div
        style={{
          position: 'absolute', left: 440, top: 1010, width: 560, borderRadius: 18, overflow: 'hidden', background: '#fff',
          boxShadow: hard(T, '0 30px 70px rgba(0,0,0,0.5)'), border: outline(T, 4),
          opacity: key, transform: `translateX(${(1 - key) * 500}px) rotate(${3 * key}deg)`,
        }}
      >
        <div style={{ padding: '14px 20px', background: T.amber, color: T.onAccent, fontSize: 26, fontWeight: 800, display: 'flex', gap: 10, alignItems: 'center' }}>
          <Check size={26} />Answer key
        </div>
        <Shot src="shots/07-answers.png" x={240} y={40} w={800} width={560} height={340} />
      </div>
      {SHOTS.map((s, i) =>
        s.spot ? (
          <Spot
            key={s.src}
            x={FX + 16}
            y={FY + BAR + (s.spot.y - s.y) * (FW / s.w)}
            w={FW - 32}
            h={s.spot.h * (FW / s.w)}
            from={f(dur, starts[i]) + 6}
            to={f(dur, starts[i + 1])}
            r={18}
          />
        ) : null,
      )}
      <StepBar steps={t.steps.test} starts={starts} dur={dur} />
    </>
  );
};

/* ---------------------------------------------------------------- 5. OUTRO */

export const Outro: React.FC<P> = ({ t }) => {
  const T = useT();
  const logo = useIn(0, 11);
  const name = useIn(8);
  const tag = useIn(16);
  const cta = useIn(44, 10);
  const feats = [
    { I: Check, l: 'Attendance' },
    { I: Wallet, l: 'Fees & receipts' },
    { I: Users, l: 'Leads & follow-ups' },
    { I: FileText, l: 'Test generator' },
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 300, color: T.fg }}>
      <div
        style={{
          width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 128, fontWeight: 800,
          ...T.logo, transform: `scale(${logo}) rotate(${(1 - logo) * -30 + (T.name === 'chalk' ? -4 : 0)}deg)`,
        }}
      >
        E
      </div>
      <div style={{ fontSize: 116, fontFamily: T.headFont, fontWeight: T.headWeight, letterSpacing: T.headSpacing - 1, marginTop: 40, opacity: name, transform: `translateY(${(1 - name) * 40}px)` }}>
        EduBuddy
      </div>
      <div style={{ fontSize: 46, fontWeight: 600, color: T.fgSoft, opacity: tag, marginTop: 6, textAlign: 'center', padding: '0 60px' }}>{t.tagline}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 60, width: 920 }}>
        {feats.map(({ I, l }, i) => {
          const s = useIn(22 + i * 4, 12);
          return (
            <div
              key={l}
              style={{
                display: 'flex', alignItems: 'center', gap: 18, padding: '24px 24px', borderRadius: Math.min(T.radius, 26),
                background: T.panel, border: `${T.name === 'pop' ? 4 : 2}px solid ${T.panelBorder}`, transform: `scale(${s})`,
                boxShadow: T.name === 'pop' ? '6px 6px 0 #111' : 'none',
              }}
            >
              <div style={{ width: 60, height: 60, borderRadius: 18, background: T.amber, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <I size={34} color={T.onAccent} />
              </div>
              <div style={{ fontSize: 32, fontWeight: 700 }}>{l}</div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          marginTop: 70, background: T.amber, color: T.onAccent, fontSize: 48, fontWeight: 800, padding: '30px 70px', borderRadius: 999,
          transform: `scale(${cta})`, boxShadow: T.name === 'pop' ? '10px 10px 0 #111' : `0 20px 60px ${T.amber}88`,
          border: T.name === 'pop' ? '5px solid #111' : 'none',
        }}
      >
        {t.cta}
      </div>
    </div>
  );
};
