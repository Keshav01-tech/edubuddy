// Institute admin accounts live in MongoDB and are managed by the super admin (api/db.js).

/**
 * The one super admin. Only a SHA-256 hash of the password is kept here, so the password itself is not in the source.
 * On a server, set SUPER_ADMIN_LOGIN and SUPER_ADMIN_PASSWORD_SHA256 to override these. To make a hash:
 *   node -e "console.log(require('crypto').createHash('sha256').update('NEW_PASSWORD').digest('hex'))"
 */
export const SUPER_ADMIN = {
  loginId: 'superadmin',
  passwordSha256: '0a1d062e5eb11b35d7197df396cb59ff17d5a88f1ca820ad5a486f896a2440c5',
  name: 'Super Admin',
};

/** Random, easy-to-read password for a new admin. */
export function suggestPassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const pick = new Uint32Array(10);
  crypto.getRandomValues(pick);
  return [...pick].map((n) => chars[n % chars.length]).join('');
}
