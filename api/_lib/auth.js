// Password hashing and signed session tokens, using only Node's crypto.
// Tokens are signed with AUTH_SECRET; set it to a long random string in production.
import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const TOKEN_DAYS = 30;

function secret() {
  const value = process.env.AUTH_SECRET;
  if (value) return value;
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET is not set.');
  }
  return 'local-dev-secret-change-me';
}

/** "scrypt$<salt>$<hash>" */
export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(String(password), salt, 32).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password, stored) {
  if (!stored || typeof stored !== 'string') return false;
  const [kind, salt, hash] = stored.split('$');
  if (kind !== 'scrypt' || !salt || !hash) return false;
  const given = scryptSync(String(password || ''), salt, 32);
  const want = Buffer.from(hash, 'hex');
  return want.length === given.length && timingSafeEqual(given, want);
}

export const sha256 = (text) => createHash('sha256').update(String(text || '')).digest('hex');

const b64 = (value) => Buffer.from(value).toString('base64url');

export function signToken(payload) {
  const body = b64(JSON.stringify({ ...payload, exp: Date.now() + TOKEN_DAYS * 86400000 }));
  const sig = createHmac('sha256', secret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function readToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const want = createHmac('sha256', secret()).update(body).digest('base64url');
  if (sig.length !== want.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(want))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    return payload.exp > Date.now() ? payload : null;
  } catch {
    return null;
  }
}

export function bearer(req) {
  const header = req.headers?.authorization || req.headers?.Authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : '';
}
