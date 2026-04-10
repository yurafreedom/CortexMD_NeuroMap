'use client';

import { useOptimistic, useRef, useState, useTransition, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { addTask, closeTask, reopenTask, deleteTask, updateTaskCategory, createCategory, deleteCategory } from './actions';
import type { AdminTask, AdminCategory } from './page';

const PRIORITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#60a5fa',
  low: '#94a3b8',
};

const PRIORITY_LABELS: Record<string, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

type OptimisticAction =
  | { type: 'add'; task: AdminTask }
  | { type: 'close'; id: string }
  | { type: 'reopen'; id: string }
  | { type: 'delete'; id: string }
  | { type: 'set_category'; id: string; category_id: string | null };

interface Props {
  initialTasks: AdminTask[];
  initialCategories: AdminCategory[];
}

export default function AdminDashboard({ initialTasks, initialCategories }: Props) {
  const [filter, setFilter] = useState<'all' | 'done'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null); // null = all categories
  const [categories, setCategories] = useState(initialCategories);
  const [newCatName, setNewCatName] = useState('');
  const [showNewCat, setShowNewCat] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  const [optimisticTasks, dispatchOptimistic] = useOptimistic(
    initialTasks,
    (state: AdminTask[], action: OptimisticAction) => {
      switch (action.type) {
        case 'add':
          return [action.task, ...state];
        case 'close':
          return state.map(t => t.id === action.id ? { ...t, status: 'done' as const, closed_at: new Date().toISOString() } : t);
        case 'reopen':
          return state.map(t => t.id === action.id ? { ...t, status: 'open' as const, closed_at: null } : t);
        case 'delete':
          return state.filter(t => t.id !== action.id);
        case 'set_category':
          return state.map(t => t.id === action.id ? { ...t, category_id: action.category_id } : t);
        default:
          return state;
      }
    }
  );

  // Counts
  const openTasks = optimisticTasks.filter(t => t.status === 'open');
  const doneTasks = optimisticTasks.filter(t => t.status === 'done');
  const openCount = openTasks.length;
  const doneCount = doneTasks.length;

  // Category counts (open tasks only)
  const catCounts: Record<string, number> = {};
  let uncategorizedCount = 0;
  for (const t of openTasks) {
    if (t.category_id) {
      catCounts[t.category_id] = (catCounts[t.category_id] || 0) + 1;
    } else {
      uncategorizedCount++;
    }
  }

  // Filter tasks
  const baseList = filter === 'all' ? openTasks : doneTasks;
  const filtered = selectedCategory === null
    ? baseList
    : selectedCategory === 'uncategorized'
      ? baseList.filter(t => !t.category_id)
      : baseList.filter(t => t.category_id === selectedCategory);

  const handleAdd = (formData: FormData) => {
    const title = formData.get('title') as string;
    const priority = formData.get('priority') as string;
    const category_id = formData.get('category_id') as string;
    if (!title?.trim()) return;

    startTransition(async () => {
      dispatchOptimistic({
        type: 'add',
        task: {
          id: `temp-${Date.now()}`,
          title: title.trim(),
          priority: (priority || 'medium') as AdminTask['priority'],
          status: 'open',
          created_at: new Date().toISOString(),
          closed_at: null,
          category_id: category_id || null,
        },
      });
      formRef.current?.reset();
      await addTask(formData);
    });
  };

  const handleClose = (id: string) => {
    startTransition(async () => {
      dispatchOptimistic({ type: 'close', id });
      await closeTask(id);
    });
  };

  const handleReopen = (id: string) => {
    startTransition(async () => {
      dispatchOptimistic({ type: 'reopen', id });
      await reopenTask(id);
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      dispatchOptimistic({ type: 'delete', id });
      await deleteTask(id);
    });
  };

  const handleCategoryChange = (taskId: string, categoryId: string | null) => {
    startTransition(async () => {
      dispatchOptimistic({ type: 'set_category', id: taskId, category_id: categoryId });
      await updateTaskCategory(taskId, categoryId);
    });
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    const result = await createCategory(newCatName.trim());
    if (result) {
      setCategories(prev => [...prev, result as AdminCategory]);
    }
    setNewCatName('');
    setShowNewCat(false);
  };

  const handleDeleteCategory = async (id: string) => {
    await deleteCategory(id);
    setCategories(prev => prev.filter(c => c.id !== id));
    if (selectedCategory === id) setSelectedCategory(null);
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  };

  // Import modal state
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; skipped: number } | null>(null);

  const handleImport = useCallback(async () => {
    if (!importText.trim()) return;
    setImportLoading(true);
    setImportResult(null);
    try {
      const res = await fetch('/api/admin/tasks/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'manual',
          report_text: importText,
          auto_categorize: true,
          mark_done: true,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setImportResult({ created: data.created, skipped: data.skipped });
        if (data.created > 0) {
          // Reload to pick up new tasks
          setTimeout(() => window.location.reload(), 1500);
        }
      }
    } finally {
      setImportLoading(false);
    }
  }, [importText]);

  const getCategoryColor = (catId: string | null) => {
    if (!catId) return null;
    return categories.find(c => c.id === catId)?.color || null;
  };

  const getCategoryName = (catId: string | null) => {
    if (!catId) return null;
    return categories.find(c => c.id === catId)?.name || null;
  };

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '240px 1fr',
      height: '100vh', background: 'var(--bg-deep, #080b12)', color: '#f0f2f5',
    }}>
      {/* Category Sidebar */}
      <div style={{
        borderRight: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(13,17,23,0.6)',
        display: 'flex', flexDirection: 'column',
        padding: '16px 0', overflowY: 'auto',
      }}>
        <div style={{
          fontSize: 10, fontWeight: 600, color: '#5a6478', textTransform: 'uppercase',
          letterSpacing: '0.08em', padding: '4px 16px 8px',
        }}>
          Categories
        </div>

        {/* All categories */}
        <button
          onClick={() => setSelectedCategory(null)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 16px', border: 'none', cursor: 'pointer', width: '100%',
            background: selectedCategory === null ? 'rgba(255,255,255,0.06)' : 'transparent',
            color: selectedCategory === null ? '#f0f2f5' : '#9ba3b5',
            fontSize: 12, fontWeight: selectedCategory === null ? 600 : 400,
            textAlign: 'left', transition: 'all 150ms',
          }}
        >
          <span>All categories</span>
          <span style={{ fontSize: 10, color: '#5a6478', fontFamily: 'var(--font-mono)' }}>{openCount}</span>
        </button>

        {/* Category list */}
        {categories.map(cat => (
          <div key={cat.id} style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
            <button
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flex: 1, padding: '7px 16px', border: 'none', cursor: 'pointer',
                background: selectedCategory === cat.id ? 'rgba(255,255,255,0.06)' : 'transparent',
                color: selectedCategory === cat.id ? '#f0f2f5' : '#9ba3b5',
                fontSize: 12, fontWeight: selectedCategory === cat.id ? 600 : 400,
                textAlign: 'left', transition: 'all 150ms', gap: 8,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: cat.color || '#5a6478',
                }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {cat.name}
                </span>
              </span>
              <span style={{ fontSize: 10, color: '#5a6478', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                {catCounts[cat.id] || 0}
              </span>
            </button>
            {cat.is_custom && (
              <button
                onClick={() => handleDeleteCategory(cat.id)}
                style={{
                  position: 'absolute', right: 4, background: 'none', border: 'none',
                  color: '#334155', fontSize: 14, cursor: 'pointer', padding: '0 4px',
                  opacity: 0.5,
                }}
                title="Delete category"
              >
                &times;
              </button>
            )}
          </div>
        ))}

        {/* Uncategorized */}
        <button
          onClick={() => setSelectedCategory('uncategorized')}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '7px 16px', border: 'none', cursor: 'pointer', width: '100%',
            background: selectedCategory === 'uncategorized' ? 'rgba(255,255,255,0.06)' : 'transparent',
            color: selectedCategory === 'uncategorized' ? '#f0f2f5' : '#5a6478',
            fontSize: 12, fontStyle: 'italic', textAlign: 'left',
            transition: 'all 150ms', marginTop: 4,
            borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 12,
          }}
        >
          <span>Uncategorized</span>
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)' }}>{uncategorizedCount}</span>
        </button>

        {/* New category */}
        <div style={{ padding: '8px 12px', marginTop: 8 }}>
          {showNewCat ? (
            <div style={{ display: 'flex', gap: 4 }}>
              <input
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateCategory()}
                placeholder="Category name"
                autoFocus
                style={{
                  flex: 1, padding: '5px 8px', borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'var(--bg-surface, #1a1f2e)',
                  color: '#f0f2f5', fontSize: 11, outline: 'none',
                  fontFamily: 'var(--font-body)',
                }}
              />
              <button onClick={handleCreateCategory} style={{
                padding: '4px 8px', borderRadius: 6, border: 'none',
                background: 'rgba(96,165,250,0.15)', color: '#60a5fa',
                fontSize: 11, cursor: 'pointer',
              }}>
                Add
              </button>
              <button onClick={() => { setShowNewCat(false); setNewCatName(''); }} style={{
                padding: '4px 6px', borderRadius: 6, border: 'none',
                background: 'transparent', color: '#5a6478',
                fontSize: 14, cursor: 'pointer',
              }}>
                &times;
              </button>
            </div>
          ) : (
            <button onClick={() => setShowNewCat(true)} style={{
              width: '100%', padding: '6px 8px', borderRadius: 6,
              border: '1px dashed rgba(255,255,255,0.08)',
              background: 'transparent', color: '#5a6478',
              fontSize: 11, cursor: 'pointer', textAlign: 'left',
            }}>
              + New category
            </button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        {/* Header — flex-shrink: 0 */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 32px', flexShrink: 0,
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 24, fontWeight: 700 }}>
              CortexMD Tasks
            </div>
            <div style={{ fontSize: 12, color: '#5a6478', marginTop: 4 }}>
              {openCount} open &middot; {doneCount} done
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setImportOpen(true)} style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(96,165,250,0.2)',
              background: 'rgba(96,165,250,0.06)', color: '#60a5fa', fontSize: 12, cursor: 'pointer',
              fontWeight: 500,
            }}>
              Import from Claude Code
            </button>
            <button onClick={handleLogout} style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
              background: 'transparent', color: '#5a6478', fontSize: 12, cursor: 'pointer',
            }}>
              Logout
            </button>
          </div>
        </div>

        {/* Centered content wrapper */}
        <div style={{
          display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0,
          maxWidth: 840, width: '100%', margin: '0 auto', padding: '0 24px',
        }}>
          {/* Add task form — flex-shrink: 0 */}
          <form ref={formRef} action={handleAdd} style={{
            display: 'flex', gap: 8, marginBottom: 16, flexShrink: 0,
            padding: 16, borderRadius: 12,
            background: 'var(--bg-elevated, #141820)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <input
              name="title"
              placeholder="New task..."
              autoFocus
              required
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'var(--bg-surface, #1a1f2e)',
                color: '#f0f2f5', fontSize: 13, outline: 'none',
                fontFamily: 'var(--font-body)',
              }}
            />
            <select name="category_id" defaultValue="" style={{
              padding: '10px 8px', borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'var(--bg-surface, #1a1f2e)',
              color: '#f0f2f5', fontSize: 11, outline: 'none',
              maxWidth: 140,
            }}>
              <option value="">No category</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select name="priority" defaultValue="medium" style={{
              padding: '10px 8px', borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'var(--bg-surface, #1a1f2e)',
              color: '#f0f2f5', fontSize: 11, outline: 'none',
            }}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <button type="submit" disabled={isPending} style={{
              padding: '10px 20px', borderRadius: 8, border: 'none',
              background: 'linear-gradient(135deg,#6ee7b7,#818cf8)',
              color: '#080b12', fontSize: 13, fontWeight: 600,
              cursor: isPending ? 'default' : 'pointer',
              opacity: isPending ? 0.6 : 1,
            }}>
              Add
            </button>
          </form>

          {/* Filter tabs — flex-shrink: 0 */}
          <div style={{ display: 'flex', gap: 4, paddingBottom: 12, flexShrink: 0 }}>
            <button onClick={() => setFilter('all')} style={{
              padding: '6px 14px', borderRadius: 6, border: 'none',
              background: filter === 'all' ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: filter === 'all' ? '#f0f2f5' : '#5a6478',
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
            }}>
              All ({openCount})
            </button>
            <button onClick={() => setFilter('done')} style={{
              padding: '6px 14px', borderRadius: 6, border: 'none',
              background: filter === 'done' ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: filter === 'done' ? '#f0f2f5' : '#5a6478',
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
            }}>
              Done ({doneCount})
            </button>
          </div>

          {/* Task list — flex: 1, scrollable */}
          <div style={{
            flex: 1, minHeight: 0, overflowY: 'auto',
            display: 'flex', flexDirection: 'column', gap: 6,
            paddingBottom: 24,
          }}>
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: '#334155', fontSize: 13 }}>
                No tasks
              </div>
            )}
            {filtered.map(task => {
              const catColor = getCategoryColor(task.category_id);
              const catName = getCategoryName(task.category_id);
              return (
                <div key={task.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 16px', borderRadius: 10,
                  background: 'var(--bg-elevated, #141820)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  opacity: task.status === 'done' ? 0.5 : 1,
                  transition: 'opacity 150ms ease',
                  flexShrink: 0,
                }}>
                  {/* Priority dot */}
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: PRIORITY_COLORS[task.priority],
                  }} />

                  {/* Checkbox / Restore */}
                  {task.status === 'open' ? (
                    <button onClick={() => handleClose(task.id)} style={{
                      width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                      border: '1.5px solid rgba(255,255,255,0.15)',
                      background: 'transparent',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }} />
                  ) : (
                    <button onClick={() => handleReopen(task.id)} style={{
                      padding: '3px 8px', borderRadius: 4, flexShrink: 0,
                      border: '1px solid rgba(96,165,250,0.3)',
                      background: 'rgba(96,165,250,0.08)',
                      color: '#60a5fa', fontSize: 10, fontWeight: 500, cursor: 'pointer',
                    }}>
                      Restore
                    </button>
                  )}

                  {/* Title */}
                  <div style={{
                    flex: 1, fontSize: 13, minWidth: 0,
                    textDecoration: task.status === 'done' ? 'line-through' : 'none',
                    color: task.status === 'done' ? '#5a6478' : '#f0f2f5',
                  }}>
                    {task.title}
                  </div>

                  {/* Category badge */}
                  {catName && (
                    <span style={{
                      fontSize: 9, padding: '2px 7px', borderRadius: 4,
                      background: `${catColor}15`, color: catColor || '#5a6478',
                      fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap',
                    }}>
                      {catName}
                    </span>
                  )}

                  {/* Category dropdown (open tasks only) */}
                  {task.status === 'open' && (
                    <select
                      value={task.category_id || ''}
                      onChange={e => handleCategoryChange(task.id, e.target.value || null)}
                      style={{
                        padding: '2px 4px', borderRadius: 4,
                        border: '1px solid rgba(255,255,255,0.06)',
                        background: 'var(--bg-surface, #1a1f2e)',
                        color: '#5a6478', fontSize: 9, outline: 'none',
                        maxWidth: 80, flexShrink: 0, cursor: 'pointer',
                      }}
                      title="Change category"
                    >
                      <option value="">—</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  )}

                  {/* Priority badge */}
                  <span style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 4,
                    background: `${PRIORITY_COLORS[task.priority]}15`,
                    color: PRIORITY_COLORS[task.priority],
                    fontWeight: 600, flexShrink: 0,
                  }}>
                    {PRIORITY_LABELS[task.priority]}
                  </span>

                  {/* Date */}
                  <span style={{ fontSize: 10, color: '#334155', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                    {new Date(task.created_at).toLocaleDateString()}
                  </span>

                  {/* Delete */}
                  <button onClick={() => handleDelete(task.id)} style={{
                    background: 'none', border: 'none', color: '#334155',
                    fontSize: 16, cursor: 'pointer', padding: '0 4px',
                    opacity: 0.6, flexShrink: 0,
                  }}>
                    &times;
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Import Modal */}
      {importOpen && createPortal(
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={e => { if (e.target === e.currentTarget) { setImportOpen(false); setImportResult(null); setImportText(''); } }}
        >
          <div style={{
            width: 'min(640px, 90vw)', maxHeight: '80vh',
            background: 'var(--bg-elevated, #141820)', borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            {/* Modal header */}
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexShrink: 0,
            }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#f0f2f5' }}>
                  Import from Claude Code
                </div>
                <div style={{ fontSize: 11, color: '#5a6478', marginTop: 2 }}>
                  Paste a task report. Tasks will be parsed, auto-categorized, and marked as done.
                </div>
              </div>
              <button
                onClick={() => { setImportOpen(false); setImportResult(null); setImportText(''); }}
                style={{ background: 'none', border: 'none', color: '#5a6478', fontSize: 20, cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            {/* Modal body */}
            <div style={{ padding: 20, flex: 1, minHeight: 0, overflow: 'auto' }}>
              <textarea
                value={importText}
                onChange={e => setImportText(e.target.value)}
                placeholder={"Paste Claude Code report here...\n\nExample:\nTask 3 complete. 116 drugs added.\n- TCAs (5): clomipramine, imipramine...\n- Files: src/data/drugs.v2.ts"}
                style={{
                  width: '100%', height: 260, padding: 14, borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'var(--bg-surface, #1a1f2e)',
                  color: '#f0f2f5', fontSize: 12, outline: 'none', resize: 'vertical',
                  fontFamily: 'var(--font-mono)', lineHeight: 1.6,
                  boxSizing: 'border-box',
                }}
              />

              {importResult && (
                <div style={{
                  marginTop: 12, padding: '10px 14px', borderRadius: 8,
                  background: importResult.created > 0 ? 'rgba(34,197,94,0.1)' : 'rgba(251,191,36,0.1)',
                  border: `1px solid ${importResult.created > 0 ? 'rgba(34,197,94,0.2)' : 'rgba(251,191,36,0.2)'}`,
                  fontSize: 12,
                  color: importResult.created > 0 ? '#22c55e' : '#fbbf24',
                }}>
                  Created {importResult.created} task{importResult.created !== 1 ? 's' : ''}
                  {importResult.skipped > 0 && `, skipped ${importResult.skipped} duplicate${importResult.skipped !== 1 ? 's' : ''}`}
                  {importResult.created > 0 && ' — reloading...'}
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div style={{
              padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', justifyContent: 'flex-end', gap: 8, flexShrink: 0,
            }}>
              <button
                onClick={() => { setImportOpen(false); setImportResult(null); setImportText(''); }}
                style={{
                  padding: '8px 16px', borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'transparent', color: '#5a6478', fontSize: 12, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={importLoading || !importText.trim()}
                style={{
                  padding: '8px 20px', borderRadius: 8, border: 'none',
                  background: importLoading ? '#334155' : 'linear-gradient(135deg,#6ee7b7,#818cf8)',
                  color: '#080b12', fontSize: 12, fontWeight: 600,
                  cursor: importLoading ? 'default' : 'pointer',
                  opacity: !importText.trim() ? 0.5 : 1,
                }}
              >
                {importLoading ? 'Importing...' : 'Import'}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
