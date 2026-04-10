'use client';

import React from 'react';
import type { IndicatorBalance } from '@/types/indicators';
import { Z } from '@/styles/zIndex';

interface IndicatorPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  accentColor: string;
  balance: IndicatorBalance | null;
  children: React.ReactNode;
}

/**
 * Generic full-screen overlay for indicator detail popups.
 * Mirrors the σ1 CascadeOverlay visual pattern.
 */
export default function IndicatorPopup({
  isOpen,
  onClose,
  title,
  accentColor,
  balance,
  children,
}: IndicatorPopupProps) {
  if (!isOpen) return null;

  return (
    <div
      className="indicator-popup-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: Z.overlay,
        background: 'rgba(8,11,18,0.92)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(32px) saturate(1.1)',
        WebkitBackdropFilter: 'blur(32px) saturate(1.1)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Close button */}
      <span
        onClick={onClose}
        style={{
          position: 'absolute', top: 20, right: 28,
          fontSize: 28, color: 'var(--text-muted)', cursor: 'pointer', zIndex: Z.overlayClose,
          transition: 'color 0.2s ease',
        }}
        onMouseEnter={(e) => { (e.target as HTMLElement).style.color = 'var(--text-primary)'; }}
        onMouseLeave={(e) => { (e.target as HTMLElement).style.color = 'var(--text-muted)'; }}
      >
        &times;
      </span>

      {/* Header pill */}
      <div style={{
        background: 'rgba(8,12,24,0.6)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        padding: '12px 24px',
        borderRadius: 12,
        display: 'inline-block',
        marginBottom: 16,
      }}>
        <div style={{
          fontSize: 20, fontWeight: 600, textAlign: 'center',
          fontFamily: 'var(--font-display)',
          background: `linear-gradient(135deg, ${accentColor}, #818cf8)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          {title}
        </div>
      </div>

      {/* Balance card (left sticky) */}
      {balance && (
        <div style={{
          position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)',
          width: 240, padding: 20, zIndex: 10,
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.08em', color: 'rgba(255,255,255,0.38)', marginBottom: 8,
          }}>
            БАЛАНС {balance.id}
          </div>

          <div style={{
            fontSize: 32, fontWeight: 700, color: balance.zone.color,
            fontFamily: 'var(--font-mono)', lineHeight: 1, marginBottom: 12,
          }}>
            {balance.value >= 0 ? '+' : ''}{balance.value.toFixed(0)}%
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 12 }}>
            {balance.breakdown.reuptake_inhibitor > 0 && (
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#60a5fa' }}>
                RI:{'          '}+{balance.breakdown.reuptake_inhibitor.toFixed(0)}%
              </div>
            )}
            {balance.breakdown.agonist > 0 && (
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#22c55e' }}>
                Агонисты:{'    '}+{balance.breakdown.agonist.toFixed(0)}%
              </div>
            )}
            {balance.breakdown.partial_agonist > 0 && (
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#a78bfa' }}>
                Парциальные:{' '}+{balance.breakdown.partial_agonist.toFixed(0)}%
              </div>
            )}
            {balance.breakdown.antagonist > 0 && (
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#f59e0b' }}>
                Антагонисты:{' '}&minus;{balance.breakdown.antagonist.toFixed(0)}%
              </div>
            )}
            {balance.breakdown.inverse_agonist > 0 && (
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#ef4444' }}>
                Инверсные:{'   '}&minus;{balance.breakdown.inverse_agonist.toFixed(0)}%
              </div>
            )}
          </div>

          <div style={{
            fontSize: 11, color: balance.zone.color, fontWeight: 600,
          }}>
            Зона: {balance.zone.label}
          </div>
        </div>
      )}

      {/* Main content area */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        maxWidth: '65vw',
        maxHeight: '75vh',
        overflow: 'auto',
      }}>
        {children}
      </div>
    </div>
  );
}
