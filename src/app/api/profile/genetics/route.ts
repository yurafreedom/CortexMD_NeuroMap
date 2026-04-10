import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  const payload = {
    user_id: user.id,
    cyp2d6_phenotype: body.cyp2d6_phenotype || null,
    cyp2c19_phenotype: body.cyp2c19_phenotype || null,
    mthfr_c677t: body.mthfr_c677t || null,
    comt_val158met: body.comt_val158met || null,
    bdnf_val66met: body.bdnf_val66met || null,
    httlpr_5: body.httlpr_5 || null,
    hla_b1502: body.hla_b1502 ?? null,
    hla_b5701: body.hla_b5701 ?? null,
    source: body.source || 'manual',
  };

  const { data, error } = await supabase
    .from('user_genetic_profile')
    .upsert(payload, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}
