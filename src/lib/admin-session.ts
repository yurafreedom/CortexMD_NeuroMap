import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

export interface AdminSession {
  isAdmin?: boolean;
}

function getSessionPassword(): string {
  const password = process.env.ADMIN_SESSION_SECRET;
  if (!password || password.length < 32) {
    throw new Error(
      'ADMIN_SESSION_SECRET environment variable must be set and at least 32 characters long.'
    );
  }
  return password;
}

const sessionOptions = {
  password: getSessionPassword(),
  cookieName: 'cortexmd_admin',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 8, // 8 hours
  },
};

export async function getAdminSession() {
  const cookieStore = await cookies();
  return getIronSession<AdminSession>(cookieStore, sessionOptions);
}
