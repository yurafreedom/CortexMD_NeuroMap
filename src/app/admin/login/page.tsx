'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push('/admin');
    } else {
      const data = await res.json();
      setError(data.error || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-deep, #080b12)',
    }}>
      <form onSubmit={handleSubmit} style={{
        width: 360, padding: 32, borderRadius: 16,
        background: 'var(--bg-elevated, #141820)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
      }}>
        <div style={{
          fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700,
          color: '#f0f2f5', marginBottom: 8, textAlign: 'center',
        }}>
          CortexMD Admin
        </div>
        <div style={{ fontSize: 12, color: '#5a6478', marginBottom: 24, textAlign: 'center' }}>
          Enter admin password
        </div>

        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'var(--bg-surface, #1a1f2e)',
            color: '#f0f2f5', fontSize: 14, outline: 'none',
            fontFamily: 'var(--font-body)',
            marginBottom: 12,
            boxSizing: 'border-box',
          }}
        />

        {error && (
          <div style={{ fontSize: 12, color: '#ef4444', marginBottom: 12 }}>{error}</div>
        )}

        <button type="submit" disabled={loading || !password} style={{
          width: '100%', padding: '10px 20px', borderRadius: 10, border: 'none',
          background: loading ? '#334155' : 'linear-gradient(135deg,#6ee7b7,#818cf8)',
          color: '#080b12', fontSize: 14, fontWeight: 600,
          cursor: loading ? 'default' : 'pointer',
        }}>
          {loading ? '...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
