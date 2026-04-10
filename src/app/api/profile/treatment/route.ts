import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { drug_id, dose_mg, started_at, ended_at, reason_for_change, effectiveness, side_effects } = body;

  if (!drug_id || dose_mg == null || !started_at) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('user_treatment_history')
    .insert({
      user_id: user.id,
      drug_id,
      dose_mg: Number(dose_mg),
      started_at,
      ended_at: ended_at || null,
      reason_for_change: reason_for_change || null,
      effectiveness: effectiveness ? Number(effectiveness) : null,
      side_effects: side_effects || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}
