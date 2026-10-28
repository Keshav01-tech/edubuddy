// Records a captioned walkthrough of EduBuddy and exports out/edubuddy-walkthrough.mp4.
// Runs the app in demo mode (Supabase off) on its own port; question generation uses the
// local OpenAI key from the app's .env files.
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync, renameSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import ffmpeg from 'ffmpeg-static';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const out = join(here, 'out');
const shots = join(out, 'shots');
const raw = join(out, 'raw');
const PORT = 5288;
const BASE = `http://localhost:${PORT}`;
const W = 1280;
const H = 720;

rmSync(raw, { recursive: true, force: true });
mkdirSync(shots, { recursive: true });
mkdirSync(raw, { recursive: true });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function startApp() {
  const vite = spawn(process.execPath, [join(root, 'node_modules/vite/bin/vite.js'), '--port', String(PORT), '--strictPort'], {
    cwd: root,
    env: { ...process.env, VITE_SUPABASE_URL: 'your_supabase_project_url', VITE_SUPABASE_ANON_KEY: '' },
    stdio: 'ignore',
  });
  for (let i = 0; i < 60; i += 1) {
    try {
      const res = await fetch(BASE);
      if (res.ok) return vite;
    } catch { /* not up yet */ }
    await sleep(500);
  }
  vite.kill();
  throw new Error('Dev server did not start');
}

const OVERLAY = () => {
  const css = `
    #demo-cap{position:fixed;left:50%;bottom:28px;transform:translate(-50%,16px);opacity:0;z-index:2147483646;
      background:rgba(15,23,42,.92);color:#fff;border-radius:14px;padding:14px 24px;max-width:860px;text-align:center;
      font:600 24px/1.3 "Segoe UI",system-ui,sans-serif;box-shadow:0 12px 40px rgba(15,23,42,.35);transition:all .45s ease;pointer-events:none}
    #demo-cap.on{opacity:1;transform:translate(-50%,0)}
    #demo-cap small{display:block;margin-bottom:4px;font:700 13px/1 "Segoe UI",sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#a5b4fc}
    #demo-cur{position:fixed;left:0;top:0;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;z-index:2147483647;
      background:rgba(99,102,241,.35);border:2px solid #4f46e5;transition:transform .7s cubic-bezier(.4,0,.2,1);pointer-events:none;
      transform:translate(640px,360px)}
    #demo-cur.tap{animation:demotap .35s ease}
    @keyframes demotap{50%{box-shadow:0 0 0 14px rgba(99,102,241,.25)}}
    #demo-card{position:fixed;inset:0;z-index:2147483645;display:flex;flex-direction:column;align-items:center;justify-content:center;
      background:linear-gradient(135deg,#312e81,#4f46e5 55%,#6366f1);color:#fff;opacity:0;transition:opacity .6s ease;pointer-events:none;text-align:center;padding:0 80px}
    #demo-card.on{opacity:1}
    #demo-card h1{font:700 64px/1.1 "Segoe UI",sans-serif;margin:0}
    #demo-card p{font:400 28px/1.4 "Segoe UI",sans-serif;margin:20px 0 0;color:#e0e7ff;max-width:900px}
    #demo-card .badge{font:700 16px/1 "Segoe UI",sans-serif;letter-spacing:.18em;text-transform:uppercase;color:#c7d2fe;margin-bottom:22px}`;
  const mount = () => {
    if (document.getElementById('demo-cap')) return;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
    for (const id of ['demo-card', 'demo-cap', 'demo-cur']) {
      const el = document.createElement('div');
      el.id = id;
      document.body.appendChild(el);
    }
    const saved = sessionStorage.getItem('demo-cur');
    if (saved) document.getElementById('demo-cur').style.transform = saved;
  };
  window.__demo = {
    caption(text, step) {
      mount();
      const el = document.getElementById('demo-cap');
      if (!text) { el.classList.remove('on'); return; }
      el.innerHTML = `${step ? `<small>${step}</small>` : ''}${text}`;
      el.classList.add('on');
    },
    card(title, sub, badge) {
      mount();
      const el = document.getElementById('demo-card');
      document.getElementById('demo-cur').style.opacity = title ? '0' : '';
      if (!title) { el.classList.remove('on'); return; }
      el.innerHTML = `${badge ? `<div class="badge">${badge}</div>` : ''}<h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}`;
      el.classList.add('on');
    },
    move(x, y) {
      mount();
      const el = document.getElementById('demo-cur');
      el.style.transform = `translate(${x}px,${y}px)`;
      sessionStorage.setItem('demo-cur', el.style.transform);
    },
    tap() {
      const el = document.getElementById('demo-cur');
      el.classList.remove('tap');
      void el.offsetWidth;
      el.classList.add('tap');
    },
    hide(on) {
      mount();
      for (const id of ['demo-cap', 'demo-cur', 'demo-card']) document.getElementById(id).style.visibility = on ? 'hidden' : '';
    },
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
};

function encode(video, marks) {
  // Keep the generation wait short: play about 3 seconds of it, sped up.
  const { start = 0, genStart, genEnd, end } = marks;
  const waitFrom = genStart + 1.5;
  const waitTo = Math.max(waitFrom + 0.5, genEnd - 0.5);
  const speed = Math.max(1, (waitTo - waitFrom) / 3);
  const filter = [
    `[0:v]trim=${start}:${waitFrom},setpts=PTS-STARTPTS[a]`,
    `[0:v]trim=${waitFrom}:${waitTo},setpts=(PTS-STARTPTS)/${speed}[b]`,
    `[0:v]trim=${waitTo}:${end},setpts=PTS-STARTPTS[c]`,
    '[a][b][c]concat=n=3:v=1:a=0,fps=30,format=yuv420p[v]',
  ].join(';');
  const target = join(out, 'edubuddy-walkthrough.mp4');
  execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', video, '-filter_complex', filter, '-map', '[v]', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-movflags', '+faststart', target], { stdio: 'inherit' });
  console.log('Saved', target);
}

async function main() {
  if (process.argv.includes('--encode-only')) {
    encode(join(out, 'raw-walkthrough.webm'), JSON.parse(readFileSync(join(out, 'timeline.json'), 'utf8')));
    return;
  }
  const vite = await startApp();
  const browser = await chromium.launch();
  const warm = await browser.newPage();
  await warm.goto(`${BASE}/login`);
  await warm.waitForLoadState('networkidle');
  await warm.close();
  const context = await browser.newContext({
    viewport: { width: W, height: H },
    recordVideo: { dir: raw, size: { width: W, height: H } },
  });
  await context.addInitScript(OVERLAY);
  const page = await context.newPage();
  const t0 = Date.now();
  const marks = {};
  const mark = (name) => { marks[name] = (Date.now() - t0) / 1000; };

  const caption = (text, step) => page.evaluate(([a, b]) => window.__demo.caption(a, b), [text, step]);
  const card = (title, sub, badge) => page.evaluate(([a, b, c]) => window.__demo.card(a, b, c), [title, sub, badge]);
  const shot = async (name) => {
    await page.evaluate(() => window.__demo.hide(true));
    await page.screenshot({ path: join(shots, `${name}.png`) });
    await page.evaluate(() => window.__demo.hide(false));
  };

  async function point(locator) {
    await locator.evaluate((el) => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    await sleep(650);
    const box = await locator.boundingBox();
    if (box) {
      await page.evaluate(([x, y]) => window.__demo.move(x, y), [box.x + box.width / 2, box.y + box.height / 2]);
      await sleep(800);
    }
  }
  async function tap(locator) {
    await point(locator);
    await page.evaluate(() => window.__demo.tap());
    await locator.click();
    await sleep(500);
  }

  try {
    await page.goto(`${BASE}/login`);
    await page.waitForLoadState('networkidle');
    mark('start');
    await card('EduBuddy', 'Ready-to-print question papers from NCERT chapters, in about a minute.', 'For teachers');
    await sleep(3800);
    await card('');
    await sleep(700);
    await shot('01-login');

    await caption('Sign in with your school email', 'Get started');
    await page.getByPlaceholder('you@school.com').click();
    await page.getByPlaceholder('you@school.com').pressSequentially('teacher@school.com', { delay: 45 });
    await page.getByPlaceholder('••••••••').pressSequentially('password', { delay: 45 });
    await tap(page.getByRole('button', { name: 'Sign in', exact: true }));
    await page.waitForURL(`${BASE}/`);
    await sleep(1200);

    await caption('Choose the class and subject', 'Step 1');
    const classSelect = page.locator('form#builder select').nth(0);
    const subjectSelect = page.locator('form#builder select').nth(1);
    await point(classSelect);
    await classSelect.selectOption('Class 10');
    await sleep(900);
    await point(subjectSelect);
    await subjectSelect.selectOption('Mathematics');
    await sleep(1400);
    await shot('02-class');

    await caption('Tick one chapter, several, or the whole book', 'Step 2');
    const row = (re) => page.locator('button[aria-pressed]').filter({ hasText: re }).first();
    await tap(row(/Quadratic Equations/));
    await tap(row(/Arithmetic Progressions/));
    await sleep(900);
    await shot('03-chapters');

    await caption('Pick the question type and total marks', 'Step 3');
    await tap(page.getByRole('radio', { name: 'Mixed', exact: true }));
    await tap(page.getByRole('radio', { name: '30 marks', exact: true }));
    await sleep(700);
    await caption('Sections are balanced automatically: MCQ, short and long answers', 'Step 3');
    await tap(page.getByRole('button', { name: /Customise/ }));
    await sleep(2200);
    await shot('04-pattern');

    await caption('Click Create, and EduBuddy writes the paper', 'Step 4');
    await tap(page.getByRole('button', { name: /Create test/ }));
    if (await page.getByText(/OpenAI/i).first().isVisible().catch(() => false) && !page.url().includes('/test')) {
      throw new Error('OpenAI key is not configured for local dev (VITE_OPENAI_API_KEY).');
    }
    await page.waitForURL(/\/test\?id=/, { timeout: 30000 });
    mark('genStart');
    await caption('Reading the chapters and writing fresh questions…', 'Step 4');
    await page.waitForFunction(
      () => document.querySelector('.sheet-screen-wrap .sheet') || /went wrong|failed|error/i.test(document.querySelector('main')?.innerText || ''),
      null,
      { timeout: 300000, polling: 500 },
    );
    if (!(await page.locator('.sheet-screen-wrap .sheet').count())) {
      throw new Error(`Generation failed: ${(await page.locator('main').innerText()).slice(0, 300)}`);
    }
    mark('genEnd');
    await sleep(800);

    await caption('A complete question paper, numbered with marks for every question', 'Your paper');
    await shot('05-paper');
    for (let i = 0; i < 6; i += 1) {
      await page.mouse.wheel(0, 260);
      await sleep(700);
    }
    await sleep(800);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await sleep(1200);

    await caption('Switch to a worksheet with space for students to write', 'Three versions');
    await tap(page.getByRole('button', { name: 'Worksheet', exact: true }));
    await sleep(1800);
    await shot('06-worksheet');
    await caption('…or the answer key for marking', 'Three versions');
    await tap(page.getByRole('button', { name: 'Answer key', exact: true }));
    await page.mouse.wheel(0, 300);
    await sleep(2200);
    await shot('07-answers');
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await sleep(900);
    await tap(page.getByRole('button', { name: 'Question paper', exact: true }));

    await caption('Print it, or save a clean A4 PDF', 'One click');
    await point(page.getByRole('button', { name: /^Print/ }));
    await sleep(2200);
    await caption('Same chapter again? You get different questions every time', 'Never repeat');
    await point(page.getByRole('button', { name: /New paper|Different questions/ }));
    await sleep(2600);

    await caption('Every test is saved under My tests', 'Organised');
    await tap(page.getByRole('button', { name: /^Back/ }));
    await page.waitForURL(`${BASE}/`);
    await sleep(600);
    await tap(page.getByRole('link', { name: /My tests/ }));
    await sleep(2400);
    await shot('08-papers');

    await caption('');
    await card('Your next test, in under a minute', 'Classes 6–12 · Every NCERT subject · 1 to 100 marks', 'EduBuddy');
    await sleep(4200);
    mark('end');

    await page.evaluate(() => window.__demo.hide(true));
    await page.goBack();
    await page.goBack();
    await page.waitForSelector('.sheet-screen-wrap .sheet', { timeout: 60000 });
    await page.emulateMedia({ media: 'print' });
    await sleep(800);
    const a4 = page.locator('.sheet-print-slot .sheet');
    await a4.screenshot({ path: join(shots, '09-a4.png') }).catch(() => page.screenshot({ path: join(shots, '09-a4.png'), fullPage: true }));
    await page.emulateMedia({ media: 'screen' });
  } finally {
    await context.close();
    await browser.close();
    vite.kill();
  }

  const video = join(out, 'raw-walkthrough.webm');
  renameSync(await page.video().path(), video);
  writeFileSync(join(out, 'timeline.json'), JSON.stringify(marks, null, 2));
  console.log('timeline', marks);
  encode(video, marks);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
