# EduBuddy marketing reels

Two versions: English (`Reel`) and Hinglish (`ReelHinglish`).

1. Edit the script — one line = one scene:
   - `script.txt` (English)
   - `script-hinglish.txt` — format `caption || speech`. Caption = Roman Hinglish shown on screen,
     speech = Devanagari that Kokoro reads (Hindi voices can't read Roman script well).
2. Voice:
   - `.venv\Scripts\python tts.py script.txt en af_heart 1.08`
   - `.venv\Scripts\python tts.py script-hinglish.txt hi hf_alpha 1.15`
3. On-screen headlines per language: `reel/src/copy.tsx`
4. Themes: `reel/src/themes.tsx` — midnight, daylight, pop, chalk (colours, fonts, cards, captions, background).
5. Preview: `cd reel && npm run studio` (compositions are named `<theme>-<lang>`, e.g. `pop-hi`)
6. Render to reel/out/drafts/:
   - `npm run render` — all themes, both languages
   - `npm run render -- pop` — one theme
   - `npm run render -- chalk hi` — one theme, one language

Music: drop a royalty-free track in reel/public/music.mp3 and set `MUSIC = 'music.mp3'` in reel/src/Reel.tsx.
Voices: af_heart, af_bella, am_michael, bf_emma (English) · hf_alpha, hf_beta, hm_omega, hm_psi (Hindi).

## Story video: "register lost" → real EduBuddy screens (1920x1080)
1. Start the app (from the app folder): `node node_modules/vite/bin/vite.js --port 5290`
2. Record the real screens (KMC Classes demo login; DB writes and WhatsApp sends are faked, nothing is saved/sent):
   `node capture/record-screens.mjs` (or one clip: `node capture/record-screens.mjs fees`) → `reel/public/screens/*.mp4`
3. Voice: `.venv\Scripts\python tts.py story-hinglish.txt story-hi hf_alpha 1.12` and `.venv\Scripts\python tts.py story-en.txt story-en af_heart 1.1`
4. Render: `cd reel && npx remotion render story-hi out/edubuddy-register-story-hinglish.mp4` (or `story-en`)
Zoom points and clip speeds live in `reel/src/Story.tsx` (CLIPS).

## 30s Before/After video (split screen: paper "before" vs real EduBuddy screen "after")
Script: `ba-hinglish.txt` / `ba-en.txt` (intro, then before/after line pairs, outro). Voice: `tts.py ba-hinglish.txt ba-hi hf_alpha 1.25` / `tts.py ba-en.txt ba-en af_heart 1.15`,
then `.venv/Scripts/python trim_silence.py ba-hi ba-en`. Render: `npx remotion render ba-hi out/edubuddy-before-after-hinglish.mp4` (or `ba-en`).

## Vertical 9:16 Before/After (phone view of the app)
Phone clips: `node capture/record-screens.mjs m-dashboard m-attendance m-fees m-leads` (390x844 phone view → `reel/public/screens/m-*.mp4`).
Uses the same voice as the 30s Before/After. Render: `npx remotion render ba-vertical-hi out/edubuddy-before-after-vertical-hinglish.mp4` (or `ba-vertical-en`).

## Vertical "Manual work vs EduBuddy" (~34s, includes AI fee-calling agent)
Script: `manual-hinglish.txt` / `manual-en.txt`. Voice: `tts.py manual-hinglish.txt mv-hi hf_alpha 1.22`, `tts.py manual-en.txt mv-en af_heart 1.15`, then `trim_silence.py mv-hi mv-en`.
Render: `npx remotion render manual-vertical-hi out/edubuddy-manual-vs-edubuddy-vertical-hinglish.mp4 --concurrency=4` (or `manual-vertical-en`).
Note: the "AI fee calls" phone screen is an animation in `reel/src/ManualVertical.tsx` (AiScreen), not a recording — the feature is not in the app yet.

## 15s "3 tips for institute owners" (soft, helpful tone; vertical)
Script: `tips-hinglish.txt` / `tips-en.txt`. Voice: `tts.py tips-hinglish.txt tips-hi hf_alpha 1.25`, `tts.py tips-en.txt tips-en af_heart 1.15`, then `trim_silence.py tips-hi tips-en`.
Render: `npx remotion render tips-hi out/edubuddy-3-tips-hinglish.mp4 --concurrency=4` (or `tips-en`). Always exactly 15s.

## Meta ad set, 15s "book a demo" (9:16 + 4:5)
Script: `ad-hinglish.txt` / `ad-en.txt`. Voice: `tts.py ad-hinglish.txt ad-hi hf_alpha 1.2`, `tts.py ad-en.txt ad-en af_heart 1.12`, then `trim_silence.py ad-hi ad-en`.
Render: `npx remotion render ad-story-hi out/meta-ads/edubuddy-meta-ad-9x16-hinglish.mp4 --concurrency=4` (also ad-story-en, ad-feed-hi, ad-feed-en).
Ad text for Ads Manager: `meta-ad-copy.md`. No messaging claims in these ads.

## 4 Instagram ad concepts, 30s, English (demand test) — scripts in `ig-ad-scripts.md`
Voice files in `ad-scripts/`: `tts.py ad-scripts/s1-leak.txt s1 af_heart 1.12`, `s2-9pm.txt s2 af_heart 1.1`, `s3-call.txt s3 af_heart 1.12`,
`call-ai.txt call-ai af_bella 1.12`, `call-parent.txt call-parent am_michael 1.0`, `s4-monthend.txt s4 af_heart 1.15`, then `trim_silence.py s1 s2 s3 call-ai call-parent s4`.
Render: `npx remotion render ig-leak out/ig-ads/edubuddy-ig-1-fee-leak.mp4 --concurrency=4` (also ig-9pm, ig-call, ig-monthend). Code: `reel/src/AdScripts.tsx`.
AI calls, photo-to-record, fee/attendance reports and PYQ PDFs are animated screens (features planned); fees/attendance/enquiries/dashboard are real app clips.

## Kinetic-typography IG ads (white screen, big text, no app screens) — 30s, English
Scripts: `ad-scripts/k1-next-week.txt` … `k4-called-back.txt` (format `[q|pain|solve|cta] caption with *highlight* and ' / ' breaks || speech`).
Voice: `tts.py ad-scripts/k1-next-week.txt k1 af_heart 1.0` (k2–k4 the same), then `trim_silence.py k1 k2 k3 k4`.
Render: `npx remotion render kin-1 out/ig-kinetic/edubuddy-kinetic-1-next-week.mp4 --concurrency=4` (kin-2 … kin-4). Code: `reel/src/Kinetic.tsx`.
