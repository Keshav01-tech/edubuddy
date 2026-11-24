import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListChecks, Plus, Send, Sparkles, Trash2, Upload, X, Download } from 'lucide-react';
import { ChapterChoice, useChapterChoice } from '../components/ChapterChoice';
import { useAuth } from '../context/AuthContext';
import { AppHeader } from '../components/AppHeader';
import { PageHeader, Picker, EmptyState } from '../components/ui';
import { MathText } from '../components/MathText';
import { Spinner } from '../components/Spinner';
import { useClassroom, formatDate } from '../services/classroom';
import { callDb } from '../services/cloud';
import { batchOptions } from '../services/teachers';
import { blankQuestion, paperMcqs, parseQuizCsv, QUIZ_CSV_SAMPLE } from '../services/quiz';
import { useT } from '../i18n';

const field = 'w-full h-11 px-3 text-base sm:text-sm bg-white rounded-xl ring-1 ring-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-400 placeholder:text-neutral-400';
const LETTERS = ['A', 'B', 'C', 'D'];
const MAX_QUESTIONS = 50;

const AI_COUNTS = [5, 10, 15, 20];

function QuizBuilder({ options, classes, papers, earlier, onSent, onCancel }) {
  const { t } = useT();
  const [form, setForm] = useState({ title: '', subject: '', batch: options.length === 1 ? options[0].value : '' });
  const [questions, setQuestions] = useState([blankQuestion()]);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [sending, setSending] = useState(false);
  const fileRef = useRef(null);
  const [aiCount, setAiCount] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [batchClass, batchSection = ''] = form.batch.split('||');
  const batchTiming = classes.find((c) => c.name === batchClass)?.timings?.[batchSection] || {};
  const choice = useChapterChoice(batchClass, batchTiming.subject || '', batchTiming.medium || '');

  const generate = async () => {
    setInfo('');
    if (!form.batch) { setError(t('Choose the batch for this quiz.')); return; }
    if (!choice.picked.length) { setError(t('Choose at least one chapter.')); return; }
    const room = MAX_QUESTIONS - questions.filter((q) => !isBlank(q)).length;
    if (room < 1) { setError(t('A quiz can have up to 50 questions.')); return; }
    setError('');
    setGenerating(true);
    try {
      const { generateQuizQuestions } = await import('../services/openai');
      const made = await generateQuizQuestions({
        className: choice.cls,
        subject: choice.subject,
        chapters: choice.picked,
        count: Math.min(aiCount, room),
        language: choice.language,
        avoid: [...earlier, ...questions.map((q) => q.question)].filter(Boolean).slice(-120),
      });
      const added = paperMcqs({ language: choice.language, questions: made });
      if (!added.length) throw new Error(t('The AI did not return usable questions. Try again.'));
      append(added);
      setForm((f) => ({
        ...f,
        title: f.title || (choice.picked.length === 1 ? `${choice.picked[0]} practice` : `${choice.subject} practice`),
        subject: f.subject || choice.subject,
      }));
      setInfo(`${t('{count} questions added.', { count: added.length })} ${t('Check them before sending.')}`);
    } catch (err) {
      setError(err.message || t('Could not create the quiz. Try again.'));
    } finally {
      setGenerating(false);
    }
  };

  const change = (index, patch) => setQuestions((list) => list.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  const isBlank = (q) => !q.question.trim() && q.options.every((o) => !o.trim());
  const append = (added) => {
    setQuestions((list) => [...list.filter((q) => !isBlank(q)), ...added].slice(0, MAX_QUESTIONS));
  };

  const fromPaper = (id) => {
    const paper = papers.find((p) => p.id === id);
    if (!paper) return;
    const added = paperMcqs(paper);
    append(added);
    setForm((f) => ({ ...f, title: f.title || paper.chapter_name || '', subject: f.subject || paper.subject_name || '' }));
    setError('');
    setInfo(t('{count} questions added.', { count: added.length }));
  };

  const fromFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const { questions: added, errors } = parseQuizCsv(await file.text());
    if (!added.length) {
      setInfo('');
      setError(t('No questions found. Use the sample CSV format.'));
      return;
    }
    append(added);
    setError('');
    setInfo(`${t('{count} questions added.', { count: added.length })}${errors.length ? ` ${t('Skipped lines')}: ${errors.join(', ')}` : ''}`);
  };

  const send = async () => {
    setInfo('');
    if (!form.title.trim()) { setError(t('Give the quiz a name.')); return; }
    if (!form.batch) { setError(t('Choose the batch for this quiz.')); return; }
    const bad = questions.findIndex((q) => !q.question.trim() || q.options.some((o) => !o.trim()) || q.answer == null);
    if (bad >= 0) { setError(t('Question {n} needs its text, 4 options and the correct answer.', { n: bad + 1 })); return; }
    const [className, section = ''] = form.batch.split('||');
    setSending(true);
    setError('');
    try {
      const { quiz } = await callDb('quizzes.save', { quiz: { title: form.title, subject: form.subject, className, section, questions } });
      onSent(quiz);
    } catch (err) {
      setError(err.message || t('Could not send. Try again.'));
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="bg-white rounded-3xl ring-1 ring-neutral-200 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold text-neutral-900">{t('New practice quiz')}</h2>
        <button type="button" onClick={onCancel} className="h-10 w-10 grid place-items-center rounded-xl text-neutral-400 hover:bg-neutral-100" aria-label={t('Close')}><X className="w-5 h-5" /></button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label>
          <span className="mb-1 block text-xs font-semibold text-neutral-600">{t('Quiz name')}</span>
          <input className={field} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Chapter 3 practice" />
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold text-neutral-600">{t('Subject')}</span>
          <input className={field} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Science" />
        </label>
        <div>
          <span className="mb-1 block text-xs font-semibold text-neutral-600">{t('Batch')}</span>
          <Picker label={t('Choose batch')} placeholder={t('Choose batch')} value={form.batch} onChange={(batch) => setForm({ ...form, batch })} options={options} className="!h-11" />
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-[#eef6fc] p-3 sm:p-4">
        <h3 className="mb-3 flex items-center gap-2 font-semibold text-neutral-900"><Sparkles className="w-4 h-4 text-[#005a9c]" /> {t('Create with AI')}</h3>
        {!form.batch ? (
          <p className="text-sm text-neutral-600">{t('Choose a batch above to see its chapters.')}</p>
        ) : (
          <div className="space-y-3">
            <ChapterChoice choice={choice} />
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-xl bg-white p-1 ring-1 ring-neutral-200" role="radiogroup" aria-label={t('Number of questions')}>
                {AI_COUNTS.map((n) => (
                  <button key={n} type="button" role="radio" aria-checked={aiCount === n} onClick={() => setAiCount(n)} className={`h-9 min-w-10 rounded-lg px-2 text-sm font-semibold ${aiCount === n ? 'bg-[#005a9c] text-white' : 'text-neutral-600'}`}>{n}</button>
                ))}
              </div>
              <button type="button" onClick={generate} disabled={generating} className="h-11 px-4 rounded-xl bg-[#005a9c] hover:bg-[#1b365d] text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60">
                {generating ? <><Spinner size="sm" /> {t('Writing questions…')}</> : <><Sparkles className="w-4 h-4" /> {t('Generate MCQs')}</>}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-2xl bg-neutral-50 p-3">
        <div>
          <span className="mb-1 block text-xs font-semibold text-neutral-600">{t('Add MCQs from my test paper')}</span>
          {papers.length ? (
            <Picker
              label={t('Choose test paper')}
              placeholder={t('Choose test paper')}
              value=""
              onChange={fromPaper}
              options={papers.map((p) => ({ value: p.id, label: [p.chapter_name, p.class_name].filter(Boolean).join(' · '), count: paperMcqs(p).length }))}
              countLabel="MCQ"
              className="!h-11"
            />
          ) : <p className="flex h-11 items-center text-sm text-neutral-500">{t('No saved papers with MCQs.')}</p>}
        </div>
        <div>
          <span className="mb-1 block text-xs font-semibold text-neutral-600">{t('Or upload a CSV file')}</span>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => fileRef.current?.click()} className="h-11 px-4 rounded-xl bg-white ring-1 ring-neutral-200 text-sm font-semibold text-neutral-800 hover:bg-neutral-100 inline-flex items-center gap-1.5">
              <Upload className="w-4 h-4" /> {t('Upload CSV')}
            </button>
            <a href={`data:text/csv;charset=utf-8,${encodeURIComponent(QUIZ_CSV_SAMPLE)}`} download="quiz-sample.csv" className="h-11 px-3 rounded-xl text-sm font-medium text-[#005a9c] hover:bg-white inline-flex items-center gap-1.5">
              <Download className="w-4 h-4" /> {t('Sample')}
            </a>
            <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={fromFile} className="hidden" aria-label={t('Upload CSV')} />
          </div>
        </div>
      </div>
      {info && <p className="mt-3 text-sm text-neutral-700" role="status">{info}</p>}

      <ol className="mt-5 space-y-3">
        {questions.map((q, index) => (
          <li key={index} className="rounded-2xl ring-1 ring-neutral-200 p-3 sm:p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-neutral-800">{t('Question')} {index + 1}</span>
              {questions.length > 1 && (
                <button type="button" onClick={() => setQuestions((list) => list.filter((_, i) => i !== index))} className="h-10 w-10 grid place-items-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-rose-600" aria-label={`${t('Remove question')} ${index + 1}`}>
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <textarea rows={2} className="w-full px-3 py-2 text-base sm:text-sm bg-white rounded-xl ring-1 ring-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-400" value={q.question} onChange={(e) => change(index, { question: e.target.value })} aria-label={`${t('Question')} ${index + 1}`} />
            <p className="mt-2 mb-1 text-xs text-neutral-500">{t('Tick the correct option.')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {q.options.map((option, o) => (
                <div key={o} className="flex items-center gap-2">
                  <button type="button" role="radio" aria-checked={q.answer === o} aria-label={`${t('Correct option')} ${LETTERS[o]}`} onClick={() => change(index, { answer: o })}
                    className={`h-11 w-11 shrink-0 rounded-xl text-sm font-bold ${q.answer === o ? 'bg-[#17784a] text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}>
                    {LETTERS[o]}
                  </button>
                  <input className={field} value={option} aria-label={`${t('Option')} ${LETTERS[o]}`} onChange={(e) => change(index, { options: q.options.map((x, i) => (i === o ? e.target.value : x)) })} />
                </div>
              ))}
            </div>
          </li>
        ))}
      </ol>

      {error && <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">{error}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" disabled={questions.length >= MAX_QUESTIONS} onClick={() => setQuestions((list) => [...list, blankQuestion()])} className="h-11 px-4 rounded-xl bg-white ring-1 ring-neutral-200 text-sm font-semibold text-neutral-800 hover:bg-neutral-50 inline-flex items-center gap-1.5 disabled:opacity-40">
          <Plus className="w-4 h-4" /> {t('Add question')}
        </button>
        <button type="button" onClick={send} disabled={sending} className="ml-auto h-11 px-5 rounded-xl bg-[#005a9c] hover:bg-[#1b365d] text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-50">
          <Send className="w-4 h-4" /> {sending ? t('Sending…') : t('Send to parents')}
        </button>
      </div>
    </section>
  );
}

function QuizRow({ quiz, canDelete, onDelete }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const total = quiz.questions.length;
  const done = quiz.results.filter((r) => r.attempts > 0);
  return (
    <li>
      <div className="flex items-center gap-2 px-4 sm:px-5 py-3">
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="min-w-0 flex-1 text-left">
          <span className="block font-semibold text-neutral-900 truncate">{quiz.title}</span>
          <span className="block text-xs text-neutral-500 truncate">
            {[quiz.className, quiz.section && `${t('Batch')} ${quiz.section}`, quiz.subject, `${total} ${t('questions')}`, formatDate(String(quiz.createdAt).slice(0, 10))].filter(Boolean).join(' · ')}
          </span>
        </button>
        <span className="shrink-0 text-xs font-semibold text-neutral-700">{t('{done} of {total} attempted', { done: done.length, total: quiz.results.length })}</span>
        {canDelete && (
          <button type="button" onClick={() => { if (confirm(`Delete "${quiz.title}" and its results?`)) onDelete(quiz.id); }} className="h-10 w-10 shrink-0 grid place-items-center rounded-lg text-neutral-400 hover:bg-rose-50 hover:text-rose-600" aria-label={`${t('Delete')} ${quiz.title}`}>
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      {open && (
        <div className="px-4 sm:px-5 pb-4">
          {quiz.results.length === 0 ? <p className="text-sm text-neutral-500">{t('No students in this batch yet.')}</p> : (
            <ul className="rounded-2xl ring-1 ring-neutral-200 divide-y divide-neutral-100">
              {quiz.results.map((r) => (
                <li key={r.studentId} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <span className="min-w-0 truncate font-medium text-neutral-800">{r.name}</span>
                  <span className="shrink-0 tabular-nums text-neutral-600">
                    {r.attempts ? `${t('Best')} ${r.best}/${total} · ${r.attempts} ${t('tries')}` : t('Not attempted')}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 max-h-64 overflow-y-auto rounded-2xl bg-neutral-50 p-3 text-sm text-neutral-700">
            {quiz.questions.map((q, i) => (
              <p key={i} className="py-1"><strong>{i + 1}.</strong> <MathText text={q.question} /> <span className="font-semibold text-[#17784a]">({LETTERS[q.answer]}) <MathText text={q.options[q.answer]} /></span></p>
            ))}
          </div>
        </div>
      )}
    </li>
  );
}

export default function Quizzes() {
  const { t } = useT();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const room = useClassroom();
  const options = useMemo(() => batchOptions(room.classes), [room.classes]);
  const [quizzes, setQuizzes] = useState(null);
  const [papers, setPapers] = useState([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState('');

  const load = () => callDb('quizzes.list').then((r) => setQuizzes(r.quizzes)).catch((err) => { setQuizzes([]); setError(err.message); });
  useEffect(() => {
    load();
    callDb('papers.list').then((r) => setPapers((r.papers || []).filter((p) => paperMcqs(p).length > 0))).catch(() => {});
  }, []);

  const remove = async (id) => {
    try {
      await callDb('quizzes.delete', { id });
      setQuizzes((list) => list.filter((q) => q.id !== id));
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="min-h-dvh app-canvas">
      <AppHeader nav onSignOut={async () => { await signOut(); navigate('/login'); }} />
      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-14">
        <PageHeader
          icon={ListChecks}
          eyebrow={t('Teaching')}
          title={t('Practice quiz')}
          subtitle={t('Create an MCQ quiz and send it to the parent panel of a batch.')}
          actions={!creating && options.length > 0 && (
            <button type="button" onClick={() => { setSent(''); setCreating(true); }} className="h-10 px-4 rounded-xl bg-[#005a9c] hover:bg-[#1b365d] text-white text-sm font-semibold inline-flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> {t('New quiz')}
            </button>
          )}
        />
        <div className="space-y-4">
          {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">{error}</p>}
          {sent && <p className="rounded-xl bg-white ring-1 ring-neutral-200 px-4 py-3 text-sm text-neutral-800" role="status">{t('"{title}" is now on the parent panel.', { title: sent })}</p>}
          {creating && (
            <QuizBuilder
              options={options}
              classes={room.classes}
              papers={papers}
              earlier={(quizzes || []).flatMap((q) => q.questions.map((x) => x.question))}
              onCancel={() => setCreating(false)}
              onSent={(quiz) => { setCreating(false); setSent(quiz.title); load(); }}
            />
          )}
          {quizzes === null ? (
            <div className="grid place-items-center py-16"><Spinner size="lg" /></div>
          ) : options.length === 0 ? (
            <div className="bg-white rounded-3xl ring-1 ring-neutral-200"><EmptyState icon={ListChecks} title={t('No batches yet')} text={room.isTeacher ? t('Ask your admin to give you a batch.') : t('Create a batch on the Batches page first.')} /></div>
          ) : quizzes.length === 0 ? (
            !creating && <div className="bg-white rounded-3xl ring-1 ring-neutral-200"><EmptyState icon={ListChecks} title={t('No quizzes yet')} text={t('Tap New quiz to create the first one.')} /></div>
          ) : (
            <ul className="bg-white rounded-3xl ring-1 ring-neutral-200 divide-y divide-neutral-100">
              {quizzes.map((quiz) => (
                <QuizRow key={quiz.id} quiz={quiz} canDelete={!room.isTeacher || quiz.createdBy === user?.id} onDelete={remove} />
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
