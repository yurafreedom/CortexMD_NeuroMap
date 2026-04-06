'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {

  useEffect(() => {
    // Supabase парсит hash из URL и сохраняет сессию в cookies
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        window.location.href = '/';
      } else {
        window.location.href = '/auth?error=no_session';
      }
    });
  }, []);

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
