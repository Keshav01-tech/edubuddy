import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  Check,
  FileText,
  Inbox,
  Laptop,
  Menu,
  MessageCircle,
  Smartphone,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const card =
  'bg-white rounded-[28px] ring-1 ring-slate-200/70 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_28px_56px_-28px_rgba(15,23,42,0.22)]';

const NAV = [
  ['#attendance', 'Attendance'],
  ['#fees', 'Fees'],
  ['#leads', 'Leads'],
  ['#tests', 'Tests'],
];

function useInView<T extends Element>() {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    if (!('IntersectionObserver' in window)) {
      setInView(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, inView] as const;
}

interface FeatureProps {
  id: string;
  number: string;
  label: string;
  question: string;
  title: string;
  benefit: string;
  accent: string;
  dot: string;
  tint: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
}

function Feature({ id, number, label, question, title, benefit, accent, dot, tint, extra, children }: FeatureProps) {
  const [ref, inView] = useInView<HTMLElement>();
  return (
    <section id={id} ref={ref} className={`scroll-mt-16 ${tint} ${inView ? 'is-in' : ''}`}>
      <div className="max-w-5xl mx-auto px-5 py-20 sm:py-28">
        <div className="reveal text-center max-w-3xl mx-auto">
          <p className={`inline-flex items-center gap-2 text-sm font-medium ${accent}`}>
            <span className={`h-7 px-2.5 rounded-full text-xs font-semibold grid place-items-center ${dot}`}>{number}</span>
            {label}
          </p>
          <p className="mt-5 text-lg sm:text-xl text-slate-500 text-balance">{question}</p>
          <h2 className="mt-2 text-[2rem] sm:text-5xl font-semibold tracking-tight leading-[1.08] text-slate-950 text-balance">{title}</h2>
        </div>

        <div
          className={`reveal mt-12 sm:mt-14 ${card} overflow-hidden grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] divide-y lg:divide-y-0 lg:divide-x divide-slate-100`}
          style={{ transitionDelay: '140ms' }}
        >
          {children}
        </div>

        {extra}

        <p className="reveal mt-8 mx-auto w-fit max-w-full flex items-start sm:items-center gap-3 rounded-3xl sm:rounded-full bg-white ring-1 ring-slate-200/80 shadow-sm px-4 sm:px-5 py-3 text-[15px] sm:text-base text-slate-700" style={{ transitionDelay: '260ms' }}>
          <span className={`h-7 w-7 shrink-0 rounded-full grid place-items-center ${dot}`}>
            <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
          </span>
          <span>
            <span className="font-semibold text-slate-900">Why it matters: </span>
            {benefit}
          </span>
        </p>
      </div>
    </section>
  );
}

function Panel({ kicker, title, children, className = '' }: { kicker: string; title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`p-6 sm:p-8 flex flex-col ${className}`}>
      <p className="text-xs text-slate-400">{kicker}</p>
      <p className="mt-1 font-medium text-slate-900">{title}</p>
      <div className="mt-6 flex-1 flex flex-col justify-center">{children}</div>
    </div>
  );
}

const week: [string, number][] = [
  ['Mon', 92],
  ['Tue', 88],
  ['Wed', 95],
  ['Thu', 81],
  ['Fri', 90],
  ['Sat', 94],
];

const octoberAbsent = [9, 21];
const octoberHolidays = [2, 20];
const dayState = (day: number) => {
  if ((day + 3) % 7 === 0) return 'off';
  if (octoberHolidays.includes(day)) return 'holiday';
  if (octoberAbsent.includes(day)) return 'absent';
  return 'present';
};
const dayStyle: Record<string, string> = {
  present: 'bg-emerald-500/85 text-white',
  absent: 'bg-rose-500 text-white',
  holiday: 'bg-amber-100 text-amber-800',
  off: 'bg-slate-100 text-slate-400',
};

function StudentReport() {
  const days = Array.from({ length: 31 }, (_, index) => index + 1);
  return (
    <div className={`reveal mt-5 ${card} overflow-hidden`} style={{ transitionDelay: '200ms' }}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 sm:px-8 py-4">
        <p className="text-sm font-medium text-slate-900">Sample report for one student</p>
        <p className="text-xs text-slate-400">October 2026</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
        <div className="p-6 sm:p-8 flex flex-col items-center text-center">
          <span className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-700 font-semibold grid place-items-center">AM</span>
          <p className="mt-3 font-semibold text-slate-950">Aarav Mehta</p>
          <p className="text-xs text-slate-500">Class 10-A · Roll no. 4</p>

          <div className="relative mt-6 h-36 w-36">
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#f1f5f9" strokeWidth="12" />
              <circle
                className="fade-late"
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="#10b981"
                strokeWidth="12"
                strokeLinecap="round"
                pathLength={100}
                strokeDasharray="92 100"
              />
            </svg>
            <span className="absolute inset-0 grid place-items-center">
              <span>
                <span className="block text-3xl font-semibold tracking-tight text-slate-950">92%</span>
                <span className="block text-[11px] text-slate-500">attendance</span>
              </span>
            </span>
          </div>

          <div className="mt-6 grid w-full grid-cols-3 gap-2">
            {[
              ['Present', '23', 'text-emerald-700'],
              ['Absent', '2', 'text-rose-600'],
              ['Holidays', '2', 'text-amber-700'],
            ].map(([label, value, color]) => (
              <div key={label} className="rounded-2xl bg-slate-50 py-3">
                <p className={`text-xl font-semibold ${color}`}>{value}</p>
                <p className="text-[11px] text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((name) => (
              <span key={name} className="text-[10px] sm:text-[11px] text-slate-400">{name}</span>
            ))}
            {Array.from({ length: 4 }, (_, index) => (
              <span key={`blank-${index}`} />
            ))}
            {days.map((day) => (
              <span
                key={day}
                className={`aspect-square rounded-lg sm:rounded-xl grid place-items-center text-[11px] sm:text-xs font-medium ${dayStyle[dayState(day)]}`}
              >
                {day}
              </span>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-slate-500">
            {[
              ['Present', 'bg-emerald-500/85'],
              ['Absent', 'bg-rose-500'],
              ['Holiday', 'bg-amber-200'],
              ['Sunday', 'bg-slate-200'],
            ].map(([label, color]) => (
              <span key={label} className="inline-flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AttendanceVisual() {
  return (
    <>
      <Panel kicker="Attendance report" title="Class 10-A · This week">
        <div className="flex items-end gap-3 sm:gap-5">
          {week.map(([day, value], index) => (
            <div key={day} className="flex-1 flex flex-col items-center gap-2">
              <span className="fade-late text-[11px] font-medium text-slate-500">{value}%</span>
              <div className="w-full h-40 flex items-end justify-center">
                <div
                  className={`grow-y w-full max-w-11 rounded-xl ${day === 'Thu' ? 'bg-emerald-200' : 'bg-emerald-500/85'}`}
                  style={{ height: `${(value - 50) * 2}%`, transitionDelay: `${index * 90}ms` }}
                />
              </div>
              <span className="text-[11px] text-slate-400">{day}</span>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-slate-500">
          Average this week: <span className="font-medium text-slate-900">90%</span>
        </p>
      </Panel>

      <Panel kicker="When someone is absent" title="You send the parent a message" className="bg-slate-50/60">
        <div className="rounded-2xl bg-white ring-1 ring-slate-200/80 p-4">
          <div className="flex items-center gap-3">
            <span className="h-9 w-9 shrink-0 rounded-full bg-rose-50 text-rose-700 text-sm font-semibold grid place-items-center">R</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900">Riya Sharma</p>
              <p className="text-xs text-rose-600">Absent today</p>
            </div>
            <span className="h-8 px-3 shrink-0 rounded-full bg-emerald-600 text-white text-xs font-medium inline-flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
              Send
            </span>
          </div>
        </div>
        <div className="fade-late mt-4 ml-auto max-w-[88%] rounded-2xl rounded-br-md bg-[#d9fdd3] px-4 py-3">
          <p className="text-sm leading-snug text-slate-800">Dear parent, Riya is not attending class today (4 Nov).</p>
          <p className="mt-1 text-right text-[10px] text-slate-500">WhatsApp · 9:42 am</p>
        </div>
      </Panel>
    </>
  );
}

const weeksX = [24, 168, 312, 456];
const toY = (value: number) => (132 - (value / 150) * 112).toFixed(1);
const linePath = (values: number[]) => `M${values.map((v, i) => `${weeksX[i]},${toY(v)}`).join(' L')}`;
const thisMonth = [26, 60, 98, 142];
const lastMonth = [20, 48, 80, 120];

function FeesVisual() {
  return (
    <>
      <Panel kicker="Fees report" title="November, week by week">
        <svg viewBox="0 0 480 152" className="w-full h-auto" role="img" aria-label="This month's fees are above last month's every week">
          <defs>
            <linearGradient id="fees-area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[20, 57, 94, 132].map((y) => (
            <line key={y} x1="12" x2="468" y1={y} y2={y} stroke="#f1f5f9" />
          ))}
          <path className="fade-late" d={`M24,132 L${thisMonth.map((v, i) => `${weeksX[i]},${toY(v)}`).join(' L')} L456,132 Z`} fill="url(#fees-area)" />
          <path className="fade-late" d={linePath(lastMonth)} fill="none" stroke="#cbd5e1" strokeWidth="2.5" strokeDasharray="5 6" />
          <path className="trace" pathLength={1} d={linePath(thisMonth)} fill="none" stroke="#d97706" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {thisMonth.map((v, i) => (
            <circle key={weeksX[i]} className="fade-late" cx={weeksX[i]} cy={toY(v)} r="4.5" fill="#fff" stroke="#d97706" strokeWidth="2.5" />
          ))}
          {['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((label, i) => (
            <text key={label} x={weeksX[i]} y="149" textAnchor="middle" fontSize="10" fill="#94a3b8" fontFamily="Poppins, sans-serif">
              {label}
            </text>
          ))}
        </svg>
        <div className="mt-4 flex items-center gap-5 text-xs text-slate-500">
          <span className="inline-flex items-center gap-2"><span className="h-0.5 w-5 rounded-full bg-amber-600" />This month</span>
          <span className="inline-flex items-center gap-2"><span className="w-5 border-t-2 border-dashed border-slate-300" />Last month</span>
        </div>
      </Panel>

      <Panel kicker="Growth" title="This month vs last month" className="bg-slate-50/60">
        <p className="text-5xl font-semibold tracking-tight text-emerald-600">+18%</p>
        <p className="mt-1 text-sm text-slate-500">more fees collected</p>
        <div className="mt-7 space-y-4">
          {[
            ['October', '₹1,20,000', 84, 'bg-slate-300'],
            ['November', '₹1,42,000', 100, 'bg-amber-500'],
          ].map(([month, amount, width, color], index) => (
            <div key={String(month)}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{month}</span>
                <span className="font-medium text-slate-900">{amount}</span>
              </div>
              <div className="mt-2 h-2.5 rounded-full bg-white ring-1 ring-slate-100 overflow-hidden">
                <div className={`grow-x h-full rounded-full ${color}`} style={{ width: `${width}%`, transitionDelay: `${300 + index * 150}ms` }} />
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}

const funnel: [string, number, string][] = [
  ['New inquiries', 24, 'bg-violet-200'],
  ['Contacted', 16, 'bg-violet-300'],
  ['Visit planned', 9, 'bg-violet-400'],
  ['Joined', 6, 'bg-violet-600'],
];

function LeadsVisual() {
  return (
    <>
      <Panel kicker="Admissions · This month" title="From first call to joining">
        <div className="space-y-5">
          {funnel.map(([label, count, color], index) => (
            <div key={label} className="grid grid-cols-[6.5rem_1fr_2rem] sm:grid-cols-[8rem_1fr_2rem] items-center gap-3">
              <span className="text-sm text-slate-600">{label}</span>
              <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                <div className={`grow-x h-full rounded-full ${color}`} style={{ width: `${(count / 24) * 100}%`, transitionDelay: `${index * 120}ms` }} />
              </div>
              <span className="text-right text-sm font-medium text-slate-900">{count}</span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel kicker="Follow up today" title="Who to call next" className="bg-slate-50/60">
        <ul className="space-y-3">
          {[
            ["Kabir's parent", 'Class 9 · Asked about fees'],
            ['Ananya Rao', 'Class 7 · Came to the centre'],
          ].map(([name, detail]) => (
            <li key={name} className="rounded-2xl bg-white ring-1 ring-slate-200/80 p-4 flex items-center gap-3">
              <span className="h-9 w-9 shrink-0 rounded-full bg-violet-50 text-violet-700 text-sm font-semibold grid place-items-center">{name[0]}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900 truncate">{name}</p>
                <p className="text-xs text-slate-500 truncate">{detail}</p>
              </div>
              <span className="h-8 px-3.5 shrink-0 rounded-full bg-slate-900 text-white text-xs font-medium inline-flex items-center">Call</span>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}

const testSteps: [string, string][] = [
  ['Pick the class', '0:30'],
  ['Pick the chapter', '1:30'],
  ['Set the marks', '2:30'],
  ['Print the paper', '5:00'],
];

function TestVisual() {
  return (
    <>
      <Panel kicker="Your paper" title="Class 10 · Science · 20 marks">
        <div className="rounded-2xl bg-[#fbfaf7] ring-1 ring-slate-200/80 p-5 sm:p-6">
          <p className="text-center text-[10px] uppercase tracking-[0.18em] text-slate-400">Weekly test · Chemical Reactions</p>
          <div className="mt-5 space-y-4">
            {[
              ['A', 'Multiple choice', '6 × 1', [92, 70]],
              ['B', 'Short answer', '3 × 3', [88, 64]],
              ['C', 'Long answer', '1 × 5', [94]],
            ].map(([letter, kind, marks, lines], index) => (
              <div key={String(letter)}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-800">Section {letter} · {kind}</span>
                  <span className="text-slate-400">{marks}</span>
                </div>
                <div className="mt-2 space-y-1.5">
                  {(lines as number[]).map((width, line) => (
                    <div
                      key={line}
                      className="grow-x h-1.5 rounded-full bg-slate-200/80"
                      style={{ width: `${width}%`, transitionDelay: `${index * 160 + line * 80}ms` }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      <Panel kicker="Ready in 5 minutes" title="Four easy steps" className="bg-slate-50/60">
        <ol className="relative space-y-5 pl-8">
          <span className="absolute left-[11px] top-2 bottom-2 w-px bg-slate-200" aria-hidden="true" />
          {testSteps.map(([step, time], index) => (
            <li key={step} className="relative">
              <span
                className="fade-late absolute -left-8 top-0 h-6 w-6 rounded-full bg-brand-600 text-white text-[11px] font-semibold grid place-items-center"
                style={{ transitionDelay: `${600 + index * 200}ms` }}
              >
                {index + 1}
              </span>
              <p className="text-sm font-medium text-slate-900">{step}</p>
              <p className="text-xs text-slate-400">{time} min</p>
            </li>
          ))}
        </ol>
        <p className="mt-6 inline-flex items-center gap-2 text-sm text-slate-600">
          <Smartphone className="w-4 h-4 text-brand-700" aria-hidden="true" />
          <Laptop className="w-4 h-4 text-brand-700" aria-hidden="true" />
          On your phone or laptop
        </p>
      </Panel>
    </>
  );
}

function PhoneScreen() {
  return (
    <div className="relative mx-auto w-[270px] sm:w-[290px] rounded-[46px] bg-slate-950 p-2.5 shadow-[0_50px_90px_-40px_rgba(15,23,42,0.6)]">
      <div className="relative overflow-hidden rounded-[38px] bg-[#f6f5f2]">
        <div className="absolute left-1/2 top-2.5 h-5 w-24 -translate-x-1/2 rounded-full bg-slate-950" aria-hidden="true" />
        <div className="px-5 pt-11 pb-4">
          <p className="text-[11px] text-slate-400">Wednesday, 4 Nov</p>
          <p className="text-lg font-semibold text-slate-950">Good morning, Priya</p>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {[
              ['Present', '28/30', 'text-emerald-700'],
              ['Fees', '₹1.42L', 'text-amber-700'],
              ['To call', '4', 'text-violet-700'],
              ['Tests', '3', 'text-brand-700'],
            ].map(([label, value, color]) => (
              <div key={label} className="rounded-2xl bg-white p-3 ring-1 ring-slate-200/70">
                <p className="text-[10px] text-slate-400">{label}</p>
                <p className={`mt-0.5 text-base font-semibold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          <p className="mt-5 text-[11px] font-medium text-slate-500">Needs you today</p>
          <ul className="mt-2 space-y-2">
            {[
              ['Riya is absent', 'Send', 'bg-emerald-600'],
              ['Kabir’s fee is due', 'Collect', 'bg-amber-500'],
              ['Call Ananya’s parent', 'Call', 'bg-slate-900'],
            ].map(([text, action, color]) => (
              <li key={text} className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2.5 ring-1 ring-slate-200/70">
                <span className="min-w-0 flex-1 truncate text-[12px] text-slate-700">{text}</span>
                <span className={`h-6 px-2.5 rounded-full text-[10px] font-semibold text-white inline-flex items-center ${color}`}>{action}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="grid grid-cols-4 border-t border-slate-200/80 bg-white px-2 pt-2.5 pb-4">
          {[CalendarCheck, Wallet, Inbox, FileText].map((Icon, index) => (
            <span key={index} className={`grid place-items-center ${index === 0 ? 'text-brand-700' : 'text-slate-400'}`}>
              <Icon className="w-5 h-5" aria-hidden="true" />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const phoneNotes = [
  { icon: MessageCircle, color: 'bg-emerald-50 text-emerald-700', title: 'Parent informed', text: 'Riya absent today', place: 'top-6 -translate-x-[calc(50%+215px)]', delay: '0s' },
  { icon: Wallet, color: 'bg-amber-50 text-amber-700', title: 'Fee received', text: '₹1,500 · Aarav', place: 'top-40 translate-x-[calc(-50%+200px)]', delay: '-1.5s' },
  { icon: Inbox, color: 'bg-violet-50 text-violet-700', title: 'New inquiry', text: 'Class 8 · Walk-in', place: 'bottom-36 -translate-x-[calc(50%+215px)]', delay: '-3s' },
  { icon: FileText, color: 'bg-brand-50 text-brand-700', title: 'Test ready', text: 'Class 10 · 5 min', place: 'bottom-10 translate-x-[calc(-50%+195px)]', delay: '-4.5s' },
];

function PhoneVisual() {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-brand-100 via-white to-amber-50 blur-2xl" aria-hidden="true" />
      <div className="relative">
        <PhoneScreen />
      </div>
      {phoneNotes.map(({ icon: Icon, color, title, text, place, delay }, index) => (
        <div
          key={title}
          className={`reveal absolute left-1/2 ${place} hidden md:block`}
          style={{ transitionDelay: `${400 + index * 150}ms` }}
        >
          <div className="float-soft flex items-center gap-2.5 rounded-2xl bg-white px-3.5 py-2.5 shadow-card ring-1 ring-slate-200/70" style={{ animationDelay: delay }}>
            <span className={`h-8 w-8 rounded-full grid place-items-center ${color}`}>
              <Icon className="w-4 h-4" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-xs font-semibold text-slate-900 whitespace-nowrap">{title}</span>
              <span className="block text-[11px] text-slate-500 whitespace-nowrap">{text}</span>
            </span>
          </div>
        </div>
      ))}
      <ul className="relative mt-6 grid grid-cols-2 gap-2.5 md:hidden">
        {phoneNotes.map(({ icon: Icon, color, title, text }) => (
          <li key={title} className="flex items-center gap-2.5 rounded-2xl bg-white p-3 ring-1 ring-slate-200/70">
            <span className={`h-8 w-8 shrink-0 rounded-full grid place-items-center ${color}`}>
              <Icon className="w-4 h-4" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-semibold text-slate-900 truncate">{title}</span>
              <span className="block text-[11px] text-slate-500 truncate">{text}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ZaplinePage() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [heroRef, heroIn] = useInView<HTMLElement>();
  const [endRef, endIn] = useInView<HTMLElement>();
  const appHref = user ? '/dashboard' : '/login';

  useEffect(() => {
    document.title = 'EduBuddy · Attendance, fees, leads and tests';
  }, []);

  const close = () => setMenuOpen(false);

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[#f6f5f2] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-[#f6f5f2]/85 backdrop-blur-md">
        <div className="max-w-6xl mx-auto h-16 px-5 flex items-center justify-between gap-4">
          <a href="#top" className="flex items-center gap-2.5 shrink-0">
            <span className="h-8 w-8 rounded-lg bg-brand-700 text-white text-sm font-semibold grid place-items-center">E</span>
            <span className="font-semibold tracking-tight">EduBuddy</span>
          </a>
          <nav className="hidden md:flex items-center gap-1 text-sm text-slate-600" aria-label="Page">
            {NAV.map(([href, label]) => (
              <a key={href} href={href} className="h-9 px-3.5 inline-flex items-center rounded-full hover:bg-white hover:text-slate-900">
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <Link to="/login" className="hidden sm:inline-flex h-10 px-3 items-center text-sm text-slate-600 hover:text-slate-900">Log in</Link>
            <Link to={appHref} className="h-10 px-4 inline-flex items-center rounded-full bg-slate-950 hover:bg-slate-800 text-white text-sm font-semibold">
              {user ? 'Open app' : 'Start free'}
            </Link>
            <button
              type="button"
              className="md:hidden h-10 w-10 grid place-items-center rounded-full text-slate-700"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav className="md:hidden border-t border-slate-200 bg-white px-5 py-2" aria-label="Page">
            {NAV.map(([href, label]) => (
              <a key={href} href={href} onClick={close} className="block py-3 text-sm border-b border-slate-100">{label}</a>
            ))}
            <Link to="/contact" onClick={close} className="block py-3 text-sm border-b border-slate-100">Contact</Link>
            <Link to="/login" onClick={close} className="block py-3 text-sm">Log in</Link>
          </nav>
        )}
      </header>

      <main id="top">
        <section ref={heroRef} className={`relative ${heroIn ? 'is-in' : ''}`}>
          <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-brand-200/45 blur-3xl drift" aria-hidden="true" />
          <div className="pointer-events-none absolute top-24 -right-24 h-96 w-96 rounded-full bg-amber-100/80 blur-3xl drift-slow" aria-hidden="true" />
          <div className="relative max-w-6xl mx-auto px-5 pt-12 pb-20 sm:pt-16 sm:pb-24 grid grid-cols-1 lg:grid-cols-[1fr_1.05fr] gap-12 lg:gap-8 items-center">
            <div className="reveal text-center lg:text-left">
              <p className="inline-flex items-center gap-2 h-8 px-3 rounded-full bg-white/80 ring-1 ring-slate-200 text-xs font-medium text-slate-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                For tuition and coaching institutes
              </p>
              <h1 className="mt-6 text-[2.5rem] sm:text-6xl font-semibold tracking-tight leading-[1.06] text-slate-950 text-balance">
                Your whole institute,
                <br />
                <span className="text-brand-700">on your phone.</span>
              </h1>
              <p className="mt-5 text-base sm:text-lg leading-relaxed text-slate-600 max-w-md mx-auto lg:mx-0 text-balance">
                Attendance, fees, admissions, and tests. See everything in one place.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row justify-center lg:justify-start gap-3">
                <Link to={appHref} className="h-12 px-7 inline-flex items-center justify-center rounded-full bg-slate-950 hover:bg-slate-800 text-white font-semibold">
                  {user ? 'Open the app' : 'Start free'}
                </Link>
                <a href="#attendance" className="h-12 px-7 inline-flex items-center justify-center rounded-full bg-white ring-1 ring-slate-200 hover:ring-slate-300 font-semibold text-slate-800">
                  See how it works
                </a>
              </div>
              <ul className="mt-7 flex flex-wrap justify-center lg:justify-start gap-x-6 gap-y-2 text-sm text-slate-500">
                {['Free to start', 'Easy to set up', 'Works on any phone'].map((item) => (
                  <li key={item} className="inline-flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="reveal" style={{ transitionDelay: '150ms' }}>
              <PhoneVisual />
            </div>
          </div>
        </section>

        <Feature
          id="attendance"
          number="01"
          label="Attendance"
          question="Do parents know when their child misses class?"
          title="Parents hear from you the same day."
          benefit="parents trust an institute that keeps them informed, and they recommend it to others."
          accent="text-emerald-700"
          dot="bg-emerald-50 text-emerald-700"
          tint="bg-white"
          extra={<StudentReport />}
        >
          <AttendanceVisual />
        </Feature>

        <Feature
          id="fees"
          number="02"
          label="Fees"
          question="Do you know exactly how much fee is still pending?"
          title="Collect every rupee, and see it grow."
          benefit="no fee gets forgotten, and you can see your institute growing."
          accent="text-amber-700"
          dot="bg-amber-50 text-amber-700"
          tint="bg-[#f6f5f2]"
        >
          <FeesVisual />
        </Feature>

        <Feature
          id="leads"
          number="03"
          label="Leads"
          question="How many admission calls did you forget to call back?"
          title="Turn more inquiries into admissions."
          benefit="every inquiry you follow up on is a chance at one more student."
          accent="text-violet-700"
          dot="bg-violet-50 text-violet-700"
          tint="bg-white"
        >
          <LeadsVisual />
        </Feature>

        <Feature
          id="tests"
          number="04"
          label="Tests"
          question="How many hours does one test paper take you?"
          title="A ready test paper in 5 minutes."
          benefit="regular tests mean better results, and better results bring more admissions."
          accent="text-brand-700"
          dot="bg-brand-50 text-brand-700"
          tint="bg-[#f6f5f2]"
        >
          <TestVisual />
        </Feature>
        <section ref={endRef} className={`bg-white ${endIn ? 'is-in' : ''}`}>
          <div className="max-w-6xl mx-auto px-5 py-20 sm:py-28">
            <div className="reveal relative overflow-hidden rounded-[32px] bg-slate-950 px-6 py-14 sm:px-14 sm:py-20 text-center">
              <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-64 w-[36rem] max-w-full rounded-full bg-brand-500/30 blur-3xl" aria-hidden="true" />
              <h2 className="relative text-3xl sm:text-5xl font-semibold tracking-tight text-white text-balance">Ready to grow your institute?</h2>
              <p className="relative mt-4 text-base sm:text-lg text-slate-300 max-w-md mx-auto text-balance">
                Happier parents, fees on time, more admissions, and better tests. Start free today.
              </p>
              <Link to={appHref} className="relative mt-8 h-12 px-7 inline-flex items-center justify-center rounded-full bg-white hover:bg-slate-100 text-slate-950 font-semibold">
                {user ? 'Open the app' : 'Start free'}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-slate-200/80">
        <div className="max-w-6xl mx-auto px-5 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-slate-500">
          <p className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-md bg-brand-700 text-white text-[11px] font-semibold grid place-items-center">E</span>
            EduBuddy
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {NAV.map(([href, label]) => (
              <a key={href} href={href} className="hover:text-slate-900">{label}</a>
            ))}
            <Link to="/contact" className="hover:text-slate-900">Contact</Link>
            <Link to="/login" className="hover:text-slate-900">Log in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
