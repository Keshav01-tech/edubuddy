import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'fs';
import path from 'path';

const root = path.resolve('src/data/NCERT Books/English Medium');
const outRoot = path.resolve('src/data/chapterText/English Medium');
const CAP = 150_000;

function walk(dir) {
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...walk(full));
    else if (entry.name.toLowerCase().endsWith('.pdf')) found.push(full);
  }
  return found;
}

function windowText(text, max) {
  if (text.length <= max) return text;
  const windows = 4;
  const size = Math.floor(max / windows);
  const step = Math.floor((text.length - size) / (windows - 1));
  const parts = [];
  for (let i = 0; i < windows; i += 1) parts.push(text.slice(i * step, i * step + size));
  return parts.join('\n[…]\n');
}

async function extract(file) {
  const data = new Uint8Array(fs.readFileSync(file));
  const task = getDocument({ data, verbosity: 0, isEvalSupported: false });
  try {
    const doc = await task.promise;
    const pages = [];
    for (let number = 1; number <= doc.numPages; number += 1) {
      const page = await doc.getPage(number);
      const content = await page.getTextContent();
      const text = content.items
        .map((item) => ('str' in item ? item.str + (item.hasEOL ? '\n' : ' ') : ''))
        .join('')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      if (text) pages.push(text);
      page.cleanup();
    }
    return pages.join('\n\n');
  } finally {
    await task.destroy();
  }
}

const files = walk(root);
let bytes = 0;
let written = 0;
let skipped = 0;
let failed = 0;

for (let index = 0; index < files.length; index += 1) {
  const file = files[index];
  const rel = path.relative(root, file);
  const target = path.join(outRoot, rel.replace(/\.pdf$/i, '.txt'));
  if (fs.existsSync(target) && fs.statSync(target).size > 0) {
    bytes += fs.statSync(target).size;
    skipped += 1;
    continue;
  }
  process.stdout.write(`${index + 1}/${files.length} ${rel}\n`);
  try {
    const text = windowText(await extract(file), CAP);
    if (text.length < 300) {
      failed += 1;
      process.stdout.write('SKIP short\n');
      continue;
    }
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, text);
    bytes += Buffer.byteLength(text);
    written += 1;
  } catch (error) {
    failed += 1;
    process.stdout.write(`FAIL ${error.message}\n`);
  }
}

console.log(`done written=${written} skipped=${skipped} failed=${failed} MB=${(bytes / 1024 / 1024).toFixed(1)}`);
