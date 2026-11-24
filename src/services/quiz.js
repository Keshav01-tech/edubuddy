// Helpers for building a practice MCQ quiz from a saved test paper or an uploaded CSV file.

export const blankQuestion = () => ({ question: '', options: ['', '', '', ''], answer: null });

export const QUIZ_CSV_SAMPLE = 'question,option A,option B,option C,option D,answer\n"What is 2 + 2?",3,4,5,6,B\n';

/** The MCQs of a saved paper that have four options and a matching correct answer. */
export function paperMcqs(paper) {
  const useHindi = paper?.language === 'hi';
  return (paper?.questions || []).flatMap((q) => {
    if (q.type !== 'mcq') return [];
    const text = useHindi && q.hi?.question ? q.hi : q;
    const options = (text.options || []).map((o) => String(o || '').trim());
    // A translated answer may be worded a little differently; the options keep their order, so the English match holds.
    const direct = options.indexOf(String(text.correctAnswer || '').trim());
    const english = (q.options || []).map((o) => String(o || '').trim()).indexOf(String(q.correctAnswer || '').trim());
    const answer = direct >= 0 ? direct : english;
    if (options.length !== 4 || options.some((o) => !o) || answer < 0) return [];
    return [{ question: String(text.question || '').trim(), options, answer }];
  });
}

function csvRows(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  const source = String(text || '').replace(/^﻿/, '');
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    if (quoted) {
      if (ch === '"' && source[i + 1] === '"') { cell += '"'; i += 1; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && source[i + 1] === '\n') i += 1;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += ch;
  }
  row.push(cell);
  rows.push(row);
  return rows.map((r) => r.map((c) => c.trim())).filter((r) => r.some(Boolean));
}

/** Reads rows of: question, option A, option B, option C, option D, answer (a letter A–D or the option's text). */
export function parseQuizCsv(text) {
  const rows = csvRows(text);
  const hasHeader = /^question/i.test(rows[0]?.[0] || '');
  const questions = [];
  const errors = [];
  rows.slice(hasHeader ? 1 : 0).forEach((r, index) => {
    const line = index + (hasHeader ? 2 : 1);
    const [question, a, b, c, d, given = ''] = r;
    const options = [a, b, c, d].map((o) => o || '');
    const letter = 'ABCD'.indexOf(given.toUpperCase());
    const answer = given.length === 1 && letter >= 0 ? letter : options.indexOf(given);
    if (!question || options.some((o) => !o) || answer < 0) errors.push(line);
    else questions.push({ question, options, answer });
  });
  return { questions, errors };
}
