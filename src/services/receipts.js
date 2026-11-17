// Reading fee receipts from a photo, and finding the student a receipt belongs to.
import { callDb } from './cloud';

/** Shrinks a photo to at most `max` px on its longer side and returns a JPEG data URL. */
export async function photoToDataUrl(file, max = 1600, quality = 0.82) {
  if (!file || !/^image\//.test(file.type)) throw new Error('Choose a photo (JPG, PNG or WebP).');
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('This photo could not be opened. Try another one.'));
      el.src = url;
    });
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    let out = canvas.toDataURL('image/jpeg', quality);
    // Very detailed photos: step the quality down until it fits what the server accepts.
    for (let q = quality - 0.15; out.length > 2_300_000 && q > 0.3; q -= 0.15) out = canvas.toDataURL('image/jpeg', q);
    return out;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Sends the photo to the server, which reads it. Returns the fields found on the receipt. */
export async function readReceipt(image) {
  const { fields } = await callDb('receipts.read', { image });
  return fields;
}

/** Stores the photo with the payment it was recorded as (the payment is written again with it, so the order of saves does not matter). */
export const saveReceiptPhoto = (receipt, payment) => callDb('receipts.save', { receipt, payment });

export const getReceiptPhoto = async (id) => (await callDb('receipts.get', { id })).receipt;

const words = (text) => String(text || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 1);
const digits = (text) => String(text || '').replace(/\D/g, '').slice(-10);
const classNumber = (text) => (String(text || '').match(/\d+/) || [''])[0];

/**
 * Students ranked by how well they match what was read: name words, phone number and class.
 * Each result is { student, score, reasons }, best first; only plausible matches are returned.
 */
export function matchStudents(fields, students) {
  const nameWords = new Set([...words(fields.studentName), ...words(fields.parentName)]);
  const phone = digits(fields.phone);
  const cls = classNumber(fields.className);
  return students.map((student) => {
    const reasons = [];
    let score = 0;
    const own = words(student.name);
    const hits = own.filter((w) => nameWords.has(w) || [...nameWords].some((n) => n.length > 3 && (n.startsWith(w) || w.startsWith(n))));
    if (hits.length) {
      score += (hits.length / Math.max(own.length, 1)) * 60;
      reasons.push(hits.length === own.length ? 'name matches' : 'name partly matches');
    }
    if (phone.length >= 10 && digits(student.phone) === phone) {
      score += 50;
      reasons.push('phone matches');
    }
    if (cls && classNumber(student.className) === cls) {
      score += 15;
      reasons.push('class matches');
    }
    return { student, score, reasons };
  })
    .filter((m) => m.score >= 25)
    .sort((a, b) => b.score - a.score);
}
