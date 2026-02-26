import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionFromCookie } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await getSessionFromCookie();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '50')));
  const offset = (page - 1) * limit;
  const action = searchParams.get('action');
  const userId = searchParams.get('user_id');

  const db = getDb();
  let where = 'WHERE 1=1';
  const params: (string | number)[] = [];

  if (action) {
    where += ' AND a.action = ?';
    params.push(action);
  }
  if (userId) {
    where += ' AND a.user_id = ?';
    params.push(Number(userId));
  }

  const countRow = db.prepare(
    `SELECT COUNT(*) as total FROM audit_log a ${where}`
  ).get(...params) as { total: number };

  const rows = db.prepare(
    `SELECT a.*, u.username FROM audit_log a LEFT JOIN users u ON a.user_id = u.id ${where} ORDER BY a.timestamp DESC LIMIT ? OFFSET ?`
  ).all(...params, limit, offset);

  return NextResponse.json({
    entries: rows,
    total: countRow.total,
    page,
    limit,
    pages: Math.ceil(countRow.total / limit),
  });
}
