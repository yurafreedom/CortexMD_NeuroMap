'use client';

import React, { useMemo, useCallback, useState } from 'react';
import { DRUGS } from '../../data/drugs';
import { S1N, S1E } from '../../data/sigma1Cascade';
import { s1Bal } from '../../lib/sigma1';
import { occ } from '../../lib/pharmacology';
import type { ActiveDrugs } from '../../lib/pharmacology';

interface CascadeOverlayProps {
  isOpen: boolean;
  activeDrugs: ActiveDrugs;
  onClose: () => void;
}

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
    state === 'ag'
      ? '#22c55e'
      : state === 'inv'
        ? '#ef4444'
        : state === 'ant'
          ? '#f59e0b'
          : state === 'mix'
            ? '#a78bfa'
            : '#475569';
  const ec =
    state === 'ag'
      ? '#16a34a'
      : state === 'inv'
        ? '#dc2626'
        : state === 'ant'
          ? '#d97706'
          : state === 'mix'
            ? '#7c3aed'
            : '#334155';
  const speed =
    state === 'ag'
      ? '2s'
      : state === 'inv'
        ? '8s'
        : state === 'mix'
          ? '4s'
          : '0s';

  const nmap = useMemo(() => {
    const m: Record<string, (typeof S1N)[number]> = {};
    S1N.forEach((n) => { m[n.id] = n; });
    return m;
  }, []);

  const statusText = useMemo(() => {
    if (state === 'ag') return `\u03C31-агонизм активен (баланс: +${bal.net.toFixed(0)}%)`;
    if (state === 'inv') return `\u03C31-инверсный агонизм (баланс: ${bal.net.toFixed(0)}%)`;
    if (state === 'ant') return '\u03C31-антагонизм (блокада каскада)';
    if (state === 'mix') return '\u03C31-конкуренция агонист vs инверсный — исход зависит от индивидуальной фармакокинетики';
    return 'Нет активных \u03C31-лигандов';
  }, [state, bal.net]);

  const statusColor = useMemo(() => {
    if (state === 'ag') return '#22c55e';
    if (state === 'inv') return '#ef4444';
    if (state === 'ant') return '#f59e0b';
    if (state === 'mix') return '#a78bfa';
    return '#94a3b8';
  }, [state]);

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
      return '\u26A0\uFE0F \u03C31 инверсный агонизм подавляет LTP и BDNF-транскрипцию. Это может снижать эффективность травма-терапии (EMDR, PE).';
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

  return (
    <div id="s1overlay" className="show" style={{ display: 'flex' }}>
      <span className="s1close" onClick={onClose}>
        &times;
      </span>
      <div className="s1title">
        Клеточный уровень: {'\u03C3'}1-каскад нейропластичности
      </div>
      <div className="s1sub" style={{ color: statusColor }}>
        {statusText}
      </div>

      <svg
        id="s1svg"
        viewBox="0 0 800 520"
        style={{ width: 'min(90vw,900px)', height: 'auto', maxHeight: '70vh' }}
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

        {/* Edges */}
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
          return (
            <g key={`edge-${i}`}>
              <path
                id={pid}
                d={`M${x1},${y1} Q${mx},${my - 15} ${x2},${y2}`}
                fill="none"
                stroke={ec}
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
              {e.l && (
                <text
                  x={mx}
                  y={my - 8}
                  fill={ec}
                  fontSize="7"
                  textAnchor="middle"
                  opacity="0.7"
                >
                  {e.l}
                </text>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {S1N.map((n) => {
          const fill =
            n.id === 'bdnf'
              ? state === 'ag'
                ? '#22c55e'
                : state === 'inv'
                  ? '#7f1d1d'
                  : '#1e293b'
              : n.id === 'ltp'
                ? state === 'ag'
                  ? '#16a34a'
                  : state === 'inv'
                    ? '#7f1d1d'
                    : '#1e293b'
                : n.id === 'recon'
                  ? state === 'ag'
                    ? '#059669'
                    : state === 'inv'
                      ? '#991b1b'
                      : '#1e293b'
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

        {/* Labels */}
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

      <div className="s1legend">
        <span>
          <span className="s1dot" style={{ background: '#22c55e' }} />{' '}
          {'\u03C3'}1-агонист (каскад активен)
        </span>
        <span>
          <span className="s1dot" style={{ background: '#ef4444' }} />{' '}
          {'\u03C3'}1-инверсный агонист (подавлен)
        </span>
        <span>
          <span className="s1dot" style={{ background: '#f59e0b' }} />{' '}
          {'\u03C3'}1-антагонист (блокирован)
        </span>
        <span>
          <span className="s1dot" style={{ background: '#475569' }} /> Неактивен
        </span>
      </div>

      {infoText && (
        <div className="s1info show">
          {infoText}
        </div>
      )}

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
