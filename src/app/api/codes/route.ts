import { NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/auth';
import { generateAllCodes } from '@/lib/totp';

export async function GET() {
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const codes = generateAllCodes();
  return NextResponse.json(codes);
}
