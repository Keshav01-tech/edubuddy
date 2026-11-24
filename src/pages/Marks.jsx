import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ClipboardList, Plus, Trash2, X, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStudy } from '../context/StudyContext';
import { AppHeader } from '../components/AppHeader';
import { useClassroom, todayISO, formatDate } from '../services/classroom';
import { batchesForPaper } from '../services/teachers';
import { PageHeader, Picker, EmptyState } from '../components/ui';
import { useT } from '../i18n';

const field = 'w-full h-11 px-3 text-base sm:text-sm bg-white rounded-xl ring-1 ring-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-400 placeholder:text-neutral-400';

/** Every batch the signed-in user may mark, as picker options. A class without batches is one option. */
export function batchOptions(classes) {
  return classes.flatMap((c) => ((c.sections || []).length
    ? c.sections.map((sec) => ({ value: `${c.name}||${sec}`, label: `${c.name} · Batch ${sec}${c.timings?.[sec]?.subject ? ` · ${c.timings[sec].subject}` : ''}` }))
    : [{ value: `${c.name}||`, label: c.name }]));
}

const splitKey = (key) => { const [className, section = ''] = String(key || '').split('||'); return { className, section }; };

function TestEditor({ test, students, syncState, syncError, onRetry, onSave, onDone, onCancel, onDelete }) {
  const { t } = useT();
  const [form, setForm] = useState({
    title: test.title || '', subject: test.subject || '', date: test.date || todayISO(), maxMarks: test.maxMarks ?? 20,
  });
  const [scores, setScores] = useState(() => Object.fromEntries(students.map((s) => [s.id, test.scores?.[s.id] ?? ''])));
  const [error, setError] = useState('');
  const max = Number(form.maxMarks) || 0;

  const testId = useRef(test.id);
  const createdAt = useRef(test.createdAt || new Date().toISOString());
  const lastSaved = useRef(test.id ? JSON.stringify({
    title: test.title, subject: test.subject || '', date: test.date, maxMarks: Number(test.maxMarks), scores: test.scores || {},
  }) : '');
  const [savedHere, setSavedHere] = useState(false);

  // Saves the test as it stands. Runs after each student's mark, so marks reach parents one by one.
  const commit = ({ auto = false } = {}) => {
    const entered = Object.fromEntries(Object.entries(scores).filter(([, v]) => v !== '').map(([id, v]) => [id, Number(v)]));
    if (auto && !testId.current && !Object.keys(entered).length) return true;
    if (!form.title.trim()) { setError('Give the test a name, e.g. "Unit test 3".'); return false; }
    if (!(max > 0)) { setError('Enter the maximum marks.'); return false; }
    const bad = students.find((s) => scores[s.id] !== '' && (!Number.isFinite(Number(scores[s.id])) || Number(scores[s.id]) < 0 || Number(scores[s.id]) > max));
    if (bad) { setError(`${bad.name}'s marks must be between 0 and ${max}.`); return false; }
    // Marks of students who have since left this batch are kept.
    const shown = new Set(students.map((s) => s.id));
    const kept = Object.fromEntries(Object.entries(test.scores || {}).filter(([id]) => !shown.has(id)));
    const fields = { title: form.title.trim(), subject: form.subject.trim(), date: form.date, maxMarks: max, scores: { ...kept, ...entered } };
    const key = JSON.stringify(fields);
    setError('');
    if (key === lastSaved.current) return true;
    const id = onSave({ ...test, ...fields, id: testId.current, createdAt: createdAt.current });
    if (!id) { setError('You can only enter marks for your own batches.'); return false; }
    testId.current = id;
    lastSaved.current = key;
    setSavedHere(true);
    return true;
  };

  const save = (event) => {
    event.preventDefault();
    if (commit()) onDone(form.title.trim());
  };

  return (
    <form onSubmit={save} className="bg-white rounded-3xl ring-1 ring-neutral-200 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold text-neutral-900">{t(test.id ? 'Edit marks' : 'New test')}</h2>
        <button type="button" onClick={onCancel} className="h-9 w-9 grid place-items-center rounded-xl text-neutral-400 hover:bg-neutral-100" aria-label="Close"><X className="w-5 h-5" /></button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <label className="col-span-2">
          <span className="mb-1 block text-xs font-semibold text-neutral-600">{t('Test name')}</span>
          <input className={field} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Unit test 3" autoFocus />
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold text-neutral-600">{t('Date')}</span>
          <input type="date" className={field} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold text-neutral-600">{t('Out of')}</span>
          <input className={field} inputMode="numeric" value={form.maxMarks} onChange={(e) => setForm({ ...form, maxMarks: e.target.value.replace(/[^\d.]/g, '') })} />
        </label>
        <label className="col-span-2 sm:col-span-4">
          <span className="mb-1 block text-xs font-semibold text-neutral-600">{t('Subject')}</span>
          <input className={field} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Science" />
        </label>
      </div>

      <p className="mt-5 mb-2 flex items-center justify-between text-xs text-neutral-500">
        <span>{t('Type each mark and press Enter for the next student.')}</span>
        <span className="font-semibold text-neutral-700">{t('{done} of {total} marked', { done: Object.values(scores).filter((v) => v !== '').length, total: students.length })}</span>
      </p>
      <div className="rounded-2xl ring-1 ring-neutral-200 divide-y divide-neutral-100">
        {students.length === 0 && <p className="p-4 text-sm text-neutral-500">{t('No students in this batch yet.')}</p>}
        {students.map((s, i) => (
          <label key={s.id} className="flex items-center gap-3 px-4 py-2.5">
            <span className="flex-1 min-w-0 truncate text-sm font-medium text-neutral-800">{s.name}</span>
            <input
              className="w-20 h-10 px-3 text-right text-base sm:text-sm bg-neutral-50 rounded-lg ring-1 ring-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-400"
              inputMode="decimal"
              enterKeyHint={i === students.length - 1 ? 'done' : 'next'}
              data-score
              onKeyDown={(e) => {
                // Enter moves to the next student, so marks go in one after another from the checked copies.
                if (e.key !== 'Enter') return;
                const all = [...e.currentTarget.form.querySelectorAll('[data-score]')];
                const next = all[all.indexOf(e.currentTarget) + 1];
                if (next) { e.preventDefault(); next.focus(); next.select(); }
              }}
              value={scores[s.id]}
              onBlur={() => commit({ auto: true })}
              onChange={(e) => setScores({ ...scores, [s.id]: e.target.value.replace(/[^\d.]/g, '') })}
              placeholder="–"
              aria-label={`${s.name} marks`}
            />
            <span className="w-12 text-xs text-neutral-400">/ {max || '–'}</span>
          </label>
        ))}
      </div>

      {error && <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">{error}</p>}
      {savedHere && !error && (
        <p className="mt-3 text-xs font-medium text-neutral-600" role="status">
          {syncState === 'error' ? (
            <span className="text-rose-700">
              {t('Not saved.')} {syncError}{' '}
              <button type="button" onClick={onRetry} className="underline">{t('Try again')}</button>
            </span>
          ) : syncState === 'saving' ? t('Saving…') : t('Saved. Parents can see these marks.')}
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="submit" className="h-11 px-5 rounded-xl bg-[#005a9c] hover:bg-[#1b365d] text-white text-sm font-semibold">{t('Save marks')}</button>
        <button type="button" onClick={onCancel} className="h-11 px-4 rounded-xl text-sm font-medium text-neutral-600 hover:bg-neutral-100">{t('Close')}</button>
        {testId.current && onDelete && (
          <button type="button" onClick={() => { if (confirm(`Delete "${form.title}" and its marks?`)) onDelete(testId.current); }} className="ml-auto h-11 px-4 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 inline-flex items-center gap-1.5">
            <Trash2 className="w-4 h-4" /> {t('Delete test')}
          </button>
        )}
      </div>
    </form>
  );
}

export default function Marks() {
  const { t } = useT();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const room = useClassroom();
  const options = useMemo(() => batchOptions(room.classes), [room.classes]);
  const [batch, setBatch] = useState('');
  const [editing, setEditing] = useState(null);
  const [saved, setSaved] = useState('');
  // The teacher picks one of their own papers (or arrives from one), then the batch that took it.
  const { sessions, loadingSessions } = useStudy();
  const [params, setParams] = useSearchParams();
  const [paperId, setPaperId] = useState(() => params.get('paper') || '');
  const papers = sessions.filter((s) => batchesForPaper(options, s.class_name).length > 0);
  const paperOptions = papers.map((p) => ({
    value: p.id,
    label: [p.chapter_name, p.class_name, p.subject_name, p.total_marks ? `${p.total_marks} marks` : ''].filter(Boolean).join(' · '),
  }));
  const paper = papers.find((p) => p.id === paperId);
  const paperBatches = paper ? batchesForPaper(options, paper.class_name) : [];
  const openPaper = (value) => {
    const picked = splitKey(value);
    const existing = room.tests.find((x) => x.paperId === paper.id && x.className === picked.className && (x.section || '') === picked.section);
    setBatch(value);
    setSaved('');
    setEditing(existing || {
      ...picked,
      paperId: paper.id,
      title: paper.chapter_name || '',
      subject: paper.subject_name || '',
      maxMarks: paper.total_marks || 20,
    });
    setPaperId('');
    setParams({}, { replace: true });
  };
  // With only one possible batch there is nothing to ask.
  useEffect(() => {
    if (paper && !editing && !room.loading && paperBatches.length === 1) openPaper(paperBatches[0].value);
  }, [paper?.id, paperBatches.length, room.loading]); // eslint-disable-line react-hooks/exhaustive-deps
  const current = batch || options[0]?.value || '';
  const { className, section } = splitKey(current);

  const students = room.students.filter((s) => s.className === className && (!section || (s.batches || []).includes(section)));
  const tests = room.tests.filter((x) => x.className === className && (x.section || '') === section);
  const subjectOf = room.classes.find((c) => c.name === className)?.timings?.[section]?.subject || '';

  const average = (test) => {
    const vals = Object.values(test.scores || {}).map(Number).filter(Number.isFinite);
    return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
  };

  return (
    <div className="min-h-dvh app-canvas">
      <AppHeader nav onSignOut={async () => { await signOut(); navigate('/login'); }} />
      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-14">
        <PageHeader
          icon={ClipboardList}
          eyebrow={t('Teaching')}
          title={t('Test marks')}
          subtitle={t("Enter each student's marks after a test. Parents see them in their parent panel.")}
          actions={current && !editing && (
            <button type="button" onClick={() => { setSaved(''); setEditing({ className, section, subject: subjectOf }); }} className="h-10 px-4 rounded-xl bg-[#005a9c] hover:bg-[#1b365d] text-white text-sm font-semibold inline-flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> {t('New test')}
            </button>
          )}
        />

        {options.length === 0 ? (
          <div className="bg-white rounded-3xl ring-1 ring-neutral-200"><EmptyState icon={ClipboardList} title={t('No batches yet')} text={room.isTeacher ? 'Ask your admin to give you a batch.' : 'Create a batch on the Batches page first.'} /></div>
        ) : (
          <div className="space-y-4">
            {!editing && (
              <section className="rounded-3xl bg-white p-4 ring-1 ring-neutral-200 sm:p-5">
                <h2 className="font-semibold text-neutral-900">{t('Give marks for a test paper')}</h2>
                <p className="mt-0.5 mb-3 text-sm text-neutral-500">{t("Pick a paper you created, then enter each student's marks.")}</p>
                {paperOptions.length > 0 ? (
                  <div className="max-w-xl">
                    <Picker label={t('Choose test paper')} placeholder={t('Choose test paper')} value={paperId} onChange={setPaperId} options={paperOptions} />
                  </div>
                ) : loadingSessions ? (
                  <p className="text-sm text-neutral-500">{t('Loading…')}</p>
                ) : (
                  <p className="text-sm text-neutral-600">
                    {t('No test papers yet.')}{' '}
                    <Link to="/tests" className="font-semibold text-[#005a9c] underline underline-offset-2">{t('Create a test paper')}</Link>
                  </p>
                )}
                {paper && paperBatches.length > 1 && (
                  <div className="mt-4">
                    <p className="mb-2 text-sm font-semibold text-neutral-800">{t('Which batch took this test?')}</p>
                    <div className="flex flex-wrap gap-2">
                      {paperBatches.map((o) => (
                        <button key={o.value} type="button" onClick={() => openPaper(o.value)} className="min-h-10 rounded-xl bg-[#eef3ff] px-4 py-2 text-left text-sm font-semibold text-[#005a9c] hover:bg-[#dfe9ff]">
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            <div className="max-w-md">
              <span className="mb-1 block text-xs font-semibold text-neutral-600">{t('Batch')}</span>
              <Picker label={t('Choose batch')} value={current} onChange={(v) => { setBatch(v); setEditing(null); }} options={options} />
            </div>

            {saved && (
              <p className="flex items-center gap-2 rounded-xl bg-white ring-1 ring-neutral-200 px-4 py-3 text-sm text-neutral-800" role="status">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Marks saved for {saved}. Parents can see them now.
              </p>
            )}

            {editing ? (
              <TestEditor
                key={`${editing.id || 'new'}|${current}`}
                test={editing}
                students={students}
                syncState={room.syncState}
                syncError={room.syncError}
                onRetry={room.retrySync}
                onCancel={() => setEditing(null)}
                onDelete={(id) => { room.deleteTest(id); setEditing(null); }}
                onSave={(test) => room.saveTest(test)}
                onDone={(title) => { setSaved(title); setEditing(null); }}
              />
            ) : tests.length === 0 ? (
              <div className="bg-white rounded-3xl ring-1 ring-neutral-200"><EmptyState icon={ClipboardList} title={t('No tests for this batch yet')} text={t('Tap New test to enter the first marks.')} /></div>
            ) : (
              <ul className="bg-white rounded-3xl ring-1 ring-neutral-200 divide-y divide-neutral-100 overflow-hidden">
                {tests.map((test) => {
                  const avg = average(test);
                  const entered = Object.keys(test.scores || {}).length;
                  return (
                    <li key={test.id}>
                      <button type="button" onClick={() => { setSaved(''); setEditing(test); }} className="w-full flex items-center gap-3 px-4 sm:px-5 py-3.5 text-left hover:bg-neutral-50">
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold text-neutral-900 truncate">{test.title}</span>
                          <span className="block text-xs text-neutral-500">{[test.subject, formatDate(test.date), `${entered} of ${students.length} marked`].filter(Boolean).join(' · ')}</span>
                        </span>
                        <span className="text-right shrink-0">
                          <span className="block text-sm font-semibold text-neutral-900">{avg == null ? '–' : `${avg} / ${test.maxMarks}`}</span>
                          <span className="block text-[11px] text-neutral-400">{t('class average')}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
