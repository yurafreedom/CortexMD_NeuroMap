import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase-server';
import ProfileDashboard from './ProfileDashboard';

export default async function ProfilePage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  // Fetch genetic profile if exists
  const { data: geneticProfile } = await supabase
    .from('user_genetic_profile')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Fetch recent lab results
  const { data: labResults } = await supabase
    .from('user_lab_results')
    .select('*')
    .eq('user_id', user.id)
    .order('test_date', { ascending: false })
    .limit(20);

  // Fetch symptom scores
  const { data: symptomScores } = await supabase
    .from('user_symptom_scores')
    .select('*')
    .eq('user_id', user.id)
    .order('assessed_at', { ascending: false })
    .limit(20);

  // Fetch treatment history
  const { data: treatmentHistory } = await supabase
    .from('user_treatment_history')
    .select('*')
    .eq('user_id', user.id)
    .order('start_date', { ascending: false })
    .limit(50);

  return (
    <ProfileDashboard
      user={{
        id: user.id,
        email: user.email ?? '',
        firstName: user.user_metadata?.first_name ?? '',
        lastName: user.user_metadata?.last_name ?? '',
        role: user.user_metadata?.role ?? null,
      }}
      geneticProfile={geneticProfile}
      labResults={labResults ?? []}
      symptomScores={symptomScores ?? []}
      treatmentHistory={treatmentHistory ?? []}
    />
  );
}
