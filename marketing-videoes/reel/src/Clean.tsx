import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import enT from './timings-en.json';
import hiT from './timings-hi.json';
import { Check, Cross, Wallet, Users, FileText, Calendar, Printer } from './ui';

const FPS = 30;
const LEAD = 4;
const TAIL = [30, 30, 30, 30, 36, 60];
const INK = '#14172b';
const MUTED = '#6b7090';
const BG = '#fbfbfd';
const FONT = '"Segoe UI", "Helvetica Neue", Arial, sans-serif';
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

export type CLang = 'en' | 'hi';
const TIM = { en: enT, hi: hiT };
const LangCtx = React.createContext<CLang>('en');

export const cleanFrames = (lang: CLang = 'en') => TIM[lang].scenes.map((s, i) => LEAD + Math.ceil(s.seconds * FPS) + TAIL[i]);

const useIn = (delay = 0) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - delay, fps, config: { damping: 200 }, durationInFrames: 22 });
};
const Rise: React.FC<{ delay?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ delay = 0, children, style }) => {
  const p = useIn(delay);
  return <div style={{ opacity: p, transform: `translateY(${(1 - p) * 28}px)`, ...style }}>{children}</div>;
};

const HI_COPY = [
  { name: 'Attendance', line: 'Poori class, bas kuch taps mein.', sub: 'Parents ko usi din WhatsApp pe batao.' },
  { name: 'Fees', line: 'Har payment record karo. Receipt print karo.', sub: 'Kisne diya, kisne nahi, sab dikhega.' },
  { name: 'Admissions', line: 'Har call aur walk-in save karo.', sub: 'Join hone tak follow-up. Koi nahi chhutega.' },
  { name: 'Tests', line: 'Class 6 se 12 ka NCERT paper.', sub: 'Sirf 5 minute mein, answer key ke saath.' },
];
const FEATURES = [
  { n: 1, color: '#4f46e5', soft: '#eceafd', name: 'Attendance', line: 'Mark a whole class in a few taps.', sub: 'Tell parents the same day on WhatsApp.', Icon: Users },
  { n: 2, color: '#0f9f6e', soft: '#e1f6ee', name: 'Fees', line: 'Record every payment. Print the receipt.', sub: 'See who has paid and who still owes.', Icon: Wallet },
  { n: 3, color: '#e8890c', soft: '#fdf0dc', name: 'Admissions', line: 'Save every call and walk-in.', sub: 'Follow up until they join. Nobody is forgotten.', Icon: Calendar },
  { n: 4, color: '#d6409f', soft: '#fbe6f3', name: 'Tests', line: 'NCERT paper for classes 6 to 12.', sub: 'Ready in about five minutes, with an answer key.', Icon: FileText },
];

const Demo: React.FC<{ i: number; color: string; soft: string }> = ({ i, color, soft }) => {
  const f = useCurrentFrame();
  const hi = React.useContext(LangCtx) === 'hi';
  const box: React.CSSProperties = { background: '#fff', borderRadius: 32, border: '1px solid #e7e9f3', boxShadow: '0 30px 70px rgba(30,30,80,.10)', padding: 44, width: 640 };
  if (i === 0) {
    const names = ['Aarav', 'Diya', 'Kabir', 'Meera', 'Rohan'];
    return (
      <div style={box}>
        {names.map((nm, k) => {
          const absent = k === 2;
          const flip = interpolate(f, [30 + k * 7, 38 + k * 7], [0, 1], clamp);
          return (
            <Rise key={nm} delay={k * 4} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: k < 4 ? '1px solid #eef0f7' : 'none' }}>
              <span style={{ fontSize: 34, fontWeight: 600, color: INK }}>{nm}</span>
              <span style={{ width: 56, height: 56, borderRadius: 28, display: 'grid', placeItems: 'center', background: flip > 0.5 ? (absent ? '#fde4e4' : '#dff5ea') : '#eef0f7', color: absent ? '#e04848' : '#0f9f6e' }}>
                {flip > 0.5 ? (absent ? <Cross size={30} /> : <Check size={30} />) : null}
              </span>
            </Rise>
          );
        })}
      </div>
    );
  }
  if (i === 1) {
    const paid = interpolate(f, [10, 60], [0, 38500], clamp);
    return (
      <div style={box}>
        <Rise>
          <div style={{ fontSize: 28, color: MUTED }}>{hi ? 'Is mahine ka collection' : 'Collected this month'}</div>
          <div style={{ fontSize: 84, fontWeight: 800, color: INK }}>₹{Math.round(paid).toLocaleString('en-IN')}</div>
        </Rise>
        <Rise delay={14} style={{ display: 'flex', gap: 14, marginTop: 26 }}>
          <span style={{ background: '#dff5ea', color: '#0f9f6e', borderRadius: 999, padding: '12px 26px', fontSize: 28, fontWeight: 700 }}>{hi ? 'Diya · 24' : 'Paid · 24'}</span>
          <span style={{ background: '#fde4e4', color: '#e04848', borderRadius: 999, padding: '12px 26px', fontSize: 28, fontWeight: 700 }}>{hi ? 'Baaki · 6' : 'Owes · 6'}</span>
        </Rise>
        <Rise delay={30} style={{ marginTop: 26, display: 'flex', alignItems: 'center', gap: 14, color, fontSize: 30, fontWeight: 700 }}>
          <Printer size={32} color={color} /> {hi ? 'Receipt ready' : 'Receipt ready'}
        </Rise>
      </div>
    );
  }
  if (i === 2) {
    const stages = ['Enquiry', 'Visited', 'Joined'];
    const at = interpolate(f, [20, 80], [0, 2], clamp);
    return (
      <div style={box}>
        <Rise>
          <div style={{ fontSize: 34, fontWeight: 700, color: INK }}>Priya's father</div>
          <div style={{ fontSize: 26, color: MUTED }}>Class 9 · Follow up: Friday</div>
        </Rise>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 40 }}>
          {stages.map((s, k) => {
            const on = at >= k - 0.01;
            return (
              <React.Fragment key={s}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: 64, height: 64, borderRadius: 32, margin: '0 auto', display: 'grid', placeItems: 'center', background: on ? color : '#eef0f7', color: '#fff' }}>{on ? <Check size={32} /> : null}</div>
                  <div style={{ marginTop: 10, fontSize: 26, fontWeight: 600, color: on ? INK : MUTED }}>{s}</div>
                </div>
                {k < 2 && (
                  <div style={{ flex: 1, height: 6, margin: '0 10px 34px', borderRadius: 3, background: '#eef0f7', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(1, Math.max(0, at - k)) * 100}%`, background: color }} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  }
  const lines = [100, 92, 100, 70, 96, 60];
  return (
    <div style={{ display: 'flex', gap: 26 }}>
      <div style={{ ...box, width: 400, padding: 34 }}>
        <Rise>
          <div style={{ fontSize: 26, fontWeight: 800, color: INK }}>Question Paper</div>
          <div style={{ fontSize: 20, color: MUTED, marginBottom: 20 }}>Class 8 · Science · 40 marks</div>
        </Rise>
        {lines.map((w, k) => (
          <Rise key={k} delay={8 + k * 5}>
            <div style={{ height: 14, width: `${w}%`, borderRadius: 7, background: '#e9ebf5', marginBottom: 16 }} />
          </Rise>
        ))}
      </div>
      <Rise delay={36}>
        <div style={{ ...box, width: 230, padding: 34, background: soft, border: 'none' }}>
          <div style={{ fontSize: 26, fontWeight: 800, color }}>Answer Key</div>
          <div style={{ marginTop: 18 }}><Check size={56} color={color} /></div>
        </div>
      </Rise>
    </div>
  );
};

const Feature: React.FC<{ i: number }> = ({ i }) => {
  const lang = React.useContext(LangCtx);
  const F = { ...FEATURES[i], ...(lang === 'hi' ? HI_COPY[i] : {}) };
  return (
    <AbsoluteFill style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 110, padding: '0 130px 90px' }}>
      <div style={{ width: 760 }}>
        <Rise>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 16, background: F.soft, color: F.color, borderRadius: 999, padding: '10px 26px 10px 12px', fontSize: 28, fontWeight: 700 }}>
            <span style={{ width: 44, height: 44, borderRadius: 22, background: F.color, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 26 }}>{F.n}</span> {lang === 'hi' ? '/ 4' : 'of 4'}
          </div>
        </Rise>
        <Rise delay={6}><div style={{ fontSize: 124, fontWeight: 800, color: INK, letterSpacing: -3, marginTop: 28, lineHeight: 1 }}>{F.name}</div></Rise>
        <Rise delay={14}><div style={{ fontSize: 46, fontWeight: 600, color: INK, marginTop: 34, lineHeight: 1.25 }}>{F.line}</div></Rise>
        <Rise delay={22}><div style={{ fontSize: 36, color: MUTED, marginTop: 14, lineHeight: 1.3 }}>{F.sub}</div></Rise>
      </div>
      <Demo i={i} color={F.color} soft={F.soft} />
    </AbsoluteFill>
  );
};

const Problem: React.FC = () => {
  const lang = React.useContext(LangCtx);
  const items = lang === 'hi' ? ['Paper register', 'Excel sheets', 'WhatsApp chats'] : ['Paper registers', 'Excel sheets', 'WhatsApp chats'];
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', paddingBottom: 90 }}>
      <Rise><div style={{ fontSize: 56, color: MUTED, fontWeight: 600 }}>{lang === 'hi' ? 'Institute chala rahe ho…' : 'Running an institute with…'}</div></Rise>
      <div style={{ display: 'flex', gap: 36, marginTop: 56 }}>
        {items.map((t, k) => {
          const cut = interpolate(f, [70 + k * 14, 84 + k * 14], [0, 100], clamp);
          return (
            <Rise key={t} delay={10 + k * 8}>
              <div style={{ position: 'relative', background: '#fff', border: '1px solid #e7e9f3', borderRadius: 28, padding: '36px 52px', fontSize: 50, fontWeight: 700, color: INK, boxShadow: '0 20px 50px rgba(30,30,80,.08)' }}>
                {t}
                <div style={{ position: 'absolute', left: 28, top: '50%', height: 7, width: `calc(${cut}% - 56px)`, background: '#e04848', borderRadius: 4 }} />
              </div>
            </Rise>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Outro: React.FC = () => {
  const lang = React.useContext(LangCtx);
  return (
  <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
    <Rise><div style={{ width: 150, height: 150, borderRadius: 40, background: '#4f46e5', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 92, fontWeight: 800, boxShadow: '0 30px 60px rgba(79,70,229,.35)' }}>E</div></Rise>
    <Rise delay={8}><div style={{ fontSize: 120, fontWeight: 800, color: INK, marginTop: 36, letterSpacing: -3 }}>EduBuddy</div></Rise>
    <Rise delay={16}><div style={{ fontSize: 52, color: MUTED, marginTop: 8 }}>{lang === 'hi' ? 'Institute chalao, paperwork nahi.' : 'Run your institute, not paperwork.'}</div></Rise>
    <Rise delay={30}><div style={{ marginTop: 50, background: INK, color: '#fff', borderRadius: 999, padding: '22px 56px', fontSize: 40, fontWeight: 700 }}>{lang === 'hi' ? 'Free demo book karein' : 'Book a free demo'}</div></Rise>
  </AbsoluteFill>
  );
};

const Subtitle: React.FC<{ text: string }> = ({ text }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [LEAD, LEAD + 6], [0, 1], clamp);
  return <div style={{ position: 'absolute', bottom: 70, left: 160, right: 160, textAlign: 'center', fontSize: 34, color: MUTED, fontWeight: 500, opacity: o }}>{text}</div>;
};

const FadeWrap: React.FC<{ dur: number; children: React.ReactNode }> = ({ dur, children }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ opacity: interpolate(f, [0, 8, dur - 8, dur], [0, 1, 1, 0], clamp) }}>{children}</AbsoluteFill>;
};

export const Clean: React.FC<{ lang?: CLang }> = ({ lang = 'en' }) => {
  const frames = cleanFrames(lang);
  const en = TIM[lang];
  let from = 0;
  const f = useCurrentFrame();
  const total = frames.reduce((a, b) => a + b, 0);
  return (
    <LangCtx.Provider value={lang}>
    <AbsoluteFill style={{ background: BG, fontFamily: FONT }}>
      {en.scenes.map((s, i) => {
        const start = from;
        from += frames[i];
        return (
          <Sequence key={i} from={start} durationInFrames={frames[i]}>
            <FadeWrap dur={frames[i]}>{i === 0 ? <Problem /> : i === 5 ? <Outro /> : <Feature i={i - 1} />}</FadeWrap>
            {i < 5 && <Subtitle text={s.text} />}
            <Sequence from={LEAD}><Audio src={staticFile(s.file)} /></Sequence>
          </Sequence>
        );
      })}
      <div style={{ position: 'absolute', left: 0, bottom: 0, height: 8, width: `${(f / total) * 100}%`, background: '#4f46e5' }} />
    </AbsoluteFill>
    </LangCtx.Provider>
  );
};
