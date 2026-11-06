import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import en from './timings-en.json';
import hi from './timings-hi.json';
import { COPY } from './copy';
import { Attendance, Fees, Hook, Leads, Outro, TestGen } from './scenes';
import { clamp } from './ui';
import { THEMES, ThemeName, ThemeProvider, useT } from './themes';

const FPS = 30;
const LEAD_IN = 4; // frames before the voice starts in each scene
const TAIL = [14, 22, 26, 22, 40, 45]; // room after each line so the on-screen steps can finish (outro holds on CTA)
const SCENES = [Hook, Attendance, Fees, Leads, TestGen, Outro];

// Set to e.g. 'music.mp3' after dropping a royalty-free track into public/
const MUSIC: string | null = null;

export type Lang = 'en' | 'hi';
const TIMINGS = { en, hi };

export const sceneFrames = (lang: Lang) => TIMINGS[lang].scenes.map((s, i) => LEAD_IN + Math.ceil(s.seconds * FPS) + TAIL[i]);

/** Fade/slide each scene in and out. */
const Transition: React.FC<{ dur: number; children: React.ReactNode }> = ({ dur, children }) => {
  const frame = useCurrentFrame();
  const T = useT();
  const o = interpolate(frame, [0, 7, dur - 6, dur], [0, 1, 1, 0], clamp);
  const p = interpolate(frame, [0, 10], [1, 0], clamp); // 1 -> 0 as the scene enters
  const transform = {
    midnight: `translateY(${p * 40}px)`,
    daylight: `scale(${1 + p * 0.06})`,
    pop: `scale(${1 - p * 0.15}) rotate(${p * -4}deg)`,
    chalk: `translateX(${p * 120}px)`,
  }[T.name as ThemeName];
  const blur = T.name === 'daylight' ? `blur(${p * 14}px)` : 'none';
  return <AbsoluteFill style={{ opacity: o, transform, filter: blur }}>{children}</AbsoluteFill>;
};

/** Word-by-word karaoke captions, timed proportionally to character count within the voice clip. */
const Captions: React.FC<{ text: string; seconds: number }> = ({ text, seconds }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (frame - LEAD_IN) / fps;
  const words = text.split(' ');
  const total = words.reduce((n, w) => n + w.length + 1, 0);
  let acc = 0;
  const starts = words.map((w) => {
    const s = (acc / total) * seconds;
    acc += w.length + 1;
    return s;
  });
  // show chunks of ~5 words so the caption stays short
  const CHUNK = 5;
  const current = Math.max(0, starts.findIndex((s, i) => t >= s && (i === words.length - 1 || t < starts[i + 1])));
  const chunk = Math.floor(current / CHUNK);
  const visible = words.slice(chunk * CHUNK, chunk * CHUNK + CHUNK);
  const appear = interpolate(frame, [LEAD_IN, LEAD_IN + 5], [0, 1], clamp);
  const T = useT();
  return (
    <div style={{ position: 'absolute', bottom: 260, left: 60, right: 60, display: 'flex', justifyContent: 'center', opacity: appear }}>
      <div style={{ padding: '20px 34px', fontSize: 50, fontWeight: 800, textAlign: 'center', lineHeight: 1.25, ...T.caption }}>
        {visible.map((w, i) => {
          const idx = chunk * CHUNK + i;
          const spoken = t >= starts[idx];
          return (
            <span key={idx} style={{ color: idx === current ? T.captionHi : spoken ? T.caption.color : T.captionDim }}>
              {w}{' '}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export const Reel: React.FC<{ lang: Lang; theme: ThemeName }> = ({ lang, theme }) => {
  const frames = sceneFrames(lang);
  const timings = TIMINGS[lang];
  const T = THEMES[theme];
  let from = 0;
  return (
    <ThemeProvider value={T}>
    <AbsoluteFill style={{ fontFamily: T.font }}>
      <T.Background />
      {MUSIC && <Audio src={staticFile(MUSIC)} volume={0.12} />}
      {timings.scenes.map((s, i) => {
        const Scene = SCENES[i];
        const start = from;
        from += frames[i];
        return (
          <Sequence key={i} from={start} durationInFrames={frames[i]} name={`Scene ${i}`}>
            <Transition dur={frames[i]}>
              <Scene t={COPY[lang]} dur={frames[i]} />
            </Transition>
            {i < SCENES.length - 1 && <Captions text={s.text} seconds={s.seconds} />}
            <Sequence from={LEAD_IN}>
              <Audio src={staticFile(s.file)} />
            </Sequence>
          </Sequence>
        );
      })}
    </AbsoluteFill>
    </ThemeProvider>
  );
};
