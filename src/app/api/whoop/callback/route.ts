import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSupabaseServer, createSupabaseAdmin } from '@/lib/supabase-server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // User denied access
  if (error || !code) {
    redirect('/?whoop=denied');
  }

  // Verify CSRF state
  const cookieStore = await cookies();
  const savedState = cookieStore.get('whoop_oauth_state')?.value;
  cookieStore.delete('whoop_oauth_state');

  if (!state || state !== savedState) {
    redirect('/?whoop=error&reason=state_mismatch');
  }

  // Verify authenticated user
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  // Exchange code for tokens
  const tokenRes = await fetch('https://api.prod.whoop.com/oauth/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: process.env.WHOOP_CLIENT_ID!,
      client_secret: process.env.WHOOP_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/whoop/callback`,
    }),
  });

  if (!tokenRes.ok) {
    redirect('/?whoop=error&reason=token_exchange');
  }

  const tokens = await tokenRes.json();

  // Store tokens via admin client (bypasses RLS for upsert)
  const admin = createSupabaseAdmin();
  const { error: dbError } = await admin.from('integrations').upsert(
    {
      user_id: user.id,
      provider: 'whoop',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,provider' }
  );

  if (dbError) {
    console.error('Failed to save Whoop tokens:', dbError.message);
    redirect('/?whoop=error&reason=db');
  }

  redirect('/?whoop=connected');
}
