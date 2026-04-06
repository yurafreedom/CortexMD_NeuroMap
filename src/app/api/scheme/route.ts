import { NextRequest, NextResponse } from 'next/server';
// import { supabase } from '@/lib/supabase';

// TODO: Replace placeholder responses with actual Supabase queries

export async function GET() {
  // Placeholder: return empty scheme
  // const { data, error } = await supabase
  //   .from('schemes')
  //   .select('*')
  //   .eq('user_id', userId)
  //   .single();
  return NextResponse.json({ scheme: {}, message: 'Placeholder: Supabase not connected yet' });
}

export async function POST(request: NextRequest) {
  // Placeholder: acknowledge save
  const body = await request.json();
  // const { error } = await supabase
  //   .from('schemes')
  //   .upsert({ user_id: userId, drugs: body.scheme });
  return NextResponse.json({
    success: true,
    message: 'Placeholder: scheme received but not persisted',
    received: body,
  });
}
