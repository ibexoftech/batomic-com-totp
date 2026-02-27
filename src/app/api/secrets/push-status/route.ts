import { NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/auth';
import { getPushStatuses } from '@/lib/firebase-pusher';

export async function GET() {
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  return NextResponse.json(getPushStatuses());
}
