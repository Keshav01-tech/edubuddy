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

/* ───────── monthly dues ───────── */
// A student on batch fees is billed every month: `fee` holds the monthly amount and `feeFrom` ("YYYY-MM") the first
// month billed. Each month adds one month's fee on its 1st; it falls due on the day of `feeDate` (default the 10th).

const DEFAULT_DUE_DAY = 10;
const pad = (n) => String(n).padStart(2, '0');

/** Months billed from `from` ("YYYY-MM" or a date) up to and including today's month; at least 1. */
export function monthsBilled(from, today) {
  const [fy, fm] = String(from || today).slice(0, 7).split('-').map(Number);
  const [ty, tm] = String(today).slice(0, 7).split('-').map(Number);
  if (!fy || !fm) return 1;
  return Math.max(1, (ty - fy) * 12 + (tm - fm) + 1);
}

/**
 * What a student has been charged so far and when the oldest unpaid month falls due.
 * Students with one fixed fee (not monthly) are returned as they are.
 */
export function feeStatus(student, paid, today) {
  const monthly = Number(student?.fee) || 0;
  if (student?.billing !== 'monthly' || !monthly) return { fee: monthly, feeDate: student?.feeDate || '', monthly: 0, months: 0 };
  const from = String(student.feeFrom || student.createdAt || today).slice(0, 7);
  const months = monthsBilled(from, today);
  const charged = monthly * months;
  const day = Math.min(28, Number(String(student.feeDate || '').slice(8, 10)) || DEFAULT_DUE_DAY);
  // The first month not fully paid; its due day is the date shown (none when everything is paid).
  const paidMonths = Math.floor((Number(paid) || 0) / monthly);
  let feeDate = '';
  if (paidMonths < months) {
    const [y, m] = from.split('-').map(Number);
    const at = new Date(Date.UTC(y, m - 1 + paidMonths, 1));
    feeDate = `${at.getUTCFullYear()}-${pad(at.getUTCMonth() + 1)}-${pad(day)}`;
  }
  return { fee: charged, feeDate, monthly, months };
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
