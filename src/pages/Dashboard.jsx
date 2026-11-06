import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users, GraduationCap, CalendarCheck, Wallet, Inbox, FileText, ArrowRight, MessageCircle, Phone, Sparkles,
  CheckCircle2, AlertCircle, Building2, TrendingUp, Clock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppHeader } from '../components/AppHeader';
import { useClassroom, todayISO, formatMoney, formatDate } from '../services/classroom';
import {
  Panel, PanelLink, StatCard, TrendChart, BarChart, Donut, Meter, EmptyState, Initials,
  lastDays, lastMonths, shortDay, compactMoney, attendanceRate,
} from '../components/ui';

const LEAD_STAGES = [
  { id: 'new', label: 'New', color: '#a3a3a3' },
  { id: 'contacted', label: 'Contacted', color: '#737373' },
  { id: 'visit', label: 'Visit planned', color: '#404040' },
  { id: 'joined', label: 'Joined', color: '#0a0a0a' },
];

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const room = useClassroom();

  const today = todayISO();
  const todayMarks = room.attendance[today] || {};

  // Attendance
  const totalStudents = room.students.length;
  const presentCount = room.students.filter((s) => todayMarks[s.id] === 'P').length;
  const absentStudents = room.students.filter((s) => todayMarks[s.id] === 'A');
  const unmarkedCount = room.students.filter((s) => !todayMarks[s.id]).length;
  const attendancePercent = attendanceRate(todayMarks, room.students.map((s) => s.id));

  const days = lastDays(14).filter((d) => new Date(`${d}T00:00:00`).getDay() !== 0);
  const trend = days.map((d) => ({ label: shortDay(d).replace(' ', ' '), value: attendanceRate(room.attendance[d]) }));
  const trendValues = trend.map((t) => t.value).filter((v) => v != null);
  const avgAttendance = trendValues.length ? Math.round(trendValues.reduce((a, b) => a + b, 0) / trendValues.length) : null;

  // Fees
  const totalFeesExpected = room.students.reduce((sum, s) => sum + (s.fee || 0), 0);
  const totalCollected = room.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalPending = Math.max(0, totalFeesExpected - totalCollected);
  const collectedPct = totalFeesExpected ? Math.round((Math.min(totalCollected, totalFeesExpected) / totalFeesExpected) * 100) : 0;
  const studentsOwing = room.students
    .map((s) => {
      const paid = room.payments.filter((p) => p.studentId === s.id).reduce((sum, p) => sum + (p.amount || 0), 0);
      return { ...s, paid, remaining: Math.max(0, (s.fee || 0) - paid) };
    })
    .filter((s) => s.remaining > 0)
    .sort((a, b) => b.remaining - a.remaining);
  const overdue = studentsOwing.filter((s) => s.feeDate && s.feeDate < today);
  const months = lastMonths(6).map((m) => ({
    label: m.label,
    value: room.payments.filter((p) => (p.date || '').startsWith(m.key)).reduce((sum, p) => sum + (p.amount || 0), 0),
  }));
  const byClass = room.classes.map((cls) => {
    const list = room.students.filter((s) => s.className === cls.name);
    const expected = list.reduce((sum, s) => sum + (s.fee || 0), 0);
    const paid = room.payments.filter((p) => list.some((s) => s.id === p.studentId)).reduce((sum, p) => sum + (p.amount || 0), 0);
    return { name: cls.name, expected, paid: Math.min(paid, expected) };
  }).filter((c) => c.expected > 0);

  // Leads
  const activeLeads = room.leads.filter((l) => l.status !== 'joined' && l.status !== 'dropped');
  const followUpsDue = activeLeads.filter((l) => l.followUp && l.followUp <= today);
  const stageCounts = LEAD_STAGES.map((s) => ({ ...s, count: room.leads.filter((l) => (l.status || 'new') === s.id).length }));
  const decided = room.leads.filter((l) => l.status === 'joined' || l.status === 'dropped').length;
  const conversion = decided ? Math.round((stageCounts[3].count / decided) * 100) : null;
  const maxStage = Math.max(...stageCounts.map((s) => s.count), 1);

  const totalBatches = room.classes.reduce((sum, c) => sum + (c.sections?.length || 0), 0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const teacherName = user?.user_metadata?.full_name || 'Teacher';

  const setup = [
    { done: !!room.institute?.name, label: 'Add your institute details', to: '/profile', icon: Building2 },
    { done: room.classes.length > 0, label: 'Create your classes & batches', to: '/classes', icon: GraduationCap },
    { done: totalStudents > 0, label: 'Add your students', to: '/students', icon: Users },
    { done: Object.keys(room.attendance).length > 0, label: 'Mark attendance for the first time', to: '/attendance', icon: CalendarCheck },
  ];
  const setupDone = setup.filter((s) => s.done).length;

  const todo = [
    totalStudents > 0 && unmarkedCount > 0 && { to: '/attendance', tone: 'bg-neutral-50 text-neutral-900 ring-neutral-200', icon: CalendarCheck, text: `Mark attendance for ${unmarkedCount} student${unmarkedCount > 1 ? 's' : ''}` },
    overdue.length > 0 && { to: '/fees', tone: 'bg-neutral-50 text-neutral-900 ring-neutral-200', icon: Wallet, text: `${overdue.length} fee${overdue.length > 1 ? 's' : ''} past due date` },
    followUpsDue.length > 0 && { to: '/leads', tone: 'bg-neutral-50 text-neutral-900 ring-neutral-200', icon: Phone, text: `Call ${followUpsDue.length} inquir${followUpsDue.length > 1 ? 'ies' : 'y'} today` },
  ].filter(Boolean);

  return (
    <div className="min-h-dvh app-canvas">
      <AppHeader nav onSignOut={async () => { await signOut(); navigate('/login'); }} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-14">
        {/* Greeting + today's to-do */}
        <section className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-neutral-500 flex items-center gap-2">
              {room.institute?.logo && <img src={room.institute.logo} alt="" className="h-4 w-4 rounded object-contain bg-white ring-1 ring-neutral-200" />}
              {room.institute?.name || 'Your institute'}
              <span className="text-neutral-300">•</span>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <h1 className="mt-1 text-2xl sm:text-[1.9rem] font-extrabold tracking-tight text-neutral-900">
              {greeting}, {teacherName.split(' ')[0]}
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              {todo.length ? 'Here is what needs your attention today.' : 'Everything is on track today. Nice work!'}
            </p>
          </div>
          {todo.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {todo.map(({ to, tone, icon: Icon, text }) => (
                <Link key={text} to={to} className={`h-10 pl-3 pr-3.5 rounded-xl ring-1 ${tone} text-sm font-semibold inline-flex items-center gap-2 hover:-translate-y-0.5 transition-transform`}>
                  <Icon className="w-4 h-4" /> {text} <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Getting started (only until the basics are set up) */}
        {setupDone < setup.length && (
          <section className="mb-6 rounded-2xl bg-gradient-to-br from-[#0a0a0a] via-brand-900 to-brand-700 text-white p-5 sm:p-6 shadow-card relative overflow-hidden">
            <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
            <div className="relative flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand-200">Get started</p>
                <h2 className="text-lg font-bold">Set up EduBuddy in 4 easy steps</h2>
              </div>
              <span className="text-sm font-semibold text-brand-100">{setupDone} of {setup.length} done</span>
            </div>
            <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {setup.map(({ done, label, to, icon: Icon }, i) => (
                <Link key={to} to={to} className={`rounded-xl p-3.5 ring-1 flex items-center gap-3 transition ${done ? 'bg-white/5 ring-white/10 text-white/60' : 'bg-white text-neutral-900 ring-white hover:-translate-y-0.5'}`}>
                  <span className={`h-9 w-9 rounded-xl grid place-items-center shrink-0 ${done ? 'bg-neutral-400/20 text-neutral-300' : 'bg-brand-50 text-brand-600'}`}>
                    {done ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-[18px] h-[18px]" />}
                  </span>
                  <span className="text-sm font-semibold leading-snug"><span className="opacity-60 mr-1">{i + 1}.</span>{label}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <StatCard to="/students" label="Total students" value={totalStudents} icon={Users} tone="brand" hint={`${room.classes.length} classes · ${totalBatches} batches`} />
          <StatCard
            to="/attendance"
            label="Today's attendance"
            value={attendancePercent !== null ? `${attendancePercent}%` : '—'}
            icon={CalendarCheck}
            tone="emerald"
            hint={attendancePercent !== null ? `${presentCount} present · ${absentStudents.length} absent` : 'Not marked yet'}
            hintTone={attendancePercent === null ? 'amber' : undefined}
            trend={trendValues.slice(-7)}
          />
          <StatCard
            to="/fees"
            label="Fees collected"
            value={formatMoney(totalCollected)}
            icon={Wallet}
            tone="amber"
            hint={`${formatMoney(totalPending)} still pending`}
            hintTone={totalPending ? 'rose' : 'emerald'}
            trend={months.map((m) => m.value)}
          />
          <StatCard
            to="/leads"
            label="Active inquiries"
            value={activeLeads.length}
            icon={Inbox}
            tone="sky"
            hint={followUpsDue.length ? `${followUpsDue.length} follow-up due` : 'All follow-ups on track'}
            hintTone={followUpsDue.length ? 'amber' : undefined}
          />
        </div>

        {/* Attendance trend + fee health */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Panel
            className="lg:col-span-2"
            title="Attendance trend"
            subtitle="Share of marked students who were present, last 2 weeks"
            icon={TrendingUp}
            tone="emerald"
            action={<PanelLink to="/attendance">Register</PanelLink>}
          >
            {trendValues.length ? (
              <>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {[
                    ['Today', attendancePercent != null ? `${attendancePercent}%` : '—'],
                    ['2-week average', avgAttendance != null ? `${avgAttendance}%` : '—'],
                    ['Best day', `${Math.max(...trendValues)}%`],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-xl bg-neutral-50 ring-1 ring-neutral-100 px-3.5 py-2.5">
                      <p className="text-[11px] font-semibold text-neutral-500">{k}</p>
                      <p className="text-lg font-extrabold text-neutral-900 tabular-nums">{v}</p>
                    </div>
                  ))}
                </div>
                <TrendChart data={trend} target={85} />
              </>
            ) : (
              <EmptyState icon={CalendarCheck} title="No attendance yet" text="Mark attendance daily and your trend will appear here." action={<Link to="/attendance" className="text-sm font-semibold text-brand-700">Take attendance →</Link>} />
            )}
          </Panel>

          <Panel title="Fee collection" subtitle="All students, this session" icon={Wallet} tone="amber" action={<PanelLink to="/fees">Fees</PanelLink>}>
            {totalFeesExpected ? (
              <>
                <div className="flex items-center gap-5">
                  <Donut size={140} thickness={16} segments={[
                    { value: Math.min(totalCollected, totalFeesExpected), color: '#0a0a0a', label: 'Collected' },
                    { value: totalPending, color: '#e5e5e5', label: 'Pending' },
                  ]}>
                    <div>
                      <p className="text-2xl font-extrabold text-neutral-900 tabular-nums">{collectedPct}%</p>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">collected</p>
                    </div>
                  </Donut>
                  <div className="space-y-3 min-w-0">
                    <div>
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500"><span className="h-2.5 w-2.5 rounded-sm bg-brand-600" />Collected</p>
                      <p className="text-lg font-extrabold text-neutral-900 tabular-nums">{formatMoney(totalCollected)}</p>
                    </div>
                    <div>
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500"><span className="h-2.5 w-2.5 rounded-sm bg-neutral-400" />Pending</p>
                      <p className="text-lg font-extrabold text-neutral-900 tabular-nums">{formatMoney(totalPending)}</p>
                    </div>
                  </div>
                </div>
                {byClass.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-neutral-100 space-y-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">By class</p>
                    {byClass.map((c) => (
                      <Meter key={c.name} label={c.name} right={`${Math.round((c.paid / c.expected) * 100)}%`} value={c.paid} max={c.expected} tone={c.paid / c.expected < 0.5 ? 'rose' : 'brand'} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <EmptyState icon={Wallet} title="No fees set up" text="Add a fee amount for each student to track collections." />
            )}
          </Panel>
        </div>

        {/* Monthly collections · lead pipeline · absent today */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Panel title="Monthly collections" subtitle="Payments recorded per month" icon={TrendingUp} tone="brand">
            <BarChart data={months} format={compactMoney} highlightLast height={150} />
          </Panel>

          <Panel title="Admissions pipeline" subtitle={conversion != null ? `${conversion}% of decided inquiries joined` : 'Every inquiry, by stage'} icon={Inbox} tone="sky" action={<PanelLink to="/leads">Leads</PanelLink>}>
            {room.leads.length ? (
              <div className="space-y-2.5 pt-1">
                {stageCounts.map((s) => (
                  <div key={s.id} className="flex items-center gap-3">
                    <span className="w-24 shrink-0 text-xs font-semibold text-neutral-600">{s.label}</span>
                    <div className="flex-1 h-8 rounded-lg bg-neutral-50 overflow-hidden">
                      <div className="h-full rounded-lg flex items-center justify-end px-2.5 text-xs font-bold text-white transition-all" style={{ width: `${Math.max(12, (s.count / maxStage) * 100)}%`, background: s.color, opacity: s.count ? 1 : 0.35 }}>
                        {s.count}
                      </div>
                    </div>
                  </div>
                ))}
                <p className="pt-1 text-xs text-neutral-500">{activeLeads.length} open · {followUpsDue.length} follow-up{followUpsDue.length === 1 ? '' : 's'} due</p>
              </div>
            ) : (
              <EmptyState icon={Inbox} title="No inquiries yet" text="Save every call or walk-in so no admission slips away." />
            )}
          </Panel>

          <Panel title="Absent today" subtitle={absentStudents.length ? `${absentStudents.length} student${absentStudents.length > 1 ? 's' : ''}` : 'Today'} icon={AlertCircle} tone="rose" action={<PanelLink to="/attendance">Register</PanelLink>}>
            {totalStudents === 0 ? (
              <EmptyState icon={Users} title="No students yet" text="Add students to start taking attendance." />
            ) : unmarkedCount === totalStudents ? (
              <EmptyState icon={Clock} title="Attendance not marked yet" text="It takes a few seconds with “Mark all present”." action={<Link to="/attendance" className="inline-flex h-9 px-4 items-center rounded-xl bg-brand-600 text-white text-sm font-semibold">Take attendance</Link>} />
            ) : absentStudents.length ? (
              <ul className="divide-y divide-neutral-100 -mx-1">
                {absentStudents.slice(0, 5).map((student) => (
                  <li key={student.id} className="px-1 py-2.5 flex items-center gap-3">
                    <Initials name={student.name} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-neutral-900 truncate">{student.name}</p>
                      <p className="text-[11px] text-neutral-500">{[student.className, student.section && `Batch ${student.section}`].filter(Boolean).join(' · ')}</p>
                    </div>
                    {student.phone ? (
                      <a href={`https://wa.me/91${student.phone.replace(/[^\d]/g, '').slice(-10)}`} target="_blank" rel="noopener noreferrer" className="h-8 px-2.5 rounded-lg bg-neutral-50 text-neutral-900 hover:bg-neutral-100 text-xs font-semibold inline-flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5" /> Message
                      </a>
                    ) : <span className="text-[11px] text-neutral-400">No phone</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-8 text-center">
                <CheckCircle2 className="mx-auto w-9 h-9 text-neutral-500" />
                <p className="mt-2 text-sm font-semibold text-neutral-900">Everyone marked is present today</p>
              </div>
            )}
          </Panel>
        </div>

        {/* Pending fees table + follow-ups + classes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <Panel className="lg:col-span-2" title="Fees to collect" subtitle={studentsOwing.length ? `${studentsOwing.length} students · ${formatMoney(totalPending)}` : 'All clear'} icon={Wallet} tone="amber" action={<PanelLink to="/fees">Record payment</PanelLink>} bodyClass="!px-0">
            {studentsOwing.length === 0 ? (
              <EmptyState icon={CheckCircle2} title="All fees are paid" text="Nothing pending right now." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-neutral-400 border-y border-neutral-100 bg-neutral-50/60">
                      <th className="px-5 py-2.5">Student</th>
                      <th className="px-3 py-2.5 hidden sm:table-cell">Paid so far</th>
                      <th className="px-3 py-2.5">Due date</th>
                      <th className="px-5 py-2.5 text-right">Pending</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {studentsOwing.slice(0, 6).map((s) => {
                      const late = s.feeDate && s.feeDate < today;
                      return (
                        <tr key={s.id} className="hover:bg-neutral-50/60">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <Initials name={s.name} className="h-8 w-8 text-[11px]" />
                              <div className="min-w-0">
                                <p className="font-semibold text-neutral-900 truncate">{s.name}</p>
                                <p className="text-[11px] text-neutral-500">{[s.className, s.section].filter(Boolean).join(' · ')}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 hidden sm:table-cell w-48">
                            <Meter value={s.paid} max={s.fee} tone="emerald" />
                            <p className="mt-1 text-[11px] text-neutral-500 tabular-nums">{formatMoney(s.paid)} of {formatMoney(s.fee)}</p>
                          </td>
                          <td className="px-3 py-3">
                            {s.feeDate ? (
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${late ? 'bg-neutral-50 text-neutral-900' : 'bg-neutral-100 text-neutral-600'}`}>
                                {late && <AlertCircle className="w-3 h-3" />}{formatDate(s.feeDate)}
                              </span>
                            ) : <span className="text-[11px] text-neutral-400">Not set</span>}
                          </td>
                          <td className="px-5 py-3 text-right font-bold text-neutral-900 tabular-nums">{formatMoney(s.remaining)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <div className="space-y-6">
            <Panel title="Follow-ups due" icon={Phone} tone="sky" action={<PanelLink to="/leads">All</PanelLink>}>
              {followUpsDue.length === 0 ? (
                <p className="py-3 text-sm text-neutral-500 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-neutral-500" /> No calls due today.</p>
              ) : (
                <ul className="divide-y divide-neutral-100 -mx-1">
                  {followUpsDue.slice(0, 4).map((lead) => (
                    <li key={lead.id} className="px-1 py-2.5 flex items-center gap-3">
                      <Initials name={lead.name} className="h-8 w-8 text-[11px]" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-neutral-900 truncate">{lead.name}</p>
                        <p className="text-[11px] font-medium text-neutral-900">{lead.followUp < today ? 'Overdue · ' : 'Today · '}{formatDate(lead.followUp)}</p>
                      </div>
                      {lead.phone && (
                        <a href={`tel:${lead.phone}`} className="h-8 w-8 grid place-items-center rounded-lg bg-neutral-50 text-neutral-900 hover:bg-neutral-100" aria-label={`Call ${lead.name}`}>
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Classes" subtitle={`${room.classes.length} classes · ${totalBatches} batches`} icon={GraduationCap} action={<PanelLink to="/classes">Manage</PanelLink>}>
              {room.classes.length === 0 ? (
                <p className="py-2 text-sm text-neutral-500">No classes yet. <Link to="/classes" className="font-semibold text-brand-700">Create one →</Link></p>
              ) : (
                <ul className="space-y-2.5">
                  {room.classes.map((cls) => {
                    const count = room.students.filter((s) => s.className === cls.name).length;
                    return (
                      <li key={cls.id} className="flex items-center gap-3">
                        <span className="h-8 w-8 rounded-lg bg-brand-50 text-brand-700 grid place-items-center text-[11px] font-extrabold">{cls.name.replace(/\D/g, '') || cls.name[0]}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-neutral-800">{cls.name}</p>
                          <p className="text-[11px] text-neutral-500 truncate">{(cls.sections || []).join(' · ') || 'No batches'}</p>
                        </div>
                        <span className="text-xs font-bold text-neutral-700 tabular-nums">{count} <span className="font-medium text-neutral-400">students</span></span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>

            <div className="rounded-2xl bg-gradient-to-br from-[#0a0a0a] via-neutral-900 to-brand-800 text-white p-5 shadow-card relative overflow-hidden">
              <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-500/40 blur-2xl" />
              <div className="relative">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider bg-white/15 ring-1 ring-white/15 px-2 py-0.5 rounded-full mb-2">
                  <Sparkles className="w-3 h-3 text-neutral-300" /> Test generator
                </span>
                <h3 className="text-base font-bold">Make a test paper in a minute</h3>
                <p className="text-xs text-white/75 mt-1 leading-relaxed">Pick class, subject and chapters. Get the question paper, worksheet and answer key.</p>
                <Link to="/tests" className="mt-3.5 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-white text-brand-900 text-xs font-bold hover:bg-brand-50 shadow-sm transition-colors">
                  <FileText className="w-3.5 h-3.5" /> Create test paper <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

