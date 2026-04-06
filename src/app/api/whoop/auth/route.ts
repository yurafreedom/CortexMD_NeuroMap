import { cookies } from 'next/headers';
import { createSupabaseServer } from '@/lib/supabase-server';

export async function GET() {
  // Verify the user is authenticated
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Generate CSRF state token
  const state = crypto.randomUUID();

  // Store state in a short-lived cookie for verification in callback
  const cookieStore = await cookies();
  cookieStore.set('whoop_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  });

  const params = new URLSearchParams({
    client_id: process.env.WHOOP_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/whoop/callback`,
    response_type: 'code',
    scope: 'read:recovery read:sleep read:cycles read:profile read:body_measurement',
    state,
  });

  return Response.redirect(
    `https://api.prod.whoop.com/oauth/oauth2/auth?${params}`
  );
}
