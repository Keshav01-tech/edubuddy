import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const BASE = 'http://localhost:5291';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const check = (name, ok) => results.push(`${ok ? 'PASS' : 'FAIL'} ${name}`);

const vite = spawn(process.execPath, [join(root, 'node_modules/vite/bin/vite.js'), '--port', '5291', '--strictPort'], {
  cwd: root, env: { ...process.env, VITE_SUPABASE_URL: 'your_supabase_project_url', VITE_SUPABASE_ANON_KEY: '' }, stdio: 'ignore',
});
for (let i = 0; i < 60; i += 1) { try { if ((await fetch(BASE)).ok) break; } catch { /* wait */ } await sleep(500); }

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('pageerror', (e) => results.push(`PAGE ERROR ${e.message}`));
  await page.goto(`${BASE}/login`);
  await page.getByPlaceholder('you@school.com').fill('t@school.com');
  await page.getByPlaceholder('••••••••').fill('password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL(`${BASE}/`);
  await page.goto(`${BASE}/attendance`);
  await page.getByRole('tab', { name: 'Students' }).click();
  await page.getByLabel('Upload student list PDF').setInputFiles(join(here, 'out', 'class-list.pdf'));
  await page.getByText('4 found').waitFor({ timeout: 15000 });
  const preview = await page.locator('ul.max-h-72 li').allInnerTexts();
  check('pdf reads 4 names and classes', preview.length === 4 && preview.every((row) => /Class 10A|Class 9B/.test(row)) && preview[0].includes('Aarav Sharma'));
  check('pdf reads fee and due date', /₹12,000/.test(preview[0]) && preview.some((row) => row.includes('Kabir Singh')));
  await page.getByRole('button', { name: 'Add 4 students' }).click();
  check('students added from pdf', (await page.getByRole('button', { name: /^Edit / }).count()) === 4);

  await page.getByRole('link', { name: 'Fees' }).first().click();
  await page.getByRole('radio', { name: /Outstanding/ }).click();
  check('outstanding shows all 4', (await page.getByRole('button', { name: /Record payment/ }).count()) === 4);
  check('outstanding total', await page.getByText('₹44,000').first().isVisible());
  await page.getByLabel('Due from').fill('2026-11-15');
  check('due-date filter keeps November 20', (await page.getByRole('button', { name: /Record payment/ }).count()) === 2);
  await page.getByLabel('Due from').fill('');

  await page.getByRole('button', { name: 'Record payment for Diya Patel' }).click();
  await page.getByRole('button', { name: /Save and make receipt/ }).click();
  await page.getByRole('button', { name: 'Close' }).click();
  await page.getByRole('radio', { name: /Outstanding/ }).click();
  check('paid student leaves outstanding', (await page.getByRole('button', { name: /Record payment/ }).count()) === 3);
  await page.getByRole('radio', { name: /Collected/ }).click();
  check('collected shows the paid student', await page.getByText('Diya Patel').isVisible() && (await page.getByRole('button', { name: /Record payment/ }).count()) === 1);

  await page.goto(`${BASE}/attendance`);
  await page.getByRole('tab', { name: 'Students' }).click();
  await page.getByLabel('Upload student list PDF').setInputFiles(join(here, 'out', 'class-lines.pdf'));
  await page.getByText(/found/).waitFor({ timeout: 15000 });
  const lines = await page.locator('ul.max-h-72 li').allInnerTexts();
  check('plain lines also read', lines.length === 3 && lines.some((row) => /Class 8B/.test(row)) && lines.some((row) => /Class 12/.test(row)));
} finally {
  await browser.close();
  vite.kill();
  console.log(results.join('\n'));
}
