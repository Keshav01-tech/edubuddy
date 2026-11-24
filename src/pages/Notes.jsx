import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Upload, FileText, Link2, Trash2, CheckCircle2, Image as ImageIcon, RotateCcw, Send, Sparkles } from 'lucide-react';
import { ChapterChoice, useChapterChoice } from '../components/ChapterChoice';
import { NoteBlocks, NoteContent } from '../components/NoteContent';
import { noteTextFrom, MAX_NOTE_CONTENT } from '../services/noteText';
import { useAuth } from '../context/AuthContext';
import { AppHeader } from '../components/AppHeader';
import { useClassroom, formatDate } from '../services/classroom';
import { PageHeader, Picker, EmptyState } from '../components/ui';
import { Spinner } from '../components/Spinner';
import { listNotes, saveNote, deleteNote, readNoteFile, openNoteFile, formatSize, NOTE_TYPES } from '../services/notes';
import { batchOptions } from './Marks';
import { useT } from '../i18n';

const field = 'w-full h-11 px-3 text-base sm:text-sm bg-white rounded-xl ring-1 ring-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-400 placeholder:text-neutral-400';
const primary = 'h-12 rounded-xl bg-[#005a9c] hover:bg-[#1b365d] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60';
const splitKey = (key) => { const [className, section = ''] = String(key || '').split('||'); return { className, section }; };

export function noteBatchLabel(note) {
  return note.section ? `${note.className} · Batch ${note.section}` : `${note.className} · all batches`;
}

function Segmented({ value, onChange, options, label }) {
  return (
    <div className="grid grid-flow-col auto-cols-fr rounded-xl bg-neutral-100 p-1" role="tablist" aria-label={label}>
      {options.map(({ id, text, icon: Icon }) => (
        <button key={id} type="button" role="tab" aria-selected={value === id} onClick={() => onChange(id)}
          className={`h-10 rounded-lg px-3 text-sm font-semibold inline-flex items-center justify-center gap-1.5 transition-colors ${value === id ? 'bg-white text-[#005a9c] shadow-sm' : 'text-neutral-600 hover:text-neutral-900'}`}>
          {Icon && <Icon className="w-4 h-4" />} {text}
        </button>
      ))}
    </div>
  );
}

/** Step two: the teacher reads the AI notes, fixes anything, and shares them with the batch. */
function ReviewNotes({ draft, setDraft, batchLabel, busy, generating, onShare, onRegenerate, onBack }) {
  const { t } = useT();
  const [view, setView] = useState('preview');
  return (
    <section className="bg-white rounded-3xl ring-1 ring-neutral-200 p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <button type="button" onClick={onBack} className="h-10 -ml-2 px-2 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-100 inline-flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" /> {t('Back')}
        </button>
        <span className="rounded-full bg-[#eef6fc] px-3 py-1 text-xs font-semibold text-[#005a9c]">{batchLabel}</span>
      </div>
      <label className="block">
        <span className="sr-only">{t('Title')}</span>
        <input
          className="w-full rounded-xl px-2 py-1.5 -mx-2 text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900 hover:bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-400"
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          aria-label={t('Title')}
        />
      </label>
      <p className="mt-0.5 mb-4 text-sm text-neutral-500">{draft.subject}</p>

      <div className="max-w-56 mb-3">
        <Segmented label={t('Notes view')} value={view} onChange={setView} options={[{ id: 'preview', text: t('Preview') }, { id: 'edit', text: t('Edit') }]} />
      </div>
      {view === 'preview' ? (
        <div className="max-h-[60dvh] overflow-y-auto rounded-2xl bg-neutral-50 p-4 sm:p-6 text-[15px] leading-relaxed text-neutral-800">
          <NoteBlocks text={draft.content} />
        </div>
      ) : (
        <>
          <textarea
            className="w-full min-h-[50dvh] rounded-2xl bg-white p-4 text-base sm:text-sm leading-relaxed ring-1 ring-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-400"
            maxLength={MAX_NOTE_CONTENT}
            value={draft.content}
            onChange={(e) => setDraft({ ...draft, content: e.target.value })}
            aria-label={t('Edit')}
          />
          <p className="mt-1 text-xs text-neutral-500">{t('Use ## for a heading and - for a point.')}</p>
        </>
      )}

      <div className="mt-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2">
        <button type="button" onClick={onRegenerate} disabled={generating || busy} className="h-12 px-4 rounded-xl text-sm font-semibold text-neutral-700 ring-1 ring-neutral-200 hover:bg-neutral-50 inline-flex items-center justify-center gap-2 disabled:opacity-50">
          {generating ? <Spinner size="sm" /> : <RotateCcw className="w-4 h-4" />} {t(generating ? 'Writing notes…' : 'Generate again')}
        </button>
        <button type="button" onClick={onShare} disabled={busy || generating || !draft.title.trim() || !draft.content.trim()} className={`${primary} px-6`}>
          {busy ? <><Spinner size="sm" /> {t('Sharing…')}</> : <><Send className="w-4 h-4" /> {t('Share with batch')}</>}
        </button>
      </div>
    </section>
  );
}

export default function Notes() {
  const { t } = useT();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const room = useClassroom();
  const isAdmin = user?.role === 'admin';

  // The admin may share with a whole class as well as with one batch; a teacher shares with their own batches.
  const options = useMemo(() => {
    const batches = batchOptions(room.classes);
    if (!isAdmin) return batches;
    const whole = room.classes.filter((c) => (c.sections || []).length).map((c) => ({ value: `${c.name}||`, label: `${c.name} · all batches` }));
    return [...whole, ...batches];
  }, [room.classes, isAdmin]);

  const [notes, setNotes] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [mode, setMode] = useState('ai');
  const [pickedBatch, setPickedBatch] = useState('');
  const [draft, setDraft] = useState(null);
  const [upload, setUpload] = useState({ title: '', text: '', link: '' });
  const [file, setFile] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const fileRef = useRef(null);

  const batch = pickedBatch || options[0]?.value || '';
  const { className, section } = splitKey(batch);
  const timing = room.classes.find((c) => c.name === className)?.timings?.[section] || {};
  const subjectOf = timing.subject || '';
  const choice = useChapterChoice(className, subjectOf, timing.medium || '');
  const batchLabel = options.find((o) => o.value === batch)?.label || '';

  useEffect(() => {
    listNotes().then(setNotes).catch((err) => { setLoadError(err.message); setNotes([]); });
  }, []);

  const generate = async () => {
    setError(''); setDone('');
    if (!choice.picked.length) { setError(t('Choose at least one chapter.')); return; }
    if (draft && !confirm(t('Replace the notes written so far?'))) return;
    setGenerating(true);
    try {
      const { generateStudyNotes } = await import('../services/openai');
      const made = await generateStudyNotes({ className: choice.cls, subject: choice.subject, chapters: choice.picked, language: choice.language });
      setDraft({
        title: String(made.title || '').trim() || `${choice.picked[0]} notes`,
        subject: choice.subject,
        content: noteTextFrom(made).slice(0, MAX_NOTE_CONTENT),
      });
    } catch (err) {
      setError(err.message || t('Could not create the notes. Try again.'));
    } finally {
      setGenerating(false);
    }
  };

  const shared = (note) => {
    setNotes((list) => [note, ...(list || [])]);
    setDone(`"${note.title}" is shared with ${noteBatchLabel(note)}.`);
  };

  const shareDraft = async () => {
    setError(''); setDone('');
    setBusy(true);
    try {
      shared(await saveNote({ className, section, title: draft.title.trim(), subject: draft.subject, content: draft.content.trim() }));
      setDraft(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const shareUpload = async (event) => {
    event.preventDefault();
    setError(''); setDone('');
    if (!upload.title.trim()) { setError('Give the note a title, e.g. "Chapter 6 notes".'); return; }
    if (!file && !upload.link.trim() && !upload.text.trim()) { setError('Attach a file, add a link or write a few lines.'); return; }
    setBusy(true);
    try {
      const data = await readNoteFile(file);
      shared(await saveNote({
        className, section, title: upload.title.trim(), subject: subjectOf.trim(), text: upload.text.trim(), link: upload.link.trim(), fileName: file?.name || '',
      }, data || undefined));
      setUpload({ title: '', text: '', link: '' });
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (note) => {
    if (!confirm(`Delete "${note.title}"? Parents will no longer see it.`)) return;
    try {
      await deleteNote(note.id);
      setNotes((list) => list.filter((n) => n.id !== note.id));
    } catch (err) {
      setError(err.message);
    }
  };

  const open = (note) => openNoteFile(note).catch((err) => setError(err.message));
  const leaveDraft = () => { if (confirm(t('Discard these notes?'))) setDraft(null); };

  const messages = (
    <>
      {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">{error}</p>}
      {done && <p className="flex items-start gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800" role="status"><CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />{done}</p>}
    </>
  );

  return (
    <div className="min-h-dvh app-canvas">
      <AppHeader nav onSignOut={async () => { await signOut(); navigate('/login'); }} />
      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-14">
        <PageHeader icon={BookOpen} eyebrow={t('Teaching')} title={t('Notes')} subtitle={t('Create notes with AI and share them with a batch.')} />

        {options.length === 0 ? (
          <div className="bg-white rounded-3xl ring-1 ring-neutral-200"><EmptyState icon={BookOpen} title={t('No batches yet')} text={room.isTeacher ? 'Ask your admin to give you a batch.' : 'Create a batch on the Batches page first.'} /></div>
        ) : draft ? (
          <div className="space-y-3">
            {messages}
            <ReviewNotes draft={draft} setDraft={setDraft} batchLabel={batchLabel} busy={busy} generating={generating} onShare={shareDraft} onRegenerate={generate} onBack={leaveDraft} />
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,460px)_1fr] items-start">
            <section className="bg-white rounded-3xl ring-1 ring-neutral-200 p-4 sm:p-6 space-y-4">
              <Segmented
                label={t('How to add notes')}
                value={mode}
                onChange={(next) => { setMode(next); setError(''); }}
                options={[{ id: 'ai', text: t('Create with AI'), icon: Sparkles }, { id: 'file', text: t('Upload file'), icon: Upload }]}
              />
              <div>
                <span className="mb-1 block text-xs font-semibold text-neutral-600">{t('Batch')}</span>
                <Picker label={t('Choose batch')} value={batch} onChange={setPickedBatch} options={options} />
              </div>

              {mode === 'ai' ? (
                <>
                  <ChapterChoice choice={choice} />
                  {messages}
                  <button type="button" onClick={generate} disabled={generating} className={`${primary} w-full`}>
                    {generating ? <><Spinner size="sm" /> {t('Writing notes…')}</> : <><Sparkles className="w-4 h-4" /> {t('Generate notes')}</>}
                  </button>
                  {generating && <p className="text-center text-xs text-neutral-500">{t('This can take up to a minute.')}</p>}
                </>
              ) : (
                <form onSubmit={shareUpload} className="space-y-3.5">
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-neutral-600">{t('Title')}</span>
                    <input className={field} value={upload.title} onChange={(e) => setUpload({ ...upload, title: e.target.value })} placeholder="Chapter 6: Life processes notes" />
                  </label>
                  <div>
                    <span className="mb-1 block text-xs font-semibold text-neutral-600">{t('File')} <span className="font-normal text-neutral-400">(PDF or photo, up to 3 MB)</span></span>
                    <label className="flex items-center gap-3 rounded-xl ring-1 ring-dashed ring-neutral-300 px-3 py-3 cursor-pointer hover:bg-neutral-50">
                      <Upload className="w-5 h-5 text-neutral-500 shrink-0" />
                      <span className="min-w-0 flex-1 truncate text-sm text-neutral-700">{file ? `${file.name} · ${formatSize(file.size)}` : t('Choose a file')}</span>
                      <input ref={fileRef} type="file" accept={NOTE_TYPES} className="sr-only" onChange={(e) => { setError(''); setFile(e.target.files?.[0] || null); }} />
                    </label>
                  </div>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-neutral-600">{t('Or a link')} <span className="font-normal text-neutral-400">(optional)</span></span>
                    <input className={field} value={upload.link} onChange={(e) => setUpload({ ...upload, link: e.target.value })} placeholder="https://drive.google.com/…" inputMode="url" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-neutral-600">{t('Message')} <span className="font-normal text-neutral-400">(optional)</span></span>
                    <textarea className={`${field} h-auto py-2.5`} rows={3} value={upload.text} onChange={(e) => setUpload({ ...upload, text: e.target.value })} placeholder="Read pages 92 to 98 before Saturday's test." />
                  </label>
                  {messages}
                  <button type="submit" disabled={busy} className={`${primary} w-full`}>
                    {busy ? <><Spinner size="sm" /> {t('Sharing…')}</> : <><Upload className="w-4 h-4" /> {t('Share note')}</>}
                  </button>
                </form>
              )}
            </section>

            <section className="bg-white rounded-3xl ring-1 ring-neutral-200 overflow-hidden">
              <h2 className="px-4 sm:px-5 pt-4 pb-3 text-lg font-semibold text-neutral-900">{t('Shared notes')}</h2>
              {notes === null ? (
                <div className="py-10 grid place-items-center"><Spinner /></div>
              ) : notes.length === 0 ? (
                <EmptyState icon={BookOpen} title={t('No notes shared yet')} text={loadError || 'Notes you share appear here and in the parent panel.'} />
              ) : (
                <ul className="divide-y divide-neutral-100 border-t border-neutral-100">
                  {notes.map((n) => {
                    const Icon = n.content ? Sparkles : n.fileType?.startsWith('image/') ? ImageIcon : n.fileName ? FileText : n.link ? Link2 : BookOpen;
                    return (
                      <li key={n.id} className="flex items-start gap-3 px-4 sm:px-5 py-3.5">
                        <span className="h-10 w-10 shrink-0 grid place-items-center rounded-xl bg-[#eef3ff] text-[#005a9c]"><Icon className="w-5 h-5" /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold text-neutral-900">{n.title}</span>
                          <span className="block text-xs text-neutral-500">{[noteBatchLabel(n), n.subject, formatDate(String(n.createdAt).slice(0, 10)), n.createdByName].filter(Boolean).join(' · ')}</span>
                          {n.text && <span className="mt-1 block text-sm text-neutral-700">{n.text}</span>}
                          {n.content && <NoteContent text={n.content} />}
                          <span className="mt-2 flex flex-wrap gap-2">
                            {n.fileName && <button type="button" onClick={() => open(n)} className="h-9 px-3 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-xs font-semibold text-neutral-800">Open {n.fileType === 'application/pdf' ? 'PDF' : 'photo'} · {formatSize(n.fileSize)}</button>}
                            {n.link && <a href={n.link} target="_blank" rel="noopener noreferrer" className="h-9 px-3 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-xs font-semibold text-neutral-800 inline-flex items-center">Open link</a>}
                          </span>
                        </span>
                        {(isAdmin || n.createdBy === user?.id) && (
                          <button type="button" onClick={() => remove(n)} className="h-9 w-9 shrink-0 grid place-items-center rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50" aria-label={`Delete ${n.title}`}><Trash2 className="w-4 h-4" /></button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
