import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

// Students, attendance and fee payments are stored per teacher in this browser.
export const EMPTY_INSTITUTE = {
  name: '',
  tagline: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  phone: '',
  email: '',
  website: '',
  logo: '',
  principalName: '',
  receiptPrefix: 'REC',
};

const EMPTY = {
  students: [],
  attendance: {},
  payments: [],
  school: '',
  institute: EMPTY_INSTITUTE,
  nextReceipt: 1,
  classes: [],
  leads: [],
};

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
    || (a.section || '').localeCompare(b.section || '', undefined, { numeric: true })
    || a.name.localeCompare(b.name));

  const institute = {
    ...EMPTY_INSTITUTE,
    ...(data.institute || {}),
    name: data.institute?.name || data.school || '',
  };

  return {
    students,
    attendance: data.attendance,
    payments: data.payments,
    school: institute.name || data.school || '',
    institute,
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
    updateClass: (id, newName) => {
      const clean = String(newName || '').trim();
      if (!clean) return;
      update((d) => {
        const target = (d.classes || []).find((c) => c.id === id);
        if (!target) return {};
        const oldName = target.name;
        const classes = (d.classes || []).map((c) => (c.id === id ? { ...c, name: clean } : c));
        const students = (d.students || []).map((s) => (s.className === oldName ? { ...s, className: clean } : s));
        return { classes, students };
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
    renameSection: (classId, oldSection, newSection) => {
      const clean = String(newSection || '').trim();
      if (!clean || clean === oldSection) return;
      update((d) => {
        const target = (d.classes || []).find((c) => c.id === classId);
        const className = target?.name;
        const classes = (d.classes || []).map((item) => {
          if (item.id !== classId) return item;
          return {
            ...item,
            sections: (item.sections || []).map((s) => (s === oldSection ? clean : s)),
          };
        });
        const students = (d.students || []).map((s) => {
          if (s.className === className && s.section === oldSection) {
            return { ...s, section: clean };
          }
          return s;
        });
        return { classes, students };
      });
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

    markAttendance: (date, studentId, status) => update((d) => {
      const current = { ...(d.attendance[date] || {}) };
      if (!status) {
        delete current[studentId];
      } else {
        current[studentId] = status;
      }
      return { attendance: { ...d.attendance, [date]: current } };
    }),
    markAll: (date, ids, status) => update((d) => {
      const current = { ...(d.attendance[date] || {}) };
      if (!status) {
        ids.forEach((id) => delete current[id]);
      } else {
        ids.forEach((id) => { current[id] = status; });
      }
      return { attendance: { ...d.attendance, [date]: current } };
    }),

    addPayment: (payment) => {
      const saved = { ...payment, id: newId(), receiptNo: `R-${String(data.nextReceipt).padStart(4, '0')}` };
      update((d) => ({ payments: [saved, ...d.payments], nextReceipt: d.nextReceipt + 1 }));
      return saved;
    },
    deletePayment: (id) => update((d) => ({ payments: d.payments.filter((p) => p.id !== id) })),
    setSchool: (school) => update((d) => ({
      school,
      institute: { ...(d.institute || EMPTY_INSTITUTE), name: school },
    })),
    updateInstitute: (patch) => update((d) => {
      const next = { ...(d.institute || EMPTY_INSTITUTE), ...patch };
      return {
        institute: next,
        school: next.name || d.school,
      };
    }),

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
