// 15-second Meta (Facebook/Instagram) ad: "book a free demo". Real phone screens of the app, no messaging claims.
// Compositions: ad-story-hi / ad-story-en (9:16, 1080x1920, Reels & Stories, text kept inside Meta's safe zone)
//               ad-feed-hi  / ad-feed-en  (4:5, 1080x1350, Feed)
// Voice: tts.py ad-hinglish.txt ad-hi / ad-en.txt ad-en, then trim_silence.py ad-hi ad-en.
import React from 'react';
import { AbsoluteFill, Easing, Freeze, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/PlusJakartaSans';
import hiT from './timings-ad-hi.json';
import enT from './timings-ad-en.json';
import { Check } from './ui';
import { Logo } from './Story';
import { BLang, LangCtx, Line, Voice } from './BeforeAfter';

const { fontFamily } = loadFont('normal', { weights: ['500', '600', '700', '800'], subsets: ['latin'] });

export type AdFormat = 'story' | 'feed';
const TIM = { hi: hiT as { scenes: Line[] }, en: enT as { scenes: Line[] } };
const FPS = 30;
export const AD_TOTAL = 15 * FPS;
const LEAD = 4;
const GAP = 6;
const BRAND = '#005a9c';
const NAVY = '#1b365d';
const INK = '#14171f';
const MUTED = '#5f6672';
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ease = Easing.bezier(0.45, 0, 0.2, 1);

// Screen shown under each line. Attendance stops before the parent-message button and is zoomed so it stays out of view.
const BEATS = [
  { file: 'screens/m-dashboard.mp4', freezeAt: 7.4, zoom: 1, label: { hi: '', en: '' } },
  { file: 'screens/m-attendance.mp4', from: 0.3, to: 3.4, zoom: 1.1, label: { hi: 'Attendance', en: 'Attendance' } },
  { file: 'screens/m-fees.mp4', from: 2.6, to: 8.6, zoom: 1, label: { hi: 'Fees & receipt', en: 'Fees & receipts' } },
  { file: 'screens/m-leads.mp4', from: 9.0, to: 12.8, zoom: 1, label: { hi: 'Inquiries', en: 'Inquiries' } },
  { file: 'screens/m-dashboard.mp4', from: 6.4, to: 11.6, zoom: 1, label: { hi: 'Dashboard', en: 'Dashboard' } },
];

const len = (l: Line) => Math.ceil((l.end - l.start) * FPS) + GAP;
export const adFrames = (lang: BLang) => {
  const s = TIM[lang].scenes;
  const beats = [LEAD + len(s[0]), len(s[1]), len(s[2]), len(s[3]), len(s[4])];
  const cta = Math.ceil((s[5].end - s[5].start) * FPS) + 40;
  const spare = Math.max(0, AD_TOTAL - beats.reduce((a, b) => a + b, 0) - cta);
  const withSpare = beats.map((b, i) => (i ? b + Math.floor(spare / 4) : b));
  return [...withSpare, AD_TOTAL - withSpare.reduce((a, b) => a + b, 0)];
};

const useSpring = (delay = 0, damping = 200, dur = 14) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - delay, fps, config: { damping }, durationInFrames: dur });
};
const Rise: React.FC<{ delay?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ delay = 0, children, style }) => {
  const p = useSpring(delay);
  return <div style={{ opacity: p, transform: `translateY(${(1 - p) * 24}px)`, ...style }}>{children}</div>;
};

/* ───── phone with the real app ───── */
const Phone: React.FC<{ durs: number[]; sw: number }> = ({ durs, sw }) => {
  const f = useCurrentFrame();
  const sh = Math.round((sw * 844) / 390);
  const total = durs.reduce((a, b) => a + b, 0);
  const y = interpolate(f, [0, 16], [500, 0], { ...clamp, easing: ease });
  const o = interpolate(f, [0, 8, total - 6, total], [0, 1, 1, 0], clamp);
  let at = 0;
  return (
    <div style={{ transform: `translateY(${y}px)`, opacity: o, padding: Math.round(sw * 0.027), borderRadius: sw * 0.125, background: '#11141b', boxShadow: '0 40px 80px rgba(15,30,60,.30), inset 0 0 0 3px #2b303b' }}>
      <div style={{ width: sw, height: sh, borderRadius: sw * 0.1, overflow: 'hidden', background: '#fff', position: 'relative' }}>
        {BEATS.map((b, i) => {
          const start = at;
          at += durs[i];
          const dur = durs[i] + (i < BEATS.length - 1 ? 6 : 0);
          const video = <OffthreadVideo src={staticFile(b.file)} startFrom={Math.round((b.from ?? 0) * FPS)} muted
            playbackRate={b.to ? Math.max(1, (b.to - (b.from ?? 0)) / (durs[i] / FPS)) : 1} style={{ width: sw, height: sh, display: 'block' }} />;
          return (
            <Sequence key={i} from={start} durationInFrames={dur}>
              <ScreenFade first={i === 0}>
                <div style={{ width: sw, height: sh, transform: `scale(${b.zoom})`, transformOrigin: '50% 0' }}>
                  {b.freezeAt !== undefined ? <Freeze frame={Math.round(b.freezeAt * FPS)}>{video}</Freeze> : video}
                </div>
              </ScreenFade>
            </Sequence>
          );
        })}
        <div style={{ position: 'absolute', top: sw * 0.023, left: '50%', marginLeft: -sw * 0.1, width: sw * 0.2, height: sw * 0.057, borderRadius: 99, background: '#11141b' }} />
      </div>
    </div>
  );
};
const ScreenFade: React.FC<{ first: boolean; children: React.ReactNode }> = ({ first, children }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ opacity: first ? 1 : interpolate(f, [0, 6], [0, 1], clamp) }}>{children}</AbsoluteFill>;
};

/* ───── headline for each beat ───── */
const Headline: React.FC<{ i: number; text: string; size: number; align: 'center' | 'left' }> = ({ i, text, size, align }) => {
  const lang = React.useContext(LangCtx);
  const label = BEATS[i].label[lang];
  return (
    <div style={{ textAlign: align }}>
      {i === 0 ? (
        <Rise><div style={{ display: 'inline-block', background: '#fff3d6', color: '#9a5b00', borderRadius: 999, padding: '10px 26px', fontSize: size * 0.42, fontWeight: 800, letterSpacing: 2 }}>{lang === 'hi' ? 'INSTITUTE OWNERS' : 'FOR INSTITUTE OWNERS'}</div></Rise>
      ) : (
        <Rise>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: BRAND, color: '#fff', borderRadius: 999, padding: '10px 26px 10px 12px', fontSize: size * 0.42, fontWeight: 800 }}>
            <span style={{ width: size * 0.62, height: size * 0.62, borderRadius: 99, background: '#fff', color: BRAND, display: 'grid', placeItems: 'center' }}><Check size={size * 0.42} /></span>
            {label}
          </div>
        </Rise>
      )}
      <Rise delay={4}><div style={{ fontSize: size, fontWeight: 800, color: INK, lineHeight: 1.08, marginTop: size * 0.3, letterSpacing: -1.5 }}>{text}</div></Rise>
    </div>
  );
};

/* ───── call to action ───── */
const Cta: React.FC<{ format: AdFormat }> = ({ format }) => {
  const hi = React.useContext(LangCtx) === 'hi';
  const story = format === 'story';
  const p = useSpring(0, 12, 20);
  const f = useCurrentFrame();
  const pulse = 1 + Math.max(0, Math.sin((f - 30) / 6)) * 0.035;
  const feats = hi ? ['Attendance', 'Fees & receipt', 'Inquiries', 'AI test papers'] : ['Attendance', 'Fees & receipts', 'Inquiries', 'AI test papers'];
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 40%, #0f5d9e, ${NAVY} 72%)`, alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: story ? '270px 70px 560px' : '0 70px' }}>
      <div style={{ transform: `scale(${p})` }}><Logo size={story ? 150 : 130} /></div>
      <Rise delay={5}><div style={{ fontSize: story ? 118 : 104, fontWeight: 800, color: '#fff', letterSpacing: -3, marginTop: 18 }}>EduBuddy</div></Rise>
      <Rise delay={10}><div style={{ fontSize: story ? 40 : 36, color: '#cfe7f8', fontWeight: 600 }}>{hi ? 'Coaching institutes ke liye ek app' : 'One app for coaching institutes'}</div></Rise>
      <Rise delay={15}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 28, maxWidth: 900 }}>
          {feats.map((x) => <span key={x} style={{ border: '2px solid rgba(255,255,255,.28)', color: '#d9ecfa', borderRadius: 999, padding: '8px 22px', fontSize: story ? 30 : 28, fontWeight: 700 }}>{x}</span>)}
        </div>
      </Rise>
      <Rise delay={22}>
        <div style={{ marginTop: 40, background: '#ffb020', color: INK, borderRadius: 999, padding: story ? '28px 60px' : '24px 54px', fontSize: story ? 50 : 46, fontWeight: 800, transform: `scale(${pulse})`, boxShadow: '0 18px 40px rgba(0,0,0,.3)' }}>
          {hi ? 'Free demo book karein →' : 'Book a free demo →'}
        </div>
      </Rise>
      <Rise delay={30}><div style={{ marginTop: 20, fontSize: story ? 32 : 30, color: '#a9cbe6', fontWeight: 600 }}>{hi ? "Neeche 'Book now' dabayein" : "Tap 'Book now' below"}</div></Rise>
    </AbsoluteFill>
  );
};

export const MetaAd: React.FC<{ lang?: BLang; format?: AdFormat }> = ({ lang = 'hi', format = 'story' }) => {
  const s = TIM[lang].scenes;
  const fr = adFrames(lang);
  const starts = fr.map((_, i) => fr.slice(0, i).reduce((a, b) => a + b, 0));
  const beatDurs = fr.slice(0, 5);
  const story = format === 'story';
  const bg = 'linear-gradient(170deg,#eaf3fc 0%,#f7f9fc 50%,#e4eef9 100%)';
  return (
    <LangCtx.Provider value={lang}>
      <AbsoluteFill style={{ fontFamily, background: bg }}>
        {/* headlines */}
        {[0, 1, 2, 3, 4].map((i) => (
          <Sequence key={i} from={starts[i]} durationInFrames={fr[i]}>
            {story ? (
              <div style={{ position: 'absolute', left: 70, right: 70, top: 280 }}>
                <Headline i={i} text={s[i].text} size={i === 0 ? 92 : 78} align="center" />
              </div>
            ) : (
              <div style={{ position: 'absolute', left: 64, width: 520, top: 0, bottom: 0, display: 'flex', alignItems: 'center' }}>
                <Headline i={i} text={s[i].text} size={i === 0 ? 76 : 64} align="left" />
              </div>
            )}
            <Voice line={s[i]} at={i === 0 ? LEAD : 0} />
          </Sequence>
        ))}
        {/* phone */}
        <Sequence from={0} durationInFrames={starts[5]}>
          <div style={story
            ? { position: 'absolute', left: 0, right: 0, top: 640, display: 'flex', justifyContent: 'center' }
            : { position: 'absolute', right: 60, top: 0, bottom: 0, display: 'flex', alignItems: 'center' }}>
            <Phone durs={beatDurs} sw={story ? 450 : 410} />
          </div>
        </Sequence>
        <Sequence from={starts[5]} durationInFrames={fr[5]}>
          <Cta format={format} />
          <Voice line={s[5]} at={0} />
        </Sequence>
      </AbsoluteFill>
    </LangCtx.Provider>
  );
};
