import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, Pencil, Trash2, X, Users, Clock, AlertCircle, ArrowRight, GraduationCap, UserPlus, DoorOpen, BookOpen, UserRound,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppHeader } from '../components/AppHeader';
import { Picker, Initials } from '../components/ui';
import { useClassroom } from '../services/classroom';
import { teachesBatch, describeDays, describeTime, WEEK_DAYS, inBatch } from '../services/teachers';
import { useT } from '../i18n';
import { MediumTag } from './Students';

const field = 'h-11 w-full px-3 text-base sm:text-sm bg-white rounded-xl ring-1 ring-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-400 placeholder:text-neutral-400';
const NEW_CLASS = '__new__';
const DAY_PRESETS = [
  ['Every day (Mon–Sat)', ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']],
  ['Mon–Fri', ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']],
  ['Mon, Wed, Fri', ['Mon', 'Wed', 'Fri']],
  ['Tue, Thu, Sat', ['Tue', 'Thu', 'Sat']],
];

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const batchLabel = (section) => (section ? `Batch ${section}` : 'Whole class');
const minutes = (hhmm) => (/^\d{2}:\d{2}$/.test(hhmm || '') ? Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3)) : null);

/** True when two batches meet on a shared day at overlapping times. */
function overlaps(a, b) {
  const as = minutes(a.start);
  const bs = minutes(b.start);
  if (as == null || bs == null) return false;
  if (!(a.days || []).some((d) => (b.days || []).includes(d))) return false;
  const ae = minutes(a.end) ?? as + 60;
  const be = minutes(b.end) ?? bs + 60;
  return as < be && bs < ae;
}

/** Every batch in the institute as one row. */
function buildRows(room) {
  return room.classes.flatMap((item) => (item.sections?.length ? item.sections : ['']).map((section) => {
    const timing = item.timings?.[section] || {};
    const students = room.students.filter((s) => inBatch(s, item.name, section));
    const teachers = room.isTeacher
      ? (room.teacher ? [room.teacher] : [])
      : room.teachers.filter((t) => teachesBatch(t, item.name, section));
    return {
      key: `${item.id}|${section}`,
      classItem: item,
      className: item.name,
      section,
      timing,
      subject: timing.subject || teachers[0]?.subject || '',
      room: timing.room || '',
      students,
      teachers,
    };
  }));
}

/** Rows grouped by time slot, earliest first; batches without a time come last. */
function groupByTime(rows) {
  const groups = new Map();
  rows.forEach((row) => {
    const key = row.timing.start ? `${row.timing.start}-${row.timing.end || ''}` : 'none';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  });
  return [...groups.entries()]
    .sort(([a], [b]) => (a === 'none' ? 1 : b === 'none' ? -1 : a.localeCompare(b)))
    .map(([key, list]) => ({
      key,
      label: key === 'none' ? 'No time set' : describeTime(list[0].timing),
      rows: list.sort((x, y) => (x.room || 'zz').localeCompare(y.room || 'zz', undefined, { numeric: true })
        || x.className.localeCompare(y.className, undefined, { numeric: true })),
    }));
}

const Missing = ({ children }) => <span className="text-sm font-medium text-amber-700">{children}</span>;

function BatchForm({ room, rows, initial, onClose }) {
  const editing = !!initial;
  // A teacher creates batches for themselves and edits their own; they cannot rename, reassign or delete one.
  const asTeacher = room.isTeacher;
  const [classChoice, setClassChoice] = useState(initial?.className || room.classes[0]?.name || NEW_CLASS);
  const [newClass, setNewClass] = useState('');
  const [section, setSection] = useState(initial?.section || '');
  const [teacherId, setTeacherId] = useState(asTeacher ? room.teacher?.id || '' : initial?.teachers?.[0]?.id || '');
  const [subject, setSubject] = useState(initial?.subject || '');
  const [roomName, setRoomName] = useState(initial?.room || '');
  const [days, setDays] = useState(initial?.timing?.days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
  const [start, setStart] = useState(initial?.timing?.start || '');
  const [end, setEnd] = useState(initial?.timing?.end || '');
  // Teaching medium of the batch: English or Hindi. New students of the batch take it.
  const [medium, setMedium] = useState(initial?.timing?.medium || 'en');
  // Monthly fee of the batch in rupees. Each student's total adds up the batches they join.
  const [fee, setFee] = useState(initial?.timing?.fee ? String(initial.timing.fee) : '');
  const { t } = useT();

  const className = classChoice === NEW_CLASS ? newClass.trim() : classChoice;
  const existing = room.classes.find((c) => c.name.toLowerCase() === className.toLowerCase());
  const nameTaken = !!section.trim() && existing?.sections?.some((s) => s.toLowerCase() === section.trim().toLowerCase())
    && !(editing && initial.className === existing.name && initial.section.toLowerCase() === section.trim().toLowerCase());

  // The same teacher or room cannot be in two batches at once.
  const slot = { days, start, end };
  const others = rows.filter((r) => r.key !== initial?.key && overlaps(slot, r.timing));
  const teacherClash = teacherId && others.find((r) => r.teachers.some((t) => t.id === teacherId));
  const roomClash = roomName.trim() && others.find((r) => r.room.toLowerCase() === roomName.trim().toLowerCase());
  const badTime = start && end && minutes(end) <= minutes(start);
  const ready = className && section.trim() && !nameTaken && !teacherClash && !roomClash && !badTime;
  const where = (r) => `${r.className} · ${batchLabel(r.section)} (${describeTime(r.timing)})`;

  const knownRooms = [...new Set(rows.map((r) => r.room).filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const toggleDay = (day) => setDays((list) => (list.includes(day) ? list.filter((d) => d !== day) : [...list, day]));
  const pickTeacher = (id) => {
    setTeacherId(id);
    const t = room.teachers.find((x) => x.id === id);
    if (t?.subject && !subject.trim()) setSubject(t.subject);
  };

  const submit = (e) => {
    e.preventDefault();
    if (!ready) return;
    room.saveBatch({
      className,
      section: section.trim(),
      teacherId,
      subject,
      room: roomName,
      days,
      start,
      end,
      medium,
      fee: Number(fee) || 0,
      original: editing ? { className: initial.className, section: initial.section } : null,
    });
    onClose();
  };

  const remove = () => {
    const n = initial.students.length;
    const note = n ? ` ${plural(n, 'student stays', 'students stay')} on the student list without a batch.` : '';
    if (!confirm(`Delete ${initial.className} · ${batchLabel(initial.section)}?${note}`)) return;
    if (initial.section) room.removeSection(initial.classItem.id, initial.section);
    else room.removeClass(initial.classItem.id);
    onClose();
  };

  const chip = (on) => `h-9 w-12 rounded-full text-sm font-medium transition-colors ${on ? 'bg-[#005a9c] text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`;
  const label = 'mb-1 block text-xs font-semibold text-neutral-600';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-neutral-900/40 sm:p-4" onClick={onClose}>
      <form
        role="dialog"
        aria-modal="true"
        aria-label={editing ? 'Edit batch' : 'New batch'}
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl shadow-xl p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-neutral-900">{editing ? 'Edit batch' : 'New batch'}</h2>
          <button type="button" onClick={onClose} className="h-10 w-10 -mr-2 grid place-items-center rounded-xl text-neutral-400 hover:bg-neutral-100" aria-label="Close"><X className="w-5 h-5" /></button>
        </div>
        <p className="mb-4 text-sm text-neutral-500">One group of students, one teacher, one subject, one time.</p>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className={label}>Class</span>
              {editing ? (
                <p className={`${field} flex items-center bg-neutral-50 text-neutral-700`}>{initial.className}</p>
              ) : (
                <Picker
                  label="Class"
                  value={classChoice}
                  onChange={setClassChoice}
                  options={[...room.classes.map((c) => ({ value: c.name, label: c.name })), { value: NEW_CLASS, label: '+ New class' }]}
                />
              )}
            </div>
            <label className="block">
              <span className={label}>Batch name</span>
              {editing && asTeacher
                ? <p className={`${field} flex items-center bg-neutral-50 text-neutral-700`}>{initial.section}</p>
                : <input className={field} value={section} onChange={(e) => setSection(e.target.value)} placeholder="A Morning" required />}
            </label>
          </div>
          {!editing && classChoice === NEW_CLASS && (
            <input className={field} value={newClass} onChange={(e) => setNewClass(e.target.value)} placeholder="New class name, e.g. Class 11" aria-label="New class name" autoFocus />
          )}
          {nameTaken && <p className="-mt-2 text-sm text-rose-600">{className} already has a batch called “{section.trim()}”.</p>}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className={label}>Teacher</span>
              {asTeacher ? (
                <p className={`${field} flex items-center bg-neutral-50 text-neutral-700`}>You</p>
              ) : room.teachers.length === 0 ? (
                <p className="text-sm text-neutral-500 pt-2"><Link to="/teachers" className="font-semibold text-[#005a9c] hover:underline">Add a teacher</Link> first.</p>
              ) : (
                <Picker
                  label="Teacher"
                  placeholder="Choose teacher"
                  value={teacherId}
                  onChange={pickTeacher}
                  options={[{ value: '', label: 'No teacher yet' }, ...room.teachers.map((t) => ({ value: t.id, label: t.subject ? `${t.name} (${t.subject})` : t.name }))]}
                />
              )}
            </div>
            <label className="block">
              <span className={label}>Subject</span>
              <input className={field} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Science" />
            </label>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <label className="block"><span className={label}>Starts</span>
              <input type="time" className={field} value={start} onChange={(e) => setStart(e.target.value)} /></label>
            <label className="block"><span className={label}>Ends</span>
              <input type="time" className={field} value={end} onChange={(e) => setEnd(e.target.value)} /></label>
            <label className="block"><span className={label}>Room</span>
              <input className={field} value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="Room 1" list="known-rooms" />
              <datalist id="known-rooms">{knownRooms.map((r) => <option key={r} value={r} />)}</datalist>
            </label>
          </div>
          {badTime && <p className="-mt-2 text-sm text-rose-600">The end time must be after the start time.</p>}

          <label className="block">
            <span className={label}>Monthly fee (₹)</span>
            <input className={field} value={fee} onChange={(e) => setFee(e.target.value.replace(/\D/g, '').slice(0, 7))} inputMode="numeric" placeholder="1500" aria-label="Monthly fee" />
            <span className="mt-1 block text-xs text-neutral-500">Students in more than one batch pay the total of their batches. You or the batch teacher can lower it for one student.</span>
          </label>

          <div>
            <span className="mb-1.5 block text-xs font-semibold text-neutral-600">{t('Medium')}</span>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t('Medium')}>
              {[['en', 'English medium'], ['hi', 'Hindi medium']].map(([id, text]) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={medium === id}
                  onClick={() => setMedium(id)}
                  className={`h-10 rounded-xl text-sm font-medium ring-1 transition-colors ${medium === id ? 'ring-2 ring-[#005a9c] bg-[#eef6fc] text-neutral-900' : 'ring-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}
                >
                  {t(text)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-semibold text-neutral-600">Days</span>
            <div className="flex flex-wrap gap-1.5">
              {WEEK_DAYS.map((day) => (
                <button key={day} type="button" aria-pressed={days.includes(day)} onClick={() => toggleDay(day)} className={chip(days.includes(day))}>{day}</button>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {DAY_PRESETS.map(([text, list]) => (
                <button key={text} type="button" onClick={() => setDays(list)} className="h-7 px-2.5 rounded-full ring-1 ring-neutral-200 text-xs text-neutral-600 hover:bg-neutral-50">{text}</button>
              ))}
            </div>
          </div>

          {(teacherClash || roomClash) && (
            <div className="rounded-xl bg-rose-50 ring-1 ring-rose-200 px-3 py-2.5 text-sm text-rose-800 space-y-1" role="alert">
              {teacherClash && <p><strong>{teacherClash.teachers.find((t) => t.id === teacherId)?.name}</strong> already teaches {where(teacherClash)} at this time.</p>}
              {roomClash && <p><strong>{roomClash.room}</strong> is already used by {where(roomClash)} at this time.</p>}
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center gap-2">
          {editing && !asTeacher && (
            <button type="button" onClick={remove} className="h-11 px-4 rounded-xl text-sm font-medium text-rose-700 hover:bg-rose-50 inline-flex items-center gap-1.5">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          )}
          <button type="button" onClick={onClose} className="ml-auto h-11 px-4 rounded-xl text-sm font-medium text-neutral-600 hover:bg-neutral-100">Cancel</button>
          <button type="submit" disabled={!ready} className="h-11 px-5 rounded-xl bg-[#005a9c] hover:bg-[#1b365d] text-white text-sm font-semibold disabled:opacity-40">
            {editing ? 'Save batch' : 'Create batch'}
          </button>
        </div>
      </form>
    </div>
  );
}

// One soft colour per class, so the same class reads the same everywhere on the page.
const CLASS_COLORS = [
  { bg: '#e8f2fb', fg: '#005a9c' },
  { bg: '#e6f5ee', fg: '#17784a' },
  { bg: '#efeafb', fg: '#5b3fa8' },
  { bg: '#fdf0e1', fg: '#b35c0a' },
  { bg: '#fde8ee', fg: '#b0284f' },
  { bg: '#e3f3f5', fg: '#0e7180' },
];

function ClassTag({ row, color }) {
  return (
    <span className="inline-flex items-center gap-2 min-w-0">
      <span className="h-8 min-w-8 px-2 rounded-lg grid place-items-center text-xs font-bold tabular-nums" style={{ background: color.bg, color: color.fg }}>
        {row.className.replace(/^Class\s*/i, '')}{row.section ? `·${row.section}` : ''}
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block font-semibold text-neutral-900 truncate">{row.className}</span>
        <span className="block text-xs text-neutral-500 truncate">
          {batchLabel(row.section)}
          {row.timing?.fee > 0 && <> · ₹{Number(row.timing.fee).toLocaleString('en-IN')}/month</>}
          {row.timing?.medium === 'hi' && <MediumTag />}
        </span>
      </span>
    </span>
  );
}

/** Rooms across the day: one column per room, one block per batch, placed by its time. */
function RoomSchedule({ rows, colorFor, onOpen }) {
  const timed = rows.filter((r) => minutes(r.timing.start) != null);
  if (!timed.length) return <p className="text-sm text-neutral-500">Set batch times to see the room plan.</p>;
  const rooms = [...new Set(timed.map((r) => r.room || 'No room'))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const endOf = (r) => minutes(r.timing.end) ?? minutes(r.timing.start) + 60;
  const first = Math.floor(Math.min(...timed.map((r) => minutes(r.timing.start))) / 60);
  const last = Math.ceil(Math.max(...timed.map(endOf)) / 60);
  const hourPx = 34;
  const hours = Array.from({ length: last - first + 1 }, (_, i) => first + i);
  const hourLabel = (h) => `${h % 12 || 12}${h >= 12 ? 'p' : 'a'}`;

  return (
    <div className="flex text-[11px]">
      <div className="w-8 shrink-0 relative" style={{ height: 24 + (last - first) * hourPx }}>
        {hours.map((h) => (
          <span key={h} className="absolute left-0 -translate-y-1/2 text-neutral-400 tabular-nums leading-none" style={{ top: 24 + (h - first) * hourPx }}>{hourLabel(h)}</span>
        ))}
      </div>
      <div className="flex-1 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${rooms.length}, minmax(0, 1fr))` }}>
        {rooms.map((roomName) => (
          <div key={roomName} className="min-w-0">
            <p className="h-6 text-center font-semibold text-neutral-600 truncate">{roomName}</p>
            <div className="relative rounded-lg bg-neutral-50" style={{ height: (last - first) * hourPx }}>
              {hours.slice(1, -1).map((h) => <div key={h} className="absolute inset-x-0 border-t border-dashed border-neutral-200" style={{ top: (h - first) * hourPx }} />)}
              {timed.filter((r) => (r.room || 'No room') === roomName).map((r) => {
                const top = ((minutes(r.timing.start) - first * 60) / 60) * hourPx;
                const height = Math.max(((endOf(r) - minutes(r.timing.start)) / 60) * hourPx - 2, 18);
                const c = colorFor(r.className);
                return (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => onOpen?.(r)}
                    title={`${r.className} · ${batchLabel(r.section)} — ${r.subject || 'No subject'} — ${describeTime(r.timing)}`}
                    className="absolute inset-x-0.5 rounded-md px-1.5 py-0.5 text-left overflow-hidden hover:brightness-95 transition"
                    style={{ top, height, background: c.bg, color: c.fg, borderLeft: `3px solid ${c.fg}` }}
                  >
                    <span className="block font-bold leading-tight truncate">{r.className.replace(/^Class\s*/i, '')}{r.section ? `·${r.section}` : ''}</span>
                    {height > 30 && <span className="block leading-tight truncate opacity-80">{r.subject}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** How many batches and hours a week each teacher has. */
function TeacherLoad({ teachers, rows }) {
  const load = teachers.map((t) => {
    const mine = rows.filter((r) => r.teachers.some((x) => x.id === t.id));
    const weekly = mine.reduce((sum, r) => {
      const s = minutes(r.timing.start);
      if (s == null) return sum;
      const e = minutes(r.timing.end) ?? s + 60;
      return sum + ((e - s) / 60) * (r.timing.days || []).length;
    }, 0);
    return { t, batches: mine.length, weekly };
  }).sort((a, b) => b.weekly - a.weekly || b.batches - a.batches);
  const max = Math.max(1, ...load.map((l) => l.weekly));
  if (!load.length) return <p className="text-sm text-neutral-500"><Link to="/teachers" className="font-semibold text-[#005a9c] hover:underline">Add teachers</Link> to see their load.</p>;
  return (
    <ul className="space-y-3">
      {load.map(({ t, batches, weekly }) => (
        <li key={t.id} className="flex items-center gap-3">
          <Initials name={t.name} className="h-8 w-8 text-[11px] shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-medium text-neutral-900 truncate">{t.name}</p>
              <p className="text-xs text-neutral-500 tabular-nums shrink-0">{batches ? `${plural(batches, 'batch', 'batches')} · ${+weekly.toFixed(1)} h/wk` : 'Free'}</p>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-neutral-100 overflow-hidden">
              <div className="h-full rounded-full bg-[#005a9c]" style={{ width: `${(weekly / max) * 100}%`, opacity: batches ? 1 : 0 }} />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function Classes() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const room = useClassroom();
  const teacherView = room.isTeacher;
  const [form, setForm] = useState(null); // null closed, 'new', or a row being edited
  const [classFilter, setClassFilter] = useState('all');

  const allRows = buildRows(room);
  const rows = classFilter === 'all' ? allRows : allRows.filter((r) => r.className === classFilter);
  const slots = groupByTime(rows);
  const noTeacher = allRows.filter((r) => !r.teachers.length).length;
  const noTiming = allRows.filter((r) => !r.timing.start).length;
  const placed = new Set(allRows.flatMap((r) => r.students.map((s) => s.id)));
  const unplaced = room.students.filter((s) => !placed.has(s.id));
  const roomsUsed = new Set(allRows.map((r) => r.room).filter(Boolean));
  const busyTeachers = new Set(allRows.flatMap((r) => r.teachers.map((t) => t.id)));
  const colorFor = (className) => CLASS_COLORS[Math.max(0, room.classes.findIndex((c) => c.name === className)) % CLASS_COLORS.length];
  const teacherName = (row) => (row.teachers.length ? (teacherView ? 'You' : row.teachers.map((t) => t.name).join(', ')) : null);
  const attention = noTeacher + noTiming + (unplaced.length ? 1 : 0);

  const stats = teacherView
    ? [
      { label: 'My batches', value: allRows.length, icon: GraduationCap },
      { label: 'Students', value: placed.size, icon: Users },
    ]
    : [
      { label: 'Batches', value: allRows.length, hint: `${room.classes.length} classes`, icon: GraduationCap },
      { label: 'Students', value: placed.size, hint: unplaced.length ? `${unplaced.length} not in a batch` : 'all in a batch', warn: unplaced.length > 0, icon: Users },
      { label: 'Teachers', value: busyTeachers.size, hint: `of ${room.teachers.length} teaching`, icon: UserRound },
      { label: 'Rooms', value: roomsUsed.size, hint: 'in use', icon: DoorOpen },
    ];

  return (
    <div className="min-h-dvh app-canvas">
      <AppHeader nav onSignOut={async () => { await signOut(); navigate('/login'); }} />

      <main className="mx-auto max-w-[1760px] px-4 sm:px-6 lg:px-8 pt-5 sm:pt-8 pb-14">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-medium tracking-tight text-neutral-900">{teacherView ? 'My batches' : 'Batches'}</h1>
            <p className="mt-0.5 text-sm text-neutral-500">
              {teacherView ? 'Your batches, by time. Create a batch, set its monthly fee and add students.' : 'Who teaches what, when and where. One batch = one teacher, one subject, one time.'}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            {teacherView && allRows.length > 0 && (
              <Link to="/students" className="h-11 px-4 rounded-xl bg-white ring-1 ring-neutral-200 text-neutral-800 text-sm font-semibold inline-flex items-center gap-1.5 hover:bg-neutral-50">
                <UserPlus className="w-4 h-4" /> Add student
              </Link>
            )}
            <button type="button" onClick={() => setForm('new')}
              className="h-11 px-4 rounded-xl bg-[#005a9c] text-white text-sm font-semibold inline-flex items-center gap-1.5 hover:bg-[#1b365d] shadow-sm">
              <Plus className="w-4 h-4" /> New batch
            </button>
          </div>
        </div>

        {allRows.length === 0 && (
          <section className="bg-white rounded-3xl p-8 sm:p-12 text-center shadow-card">
            <span className="mx-auto h-16 w-16 rounded-full grid place-items-center bg-[#f1f1f1] text-[#005a9c]"><GraduationCap className="w-7 h-7" /></span>
            {teacherView ? (
              <>
                <h2 className="mt-4 text-lg font-medium text-neutral-900">No batches yet</h2>
                <p className="mt-1.5 text-sm text-neutral-500 max-w-md mx-auto">Create your first batch with its time and monthly fee, or ask your admin to give you one.</p>
                <button type="button" onClick={() => setForm('new')} className="mt-5 h-11 px-5 rounded-xl bg-[#005a9c] text-white text-sm font-semibold inline-flex items-center gap-1.5 hover:bg-[#1b365d]">
                  <Plus className="w-4 h-4" /> Create a batch
                </button>
              </>
            ) : (
              <>
                <h2 className="mt-4 text-lg font-medium text-neutral-900">No batches yet</h2>
                <p className="mt-1.5 text-sm text-neutral-500 max-w-md mx-auto">A batch is one group of students taught one subject by one teacher at a fixed time, e.g. Class 10 · A Morning · Science · 9:30 AM.</p>
                <button type="button" onClick={() => setForm('new')} className="mt-5 h-11 px-5 rounded-xl bg-[#005a9c] text-white text-sm font-semibold inline-flex items-center gap-1.5 hover:bg-[#1b365d]">
                  <Plus className="w-4 h-4" /> Create first batch
                </button>
              </>
            )}
          </section>
        )}

        {allRows.length > 0 && (
          <>
            {/* Summary */}
            <div className={`grid gap-2 sm:gap-3 mb-5 sm:mb-6 ${stats.length === 4 ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2'}`}>
              {stats.map(({ label, value, hint, warn, icon: Icon }) => (
                <div key={label} className="min-w-0 rounded-2xl bg-white p-3 sm:p-4 shadow-card">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs sm:text-[13px] font-semibold text-neutral-500 truncate">{label}</p>
                    <span className="h-7 w-7 shrink-0 rounded-full grid place-items-center bg-[#eef7fc] text-[#005a9c]"><Icon className="w-3.5 h-3.5" /></span>
                  </div>
                  <p className="mt-1 text-xl sm:text-2xl font-bold tracking-tight tabular-nums text-neutral-900">{value}</p>
                  {hint && <p className={`text-[11px] sm:text-xs truncate ${warn ? 'font-semibold text-amber-700' : 'text-neutral-500'}`}>{hint}</p>}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_400px] gap-6 items-start">
              {/* Timetable */}
              <section className="bg-white rounded-3xl shadow-card overflow-hidden min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-neutral-100">
                  <h2 className="text-base font-semibold text-neutral-900 inline-flex items-center gap-2"><Clock className="w-4 h-4 text-[#005a9c]" /> Timetable</h2>
                  {room.classes.length > 1 && (
                    <div className="w-full sm:w-52">
                      <Picker
                        size="sm"
                        label="Show class"
                        value={classFilter}
                        onChange={setClassFilter}
                        options={[{ value: 'all', label: 'All classes' }, ...room.classes.map((c) => ({ value: c.name, label: c.name }))]}
                      />
                    </div>
                  )}
                </div>

                {rows.length === 0 && <p className="px-5 py-12 text-center text-sm text-neutral-500">No batches in this class.</p>}

                {/* Desktop: time on the left, batches running at that time beside it */}
                <table className="hidden md:table w-full text-left">
                  <thead className="bg-neutral-50/70">
                    <tr className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                      <th className="pl-5 pr-3 py-2.5 w-40">Time</th>
                      <th className="px-3 py-2.5">Class · Batch</th>
                      <th className="px-3 py-2.5">Subject</th>
                      <th className="px-3 py-2.5">Teacher</th>
                      <th className="px-3 py-2.5">Room</th>
                      <th className="px-3 py-2.5 text-right">Students</th>
                      <th className="pr-4 py-2.5 w-12"><span className="sr-only">Edit</span></th>
                    </tr>
                  </thead>
                  {slots.map((slot) => (
                    <tbody key={slot.key} className="border-t border-neutral-100">
                      {slot.rows.map((row, i) => (
                        <tr key={row.key} className="group hover:bg-[#f8fafc]">
                          {i === 0 && (
                            <td rowSpan={slot.rows.length} className="pl-5 pr-3 py-3.5 align-top border-r border-neutral-100 bg-white">
                              {slot.key === 'none' ? (
                                <span className="text-sm font-semibold text-amber-700">No time set</span>
                              ) : (
                                <>
                                  <p className="text-sm font-semibold text-neutral-900 whitespace-nowrap">{slot.label}</p>
                                  <p className="text-xs text-neutral-500">{describeDays(row.timing.days || []) || '—'}</p>
                                  {slot.rows.length > 1 && <p className="mt-1.5 inline-flex rounded-full bg-[#eef7fc] px-2 py-0.5 text-[11px] font-medium text-[#005a9c]">{slot.rows.length} at once</p>}
                                </>
                              )}
                            </td>
                          )}
                          <td className="px-3 py-3"><ClassTag row={row} color={colorFor(row.className)} /></td>
                          <td className="px-3 py-3 text-sm">
                            {row.subject ? <span className="inline-flex items-center gap-1.5 text-neutral-900"><BookOpen className="w-3.5 h-3.5 text-neutral-400" />{row.subject}</span> : <Missing>No subject</Missing>}
                          </td>
                          <td className="px-3 py-3 text-sm">
                            {teacherName(row) ? (
                              <span className="inline-flex items-center gap-2 min-w-0">
                                <Initials name={row.teachers[0].name} className="h-7 w-7 text-[10px] shrink-0" />
                                <span className="text-neutral-900 truncate">{teacherName(row)}</span>
                              </span>
                            ) : <Missing>No teacher</Missing>}
                          </td>
                          <td className="px-3 py-3 text-sm">
                            {row.room ? <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-md bg-neutral-100 px-2 py-0.5 text-neutral-700"><DoorOpen className="w-3.5 h-3.5 text-neutral-400" />{row.room}</span> : <span className="text-neutral-400">—</span>}
                          </td>
                          <td className="px-3 py-3 text-sm text-right tabular-nums">
                            <span className="font-semibold text-neutral-900">{row.students.length}</span>
                          </td>
                          {(
                            <td className="pr-4 py-2 text-right">
                              <button type="button" onClick={() => setForm(row)} aria-label={`Edit ${row.className} ${batchLabel(row.section)}`}
                                className="h-9 w-9 inline-grid place-items-center rounded-lg text-neutral-400 opacity-60 group-hover:opacity-100 hover:bg-white hover:text-neutral-900 hover:shadow-sm transition">
                                <Pencil className="w-4 h-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  ))}
                </table>

                {/* Phone: same time slots, one card per batch */}
                <div className="md:hidden">
                  {slots.map((slot) => (
                    <div key={slot.key}>
                      <p className="px-4 py-2 bg-[#f6f8fa] text-sm font-semibold text-neutral-900 inline-flex w-full items-center gap-2">
                        <Clock className={`w-4 h-4 ${slot.key === 'none' ? 'text-amber-600' : 'text-[#005a9c]'}`} /> {slot.label}
                      </p>
                      <ul className="divide-y divide-neutral-100">
                        {slot.rows.map((row) => (
                          <li key={row.key} className="px-4 py-3">
                            <div className="flex items-center justify-between gap-2">
                              <ClassTag row={row} color={colorFor(row.className)} />
                              {(
                                <button type="button" onClick={() => setForm(row)} aria-label={`Edit ${row.className} ${batchLabel(row.section)}`}
                                  className="h-9 w-9 shrink-0 -mr-2 grid place-items-center rounded-lg text-neutral-500 hover:bg-neutral-100"><Pencil className="w-4 h-4" /></button>
                              )}
                            </div>
                            <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                              <span className="flex items-center gap-1.5 min-w-0"><BookOpen className="w-3.5 h-3.5 shrink-0 text-neutral-400" /><span className="truncate">{row.subject || <Missing>No subject</Missing>}</span></span>
                              <span className="flex items-center gap-1.5 min-w-0"><UserRound className="w-3.5 h-3.5 shrink-0 text-neutral-400" /><span className="truncate">{teacherName(row) || <Missing>No teacher</Missing>}</span></span>
                              <span className="flex items-center gap-1.5 min-w-0 text-neutral-600"><DoorOpen className="w-3.5 h-3.5 shrink-0 text-neutral-400" /><span className="truncate">{row.room || '—'} · {describeDays(row.timing.days || []) || '—'}</span></span>
                              <span className="flex items-center gap-1.5 text-neutral-600"><Users className="w-3.5 h-3.5 shrink-0 text-neutral-400" />{plural(row.students.length, 'student', 'students')}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>

              {/* Right rail */}
              <aside className="space-y-5 xl:sticky xl:top-24">
                {!teacherView && attention > 0 && (
                  <section className="rounded-3xl bg-amber-50 ring-1 ring-amber-200 p-5">
                    <h2 className="text-sm font-semibold text-amber-900 inline-flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Needs attention</h2>
                    <ul className="mt-2.5 space-y-1.5 text-sm text-amber-900">
                      {noTeacher > 0 && <li>{plural(noTeacher, 'batch has', 'batches have')} no teacher</li>}
                      {noTiming > 0 && <li>{plural(noTiming, 'batch has', 'batches have')} no time</li>}
                      {unplaced.length > 0 && (
                        <li><Link to="/students" className="inline-flex items-center gap-1 font-medium hover:underline">{plural(unplaced.length, 'student is', 'students are')} not in a batch <ArrowRight className="w-3.5 h-3.5" /></Link></li>
                      )}
                    </ul>
                  </section>
                )}

                <section className="bg-white rounded-3xl shadow-card p-5">
                  <div className="mb-3 flex items-baseline justify-between gap-2">
                    <h2 className="text-base font-semibold text-neutral-900 inline-flex items-center gap-2"><DoorOpen className="w-4 h-4 text-[#005a9c]" /> Room plan</h2>
                    <span className="text-xs text-neutral-400">click a batch to edit</span>
                  </div>
                  <RoomSchedule rows={rows} colorFor={colorFor} onOpen={setForm} />
                </section>

                {!teacherView && (
                  <section className="bg-white rounded-3xl shadow-card p-5">
                    <h2 className="mb-3.5 text-base font-semibold text-neutral-900 inline-flex items-center gap-2"><UserRound className="w-4 h-4 text-[#005a9c]" /> Teacher load</h2>
                    <TeacherLoad teachers={room.teachers} rows={allRows} />
                  </section>
                )}
              </aside>
            </div>
          </>
        )}
      </main>

      {form && <BatchForm room={room} rows={allRows} initial={form === 'new' ? null : form} onClose={() => setForm(null)} />}
    </div>
  );
}
