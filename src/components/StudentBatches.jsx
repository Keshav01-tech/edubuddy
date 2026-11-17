import React from 'react';
import { studentBatchDetails } from '../services/teachers';

/**
 * A student's batches as small chips, e.g. "A · Science · 9:30 AM – 10:30 AM".
 * A student can sit in several batches of their class, one per subject or time.
 * `showTime` adds the batch time; `showClass` puts the class name in front.
 */
export function StudentBatches({ student, classes = [], showTime = false, showClass = false, empty = 'No batch', className = '' }) {
  const list = studentBatchDetails(student, classes);
  return (
    <span className={`inline-flex flex-wrap items-center gap-1 ${className}`}>
      {showClass && student?.className && <span className="mr-0.5 text-xs font-medium text-neutral-700">{student.className}</span>}
      {list.length === 0 ? (
        <span className="text-xs italic text-neutral-400">{empty}</span>
      ) : list.map((b) => (
        <span
          key={b.section}
          className="inline-flex items-center gap-1 rounded-full bg-[#eef6fc] px-2 py-0.5 text-[11px] font-medium text-[#005a9c] whitespace-nowrap"
          title={[`Batch ${b.section}`, b.subject, b.time].filter(Boolean).join(' · ')}
        >
          <span className="font-bold">{b.section}</span>
          {b.subject && <span className="text-[#1b365d]/80">· {b.subject}</span>}
          {showTime && b.time && <span className="text-neutral-500">· {b.time}</span>}
        </span>
      ))}
    </span>
  );
}
