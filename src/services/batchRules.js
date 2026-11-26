// Who may see which student. Shared by the app and the server (api/db.js), so it has no imports.

/** True when this teacher takes the given class, and the batch if they take only some. */
export function teachesBatch(teacher, className, section) {
  if (!teacher) return false;
  return (teacher.assignments || []).some(
    (a) => a.className === className && (!a.section || a.section === (section || '')),
  );
}

/**
 * A student belongs to one class and can sit in several of its batches.
 * Older records kept a single `section`; they read as a one-batch list.
 */
export const studentBatches = (student) => {
  if (Array.isArray(student?.batches)) return student.batches;
  return student?.section ? [student.section] : [];
};

/* ───────── monthly fees ───────── */

const money = (value) => {
  const n = Math.round(Number(value));
  return Number.isFinite(n) && n >= 0 ? n : null;
};

/** The monthly fee the admin set for a batch, or 0 when none is set. */
export function batchFee(classes, className, section) {
  const item = (classes || []).find((c) => c.name === className);
  return money(item?.timings?.[section || '']?.fee) || 0;
}

/**
 * A student's monthly fee, batch by batch. Each batch costs its set fee unless this student has their own amount
 * for it (a reduced fee the admin or the batch's teacher agreed with the parent).
 * `priced` is false when none of the student's batches has a fee, so the hand-typed fee still applies.
 */
export function monthlyFee(student, classes) {
  const sections = studentBatches(student);
  const own = student?.batchFees || {};
  const lines = (sections.length ? sections : ['']).map((section) => {
    const listed = batchFee(classes, student?.className, section);
    const custom = money(own[section]);
    return { section, listed, fee: custom ?? listed, custom: custom != null && custom !== listed };
  });
  const priced = lines.some((l) => l.listed > 0 || money(own[l.section]) != null);
  return { lines, total: lines.reduce((sum, l) => sum + l.fee, 0), priced };
}

/** Keeps only valid amounts for batches the student is in. */
export function cleanBatchFees(student) {
  const sections = new Set(studentBatches(student).length ? studentBatches(student) : ['']);
  return Object.fromEntries(Object.entries(student?.batchFees || {})
    .filter(([section, value]) => sections.has(section) && money(value) != null && money(value) <= 1000000)
    .map(([section, value]) => [section, money(value)]));
}

/** True when the teacher takes at least one of the student's batches. */
export function teachesStudent(teacher, student) {
  const list = studentBatches(student);
  if (!list.length) return teachesBatch(teacher, student.className, '');
  return list.some((section) => teachesBatch(teacher, student.className, section));
}
