'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import { Trash2, AlertOctagon } from 'lucide-react';
import { Z } from '@/styles/zIndex';

const LOCAL_STORAGE_KEYS = [
  'cortexmd_scheme',
  'cortexmd_deficits',
];

interface DeleteDataZoneProps {
  onDeleted?: () => void;
}

export default function DeleteDataZone({ onDeleted }: DeleteDataZoneProps) {
  const t = useTranslations('deleteData');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const CONFIRM_PHRASE = 'DELETE MY DATA';

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/profile/delete-all', { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || t('errorGeneric'));
        setLoading(false);
        return;
      }

      // Clear client-side state
      for (const key of LOCAL_STORAGE_KEYS) {
        localStorage.removeItem(key);
      }
      // Clear any preset-prefixed keys
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith('cortexmd_preset_')) {
          localStorage.removeItem(k);
        }
      }

      setLoading(false);
      setConfirmOpen(false);
      onDeleted?.();
      // Full reload to reset all in-memory state
      window.location.href = '/';
    } catch (e) {
      setError(e instanceof Error ? e.message : t('errorGeneric'));
      setLoading(false);
    }
  };

  return (
    <>
      <div
        style={{
          padding: 12,
          borderRadius: 10,
          border: '1px solid rgba(239,68,68,0.25)',
          background: 'rgba(239,68,68,0.05)',
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: '#ef4444',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <AlertOctagon size={12} />
          {t('dangerZone')}
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.4, marginBottom: 10 }}>
          {t('description')}
        </div>
        <button
          onClick={() => {
            setConfirmOpen(true);
            setConfirmText('');
            setError(null);
          }}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid rgba(239,68,68,0.4)',
            background: 'rgba(239,68,68,0.12)',
            color: '#ef4444',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            transition: 'background 200ms ease',
          }}
        >
          <Trash2 size={12} />
          {t('deleteAllButton')}
        </button>
      </div>

      {confirmOpen &&
        createPortal(
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget && !loading) setConfirmOpen(false);
            }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: Z.modal,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: 'min(480px, 90vw)',
                padding: 24,
                borderRadius: 16,
                border: '1px solid rgba(239,68,68,0.35)',
                background: 'var(--bg-elevated)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <AlertOctagon size={20} color="#ef4444" />
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: '#f0f2f5',
                  }}
                >
                  {t('confirmTitle')}
                </div>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: '#cbd5e1',
                  lineHeight: 1.5,
                  marginBottom: 16,
                }}
              >
                {t('confirmBody')}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: '#94a3b8',
                  marginBottom: 6,
                }}
              >
                {t('typeToConfirm', { phrase: CONFIRM_PHRASE })}
              </div>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={CONFIRM_PHRASE}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(0,0,0,0.3)',
                  color: '#f0f2f5',
                  fontSize: 12,
                  fontFamily: 'var(--font-mono)',
                  marginBottom: 12,
                  outline: 'none',
                }}
              />
              {error && (
                <div
                  style={{
                    fontSize: 11,
                    color: '#ef4444',
                    marginBottom: 12,
                    padding: 8,
                    borderRadius: 6,
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.2)',
                  }}
                >
                  {error}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setConfirmOpen(false)}
                  disabled={loading}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'transparent',
                    color: '#94a3b8',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading || confirmText !== CONFIRM_PHRASE}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: '1px solid rgba(239,68,68,0.5)',
                    background:
                      confirmText === CONFIRM_PHRASE && !loading
                        ? '#ef4444'
                        : 'rgba(239,68,68,0.2)',
                    color:
                      confirmText === CONFIRM_PHRASE && !loading
                        ? '#fff'
                        : '#ef4444',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor:
                      loading || confirmText !== CONFIRM_PHRASE
                        ? 'not-allowed'
                        : 'pointer',
                    opacity: confirmText !== CONFIRM_PHRASE ? 0.5 : 1,
                  }}
                >
                  {loading ? t('deleting') : t('confirmDelete')}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
