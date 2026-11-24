import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ClipboardList, ListChecks, CalendarDays, Wallet, BookOpen, FileText, Image as ImageIcon, Link2, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { callDb } from '../services/cloud';
import { formatMoney, formatDate } from '../services/classroom';
import { openNoteFile, formatSize } from '../services/notes';
import { ParentQuizzes } from '../components/ParentQuizzes';
import { NoteContent } from '../components/NoteContent';
import { LogoMark } from '../components/Logo';
import { Spinner } from '../components/Spinner';
import { useT, LanguageSwitch } from '../i18n';

/*
 * The parent panel. A parent signs in with their phone number and the PIN the institute gave them,
 * and sees only their own child: test marks, attendance, fees and the notes shared with the child's batches.
 * The server checks the child on every request (parent.load); nothing here can change any data.
 */

const pct = (score, max) => (max > 0 ? Math.round((score / max) * 100) : 0);
const tone = (p) => (p >= 75 ? 'bg-[#17784a]' : p >= 50 ? 'bg-amber-500' : 'bg-rose-500');
const toneText = (p) => (p >= 75 ? 'text-[#17784a]' : p >= 50 ? 'text-amber-700' : 'text-rose-600');

function Card({ icon: Icon, title, children, aside }) {
  return (
    <section className="bg-white rounded-3xl ring-1 ring-neutral-200 p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-neutral-900"><Icon className="w-4 h-4 text-[#005a9c]" /> {title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Marks({ tests }) {
  const { t } = useT();
  if (!tests.length) return <p className="text-sm text-neutral-500">{t('No test marks yet. They appear here as soon as the teacher enters them.')}</p>;
  // Oldest to newest for the progress bars, newest first in the list.
  const trend = [...tests].reverse().slice(-8);
  return (
    <>
      {trend.length > 1 && (
        <div className="mb-4">
          <p className="mb-2 text-xs font-medium text-neutral-500">{t('Progress')}</p>
          <div className="flex h-28 items-end gap-2 rounded-2xl bg-neutral-50 px-3 pt-3 pb-2" role="img" aria-label={t('Progress')}>
            {trend.map((x) => {
              const p = pct(x.score, x.maxMarks);
              return (
                <div key={x.id} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1" title={`${x.title}: ${x.score}/${x.maxMarks}`}>
                  <span className="text-[10.5px] font-semibold text-neutral-700 tabular-nums">{p}%</span>
                  <span className={`w-full max-w-9 rounded-t-md ${tone(p)}`} style={{ height: `${Math.max(p, 4) * 0.72}%` }} />
                </div>
              );
            })}
          </div>
        </div>
      )}
      <ul className="divide-y divide-neutral-100">
        {tests.map((x) => {
          const p = pct(x.score, x.maxMarks);
          return (
            <li key={x.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-start gap-3">
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-neutral-900">{x.title}</span>
                  <span className="block text-xs text-neutral-500">{[x.subject, x.date && formatDate(x.date)].filter(Boolean).join(' · ')}</span>
                </span>
                <span className="text-right shrink-0">
                  <span className="block text-lg font-semibold tabular-nums text-neutral-900">{x.score}<span className="text-sm font-normal text-neutral-400"> / {x.maxMarks}</span></span>
                  <span className={`block text-xs font-semibold ${toneText(p)}`}>{p}%</span>
                </span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-neutral-100"><div className={`h-full rounded-full ${tone(p)}`} style={{ width: `${p}%` }} /></div>
              {(x.average != null || x.highest != null) && (
                <p className="mt-1.5 text-xs text-neutral-500">
                  {x.average != null && <>{t('Class average')} {x.average}</>}
                  {x.average != null && x.highest != null && ' · '}
                  {x.highest != null && <>{t('Highest')} {x.highest}</>}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

function Attendance({ entries }) {
  const { t, lang } = useT();
  // One mark per day: present if present in any batch that day.
  const days = useMemo(() => {
    const map = new Map();
    entries.forEach((e) => map.set(e.date, map.get(e.date) === 'P' || e.mark === 'P' ? 'P' : 'A'));
    return map;
  }, [entries]);
  const months = useMemo(() => [...new Set([...days.keys()].map((d) => d.slice(0, 7)))].sort().reverse(), [days]);
  const [month, setMonth] = useState(months[0] || new Date().toISOString().slice(0, 7));
  if (!days.size) return <p className="text-sm text-neutral-500">{t('No attendance marked yet.')}</p>;

  const total = days.size;
  const present = [...days.values()].filter((m) => m === 'P').length;
  const overall = Math.round((present / total) * 100);
  const [y, m] = month.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const count = new Date(y, m, 0).getDate();
  const lead = (first.getDay() + 6) % 7; // Monday first
  const inMonth = [...days.entries()].filter(([d]) => d.startsWith(month));
  const monthPresent = inMonth.filter(([, v]) => v === 'P').length;
  const label = first.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { month: 'long', year: 'numeric' });
  const week = lang === 'hi' ? ['सो', 'मं', 'बु', 'गु', 'शु', 'श', 'र'] : ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-neutral-50 p-3">
          <p className="text-xs text-neutral-500">{t('Overall')}</p>
          <p className={`text-2xl font-semibold tabular-nums ${toneText(overall)}`}>{overall}%</p>
          <p className="text-xs text-neutral-500">{t('{present} of {total} days', { present, total })}</p>
        </div>
        <div className="rounded-2xl bg-neutral-50 p-3">
          <p className="text-xs text-neutral-500">{label}</p>
          <p className="text-2xl font-semibold tabular-nums text-neutral-900">{inMonth.length ? Math.round((monthPresent / inMonth.length) * 100) : 0}%</p>
          <p className="text-xs text-neutral-500">{t('{present} of {total} days', { present: monthPresent, total: inMonth.length })}</p>
        </div>
      </div>
      {months.length > 1 && (
        <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
          {months.slice(0, 6).map((mo) => (
            <button key={mo} type="button" onClick={() => setMonth(mo)} aria-pressed={mo === month}
              className={`h-8 shrink-0 rounded-full px-3 text-xs font-medium ${mo === month ? 'bg-[#005a9c] text-white' : 'bg-neutral-100 text-neutral-700'}`}>
              {new Date(`${mo}-01T00:00:00`).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { month: 'short', year: '2-digit' })}
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-7 gap-1 text-center" aria-label={label}>
        {week.map((d, i) => <span key={i} className="pb-1 text-[11px] font-medium text-neutral-400">{d}</span>)}
        {Array.from({ length: lead }, (_, i) => <span key={`e${i}`} />)}
        {Array.from({ length: count }, (_, i) => {
          const date = `${month}-${String(i + 1).padStart(2, '0')}`;
          const mark = days.get(date);
          return (
            <span key={date} title={mark ? `${formatDate(date)}: ${mark === 'P' ? t('Present') : t('Absent')}` : undefined}
              className={`grid h-9 place-items-center rounded-lg text-xs tabular-nums ${mark === 'P' ? 'bg-emerald-50 font-semibold text-[#17784a]' : mark === 'A' ? 'bg-rose-50 font-semibold text-rose-600' : 'text-neutral-400'}`}>
              {i + 1}
            </span>
          );
        })}
      </div>
      <p className="mt-3 flex gap-4 text-xs text-neutral-500">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-100 ring-1 ring-emerald-300" /> {t('Present')}</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-rose-100 ring-1 ring-rose-300" /> {t('Absent')}</span>
      </p>
    </>
  );
}

function Fees({ child }) {
  const { t } = useT();
  const paid = child.payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const due = Math.max(0, child.fee - paid);
  const overdue = due > 0 && child.feeDate && child.feeDate < new Date().toISOString().slice(0, 10);
  return (
    <>
      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-neutral-50 p-3"><p className="text-xs text-neutral-500">{t('Total fee')}</p><p className="text-base font-semibold tabular-nums">{formatMoney(child.fee)}</p></div>
        <div className="rounded-2xl bg-neutral-50 p-3"><p className="text-xs text-neutral-500">{t('Paid')}</p><p className="text-base font-semibold tabular-nums text-[#17784a]">{formatMoney(paid)}</p></div>
        <div className={`rounded-2xl p-3 ${overdue ? 'bg-rose-50' : 'bg-neutral-50'}`}>
          <p className="text-xs text-neutral-500">{t('Balance')}</p>
          <p className={`text-base font-semibold tabular-nums ${due ? (overdue ? 'text-rose-600' : 'text-neutral-900') : 'text-[#17784a]'}`}>{formatMoney(due)}</p>
        </div>
      </div>
      {due > 0 && child.feeDate && (
        <p className={`mb-3 text-sm ${overdue ? 'font-semibold text-rose-600' : 'text-neutral-600'}`}>
          {overdue ? t('Overdue since {date}', { date: formatDate(child.feeDate) }) : t('Due on {date}', { date: formatDate(child.feeDate) })}
        </p>
      )}
      {child.payments.length === 0 ? (
        <p className="text-sm text-neutral-500">{t('No payments recorded yet.')}</p>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {child.payments.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
              <span className="min-w-0">
                <span className="block text-sm font-medium text-neutral-900">{formatDate(p.date)}</span>
                <span className="block text-xs text-neutral-500">{[p.receiptNo && `${t('Receipt')} ${p.receiptNo}`, p.mode].filter(Boolean).join(' · ')}</span>
              </span>
              <span className="text-sm font-semibold tabular-nums text-neutral-900">{formatMoney(p.amount)}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Notes({ notes }) {
  const { t } = useT();
  const [error, setError] = useState('');
  if (!notes.length) return <p className="text-sm text-neutral-500">{t('No notes shared yet.')}</p>;
  return (
    <>
      {error && <p className="mb-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">{error}</p>}
      <ul className="divide-y divide-neutral-100">
        {notes.map((n) => {
          const Icon = n.fileType?.startsWith('image/') ? ImageIcon : n.fileName ? FileText : n.link ? Link2 : BookOpen;
          return (
            <li key={n.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eef3ff] text-[#005a9c]"><Icon className="w-5 h-5" /></span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-neutral-900">{n.title}</span>
                <span className="block text-xs text-neutral-500">{[n.subject, formatDate(String(n.createdAt).slice(0, 10)), n.createdByName].filter(Boolean).join(' · ')}</span>
                {n.text && <span className="mt-1 block whitespace-pre-line text-sm text-neutral-700">{n.text}</span>}
                {n.content && <NoteContent text={n.content} />}
                <span className="mt-2 flex flex-wrap gap-2">
                  {n.fileName && (
                    <button type="button" onClick={() => openNoteFile(n).catch((err) => setError(err.message))} className="h-9 rounded-lg bg-neutral-100 px-3 text-xs font-semibold text-neutral-800 hover:bg-neutral-200">
                      {n.fileType === 'application/pdf' ? t('Open PDF') : t('Open photo')} · {formatSize(n.fileSize)}
                    </button>
                  )}
                  {n.link && <a href={n.link} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center rounded-lg bg-neutral-100 px-3 text-xs font-semibold text-neutral-800 hover:bg-neutral-200">{t('Open link')}</a>}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export default function ParentPanel() {
  const { t } = useT();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [childId, setChildId] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setBusy(true); setError('');
    try { setData(await callDb('parent.load')); } catch (err) { setError(err.message || t('Could not load. Try again.')); }
    setBusy(false);
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // New marks appear on their own: every 30 seconds while the page is open, and on coming back to it.
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState !== 'visible') return;
      callDb('parent.load').then(setData).catch(() => {});
    };
    const timer = setInterval(refresh, 30000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  const children = data?.children || [];
  const child = children.find((c) => c.id === childId) || children[0];
  const notes = (data?.notes || []).filter((n) => !child || n.forChildren?.includes(child.id));
  const leave = async () => { await signOut(); navigate('/login'); };

  return (
    <div className="min-h-dvh app-canvas">
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
          {data?.institute?.logo ? <img src={data.institute.logo} alt="" className="h-9 w-9 rounded-xl object-cover" /> : <LogoMark className="h-9 w-9" />}
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[15px] font-semibold text-neutral-900">{data?.institute?.name || 'EduBuddy'}</p>
            <p className="text-xs text-neutral-500">{t('Parent panel')}</p>
          </div>
          <LanguageSwitch />
          <button type="button" onClick={leave} className="grid h-10 w-10 place-items-center rounded-xl text-neutral-500 hover:bg-neutral-100" aria-label={t('Sign out')} title={t('Sign out')}>
            <LogOut className="w-[18px] h-[18px]" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-4 pt-5 pb-14">
        {data === null && !error ? (
          <div className="grid place-items-center py-24"><Spinner size="lg" /></div>
        ) : error ? (
          <div className="rounded-3xl bg-white p-6 text-center ring-1 ring-neutral-200">
            <p className="text-sm text-rose-700" role="alert">{error}</p>
            <button type="button" onClick={load} className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-[#005a9c] px-4 text-sm font-semibold text-white"><RefreshCw className="w-4 h-4" /> {t('Try again')}</button>
          </div>
        ) : !child ? (
          <div className="rounded-3xl bg-white p-6 text-center text-sm text-neutral-600 ring-1 ring-neutral-200">{t('No student is linked to this phone number. Please contact the institute.')}</div>
        ) : (
          <>
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-semibold tracking-tight text-neutral-900">{child.name}</h1>
                <p className="text-sm text-neutral-500">{[child.className, child.batches.length ? `${t('Batch')} ${child.batches.join(', ')}` : ''].filter(Boolean).join(' · ')}</p>
              </div>
              <button type="button" onClick={load} disabled={busy} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-neutral-500 ring-1 ring-neutral-200 hover:text-neutral-900 disabled:opacity-50" aria-label={t('Refresh')} title={t('Refresh')}>
                <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} />
              </button>
            </div>
            {children.length > 1 && (
              <div className="flex gap-1.5 overflow-x-auto" role="tablist" aria-label={t('Child')}>
                {children.map((c) => (
                  <button key={c.id} type="button" role="tab" aria-selected={c.id === child.id} onClick={() => setChildId(c.id)}
                    className={`h-9 shrink-0 rounded-full px-4 text-sm font-medium ${c.id === child.id ? 'bg-[#005a9c] text-white' : 'bg-white text-neutral-700 ring-1 ring-neutral-200'}`}>
                    {c.name}
                  </button>
                ))}
              </div>
            )}

            <Card icon={ClipboardList} title={t('Test marks')}><Marks tests={child.tests} /></Card>
            <Card icon={ListChecks} title={t('Practice quizzes')}>
              <ParentQuizzes key={child.id} child={child} onChanged={() => callDb('parent.load').then(setData).catch(() => {})} />
            </Card>
            <Card icon={CalendarDays} title={t('Attendance')}><Attendance key={child.id} entries={child.attendance} /></Card>
            <Card icon={Wallet} title={t('Fees')}><Fees child={child} /></Card>
            <Card icon={BookOpen} title={t('Notes')}><Notes notes={notes} /></Card>
          </>
        )}
      </main>
    </div>
  );
}
