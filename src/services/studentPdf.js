import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

const CLASS_RE = /\b(?:class|std\.?|grade|std)\s*[:\-]?\s*(\d{1,2}\s*[A-Za-z]?)\b/i;
const ROLL_RE = /\b(?:roll(?:\s*(?:no\.?|number))?|r\.?\s*no\.?|sr\.?\s*no\.?)\s*[:\-]?\s*([A-Za-z]?\d{1,5})\b/i;
const FEE_RE = /\b(?:fee|fees|amount)\s*[:\-]?\s*(?:rs\.?|inr|₹)?\s*([\d,]{3,9})\b/i;
const DUE_RE = /\b(?:due(?:\s*date)?|fee\s*date)\s*[:\-]?\s*(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4})\b/i;

const cleanName = (value) => value
  .replace(/\b(?:name|student(?:\s*name)?|s\.?\s*name)\s*[:\-]\s*/i, '')
  .replace(/\s+/g, ' ')
  .trim();

const looksLikeName = (value) => {
  const name = cleanName(value);
  if (name.length < 3 || name.length > 60) return false;
  if (!/^[A-Za-z][A-Za-z .'\-]*[A-Za-z.]$/.test(name)) return false;
  if (/\b(class|roll|student|name|page|total|school|fee|date|absent|present)\b/i.test(name)) return false;
  return name.split(' ').length <= 5;
};

const toISO = (value) => {
  const match = String(value || '').match(/(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/);
  if (!match) return '';
  const [, day, month, rawYear] = match;
  const year = rawYear.length === 2 ? `20${rawYear}` : rawYear;
  const iso = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  const date = new Date(`${iso}T00:00:00`);
  return Number.isNaN(date.getTime()) ? '' : iso;
};

const fromItem = (item) => ({
  name: cleanName(item.name || ''),
  roll: String(item.roll ?? item.rollNo ?? item.roll_no ?? '').trim(),
  className: String(item.class ?? item.className ?? item.grade ?? item.std ?? '').trim(),
  fee: Number(String(item.fee ?? item.fees ?? item.amount ?? '').replace(/[^\d.]/g, '')) || 0,
  feeDate: toISO(item.dueDate ?? item.due_date ?? item.feeDate ?? item.fee_date ?? ''),
});

// pdf.js gives text items in reading order, so rows share a y position.
async function rowsOf(file) {
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const doc = await task.promise;
  try {
    const rows = [];
    for (let number = 1; number <= doc.numPages; number += 1) {
      const page = await doc.getPage(number);
      const content = await page.getTextContent();
      const lines = [];
      for (const item of content.items) {
        if (!('str' in item) || !item.str.trim()) continue;
        const y = Math.round(item.transform[5]);
        const line = lines.find((entry) => Math.abs(entry.y - y) <= 2);
        if (line) line.cells.push({ x: item.transform[4], text: item.str.trim() });
        else lines.push({ y, cells: [{ x: item.transform[4], text: item.str.trim() }] });
      }
      for (const line of lines.sort((a, b) => b.y - a.y)) {
        rows.push(line.cells.sort((a, b) => a.x - b.x).map((cell) => cell.text));
      }
      page.cleanup();
    }
    return rows;
  } finally {
    await task.destroy();
  }
}

function fromTable(rows) {
  const headerIndex = rows.findIndex((cells) =>
    cells.some((cell) => /name/i.test(cell)) && cells.some((cell) => /class|std|grade/i.test(cell)));
  if (headerIndex === -1) return [];

  const header = rows[headerIndex].map((cell) => cell.toLowerCase());
  const column = (pattern) => header.findIndex((cell) => pattern.test(cell));
  const nameCol = column(/\bname\b/);
  const classCol = column(/class|std|grade/);
  const rollCol = column(/roll|sr\.?\s*no|s\.?\s*no/);
  const feeCol = column(/fee|amount/);
  const dueCol = column(/due|fee\s*date/);
  if (nameCol === -1 || classCol === -1) return [];

  const cell = (cells, index) => (index >= 0 && index < cells.length ? cells[index] : '');
  const students = [];
  for (const cells of rows.slice(headerIndex + 1)) {
    if (cells.length < 2) continue;
    const student = {
      name: cleanName(cell(cells, nameCol)),
      className: cell(cells, classCol).replace(/^(class|std\.?|grade)\s*/i, '').trim(),
      roll: cell(cells, rollCol).replace(/[^\w]/g, ''),
      fee: Number(cell(cells, feeCol).replace(/[^\d.]/g, '')) || 0,
      feeDate: toISO(cell(cells, dueCol)),
    };
    if (looksLikeName(student.name)) students.push(student);
  }
  return students;
}

function fromLines(rows) {
  const students = [];
  for (const cells of rows) {
    const line = cells.join(' ');
    const classMatch = line.match(CLASS_RE);
    if (!classMatch) continue;
    const name = cleanName(
      line.replace(CLASS_RE, ' ').replace(ROLL_RE, ' ').replace(FEE_RE, ' ').replace(DUE_RE, ' ').replace(/[,|·\-–—]/g, ' '),
    );
    if (!looksLikeName(name)) continue;
    students.push({
      name,
      className: classMatch[1].replace(/\s+/g, ''),
      roll: (line.match(ROLL_RE) || [])[1] || '',
      fee: Number(((line.match(FEE_RE) || [])[1] || '').replace(/,/g, '')) || 0,
      feeDate: toISO((line.match(DUE_RE) || [])[1]),
    });
  }
  return students;
}

export async function studentsFromPdf(file) {
  const rows = await rowsOf(file);
  const raw = rows.flat().join(' ').trim();
  if (raw.startsWith('{') || raw.startsWith('[')) {
    const data = JSON.parse(raw);
    return (Array.isArray(data) ? data : data.students || []).map(fromItem).filter((s) => looksLikeName(s.name));
  }
  const table = fromTable(rows);
  return table.length ? table : fromLines(rows);
}
