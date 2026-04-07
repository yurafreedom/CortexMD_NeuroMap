'use client';

import React, { useMemo, useCallback, useState } from 'react';
import { DRUGS } from '../../data/drugs';
import { S1N, S1E } from '../../data/sigma1Cascade';
import { s1Bal } from '../../lib/sigma1';
import { occ } from '../../lib/pharmacology';
import { SIGMA1_ZONES, getNormalRangeLabel, getZoneForValue } from '../../lib/sigma1Display';
import type { ActiveDrugs } from '../../lib/pharmacology';

interface CascadeOverlayProps {
  isOpen: boolean;
  activeDrugs: ActiveDrugs;
  onClose: () => void;
}

// Edge type labels for legend
const EDGE_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  inh: { label: 'Ингибирование', color: '#ef4444' },
  stab: { label: 'Стабилизация', color: '#a78bfa' },
  act: { label: 'Активация', color: '#22c55e' },
  prod: { label: 'Продукция', color: '#60a5fa' },
};

export default function CascadeOverlay({
  isOpen,
  activeDrugs,
  onClose,
}: CascadeOverlayProps) {
  const [tooltip, setTooltip] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);

  const bal = useMemo(() => s1Bal(activeDrugs), [activeDrugs]);

  const hasAny = bal.ag > 0 || bal.inv > 0 || bal.ant > 0;
  const state = !hasAny
    ? 'off'
    : bal.net > 10
      ? 'ag'
      : bal.net < -10
        ? 'inv'
        : bal.ant > 20
          ? 'ant'
          : 'mix';

  const nc =
    state === 'ag' ? '#22c55e'
    : state === 'inv' ? '#ef4444'
    : state === 'ant' ? '#f59e0b'
    : state === 'mix' ? '#a78bfa'
    : '#475569';
  const ec =
    state === 'ag' ? '#16a34a'
    : state === 'inv' ? '#dc2626'
    : state === 'ant' ? '#d97706'
    : state === 'mix' ? '#7c3aed'
    : '#334155';
  const speed =
    state === 'ag' ? '2s'
    : state === 'inv' ? '8s'
    : state === 'mix' ? '4s'
    : '0s';

  const nmap = useMemo(() => {
    const m: Record<string, (typeof S1N)[number]> = {};
    S1N.forEach((n) => { m[n.id] = n; });
    return m;
  }, []);

  // Balance card data
  const balanceZone = useMemo(() => getZoneForValue(bal.net), [bal.net]);
  const normalRange = useMemo(() => getNormalRangeLabel(), []);

  const infoText = useMemo(() => {
    const AD = activeDrugs;
    if (state === 'ag') {
      const agDrugs: string[] = [];
      Object.keys(AD).forEach((d) => {
        const dr = DRUGS[d];
        if (dr && dr.s1t === 'ag' && dr.ki && dr.ki.s1) {
          agDrugs.push(`${dr.s} \u03C31:${occ(d, 's1', AD).toFixed(0)}%`);
        }
      });
      return `Активные \u03C31-агонисты: ${agDrugs.join(', ')} \u2192 каскад BiP\u2192Ca\u00B2\u207A\u2192BDNF\u2192LTP активен`;
    }
    if (state === 'inv') {
      return '\u03C31 инверсный агонизм подавляет LTP и BDNF-транскрипцию. Это может снижать эффективность травма-терапии (EMDR, PE).';
    }
    if (state === 'ant') {
      return '\u03C31-антагонист блокирует весь каскад нейропластичности.';
    }
    if (state === 'mix') {
      const parts: string[] = [];
      Object.keys(AD).forEach((d) => {
        const dr = DRUGS[d];
        if (dr && dr.s1t && dr.ki && dr.ki.s1) {
          parts.push(`${dr.s} (${dr.s1t}) \u03C31:${occ(d, 's1', AD).toFixed(0)}%`);
        }
      });
      return `Конкуренция: ${parts.join(' vs ')} \u2192 каскад частично активен`;
    }
    return null;
  }, [state, activeDrugs]);

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

  // Collect unique edge types used
  const usedEdgeTypes = [...new Set(S1E.map(e => e.tp))];

  return (
    <div id="s1overlay" className="show" style={{ display: 'flex' }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <span className="s1close" onClick={onClose}>
        &times;
      </span>

      {/* 13a: Header in pill */}
      <div style={{
        background: 'rgba(8,12,24,0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        padding: '12px 24px', borderRadius: 12, display: 'inline-block', margin: '0 auto', marginBottom: 16,
      }}>
        <div className="s1title" style={{ marginBottom: 0 }}>
          Клеточный уровень: {'\u03C3'}1-каскад нейропластичности
        </div>
      </div>
      {/* 13b: removed statusText from header zone */}

      {/* 13c: Balance card (left sticky) */}
      <div style={{
        position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)',
        width: 240, padding: 20, zIndex: 10,
        background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
      }}>
        {/* Overline */}
        <div style={{
          fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
          color: 'rgba(255,255,255,0.38)', marginBottom: 8,
        }}>
          БАЛАНС \u03C31
        </div>

        {/* Value */}
        <div style={{
          fontSize: 32, fontWeight: 700, color: balanceZone.color,
          fontFamily: 'var(--font-mono)', lineHeight: 1, marginBottom: 12,
        }}>
          {bal.net >= 0 ? '+' : ''}{bal.net.toFixed(0)}%
        </div>

        {/* Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#22c55e' }}>
            Агонисты:{'    '}+{bal.ag.toFixed(0)}%
          </div>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#ef4444' }}>
            Инверсные:{'   '}&minus;{bal.inv.toFixed(0)}%
          </div>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#f59e0b' }}>
            Антагонисты:{'  '}&minus;{bal.ant.toFixed(0)}%
          </div>
        </div>

        {/* Progress bar with zones */}
        <div style={{ height: 6, borderRadius: 3, overflow: 'hidden', display: 'flex', marginBottom: 6 }}>
          {SIGMA1_ZONES.map(zone => (
            <div key={zone.id} style={{
              flex: zone.max - zone.min,
              background: zone.color,
              opacity: zone.id === balanceZone.id ? 1 : 0.2,
            }} />
          ))}
        </div>

        {/* Normal range */}
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
          Норма: {normalRange}
        </div>

        {/* Zone label */}
        <div style={{ fontSize: 11, color: balanceZone.color, fontWeight: 600, marginBottom: 12 }}>
          Зона: {balanceZone.label}
        </div>

        {/* 13d: moved warning info into balance card */}
        {infoText && (
          <div style={{
            fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5,
            borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10,
          }}>
            {infoText}
          </div>
        )}
      </div>

      {/* 13e: Cascade legend (right side) */}
      <div style={{
        position: 'absolute', right: 24, top: 24, zIndex: 10,
        background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8,
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Типы связей
        </div>
        {usedEdgeTypes.map(tp => {
          const info = EDGE_TYPE_LABELS[tp];
          if (!info) return null;
          return (
            <div key={tp} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, fontSize: 11, color: 'var(--text-secondary)' }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: info.color, flexShrink: 0 }} />
              {info.label}
            </div>
          );
        })}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 8, paddingTop: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Состояния
          </div>
          {[
            { c: '#22c55e', l: '\u03C31-агонист (активен)' },
            { c: '#ef4444', l: '\u03C31-инверсный (подавлен)' },
            { c: '#f59e0b', l: '\u03C31-антагонист (блокирован)' },
            { c: '#475569', l: 'Неактивен' },
          ].map(item => (
            <div key={item.l} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, fontSize: 11, color: 'var(--text-secondary)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.c, flexShrink: 0 }} />
              {item.l}
            </div>
          ))}
        </div>
      </div>

      {/* SVG cascade graph */}
      <svg
        id="s1svg"
        viewBox="0 0 800 520"
        style={{ width: 'min(55vw,700px)', height: 'auto', maxHeight: '70vh' }}
      >
        <defs>
          <filter id="s1glow">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Edges — no inline labels (moved to legend) */}
        {S1E.map((e, i) => {
          const fn = nmap[e.f];
          const tn = nmap[e.t];
          if (!fn || !tn) return null;
          const x1 = fn.x;
          const y1 = fn.y + 15;
          const x2 = tn.x;
          const y2 = tn.y - 15;
          const mx = (x1 + x2) / 2;
          const my = (y1 + y2) / 2;
          const pid = `s1p${i}`;
          const edgeColor = EDGE_TYPE_LABELS[e.tp]?.color || ec;
          return (
            <g key={`edge-${i}`}>
              <path
                id={pid}
                d={`M${x1},${y1} Q${mx},${my - 15} ${x2},${y2}`}
                fill="none"
                stroke={state === 'off' ? '#334155' : edgeColor}
                strokeWidth="1.5"
                opacity="0.5"
              />
              {state !== 'off' &&
                [0, 1, 2].map((p) => (
                  <circle
                    key={p}
                    r="3"
                    fill={nc}
                    opacity="0.8"
                    filter="url(#s1glow)"
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
        {S1N.map((n) => {
          const fill =
            n.id === 'bdnf'
              ? state === 'ag' ? '#22c55e' : state === 'inv' ? '#7f1d1d' : '#1e293b'
            : n.id === 'ltp'
              ? state === 'ag' ? '#16a34a' : state === 'inv' ? '#7f1d1d' : '#1e293b'
            : n.id === 'recon'
              ? state === 'ag' ? '#059669' : state === 'inv' ? '#991b1b' : '#1e293b'
            : '#0f172a';
          const stroke = n.id === 's1r' ? '#c084fc' : nc;
          const w = n.w || 55;
          const hw = w / 2;
          return (
            <g
              key={n.id}
              className="s1node"
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
                strokeWidth="1.5"
                filter="url(#s1glow)"
              />
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
        <text x="400" y="370" fill="#475569" fontSize="8" textAnchor="middle" opacity="0.5">
          {'--- \u042F\u0414\u0420\u041E (\u0442\u0440\u0430\u043D\u0441\u043A\u0440\u0438\u043F\u0446\u0438\u044F) ---'}
        </text>
        <text x="400" y="15" fill="#475569" fontSize="8" textAnchor="middle" opacity="0.5">
          {'--- \u042D\u0420 \u043C\u0435\u043C\u0431\u0440\u0430\u043D\u0430 (MAM) ---'}
        </text>
        <text x="700" y="250" fill="#475569" fontSize="8" textAnchor="middle" opacity="0.4">
          Постсинапс
        </text>
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="s1tooltip"
          style={{
            display: 'block',
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
