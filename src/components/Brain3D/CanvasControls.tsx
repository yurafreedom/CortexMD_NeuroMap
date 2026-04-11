'use client';

import React, { useState, useCallback } from 'react';
import { Eye, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface CanvasControlsProps {
  opacity: number;
  onOpacityChange: (value: number) => void;
}

const DEFAULT_OPACITY = 15;

export default function CanvasControls({ opacity, onOpacityChange }: CanvasControlsProps) {
  const t = useTranslations('dashboard');
  const [popoverOpen, setPopoverOpen] = useState(false);

  const handleSlider = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onOpacityChange(parseInt(e.target.value, 10));
    },
    [onOpacityChange],
  );

  const handleReset = useCallback(() => {
    onOpacityChange(DEFAULT_OPACITY);
  }, [onOpacityChange]);

  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 5,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: 8,
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(20,24,32,0.6)',
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
      }}
    >
      {/* Eye — toggle transparency popover */}
      <button
        onClick={() => setPopoverOpen(!popoverOpen)}
        title={t('cortexOpacity')}
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          border: 'none',
          background: popoverOpen ? 'rgba(96,165,250,0.12)' : 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 200ms ease',
        }}
      >
        <Eye size={18} color={popoverOpen ? '#60a5fa' : '#94a3b8'} />
      </button>

      {/* ZoomIn — placeholder */}
      <button
        disabled
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          border: 'none',
          background: 'transparent',
          cursor: 'default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.3,
        }}
      >
        <ZoomIn size={18} color="#94a3b8" />
      </button>

      {/* ZoomOut — placeholder */}
      <button
        disabled
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          border: 'none',
          background: 'transparent',
          cursor: 'default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.3,
        }}
      >
        <ZoomOut size={18} color="#94a3b8" />
      </button>

      {/* Reset view — placeholder */}
      <button
        disabled
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          border: 'none',
          background: 'transparent',
          cursor: 'default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.3,
        }}
      >
        <RotateCcw size={18} color="#94a3b8" />
      </button>

      {/* Transparency popover — opens to the left */}
      {popoverOpen && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 'calc(100% + 8px)',
            width: 220,
            padding: 16,
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(20,24,32,0.85)',
            backdropFilter: 'blur(16px) saturate(180%)',
            WebkitBackdropFilter: 'blur(16px) saturate(180%)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#f0f2f5',
              marginBottom: 12,
            }}
          >
            {t('cortexOpacity')}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <input
              type="range"
              min={0}
              max={100}
              value={opacity}
              onChange={handleSlider}
              style={{
                flex: 1,
                accentColor: '#60a5fa',
                height: 4,
              }}
            />
            <span
              style={{
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                color: '#94a3b8',
                width: 36,
                textAlign: 'right',
              }}
            >
              {opacity}%
            </span>
          </div>
          <button
            onClick={handleReset}
            style={{
              width: '100%',
              background: 'none',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 6,
              color: '#94a3b8',
              fontSize: 11,
              padding: '6px 10px',
              cursor: 'pointer',
            }}
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
}
