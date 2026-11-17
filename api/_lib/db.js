// MongoDB connection, shared across requests while a serverless instance stays warm.
// Set MONGODB_URI (and optionally MONGODB_DB) in the environment.
import { MongoClient } from 'mongodb';

const DB_NAME = () => process.env.MONGODB_DB || 'edubuddy';

export const isConfigured = () => Boolean(process.env.MONGODB_URI);

// Kept on globalThis so a reloaded module (dev server, warm serverless instance) reuses one connection.
const cache = globalThis.__edubuddyMongo || (globalThis.__edubuddyMongo = { clientPromise: null, uri: '', indexes: {} });

/** Every collection the app uses. Each document carries `instituteId` except admins. */
export const COLLECTIONS = {
  admins: 'admins',
  institutes: 'institutes',
  teachers: 'teachers',
  classes: 'classes',
  students: 'students',
  payments: 'payments',
  attendance: 'attendance',
  leads: 'leads',
  papers: 'papers',
};

async function ensureIndexes(db) {
  await Promise.all([
    db.collection('admins').createIndex({ loginId: 1 }, { unique: true }),
    db.collection('teachers').createIndex({ email: 1 }),
    db.collection('teachers').createIndex({ instituteId: 1 }),
    db.collection('receptionists').createIndex({ email: 1 }),
    db.collection('receptionists').createIndex({ instituteId: 1 }),
    db.collection('receipts').createIndex({ instituteId: 1, studentId: 1 }),
    // Failed sign-in counters expire on their own after an hour.
    db.collection('loginAttempts').createIndex({ first: 1 }, { expireAfterSeconds: 3600 }),
    db.collection('classes').createIndex({ instituteId: 1, name: 1 }),
    db.collection('students').createIndex({ instituteId: 1, className: 1 }),
    db.collection('payments').createIndex({ instituteId: 1, studentId: 1 }),
    db.collection('payments').createIndex({ instituteId: 1, date: -1 }),
    db.collection('attendance').createIndex({ instituteId: 1, date: 1 }),
    db.collection('leads').createIndex({ instituteId: 1, createdAt: -1 }),
    db.collection('papers').createIndex({ instituteId: 1, ownerId: 1, created_at: -1 }),
  ]);
}

export async function getDb() {
  if (!isConfigured()) throw new Error('MONGODB_URI is not set.');
  if (!cache.clientPromise || cache.uri !== process.env.MONGODB_URI) {
    cache.uri = process.env.MONGODB_URI;
    cache.indexes = {};
    cache.clientPromise = new MongoClient(process.env.MONGODB_URI, { maxPoolSize: 5 }).connect()
      .catch((err) => { cache.clientPromise = null; throw err; });
  }
  const name = DB_NAME();
  const db = (await cache.clientPromise).db(name);
  if (!cache.indexes[name]) cache.indexes[name] = ensureIndexes(db).catch((err) => { delete cache.indexes[name]; throw err; });
  await cache.indexes[name];
  return db;
}
