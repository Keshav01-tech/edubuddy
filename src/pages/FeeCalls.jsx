import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PhoneCall, Check, RefreshCw, X, Bot, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppHeader } from '../components/AppHeader';
import { useClassroom, todayISO } from '../services/classroom';
import { getToken } from '../services/cloud';

const MAX_PER_START = 25;

async function callsApi(payload) {
  const response = await fetch('/api/calls', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Fee calls are not available right now.');
  return data;
}

const rupees = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const shortDate = (iso) => (iso ? new Date(`${String(iso).slice(0, 10)}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '');
const when = (value) => new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

const OUTCOMES = {
  promised: ['Promised to pay', 'bg-emerald-50 text-emerald-700'],
  paid_already: ['Says already paid', 'bg-sky-50 text-sky-700'],
  callback: ['Wants a call back', 'bg-amber-50 text-amber-700'],
  dispute: ['Disputes amount', 'bg-rose-50 text-rose-700'],
  refused: ['Refused', 'bg-rose-50 text-rose-700'],
  wrong_number: ['Wrong number', 'bg-neutral-100 text-neutral-600'],
  unclear: ['Unclear', 'bg-neutral-100 text-neutral-600'],
  not_reached: ['Not reached', 'bg-neutral-100 text-neutral-600'],
};
const LIVE = ['queued', 'initiated', 'ringing', 'in-progress'];

function OutcomeBadge({ call }) {
  if (LIVE.includes(call.status)) {
    return <span className="inline-flex items-center gap-1 rounded-full bg-[#eef6fc] px-2 py-0.5 text-xs font-medium text-[#005a9c]"><span className="h-1.5 w-1.5 rounded-full bg-[#005a9c] animate-pulse" />{call.status === 'in-progress' ? 'On call' : 'Calling'}</span>;
  }
  const [label, tone] = OUTCOMES[call.outcome] || ['Ended', 'bg-neutral-100 text-neutral-600'];
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>{label}</span>;
}

function Toggle({ on, onChange, disabled, label }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} disabled={disabled} onClick={() => onChange(!on)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${on ? 'bg-[#005a9c]' : 'bg-neutral-300'}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  );
}

export default function FeeCalls() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const room = useClassroom();
  const isAdmin = user?.role === 'admin';
  const today = todayISO();

  const [info, setInfo] = useState(null);
  const [error, setError] = useState('');
  const [picked, setPicked] = useState(() => new Set());
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setInfo(await callsApi({ action: 'list' }));
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  // While a call is ringing or live, keep the log fresh.
  const live = (info?.calls || []).some((c) => LIVE.includes(c.status));
  useEffect(() => {
    if (!live) return undefined;
    const timer = setInterval(refresh, 5000);
    return () => clearInterval(timer);
  }, [live, refresh]);

  const lastCallOf = useMemo(() => {
    const map = new Map();
    (info?.calls || []).forEach((c) => { if (!map.has(c.studentId)) map.set(c.studentId, c); });
    return map;
  }, [info]);

  const owing = useMemo(() => {
    const paid = new Map();
    room.payments.forEach((p) => paid.set(p.studentId, (paid.get(p.studentId) || 0) + (Number(p.amount) || 0)));
    return room.students
      .map((s) => ({ ...s, due: Math.max(0, (Number(s.fee) || 0) - (paid.get(s.id) || 0)) }))
      .filter((s) => s.due > 0)
      .sort((a, b) => (a.feeDate || '9999').localeCompare(b.feeDate || '9999') || b.due - a.due);
  }, [room.students, room.payments]);

  const callable = owing.filter((s) => s.phone);
  const chosen = callable.filter((s) => picked.has(s.id));
  const dueToday = new Set(info?.dueToday || []);

  const toggle = (id) => setPicked((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else if (next.size < MAX_PER_START) next.add(id);
    return next;
  });
  const pickOverdue = () => setPicked(new Set(callable.filter((s) => s.feeDate && s.feeDate < today).slice(0, MAX_PER_START).map((s) => s.id)));

  const saveSettings = async (patch) => {
    const settings = { ...info.settings, ...patch };
    setInfo((prev) => ({ ...prev, settings }));
    try {
      const result = await callsApi({ action: 'settings', settings });
      setInfo((prev) => ({ ...prev, settings: result.settings }));
    } catch (err) {
      setNotice({ error: err.message });
      refresh();
    }
  };

  const startCalls = async () => {
    if (!chosen.length || busy) return;
    if (!window.confirm(`The AI assistant will call ${chosen.length} parent${chosen.length === 1 ? '' : 's'} now about pending fees. Continue?`)) return;
    setBusy(true);
    setNotice(null);
    try {
      const result = await callsApi({ action: 'start', studentIds: chosen.map((s) => s.id) });
      setNotice(result);
      setPicked(new Set());
      refresh();
    } catch (err) {
      setNotice({ error: err.message });
    } finally {
      setBusy(false);
    }
  };

  const settings = info?.settings;

  return (
    <div className="min-h-dvh app-canvas">
      <AppHeader nav onSignOut={async () => { await signOut(); navigate('/login'); }} />

      <main className="max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-8 pb-28 lg:pb-12 space-y-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-neutral-900 flex items-center gap-2">
            AI fee calls <span className="rounded-full bg-[#eef6fc] px-2 py-0.5 text-[11px] font-semibold text-[#005a9c]">AI</span>
          </h1>
          <p className="mt-1 text-sm text-neutral-500">The assistant calls the parent's saved number, tells them the pending fee, asks when they will pay and notes the answer here.</p>
        </div>

        {error && <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}
        {info && !info.ready && (
          <div className="flex gap-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Calling is not set up yet. The server needs a Twilio voice number (TWILIO_VOICE_FROM) along with the Twilio keys.</p>
          </div>
        )}

        {settings && (
          <section className="bg-white rounded-3xl shadow-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold text-neutral-900">Automatic calls</h2>
                <p className="mt-0.5 text-sm text-neutral-500">
                  Every day around 11:30 AM, call parents whose fee is past its due date.
                  {info.dueToday?.length ? ` ${info.dueToday.length} would be called today.` : ''}
                </p>
              </div>
              <Toggle on={settings.auto} disabled={!isAdmin} label="Automatic calls" onChange={(auto) => saveSettings({ auto })} />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <label className="text-sm">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Language</span>
                <select disabled={!isAdmin} value={settings.language} onChange={(e) => saveSettings({ language: e.target.value })}
                  className="h-10 w-full rounded-xl bg-neutral-50 px-3 ring-1 ring-neutral-200 disabled:opacity-60">
                  <option value="hi">Hindi</option>
                  <option value="en">English</option>
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Start after due date</span>
                <select disabled={!isAdmin} value={settings.graceDays} onChange={(e) => saveSettings({ graceDays: Number(e.target.value) })}
                  className="h-10 w-full rounded-xl bg-neutral-50 px-3 ring-1 ring-neutral-200 disabled:opacity-60">
                  {[0, 2, 3, 5, 7, 10, 15].map((d) => <option key={d} value={d}>{d === 0 ? 'The next day' : `${d} days late`}</option>)}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Call again after</span>
                <select disabled={!isAdmin} value={settings.gapDays} onChange={(e) => saveSettings({ gapDays: Number(e.target.value) })}
                  className="h-10 w-full rounded-xl bg-neutral-50 px-3 ring-1 ring-neutral-200 disabled:opacity-60">
                  {[3, 5, 7, 10, 15, 30].map((d) => <option key={d} value={d}>{d} days</option>)}
                </select>
              </label>
            </div>
            <p className="mt-3 text-xs text-neutral-500">
              A parent who promised a date is not called again before that date. A parent who did not pick up is tried again the next day. Calls are placed only between 9 AM and 8 PM.
              {!isAdmin && ' Only the admin can change these settings.'}
            </p>
          </section>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="bg-white rounded-3xl shadow-card overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-neutral-100">
              <div>
                <h2 className="font-semibold text-neutral-900">Pending fees</h2>
                <p className="text-xs text-neutral-500">{owing.length} student{owing.length === 1 ? '' : 's'} · {chosen.length} selected</p>
              </div>
              <button type="button" onClick={pickOverdue} className="h-9 px-3 rounded-lg text-sm font-medium text-[#005a9c] hover:bg-[#eef6fc]">Select overdue</button>
            </div>
            {owing.length === 0 ? (
              <p className="py-12 text-center text-sm text-neutral-500">No pending fees. Nothing to call about.</p>
            ) : (
              <ul className="max-h-[28rem] overflow-y-auto divide-y divide-neutral-100">
                {owing.map((s) => {
                  const on = picked.has(s.id);
                  const last = lastCallOf.get(s.id);
                  const late = s.feeDate && s.feeDate < today;
                  return (
                    <li key={s.id}>
                      <button type="button" disabled={!s.phone} onClick={() => toggle(s.id)} aria-pressed={on}
                        className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50">
                        <span className={`h-5 w-5 shrink-0 rounded-md grid place-items-center ${on ? 'bg-[#005a9c] text-white' : 'ring-1 ring-neutral-300'}`}>{on && <Check className="w-3.5 h-3.5" />}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-neutral-900">{s.name}</span>
                          <span className="block truncate text-xs text-neutral-500">
                            {!s.phone ? 'No parent number' : [s.className, s.feeDate ? `${late ? 'Late since' : 'Due'} ${shortDate(s.feeDate)}` : 'No due date', last && `Called ${shortDate(new Date(last.createdAt).toISOString())}`].filter(Boolean).join(' · ')}
                          </span>
                        </span>
                        <span className="text-right">
                          <span className={`block text-sm font-semibold tabular-nums ${late ? 'text-rose-600' : 'text-neutral-900'}`}>{rupees(s.due)}</span>
                          {dueToday.has(s.id) && settings?.auto && <span className="text-[11px] text-[#005a9c]">Auto call today</span>}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="border-t border-neutral-100 p-4 space-y-2">
              {notice && (
                <div className={`flex items-start justify-between gap-3 rounded-xl px-4 py-2.5 text-sm ${notice.error ? 'bg-rose-50 text-rose-800' : 'bg-neutral-900 text-white'}`}>
                  <div>
                    {notice.error || `Calling ${notice.placed?.length || 0} parent${notice.placed?.length === 1 ? '' : 's'}.`}
                    {notice.failed?.length > 0 && <ul className="mt-1 text-xs opacity-90">{notice.failed.map((f, i) => <li key={i}><strong>{f.name}:</strong> {f.error}</li>)}</ul>}
                  </div>
                  <button type="button" onClick={() => setNotice(null)} aria-label="Close"><X className="w-4 h-4" /></button>
                </div>
              )}
              <button type="button" onClick={startCalls} disabled={busy || !chosen.length || !info?.ready}
                className="w-full h-12 rounded-xl bg-[#005a9c] hover:bg-[#1b365d] text-white font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-40">
                <PhoneCall className="w-4 h-4" />
                {busy ? 'Placing calls…' : chosen.length ? `Call ${chosen.length} parent${chosen.length === 1 ? '' : 's'} now` : 'Select students to call'}
              </button>
            </div>
          </section>

          <section className="bg-white rounded-3xl shadow-card overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-neutral-100">
              <div>
                <h2 className="font-semibold text-neutral-900">Call log</h2>
                <p className="text-xs text-neutral-500">What each parent said</p>
              </div>
              <button type="button" onClick={refresh} className="h-9 w-9 grid place-items-center rounded-lg text-neutral-500 hover:bg-neutral-100" aria-label="Refresh"><RefreshCw className="w-4 h-4" /></button>
            </div>
            {!info?.calls?.length ? (
              <p className="py-12 text-center text-sm text-neutral-500">{info ? 'No calls yet.' : 'Loading…'}</p>
            ) : (
              <ul className="max-h-[34rem] overflow-y-auto divide-y divide-neutral-100">
                {info.calls.map((c) => (
                  <li key={c.id} className="px-5 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-neutral-900">{c.studentName} <span className="font-normal text-neutral-500">· {rupees(c.due)}</span></p>
                        <p className="text-xs text-neutral-500">{when(c.createdAt)} · {c.by === 'auto' ? 'Automatic' : `By ${c.by}`}{c.duration ? ` · ${Math.ceil(c.duration / 60)} min` : ''}</p>
                      </div>
                      <OutcomeBadge call={c} />
                    </div>
                    {(c.summary || c.promiseDate) && (
                      <p className="mt-1.5 text-sm text-neutral-700">
                        {c.promiseDate && <strong className="font-semibold">Will pay by {shortDate(c.promiseDate)}. </strong>}
                        {c.summary}
                      </p>
                    )}
                    {c.transcript?.length > 0 && (
                      <details className="mt-1.5">
                        <summary className="cursor-pointer text-xs font-semibold text-[#005a9c]">Conversation</summary>
                        <ul className="mt-2 space-y-1.5">
                          {c.transcript.map((t, i) => (
                            <li key={i} className={`flex gap-2 text-sm ${t.who === 'agent' ? '' : 'flex-row-reverse text-right'}`}>
                              {t.who === 'agent' && <Bot className="mt-0.5 h-4 w-4 shrink-0 text-[#005a9c]" />}
                              <span className={`rounded-xl px-3 py-1.5 ${t.who === 'agent' ? 'bg-[#eef6fc] text-neutral-800' : 'bg-neutral-100 text-neutral-800'}`}>{t.text}</span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
