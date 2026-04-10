'use client';

import React, { useMemo } from 'react';
import IndicatorPopup from './IndicatorPopup';
import { calculateDopamineBalance } from '@/lib/indicators/dopamine';
import { calculateOccupancy, estimateBrainConcentration_nM } from '@/lib/indicators/occupancy';
import type { ActiveDrug } from '@/lib/indicators/balance';

interface DopaminePopupProps {
  isOpen: boolean;
  onClose: () => void;
  activeDrugs: ActiveDrug[];
}

const DA_RECEPTORS = [
  { receptor: 'DAT', label: 'DAT (транспортёр)', color: '#60a5fa' },
  { receptor: 'D1', label: 'D1 (Gs → cAMP↑)', color: '#34d399' },
  { receptor: 'D2', label: 'D2 (Gi → cAMP↓)', color: '#f59e0b' },
  { receptor: 'D3', label: 'D3 (Gi → cAMP↓)', color: '#fb923c' },
  { receptor: 'D4', label: 'D4', color: '#a78bfa' },
  { receptor: 'D5', label: 'D5 (Gs → cAMP↑)', color: '#2dd4bf' },
] as const;

const DA_PATHWAYS = [
  {
    id: 'mesolimbic',
    name: 'Мезолимбический',
    route: 'VTA → NAc',
    function: 'Мотивация, вознаграждение, удовольствие',
    color: '#22c55e',
  },
  {
    id: 'mesocortical',
    name: 'Мезокортикальный',
    route: 'VTA → PFC',
    function: 'Рабочая память, исполнительные функции',
    color: '#60a5fa',
  },
  {
    id: 'nigrostriatal',
    name: 'Нигростриарный',
    route: 'SNc → Striatum',
    function: 'Моторный контроль, привычки',
    color: '#f59e0b',
  },
  {
    id: 'tuberoinfundibular',
    name: 'Тубероинфундибулярный',
    route: 'Arcuate → Pituitary',
    function: 'Пролактин (D2 ↑ → пролактин ↓)',
    color: '#ef4444',
  },
];

export default function DopaminePopup({ isOpen, onClose, activeDrugs }: DopaminePopupProps) {
  const balance = useMemo(
    () => calculateDopamineBalance(activeDrugs),
    [activeDrugs]
  );

  // Per-receptor occupancy from each drug
  const receptorOccupancies = useMemo(() => {
    return DA_RECEPTORS.map((rec) => {
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

  // Contributing drugs list
  const contributingDrugs = useMemo(() => {
    const drugs: { name: string; mechanisms: string[] }[] = [];
    for (const { drug } of activeDrugs) {
      const mechanisms: string[] = [];
      for (const binding of drug.bindings) {
        if (['DAT', 'D1', 'D2', 'D3', 'D4', 'D5'].includes(binding.receptor)) {
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
      title="Дофаминовая система"
      accentColor="#22c55e"
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
                      fontSize: 9, color: 'var(--text-secondary)',
                      marginRight: 8,
                    }}>
                      {dc.name} ({dc.type}: {dc.occ.toFixed(0)}%)
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pathways */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12, padding: 20, minWidth: 280,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.08em', color: 'rgba(255,255,255,0.38)', marginBottom: 12,
          }}>
            ДОФАМИНОВЫЕ ПУТИ
          </div>

          {DA_PATHWAYS.map((pw) => (
            <div key={pw.id} style={{
              marginBottom: 14, paddingBottom: 10,
              borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: pw.color, flexShrink: 0,
                }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: pw.color }}>
                  {pw.name}
                </span>
              </div>
              <div style={{
                fontSize: 11, fontFamily: 'var(--font-mono)',
                color: 'var(--text-secondary)', marginBottom: 2, paddingLeft: 16,
              }}>
                {pw.route}
              </div>
              <div style={{
                fontSize: 11, color: 'var(--text-secondary)', paddingLeft: 16,
              }}>
                {pw.function}
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
        D1 → Gs → cAMP↑ → PKA → DARPP-32 &nbsp;|&nbsp; D2 → Gi → cAMP↓ → противоположный эффект
      </div>
    </IndicatorPopup>
  );
}
