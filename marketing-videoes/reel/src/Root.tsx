import { Composition } from 'remotion';
import { Lang, Reel, sceneFrames } from './Reel';
import { THEMES, ThemeName } from './themes';

const total = (lang: Lang) => sceneFrames(lang).reduce((a, b) => a + b, 0);
const LANGS: Lang[] = ['en', 'hi'];

// One composition per theme x language, e.g. "pop-en", "chalk-hi"
export const Root = () => (
  <>
    {(Object.keys(THEMES) as ThemeName[]).flatMap((theme) =>
      LANGS.map((lang) => (
        <Composition
          key={`${theme}-${lang}`}
          id={`${theme}-${lang}`}
          component={Reel}
          defaultProps={{ lang, theme }}
          width={1080}
          height={1920}
          fps={30}
          durationInFrames={total(lang)}
        />
      )),
    )}
  </>
);
