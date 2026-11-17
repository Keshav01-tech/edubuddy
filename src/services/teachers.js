import { teachesBatch, studentBatches, teachesStudent } from './batchRules.js';

export { teachesBatch, studentBatches, teachesStudent };

// Teachers are records inside an institute's data. Each one is assigned classes
// (and optionally one batch of a class), and the teacher panel shows only those.

/** Readable list such as "Class 10 · A, B" or "Class 9". */
export function describeAssignments(teacher) {
  const byClass = new Map();
  (teacher?.assignments || []).forEach((a) => {
    const list = byClass.get(a.className) || [];
    if (a.section) list.push(a.section);
    else list.push('');
    byClass.set(a.className, list);
  });
  return [...byClass.entries()].map(([className, sections]) => (
    sections.includes('') ? `${className} (all batches)` : `${className} · ${sections.join(', ')}`
  ));
}

const DAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const WEEK_DAYS = DAY_ORDER;

function clock(hhmm) {
  if (!/^\d{2}:\d{2}$/.test(hhmm || '')) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return m ? `${hour}:${String(m).padStart(2, '0')} ${suffix}` : `${hour} ${suffix}`;
}

/** "Mon–Fri" for a run of days, otherwise "Mon, Wed, Fri". */
export function describeDays(days = []) {
  const sorted = DAY_ORDER.filter((d) => days.includes(d));
  if (sorted.length === 7) return 'Every day';
  if (sorted.length === 6 && !sorted.includes('Sun')) return 'Mon–Sat';
  const idx = sorted.map((d) => DAY_ORDER.indexOf(d));
  const run = idx.length > 2 && idx.every((v, i) => i === 0 || v === idx[i - 1] + 1);
  return run ? `${sorted[0]}–${sorted[sorted.length - 1]}` : sorted.join(', ');
}

/** "4 PM – 5:30 PM", or '' when no time is set. */
export function describeTime(timing) {
  const start = clock(timing?.start);
  const end = clock(timing?.end);
  if (!start) return '';
  return end ? `${start} – ${end}` : start;
}

export const batchKey = (className, section) => `${className}||${section || ''}`;

/** True when the student sits in this batch. '' means a class that has no batches. */
export function inBatch(student, className, section) {
  if (!student || student.className !== className) return false;
  const list = studentBatches(student);
  return section ? list.includes(section) : list.length === 0;
}

/** Each of a student's batches with its subject and time. */
export function studentBatchDetails(student, classes = []) {
  const item = classes.find((c) => c.name === student?.className);
  return studentBatches(student).map((section) => {
    const timing = item?.timings?.[section] || {};
    return { section, subject: timing.subject || '', time: describeTime(timing), timing };
  });
}

/** One line such as "Class 10 · A Science, B Maths". */
export function describeStudentBatches(student, classes = []) {
  const parts = studentBatchDetails(student, classes).map((b) => [b.section, b.subject].filter(Boolean).join(' '));
  return [student?.className, parts.join(', ')].filter(Boolean).join(' · ');
}

/** True when two batch timings meet on a shared day at overlapping times. */
export function timingsOverlap(a = {}, b = {}) {
  const min = (t) => (/^\d{2}:\d{2}$/.test(t || '') ? Number(t.slice(0, 2)) * 60 + Number(t.slice(3)) : null);
  const as = min(a.start);
  const bs = min(b.start);
  if (as == null || bs == null) return false;
  if (!(a.days || []).some((d) => (b.days || []).includes(d))) return false;
  return as < (min(b.end) ?? bs + 60) && bs < (min(a.end) ?? as + 60);
}

// Every batch as one choice, e.g. "Class 10 · Batch A". Value is "class||section".
export function batchOptions(classes) {
  return classes.flatMap((item) => (item.sections?.length ? item.sections : ['']).map((section) => ({
    value: `${item.name}||${section}`,
    label: section ? `${item.name} · Batch ${section}` : item.name,
  })));
}
