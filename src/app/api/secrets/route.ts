import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionFromCookie } from '@/lib/auth';
import { encryptSecret } from '@/lib/crypto';
import { parseOtpauthUri } from '@/lib/totp';
import { logAudit } from '@/lib/audit';
import { DEFAULT_ALGORITHM, DEFAULT_DIGITS, DEFAULT_PERIOD } from '@/lib/constants';

export async function GET() {
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const secrets = db.prepare(
    'SELECT id, label, issuer, algorithm, digits, period, added_by, created_at FROM secrets ORDER BY created_at DESC'
  ).all();

  return NextResponse.json(secrets);
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

  let body: {
    uri?: string;
    label?: string;
    issuer?: string;
    secret?: string;
    algorithm?: string;
    digits?: number;
    period?: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  let label: string;
  let issuer: string;
  let secret: string;
  let algorithm: string;
  let digits: number;
  let period: number;

  if (body.uri) {
    try {
      const parsed = parseOtpauthUri(body.uri);
      label = parsed.label;
      issuer = parsed.issuer;
      secret = parsed.secret;
      algorithm = parsed.algorithm;
      digits = parsed.digits;
      period = parsed.period;
    } catch (err) {
      return NextResponse.json({ error: `Invalid URI: ${(err as Error).message}` }, { status: 400 });
    }
  } else if (body.label && body.secret) {
    label = body.label;
    issuer = body.issuer || '';
    secret = body.secret;
    algorithm = body.algorithm || DEFAULT_ALGORITHM;
    digits = body.digits || DEFAULT_DIGITS;
    period = body.period || DEFAULT_PERIOD;
  } else {
    return NextResponse.json({ error: 'Provide either uri or label+secret' }, { status: 400 });
  }

  const { encrypted, iv, authTag } = encryptSecret(secret);

  const db = getDb();
  const result = db.prepare(
    `INSERT INTO secrets (label, issuer, encrypted_secret, iv, auth_tag, algorithm, digits, period, added_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(label, issuer, encrypted, iv, authTag, algorithm, digits, period, session.userId);

  logAudit(session.userId, 'secret_added', result.lastInsertRowid as number, ip);

  return NextResponse.json({ id: result.lastInsertRowid, label, issuer }, { status: 201 });
}
