'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        router.push('/');
      }
    });
  }, [router]);

  return (
    <div className="auth-page">
      <div className="auth-loader">
        <Loader2 size={24} className="auth-spinner" style={{ color: '#60a5fa' }} />
        <p style={{ marginTop: 16, fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
          Авторизация...
        </p>
      </div>
    </div>
  );
}
