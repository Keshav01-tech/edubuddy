// npm run render                -> every theme, both languages
// npm run render -- pop         -> one theme, both languages
// npm run render -- pop hi      -> one theme, one language
import { execSync } from 'node:child_process';
const themes = process.argv[2] ? [process.argv[2]] : ['midnight', 'daylight', 'pop', 'chalk'];
const langs = process.argv[3] ? [process.argv[3]] : ['en', 'hi'];
for (const t of themes) for (const l of langs)
  execSync(`npx remotion render ${t}-${l} out/drafts/edubuddy-${t}-${l}.mp4 --log=error`, { stdio: 'inherit' });
