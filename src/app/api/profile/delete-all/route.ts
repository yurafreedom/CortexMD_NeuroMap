import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';

const USER_SCOPED_TABLES = [
  'user_genetic_profile',
  'user_lab_results',
  'user_symptom_scores',
  'user_treatment_history',
  'user_presets',
  'schemes',
  'scheme_history',
  'deficits',
  'integrations',
  'ai_audit_log',
] as const;

export async function POST() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const errors: { table: string; message: string }[] = [];

  for (const table of USER_SCOPED_TABLES) {
    const { error } = await supabase.from(table).delete().eq('user_id', user.id);
    if (error) {
      errors.push({ table, message: error.message });
    }
  }

  if (errors.length > 0) {
    return NextResponse.json(
      { error: 'Partial deletion', details: errors },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
