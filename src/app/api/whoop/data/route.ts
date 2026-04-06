import { createSupabaseServer, createSupabaseAdmin } from '@/lib/supabase-server';

async function refreshWhoopToken(integrationId: string, refreshToken: string): Promise<string | null> {
  const res = await fetch('https://api.prod.whoop.com/oauth/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: process.env.WHOOP_CLIENT_ID!,
      client_secret: process.env.WHOOP_CLIENT_SECRET!,
    }),
  });

  if (!res.ok) return null;

  const tokens = await res.json();
  const admin = createSupabaseAdmin();

  await admin.from('integrations').update({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('id', integrationId);

  return tokens.access_token;
}

async function getWhoopToken(userId: string): Promise<string | null> {
  const admin = createSupabaseAdmin();

  const { data } = await admin
    .from('integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'whoop')
    .single();

  if (!data) return null;

  // Refresh if token expires within 5 minutes
  const expiresAt = new Date(data.expires_at).getTime();
  const buffer = 5 * 60 * 1000;

  if (expiresAt - Date.now() < buffer) {
    return refreshWhoopToken(data.id, data.refresh_token);
  }

  return data.access_token;
}

async function whoopFetch(token: string, endpoint: string) {
  const res = await fetch(`https://api.prod.whoop.com/developer${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 900 }, // Cache for 15 minutes
  });

  if (!res.ok) {
    throw new Error(`Whoop API ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

export async function GET(request: Request) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  const token = await getWhoopToken(user.id);
  if (!token) {
    return Response.json({ error: 'Whoop not connected', connected: false }, { status: 401 });
  }

  try {
    let data;
    switch (type) {
      case 'recovery':
        data = await whoopFetch(token, '/v1/recovery?limit=7');
        break;
      case 'sleep':
        data = await whoopFetch(token, '/v1/activity/sleep?limit=7');
        break;
      case 'cycles':
        data = await whoopFetch(token, '/v1/cycle?limit=7');
        break;
      case 'body':
        data = await whoopFetch(token, '/v1/user/measurement/body');
        break;
      case 'profile':
        data = await whoopFetch(token, '/v1/user/profile/basic');
        break;
      case 'status':
        // Just check if connected — token was already validated above
        return Response.json({ connected: true });
      default:
        return Response.json({ error: 'Invalid type. Use: recovery, sleep, cycles, body, profile, status' }, { status: 400 });
    }

    return Response.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Whoop API error';
    return Response.json({ error: message }, { status: 502 });
  }
}
