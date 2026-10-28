export const MARKS = { mcq: 1, short: 3, long: 5 };

export const PAPER_MODES = [
  { id: 'mcq', label: 'MCQ', hint: '1 mark each' },
  { id: 'short', label: 'Short answer', hint: '3 marks each' },
  { id: 'long', label: 'Long answer', hint: '5 marks each' },
  { id: 'mixed', label: 'Mixed', hint: 'MCQ, short, and long' },
];

export const MIN_MARKS = 1;
export const MAX_MARKS = 100;
export const MARK_SHORTCUTS = [10, 20, 30, 50];

const TYPE_NAME = { mcq: 'MCQ', short: 'short', long: 'long' };

export function clampMarks(value) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return 10;
  return Math.min(MAX_MARKS, Math.max(MIN_MARKS, n));
}

function pack(type, marksEach, total) {
  const count = Math.floor(total / marksEach);
  const rest = total % marksEach;
  const sections = [];
  if (count > 0) sections.push({ type, marksEach, count });
  if (rest > 0) sections.push({ type, marksEach: rest, count: 1 });
  return sections;
}

// Roughly 20% MCQ, 40% short, 40% long, always in that order. MCQs absorb the
// remainder so the sections add up to the exact total.
function mixedSections(total) {
  if (total <= 3) return [{ type: 'mcq', marksEach: 1, count: total }];
  if (total < 9) {
    return [
      { type: 'mcq', marksEach: 1, count: total - 3 },
      { type: 'short', marksEach: 3, count: 1 },
    ];
  }

  let longCount = Math.max(1, Math.round((total * 0.4) / 5));
  let shortCount = Math.max(1, Math.round((total * 0.4) / 3));
  const minMcq = Math.max(2, Math.round(total * 0.2));
  let mcqCount = total - longCount * 5 - shortCount * 3;
  while (mcqCount < minMcq && (shortCount > 1 || longCount > 1)) {
    if (shortCount * 3 >= longCount * 5 && shortCount > 1) shortCount -= 1;
    else if (longCount > 1) longCount -= 1;
    else shortCount -= 1;
    mcqCount = total - longCount * 5 - shortCount * 3;
  }

  return [
    { type: 'mcq', marksEach: 1, count: mcqCount },
    { type: 'short', marksEach: 3, count: shortCount },
    { type: 'long', marksEach: 5, count: longCount },
  ];
}

export function buildBlueprint(mode, totalMarks) {
  const total = clampMarks(totalMarks);
  const type = MARKS[mode] ? mode : mode === 'mixed' ? 'mixed' : 'mcq';

  if (type === 'mixed') {
    return { mode: 'mixed', total, sections: mixedSections(total) };
  }

  return {
    mode: type,
    total,
    sections: pack(type, MARKS[type], total),
  };
}

export function totalOf(sections = []) {
  return sections.reduce((sum, section) => sum + section.marksEach * section.count, 0);
}

export function questionCount(sections = []) {
  return sections.reduce((sum, section) => sum + section.count, 0);
}

export function describeBlueprint(sections = []) {
  const parts = sections.map((section) => {
    const name = TYPE_NAME[section.type] || section.type;
    const unit = section.marksEach === 1 ? 'mark' : 'marks';
    return `${section.count} ${name} (${section.marksEach} ${unit})`;
  });
  return `${parts.join(' · ')} = ${totalOf(sections)} marks`;
}

export function paperLabel(mode) {
  return PAPER_MODES.find((item) => item.id === mode)?.label || 'Test';
}

export function sessionKind(session) {
  if (!session) return 'Test';
  if (session.paper_mode) return paperLabel(session.paper_mode);
  const types = session.question_types || [];
  if (types.length > 1) return 'Mixed';
  if (types[0]) return paperLabel(types[0]);
  return 'Test';
}

export function sectionsFromLegacy(count = 10, types = ['mcq']) {
  const included = (types || ['mcq']).filter((type) => MARKS[type]);
  const safe = included.length ? included : ['mcq'];
  const per = Math.floor(count / safe.length);
  const remainder = count - per * safe.length;
  return safe
    .map((type, index) => ({
      type,
      marksEach: MARKS[type],
      count: per + (index === 0 ? remainder : 0),
    }))
    .filter((section) => section.count > 0);
}

export function stampMarks(questions, sections) {
  if (!Array.isArray(questions)) return [];
  const slots = [];
  for (const section of sections || []) {
    for (let i = 0; i < section.count; i += 1) slots.push(section);
  }
  if (!slots.length) {
    return questions.map((question) => ({ ...question, marks: question.marks || 1 }));
  }

  return slots.slice(0, questions.length).map((section, index) => {
    const question = questions[index] || {};
    const options = Array.isArray(question.options)
      ? question.options.map((option) => String(option || '').trim()).filter(Boolean)
      : [];
    return {
      ...question,
      type: section.type,
      marks: section.marksEach,
      options: section.type === 'mcq' ? options.slice(0, 4) : [],
    };
  });
}
