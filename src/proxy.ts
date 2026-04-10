import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import type { AdminSession } from '@/lib/admin-session';

export async function proxy(req: NextRequest) {
  const res = NextResponse.next();
  const password = process.env.ADMIN_SESSION_SECRET;
  if (!password || password.length < 32) {
    throw new Error(
      'ADMIN_SESSION_SECRET environment variable must be set and at least 32 characters long.'
    );
  }
  const session = await getIronSession<AdminSession>(req, res, {
    password,
    cookieName: 'cortexmd_admin',
  });

  if (!session.isAdmin) {
    const loginUrl = new URL('/admin/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  return res;
}

export const config = {
  matcher: ['/admin/((?!login).*)'],
};
