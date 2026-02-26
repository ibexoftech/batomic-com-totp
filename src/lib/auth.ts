import crypto from 'node:crypto';
import { SESSION_COOKIE_NAME } from './constants';
import { verifySessionToken } from './session';
import type { SessionPayload } from '@/types';

// Re-export edge-compatible session functions
export { createSessionToken, verifySessionToken, createSessionCookie } from './session';

// --- Password Hashing (Node.js only) ---

export function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16);
    crypto.scrypt(password, salt, 64, (err, derived) => {
      if (err) return reject(err);
      resolve(salt.toString('hex') + ':' + derived.toString('hex'));
    });
  });
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [saltHex, keyHex] = hash.split(':');
    const salt = Buffer.from(saltHex, 'hex');
    const storedKey = Buffer.from(keyHex, 'hex');
    crypto.scrypt(password, salt, 64, (err, derived) => {
      if (err) return reject(err);
      resolve(crypto.timingSafeEqual(derived, storedKey));
    });
  });
}

// --- Server-side session helper ---

export async function getSessionFromCookie(): Promise<SessionPayload | null> {
  // Dynamic import to avoid breaking non-Next.js contexts (scripts, tests)
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE_NAME);
  if (!cookie) return null;
  return verifySessionToken(cookie.value);
}
