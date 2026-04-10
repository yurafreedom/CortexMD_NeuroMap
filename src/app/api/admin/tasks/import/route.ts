import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-session';
import { createSupabaseAdmin } from '@/lib/supabase-server';
import { parseClaudeCodeReport, detectCategory, titleHash } from '@/lib/admin/claudeCodeParser';

export async function POST(req: NextRequest) {
  // Auth check
  const session = await getAdminSession();
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const {
    report_text,
    auto_categorize = true,
    mark_done = true,
    default_category,
  } = body as {
    source?: string;
    report_text?: string;
    auto_categorize?: boolean;
    mark_done?: boolean;
    default_category?: string;
  };

  if (!report_text || typeof report_text !== 'string' || !report_text.trim()) {
    return NextResponse.json({ error: 'report_text is required' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  // Fetch categories for matching
  const { data: categories } = await supabase
    .from('admin_task_categories')
    .select('id, name');
  const catMap = new Map(
    ((categories || []) as Array<{ id: string; name: string }>).map(c => [c.name, c.id])
  );

  // Fetch existing task titles for deduplication
  const { data: existingTasks } = await supabase
    .from('admin_tasks')
    .select('title');
  const existingHashes = new Set(
    ((existingTasks || []) as Array<{ title: string }>).map(t => titleHash(t.title))
  );

  // Parse report
  const parsed = parseClaudeCodeReport(report_text);

  let created = 0;
  let skipped = 0;
  const createdTasks: Array<{ title: string; category?: string }> = [];

  for (const task of parsed) {
    // Deduplication by title hash
    const hash = titleHash(task.title);
    if (existingHashes.has(hash)) {
      skipped++;
      continue;
    }

    // Resolve category
    let category_id: string | null = null;
    if (auto_categorize && task.detected_category) {
      category_id = catMap.get(task.detected_category) ?? null;
    }
    if (!category_id && default_category) {
      category_id = catMap.get(default_category) ?? null;
    }

    // Build description from subtasks and files
    const descParts: string[] = [];
    if (task.subtasks.length > 0) {
      descParts.push(task.subtasks.map(s => `- ${s}`).join('\n'));
    }
    if (task.files_changed.length > 0) {
      descParts.push(`Files: ${task.files_changed.join(', ')}`);
    }

    const { error } = await supabase.from('admin_tasks').insert({
      title: task.title,
      status: mark_done ? 'done' : 'open',
      closed_at: mark_done ? new Date().toISOString() : null,
      priority: 'medium',
      category_id,
    });

    if (error) {
      // Skip on insert error (e.g., constraint violation)
      skipped++;
      continue;
    }

    existingHashes.add(hash);
    created++;
    createdTasks.push({
      title: task.title,
      category: task.detected_category || undefined,
    });
  }

  return NextResponse.json({ created, skipped, tasks: createdTasks });
}
