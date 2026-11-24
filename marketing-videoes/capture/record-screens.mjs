// Records short, real screen clips of EduBuddy (KMC Classes demo institute) for the story video.
//
//   1. In the app folder, start the dev server:  node node_modules/vite/bin/vite.js --port 5290
//   2. node capture/record-screens.mjs            -> every clip
//      node capture/record-screens.mjs fees       -> one clip
//
// Clips land in reel/public/screens/<name>.mp4 (desktop 1920x1200; m-* clips are phone view 1170x2532; 30 fps).
// Nothing is written to MongoDB and no WhatsApp message is sent: the app's "sync" and
// /api/whatsapp calls are answered with a fake success while recording.
import { createRequire } from 'node:module';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(here, '../../demo-video/package.json'));
const { chromium } = require('playwright');
const ffmpeg = require('ffmpeg-static');

const BASE = process.env.APP_URL || 'http://localhost:5290';
const OUT = join(here, '../reel/public/screens');
const TMP = join(here, 'tmp');
const W = 1440;
const H = 900;
const SCALE = 4 / 3; // 1920x1200 frames
const MW = 390; // phone view for the vertical video
const MH = 844;
const MSCALE = 3; // 1170x2532 frames
const ADMIN = { tab: 'Admin', id: 'kmcadmin', password: process.env.KMC_ADMIN_PASSWORD || 'Kmc@2026' };
const TEACHER = { tab: 'Teacher', id: 'rakesh@kmcclasses.in', password: process.env.KMC_TEACHER_PASSWORD || 'Teach@2026' };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(OUT, { recursive: true });

/* ───── on-page cursor ───── */
const CURSOR = (mobile) => {
  const css = `#v-cur{position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;transition:transform .55s cubic-bezier(.45,0,.2,1);transform:translate(720px,450px)}
  #v-cur svg{display:block;filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))}
  #v-cur i{position:absolute;left:-18px;top:-18px;width:36px;height:36px;border-radius:50%;background:rgba(0,90,156,.35);transform:scale(0);opacity:0}
  #v-cur.tap i{animation:vtap .45s ease-out}
  @keyframes vtap{0%{transform:scale(.2);opacity:1}100%{transform:scale(1.6);opacity:0}}`;
  const touch = `#v-cur svg{display:none}#v-cur{opacity:0}#v-cur.seen{opacity:1}#v-cur b{position:absolute;left:-26px;top:-26px;width:52px;height:52px;border-radius:50%;background:rgba(40,40,40,.28);border:3px solid rgba(255,255,255,.9);box-shadow:0 2px 8px rgba(0,0,0,.3)}#v-cur i{left:-30px;top:-30px;width:60px;height:60px}`;
  const mount = () => {
    if (document.getElementById('v-cur')) return;
    const s = document.createElement('style'); s.textContent = css + (mobile ? touch : ''); document.head.appendChild(s);
    const c = document.createElement('div'); c.id = 'v-cur';
    c.innerHTML = (mobile ? '<b></b>' : '') + '<i></i><svg width="26" height="30" viewBox="0 0 26 30"><path d="M2 2 L2 24 L8 18.5 L12 27.5 L16 25.8 L12.2 17 L20.5 17 Z" fill="#111" stroke="#fff" stroke-width="2" stroke-linejoin="round"/></svg>';
    document.body.appendChild(c);
    const saved = sessionStorage.getItem('v-cur');
    if (saved) { c.style.transition = 'none'; c.style.transform = saved; requestAnimationFrame(() => { c.style.transition = ''; }); }
  };
  window.__cur = {
    move(x, y) { mount(); const c = document.getElementById('v-cur'); c.classList.add('seen'); c.style.transform = `translate(${x}px,${y}px)`; sessionStorage.setItem('v-cur', c.style.transform); },
    tap() { const c = document.getElementById('v-cur'); c.classList.remove('tap'); void c.offsetWidth; c.classList.add('tap'); },
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
};

/* ───── browser helpers ───── */
async function newPage(browser, mobile = false) {
  const ctx = await browser.newContext(mobile
    ? { viewport: { width: MW, height: MH }, deviceScaleFactor: MSCALE, isMobile: true, hasTouch: true }
    : { viewport: { width: W, height: H }, deviceScaleFactor: SCALE });
  await ctx.addInitScript(CURSOR, mobile);
  await ctx.route('**/api/db', (route) => {
    let body = {};
    try { body = route.request().postDataJSON() || {}; } catch { /* not json */ }
    if (body.action === 'sync') return route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"written":0}' });
    return route.continue();
  });
  await ctx.route('**/api/whatsapp', (route) => {
    let body = {};
    try { body = route.request().postDataJSON() || {}; } catch { /* not json */ }
    const sent = (body.students || body.leads || []).map((s) => ({ name: s.name, phone: s.phone }));
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ configured: true, sent, failed: [] }) });
  });
  const page = await ctx.newPage();
  page.__mobile = mobile;
  return { ctx, page };
}

const go = async (page, path) => {
  await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
};

async function point(page, locator, settle = 650) {
  await locator.scrollIntoViewIfNeeded().catch(() => {});
  const box = await locator.boundingBox();
  if (!box) return;
  await page.evaluate(([x, y]) => window.__cur.move(x, y), [box.x + box.width / 2, box.y + box.height / 2]);
  await sleep(settle);
}
async function tap(page, locator, after = 450) {
  await point(page, locator);
  await page.evaluate(() => window.__cur.tap());
  await sleep(120);
  await locator.click();
  await sleep(after);
}
async function type(page, locator, text, delay = 70) {
  await tap(page, locator, 150);
  await locator.pressSequentially(text, { delay });
}
async function glide(page, x, y, ms = 700) {
  await page.evaluate(([a, b]) => window.__cur.move(a, b), [x, y]);
  await sleep(ms);
}
async function scrollBy(page, dy, steps = 8, ms = 450) {
  if (page.__mobile) { await page.evaluate((y) => window.scrollBy({ top: y, behavior: 'smooth' }), dy); await sleep(ms + 300); return; }
  for (let i = 0; i < steps; i += 1) { await page.mouse.wheel(0, dy / steps); await sleep(ms / steps); }
}

async function login(page, who, onCamera = false) {
  await go(page, '/login');
  await page.getByRole('tab', { name: who.tab }).click();
  const id = page.getByPlaceholder(who.tab === 'Admin' ? 'Your login ID' : 'you@school.com');
  const pw = page.getByPlaceholder('••••••••');
  if (onCamera) {
    await sleep(500);
    await type(page, id, who.id, 75);
    await type(page, pw, who.password, 60);
    await tap(page, page.getByRole('button', { name: 'Sign in', exact: true }), 0);
  } else {
    await id.fill(who.id);
    await pw.fill(who.password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  }
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 90000, waitUntil: 'commit' });
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
}

/* ───── screencast → mp4 ───── */
async function record(page, name, run) {
  const dir = join(TMP, name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const cdp = await page.context().newCDPSession(page);
  const frames = [];
  cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
    frames.push({ data, t: metadata.timestamp });
    await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: page.__mobile ? 1170 : 1920, maxHeight: page.__mobile ? 2532 : 1200, everyNthFrame: 1 });
  await sleep(300);
  const t0 = Date.now() / 1000;
  await run();
  await sleep(400);
  const t1 = Date.now() / 1000;
  await cdp.send('Page.stopScreencast');
  await cdp.detach();

  // Frames only arrive when the page repaints, so hold each one until the next.
  const list = [];
  const usable = frames.filter((f) => f.t >= t0 - 1);
  usable.forEach((f, i) => {
    const file = join(dir, `${String(i).padStart(5, '0')}.jpg`);
    writeFileSync(file, Buffer.from(f.data, 'base64'));
    const next = i + 1 < usable.length ? usable[i + 1].t : t1;
    list.push(`file '${file.replace(/\\/g, '/')}'`, `duration ${Math.max(0.001, next - f.t).toFixed(4)}`);
  });
  list.push(list[list.length - 2]);
  writeFileSync(join(dir, 'list.txt'), list.join('\n'));
  const target = join(OUT, `${name}.mp4`);
  execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', join(dir, 'list.txt'),
    '-vf', `scale=${page.__mobile ? '1170:2532' : '1920:1200'}:flags=lanczos,fps=30,format=yuv420p`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-movflags', '+faststart', target]);
  rmSync(dir, { recursive: true, force: true });
  console.log(`${name}: ${(t1 - t0).toFixed(1)}s, ${usable.length} frames -> ${target}`);
}

/* ───── the clips ───── */
const MOBILE_CLIPS = {
  // Phone view: admin signs in, sees the dashboard.
  async 'm-dashboard'(browser) {
    const { ctx, page } = await newPage(browser, true);
    await go(page, '/login');
    await sleep(1500);
    await record(page, 'm-dashboard', async () => {
      await login(page, ADMIN, true);
      await page.getByText('Institute growth').first().waitFor({ timeout: 60000 });
      await sleep(1400);
      await point(page, page.getByText('Fees due').first(), 900);
      await scrollBy(page, 420, 0, 900);
      await sleep(900);
      await scrollBy(page, 420, 0, 900);
      await sleep(900);
    });
    await ctx.close();
  },

  // Phone view: teacher taps two names absent, tells parents on WhatsApp.
  async 'm-attendance'(browser) {
    const { ctx, page } = await newPage(browser, true);
    await login(page, TEACHER);
    await go(page, '/attendance');
    const names = page.locator('button[aria-pressed]').locator('visible=true');
    await names.first().waitFor({ timeout: 60000 });
    await sleep(1200);
    await record(page, 'm-attendance', async () => {
      await sleep(600);
      await tap(page, names.nth(2), 500);
      await tap(page, names.nth(5), 700);
      await tap(page, page.getByRole('button', { name: /Tell \d+ absent parent/ }).locator('visible=true').first(), 1600);
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
      await sleep(1400);
    });
    await ctx.close();
  },

  // Phone view: record a fee, receipt appears.
  async 'm-fees'(browser) {
    const { ctx, page } = await newPage(browser, true);
    await login(page, ADMIN);
    await go(page, '/fees');
    const record1 = page.getByTitle(/Record a payment for/).locator('visible=true').first();
    await record1.waitFor({ timeout: 60000 });
    await sleep(1200);
    await record(page, 'm-fees', async () => {
      await sleep(600);
      await scrollBy(page, 300, 0, 700);
      await tap(page, record1, 900);
      const amount = page.locator('input[inputmode="decimal"]').first();
      await tap(page, amount, 150);
      await amount.press('Control+A');
      await amount.pressSequentially('10000', { delay: 110 });
      await sleep(400);
      await tap(page, page.getByRole('button', { name: /Save and make receipt/ }), 1800);
      await point(page, page.getByRole('button', { name: /Print or save PDF/ }), 1200);
    });
    await ctx.close();
  },

  // Phone view: save a new inquiry.
  async 'm-leads'(browser) {
    const { ctx, page } = await newPage(browser, true);
    await login(page, ADMIN);
    await go(page, '/leads');
    await page.getByText('Muskan Singhal').first().waitFor({ timeout: 60000 });
    await sleep(1200);
    await record(page, 'm-leads', async () => {
      await sleep(500);
      await tap(page, page.getByRole('button', { name: /New inquiry/ }).locator('visible=true').first(), 700);
      await page.getByLabel('Inquiry name').pressSequentially('Riya Sharma', { delay: 80 });
      await sleep(200);
      await type(page, page.getByLabel('Inquiry phone'), '9876543210', 60);
      await type(page, page.getByLabel('Inquiry note'), 'Wants a demo class', 55);
      await sleep(300);
      await tap(page, page.getByRole('button', { name: 'Save inquiry' }), 1800);
    });
    await ctx.close();
  },
};

const CLIPS = {
  // Admin signs in and sees the whole institute on one screen.
  async dashboard(browser) {
    const { ctx, page } = await newPage(browser);
    await go(page, '/login');
    await sleep(1500);
    await record(page, 'dashboard', async () => {
      await login(page, ADMIN, true);
      await sleep(1600);
      await point(page, page.getByText('Total Students').first(), 900);
      await point(page, page.getByText('Fees Pending').first(), 1100);
      await glide(page, 1240, 300, 900);
      await glide(page, 600, 520, 900);
      await scrollBy(page, 420, 10, 900);
      await glide(page, 700, 520, 1200);
      await scrollBy(page, -420, 10, 700);
      await sleep(600);
    });
    await ctx.close();
  },

  // Teacher marks two students absent and tells their parents on WhatsApp.
  async attendance(browser) {
    const { ctx, page } = await newPage(browser);
    await login(page, TEACHER);
    await go(page, '/attendance');
    await sleep(1500);
    await record(page, 'attendance', async () => {
      await sleep(700);
      const marks = page.getByRole('radio', { name: 'Absent' }).locator('visible=true');
      const n = await marks.count();
      await tap(page, marks.nth(Math.min(2, n - 1)), 500);
      await tap(page, marks.nth(Math.min(5, n - 1)), 700);
      await tap(page, page.getByRole('button', { name: /Tell \d+ absent parent/ }).first(), 1800);
      await sleep(1200);
    });
    await ctx.close();
  },

  // Admin records a fee and the receipt is made instantly.
  async fees(browser) {
    const { ctx, page } = await newPage(browser);
    await login(page, ADMIN);
    await go(page, '/fees');
    await sleep(1500);
    await record(page, 'fees', async () => {
      await sleep(500);
      await point(page, page.getByText('Outstanding').first(), 800);
      await point(page, page.getByText('Overdue').first(), 900);
      await tap(page, page.getByRole('button', { name: 'Record', exact: true }).first(), 900);
      const amount = page.locator('input[inputmode="decimal"]').first();
      await tap(page, amount, 150);
      await amount.press('Control+A');
      await amount.pressSequentially('10000', { delay: 110 });
      await sleep(500);
      await tap(page, page.getByRole('button', { name: /Save and make receipt/ }), 1800);
      await point(page, page.getByRole('button', { name: /Print or save PDF/ }), 1500);
    });
    await ctx.close();
  },

  // Find any student in a second.
  async students(browser) {
    const { ctx, page } = await newPage(browser);
    await login(page, ADMIN);
    await go(page, '/students');
    await sleep(1500);
    await record(page, 'students', async () => {
      await sleep(500);
      await point(page, page.getByText('Average attendance').first(), 900);
      await type(page, page.getByPlaceholder(/Search by name, class, batch/), 'Kiara', 110);
      await sleep(900);
      await glide(page, 1200, 495, 900);
      await glide(page, 880, 495, 1100);
    });
    await ctx.close();
  },

  // Every inquiry saved with a follow-up date.
  async leads(browser) {
    const { ctx, page } = await newPage(browser);
    await login(page, ADMIN);
    await go(page, '/leads');
    await sleep(1500);
    await record(page, 'leads', async () => {
      await sleep(500);
      await point(page, page.getByText('Follow-ups due').first(), 900);
      await glide(page, 1060, 610, 1100);
      await tap(page, page.getByRole('button', { name: /New inquiry/ }).first(), 700);
      await page.getByLabel('Inquiry name').pressSequentially('Riya Sharma', { delay: 80 });
      await sleep(250);
      await type(page, page.getByLabel('Inquiry phone'), '9876543210', 60);
      await type(page, page.getByLabel('Inquiry note'), 'Wants a demo class', 55);
      await sleep(300);
      await tap(page, page.getByRole('button', { name: 'Save inquiry' }), 1800);
    });
    await ctx.close();
  },
};

const only = process.argv.slice(2);
const browser = await chromium.launch({ channel: 'chrome' });
try {
  // Warm up the dev server (first API call compiles api/db.js).
  const warm = await newPage(browser);
  await login(warm.page, ADMIN);
  await warm.ctx.close();
  for (const [name, fn] of Object.entries({ ...CLIPS, ...MOBILE_CLIPS })) {
    if (only.length && !only.includes(name)) continue;
    await fn(browser);
  }
} finally {
  await browser.close();
  rmSync(TMP, { recursive: true, force: true });
}
