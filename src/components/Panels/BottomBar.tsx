'use client';

import React, { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { gH, hCol, cypVal } from '../../lib/pharmacology';
import type { ActiveDrugs } from '../../lib/pharmacology';
import { DRUGS_V2 } from '../../data/drugs.v2';
import { calculateSigma1Balance } from '../../lib/indicators/sigma1';
import { calculateGlutamateBalance } from '../../lib/indicators/glutamate';
import { CONDITIONAL_INDICATORS, calculateACBScore } from '../../lib/indicators/conditional';
import type { ActiveDrug } from '../../lib/indicators/balance';

export type IndicatorKey = 'da' | 'na' | '5ht' | 'glu' | 's1' | 'cyp';

interface BottomBarProps {
  activeDrugs: ActiveDrugs;
  onIndicatorClick?: (key: IndicatorKey) => void;
}

/** Convert legacy ActiveDrugs (id→dose) to ActiveDrug[] for v2 indicators */
function toActiveDrugList(activeDrugs: ActiveDrugs): ActiveDrug[] {
  const result: ActiveDrug[] = [];
  for (const [id, dose] of Object.entries(activeDrugs)) {
    const drug = DRUGS_V2[id];
    if (drug) result.push({ drug, dose_mg: dose });
  }
  return result;
}

interface BarItem {
  key: string;
  label: string;
  value: number;
  color: string;
  width: number;
  isSigned?: boolean;
  isCyp?: boolean;
  isAcb?: boolean;
  acbScore?: number;
}

export default function BottomBar({ activeDrugs, onIndicatorClick }: BottomBarProps) {
  const t = useTranslations('neurotransmitters');
  const hasActive = Object.keys(activeDrugs).length > 0;

  const drugList = useMemo(
    () => toActiveDrugList(activeDrugs),
    [activeDrugs]
  );

  // ─── Core 6 indicators ───────────────────────────────────────────
  const coreData = useMemo((): BarItem[] => {
    const cores: { key: string; label: string; nt?: string; isGlu?: boolean; isS1?: boolean; isCyp?: boolean }[] = [
      { key: 'da', label: 'DA', nt: 'DA' },
      { key: 'na', label: 'NA', nt: 'NA' },
      { key: '5ht', label: '5-HT', nt: '5-HT' },
      { key: 'glu', label: 'Glu', isGlu: true },
      { key: 's1', label: 'σ1', isS1: true },
      { key: 'cyp', label: 'CYP', isCyp: true },
    ];

    return cores.map((bar) => {
      if (bar.isCyp) {
        const cy = cypVal(activeDrugs);
        const cc = cy > 60 ? '#ef4444' : cy > 30 ? '#f59e0b' : '#22c55e';
        return { key: bar.key, label: bar.label, value: cy, color: cc, width: cy, isCyp: true };
      }

      if (bar.isGlu) {
        if (!hasActive) {
          return { key: bar.key, label: bar.label, value: 0, color: '#94a3b8', width: 0, isSigned: true };
        }
        const balance = calculateGlutamateBalance(drugList);
        const absValue = Math.abs(balance.value);
        return {
          key: bar.key, label: bar.label,
          value: balance.value,
          color: absValue < 10 ? '#a78bfa' : balance.zone.color,
          width: Math.min(100, absValue),
          isSigned: true,
        };
      }

      if (bar.isS1) {
        if (!hasActive) {
          return { key: bar.key, label: bar.label, value: 0, color: '#94a3b8', width: 0, isSigned: true };
        }
        const balance = calculateSigma1Balance(drugList);
        const absValue = Math.abs(balance.value);
        return {
          key: bar.key, label: bar.label,
          value: balance.value,
          color: balance.zone.color,
          width: Math.min(100, absValue),
          isSigned: true,
        };
      }

      // DA, NA, 5-HT still use legacy gH()
      const v = hasActive ? gH(bar.nt!, activeDrugs) : 65;
      const c = hCol(v);
      return { key: bar.key, label: bar.label, value: v, color: c, width: Math.min(100, v / 2) };
    });
  }, [activeDrugs, hasActive, drugList]);

  // ─── Conditional indicators ────────────────────────────────────────
  const conditionalData = useMemo((): BarItem[] => {
    if (!hasActive) return [];

    const active: BarItem[] = [];
    for (const ci of CONDITIONAL_INDICATORS) {
      if (!ci.detect(drugList)) continue;

      if (ci.id === 'ACh') {
        // ACh is a score indicator, not balance
        const score = calculateACBScore(drugList);
        const acbColor = score >= 6 ? '#ef4444' : score >= 3 ? '#fbbf24' : '#22c55e';
        active.push({
          key: `cond-${ci.id}`,
          label: ci.shortLabel,
          value: score,
          color: acbColor,
          width: Math.min(100, score * 12),
          isAcb: true,
          acbScore: score,
        });
        continue;
      }

      const balance = ci.calculate(drugList);
      const absValue = Math.abs(balance.value);
      active.push({
        key: `cond-${ci.id}`,
        label: ci.shortLabel,
        value: balance.value,
        color: ci.color,
        width: Math.min(100, absValue),
        isSigned: true,
      });
    }
    return active;
  }, [hasActive, drugList]);

  return (
    <div className="bottom-bar-wrap">
      <div id="bb">
        {/* Core 6 indicators */}
        {coreData.map((bar) => (
          <div
            className="hb"
            key={bar.key}
            onClick={() => onIndicatorClick?.(bar.key as IndicatorKey)}
            style={{ cursor: onIndicatorClick ? 'pointer' : undefined }}
          >
            <div className="hl">{bar.label}</div>
            <div className="hv" style={{ color: bar.color }}>
              {bar.isSigned
                ? `${bar.value >= 0 ? '+' : ''}${bar.value.toFixed(0)}%`
                : bar.isCyp
                  ? `${bar.value}%`
                  : `${bar.value.toFixed(0)}%`}
            </div>
            <div className="hbar">
              <div
                className="hfill"
                style={{ width: `${bar.width}%`, background: bar.color }}
              />
            </div>
          </div>
        ))}

        {/* Divider + conditional indicators */}
        {conditionalData.length > 0 && (
          <>
            <div
              className="hb-divider"
              style={{
                width: 1,
                alignSelf: 'stretch',
                background: 'rgba(255,255,255,0.12)',
                margin: '0 6px',
                flexShrink: 0,
              }}
            />
            {conditionalData.map((bar) => (
              <div className="hb" key={bar.key}>
                <div className="hl">{bar.label}</div>
                <div className="hv" style={{ color: bar.color }}>
                  {bar.isAcb
                    ? `ACB:${bar.acbScore}`
                    : bar.isSigned
                      ? `${bar.value >= 0 ? '+' : ''}${bar.value.toFixed(0)}%`
                      : `${bar.value.toFixed(0)}%`}
                </div>
                <div className="hbar">
                  <div
                    className="hfill"
                    style={{ width: `${bar.width}%`, background: bar.color }}
                  />
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
