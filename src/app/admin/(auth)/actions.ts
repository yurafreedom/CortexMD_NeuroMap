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
  const category_id = (formData.get('category_id') as string) || null;
  if (!title?.trim()) throw new Error('Title required');

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from('admin_tasks').insert({
    title: title.trim(),
    priority,
    status: 'open',
    category_id: category_id || null,
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

export async function updateTaskCategory(taskId: string, categoryId: string | null) {
  await requireAdmin();
  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from('admin_tasks')
    .update({ category_id: categoryId || null })
    .eq('id', taskId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin');
}

export async function createCategory(name: string) {
  await requireAdmin();
  if (!name?.trim()) throw new Error('Name required');
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from('admin_task_categories')
    .insert({ name: name.trim(), is_custom: true, sort_order: 99 })
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath('/admin');
  return data;
}

export async function deleteCategory(id: string) {
  await requireAdmin();
  const supabase = createSupabaseAdmin();
  // Tasks with this category_id will be set to NULL via ON DELETE SET NULL
  const { error } = await supabase
    .from('admin_task_categories')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin');
}
