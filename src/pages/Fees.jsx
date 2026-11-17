import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Printer, Receipt, Trash2, Wallet, X, ChevronDown, Search, CheckCircle2, Plus, CalendarDays, AlertCircle, GraduationCap, ScanLine, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppHeader } from '../components/AppHeader';
import { SetupModal } from '../components/SetupModal';
import { useClassroom, todayISO, formatMoney, formatDate } from '../services/classroom';
import { Panel, EmptyState, compactMoney, Initials, Picker } from '../components/ui';
import { describeStudentBatches, studentBatchDetails } from '../services/teachers';
import { StudentBatches } from '../components/StudentBatches';
import { ReceiptPhoto } from './ScanReceipt';

const field = 'w-full h-11 px-3 text-base bg-white rounded-xl ring-1 ring-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-400 placeholder:text-neutral-400';
const MODES = ['Cash', 'UPI', 'Bank transfer', 'Cheque'];

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-neutral-900/40 p-0 sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-full sm:max-w-md max-h-[92dvh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl shadow-xl">
        <div className="no-print flex items-center justify-between px-5 pt-4 pb-2">
          <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
          <button type="button" onClick={onClose} className="h-10 w-10 -mr-2 grid place-items-center rounded-xl text-neutral-400 hover:bg-neutral-100" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function PaymentForm({ student, due, onSave }) {
  const [amount, setAmount] = useState(due > 0 ? String(due) : '');
  const [date, setDate] = useState(todayISO());
  const [mode, setMode] = useState('Cash');
  const [note, setNote] = useState('');
  const value = Number(amount);

  return (
    <form
      className="px-5 pb-5 space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (value > 0) onSave({ studentId: student.id, amount: value, date, mode, note: note.trim() });
      }}
    >
      <p className="text-sm text-neutral-500">
        {student.name} · Due {formatMoney(due)}
      </p>
      <label className="block">
        <span className="block text-xs font-medium text-neutral-500 mb-1">Amount (₹)</span>
        <input className={field} value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))} inputMode="decimal" autoFocus required />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="block text-xs font-medium text-neutral-500 mb-1">Date</span>
          <input type="date" className={field} value={date} onChange={(e) => setDate(e.target.value || todayISO())} />
        </label>
        <label className="block">
          <span className="block text-xs font-medium text-neutral-500 mb-1">Paid by</span>
          <select className={field} value={mode} onChange={(e) => setMode(e.target.value)}>
            {MODES.map((m) => <option key={m}>{m}</option>)}
          </select>
        </label>
      </div>
      <label className="block">
        <span className="block text-xs font-medium text-neutral-500 mb-1">Note (optional)</span>
        <input className={field} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. April fee" />
      </label>
      <button type="submit" disabled={!(value > 0)} className="w-full h-12 rounded-xl bg-[#005a9c] hover:bg-[#1b365d] text-white font-semibold disabled:opacity-40 inline-flex items-center justify-center gap-2">
        <Receipt className="w-4 h-4" /> Save and make receipt
      </button>
    </form>
  );
}

function ReceiptView({ payment, student, institute, school, paidTotal, classes = [] }) {
  const inst = institute || {};
  const name = inst.name || school || 'Fee Receipt';
  const due = Math.max(0, (student?.fee || 0) - paidTotal);
  const fullAddress = [inst.address, inst.city, inst.state && `${inst.state} ${inst.pincode}`]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="px-5 pb-5">
      <div className="receipt-print rounded-xl ring-1 ring-neutral-200 p-5 text-neutral-900 bg-white">
        <div className="text-center border-b border-dashed border-neutral-300 pb-3">
          {inst.logo && (
            <img src={inst.logo} alt="Logo" className="h-12 w-auto mx-auto object-contain mb-1.5" />
          )}
          <p className="text-lg font-bold tracking-tight">{name}</p>
          {inst.tagline && <p className="text-xs text-neutral-500 italic mt-0.5">{inst.tagline}</p>}
          {fullAddress && <p className="text-[11px] text-neutral-500 mt-0.5">{fullAddress}</p>}
          {inst.phone && <p className="text-[11px] text-neutral-500">Phone: {inst.phone}</p>}
          <p className="text-[11px] uppercase tracking-widest text-neutral-400 font-semibold mt-1">Fee Receipt</p>
        </div>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
          <dt className="text-neutral-500">Receipt no.</dt><dd className="text-right font-medium">{payment.receiptNo}</dd>
          <dt className="text-neutral-500">Date</dt><dd className="text-right">{formatDate(payment.date)}</dd>
          <dt className="text-neutral-500">Student</dt><dd className="text-right font-medium">{student?.name || 'Deleted student'}</dd>
          {student?.className && (<><dt className="text-neutral-500">Class</dt><dd className="text-right">{student.className}</dd></>)}
          {student && studentBatchDetails(student, classes).length > 0 && (<><dt className="text-neutral-500">Batches</dt><dd className="text-right">{studentBatchDetails(student, classes).map((b) => [b.section, b.subject].filter(Boolean).join(' ')).join(', ')}</dd></>)}
          <dt className="text-neutral-500">Paid by</dt><dd className="text-right">{payment.mode}</dd>
          {payment.note && (<><dt className="text-neutral-500">For</dt><dd className="text-right">{payment.note}</dd></>)}
        </dl>
        <div className="mt-4 rounded-lg bg-neutral-50 px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium">Amount received</span>
          <span className="text-xl font-bold">{formatMoney(payment.amount)}</span>
        </div>
        {student?.fee > 0 && (
          <p className="mt-2 text-xs text-neutral-500 text-right">
            Total fee {formatMoney(student.fee)} · Paid so far {formatMoney(paidTotal)} · Balance {formatMoney(due)}
          </p>
        )}
        <div className="mt-8 flex justify-end">
          <p className="w-44 border-t border-neutral-300 pt-1 text-center text-xs text-neutral-500">
            {inst.principalName ? `Authorized Signatory\n(${inst.principalName})` : 'Authorized Signatory'}
          </p>
        </div>
      </div>
      <button type="button" onClick={() => window.print()} className="no-print mt-4 w-full h-12 rounded-xl bg-[#005a9c] hover:bg-[#1b365d] text-white font-semibold inline-flex items-center justify-center gap-2 shadow-sm">
        <Printer className="w-4 h-4" /> Print or save PDF
      </button>
    </div>
  );
}

const DAY = 86400000;
const daysBetween = (fromIso, toIso) => Math.round((new Date(`${toIso}T00:00:00`) - new Date(`${fromIso}T00:00:00`)) / DAY);
const monthKey = (iso) => (iso || '').slice(0, 7);
const prevMonth = (iso) => {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/** Picks any student before recording a payment. Students who owe come first. */
function StudentChooser({ students, owedBy, onPick, classes = [] }) {
  const [q, setQ] = useState('');
  const term = q.trim().toLowerCase();
  const list = students.filter((s) => !term || `${s.name} ${describeStudentBatches(s, classes)}`.toLowerCase().includes(term));
  return (
    <div className="px-5 pb-5">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input className={`${field} pl-9`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search student" aria-label="Search student" autoFocus />
      </div>
      <ul className="mt-3 max-h-80 overflow-y-auto divide-y divide-neutral-100 rounded-xl ring-1 ring-neutral-200">
        {list.length === 0 && <li className="px-3 py-6 text-center text-sm text-neutral-500">No student found.</li>}
        {list.map((s) => {
          const due = owedBy(s);
          return (
            <li key={s.id}>
              <button type="button" onClick={() => onPick(s)} className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-neutral-50">
                <Initials name={s.name} className="h-8 w-8 text-[11px] shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-neutral-900 truncate">{s.name}</span>
                  <span className="block text-xs text-neutral-500 truncate">{describeStudentBatches(s, classes) || 'No class'}</span>
                </span>
                <span className={`shrink-0 text-sm font-semibold tabular-nums ${due > 0 ? 'text-rose-600' : 'text-neutral-400'}`}>{due > 0 ? formatMoney(due) : 'Paid'}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Bar({ value, max, tone = '#005a9c', className = 'h-1.5' }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className={`${className} rounded-full bg-neutral-100 overflow-hidden`}>
      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: tone }} />
    </div>
  );
}

export default function Fees() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const room = useClassroom();
  const [paying, setPaying] = useState(null);
  const [choosing, setChoosing] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [open, setOpen] = useState(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('pending');
  const [classFilter, setClassFilter] = useState('all');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [photo, setPhoto] = useState(null);
  const canDelete = !room.isReceptionist;
  const canScan = !room.isTeacher;

  const paidBy = (id) => room.payments.filter((p) => p.studentId === id).reduce((sum, p) => sum + p.amount, 0);
  const totalFee = room.students.reduce((sum, s) => sum + (s.fee || 0), 0);
  const collected = room.payments.reduce((sum, p) => sum + p.amount, 0);
  const owedBy = (student) => Math.max(0, (student.fee || 0) - paidBy(student.id));
  const owing = room.students.filter((student) => owedBy(student) > 0);
  const settled = room.students.filter((student) => (student.fee || 0) > 0 && owedBy(student) === 0);
  const pending = owing.reduce((sum, student) => sum + owedBy(student), 0);
  const studentOf = (id) => room.students.find((s) => s.id === id);
  const historyOf = (id) => room.payments.filter((p) => p.studentId === id);
  const paidUpTo = (payment) => {
    const history = historyOf(payment.studentId);
    return history.slice(Math.max(0, history.findIndex((p) => p.id === payment.id))).reduce((sum, p) => sum + p.amount, 0);
  };

  const today = todayISO();
  const isLate = (s) => owedBy(s) > 0 && s.feeDate && s.feeDate < today;
  // Students who still owe come first (past-due ones first, then the biggest amounts).
  const rank = (s) => (owedBy(s) > 0 ? (isLate(s) ? 2 : 1) : 0);
  const byOutstanding = (a, b) => rank(b) - rank(a) || owedBy(b) - owedBy(a);
  const late = owing.filter(isLate);
  const lateAmount = late.reduce((sum, s) => sum + owedBy(s), 0);

  const thisMonth = room.payments.filter((p) => monthKey(p.date) === monthKey(today));
  const lastMonth = room.payments.filter((p) => monthKey(p.date) === prevMonth(today));
  const sumOf = (list) => list.reduce((sum, p) => sum + p.amount, 0);
  const monthNow = sumOf(thisMonth);
  const monthBefore = sumOf(lastMonth);
  const monthChange = monthBefore ? Math.round(((monthNow - monthBefore) / monthBefore) * 100) : null;
  const rate = totalFee ? Math.min(100, Math.round((collected / totalFee) * 100)) : 0;

  const classNames = [...new Set(room.students.map((s) => s.className).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const byClass = classNames.map((name) => {
    const list = room.students.filter((s) => s.className === name);
    const fee = list.reduce((sum, s) => sum + (s.fee || 0), 0);
    const paid = list.reduce((sum, s) => sum + Math.min(s.fee || 0, paidBy(s.id)), 0);
    return { name, fee, paid, owing: list.filter((s) => owedBy(s) > 0).length };
  });
  const modes = Object.entries(room.payments.reduce((acc, p) => ({ ...acc, [p.mode || 'Other']: (acc[p.mode || 'Other'] || 0) + p.amount }), {}))
    .sort((a, b) => b[1] - a[1]);
  const recent = [...room.payments].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 7);

  const term = query.trim().toLowerCase();
  const inStatus = (s, id) => (id === 'pending' ? owedBy(s) > 0 : id === 'paid' ? (s.fee || 0) > 0 && owedBy(s) === 0 : true);
  const visible = [...room.students].sort(byOutstanding).filter((student) => {
    const matches = !term || [student.name, describeStudentBatches(student, room.classes), student.roll].join(' ').toLowerCase().includes(term);
    const inClass = classFilter === 'all' || student.className === classFilter;
    return matches && inClass && inStatus(student, status);
  });

  const dueStatus = (s) => {
    if (!s.fee) return { text: 'No fee set', tone: 'text-neutral-400' };
    if (owedBy(s) === 0) return { text: 'Paid in full', tone: 'bg-[#e6f5ee] text-[#17653a]', pill: true };
    if (!s.feeDate) return { text: 'No due date', tone: 'text-neutral-500' };
    const d = daysBetween(today, s.feeDate);
    if (d < 0) return { text: `Late ${-d} day${d === -1 ? '' : 's'}`, tone: 'bg-rose-50 text-rose-700', pill: true };
    if (d === 0) return { text: 'Due today', tone: 'bg-amber-50 text-amber-800', pill: true };
    return { text: `Due in ${d} day${d === 1 ? '' : 's'}`, tone: 'bg-neutral-100 text-neutral-700', pill: true };
  };

  const tabs = [
    { id: 'pending', label: 'To collect', count: owing.length },
    { id: 'paid', label: 'Paid', count: settled.length },
    { id: 'all', label: 'All', count: room.students.length },
  ];

  const cards = [
    { id: 'pending', label: 'Outstanding', value: formatMoney(pending), hint: `${owing.length} student${owing.length === 1 ? '' : 's'} to collect from`, icon: Wallet, red: pending > 0 },
    { id: 'paid', label: 'Collected', value: formatMoney(collected), hint: `${rate}% of ${compactMoney(totalFee)} total`, icon: CheckCircle2, bar: rate },
    { label: 'This month', value: formatMoney(monthNow), hint: monthChange == null ? `${thisMonth.length} payments` : `${monthChange >= 0 ? '↑' : '↓'} ${Math.abs(monthChange)}% vs last month`, icon: CalendarDays, good: monthChange != null && monthChange >= 0 },
    { label: 'Overdue', value: formatMoney(lateAmount), hint: late.length ? `${late.length} student${late.length === 1 ? '' : 's'} past due date` : 'Nobody is late', icon: AlertCircle, red: lateAmount > 0 },
  ];

  return (
    <div className="min-h-dvh app-canvas">
      <AppHeader
        nav
        onSettings={() => setSettingsOpen(true)}
        onSignOut={async () => { await signOut(); navigate('/login'); }}
      />

      <main className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8 pt-5 sm:pt-8 pb-14">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-medium tracking-tight text-neutral-900">Fees</h1>
            <p className="mt-0.5 hidden sm:block text-sm text-neutral-500">Who has paid, who still owes, and when it is due.</p>
          </div>
          {room.students.length > 0 && (
            <div className="flex shrink-0 gap-2">
            {canScan && (
              <button type="button" onClick={() => navigate('/scan-receipt')}
                className="h-11 px-4 shrink-0 rounded-xl bg-white ring-1 ring-neutral-200 text-neutral-800 text-sm font-semibold inline-flex items-center gap-1.5 hover:bg-neutral-50">
                <ScanLine className="w-4 h-4" /> <span className="hidden sm:inline">Scan receipt</span>
              </button>
            )}
            <button type="button" onClick={() => setChoosing(true)}
              className="h-11 px-4 shrink-0 rounded-xl bg-[#005a9c] text-white text-sm font-semibold inline-flex items-center gap-1.5 hover:bg-[#1b365d] shadow-sm">
              <Plus className="w-4 h-4" /> Record payment
            </button>
            </div>
          )}
        </div>

        {room.students.length === 0 ? (
          <Panel>
            <EmptyState
              icon={Wallet}
              title="No students yet"
              text="Add students with fees first."
              action={<button type="button" onClick={() => navigate('/students')} className="h-10 px-4 rounded-xl bg-[#005a9c] text-white text-sm font-semibold hover:bg-[#1b365d]">Add students</button>}
            />
          </Panel>
        ) : (
          <>
            {/* Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-5 sm:mb-6">
              {cards.map((c) => {
                const Icon = c.icon;
                const body = (
                  <>
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs sm:text-[13px] font-semibold text-neutral-500 truncate">{c.label}</p>
                      <span className={`h-7 w-7 shrink-0 rounded-full grid place-items-center ${c.red ? 'bg-rose-50 text-rose-600' : 'bg-[#eef7fc] text-[#005a9c]'}`}><Icon className="w-3.5 h-3.5" /></span>
                    </div>
                    <p className={`mt-1 text-lg sm:text-2xl font-bold tracking-tight tabular-nums truncate ${c.red ? 'text-rose-600' : 'text-neutral-900'}`}>{c.value}</p>
                    {c.bar != null && <Bar value={c.bar} max={100} className="mt-2 h-1.5" />}
                    <p className={`mt-1 text-[11px] sm:text-xs truncate ${c.good ? 'text-[#17653a] font-medium' : 'text-neutral-500'}`}>{c.hint}</p>
                  </>
                );
                const cls = `min-w-0 text-left rounded-2xl bg-white p-3 sm:p-4 shadow-card ${c.id && status === c.id ? 'ring-2 ring-[#005a9c]' : ''}`;
                return c.id
                  ? <button key={c.label} type="button" onClick={() => setStatus(c.id)} className={`${cls} hover:-translate-y-0.5 transition-transform`}>{body}</button>
                  : <div key={c.label} className={cls}>{body}</div>;
              })}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
              {/* Students */}
              <section className="bg-white rounded-3xl shadow-card overflow-hidden min-w-0">
                <div className="px-4 sm:px-5 pt-4 pb-3 border-b border-neutral-100 space-y-3">
                  <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Show students">
                    {tabs.map((t) => (
                      <button key={t.id} type="button" role="tab" aria-selected={status === t.id} onClick={() => setStatus(t.id)}
                        className={`h-9 px-3.5 rounded-full text-sm font-medium inline-flex items-center gap-1.5 transition-colors ${status === t.id ? 'bg-[#005a9c] text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}>
                        {t.label}
                        <span className={`rounded-full px-1.5 text-xs tabular-nums ${status === t.id ? 'bg-white/20' : 'bg-white text-neutral-500'}`}>{t.count}</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input className={`${field} pl-9 bg-neutral-50`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search student or class" aria-label="Search students" type="search" />
                    </div>
                    {classNames.length > 1 && (
                      <div className="sm:w-48">
                        <Picker label="Class" value={classFilter} onChange={setClassFilter}
                          options={[{ value: 'all', label: 'All classes' }, ...classNames.map((n) => ({ value: n, label: n }))]} />
                      </div>
                    )}
                  </div>
                </div>

                {visible.length === 0 ? (
                  <p className="text-sm text-neutral-500 text-center py-12">
                    {term || classFilter !== 'all' ? 'No students match.' : status === 'pending' ? 'All fees are collected.' : 'No students here yet.'}
                  </p>
                ) : (
                  <>
                    {/* Desktop table */}
                    <table className="hidden md:table w-full text-left">
                      <thead className="bg-neutral-50/70">
                        <tr className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                          <th className="pl-5 pr-3 py-2.5">Student</th>
                          <th className="px-3 py-2.5 text-right">Total fee</th>
                          <th className="px-3 py-2.5 w-44">Paid</th>
                          <th className="px-3 py-2.5 text-right">Balance</th>
                          <th className="px-3 py-2.5">Status</th>
                          <th className="px-3 py-2.5 hidden 2xl:table-cell">Last payment</th>
                          <th className="pr-5 py-2.5 w-32"><span className="sr-only">Action</span></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {visible.map((student) => {
                          const due = owedBy(student);
                          const paid = paidBy(student.id);
                          const history = historyOf(student.id);
                          const last = [...history].sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0];
                          const expanded = open === student.id;
                          const st = dueStatus(student);
                          return (
                            <React.Fragment key={student.id}>
                              <tr className={`group ${history.length ? 'cursor-pointer' : ''} ${expanded ? 'bg-[#f8fafc]' : 'hover:bg-[#f8fafc]'}`}
                                onClick={() => history.length && setOpen(expanded ? null : student.id)}>
                                <td className="pl-5 pr-3 py-3">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <Initials name={student.name} className="h-9 w-9 text-xs shrink-0" />
                                    <div className="min-w-0">
                                      <p className="font-semibold text-neutral-900 truncate inline-flex items-center gap-1">
                                        {student.name}
                                        {history.length > 0 && <ChevronDown className={`w-4 h-4 shrink-0 text-neutral-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />}
                                      </p>
                                      <StudentBatches student={student} classes={room.classes} showClass empty="No batch" className="mt-0.5" />
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 py-3 text-sm text-right tabular-nums text-neutral-700">{student.fee ? formatMoney(student.fee) : '—'}</td>
                                <td className="px-3 py-3">
                                  {student.fee ? (
                                    <>
                                      <p className="text-sm tabular-nums text-neutral-900">{formatMoney(Math.min(paid, student.fee))}</p>
                                      <Bar value={paid} max={student.fee} tone={due === 0 ? '#17784a' : '#005a9c'} className="mt-1 h-1.5 w-32" />
                                    </>
                                  ) : <span className="text-sm text-neutral-400">—</span>}
                                </td>
                                <td className={`px-3 py-3 text-sm text-right tabular-nums font-semibold ${due > 0 ? 'text-rose-600' : 'text-neutral-400'}`}>{due > 0 ? formatMoney(due) : '—'}</td>
                                <td className="px-3 py-3">
                                  {st.pill
                                    ? <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${st.tone}`}>{st.text}</span>
                                    : <span className={`text-xs ${st.tone}`}>{st.text}</span>}
                                  {due > 0 && student.feeDate && <p className="mt-0.5 text-[11px] text-neutral-400">{formatDate(student.feeDate)}</p>}
                                </td>
                                <td className="px-3 py-3 hidden 2xl:table-cell text-sm text-neutral-600">
                                  {last ? <>{formatMoney(last.amount)}<span className="block text-xs text-neutral-400">{formatDate(last.date)} · {last.mode}</span></> : <span className="text-neutral-400">None yet</span>}
                                </td>
                                <td className="pr-5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                  {due > 0 && (
                                    <button type="button" onClick={() => setPaying(student)}
                                      className="h-9 px-3 rounded-xl bg-[#005a9c] hover:bg-[#1b365d] text-white text-sm font-semibold inline-flex items-center gap-1.5 whitespace-nowrap">
                                      <Receipt className="w-4 h-4" /> Record
                                    </button>
                                  )}
                                </td>
                              </tr>
                              {expanded && history.length > 0 && (
                                <tr className="bg-[#f8fafc]">
                                  <td colSpan={7} className="pl-[4.25rem] pr-5 pb-3 pt-0">
                                    <ul className="rounded-xl bg-white ring-1 ring-neutral-200/80 divide-y divide-neutral-100">
                                      {history.map((payment) => (
                                        <li key={payment.id} className="flex items-center gap-3 pl-3 pr-1 py-1.5 text-sm">
                                          <span className="w-20 shrink-0 text-xs font-medium text-neutral-400 tabular-nums">{payment.receiptNo}</span>
                                          <span className="w-24 shrink-0 font-semibold text-neutral-900 tabular-nums">{formatMoney(payment.amount)}</span>
                                          <span className="flex-1 min-w-0 truncate text-neutral-500">{formatDate(payment.date)} · {payment.mode}{payment.note ? ` · ${payment.note}` : ''}</span>
                                          <button type="button" onClick={() => setReceipt(payment)} className="h-8 px-2.5 rounded-lg text-xs font-medium text-[#005a9c] hover:bg-[#eef7fc] inline-flex items-center gap-1">
                                            <Printer className="w-3.5 h-3.5" /> Receipt
                                          </button>
                                          {payment.receiptId && (
                                            <button type="button" onClick={() => setPhoto(payment.receiptId)} className="h-8 px-2.5 rounded-lg text-xs font-medium text-[#005a9c] hover:bg-[#eef7fc] inline-flex items-center gap-1">
                                              <ImageIcon className="w-3.5 h-3.5" /> Photo
                                            </button>
                                          )}
                                          {canDelete && <button type="button" onClick={() => { if (confirm(`Delete payment ${payment.receiptNo}?`)) room.deletePayment(payment.id); }}
                                            className="h-8 w-8 shrink-0 grid place-items-center rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50" aria-label={`Delete payment ${payment.receiptNo}`}>
                                            <Trash2 className="w-4 h-4" />
                                          </button>}
                                        </li>
                                      ))}
                                    </ul>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Phone list */}
                    <ul className="md:hidden divide-y divide-neutral-100">
                      {visible.map((student) => {
                        const due = owedBy(student);
                        const history = historyOf(student.id);
                        const expanded = open === student.id;
                        const lateNow = isLate(student);
                        return (
                          <li key={student.id}>
                            <div className="flex items-center gap-3 px-4 py-3">
                              <button type="button" onClick={() => setOpen(expanded ? null : student.id)} className="min-w-0 flex-1 text-left" aria-expanded={expanded} disabled={!history.length}>
                                <span className="flex items-center gap-1 font-semibold truncate text-neutral-900">
                                  <span className="truncate">{student.name}</span>
                                  {history.length > 0 && <ChevronDown className={`w-4 h-4 shrink-0 text-neutral-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />}
                                </span>
                                <span className="block text-xs text-neutral-500 truncate">
                                  {describeStudentBatches(student, room.classes) || 'No class'}
                                  {due > 0 && student.feeDate ? <span className={lateNow ? 'font-semibold text-neutral-700' : ''}> · {lateNow ? 'Late since' : 'Due'} {formatDate(student.feeDate)}</span> : ''}
                                </span>
                              </button>
                              {!student.fee ? (
                                <span className="shrink-0 text-xs text-neutral-400">No fee set</span>
                              ) : due === 0 ? (
                                <span className="shrink-0 inline-flex items-center gap-1 text-sm font-semibold text-neutral-700"><CheckCircle2 className="w-4 h-4 text-[#17653a]" /> Paid</span>
                              ) : (
                                <button type="button" onClick={() => setPaying(student)} title={`Record a payment for ${student.name}`}
                                  className="shrink-0 h-10 px-3 rounded-xl bg-white ring-1 ring-neutral-200 hover:ring-rose-300 hover:bg-rose-50 text-rose-600 text-[15px] font-bold tabular-nums">
                                  {formatMoney(due)}
                                </button>
                              )}
                            </div>
                            {expanded && history.length > 0 && (
                              <ul className="mx-4 mb-3 rounded-xl bg-white ring-1 ring-neutral-200/80 divide-y divide-neutral-100">
                                {history.map((payment) => (
                                  <li key={payment.id} className="flex items-center gap-2 pl-3 pr-1 py-1.5 text-sm">
                                    <button type="button" onClick={() => setReceipt(payment)} className="min-w-0 flex-1 text-left py-1 truncate">
                                      <span className="font-semibold text-neutral-900">{formatMoney(payment.amount)}</span>
                                      <span className="text-neutral-500"> · {formatDate(payment.date)} · {payment.mode}</span>
                                    </button>
                                    {payment.receiptId && (
                                      <button type="button" onClick={() => setPhoto(payment.receiptId)} className="h-9 w-9 shrink-0 grid place-items-center rounded-lg text-[#005a9c] hover:bg-[#eef7fc]" aria-label={`Receipt photo ${payment.receiptNo}`}>
                                        <ImageIcon className="w-4 h-4" />
                                      </button>
                                    )}
                                    {canDelete && <button type="button" onClick={() => { if (confirm(`Delete payment ${payment.receiptNo}?`)) room.deletePayment(payment.id); }}
                                      className="h-9 w-9 shrink-0 grid place-items-center rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50" aria-label={`Delete payment ${payment.receiptNo}`}>
                                      <Trash2 className="w-4 h-4" />
                                    </button>}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}
              </section>

              {/* Right rail */}
              <aside className="space-y-5 xl:sticky xl:top-24">
                <section className="bg-white rounded-3xl shadow-card p-5">
                  <h2 className="mb-3 text-base font-semibold text-neutral-900 inline-flex items-center gap-2"><Receipt className="w-4 h-4 text-[#005a9c]" /> Recent payments</h2>
                  {recent.length === 0 ? <p className="text-sm text-neutral-500">No payments yet.</p> : (
                    <ul className="-mx-2">
                      {recent.map((p) => (
                        <li key={p.id}>
                          <button type="button" onClick={() => setReceipt(p)} className="w-full flex items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-neutral-50">
                            <Initials name={studentOf(p.studentId)?.name || '?'} className="h-8 w-8 text-[11px] shrink-0" />
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-medium text-neutral-900 truncate">{studentOf(p.studentId)?.name || 'Deleted student'}</span>
                              <span className="block text-xs text-neutral-500 truncate">{formatDate(p.date)} · {p.mode}</span>
                            </span>
                            <span className="shrink-0 text-sm font-semibold tabular-nums text-[#17653a]">+{formatMoney(p.amount)}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {byClass.length > 0 && (
                  <section className="bg-white rounded-3xl shadow-card p-5">
                    <h2 className="mb-3.5 text-base font-semibold text-neutral-900 inline-flex items-center gap-2"><GraduationCap className="w-4 h-4 text-[#005a9c]" /> Collected by class</h2>
                    <ul className="space-y-3.5">
                      {byClass.map((c) => (
                        <li key={c.name}>
                          <button type="button" onClick={() => setClassFilter(classFilter === c.name ? 'all' : c.name)} className="w-full text-left group">
                            <div className="flex items-baseline justify-between gap-2 text-sm">
                              <span className={`font-medium ${classFilter === c.name ? 'text-[#005a9c]' : 'text-neutral-900 group-hover:text-[#005a9c]'}`}>{c.name}</span>
                              <span className="text-xs text-neutral-500 tabular-nums">{compactMoney(c.paid)} of {compactMoney(c.fee)}</span>
                            </div>
                            <Bar value={c.paid} max={c.fee} className="mt-1.5 h-2" />
                            <p className="mt-1 text-[11px] text-neutral-400">{c.owing ? `${c.owing} still owe` : 'All paid'}</p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {modes.length > 0 && (
                  <section className="bg-white rounded-3xl shadow-card p-5">
                    <h2 className="mb-3.5 text-base font-semibold text-neutral-900 inline-flex items-center gap-2"><Wallet className="w-4 h-4 text-[#005a9c]" /> How parents pay</h2>
                    <ul className="space-y-3">
                      {modes.map(([mode, amount]) => (
                        <li key={mode}>
                          <div className="flex items-baseline justify-between gap-2 text-sm">
                            <span className="text-neutral-900">{mode}</span>
                            <span className="text-xs text-neutral-500 tabular-nums">{formatMoney(amount)} · {collected ? Math.round((amount / collected) * 100) : 0}%</span>
                          </div>
                          <Bar value={amount} max={collected} tone="#1b365d" className="mt-1.5 h-1.5" />
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </aside>
            </div>
          </>
        )}
      </main>

      {choosing && (
        <Modal title="Record payment for" onClose={() => setChoosing(false)}>
          <StudentChooser students={[...room.students].sort(byOutstanding)} owedBy={owedBy} classes={room.classes} onPick={(s) => { setChoosing(false); setPaying(s); }} />
        </Modal>
      )}

      {paying && (
        <Modal title="Record payment" onClose={() => setPaying(null)}>
          <PaymentForm
            student={paying}
            due={Math.max(0, (paying.fee || 0) - paidBy(paying.id))}
            onSave={(payment) => { const saved = room.addPayment(payment); setPaying(null); setReceipt(saved); setOpen(payment.studentId); }}
          />
        </Modal>
      )}

      {receipt && (
        <Modal title={`Receipt ${receipt.receiptNo}`} onClose={() => setReceipt(null)}>
          <ReceiptView
            payment={receipt}
            student={studentOf(receipt.studentId)}
            institute={room.institute}
            school={room.school}
            paidTotal={paidUpTo(receipt)}
            classes={room.classes}
          />
        </Modal>
      )}

      {photo && <ReceiptPhoto receiptId={photo} onClose={() => setPhoto(null)} />}
      <SetupModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
