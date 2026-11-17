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

/** True when the teacher takes at least one of the student's batches. */
export function teachesStudent(teacher, student) {
  const list = studentBatches(student);
  if (!list.length) return teachesBatch(teacher, student.className, '');
  return list.some((section) => teachesBatch(teacher, student.className, section));
}
