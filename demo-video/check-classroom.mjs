import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const shots = join(here, 'out', 'classroom');
mkdirSync(shots, { recursive: true });
const BASE = 'http://localhost:5289';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const vite = spawn(process.execPath, [join(root, 'node_modules/vite/bin/vite.js'), '--port', '5289', '--strictPort'], {
  cwd: root, env: { ...process.env, VITE_SUPABASE_URL: 'your_supabase_project_url', VITE_SUPABASE_ANON_KEY: '' }, stdio: 'ignore',
});
for (let i = 0; i < 60; i += 1) { try { if ((await fetch(BASE)).ok) break; } catch { /* wait */ } await sleep(500); }

const browser = await chromium.launch();
const results = [];
const check = (name, ok) => { results.push(`${ok ? 'PASS' : 'FAIL'} ${name}`); };
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('pageerror', (e) => results.push(`PAGE ERROR ${e.message}`));
  await page.goto(`${BASE}/login`);
  await page.getByPlaceholder('you@school.com').fill('t@school.com');
  await page.getByPlaceholder('••••••••').fill('password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL(`${BASE}/`);

  await page.getByRole('link', { name: 'Fees' }).first().click();
  await page.getByRole('button', { name: 'Add students' }).click();
  check('fees empty state opens students tab', await page.getByRole('heading', { name: 'Add a student' }).waitFor({ timeout: 5000 }).then(() => true, () => false));

  const add = async (name, roll, cls, fee) => {
    await page.getByLabel('Student name').fill(name);
    await page.getByLabel('Roll number').fill(roll);
    await page.getByLabel('Class', { exact: true }).fill(cls);
    await page.getByLabel('Total fee').fill(fee);
    await page.getByRole('button', { name: 'Add student' }).click();
  };
  await add('Aarav Sharma', '1', '10A', '12000');
  await add('Diya Patel', '2', '10A', '12000');
  await add('Kabir Singh', '3', '10A', '12000');
  check('3 students added', (await page.getByRole('button', { name: /^Edit / }).count()) === 3);

  await page.getByRole('button', { name: 'Edit Diya Patel' }).click();
  await page.getByLabel('Student name').nth(1).fill('Diya Patel K');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  check('student updated', await page.getByText('Diya Patel K').isVisible());

  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Delete Kabir Singh' }).click();
  check('student deleted', (await page.getByRole('button', { name: /^Edit / }).count()) === 2);

  await page.getByRole('tab', { name: 'Mark attendance' }).click();
  await page.getByRole('radio', { name: /Present/ }).first().click();
  await page.getByRole('radio', { name: /Absent/ }).nth(1).click();
  check('summary 1 present 1 absent', await page.getByText(/1 present/).isVisible() && await page.getByText(/1 absent/).isVisible());
  await page.screenshot({ path: join(shots, 'attendance-desktop.png') });
  await page.reload();
  await page.getByRole('radio', { name: /Present/ }).first().waitFor({ timeout: 10000 });
  check('attendance persists after reload', (await page.getByRole('radio', { checked: true }).count()) === 2);

  await page.getByRole('link', { name: 'Fees' }).first().click();
  await page.getByLabel('Your school or tuition name').fill('Sunrise Public School').catch(() => {});
  await page.getByPlaceholder('Your school or tuition name').fill('Sunrise Public School');
  await page.getByRole('button', { name: 'Record payment for Aarav Sharma' }).click();
  await page.getByRole('dialog').locator('input').first().fill('5000');
  await page.getByRole('dialog').getByPlaceholder('e.g. April fee').fill('April fee');
  await page.getByRole('button', { name: /Save and make receipt/ }).click();
  check('receipt shown', await page.getByText('R-0001').first().isVisible());
  check('receipt balance', await page.getByText(/Balance ₹7,000/).isVisible());
  await page.screenshot({ path: join(shots, 'receipt-desktop.png') });
  await page.emulateMedia({ media: 'print' });
  await page.screenshot({ path: join(shots, 'receipt-print.png') });
  await page.emulateMedia({ media: 'screen' });
  await page.getByRole('button', { name: 'Close' }).click();
  check('pending total', await page.getByText('₹19,000').isVisible());
  check('due badge', await page.getByText('Due ₹7,000').isVisible());
  await page.screenshot({ path: join(shots, 'fees-desktop.png') });

  for (const width of [320, 375, 768]) {
    await page.setViewportSize({ width, height: 760 });
    for (const path of ['/attendance', '/fees', '/']) {
      await page.goto(BASE + path);
      await sleep(400);
      const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      check(`no sideways scroll ${path} @${width} (${over}px)`, over <= 0);
    }
  }
  await page.setViewportSize({ width: 375, height: 760 });
  await page.goto(`${BASE}/attendance`);
  await page.screenshot({ path: join(shots, 'attendance-375.png') });
  await page.goto(`${BASE}/fees`);
  await page.screenshot({ path: join(shots, 'fees-375.png') });
} finally {
  await browser.close();
  vite.kill();
  console.log(results.join('\n'));
}
