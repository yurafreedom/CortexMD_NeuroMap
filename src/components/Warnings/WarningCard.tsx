'use client';

import React from 'react';
import { AlertOctagon, AlertTriangle, Info } from 'lucide-react';

export type WarningSeverity = 'critical' | 'warning' | 'info';

interface WarningCardProps {
  severity: WarningSeverity;
  title: string;
  description: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const SEVERITY_STYLES: Record<
  WarningSeverity,
  { color: string; bg: string; border: string; Icon: React.ComponentType<{ size?: number; color?: string }> }
> = {
  critical: {
    color: '#ef4444',
    bg: 'linear-gradient(160deg, rgba(239,68,68,0.12), rgba(239,68,68,0.02) 60%, rgba(239,68,68,0.08))',
    border: 'rgba(239,68,68,0.35)',
    Icon: AlertOctagon,
  },
  warning: {
    color: '#f59e0b',
    bg: 'linear-gradient(160deg, rgba(245,158,11,0.12), rgba(245,158,11,0.02) 60%, rgba(245,158,11,0.08))',
    border: 'rgba(245,158,11,0.35)',
    Icon: AlertTriangle,
  },
  info: {
    color: '#60a5fa',
    bg: 'linear-gradient(160deg, rgba(96,165,250,0.12), rgba(96,165,250,0.02) 60%, rgba(96,165,250,0.08))',
    border: 'rgba(96,165,250,0.35)',
    Icon: Info,
  },
};

export default function WarningCard({
  severity,
  title,
  description,
  onMouseEnter,
  onMouseLeave,
}: WarningCardProps) {
  const style = SEVERITY_STYLES[severity];
  const Icon = style.Icon;

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        padding: '8px 10px',
        borderRadius: 8,
        border: `1px solid ${style.border}`,
        background: style.bg,
        cursor: onMouseEnter ? 'pointer' : 'default',
        transition: 'background 200ms ease',
      }}
    >
      <div style={{ flexShrink: 0, marginTop: 1 }}>
        <Icon size={13} color={style.color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: style.color,
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
            marginBottom: 2,
            lineHeight: 1.3,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 10,
            color: '#cbd5e1',
            lineHeight: 1.4,
            wordBreak: 'break-word',
          }}
        >
          {description}
        </div>
      </div>
    </div>
  );
}
