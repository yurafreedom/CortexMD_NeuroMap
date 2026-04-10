'use client';

import React, { useMemo } from 'react';
import IndicatorPopup from './IndicatorPopup';
import { calculateSerotoninBalance } from '@/lib/indicators/serotonin';
import { calculateOccupancy, estimateBrainConcentration_nM } from '@/lib/indicators/occupancy';
import type { ActiveDrug } from '@/lib/indicators/balance';

interface SerotoninPopupProps {
  isOpen: boolean;
  onClose: () => void;
  activeDrugs: ActiveDrug[];
}

const HT_RECEPTORS = [
  { receptor: 'SERT', label: 'SERT (транспортёр)', color: '#60a5fa', group: 'transport' },
  { receptor: '5HT1A', label: '5-HT1A (ауторецептор / постсинапс)', color: '#22c55e', group: 'inhibitory' },
  { receptor: '5HT2A', label: '5-HT2A (Gq → PLC)', color: '#ef4444', group: 'excitatory' },
  { receptor: '5HT2C', label: '5-HT2C (Gq → PLC)', color: '#f59e0b', group: 'excitatory' },
  { receptor: '5HT3', label: '5-HT3 (ионный канал)', color: '#06b6d4', group: 'other' },
  { receptor: '5HT7', label: '5-HT7 (Gs → cAMP↑)', color: '#a78bfa', group: 'other' },
  { receptor: '5HT1B', label: '5-HT1B (терминальный ауторецептор)', color: '#34d399', group: 'inhibitory' },
  { receptor: '5HT1D', label: '5-HT1D', color: '#2dd4bf', group: 'inhibitory' },
  { receptor: '5HT6', label: '5-HT6 (Gs → когнитивный)', color: '#c084fc', group: 'other' },
] as const;

const HT_REGIONS = [
  { id: 'raphe', name: 'Ядра шва (Raphe)', role: 'Источник 5-HT нейронов', color: '#818cf8' },
  { id: 'pfc', name: 'PFC', role: '5-HT2A/1A модуляция когнитивных функций', color: '#60a5fa' },
  { id: 'hippo', name: 'Гиппокамп', role: '5-HT1A → нейрогенез, память', color: '#22c55e' },
  { id: 'insula', name: 'Инсула', role: '5-HT → интероцепция, тошнота (5-HT3)', color: '#f59e0b' },
  { id: 'acc', name: 'ACC', role: '5-HT2A → эмоциональная регуляция', color: '#ef4444' },
];

export default function SerotoninPopup({ isOpen, onClose, activeDrugs }: SerotoninPopupProps) {
  const balance = useMemo(
    () => calculateSerotoninBalance(activeDrugs),
    [activeDrugs]
  );

  const receptorOccupancies = useMemo(() => {
    return HT_RECEPTORS.map((rec) => {
      let totalOcc = 0;
      const drugContribs: { name: string; occ: number; type: string }[] = [];

      for (const { drug, dose_mg } of activeDrugs) {
        const conc = estimateBrainConcentration_nM(dose_mg, drug.id);
        for (const binding of drug.bindings) {
          if (binding.receptor === rec.receptor) {
            const occ = binding.ki_nM === 0
              ? (dose_mg > 0 ? 50 : 0)
              : calculateOccupancy(conc, binding.ki_nM) * 100;
            totalOcc += occ;
            drugContribs.push({
              name: drug.generic_name,
              occ,
              type: binding.type,
            });
          }
        }
      }

      return { ...rec, totalOcc: Math.min(100, totalOcc), drugContribs };
    });
  }, [activeDrugs]);

  // 5HT2A / 5HT2C ratio
  const ratio2A2C = useMemo(() => {
    const r2a = receptorOccupancies.find(r => r.receptor === '5HT2A');
    const r2c = receptorOccupancies.find(r => r.receptor === '5HT2C');
    if (!r2a || !r2c || r2c.totalOcc === 0) return null;
    return {
      value: r2a.totalOcc / r2c.totalOcc,
      occ2a: r2a.totalOcc,
      occ2c: r2c.totalOcc,
    };
  }, [receptorOccupancies]);

  const contributingDrugs = useMemo(() => {
    const drugs: { name: string; mechanisms: string[] }[] = [];
    const htReceptorIds = HT_RECEPTORS.map(r => r.receptor as string);
    for (const { drug } of activeDrugs) {
      const mechanisms: string[] = [];
      for (const binding of drug.bindings) {
        if (htReceptorIds.includes(binding.receptor)) {
          mechanisms.push(`${binding.receptor} ${binding.type}`);
        }
      }
      if (mechanisms.length > 0) {
        drugs.push({ name: drug.generic_name, mechanisms });
      }
    }
    return drugs;
  }, [activeDrugs]);

  return (
    <IndicatorPopup
      isOpen={isOpen}
      onClose={onClose}
      title="Серотониновая система (5-HT)"
      accentColor="#818cf8"
      balance={balance}
    >
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* Subreceptor breakdown */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12, padding: 20, minWidth: 300,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.08em', color: 'rgba(255,255,255,0.38)', marginBottom: 12,
          }}>
            СУБРЕЦЕПТОРЫ
          </div>

          {receptorOccupancies.map((rec) => (
            <div key={rec.receptor} style={{ marginBottom: 10 }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 3,
              }}>
                <span style={{ fontSize: 12, color: rec.color, fontWeight: 600 }}>
                  {rec.label}
                </span>
                <span style={{
                  fontSize: 12, fontFamily: 'var(--font-mono)',
                  color: rec.totalOcc > 50 ? rec.color : 'var(--text-secondary)',
                }}>
                  {rec.totalOcc.toFixed(0)}%
                </span>
              </div>
              <div style={{
                height: 4, background: 'rgba(255,255,255,0.06)',
                borderRadius: 2, overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', width: `${rec.totalOcc}%`,
                  background: rec.color, borderRadius: 2,
                  transition: 'width 0.5s ease',
                }} />
              </div>
              {rec.drugContribs.length > 0 && (
                <div style={{ marginTop: 2 }}>
                  {rec.drugContribs.map((dc, i) => (
                    <span key={i} style={{
                      fontSize: 9, color: 'var(--text-secondary)', marginRight: 8,
                    }}>
                      {dc.name} ({dc.type}: {dc.occ.toFixed(0)}%)
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* 5HT2A/2C ratio */}
          {ratio2A2C && (
            <div style={{
              marginTop: 12, paddingTop: 10,
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
                Соотношение 5-HT2A / 5-HT2C:
              </div>
              <div style={{
                fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)',
                color: ratio2A2C.value > 2 ? '#ef4444' : ratio2A2C.value > 1 ? '#f59e0b' : '#22c55e',
              }}>
                {ratio2A2C.value.toFixed(2)}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                {ratio2A2C.value > 2 ? 'Высокий 2A → риск тревожности, бессонницы'
                  : ratio2A2C.value > 1 ? 'Умеренный'
                  : 'Низкий 2A/2C → благоприятный профиль'}
              </div>
            </div>
          )}
        </div>

        {/* Region map */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12, padding: 20, minWidth: 240,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.08em', color: 'rgba(255,255,255,0.38)', marginBottom: 12,
          }}>
            РЕГИОНЫ
          </div>

          {HT_REGIONS.map((region) => (
            <div key={region.id} style={{
              marginBottom: 12, paddingBottom: 8,
              borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: region.color, flexShrink: 0,
                }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: region.color }}>
                  {region.name}
                </span>
              </div>
              <div style={{
                fontSize: 11, color: 'var(--text-secondary)', paddingLeft: 16,
              }}>
                {region.role}
              </div>
            </div>
          ))}
        </div>

        {/* Contributing drugs */}
        {contributingDrugs.length > 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12, padding: 20, minWidth: 240,
          }}>
            <div style={{
              fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: '0.08em', color: 'rgba(255,255,255,0.38)', marginBottom: 12,
            }}>
              АКТИВНЫЕ ПРЕПАРАТЫ
            </div>
            {contributingDrugs.map((d) => (
              <div key={d.name} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>
                  {d.name}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                  {d.mechanisms.join(', ')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cascade mini */}
      <div style={{
        marginTop: 20, padding: '12px 20px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 8, fontSize: 11, color: 'var(--text-secondary)',
        fontFamily: 'var(--font-mono)', textAlign: 'center',
      }}>
        5-HT2A → Gq → PLC → IP3/DAG &nbsp;|&nbsp; 5-HT2A → BDNF-транскрипция &nbsp;|&nbsp; 5-HT1A → Gi → cAMP↓
      </div>
    </IndicatorPopup>
  );
}
