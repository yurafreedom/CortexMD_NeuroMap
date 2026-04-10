import { createSupabaseAdmin } from '@/lib/supabase-server';
import AdminDashboard from './AdminDashboard';

export const dynamic = 'force-dynamic';

export interface AdminTask {
  id: string;
  title: string;
  status: 'open' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  closed_at: string | null;
  category_id: string | null;
}

export interface AdminCategory {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  is_custom: boolean;
  sort_order: number;
}

export default async function AdminPage() {
  const supabase = createSupabaseAdmin();

  const [{ data: tasks }, { data: categories }] = await Promise.all([
    supabase.from('admin_tasks').select('*').order('created_at', { ascending: false }),
    supabase.from('admin_task_categories').select('*').order('sort_order', { ascending: true }),
  ]);

  return (
    <AdminDashboard
      initialTasks={(tasks as AdminTask[]) || []}
      initialCategories={(categories as AdminCategory[]) || []}
    />
  );
}
