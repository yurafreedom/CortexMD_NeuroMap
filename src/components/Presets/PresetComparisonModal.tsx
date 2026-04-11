'use client';

import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import { DRUGS_V2 } from '@/data/drugs.v2';
import { DRUGS } from '@/data/drugs';
import type { ActiveDrug } from '@/lib/indicators/balance';
import type { IndicatorBalance } from '@/types/indicators';
import type { ActiveDrugs } from '@/lib/pharmacology';
import { calculateDopamineBalance } from '@/lib/indicators/dopamine';
import { calculateNorepinephrineBalance } from '@/lib/indicators/norepinephrine';
import { calculateSerotoninBalance } from '@/lib/indicators/serotonin';
import { calculateGlutamateBalance } from '@/lib/indicators/glutamate';
import { calculateSigma1Balance } from '@/lib/indicators/sigma1';
import { calculateCYPBalance } from '@/lib/indicators/cyp';
import {
  calculateACBBalance,
  calculateGABABalance,
  calculateH1Balance,
  calculateAlpha1Balance,
  calculateOpioidBalance,
  calculateACBScore,
} from '@/lib/indicators/conditional';
import { Z } from '@/styles/zIndex';

interface PresetForCompare {
  id: string;
  name: string;
  drugs: ActiveDrugs;
}

interface PresetComparisonModalProps {
  presetA: PresetForCompare;
  presetB: PresetForCompare;
  onClose: () => void;
}

interface IndicatorRow {
  label: string;
  valueA: number;
  valueB: number;
  isScore?: boolean; // ACB uses raw score, not percentage
}

function drugsToActiveDrugList(drugs: ActiveDrugs): ActiveDrug[] {
  const result: ActiveDrug[] = [];
  for (const [id, dose] of Object.entries(drugs)) {
    const drug = DRUGS_V2[id];
    if (drug) result.push({ drug, dose_mg: dose });
  }
  return result;
}

function computeAllIndicators(drugs: ActiveDrugs): IndicatorRow[] {
  const list = drugsToActiveDrugList(drugs);

  const core: Array<{ label: string; calc: (d: ActiveDrug[]) => IndicatorBalance }> = [
    { label: 'DA', calc: calculateDopamineBalance },
    { label: 'NA', calc: calculateNorepinephrineBalance },
    { label: '5-HT', calc: calculateSerotoninBalance },
    { label: 'Glu', calc: calculateGlutamateBalance },
    { label: 'σ1', calc: calculateSigma1Balance },
    { label: 'CYP', calc: calculateCYPBalance },
  ];

  const rows: IndicatorRow[] = core.map((c) => ({
    label: c.label,
    valueA: 0,
    valueB: 0,
  }));

  // Actually compute — we'll fill valueA or valueB from caller
  const values = core.map((c) => Math.round(c.calc(list).value));

  // Conditional
  const conditional: Array<{
    label: string;
    calc: (d: ActiveDrug[]) => IndicatorBalance;
  }> = [
    { label: 'ACh (ACB)', calc: calculateACBBalance },
    { label: 'GABA', calc: calculateGABABalance },
    { label: 'H1', calc: calculateH1Balance },
    { label: 'α1', calc: calculateAlpha1Balance },
    { label: 'Opioid', calc: calculateOpioidBalance },
  ];

  const condValues = conditional.map((c) => Math.round(c.calc(list).value));

  return [
    ...values.map((v, i) => ({ label: core[i].label, valueA: v, valueB: 0 })),
    ...condValues.map((v, i) => ({
      label: conditional[i].label,
      valueA: v,
      valueB: 0,
    })),
  ];
}

function IndicatorBar({ value, maxAbs = 100 }: { value: number; maxAbs?: number }) {
  const pct = Math.min(Math.abs(value) / maxAbs, 1) * 100;
  const isPositive = value >= 0;
  const color = isPositive ? '#60a5fa' : '#f59e0b';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        height: 20,
      }}
    >
      <div
        style={{
          flex: 1,
          height: 6,
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: isPositive ? '50%' : `${50 - pct / 2}%`,
            width: `${pct / 2}%`,
            height: '100%',
            background: color,
            borderRadius: 3,
          }}
        />
        {/* Center mark */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            bottom: 0,
            width: 1,
            background: 'rgba(255,255,255,0.15)',
          }}
        />
      </div>
      <span
        style={{
          width: 44,
          textAlign: 'right',
          fontSize: 12,
          fontFamily: 'var(--font-mono)',
          color: value === 0 ? '#64748b' : color,
          fontWeight: 600,
        }}
      >
        {value > 0 ? '+' : ''}
        {value}%
      </span>
    </div>
  );
}

function PresetColumn({
  preset,
  indicators,
}: {
  preset: PresetForCompare;
  indicators: Array<{ label: string; value: number }>;
}) {
  const t = useTranslations('dashboard');
  const drugIds = Object.keys(preset.drugs);

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      {/* Drug list */}
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {drugIds.map((id) => {
          const d = DRUGS[id];
          if (!d) return null;
          const dose = preset.drugs[id];
          return (
            <div
              key={id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 10px',
                borderRadius: 8,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: d.c,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#f0f2f5',
                  flex: 1,
                }}
              >
                {d.brand || d.s}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  color: '#94a3b8',
                }}
              >
                {dose} {d.u}
              </span>
            </div>
          );
        })}
      </div>

      {/* Indicators */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {indicators.map((ind) => (
          <div key={ind.label}>
            <div
              style={{
                fontSize: 11,
                color: '#94a3b8',
                marginBottom: 2,
                fontWeight: 500,
              }}
            >
              {ind.label}
            </div>
            <IndicatorBar value={ind.value} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PresetComparisonModal({
  presetA,
  presetB,
  onClose,
}: PresetComparisonModalProps) {
  const t = useTranslations('dashboard');
  const tc = useTranslations('common');

  // Compute indicators for both presets
  const indicatorsA = useMemo(() => {
    const rows = computeAllIndicators(presetA.drugs);
    return rows.map((r) => ({ label: r.label, value: r.valueA }));
  }, [presetA.drugs]);

  const indicatorsB = useMemo(() => {
    const rows = computeAllIndicators(presetB.drugs);
    return rows.map((r) => ({ label: r.label, value: r.valueA }));
  }, [presetB.drugs]);

  // Diff table
  const diffRows = useMemo(() => {
    return indicatorsA.map((a, i) => {
      const b = indicatorsB[i];
      const delta = b.value - a.value;
      return {
        label: a.label,
        valueA: a.value,
        valueB: b.value,
        delta,
      };
    });
  }, [indicatorsA, indicatorsB]);

  // Drug diff
  const drugIdsA = new Set(Object.keys(presetA.drugs));
  const drugIdsB = new Set(Object.keys(presetB.drugs));

  const onlyInA = [...drugIdsA].filter((id) => !drugIdsB.has(id));
  const onlyInB = [...drugIdsB].filter((id) => !drugIdsA.has(id));
  const inBoth = [...drugIdsA].filter((id) => drugIdsB.has(id));
  const changedDoses = inBoth.filter(
    (id) => presetA.drugs[id] !== presetB.drugs[id],
  );

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: Z.modal + 1,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
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
          width: 'min(1100px, 94vw)',
          maxHeight: '90vh',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: '#60a5fa',
              }}
            >
              {presetA.name}
            </span>
            <span style={{ color: '#5a6478', fontSize: 13 }}>vs</span>
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: '#818cf8',
              }}
            >
              {presetB.name}
            </span>
          </div>
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

        {/* Body — scrollable */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 24,
          }}
        >
          {/* Split view: A vs B */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 32,
              marginBottom: 32,
            }}
          >
            <PresetColumn preset={presetA} indicators={indicatorsA} />
            <PresetColumn preset={presetB} indicators={indicatorsB} />
          </div>

          {/* Diff table */}
          <div
            style={{
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.06)',
              overflow: 'hidden',
              marginBottom: 24,
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 13,
              }}
            >
              <thead>
                <tr
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '10px 14px',
                      color: '#94a3b8',
                      fontWeight: 500,
                      fontSize: 12,
                    }}
                  >
                    Indicator
                  </th>
                  <th
                    style={{
                      textAlign: 'right',
                      padding: '10px 14px',
                      color: '#60a5fa',
                      fontWeight: 500,
                      fontSize: 12,
                    }}
                  >
                    {presetA.name}
                  </th>
                  <th
                    style={{
                      textAlign: 'right',
                      padding: '10px 14px',
                      color: '#818cf8',
                      fontWeight: 500,
                      fontSize: 12,
                    }}
                  >
                    {presetB.name}
                  </th>
                  <th
                    style={{
                      textAlign: 'right',
                      padding: '10px 14px',
                      color: '#94a3b8',
                      fontWeight: 500,
                      fontSize: 12,
                    }}
                  >
                    Δ
                  </th>
                </tr>
              </thead>
              <tbody>
                {diffRows.map((row) => {
                  const deltaColor =
                    row.delta > 0
                      ? '#22c55e'
                      : row.delta < 0
                        ? '#ef4444'
                        : '#64748b';

                  return (
                    <tr
                      key={row.label}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                      }}
                    >
                      <td
                        style={{
                          padding: '8px 14px',
                          color: '#f0f2f5',
                          fontWeight: 500,
                        }}
                      >
                        {row.label}
                      </td>
                      <td
                        style={{
                          padding: '8px 14px',
                          textAlign: 'right',
                          fontFamily: 'var(--font-mono)',
                          color: '#94a3b8',
                        }}
                      >
                        {row.valueA}%
                      </td>
                      <td
                        style={{
                          padding: '8px 14px',
                          textAlign: 'right',
                          fontFamily: 'var(--font-mono)',
                          color: '#94a3b8',
                        }}
                      >
                        {row.valueB}%
                      </td>
                      <td
                        style={{
                          padding: '8px 14px',
                          textAlign: 'right',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 600,
                          color: deltaColor,
                        }}
                      >
                        {row.delta > 0 ? '+' : ''}
                        {row.delta}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Drug differences */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 16,
            }}
          >
            {/* Only in A */}
            {onlyInA.length > 0 && (
              <div
                style={{
                  padding: 14,
                  borderRadius: 10,
                  background: 'rgba(96,165,250,0.04)',
                  border: '1px solid rgba(96,165,250,0.12)',
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#60a5fa',
                    marginBottom: 8,
                  }}
                >
                  Only in {presetA.name}
                </div>
                {onlyInA.map((id) => {
                  const d = DRUGS[id];
                  return d ? (
                    <div
                      key={id}
                      style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}
                    >
                      {d.brand || d.s} ({presetA.drugs[id]} {d.u})
                    </div>
                  ) : null;
                })}
              </div>
            )}

            {/* Only in B */}
            {onlyInB.length > 0 && (
              <div
                style={{
                  padding: 14,
                  borderRadius: 10,
                  background: 'rgba(129,140,248,0.04)',
                  border: '1px solid rgba(129,140,248,0.12)',
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#818cf8',
                    marginBottom: 8,
                  }}
                >
                  Only in {presetB.name}
                </div>
                {onlyInB.map((id) => {
                  const d = DRUGS[id];
                  return d ? (
                    <div
                      key={id}
                      style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}
                    >
                      {d.brand || d.s} ({presetB.drugs[id]} {d.u})
                    </div>
                  ) : null;
                })}
              </div>
            )}

            {/* Changed doses */}
            {changedDoses.length > 0 && (
              <div
                style={{
                  padding: 14,
                  borderRadius: 10,
                  background: 'rgba(245,158,11,0.04)',
                  border: '1px solid rgba(245,158,11,0.12)',
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#f59e0b',
                    marginBottom: 8,
                  }}
                >
                  Changed doses
                </div>
                {changedDoses.map((id) => {
                  const d = DRUGS[id];
                  return d ? (
                    <div
                      key={id}
                      style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}
                    >
                      {d.brand || d.s}: {presetA.drugs[id]} → {presetB.drugs[id]}{' '}
                      {d.u}
                    </div>
                  ) : null;
                })}
              </div>
            )}

            {/* If all three are empty */}
            {onlyInA.length === 0 &&
              onlyInB.length === 0 &&
              changedDoses.length === 0 && (
                <div
                  style={{
                    gridColumn: '1 / -1',
                    padding: 16,
                    textAlign: 'center',
                    color: '#64748b',
                    fontSize: 13,
                  }}
                >
                  Identical drug lists and doses
                </div>
              )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
