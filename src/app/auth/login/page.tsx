'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const { signInWithGoogle, signInWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleGoogle() {
    try { await signInWithGoogle(); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Ошибка'); }
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    try { await signInWithEmail(email); setSent(true); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Ошибка'); }
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#080b12', color: '#f0f2f5', fontFamily: 'var(--font-body)', gap: 24
    }}>
      <div style={{
        background: 'rgba(13,17,23,0.9)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16, padding: '40px 32px', width: 360, textAlign: 'center',
        backdropFilter: 'blur(30px)'
      }}>
        <h1 style={{
          fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 700, marginBottom: 4,
          background: 'linear-gradient(135deg,#6ee7b7,#818cf8)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>CortexMD</h1>
        <p style={{ fontSize: 11, color: '#5a6478', marginBottom: 32, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Нейрофармакологическая карта
        </p>

        <button onClick={handleGoogle} style={{
          width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.05)', color: '#f0f2f5', fontSize: 14, cursor: 'pointer',
          marginBottom: 16, transition: 'background 0.2s'
        }}>
          Войти через Google
        </button>

        <div style={{ fontSize: 11, color: '#5a6478', margin: '16px 0' }}>или</div>

        {sent ? (
          <p style={{ color: '#6ee7b7', fontSize: 13 }}>Проверьте почту — мы отправили ссылку для входа</p>
        ) : (
          <form onSubmit={handleEmail} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Email" required
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
                background: '#1a1f2e', color: '#f0f2f5', fontSize: 13, outline: 'none'
              }}
            />
            <button type="submit" style={{
              padding: '10px 16px', borderRadius: 8, border: 'none',
              background: 'linear-gradient(135deg,#6ee7b7,#818cf8)', color: '#080b12',
              fontSize: 13, fontWeight: 600, cursor: 'pointer'
            }}>
              Отправить ссылку
            </button>
          </form>
        )}

        {error && <p style={{ color: '#ef4444', fontSize: 11, marginTop: 12 }}>{error}</p>}

        <button onClick={() => router.push('/')} style={{
          marginTop: 24, background: 'none', border: 'none', color: '#5a6478',
          fontSize: 11, cursor: 'pointer', textDecoration: 'underline'
        }}>
          Продолжить без регистрации
        </button>
      </div>
    </div>
  );
}
