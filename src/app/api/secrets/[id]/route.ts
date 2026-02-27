import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionFromCookie } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();
  const secret = db.prepare(
    `SELECT id, label, issuer, algorithm, digits, period, added_by, created_at,
            firebase_enabled, firebase_url, firebase_api_key, firebase_token_target
     FROM secrets WHERE id = ?`
  ).get(Number(id));

  if (!secret) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(secret);
}

const ALLOWED_FIREBASE_FIELDS = ['firebase_enabled', 'firebase_url', 'firebase_api_key', 'firebase_token_target'] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const { id } = await params;
  const secretId = Number(id);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const setClauses: string[] = [];
  const values: unknown[] = [];

  for (const field of ALLOWED_FIREBASE_FIELDS) {
    if (field in body) {
      setClauses.push(`${field} = ?`);
      values.push(body[field]);
    }
  }

  if (setClauses.length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  values.push(secretId);
  const db = getDb();
  const result = db.prepare(
    `UPDATE secrets SET ${setClauses.join(', ')} WHERE id = ?`
  ).run(...values);

  if (result.changes === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  logAudit(session.userId, 'secret_firebase_updated', secretId, ip);

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const { id } = await params;
  const secretId = Number(id);

  const db = getDb();
  const result = db.prepare('DELETE FROM secrets WHERE id = ?').run(secretId);

  if (result.changes === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  logAudit(session.userId, 'secret_deleted', secretId, ip);

  return NextResponse.json({ ok: true });
}
