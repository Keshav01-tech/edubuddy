// Sends a fixed absence message on WhatsApp through Twilio.
// Credentials stay in server env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM.
// Optional TWILIO_CONTENT_SID uses an approved WhatsApp template (variables {{1}} name, {{2}} date).

const MAX_MESSAGES = 40;

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

export function absenceText(name, dateLabel) {
  return `${name} is not attending today (${dateLabel}).`;
}

export function explainTwilioError(message) {
  const text = String(message || '');
  if (/verified recipient|trial phone number is assigned/i.test(text)) {
    return 'This parent number is not a verified Twilio trial recipient. In Twilio, open Messaging → Try out SMS, add this phone, and enter the code Twilio sends to it. Then use the From number shown on that page.';
  }
  return text || 'Twilio could not send the message.';
}

export async function sendAbsences(list, date, env = process.env) {
  const sid = env.TWILIO_ACCOUNT_SID || '';
  const token = env.TWILIO_AUTH_TOKEN || '';
  const fromRaw = env.TWILIO_WHATSAPP_FROM || '';
  const dateLabel = cleanDate(date);
  if (!dateLabel) return { ok: false, error: 'Pick a valid date.' };
  if (!sid || !token || !fromRaw) return { ok: false, configured: false };

  const from = fromRaw.startsWith('whatsapp:')
    ? fromRaw
    : `whatsapp:+${fromRaw.replace(/[^\d]/g, '')}`;
  const auth = Buffer.from(`${sid}:${token}`).toString('base64');
  const sent = [];
  const failed = [];

  for (const item of list.slice(0, MAX_MESSAGES)) {
    const name = cleanName(item?.name);
    const to = whatsAppAddress(item?.phone);
    if (!name || !to) {
      failed.push({ name: name || 'Student', error: 'Add a valid parent WhatsApp number.' });
      continue;
    }
    const params = new URLSearchParams({ From: from, To: to });
    if (env.TWILIO_CONTENT_SID) {
      params.set('ContentSid', env.TWILIO_CONTENT_SID);
      params.set('ContentVariables', JSON.stringify({ 1: name, 2: dateLabel }));
    } else {
      params.set('Body', absenceText(name, dateLabel));
    }
    try {
      const upstream = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });
      const payload = await upstream.json().catch(() => ({}));
      if (upstream.ok) sent.push(name);
      else failed.push({ name, error: explainTwilioError(payload.message) });
    } catch {
      failed.push({ name, error: 'Could not reach Twilio.' });
    }
  }

  return { ok: true, configured: true, sent, failed };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
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
  const students = Array.isArray(body.students) ? body.students : [];
  if (!students.length) {
    res.status(400).json({ error: 'No students to notify.' });
    return;
  }
  const result = await sendAbsences(students, body.date);
  res.status(result.error ? 400 : 200).json(result);
}
