import { createSupabaseServer, createSupabaseAdmin } from '@/lib/supabase-server';

export async function POST() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from('integrations')
    .delete()
    .eq('user_id', user.id)
    .eq('provider', 'whoop');

  if (error) {
    return Response.json({ error: 'Failed to disconnect' }, { status: 500 });
  }

  return Response.json({ success: true });
}
