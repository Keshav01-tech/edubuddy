// Seeds MongoDB with one complete demo institute, "KMC Classes", so every feature can be shown:
// batches in parallel rooms, a teacher with two batches of the same subject, students in several batches,
// a year of fees (paid, part-paid, late, unpaid), batch attendance, inquiries, a front desk login and a test paper.
//
//   npm run seed:kmc                 replace KMC Classes' data, leave every other institute alone
//   npm run seed:kmc -- --reset-all  empty the whole database first (all institutes and admin accounts)
//
// Reads MONGODB_URI and MONGODB_DB from .env (or the environment). Logins can be set with
// KMC_ADMIN_PASSWORD, KMC_TEACHER_PASSWORD and KMC_DESK_PASSWORD; the defaults are printed at the end.
import { readFileSync, existsSync } from 'node:fs';
import { MongoClient } from 'mongodb';
import { hashPassword } from '../api/_lib/auth.js';

/* ───────── settings ───────── */

function loadEnvFile() {
  const file = new URL('../.env', import.meta.url);
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
loadEnvFile();
const URI = process.env.MONGODB_URI;
const DB = process.env.MONGODB_DB || 'edubuddy';
if (!URI) { console.error('MONGODB_URI is not set (put it in .env).'); process.exit(1); }
const RESET_ALL = process.argv.includes('--reset-all');

const ADMIN_ID = 'kmc-classes';
const INST = `admin-${ADMIN_ID}`;
const LOGIN = {
  admin: { loginId: 'kmcadmin', password: process.env.KMC_ADMIN_PASSWORD || 'Kmc@2026' },
  teacher: process.env.KMC_TEACHER_PASSWORD || 'Teach@2026',
  desk: { email: 'reception@kmcclasses.in', password: process.env.KMC_DESK_PASSWORD || 'Desk@2026' },
};

/* ───────── helpers ───────── */

// Deterministic random numbers, so every run gives the same institute.
let seed = 20261116;
const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32; };
const pick = (list) => list[Math.floor(rand() * list.length)];
const int = (min, max) => min + Math.floor(rand() * (max - min + 1));

const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const NOW = new Date();
const TODAY = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate(), 12);
const daysAgo = (n) => { const d = new Date(TODAY); d.setDate(d.getDate() - n); return d; };
const dayISO = (n) => iso(daysAgo(n));
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const ALL = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MWF = ['Mon', 'Wed', 'Fri'];
const TTS = ['Tue', 'Thu', 'Sat'];

/* ───────── institute ───────── */

const INSTITUTE = {
  name: 'KMC Classes',
  tagline: 'Classes 8 to 12 · Boards, JEE & NEET foundation',
  address: '2nd Floor, Shree Plaza, Gopalpura Bypass',
  city: 'Jaipur',
  state: 'Rajasthan',
  pincode: '302018',
  phone: '9414055500',
  email: 'hello@kmcclasses.in',
  website: 'kmcclasses.in',
  logo: '',
  principalName: 'K. M. Choudhary',
  receiptPrefix: 'KMC',
};

const TEACHERS = [
  { id: 't-rakesh', name: 'Rakesh Khandelwal', subject: 'Mathematics', email: 'rakesh@kmcclasses.in', phone: '9414055501' },
  { id: 't-sunita', name: 'Sunita Sharma', subject: 'Science', email: 'sunita@kmcclasses.in', phone: '9414055502' },
  { id: 't-arjun', name: 'Arjun Mehta', subject: 'Physics', email: 'arjun@kmcclasses.in', phone: '9414055503' },
  { id: 't-priya', name: 'Priya Jain', subject: 'Chemistry', email: 'priya@kmcclasses.in', phone: '9414055504' },
  { id: 't-neha', name: 'Neha Verma', subject: 'Biology', email: 'neha@kmcclasses.in', phone: '9414055505' },
  { id: 't-imran', name: 'Imran Khan', subject: 'English', email: 'imran@kmcclasses.in', phone: '9414055506' },
];

// One batch = one teacher, one subject, one time, one room. Rooms run in parallel.
const BATCHES = [
  { cls: 'Class 8', sec: 'A', subject: 'English', teacher: 't-imran', room: 'Room 1', days: ALL, start: '15:00', end: '16:00' },
  { cls: 'Class 8', sec: 'B', subject: 'Science', teacher: 't-neha', room: 'Room 2', days: ALL, start: '15:00', end: '16:00' },
  { cls: 'Class 9', sec: 'A', subject: 'Mathematics', teacher: 't-rakesh', room: 'Room 1', days: ALL, start: '16:00', end: '17:00' },
  { cls: 'Class 9', sec: 'B', subject: 'Science', teacher: 't-sunita', room: 'Room 2', days: ALL, start: '16:00', end: '17:00' },
  { cls: 'Class 10', sec: 'A', subject: 'Science', teacher: 't-sunita', room: 'Room 2', days: ALL, start: '17:00', end: '18:00' },
  { cls: 'Class 10', sec: 'B', subject: 'Mathematics', teacher: 't-rakesh', room: 'Room 1', days: ALL, start: '17:00', end: '18:00' },
  // Same class, same subject, same teacher, another time: Sunita's evening Science and Rakesh's early Maths.
  { cls: 'Class 10', sec: 'C', subject: 'Science', teacher: 't-sunita', room: 'Room 2', days: ALL, start: '18:00', end: '19:00' },
  { cls: 'Class 10', sec: 'D', subject: 'Mathematics', teacher: 't-rakesh', room: 'Room 1', days: ALL, start: '07:00', end: '08:00' },
  { cls: 'Class 10', sec: 'E', subject: 'English', teacher: 't-imran', room: 'Room 3', days: ALL, start: '18:00', end: '19:00' },
  { cls: 'Class 11', sec: 'A', subject: 'Physics', teacher: 't-arjun', room: 'Room 3', days: MWF, start: '07:30', end: '09:00' },
  { cls: 'Class 11', sec: 'B', subject: 'Chemistry', teacher: 't-priya', room: 'Room 2', days: TTS, start: '07:30', end: '09:00' },
  { cls: 'Class 11', sec: 'C', subject: 'Mathematics', teacher: 't-rakesh', room: 'Room 1', days: MWF, start: '09:00', end: '10:30' },
  { cls: 'Class 11', sec: 'D', subject: 'Biology', teacher: 't-neha', room: 'Lab', days: TTS, start: '09:00', end: '10:30' },
  { cls: 'Class 12', sec: 'A', subject: 'Physics', teacher: 't-arjun', room: 'Room 3', days: MWF, start: '16:00', end: '17:30' },
  { cls: 'Class 12', sec: 'B', subject: 'Chemistry', teacher: 't-priya', room: 'Lab', days: TTS, start: '16:00', end: '17:30' },
  { cls: 'Class 12', sec: 'C', subject: 'Mathematics', teacher: 't-rakesh', room: 'Room 1', days: MWF, start: '19:00', end: '20:30' },
  { cls: 'Class 12', sec: 'D', subject: 'Biology', teacher: 't-neha', room: 'Lab', days: MWF, start: '17:00', end: '18:30' },
];

const PER_BATCH_FEE = { 'Class 8': 4500, 'Class 9': 6000, 'Class 10': 8000, 'Class 11': 13000, 'Class 12': 14000 };

// Which batch combinations students of each class take, and how many students take each.
const ENROLMENT = {
  'Class 8': [[['A', 'B'], 6], [['A'], 2], [['B'], 3]],
  'Class 9': [[['A', 'B'], 8], [['A'], 3], [['B'], 2]],
  'Class 10': [[['A', 'B'], 7], [['C', 'D'], 5], [['A', 'D'], 3], [['B', 'C'], 2], [['A', 'B', 'E'], 2], [['E'], 2], [['B'], 1]],
  'Class 11': [[['A', 'B', 'C'], 7], [['A', 'B', 'D'], 6], [['C'], 2]],
  'Class 12': [[['A', 'B', 'C'], 7], [['A', 'B', 'D'], 6], [['A'], 1], [['C'], 1]],
};

const FIRST = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Krishna', 'Ishaan', 'Shaurya', 'Atharv', 'Kabir', 'Dhruv', 'Ayaan', 'Rudra',
  'Yash', 'Harsh', 'Lakshya', 'Parth', 'Tanmay', 'Ananya', 'Diya', 'Saanvi', 'Aadhya', 'Myra', 'Ira', 'Kiara', 'Pari', 'Anika', 'Navya', 'Riya', 'Khushi',
  'Tanvi', 'Ishita', 'Sneha', 'Prachi', 'Muskan', 'Nidhi', 'Kavya', 'Simran', 'Zoya', 'Fatima', 'Aryan', 'Devansh', 'Manan', 'Nikita', 'Payal', 'Rohit'];
const LAST = ['Sharma', 'Agarwal', 'Gupta', 'Jain', 'Meena', 'Choudhary', 'Saini', 'Khandelwal', 'Rathore', 'Shekhawat', 'Joshi', 'Verma', 'Mathur',
  'Singhal', 'Bansal', 'Goyal', 'Kumawat', 'Yadav', 'Soni', 'Mittal', 'Khan', 'Sethi', 'Bhatt', 'Pareek'];

/* ───────── build ───────── */

function buildClasses() {
  const names = [...new Set(BATCHES.map((b) => b.cls))];
  return names.map((name) => {
    const list = BATCHES.filter((b) => b.cls === name);
    return {
      id: `c-${name.split(' ')[1]}`,
      name,
      sections: list.map((b) => b.sec),
      timings: Object.fromEntries(list.map((b) => [b.sec, { days: b.days, start: b.start, end: b.end, subject: b.subject, room: b.room }])),
    };
  });
}

function buildTeachers() {
  return TEACHERS.map((t) => ({
    ...t,
    passwordHash: hashPassword(LOGIN.teacher),
    assignments: BATCHES.filter((b) => b.teacher === t.id).map((b) => ({ className: b.cls, section: b.sec })),
  }));
}

function buildStudents() {
  const used = new Set();
  const students = [];
  let n = 1;
  for (const [className, combos] of Object.entries(ENROLMENT)) {
    for (const [batches, count] of combos) {
      for (let i = 0; i < count; i += 1) {
        let name;
        do { name = `${pick(FIRST)} ${pick(LAST)}`; } while (used.has(name));
        used.add(name);
        // Most students joined across the session (April onwards); the rest are recent admissions.
        const joinedAgo = rand() < 0.75 ? int(60, 320) : int(3, 59);
        students.push({
          id: `st-${String(n).padStart(3, '0')}`,
          name,
          className,
          batches,
          section: batches[0],
          phone: `98${String(29000000 + n * 7919).slice(-8)}`,
          fee: PER_BATCH_FEE[className] * batches.length,
          createdAt: dayISO(Math.max(3, joinedAgo)),
        });
        n += 1;
      }
    }
  }
  return students;
}

/**
 * Fees: most students pay in instalments since they joined. A few have paid everything,
 * some are behind with a due date already passed, and the newest joiners have paid nothing yet.
 */
function buildPayments(students) {
  const raw = [];
  const kinds = ['full', 'full', 'full', 'part', 'part', 'part', 'part', 'late', 'late', 'none'];
  students.forEach((s, idx) => {
    const joined = Math.round((TODAY - new Date(`${s.createdAt}T12:00:00`)) / 86400000);
    let kind = kinds[idx % kinds.length];
    if (joined < 12) kind = 'none';
    const share = { full: 1, part: 0.45 + rand() * 0.3, late: 0.15 + rand() * 0.2, none: 0 }[kind];
    let left = Math.round((s.fee * share) / 100) * 100;
    const parts = kind === 'full' ? int(2, 4) : kind === 'part' ? int(1, 3) : left ? 1 : 0;
    for (let p = 0; p < parts && left > 0; p += 1) {
      const amount = p === parts - 1 ? left : Math.round(left / (parts - p) / 100) * 100;
      left -= amount;
      const ago = Math.max(0, Math.round(joined - (joined * (p + 0.3)) / parts));
      raw.push({ studentId: s.id, amount, ago });
    }
    // Next instalment date: late students are past it, others have it coming up.
    s.feeDate = kind === 'full' ? '' : kind === 'late' ? dayISO(int(5, 25)) : kind === 'none' ? dayISO(-int(2, 12)) : dayISO(-int(0, 25));
    if (kind === 'part' && idx % 9 === 0) s.feeDate = dayISO(0); // a few due today
  });
  raw.sort((a, b) => b.ago - a.ago);
  const modes = ['UPI', 'UPI', 'UPI', 'Cash', 'Cash', 'Bank transfer', 'Cheque'];
  const payments = raw.map((p, i) => {
    const date = dayISO(p.ago);
    const mode = pick(modes);
    return {
      id: `pay-${String(i + 1).padStart(4, '0')}`,
      studentId: p.studentId,
      amount: p.amount,
      date,
      mode,
      note: `${MONTHS[Number(date.slice(5, 7)) - 1]} fee`,
      receiptNo: `R-${String(i + 1).padStart(4, '0')}`,
      ...(mode === 'UPI' ? { reference: `UPI${String(41000000000 + i * 7331).slice(-11)}` } : {}),
      createdAt: `${date}T${pad(10 + (i % 8))}:${pad((i * 7) % 60)}:00.000Z`,
    };
  });
  return { payments, nextReceipt: payments.length + 1 };
}

/** Batch attendance for the last five weeks, on each batch's own days. Today only counts batches that have already started. */
function buildAttendance(students) {
  const docs = [];
  const minutesNow = NOW.getHours() * 60 + NOW.getMinutes();
  const often = new Set(students.filter((_, i) => i % 13 === 4).map((s) => s.id)); // a few students who miss a lot
  const absentToday = new Set(students.filter((_, i) => i % 11 === 2).map((s) => s.id));
  for (let ago = 35; ago >= 0; ago -= 1) {
    const day = daysAgo(ago);
    const weekday = WEEK[day.getDay()];
    for (const b of BATCHES) {
      if (!b.days.includes(weekday)) continue;
      const [h, m] = b.start.split(':').map(Number);
      if (ago === 0 && h * 60 + m > minutesNow) continue; // not taken yet today: the teacher marks it live
      const date = iso(day);
      const marks = {};
      students.filter((s) => s.className === b.cls && s.batches.includes(b.sec) && s.createdAt <= date).forEach((s) => {
        const missRate = often.has(s.id) ? 0.3 : 0.07;
        marks[s.id] = (ago === 0 && absentToday.has(s.id)) || rand() < missRate ? 'A' : 'P';
      });
      if (Object.keys(marks).length) docs.push({ id: `${date}|${b.cls}||${b.sec}`, date, batchKey: `${b.cls}||${b.sec}`, marks });
    }
  }
  return docs;
}

function buildLeads() {
  const sources = ['Call', 'WhatsApp', 'Walk-in', 'Reference'];
  const classes = ['Class 8', 'Class 9', 'Class 10', 'Class 10', 'Class 11', 'Class 11', 'Class 12'];
  const perMonth = [2, 2, 3, 3, 4, 3, 4, 5, 5, 6, 7, 6]; // oldest first; the institute is growing
  const notes = {
    joined: ['Joined after the demo class.', 'Enrolled with sibling discount.', 'Joined the evening batch.'],
    dropped: ['Chose another centre.', 'Fee too high for now.', 'Timing did not suit.'],
    open: ['Asked about fees and batch timing.', 'Wants a demo class first.', 'Will confirm after talking at home.', 'Asked for JEE foundation details.'],
  };
  const leads = [];
  let n = 1;
  perMonth.forEach((count, slot) => {
    const monthsAgo = 11 - slot;
    for (let i = 0; i < count; i += 1) {
      const ago = Math.max(0, monthsAgo * 30 + int(0, 27) - 3);
      const recent = ago < 30;
      const status = recent ? pick(['new', 'new', 'contacted', 'contacted', 'visit', 'joined', 'dropped']) : pick(['joined', 'joined', 'joined', 'dropped', 'dropped', 'contacted']);
      const open = ['new', 'contacted', 'visit'].includes(status);
      leads.push({
        id: `lead-${String(n).padStart(3, '0')}`,
        name: `${pick(FIRST)} ${pick(LAST)}`,
        phone: `97${String(83000000 + n * 4793).slice(-8)}`,
        className: pick(classes),
        source: pick(sources),
        status,
        note: pick(open ? notes.open : notes[status] || notes.open),
        // Open inquiries have follow-ups: some overdue, some today, some coming up.
        followUp: open ? dayISO(recent ? -int(-3, 6) : int(1, 10)) : '',
        createdAt: dayISO(ago),
      });
      n += 1;
    }
  });
  return leads;
}

const PAPER = {
  id: 's-kmc-demo-light',
  class_name: '10',
  subject_name: 'Science',
  chapter_name: 'Light – Reflection and Refraction',
  question_count: 5,
  question_types: ['mcq'],
  difficulty: 'medium',
  total_marks: 5,
  paper_mode: 'mcq',
  blueprint: null,
  chapters: null,
  created_at: `${dayISO(4)}T10:30:00.000Z`,
  questions: [
    { type: 'mcq', marks: 1, question: 'The focal length of a concave mirror is 15 cm. Its radius of curvature is:', options: ['7.5 cm', '15 cm', '30 cm', '45 cm'], correctAnswer: '30 cm', explanation: 'R = 2f = 2 × 15 cm = 30 cm.' },
    { type: 'mcq', marks: 1, question: 'Which mirror is used as a rear-view mirror in vehicles?', options: ['Plane mirror', 'Concave mirror', 'Convex mirror', 'Cylindrical mirror'], correctAnswer: 'Convex mirror', explanation: 'A convex mirror gives an erect, diminished image and a wider field of view.' },
    { type: 'mcq', marks: 1, question: 'The refractive index of glass is 1.5. The speed of light in glass is:', options: ['2 × 10⁸ m/s', '3 × 10⁸ m/s', '1.5 × 10⁸ m/s', '4.5 × 10⁸ m/s'], correctAnswer: '2 × 10⁸ m/s', explanation: 'v = c / n = (3 × 10⁸) / 1.5 = 2 × 10⁸ m/s.' },
    { type: 'mcq', marks: 1, question: 'The power of a lens of focal length +50 cm is:', options: ['+0.5 D', '+2 D', '−2 D', '+50 D'], correctAnswer: '+2 D', explanation: 'P = 1/f (in metres) = 1/0.5 = +2 D.' },
    { type: 'mcq', marks: 1, question: 'An object is placed at the centre of curvature of a concave mirror. The image is formed:', options: ['At the focus', 'At infinity', 'At the centre of curvature', 'Behind the mirror'], correctAnswer: 'At the centre of curvature', explanation: 'At C the image is real, inverted, the same size and also at C.' },
  ],
};

/* ───────── write ───────── */

const withKeys = (list) => list.map((doc) => ({ ...doc, _id: `${INST}:${doc.id}`, instituteId: INST, updatedAt: new Date() }));

async function main() {
  const client = await new MongoClient(URI, { serverSelectionTimeoutMS: 15000 }).connect();
  const db = client.db(DB);
  const COLLECTIONS = ['admins', 'institutes', 'classes', 'teachers', 'receptionists', 'students', 'payments', 'attendance', 'leads', 'papers', 'receipts', 'loginAttempts'];
  try {
    if (RESET_ALL) {
      for (const name of COLLECTIONS) await db.collection(name).deleteMany({});
      console.log(`Emptied every collection in "${DB}".`);
    } else {
      for (const name of COLLECTIONS.filter((c) => !['admins', 'institutes', 'loginAttempts'].includes(c))) await db.collection(name).deleteMany({ instituteId: INST });
      await db.collection('institutes').deleteOne({ _id: INST });
      await db.collection('admins').deleteOne({ _id: ADMIN_ID });
    }

    const clash = await db.collection('admins').findOne({ loginId: LOGIN.admin.loginId });
    if (clash) throw new Error(`Another admin already uses the login ID "${LOGIN.admin.loginId}". Remove it or run with --reset-all.`);

    const classes = buildClasses();
    const teachers = buildTeachers();
    const students = buildStudents();
    const { payments, nextReceipt } = buildPayments(students);
    const attendance = buildAttendance(students);
    const leads = buildLeads();

    await db.collection('admins').insertOne({
      _id: ADMIN_ID, name: INSTITUTE.principalName, institute: INSTITUTE.name, loginId: LOGIN.admin.loginId,
      passwordHash: hashPassword(LOGIN.admin.password), active: true, createdAt: dayISO(340),
    });
    await db.collection('institutes').insertOne({ _id: INST, profile: INSTITUTE, school: INSTITUTE.name, nextReceipt, updatedAt: new Date() });
    await db.collection('classes').insertMany(withKeys(classes));
    await db.collection('teachers').insertMany(withKeys(teachers));
    await db.collection('receptionists').insertMany(withKeys([{
      id: 'desk-pooja', name: 'Pooja Saini', email: LOGIN.desk.email, phone: '9414055510', active: true, passwordHash: hashPassword(LOGIN.desk.password),
    }]));
    await db.collection('students').insertMany(withKeys(students));
    await db.collection('payments').insertMany(withKeys(payments));
    await db.collection('attendance').insertMany(withKeys(attendance));
    await db.collection('leads').insertMany(withKeys(leads));
    await db.collection('papers').insertOne({ ...PAPER, _id: `${INST}:paper:admin-${ADMIN_ID}:${PAPER.id}`, instituteId: INST, ownerId: `admin-${ADMIN_ID}`, updatedAt: new Date() });

    const owed = students.reduce((sum, s) => sum + Math.max(0, s.fee - payments.filter((p) => p.studentId === s.id).reduce((a, p) => a + p.amount, 0)), 0);
    console.log(`\nKMC Classes is ready in "${DB}":`);
    console.log(`  ${classes.length} classes, ${BATCHES.length} batches, ${teachers.length} teachers, 1 front desk account`);
    console.log(`  ${students.length} students (${students.filter((s) => s.batches.length > 1).length} in more than one batch)`);
    console.log(`  ${payments.length} fee payments, ₹${owed.toLocaleString('en-IN')} still to collect`);
    console.log(`  ${attendance.length} batch attendance sheets, ${leads.length} inquiries, 1 test paper`);
    console.log('\nSign in at /login:');
    console.log(`  Admin       login ID ${LOGIN.admin.loginId}   password ${LOGIN.admin.password}`);
    console.log(`  Teacher     ${TEACHERS.map((t) => t.email).join(', ')}   password ${LOGIN.teacher}`);
    console.log(`  Front desk  ${LOGIN.desk.email}   password ${LOGIN.desk.password}`);
  } finally {
    await client.close();
  }
}

main().catch((err) => { console.error(err.message || err); process.exit(1); });
