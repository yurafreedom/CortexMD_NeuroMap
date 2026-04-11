'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import DeficitList from '../Deficits/DeficitList';
import type { Deficit, DeficitStatus } from '../../data/defaultDeficits';
import type { ActiveDrugs } from '../../lib/pharmacology';
import { Z } from '@/styles/zIndex';

interface DeficitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  deficits: Deficit[];
  activeDrugs: ActiveDrugs;
  selectedDeficit: string | null;
  onSelectDeficit: (id: string) => void;
  onDeficitStatusChange: (id: string, status: DeficitStatus) => void;
  onDeficitDelete: (id: string) => void;
  onZoneClick?: (zoneId: string) => void;
  onOpenSchemeSelection?: () => void;
}

export default function DeficitsModal({
  isOpen,
  onClose,
  deficits,
  activeDrugs,
  selectedDeficit,
  onSelectDeficit,
  onDeficitStatusChange,
  onDeficitDelete,
  onZoneClick,
  onOpenSchemeSelection,
}: DeficitsModalProps) {
  const t = useTranslations('dashboard');
  const td = useTranslations('deficits');

  if (!isOpen) return null;

  const hasActiveDrugs = Object.keys(activeDrugs).length > 0;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: Z.modal,
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: 'min(800px, 90vw)',
          maxHeight: '85vh',
          background: 'var(--bg-elevated)',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            height: 56,
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-head)',
              fontSize: 16,
              fontWeight: 600,
              color: '#f0f2f5',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {t('myDeficits')}
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#5a6478',
              fontSize: 22,
              cursor: 'pointer',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 6,
            }}
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {!hasActiveDrugs ? (
            <div
              style={{
                textAlign: 'center',
                padding: '48px 24px',
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  color: '#64748b',
                  marginBottom: 16,
                }}
              >
                {t('deficitsPlaceholder')}
              </div>
              {onOpenSchemeSelection && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenSchemeSelection();
                  }}
                  style={{
                    background: 'none',
                    border: '1px solid rgba(96,165,250,0.3)',
                    borderRadius: 8,
                    color: '#60a5fa',
                    fontSize: 13,
                    padding: '10px 20px',
                    cursor: 'pointer',
                  }}
                >
                  {t('openSchemeSelection')}
                </button>
              )}
            </div>
          ) : (
            <DeficitList
              deficits={deficits}
              activeDrugs={activeDrugs}
              selectedDeficit={selectedDeficit}
              onSelect={onSelectDeficit}
              onStatusChange={onDeficitStatusChange}
              onDelete={onDeficitDelete}
              onZoneClick={onZoneClick}
            />
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
