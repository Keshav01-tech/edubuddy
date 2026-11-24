import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { Picker } from './ui';
import { ncertSyllabus, streamsFor, subjectsFor, chaptersFor } from '../data/ncertData';
import { sameClass } from '../services/teachers';
import { useT } from '../i18n';

const SYLLABUS_CLASSES = Object.keys(ncertSyllabus);
const sameName = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();

/**
 * The syllabus for one batch: its class and subject are filled in from the batch, and the teacher ticks chapters.
 * A batch with a custom class name (such as "Foundation") picks its syllabus class by hand.
 */
export function useChapterChoice(className, batchSubject, batchMedium) {
  const matched = SYLLABUS_CLASSES.find((name) => sameClass(name, className)) || '';
  const [manualClass, setManualClass] = useState('');
  const [stream, setStream] = useState('');
  const [subject, setSubject] = useState('');
  const [chapters, setChapters] = useState([]);
  const [language, setLanguage] = useState(batchMedium === 'hi' ? 'hi' : 'en');

  useEffect(() => {
    setManualClass('');
    setStream('');
    setSubject('');
    setChapters([]);
    setLanguage(batchMedium === 'hi' ? 'hi' : 'en');
  }, [className, batchSubject, batchMedium]);

  const cls = matched || manualClass || SYLLABUS_CLASSES[0];
  const streams = streamsFor(cls);
  const batchStream = streams.find((s) => subjectsFor(cls, s).some((n) => sameName(n, batchSubject)));
  const currentStream = stream || batchStream || streams[0] || '';
  const subjects = subjectsFor(cls, currentStream);
  const currentSubject = subjects.find((n) => n === subject)
    || subjects.find((n) => sameName(n, batchSubject))
    || subjects[0]
    || '';
  const list = chaptersFor(cls, currentSubject);
  const picked = list.filter((name) => chapters.includes(name));

  return {
    matched, cls, streams, stream: currentStream, subjects, subject: currentSubject, list, picked, language, setLanguage,
    pickClass: (value) => { setManualClass(value); setStream(''); setSubject(''); setChapters([]); },
    pickStream: (value) => { setStream(value); setSubject(''); setChapters([]); },
    pickSubject: (value) => { setSubject(value); setChapters([]); },
    toggle: (name) => setChapters((now) => (now.includes(name) ? now.filter((x) => x !== name) : [...now, name])),
    toggleAll: () => setChapters(picked.length === list.length ? [] : [...list]),
  };
}

export function ChapterChoice({ choice }) {
  const { t } = useT();
  const allPicked = choice.list.length > 0 && choice.picked.length === choice.list.length;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <span className="mb-1 block text-xs font-semibold text-neutral-600">{t('Syllabus class')}</span>
          {choice.matched ? (
            <p className="flex h-11 items-center rounded-xl bg-white px-3 text-sm font-medium text-neutral-800 ring-1 ring-neutral-200">{choice.cls}</p>
          ) : (
            <Picker label={t('Syllabus class')} value={choice.cls} onChange={choice.pickClass} options={SYLLABUS_CLASSES.map((c) => ({ value: c, label: c }))} className="!h-11" />
          )}
        </div>
        <div>
          <span className="mb-1 block text-xs font-semibold text-neutral-600">{t('Subject')}</span>
          <Picker label={t('Subject')} value={choice.subject} onChange={choice.pickSubject} options={choice.subjects.map((s) => ({ value: s, label: s }))} className="!h-11" />
        </div>
      </div>
      {choice.streams.length > 0 && (
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={t('Stream')}>
          {choice.streams.map((s) => (
            <button key={s} type="button" role="radio" aria-checked={choice.stream === s} onClick={() => choice.pickStream(s)}
              className={`h-10 rounded-full px-4 text-sm font-medium ${choice.stream === s ? 'bg-[#005a9c] text-white' : 'bg-white text-neutral-700 ring-1 ring-neutral-200'}`}>
              {s}
            </button>
          ))}
        </div>
      )}
      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-neutral-600">{t('Chapters')} · {choice.picked.length}</span>
          {choice.list.length > 1 && (
            <button type="button" onClick={choice.toggleAll} className="min-h-8 px-1 text-xs font-semibold text-[#005a9c]">{t(allPicked ? 'Clear all' : 'Select all')}</button>
          )}
        </div>
        <ul className="max-h-52 overflow-y-auto rounded-xl bg-white ring-1 ring-neutral-200 divide-y divide-neutral-100">
          {choice.list.length === 0 && <li className="px-3 py-3 text-sm text-neutral-500">{t('No chapters for this subject.')}</li>}
          {choice.list.map((name) => {
            const on = choice.picked.includes(name);
            return (
              <li key={name}>
                <button type="button" role="checkbox" aria-checked={on} onClick={() => choice.toggle(name)} className="flex min-h-11 w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-neutral-800 hover:bg-neutral-50">
                  <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-md ${on ? 'bg-[#005a9c] text-white' : 'ring-1 ring-neutral-300'}`}>{on && <Check className="h-3.5 w-3.5" />}</span>
                  <span className="min-w-0">{name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="inline-flex rounded-xl bg-white p-1 ring-1 ring-neutral-200" role="radiogroup" aria-label={t('Language')}>
        {[['en', 'English'], ['hi', 'हिंदी']].map(([id, label]) => (
          <button key={id} type="button" role="radio" aria-checked={choice.language === id} onClick={() => choice.setLanguage(id)}
            className={`h-9 rounded-lg px-4 text-sm font-medium ${choice.language === id ? 'bg-[#005a9c] text-white' : 'text-neutral-600'}`}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
