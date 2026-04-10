'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { User, Settings, LogOut, Link, Globe } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { locales, localeNames, type Locale } from '@/i18n/config';

export default function ProfileMenu() {
  const { user, profile, signOut, loading } = useAuth();
  const t = useTranslations('profile');
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

  const changeLocale = (locale: string) => {
    document.cookie = `locale=${locale};path=/;max-age=31536000`;
    window.location.reload();
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
          <button className="profile-dd-item" onClick={() => { setOpen(false); router.push('/profile'); }}>
            <User size={14} /> {t('profile')}
          </button>
          <button className="profile-dd-item" onClick={() => { setOpen(false); }}>
            <Settings size={14} /> {t('settings')}
          </button>
          <button className="profile-dd-item" onClick={() => { setOpen(false); }}>
            <Link size={14} /> {t('integrations')}
          </button>
          <div className="profile-dd-sep" />
          <div className="profile-dd-item profile-dd-lang">
            <Globe size={14} /> {t('language')}
            <div className="profile-lang-options">
              {locales.map((loc) => (
                <button
                  key={loc}
                  className="profile-lang-btn"
                  onClick={() => changeLocale(loc)}
                >
                  {localeNames[loc]}
                </button>
              ))}
            </div>
          </div>
          <div className="profile-dd-sep" />
          <button className="profile-dd-item profile-dd-logout" onClick={handleSignOut}>
            <LogOut size={14} /> {t('logout')}
          </button>
        </div>
      )}
    </div>
  );
}
