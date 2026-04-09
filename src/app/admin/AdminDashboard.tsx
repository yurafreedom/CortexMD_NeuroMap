'use client';

import { useOptimistic, useRef, useState, useTransition } from 'react';
import { addTask, closeTask, reopenTask, deleteTask } from './actions';

interface AdminTask {
  id: string;
  title: string;
  status: 'open' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  closed_at: string | null;
}

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
  | { type: 'delete'; id: string };

export default function AdminDashboard({ initialTasks }: { initialTasks: AdminTask[] }) {
  const [filter, setFilter] = useState<'all' | 'open' | 'done'>('all');
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
        default:
          return state;
      }
    }
  );

  const filtered = optimisticTasks.filter(t => filter === 'all' || t.status === filter);
  const openCount = optimisticTasks.filter(t => t.status === 'open').length;
  const doneCount = optimisticTasks.filter(t => t.status === 'done').length;

  const handleAdd = (formData: FormData) => {
    const title = formData.get('title') as string;
    const priority = formData.get('priority') as string;
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

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-deep, #080b12)',
      padding: '24px 32px', color: '#f0f2f5',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 24,
      }}>
        <div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 24, fontWeight: 700 }}>
            CortexMD Tasks
          </div>
          <div style={{ fontSize: 12, color: '#5a6478', marginTop: 4 }}>
            {openCount} open &middot; {doneCount} done
          </div>
        </div>
        <button onClick={handleLogout} style={{
          padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
          background: 'transparent', color: '#5a6478', fontSize: 12, cursor: 'pointer',
        }}>
          Logout
        </button>
      </div>

      {/* Add task form */}
      <form ref={formRef} action={handleAdd} style={{
        display: 'flex', gap: 8, marginBottom: 20,
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
        <select name="priority" defaultValue="medium" style={{
          padding: '10px 12px', borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'var(--bg-surface, #1a1f2e)',
          color: '#f0f2f5', fontSize: 12, outline: 'none',
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

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {(['all', 'open', 'done'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 14px', borderRadius: 6, border: 'none',
            background: filter === f ? 'rgba(255,255,255,0.08)' : 'transparent',
            color: filter === f ? '#f0f2f5' : '#5a6478',
            fontSize: 12, fontWeight: 500, cursor: 'pointer',
            textTransform: 'capitalize',
          }}>
            {f} {f === 'open' ? `(${openCount})` : f === 'done' ? `(${doneCount})` : `(${optimisticTasks.length})`}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#334155', fontSize: 13 }}>
            No tasks
          </div>
        )}
        {filtered.map(task => (
          <div key={task.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px', borderRadius: 10,
            background: 'var(--bg-elevated, #141820)',
            border: '1px solid rgba(255,255,255,0.06)',
            opacity: task.status === 'done' ? 0.5 : 1,
            transition: 'all 200ms ease',
          }}>
            {/* Priority dot */}
            <div style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
              background: PRIORITY_COLORS[task.priority],
            }} />

            {/* Checkbox */}
            <button onClick={() => task.status === 'open' ? handleClose(task.id) : handleReopen(task.id)} style={{
              width: 20, height: 20, borderRadius: 4, flexShrink: 0,
              border: `1.5px solid ${task.status === 'done' ? '#22c55e' : 'rgba(255,255,255,0.15)'}`,
              background: task.status === 'done' ? 'rgba(34,197,94,0.15)' : 'transparent',
              color: '#22c55e', fontSize: 12, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {task.status === 'done' ? '\u2713' : ''}
            </button>

            {/* Title */}
            <div style={{
              flex: 1, fontSize: 13,
              textDecoration: task.status === 'done' ? 'line-through' : 'none',
              color: task.status === 'done' ? '#5a6478' : '#f0f2f5',
            }}>
              {task.title}
            </div>

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
        ))}
      </div>
    </div>
  );
}
