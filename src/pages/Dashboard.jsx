import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, Bell, Plus, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ChevronDown,
  Trash2, Pencil, ArrowRight, CheckCircle2, CalendarCheck, Wallet, Phone, Users, GraduationCap, Building2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppHeader } from '../components/AppHeader';
import { useClassroom, todayISO, formatMoney } from '../services/classroom';
import { attendanceRate, compactMoney } from '../components/ui';

/* ───────────── palette (taken from the reference design) ───────────── */
const PINK = '#1b365d';
const YELLOW = '#ececec';
const BLUE = '#f6f6f6';
const LILAC = '#d4d4d8';

const CHIP = {
  blue: 'bg-neutral-100 text-neutral-900 ring-1 ring-inset ring-neutral-200',
  yellow: 'bg-neutral-200 text-neutral-900',
  pink: 'bg-[#005a9c] text-white',
  lilac: 'bg-[#1b365d] text-white',
};

const AVATAR = [['#1f1f1f', '#ffffff'], ['#e5e5e5', '#171717'], ['#525252', '#ffffff'], ['#f0f0f0', '#171717']];
const avatarColors = (name) => {
  let h = 0;
  for (const ch of String(name || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR[h % AVATAR.length];
};

const LEAD_STAGES = [
  { id: 'new', label: 'New', color: '#d4d4d4', text: '#737373' },
  { id: 'contacted', label: 'Contacted', color: '#a3a3a3', text: '#525252' },
  { id: 'visit', label: 'Visit planned', color: '#60c1e5', text: '#1f7fa8' },
  { id: 'joined', label: 'Joined', color: '#005a9c', text: '#005a9c' },
];

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SLOTS = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00'];

/* ───────────── date helpers ───────────── */
const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const startOfWeek = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
const monthsAgo = (n) => { const x = new Date(); x.setMonth(x.getMonth() - n); return x; };

/* ───────────── small pieces ───────────── */
function Avatar({ name, className = 'h-10 w-10 text-xs' }) {
  const [bg, fg] = avatarColors(name);
  const letters = String(name || '?').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return <span className={`${className} shrink-0 rounded-full grid place-items-center font-semibold`} style={{ background: bg, color: fg }}>{letters}</span>;
}

function Pill({ dir = 'flat', children }) {
  const tone = dir === 'up' ? 'text-neutral-900' : dir === 'down' ? 'text-neutral-500' : 'text-neutral-500';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[13px] font-medium ${tone}`}>
      {dir === 'up' && <ArrowUp className="w-3.5 h-3.5" strokeWidth={2.4} />}
      {dir === 'down' && <ArrowDown className="w-3.5 h-3.5" strokeWidth={2.4} />}
      {children}
    </span>
  );
}

function StatTile({ to, label, value, bg, pill, dark }) {
  return (
    <div className={`rounded-3xl p-5 sm:p-6 min-h-[168px] flex flex-col justify-between min-w-0 ${dark ? '' : 'ring-1 ring-inset ring-neutral-200'}`} style={{ background: bg }}>
      <div className="flex items-start justify-between gap-2">
        <p className={`text-[15px] font-medium ${dark ? 'text-white/70' : 'text-neutral-800'}`}>{label}</p>
        <Link to={to} aria-label={`Open ${label}`} className={`h-8 w-11 shrink-0 rounded-full grid place-items-center transition-shadow hover:shadow-md ${dark ? 'bg-white/15' : 'bg-white'}`}>
          <span className="flex gap-[3px]">{[0, 1, 2].map((i) => <span key={i} className={`h-[3.5px] w-[3.5px] rounded-full ${dark ? 'bg-white' : 'bg-neutral-900'}`} />)}</span>
        </Link>
      </div>
      <div className="min-w-0">
        <p className={`text-[2.3rem] xl:text-[2.6rem] leading-none font-medium tracking-tight tabular-nums truncate ${dark ? 'text-white' : 'text-neutral-900'}`}>{value}</p>
        <div className={`mt-5 flex items-center gap-2.5 text-sm ${dark ? 'text-white/60' : 'text-neutral-700'}`}>
          Last 7 Days {pill}
        </div>
      </div>
    </div>
  );
}

/* ───────────── calendar ───────────── */
function TimeGrid({ days, eventsFor, todayStr }) {
  const cols = `64px repeat(${days.length}, minmax(0, 1fr))`;
  return (
    <div className="overflow-x-auto">
      <div className={`rounded-2xl border border-neutral-200 overflow-hidden ${days.length > 1 ? 'min-w-[640px]' : ''}`}>
        <div className="grid border-b border-neutral-200 text-[13px] font-medium text-neutral-800" style={{ gridTemplateColumns: cols }}>
          <div className="px-3 py-2.5">Time</div>
          {days.map((d) => (
            <div key={iso(d)} className={`px-3 py-2.5 text-center border-l border-neutral-200 ${iso(d) === todayStr ? 'text-[#005a9c] font-bold' : ''}`}>
              {DOW[(d.getDay() + 6) % 7]} <span className="font-normal text-neutral-400">{d.getDate()}</span>
            </div>
          ))}
        </div>
        {SLOTS.map((slot) => (
          <div key={slot} className="grid border-b border-neutral-200 last:border-b-0" style={{ gridTemplateColumns: cols }}>
            <div className="px-3 h-11 flex items-center text-[13px] font-medium text-neutral-800">{slot}</div>
            {days.map((d) => {
              const ds = iso(d);
              const weekend = d.getDay() === 0 || d.getDay() === 6;
              const evs = eventsFor(ds).filter((e) => e.slot === slot);
              return (
                <div key={ds} className={`h-11 p-1 border-l border-neutral-200 min-w-0 ${weekend ? 'bg-neutral-200/60' : ds === todayStr ? 'bg-[#eef7fc]' : ''}`}>
                  {evs.map((e) => (
                    <Link key={e.id} to={e.to} title={e.label} className={`block truncate rounded-md px-2 py-1 text-xs font-medium ${CHIP[e.tone]}`}>{e.label}</Link>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function MonthGrid({ anchor, eventsFor, todayStr }) {
  const y = anchor.getFullYear();
  const m = anchor.getMonth();
  const first = new Date(y, m, 1);
  const lead = (first.getDay() + 6) % 7;
  const weeks = Math.ceil((lead + new Date(y, m + 1, 0).getDate()) / 7);
  const cells = Array.from({ length: weeks * 7 }, (_, i) => addDays(startOfWeek(first), i));
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px] rounded-2xl border border-neutral-200 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-neutral-200 text-[13px] font-medium text-neutral-800">
          {DOW.map((d, i) => <div key={d} className={`px-3 py-2.5 ${i ? 'border-l border-neutral-200' : ''}`}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((d, i) => {
            const ds = iso(d);
            const inMonth = d.getMonth() === m;
            const weekend = d.getDay() === 0 || d.getDay() === 6;
            const evs = eventsFor(ds);
            return (
              <div key={ds} className={`min-h-[84px] p-1.5 border-neutral-200 ${i % 7 ? 'border-l' : ''} ${i >= 7 ? 'border-t' : ''} ${weekend ? 'bg-neutral-200/50' : ''}`}>
                <p className={`mb-1 text-xs font-medium ${ds === todayStr ? 'inline-grid h-5 w-5 place-items-center rounded-full bg-neutral-900 text-white' : inMonth ? 'text-neutral-700' : 'text-neutral-300'}`}>{d.getDate()}</p>
                <div className="space-y-1">
                  {inMonth && evs.slice(0, 2).map((e) => (
                    <Link key={e.id} to={e.to} title={e.label} className={`block truncate rounded px-1.5 py-0.5 text-[11px] font-medium ${CHIP[e.tone]}`}>{e.label}</Link>
                  ))}
                  {inMonth && evs.length > 2 && <p className="px-1 text-[11px] text-neutral-400">+{evs.length - 2} more</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CalendarCard({ eventsFor, todayStr }) {
  const [view, setView] = useState('week');
  const [anchor, setAnchor] = useState(() => new Date());

  const shift = (dir) => setAnchor((a) => {
    const d = new Date(a);
    if (view === 'day') d.setDate(d.getDate() + dir);
    else if (view === 'week') d.setDate(d.getDate() + 7 * dir);
    else if (view === 'month') { d.setDate(1); d.setMonth(d.getMonth() + dir); } else d.setFullYear(d.getFullYear() + dir);
    return d;
  });

  const label = view === 'year' ? String(anchor.getFullYear()) : `${MONTHS[anchor.getMonth()]}, ${anchor.getFullYear()}`;
  const weekStart = startOfWeek(anchor);
  const days = view === 'day' ? [anchor] : Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <section className="rounded-3xl bg-white p-5 sm:p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <header className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-3">
        <h2 className="text-lg font-medium text-neutral-800">Calendar</h2>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => shift(-1)} aria-label="Previous" className="h-8 w-8 grid place-items-center rounded-lg text-neutral-500 hover:bg-neutral-100"><ChevronLeft className="w-4 h-4" /></button>
          <button type="button" onClick={() => setAnchor(new Date())} title="Jump to today" className="px-1 text-sm font-semibold text-neutral-800 hover:text-[#005a9c]">{label}</button>
          <button type="button" onClick={() => shift(1)} aria-label="Next" className="h-8 w-8 grid place-items-center rounded-lg text-neutral-500 hover:bg-neutral-100"><ChevronRight className="w-4 h-4" /></button>
        </div>
        <div className="ml-auto flex items-center gap-1 text-sm text-neutral-500">
          {['day', 'week', 'month', 'year'].map((v) => (
            <button key={v} type="button" onClick={() => setView(v)} aria-pressed={view === v}
              className={`h-8 px-3 rounded-lg capitalize transition-colors ${view === v ? 'bg-neutral-100 font-medium text-neutral-900' : 'hover:text-neutral-900'}`}>{v}</button>
          ))}
        </div>
      </header>

      {(view === 'week' || view === 'day') && <TimeGrid days={days} eventsFor={eventsFor} todayStr={todayStr} />}
      {view === 'month' && <MonthGrid anchor={anchor} eventsFor={eventsFor} todayStr={todayStr} />}
      {view === 'year' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {MONTHS.map((name, i) => (
            <button key={name} type="button" onClick={() => { setAnchor(new Date(anchor.getFullYear(), i, 1)); setView('month'); }}
              className={`h-20 rounded-2xl border text-sm font-medium transition-colors hover:bg-neutral-50 ${i === new Date().getMonth() && anchor.getFullYear() === new Date().getFullYear() ? 'border-[#005a9c] bg-[#005a9c] text-white' : 'border-neutral-200 text-neutral-700'}`}>
              {name}
            </button>
          ))}
        </div>
      )}

      <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-neutral-500">
        {[['blue', 'Roll call'], ['yellow', 'Follow-up calls'], ['pink', 'Fees due'], ['lilac', 'Payments']].map(([tone, name]) => (
          <span key={name} className="inline-flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-sm ${CHIP[tone].split(' ')[0]}`} />{name}</span>
        ))}
      </p>
    </section>
  );
}

/* ───────────── breakdown ring ───────────── */
function RingChart({ segments, size = 280, thickness = 34, children }) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0);
  const gap = 8; // visible gap between rounded ends
  let offset = 0;
  return (
    <div className="relative mx-auto w-full max-w-[260px] aspect-square">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90" role="img" aria-label="Breakdown chart">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#ededed" strokeWidth={thickness} />
        {total > 0 && segments.filter((s) => s.value > 0).map((s) => {
          const share = (s.value / total) * c;
          const len = Math.max(0.01, share - thickness - gap);
          const el = (
            <circle key={s.label} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color} strokeWidth={thickness} strokeLinecap="round"
              strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-(offset + thickness / 2 + gap / 2)}>
              <title>{`${s.label}: ${s.value}`}</title>
            </circle>
          );
          offset += share;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

/* ───────────── notifications ───────────── */
function Notifications({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [open]);
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label="Notifications"
        className="relative h-12 w-12 rounded-full bg-white grid place-items-center text-neutral-800 shadow-[0_1px_2px_rgba(15,23,42,0.05)] hover:shadow-md transition-shadow">
        <Bell className="w-5 h-5" />
        {items.length > 0 && <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-[#005a9c] ring-2 ring-white" />}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[85vw] rounded-3xl bg-white p-2 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.25)] ring-1 ring-neutral-100 z-50 animate-fade-up">
          <p className="px-3 pt-2 pb-2 text-sm font-medium text-neutral-800">Needs your attention</p>
          {items.length === 0 ? (
            <p className="px-3 pb-3 text-sm text-neutral-500 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-neutral-700" /> You're all caught up.</p>
          ) : items.map(({ to, icon: Icon, text }) => (
            <Link key={text} to={to} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 hover:bg-neutral-50">
              <span className="h-9 w-9 rounded-full grid place-items-center" style={{ background: BLUE }}><Icon className="w-4 h-4 text-neutral-800" /></span>
              <span className="flex-1 text-sm text-neutral-700">{text}</span>
              <ArrowRight className="w-4 h-4 text-neutral-400" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────────── page ───────────── */
export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const room = useClassroom();

  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState(() => new Set());
  const [range, setRange] = useState('all');

  const today = todayISO();
  const weekAgo = iso(addDays(new Date(), -6));
  const totalStudents = room.students.length;

  /* attendance */
  const todayMarks = room.attendance[today] || {};
  const ids = room.students.map((s) => s.id);
  const attendancePercent = attendanceRate(todayMarks, ids);
  const unmarkedCount = room.students.filter((s) => !todayMarks[s.id]).length;
  const prevRates = Array.from({ length: 7 }, (_, i) => attendanceRate(room.attendance[iso(addDays(new Date(), -(i + 1)))], ids)).filter((v) => v != null);
  const prevAvg = prevRates.length ? prevRates.reduce((a, b) => a + b, 0) / prevRates.length : null;
  const attDelta = attendancePercent != null && prevAvg != null ? Math.round(attendancePercent - prevAvg) : null;

  /* fees */
  const totalFeesExpected = room.students.reduce((sum, s) => sum + (s.fee || 0), 0);
  const totalCollected = room.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalPending = Math.max(0, totalFeesExpected - totalCollected);
  const collectedWeek = room.payments.filter((p) => (p.date || '') >= weekAgo).reduce((sum, p) => sum + (p.amount || 0), 0);
  const studentsOwing = room.students
    .map((s) => {
      const paid = room.payments.filter((p) => p.studentId === s.id).reduce((sum, p) => sum + (p.amount || 0), 0);
      return { ...s, remaining: Math.max(0, (s.fee || 0) - paid) };
    })
    .filter((s) => s.remaining > 0);
  const overdue = studentsOwing.filter((s) => s.feeDate && s.feeDate < today);

  /* leads */
  const activeLeads = room.leads.filter((l) => l.status !== 'joined' && l.status !== 'dropped');
  const followUpsDue = activeLeads.filter((l) => l.followUp && l.followUp <= today);

  const addedThisWeek = room.students.filter((s) => (s.createdAt || '') >= weekAgo).length;

  /* header bits */
  const teacherName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Teacher';
  const todo = [
    totalStudents > 0 && unmarkedCount > 0 && { to: '/attendance', icon: CalendarCheck, text: `Mark attendance for ${unmarkedCount} student${unmarkedCount > 1 ? 's' : ''}` },
    overdue.length > 0 && { to: '/fees', icon: Wallet, text: `${overdue.length} fee${overdue.length > 1 ? 's' : ''} past due date` },
    followUpsDue.length > 0 && { to: '/leads', icon: Phone, text: `Call ${followUpsDue.length} inquir${followUpsDue.length > 1 ? 'ies' : 'y'} today` },
  ].filter(Boolean);

  const setup = [
    { done: !!room.institute?.name, label: 'Institute details', to: '/profile', icon: Building2 },
    { done: room.classes.length > 0, label: 'Classes & batches', to: '/classes', icon: GraduationCap },
    { done: totalStudents > 0, label: 'Add students', to: '/students', icon: Users },
    { done: Object.keys(room.attendance).length > 0, label: 'Mark attendance', to: '/attendance', icon: CalendarCheck },
  ];
  const setupDone = setup.filter((s) => s.done).length;

  /* calendar events: one chip per kind per day */
  const eventsFor = (dateISO) => {
    const out = [];
    const marks = room.attendance[dateISO];
    const vals = marks ? Object.values(marks).filter(Boolean) : [];
    if (vals.length) out.push({ id: 'att', slot: '09:30', tone: 'blue', label: `Roll call ${vals.filter((v) => v === 'P').length}/${vals.length}`, to: '/attendance' });
    const calls = activeLeads.filter((l) => l.followUp === dateISO);
    if (calls.length) out.push({ id: 'call', slot: '10:30', tone: 'yellow', label: calls.length === 1 ? `Call ${calls[0].name}` : `${calls.length} follow-up calls`, to: '/leads' });
    const dues = studentsOwing.filter((s) => s.feeDate === dateISO);
    if (dues.length) out.push({ id: 'due', slot: '11:00', tone: 'pink', label: dues.length === 1 ? `${dues[0].name} fee due` : `${dues.length} fees due`, to: '/fees' });
    const pays = room.payments.filter((p) => p.date === dateISO);
    if (pays.length) out.push({ id: 'pay', slot: '11:30', tone: 'lilac', label: `${pays.length} payment${pays.length > 1 ? 's' : ''} · ${compactMoney(pays.reduce((s, p) => s + (p.amount || 0), 0))}`, to: '/fees' });
    return out;
  };

  /* recently added students (newest first; older records without a date keep class order) */
  const q = query.trim().toLowerCase();
  const byNewest = [...room.students].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  const rows = (q
    ? byNewest.filter((s) => `${s.name} ${s.phone || ''} ${s.className || ''} ${s.section || ''}`.toLowerCase().includes(q)).slice(0, 8)
    : byNewest.slice(0, 5));
  const rowIds = rows.map((s) => s.id);
  const allPicked = rows.length > 0 && rowIds.every((id) => picked.has(id));
  const togglePick = (id) => setPicked((cur) => { const n = new Set(cur); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleAll = () => setPicked(allPicked ? new Set() : new Set(rowIds));
  const removeStudents = (list, label) => {
    if (!list.length || !window.confirm(`Delete ${label}? Their attendance and payments will be removed too.`)) return;
    list.forEach((id) => room.deleteStudent(id));
    setPicked(new Set());
  };

  const statusOf = (s) => (todayMarks[s.id] === 'P' ? { label: 'Present', dot: 'bg-neutral-900', tone: 'bg-neutral-900 text-white' }
    : todayMarks[s.id] === 'A' ? { label: 'Absent', dot: 'bg-white ring-1 ring-neutral-900', tone: 'bg-white text-neutral-900 ring-1 ring-inset ring-neutral-300' }
      : { label: 'Not marked', dot: 'bg-neutral-300', tone: 'bg-neutral-100 text-neutral-500' });

  /* recent activity from real records */
  const nameOf = (id) => room.students.find((s) => s.id === id)?.name || 'A student';
  const activity = [
    ...room.payments.map((p) => ({ key: `p${p.id}`, date: p.date || '', name: nameOf(p.studentId), before: '', after: ` paid ${formatMoney(p.amount)}` })),
    ...room.students.filter((s) => s.createdAt).map((s) => ({ key: `s${s.id}`, date: s.createdAt, name: s.name, before: 'New student ', after: ' added' })),
    ...room.leads.map((l) => ({ key: `l${l.id}`, date: l.createdAt || '', name: l.name, before: 'New inquiry from ', after: '' })),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);

  /* admissions breakdown */
  const cutoff = range === 'all' ? '' : iso(monthsAgo(Number(range)));
  const rangedLeads = room.leads.filter((l) => !cutoff || (l.createdAt || '') >= cutoff);
  const stages = LEAD_STAGES.map((s) => ({ ...s, count: rangedLeads.filter((l) => (l.status || 'new') === s.id).length }));
  const leadTotal = stages.reduce((sum, s) => sum + s.count, 0);

  const pendingText = totalPending >= 100000 ? compactMoney(totalPending) : formatMoney(totalPending);

  return (
    <div className="min-h-dvh bg-[#f4f4f5]">
      <AppHeader nav topBar={false} onSignOut={async () => { await signOut(); navigate('/login'); }} />

      <main className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7 pb-12">
        {/* top bar */}
        <div className="mb-6 flex items-center gap-3">
          <h1 className="hidden md:block text-[1.75rem] font-medium tracking-tight text-neutral-900">Dashboard</h1>
          <div className="ml-auto flex items-center gap-3 min-w-0 flex-1 md:flex-none justify-end">
            <label className="relative flex-1 md:flex-none md:w-80">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search students"
                aria-label="Search students"
                className="h-12 w-full rounded-full bg-white/80 pl-12 pr-4 text-[15px] text-neutral-900 placeholder:text-neutral-500 outline-none"
              />
            </label>
            <Notifications items={todo} />
            <Link to="/profile" title={teacherName} className="h-12 w-12 shrink-0 rounded-full bg-neutral-900 text-white grid place-items-center text-base font-semibold ring-2 ring-white shadow-sm">
              {teacherName.trim().charAt(0).toUpperCase()}
            </Link>
          </div>
        </div>

        {setupDone < setup.length && (
          <section className="mb-6 rounded-3xl p-5 sm:p-6" style={{ background: YELLOW }}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-medium text-neutral-900">Get started</h2>
              <span className="text-sm font-medium text-neutral-800/80">{setupDone} of {setup.length} done</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {setup.map(({ done, label, to, icon: Icon }, i) => (
                <Link key={to} to={to} className={`rounded-2xl p-3.5 flex items-center gap-3 transition ${done ? 'bg-white/40 text-neutral-700' : 'bg-white text-neutral-900 hover:-translate-y-0.5'}`}>
                  <span className="h-9 w-9 shrink-0 rounded-full grid place-items-center" style={{ background: done ? 'rgba(255,255,255,0.6)' : BLUE }}>
                    {done ? <CheckCircle2 className="w-5 h-5 text-[#005a9c]" /> : <Icon className="w-[18px] h-[18px]" />}
                  </span>
                  <span className="text-sm font-medium leading-snug"><span className="opacity-60 mr-1">{i + 1}.</span>{label}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
          {/* left column */}
          <div className="space-y-6 min-w-0">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatTile
                to="/students" label="Total Students" value={totalStudents.toLocaleString('en-IN')} bg={PINK} dark
                pill={<Pill dir={addedThisWeek ? 'up' : 'flat'}>{addedThisWeek ? `+${addedThisWeek}` : '0 new'}</Pill>}
              />
              <StatTile
                to="/fees" label="Fees Pending" value={pendingText} bg={YELLOW}
                pill={<Pill dir={collectedWeek ? 'up' : 'flat'}>{collectedWeek ? `${compactMoney(collectedWeek)} paid` : 'No payments'}</Pill>}
              />
              <StatTile
                to="/attendance" label="Today's Attendance" value={attendancePercent != null ? `${attendancePercent}%` : '—'} bg={BLUE}
                pill={attDelta == null ? <Pill>{attendancePercent == null ? 'Not marked' : 'No history'}</Pill> : <Pill dir={attDelta > 0 ? 'up' : attDelta < 0 ? 'down' : 'flat'}>{Math.abs(attDelta)}%</Pill>}
              />
            </div>

            <CalendarCard eventsFor={eventsFor} todayStr={today} />

            {/* recently added students */}
            <section className="rounded-3xl bg-white p-5 sm:p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <header className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-medium text-neutral-800">{q ? `Results for “${query.trim()}”` : 'Recently Added Student'}</h2>
                <div className="flex items-center gap-3">
                  {picked.size > 0 && (
                    <button type="button" onClick={() => removeStudents([...picked], `${picked.size} selected student${picked.size > 1 ? 's' : ''}`)}
                      className="h-8 px-3 rounded-full bg-neutral-900 text-white text-xs font-medium inline-flex items-center gap-1.5 hover:bg-neutral-800">
                      <Trash2 className="w-3.5 h-3.5" /> Delete {picked.size}
                    </button>
                  )}
                  <Link to="/students" className="text-sm text-neutral-500 hover:text-neutral-900 inline-flex items-center gap-1">View all <ChevronRight className="w-4 h-4" /></Link>
                </div>
              </header>

              {rows.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-neutral-200 py-10 text-center">
                  <p className="text-sm font-medium text-neutral-800">{q ? 'No student matches your search' : 'No students yet'}</p>
                  {!q && <Link to="/students" className="mt-3 inline-flex h-10 items-center rounded-full bg-[#005a9c] px-5 text-sm font-medium text-white transition hover:bg-[#1b365d]">Add your first student</Link>}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-neutral-200">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="bg-neutral-50/70 text-left text-[13px] font-medium text-neutral-600">
                        <th className="w-14 px-4 py-3"><input type="checkbox" checked={allPicked} onChange={toggleAll} aria-label="Select all" className="h-5 w-5 rounded-md accent-neutral-900" /></th>
                        <th className="px-3 py-3">Name</th>
                        <th className="px-3 py-3">Status today</th>
                        <th className="px-3 py-3">Phone</th>
                        <th className="px-3 py-3">Class</th>
                        <th className="px-3 py-3 w-24" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {rows.map((s) => {
                        const st = statusOf(s);
                        return (
                          <tr key={s.id} className="hover:bg-neutral-50/60">
                            <td className="px-4 py-3"><input type="checkbox" checked={picked.has(s.id)} onChange={() => togglePick(s.id)} aria-label={`Select ${s.name}`} className="h-5 w-5 rounded-md accent-neutral-900" /></td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <Avatar name={s.name} className="h-11 w-11 text-sm" />
                                <div className="min-w-0">
                                  <p className="font-medium text-neutral-900 truncate">{s.name}</p>
                                  <p className="text-[13px] text-neutral-500 truncate">{s.section ? `Batch ${s.section}` : s.className || '—'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${st.tone}`}><span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />{st.label}</span>
                            </td>
                            <td className="px-3 py-3 text-neutral-600 tabular-nums">{s.phone || <span className="text-neutral-400">—</span>}</td>
                            <td className="px-3 py-3">
                              {s.className ? <span className="inline-block rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700 ring-1 ring-inset ring-neutral-200">{s.className}</span> : <span className="text-neutral-400">—</span>}
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex items-center justify-end gap-1">
                                <button type="button" onClick={() => removeStudents([s.id], s.name)} aria-label={`Delete ${s.name}`} className="h-9 w-9 grid place-items-center rounded-lg text-neutral-500 hover:bg-neutral-900 hover:text-white"><Trash2 className="w-[18px] h-[18px]" /></button>
                                <Link to="/students" aria-label={`Edit ${s.name}`} className="h-9 w-9 grid place-items-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"><Pencil className="w-[18px] h-[18px]" /></Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          {/* right column */}
          <aside className="space-y-6 min-w-0">
            <section className="rounded-3xl bg-white/80 p-4 sm:p-5">
              <div className="grid grid-cols-2 gap-3">
                <Link to="/students" className="h-14 px-4 rounded-2xl flex items-center justify-between text-[15px] font-medium text-white bg-[#005a9c] hover:bg-[#1b365d] transition">
                  Add Student <Plus className="w-5 h-5" />
                </Link>
                <Link to="/fees" className="h-14 px-4 rounded-2xl flex items-center justify-between text-[15px] font-medium text-neutral-900 bg-white ring-1 ring-neutral-200 hover:bg-neutral-50 transition">
                  Record Fee <Plus className="w-5 h-5" />
                </Link>
                <Link to="/leads" className="col-span-2 h-14 px-4 rounded-2xl flex items-center justify-center gap-3 text-[15px] font-medium text-neutral-900 bg-white ring-1 ring-neutral-200 hover:bg-neutral-50 transition">
                  New Inquiry <Plus className="w-5 h-5" />
                </Link>
              </div>

              <h2 className="mt-7 mb-4 text-lg font-medium text-neutral-700">Recent Activity</h2>
              {activity.length === 0 ? (
                <p className="text-sm text-neutral-500">No activity yet.</p>
              ) : (
                <ul className="space-y-4">
                  {activity.map((a) => (
                    <li key={a.key} className="flex items-center gap-3 min-w-0">
                      <Avatar name={a.name} className="h-9 w-9 text-[11px]" />
                      <p className="min-w-0 truncate text-[15px] text-neutral-500" title={`${a.before}${a.name}${a.after}`}>
                        {a.before}<span className="font-medium text-neutral-900">{a.name}</span>{a.after}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-3xl bg-white/80 p-5 sm:p-6">
              <header className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-medium text-neutral-700">Admissions Breakdown</h2>
                <label className="relative inline-flex items-center text-sm text-neutral-500">
                  <select value={range} onChange={(e) => setRange(e.target.value)} aria-label="Period" className="appearance-none bg-transparent pr-5 outline-none cursor-pointer">
                    <option value="all">All time</option>
                    <option value="1">Last month</option>
                    <option value="3">Last 3 months</option>
                    <option value="6">Last 6 months</option>
                    <option value="12">Last year</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-0 w-4 h-4" />
                </label>
              </header>

              <RingChart segments={stages.map((s) => ({ value: s.count, color: s.color, label: s.label }))}>
                <div>
                  <p className="text-4xl font-medium tracking-tight text-neutral-900 tabular-nums">{leadTotal}</p>
                  <p className="text-sm text-neutral-500">Total inquiries</p>
                </div>
              </RingChart>

              <ul className="mt-6 space-y-3.5">
                {stages.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 text-[15px]">
                    <span className="h-5 w-5 rounded-md shrink-0" style={{ background: s.color }} />
                    <span className="flex-1 text-neutral-800">{s.label}</span>
                    <span className="text-neutral-500 tabular-nums">{s.count}</span>
                    <span className="h-4 w-px bg-neutral-200" />
                    <span className="w-11 text-right font-medium tabular-nums" style={{ color: s.text }}>{leadTotal ? Math.round((s.count / leadTotal) * 100) : 0}%</span>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
