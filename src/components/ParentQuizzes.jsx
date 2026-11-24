import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import { callDb } from '../services/cloud';
import { formatDate } from '../services/classroom';
import { MathText } from './MathText';
import { useT } from '../i18n';

const LETTERS = ['A', 'B', 'C', 'D'];

/** One quiz being taken. The server marks it and only then returns the correct answers. */
function QuizPlayer({ quiz, studentId, onBack, onSubmitted }) {
  const { t } = useT();
  const [answers, setAnswers] = useState(() => quiz.questions.map(() => null));
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const answered = answers.filter((a) => a != null).length;

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      const marked = await callDb('quizzes.submit', { quizId: quiz.id, studentId, answers });
      setResult(marked);
      onSubmitted();
    } catch (err) {
      setError(err.message || t('Could not submit. Try again.'));
    } finally {
      setBusy(false);
    }
  };

  const optionTone = (q, o) => {
    if (result) {
      if (result.correct[q] === o) return 'bg-emerald-50 ring-2 ring-[#17784a] text-neutral-900';
      if (answers[q] === o) return 'bg-rose-50 ring-2 ring-rose-500 text-neutral-900';
      return 'bg-white ring-1 ring-neutral-200 text-neutral-500';
    }
    return answers[q] === o ? 'bg-[#eef6fc] ring-2 ring-[#005a9c] text-neutral-900' : 'bg-white ring-1 ring-neutral-200 text-neutral-800 hover:bg-neutral-50';
  };

  return (
    <div>
      <button type="button" onClick={onBack} className="mb-3 h-10 -ml-2 px-2 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-100 inline-flex items-center gap-1.5">
        <ArrowLeft className="w-4 h-4" /> {t('All quizzes')}
      </button>
      <h3 className="font-semibold text-neutral-900">{quiz.title}</h3>
      {result && (
        <p className="mt-2 rounded-2xl bg-neutral-50 p-3 text-sm text-neutral-700" role="status">
          {t('Score')}: <strong className="text-xl tabular-nums text-neutral-900">{result.score} / {result.total}</strong>
        </p>
      )}
      <ol className="mt-3 space-y-4">
        {quiz.questions.map((q, index) => (
          <li key={index}>
            <p className="mb-2 flex gap-1.5 text-sm font-medium text-neutral-900">
              <span>{index + 1}.</span>
              <span className="min-w-0"><MathText text={q.question} /></span>
              {result && (result.correct[index] === answers[index]
                ? <CheckCircle2 className="ml-auto w-5 h-5 shrink-0 text-[#17784a]" aria-label={t('Correct')} />
                : <XCircle className="ml-auto w-5 h-5 shrink-0 text-rose-600" aria-label={t('Wrong')} />)}
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="radiogroup" aria-label={`${t('Question')} ${index + 1}`}>
              {q.options.map((option, o) => (
                <button key={o} type="button" role="radio" aria-checked={answers[index] === o} disabled={!!result}
                  onClick={() => setAnswers((list) => list.map((a, i) => (i === index ? o : a)))}
                  className={`min-h-11 rounded-xl px-3 py-2 text-left text-sm flex items-start gap-2 ${optionTone(index, o)}`}>
                  <span className="font-bold">{LETTERS[o]}.</span>
                  <span className="min-w-0"><MathText text={option} /></span>
                </button>
              ))}
            </div>
          </li>
        ))}
      </ol>
      {error && <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">{error}</p>}
      <div className="mt-4">
        {result ? (
          <button type="button" onClick={() => { setResult(null); setAnswers(quiz.questions.map(() => null)); }} className="h-11 px-4 rounded-xl bg-white ring-1 ring-neutral-200 text-sm font-semibold text-neutral-800 inline-flex items-center gap-1.5">
            <RotateCcw className="w-4 h-4" /> {t('Try again')}
          </button>
        ) : (
          <button type="button" onClick={submit} disabled={busy || answered < quiz.questions.length} className="h-11 w-full sm:w-auto px-5 rounded-xl bg-[#005a9c] hover:bg-[#1b365d] text-white text-sm font-semibold disabled:opacity-50">
            {busy ? t('Submitting…') : `${t('Submit quiz')} (${answered}/${quiz.questions.length})`}
          </button>
        )}
      </div>
    </div>
  );
}

export function ParentQuizzes({ child, onChanged }) {
  const { t } = useT();
  const [openId, setOpenId] = useState('');
  const quizzes = child.quizzes || [];
  const open = quizzes.find((q) => q.id === openId);
  if (open) return <QuizPlayer key={open.id} quiz={open} studentId={child.id} onBack={() => setOpenId('')} onSubmitted={onChanged} />;
  if (!quizzes.length) return <p className="text-sm text-neutral-500">{t('No practice quizzes yet.')}</p>;
  return (
    <ul className="divide-y divide-neutral-100">
      {quizzes.map((q) => (
        <li key={q.id}>
          <button type="button" onClick={() => setOpenId(q.id)} className="w-full min-h-14 py-2.5 flex items-center gap-3 text-left">
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-neutral-900 truncate">{q.title}</span>
              <span className="block text-xs text-neutral-500 truncate">{[q.subject, `${q.questions.length} ${t('questions')}`, q.createdByName, formatDate(String(q.createdAt).slice(0, 10))].filter(Boolean).join(' · ')}</span>
            </span>
            <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${q.attempt ? 'bg-emerald-50 text-[#17784a]' : 'bg-[#eef6fc] text-[#005a9c]'}`}>
              {q.attempt ? `${t('Best')} ${q.attempt.best}/${q.questions.length}` : t('Start')}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
