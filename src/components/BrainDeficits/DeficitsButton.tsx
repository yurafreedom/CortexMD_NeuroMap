'use client';

import React from 'react';
import { Brain } from 'lucide-react';

interface DeficitsButtonProps {
  onClick: () => void;
  deficitCount: number;
}

export default function DeficitsButton({ onClick, deficitCount }: DeficitsButtonProps) {
  return (
    <button
      onClick={onClick}
      title="Brain Deficits"
      style={{
        width: 44,
        height: 44,
        borderRadius: '50%',
        border: '1px solid rgba(255,255,255,0.10)',
        background: 'rgba(255,255,255,0.03)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        transition: 'all 200ms ease',
        flexShrink: 0,
      }}
    >
      <Brain size={20} color="#94a3b8" />
      {deficitCount > 0 && (
        <span
          style={{
            position: 'absolute',
            top: -2,
            right: -2,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: '#ef4444',
            color: '#fff',
            fontSize: 9,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
          }}
        >
          {deficitCount}
        </span>
      )}
    </button>
  );
}
