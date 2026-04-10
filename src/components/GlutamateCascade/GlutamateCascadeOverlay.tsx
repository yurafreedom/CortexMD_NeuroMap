'use client';

import React, { useMemo, useCallback, useState } from 'react';
import { GLU_NODES, GLU_EDGES, GLU_EDGE_TYPE_LABELS } from '../../data/glutamateCascade';
import { calculateGlutamateBalance } from '../../lib/indicators/glutamate';
import type { ActiveDrug } from '../../lib/indicators/balance';
import { Z } from '@/styles/zIndex';

interface GlutamateCascadeOverlayProps {
  isOpen: boolean;
  activeDrugs: ActiveDrug[];
  onClose: () => void;
}

export default function GlutamateCascadeOverlay({
  isOpen,
  activeDrugs,
  onClose,
}: GlutamateCascadeOverlayProps) {
  const [tooltip, setTooltip] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);

  const balance = useMemo(
    () => calculateGlutamateBalance(activeDrugs),
    [activeDrugs]
  );

  const hasActive = activeDrugs.length > 0;
  const absValue = Math.abs(balance.value);

  // State determines animation and colors
  const state = !hasActive
    ? 'off'
    : absValue < 10
      ? 'neutral'
      : balance.value > 0
        ? 'excitatory'
        : 'inhibitory';

  const nc =
    state === 'excitatory' ? '#a78bfa'
    : state === 'inhibitory' ? '#60a5fa'
    : state === 'neutral' ? '#94a3b8'
    : '#475569';

  const speed =
    state === 'excitatory' ? '2s'
    : state === 'inhibitory' ? '5s'
    : state === 'neutral' ? '4s'
    : '0s';

  const nmap = useMemo(() => {
    const m: Record<string, (typeof GLU_NODES)[number]> = {};
    GLU_NODES.forEach((n) => { m[n.id] = n; });
    return m;
  }, []);

  const handleNodeHover = useCallback(
    (evt: React.MouseEvent, desc: string) => {
      setTooltip({ text: desc, x: evt.clientX + 12, y: evt.clientY - 10 });
    },
    []
  );

  const handleNodeLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  if (!isOpen) return null;

  const usedEdgeTypes = [...new Set(GLU_EDGES.map(e => e.tp))];

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: Z.overlay,
        background: 'rgba(8,11,18,0.92)', display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(32px) saturate(1.1)',
        WebkitBackdropFilter: 'blur(32px) saturate(1.1)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <span
        onClick={onClose}
        style={{
          position: 'absolute', top: 20, right: 28,
          fontSize: 28, color: 'var(--text-muted)', cursor: 'pointer', zIndex: Z.overlayClose,
        }}
      >
        &times;
      </span>

      {/* Header */}
      <div style={{
        background: 'rgba(8,12,24,0.6)', backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        padding: '12px 24px', borderRadius: 12, marginBottom: 16,
      }}>
        <div style={{
          fontSize: 20, fontWeight: 600, textAlign: 'center',
          fontFamily: 'var(--font-display)',
          background: 'linear-gradient(135deg, #a78bfa, #818cf8)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          Глутаматный каскад нейропластичности
        </div>
      </div>

      {/* Balance card (left) */}
      <div style={{
        position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)',
        width: 240, padding: 20, zIndex: 10,
        background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
      }}>
        <div style={{
          fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
          letterSpacing: '0.08em', color: 'rgba(255,255,255,0.38)', marginBottom: 8,
        }}>
          БАЛАНС Glu
        </div>

        <div style={{
          fontSize: 32, fontWeight: 700, color: balance.zone.color,
          fontFamily: 'var(--font-mono)', lineHeight: 1, marginBottom: 12,
        }}>
          {balance.value >= 0 ? '+' : ''}{balance.value.toFixed(0)}%
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 12 }}>
          {balance.breakdown.agonist > 0 && (
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#22c55e' }}>
              Агонисты:{'    '}+{balance.breakdown.agonist.toFixed(0)}%
            </div>
          )}
          {balance.breakdown.antagonist > 0 && (
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#ef4444' }}>
              Антагонисты:{' '}&minus;{balance.breakdown.antagonist.toFixed(0)}%
            </div>
          )}
          {balance.breakdown.reuptake_inhibitor > 0 && (
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#60a5fa' }}>
              RI:{'          '}+{balance.breakdown.reuptake_inhibitor.toFixed(0)}%
            </div>
          )}
        </div>

        <div style={{ fontSize: 11, color: balance.zone.color, fontWeight: 600, marginBottom: 12 }}>
          Зона: {balance.zone.label}
        </div>

        {/* State info */}
        {state === 'inhibitory' && (
          <div style={{
            fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5,
            borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10,
          }}>
            NMDA-антагонизм снижает глутаматную передачу.
            При краткосрочном воздействии (кетамин) — это запускает
            компенсаторный выброс BDNF → антидепрессивный эффект.
          </div>
        )}
        {state === 'excitatory' && (
          <div style={{
            fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5,
            borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10,
          }}>
            Повышенная глутаматная активность.
            NAC через Xc-антипортёр нормализует экстрасинаптический
            глутамат, уменьшая GluN2B-эксайтотоксичность.
          </div>
        )}
      </div>

      {/* Legend (right) */}
      <div style={{
        position: 'absolute', right: 24, top: 24, zIndex: 10,
        background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8,
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{
          fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)',
          marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
          Типы связей
        </div>
        {usedEdgeTypes.map(tp => {
          const info = GLU_EDGE_TYPE_LABELS[tp];
          if (!info) return null;
          return (
            <div key={tp} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              marginBottom: 4, fontSize: 11, color: 'var(--text-secondary)',
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: 2,
                background: info.color, flexShrink: 0,
              }} />
              {info.label}
            </div>
          );
        })}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          marginTop: 8, paddingTop: 8,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)',
            marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            Узлы
          </div>
          {[
            { c: '#a78bfa', l: 'Глутаматный каскад' },
            { c: '#c084fc', l: 'Общие с σ1 (shared)', style: 'dashed' as const },
            { c: '#475569', l: 'Неактивен' },
          ].map(item => (
            <div key={item.l} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              marginBottom: 3, fontSize: 11, color: 'var(--text-secondary)',
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: item.c, flexShrink: 0,
                border: item.style === 'dashed' ? '1px dashed rgba(255,255,255,0.3)' : undefined,
              }} />
              {item.l}
            </div>
          ))}
        </div>
      </div>

      {/* SVG cascade graph */}
      <svg
        viewBox="0 0 800 560"
        style={{ width: 'min(55vw,700px)', height: 'auto', maxHeight: '70vh' }}
      >
        <defs>
          <filter id="gluglow">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Edges */}
        {GLU_EDGES.map((e, i) => {
          const fn = nmap[e.f];
          const tn = nmap[e.t];
          if (!fn || !tn) return null;
          const x1 = fn.x;
          const y1 = fn.y + 15;
          const x2 = tn.x;
          const y2 = tn.y - 15;
          const mx = (x1 + x2) / 2;
          const my = (y1 + y2) / 2;
          const pid = `glup${i}`;
          const edgeColor = GLU_EDGE_TYPE_LABELS[e.tp]?.color || '#475569';
          return (
            <g key={`edge-${i}`}>
              <path
                id={pid}
                d={`M${x1},${y1} Q${mx},${my - 15} ${x2},${y2}`}
                fill="none"
                stroke={state === 'off' ? '#334155' : edgeColor}
                strokeWidth="1.5"
                opacity="0.5"
                strokeDasharray={e.tp === 'neg' ? '4 3' : undefined}
              />
              {state !== 'off' &&
                [0, 1, 2].map((p) => (
                  <circle
                    key={p}
                    r="3"
                    fill={nc}
                    opacity="0.8"
                    filter="url(#gluglow)"
                  >
                    <animateMotion
                      dur={speed}
                      begin={`${p * 0.7}s`}
                      repeatCount="indefinite"
                    >
                      <mpath href={`#${pid}`} />
                    </animateMotion>
                  </circle>
                ))}
            </g>
          );
        })}

        {/* Nodes */}
        {GLU_NODES.map((n) => {
          const isOutcome = n.id === 'ltpltd';
          const isKey = n.id === 'nmdar' || n.id === 'ca' || n.id === 'bdnf';
          const fill = state === 'off' ? '#0f172a'
            : isOutcome
              ? (state === 'excitatory' ? '#a78bfa' : state === 'inhibitory' ? '#60a5fa' : '#1e293b')
            : isKey
              ? (state === 'excitatory' ? '#7c3aed' : state === 'inhibitory' ? '#3b82f6' : '#1e293b')
            : '#0f172a';
          const stroke = n.shared ? '#c084fc' : nc;
          const w = n.w || 55;
          const hw = w / 2;
          return (
            <g
              key={n.id}
              onMouseEnter={(evt) => handleNodeHover(evt, n.d)}
              onMouseLeave={handleNodeLeave}
            >
              <rect
                x={n.x - hw}
                y={n.y - 14}
                width={w}
                height={28}
                rx="8"
                fill={fill}
                stroke={stroke}
                strokeWidth={n.shared ? 2 : 1.5}
                strokeDasharray={n.shared ? '6 3' : undefined}
                filter="url(#gluglow)"
              />
              {n.shared && (
                <text
                  x={n.x + hw - 2}
                  y={n.y - 8}
                  fill="#c084fc"
                  fontSize="7"
                  textAnchor="end"
                  opacity="0.6"
                >
                  σ1
                </text>
              )}
              <text
                x={n.x}
                y={n.y + 4}
                fill={state === 'off' ? '#64748b' : '#e2e8f0'}
                fontSize="10"
                fontWeight="700"
                textAnchor="middle"
              >
                {n.l}
              </text>
            </g>
          );
        })}

        {/* Zone labels */}
        <text x="400" y="18" fill="#475569" fontSize="8" textAnchor="middle" opacity="0.5">
          --- Постсинаптическая мембрана ---
        </text>
        <text x="400" y="550" fill="#475569" fontSize="8" textAnchor="middle" opacity="0.5">
          --- Результат: синаптическая пластичность ---
        </text>
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: 'fixed',
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            background: 'rgba(15,23,42,0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6,
            padding: '6px 10px',
            fontSize: 11,
            color: '#e2e8f0',
            maxWidth: 280,
            lineHeight: 1.4,
            zIndex: 200,
            pointerEvents: 'none',
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
