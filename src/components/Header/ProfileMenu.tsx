'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Settings, LogOut, Link } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function ProfileMenu() {
  const { user, profile, signOut, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (loading || !user) return null;

  const initials =
    (profile.firstName?.[0] || '') + (profile.lastName?.[0] || '');
  const displayName = profile.firstName || user.email?.split('@')[0] || '';

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth');
  };

  return (
    <div ref={ref} className="profile-menu-wrap">
      <button
        className="profile-trigger"
        onClick={() => setOpen(!open)}
      >
        <div className="profile-avatar">
          {initials || <User size={14} />}
        </div>
        <span className="profile-name">{displayName}</span>
      </button>

      {open && (
        <div className="profile-dropdown">
          <div className="profile-dd-header">
            <div className="profile-dd-name">
              {profile.firstName} {profile.lastName}
            </div>
            <div className="profile-dd-email">{user.email}</div>
          </div>
          <div className="profile-dd-sep" />
          <button className="profile-dd-item" onClick={() => { setOpen(false); }}>
            <User size={14} /> Профиль
          </button>
          <button className="profile-dd-item" onClick={() => { setOpen(false); }}>
            <Settings size={14} /> Настройки
          </button>
          <button className="profile-dd-item" onClick={() => { setOpen(false); }}>
            <Link size={14} /> Интеграции
          </button>
          <div className="profile-dd-sep" />
          <button className="profile-dd-item profile-dd-logout" onClick={handleSignOut}>
            <LogOut size={14} /> Выйти
          </button>
        </div>
      )}
    </div>
  );
}
