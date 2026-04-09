import { createSupabaseAdmin } from '@/lib/supabase-server';
import AdminDashboard from './AdminDashboard';

export const dynamic = 'force-dynamic';

interface AdminTask {
  id: string;
  title: string;
  status: 'open' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  closed_at: string | null;
}

export default async function AdminPage() {
  const supabase = createSupabaseAdmin();
  const { data: tasks } = await supabase
    .from('admin_tasks')
    .select('*')
    .order('created_at', { ascending: false });

  return <AdminDashboard initialTasks={(tasks as AdminTask[]) || []} />;
}
