// Talks to the app's MongoDB API (api/db.js). When the server has no database configured,
// the app keeps everything in this browser instead, as it always has.

const TOKEN_KEY = 'edu_cloud_token';

export const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; }
};
export const setToken = (token) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch { /* private mode: the session lasts until the tab closes */ }
};

export class CloudError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

/** POST /api/db { action, ...payload } with the session token. */
export async function callDb(action, payload = {}, { keepalive = false, token = getToken() } = {}) {
  let response;
  try {
    response = await fetch('/api/db', {
      method: 'POST',
      keepalive,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ action, ...payload }),
    });
  } catch {
    throw new CloudError('Cannot reach the server. Check your internet connection.', 0);
  }
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new CloudError(result.error || 'The server could not complete this.', response.status);
  return result;
}

let statusPromise = null;
/**
 * True when the server has a database. Asked once per page load; a failed check (server restarting,
 * network blip) is retried instead of quietly falling back to keeping data in this browser.
 */
export function cloudEnabled() {
  if (!statusPromise) {
    statusPromise = (async () => {
      for (let attempt = 0; attempt < 4; attempt += 1) {
        try {
          return !!(await callDb('status')).configured;
        } catch {
          await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
        }
      }
      statusPromise = null; // ask again next time instead of remembering the failure
      return false;
    })();
  }
  return statusPromise;
}
