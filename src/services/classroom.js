import { useSyncExternalStore } from 'react';
import { useAuth } from '../context/AuthContext';
import { teachesBatch, teachesStudent, studentBatches, batchKey } from './teachers';
import { callDb, getToken } from './cloud';
import { monthlyFee, cleanBatchFees } from './batchRules';

// An institute's students, batches, attendance, fees and leads. Always loaded from and saved to
// MongoDB through api/db.js; nothing is kept in the browser.
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
  // Marks per batch: { date: { "Class 10||A": { studentId: 'P' | 'A' } } }.
  // A student in two batches can be present in one and absent in the other.
  batchAttendance: {},
  payments: [],
  school: '',
  institute: EMPTY_INSTITUTE,
  nextReceipt: 1,
  classes: [],
  leads: [],
  teachers: [],
  receptionists: [],
  // Test marks: { id, className, section, subject, title, date, maxMarks, scores: { studentId: number } }.
  tests: [],
};

const newId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

export function todayISO() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export const formatMoney = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value) || 0);

export const formatDate = (iso) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

/* ───────── one shared store per signed-in user ─────────
 * Every screen reads the same data. It is loaded from MongoDB (api/db.js) and each change is sent back:
 * only the records that changed, a moment after the change, retried if the network fails.
 */
const stores = new Map();

/** Drops every loaded store, e.g. on sign in or sign out. */
export function resetClassroomStores() {
  stores.forEach((store) => store.dispose());
  stores.clear();
}

const LISTS = ['classes', 'teachers', 'receptionists', 'students', 'payments', 'leads', 'tests'];
const INSTITUTE_FIELDS = ['institute', 'school', 'nextReceipt'];
const pickInstitute = (data) => Object.fromEntries(INSTITUTE_FIELDS.map((f) => [f, data[f]]));

// Attendance is stored as one document per day and batch ("day" holds older day-level marks).
function attendanceDocs(data) {
  const map = new Map();
  Object.entries(data.attendance || {}).forEach(([date, marks]) => {
    map.set(`${date}|day`, { ref: marks, doc: { id: `${date}|day`, date, batchKey: 'day', marks } });
  });
  Object.entries(data.batchAttendance || {}).forEach(([date, byBatch]) => {
    Object.entries(byBatch || {}).forEach(([key, marks]) => {
      map.set(`${date}|${key}`, { ref: marks, doc: { id: `${date}|${key}`, date, batchKey: key, marks } });
    });
  });
  return map;
}

/** What changed between two states. Unchanged records keep the same object, so this is a cheap identity check. */
function diff(prev, next) {
  const changes = [];
  LISTS.forEach((collection) => {
    const before = new Map((prev[collection] || []).map((d) => [d.id, d]));
    const after = new Map((next[collection] || []).map((d) => [d.id, d]));
    const upserts = [...after.values()].filter((d) => before.get(d.id) !== d);
    const deletes = [...before.keys()].filter((id) => !after.has(id));
    if (upserts.length || deletes.length) changes.push({ collection, upserts, deletes });
  });
  const before = attendanceDocs(prev);
  const after = attendanceDocs(next);
  const upserts = [...after.entries()].filter(([id, v]) => before.get(id)?.ref !== v.ref).map(([, v]) => v.doc);
  const deletes = [...before.keys()].filter((id) => !after.has(id));
  if (upserts.length || deletes.length) changes.push({ collection: 'attendance', upserts, deletes });
  const institute = INSTITUTE_FIELDS.some((f) => prev[f] !== next[f]) ? pickInstitute(next) : null;
  return { changes, institute };
}

const fromServer = (res) => ({
  ...EMPTY,
  classes: res.classes || [],
  teachers: res.teachers || [],
  receptionists: res.receptionists || [],
  students: res.students || [],
  payments: res.payments || [],
  leads: res.leads || [],
  tests: res.tests || [],
  attendance: res.attendance || {},
  batchAttendance: res.batchAttendance || {},
  institute: { ...EMPTY_INSTITUTE, ...(res.institute || {}) },
  school: res.school || '',
  nextReceipt: res.nextReceipt || 1,
});

function createStore(signedIn) {
  // This store's own sign-in: its saves never go out under a later user's session.
  const token = getToken();
  let data = { ...EMPTY };
  let status = { loading: signedIn, sync: 'saved', error: '' };
  let snapshot = { data, ...status };
  const listeners = new Set();
  const emit = () => {
    snapshot = { data, ...status };
    listeners.forEach((listener) => listener());
  };
  const setStatus = (patch) => { status = { ...status, ...patch }; emit(); };

  // Changes waiting to be sent: per collection, the latest version of each record or its deletion.
  let pending = new Map();
  let pendingInstitute = null;
  let timer = null;
  let sending = false;
  let disposed = false;

  // New parent PINs waiting for the server, by student id. They never stay on the student record,
  // so a later edit of that student cannot send an old PIN again.
  const newPins = new Map();

  const applyChange = (prev, change) => {
    const next = { ...prev, ...change(prev) };
    if (!next.students?.some((s) => s.parentPin)) return next;
    return {
      ...next,
      students: next.students.map((s) => {
        if (!s.parentPin) return s;
        const { parentPin, ...rest } = s;
        newPins.set(s.id, parentPin);
        return rest;
      }),
    };
  };

  // Adds waiting PINs to an outgoing save, and notes which ones it carries.
  const withPins = (changes) => {
    const sentPins = new Map();
    const outgoing = changes.map((c) => (c.collection !== 'students' ? c : {
      ...c,
      upserts: c.upserts.map((doc) => {
        const parentPin = newPins.get(doc.id);
        if (!parentPin) return doc;
        sentPins.set(doc.id, parentPin);
        return { ...doc, parentPin };
      }),
    }));
    return { outgoing, sentPins };
  };

  // Forget only the PINs the server accepted; one typed while the save was running still goes out.
  const forgetPins = (sentPins) => sentPins.forEach((pin, id) => {
    if (newPins.get(id) === pin) newPins.delete(id);
  });

  const queue = ({ changes, institute }, { keepNewer = false } = {}) => {
    changes.forEach(({ collection, upserts, deletes }) => {
      if (!pending.has(collection)) pending.set(collection, { up: new Map(), del: new Set() });
      const slot = pending.get(collection);
      upserts.forEach((doc) => {
        if (keepNewer && (slot.up.has(doc.id) || slot.del.has(doc.id))) return;
        slot.up.set(doc.id, doc);
        slot.del.delete(doc.id);
      });
      deletes.forEach((id) => {
        if (keepNewer && (slot.up.has(id) || slot.del.has(id))) return;
        slot.up.delete(id);
        slot.del.add(id);
      });
    });
    if (institute && !(keepNewer && pendingInstitute)) pendingInstitute = institute;
  };

  const schedule = (delay = 400) => {
    if (disposed) return;
    clearTimeout(timer);
    timer = setTimeout(flush, delay);
  };

  // Leaving or reloading the page: send what is waiting at once; keepalive lets it finish after the page goes.
  const flushOnLeave = () => {
    if (sending || (!pending.size && !pendingInstitute)) return;
    clearTimeout(timer);
    const changes = [...pending.entries()]
      .map(([collection, { up, del }]) => ({ collection, upserts: [...up.values()], deletes: [...del] }))
      .filter((c) => c.upserts.length || c.deletes.length);
    const { outgoing, sentPins } = withPins(changes);
    const body = { changes: outgoing, ...(pendingInstitute ? { institute: pendingInstitute } : {}) };
    pending = new Map();
    pendingInstitute = null;
    callDb('sync', body, { keepalive: true, token })
      .then(() => forgetPins(sentPins))
      .catch(() => queue({ changes, institute: body.institute || null }, { keepNewer: true }));
  };
  const onVisibility = () => { if (document.visibilityState === 'hidden') flushOnLeave(); };
  if (signedIn && typeof window !== 'undefined') {
    window.addEventListener('pagehide', flushOnLeave);
    document.addEventListener('visibilitychange', onVisibility);
  }

  async function flush() {
    if (sending || disposed) return;
    const changes = [...pending.entries()]
      .map(([collection, { up, del }]) => ({ collection, upserts: [...up.values()], deletes: [...del] }))
      .filter((c) => c.upserts.length || c.deletes.length);
    const institute = pendingInstitute;
    if (!changes.length && !institute) { setStatus({ sync: 'saved', error: '' }); return; }
    pending = new Map();
    pendingInstitute = null;
    sending = true;
    setStatus({ sync: 'saving' });
    const { outgoing, sentPins } = withPins(changes);
    try {
      await callDb('sync', { changes: outgoing, ...(institute ? { institute } : {}) }, { token: getToken() || token });
      forgetPins(sentPins);
      sending = false;
      if (pending.size || pendingInstitute) schedule(0);
      else setStatus({ sync: 'saved', error: '' });
    } catch (err) {
      sending = false;
      queue({ changes, institute }, { keepNewer: true });
      setStatus({ sync: 'error', error: err.message });
      // A refusal (403/400) will not succeed on retry; network and server errors will.
      if (!err.status || err.status >= 500) schedule(10000);
    }
  }

  // Changes made before the institute has loaded are kept and re-applied to the loaded data.
  let early = [];

  const update = (change) => {
    const prev = data;
    data = applyChange(prev, change);
    if (!signedIn) {
      // Signed out: there is nowhere to save to.
    } else if (status.loading) {
      early.push(change);
    } else {
      queue(diff(prev, data));
      schedule();
    }
    emit();
  };

  let loadFailed = false;
  const loadNow = () => callDb('load', {}, { token }).then((res) => {
      if (disposed) return;
      data = fromServer(res);
      // Early changes run again below and note their PINs under the final student ids.
      newPins.clear();
      early.forEach((change) => {
        const prev = data;
        data = applyChange(prev, change);
        queue(diff(prev, data));
      });
      if (early.length) schedule(0);
      early = [];
      loadFailed = false;
      setStatus({ loading: false, sync: 'saved', error: '' });
    }).catch((err) => {
      if (disposed) return;
      // Keep edits blocked until the institute is loaded, so nothing overwrites what is in the database.
      loadFailed = true;
      setStatus({ sync: 'error', error: `Could not load from the database: ${err.message}` });
      if (!err.status || err.status >= 500) setTimeout(() => { if (!disposed && loadFailed) loadNow(); }, 5000);
    });
  if (signedIn) loadNow();

  return {
    subscribe: (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
    get: () => snapshot,
    update,
    retry: () => {
      if (loadFailed) { loadNow(); return; }
      if (status.sync === 'error' && !status.loading) { setStatus({ sync: 'saving' }); flush(); }
    },
    dispose: () => {
      flushOnLeave();
      disposed = true;
      clearTimeout(timer);
      if (signedIn && typeof window !== 'undefined') {
        window.removeEventListener('pagehide', flushOnLeave);
        document.removeEventListener('visibilitychange', onVisibility);
      }
    },
  };
}

function storeFor(userId, role) {
  const key = `${userId || 'signed-out'}:${role || ''}`;
  if (!stores.has(key)) stores.set(key, createStore(!!userId));
  return stores.get(key);
}

export function useClassroom() {
  const { user } = useAuth();
  // A teacher works inside the institute that added them, so they read the institute's data.
  const userId = user?.instituteId || user?.id;
  const isTeacher = user?.role === 'teacher';
  const isReceptionist = user?.role === 'receptionist';
  // The super admin and parents have no institute store (parents read their own children through parent.load).
  const store = storeFor(user && user.role !== 'superadmin' && user.role !== 'parent' ? userId : '', user?.role);
  const snap = useSyncExternalStore(store.subscribe, store.get);
  const { data } = snap;
  const update = store.update;

  // The signed-in teacher's own record. Teachers see only the classes assigned to it.
  const teacher = isTeacher ? (data.teachers || []).find((t) => t.id === user.teacherId) || { id: user.teacherId, assignments: [] } : null;
  const canSee = (className, section) => !isTeacher || teachesBatch(teacher, className, section);
  // A student's monthly fee follows their batches' fees once any batch has one. A teacher's screen
  // never holds fees, so the server works out the total for their saves.
  const priced = (student, classes) => {
    const batchFees = cleanBatchFees(student);
    if (isTeacher) return { ...student, batchFees };
    const fee = monthlyFee({ ...student, batchFees }, classes);
    return fee.priced ? { ...student, batchFees, fee: fee.total } : { ...student, batchFees };
  };

  // Every student carries a `batches` list; `section` mirrors the first one for older screens.
  const allStudents = data.students.map((s) => {
    const batches = studentBatches(s);
    // A number a teacher typed for a new student is saved, but not shown back to them.
    const { phone, fee: _fee, feeDate: _feeDate, ...teacherView } = s;
    return { ...(isTeacher ? teacherView : s), hasPhone: !!(phone || s.hasPhone), batches, section: batches[0] || '' };
  }).sort((a, b) =>
    (a.className || '').localeCompare(b.className || '', undefined, { numeric: true })
    || (a.section || '').localeCompare(b.section || '', undefined, { numeric: true })
    || a.name.localeCompare(b.name));
  const students = allStudents.filter((s) => !isTeacher || teachesStudent(teacher, s));
  const visibleIds = new Set(students.map((s) => s.id));

  const institute = {
    ...EMPTY_INSTITUTE,
    ...(data.institute || {}),
    name: data.institute?.name || data.school || '',
  };

  const onlyVisible = (marks) => (isTeacher ? Object.fromEntries(Object.entries(marks).filter(([id]) => visibleIds.has(id))) : marks);

  // A day's mark per student, for totals and percentages: present if present in any batch that day.
  // Older single marks (kept in `attendance`) still count where no batch mark exists.
  const dayAttendance = { ...data.attendance };
  Object.entries(data.batchAttendance || {}).forEach(([date, byBatch]) => {
    const merged = { ...(dayAttendance[date] || {}) };
    const seen = {};
    Object.values(byBatch).forEach((marks) => Object.entries(marks).forEach(([id, mark]) => {
      seen[id] = seen[id] === 'P' || mark === 'P' ? 'P' : 'A';
    }));
    dayAttendance[date] = { ...merged, ...seen };
  });
  const visibleAttendance = Object.fromEntries(Object.entries(dayAttendance).map(([date, marks]) => [date, onlyVisible(marks)]));
  const visibleBatchAttendance = Object.fromEntries(Object.entries(data.batchAttendance || {}).map(([date, byBatch]) => [
    date,
    Object.fromEntries(Object.entries(byBatch).map(([key, marks]) => [key, onlyVisible(marks)])),
  ]));
  const legacyAttendance = Object.fromEntries(Object.entries(data.attendance).map(([date, marks]) => [date, onlyVisible(marks)]));

  const visibleClasses = [...(data.classes || [])]
    .map((item) => (isTeacher
      ? { ...item, sections: (item.sections || []).filter((section) => canSee(item.name, section)) }
      : item))
    .filter((item) => !isTeacher || (item.sections.length > 0 || teachesBatch(teacher, item.name, '')))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  const teacherClassNames = new Set(visibleClasses.map((c) => c.name));

  // A teacher may only put a student into a batch the admin created and assigned to them.
  const batchExists = (className, section) => {
    const item = (data.classes || []).find((c) => c.name === className);
    if (!item) return false;
    return (item.sections || []).length ? (item.sections || []).includes(section || '') : !section;
  };
  // Batches the student may be given: each must exist; a teacher may only use their own.
  const cleanBatches = (className, list) => {
    const item = (data.classes || []).find((c) => c.name === className);
    const unique = [...new Set((list || []).map((x) => String(x || '').trim()).filter(Boolean))];
    return item?.sections?.length ? unique.filter((sec) => item.sections.includes(sec)) : unique;
  };
  const batchesFrom = (student) => (Array.isArray(student.batches) ? student.batches : student.section ? [student.section] : []);
  const teacherMayPlace = (className, list) => {
    if (!isTeacher) return true;
    if (!list.length) return batchExists(className, '') && canSee(className, '');
    return list.every((sec) => batchExists(className, sec) && canSee(className, sec));
  };
  // Only the admin shapes classes, batches and staff accounts (the server refuses the rest too).
  const adminOnly = (fn) => (isTeacher || isReceptionist ? () => {} : fn);

  return {
    backend: 'cloud',
    loading: snap.loading,
    syncState: snap.sync,
    syncError: snap.error,
    retrySync: store.retry,
    isTeacher,
    isReceptionist,
    teacher,
    teachers: isTeacher ? [] : [...(data.teachers || [])].sort((a, b) => a.name.localeCompare(b.name)),
    receptionists: [...(data.receptionists || [])].sort((a, b) => a.name.localeCompare(b.name)),
    students,
    attendance: visibleAttendance,
    batchAttendance: visibleBatchAttendance,
    legacyAttendance,
    payments: isTeacher ? [] : data.payments,
    school: institute.name || data.school || '',
    institute,
    classes: visibleClasses,

    addTeacher: adminOnly((record) => update((d) => ({
      teachers: [...(d.teachers || []), { assignments: [], ...record, id: newId() }],
    }))),
    updateTeacher: adminOnly((id, patch) => update((d) => ({
      teachers: (d.teachers || []).map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }))),
    deleteTeacher: adminOnly((id) => update((d) => ({ teachers: (d.teachers || []).filter((t) => t.id !== id) }))),

    // Front-desk accounts: they record fees (also from receipt photos), add students and handle inquiries.
    addReceptionist: adminOnly((record) => update((d) => ({
      receptionists: [...(d.receptionists || []), { active: true, ...record, email: String(record.email || '').trim().toLowerCase(), id: newId() }],
    }))),
    updateReceptionist: adminOnly((id, patch) => update((d) => ({
      receptionists: (d.receptionists || []).map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }))),
    deleteReceptionist: adminOnly((id) => update((d) => ({ receptionists: (d.receptionists || []).filter((r) => r.id !== id) }))),

    addClass: adminOnly((name) => {
      const clean = String(name || '').trim();
      if (!clean) return;
      update((d) => {
        const classes = d.classes || [];
        if (classes.some((item) => item.name.toLowerCase() === clean.toLowerCase())) return {};
        return { classes: [...classes, { id: newId(), name: clean, sections: [] }] };
      });
    }),
    removeClass: adminOnly((id) => update((d) => {
      const target = (d.classes || []).find((item) => item.id === id);
      return {
        classes: (d.classes || []).filter((item) => item.id !== id),
        teachers: (d.teachers || []).map((t) => ({
          ...t,
          assignments: (t.assignments || []).filter((a) => a.className !== target?.name),
        })),
      };
    })),
    removeSection: adminOnly((classId, section) => update((d) => {
      const target = (d.classes || []).find((item) => item.id === classId);
      const { [section]: _gone, ...timings } = target?.timings || {};
      return {
        classes: (d.classes || []).map((item) => (
          item.id === classId ? { ...item, sections: (item.sections || []).filter((name) => name !== section), timings } : item
        )),
        students: d.students.map((st) => {
          if (st.className !== target?.name) return st;
          const batches = studentBatches(st).filter((b) => b !== section);
          return { ...st, batches, section: batches[0] || '' };
        }),
        teachers: (d.teachers || []).map((t) => ({
          ...t,
          assignments: (t.assignments || []).filter((a) => !(a.className === target?.name && a.section === section)),
        })),
      };
    })),

    /**
     * Creates or edits one batch in a single step. A batch is one group of students taught
     * one subject by one teacher, at one time, in one room.
     * `original` is { className, section } when editing an existing batch.
     */
    saveBatch: adminOnly(({ className, section, days = [], start = '', end = '', subject = '', room = '', teacherId = '', medium = 'en', fee = 0, original = null }) => {
      const cls = String(className || '').trim();
      const sec = String(section || '').trim();
      if (!cls) return;
      update((d) => {
        let classes = [...(d.classes || [])];
        let students = d.students;
        let teachers = d.teachers || [];
        let item = classes.find((c) => c.name.toLowerCase() === cls.toLowerCase());
        if (!item) {
          item = { id: newId(), name: cls, sections: [], timings: {} };
          classes.push(item);
        }
        const name = item.name;
        const timings = { ...(item.timings || {}) };
        let sections = [...(item.sections || [])];

        // A renamed batch carries its students, timing and teachers with it.
        // Naming a "whole class" also moves its unbatched students into the new batch.
        if (original && original.className === name && original.section !== sec && sec) {
          sections = sections.map((s) => (s === original.section ? sec : s));
          delete timings[original.section];
          students = students.map((st) => {
            if (st.className !== name) return st;
            const list = studentBatches(st);
            if (original.section ? !list.includes(original.section) : list.length) return st;
            const batches = original.section ? list.map((b) => (b === original.section ? sec : b)) : [sec];
            // A student's own fee for the batch moves with its new name.
            const { [original.section]: own, ...batchFees } = st.batchFees || {};
            return { ...st, batches, section: batches[0], batchFees: own === undefined ? batchFees : { ...batchFees, [sec]: own } };
          });
          if (original.section) {
            teachers = teachers.map((t) => ({
              ...t,
              assignments: (t.assignments || []).map((a) => (a.className === name && a.section === original.section ? { ...a, section: sec } : a)),
            }));
          }
        }
        if (sec && !sections.includes(sec)) sections.push(sec);
        const monthly = Math.max(0, Math.round(Number(fee)) || 0);
        timings[sec] = { days, start, end, subject: String(subject).trim(), room: String(room).trim(), medium: medium === 'hi' ? 'hi' : 'en', fee: monthly };
        classes = classes.map((c) => (c.id === item.id ? { ...item, sections, timings } : c));
        // A new batch fee changes the monthly total of everyone in the class.
        students = students.map((st) => (st.className === name ? priced(st, classes) : st));

        // The chosen teacher takes this batch; any other teacher stops taking it.
        const wanted = new Set(teacherId ? [teacherId] : []);
        teachers = teachers.map((t) => {
          const list = t.assignments || [];
          const takes = teachesBatch(t, name, sec);
          if (wanted.has(t.id)) {
            return takes ? t : { ...t, assignments: [...list, { className: name, section: sec }] };
          }
          if (!takes) return t;
          // Untick: drop this batch. An "all batches" assignment becomes every other batch.
          const kept = list.filter((a) => a.className !== name || (a.section && a.section !== sec));
          const wasWhole = list.some((a) => a.className === name && !a.section);
          const expanded = wasWhole
            ? sections.filter((s) => s !== sec && !kept.some((a) => a.className === name && a.section === s)).map((s) => ({ className: name, section: s }))
            : [];
          return { ...t, assignments: [...kept, ...expanded] };
        });
        return { classes, students, teachers };
      });
    }),

    // Returns false when a teacher picks a batch they cannot use.
    addStudent: (student) => {
      const batches = cleanBatches(student.className, batchesFrom(student));
      if (!teacherMayPlace(student.className, batches)) return false;
      update((d) => ({
        students: [...d.students, priced({ ...student, batches, section: batches[0] || '', id: newId(), createdAt: student.createdAt || todayISO() }, d.classes)],
      }));
      return true;
    },
    updateStudent: (id, patch) => {
      const current = data.students.find((s) => s.id === id);
      if (!current) return false;
      const next = { ...patch };
      if ('batches' in patch || 'section' in patch || 'className' in patch) {
        // A teacher cannot move a student to another class, and only changes their own batches;
        // batches other teachers take stay as they were.
        const className = isTeacher ? current.className : (patch.className ?? current.className);
        let batches = cleanBatches(className, batchesFrom({ ...current, ...patch }));
        if (isTeacher) {
          const others = studentBatches(current).filter((b) => !canSee(className, b));
          const mine = batches.filter((b) => canSee(className, b));
          batches = [...others, ...mine];
        }
        Object.assign(next, { className, batches, section: batches[0] || '' });
      }
      update((d) => ({
        students: d.students.map((s) => (s.id === id ? priced({ ...s, ...next }, d.classes) : s)),
      }));
      return true;
    },
    deleteStudent: adminOnly((id) => update((d) => {
      const attendance = {};
      for (const [date, marks] of Object.entries(d.attendance)) {
        const { [id]: _removed, ...rest } = marks;
        attendance[date] = rest;
      }
      const batchAttendance = Object.fromEntries(Object.entries(d.batchAttendance || {}).map(([date, byBatch]) => [
        date,
        Object.fromEntries(Object.entries(byBatch).map(([key, marks]) => {
          const { [id]: _gone, ...rest } = marks;
          return [key, rest];
        })),
      ]));
      return {
        students: d.students.filter((s) => s.id !== id),
        payments: d.payments.filter((p) => p.studentId !== id),
        attendance,
        batchAttendance,
      };
    })),

    markAttendance: (date, studentId, status) => update((d) => {
      const current = { ...(d.attendance[date] || {}) };
      if (!status) {
        delete current[studentId];
      } else {
        current[studentId] = status;
      }
      return { attendance: { ...d.attendance, [date]: current } };
    }),
    /** Marks students present ('P'), absent ('A') or clears them (null) in one batch on one day. */
    markBatch: (date, className, section, ids, status) => update((d) => {
      const key = batchKey(className, section);
      const day = { ...((d.batchAttendance || {})[date] || {}) };
      const marks = { ...(day[key] || {}) };
      ids.forEach((id) => { if (status) marks[id] = status; else delete marks[id]; });
      day[key] = marks;
      return { batchAttendance: { ...(d.batchAttendance || {}), [date]: day } };
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

    addPayment: isTeacher ? () => null : (payment) => {
      const saved = { ...payment, id: newId(), receiptNo: `R-${String(data.nextReceipt).padStart(4, '0')}` };
      update((d) => ({ payments: [saved, ...d.payments], nextReceipt: d.nextReceipt + 1 }));
      return saved;
    },
    deletePayment: isReceptionist || isTeacher ? () => {} : (id) => update((d) => ({ payments: d.payments.filter((p) => p.id !== id) })),
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

    // Enquiries are tied to a class, so a teacher sees those for the classes they take.
    leads: [...(data.leads || [])]
      .filter((lead) => !isTeacher || teacherClassNames.has(lead.className))
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')),
    addLead: (lead) => update((d) => ({
      leads: [{ ...lead, id: newId(), status: lead.status || 'new', createdAt: lead.createdAt || todayISO() }, ...(d.leads || [])],
    })),
    updateLead: (id, patch) => update((d) => ({
      leads: (d.leads || []).map((lead) => (lead.id === id ? { ...lead, ...patch } : lead)),
    })),
    deleteLead: (id) => update((d) => ({ leads: (d.leads || []).filter((lead) => lead.id !== id) })),

    // Test marks, one record per test of a batch. A teacher sees and marks only their own batches.
    tests: [...(data.tests || [])]
      .filter((t) => !isTeacher || canSee(t.className, t.section || ''))
      .sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || '').localeCompare(a.createdAt || '')),
    /** Creates a test (no id) or saves an existing one; returns its id. The front desk does not enter marks. */
    saveTest: isReceptionist ? () => null : (test) => {
      if (isTeacher && !canSee(test.className, test.section || '')) return null;
      const id = test.id || newId();
      update((d) => {
        const list = d.tests || [];
        const saved = { ...test, id, createdAt: test.createdAt || new Date().toISOString() };
        return { tests: list.some((t) => t.id === id) ? list.map((t) => (t.id === id ? saved : t)) : [saved, ...list] };
      });
      return id;
    },
    deleteTest: isReceptionist ? () => {} : (id) => update((d) => ({ tests: (d.tests || []).filter((t) => t.id !== id) })),
  };
}
