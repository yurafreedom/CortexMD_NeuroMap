'use server';

import { revalidatePath } from 'next/cache';
import { getAdminSession } from '@/lib/admin-session';
import { createSupabaseAdmin } from '@/lib/supabase-server';

async function requireAdmin() {
  const session = await getAdminSession();
  if (!session.isAdmin) throw new Error('Unauthorized');
}

export async function addTask(formData: FormData) {
  await requireAdmin();
  const title = formData.get('title') as string;
  const priority = (formData.get('priority') as string) || 'medium';
  if (!title?.trim()) throw new Error('Title required');

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from('admin_tasks').insert({
    title: title.trim(),
    priority,
    status: 'open',
  });
  if (error) throw new Error(error.message);
  revalidatePath('/admin');
}

export async function closeTask(id: string) {
  await requireAdmin();
  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from('admin_tasks')
    .update({ status: 'done', closed_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin');
}

export async function reopenTask(id: string) {
  await requireAdmin();
  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from('admin_tasks')
    .update({ status: 'open', closed_at: null })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin');
}

export async function deleteTask(id: string) {
  await requireAdmin();
  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from('admin_tasks')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin');
}
