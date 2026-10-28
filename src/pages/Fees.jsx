import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IndianRupee, Printer, Receipt, Trash2, Wallet, X, ChevronDown, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppHeader } from '../components/AppHeader';
import { SetupModal } from '../components/SetupModal';
import { useClassroom, todayISO, formatMoney, formatDate } from '../services/classroom';

const field = 'w-full h-11 px-3 text-base bg-white rounded-xl ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-400 placeholder:text-slate-400';
const MODES = ['Cash', 'UPI', 'Bank transfer', 'Cheque'];

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 p-0 sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-full sm:max-w-md max-h-[92dvh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl shadow-xl">
        <div className="no-print flex items-center justify-between px-5 pt-4 pb-2">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} className="h-10 w-10 -mr-2 grid place-items-center rounded-xl text-slate-400 hover:bg-slate-100" aria-label="Close">
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
      <p className="text-sm text-slate-500">
        {student.name} · Due {formatMoney(due)}
      </p>
      <label className="block">
        <span className="block text-xs font-medium text-slate-500 mb-1">Amount (₹)</span>
        <input className={field} value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))} inputMode="decimal" autoFocus required />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="block text-xs font-medium text-slate-500 mb-1">Date</span>
          <input type="date" className={field} value={date} onChange={(e) => setDate(e.target.value || todayISO())} />
        </label>
        <label className="block">
          <span className="block text-xs font-medium text-slate-500 mb-1">Paid by</span>
          <select className={field} value={mode} onChange={(e) => setMode(e.target.value)}>
            {MODES.map((m) => <option key={m}>{m}</option>)}
          </select>
        </label>
      </div>
      <label className="block">
        <span className="block text-xs font-medium text-slate-500 mb-1">Note (optional)</span>
        <input className={field} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. April fee" />
      </label>
      <button type="submit" disabled={!(value > 0)} className="w-full h-12 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold disabled:opacity-40 inline-flex items-center justify-center gap-2">
        <Receipt className="w-4 h-4" /> Save and make receipt
      </button>
    </form>
  );
}

function ReceiptView({ payment, student, school, paidTotal }) {
  const due = Math.max(0, (student?.fee || 0) - paidTotal);
  return (
    <div className="px-5 pb-5">
      <div className="receipt-print rounded-xl ring-1 ring-slate-200 p-5 text-slate-900">
        <div className="text-center border-b border-dashed border-slate-300 pb-3">
          <p className="text-lg font-bold">{school || 'Fee Receipt'}</p>
          {school && <p className="text-xs uppercase tracking-widest text-slate-500 mt-0.5">Fee receipt</p>}
        </div>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
          <dt className="text-slate-500">Receipt no.</dt><dd className="text-right font-medium">{payment.receiptNo}</dd>
          <dt className="text-slate-500">Date</dt><dd className="text-right">{formatDate(payment.date)}</dd>
          <dt className="text-slate-500">Student</dt><dd className="text-right font-medium">{student?.name || 'Deleted student'}</dd>
          {student?.roll && (<><dt className="text-slate-500">Roll no.</dt><dd className="text-right">{student.roll}</dd></>)}
          {student?.className && (<><dt className="text-slate-500">Class</dt><dd className="text-right">{student.className}</dd></>)}
          <dt className="text-slate-500">Paid by</dt><dd className="text-right">{payment.mode}</dd>
          {payment.note && (<><dt className="text-slate-500">For</dt><dd className="text-right">{payment.note}</dd></>)}
        </dl>
        <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium">Amount received</span>
          <span className="text-xl font-bold">{formatMoney(payment.amount)}</span>
        </div>
        {student?.fee > 0 && (
          <p className="mt-2 text-xs text-slate-500 text-right">
            Total fee {formatMoney(student.fee)} · Paid so far {formatMoney(paidTotal)} · Balance {formatMoney(due)}
          </p>
        )}
        <div className="mt-8 flex justify-end">
          <p className="w-40 border-t border-slate-300 pt-1 text-center text-xs text-slate-500">Signature</p>
        </div>
      </div>
      <button type="button" onClick={() => window.print()} className="no-print mt-4 w-full h-12 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold inline-flex items-center justify-center gap-2">
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

  return (
    <div className="min-h-dvh bg-slate-50">
      <AppHeader
        nav
        width="max-w-3xl"
        onSettings={() => setSettingsOpen(true)}
        onSignOut={async () => { await signOut(); navigate('/login'); }}
      />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-5 sm:pt-8 pb-10">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">Fees</h1>
        <p className="mt-1 text-sm text-slate-500">Record payments and print receipts.</p>

        {room.students.length === 0 ? (
          <div className="mt-5 bg-white rounded-2xl ring-1 ring-slate-200/70 px-6 py-12 text-center">
            <Wallet className="w-8 h-8 mx-auto text-slate-300" />
            <p className="mt-3 font-medium text-slate-900">No students yet</p>
            <p className="mt-1 text-sm text-slate-500">Add students with their total fee first.</p>
            <button type="button" onClick={() => navigate('/attendance', { state: { tab: 'students' } })} className="mt-4 h-10 px-4 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700">
              Add students
            </button>
          </div>
        ) : (
          <>
            <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3" role="radiogroup" aria-label="Filter by payment">
              {[
                ['all', 'Total fees', totalFee, `${room.students.length} students`, 'text-slate-900'],
                ['paid', 'Collected', collected, `${settled.length} fully paid`, 'text-emerald-700'],
                ['pending', 'Outstanding', pending, `${owing.length} still to pay`, 'text-rose-700'],
              ].map(([id, label, value, hint, tone]) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={status === id}
                  onClick={() => setStatus(id)}
                  className={`text-left rounded-2xl bg-white p-3 sm:p-4 ring-1 transition-shadow ${
                    status === id ? 'ring-2 ring-brand-600' : 'ring-slate-200/70 hover:ring-slate-300'
                  }`}
                >
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className={`mt-1 text-base sm:text-xl font-semibold tabular-nums truncate ${tone}`}>{formatMoney(value)}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400 truncate">{hint}</p>
                </button>
              ))}
            </div>

            <div className="relative mt-4">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input className={`${field} pl-9`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, class or roll no." aria-label="Search students" />
            </div>

            {(() => {
              const term = query.trim().toLowerCase();
              const visible = room.students.filter((student) => {
                const matches = !term || [student.name, student.className, student.roll].join(' ').toLowerCase().includes(term);
                const payment = status === 'pending' ? owedBy(student) > 0 : status === 'paid' ? (student.fee || 0) > 0 && owedBy(student) === 0 : true;
                return matches && payment;
              });
              if (!visible.length) {
                return <p className="mt-4 text-sm text-slate-500 text-center py-8 bg-white rounded-2xl ring-1 ring-slate-200/70">{status === 'pending' ? 'No outstanding payments.' : 'No students match.'}</p>;
              }
              return (
            <ul className="mt-4 bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-card divide-y divide-slate-100">
              {visible.map((student) => {
                const paid = paidBy(student.id);
                const due = Math.max(0, (student.fee || 0) - paid);
                const history = room.payments.filter((p) => p.studentId === student.id);
                const expanded = open === student.id;
                return (
                  <li key={student.id}>
                    <div className="flex items-center gap-3 px-4 sm:px-5 py-3">
                      <button type="button" onClick={() => setOpen(expanded ? null : student.id)} className="min-w-0 flex-1 text-left" aria-expanded={expanded}>
                        <p className="font-medium text-slate-900 truncate flex items-center gap-1.5">
                          {student.name}
                          {history.length > 0 && <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          Paid {formatMoney(paid)}{student.fee ? ` of ${formatMoney(student.fee)}` : ''}
                          {student.className ? ` · ${student.className}` : ''}
                          {student.feeDate ? ` · Due ${formatDate(student.feeDate)}` : ''}
                        </p>
                      </button>
                      <span className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-full ${
                        !student.fee ? 'bg-slate-100 text-slate-500' : due === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}
                      >
                        {!student.fee ? 'No fee set' : due === 0 ? 'Paid' : `Due ${formatMoney(due)}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPaying(student)}
                        className="shrink-0 h-10 px-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold inline-flex items-center gap-1"
                        aria-label={`Record payment for ${student.name}`}
                      >
                        <IndianRupee className="w-4 h-4" /><span className="hidden sm:inline">Payment</span>
                      </button>
                    </div>
                    {expanded && history.length > 0 && (
                      <ul className="mx-4 sm:mx-5 mb-3 rounded-xl bg-slate-50 divide-y divide-slate-200/70">
                        {history.map((payment) => (
                          <li key={payment.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                            <span className="min-w-0 flex-1 truncate">
                              <span className="font-medium text-slate-900">{formatMoney(payment.amount)}</span>
                              <span className="text-slate-500"> · {formatDate(payment.date)} · {payment.mode}{payment.note ? ` · ${payment.note}` : ''}</span>
                            </span>
                            <button type="button" onClick={() => setReceipt(payment)} className="h-9 px-2 rounded-lg text-brand-700 font-medium hover:bg-brand-50 inline-flex items-center gap-1">
                              <Receipt className="w-4 h-4" /> {payment.receiptNo}
                            </button>
                            <button
                              type="button"
                              onClick={() => { if (confirm(`Delete payment ${payment.receiptNo}?`)) room.deletePayment(payment.id); }}
                              className="h-9 w-9 grid place-items-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
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
          </>
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
            school={room.school}
            paidTotal={paidUpTo(receipt)}
          />
        </Modal>
      )}

      <SetupModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
