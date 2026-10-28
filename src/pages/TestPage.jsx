import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useStudy } from '../context/StudyContext';
import { ArrowLeft, Printer, RotateCcw } from 'lucide-react';
import { Spinner } from '../components/Spinner';
import { AppHeader } from '../components/AppHeader';
import { sessionKind, stampMarks } from '../data/paperBlueprint';
import { MathText } from '../components/MathText';
import { GraphFigure } from '../components/GraphFigure';
import { withNeededFigures } from '../components/plotMath';
import { isMathematics } from '../services/openai';

const SECTION = {
  mcq: 'Multiple choice questions',
  short: 'Short answer questions',
  long: 'Long answer questions',
};

const LETTERS = ['A', 'B', 'C', 'D'];

const FORMS = [
  { id: 'questions', label: 'Question paper' },
  { id: 'worksheet', label: 'Worksheet' },
  { id: 'answers', label: 'Answer key' },
];

function withMarks(questions, session) {
  if (!questions) return null;
  if (session?.blueprint?.length) return stampMarks(questions, session.blueprint);
  return questions.map((question) => ({ ...question, marks: question.marks || 1 }));
}

function formatDuration(total) {
  const minutes = Math.min(180, Math.max(30, Math.round(((Number(total) || 30) * 1.5) / 15) * 15));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} Min`;
  if (!rest) return hours === 1 ? '1 Hr' : `${hours} Hrs`;
  return `${hours} Hr ${rest} Min`;
}

function marksHeading(paper, total) {
  const marks = paper.map((question) => Number(question.marks) || 1);
  if (marks.length > 1 && marks.every((mark) => mark === marks[0])) {
    return `Marks: ${marks.length} × ${marks[0]}`;
  }
  return `Max. Marks: ${total}`;
}

function writingLines(question) {
  const marks = Number(question.marks) || 1;
  if (question.type === 'long') return Math.min(16, Math.max(8, marks * 2 + 2));
  if (question.type === 'short') return Math.min(6, Math.max(3, marks + 2));
  return 0;
}

function groupsOf(paper) {
  const groups = [];
  for (const question of paper) {
    const last = groups[groups.length - 1];
    if (last && last.type === question.type) last.questions.push(question);
    else groups.push({ type: question.type, questions: [question] });
  }
  return groups;
}

function McqOptions({ question, worksheet }) {
  const options = question.options || [];
  return (
    <ol className="mcq">
      {options.map((option, index) => (
        <li key={`${index}-${option}`}>
          {worksheet && <span className="tick" aria-hidden="true" />}
          <span className="opt-letter">({LETTERS[index] || index + 1})</span>
          <MathText text={option} />
        </li>
      ))}
    </ol>
  );
}

function fitWideDisplayMath(root) {
  if (!root) return;
  root.querySelectorAll('.katex-display > .katex, .mcq .math-text .katex').forEach((node) => {
    node.style.fontSize = '';
    const box = node.parentElement?.classList.contains('katex-display')
      ? node.parentElement
      : (node.closest('.math-text') || node.parentElement);
    const available = box?.clientWidth || 0;
    const needed = node.scrollWidth;
    if (available > 40 && needed > available + 2) {
      node.style.fontSize = `${Math.max(0.72, available / needed)}em`;
    }
  });
}

async function printExam() {
  if (document.fonts?.ready) await document.fonts.ready;
  document.querySelectorAll('.sheet-a4').forEach((sheet) => fitWideDisplayMath(sheet));
  await new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
  window.print();
}

function RuledLines({ count }) {
  return (
    <div className="ruled" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => <div key={index} className="rule" />)}
    </div>
  );
}

export function TestSheet({ form, session, paper, variant = 'screen' }) {
  const sheetRef = useRef(null);
  useEffect(() => {
    if (variant !== 'a4') return undefined;
    const root = sheetRef.current;
    let cancel = false;
    const fit = () => {
      if (!cancel) fitWideDisplayMath(root);
    };
    fit();
    document.fonts?.ready?.then(fit);
    return () => { cancel = true; };
  }, [variant, form, paper]);
  const shown = withNeededFigures(paper);
  const groups = groupsOf(shown);
  let number = 0;
  const worksheet = form === 'worksheet';
  const answers = form === 'answers';
  const total = paper.reduce((sum, question) => sum + (Number(question.marks) || 1), 0);
  const math = isMathematics(session?.subject_name);
  const title = answers ? 'Answer key' : worksheet ? 'Worksheet' : 'Test';
  const showSections = groups.length > 1;

  return (
    <article
      ref={sheetRef}
      data-exam-sheet={variant}
      className={`sheet ${variant === 'a4' ? 'sheet-a4' : 'sheet-screen'}${math ? ' sheet-exam' : ''}`}
    >
      <header className="exam-head">
        <div className="exam-top">
          <span>Time: {formatDuration(session?.total_marks || total)}</span>
          <span className="exam-title">{title}</span>
          <span>{marksHeading(shown, session?.total_marks || total)}</span>
        </div>
        <p className="exam-class">{session?.class_name}{session?.subject_name ? ` · ${session.subject_name}` : ''}</p>
        <h1 className="exam-chapter">{session?.chapter_name || 'Test'}</h1>
      </header>

      {worksheet && (
        <div className="sheet-blanks">
          <span>Name ______________________________</span>
          <span>Class __________</span>
          <span>Date ____________</span>
        </div>
      )}

      {(answers || worksheet || showSections) && (
        <p className="sheet-note">
          {answers
            ? 'Answer key. Not for students.'
            : worksheet
              ? 'Tick one option for each multiple choice question. Write the other answers on the lines.'
              : 'Attempt all questions.'}
        </p>
      )}

      {groups.map((group, groupIndex) => {
        const sectionMarks = group.questions.reduce((sum, question) => sum + (Number(question.marks) || 1), 0);
        const sameMarks = group.questions.every((question) => question.marks === group.questions[0].marks);
        return (
        <section key={`${group.type}-${groupIndex}`} className="sheet-section">
          {showSections && (
            <>
              <h2>
                Section {LETTERS[groupIndex] || groupIndex + 1}
                <span> — {SECTION[group.type] || group.type}</span>
              </h2>
              {sameMarks && (
                <p className="section-total">
                  {group.questions.length} × {group.questions[0].marks} = {sectionMarks}
                </p>
              )}
            </>
          )}
          {group.questions.map((question) => {
            number += 1;
            const lines = worksheet ? writingLines(question) : 0;
            return (
              <div key={number} className={`q${lines > 10 ? ' allow-break' : ''}`}>
                <div className="q-row">
                  <span className="q-no">{math ? `Q.${number}` : `${number}.`}</span>
                  <div className="q-text"><MathText text={question.question} /></div>
                  <span className="q-marks">[{question.marks}]</span>
                </div>
                <GraphFigure figure={question.figure} />
                {question.type === 'mcq' && !answers && (
                  <McqOptions question={question} worksheet={worksheet} />
                )}
                {lines > 0 && <RuledLines count={lines} />}
                {answers && (
                  <div className="key">
                    <p><strong>{question.type === 'mcq' ? 'Answer' : 'Model answer'}: </strong><MathText text={question.correctAnswer} /></p>
                    {question.explanation && <p className="key-why"><MathText text={question.explanation} /></p>}
                  </div>
                )}
              </div>
            );
          })}
        </section>
        );
      })}
    </article>
  );
}

export default function TestPage() {
  const { sessions, activeSession, selectSession, questions, generating, generateError, generateTest } = useStudy();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const id = searchParams.get('id');
  const [form, setForm] = useState('questions');

  useEffect(() => {
    if (!id) { navigate('/tests'); return; }
    const sess = sessions.find((item) => item.id === id);
    if (sess) selectSession(sess);
  }, [id, sessions, navigate, selectSession]);

  useEffect(() => {
    if (activeSession && !questions && !generating) {
      generateTest(activeSession);
    }
  }, [activeSession]);

  const paper = useMemo(
    () => withMarks(questions, activeSession),
    [questions, activeSession]
  );

  if (!activeSession && !generating) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const sess = activeSession;

  return (
    <div className="min-h-screen bg-stone-200/70">
      <div className="no-print">
        <AppHeader
          leading={(
            <button
              type="button"
              onClick={() => navigate('/tests')}
              className="p-2 -ml-2 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          title={sess?.chapter_name}
          subtitle={sess ? `${sess.class_name} · ${sess.subject_name} · ${sessionKind(sess)}${sess.total_marks ? ` · ${sess.total_marks} marks` : ''}` : ''}
        />
      </div>

      <main className="max-w-6xl mx-auto px-3 sm:px-6 pt-4 pb-16">
        {generateError && !generating && (
          <div className="no-print mb-6 p-5 rounded-2xl border border-rose-200 bg-rose-50 max-w-2xl mx-auto">
            <p className="text-sm text-rose-800">{generateError}</p>
            <button
              type="button"
              onClick={() => generateTest(activeSession)}
              className="mt-3 text-sm font-medium text-stone-800 underline underline-offset-2"
            >
              Try again
            </button>
          </div>
        )}

        {generating && (
          <div className="no-print flex flex-col items-center justify-center py-32 gap-3">
            <Spinner size="lg" />
            <p className="text-sm text-stone-500">Reading the chapter and writing your paper…</p>
            <p className="text-xs text-stone-400">Large textbooks can take a little longer</p>
          </div>
        )}

        {paper && !generating && (
          <>
            <div className="no-print mb-4 flex flex-wrap items-center gap-2">
              <div className="flex flex-wrap p-1 bg-white rounded-xl ring-1 ring-stone-200 max-w-full">
                {FORMS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setForm(item.id)}
                    className={`h-9 px-2.5 sm:px-3 rounded-lg text-[13px] sm:text-sm font-medium transition-colors ${
                      form === item.id ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => { void printExam(); }}
                className="h-11 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button
                type="button"
                onClick={() => generateTest(activeSession)}
                className="h-11 px-3 rounded-xl bg-white ring-1 ring-stone-200 text-sm font-medium text-stone-600 hover:text-stone-900 flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                New paper
              </button>
            </div>
            <div className="sheet-screen-wrap">
              <TestSheet form={form} session={sess} paper={paper} variant="screen" />
            </div>
            <div className="sheet-print-slot" aria-hidden="true">
              <TestSheet form={form} session={sess} paper={paper} variant="a4" />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
