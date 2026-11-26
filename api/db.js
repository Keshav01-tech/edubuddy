// One endpoint for the app's MongoDB data: POST /api/db { action, ... }.
//
// Roles and what each may do:
//   superadmin – list/create/update/delete institute admin accounts
//   admin      – read and write everything in their own institute
//   teacher    – read their own batches' students, attendance and leads; write those only. No fees or payments.
//   receptionist – read the institute's students, batches, fees and leads; add students, record fees
//                  (including fees read from a photographed receipt) and manage inquiries
//   parent       – signs in with the student's phone number and the PIN the institute set; reads only their own
//                  children's attendance, test marks, fees and the notes shared with their batches
//
// Teachers and the admin also keep test marks (collection "tests") and share notes (collection "notes", with each
// file kept apart in "noteFiles" so lists stay small).
//
// Environment: MONGODB_URI (required), MONGODB_DB (default "edubuddy"), AUTH_SECRET (required in production),
// optional SUPER_ADMIN_LOGIN and SUPER_ADMIN_PASSWORD_SHA256 to override the built-in super admin,
// OPENAI_API_KEY for reading receipt photos (OPENAI_RECEIPT_MODEL picks the model).
import { getDb, isConfigured } from './_lib/db.js';
import { hashPassword, verifyPassword, sha256, signToken, readToken, bearer } from './_lib/auth.js';
import { SUPER_ADMIN } from '../src/services/admins.js';
import { teachesBatch, teachesStudent, studentBatches, batchFee, monthlyFee, cleanBatchFees } from '../src/services/batchRules.js';

const clean = (value) => String(value || '').trim().toLowerCase();
const today = () => new Date().toISOString().slice(0, 10);
const newId = () => (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

// Documents are stored as { _id: "<institute>:<id>", id, instituteId, ...fields }.
const docId = (instituteId, id) => `${instituteId}:${id}`;
const strip = ({ _id, instituteId: _inst, passwordHash: _hash, password: _pw, parentPinHash: _pin, parentPin: _p, ...rest }) => rest;
const SYNCED = ['classes', 'teachers', 'receptionists', 'students', 'payments', 'leads', 'attendance', 'tests'];
// The last ten digits of a phone number: how a parent's login is matched to their children.
const phoneKey = (value) => String(value || '').replace(/\D/g, '').slice(-10);
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

function parentUser(phone, instituteId, children) {
  const first = children[0]?.name || 'your child';
  return {
    id: `parent-${instituteId}-${phone}`, email: phone, role: 'parent', phone, instituteId,
    user_metadata: { full_name: children.length > 1 ? 'Parent' : `${first}’s parent`, role: 'parent' },
  };
}

// A parent's children: every student of the institute saved with this phone number.
const childrenOf = (db, instituteId, phone) =>
  db.collection('students').find({ instituteId, phoneKey: phone }).toArray();

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
  if (token.role === 'parent') {
    const children = await childrenOf(db, token.instituteId, token.phone);
    if (!children.length) throw new HttpError(401, 'This number is no longer registered with the institute.');
    return { role: 'parent', instituteId: token.instituteId, phone: token.phone, children, user: parentUser(token.phone, token.instituteId, children) };
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

/* Each user's app language ('en' or 'hi'), kept on the server so it follows them to any phone. */
const LANGUAGES = ['en', 'hi'];
async function withPrefs(db, user) {
  const pref = await db.collection('userPrefs').findOne({ _id: user.id });
  return { ...user, language: LANGUAGES.includes(pref?.language) ? pref.language : 'en' };
}

async function login(db, body) {
  const { role, password } = body;
  const id = clean(body.loginId);
  const key = `${role}:${id}`;
  if (await throttled(db, key)) throw new HttpError(429, 'Too many wrong passwords. Wait 15 minutes and try again.');
  try {
    const result = await checkLogin(db, role, id, String(password || ''));
    await db.collection('loginAttempts').deleteOne({ _id: key });
    // A language picked on the sign-in page before signing in becomes this user's choice.
    if (LANGUAGES.includes(body.language)) {
      await db.collection('userPrefs').updateOne({ _id: result.user.id }, { $set: { language: body.language } }, { upsert: true });
    }
    result.user = await withPrefs(db, result.user);
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
  if (role === 'parent') {
    const phone = phoneKey(id);
    if (phone.length !== 10) throw new HttpError(401, 'Enter the 10-digit phone number the institute has for your child.');
    const matches = await db.collection('students').find({ phoneKey: phone }).toArray();
    if (!matches.length) throw new HttpError(401, 'This number is not registered with any institute. Ask the institute to add it.');
    // A number saved at more than one institute opens the most recently joined one.
    const child = matches.sort((a, b) => String(b.joinedAt || b.createdAt || '').localeCompare(String(a.joinedAt || a.createdAt || '')))[0];
    const children = matches.filter((s) => s.instituteId === child.instituteId);
    return { token: signToken({ role: 'parent', phone, instituteId: child.instituteId }), user: parentUser(phone, child.instituteId, children) };
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
  const [inst, classes, teachers, receptionists, students, payments, leads, attendance, tests] = await Promise.all([
    db.collection('institutes').findOne({ _id: instituteId }),
    by('classes'), by('teachers'), by('receptionists'), by('students'), by('payments'), by('leads'), by('attendance'), by('tests'),
  ]);

  let visibleStudents = students;
  let visibleTeachers = teachers;
  let visiblePayments = payments;
  let visibleLeads = leads;
  let visibleAttendance = attendance;
  let visibleTests = tests;
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
    visiblePayments = [];
    // An inquiry that joined is now a student, so its phone number is hidden from teachers too.
    visibleLeads = leads
      .filter((l) => classNames.has(l.className))
      .map((l) => {
        if (l.status !== 'joined') return l;
        const { phone: _phone, ...rest } = l;
        return rest;
      });
    visibleAttendance = attendance
      .filter((a) => a.batchKey === 'day' || teachesBatch(me, parseKey(a.batchKey).className, parseKey(a.batchKey).section))
      .map((a) => ({ ...a, marks: Object.fromEntries(Object.entries(a.marks || {}).filter(([id]) => ids.has(id))) }));
    visibleTests = tests
      .filter((t) => teachesBatch(me, t.className, t.section || ''))
      .map((t) => ({ ...t, scores: Object.fromEntries(Object.entries(t.scores || {}).filter(([id]) => ids.has(id))) }));
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
    nextReceipt: session.role === 'teacher' ? 1 : inst?.nextReceipt || 1,
    classes: classes.map(strip),
    teachers: visibleTeachers.map((t) => (session.role === 'receptionist' ? strip(t) : { ...strip(t), hasPassword: !!t.passwordHash })),
    receptionists: visibleReceptionists.map((r) => ({ ...strip(r), hasPassword: !!r.passwordHash })),
    // Whether a parent PIN is set (never the PIN itself); teachers do not handle parent logins.
    // Teachers never receive a student's fee or phone number, only whether a number is saved.
    students: visibleStudents.map((s) => {
      if (session.role !== 'teacher') return { ...strip(s), hasParentPin: !!s.parentPinHash };
      const { phone, phoneKey: _phoneKey, fee: _fee, feeDate: _feeDate, batchFees, ...rest } = strip(s);
      // A teacher sees the student's own fee only for the batches they teach.
      const mine = Object.fromEntries(Object.entries(batchFees || {}).filter(([section]) => teachesBatch(session.teacher, s.className, section)));
      return { ...rest, batchFees: mine, hasPhone: !!phone };
    }),
    payments: visiblePayments.map(strip),
    leads: visibleLeads.map(strip),
    tests: visibleTests.map(strip),
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
  if (collection === 'tests') {
    if (!teachesBatch(me, doc.className, doc.section || '') || (existing && !teachesBatch(me, existing.className, existing.section || ''))) {
      throw new HttpError(403, 'You can only enter marks for your own batches.');
    }
    const scores = doc.scores && typeof doc.scores === 'object' ? doc.scores : {};
    const before = existing?.scores || {};
    const ids = [...new Set([...Object.keys(scores), ...Object.keys(before)])];
    const rows = ids.length
      ? await db.collection('students').find({ _id: { $in: ids.map((id) => docId(session.instituteId, id)) } }).toArray()
      : [];
    const byId = new Map(rows.map((s) => [s.id, s]));
    const max = Number(doc.maxMarks);
    for (const [id, value] of Object.entries(scores)) {
      if (value === before[id]) continue;
      const student = byId.get(id);
      if (!student || !teachesStudent(me, student) || !reaches(student, doc.className, doc.section || '')) {
        throw new HttpError(403, 'You can only enter marks for students in this batch.');
      }
      const mark = Number(value);
      if (!Number.isFinite(mark) || mark < 0 || !(max > 0) || mark > max) {
        throw new HttpError(400, `${student.name}'s marks must be between 0 and ${max || 'the maximum'}.`);
      }
    }
    // Marks of students this teacher cannot see (for example, moved to another batch) stay as they were.
    const hidden = Object.fromEntries(Object.entries(before).filter(([id]) => {
      const student = byId.get(id);
      return !student || !teachesStudent(me, student);
    }));
    doc.scores = { ...scores, ...hidden };
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
  // The institute's batches, read once when a teacher's save needs their fees.
  let classList = null;
  const classesNow = async () => (classList ||= await db.collection('classes').find({ instituteId }).toArray());

  if (body.institute) {
    if (teacher) {
      // Teachers do not handle fees, so they cannot change the institute or its receipt counter.
    } else if (reception) {
      // The front desk may only move the receipt counter forward when it records a payment.
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
      const {
        password, hasPassword: _has, _id, instituteId: _ignored, passwordHash: _hash,
        parentPin, hasParentPin: _hasPin, parentPinHash: _pinHash, hasPhone: _hasPhone, ...doc
      } = raw;
      const _key = docId(instituteId, doc.id);
      const existing = teacher ? await col.findOne({ _id: _key }) : null;
      if (teacher) await checkTeacherWrite(db, session, name, doc, existing);
      if (reception) checkReceptionWrite(name);
      const set = { ...doc, instituteId, updatedAt: new Date() };
      if (WITH_PASSWORD.includes(name)) {
        set.email = clean(doc.email);
        if (password) set.passwordHash = hashPassword(password);
      }
      if (name === 'students') {
        // The parent signs in with this phone number and the PIN; only the admin and the front desk set the PIN.
        // Fees are set by the admin and the front desk; a teacher's save leaves them as they are.
        if (teacher) {
          delete set.fee;
          delete set.feeDate;
          // A teacher may lower the fee of their own batches for this student (never above the batch fee);
          // amounts for other teachers' batches stay as they were. The total is worked out here.
          const classes = await classesNow();
          const className = existing?.className || doc.className;
          const before = existing?.batchFees || {};
          // A save without fee amounts leaves every amount as it was.
          const merged = doc.batchFees === undefined
            ? { ...before }
            : Object.fromEntries(Object.entries(before).filter(([section]) => !teachesBatch(session.teacher, className, section)));
          for (const [section, value] of Object.entries(doc.batchFees || {})) {
            if (!teachesBatch(session.teacher, className, section)) continue;
            const listed = batchFee(classes, className, section);
            const amount = Math.round(Number(value));
            if (!listed || !Number.isFinite(amount)) continue;
            if (amount < 0 || amount > listed) throw new HttpError(400, `The fee for batch ${section || className} must be between ₹0 and ₹${listed}.`);
            merged[section] = amount;
          }
          set.batchFees = cleanBatchFees({ ...existing, ...doc, batchFees: merged });
          const fee = monthlyFee({ ...existing, ...set }, classes);
          if (fee.priced) set.fee = fee.total;
        } else if (doc.batchFees !== undefined) {
          set.batchFees = cleanBatchFees(doc);
        }
        // A teacher can give a number when adding a student, but cannot change a saved one.
        if (teacher && existing) {
          delete set.phone;
          delete set.phoneKey;
        } else {
          set.phoneKey = phoneKey(doc.phone);
        }
        if (parentPin && !teacher) {
          if (!/^\d{6}$/.test(String(parentPin))) throw new HttpError(400, 'The parent PIN must be 6 digits.');
          if (set.phoneKey.length !== 10) throw new HttpError(400, 'Add the parent’s 10-digit phone number before setting a PIN.');
          set.parentPinHash = hashPassword(String(parentPin));
        }
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

/* ───────── parents ───────── */

// A record for a batch reaches a student when it is for their class and either the whole class or one of their batches.
const reaches = (student, className, section) =>
  student.className === className && (!section || studentBatches(student).includes(section) || !studentBatches(student).length);

/** Everything a parent may see: their own children's attendance, test marks and fees, and the notes for their batches. */
async function parentLoad(db, session) {
  const { instituteId, children } = session;
  const by = (name) => db.collection(name).find({ instituteId }).toArray();
  const [inst, classes, attendance, payments, tests, notes, quizzes, quizAttempts] = await Promise.all([
    db.collection('institutes').findOne({ _id: instituteId }),
    by('classes'), by('attendance'), by('payments'), by('tests'),
    db.collection('notes').find({ instituteId }).sort({ createdAt: -1 }).toArray(),
    db.collection('quizzes').find({ instituteId }).sort({ createdAt: -1 }).toArray(),
    db.collection('quizAttempts').find({ instituteId, studentId: { $in: children.map((c) => c.id) } }).toArray(),
  ]);
  const subjectOf = (className, section) => classes.find((c) => c.name === className)?.timings?.[section]?.subject || '';

  const kids = children.map((child) => {
    const days = [];
    attendance.forEach((a) => {
      const mark = a.marks?.[child.id];
      if (!mark) return;
      if (a.batchKey === 'day') { days.push({ date: a.date, batch: '', subject: '', mark }); return; }
      const { className, section } = parseKey(a.batchKey);
      if (className === child.className) days.push({ date: a.date, batch: section, subject: subjectOf(className, section), mark });
    });
    days.sort((x, y) => y.date.localeCompare(x.date));

    const marks = tests
      .filter((t) => reaches(child, t.className, t.section) && t.scores && t.scores[child.id] !== undefined && t.scores[child.id] !== '')
      .map((t) => {
        const all = Object.values(t.scores || {}).map(Number).filter((n) => Number.isFinite(n));
        return {
          id: t.id, title: t.title, subject: t.subject || subjectOf(t.className, t.section), date: t.date, maxMarks: Number(t.maxMarks) || 0,
          score: Number(t.scores[child.id]),
          average: all.length ? Math.round((all.reduce((s, n) => s + n, 0) / all.length) * 10) / 10 : null,
          highest: all.length ? Math.max(...all) : null,
        };
      })
      .sort((x, y) => (y.date || '').localeCompare(x.date || ''));

    return {
      id: child.id, name: child.name, className: child.className, batches: studentBatches(child),
      fee: Number(child.fee) || 0, feeDate: child.feeDate || '',
      attendance: days, tests: marks,
      // Questions only: the correct answers stay on the server until the quiz is submitted.
      quizzes: quizzes.filter((q) => reaches(child, q.className, q.section)).map((q) => {
        const attempt = quizAttempts.find((a) => a.quizId === q.id && a.studentId === child.id);
        return {
          id: q.id, title: q.title, subject: q.subject, createdByName: q.createdByName, createdAt: q.createdAt,
          questions: q.questions.map(({ question, options }) => ({ question, options })),
          attempt: attempt ? { best: attempt.best, last: attempt.last, attempts: attempt.attempts } : null,
        };
      }),
      payments: payments.filter((p) => p.studentId === child.id).map(strip).sort((x, y) => (y.date || '').localeCompare(x.date || '')),
    };
  });

  return {
    institute: { name: inst?.profile?.name || inst?.school || '', logo: inst?.profile?.logo || '', phone: inst?.profile?.phone || '' },
    children: kids,
    notes: notes
      .filter((n) => children.some((c) => reaches(c, n.className, n.section)))
      .map((n) => ({ ...strip(n), forChildren: children.filter((c) => reaches(c, n.className, n.section)).map((c) => c.id) })),
  };
}

/* ───────── notes shared by teachers ───────── */

// A file is a PDF or a photo up to about 3 MB (the request itself must stay under Vercel's 4.5 MB limit).
const NOTE_FILE = /^data:(application\/pdf|image\/(png|jpe?g|webp));base64,/;
const MAX_NOTE_CHARS = 4_200_000;

// A teacher sees and posts notes for the classes and batches they take; a note for a whole class reaches
// every teacher of that class.
const teacherSeesNote = (teacher, n) => (teacher.assignments || []).some(
  (a) => a.className === n.className && (!n.section || !a.section || a.section === n.section),
);

async function notesAction(db, session, action, body) {
  const col = db.collection('notes');
  const files = db.collection('noteFiles');
  const { instituteId, role } = session;
  const sees = (n) => role === 'admin'
    || (role === 'teacher' && teacherSeesNote(session.teacher, n))
    || (role === 'parent' && session.children.some((c) => reaches(c, n.className, n.section)));

  if (action === 'notes.list') {
    const all = await col.find({ instituteId }).sort({ createdAt: -1 }).toArray();
    return { notes: all.filter(sees).map(strip) };
  }

  if (action === 'notes.file') {
    const note = await col.findOne({ _id: docId(instituteId, String(body.id || '')) });
    if (!note || !sees(note)) throw new HttpError(404, 'This note is not available.');
    const file = await files.findOne({ _id: docId(instituteId, note.id) });
    if (!file) throw new HttpError(404, 'This note has no file.');
    return { data: file.data, fileName: note.fileName, fileType: note.fileType };
  }

  if (!['admin', 'teacher'].includes(role)) throw new HttpError(403, 'Only teachers and the admin share notes.');

  if (action === 'notes.save') {
    const n = body.note || {};
    const title = String(n.title || '').trim().slice(0, 140);
    const className = String(n.className || '').trim();
    const section = String(n.section || '').trim();
    if (!title) throw new HttpError(400, 'Give the note a title.');
    if (!className) throw new HttpError(400, 'Choose the class this note is for.');
    if (role === 'teacher' && !teachesBatch(session.teacher, className, section)) {
      throw new HttpError(403, 'You can only share notes with your own batches.');
    }
    const link = String(n.link || '').trim();
    if (link && !/^https?:\/\/\S+$/i.test(link)) throw new HttpError(400, 'The link must start with http:// or https://');
    const file = typeof body.file === 'string' ? body.file : '';
    if (file && (!NOTE_FILE.test(file) || file.length > MAX_NOTE_CHARS)) throw new HttpError(400, 'Attach a PDF, JPG, PNG or WebP file under 3 MB.');
    // AI study notes, reviewed by the teacher, are kept as text beside the short message.
    const content = String(n.content || '').trim();
    if (content.length > 30000) throw new HttpError(400, 'These notes are too long. Shorten them or choose fewer chapters.');
    if (!file && !link && !content && !String(n.text || '').trim()) throw new HttpError(400, 'Add a file, a link or a few lines of text.');

    const id = newId();
    const doc = {
      _id: docId(instituteId, id), id, instituteId, title, className, section,
      subject: String(n.subject || '').trim().slice(0, 60),
      text: String(n.text || '').trim().slice(0, 2000),
      content,
      link,
      fileName: file ? String(n.fileName || 'note').slice(0, 120) : '',
      fileType: file ? file.slice(5, file.indexOf(';')) : '',
      fileSize: file ? Math.round((file.length - file.indexOf(',') - 1) * 0.75) : 0,
      createdBy: session.user.id,
      createdByName: session.user.user_metadata?.full_name || '',
      createdAt: new Date().toISOString(),
    };
    if (file) await files.updateOne({ _id: doc._id }, { $set: { instituteId, data: file } }, { upsert: true });
    await col.insertOne(doc);
    return { note: strip(doc) };
  }

  if (action === 'notes.delete') {
    const key = docId(instituteId, String(body.id || ''));
    const note = await col.findOne({ _id: key });
    if (!note) return { ok: true };
    if (role === 'teacher' && note.createdBy !== session.user.id) throw new HttpError(403, 'You can only delete notes you shared.');
    await col.deleteOne({ _id: key });
    await files.deleteOne({ _id: key });
    return { ok: true };
  }
  throw new HttpError(400, 'Unknown action.');
}

/* ───────── practice MCQ quizzes ───────── */

const MAX_QUIZ_QUESTIONS = 50;

function cleanQuizQuestions(list) {
  if (!Array.isArray(list) || !list.length) throw new HttpError(400, 'Add at least one question.');
  if (list.length > MAX_QUIZ_QUESTIONS) throw new HttpError(400, `A quiz can have up to ${MAX_QUIZ_QUESTIONS} questions.`);
  return list.map((q, i) => {
    const question = String(q?.question || '').trim().slice(0, 1500);
    const options = Array.isArray(q?.options) ? q.options.map((o) => String(o || '').trim().slice(0, 500)) : [];
    const answer = Number(q?.answer);
    if (!question) throw new HttpError(400, `Question ${i + 1} has no text.`);
    if (options.length !== 4 || options.some((o) => !o)) throw new HttpError(400, `Question ${i + 1} needs all 4 options.`);
    if (!Number.isInteger(answer) || answer < 0 || answer > 3) throw new HttpError(400, `Choose the correct option for question ${i + 1}.`);
    return { question, options, answer };
  });
}

// Teachers and the admin create quizzes for a batch; a parent submits one for their own child and the server marks it.
async function quizzesAction(db, session, action, body) {
  const col = db.collection('quizzes');
  const attempts = db.collection('quizAttempts');
  const { instituteId, role } = session;

  if (action === 'quizzes.submit') {
    if (role !== 'parent') throw new HttpError(403, 'Only a parent can submit a quiz for their child.');
    const child = session.children.find((c) => c.id === String(body.studentId || ''));
    const quiz = await col.findOne({ _id: docId(instituteId, String(body.quizId || '')) });
    if (!child || !quiz || !reaches(child, quiz.className, quiz.section)) throw new HttpError(404, 'This quiz is not available.');
    const answers = Array.isArray(body.answers) ? body.answers : [];
    if (answers.length !== quiz.questions.length || answers.some((a) => !Number.isInteger(a) || a < 0 || a > 3)) {
      throw new HttpError(400, 'Answer every question before submitting.');
    }
    const score = quiz.questions.filter((q, i) => q.answer === answers[i]).length;
    await attempts.updateOne(
      { _id: `${instituteId}:${quiz.id}:${child.id}` },
      {
        $set: { instituteId, quizId: quiz.id, studentId: child.id, last: score, total: quiz.questions.length, lastAt: new Date().toISOString() },
        $max: { best: score },
        $inc: { attempts: 1 },
      },
      { upsert: true },
    );
    return { score, total: quiz.questions.length, correct: quiz.questions.map((q) => q.answer) };
  }

  if (!['admin', 'teacher'].includes(role)) throw new HttpError(403, 'Quizzes are created by teachers and the admin.');

  if (action === 'quizzes.list') {
    const [all, allAttempts, students] = await Promise.all([
      col.find({ instituteId }).sort({ createdAt: -1 }).toArray(),
      attempts.find({ instituteId }).toArray(),
      db.collection('students').find({ instituteId }).toArray(),
    ]);
    const mine = role === 'admin' ? all : all.filter((q) => teachesBatch(session.teacher, q.className, q.section || ''));
    const pupils = role === 'admin' ? students : students.filter((s) => teachesStudent(session.teacher, s));
    return {
      quizzes: mine.map((q) => ({
        ...strip(q),
        results: pupils.filter((s) => reaches(s, q.className, q.section)).map((s) => {
          const a = allAttempts.find((x) => x.quizId === q.id && x.studentId === s.id);
          return { studentId: s.id, name: s.name, best: a?.best ?? null, last: a?.last ?? null, attempts: a?.attempts || 0 };
        }),
      })),
    };
  }

  if (action === 'quizzes.save') {
    const q = body.quiz || {};
    const title = String(q.title || '').trim().slice(0, 140);
    const className = String(q.className || '').trim();
    const section = String(q.section || '').trim();
    if (!title) throw new HttpError(400, 'Give the quiz a name.');
    if (!className) throw new HttpError(400, 'Choose the batch for this quiz.');
    if (role === 'teacher' && !teachesBatch(session.teacher, className, section)) {
      throw new HttpError(403, 'You can only send quizzes to your own batches.');
    }
    const id = newId();
    const doc = {
      _id: docId(instituteId, id), id, instituteId, title, className, section,
      subject: String(q.subject || '').trim().slice(0, 60),
      questions: cleanQuizQuestions(q.questions),
      createdBy: session.user.id,
      createdByName: session.user.user_metadata?.full_name || '',
      createdAt: new Date().toISOString(),
    };
    await col.insertOne(doc);
    return { quiz: { ...strip(doc), results: [] } };
  }

  if (action === 'quizzes.delete') {
    const key = docId(instituteId, String(body.id || ''));
    const quiz = await col.findOne({ _id: key });
    if (!quiz) return { ok: true };
    if (role === 'teacher' && quiz.createdBy !== session.user.id) throw new HttpError(403, 'You can only delete quizzes you created.');
    await col.deleteOne({ _id: key });
    await attempts.deleteMany({ instituteId, quizId: quiz.id });
    return { ok: true };
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
  if (action === 'me') return { user: await withPrefs(db, session.user) };
  if (action === 'prefs.save') {
    if (!LANGUAGES.includes(body.language)) throw new HttpError(400, 'Choose English or Hindi.');
    await db.collection('userPrefs').updateOne({ _id: session.user.id }, { $set: { language: body.language } }, { upsert: true });
    return { ok: true, language: body.language };
  }
  if (action.startsWith('admins.')) {
    if (session.role !== 'superadmin') throw new HttpError(403, 'Only the super admin can manage admins.');
    return adminsAction(db, action, body);
  }
  if (session.role === 'superadmin') throw new HttpError(403, 'The super admin has no institute data.');
  // A parent reads their own children and the notes shared with them, nothing else.
  if (session.role === 'parent') {
    if (action === 'parent.load') return parentLoad(db, session);
    if (action === 'notes.list' || action === 'notes.file') return notesAction(db, session, action, body);
    if (action === 'quizzes.submit') return quizzesAction(db, session, action, body);
    throw new HttpError(403, 'Parents can only see their own children’s progress.');
  }
  if (action.startsWith('quizzes.')) {
    if (session.role === 'receptionist') throw new HttpError(403, 'Quizzes are for teachers and the admin.');
    return quizzesAction(db, session, action, body);
  }
  if (action.startsWith('notes.')) {
    if (session.role === 'receptionist') throw new HttpError(403, 'Notes are shared by teachers and the admin.');
    return notesAction(db, session, action, body);
  }
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
