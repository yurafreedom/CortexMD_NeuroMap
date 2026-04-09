import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import type { AdminSession } from '@/lib/admin-session';

export async function proxy(req: NextRequest) {
  const res = NextResponse.next();
  const session = await getIronSession<AdminSession>(req, res, {
    password: process.env.ADMIN_SESSION_SECRET || 'complex_password_at_least_32_characters_long_fallback',
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
