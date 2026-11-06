import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IndianRupee, Printer, Receipt, Trash2, Wallet, X, ChevronDown, Search, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppHeader } from '../components/AppHeader';
import { SetupModal } from '../components/SetupModal';
import { useClassroom, todayISO, formatMoney, formatDate } from '../services/classroom';
import { PageHeader, Panel, EmptyState, Initials, Meter, Donut, BarChart, TONES, lastMonths, compactMoney } from '../components/ui';

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

function ReceiptView({ payment, student, institute, school, paidTotal }) {
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
          {student?.section && (<><dt className="text-neutral-500">Batch</dt><dd className="text-right">{student.section}</dd></>)}
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

export default function Fees() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const room = useClassroom();
  const [paying, setPaying] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [open, setOpen] = useState(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const paidBy = (id) => room.payments.filter((p) => p.studentId === id).reduce((sum, p) => sum + p.amount, 0);
  const totalFee = room.students.reduce((sum, s) => sum + (s.fee || 0), 0);
  const collected = room.payments.reduce((sum, p) => sum + p.amount, 0);
  const owedBy = (student) => Math.max(0, (student.fee || 0) - paidBy(student.id));
  const owing = room.students.filter((student) => owedBy(student) > 0);
  const settled = room.students.filter((student) => (student.fee || 0) > 0 && owedBy(student) === 0);
  const pending = owing.reduce((sum, student) => sum + owedBy(student), 0);
  const studentOf = (id) => room.students.find((s) => s.id === id);
  const paidUpTo = (payment) => {
    const history = room.payments.filter((p) => p.studentId === payment.studentId);
    return history.slice(Math.max(0, history.findIndex((p) => p.id === payment.id))).reduce((sum, p) => sum + p.amount, 0);
  };

  const today = todayISO();
  const collectedPct = totalFee ? Math.round((Math.min(collected, totalFee) / totalFee) * 100) : 0;
  const overdueCount = owing.filter((s) => s.feeDate && s.feeDate < today).length;
  const months = lastMonths(6).map((m) => ({
    label: m.label,
    value: room.payments.filter((p) => (p.date || '').startsWith(m.key)).reduce((sum, p) => sum + (p.amount || 0), 0),
  }));
  const thisMonth = months[months.length - 1]?.value || 0;
  const modeTotals = MODES.map((m) => ({ mode: m, value: room.payments.filter((p) => p.mode === m).reduce((sum, p) => sum + p.amount, 0) })).filter((m) => m.value > 0);
  const recent = [...room.payments].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 5);

  return (
    <div className="min-h-dvh app-canvas">
      <AppHeader
        nav
        onSettings={() => setSettingsOpen(true)}
        onSignOut={async () => { await signOut(); navigate('/login'); }}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-14">
        <PageHeader
          icon={Wallet}
          eyebrow="Institute"
          title="Fees"
          subtitle="Track payments and print receipts."
        />

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
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
            <div className="xl:col-span-2 space-y-4 min-w-0">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" role="radiogroup" aria-label="Filter by payment">
                {[
                  ['all', 'Total fees', totalFee, `${room.students.length} students`, IndianRupee, 'brand'],
                  ['paid', 'Collected', collected, `${settled.length} fully paid`, CheckCircle2, 'emerald'],
                  ['pending', 'Outstanding', pending, `${owing.length} still to pay${overdueCount ? ` · ${overdueCount} late` : ''}`, AlertCircle, 'rose'],
                ].map(([id, label, value, hint, Icon, tone]) => (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={status === id}
                    onClick={() => setStatus(id)}
                    className={`text-left rounded-3xl bg-white p-4 shadow-card transition-all hover:-translate-y-0.5 ${
                      status === id ? 'ring-2 ring-brand-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] font-semibold text-neutral-500">{label}</p>
                      <span className={`h-8 w-8 rounded-lg grid place-items-center ${TONES[tone].soft} ${TONES[tone].text}`}><Icon className="w-4 h-4" /></span>
                    </div>
                    <p className={`mt-1.5 text-xl sm:text-2xl font-extrabold tracking-tight tabular-nums truncate ${tone === 'brand' ? 'text-neutral-900' : TONES[tone].text}`}>{formatMoney(value)}</p>
                    <p className="mt-0.5 text-xs text-neutral-500 truncate">{hint}</p>
                  </button>
                ))}
              </div>

              <section className="bg-white rounded-3xl shadow-card overflow-hidden">
                <div className="p-4 border-b border-neutral-100 flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-56">
                    <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input className={`${field} pl-9 bg-neutral-50`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, class or roll no." aria-label="Search students" />
                  </div>
                  <p className="text-xs text-neutral-500">Tap a name to see its payments and receipts.</p>
                </div>
                <div className="hidden md:grid grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_8rem_7.5rem] gap-4 px-5 py-2.5 bg-neutral-50/70 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  <span>Student</span><span>Paid so far</span><span>Status</span><span className="text-right">Action</span>
                </div>
            {(() => {
              const term = query.trim().toLowerCase();
              const visible = room.students.filter((student) => {
                const matches = !term || [student.name, student.className, student.roll].join(' ').toLowerCase().includes(term);
                const payment = status === 'pending' ? owedBy(student) > 0 : status === 'paid' ? (student.fee || 0) > 0 && owedBy(student) === 0 : true;
                return matches && payment;
              });
              if (!visible.length) {
                return <p className="text-sm text-neutral-500 text-center py-12">{status === 'pending' ? 'No outstanding payments.' : 'No students match.'}</p>;
              }
              return (
            <ul className="divide-y divide-neutral-100">
              {visible.map((student) => {
                const paid = paidBy(student.id);
                const due = Math.max(0, (student.fee || 0) - paid);
                const history = room.payments.filter((p) => p.studentId === student.id);
                const expanded = open === student.id;
                const late = due > 0 && student.feeDate && student.feeDate < today;
                return (
                  <li key={student.id} className={expanded ? 'bg-brand-50/30' : ''}>
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_8rem_7.5rem] items-center gap-3 md:gap-4 px-4 sm:px-5 py-3">
                      <button type="button" onClick={() => setOpen(expanded ? null : student.id)} className="min-w-0 text-left flex items-center gap-3" aria-expanded={expanded}>
                        <Initials name={student.name} />
                        <span className="min-w-0">
                          <span className="font-semibold text-neutral-900 truncate flex items-center gap-1.5">
                            {student.name}
                            {history.length > 0 && <ChevronDown className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />}
                          </span>
                          <span className="block text-xs text-neutral-500 truncate">
                            {[student.className, student.section && `Batch ${student.section}`].filter(Boolean).join(' · ') || 'No class'}
                            {student.feeDate ? <span className={late ? 'text-neutral-900 font-semibold' : ''}> · Due {formatDate(student.feeDate)}</span> : ''}
                          </span>
                        </span>
                      </button>
                      <div className="hidden md:block min-w-0">
                        <Meter value={paid} max={student.fee || 1} tone={due === 0 ? 'emerald' : 'brand'} />
                        <p className="mt-1 text-xs text-neutral-500 tabular-nums truncate">
                          Paid {formatMoney(paid)}{student.fee ? ` of ${formatMoney(student.fee)}` : ''}
                        </p>
                      </div>
                      <span className={`hidden md:inline-flex justify-self-start items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                        !student.fee ? 'bg-neutral-100 text-neutral-500' : due === 0 ? 'bg-neutral-50 text-neutral-900' : late ? 'bg-neutral-100 text-neutral-900' : 'bg-neutral-50 text-neutral-900'
                      }`}
                      >
                        {!student.fee ? 'No fee set' : due === 0 ? <><CheckCircle2 className="w-3.5 h-3.5" />Paid</> : `Due ${formatMoney(due)}`}
                      </span>
                      <div className="flex items-center justify-end gap-2">
                        <span className={`md:hidden text-[11px] font-semibold px-2 py-0.5 rounded-full ${!student.fee ? 'bg-neutral-100 text-neutral-500' : due === 0 ? 'bg-neutral-50 text-neutral-900' : 'bg-neutral-50 text-neutral-900'}`}>
                          {!student.fee ? 'No fee' : due === 0 ? 'Paid' : formatMoney(due)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPaying(student)}
                          className="shrink-0 h-10 px-3 rounded-xl bg-[#005a9c] hover:bg-[#1b365d] text-white text-sm font-semibold inline-flex items-center gap-1 shadow-sm"
                          aria-label={`Record payment for ${student.name}`}
                        >
                          <IndianRupee className="w-4 h-4" /><span className="hidden sm:inline">Payment</span>
                        </button>
                      </div>
                    </div>
                    {expanded && history.length > 0 && (
                      <ul className="mx-4 sm:mx-5 mb-3 rounded-xl bg-white ring-1 ring-neutral-200/80 divide-y divide-neutral-100">
                        {history.map((payment) => (
                          <li key={payment.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                            <span className="min-w-0 flex-1 truncate">
                              <span className="font-semibold text-neutral-900">{formatMoney(payment.amount)}</span>
                              <span className="text-neutral-500"> · {formatDate(payment.date)} · {payment.mode}{payment.note ? ` · ${payment.note}` : ''}</span>
                            </span>
                            <button type="button" onClick={() => setReceipt(payment)} className="h-9 px-2 rounded-lg text-brand-700 font-medium hover:bg-brand-50 inline-flex items-center gap-1">
                              <Receipt className="w-4 h-4" /> {payment.receiptNo}
                            </button>
                            <button
                              type="button"
                              onClick={() => { if (confirm(`Delete payment ${payment.receiptNo}?`)) room.deletePayment(payment.id); }}
                              className="h-9 w-9 grid place-items-center rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50"
                              aria-label={`Delete payment ${payment.receiptNo}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
              );
            })()}
              </section>
            </div>

            <aside className="space-y-6">
              <Panel title="Collection progress" subtitle={`${formatMoney(thisMonth)} collected this month`} icon={Wallet} tone="amber">
                <div className="flex items-center gap-5">
                  <Donut size={128} thickness={15} segments={[
                    { value: Math.min(collected, totalFee), color: '#0a0a0a', label: 'Collected' },
                    { value: pending, color: '#e5e5e5', label: 'Pending' },
                  ]}>
                    <div>
                      <p className="text-xl font-extrabold text-neutral-900 tabular-nums">{collectedPct}%</p>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">collected</p>
                    </div>
                  </Donut>
                  <dl className="space-y-2 text-sm min-w-0">
                    <div><dt className="text-xs text-neutral-500">Fully paid</dt><dd className="font-bold text-neutral-900">{settled.length} students</dd></div>
                    <div><dt className="text-xs text-neutral-500">Still to pay</dt><dd className="font-bold text-neutral-900">{owing.length} students</dd></div>
                    <div><dt className="text-xs text-neutral-500">Past due date</dt><dd className={`font-bold ${overdueCount ? 'text-neutral-900' : 'text-neutral-900'}`}>{overdueCount} students</dd></div>
                  </dl>
                </div>
              </Panel>

              <Panel title="Monthly collections" subtitle="Last 6 months" icon={Receipt} tone="brand">
                <BarChart data={months} format={compactMoney} highlightLast height={120} />
              </Panel>

              {modeTotals.length > 0 && (
                <Panel title="How parents pay" icon={IndianRupee} tone="emerald">
                  <div className="space-y-3">
                    {modeTotals.map((m) => (
                      <Meter key={m.mode} label={m.mode} right={formatMoney(m.value)} value={m.value} max={collected} tone="emerald" />
                    ))}
                  </div>
                </Panel>
              )}

              <Panel title="Recent receipts" icon={Receipt} tone="slate">
                {recent.length === 0 ? (
                  <p className="text-sm text-neutral-500 py-2">No payments recorded yet.</p>
                ) : (
                  <ul className="divide-y divide-neutral-100 -mx-1">
                    {recent.map((payment) => {
                      const st = studentOf(payment.studentId);
                      return (
                        <li key={payment.id}>
                          <button type="button" onClick={() => setReceipt(payment)} className="w-full px-1 py-2.5 flex items-center gap-3 text-left hover:bg-neutral-50 rounded-lg">
                            <span className="h-9 w-9 rounded-xl bg-neutral-50 text-neutral-900 grid place-items-center shrink-0"><Receipt className="w-4 h-4" /></span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-semibold text-neutral-900 truncate">{st?.name || 'Deleted student'}</span>
                              <span className="block text-[11px] text-neutral-500">{payment.receiptNo} · {formatDate(payment.date)} · {payment.mode}</span>
                            </span>
                            <span className="text-sm font-bold text-neutral-900 tabular-nums">+{formatMoney(payment.amount)}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Panel>
            </aside>
          </div>
        )}
      </main>

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
          />
        </Modal>
      )}

      <SetupModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
