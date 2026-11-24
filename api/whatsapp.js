// Sends fixed WhatsApp messages through Twilio: absence alerts to parents and visit invites to inquiries.
// Credentials stay in server env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM.
// Optional approved WhatsApp templates:
//   TWILIO_CONTENT_SID        absence ({{1}} name, {{2}} date)
//   TWILIO_INVITE_CONTENT_SID invite  ({{1}} name, {{2}} institute)
//   TWILIO_MESSAGE_CONTENT_SID message ({{1}} student name, {{2}} message, {{3}} institute)

import { readToken, bearer } from './_lib/auth.js';
import { getDb } from './_lib/db.js';
import { teachesStudent } from '../src/services/batchRules.js';

// One click never sends more than this many messages.
export const MAX_MESSAGES = 40;

export function whatsAppAddress(phone) {
  let digits = String(phone || '').replace(/[^\d]/g, '');
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length === 10) digits = `91${digits}`;
  if (!/^[1-9]\d{10,14}$/.test(digits)) return '';
  return `whatsapp:+${digits}`;
}

function cleanName(value) {
  return String(value || '').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
}

function cleanDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return '';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function absenceText(name, dateLabel, subject = '') {
  return subject
    ? `${name} is not attending today's ${subject} class (${dateLabel}).`
    : `${name} is not attending today (${dateLabel}).`;
}

export function inviteText(name, institute) {
  return `Hi ${name}, thank you for your inquiry. ${institute || 'We'} would love to invite you for a visit to see our classes. Reply to this message to pick a time.`;
}

// Longest message a teacher or admin may type.
export const MAX_TEXT = 1000;

/** A typed message kept to plain text with tidy line breaks. */
export function cleanText(value) {
  return String(value || '').replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, MAX_TEXT);
}

export function messageText(name, text, institute) {
  return `Dear parent of ${name},\n\n${text}${institute ? `\n\n- ${institute}` : ''}`;
}

export function explainTwilioError(message, code) {
  const text = String(message || '');
  if (code === 63007 || /could not find a channel/i.test(text)) {
    return 'The From number is not a WhatsApp sender on Twilio. Set TWILIO_WHATSAPP_FROM to your approved WhatsApp sender, or to the Twilio sandbox number.';
  }
  if (code === 63016 || /outside the allowed window/i.test(text)) {
    return "WhatsApp allows free text only within 24 hours of the parent's last reply. Add an approved template (TWILIO_MESSAGE_CONTENT_SID) to message at any time.";
  }
  if (code === 63015 || /sandbox/i.test(text)) {
    return 'This parent has not joined the Twilio WhatsApp sandbox. They must first send the join code to the sandbox number.';
  }
  if (/verified recipient|trial phone number is assigned/i.test(text)) {
    return 'This parent number is not a verified Twilio trial recipient. In Twilio, open Messaging → Try out SMS, add this phone, and enter the code Twilio sends to it. Then use the From number shown on that page.';
  }
  return text || 'Twilio could not send the message.';
}

function twilioConfig(env) {
  const sid = env.TWILIO_ACCOUNT_SID || '';
  const token = env.TWILIO_AUTH_TOKEN || '';
  const fromRaw = env.TWILIO_WHATSAPP_FROM || '';
  if (!sid || !token || !fromRaw) return null;
  const from = fromRaw.startsWith('whatsapp:')
    ? fromRaw
    : `whatsapp:+${fromRaw.replace(/[^\d]/g, '')}`;
  return { sid, from, auth: Buffer.from(`${sid}:${token}`).toString('base64') };
}

// buildParams(name) returns the Body or ContentSid fields for one recipient.
async function sendEach(list, config, buildParams, missingPhone) {
  const sent = [];
  const failed = [];
  for (const item of list.slice(0, MAX_MESSAGES)) {
    const name = cleanName(item?.name);
    const to = whatsAppAddress(item?.phone);
    if (!name || !to) {
      failed.push({ name: name || 'Contact', error: missingPhone });
      continue;
    }
    const params = new URLSearchParams({ From: config.from, To: to, ...buildParams(name) });
    try {
      const upstream = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${config.sid}/Messages.json`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${config.auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });
      const payload = await upstream.json().catch(() => ({}));
      if (upstream.ok) sent.push(name);
      else failed.push({ name, error: explainTwilioError(payload.message, payload.code) });
    } catch {
      failed.push({ name, error: 'Could not reach Twilio.' });
    }
  }
  return { ok: true, configured: true, sent, failed };
}

export async function sendAbsences(list, date, env = process.env, subject = '') {
  const dateLabel = cleanDate(date);
  if (!dateLabel) return { ok: false, error: 'Pick a valid date.' };
  const config = twilioConfig(env);
  if (!config) return { ok: false, configured: false };
  return sendEach(list, config, (name) => (env.TWILIO_CONTENT_SID
    ? { ContentSid: env.TWILIO_CONTENT_SID, ContentVariables: JSON.stringify({ 1: name, 2: dateLabel }) }
    : { Body: absenceText(name, dateLabel, cleanName(subject)) }), 'Add a valid parent WhatsApp number.');
}

export async function sendInvites(list, institute, env = process.env) {
  const config = twilioConfig(env);
  if (!config) return { ok: false, configured: false };
  const place = cleanName(institute);
  return sendEach(list, config, (name) => (env.TWILIO_INVITE_CONTENT_SID
    ? { ContentSid: env.TWILIO_INVITE_CONTENT_SID, ContentVariables: JSON.stringify({ 1: name, 2: place || 'our institute' }) }
    : { Body: inviteText(name, place) }), 'Add a valid WhatsApp number.');
}

/** A typed message to the parents of the chosen students. */
export async function sendMessages(list, text, institute, env = process.env) {
  const body = cleanText(text);
  if (!body) return { ok: false, error: 'Type a message first.' };
  const config = twilioConfig(env);
  if (!config) return { ok: false, configured: false };
  const place = cleanName(institute);
  return sendEach(list, config, (name) => (env.TWILIO_MESSAGE_CONTENT_SID
    // Template values may not hold line breaks.
    ? { ContentSid: env.TWILIO_MESSAGE_CONTENT_SID, ContentVariables: JSON.stringify({ 1: name, 2: body.replace(/\s*\n+\s*/g, ' '), 3: place || 'your institute' }) }
    : { Body: messageText(name, body, place) }), 'Add a valid parent WhatsApp number.');
}

/** Only signed-in admins and teachers may send messages from the institute's Twilio number. */
export function allowedToSend(req) {
  const session = readToken(bearer(req));
  return !!session && ['admin', 'teacher'].includes(session.role);
}

/**
 * The name and saved number of each chosen student the signed-in user may alert, or null if the account is gone.
 * Numbers are read here so they never pass through a teacher's browser.
 */
export async function absenceRecipients(db, session, ids) {
  let instituteId = session.instituteId;
  let teacher = null;
  if (session.role === 'admin') {
    const admin = await db.collection('admins').findOne({ _id: session.adminId });
    if (!admin?.active) return null;
    instituteId = `admin-${admin._id}`;
  } else {
    teacher = await db.collection('teachers').findOne({ _id: `${instituteId}:${session.teacherId}` });
    if (!teacher) return null;
  }
  const keys = [...new Set(ids.map(String))].slice(0, MAX_MESSAGES).map((id) => `${instituteId}:${id}`);
  const students = await db.collection('students').find({ _id: { $in: keys } }).toArray();
  return students
    .filter((s) => !teacher || teachesStudent(teacher, s))
    .map((s) => ({ name: s.name, phone: s.phone }));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!allowedToSend(req)) {
    res.status(401).json({ error: 'Please sign in again.' });
    return;
  }
  let body = req.body || {};
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body || '{}');
    } catch {
      res.status(400).json({ error: 'The request was not valid JSON.' });
      return;
    }
  }
  if (body.kind === 'invite') {
    const leads = Array.isArray(body.leads) ? body.leads.slice(0, MAX_MESSAGES) : [];
    if (!leads.length) {
      res.status(400).json({ error: 'No inquiries to invite.' });
      return;
    }
    const result = await sendInvites(leads, body.institute);
    res.status(result.error ? 400 : 200).json(result);
    return;
  }
  const message = body.kind === 'message';
  if (message && !cleanText(body.text)) {
    res.status(400).json({ error: 'Type a message first.' });
    return;
  }
  const ids = Array.isArray(body.studentIds) ? body.studentIds : [];
  if (!ids.length) {
    res.status(400).json({ error: 'No students to notify.' });
    return;
  }
  const session = readToken(bearer(req));
  let students;
  try {
    students = await absenceRecipients(await getDb(), session, ids);
  } catch {
    res.status(500).json({ error: 'Could not read the student list. Try again.' });
    return;
  }
  if (!students) {
    res.status(401).json({ error: 'Please sign in again.' });
    return;
  }
  if (!students.length) {
    res.status(403).json({ error: 'You can only notify parents of your own students.' });
    return;
  }
  const result = message
    ? await sendMessages(students, body.text, body.institute)
    : await sendAbsences(students, body.date, process.env, body.subject);
  // Twilio's error text can quote the number, so a teacher gets a plain message instead.
  if (session.role === 'teacher' && result.failed) {
    result.failed = result.failed.map(({ name }) => ({ name, error: 'Could not send this message.' }));
  }
  res.status(result.error ? 400 : 200).json(result);
}
