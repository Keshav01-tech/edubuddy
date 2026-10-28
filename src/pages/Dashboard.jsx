import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  CalendarCheck,
  Wallet,
  Inbox,
  FileText,
  Plus,
  ArrowRight,
  MessageCircle,
  Phone,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppHeader } from '../components/AppHeader';
import { useClassroom, todayISO, formatMoney, formatDate } from '../services/classroom';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const room = useClassroom();

  const today = todayISO();
  const todayMarks = room.attendance[today] || {};

  // Attendance metrics
  const totalStudents = room.students.length;
  const presentStudents = room.students.filter((s) => todayMarks[s.id] === 'P');
  const absentStudents = room.students.filter((s) => todayMarks[s.id] === 'A');
  const unmarkedStudents = room.students.filter((s) => !todayMarks[s.id]);

  const presentCount = presentStudents.length;
  const absentCount = absentStudents.length;
  const unmarkedCount = unmarkedStudents.length;
  const markedTotal = presentCount + absentCount;
  const attendancePercent = markedTotal > 0 ? Math.round((presentCount / markedTotal) * 100) : null;

  // Fee metrics
  const totalFeesExpected = room.students.reduce((sum, s) => sum + (s.fee || 0), 0);
  const totalCollected = room.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalPending = Math.max(0, totalFeesExpected - totalCollected);

  // Students with pending fees
  const studentsOwing = room.students
    .map((s) => {
      const paid = room.payments
        .filter((p) => p.studentId === s.id)
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      const remaining = Math.max(0, (s.fee || 0) - paid);
      return { ...s, paid, remaining };
    })
    .filter((s) => s.remaining > 0)
    .sort((a, b) => b.remaining - a.remaining);

  // Leads metrics
  const activeLeads = room.leads.filter((l) => l.status !== 'joined' && l.status !== 'dropped');
  const followUpsDue = activeLeads.filter((l) => l.followUp && l.followUp <= today);

  // Total batches
  const totalBatches = room.classes.reduce((sum, c) => sum + (c.sections?.length || 0), 0);

  // Time-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const teacherName = user?.user_metadata?.full_name || 'Teacher';

  return (
    <div className="min-h-dvh bg-slate-50">
      <AppHeader
        nav
        width="max-w-5xl"
        onSignOut={async () => { await signOut(); navigate('/login'); }}
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-5 sm:pt-8 pb-12">
        {/* Welcome Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors inline-flex items-center gap-1.5"
                title="Edit Institute Profile"
              >
                {room.institute?.logo && (
                  <img src={room.institute.logo} alt="Logo" className="h-3.5 w-3.5 rounded object-contain" />
                )}
                {room.institute?.name || room.school || 'EduBuddy Institute'}
              </Link>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500 font-medium">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {greeting}, {teacherName} 👋
            </h1>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/attendance"
              className="h-9 px-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <CalendarCheck className="w-4 h-4" />
              Mark attendance
            </Link>
            <Link
              to="/students"
              className="h-9 px-3.5 rounded-xl bg-white ring-1 ring-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add student
            </Link>
            <Link
              to="/tests"
              className="h-9 px-3.5 rounded-xl bg-white ring-1 ring-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              New test
            </Link>
          </div>
        </div>

        {/* 4 Key Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Students */}
          <Link
            to="/students"
            className="bg-white rounded-2xl ring-1 ring-slate-200/70 p-4 shadow-card hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total students</span>
              <span className="h-8 w-8 rounded-xl bg-brand-50 text-brand-600 grid place-items-center group-hover:scale-110 transition-transform">
                <Users className="w-4 h-4" />
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">{totalStudents}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              Across {room.classes.length} classes & {totalBatches} batches
            </p>
          </Link>

          {/* Today's Attendance */}
          <Link
            to="/attendance"
            className="bg-white rounded-2xl ring-1 ring-slate-200/70 p-4 shadow-card hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Today's attendance</span>
              <span className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center group-hover:scale-110 transition-transform">
                <CalendarCheck className="w-4 h-4" />
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {attendancePercent !== null ? `${attendancePercent}%` : 'Not marked'}
            </p>
            <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden flex">
              <div
                className="bg-emerald-500"
                style={{ width: `${totalStudents ? (presentCount / totalStudents) * 100 : 0}%` }}
              />
              <div
                className="bg-rose-400"
                style={{ width: `${totalStudents ? (absentCount / totalStudents) * 100 : 0}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400 truncate">
              {presentCount} present · {absentCount} absent · {unmarkedCount} left
            </p>
          </Link>

          {/* Fees Status */}
          <Link
            to="/fees"
            className="bg-white rounded-2xl ring-1 ring-slate-200/70 p-4 shadow-card hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Fee collected</span>
              <span className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 grid place-items-center group-hover:scale-110 transition-transform">
                <Wallet className="w-4 h-4" />
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">{formatMoney(totalCollected)}</p>
            <p className="mt-0.5 text-xs text-rose-600 font-medium truncate">
              {formatMoney(totalPending)} pending ({studentsOwing.length} students)
            </p>
          </Link>

          {/* Active Leads / Inquiries */}
          <Link
            to="/leads"
            className="bg-white rounded-2xl ring-1 ring-slate-200/70 p-4 shadow-card hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Active inquiries</span>
              <span className="h-8 w-8 rounded-xl bg-sky-50 text-sky-600 grid place-items-center group-hover:scale-110 transition-transform">
                <Inbox className="w-4 h-4" />
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">{activeLeads.length}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {followUpsDue.length > 0 ? (
                <span className="text-amber-700 font-medium">{followUpsDue.length} follow-up due today</span>
              ) : (
                'All follow-ups on track'
              )}
            </p>
          </Link>
        </div>

        {/* 2-Column Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main 2-column section (Left & Center) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Attendance Detail */}
            <section className="bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-card p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-700 grid place-items-center">
                    <CalendarCheck className="w-4 h-4" />
                  </span>
                  <h2 className="text-sm font-semibold text-slate-900">Today's Attendance Status</h2>
                </div>
                <Link
                  to="/attendance"
                  className="text-xs font-medium text-brand-700 hover:underline inline-flex items-center gap-1"
                >
                  Full register <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {totalStudents === 0 ? (
                <div className="py-6 text-center text-sm text-slate-400">
                  No students enrolled yet. Add students to track attendance.
                </div>
              ) : unmarkedCount === totalStudents ? (
                <div className="py-6 px-4 bg-slate-50 rounded-xl text-center">
                  <p className="text-sm font-medium text-slate-700">Attendance not marked for today yet</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Mark attendance to automatically calculate presence rates and notify parents.
                  </p>
                  <Link
                    to="/attendance"
                    className="mt-3 inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm"
                  >
                    Take attendance now
                  </Link>
                </div>
              ) : absentStudents.length > 0 ? (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="text-rose-700 font-medium inline-flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {absentStudents.length} {absentStudents.length === 1 ? 'student absent today' : 'students absent today'}
                    </span>
                    <span>{presentCount} present ({attendancePercent}%)</span>
                  </div>
                  <ul className="divide-y divide-slate-100 ring-1 ring-slate-100 rounded-xl overflow-hidden">
                    {absentStudents.slice(0, 5).map((student) => (
                      <li key={student.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-900 truncate">{student.name}</p>
                          <p className="text-[11px] text-slate-400">
                            {[student.className, student.section && `Batch ${student.section}`].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                        {student.phone ? (
                          <a
                            href={`https://wa.me/91${student.phone.replace(/[^\d]/g, '').slice(-10)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-7 px-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-medium inline-flex items-center gap-1"
                          >
                            <MessageCircle className="w-3 h-3" /> WhatsApp
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-400">No phone</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-emerald-700 bg-emerald-50/60 rounded-xl flex items-center justify-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> All marked students are present today! 🎉
                </div>
              )}
            </section>

            {/* Classes & Batches Breakdown */}
            <section className="bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-card p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="h-7 w-7 rounded-lg bg-brand-50 text-brand-700 grid place-items-center">
                    <GraduationCap className="w-4 h-4" />
                  </span>
                  <h2 className="text-sm font-semibold text-slate-900">Classes & Batches</h2>
                </div>
                <Link
                  to="/classes"
                  className="text-xs font-medium text-brand-700 hover:underline inline-flex items-center gap-1"
                >
                  Manage <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {room.classes.length === 0 ? (
                <div className="py-6 text-center text-sm text-slate-400">
                  No classes created yet.{' '}
                  <Link to="/classes" className="text-brand-700 underline font-medium">
                    Create your first class
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {room.classes.map((cls) => {
                    const classStudents = room.students.filter((s) => s.className === cls.name);
                    const sections = cls.sections || [];

                    return (
                      <div
                        key={cls.id}
                        className="p-3 rounded-xl bg-slate-50 ring-1 ring-slate-100 flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-sm text-slate-900">{cls.name}</p>
                          <span className="text-xs font-medium text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full">
                            {classStudents.length} students
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {sections.map((batch) => {
                            const count = classStudents.filter((s) => (s.section || '') === batch).length;
                            return (
                              <span
                                key={batch}
                                className="text-[11px] bg-white ring-1 ring-slate-200/60 px-2 py-0.5 rounded-md text-slate-600 font-medium"
                              >
                                {batch} ({count})
                              </span>
                            );
                          })}
                          {sections.length === 0 && (
                            <span className="text-[11px] text-slate-400 italic">No batches yet</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* Right Column: Fees & Leads & Test Generator */}
          <div className="space-y-6">
            {/* Pending Fees Alert Widget */}
            <section className="bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-card p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="h-7 w-7 rounded-lg bg-amber-50 text-amber-700 grid place-items-center">
                    <Wallet className="w-4 h-4" />
                  </span>
                  <h2 className="text-sm font-semibold text-slate-900">Pending Fees</h2>
                </div>
                <Link
                  to="/fees"
                  className="text-xs font-medium text-brand-700 hover:underline inline-flex items-center gap-1"
                >
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {studentsOwing.length === 0 ? (
                <p className="py-4 text-center text-xs text-slate-400">All student fees are fully paid! 👏</p>
              ) : (
                <ul className="divide-y divide-slate-100 text-xs">
                  {studentsOwing.slice(0, 4).map((student) => (
                    <li key={student.id} className="py-2 flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900 truncate">{student.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {[student.className, student.section && `Batch ${student.section}`].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <div className="text-right ml-2 shrink-0">
                        <p className="font-semibold text-rose-600">{formatMoney(student.remaining)}</p>
                        {student.feeDate && (
                          <p className="text-[10px] text-slate-400">Due {formatDate(student.feeDate)}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Upcoming Leads Follow-ups */}
            <section className="bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-card p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="h-7 w-7 rounded-lg bg-sky-50 text-sky-700 grid place-items-center">
                    <Inbox className="w-4 h-4" />
                  </span>
                  <h2 className="text-sm font-semibold text-slate-900">Inquiry Follow-ups</h2>
                </div>
                <Link
                  to="/leads"
                  className="text-xs font-medium text-brand-700 hover:underline inline-flex items-center gap-1"
                >
                  Leads ({activeLeads.length}) <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {followUpsDue.length === 0 ? (
                <p className="py-4 text-center text-xs text-slate-400">No urgent follow-ups due today.</p>
              ) : (
                <ul className="divide-y divide-slate-100 text-xs">
                  {followUpsDue.slice(0, 3).map((lead) => (
                    <li key={lead.id} className="py-2 flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900 truncate">{lead.name}</p>
                        <p className="text-[11px] text-amber-700 font-medium">
                          Follow-up due: {formatDate(lead.followUp)}
                        </p>
                      </div>
                      {lead.phone && (
                        <a
                          href={`tel:${lead.phone}`}
                          className="h-7 w-7 grid place-items-center rounded-lg text-slate-400 hover:text-brand-700 hover:bg-brand-50"
                          aria-label={`Call ${lead.name}`}
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* AI Paper Generator Promo Banner */}
            <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-white p-5 shadow-card relative overflow-hidden">
              <div className="relative z-10">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full mb-2">
                  <Sparkles className="w-3 h-3 text-amber-300" /> CBSE Paper Generator
                </span>
                <h3 className="text-base font-bold">Generate Question Papers</h3>
                <p className="text-xs text-white/80 mt-1 leading-relaxed">
                  Generate blueprint-aligned tests with MCQs, short/long answers, KaTeX formulas, and diagrams.
                </p>
                <Link
                  to="/tests"
                  className="mt-3.5 inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl bg-white text-brand-900 text-xs font-semibold hover:bg-brand-50 shadow-sm transition-colors"
                >
                  Create test paper <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
