import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Check,
  X,
  Users,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  RotateCcw,
  Send,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Table2,
  LayoutList,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppHeader } from '../components/AppHeader';
import { useClassroom, todayISO } from '../services/classroom';

export { StudentForm, PdfImport } from './Students';

const field = 'w-full h-10 px-3 text-sm bg-white rounded-xl ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-400 placeholder:text-slate-400';

function formatDisplayDate(isoString) {
  if (!isoString) return '';
  const [year, month, day] = isoString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function shiftDate(isoString, deltaDays) {
  const [year, month, day] = isoString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + deltaDays);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getLastNDays(endDateIso, n = 7) {
  const dates = [];
  for (let i = n - 1; i >= 0; i--) {
    dates.push(shiftDate(endDateIso, -i));
  }
  return dates;
}

export default function Attendance() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const room = useClassroom();

  const today = todayISO();
  const [date, setDate] = useState(today);
  const [viewMode, setViewMode] = useState('daily'); // 'daily' | 'register'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'P' | 'A' | 'unmarked'
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [notice, setNotice] = useState(null); // { type: 'success' | 'info' | 'error', message: string }
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);

  const marks = room.attendance[date] || {};

  // Build group options from room.classes
  const groups = [
    { id: 'all', label: 'All Classes', className: 'all', section: '' },
    ...room.classes.flatMap((item) => {
      const sects = item.sections?.length ? item.sections : [''];
      return sects.map((section) => ({
        id: `${item.name}||${section}`,
        className: item.name,
        section,
        label: section ? `${item.name} (${section})` : item.name,
      }));
    }),
  ];

  const activeGroup = groups.find((item) => item.id === selectedGroup) || groups[0];

  // Students in selected class/batch
  const inScopeStudents = room.students.filter((student) => {
    if (activeGroup.id === 'all') return true;
    if (student.className !== activeGroup.className) return false;
    if ((student.section || '') === (activeGroup.section || '')) return true;
    return !student.section && !activeGroup.section;
  });

  // Calculate statistics for the active day and scope
  const presentStudents = inScopeStudents.filter((s) => marks[s.id] === 'P');
  const absentStudents = inScopeStudents.filter((s) => marks[s.id] === 'A');
  const unmarkedStudents = inScopeStudents.filter((s) => !marks[s.id]);

  const totalCount = inScopeStudents.length;
  const presentCount = presentStudents.length;
  const absentCount = absentStudents.length;
  const unmarkedCount = unmarkedStudents.length;
  const attendanceRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  // Filter students by search and status for the roll call view
  const searchTerm = searchQuery.trim().toLowerCase();
  const displayedStudents = inScopeStudents.filter((student) => {
    const status = marks[student.id];
    if (statusFilter === 'P' && status !== 'P') return false;
    if (statusFilter === 'A' && status !== 'A') return false;
    if (statusFilter === 'unmarked' && status) return false;

    if (!searchTerm) return true;
    return [student.name, student.className, student.section, student.phone]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(searchTerm);
  });

  // Calculate overall historical attendance for a student
  const studentStats = (id) => {
    let total = 0;
    let present = 0;
    for (const day of Object.values(room.attendance)) {
      if (day[id]) {
        total += 1;
        if (day[id] === 'P') present += 1;
      }
    }
    const pct = total ? Math.round((present / total) * 100) : null;
    return { pct, total, present };
  };

  // Automated WhatsApp broadcast for absent students
  const notifyAbsentParents = async (targetStudents = absentStudents) => {
    const studentsWithPhone = targetStudents.filter((s) => (s.phone || '').trim().length >= 10);
    const studentsMissingPhone = targetStudents.filter((s) => !(s.phone || '').trim().length >= 10);

    if (!studentsWithPhone.length) {
      setNotice({
        type: 'info',
        message: 'No absent students have a valid phone number. Add phone numbers in the Students tab.',
      });
      return;
    }

    setSendingWhatsApp(true);
    setNotice({
      type: 'info',
      message: `Sending WhatsApp absence notifications to ${studentsWithPhone.length} parent(s)…`,
    });

    try {
      const response = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          students: studentsWithPhone.map((s) => ({ name: s.name, phone: s.phone })),
        }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok && result.error) {
        setNotice({
          type: 'error',
          message: `WhatsApp notification failed: ${result.error}`,
        });
        return;
      }

      if (result.configured === false) {
        setNotice({
          type: 'info',
          message: 'Direct WhatsApp links are ready below! (Twilio credentials not configured in server env).',
        });
        return;
      }

      const sent = result.sent || [];
      const failed = result.failed || [];
      const msgParts = [];
      if (sent.length) msgParts.push(`WhatsApp delivered to ${sent.join(', ')}`);
      if (failed.length) msgParts.push(`${failed.map((f) => `${f.name}: ${f.error}`).join('; ')}`);
      if (studentsMissingPhone.length) {
        msgParts.push(`Missing number for ${studentsMissingPhone.map((s) => s.name).join(', ')}`);
      }

      setNotice({
        type: failed.length && !sent.length ? 'error' : 'success',
        message: msgParts.join('. ') || 'Absence alerts processed.',
      });
    } catch {
      setNotice({
        type: 'error',
        message: 'Could not contact WhatsApp service. Please use individual WhatsApp links below.',
      });
    } finally {
      setSendingWhatsApp(false);
    }
  };

  // Pre-filled WhatsApp message URL generator
  const getWhatsAppLink = (student) => {
    const phone = (student.phone || '').replace(/[^\d]/g, '').slice(-10);
    if (!phone) return null;
    const instituteName = room.profile?.name || 'EduBuddy Institute';
    const message = encodeURIComponent(
      `Dear Parent,\n\nThis is to notify that *${student.name}* was marked *ABSENT* on *${formatDisplayDate(date)}* at ${instituteName}.\n\nIf you have any queries or if this is an error, please contact us.`
    );
    return `https://wa.me/91${phone}?text=${message}`;
  };

  const isToday = date === today;
  const last7Days = getLastNDays(date, 7);

  return (
    <div className="min-h-dvh bg-slate-50">
      <AppHeader
        nav
        width="max-w-5xl"
        onSignOut={async () => {
          await signOut();
          navigate('/login');
        }}
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-5 sm:pt-8 pb-14">
        {/* Page Title & Navigation Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Attendance
              </h1>
              {isToday && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Today
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
              Track daily presence, view weekly registers, and notify parents on WhatsApp.
            </p>
          </div>

          {/* View Mode Toggle (Daily vs Weekly Matrix) */}
          <div className="flex items-center gap-2">
            <div className="inline-flex p-1 bg-white ring-1 ring-slate-200 rounded-xl shadow-xs">
              <button
                type="button"
                onClick={() => setViewMode('daily')}
                className={`h-8 px-3 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${
                  viewMode === 'daily'
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
                Daily Roll Call
              </button>
              <button
                type="button"
                onClick={() => setViewMode('register')}
                className={`h-8 px-3 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${
                  viewMode === 'register'
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Table2 className="w-3.5 h-3.5" />
                Weekly Register
              </button>
            </div>

            <Link
              to="/students"
              className="hidden sm:inline-flex items-center gap-1 h-9 px-3 rounded-xl ring-1 ring-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            >
              <Users className="w-3.5 h-3.5 text-slate-400" />
              Manage Students
            </Link>
          </div>
        </div>

        {/* Date Selector Banner */}
        <section className="mb-6 bg-white rounded-2xl ring-1 ring-slate-200/70 p-4 shadow-card flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setDate((d) => shiftDate(d, -1));
                setNotice(null);
              }}
              className="h-9 w-9 grid place-items-center rounded-xl ring-1 ring-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="relative flex items-center">
              <Calendar className="pointer-events-none absolute left-3 w-4 h-4 text-brand-600" />
              <input
                type="date"
                value={date}
                max={today}
                onChange={(e) => {
                  setDate(e.target.value || today);
                  setNotice(null);
                }}
                className="h-9 pl-9 pr-3 rounded-xl ring-1 ring-slate-200 text-xs sm:text-sm font-medium text-slate-800 bg-slate-50/50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setDate((d) => shiftDate(d, 1));
                setNotice(null);
              }}
              disabled={date >= today}
              className="h-9 w-9 grid place-items-center rounded-xl ring-1 ring-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {!isToday && (
              <button
                type="button"
                onClick={() => {
                  setDate(today);
                  setNotice(null);
                }}
                className="h-9 px-3 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-semibold transition-colors"
              >
                Jump to Today
              </button>
            )}
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block font-medium">Selected Date</span>
            <span className="text-sm font-semibold text-slate-900">
              {formatDisplayDate(date)}
            </span>
          </div>
        </section>

        {/* Empty State when no students exist */}
        {room.students.length === 0 ? (
          <div className="bg-white rounded-2xl ring-1 ring-slate-200/70 p-12 text-center shadow-card">
            <Users className="w-12 h-12 mx-auto text-slate-300" />
            <h2 className="mt-4 text-base font-semibold text-slate-900">No students enrolled yet</h2>
            <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
              Please add your students first to take attendance, mark batches, and track presence.
            </p>
            <Link
              to="/students"
              className="mt-5 inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 shadow-sm transition-colors"
            >
              <Users className="w-4 h-4" /> Go to Students
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPI Cards & Progress Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {/* Total Students Card */}
              <div className="bg-white rounded-2xl ring-1 ring-slate-200/70 p-4 shadow-card">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Total Enrolled</span>
                  <div className="h-7 w-7 rounded-lg bg-slate-100 text-slate-600 grid place-items-center">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-bold text-slate-900">{totalCount}</div>
                <div className="mt-0.5 text-[11px] text-slate-400">In selected scope</div>
              </div>

              {/* Present Students Card */}
              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'P' ? 'all' : 'P')}
                className={`text-left rounded-2xl ring-1 p-4 shadow-card transition-all ${
                  statusFilter === 'P'
                    ? 'bg-emerald-50/90 ring-emerald-300 shadow-md'
                    : 'bg-white ring-slate-200/70 hover:ring-emerald-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-emerald-700">Present</span>
                  <div className="h-7 w-7 rounded-lg bg-emerald-100 text-emerald-700 grid place-items-center">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-bold text-emerald-700">
                  {presentCount}{' '}
                  <span className="text-xs font-semibold text-emerald-600">
                    ({totalCount ? Math.round((presentCount / totalCount) * 100) : 0}%)
                  </span>
                </div>
                <div className="mt-0.5 text-[11px] text-emerald-600/80">Click to filter present</div>
              </button>

              {/* Absent Students Card */}
              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'A' ? 'all' : 'A')}
                className={`text-left rounded-2xl ring-1 p-4 shadow-card transition-all ${
                  statusFilter === 'A'
                    ? 'bg-rose-50/90 ring-rose-300 shadow-md'
                    : 'bg-white ring-slate-200/70 hover:ring-rose-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-rose-700">Absent</span>
                  <div className="h-7 w-7 rounded-lg bg-rose-100 text-rose-700 grid place-items-center">
                    <XCircle className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-bold text-rose-700">
                  {absentCount}{' '}
                  <span className="text-xs font-semibold text-rose-600">
                    ({totalCount ? Math.round((absentCount / totalCount) * 100) : 0}%)
                  </span>
                </div>
                <div className="mt-0.5 text-[11px] text-rose-600/80">Click to filter absent</div>
              </button>

              {/* Unmarked / Remaining Card */}
              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'unmarked' ? 'all' : 'unmarked')}
                className={`text-left rounded-2xl ring-1 p-4 shadow-card transition-all ${
                  statusFilter === 'unmarked'
                    ? 'bg-amber-50/90 ring-amber-300 shadow-md'
                    : 'bg-white ring-slate-200/70 hover:ring-amber-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-amber-700">Unmarked</span>
                  <div className="h-7 w-7 rounded-lg bg-amber-100 text-amber-700 grid place-items-center">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-bold text-amber-700">
                  {unmarkedCount}
                </div>
                <div className="mt-0.5 text-[11px] text-amber-600/80">Pending confirmation</div>
              </button>
            </div>

            {/* Attendance Percentage Progress Bar */}
            <div className="bg-white rounded-2xl ring-1 ring-slate-200/70 p-4 shadow-card">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                  Daily Attendance Progress
                </span>
                <span className="font-mono font-medium text-slate-600">
                  {presentCount} / {totalCount} students ({attendanceRate}%)
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden flex" aria-hidden="true">
                <div
                  className="bg-emerald-500 transition-all duration-300"
                  style={{ width: `${totalCount ? (presentCount / totalCount) * 100 : 0}%` }}
                  title={`Present: ${presentCount}`}
                />
                <div
                  className="bg-rose-500 transition-all duration-300"
                  style={{ width: `${totalCount ? (absentCount / totalCount) * 100 : 0}%` }}
                  title={`Absent: ${absentCount}`}
                />
              </div>
              <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> {presentCount} Present
                  </span>
                  <span className="inline-flex items-center gap-1 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-rose-500" /> {absentCount} Absent
                  </span>
                  <span className="inline-flex items-center gap-1 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-slate-200" /> {unmarkedCount} Unmarked
                  </span>
                </div>
                <span>Target: 85%+</span>
              </div>
            </div>

            {/* Notice / Feedback Banner */}
            {notice && (
              <div
                className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 text-xs sm:text-sm animate-fade-up ${
                  notice.type === 'error'
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : notice.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-blue-50 border-blue-200 text-blue-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  {notice.type === 'error' ? (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  ) : notice.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  ) : (
                    <MessageCircle className="w-4 h-4 shrink-0 text-blue-600" />
                  )}
                  <span>{notice.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setNotice(null)}
                  className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Class / Batch Filters Bar */}
            <div className="bg-white rounded-2xl ring-1 ring-slate-200/70 p-4 shadow-card space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Select Class / Batch
                </span>
                <Link
                  to="/classes"
                  className="text-xs font-medium text-brand-700 hover:underline"
                >
                  + Manage Classes
                </Link>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1" role="radiogroup" aria-label="Select Class and Batch">
                {groups.map((item) => {
                  const count = room.students.filter((s) => {
                    if (item.id === 'all') return true;
                    if (s.className !== item.className) return false;
                    if ((s.section || '') === (item.section || '')) return true;
                    return !s.section && !item.section;
                  }).length;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="radio"
                      aria-checked={selectedGroup === item.id}
                      onClick={() => {
                        setSelectedGroup(item.id);
                        setNotice(null);
                      }}
                      className={`h-8 shrink-0 px-3.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                        selectedGroup === item.id
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {item.label}
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          selectedGroup === item.id ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Controls Bar: Bulk Actions & Search */}
            <div className="bg-white rounded-2xl ring-1 ring-slate-200/70 p-4 shadow-card flex flex-wrap items-center justify-between gap-3">
              {/* Bulk Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    room.markAll(date, inScopeStudents.map((s) => s.id), 'P');
                    setNotice({ type: 'success', message: `Marked all ${inScopeStudents.length} students Present.` });
                  }}
                  className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  Mark All Present
                </button>

                <button
                  type="button"
                  onClick={() => {
                    room.markAll(date, inScopeStudents.map((s) => s.id), 'A');
                    setNotice({ type: 'info', message: `Marked all ${inScopeStudents.length} students Absent.` });
                  }}
                  className="h-9 px-3.5 rounded-xl ring-1 ring-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Mark All Absent
                </button>

                <button
                  type="button"
                  onClick={() => {
                    room.markAll(date, inScopeStudents.map((s) => s.id), null);
                    setNotice({ type: 'info', message: 'Reset all attendance marks for this day.' });
                  }}
                  className="h-9 px-3 rounded-xl ring-1 ring-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium inline-flex items-center gap-1 transition-colors"
                  title="Clear marks for this class"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  Reset
                </button>

                {absentCount > 0 && (
                  <button
                    type="button"
                    disabled={sendingWhatsApp}
                    onClick={() => notifyAbsentParents(absentStudents)}
                    className="h-9 px-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 ring-1 ring-emerald-300 text-emerald-800 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Notify {absentCount} Absent Parent{absentCount > 1 ? 's' : ''}
                  </button>
                )}
              </div>

              {/* Instant Search Box */}
              <div className="relative min-w-[220px] flex-1 sm:flex-initial">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search student or phone…"
                  aria-label="Search students"
                  className={`${field} pl-9`}
                />
              </div>
            </div>

            {/* VIEW 1: DAILY ROLL CALL LIST / CARDS */}
            {viewMode === 'daily' && (
              <div className="bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-card overflow-hidden">
                {/* Header row */}
                <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <span>Student & History</span>
                  <div className="flex items-center gap-2">
                    {statusFilter !== 'all' && (
                      <button
                        type="button"
                        onClick={() => setStatusFilter('all')}
                        className="normal-case font-medium text-brand-700 hover:underline"
                      >
                        Clear filter ({statusFilter})
                      </button>
                    )}
                    <span>Mark Status</span>
                  </div>
                </div>

                {displayedStudents.length === 0 ? (
                  <div className="py-12 text-center text-sm text-slate-500">
                    {searchTerm
                      ? `No students found matching "${searchTerm}".`
                      : statusFilter !== 'all'
                      ? `No students currently marked "${statusFilter}".`
                      : 'No students in this class or batch.'}
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {displayedStudents.map((student) => {
                      const status = marks[student.id]; // 'P' | 'A' | undefined
                      const initial = student.name.trim().charAt(0).toUpperCase() || '?';
                      const stats = studentStats(student.id);
                      const waLink = getWhatsAppLink(student);

                      return (
                        <li
                          key={student.id}
                          className={`p-3.5 sm:px-4 sm:py-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 transition-colors ${
                            status === 'P'
                              ? 'bg-emerald-50/40'
                              : status === 'A'
                              ? 'bg-rose-50/40'
                              : 'hover:bg-slate-50/70'
                          }`}
                        >
                          {/* Student Details */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span
                              className={`h-10 w-10 shrink-0 rounded-full font-bold grid place-items-center text-xs transition-colors ${
                                status === 'P'
                                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-200'
                                  : status === 'A'
                                  ? 'bg-rose-600 text-white ring-2 ring-rose-200'
                                  : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
                              }`}
                            >
                              {initial}
                            </span>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-900 text-sm truncate">
                                  {student.name}
                                </span>
                                {student.section && (
                                  <span className="px-2 py-0.2 rounded-full text-[10px] font-medium bg-brand-50 text-brand-700 border border-brand-100">
                                    {student.section}
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-500">
                                <span>{student.className || 'No class'}</span>
                                {stats.pct !== null && (
                                  <>
                                    <span>·</span>
                                    <span
                                      className={`font-medium ${
                                        stats.pct >= 75
                                          ? 'text-emerald-700'
                                          : stats.pct >= 50
                                          ? 'text-amber-700'
                                          : 'text-rose-700'
                                      }`}
                                    >
                                      {stats.pct}% rate ({stats.present}/{stats.total}d)
                                    </span>
                                  </>
                                )}
                                {student.phone && (
                                  <>
                                    <span>·</span>
                                    <span className="font-mono text-slate-600">{student.phone}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons: Present, Absent, Reset, and WhatsApp */}
                          <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
                            {/* WhatsApp alert shortcut if absent */}
                            {status === 'A' && waLink && (
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-8 px-2.5 rounded-lg text-emerald-700 bg-emerald-100/70 hover:bg-emerald-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                                title={`Send WhatsApp message to ${student.name}'s parent`}
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">WhatsApp Parent</span>
                              </a>
                            )}

                            {/* Present Toggle */}
                            <button
                              type="button"
                              onClick={() => room.markAttendance(date, student.id, 'P')}
                              className={`h-9 px-3.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all ${
                                status === 'P'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:text-emerald-700 hover:ring-emerald-300'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                              Present
                            </button>

                            {/* Absent Toggle */}
                            <button
                              type="button"
                              onClick={() => room.markAttendance(date, student.id, 'A')}
                              className={`h-9 px-3.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all ${
                                status === 'A'
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:text-rose-700 hover:ring-rose-300'
                              }`}
                            >
                              <X className="w-3.5 h-3.5" />
                              Absent
                            </button>

                            {/* Reset / Clear Toggle */}
                            {status && (
                              <button
                                type="button"
                                onClick={() => room.markAttendance(date, student.id, null)}
                                className="h-9 w-9 grid place-items-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                                title="Clear mark"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}

            {/* VIEW 2: WEEKLY REGISTER MATRIX (Haziri Register) */}
            {viewMode === 'register' && (
              <div className="bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-card overflow-hidden">
                <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Weekly Register Matrix
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      7-day attendance register ending on {formatDisplayDate(date)}.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded bg-emerald-500 text-white text-[9px] font-bold grid place-items-center">P</span>
                      Present
                    </span>
                    <span className="inline-flex items-center gap-1 ml-2">
                      <span className="w-2.5 h-2.5 rounded bg-rose-500 text-white text-[9px] font-bold grid place-items-center">A</span>
                      Absent
                    </span>
                    <span className="inline-flex items-center gap-1 ml-2">
                      <span className="w-2.5 h-2.5 rounded bg-slate-200 text-slate-500 text-[9px] font-bold grid place-items-center">-</span>
                      Unmarked
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                        <th className="py-3 px-4 sticky left-0 bg-slate-50 z-10">Student</th>
                        <th className="py-3 px-2">Batch</th>
                        {last7Days.map((dayIso) => {
                          const isCur = dayIso === date;
                          return (
                            <th
                              key={dayIso}
                              className={`py-3 px-2 text-center whitespace-nowrap ${
                                isCur ? 'bg-brand-50/80 text-brand-800 font-bold' : ''
                              }`}
                            >
                              <div>{formatDisplayDate(dayIso).split(',')[0]}</div>
                              <div className="text-[10px] text-slate-400">
                                {dayIso.slice(8, 10)} {dayIso.slice(5, 7)}
                              </div>
                            </th>
                          );
                        })}
                        <th className="py-3 px-3 text-right">Attendance %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {displayedStudents.map((student) => {
                        const stats = studentStats(student.id);

                        return (
                          <tr key={student.id} className="hover:bg-slate-50/70">
                            {/* Student Name */}
                            <td className="py-2.5 px-4 font-semibold text-slate-900 whitespace-nowrap sticky left-0 bg-white">
                              {student.name}
                            </td>

                            {/* Batch */}
                            <td className="py-2.5 px-2 text-slate-500 whitespace-nowrap">
                              {student.section || '-'}
                            </td>

                            {/* Daily status cells for last 7 days */}
                            {last7Days.map((dayIso) => {
                              const dayMarks = room.attendance[dayIso] || {};
                              const st = dayMarks[student.id];
                              const isCur = dayIso === date;

                              return (
                                <td
                                  key={dayIso}
                                  className={`py-2 px-2 text-center ${
                                    isCur ? 'bg-brand-50/30' : ''
                                  }`}
                                >
                                  {st === 'P' ? (
                                    <button
                                      type="button"
                                      onClick={() => room.markAttendance(dayIso, student.id, 'A')}
                                      className="w-6 h-6 mx-auto rounded bg-emerald-100 text-emerald-800 font-bold text-xs grid place-items-center hover:bg-emerald-200"
                                      title={`${formatDisplayDate(dayIso)}: Present (Click to mark Absent)`}
                                    >
                                      P
                                    </button>
                                  ) : st === 'A' ? (
                                    <button
                                      type="button"
                                      onClick={() => room.markAttendance(dayIso, student.id, null)}
                                      className="w-6 h-6 mx-auto rounded bg-rose-100 text-rose-800 font-bold text-xs grid place-items-center hover:bg-rose-200"
                                      title={`${formatDisplayDate(dayIso)}: Absent (Click to clear)`}
                                    >
                                      A
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => room.markAttendance(dayIso, student.id, 'P')}
                                      className="w-6 h-6 mx-auto rounded bg-slate-100 text-slate-400 font-medium text-xs grid place-items-center hover:bg-slate-200"
                                      title={`${formatDisplayDate(dayIso)}: Unmarked (Click to mark Present)`}
                                    >
                                      -
                                    </button>
                                  )}
                                </td>
                              );
                            })}

                            {/* Overall Percentage */}
                            <td className="py-2.5 px-3 text-right whitespace-nowrap">
                              {stats.pct !== null ? (
                                <span
                                  className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                                    stats.pct >= 75
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : stats.pct >= 50
                                      ? 'bg-amber-50 text-amber-700'
                                      : 'bg-rose-50 text-rose-700'
                                  }`}
                                >
                                  {stats.pct}%
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">No records</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
