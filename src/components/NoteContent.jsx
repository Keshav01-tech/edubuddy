import React from 'react';
import { MathText } from './MathText';
import { noteBlocks } from '../services/noteText';
import { useT } from '../i18n';

/** Note text laid out as headings, points and paragraphs. */
export function NoteBlocks({ text }) {
  return (
    <div className="space-y-2">
      {noteBlocks(text).map((block, index) => {
        if (block.type === 'heading') return <h3 key={index} className="pt-3 first:pt-0 text-base font-semibold text-neutral-900"><MathText text={block.text} /></h3>;
        if (block.type === 'list') {
          return (
            <ul key={index} className="list-disc space-y-1 pl-5">
              {block.items.map((item, i) => <li key={i}><MathText text={item} /></li>)}
            </ul>
          );
        }
        return <p key={index}><MathText text={block.text} /></p>;
      })}
    </div>
  );
}

/** AI study notes, folded until opened so a list of notes stays short. */
export function NoteContent({ text }) {
  const { t } = useT();
  return (
    <details className="mt-2 rounded-xl bg-neutral-50 px-3 py-2">
      <summary className="min-h-7 cursor-pointer text-sm font-semibold text-[#005a9c]">{t('Read notes')}</summary>
      <div className="mt-2 text-sm leading-relaxed text-neutral-800"><NoteBlocks text={text} /></div>
    </details>
  );
}
