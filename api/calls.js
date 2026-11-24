// AI fee-reminder calls. Twilio rings the parent's saved number; an OpenAI agent speaks with them about the pending
// fee, listens to the answer and notes the outcome (promised date, already paid, call back, dispute).
//
//   POST /api/calls                    signed-in admin or front desk: { action: 'list' | 'start' | 'settings', ... }
//   POST /api/calls?step=voice&call=ID Twilio: the call was answered, so greet the parent
//   POST /api/calls?step=turn&call=ID  Twilio: what the parent said, answered by the agent
//   POST /api/calls?step=status&call=ID Twilio: the call ended
//   GET  /api/calls                    Vercel Cron: daily automatic calls for institutes that turned them on
//
// Environment: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VOICE_FROM (a Twilio number that can make calls),
// OPENAI_API_KEY, CRON_SECRET (Vercel sends it to the cron step), optional PUBLIC_BASE_URL (e.g. https://example.com),
// optional OPENAI_CALL_MODEL.
import crypto from 'node:crypto';
import { getDb } from './_lib/db.js';
import { readToken, bearer } from './_lib/auth.js';

export const config = { maxDuration: 60 };

// One click or one cron run never places more calls than these.
export const MAX_PER_START = 25;
const MAX_PER_INSTITUTE_RUN = 30;
// The agent ends the call after this many answers from the parent.
const MAX_TURNS = 6;
// Calls are only placed in the daytime in India.
const CALL_HOURS = { from: 9, to: 20 };

const DEFAULT_SETTINGS = { auto: false, language: 'hi', gapDays: 7, graceDays: 0 };

const newId = () => crypto.randomUUID();
const istNow = (now = new Date()) => new Date(now.getTime() + 5.5 * 3600 * 1000);
export const istToday = (now = new Date()) => istNow(now).toISOString().slice(0, 10);
export const withinCallHours = (now = new Date()) => {
  const hour = istNow(now).getUTCHours();
  return hour >= CALL_HOURS.from && hour < CALL_HOURS.to;
};
const addDays = (iso, days) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

/* ───────── phone numbers and settings ───────── */

export function callAddress(phone) {
  let digits = String(phone || '').replace(/[^\d]/g, '');
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length === 10) digits = `91${digits}`;
  return /^[1-9]\d{10,14}$/.test(digits) ? `+${digits}` : '';
}

export function cleanSettings(value = {}) {
  const int = (v, lo, hi, d) => {
    const n = Math.round(Number(v));
    return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d;
  };
  return {
    auto: value.auto === true,
    language: value.language === 'en' ? 'en' : 'hi',
    gapDays: int(value.gapDays, 1, 60, DEFAULT_SETTINGS.gapDays),
    graceDays: int(value.graceDays, 0, 60, DEFAULT_SETTINGS.graceDays),
  };
}

const voiceOf = (language) => (language === 'en'
  ? { voice: 'Google.en-IN-Standard-A', language: 'en-IN' }
  : { voice: 'Google.hi-IN-Standard-A', language: 'hi-IN' });

/* ───────── who owes what ───────── */

/** Students with a fee balance, each with { due, feeDate }. */
export function owingStudents(students, payments) {
  const paid = new Map();
  payments.forEach((p) => paid.set(p.studentId, (paid.get(p.studentId) || 0) + (Number(p.amount) || 0)));
  return students
    .map((s) => ({ ...s, due: Math.max(0, (Number(s.fee) || 0) - (paid.get(s.id) || 0)) }))
    .filter((s) => s.due > 0);
}

/**
 * The students the daily run should call: a balance, a due date passed by more than the grace days, a phone number,
 * no call in the last gapDays, and no promise to pay that has not yet fallen due.
 */
export function dueForCall(owing, calls, settings, today) {
  // The last day each parent was reached, the last day anyone tried, and the latest promised date.
  const reached = new Map();
  const tried = new Map();
  const promised = new Map();
  const later = (map, key, value) => { if (value > (map.get(key) || '')) map.set(key, value); };
  calls.forEach((c) => {
    const at = new Date(c.createdAt);
    if (Number.isNaN(at.getTime())) return;
    const day = istToday(at);
    later(tried, c.studentId, day);
    if (c.outcome !== 'not_reached') later(reached, c.studentId, day);
    if (c.outcome === 'promised' && c.promiseDate) later(promised, c.studentId, c.promiseDate);
  });
  const cutoff = addDays(today, -settings.graceDays);
  // A parent who answered is called again after gapDays; one who did not pick up, the next day.
  return owing.filter((s) => s.feeDate && s.feeDate < cutoff
    && callAddress(s.phone)
    && !(reached.get(s.id) && reached.get(s.id) > addDays(today, -settings.gapDays))
    && !(tried.get(s.id) && tried.get(s.id) >= today)
    && !(promised.get(s.id) && promised.get(s.id) >= today));
}

/* ───────── Twilio ───────── */

function twilio(env = process.env) {
  const sid = env.TWILIO_ACCOUNT_SID || '';
  const token = env.TWILIO_AUTH_TOKEN || '';
  const from = callAddress(env.TWILIO_VOICE_FROM || '') || '';
  if (!sid || !token || !from) return null;
  return { sid, token, from, auth: Buffer.from(`${sid}:${token}`).toString('base64') };
}

/** Twilio signs each webhook with the auth token: https://www.twilio.com/docs/usage/security#validating-requests */
export function twilioSignature(token, url, params = {}) {
  const data = Object.keys(params).sort().reduce((acc, key) => acc + key + params[key], url);
  return crypto.createHmac('sha1', token).update(Buffer.from(data, 'utf8')).digest('base64');
}

function signatureOk(req, params, env = process.env) {
  const token = env.TWILIO_AUTH_TOKEN;
  const given = String(req.headers['x-twilio-signature'] || '');
  if (!token || !given) return false;
  const expected = twilioSignature(token, requestUrl(req, env), params);
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function baseUrl(req, env = process.env) {
  if (env.PUBLIC_BASE_URL) return env.PUBLIC_BASE_URL.replace(/\/+$/, '');
  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  return `${proto}://${req.headers['x-forwarded-host'] || req.headers.host}`;
}
const requestUrl = (req, env) => `${baseUrl(req, env)}${req.url}`;
const stepUrl = (base, step, callId) => `${base}/api/calls?step=${step}&call=${encodeURIComponent(callId)}`;

async function placeCall(tw, to, base, callId) {
  const params = new URLSearchParams({
    To: to,
    From: tw.from,
    Url: stepUrl(base, 'voice', callId),
    StatusCallback: stepUrl(base, 'status', callId),
    StatusCallbackMethod: 'POST',
    Timeout: '30',
  });
  params.append('StatusCallbackEvent', 'completed');
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${tw.sid}/Calls.json`, {
    method: 'POST',
    headers: { Authorization: `Basic ${tw.auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(explainCallError(data));
  return data.sid;
}

export function explainCallError(data = {}) {
  const text = String(data.message || '');
  if (data.code === 21219 || /unverified/i.test(text)) return 'This number is not verified on the Twilio trial account.';
  if (data.code === 21215 || /geo permission/i.test(text)) return 'Calls to India are turned off in Twilio. Turn on India under Voice → Settings → Geo permissions.';
  if (data.code === 21210 || /caller id/i.test(text)) return 'TWILIO_VOICE_FROM is not a Twilio number on this account.';
  return text || 'Twilio could not place the call.';
}

/* ───────── TwiML ───────── */

const xml = (value) => String(value || '').replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));

export function sayXml(text, language) {
  const v = voiceOf(language);
  return `<Say voice="${v.voice}" language="${v.language}">${xml(text)}</Say>`;
}

/** Speak, then listen for the parent's answer and send it to the next step. */
export function gatherXml(text, language, action, noInputLine) {
  const v = voiceOf(language);
  return '<?xml version="1.0" encoding="UTF-8"?><Response>'
    + `<Gather input="speech" language="${v.language}" speechTimeout="auto" timeout="6" action="${xml(action)}" method="POST">${sayXml(text, language)}</Gather>`
    + `${sayXml(noInputLine, language)}<Hangup/></Response>`;
}

export const hangupXml = (text, language) => `<?xml version="1.0" encoding="UTF-8"?><Response>${text ? sayXml(text, language) : ''}<Hangup/></Response>`;

const money = (n) => Number(n || 0).toLocaleString('en-IN');

export function greeting(call) {
  if (call.language === 'en') {
    return `Hello, this is the fee assistant calling from ${call.institute}. This call is about ${call.studentName}'s fees. `
      + `A fee of ${money(call.due)} rupees is pending${call.feeDate ? `, which was due on ${spokenDate(call.feeDate, 'en')}` : ''}. `
      + 'When will you be able to pay it?';
  }
  return `नमस्ते, मैं ${call.institute} से फीस सहायक बोल रही हूँ। यह कॉल ${call.studentName} की फीस के बारे में है। `
    + `${money(call.due)} रुपये फीस बाकी है${call.feeDate ? `, जो ${spokenDate(call.feeDate, 'hi')} तक जमा होनी थी` : ''}। `
    + 'आप फीस कब तक जमा कर पाएँगे?';
}

const LINES = {
  en: { noInput: "We could not hear you. We will call again later. Thank you.", sorry: 'Sorry, I did not catch that. Could you please say it again?', bye: 'Thank you for your time. Goodbye.' },
  hi: { noInput: 'आपकी आवाज़ नहीं आ रही है। हम बाद में फिर कॉल करेंगे। धन्यवाद।', sorry: 'माफ़ कीजिए, मैं ठीक से सुन नहीं पाई। क्या आप फिर से बता सकते हैं?', bye: 'आपके समय के लिए धन्यवाद। नमस्ते।' },
};
const lines = (language) => LINES[language === 'en' ? 'en' : 'hi'];

function spokenDate(iso, language) {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(language === 'en' ? 'en-IN' : 'hi-IN', { day: 'numeric', month: 'long', timeZone: 'UTC' });
}

/* ───────── the agent ───────── */

const AGENT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    reply: { type: 'string', description: 'what to say next, one or two short spoken sentences' },
    end_call: { type: 'boolean', description: 'true when the conversation is complete and the reply is the goodbye' },
    outcome: { type: 'string', enum: ['promised', 'paid_already', 'callback', 'dispute', 'refused', 'wrong_number', 'unclear'] },
    promise_date: { type: 'string', description: 'YYYY-MM-DD the parent promised to pay by, or empty' },
    summary: { type: 'string', description: 'one English sentence for the institute about what the parent said' },
  },
  required: ['reply', 'end_call', 'outcome', 'promise_date', 'summary'],
};

export function agentInstructions(call, today) {
  const hindi = call.language !== 'en';
  return [
    `You are a polite fee-reminder phone assistant for "${call.institute}", a coaching institute in India.`,
    `You are on a phone call with the parent of ${call.studentName}${call.className ? ` (${call.className})` : ''}.`,
    `Pending fee: ${call.due} rupees${call.feeDate ? `, due on ${call.feeDate}` : ''}. Today is ${today}.`,
    'Your only goals: remind them of the pending fee and get a date by which they will pay.',
    hindi
      ? 'Speak in simple, warm Hindi written in Devanagari script (Hinglish words are fine if the parent uses them). Write numbers as digits.'
      : 'Speak in simple, warm Indian English.',
    'Rules: keep every reply under 30 words; it is read aloud by a voice. Never threaten, shame or pressure. Never invent amounts, '
      + 'discounts, penalties, bank details or payment links. Payment is made at the institute front desk. If they say they already paid, '
      + 'thank them and say the front desk will check it. If they dispute the amount, want to talk to a person or ask anything else, '
      + 'say the institute will call them back. If it is a wrong number, apologise and end. Turn relative dates like "next Monday" '
      + 'into promise_date. Once you have a date or a clear answer, confirm it briefly, thank them and set end_call to true.',
  ].join('\n');
}

async function askAgent(call, today, env = process.env) {
  const key = env.OPENAI_API_KEY || env.VITE_OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY is missing.');
  const input = call.transcript.map((t) => ({ role: t.who === 'agent' ? 'assistant' : 'user', content: t.text }));
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: env.OPENAI_CALL_MODEL || 'gpt-6-luna',
      store: false,
      max_output_tokens: 400,
      instructions: agentInstructions(call, today),
      input,
      text: { format: { type: 'json_schema', name: 'call_turn', strict: true, schema: AGENT_SCHEMA } },
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || `OpenAI ${response.status}`);
  const text = data.output_text || (data.output || []).flatMap((i) => i.content || []).map((c) => c.text || '').join('');
  const turn = JSON.parse(text);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(turn.promise_date || '')) turn.promise_date = '';
  return turn;
}

/* ───────── webhooks from Twilio ───────── */

async function twilioStep(req, res, step, callId, params, db, env = process.env) {
  const calls = db.collection('feeCalls');
  const call = await calls.findOne({ _id: callId });
  const twiml = (body) => { res.setHeader('Content-Type', 'text/xml'); res.status(200).send(body); };
  if (!call) { twiml(hangupXml('', 'en')); return; }
  const { language } = call;
  const turnUrl = stepUrl(baseUrl(req, env), 'turn', callId);

  if (step === 'voice') {
    const text = greeting(call);
    await calls.updateOne({ _id: callId }, { $set: { status: 'in-progress', answeredAt: new Date() }, $push: { transcript: { who: 'agent', text, at: new Date() } } });
    twiml(gatherXml(text, language, turnUrl, lines(language).noInput));
    return;
  }

  if (step === 'turn') {
    const heard = String(params.SpeechResult || '').trim().slice(0, 500);
    if (!heard) { twiml(gatherXml(lines(language).sorry, language, turnUrl, lines(language).noInput)); return; }
    const transcript = [...(call.transcript || []), { who: 'parent', text: heard, at: new Date() }];
    let turn;
    try {
      turn = await askAgent({ ...call, transcript }, istToday(), env);
    } catch (err) {
      console.error('[api/calls] agent', err.message);
      turn = { reply: lines(language).bye, end_call: true, outcome: call.outcome || 'unclear', promise_date: call.promiseDate || '', summary: call.summary || 'The assistant could not continue the call.' };
    }
    const parentTurns = transcript.filter((t) => t.who === 'parent').length;
    const end = turn.end_call || parentTurns >= MAX_TURNS;
    const reply = String(turn.reply || lines(language).bye).slice(0, 400);
    await calls.updateOne({ _id: callId }, {
      $push: { transcript: { $each: [{ who: 'parent', text: heard, at: new Date() }, { who: 'agent', text: reply, at: new Date() }] } },
      $set: { outcome: turn.outcome, promiseDate: turn.promise_date, summary: String(turn.summary || '').slice(0, 300) },
    });
    twiml(end ? hangupXml(reply, language) : gatherXml(reply, language, turnUrl, lines(language).noInput));
    return;
  }

  if (step === 'status') {
    const status = String(params.CallStatus || '');
    const set = { status, endedAt: new Date(), duration: Number(params.CallDuration) || 0 };
    // Unanswered calls get an outcome too, so the log reads at a glance.
    if (['no-answer', 'busy', 'failed', 'canceled'].includes(status)) set.outcome = 'not_reached';
    await calls.updateOne({ _id: callId }, { $set: set });
    res.status(204).end();
    return;
  }
  res.status(400).end();
}

/* ───────── placing calls ───────── */

async function instituteInfo(db, instituteId) {
  const inst = await db.collection('institutes').findOne({ _id: instituteId });
  let name = inst?.profile?.name || inst?.school || '';
  if (!name && instituteId.startsWith('admin-')) {
    const admin = await db.collection('admins').findOne({ _id: instituteId.slice(6) });
    name = admin?.institute || '';
  }
  return { name: name || 'your institute', settings: cleanSettings({ ...DEFAULT_SETTINGS, ...(inst?.calls || {}) }) };
}

async function callStudents(db, instituteId, students, info, base, by, env = process.env) {
  const tw = twilio(env);
  if (!tw) throw new HttpError(503, 'Calling is not set up yet. Add TWILIO_VOICE_FROM with a Twilio voice number.');
  const placed = [];
  const failed = [];
  for (const s of students) {
    const to = callAddress(s.phone);
    if (!to) { failed.push({ name: s.name, error: 'No valid parent number.' }); continue; }
    const id = newId();
    const call = {
      _id: id, id, instituteId, studentId: s.id, studentName: s.name, className: s.className || '',
      due: s.due, feeDate: s.feeDate || '', institute: info.name, language: info.settings.language,
      by, status: 'queued', outcome: '', promiseDate: '', summary: '', transcript: [], createdAt: new Date(),
    };
    await db.collection('feeCalls').insertOne(call);
    try {
      const sid = await placeCall(tw, to, base, id);
      await db.collection('feeCalls').updateOne({ _id: id }, { $set: { twilioSid: sid } });
      placed.push(s.name);
    } catch (err) {
      await db.collection('feeCalls').updateOne({ _id: id }, { $set: { status: 'failed', outcome: 'not_reached', summary: err.message } });
      failed.push({ name: s.name, error: err.message });
    }
  }
  return { placed, failed };
}

async function owingIn(db, instituteId) {
  const [students, payments] = await Promise.all([
    db.collection('students').find({ instituteId }).toArray(),
    db.collection('payments').find({ instituteId }).toArray(),
  ]);
  return owingStudents(students, payments);
}

/** The daily run: every institute that turned automatic calls on. */
export async function runCron(db, base, env = process.env, now = new Date()) {
  if (!withinCallHours(now)) return { skipped: 'outside call hours' };
  const today = istToday(now);
  const institutes = await db.collection('institutes').find({ 'calls.auto': true }).toArray();
  const report = [];
  for (const inst of institutes) {
    const info = await instituteInfo(db, inst._id);
    const owing = await owingIn(db, inst._id);
    const past = await db.collection('feeCalls').find({ instituteId: inst._id, studentId: { $in: owing.map((s) => s.id) } }).toArray();
    const list = dueForCall(owing, past, info.settings, today).slice(0, MAX_PER_INSTITUTE_RUN);
    if (!list.length) continue;
    try {
      const result = await callStudents(db, inst._id, list, info, base, 'auto', env);
      report.push({ institute: inst._id, placed: result.placed.length, failed: result.failed.length });
    } catch (err) {
      report.push({ institute: inst._id, error: err.message });
    }
  }
  return { ok: true, report };
}

/* ───────── the app's requests ───────── */

async function staffSession(db, req) {
  const token = readToken(bearer(req));
  if (!token) throw new HttpError(401, 'Please sign in again.');
  if (token.role === 'admin') {
    const admin = await db.collection('admins').findOne({ _id: token.adminId });
    if (!admin?.active) throw new HttpError(401, 'This admin account is turned off.');
    return { role: 'admin', instituteId: `admin-${admin._id}`, name: admin.name || 'Admin' };
  }
  if (token.role === 'receptionist') {
    const r = await db.collection('receptionists').findOne({ _id: `${token.instituteId}:${token.receptionistId}` });
    if (!r || r.active === false) throw new HttpError(401, 'This reception account was removed or turned off.');
    return { role: 'receptionist', instituteId: r.instituteId, name: r.name || 'Front desk' };
  }
  throw new HttpError(403, 'Fee calls are for the admin and the front desk.');
}

// What the app shows for a call: never the phone number.
const publicCall = ({ _id, instituteId, twilioSid, ...rest }) => rest;

export async function appAction(db, req, body, env = process.env) {
  const session = await staffSession(db, req);
  const { instituteId } = session;
  const info = await instituteInfo(db, instituteId);

  if (body.action === 'list') {
    const calls = await db.collection('feeCalls').find({ instituteId }).sort({ createdAt: -1 }).limit(100).toArray();
    const owing = await owingIn(db, instituteId);
    const due = dueForCall(owing, calls, info.settings, istToday()).map((s) => s.id);
    return {
      settings: info.settings,
      ready: !!twilio(env),
      callHours: withinCallHours(),
      calls: calls.map(publicCall),
      dueToday: due,
    };
  }

  if (body.action === 'settings') {
    if (session.role !== 'admin') throw new HttpError(403, 'Only the admin can change call settings.');
    const settings = cleanSettings({ ...info.settings, ...(body.settings || {}) });
    await db.collection('institutes').updateOne({ _id: instituteId }, { $set: { calls: settings } }, { upsert: true });
    return { settings };
  }

  if (body.action === 'start') {
    if (!withinCallHours()) throw new HttpError(400, `Calls are placed only between ${CALL_HOURS.from} AM and ${CALL_HOURS.to - 12} PM.`);
    const ids = [...new Set((Array.isArray(body.studentIds) ? body.studentIds : []).map(String))].slice(0, MAX_PER_START);
    if (!ids.length) throw new HttpError(400, 'Choose at least one student.');
    const owing = (await owingIn(db, instituteId)).filter((s) => ids.includes(s.id));
    if (!owing.length) throw new HttpError(400, 'None of these students has a pending fee.');
    return callStudents(db, instituteId, owing, info, baseUrl(req, env), session.name, env);
  }
  throw new HttpError(400, 'Unknown action.');
}

function formParams(req) {
  const body = req.body;
  if (body && typeof body === 'object') return Object.fromEntries(Object.entries(body).map(([k, v]) => [k, String(v)]));
  return Object.fromEntries(new URLSearchParams(String(body || '')));
}

// `database` is only passed by tests.
export default async function handler(req, res, database) {
  const db = () => (database ? Promise.resolve(database) : getDb());
  const url = new URL(req.url, 'http://local');
  const step = url.searchParams.get('step') || '';
  try {
    // Vercel Cron calls GET /api/calls.
    if (step === 'cron' || (req.method === 'GET' && !step)) {
      if (!process.env.CRON_SECRET || req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
        res.status(401).json({ error: 'Not allowed.' });
        return;
      }
      res.status(200).json(await runCron(await db(), baseUrl(req)));
      return;
    }
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }
    if (step) {
      const params = formParams(req);
      if (!signatureOk(req, params)) { res.status(403).send('Invalid signature'); return; }
      await twilioStep(req, res, step, url.searchParams.get('call') || '', params, await db());
      return;
    }
    let body = req.body || {};
    if (typeof body === 'string') body = JSON.parse(body || '{}');
    res.status(200).json(await appAction(await db(), req, body));
  } catch (err) {
    const status = err.status || 500;
    if (status === 500) console.error('[api/calls]', err);
    res.status(status).json({ error: status === 500 ? 'Something went wrong with fee calls.' : err.message });
  }
}
