// Renders promo.html (built from the walkthrough screenshots) to out/edubuddy-promo.mp4.
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, renameSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import ffmpeg from 'ffmpeg-static';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, 'out');
const raw = join(out, 'raw-promo');
rmSync(raw, { recursive: true, force: true });
mkdirSync(raw, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: { dir: raw, size: { width: 1280, height: 720 } },
});
const page = await context.newPage();
const t0 = Date.now();
await page.goto(pathToFileURL(join(here, 'promo.html')).href);
await page.waitForFunction(() => [...document.images].every((img) => img.complete && img.naturalWidth > 0));
const start = (Date.now() - t0) / 1000;
await page.evaluate(() => window.play());
await page.waitForTimeout(600);
await context.close();
await browser.close();

const video = join(out, 'raw-promo.webm');
renameSync(await page.video().path(), video);
const target = join(out, 'edubuddy-promo.mp4');
execFileSync(ffmpeg, [
  '-y', '-loglevel', 'error', '-ss', String(start), '-i', video,
  '-vf', 'fps=30,format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-movflags', '+faststart', target,
], { stdio: 'inherit' });
rmSync(raw, { recursive: true, force: true });
console.log('Saved', target);
