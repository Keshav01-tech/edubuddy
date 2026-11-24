// AI notes are kept as plain text a teacher can edit: "## " starts a heading and "- " starts a point.

export const MAX_NOTE_CONTENT = 30000;

export function noteTextFrom(notes) {
  const lines = [];
  const block = (heading, points) => {
    const clean = (points || []).map((p) => String(p || '').trim()).filter(Boolean);
    if (!clean.length) return;
    lines.push(`## ${heading}`, ...clean.map((p) => `- ${p}`), '');
  };
  if (String(notes?.overview || '').trim()) lines.push(String(notes.overview).trim(), '');
  (notes?.sections || []).forEach((s) => block(String(s.heading || '').trim() || 'Notes', s.points));
  block('Key terms', (notes?.keyTerms || []).map((k) => `${String(k.term || '').trim()}: ${String(k.meaning || '').trim()}`));
  block('Formulas', notes?.formulas);
  block('Remember', notes?.remember);
  return lines.join('\n').trim();
}

/** Splits note text into headings, lists and paragraphs for display. */
export function noteBlocks(text) {
  const blocks = [];
  String(text || '').split(/\r?\n/).forEach((raw) => {
    const line = raw.trim();
    if (!line) return;
    if (line.startsWith('## ')) { blocks.push({ type: 'heading', text: line.slice(3).trim() }); return; }
    if (line.startsWith('- ')) {
      const last = blocks[blocks.length - 1];
      if (last?.type === 'list') last.items.push(line.slice(2).trim());
      else blocks.push({ type: 'list', items: [line.slice(2).trim()] });
      return;
    }
    blocks.push({ type: 'text', text: line });
  });
  return blocks;
}
