import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const BASE = 'http://localhost:5292';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const check = (name, ok) => results.push(`${ok ? 'PASS' : 'FAIL'} ${name}`);

const vite = spawn(process.execPath, [join(root, 'node_modules/vite/bin/vite.js'), '--port', '5292', '--strictPort'], {
  cwd: root, env: { ...process.env, VITE_SUPABASE_URL: 'your_supabase_project_url', VITE_SUPABASE_ANON_KEY: '' }, stdio: 'ignore',
});
for (let i = 0; i < 60; i += 1) { try { if ((await fetch(BASE)).ok) break; } catch { /* wait */ } await sleep(500); }

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 800 } });
  page.on('pageerror', (e) => results.push(`PAGE ERROR ${e.message}`));
  const calls = [];
  await page.route('**/api/whatsapp', async (route) => {
    const body = route.request().postDataJSON();
    calls.push(body);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, configured: true, sent: body.students.map((s) => s.name), failed: [] }),
    });
  });
  await page.goto(`${BASE}/login`);
  await page.getByPlaceholder('you@school.com').fill('t@school.com');
  await page.getByPlaceholder('••••••••').fill('password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL(`${BASE}/`);
  await page.goto(`${BASE}/attendance`);
  await page.getByRole('tab', { name: 'Students' }).click();
  await page.getByLabel('Student name').fill('Aarav Sharma');
  await page.getByLabel('Parent WhatsApp').fill('9876543210');
  await page.getByRole('button', { name: 'Add student' }).click();
  await page.getByLabel('Student name').fill('Diya Patel');
  await page.getByRole('button', { name: 'Add student' }).click();
  await page.getByRole('tab', { name: 'Mark attendance' }).click();
  await page.getByRole('radio', { name: /Absent/ }).first().click();
  await page.getByRole('status').waitFor();
  check('message names the student', calls.length === 1 && calls[0].students[0].name === 'Aarav Sharma' && calls[0].students[0].phone === '9876543210');
  check('notice says sent', /WhatsApp sent for Aarav Sharma/.test(await page.getByRole('status').innerText()));
  await page.getByRole('radio', { name: /Absent/ }).first().click();
  await sleep(400);
  check('second tap does not send again', calls.length === 1);
  await page.getByRole('button', { name: 'All absent' }).click();
  await sleep(400);
  check('student without a number is not sent', calls.length === 1);
  check('missing number is explained', /No number|parent WhatsApp/.test(await page.getByRole('status').innerText()));
  const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  check('no sideways scroll', over <= 0);
} finally {
  await browser.close();
  vite.kill();
  console.log(results.join('\n'));
}
