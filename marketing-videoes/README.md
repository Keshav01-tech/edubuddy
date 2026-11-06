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
