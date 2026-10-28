import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

// Students, attendance and fee payments are stored per teacher in this browser.
const EMPTY = { students: [], attendance: {}, payments: [], school: '', nextReceipt: 1, classes: [], leads: [] };

const keyFor = (userId) => `edu_classroom_${userId || 'guest'}`;

function load(userId) {
  try {
    return { ...EMPTY, ...JSON.parse(localStorage.getItem(keyFor(userId)) || '{}') };
  } catch {
    return { ...EMPTY };
  }
}

const newId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

export function todayISO() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export const formatMoney = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value) || 0);

export const formatDate = (iso) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

export function useClassroom() {
  const { user } = useAuth();
  const userId = user?.id;
  const [data, setData] = useState(() => load(userId));

  useEffect(() => { setData(load(userId)); }, [userId]);

  const update = useCallback((change) => {
    setData((current) => {
      const next = { ...current, ...change(current) };
      localStorage.setItem(keyFor(userId), JSON.stringify(next));
      return next;
    });
  }, [userId]);

  const students = [...data.students].sort((a, b) =>
    (a.className || '').localeCompare(b.className || '', undefined, { numeric: true })
    || (Number(a.roll) || 0) - (Number(b.roll) || 0)
    || a.name.localeCompare(b.name));

  return {
    students,
    attendance: data.attendance,
    payments: data.payments,
    school: data.school,
    classes: [...(data.classes || [])].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })),

    addClass: (name) => {
      const clean = String(name || '').trim();
      if (!clean) return;
      update((d) => {
        const classes = d.classes || [];
        if (classes.some((item) => item.name.toLowerCase() === clean.toLowerCase())) return {};
        return { classes: [...classes, { id: newId(), name: clean, sections: [] }] };
      });
    },
    removeClass: (id) => update((d) => ({ classes: (d.classes || []).filter((item) => item.id !== id) })),
    addSection: (classId, section) => {
      const clean = String(section || '').trim();
      if (!clean) return;
      update((d) => ({
        classes: (d.classes || []).map((item) => {
          if (item.id !== classId) return item;
          if ((item.sections || []).some((name) => name.toLowerCase() === clean.toLowerCase())) return item;
          return { ...item, sections: [...(item.sections || []), clean] };
        }),
      }));
    },
    removeSection: (classId, section) => update((d) => ({
      classes: (d.classes || []).map((item) => (
        item.id === classId ? { ...item, sections: (item.sections || []).filter((name) => name !== section) } : item
      )),
    })),

    addStudent: (student) => update((d) => ({ students: [...d.students, { ...student, id: newId() }] })),
    updateStudent: (id, patch) => update((d) => ({
      students: d.students.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    })),
    deleteStudent: (id) => update((d) => {
      const attendance = {};
      for (const [date, marks] of Object.entries(d.attendance)) {
        const { [id]: _removed, ...rest } = marks;
        attendance[date] = rest;
      }
      return {
        students: d.students.filter((s) => s.id !== id),
        payments: d.payments.filter((p) => p.studentId !== id),
        attendance,
      };
    }),

    markAttendance: (date, studentId, status) => update((d) => ({
      attendance: { ...d.attendance, [date]: { ...(d.attendance[date] || {}), [studentId]: status } },
    })),
    markAll: (date, ids, status) => update((d) => ({
      attendance: {
        ...d.attendance,
        [date]: { ...(d.attendance[date] || {}), ...Object.fromEntries(ids.map((id) => [id, status])) },
      },
    })),

    addPayment: (payment) => {
      const saved = { ...payment, id: newId(), receiptNo: `R-${String(data.nextReceipt).padStart(4, '0')}` };
      update((d) => ({ payments: [saved, ...d.payments], nextReceipt: d.nextReceipt + 1 }));
      return saved;
    },
    deletePayment: (id) => update((d) => ({ payments: d.payments.filter((p) => p.id !== id) })),
    setSchool: (school) => update(() => ({ school })),

    leads: [...(data.leads || [])].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')),
    addLead: (lead) => update((d) => ({
      leads: [{ ...lead, id: newId(), status: lead.status || 'new', createdAt: lead.createdAt || todayISO() }, ...(d.leads || [])],
    })),
    updateLead: (id, patch) => update((d) => ({
      leads: (d.leads || []).map((lead) => (lead.id === id ? { ...lead, ...patch } : lead)),
    })),
    deleteLead: (id) => update((d) => ({ leads: (d.leads || []).filter((lead) => lead.id !== id) })),
  };
}
