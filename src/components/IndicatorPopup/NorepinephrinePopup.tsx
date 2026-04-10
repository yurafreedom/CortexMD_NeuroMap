'use client';

import React, { useMemo } from 'react';
import IndicatorPopup from './IndicatorPopup';
import { calculateNorepinephrineBalance } from '@/lib/indicators/norepinephrine';
import { calculateOccupancy, estimateBrainConcentration_nM } from '@/lib/indicators/occupancy';
import type { ActiveDrug } from '@/lib/indicators/balance';

interface NorepinephrinePopupProps {
  isOpen: boolean;
  onClose: () => void;
  activeDrugs: ActiveDrug[];
}

const NA_RECEPTORS = [
  { receptor: 'NET', label: 'NET (транспортёр)', color: '#60a5fa' },
  { receptor: 'alpha2A', label: 'α2A (ауторецептор, LC)', color: '#f59e0b' },
  { receptor: 'alpha1', label: 'α1 (постсинаптический)', color: '#fb923c' },
  { receptor: 'alpha2B', label: 'α2B', color: '#fbbf24' },
  { receptor: 'alpha2C', label: 'α2C', color: '#d97706' },
  { receptor: 'beta1', label: 'β1 (сердечный, ЦНС)', color: '#ef4444' },
  { receptor: 'beta2', label: 'β2 (бронхиальный, ЦНС)', color: '#f472b6' },
] as const;

const NA_REGIONS = [
  { id: 'lc', name: 'Locus Coeruleus (LC)', role: 'Основной источник NA в ЦНС', color: '#60a5fa' },
  { id: 'pfc', name: 'PFC', role: 'α2A → рабочая память, внимание', color: '#22c55e' },
  { id: 'hippo', name: 'Гиппокамп', role: 'NA → консолидация памяти, стресс-ответ', color: '#a78bfa' },
  { id: 'amygdala', name: 'Амигдала', role: 'NA → fight-or-flight, страх, тревога', color: '#ef4444' },
];

export default function NorepinephrinePopup({ isOpen, onClose, activeDrugs }: NorepinephrinePopupProps) {
  const balance = useMemo(
    () => calculateNorepinephrineBalance(activeDrugs),
    [activeDrugs]
  );

  const receptorOccupancies = useMemo(() => {
    return NA_RECEPTORS.map((rec) => {
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
            drugContribs.push({ name: drug.generic_name, occ, type: binding.type });
          }
        }
      }

      return { ...rec, totalOcc: Math.min(100, totalOcc), drugContribs };
    });
  }, [activeDrugs]);

  const contributingDrugs = useMemo(() => {
    const drugs: { name: string; mechanisms: string[] }[] = [];
    const naReceptorIds = NA_RECEPTORS.map(r => r.receptor as string);
    for (const { drug } of activeDrugs) {
      const mechanisms: string[] = [];
      for (const binding of drug.bindings) {
        if (naReceptorIds.includes(binding.receptor)) {
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
      title="Норадреналиновая система"
      accentColor="#f59e0b"
      balance={balance}
    >
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* Subreceptor breakdown */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12, padding: 20, minWidth: 280,
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
        </div>

        {/* Regions + tonic/phasic */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12, padding: 20, minWidth: 260,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.08em', color: 'rgba(255,255,255,0.38)', marginBottom: 12,
          }}>
            РЕГИОНЫ
          </div>

          {NA_REGIONS.map((region) => (
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

          {/* Tonic vs phasic explanation */}
          <div style={{
            marginTop: 8, paddingTop: 12,
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#f59e0b', marginBottom: 6 }}>
              Тоническая vs фазическая активность
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Тоническая: базовый уровень NA → бдительность, общая активация.
              Фазическая: кратковременные всплески → фокус внимания, обнаружение новизны.
              Оптимальное соотношение критично для СДВГ и тревожных расстройств.
            </div>
          </div>
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
    </IndicatorPopup>
  );
}
