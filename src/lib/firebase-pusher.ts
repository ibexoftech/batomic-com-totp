import * as OTPAuth from 'otpauth';
import { getDb } from './db';
import { decryptSecret } from './crypto';

interface FirebaseSecret {
  id: number;
  encrypted_secret: Buffer;
  iv: Buffer;
  auth_tag: Buffer;
  algorithm: string;
  digits: number;
  period: number;
  firebase_url: string;
  firebase_api_key: string;
  firebase_token_target: string;
}

interface PushStatus {
  lastCode: string | null;
  lastPushAt: string | null;
  lastError: string | null;
}

const pushStatuses = new Map<number, PushStatus>();
let started = false;

export function startFirebasePusher(): void {
  if (started) return;
  started = true;

  console.log('[firebase-pusher] Started');
  setInterval(tick, 30000);
}

function tick(): void {
  let rows: FirebaseSecret[];
  try {
    const db = getDb();
    rows = db.prepare(
      `SELECT id, encrypted_secret, iv, auth_tag, algorithm, digits, period,
              firebase_url, firebase_api_key, firebase_token_target
       FROM secrets
       WHERE firebase_enabled = 1
         AND firebase_url != ''
         AND firebase_api_key != ''
         AND firebase_token_target != ''`
    ).all() as FirebaseSecret[];
  } catch (err) {
    console.error('[firebase-pusher] DB query failed:', err);
    return;
  }

  for (const row of rows) {
    try {
      const secret = decryptSecret(row.encrypted_secret, row.iv, row.auth_tag);
      const totp = new OTPAuth.TOTP({
        algorithm: row.algorithm,
        digits: row.digits,
        period: row.period,
        secret: OTPAuth.Secret.fromBase32(secret),
      });

      const code = totp.generate();
      const status = pushStatuses.get(row.id);

      if (status && status.lastCode === code) continue;

      // Code changed — push to Firebase
      pushToFirebase(row, code);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[firebase-pusher] Error for secret ${row.id}:`, msg);
      const existing = pushStatuses.get(row.id);
      pushStatuses.set(row.id, {
        lastCode: existing?.lastCode ?? null,
        lastPushAt: existing?.lastPushAt ?? null,
        lastError: msg,
      });
    }
  }
}

async function pushToFirebase(row: FirebaseSecret, code: string): Promise<void> {
  const baseUrl = row.firebase_url.replace(/\/+$/, '');
  const url = `${baseUrl}/tokens/${row.firebase_token_target}.json?auth=${row.firebase_api_key}`;

  console.log(`[firebase-pusher] PUT ${baseUrl}/tokens/${row.firebase_token_target}.json`);

  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: code }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text}`);
    }

    pushStatuses.set(row.id, {
      lastCode: code,
      lastPushAt: new Date().toISOString(),
      lastError: null,
    });

    console.log(`[firebase-pusher] Pushed code for secret ${row.id} -> ${row.firebase_token_target}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[firebase-pusher] Push failed for secret ${row.id}:`, msg);
    pushStatuses.set(row.id, {
      lastCode: null,
      lastPushAt: pushStatuses.get(row.id)?.lastPushAt ?? null,
      lastError: msg,
    });
  }
}

export function getPushStatuses(): Record<number, PushStatus> {
  return Object.fromEntries(pushStatuses);
}
