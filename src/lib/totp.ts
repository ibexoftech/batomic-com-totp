import * as OTPAuth from 'otpauth';
import { getDb } from './db';
import { decryptSecret } from './crypto';
import type { TotpCode } from '@/types';

interface SecretRow {
  id: number;
  label: string;
  issuer: string;
  encrypted_secret: Buffer;
  iv: Buffer;
  auth_tag: Buffer;
  algorithm: string;
  digits: number;
  period: number;
}

export function generateAllCodes(): TotpCode[] {
  const db = getDb();
  const rows = db.prepare(
    'SELECT id, label, issuer, encrypted_secret, iv, auth_tag, algorithm, digits, period FROM secrets'
  ).all() as SecretRow[];

  const now = Math.floor(Date.now() / 1000);

  return rows.map((row) => {
    const secret = decryptSecret(row.encrypted_secret, row.iv, row.auth_tag);
    const totp = new OTPAuth.TOTP({
      issuer: row.issuer,
      label: row.label,
      algorithm: row.algorithm,
      digits: row.digits,
      period: row.period,
      secret: OTPAuth.Secret.fromBase32(secret),
    });

    const code = totp.generate();
    const remaining = row.period - (now % row.period);

    return {
      id: row.id,
      label: row.label,
      issuer: row.issuer,
      code,
      remaining,
      period: row.period,
    };
  });
}

export function parseOtpauthUri(uri: string): {
  label: string;
  issuer: string;
  secret: string;
  algorithm: string;
  digits: number;
  period: number;
} {
  const parsed = OTPAuth.URI.parse(uri);
  if (!(parsed instanceof OTPAuth.TOTP)) {
    throw new Error('Only TOTP URIs are supported');
  }
  return {
    label: parsed.label,
    issuer: parsed.issuer,
    secret: parsed.secret.base32,
    algorithm: parsed.algorithm,
    digits: parsed.digits,
    period: parsed.period,
  };
}
