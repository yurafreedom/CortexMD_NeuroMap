import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { getAdminSession } from '@/lib/admin-session';

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.error('[admin-login] ADMIN_PASSWORD not set');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  const submitted = Buffer.from(String(password));
  const expected = Buffer.from(adminPassword);
  const match = submitted.length === expected.length &&
                timingSafeEqual(submitted, expected);

  if (!match) {
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
  }

  const session = await getAdminSession();
  session.isAdmin = true;
  await session.save();

  return NextResponse.json({ ok: true });
}
