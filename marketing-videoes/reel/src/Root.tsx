import { Composition } from 'remotion';
import { Lang, Reel, sceneFrames } from './Reel';
import { Clean, cleanFrames } from './Clean';
import { THEMES, ThemeName } from './themes';
import { Checklist, checklistFrames } from './Checklist';

const total = (lang: Lang) => sceneFrames(lang).reduce((a, b) => a + b, 0);
const LANGS: Lang[] = ['en', 'hi'];

// One composition per theme x language, e.g. "pop-en", "chalk-hi"
export const Root = () => (
  <>
    <Composition id="checklist-en" component={Checklist} defaultProps={{ lang: 'en' as const }} width={1080} height={1920} fps={30} durationInFrames={checklistFrames} />
    <Composition id="checklist-hi" component={Checklist} defaultProps={{ lang: 'hi' as const }} width={1080} height={1920} fps={30} durationInFrames={checklistFrames} />
    <Composition id="clean-en"component={Clean} defaultProps={{ lang: 'en' as const }} width={1920} height={1080} fps={30} durationInFrames={cleanFrames('en').reduce((a, b) => a + b, 0)} />
    <Composition id="clean-hi" component={Clean} defaultProps={{ lang: 'hi' as const }} width={1920} height={1080} fps={30} durationInFrames={cleanFrames('hi').reduce((a, b) => a + b, 0)} />
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
