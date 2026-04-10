'use client';

import React, { useMemo } from 'react';
import IndicatorPopup from './IndicatorPopup';
import { calculateGlutamateBalance } from '@/lib/indicators/glutamate';
import { calculateOccupancy, estimateBrainConcentration_nM } from '@/lib/indicators/occupancy';
import type { ActiveDrug } from '@/lib/indicators/balance';

interface GlutamatePopupProps {
  isOpen: boolean;
  onClose: () => void;
  activeDrugs: ActiveDrug[];
  onShowCascade?: () => void;
}

const GLU_RECEPTORS = [
  { receptor: 'GluN2B', label: 'GluN2B (экстрасинаптический, про-апоптоз)', color: '#ef4444', group: 'NMDA' },
  { receptor: 'GluN2A', label: 'GluN2A (синаптический, про-выживание)', color: '#22c55e', group: 'NMDA' },
  { receptor: 'NMDA', label: 'NMDA (общий)', color: '#f59e0b', group: 'NMDA' },
  { receptor: 'AMPA', label: 'AMPA (быстрая передача)', color: '#60a5fa', group: 'ionotropic' },
  { receptor: 'kainate', label: 'Каинатные', color: '#06b6d4', group: 'ionotropic' },
  { receptor: 'mGluR2', label: 'mGluR2 (пресинаптический ингибитор)', color: '#a78bfa', group: 'metabotropic' },
  { receptor: 'mGluR3', label: 'mGluR3 (глия)', color: '#c084fc', group: 'metabotropic' },
  { receptor: 'mGluR5', label: 'mGluR5 (постсинаптический)', color: '#e879f9', group: 'metabotropic' },
  { receptor: 'cystineGlutamateAntiporter', label: 'Cystine-Glu антипортёр (Xc-)', color: '#a3e635', group: 'transport' },
  { receptor: 'presynapticGluRelease', label: 'Пресинаптический выброс Glu', color: '#fbbf24', group: 'transport' },
  { receptor: 'glutamateUptake', label: 'Обратный захват Glu (EAAT)', color: '#2dd4bf', group: 'transport' },
] as const;

export default function GlutamatePopup({ isOpen, onClose, activeDrugs, onShowCascade }: GlutamatePopupProps) {
  const balance = useMemo(
    () => calculateGlutamateBalance(activeDrugs),
    [activeDrugs]
  );

  const receptorOccupancies = useMemo(() => {
    return GLU_RECEPTORS.map((rec) => {
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
    const gluReceptorIds = GLU_RECEPTORS.map(r => r.receptor as string);
    for (const { drug } of activeDrugs) {
      const mechanisms: string[] = [];
      for (const binding of drug.bindings) {
        if (gluReceptorIds.includes(binding.receptor)) {
          mechanisms.push(`${binding.receptor} ${binding.type}`);
        }
      }
      if (mechanisms.length > 0) {
        drugs.push({ name: drug.generic_name, mechanisms });
      }
    }
    return drugs;
  }, [activeDrugs]);

  // Group receptors by type for display
  const nmdaGroup = receptorOccupancies.filter(r => r.group === 'NMDA');
  const ionotropicGroup = receptorOccupancies.filter(r => r.group === 'ionotropic');
  const metabotropicGroup = receptorOccupancies.filter(r => r.group === 'metabotropic');
  const transportGroup = receptorOccupancies.filter(r => r.group === 'transport');

  const renderGroup = (title: string, items: typeof receptorOccupancies) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)',
        textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6,
      }}>
        {title}
      </div>
      {items.map((rec) => (
        <div key={rec.receptor} style={{ marginBottom: 8 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 3,
          }}>
            <span style={{ fontSize: 11, color: rec.color, fontWeight: 600 }}>
              {rec.label}
            </span>
            <span style={{
              fontSize: 11, fontFamily: 'var(--font-mono)',
              color: rec.totalOcc > 30 ? rec.color : 'var(--text-secondary)',
            }}>
              {rec.totalOcc.toFixed(0)}%
            </span>
          </div>
          <div style={{
            height: 3, background: 'rgba(255,255,255,0.06)',
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
  );

  return (
    <IndicatorPopup
      isOpen={isOpen}
      onClose={onClose}
      title="Глутаматная система"
      accentColor="#a78bfa"
      balance={balance}
    >
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* Receptor breakdown by groups */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12, padding: 20, minWidth: 320,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.08em', color: 'rgba(255,255,255,0.38)', marginBottom: 12,
          }}>
            РЕЦЕПТОРЫ И МЕХАНИЗМЫ
          </div>

          {renderGroup('NMDA-рецепторы', nmdaGroup)}
          {renderGroup('Ионотропные (non-NMDA)', ionotropicGroup)}
          {renderGroup('Метаботропные (mGluR)', metabotropicGroup)}
          {renderGroup('Транспорт / модуляция', transportGroup)}
        </div>

        {/* GluN2A vs GluN2B balance + explanation */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12, padding: 20, minWidth: 260,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.08em', color: 'rgba(255,255,255,0.38)', marginBottom: 12,
          }}>
            GluN2A vs GluN2B
          </div>

          <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
            <div style={{ marginBottom: 8 }}>
              <span style={{ color: '#22c55e', fontWeight: 600 }}>GluN2A</span> (синаптический):
              промотирует LTP, нейропластичность, нейропротекцию.
            </div>
            <div style={{ marginBottom: 8 }}>
              <span style={{ color: '#ef4444', fontWeight: 600 }}>GluN2B</span> (экстрасинаптический):
              активация при эксайтотоксичности, про-апоптотические каскады.
              Кетамин преимущественно блокирует GluN2B → антидепрессивный эффект.
            </div>
            <div>
              <span style={{ color: '#a3e635', fontWeight: 600 }}>NAC</span> через Xc-антипортёр:
              снижает экстрасинаптический глутамат, уменьшая GluN2B-активацию.
            </div>
          </div>

          {/* Связь с σ1 */}
          <div style={{
            paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#c084fc', marginBottom: 6 }}>
              Связь с σ1-каскадом
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              σ1R модулирует NMDA через прямое взаимодействие с GluN2-субъединицами.
              σ1-агонисты (донепезил, флувоксамин) потенцируют NMDA-ток,
              σ1-антагонисты — ослабляют. Этот cross-talk критичен для
              нейропластичности при депрессии.
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

      {/* Cascade mini */}
      <div style={{
        marginTop: 20, padding: '12px 20px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 8, fontSize: 11, color: 'var(--text-secondary)',
        fontFamily: 'var(--font-mono)', textAlign: 'center',
      }}>
        NMDA → Ca&sup2;&#8314; → CaMKII → CREB → BDNF → mTOR → синаптическая пластичность
      </div>

      {onShowCascade && (
        <button
          onClick={() => { onClose(); onShowCascade(); }}
          style={{
            marginTop: 12, padding: '10px 24px',
            background: 'linear-gradient(135deg, #a78bfa, #818cf8)',
            border: 'none', borderRadius: 8, cursor: 'pointer',
            fontSize: 13, fontWeight: 600, color: '#fff',
            transition: 'opacity 0.2s ease',
          }}
          onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = '0.85'; }}
          onMouseLeave={(e) => { (e.target as HTMLElement).style.opacity = '1'; }}
        >
          Открыть полный каскад
        </button>
      )}
    </IndicatorPopup>
  );
}
