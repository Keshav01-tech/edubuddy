import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Check, X, Pencil, Trash2, UserPlus, Users, Search, Upload, FileText, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppHeader } from '../components/AppHeader';
import { useClassroom, todayISO, formatMoney } from '../services/classroom';
import { studentsFromPdf } from '../services/studentPdf';

const field = 'w-full h-11 px-3 text-base bg-white rounded-xl ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-400 placeholder:text-slate-400';

export function StudentForm({ initial, onSave, onCancel, classes = [] }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    roll: initial?.roll || '',
    className: initial?.className || classes[0]?.name || '',
    section: initial?.section || '',
    phone: initial?.phone || '',
    fee: initial?.fee ?? '',
    feeDate: initial?.feeDate || '',
  });
  const chosen = classes.find((item) => item.name === form.className);
  const sections = chosen?.sections || [];
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = (event) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    onSave({
      name: form.name.trim(),
      roll: form.roll.trim(),
      className: form.className.trim(),
      section: form.section.trim(),
      phone: form.phone.trim(),
      fee: Number(form.fee) || 0,
      feeDate: form.feeDate,
    });
    if (!initial) setForm({ name: '', roll: '', className: form.className, phone: '', fee: form.fee });
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <label className="block sm:col-span-2">
        <span className="mb-1 block text-xs font-medium text-slate-500">Student name</span>
        <input className={field} placeholder="Kartik Sharma" value={form.name} onChange={set('name')} aria-label="Student name" required autoFocus={!!initial} />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-500">Roll no.</span>
        <input className={field} placeholder="1" value={form.roll} onChange={set('roll')} aria-label="Roll number" inputMode="numeric" />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-500">Class</span>
        {classes.length > 0 ? (
          <select
            className={field}
            value={form.className}
            aria-label="Class"
            onChange={(event) => {
              const name = event.target.value;
              const next = classes.find((item) => item.name === name);
              setForm((current) => ({ ...current, className: name, section: next?.sections?.[0] || '' }));
            }}
          >
            {!classes.some((item) => item.name === form.className) && form.className && <option value={form.className}>{form.className}</option>}
            {classes.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
          </select>
        ) : (
          <input className={field} placeholder="Add classes in Settings" value={form.className} onChange={set('className')} aria-label="Class" />
        )}
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-500">Section</span>
        {sections.length > 0 ? (
          <select className={field} value={form.section} aria-label="Section" onChange={set('section')}>
            {form.section && !sections.includes(form.section) && <option value={form.section}>{form.section}</option>}
            {sections.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        ) : (
          <input className={field} placeholder="A" value={form.section} onChange={set('section')} aria-label="Section" />
        )}
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-500">Parent WhatsApp</span>
        <input className={field} placeholder="10-digit mobile number" value={form.phone} onChange={set('phone')} aria-label="Parent WhatsApp" inputMode="tel" />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-500">Total fee (₹)</span>
        <input className={field} placeholder="12000" value={form.fee} onChange={set('fee')} aria-label="Total fee" inputMode="numeric" />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-500">Fee due date</span>
        <input type="date" className={field} value={form.feeDate} onChange={set('feeDate')} aria-label="Fee due date" />
      </label>
      <div className="sm:col-span-2 flex gap-2 justify-end">
        {onCancel && (
          <button type="button" onClick={onCancel} className="h-10 px-4 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100">Cancel</button>
        )}
        <button type="submit" className="h-10 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold inline-flex items-center gap-1.5">
          {initial ? 'Save' : (<><UserPlus className="w-4 h-4" /> Add student</>)}
        </button>
      </div>
    </form>
  );
}

function PdfImport({ onAdd }) {
  const inputRef = useRef(null);
  const [found, setFound] = useState(null);
  const [picked, setPicked] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const read = async (file) => {
    if (!file) return;
    setBusy(true);
    setMessage('');
    setFound(null);
    try {
      const students = await studentsFromPdf(file);
      if (!students.length) {
        setMessage('No students found. The PDF needs a table with Name and Class columns, or lines like "Aarav Sharma, Class 10A".');
        return;
      }
      setFound(students);
      setPicked(students.map((_, index) => index));
    } catch {
      setMessage('Could not read that PDF. Try another file.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const toggle = (index) => setPicked((current) =>
    (current.includes(index) ? current.filter((item) => item !== index) : [...current, index]));

  return (
    <section className="bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-card p-4 sm:p-5">
      <h2 className="text-[15px] font-semibold text-slate-900">Add many students from a PDF</h2>
      <p className="mt-1 text-sm text-slate-500">Upload a class list. Names and classes are read automatically, then you confirm who to add.</p>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        aria-label="Upload student list PDF"
        onChange={(event) => read(event.target.files?.[0])}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="mt-3 w-full h-12 rounded-xl border-2 border-dashed border-brand-200 text-sm font-medium text-brand-700 hover:bg-brand-50 inline-flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        {busy ? 'Reading PDF…' : 'Upload PDF'}
      </button>
      {message && <p className="mt-3 text-sm text-rose-600" role="alert">{message}</p>}

      {found && (
        <div className="mt-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-sm font-medium text-slate-700 inline-flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-400" /> {found.length} found · {picked.length} selected
            </p>
            <button
              type="button"
              onClick={() => setPicked(picked.length === found.length ? [] : found.map((_, index) => index))}
              className="text-sm font-medium text-brand-700 hover:underline"
            >
              {picked.length === found.length ? 'Clear all' : 'Select all'}
            </button>
          </div>
          <ul className="max-h-72 overflow-y-auto rounded-xl ring-1 ring-slate-200 divide-y divide-slate-100">
            {found.map((student, index) => (
              <li key={`${student.name}-${index}`}>
                <label className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-slate-50">
                  <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={picked.includes(index)} onChange={() => toggle(index)} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-slate-900 truncate">{student.name}</span>
                    <span className="block text-xs text-slate-500 truncate">
                      {[student.className && `Class ${student.className}`, student.roll && `Roll ${student.roll}`, student.fee ? formatMoney(student.fee) : ''].filter(Boolean).join(' · ') || 'Class not found'}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2 justify-end">
            <button type="button" onClick={() => setFound(null)} className="h-10 px-4 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100">Cancel</button>
            <button
              type="button"
              disabled={!picked.length}
              onClick={() => { onAdd(picked.map((index) => found[index])); setFound(null); }}
              className="h-10 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold disabled:opacity-40 inline-flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" /> Add {picked.length} {picked.length === 1 ? 'student' : 'students'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function EmptyStudents({ onAdd }) {
  return (
    <div className="bg-white rounded-2xl ring-1 ring-slate-200/70 px-6 py-12 text-center">
      <Users className="w-8 h-8 mx-auto text-slate-300" />
      <p className="mt-3 font-medium text-slate-900">No students yet</p>
      <p className="mt-1 text-sm text-slate-500">Add your students once, then mark attendance every day.</p>
      <button type="button" onClick={onAdd} className="mt-4 h-10 px-4 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700">
        Add students
      </button>
    </div>
  );
}

export default function Attendance() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const room = useClassroom();
  const [tab, setTab] = useState(location.state?.tab === 'students' ? 'students' : 'mark');
  useEffect(() => {
    if (location.state?.tab) navigate(location.pathname, { replace: true, state: null });
  }, [location, navigate]);
  const [date, setDate] = useState(todayISO());
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState('');
  const [markQuery, setMarkQuery] = useState('');
  const [markFilter, setMarkFilter] = useState('all');
  const [group, setGroup] = useState('');
  const [notice, setNotice] = useState('');

  const marks = room.attendance[date] || {};
  const groups = room.classes.flatMap((item) => (
    (item.sections?.length ? item.sections : ['']).map((section) => ({
      id: `${item.name}||${section}`,
      className: item.name,
      section,
      label: section ? `${item.name}-${section}` : item.name,
    }))
  ));
  const activeId = groups.some((item) => item.id === group) ? group : (groups[0]?.id || 'all');
  const activeGroup = groups.find((item) => item.id === activeId);
  const inClass = room.students.filter((student) => {
    if (!activeGroup) return true;
    if (student.className !== activeGroup.className) return false;
    if ((student.section || '') === (activeGroup.section || '')) return true;
    return !student.section && groups.find((item) => item.className === student.className)?.id === activeGroup.id;
  });
  const present = inClass.filter((student) => marks[student.id] === 'P').length;
  const absent = inClass.filter((student) => marks[student.id] === 'A').length;
  const unmarked = inClass.length - present - absent;
  const markTerm = markQuery.trim().toLowerCase();
  const rollCall = inClass.filter((student) => {
    const status = marks[student.id];
    const matchesStatus = markFilter === 'all'
      || (markFilter === 'left' ? !status : status === markFilter);
    const matchesSearch = !markTerm || [student.name, student.roll, student.className].join(' ').toLowerCase().includes(markTerm);
    return matchesStatus && matchesSearch;
  });
  const term = query.trim().toLowerCase();
  const shown = room.students.filter((student) =>
    !term || [student.name, student.roll, student.className].join(' ').toLowerCase().includes(term));

  const rateOf = (id) => {
    let total = 0;
    let here = 0;
    for (const day of Object.values(room.attendance)) {
      if (day[id]) { total += 1; if (day[id] === 'P') here += 1; }
    }
    return total ? `${Math.round((here / total) * 100)}% present · ${total} days` : 'No attendance yet';
  };

  const notifyParents = async (students) => {
    const fresh = students.filter((student) => marks[student.id] !== 'A');
    if (!fresh.length) return;
    fresh.forEach((student) => room.markAttendance(date, student.id, 'A'));
    const missing = fresh.filter((student) => !student.phone.trim());
    const ready = fresh.filter((student) => student.phone.trim());
    if (!ready.length) {
      setNotice(`${missing.map((student) => student.name).join(', ')} marked absent. Add a parent WhatsApp number to message them.`);
      return;
    }
    setNotice('Sending WhatsApp…');
    try {
      const response = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          students: ready.map((student) => ({ name: student.name, phone: student.phone })),
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok && result.error) {
        setNotice(`Marked absent, but WhatsApp failed: ${result.error}`);
        return;
      }
      if (result.configured === false) {
        setNotice('Marked absent. WhatsApp is not set up yet, so no message was sent.');
        return;
      }
      const sent = result.sent || [];
      const failed = result.failed || [];
      const parts = [];
      if (sent.length) parts.push(`WhatsApp sent for ${sent.join(', ')}`);
      if (failed.length) parts.push(`${failed.map((item) => `${item.name}: ${item.error}`).join('; ')}`);
      if (missing.length) parts.push(`No number for ${missing.map((student) => student.name).join(', ')}`);
      setNotice(parts.join('. ') || 'Marked absent.');
    } catch {
      setNotice('Marked absent, but the WhatsApp message could not be sent.');
    }
  };

  const remove = (student) => {
    if (confirm(`Delete ${student.name}? Their attendance and fee records will be removed too.`)) room.deleteStudent(student.id);
  };

  return (
    <div className="min-h-dvh bg-slate-50">
      <AppHeader
        nav
        width="max-w-3xl"
        onSignOut={async () => { await signOut(); navigate('/login'); }}
      />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-5 sm:pt-8 pb-10">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">Attendance</h1>
            <p className="mt-1 text-sm text-slate-500">{room.students.length} {room.students.length === 1 ? 'student' : 'students'}</p>
          </div>
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl" role="tablist">
            {[['mark', 'Mark attendance'], ['students', 'Students']].map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={`h-9 px-3 rounded-lg text-sm font-medium ${tab === id ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {tab === 'mark' && (room.students.length === 0 ? <EmptyStudents onAdd={() => setTab('students')} /> : (
          <section className="space-y-3">
            <div className="bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <span className="sr-only">Date</span>
                  <input
                    type="date"
                    value={date}
                    max={todayISO()}
                    onChange={(event) => { setDate(event.target.value || todayISO()); setNotice(''); }}
                    className="h-11 px-3 rounded-xl ring-1 ring-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                </label>
                {date !== todayISO() && (
                  <button type="button" onClick={() => setDate(todayISO())} className="h-11 px-3 rounded-xl text-sm font-medium text-brand-700 hover:bg-brand-50">
                    Today
                  </button>
                )}
                <div className="flex gap-2 sm:ml-auto">
                  <button type="button" onClick={() => room.markAll(date, inClass.map((student) => student.id), 'P')} className="h-9 px-3 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700">
                    All present
                  </button>
                  <button type="button" onClick={() => notifyParents(inClass)} className="h-9 px-3 rounded-lg ring-1 ring-rose-200 text-rose-700 text-sm font-medium hover:bg-rose-50">
                    All absent
                  </button>
                </div>
              </div>
              {groups.length > 0 ? (
                <div className="mt-3 flex gap-1.5 overflow-x-auto pb-0.5" role="radiogroup" aria-label="Class and section">
                  {groups.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      role="radio"
                      aria-checked={activeId === item.id}
                      onClick={() => setGroup(item.id)}
                      className={`h-8 shrink-0 px-3 rounded-full text-sm font-medium ${activeId === item.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              ) : (
                <Link to="/settings" className="mt-3 inline-flex text-sm font-medium text-brand-700 hover:underline">
                  Add classes and sections in Settings
                </Link>
              )}
              <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden flex" aria-hidden="true">
                <div className="bg-emerald-500" style={{ width: `${inClass.length ? (present / inClass.length) * 100 : 0}%` }} />
                <div className="bg-rose-400" style={{ width: `${inClass.length ? (absent / inClass.length) * 100 : 0}%` }} />
              </div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm">
                <button type="button" onClick={() => setMarkFilter('all')} className={markFilter === 'all' ? 'font-semibold text-slate-900' : 'text-slate-500'}>{inClass.length} students</button>
                <button type="button" onClick={() => setMarkFilter('P')} className={markFilter === 'P' ? 'font-semibold text-emerald-700' : 'text-emerald-700/80'}>{present} present</button>
                <button type="button" onClick={() => setMarkFilter('A')} className={markFilter === 'A' ? 'font-semibold text-rose-700' : 'text-rose-700/80'}>{absent} absent</button>
                {unmarked > 0 && (
                  <button type="button" onClick={() => setMarkFilter(markFilter === 'left' ? 'all' : 'left')} className={markFilter === 'left' ? 'font-semibold text-slate-900' : 'text-slate-500'}>
                    {unmarked} left
                  </button>
                )}
              </div>
              {notice && <p className="mt-2 text-sm text-slate-700" role="status">{notice}</p>}
            </div>

            {inClass.length > 6 && (
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="search"
                  value={markQuery}
                  onChange={(event) => setMarkQuery(event.target.value)}
                  placeholder="Search name or roll no."
                  aria-label="Search students to mark"
                  className={`${field} pl-9`}
                />
              </div>
            )}

            <ul className="bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-card divide-y divide-slate-100">
              {rollCall.length === 0 && (
                <li className="px-5 py-8 text-sm text-slate-500 text-center">
                  {activeGroup ? `No students in ${activeGroup.label} yet.` : 'No students in this view.'}
                </li>
              )}
              {rollCall.map((student) => {
                const status = marks[student.id];
                const initial = student.name.trim().charAt(0).toUpperCase() || '?';
                return (
                  <li key={student.id} className={`flex items-center gap-2.5 px-3 sm:px-4 py-2 ${status === 'P' ? 'bg-emerald-50/80' : status === 'A' ? 'bg-rose-50/80' : ''}`}>
                    <span className={`h-8 w-8 shrink-0 rounded-full grid place-items-center text-xs font-semibold ${
                      status === 'P' ? 'bg-emerald-600 text-white' : status === 'A' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                    >
                      {initial}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">{student.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {[student.roll && `Roll ${student.roll}`, [student.className, student.section].filter(Boolean).join('-')].filter(Boolean).join(' · ') || 'No class'}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1" role="radiogroup" aria-label={`Attendance for ${student.name}`}>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={status === 'P'}
                        onClick={() => { room.markAttendance(date, student.id, 'P'); setNotice(''); }}
                        className={`h-8 px-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1 ${
                          status === 'P' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:text-emerald-700'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" /> Present
                      </button>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={status === 'A'}
                        onClick={() => notifyParents([student])}
                        className={`h-8 px-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1 ${
                          status === 'A' ? 'bg-rose-600 text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:text-rose-700'
                        }`}
                      >
                        <X className="w-3.5 h-3.5" /> Absent
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="px-1 text-xs text-slate-400">Absent sends one WhatsApp to the parent. Present does not. Marks save on their own.</p>
          </section>
        ))}

        {tab === 'students' && (
          <div className="space-y-4">
            <section className="bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-card p-4 sm:p-5">
              <h2 className="text-[15px] font-semibold text-slate-900 mb-3">Add a student</h2>
              <StudentForm onSave={room.addStudent} classes={room.classes} />
            </section>

            <PdfImport onAdd={(students) => students.forEach((student) => room.addStudent({ phone: '', ...student }))} />

            {room.students.length > 0 && (
              <section className="bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-card">
                <div className="p-4 sm:p-5 pb-3">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search by name, roll no. or class"
                      aria-label="Search students"
                      className={`${field} pl-9`}
                    />
                  </div>
                </div>
                <ul className="divide-y divide-slate-100 border-t border-slate-100">
                  {shown.length === 0 && <li className="px-5 py-6 text-sm text-slate-500 text-center">No students match.</li>}
                  {shown.map((student) => (
                    <li key={student.id} className="px-4 sm:px-5 py-3">
                      {editing === student.id ? (
                        <StudentForm
                          initial={student}
                          classes={room.classes}
                          onSave={(patch) => { room.updateStudent(student.id, patch); setEditing(null); }}
                          onCancel={() => setEditing(null)}
                        />
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-slate-900 truncate">{student.name}</p>
                            <p className="text-xs text-slate-500 truncate">
                              {[student.roll && `Roll ${student.roll}`, [student.className, student.section].filter(Boolean).join('-'), student.phone].filter(Boolean).join(' · ')}
                              {(student.roll || student.className || student.section || student.phone) ? ' · ' : ''}{rateOf(student.id)}
                            </p>
                          </div>
                          <button type="button" onClick={() => setEditing(student.id)} className="h-10 w-10 shrink-0 grid place-items-center rounded-xl text-slate-400 hover:text-brand-700 hover:bg-brand-50" aria-label={`Edit ${student.name}`}>
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button type="button" onClick={() => remove(student)} className="h-10 w-10 shrink-0 grid place-items-center rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50" aria-label={`Delete ${student.name}`}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </main>

    </div>
  );
}
