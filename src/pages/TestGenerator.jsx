import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useStudy } from '../context/StudyContext';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle, BookOpen, Trash2, ChevronDown, Minus, Plus, Search, Check, Sparkles, FileText, ClipboardList, KeyRound, GraduationCap, X,
} from 'lucide-react';
import { Spinner } from '../components/Spinner';
import { SetupModal } from '../components/SetupModal';
import { AppHeader } from '../components/AppHeader';
import { isOpenAIConfigured } from '../services/openai';
import { ncertSyllabus, streamsFor, subjectsFor, chaptersFor, hasTextbook, chapterScopeLabel } from '../data/ncertData';
import {
  MARKS,
  PAPER_MODES,
  buildBlueprint,
  totalOf,
  questionCount,
  MARK_SHORTCUTS,
  MAX_MARKS,
} from '../data/paperBlueprint';

const classes = Object.keys(ncertSyllabus);

const MAX_QUESTIONS = 60;
const MAX_MARKS_EACH = 20;
const LETTERS = 'ABCDEFGH';

const TYPE_META = {
  mcq: { label: 'MCQ', pill: 'bg-[#f0f0f0] text-neutral-800 ring-[#dedede]', bar: 'bg-[#d6d6d6]' },
  short: { label: 'Short answer', pill: 'bg-[#e2e2e2] text-neutral-800 ring-[#c4c4c4]', bar: 'bg-[#005a9c]' },
  long: { label: 'Long answer', pill: 'bg-[#005a9c] text-white ring-[#005a9c]', bar: 'bg-[#005a9c]' },
};

const PATTERN_LABEL = { mixed: 'Mixed', mcq: 'MCQ', short: 'Short', long: 'Long' };

let nextSectionId = 1;
const withIds = (sections) => sections.map((section) => ({ ...section, id: nextSectionId++ }));

function presetSections(mode, total) {
  const merged = [];
  for (const section of buildBlueprint(mode, total).sections) {
    const same = merged.find((item) => item.type === section.type && item.marksEach === section.marksEach);
    if (same) same.count += section.count;
    else merged.push({ ...section });
  }
  return withIds(merged);
}

function chip(on) {
  return `h-11 rounded-2xl text-sm font-medium transition-all ${
    on
      ? 'bg-[#005a9c] text-white'
      : 'bg-[#f7f7f7] text-neutral-600 hover:bg-[#efefef] hover:text-neutral-900'
  }`;
}

const pillOn = (on) => `h-10 px-4 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
  on ? 'bg-[#ededed] text-neutral-900' : 'bg-[#f7f7f7] text-neutral-600 hover:bg-[#efefef] hover:text-neutral-900'
}`;

function Card({ step, title, hint, aside, children }) {
  return (
    <section className="bg-white rounded-3xl shadow-card p-5 sm:p-6">
      <header className="flex items-center gap-3 mb-5">
        <span className="h-8 w-8 shrink-0 rounded-full bg-[#f1f1f1] text-[#005a9c] text-sm font-semibold grid place-items-center">
          {step}
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-medium text-neutral-900">{title}</h2>
          {hint && <p className="text-xs text-neutral-500">{hint}</p>}
        </div>
        {aside && <div className="ml-auto min-w-0 text-right">{aside}</div>}
      </header>
      {children}
    </section>
  );
}

function Stepper({ label, value, min, max, onChange }) {
  const set = (next) => onChange(Math.min(max, Math.max(min, next)));
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium text-neutral-500 mb-1">{label}</p>
      <div className="flex items-center h-10 rounded-2xl bg-[#f7f7f7]">
        <button
          type="button"
          onClick={() => set(value - 1)}
          disabled={value <= min}
          className="h-10 w-9 shrink-0 grid place-items-center text-neutral-500 disabled:opacity-30"
          aria-label={`Fewer ${label.toLowerCase()}`}
        >
          <Minus className="w-4 h-4" />
        </button>
        <input
          inputMode="numeric"
          value={value}
          onChange={(event) => {
            const n = parseInt(event.target.value.replace(/\D/g, ''), 10);
            set(Number.isFinite(n) ? n : min);
          }}
          aria-label={label}
          className="flex-1 min-w-0 w-full text-center bg-transparent text-base font-semibold tabular-nums text-neutral-900 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => set(value + 1)}
          disabled={value >= max}
          className="h-10 w-9 shrink-0 grid place-items-center text-neutral-500 disabled:opacity-30"
          aria-label={`More ${label.toLowerCase()}`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function TestGenerator() {
  const { signOut } = useAuth();
  const { sessions, processingSession, createSession } = useStudy();
  const navigate = useNavigate();

  const [cls, setCls] = useState(classes[4] ?? classes[0]);
  const [stream, setStream] = useState('Science');
  const [sub, setSub] = useState('');
  const [selected, setSelected] = useState([]);
  const [custom, setCustom] = useState('');
  const [query, setQuery] = useState('');

  const [preset, setPreset] = useState({ mode: 'mixed', total: 20 });
  const [sections, setSections] = useState(() => presetSections('mixed', 20));
  const [customOpen, setCustomOpen] = useState(false);

  const [error, setError] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const streamNames = streamsFor(cls);
  const subjectNames = subjectsFor(cls, stream);

  useEffect(() => {
    const names = subjectsFor(cls, stream);
    setSub(names[0] ?? '');
  }, [cls, stream]);

  useEffect(() => {
    const list = chaptersFor(cls, sub);
    setSelected(list[0] ? [list[0]] : []);
    setCustom('');
    setQuery('');
  }, [cls, sub]);

  const chapters = chaptersFor(cls, sub);
  const fromTextbook = hasTextbook(cls, sub);
  const visibleChapters = chapters.filter((name) =>
    name.toLowerCase().includes(query.trim().toLowerCase())
  );
  const bookPicked = chapters.filter((name) => selected.includes(name));
  const extra = custom.trim();
  const picked = extra ? [...bookPicked, extra] : bookPicked;
  const wholeBook = chapters.length > 0 && bookPicked.length === chapters.length;
  const scopeLabel = chapterScopeLabel(picked, extra ? [] : chapters);
  const typedChapter = query.trim();
  const typedIsNew = typedChapter
    && !chapters.some((name) => name.toLowerCase() === typedChapter.toLowerCase())
    && typedChapter.toLowerCase() !== extra.toLowerCase();

  const blueprint = sections
    .filter((section) => section.count > 0)
    .map(({ type, marksEach, count }) => ({ type, marksEach, count }));
  const totalMarks = totalOf(blueprint);
  const totalQuestions = questionCount(blueprint);
  const tooManyMarks = totalMarks > MAX_MARKS;
  const tooManyQuestions = totalQuestions > MAX_QUESTIONS;
  const paperValid = blueprint.length > 0 && !tooManyMarks && !tooManyQuestions;

  const toggleChapter = (name) => {
    setSelected((current) => (
      current.includes(name) ? current.filter((item) => item !== name) : [...current, name]
    ));
  };

  const toggleWholeBook = () => setSelected(wholeBook ? [] : [...chapters]);

  const applyPreset = (mode, total) => {
    setPreset({ mode, total });
    setSections(presetSections(mode, total));
  };

  const updateSection = (id, patch) => {
    setPreset(null);
    setSections((current) => current.map((section) => (section.id === id ? { ...section, ...patch } : section)));
  };

  const removeSection = (id) => {
    setPreset(null);
    setSections((current) => current.filter((section) => section.id !== id));
  };

  const addSection = () => {
    const used = sections.map((section) => section.type);
    const type = ['mcq', 'short', 'long'].find((item) => !used.includes(item)) || 'mcq';
    setPreset(null);
    setSections((current) => [...current, ...withIds([{ type, marksEach: MARKS[type], count: 2 }])]);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    if (!picked.length) return setError('Choose at least one chapter.');
    if (!blueprint.length) return setError('Add at least one section.');
    if (tooManyMarks) return setError(`Keep the paper at ${MAX_MARKS} marks or less.`);
    if (tooManyQuestions) return setError(`Keep the paper at ${MAX_QUESTIONS} questions or less.`);
    if (!isOpenAIConfigured()) {
      setSettingsOpen(true);
      return;
    }
    const types = [...new Set(blueprint.map((section) => section.type))];
    try {
      const session = await createSession(cls, sub, scopeLabel, {
        mode: types.length > 1 ? 'mixed' : types[0],
        types,
        blueprint,
        totalMarks,
        count: totalQuestions,
        chapters: picked,
      });
      navigate(`/test?id=${session.id}`);
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.');
    }
  };

  return (
    <div className="h-dvh flex flex-col app-canvas">
      <div className="shrink-0">
        <AppHeader
          nav
          onSettings={() => setSettingsOpen(true)}
          onSignOut={async () => { await signOut(); navigate('/login'); }}
        />
      </div>

      <main className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain w-full">
       <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <p className="min-w-0 max-w-2xl text-sm text-neutral-600">
            Pick class, chapters and marks. Get paper, worksheet and key.
          </p>
          {sessions.length > 0 && (
            <Link
              to="/papers"
              className="shrink-0 h-11 px-4 rounded-2xl bg-white text-sm font-medium text-neutral-800 hover:shadow-md transition-shadow flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              My tests
              <span className="text-xs text-neutral-400 tabular-nums">{sessions.length}</span>
            </Link>
          )}
        </div>

        {!isOpenAIConfigured() && (
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="mb-5 w-full flex items-center gap-3 px-4 py-3 bg-[#f4f4f4] rounded-2xl text-left hover:brightness-95 transition"
          >
            <AlertCircle className="w-4 h-4 text-neutral-800 shrink-0" />
            <span className="text-sm font-medium text-neutral-800">Add an OpenAI key to create tests</span>
          </button>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
        <form id="builder" onSubmit={handleCreate} className="space-y-5 min-w-0">
          <Card step="1" title="Class & subject" hint="Choose class and subject.">
            <p className="text-xs font-medium text-neutral-500 mb-2">Class</p>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Class">
              {classes.map((name) => (
                <button key={name} type="button" role="radio" aria-checked={cls === name} onClick={() => setCls(name)} className={pillOn(cls === name)}>
                  {name.replace(/^Class\s*/i, 'Class ')}
                </button>
              ))}
            </div>

            {streamNames.length > 0 && (
              <>
                <p className="text-xs font-medium text-neutral-500 mt-5 mb-2">Stream</p>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#f7f7f7] rounded-2xl">
                  {streamNames.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setStream(name)}
                      className={`h-10 rounded-xl text-sm font-medium transition-all ${
                        stream === name ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-800'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </>
            )}

            <p className="text-xs font-medium text-neutral-500 mt-5 mb-2">Subject</p>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Subject">
              {subjectNames.map((name) => (
                <button key={name} type="button" role="radio" aria-checked={sub === name} onClick={() => setSub(name)} className={pillOn(sub === name)}>
                  {name}
                </button>
              ))}
            </div>
          </Card>

          <Card
            step="2"
            title="Chapters"
            hint="Select or type chapters."
            aside={(
              <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${
                picked.length ? 'bg-[#f1f1f1] text-[#005a9c]' : 'bg-[#f4f4f4] text-neutral-800'
              }`}
              >
                {wholeBook ? 'All chapters' : picked.length ? `${picked.length} selected` : 'None selected'}
              </span>
            )}
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter') return;
                  event.preventDefault();
                  if (typedIsNew) { setCustom(typedChapter); setQuery(''); }
                  else if (visibleChapters.length === 1 && !selected.includes(visibleChapters[0])) {
                    setSelected((current) => [...current, visibleChapters[0]]);
                  }
                }}
                placeholder="Search or type a chapter"
                className="w-full h-12 pl-11 pr-4 text-sm bg-[#f7f7f7] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#c4c4c4] focus:bg-white placeholder:text-neutral-400"
              />
            </div>

            {!wholeBook && picked.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Selected chapters">
                {picked.map((name) => (
                  <li key={name} className="max-w-full">
                    <button
                      type="button"
                      onClick={() => (name === extra ? setCustom('') : toggleChapter(name))}
                      className="max-w-full min-h-8 pl-3 pr-2 py-1 rounded-full bg-[#f1f1f1] text-neutral-800 text-xs font-medium leading-snug text-left break-words inline-flex items-center gap-1.5"
                    >
                      {name}
                      <X className="w-3 h-3 shrink-0 opacity-60" />
                      <span className="sr-only">, deselect</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div
              className="chapter-list mt-3 overflow-y-auto overscroll-y-contain rounded-2xl border border-neutral-200 divide-y divide-neutral-100"
              style={{ maxHeight: 'min(30rem, 54dvh)' }}
            >
              <ChapterRow on={wholeBook} onClick={toggleWholeBook} label="Select all" strong />
              {extra && (
                <ChapterRow on onClick={() => setCustom('')} label={extra} strong />
              )}
              {visibleChapters.length === 0 && !extra && (
                <p className="px-3 py-6 text-sm text-neutral-400">
                  {typedIsNew ? `Press Enter to add “${typedChapter}”.` : 'No chapters match.'}
                </p>
              )}
              {visibleChapters.map((name) => (
                <ChapterRow
                  key={name}
                  on={selected.includes(name)}
                  onClick={() => toggleChapter(name)}
                  number={fromTextbook ? undefined : chapters.indexOf(name) + 1}
                  label={name}
                />
              ))}
            </div>
          </Card>

          <Card
            step="3"
            title="Paper pattern"
            hint="Question types and total marks."
            aside={(
              <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-[#f7f7f7] text-neutral-600">
                {preset ? `${PATTERN_LABEL[preset.mode]} · ${preset.total}` : 'Custom'}
              </span>
            )}
          >
            <fieldset>
              <legend className="text-sm font-medium text-neutral-800 mb-2.5">What type of questions?</legend>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="radiogroup">
                {PAPER_MODES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-checked={preset?.mode === item.id}
                    onClick={() => applyPreset(item.id, preset?.total ?? (totalMarks || 20))}
                    className={chip(preset?.mode === item.id)}
                  >
                    {PATTERN_LABEL[item.id]}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-5">
              <legend className="text-sm font-medium text-neutral-800 mb-2.5">Total marks</legend>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="radiogroup">
                {MARK_SHORTCUTS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={preset?.total === value}
                    onClick={() => applyPreset(preset?.mode ?? 'mixed', value)}
                    className={chip(preset?.total === value)}
                  >
                    {value} marks
                  </button>
                ))}
              </div>
            </fieldset>

            <button
              type="button"
              onClick={() => setCustomOpen((open) => !open)}
              aria-expanded={customOpen}
              className="mt-6 w-full flex items-center justify-between gap-3 h-12 px-4 rounded-2xl bg-[#f7f7f7] hover:bg-[#efefef] text-left transition-colors"
            >
              <span className="min-w-0 text-sm text-neutral-600 truncate">
                {blueprint.map((section) => `${section.count} ${TYPE_META[section.type].label}`).join(' · ') || 'No sections'}
              </span>
              <span className="shrink-0 flex items-center gap-1 text-sm font-medium text-[#005a9c]">
                {customOpen ? 'Hide' : 'Customise'}
                <ChevronDown className={`w-4 h-4 transition-transform ${customOpen ? 'rotate-180' : ''}`} />
              </span>
            </button>

            {customOpen && (
            <>
            <div className="mt-2 space-y-2">
              {sections.map((section, index) => {
                const meta = TYPE_META[section.type];
                return (
                  <div key={section.id} className="relative rounded-2xl border border-neutral-200 bg-white pl-5 pr-3 py-3 overflow-hidden">
                    <span className={`absolute left-0 inset-y-0 w-1 ${meta.bar}`} />
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-neutral-400">Section {LETTERS[index] || index + 1}</span>
                      <span className="relative">
                        <select
                          value={section.type}
                          onChange={(event) => {
                            const type = event.target.value;
                            updateSection(section.id, { type, marksEach: MARKS[type] });
                          }}
                          className={`h-7 pl-2.5 pr-7 rounded-full text-xs font-semibold ring-1 appearance-none focus:outline-none ${meta.pill}`}
                        >
                          {Object.entries(TYPE_META).map(([id, item]) => (
                            <option key={id} value={id}>{item.label}</option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 opacity-60" />
                      </span>
                      <span className="ml-auto text-sm font-semibold text-neutral-900 tabular-nums">
                        {section.count * section.marksEach}
                        <span className="text-xs font-normal text-neutral-400"> marks</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => removeSection(section.id)}
                        className="h-8 w-8 -mr-1 rounded-full text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 grid place-items-center"
                        aria-label={`Remove section ${LETTERS[index] || index + 1}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="mt-2.5 grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                      <Stepper
                        label="Questions"
                        value={section.count}
                        min={1}
                        max={MAX_QUESTIONS}
                        onChange={(count) => updateSection(section.id, { count })}
                      />
                      <span className="pb-2.5 text-neutral-300 text-sm">×</span>
                      <Stepper
                        label="Marks each"
                        value={section.marksEach}
                        min={1}
                        max={MAX_MARKS_EACH}
                        onChange={(marksEach) => updateSection(section.id, { marksEach })}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={addSection}
              disabled={sections.length >= LETTERS.length}
              className="mt-2 w-full h-12 rounded-2xl border-2 border-dashed border-[#dedede] text-sm font-medium text-[#005a9c] hover:bg-[#f8f8f8] flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              <Plus className="w-4 h-4" />
              Add section
            </button>
            </>
            )}

            {(tooManyMarks || tooManyQuestions) && (
              <p className="mt-3 rounded-2xl bg-[#fde2e4] px-4 py-3 text-sm text-[#9b1c2e] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {tooManyMarks
                  ? `${totalMarks} marks is over the ${MAX_MARKS}-mark limit.`
                  : `${totalQuestions} questions is over the ${MAX_QUESTIONS}-question limit.`}
              </p>
            )}
          </Card>

        </form>

        {/* live summary (desktop) */}
        <aside className="hidden xl:block xl:sticky xl:top-2">
          <section className="bg-white rounded-3xl shadow-card p-6">
            <h2 className="text-base font-medium text-neutral-800">Paper summary</h2>

            <div className="mt-4 rounded-3xl p-5" style={{ background: '#c4c4c4' }}>
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[2.6rem] leading-none font-medium tracking-tight text-neutral-900 tabular-nums">{totalMarks}</p>
                  <p className="mt-1.5 text-sm text-neutral-800">total marks · {totalQuestions} questions</p>
                </div>
                <span className="h-11 w-11 rounded-full bg-white grid place-items-center text-neutral-900"><FileText className="w-5 h-5" /></span>
              </div>
              <div className="mt-4 h-2 rounded-full bg-white/50 overflow-hidden flex" aria-hidden="true">
                {blueprint.map((section, i) => (
                  <div key={i} className={TYPE_META[section.type].bar} style={{ width: `${totalMarks ? (section.count * section.marksEach / totalMarks) * 100 : 0}%` }} />
                ))}
              </div>
              <p className="mt-2 text-[11px] text-neutral-800/80">{totalMarks} of {MAX_MARKS} marks allowed</p>
            </div>

            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 h-8 w-8 shrink-0 rounded-full bg-[#f1f1f1] text-[#005a9c] grid place-items-center"><GraduationCap className="w-4 h-4" /></span>
                <div className="min-w-0">
                  <dt className="text-xs text-neutral-500">Class &amp; subject</dt>
                  <dd className="font-medium text-neutral-900">{cls} · {sub || '—'}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 h-8 w-8 shrink-0 rounded-full bg-[#f4f4f4] text-neutral-800 grid place-items-center"><BookOpen className="w-4 h-4" /></span>
                <div className="min-w-0">
                  <dt className="text-xs text-neutral-500">Chapters</dt>
                  <dd className="font-medium text-neutral-900 break-words">{scopeLabel || 'None selected yet'}</dd>
                </div>
              </div>
            </dl>

            <div className="mt-5">
              <p className="text-xs font-medium text-neutral-500 mb-2">Sections</p>
              {blueprint.length === 0 ? (
                <p className="text-sm text-neutral-400">No sections yet.</p>
              ) : (
                <ul className="space-y-2">
                  {blueprint.map((section, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm">
                      <span className={`h-2.5 w-2.5 rounded-full ${TYPE_META[section.type].bar}`} />
                      <span className="flex-1 text-neutral-800">{TYPE_META[section.type].label}</span>
                      <span className="text-xs text-neutral-500 tabular-nums">{section.count} × {section.marksEach}</span>
                      <span className="w-16 text-right font-medium text-neutral-900 tabular-nums">{section.count * section.marksEach}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-1.5">
              {[[FileText, 'Question paper'], [ClipboardList, 'Worksheet'], [KeyRound, 'Answer key']].map(([Icon, name]) => (
                <span key={name} className="inline-flex items-center gap-1.5 rounded-full bg-[#f7f7f7] px-3 py-1.5 text-xs font-medium text-neutral-700"><Icon className="w-3.5 h-3.5" />{name}</span>
              ))}
            </div>

            {error && (
              <p className="mt-4 rounded-2xl bg-[#fde2e4] px-4 py-3 text-sm text-[#9b1c2e] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}
              </p>
            )}

            <button
              type="submit"
              form="builder"
              disabled={!picked.length || !paperValid || processingSession}
              className="mt-5 w-full h-12 rounded-2xl bg-[#005a9c] text-white text-sm font-medium hover:brightness-95 disabled:opacity-40 flex items-center justify-center gap-2 transition"
            >
              {processingSession ? <Spinner size="sm" /> : <Sparkles className="w-4 h-4" />}
              {processingSession ? 'Creating…' : 'Create test'}
            </button>
            {!picked.length && <p className="mt-2 text-center text-xs text-neutral-500">Choose at least one chapter to continue.</p>}
          </section>
        </aside>
        </div>
       </div>
      </main>

      {/* sticky bar (tablet & phone) */}
      <div className="xl:hidden shrink-0 z-30 bg-white/90 backdrop-blur-xl border-t border-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {error && (
            <p className="mb-2 rounded-2xl bg-[#fde2e4] px-3 py-2 text-sm text-[#9b1c2e] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </p>
          )}
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xl font-medium text-neutral-900 tabular-nums leading-tight">
                {totalMarks} <span className="text-sm font-normal text-neutral-500">marks</span>
              </p>
              <p className="text-xs text-neutral-500 leading-snug line-clamp-2">
                {totalQuestions} questions · {blueprint.length} {blueprint.length === 1 ? 'section' : 'sections'} · {scopeLabel || 'No chapter'}
              </p>
            </div>
            <button
              type="submit"
              form="builder"
              disabled={!picked.length || !paperValid || processingSession}
              className="h-12 px-6 rounded-2xl bg-[#005a9c] text-white text-sm font-medium hover:brightness-95 disabled:opacity-40 flex items-center gap-2 transition"
            >
              {processingSession ? <Spinner size="sm" /> : <Sparkles className="w-4 h-4" />}
              {processingSession ? 'Creating…' : 'Create test'}
            </button>
          </div>
        </div>
      </div>

      <SetupModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

function ChapterRow({ on, onClick, number, label, strong }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`w-full min-h-12 px-3 py-2.5 flex items-start gap-3 text-left transition-colors ${
        on ? 'bg-[#f8f8f8]' : 'hover:bg-neutral-50'
      }`}
    >
      <span className={`mt-0.5 h-6 w-6 shrink-0 rounded-lg grid place-items-center ${
        on ? 'bg-[#005a9c] text-white' : 'ring-1 ring-neutral-300 bg-white'
      }`}
      >
        {on && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
      </span>
      {number != null && (
        <span className={`mt-1 w-6 shrink-0 text-xs tabular-nums text-right ${on ? 'text-[#005a9c] font-semibold' : 'text-neutral-400'}`}>
          {number}
        </span>
      )}
      <span className={`min-w-0 flex-1 text-sm leading-5 break-words ${
        on ? 'text-neutral-900 font-medium' : strong ? 'text-neutral-900 font-medium' : 'text-neutral-600'
      }`}
      >
        {label}
      </span>
    </button>
  );
}
