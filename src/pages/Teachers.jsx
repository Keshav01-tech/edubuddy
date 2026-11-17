import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, X, Mail, Phone, BookOpen, Users, GraduationCap, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppHeader } from '../components/AppHeader';
import { Initials } from '../components/ui';
import { useClassroom } from '../services/classroom';
import { teachesBatch, teachesStudent, describeTime } from '../services/teachers';
import { suggestPassword } from '../services/admins';
import { FrontDeskStaff } from '../components/FrontDeskStaff';

const field = 'h-11 w-full px-4 text-sm bg-white rounded-2xl ring-1 ring-neutral-200 focus:outline-none focus:ring-2 focus:ring-[#c4c4c4] placeholder:text-neutral-400';
const BLANK = { name: '', subject: '', email: '', phone: '', password: '', assignments: [] };

/** The batches a teacher takes, each with its subject, time and room, earliest first. */
function batchesOf(teacher, classes) {
  return classes.flatMap((item) => (item.sections?.length ? item.sections : ['']).map((section) => ({ item, section })))
    .filter(({ item, section }) => teachesBatch(teacher, item.name, section))
    .map(({ item, section }) => {
      const t = item.timings?.[section] || {};
      return {
        key: `${item.name}|${section}`,
        title: `${item.name}${section ? ` · Batch ${section}` : ''}`,
        detail: [t.subject, describeTime(t), t.room].filter(Boolean).join(' · ') || 'No time set',
        start: t.start || '99',
      };
    })
    .sort((x, y) => x.start.localeCompare(y.start));
}

function BatchList({ teacher, classes }) {
  const list = batchesOf(teacher, classes);
  if (!list.length) return <p className="text-sm text-neutral-400">No batch yet. Give one on the <Link to="/classes" className="font-medium text-[#005a9c] hover:underline">Batches</Link> page.</p>;
  return (
    <ul className="space-y-1.5">
      {list.map((b) => (
        <li key={b.key} className="rounded-xl bg-neutral-50 px-3 py-2 text-sm leading-tight">
          <span className="block font-medium text-neutral-900">{b.title}</span>
          <span className="block text-xs text-neutral-500">{b.detail}</span>
        </li>
      ))}
    </ul>
  );
}

function TeacherForm({ initial, classes, onSave, onCancel }) {
  const [draft, setDraft] = useState(() => ({ ...BLANK, ...initial, password: initial?.id ? (initial.password || '') : suggestPassword() }));
  const set = (key) => (e) => setDraft((d) => ({ ...d, [key]: e.target.value }));
  const editing = !!initial?.id;
  const pw = String(draft.password || '').trim();
  const ready = draft.name.trim() && draft.email.trim() && (editing ? !pw || pw.length >= 6 : pw.length >= 6);

  const submit = (e) => {
    e.preventDefault();
    if (!ready) return;
    const record = { ...draft, name: draft.name.trim(), email: draft.email.trim().toLowerCase(), subject: draft.subject.trim(), phone: draft.phone.trim() };
    // Stored passwords are hidden; a blank box on edit keeps the current one.
    if (editing && !String(record.password || '').trim()) delete record.password;
    onSave(record);
  };

  return (
    <form onSubmit={submit} className="bg-white rounded-3xl shadow-card p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-medium text-neutral-800">{editing ? `Edit ${initial.name}` : 'Add a teacher'}</h2>
        <button type="button" onClick={onCancel} aria-label="Close" className="h-9 w-9 grid place-items-center rounded-full text-neutral-500 hover:bg-neutral-100"><X className="w-4 h-4" /></button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block"><span className="mb-1.5 block text-xs font-medium text-neutral-500">Name</span>
          <input className={field} value={draft.name} onChange={set('name')} placeholder="e.g. Rajesh Verma" required autoFocus /></label>
        <label className="block"><span className="mb-1.5 block text-xs font-medium text-neutral-500">Subject</span>
          <input className={field} value={draft.subject} onChange={set('subject')} placeholder="e.g. Mathematics" /></label>
        <label className="block"><span className="mb-1.5 block text-xs font-medium text-neutral-500">Email (their login)</span>
          <input className={field} type="email" value={draft.email} onChange={set('email')} placeholder="teacher@school.com" required /></label>
        <label className="block"><span className="mb-1.5 block text-xs font-medium text-neutral-500">Phone</span>
          <input className={field} value={draft.phone} onChange={set('phone')} placeholder="98xxxxxxxx" /></label>
        <label className="block sm:col-span-2"><span className="mb-1.5 block text-xs font-medium text-neutral-500">Password (they sign in with this)</span>
          <input className={field} value={draft.password} onChange={set('password')} placeholder={editing ? 'Leave blank to keep the current password' : 'At least 6 characters'} /></label>
      </div>

      <h3 className="mt-5 mb-1 text-sm font-medium text-neutral-800">Batches this teacher takes</h3>
      <p className="mb-3 text-xs text-neutral-500">Batches, with their time and room, are given on the Batches page. The teacher sees only those students.</p>
      {editing ? <BatchList teacher={initial} classes={classes} /> : <p className="text-sm text-neutral-500">Save the teacher, then pick them when you create a batch.</p>}

      <div className="mt-6 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="h-11 px-5 rounded-2xl bg-neutral-100 text-sm font-medium text-neutral-700 hover:bg-neutral-200">Cancel</button>
        <button type="submit" disabled={!ready} className="h-11 px-6 rounded-2xl bg-[#005a9c] text-white text-sm font-medium hover:brightness-95 disabled:opacity-40">
          {editing ? 'Save changes' : 'Add teacher'}
        </button>
      </div>
    </form>
  );
}

export default function Teachers() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const room = useClassroom();
  const [form, setForm] = useState(null); // null = closed, {} = new teacher, {...teacher} = editing

  const studentsOf = (teacher) => room.students.filter((s) => teachesStudent(teacher, s)).length;
  const totalAssigned = room.teachers.reduce((n, t) => n + (t.assignments?.length || 0), 0);
  const covered = room.students.filter((s) => room.teachers.some((t) => teachesStudent(t, s))).length;

  const save = (record) => {
    const { id, ...rest } = record;
    if (id) room.updateTeacher(id, rest);
    else room.addTeacher(rest);
    setForm(null);
  };

  const remove = (teacher) => {
    if (confirm(`Remove ${teacher.name}? They will no longer be able to sign in. Students and records stay untouched.`)) room.deleteTeacher(teacher.id);
  };

  return (
    <div className="min-h-dvh app-canvas">
      <AppHeader nav onSignOut={async () => { await signOut(); navigate('/login'); }} />

      <main className="mx-auto max-w-[1760px] px-4 sm:px-6 lg:px-8 pt-5 sm:pt-8 pb-14">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-medium tracking-tight text-neutral-900">Teachers</h1>
          <button type="button" onClick={() => setForm({})}
            className="h-11 px-4 rounded-xl bg-[#005a9c] text-white text-sm font-semibold inline-flex items-center gap-1.5 hover:bg-[#1b365d] shadow-sm">
            <Plus className="w-4 h-4" /> Add teacher
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5 sm:mb-6">
          {[
            { label: 'Teachers', value: room.teachers.length, hint: 'can sign in', icon: Users },
            { label: 'Batches', value: totalAssigned, hint: 'assigned', icon: GraduationCap },
            { label: 'Students', value: covered, hint: `of ${room.students.length}`, icon: BookOpen },
          ].map(({ label, value, hint, icon: Icon }) => (
            <div key={label} className="min-w-0 rounded-2xl bg-white p-3 sm:p-4 shadow-card">
              <div className="flex items-center justify-between gap-1">
                <p className="text-xs sm:text-[13px] font-semibold text-neutral-500 truncate">{label}</p>
                <span className="h-7 w-7 shrink-0 rounded-full grid place-items-center bg-[#eef7fc] text-[#005a9c]"><Icon className="w-3.5 h-3.5" /></span>
              </div>
              <p className="mt-1 text-xl sm:text-2xl font-bold tracking-tight tabular-nums text-neutral-900">{value}</p>
              <p className="text-[11px] sm:text-xs text-neutral-500 truncate">{hint}</p>
            </div>
          ))}
        </div>

        {form && (
          <div className="mb-6">
            <TeacherForm key={form.id || 'new'} initial={form} classes={room.classes} onSave={save} onCancel={() => setForm(null)} />
          </div>
        )}

        {room.teachers.length === 0 && !form ? (
          <section className="bg-white rounded-3xl p-8 sm:p-12 text-center shadow-card">
            <span className="mx-auto h-16 w-16 rounded-full grid place-items-center bg-[#f1f1f1] text-[#005a9c]"><Users className="w-7 h-7" /></span>
            <h2 className="mt-4 text-lg font-medium text-neutral-900">No teachers yet</h2>
            <p className="mt-1.5 text-sm text-neutral-500 max-w-md mx-auto">Add a teacher, assign their classes, and share the email and password so they can sign in.</p>
          </section>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-5 items-start">
            {room.teachers.map((teacher) => {
              return (
                <article key={teacher.id} className="bg-white rounded-3xl shadow-card p-5">
                  <div className="flex items-start gap-3">
                    <Initials name={teacher.name} className="h-12 w-12 text-sm" />
                    <div className="min-w-0 flex-1">
                      <h2 className="text-base font-medium text-neutral-900 truncate">{teacher.name}</h2>
                      <p className="text-sm text-neutral-500 truncate">{teacher.subject || 'No subject set'}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button type="button" onClick={() => setForm(teacher)} aria-label={`Edit ${teacher.name}`} className="h-9 w-9 grid place-items-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"><Pencil className="w-4 h-4" /></button>
                      <button type="button" onClick={() => remove(teacher)} aria-label={`Remove ${teacher.name}`} className="h-9 w-9 grid place-items-center rounded-full text-neutral-500 hover:bg-neutral-900 hover:text-white"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>

                  <ul className="mt-4 space-y-1.5 text-sm text-neutral-600">
                    <li className="flex items-center gap-2 min-w-0"><Mail className="w-4 h-4 shrink-0 text-neutral-400" /><span className="truncate">{teacher.email}</span></li>
                    {teacher.phone && <li className="flex items-center gap-2"><Phone className="w-4 h-4 shrink-0 text-neutral-400" />{teacher.phone}</li>}
                    <li className="flex items-center gap-2"><KeyRound className="w-4 h-4 shrink-0 text-neutral-400" />Password: <span className="font-mono text-neutral-800">{teacher.password || (teacher.hasPassword ? 'set (hidden)' : 'not set')}</span></li>
                  </ul>

                  <div className="mt-4 flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Takes</h3>
                    <span className="text-xs text-neutral-500 tabular-nums">{studentsOf(teacher)} students</span>
                  </div>
                  <div className="mt-2">
                    <BatchList teacher={teacher} classes={room.classes} />
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <FrontDeskStaff />
      </main>
    </div>
  );
}
