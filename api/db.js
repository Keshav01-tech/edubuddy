// One endpoint for the app's MongoDB data: POST /api/db { action, ... }.
//
// Roles and what each may do:
//   superadmin – list/create/update/delete institute admin accounts
//   admin      – read and write everything in their own institute
//   teacher    – read their own batches' students, attendance, fees and leads; write those only
//   receptionist – read the institute's students, batches, fees and leads; add students, record fees
//                  (including fees read from a photographed receipt) and manage inquiries
//
// Environment: MONGODB_URI (required), MONGODB_DB (default "edubuddy"), AUTH_SECRET (required in production),
// optional SUPER_ADMIN_LOGIN and SUPER_ADMIN_PASSWORD_SHA256 to override the built-in super admin,
// OPENAI_API_KEY for reading receipt photos (OPENAI_RECEIPT_MODEL picks the model).
import { getDb, isConfigured } from './_lib/db.js';
import { hashPassword, verifyPassword, sha256, signToken, readToken, bearer } from './_lib/auth.js';
import { SUPER_ADMIN } from '../src/services/admins.js';
import { teachesBatch, teachesStudent } from '../src/services/batchRules.js';

const clean = (value) => String(value || '').trim().toLowerCase();
const today = () => new Date().toISOString().slice(0, 10);
const newId = () => (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

// Documents are stored as { _id: "<institute>:<id>", id, instituteId, ...fields }.
const docId = (instituteId, id) => `${instituteId}:${id}`;
const strip = ({ _id, instituteId: _inst, passwordHash: _hash, password: _pw, ...rest }) => rest;
const SYNCED = ['classes', 'teachers', 'receptionists', 'students', 'payments', 'leads', 'attendance'];
// Collections whose records carry a sign-in password (stored only as a hash).
const WITH_PASSWORD = ['teachers', 'receptionists'];

/* ───────── users ───────── */

function superUser() {
  return { id: 'super-admin', email: superLogin(), role: 'superadmin', user_metadata: { full_name: SUPER_ADMIN.name, role: 'superadmin' } };
}
const superLogin = () => clean(process.env.SUPER_ADMIN_LOGIN || SUPER_ADMIN.loginId);
const superHash = () => process.env.SUPER_ADMIN_PASSWORD_SHA256 || SUPER_ADMIN.passwordSha256;

function adminUser(admin) {
  return {
    id: `admin-${admin.id}`, adminId: admin.id, email: admin.loginId, role: 'admin',
    user_metadata: { full_name: admin.name || admin.institute || admin.loginId, role: 'admin' },
  };
}

function teacherUser(teacher) {
  return {
    id: `teacher-${teacher.id}`, email: teacher.email, role: 'teacher', teacherId: teacher.id, instituteId: teacher.instituteId,
    user_metadata: { full_name: teacher.name, role: 'teacher' },
  };
}

function receptionistUser(r) {
  return {
    id: `reception-${r.id}`, email: r.email, role: 'receptionist', receptionistId: r.id, instituteId: r.instituteId,
    user_metadata: { full_name: r.name, role: 'receptionist' },
  };
}

/** The signed-in user from the request, re-checked against the database. */
async function sessionOf(req, db) {
  const token = readToken(bearer(req));
  if (!token) throw new HttpError(401, 'Please sign in again.');
  if (token.role === 'superadmin') return { role: 'superadmin', user: superUser() };
  if (token.role === 'admin') {
    const admin = await db.collection('admins').findOne({ _id: token.adminId });
    if (!admin || !admin.active) throw new HttpError(401, 'This admin account is turned off.');
    return { role: 'admin', instituteId: `admin-${admin._id}`, user: adminUser({ ...admin, id: admin._id }) };
  }
  if (token.role === 'teacher') {
    const teacher = await db.collection('teachers').findOne({ _id: docId(token.instituteId, token.teacherId) });
    if (!teacher) throw new HttpError(401, 'This teacher account was removed.');
    return { role: 'teacher', instituteId: teacher.instituteId, teacher, user: teacherUser(teacher) };
  }
  if (token.role === 'receptionist') {
    const r = await db.collection('receptionists').findOne({ _id: docId(token.instituteId, token.receptionistId) });
    if (!r || r.active === false) throw new HttpError(401, 'This reception account was removed or turned off.');
    return { role: 'receptionist', instituteId: r.instituteId, receptionist: r, user: receptionistUser(r) };
  }
  throw new HttpError(401, 'Please sign in again.');
}

/* ───────── sign in ───────── */

// Ten wrong passwords for one login ID within 15 minutes lock that ID for the rest of the window.
const LOCK_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 10;
async function throttled(db, key) {
  const row = await db.collection('loginAttempts').findOne({ _id: key });
  return !!row && row.count >= MAX_FAILURES && Date.now() - row.first.getTime() < LOCK_WINDOW_MS;
}
async function recordFailure(db, key) {
  const now = new Date();
  const col = db.collection('loginAttempts');
  const row = await col.findOne({ _id: key });
  if (!row || now - row.first >= LOCK_WINDOW_MS) await col.updateOne({ _id: key }, { $set: { first: now, count: 1 } }, { upsert: true });
  else await col.updateOne({ _id: key }, { $inc: { count: 1 } });
}

async function login(db, body) {
  const { role, password } = body;
  const id = clean(body.loginId);
  const key = `${role}:${id}`;
  if (await throttled(db, key)) throw new HttpError(429, 'Too many wrong passwords. Wait 15 minutes and try again.');
  try {
    const result = await checkLogin(db, role, id, String(password || ''));
    await db.collection('loginAttempts').deleteOne({ _id: key });
    return result;
  } catch (err) {
    if (err.status === 401) await recordFailure(db, key);
    throw err;
  }
}

async function checkLogin(db, role, id, password) {
  if (role === 'superadmin') {
    if (id !== superLogin() || sha256(password) !== superHash()) throw new HttpError(401, 'Wrong super admin ID or password.');
    return { token: signToken({ role: 'superadmin' }), user: superUser() };
  }
  if (role === 'teacher') {
    const matches = await db.collection('teachers').find({ email: id }).toArray();
    if (!matches.length) throw new HttpError(401, 'No teacher found with this email. Ask your institute admin to add you.');
    const teacher = matches.find((t) => verifyPassword(password, t.passwordHash));
    if (!teacher) throw new HttpError(401, 'Wrong password for this teacher.');
    return { token: signToken({ role: 'teacher', teacherId: teacher.id, instituteId: teacher.instituteId }), user: teacherUser(teacher) };
  }
  if (role === 'receptionist') {
    const matches = await db.collection('receptionists').find({ email: id }).toArray();
    if (!matches.length) throw new HttpError(401, 'No reception account with this login. Ask your institute admin to add you.');
    const r = matches.find((x) => verifyPassword(password, x.passwordHash));
    if (!r) throw new HttpError(401, 'Wrong password.');
    if (r.active === false) throw new HttpError(401, 'This account is turned off. Contact your institute admin.');
    return { token: signToken({ role: 'receptionist', receptionistId: r.id, instituteId: r.instituteId }), user: receptionistUser(r) };
  }
  const admin = await db.collection('admins').findOne({ loginId: id });
  if (!admin) throw new HttpError(401, 'No admin account with this ID. Ask the super admin to create one.');
  if (!verifyPassword(password, admin.passwordHash)) throw new HttpError(401, 'Wrong password.');
  if (!admin.active) throw new HttpError(401, 'This account is turned off. Contact the super admin.');
  return { token: signToken({ role: 'admin', adminId: admin._id }), user: adminUser({ ...admin, id: admin._id }) };
}

/* ───────── super admin: admin accounts ───────── */

const publicAdmin = (a) => ({ id: a._id, name: a.name, institute: a.institute, loginId: a.loginId, active: a.active, createdAt: a.createdAt });

async function createAdmin(db, { name, institute, loginId, password }) {
  const id = clean(loginId);
  if (!id) throw new HttpError(400, 'Enter a login ID.');
  if (String(password || '').length < 6) throw new HttpError(400, 'Password must be at least 6 characters.');
  if (id === superLogin()) throw new HttpError(400, 'This login ID is reserved.');
  if (await db.collection('admins').findOne({ loginId: id })) throw new HttpError(400, 'An admin with this login ID already exists.');
  const admin = {
    _id: newId(), name: String(name || '').trim(), institute: String(institute || '').trim(), loginId: id,
    passwordHash: hashPassword(password), active: true, createdAt: today(),
  };
  try {
    await db.collection('admins').insertOne(admin);
  } catch (err) {
    if (err?.code === 11000) throw new HttpError(400, 'An admin with this login ID already exists.');
    throw err;
  }
  return admin;
}

async function adminsAction(db, action, body) {
  const admins = db.collection('admins');
  if (action === 'admins.list') {
    return { admins: (await admins.find().sort({ createdAt: 1 }).toArray()).map(publicAdmin) };
  }
  if (action === 'admins.create') {
    const admin = await createAdmin(db, body);
    return { admin: { ...publicAdmin(admin), password: body.password } };
  }
  if (action === 'admins.update') {
    const set = {};
    if (typeof body.active === 'boolean') set.active = body.active;
    if (body.password) {
      if (String(body.password).length < 6) throw new HttpError(400, 'Password must be at least 6 characters.');
      set.passwordHash = hashPassword(body.password);
    }
    await admins.updateOne({ _id: body.id }, { $set: set });
    return { ok: true };
  }
  if (action === 'admins.delete') {
    await admins.deleteOne({ _id: body.id });
    return { ok: true };
  }
  throw new HttpError(400, 'Unknown action.');
}

/* ───────── institute data ───────── */

const parseKey = (key) => {
  const [className, section = ''] = String(key || '').split('||');
  return { className, section };
};

/** Everything a signed-in admin or teacher may see, shaped the way the app keeps it. */
async function load(db, session) {
  const { instituteId } = session;
  const by = (name) => db.collection(name).find({ instituteId }).toArray();
  const [inst, classes, teachers, receptionists, students, payments, leads, attendance] = await Promise.all([
    db.collection('institutes').findOne({ _id: instituteId }),
    by('classes'), by('teachers'), by('receptionists'), by('students'), by('payments'), by('leads'), by('attendance'),
  ]);

  let visibleStudents = students;
  let visibleTeachers = teachers;
  let visiblePayments = payments;
  let visibleLeads = leads;
  let visibleAttendance = attendance;
  let visibleReceptionists = session.role === 'admin' ? receptionists : [];
  if (session.role === 'receptionist') {
    // The front desk sees who teaches what (names and batches only), not teacher logins.
    visibleTeachers = teachers.map(({ id, name, subject, phone, assignments }) => ({ id, name, subject, phone, assignments }));
    visibleReceptionists = receptionists.filter((r) => r.id === session.receptionist.id);
  }
  if (session.role === 'teacher') {
    const me = session.teacher;
    visibleStudents = students.filter((s) => teachesStudent(me, s));
    const ids = new Set(visibleStudents.map((s) => s.id));
    const classNames = new Set((me.assignments || []).map((a) => a.className));
    visibleTeachers = teachers.filter((t) => t.id === me.id);
    visiblePayments = payments.filter((p) => ids.has(p.studentId));
    visibleLeads = leads.filter((l) => classNames.has(l.className));
    visibleAttendance = attendance
      .filter((a) => a.batchKey === 'day' || teachesBatch(me, parseKey(a.batchKey).className, parseKey(a.batchKey).section))
      .map((a) => ({ ...a, marks: Object.fromEntries(Object.entries(a.marks || {}).filter(([id]) => ids.has(id))) }));
  }

  const dayMarks = {};
  const batchMarks = {};
  visibleAttendance.forEach((a) => {
    if (a.batchKey === 'day') dayMarks[a.date] = a.marks || {};
    else (batchMarks[a.date] ||= {})[a.batchKey] = a.marks || {};
  });

  return {
    empty: !inst && !classes.length && !students.length && !teachers.length,
    institute: inst?.profile || null,
    school: inst?.school || inst?.profile?.name || '',
    nextReceipt: inst?.nextReceipt || 1,
    classes: classes.map(strip),
    teachers: visibleTeachers.map((t) => (session.role === 'receptionist' ? strip(t) : { ...strip(t), hasPassword: !!t.passwordHash })),
    receptionists: visibleReceptionists.map((r) => ({ ...strip(r), hasPassword: !!r.passwordHash })),
    students: visibleStudents.map(strip),
    payments: visiblePayments.map(strip),
    leads: visibleLeads.map(strip),
    attendance: dayMarks,
    batchAttendance: batchMarks,
  };
}

/** Throws unless the front desk may write this document. */
function checkReceptionWrite(collection, deleting = false) {
  if (!['students', 'payments', 'leads'].includes(collection)) throw new HttpError(403, 'Only the institute admin can change this.');
  if (deleting && collection !== 'leads') throw new HttpError(403, 'Only the institute admin can delete students or payments.');
}

/** Throws unless the teacher may write this document. */
async function checkTeacherWrite(db, session, collection, doc, existing) {
  const me = session.teacher;
  const studentOf = async (id) => db.collection('students').findOne({ _id: docId(session.instituteId, id) });
  if (collection === 'students') {
    if (!teachesStudent(me, doc) || (existing && !teachesStudent(me, existing))) throw new HttpError(403, 'You can only change students in your own batches.');
    return;
  }
  if (collection === 'payments') {
    const student = await studentOf(doc.studentId || existing?.studentId);
    if (!student || !teachesStudent(me, student)) throw new HttpError(403, 'You can only record fees for your own students.');
    return;
  }
  if (collection === 'attendance') {
    const key = doc.batchKey || existing?.batchKey;
    const { className, section } = parseKey(key);
    if (key === 'day' || !teachesBatch(me, className, section)) throw new HttpError(403, 'You can only mark your own batches.');
    return;
  }
  if (collection === 'leads') {
    const classNames = new Set((me.assignments || []).map((a) => a.className));
    if (!classNames.has(doc.className || existing?.className)) throw new HttpError(403, 'You can only manage inquiries for your classes.');
    return;
  }
  throw new HttpError(403, 'Only the institute admin can change this.');
}

/**
 * Saves changes from the app: { changes: [{ collection, upserts: [doc], deletes: [id] }], institute?: {...} }.
 * Each document is written whole; teacher passwords are hashed and never stored as text.
 */
async function sync(db, session, body) {
  const { instituteId } = session;
  const teacher = session.role === 'teacher';
  const reception = session.role === 'receptionist';
  let written = 0;

  if (body.institute) {
    if (teacher || reception) {
      // Teachers may only move the receipt counter forward when they record a payment.
      const next = Number(body.institute.nextReceipt);
      if (Number.isFinite(next)) {
        await db.collection('institutes').updateOne({ _id: instituteId }, { $max: { nextReceipt: next } }, { upsert: true });
      }
    } else {
      const { institute: profile, school, nextReceipt } = body.institute;
      const set = { updatedAt: new Date() };
      if (profile !== undefined) set.profile = profile;
      if (school !== undefined) set.school = school;
      if (nextReceipt !== undefined) set.nextReceipt = Number(nextReceipt) || 1;
      await db.collection('institutes').updateOne({ _id: instituteId }, { $set: set }, { upsert: true });
    }
  }

  for (const change of Array.isArray(body.changes) ? body.changes : []) {
    const name = change?.collection;
    if (!SYNCED.includes(name)) throw new HttpError(400, `Unknown collection ${name}.`);
    const col = db.collection(name);
    const ops = [];

    for (const raw of (change.upserts || []).slice(0, 2000)) {
      if (!raw || typeof raw !== 'object' || !raw.id) continue;
      const { password, hasPassword: _has, _id, instituteId: _ignored, passwordHash: _hash, ...doc } = raw;
      const _key = docId(instituteId, doc.id);
      if (teacher) await checkTeacherWrite(db, session, name, doc, await col.findOne({ _id: _key }));
      if (reception) checkReceptionWrite(name);
      const set = { ...doc, instituteId, updatedAt: new Date() };
      if (WITH_PASSWORD.includes(name)) {
        set.email = clean(doc.email);
        if (password) set.passwordHash = hashPassword(password);
      }
      ops.push({ updateOne: { filter: { _id: _key }, update: { $set: set }, upsert: true } });
    }
    for (const id of (change.deletes || []).slice(0, 2000)) {
      const _key = docId(instituteId, id);
      if (teacher) {
        const existing = await col.findOne({ _id: _key });
        if (!existing) continue;
        await checkTeacherWrite(db, session, name, existing, existing);
      }
      if (reception) checkReceptionWrite(name, true);
      ops.push({ deleteOne: { filter: { _id: _key } } });
    }
    if (ops.length) {
      await col.bulkWrite(ops, { ordered: false });
      written += ops.length;
    }
  }
  return { ok: true, written };
}

/* ───────── test papers ───────── */

// Each admin or teacher keeps their own generated papers (settings + questions).
async function papersAction(db, session, action, body) {
  const col = db.collection('papers');
  const ownerId = session.user.id;
  const key = (id) => docId(session.instituteId, `paper:${ownerId}:${id}`);
  if (action === 'papers.list') {
    const list = await col.find({ instituteId: session.instituteId, ownerId }).sort({ created_at: -1 }).limit(300).toArray();
    return { papers: list.map(({ ownerId: _o, ...rest }) => strip(rest)) };
  }
  if (action === 'papers.save') {
    const paper = body.paper;
    if (!paper?.id) throw new HttpError(400, 'The paper has no id.');
    const { _id, instituteId: _i, ownerId: _o, ...doc } = paper;
    await col.updateOne(
      { _id: key(doc.id) },
      { $set: { ...doc, ownerId, instituteId: session.instituteId, updatedAt: new Date() } },
      { upsert: true },
    );
    return { ok: true };
  }
  if (action === 'papers.delete') {
    await col.deleteOne({ _id: key(body.id) });
    return { ok: true };
  }
  throw new HttpError(400, 'Unknown action.');
}

/* ───────── fee receipts read from a photo ───────── */

const MAX_IMAGE_CHARS = 2_500_000; // a data URL of about 1.8 MB; the app shrinks photos well below this

const RECEIPT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    isReceipt: { type: 'boolean', description: 'false when the image is not a payment receipt or slip' },
    studentName: { type: 'string', description: 'student the fee is for, or the payer name if no student is named; empty if not shown' },
    parentName: { type: 'string' },
    phone: { type: 'string', description: 'digits only, empty if not shown' },
    className: { type: 'string', description: 'class or grade as written, e.g. "Class 10"; empty if not shown' },
    amount: { type: 'number', description: 'total amount paid in rupees; 0 if not readable' },
    date: { type: 'string', description: 'payment date as YYYY-MM-DD; empty if not shown' },
    mode: { type: 'string', enum: ['UPI', 'Cash', 'Card', 'Bank transfer', 'Cheque', ''] },
    reference: { type: 'string', description: 'receipt number, UPI / transaction / cheque reference; empty if none' },
    note: { type: 'string', description: 'what the payment is for, e.g. "November fee"; empty if not shown' },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
  },
  required: ['isReceipt', 'studentName', 'parentName', 'phone', 'className', 'amount', 'date', 'mode', 'reference', 'note', 'confidence'],
};

async function readReceipt(image) {
  const key = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
  if (!key) throw new HttpError(503, 'Receipt reading is not set up on the server (OPENAI_API_KEY is missing).');
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: process.env.OPENAI_RECEIPT_MODEL || 'gpt-6-luna',
      store: false,
      max_output_tokens: 800,
      instructions: 'You read fee receipts and payment slips for an Indian coaching institute: printed or handwritten receipts, '
        + 'UPI / bank app screenshots and cheque slips. Copy only what is written on it. Never guess a value that is not visible: leave it empty or 0.',
      input: [{
        role: 'user',
        content: [
          { type: 'input_text', text: 'Read this payment receipt.' },
          { type: 'input_image', image_url: image, detail: 'high' },
        ],
      }],
      text: { format: { type: 'json_schema', name: 'fee_receipt', strict: true, schema: RECEIPT_SCHEMA } },
    }),
  }).catch(() => { throw new HttpError(502, 'Could not reach the receipt reader. Try again.'); });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error('[api/db] receipt reader', response.status, data?.error?.message);
    throw new HttpError(502, 'The receipt reader could not read this photo. Try again or enter the details by hand.');
  }
  const text = data.output_text
    || (data.output || []).flatMap((item) => item.content || []).map((c) => c.text || '').join('');
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(502, 'The receipt reader gave an unclear answer. Try a sharper photo or enter the details by hand.');
  }
}

// The front desk and the admin read receipt photos and keep the photo with the payment it records.
async function receiptsAction(db, session, action, body) {
  if (!['admin', 'receptionist'].includes(session.role)) throw new HttpError(403, 'Only the admin and the front desk handle receipts.');
  const col = db.collection('receipts');
  const image = String(body.image || '');
  if (action === 'receipts.read') {
    if (!/^data:image\/(png|jpe?g|webp);base64,/.test(image) || image.length > MAX_IMAGE_CHARS) {
      throw new HttpError(400, 'Send a JPG, PNG or WebP photo under 1.8 MB.');
    }
    return { fields: await readReceipt(image) };
  }
  if (action === 'receipts.save') {
    const r = body.receipt || {};
    if (!r.id || !r.paymentId || !r.studentId) throw new HttpError(400, 'The receipt needs a payment and a student.');
    const photo = String(r.image || '');
    if (!/^data:image\/(png|jpe?g|webp);base64,/.test(photo) || photo.length > MAX_IMAGE_CHARS) throw new HttpError(400, 'The receipt photo is missing or too large.');
    const student = await db.collection('students').findOne({ _id: docId(session.instituteId, r.studentId) });
    if (!student) throw new HttpError(400, 'This student is not in the database.');
    // The confirmed payment is written together with its photo, so the fee is updated even if the app's own save is still on its way.
    const p = body.payment;
    if (p) {
      const amount = Number(p.amount);
      if (p.id !== r.paymentId || p.studentId !== r.studentId || !(amount > 0)) throw new HttpError(400, 'The payment does not match this receipt.');
      const { _id, instituteId: _i, ...doc } = p;
      await db.collection('payments').updateOne(
        { _id: docId(session.instituteId, p.id) },
        { $set: { ...doc, amount, instituteId: session.instituteId, updatedAt: new Date() } },
        { upsert: true },
      );
    } else {
      const payment = await db.collection('payments').findOne({ _id: docId(session.instituteId, r.paymentId) });
      if (!payment || payment.studentId !== r.studentId) throw new HttpError(400, 'Save the payment before its receipt photo.');
    }
    await col.updateOne(
      { _id: docId(session.instituteId, r.id) },
      { $set: {
        id: r.id, instituteId: session.instituteId, paymentId: r.paymentId, studentId: r.studentId, image: photo,
        read: r.read || null, savedBy: session.user.id, savedAt: new Date(),
      } },
      { upsert: true },
    );
    return { ok: true };
  }
  if (action === 'receipts.get') {
    const doc = await col.findOne({ _id: docId(session.instituteId, String(body.id || '')) });
    if (!doc) throw new HttpError(404, 'This receipt photo is not in the database.');
    return { receipt: strip(doc) };
  }
  throw new HttpError(400, 'Unknown action.');
}

/* ───────── handler ───────── */

export async function handle(body, req) {
  const action = body?.action;
  if (action === 'status') return { configured: isConfigured() };
  if (!isConfigured()) throw new HttpError(503, 'The database is not set up (MONGODB_URI is missing).');
  const db = await getDb();
  if (action === 'login') return login(db, body);

  const session = await sessionOf(req, db);
  if (action === 'me') return { user: session.user };
  if (action.startsWith('admins.')) {
    if (session.role !== 'superadmin') throw new HttpError(403, 'Only the super admin can manage admins.');
    return adminsAction(db, action, body);
  }
  if (session.role === 'superadmin') throw new HttpError(403, 'The super admin has no institute data.');
  if (action === 'load') return load(db, session);
  if (action.startsWith('papers.')) {
    if (session.role === 'receptionist') throw new HttpError(403, 'Test papers are for teachers and the admin.');
    return papersAction(db, session, action, body);
  }
  if (action.startsWith('receipts.')) return receiptsAction(db, session, action, body);
  if (action === 'sync') return sync(db, session, body);
  throw new HttpError(400, 'Unknown action.');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body || '{}'); } catch { res.status(400).json({ error: 'The request was not valid JSON.' }); return; }
  }
  try {
    res.status(200).json(await handle(body, req));
  } catch (err) {
    const status = err.status || 500;
    if (status === 500) console.error('[api/db]', err);
    res.status(status).json({ error: status === 500 ? 'Something went wrong with the database.' : err.message });
  }
}
