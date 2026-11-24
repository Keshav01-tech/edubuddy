import { callDb } from './cloud';

// Notes teachers share with a batch (or a whole class). The file itself is fetched only when opened.
export const MAX_NOTE_BYTES = 3 * 1024 * 1024;
export const NOTE_TYPES = 'application/pdf,image/png,image/jpeg,image/webp';

export const listNotes = () => callDb('notes.list').then((r) => r.notes || []);
export const saveNote = (note, file) => callDb('notes.save', { note, file }).then((r) => r.note);
export const deleteNote = (id) => callDb('notes.delete', { id });

/** Reads a chosen file as a data URL, refusing types and sizes the server would refuse. */
export function readNoteFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) { resolve(''); return; }
    if (!NOTE_TYPES.split(',').includes(file.type)) { reject(new Error('Choose a PDF or a photo (JPG, PNG or WebP).')); return; }
    if (file.size > MAX_NOTE_BYTES) { reject(new Error('This file is over 3 MB. Choose a smaller one or share a link.')); return; }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read this file.'));
    reader.readAsDataURL(file);
  });
}

/** Opens a note's file in a new tab (PDF or photo). */
export async function openNoteFile(note) {
  // Open the tab first, while the tap still counts, then fill it once the file arrives.
  const win = window.open('', '_blank');
  try {
    const { data, fileType } = await callDb('notes.file', { id: note.id });
    const bytes = Uint8Array.from(atob(data.slice(data.indexOf(',') + 1)), (c) => c.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type: fileType || 'application/octet-stream' }));
    if (win) win.location.href = url;
    else window.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (err) {
    if (win) win.close();
    throw err;
  }
}

export const formatSize = (bytes) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);
