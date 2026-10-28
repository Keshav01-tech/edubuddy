import { writeFileSync, mkdirSync } from 'node:fs';

const escape = (value) => value.replace(/[()\\]/g, '\\$&');

function pdf(lines) {
  const commands = lines.map(([x, y, text, size]) =>
    `BT /F1 ${size} Tf ${x} ${y} Td (${escape(text)}) Tj ET`).join('\n');
  const objects = [];
  const add = (body) => objects.push(body);
  add('<< /Type /Catalog /Pages 2 0 R >>');
  add('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  add('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>');
  add(`<< /Length ${commands.length} >>\nstream\n${commands}\nendstream`);
  add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  let body = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(body.length);
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = body.length;
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => { body += `${String(offset).padStart(10, '0')} 00000 n \n`; });
  body += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return body;
}

mkdirSync('out', { recursive: true });
const row = (y, cells) => cells.map((text, i) => [60 + i * 100, y, text, 12]);
writeFileSync('out/class-list.pdf', pdf([
  ...row(760, ['Roll', 'Name', 'Class', 'Fee', 'Due date']),
  ...row(736, ['1', 'Aarav Sharma', '10A', '12000', '05/11/2026']),
  ...row(712, ['2', 'Diya Patel', '10A', '12000', '05/11/2026']),
  ...row(688, ['3', 'Kabir Singh', '9B', '10000', '20/11/2026']),
  ...row(664, ['4', 'Meera Nair', '9B', '10000', '20/11/2026']),
]));
writeFileSync('out/class-lines.pdf', pdf([
  [60, 760, 'Aarav Sharma, Class 10A, Roll 1, Fee Rs. 12000, due date 05/11/2026', 12],
  [60, 736, 'Diya Patel Class 8B Roll no. 14', 12],
  [60, 712, 'Kabir Singh - Class 12', 12],
]));
console.log('ok');
