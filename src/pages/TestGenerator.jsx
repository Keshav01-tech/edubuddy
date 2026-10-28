import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useStudy } from '../context/StudyContext';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle, BookOpen, Trash2, ChevronDown, Minus, Plus, Search, Check, Sparkles,
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
  mcq: { label: 'MCQ', pill: 'bg-sky-50 text-sky-700 ring-sky-200', bar: 'bg-sky-500' },
  short: { label: 'Short answer', pill: 'bg-amber-50 text-amber-700 ring-amber-200', bar: 'bg-amber-500' },
  long: { label: 'Long answer', pill: 'bg-violet-50 text-violet-700 ring-violet-200', bar: 'bg-violet-500' },
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
  return `h-10 rounded-xl text-sm font-medium transition-colors ring-1 ${
    on
      ? 'bg-brand-600 text-white ring-brand-600 shadow-sm'
      : 'bg-white text-slate-600 ring-slate-200 hover:ring-brand-300 hover:text-brand-700'
  }`;
}

function Card({ step, title, aside, children }) {
  return (
    <section className="bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-card p-4 sm:p-5">
      <header className="flex items-center gap-3 mb-4">
        <span className="h-7 w-7 shrink-0 rounded-full bg-brand-100 text-brand-700 text-xs font-bold grid place-items-center">
          {step}
        </span>
        <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
        {aside && <div className="ml-auto min-w-0 text-right">{aside}</div>}
      </header>
      {children}
    </section>
  );
}

function SelectBox({ label, value, onChange, children }) {
  return (
    <label className="block min-w-0">
      <span className="block text-xs font-medium text-slate-500 mb-1.5">{label}</span>
      <span className="relative block">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full h-11 pl-3 pr-9 text-sm font-medium text-slate-900 bg-slate-50 rounded-xl ring-1 ring-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-brand-400 focus:bg-white"
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      </span>
    </label>
  );
}

function Stepper({ label, value, min, max, onChange }) {
  const set = (next) => onChange(Math.min(max, Math.max(min, next)));
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium text-slate-500 mb-1">{label}</p>
      <div className="flex items-center h-10 rounded-xl bg-slate-50 ring-1 ring-slate-200">
        <button
          type="button"
          onClick={() => set(value - 1)}
          disabled={value <= min}
          className="h-10 w-9 shrink-0 grid place-items-center text-slate-500 disabled:opacity-30"
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
          className="flex-1 min-w-0 w-full text-center bg-transparent text-base font-semibold tabular-nums text-slate-900 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => set(value + 1)}
          disabled={value >= max}
          className="h-10 w-9 shrink-0 grid place-items-center text-slate-500 disabled:opacity-30"
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
    <div className="h-dvh flex flex-col bg-gradient-to-b from-brand-50 via-slate-50 to-slate-50">
      <div className="shrink-0">
        <AppHeader
          nav
          width="max-w-3xl"
          onSettings={() => setSettingsOpen(true)}
          onSignOut={async () => { await signOut(); navigate('/login'); }}
        />
      </div>

      <main className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain max-w-2xl w-full mx-auto px-4 sm:px-6 pt-5 sm:pt-8 pb-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">New test paper</h1>
            <p className="mt-1 text-sm text-slate-500">Pick the chapters, set the sections, and create.</p>
          </div>
          {sessions.length > 0 && (
            <Link
              to="/papers"
              className="shrink-0 h-10 px-3 rounded-xl bg-white ring-1 ring-slate-200 text-sm font-medium text-slate-700 hover:text-brand-700 hover:ring-brand-300 flex items-center gap-1.5"
            >
              <BookOpen className="w-4 h-4" />
              My tests
              <span className="text-xs text-slate-400 tabular-nums">{sessions.length}</span>
            </Link>
          )}
        </div>

        {!isOpenAIConfigured() && (
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="mb-4 w-full flex items-center gap-2 p-3 bg-amber-50 ring-1 ring-amber-200 rounded-xl text-left"
          >
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-sm font-medium text-amber-900">Add an OpenAI key to create tests</span>
          </button>
        )}

        <form id="builder" onSubmit={handleCreate} className="space-y-4">
          <Card step="1" title="Class & subject">
            <div className="grid grid-cols-2 gap-3">
              <SelectBox label="Class" value={cls} onChange={setCls}>
                {classes.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </SelectBox>
              <SelectBox label="Subject" value={sub} onChange={setSub}>
                {subjectNames.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </SelectBox>
            </div>
            {streamNames.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl">
                {streamNames.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setStream(name)}
                    className={`h-9 rounded-lg text-sm font-medium transition-colors ${
                      stream === name ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </Card>

          <Card
            step="2"
            title="Chapters"
            aside={(
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                picked.length ? 'bg-brand-50 text-brand-700' : 'bg-rose-50 text-rose-600'
              }`}
              >
                {wholeBook ? 'All chapters' : picked.length ? `${picked.length} selected` : 'None selected'}
              </span>
            )}
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
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
                className="w-full h-11 pl-9 pr-3 text-base bg-slate-50 rounded-xl ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:bg-white placeholder:text-slate-400"
              />
            </div>

            {!wholeBook && picked.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Selected chapters">
                {picked.map((name) => (
                  <li key={name} className="max-w-full">
                    <button
                      type="button"
                      onClick={() => (name === extra ? setCustom('') : toggleChapter(name))}
                      className="max-w-full min-h-9 px-2.5 py-1 rounded-lg bg-brand-50 text-brand-800 text-xs font-medium leading-snug text-left break-words"
                    >
                      {name}
                      <span className="sr-only">, deselect</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div
              className="chapter-list mt-3 overflow-y-auto overscroll-y-contain rounded-xl ring-1 ring-slate-200 divide-y divide-slate-100"
              style={{ maxHeight: 'min(28rem, 52dvh)' }}
            >
              <ChapterRow on={wholeBook} onClick={toggleWholeBook} label="Select all" strong />
              {extra && (
                <ChapterRow on onClick={() => setCustom('')} label={extra} strong />
              )}
              {visibleChapters.length === 0 && !extra && (
                <p className="px-3 py-6 text-sm text-slate-400">
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
            aside={(
              <span className="text-xs font-medium text-slate-400">
                {preset ? `${PATTERN_LABEL[preset.mode]} · ${preset.total}` : 'Custom'}
              </span>
            )}
          >
            <fieldset>
              <legend className="text-sm font-medium text-slate-800 mb-2">1. What type of questions?</legend>
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
              <legend className="text-sm font-medium text-slate-800 mb-2">2. Total marks?</legend>
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
              className="mt-5 w-full flex items-center justify-between gap-3 h-11 px-3 rounded-xl bg-slate-50 ring-1 ring-slate-200 text-left"
            >
              <span className="min-w-0 text-sm text-slate-600 truncate">
                {blueprint.map((section) => `${section.count} ${TYPE_META[section.type].label}`).join(' · ') || 'No sections'}
              </span>
              <span className="shrink-0 flex items-center gap-1 text-sm font-medium text-brand-700">
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
                  <div key={section.id} className="relative rounded-xl ring-1 ring-slate-200 bg-white pl-4 pr-3 py-3 overflow-hidden">
                    <span className={`absolute left-0 inset-y-0 w-1 ${meta.bar}`} />
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-400">Section {LETTERS[index] || index + 1}</span>
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
                      <span className="ml-auto text-sm font-semibold text-slate-900 tabular-nums">
                        {section.count * section.marksEach}
                        <span className="text-xs font-normal text-slate-400"> marks</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => removeSection(section.id)}
                        className="h-8 w-8 -mr-1 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 grid place-items-center"
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
                      <span className="pb-2.5 text-slate-300 text-sm">×</span>
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
              className="mt-2 w-full h-11 rounded-xl border-2 border-dashed border-brand-200 text-sm font-medium text-brand-700 hover:bg-brand-50 flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              <Plus className="w-4 h-4" />
              Add section
            </button>
            </>
            )}

            {(tooManyMarks || tooManyQuestions) && (
              <p className="mt-3 text-sm text-rose-600 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {tooManyMarks
                  ? `${totalMarks} marks is over the ${MAX_MARKS}-mark limit.`
                  : `${totalQuestions} questions is over the ${MAX_QUESTIONS}-question limit.`}
              </p>
            )}
          </Card>

        </form>
      </main>

      <div className="shrink-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {error && (
            <p className="mb-2 text-sm text-rose-600 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </p>
          )}
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-lg font-semibold text-slate-900 tabular-nums leading-tight">
                {totalMarks} <span className="text-sm font-medium text-slate-500">marks</span>
              </p>
              <p className="text-xs text-slate-500 leading-snug line-clamp-2">
                {totalQuestions} questions · {blueprint.length} {blueprint.length === 1 ? 'section' : 'sections'} · {scopeLabel || 'No chapter'}
              </p>
            </div>
            <button
              type="submit"
              form="builder"
              disabled={!picked.length || !paperValid || processingSession}
              className="h-12 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-sm disabled:opacity-40 flex items-center gap-2"
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
        on ? 'bg-brand-50' : 'hover:bg-slate-50'
      }`}
    >
      <span className={`mt-0.5 h-6 w-6 shrink-0 rounded-md grid place-items-center ${
        on ? 'bg-brand-600 text-white' : 'ring-1 ring-slate-300 bg-white'
      }`}
      >
        {on && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
      </span>
      {number != null && (
        <span className={`mt-1 w-6 shrink-0 text-xs tabular-nums text-right ${on ? 'text-brand-700 font-semibold' : 'text-slate-400'}`}>
          {number}
        </span>
      )}
      <span className={`min-w-0 flex-1 text-sm leading-5 break-words ${
        on ? 'text-brand-900 font-medium' : strong ? 'text-slate-900 font-medium' : 'text-slate-600'
      }`}
      >
        {label}
      </span>
    </button>
  );
}
