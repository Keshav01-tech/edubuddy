import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Send, Users, X, Search, CheckCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppHeader } from '../components/AppHeader';
import { useClassroom, todayISO } from '../services/classroom';
import { getToken } from '../services/cloud';
import { inBatch, batchKey, describeTime, describeDays, studentBatchDetails } from '../services/teachers';

export { StudentForm, PdfImport } from './Students';

function formatDisplayDate(isoString) {
  if (!isoString) return '';
  const [year, month, day] = isoString.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

const initialsOf = (name) => String(name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

function shiftDate(isoString, deltaDays) {
  const [year, month, day] = isoString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + deltaDays);
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}


export default function Attendance() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const room = useClassroom();

  const today = todayISO();
  const [date, setDate] = useState(today);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [notice, setNotice] = useState(null);
  const [sending, setSending] = useState(false);

  const isToday = date === today;

  // Attendance is taken one batch at a time, in the order the batches meet.
  // A student in two batches (say Science and Maths) is marked in each separately.
  const groups = room.classes.flatMap((item) => {
    const sects = item.sections?.length ? item.sections : [''];
    return sects.map((section) => {
      const timing = item.timings?.[section] || {};
      return {
        id: batchKey(item.name, section),
        className: item.name,
        section,
        timing,
        // Short enough for the picker on a phone, e.g. "10A · Science · 9:30 AM".
        label: [`${item.name.replace(/^Class\s*/i, '')}${section}`, timing.subject, describeTime({ start: timing.start })].filter(Boolean).join(' · '),
      };
    });
  }).sort((a, b) => (a.timing.start || '99').localeCompare(b.timing.start || '99') || a.label.localeCompare(b.label));
  const activeGroup = groups.find((g) => g.id === selectedGroup) || groups[0] || { id: '', className: '', section: '', timing: {} };

  // This batch's marks for the day. Days marked before batch-wise attendance fall back to the old single mark.
  const batchMarks = room.batchAttendance?.[date]?.[activeGroup.id];
  const marks = batchMarks || room.legacyAttendance?.[date] || {};

  // Students in the chosen batch, A to Z.
  const students = room.students
    .filter((s) => inBatch(s, activeGroup.className, activeGroup.section))
    .sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));

  const absent = students.filter((s) => marks[s.id] === 'A');
  const present = students.filter((s) => marks[s.id] === 'P');

  // Today everyone starts Present; tap a name to mark that student Absent.
  const unmarkedKey = students.filter((s) => !marks[s.id]).map((s) => s.id).join(',');
  useEffect(() => {
    if (!isToday || !unmarkedKey) return;
    room.markBatch(date, activeGroup.className, activeGroup.section, unmarkedKey.split(','), 'P');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isToday, date, unmarkedKey, activeGroup.id]);

  const toggle = (student) => {
    // Copy any older day-level marks into this batch first, so the rest of the roll is kept.
    const others = students.filter((s) => s.id !== student.id && marks[s.id]);
    if (!batchMarks) others.forEach((s) => room.markBatch(date, activeGroup.className, activeGroup.section, [s.id], marks[s.id]));
    room.markBatch(date, activeGroup.className, activeGroup.section, [student.id], marks[student.id] === 'A' ? 'P' : 'A');
  };

  const goTo = (next) => { setDate(next); setNotice(null); };

  const notifyParents = async () => {
    const withPhone = absent.filter((s) => (s.phone || '').replace(/\D/g, '').length >= 10);
    if (!withPhone.length) {
      setNotice('No absent student has a phone number.');
      return;
    }
    setSending(true);
    setNotice(null);
    try {
      const response = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ date, subject: activeGroup.timing.subject || '', students: withPhone.map((s) => ({ name: s.name, phone: s.phone })) }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.configured === false) {
        setNotice(result.error ? `WhatsApp failed: ${result.error}` : 'WhatsApp is not set up yet.');
        return;
      }
      const sent = result.sent || [];
      const failed = result.failed || [];
      setNotice(sent.length
        ? `Message sent to ${sent.length} parent${sent.length > 1 ? 's' : ''}.${failed.length ? ` ${failed.length} failed.` : ''}`
        : 'No message could be sent.');
    } catch {
      setNotice('WhatsApp is not available right now.');
    } finally {
      setSending(false);
    }
  };

  const [query, setQuery] = useState('');

  // A student's mark in a batch on a day: the batch mark, else the older day-level mark.
  const markOn = (day, key, id) => {
    const byBatch = room.batchAttendance?.[day]?.[key];
    return byBatch ? byBatch[id] : room.legacyAttendance?.[day]?.[id];
  };
  // The last six days this batch met, up to the chosen day.
  const weekdayOf = (day) => new Date(`${day}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short' });
  const meets = (day) => !(activeGroup.timing.days || []).length || activeGroup.timing.days.includes(weekdayOf(day));
  const sessions = Array.from({ length: 14 }, (_, i) => shiftDate(date, i - 13)).filter(meets).slice(-6);
  const monthAgo = shiftDate(date, -30);
  const allDays = [...new Set([...Object.keys(room.batchAttendance || {}), ...Object.keys(room.legacyAttendance || {})])];
  // Present share for one student in this batch over the 30 days before the chosen day.
  const rateOf = (id) => {
    let total = 0;
    let here = 0;
    allDays.forEach((day) => {
      if (day < monthAgo || day > date) return;
      const m = markOn(day, activeGroup.id, id);
      if (!m) return;
      total += 1;
      if (m === 'P') here += 1;
    });
    return total ? Math.round((here / total) * 100) : null;
  };
  const absentIn = (g) => room.students.filter((s) => inBatch(s, g.className, g.section) && markOn(date, g.id, s.id) === 'A').length;
  const shortName = (g) => `${g.className.replace(/^Class\s*/i, '')}${g.section}`;
  const term = query.trim().toLowerCase();
  const shown = term ? students.filter((s) => s.name.toLowerCase().includes(term)) : students;
  const allPresent = () => room.markBatch(date, activeGroup.className, activeGroup.section, students.map((s) => s.id), 'P');
  const setStatus = (student, status) => { if (marks[student.id] !== status) toggle(student); };
  const pickBatch = (id) => { setSelectedGroup(id); setNotice(null); setQuery(''); };

  const notifyButton = (full) => (
    <button
      type="button"
      onClick={notifyParents}
      disabled={sending || !absent.length}
      className={`${full ? 'w-full h-12 shadow-lg' : 'h-10 px-4 text-sm'} rounded-xl bg-[#005a9c] hover:bg-[#1b365d] text-white font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-40 whitespace-nowrap`}
    >
      <Send className="w-4 h-4" />
      {sending ? 'Sending…' : absent.length ? `Tell ${absent.length} absent parent${absent.length === 1 ? '' : 's'}` : 'No absent students'}
    </button>
  );

  return (
    <div className="min-h-dvh app-canvas">
      <AppHeader nav onSignOut={async () => { await signOut(); navigate('/login'); }} />

      <main className="max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-8 pb-28 lg:pb-12">
        <div className="flex items-center justify-between gap-3 mb-4 lg:mb-5">
          <h1 className="text-2xl font-medium tracking-tight text-neutral-900">Attendance</h1>
          <div className="flex items-center gap-1 lg:rounded-xl lg:bg-white lg:shadow-card lg:p-1">
            <button type="button" onClick={() => goTo(shiftDate(date, -1))} className="h-10 w-10 lg:h-9 lg:w-9 grid place-items-center rounded-lg text-neutral-600 hover:bg-neutral-100" aria-label="Previous day">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button type="button" onClick={() => goTo(today)} className="min-w-24 lg:min-w-40 h-10 lg:h-9 px-2 rounded-lg text-sm font-semibold text-neutral-900 hover:bg-neutral-100" title="Go to today">
              {isToday ? <><span>Today</span><span className="hidden lg:inline font-normal text-neutral-500"> · {formatDisplayDate(date)}</span></> : formatDisplayDate(date)}
            </button>
            <button type="button" onClick={() => goTo(shiftDate(date, 1))} disabled={isToday} className="h-10 w-10 lg:h-9 lg:w-9 grid place-items-center rounded-lg text-neutral-600 hover:bg-neutral-100 disabled:opacity-30" aria-label="Next day">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {room.students.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center shadow-card">
            <Users className="w-10 h-10 mx-auto text-neutral-300" />
            <p className="mt-3 text-sm text-neutral-500">Add students to take attendance.</p>
            <Link to="/students" className="mt-4 inline-flex h-11 items-center px-5 rounded-xl bg-[#005a9c] text-white text-sm font-semibold">
              Add students
            </Link>
          </div>
        ) : (
          <>
            {/* Batch tabs, in the order they meet. Scrolls sideways on a phone. */}
            <div role="tablist" aria-label="Batches" className="mb-4 -mx-4 px-4 sm:mx-0 sm:px-0 flex gap-2 overflow-x-auto pb-1">
              {groups.map((g) => {
                const on = g.id === activeGroup.id;
                const count = room.students.filter((s) => inBatch(s, g.className, g.section)).length;
                const away = absentIn(g);
                return (
                  <button key={g.id} type="button" role="tab" aria-selected={on} onClick={() => pickBatch(g.id)}
                    className={`shrink-0 min-w-36 lg:min-w-44 text-left rounded-2xl px-3.5 py-2.5 transition-colors ${on ? 'bg-[#005a9c] text-white shadow-sm' : 'bg-white text-neutral-900 shadow-card hover:bg-neutral-50'}`}>
                    <span className="flex items-center justify-between gap-3">
                      <span className="text-sm font-bold whitespace-nowrap">
                        {shortName(g)}
                        {g.timing.subject && <span className={`font-medium ${on ? 'text-white/85' : 'text-neutral-600'}`}> · {g.timing.subject}</span>}
                      </span>
                      <span className={`rounded-full px-1.5 text-[11px] font-semibold tabular-nums ${on ? 'bg-white/20' : 'bg-neutral-100 text-neutral-600'}`}>{count}</span>
                    </span>
                    <span className={`mt-0.5 flex items-center justify-between gap-2 text-xs whitespace-nowrap ${on ? 'text-white/75' : 'text-neutral-500'}`}>
                      <span>{[describeTime(g.timing), g.timing.room].filter(Boolean).join(' · ') || 'No time set'}</span>
                      {away > 0 && <span className={`hidden lg:inline font-semibold ${on ? 'text-white' : 'text-rose-600'}`}>{away} absent</span>}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* ───────── Phone: tap grid (unchanged) ───────── */}
            <div className="lg:hidden">
              <p className="mb-3 text-sm text-neutral-600">
                <strong className="font-semibold text-neutral-900">{present.length}</strong> present
                {' · '}
                <strong className={`font-semibold ${absent.length ? 'text-rose-600' : 'text-neutral-900'}`}>{absent.length}</strong> absent
                <span className="text-neutral-400"> · tap a name to mark absent</span>
              </p>
              {students.length === 0 ? (
                <p className="py-12 text-center text-sm text-neutral-500">No students in this batch.</p>
              ) : (
                <ul className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {students.map((student, index) => {
                    const status = marks[student.id];
                    return (
                      <li key={student.id}>
                        <button type="button" onClick={() => toggle(student)} aria-pressed={status === 'A'}
                          className={`w-full h-16 px-2 rounded-2xl text-sm font-semibold leading-tight text-left break-words flex items-center gap-1.5 transition-colors active:scale-95 ${
                            status === 'A' ? 'bg-rose-600 text-white shadow-sm' : status === 'P' ? 'bg-white text-neutral-900 shadow-card' : 'bg-neutral-100 text-neutral-400'
                          }`}
                          title={status === 'A' ? 'Absent. Tap to mark present.' : 'Tap to mark absent.'}>
                          <span className={`shrink-0 text-xs tabular-nums ${status === 'A' ? 'text-white/80' : 'text-neutral-400'}`}>{index + 1}.</span>
                          <span className="min-w-0 line-clamp-2">{student.name}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* ───────── Desktop: one simple attendance sheet ───────── */}
            <section className="hidden lg:block bg-white rounded-3xl shadow-card overflow-hidden">
              <div className="flex items-center justify-between gap-6 px-6 py-5">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-neutral-900 truncate">
                    {activeGroup.className}{activeGroup.section ? ` · Batch ${activeGroup.section}` : ''}
                    {activeGroup.timing.subject && <span className="font-normal text-neutral-500"> · {activeGroup.timing.subject}</span>}
                  </h2>
                  <p className="mt-0.5 text-sm text-neutral-500">
                    {[describeTime(activeGroup.timing), describeDays(activeGroup.timing.days || []), activeGroup.timing.room].filter(Boolean).join(' · ') || 'No time set'}
                  </p>
                </div>
                <div className="flex items-center gap-5 shrink-0">
                  <div className="flex items-center gap-5 text-sm">
                    <span><span className="text-2xl font-semibold tabular-nums text-neutral-900">{present.length}</span> <span className="text-neutral-500">present</span></span>
                    <span className="h-8 w-px bg-neutral-200" />
                    <span><span className={`text-2xl font-semibold tabular-nums ${absent.length ? 'text-rose-600' : 'text-neutral-900'}`}>{absent.length}</span> <span className="text-neutral-500">absent</span></span>
                  </div>
                  {notifyButton(false)}
                </div>
              </div>

              {notice && (
                <div className="mx-6 mb-4 flex items-center justify-between gap-3 rounded-xl bg-neutral-900 text-white text-sm px-4 py-2.5">
                  <span>{notice}</span>
                  <button type="button" onClick={() => setNotice(null)} aria-label="Close" className="shrink-0"><X className="w-4 h-4" /></button>
                </div>
              )}

              <div className="flex items-center gap-3 px-6 py-3 border-y border-neutral-100 bg-neutral-50/60">
                <div className="relative w-72">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search student" aria-label="Search student"
                    className="w-full h-9 pl-9 pr-3 text-sm bg-white rounded-lg ring-1 ring-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-400" />
                </div>
                <p className="text-xs text-neutral-500">Everyone starts present. Switch a student to Absent.</p>
                <button type="button" onClick={allPresent} disabled={!absent.length && present.length === students.length}
                  className="ml-auto h-9 px-3 rounded-lg text-sm font-medium text-neutral-700 hover:bg-white hover:shadow-sm inline-flex items-center gap-1.5 disabled:opacity-40">
                  <CheckCheck className="w-4 h-4" /> Mark all present
                </button>
              </div>

              {students.length === 0 ? (
                <p className="py-16 text-center text-sm text-neutral-500">No students in this batch.</p>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                      <th className="pl-6 pr-3 py-3 w-12">#</th>
                      <th className="px-3 py-3">Student</th>
                      <th className="px-3 py-3">Last {sessions.length} classes</th>
                      <th className="px-3 py-3">30-day rate</th>
                      <th className="pl-3 pr-6 py-3 text-right">Today</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {shown.length === 0 && (
                      <tr><td colSpan={5} className="py-10 text-center text-sm text-neutral-500">No student matches.</td></tr>
                    )}
                    {shown.map((student) => {
                      const status = marks[student.id];
                      const rate = rateOf(student.id);
                      const others = studentBatchDetails(student, room.classes).filter((b) => b.section !== activeGroup.section);
                      return (
                        <tr key={student.id} className={status === 'A' ? 'bg-rose-50/50' : 'hover:bg-neutral-50/60'}>
                          <td className="pl-6 pr-3 py-3 text-sm tabular-nums text-neutral-400">{students.indexOf(student) + 1}</td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className={`h-9 w-9 shrink-0 rounded-full grid place-items-center text-xs font-bold ${status === 'A' ? 'bg-rose-100 text-rose-700' : 'bg-[#eef6fc] text-[#005a9c]'}`}>{initialsOf(student.name)}</span>
                              <div className="min-w-0">
                                <p className="font-medium text-neutral-900 truncate">{student.name}</p>
                                <p className="text-xs text-neutral-500 truncate">
                                  {others.length ? `Also ${others.map((b) => [b.section, b.subject].filter(Boolean).join(' · ')).join(', ')}` : student.phone || 'No parent number'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <span className="inline-flex items-center gap-1.5">
                              {sessions.map((day) => {
                                const m = markOn(day, activeGroup.id, student.id);
                                return (
                                  <span key={day} title={`${formatDisplayDate(day)}: ${m === 'P' ? 'present' : m === 'A' ? 'absent' : 'not marked'}`}
                                    className={`h-2.5 w-2.5 rounded-full ${m === 'P' ? 'bg-[#17784a]' : m === 'A' ? 'bg-rose-500' : 'bg-neutral-200'}`} />
                                );
                              })}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-sm">
                            {rate == null ? <span className="text-neutral-400">—</span> : (
                              <span className={`font-medium tabular-nums ${rate < 75 ? 'text-rose-600' : 'text-neutral-900'}`}>{rate}%</span>
                            )}
                          </td>
                          <td className="pl-3 pr-6 py-2.5 text-right">
                            <div role="radiogroup" aria-label={`${student.name} today`} className="inline-flex rounded-lg bg-neutral-100 p-0.5">
                              <button type="button" role="radio" aria-checked={status === 'P'} onClick={() => setStatus(student, 'P')}
                                className={`h-8 px-3.5 rounded-md text-sm font-medium transition-colors ${status === 'P' ? 'bg-white text-[#17653a] shadow-sm' : 'text-neutral-500 hover:text-neutral-800'}`}>
                                Present
                              </button>
                              <button type="button" role="radio" aria-checked={status === 'A'} onClick={() => setStatus(student, 'A')}
                                className={`h-8 px-3.5 rounded-md text-sm font-medium transition-colors ${status === 'A' ? 'bg-rose-600 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-800'}`}>
                                Absent
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </section>
          </>
        )}
      </main>

      {/* Phone: send bar at the bottom */}
      {(absent.length > 0 || notice) && (
        <div className="lg:hidden no-print fixed inset-x-0 md:left-[15.5rem] bottom-0 z-20 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-gradient-to-t from-[#f4f4f5] to-transparent">
          <div className="max-w-5xl mx-auto space-y-2">
            {notice && (
              <div className="flex items-center justify-between gap-3 rounded-xl bg-neutral-900 text-white text-sm px-4 py-3">
                <span>{notice}</span>
                <button type="button" onClick={() => setNotice(null)} aria-label="Close" className="shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            {absent.length > 0 && notifyButton(true)}
          </div>
        </div>
      )}
    </div>
  );
}
