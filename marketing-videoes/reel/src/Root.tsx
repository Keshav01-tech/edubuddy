import { Composition } from 'remotion';
import { Lang, Reel, sceneFrames } from './Reel';
import { Clean, cleanFrames } from './Clean';
import { THEMES, ThemeName } from './themes';
import { Checklist, checklistFrames } from './Checklist';
import { Story, storyFrames } from './Story';
import { BeforeAfter, baFrames } from './BeforeAfter';
import { BAVertical, baVFrames } from './BAVertical';
import { ManualVertical, mvFrames } from './ManualVertical';
import { HelpfulTips, TIPS_TOTAL } from './HelpfulTips';
import { MetaAd, AD_TOTAL } from './MetaAd';
import { IgAd, IG_TOTAL, IG_SCRIPTS } from './AdScripts';
import { KineticAd, KIN_TOTAL, KIN } from './Kinetic';

const total = (lang: Lang) => sceneFrames(lang).reduce((a, b) => a + b, 0);
const LANGS: Lang[] = ['en', 'hi'];

// One composition per theme x language, e.g. "pop-en", "chalk-hi"
export const Root = () => (
  <>
    {(Object.keys(KIN) as (keyof typeof KIN)[]).map((id) => <Composition key={id} id={id} component={KineticAd} defaultProps={{ id }} width={1080} height={1920} fps={30} durationInFrames={KIN_TOTAL} />)}
    {IG_SCRIPTS.map((id) => <Composition key={id} id={`ig-${id}`} component={IgAd} defaultProps={{ script: id }} width={1080} height={1920} fps={30} durationInFrames={IG_TOTAL} />)}
    <Composition id="ad-story-hi" component={MetaAd} defaultProps={{ lang: 'hi' as const, format: 'story' as const }} width={1080} height={1920} fps={30} durationInFrames={AD_TOTAL} />
    <Composition id="ad-story-en" component={MetaAd} defaultProps={{ lang: 'en' as const, format: 'story' as const }} width={1080} height={1920} fps={30} durationInFrames={AD_TOTAL} />
    <Composition id="ad-feed-hi" component={MetaAd} defaultProps={{ lang: 'hi' as const, format: 'feed' as const }} width={1080} height={1350} fps={30} durationInFrames={AD_TOTAL} />
    <Composition id="ad-feed-en" component={MetaAd} defaultProps={{ lang: 'en' as const, format: 'feed' as const }} width={1080} height={1350} fps={30} durationInFrames={AD_TOTAL} />
    <Composition id="tips-hi" component={HelpfulTips} defaultProps={{ lang: 'hi' as const }} width={1080} height={1920} fps={30} durationInFrames={TIPS_TOTAL} />
    <Composition id="tips-en" component={HelpfulTips} defaultProps={{ lang: 'en' as const }} width={1080} height={1920} fps={30} durationInFrames={TIPS_TOTAL} />
    <Composition id="manual-vertical-hi" component={ManualVertical} defaultProps={{ lang: 'hi' as const }} width={1080} height={1920} fps={30} durationInFrames={mvFrames('hi').reduce((a, b) => a + b, 0)} />
    <Composition id="manual-vertical-en" component={ManualVertical} defaultProps={{ lang: 'en' as const }} width={1080} height={1920} fps={30} durationInFrames={mvFrames('en').reduce((a, b) => a + b, 0)} />
    <Composition id="ba-vertical-hi" component={BAVertical} defaultProps={{ lang: 'hi' as const }} width={1080} height={1920} fps={30} durationInFrames={baVFrames('hi').reduce((a, b) => a + b, 0)} />
    <Composition id="ba-vertical-en" component={BAVertical} defaultProps={{ lang: 'en' as const }} width={1080} height={1920} fps={30} durationInFrames={baVFrames('en').reduce((a, b) => a + b, 0)} />
    <Composition id="ba-hi" component={BeforeAfter} defaultProps={{ lang: 'hi' as const }} width={1920} height={1080} fps={30} durationInFrames={baFrames('hi').reduce((a, b) => a + b, 0)} />
    <Composition id="ba-en" component={BeforeAfter} defaultProps={{ lang: 'en' as const }} width={1920} height={1080} fps={30} durationInFrames={baFrames('en').reduce((a, b) => a + b, 0)} />
    <Composition id="story-hi" component={Story} defaultProps={{ lang: 'hi' as const }} width={1920} height={1080} fps={30} durationInFrames={storyFrames('hi').reduce((a, b) => a + b, 0)} />
    <Composition id="story-en" component={Story} defaultProps={{ lang: 'en' as const }} width={1920} height={1080} fps={30} durationInFrames={storyFrames('en').reduce((a, b) => a + b, 0)} />
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
