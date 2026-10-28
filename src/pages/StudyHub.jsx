import React, { useState, useEffect, useRef } from 'react';
import { useStudy } from '../context/StudyContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Check, X, Eye, EyeOff, ChevronLeft, ChevronRight, Printer, Copy } from 'lucide-react';
import { Button } from '../components/Button';
import { Spinner, ProcessingIndicator } from '../components/Spinner';

/* ─── Tab config ──────────────────────────────────────── */
const TABS = [
  { id: 'chat',       label: 'Ask AI'         },
  { id: 'summary',    label: 'Summary'         },
  { id: 'notes',      label: 'Revision Notes'  },
  { id: 'flashcards', label: 'Flashcards'      },
  { id: 'quiz',       label: 'Practice Quiz'   },
  { id: 'exams',      label: 'Exam Questions'  },
];

const GENERAL_UUID = '00000000-0000-0000-0000-000000000000';

export default function StudyHub() {
  const {
    activeSession, loadingSessions, selectSession, sessions,
    chatMessages, activeChat,
    notes, quizzes, flashcards, examQuestions, summaries,
    loadingContent, generateMaterial, sendChatMessage,
  } = useStudy();

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const docId = searchParams.get('id');

  const [tab, setTab]         = useState('chat');
  const [chatInput, setChatInput] = useState('');
  const chatEnd = useRef(null);

  /* flashcards */
  const [cardIdx, setCardIdx]   = useState(0);
  const [flipped, setFlipped]   = useState(false);

  /* quiz */
  const [answers, setAnswers]     = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore]         = useState(0);
  const [feedback, setFeedback]   = useState([]);

  /* exam */
  const [difficulty, setDifficulty] = useState('easy');
  const [showAns, setShowAns]       = useState({});

  /* copy */
  const [copied, setCopied] = useState(false);

  /* ── load session ─────────────────────────────── */
  useEffect(() => {
    if (!docId) { navigate('/'); return; }
    if (docId === GENERAL_UUID) {
      selectSession({ id: GENERAL_UUID, class_name: 'General', subject_name: 'AI Tutor', chapter_name: 'Free Chat', created_at: new Date().toISOString() });
      return;
    }
    const sess = sessions.find(s => s.id === docId);
    if (sess) selectSession(sess);
  }, [docId, sessions]);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages, loadingContent.chat]);

  /* reset card flip when switching cards */
  useEffect(() => setFlipped(false), [cardIdx]);

  if (loadingSessions || !activeSession) {
    return (
      <div className="min-h-screen bg-[#f7f8fc] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const isGeneral = activeSession.id === GENERAL_UUID;

  const send = (text = chatInput, simple = false) => {
    if (!text.trim()) return;
    sendChatMessage(text, simple);
    setChatInput('');
  };

  const gradeQuiz = () => {
    let s = 0;
    const fb = quizzes.map((q, i) => {
      const ua = (answers[i] || '').trim().toLowerCase();
      const ca = q.correctAnswer.toLowerCase();
      const ok = (q.type === 'mcq' || q.type === 'tf')
        ? ua === ca
        : q.type === 'fill'
          ? ca.includes(ua) && ua.length > 1
          : ua.length > 5;
      if (ok) s++;
      return ok;
    });
    setScore(s); setFeedback(fb); setSubmitted(true);
  };

  const copyText = (t) => {
    navigator.clipboard.writeText(t);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  /* ── Locked placeholder for general room ─────── */
  const LockedTab = ({ label }) => (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-sm font-medium text-slate-700 mb-1">{label} is unavailable</p>
      <p className="text-xs text-slate-400 max-w-xs">This feature requires a specific chapter session. Select a class, subject and chapter from the dashboard.</p>
      <Button variant="secondary" size="sm" className="mt-5" onClick={() => navigate('/')}>Go to Dashboard</Button>
    </div>
  );

  /* ─────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#f7f8fc] flex flex-col">

      {/* ── Top bar ─────────────────────────────── */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center px-5 gap-4 sticky top-0 z-20">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-700 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="h-4 w-px bg-slate-200" />

        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">{activeSession.chapter_name}</p>
          <p className="text-xs text-slate-400">{activeSession.class_name} · {activeSession.subject_name}</p>
        </div>
      </header>

      {/* ── Tab bar ─────────────────────────────── */}
      <nav className="bg-white border-b border-slate-200 px-5 overflow-x-auto scrollbar-none">
        <div className="flex gap-0 min-w-max">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === t.id
                  ? 'border-brand-500 text-brand-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      {/* ── Content ─────────────────────────────── */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-5 py-8">

        {/* ══ ASK AI ══════════════════════════════ */}
        {tab === 'chat' && (
          <div className="flex flex-col h-[calc(100vh-180px)]">
            {/* messages */}
            <div className="flex-1 overflow-y-auto space-y-3 pb-4">
              {chatMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center gap-2">
                  <p className="text-sm font-medium text-slate-700">Ask anything about this chapter</p>
                  <p className="text-xs text-slate-400 max-w-xs">
                    {isGeneral ? 'Ask any general study question.' : `Questions are answered using ${activeSession.class_name} ${activeSession.subject_name} curriculum.`}
                  </p>
                  {/* starter chips */}
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {(isGeneral
                      ? ['Explain Newton\'s Laws', 'What is photosynthesis?', 'Give me study tips']
                      : ['Summarise this chapter', 'Give me a real-life example', 'What are key definitions?']
                    ).map(q => (
                      <button
                        key={q}
                        onClick={() => send(q)}
                        className="px-3 py-1.5 text-xs border border-slate-200 rounded-full text-slate-600 hover:border-brand-300 hover:text-brand-600 transition-colors bg-white"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {chatMessages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-brand-500 text-white rounded-br-sm'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                  }`}>
                    <p className="whitespace-pre-line">{msg.content}</p>
                  </div>
                </div>
              ))}

              {loadingContent.chat && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                    <Spinner size="sm" />
                    <span className="text-xs text-slate-400">Thinking…</span>
                  </div>
                </div>
              )}
              <div ref={chatEnd} />
            </div>

            {/* input bar */}
            <div className="flex gap-2 pt-3 border-t border-slate-100">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder="Type a question…"
                className="flex-1 h-10 px-4 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 transition placeholder:text-slate-400"
              />
              <Button onClick={() => send()} variant="primary" size="md" disabled={!chatInput.trim() || loadingContent.chat}>
                Send
              </Button>
              <Button
                onClick={() => send(chatInput || 'Explain this in very simple words with a real-life example', true)}
                variant="secondary"
                size="md"
                disabled={loadingContent.chat}
              >
                Simplify
              </Button>
            </div>
          </div>
        )}

        {/* ══ SUMMARY ═════════════════════════════ */}
        {tab === 'summary' && (
          isGeneral ? <LockedTab label="Summary" /> :
          <div className="animate-fade-up">
            {!summaries && !loadingContent.summary && (
              <Empty
                title="No summary yet"
                desc="Generate an AI summary of this chapter instantly."
                action="Generate Summary"
                onClick={() => generateMaterial('summary')}
              />
            )}
            {loadingContent.summary && <ProcessingIndicator text="Generating summary…" />}
            {summaries && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-slate-900">Chapter Summary</h2>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => copyText(`${summaries.shortSummary}\n\n${summaries.detailedSummary}`)}>
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => generateMaterial('summary')}>
                      <RotateCcw className="w-3.5 h-3.5" /> Regenerate
                    </Button>
                  </div>
                </div>

                <Block label="Short overview">
                  <p className="text-sm text-slate-700 leading-relaxed">{summaries.shortSummary}</p>
                </Block>

                {summaries.bulletPoints?.length > 0 && (
                  <Block label="Key points">
                    <ul className="space-y-2">
                      {summaries.bulletPoints.map((p, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </Block>
                )}

                <Block label="Detailed summary">
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{summaries.detailedSummary}</p>
                </Block>
              </div>
            )}
          </div>
        )}

        {/* ══ REVISION NOTES ══════════════════════ */}
        {tab === 'notes' && (
          isGeneral ? <LockedTab label="Revision Notes" /> :
          <div className="animate-fade-up">
            {!notes && !loadingContent.notes && (
              <Empty title="No revision notes yet" desc="Generate structured revision notes for this chapter." action="Generate Notes" onClick={() => generateMaterial('notes')} />
            )}
            {loadingContent.notes && <ProcessingIndicator text="Generating revision notes…" />}
            {notes && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-slate-900">Revision Notes</h2>
                  <Button variant="secondary" size="sm" onClick={() => window.print()}>
                    <Printer className="w-3.5 h-3.5" /> Print
                  </Button>
                </div>
                {notes.headings?.map((sec, i) => (
                  <Block key={i} label={sec.title}>
                    {sec.bullets?.length > 0 && (
                      <ul className="space-y-1.5 mb-3">
                        {sec.bullets.map((b, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-slate-700">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                            {b}
                          </li>
                        ))}
                      </ul>
                    )}
                    {sec.keyConcepts?.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Core Concepts</p>
                        {sec.keyConcepts.map((c, j) => (
                          <p key={j} className="text-sm text-slate-700 mb-1">{c}</p>
                        ))}
                      </div>
                    )}
                    {sec.definitions?.length > 0 && (
                      <div className="mb-3 space-y-2">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Definitions</p>
                        {sec.definitions.map((d, j) => (
                          <div key={j} className="pl-3 border-l-2 border-brand-200">
                            <p className="text-xs font-semibold text-slate-800">{d.term}</p>
                            <p className="text-xs text-slate-600">{d.meaning}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {sec.formulas?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {sec.formulas.map((f, j) => (
                          <code key={j} className="text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md font-mono">{f}</code>
                        ))}
                      </div>
                    )}
                  </Block>
                ))}
                <Button variant="ghost" size="sm" onClick={() => generateMaterial('notes')}>
                  <RotateCcw className="w-3.5 h-3.5" /> Regenerate
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ══ FLASHCARDS ══════════════════════════ */}
        {tab === 'flashcards' && (
          isGeneral ? <LockedTab label="Flashcards" /> :
          <div className="animate-fade-up">
            {!flashcards && !loadingContent.flashcards && (
              <Empty title="No flashcards yet" desc="Generate flip cards for active recall practice." action="Generate Flashcards" onClick={() => generateMaterial('flashcards')} />
            )}
            {loadingContent.flashcards && <ProcessingIndicator text="Generating flashcards…" />}
            {flashcards?.length > 0 && (
              <div className="flex flex-col items-center gap-6">
                {/* Progress */}
                <div className="w-full flex items-center justify-between text-xs text-slate-400">
                  <span>{cardIdx + 1} of {flashcards.length}</span>
                  <button onClick={() => { setCardIdx(0); setFlipped(false); }} className="hover:text-slate-700 transition-colors">Reset</button>
                </div>

                {/* Thin progress bar */}
                <div className="w-full h-1 bg-slate-100 rounded-full">
                  <div className="h-1 bg-brand-400 rounded-full transition-all" style={{ width: `${((cardIdx + 1) / flashcards.length) * 100}%` }} />
                </div>

                {/* Card */}
                <div
                  onClick={() => setFlipped(f => !f)}
                  className={`flip-card w-full max-w-lg cursor-pointer h-56 select-none ${flipped ? 'flipped' : ''}`}
                >
                  <div className="flip-card-inner w-full h-full">
                    {/* Front */}
                    <div className="flip-card-front bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center p-8 text-center hover:border-brand-300 transition-colors">
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-4">Question</p>
                      <p className="text-base font-medium text-slate-800 leading-snug">{flashcards[cardIdx].question}</p>
                      <p className="text-xs text-slate-300 mt-6">Click to reveal answer</p>
                    </div>
                    {/* Back */}
                    <div className="flip-card-back bg-brand-500 rounded-2xl flex flex-col items-center justify-center p-8 text-center">
                      <p className="text-[10px] font-medium text-white/60 uppercase tracking-widest mb-4">Answer</p>
                      <p className="text-base font-medium text-white leading-snug">{flashcards[cardIdx].answer}</p>
                      <p className="text-xs text-white/40 mt-6">Click to flip back</p>
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center gap-3">
                  <Button variant="secondary" size="sm" disabled={cardIdx === 0} onClick={() => setCardIdx(i => i - 1)}>
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </Button>
                  <Button variant="secondary" size="sm" disabled={cardIdx === flashcards.length - 1} onClick={() => setCardIdx(i => i + 1)}>
                    Next <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                <Button variant="ghost" size="sm" onClick={() => generateMaterial('flashcards')}>
                  <RotateCcw className="w-3.5 h-3.5" /> Regenerate
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ══ QUIZ ════════════════════════════════ */}
        {tab === 'quiz' && (
          isGeneral ? <LockedTab label="Practice Quiz" /> :
          <div className="animate-fade-up">
            {!quizzes && !loadingContent.quiz && (
              <Empty title="No quiz yet" desc="Generate a practice quiz with instant AI grading." action="Generate Quiz" onClick={() => generateMaterial('quiz')} />
            )}
            {loadingContent.quiz && <ProcessingIndicator text="Generating quiz…" />}
            {quizzes && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-slate-900">Practice Quiz</h2>
                  {submitted && (
                    <span className="text-sm font-medium text-brand-600">
                      {score} / {quizzes.length} correct
                    </span>
                  )}
                </div>

                {quizzes.map((q, i) => {
                  const correct = feedback[i];
                  return (
                    <div
                      key={i}
                      className={`bg-white border rounded-xl p-5 space-y-3 transition-colors ${
                        !submitted ? 'border-slate-200'
                          : correct ? 'border-emerald-200 bg-emerald-50/30'
                          : 'border-rose-200 bg-rose-50/20'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded mt-0.5">{i + 1}</span>
                        <p className="text-sm font-medium text-slate-800">{q.question}</p>
                      </div>

                      {/* MCQ / TF */}
                      {(q.type === 'mcq' || q.type === 'tf') && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-5">
                          {q.options?.map((opt, j) => {
                            const selected = answers[i] === opt;
                            const isCorrectOpt = q.correctAnswer === opt;
                            let cls = 'border-slate-200 text-slate-700';
                            if (selected) cls = 'border-brand-400 bg-brand-50 text-brand-700 font-medium';
                            if (submitted) {
                              if (isCorrectOpt) cls = 'border-emerald-400 bg-emerald-50 text-emerald-800 font-medium';
                              else if (selected) cls = 'border-rose-400 bg-rose-50 text-rose-700';
                              else cls = 'border-slate-100 text-slate-300';
                            }
                            return (
                              <button
                                key={j}
                                disabled={submitted}
                                onClick={() => setAnswers(a => ({ ...a, [i]: opt }))}
                                className={`text-left px-3 py-2 text-xs border rounded-lg transition-colors ${cls}`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Fill */}
                      {q.type === 'fill' && (
                        <input
                          disabled={submitted}
                          value={answers[i] || ''}
                          onChange={e => setAnswers(a => ({ ...a, [i]: e.target.value }))}
                          placeholder="Type your answer…"
                          className="ml-5 w-full max-w-sm h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 transition"
                        />
                      )}

                      {/* Short */}
                      {q.type === 'short' && (
                        <textarea
                          disabled={submitted}
                          rows={2}
                          value={answers[i] || ''}
                          onChange={e => setAnswers(a => ({ ...a, [i]: e.target.value }))}
                          placeholder="Write a brief answer…"
                          className="ml-5 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 transition resize-none"
                        />
                      )}

                      {/* Feedback */}
                      {submitted && (
                        <div className="ml-5 pt-2 border-t border-slate-100 text-xs space-y-1">
                          <p className={`font-medium ${correct ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {correct ? 'Correct' : 'Incorrect'} — {q.correctAnswer}
                          </p>
                          <p className="text-slate-500">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="flex gap-2 justify-end pt-2">
                  {!submitted ? (
                    <Button variant="primary" onClick={gradeQuiz}>Submit</Button>
                  ) : (
                    <>
                      <Button variant="secondary" onClick={() => { setAnswers({}); setSubmitted(false); setScore(0); setFeedback([]); }}>
                        Try Again
                      </Button>
                      <Button variant="ghost" onClick={() => generateMaterial('quiz')}>
                        <RotateCcw className="w-3.5 h-3.5" /> New Quiz
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ EXAM QUESTIONS ══════════════════════ */}
        {tab === 'exams' && (
          isGeneral ? <LockedTab label="Exam Questions" /> :
          <div className="animate-fade-up">
            {!examQuestions && !loadingContent.exams && (
              <Empty title="No exam questions yet" desc="Generate likely exam questions grouped by difficulty." action="Generate Questions" onClick={() => generateMaterial('exams')} />
            )}
            {loadingContent.exams && <ProcessingIndicator text="Generating exam questions…" />}
            {examQuestions && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-slate-900">Exam Questions</h2>
                  <Button variant="ghost" size="sm" onClick={() => generateMaterial('exams')}>
                    <RotateCcw className="w-3.5 h-3.5" /> Regenerate
                  </Button>
                </div>

                {/* Difficulty tabs */}
                <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
                  {['easy', 'medium', 'hard'].map(d => (
                    <button
                      key={d}
                      onClick={() => { setDifficulty(d); setShowAns({}); }}
                      className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
                        difficulty === d ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  {examQuestions[difficulty]?.map((q, i) => (
                    <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded mt-0.5 shrink-0">{i + 1}</span>
                        <p className="text-sm text-slate-800">{q.question}</p>
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={() => setShowAns(s => ({ ...s, [i]: !s[i] }))}
                          className="flex items-center gap-1 text-xs text-slate-400 hover:text-brand-600 transition-colors"
                        >
                          {showAns[i] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          {showAns[i] ? 'Hide answer' : 'Show answer'}
                        </button>
                      </div>
                      {showAns[i] && (
                        <div className="ml-5 p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                          {q.answer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}

/* ─── Small reusable helpers ──────────────────────────── */
function Empty({ title, desc, action, onClick }) {
  return (
    <div className="flex flex-col items-center py-20 text-center gap-3">
      <p className="text-sm font-medium text-slate-700">{title}</p>
      <p className="text-xs text-slate-400 max-w-xs">{desc}</p>
      <Button variant="primary" size="md" className="mt-2" onClick={onClick}>{action}</Button>
    </div>
  );
}

function Block({ label, children }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">{label}</p>
      {children}
    </div>
  );
}
