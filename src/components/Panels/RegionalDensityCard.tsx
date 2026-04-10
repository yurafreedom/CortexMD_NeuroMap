'use client';

import React, { useMemo } from 'react';
import { REGIONAL_DENSITY, getTopReceptorsInRegion } from '@/data/regional-density';
import type { CortexMDRegion } from '@/data/regional-density';
import { calculateAllRegionalBalances } from '@/lib/indicators/regionalBalance';
import { DRUGS_V2 } from '@/data/drugs.v2';
import type { ActiveDrug } from '@/lib/indicators/balance';

interface RegionalDensityCardProps {
  region: string;
  activeDrugs: Record<string, number>;
}

/** Map of RG region keys to CortexMDRegion keys (where they overlap) */
const REGION_MAP: Record<string, CortexMDRegion> = {
  dlPFC: 'dlPFC',
  vmPFC: 'vmPFC',
  acc: 'acc',
  insula: 'insula',
  hippo: 'hippo',
  amygdala: 'amygdala',
  parietal: 'parietal',
};

const INDICATOR_LABELS: Record<string, { label: string; color: string }> = {
  DA: { label: 'DA', color: '#22c55e' },
  NA: { label: 'NA', color: '#f59e0b' },
  '5HT': { label: '5-HT', color: '#60a5fa' },
  Glu: { label: 'Glu', color: '#a78bfa' },
};

export default function RegionalDensityCard({ region, activeDrugs }: RegionalDensityCardProps) {
  const cortexRegion = REGION_MAP[region];

  const activeDrugList = useMemo((): ActiveDrug[] => {
    const result: ActiveDrug[] = [];
    for (const [id, dose] of Object.entries(activeDrugs)) {
      const drug = DRUGS_V2[id];
      if (drug) result.push({ drug, dose_mg: dose });
    }
    return result;
  }, [activeDrugs]);

  const topReceptors = useMemo(() => {
    if (!cortexRegion) return [];
    return getTopReceptorsInRegion(cortexRegion, 8);
  }, [cortexRegion]);

  const regionalBalances = useMemo(() => {
    if (!cortexRegion || activeDrugList.length === 0) return null;
    return calculateAllRegionalBalances(activeDrugList, cortexRegion);
  }, [cortexRegion, activeDrugList]);

  if (!cortexRegion || !REGIONAL_DENSITY[cortexRegion]) return null;

  return (
    <div style={{ marginTop: 12 }}>
      {/* Section title */}
      <div style={{
        fontSize: 10, fontWeight: 600, color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.06em',
        marginBottom: 8, padding: '0 4px',
      }}>
        PET Receptor Density
      </div>

      {/* Top receptors in this region */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 10, padding: 10, marginBottom: 8,
      }}>
        {topReceptors.map(({ receptor, density }) => (
          <div key={receptor} style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4,
          }}>
            <span style={{
              fontSize: 10, fontFamily: 'var(--font-mono)',
              color: 'var(--text-secondary)', width: 80,
            }}>
              {receptor}
            </span>
            <div style={{
              flex: 1, height: 3, background: 'rgba(255,255,255,0.06)',
              borderRadius: 2, overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', width: `${density * 100}%`,
                background: density > 0.7 ? '#60a5fa' : density > 0.4 ? '#818cf8' : '#475569',
                borderRadius: 2, transition: 'width 0.3s ease',
              }} />
            </div>
            <span style={{
              fontSize: 9, fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)', width: 28, textAlign: 'right',
            }}>
              {(density * 100).toFixed(0)}%
            </span>
          </div>
        ))}
        <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 6, fontStyle: 'italic' }}>
          Hansen et al. 2022, Nat Neurosci
        </div>
      </div>

      {/* Regional balances (only if drugs active) */}
      {regionalBalances && (
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 10, padding: 10,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 600, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.05em',
            marginBottom: 6,
          }}>
            Regional Balance
          </div>
          {Object.entries(INDICATOR_LABELS).map(([id, { label, color }]) => {
            const bal = regionalBalances[id];
            if (!bal) return null;
            const absVal = Math.abs(bal.value);
            const sign = bal.value >= 0 ? '+' : '';
            return (
              <div key={id} style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4,
              }}>
                <span style={{
                  fontSize: 10, fontWeight: 600, color,
                  width: 32,
                }}>
                  {label}
                </span>
                <div style={{
                  flex: 1, height: 4, background: 'rgba(255,255,255,0.06)',
                  borderRadius: 2, overflow: 'hidden', position: 'relative',
                }}>
                  {/* Center marker */}
                  <div style={{
                    position: 'absolute', left: '50%', top: 0, bottom: 0,
                    width: 1, background: 'rgba(255,255,255,0.15)',
                  }} />
                  {/* Fill from center */}
                  <div style={{
                    position: 'absolute',
                    left: bal.value >= 0 ? '50%' : `${50 - absVal / 2}%`,
                    width: `${absVal / 2}%`,
                    top: 0, bottom: 0,
                    background: bal.zone.color,
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                  }} />
                </div>
                <span style={{
                  fontSize: 10, fontFamily: 'var(--font-mono)',
                  color: bal.zone.color, width: 36, textAlign: 'right',
                }}>
                  {sign}{bal.value.toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
