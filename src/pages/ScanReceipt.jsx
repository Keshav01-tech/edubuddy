import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, ScanLine, CheckCircle2, AlertTriangle, RotateCcw, Search, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppHeader } from '../components/AppHeader';
import { Initials } from '../components/ui';
import { useClassroom, todayISO, formatMoney, formatDate } from '../services/classroom';
import { describeStudentBatches } from '../services/teachers';
import { photoToDataUrl, readReceipt, saveReceiptPhoto, getReceiptPhoto, matchStudents } from '../services/receipts';

const field = 'w-full h-11 px-3 text-base bg-white rounded-xl ring-1 ring-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-400 placeholder:text-neutral-400';
const MODES = ['Cash', 'UPI', 'Bank transfer', 'Cheque', 'Card'];
const newId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

/** Shows a stored receipt photo. */
export function ReceiptPhoto({ receiptId, onClose }) {
  const [state, setState] = useState({ loading: true });
  React.useEffect(() => {
    let live = true;
    getReceiptPhoto(receiptId)
      .then((r) => live && setState({ image: r.image }))
      .catch((err) => live && setState({ error: err.message }));
    return () => { live = false; };
  }, [receiptId]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-neutral-900/60 p-4" role="dialog" aria-modal="true" aria-label="Receipt photo" onClick={onClose}>
      <div className="relative max-h-[92dvh] max-w-3xl w-full overflow-auto rounded-2xl bg-white p-3 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} className="absolute right-3 top-3 h-9 w-9 grid place-items-center rounded-full bg-white/90 text-neutral-600 hover:bg-neutral-100" aria-label="Close"><X className="w-5 h-5" /></button>
        {state.loading && <p className="p-10 text-center text-sm text-neutral-500">Loading the photo…</p>}
        {state.error && <p className="p-10 text-center text-sm text-rose-600">{state.error}</p>}
        {state.image && <img src={state.image} alt="Scanned fee receipt" className="w-full h-auto rounded-xl" />}
      </div>
    </div>
  );
}

function StudentPicker({ students, classes, onPick }) {
  const [q, setQ] = useState('');
  const term = q.trim().toLowerCase();
  const list = students.filter((s) => !term || `${s.name} ${s.phone || ''} ${s.className || ''}`.toLowerCase().includes(term)).slice(0, 8);
  return (
    <div className="mt-2 rounded-xl ring-1 ring-neutral-200 p-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input className={`${field} pl-9`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, phone or class" aria-label="Search student" autoFocus />
      </div>
      <ul className="mt-1 max-h-64 overflow-y-auto">
        {list.map((s) => (
          <li key={s.id}>
            <button type="button" onClick={() => onPick(s)} className="w-full flex items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-neutral-50">
              <Initials name={s.name} className="h-8 w-8 text-xs" />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-neutral-900 truncate">{s.name}</span>
                <span className="block text-xs text-neutral-500 truncate">{describeStudentBatches(s, classes)}{s.phone ? ` · ${s.phone}` : ''}</span>
              </span>
            </button>
          </li>
        ))}
        {!list.length && <li className="px-2 py-3 text-sm text-neutral-500">No student found.</li>}
      </ul>
    </div>
  );
}

export default function ScanReceipt() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const room = useClassroom();
  const camera = useRef(null);
  const upload = useRef(null);

  const [image, setImage] = useState('');
  const [step, setStep] = useState('pick'); // pick | reading | confirm | saving | done
  const [error, setError] = useState('');
  const [read, setRead] = useState(null);
  const [studentId, setStudentId] = useState('');
  const [choosing, setChoosing] = useState(false);
  const [form, setForm] = useState({ amount: '', date: todayISO(), mode: 'Cash', reference: '', note: '' });
  const [saved, setSaved] = useState(null);
  const [viewing, setViewing] = useState(null);

  const paidBy = (id) => room.payments.filter((p) => p.studentId === id).reduce((sum, p) => sum + (p.amount || 0), 0);
  const matches = useMemo(() => (read ? matchStudents(read, room.students).slice(0, 4) : []), [read, room.students]);
  const student = room.students.find((s) => s.id === studentId) || null;
  const amount = Number(form.amount) || 0;
  const dueBefore = student ? Math.max(0, (student.fee || 0) - paidBy(student.id)) : 0;
  const reference = form.reference.trim();
  const duplicate = reference && room.payments.find((p) => (p.reference || '').trim().toLowerCase() === reference.toLowerCase());
  const scanned = [...room.payments].filter((p) => p.receiptId).sort((a, b) => String(b.createdAt || b.date).localeCompare(String(a.createdAt || a.date))).slice(0, 8);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const reset = () => {
    setImage(''); setStep('pick'); setError(''); setRead(null); setStudentId(''); setChoosing(false); setSaved(null);
    setForm({ amount: '', date: todayISO(), mode: 'Cash', reference: '', note: '' });
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    try {
      const data = await photoToDataUrl(file);
      setImage(data);
      setStep('reading');
      const fields = await readReceipt(data);
      setRead(fields);
      if (!fields.isReceipt) setError('This does not look like a payment receipt. Check the details below, or try another photo.');
      setForm({
        amount: fields.amount ? String(fields.amount) : '',
        date: /^\d{4}-\d{2}-\d{2}$/.test(fields.date || '') && fields.date <= todayISO() ? fields.date : todayISO(),
        mode: MODES.includes(fields.mode) ? fields.mode : 'Cash',
        reference: fields.reference || '',
        note: fields.note || '',
      });
      const best = matchStudents(fields, room.students);
      // Pre-select only a clear winner; otherwise the receptionist chooses.
      if (best[0] && best[0].score >= 60 && (!best[1] || best[0].score - best[1].score >= 20)) setStudentId(best[0].student.id);
      setStep('confirm');
    } catch (err) {
      setError(err.message || 'Could not read this receipt.');
      // The photo stays, and the details can still be typed in by hand.
      setRead({ isReceipt: false, studentName: '', parentName: '', phone: '', className: '', amount: 0, date: '', mode: '', reference: '', note: '', confidence: 'low' });
      setStep('confirm');
    }
  };

  const confirm = async () => {
    if (!student || !(amount > 0)) return;
    setStep('saving');
    setError('');
    const receiptId = newId();
    const payment = room.addPayment({
      studentId: student.id, amount, date: form.date, mode: form.mode, note: form.note.trim(),
      reference, receiptId, source: 'receipt-scan', createdAt: new Date().toISOString(),
    });
    try {
      await saveReceiptPhoto({ id: receiptId, paymentId: payment.id, studentId: student.id, image, read }, payment);
    } catch (err) {
      // The payment itself is saved by the app either way; only the photo failed.
      setError(`The fee is recorded, but the photo was not stored: ${err.message}`);
    }
    setSaved({ payment, student, dueAfter: Math.max(0, dueBefore - amount) });
    setStep('done');
  };

  return (
    <div className="min-h-dvh app-canvas">
      <AppHeader nav onSignOut={async () => { await signOut(); navigate('/login'); }} />
      <main className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 pt-5 sm:pt-8 pb-14">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-medium tracking-tight text-neutral-900">Scan receipt</h1>
            <p className="mt-0.5 text-sm text-neutral-500">Photograph a fee receipt or UPI screenshot. Check the details, confirm the student, and the fee is updated.</p>
          </div>
          {step !== 'pick' && (
            <button type="button" onClick={reset} className="h-10 px-4 shrink-0 rounded-xl bg-white ring-1 ring-neutral-200 text-sm font-medium text-neutral-700 hover:bg-neutral-50 inline-flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4" /> New scan
            </button>
          )}
        </div>

        <input ref={camera} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} />
        <input ref={upload} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onFile} />

        {step === 'pick' && (
          <section className="rounded-3xl bg-white shadow-card p-8 sm:p-12 text-center">
            <span className="mx-auto h-16 w-16 rounded-full grid place-items-center bg-[#eef7fc] text-[#005a9c]"><ScanLine className="w-7 h-7" /></span>
            <h2 className="mt-4 text-lg font-medium text-neutral-900">Add a receipt photo</h2>
            <p className="mt-1 text-sm text-neutral-500 max-w-md mx-auto">Printed or handwritten receipts, bank slips and UPI payment screenshots all work. Keep the amount and name in focus.</p>
            <div className="mt-6 flex flex-col sm:flex-row justify-center gap-2">
              <button type="button" onClick={() => camera.current?.click()} className="h-12 px-6 rounded-xl bg-[#005a9c] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#1b365d]">
                <Camera className="w-4 h-4" /> Take photo
              </button>
              <button type="button" onClick={() => upload.current?.click()} className="h-12 px-6 rounded-xl bg-white ring-1 ring-neutral-200 text-sm font-semibold text-neutral-800 inline-flex items-center justify-center gap-2 hover:bg-neutral-50">
                <Upload className="w-4 h-4" /> Upload image
              </button>
            </div>
            {error && <p className="mt-4 text-sm font-medium text-rose-600">{error}</p>}
          </section>
        )}

        {step !== 'pick' && (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-5 items-start">
            <section className="rounded-3xl bg-white shadow-card p-3">
              {image ? <img src={image} alt="Receipt to record" className="w-full h-auto max-h-[70dvh] object-contain rounded-2xl bg-neutral-50" /> : null}
            </section>

            <section className="rounded-3xl bg-white shadow-card p-5 sm:p-6">
              {step === 'reading' && (
                <div className="py-16 text-center">
                  <Loader2 className="mx-auto w-8 h-8 animate-spin text-[#005a9c]" />
                  <p className="mt-3 text-sm font-medium text-neutral-700">Reading the receipt…</p>
                </div>
              )}

              {(step === 'confirm' || step === 'saving') && (
                <>
                  <h2 className="text-lg font-medium text-neutral-900">Confirm the details</h2>
                  {read && (read.studentName || read.parentName || read.phone || read.className) && (
                    <p className="mt-1 text-sm text-neutral-500">
                      Read from receipt: {[read.studentName, read.parentName && `parent ${read.parentName}`, read.className, read.phone].filter(Boolean).join(' · ')}
                      {read.confidence === 'low' && <span className="ml-1 font-medium text-amber-700">(hard to read, check carefully)</span>}
                    </p>
                  )}
                  {error && <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800 flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />{error}</p>}

                  <h3 className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">Student</h3>
                  {student ? (
                    <div className="flex items-center gap-3 rounded-2xl bg-[#eef7fc] p-3">
                      <Initials name={student.name} className="h-10 w-10 text-sm" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-neutral-900 truncate">{student.name}</p>
                        <p className="text-xs text-neutral-600 truncate">{describeStudentBatches(student, room.classes)}{student.phone ? ` · ${student.phone}` : ''}</p>
                      </div>
                      <button type="button" onClick={() => { setStudentId(''); setChoosing(true); }} className="h-9 px-3 rounded-lg text-xs font-semibold text-[#005a9c] hover:bg-white">Change</button>
                    </div>
                  ) : (
                    <>
                      {matches.length > 0 && !choosing && (
                        <ul className="space-y-1.5">
                          {matches.map(({ student: s, reasons }) => (
                            <li key={s.id}>
                              <button type="button" onClick={() => setStudentId(s.id)} className="w-full flex items-center gap-3 rounded-2xl ring-1 ring-neutral-200 px-3 py-2.5 text-left hover:bg-neutral-50">
                                <Initials name={s.name} className="h-9 w-9 text-xs" />
                                <span className="min-w-0 flex-1">
                                  <span className="block text-sm font-medium text-neutral-900 truncate">{s.name}</span>
                                  <span className="block text-xs text-neutral-500 truncate">{describeStudentBatches(s, room.classes)} · {reasons.join(', ')}</span>
                                </span>
                                <span className="text-xs font-semibold text-[#005a9c]">This one</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                      {matches.length === 0 && !choosing && <p className="text-sm text-neutral-500">No student matched the name on the receipt. Choose the student:</p>}
                      {choosing || matches.length === 0
                        ? <StudentPicker students={room.students} classes={room.classes} onPick={(s) => { setStudentId(s.id); setChoosing(false); }} />
                        : <button type="button" onClick={() => setChoosing(true)} className="mt-2 text-sm font-medium text-[#005a9c] hover:underline">Someone else…</button>}
                    </>
                  )}

                  <h3 className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">Payment</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block"><span className="mb-1 block text-xs font-medium text-neutral-500">Amount (₹)</span>
                      <input className={field} inputMode="decimal" value={form.amount} onChange={set('amount')} aria-label="Amount" /></label>
                    <label className="block"><span className="mb-1 block text-xs font-medium text-neutral-500">Date</span>
                      <input className={field} type="date" max={todayISO()} value={form.date} onChange={set('date')} aria-label="Payment date" /></label>
                    <label className="block"><span className="mb-1 block text-xs font-medium text-neutral-500">Paid by</span>
                      <select className={field} value={form.mode} onChange={set('mode')} aria-label="Payment mode">{MODES.map((m) => <option key={m}>{m}</option>)}</select></label>
                    <label className="block"><span className="mb-1 block text-xs font-medium text-neutral-500">Receipt / UPI ref.</span>
                      <input className={field} value={form.reference} onChange={set('reference')} aria-label="Reference" /></label>
                    <label className="block col-span-2"><span className="mb-1 block text-xs font-medium text-neutral-500">For</span>
                      <input className={field} value={form.note} onChange={set('note')} placeholder="e.g. November fee" aria-label="Note" /></label>
                  </div>
                  {duplicate && <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">A payment with this reference is already recorded ({duplicate.receiptNo}, {formatMoney(duplicate.amount)} on {formatDate(duplicate.date)}). Make sure this is not the same receipt.</p>}

                  {student && (
                    <dl className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-neutral-50 p-3 text-center">
                      <div><dt className="text-[11px] text-neutral-500">Total fee</dt><dd className="font-semibold tabular-nums">{formatMoney(student.fee || 0)}</dd></div>
                      <div><dt className="text-[11px] text-neutral-500">Due now</dt><dd className="font-semibold tabular-nums">{formatMoney(dueBefore)}</dd></div>
                      <div><dt className="text-[11px] text-neutral-500">Due after</dt><dd className={`font-semibold tabular-nums ${dueBefore - amount <= 0 ? 'text-[#17653a]' : ''}`}>{formatMoney(Math.max(0, dueBefore - amount))}</dd></div>
                    </dl>
                  )}
                  {student && amount > dueBefore && dueBefore >= 0 && amount > 0 && (
                    <p className="mt-2 text-xs text-amber-700">This is {formatMoney(amount - dueBefore)} more than what is due.</p>
                  )}

                  <button type="button" onClick={confirm} disabled={!student || !(amount > 0) || step === 'saving'}
                    className="mt-5 w-full h-12 rounded-xl bg-[#005a9c] text-white text-sm font-semibold hover:bg-[#1b365d] disabled:opacity-40 inline-flex items-center justify-center gap-2">
                    {step === 'saving' ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><CheckCircle2 className="w-4 h-4" /> Confirm and record {amount > 0 ? formatMoney(amount) : 'payment'}</>}
                  </button>
                </>
              )}

              {step === 'done' && saved && (
                <div className="py-6 text-center">
                  <CheckCircle2 className="mx-auto w-12 h-12 text-[#17653a]" />
                  <h2 className="mt-3 text-lg font-medium text-neutral-900">{formatMoney(saved.payment.amount)} recorded for {saved.student.name}</h2>
                  <p className="mt-1 text-sm text-neutral-500">Receipt {saved.payment.receiptNo} · {saved.dueAfter > 0 ? `${formatMoney(saved.dueAfter)} still due` : 'Fee paid in full'}</p>
                  {error && <p className="mt-3 text-sm text-amber-700">{error}</p>}
                  <div className="mt-6 flex flex-col sm:flex-row justify-center gap-2">
                    <button type="button" onClick={reset} className="h-11 px-5 rounded-xl bg-[#005a9c] text-white text-sm font-semibold hover:bg-[#1b365d] inline-flex items-center justify-center gap-2"><ScanLine className="w-4 h-4" /> Scan next receipt</button>
                    <button type="button" onClick={() => navigate('/fees')} className="h-11 px-5 rounded-xl bg-white ring-1 ring-neutral-200 text-sm font-semibold text-neutral-800 hover:bg-neutral-50">Open fees</button>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {scanned.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-sm font-semibold text-neutral-700">Recently scanned</h2>
            <ul className="rounded-3xl bg-white shadow-card divide-y divide-neutral-100">
              {scanned.map((p) => {
                const s = room.students.find((x) => x.id === p.studentId);
                return (
                  <li key={p.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                    <span className="w-20 shrink-0 text-xs font-medium text-neutral-400 tabular-nums">{p.receiptNo}</span>
                    <span className="min-w-0 flex-1 truncate"><span className="font-medium text-neutral-900">{s?.name || 'Deleted student'}</span><span className="text-neutral-500"> · {formatDate(p.date)} · {p.mode}</span></span>
                    <span className="font-semibold tabular-nums">{formatMoney(p.amount)}</span>
                    <button type="button" onClick={() => setViewing(p.receiptId)} className="h-8 px-2.5 rounded-lg text-xs font-medium text-[#005a9c] hover:bg-[#eef7fc] inline-flex items-center gap-1"><ImageIcon className="w-3.5 h-3.5" /> Photo</button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </main>
      {viewing && <ReceiptPhoto receiptId={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}
