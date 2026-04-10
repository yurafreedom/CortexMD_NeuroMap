'use client';

import React, { useMemo } from 'react';
import IndicatorPopup from './IndicatorPopup';
import { calculateCYPBalance } from '@/lib/indicators/cyp';
import type { ActiveDrug } from '@/lib/indicators/balance';

interface CYPPopupProps {
  isOpen: boolean;
  onClose: () => void;
  activeDrugs: ActiveDrug[];
}

const CYP_ENZYMES = [
  { enzyme: 'CYP2D6', label: 'CYP2D6', color: '#ef4444', substrates: 'SSRI, TCA, антипсихотики, бета-блокаторы' },
  { enzyme: 'CYP2C19', label: 'CYP2C19', color: '#f59e0b', substrates: 'Эсциталопрам, сертралин, клопидогрель, ИПП' },
  { enzyme: 'CYP3A4', label: 'CYP3A4', color: '#22c55e', substrates: 'Бензодиазепины, карипразин, кветиапин, статины' },
  { enzyme: 'CYP1A2', label: 'CYP1A2', color: '#60a5fa', substrates: 'Флувоксамин, дулоксетин, клозапин, кофеин' },
  { enzyme: 'CYP2B6', label: 'CYP2B6', color: '#a78bfa', substrates: 'Бупропион, метадон, кетамин' },
];

export default function CYPPopup({ isOpen, onClose, activeDrugs }: CYPPopupProps) {
  const balance = useMemo(
    () => calculateCYPBalance(activeDrugs),
    [activeDrugs]
  );

  // Per-enzyme inhibition from each drug
  const enzymeData = useMemo(() => {
    return CYP_ENZYMES.map((enz) => {
      const inhibitors: { name: string; strength: string }[] = [];
      let maxStrength = 0;

      for (const { drug } of activeDrugs) {
        if (drug.cyp_inhibits) {
          for (const inhibition of drug.cyp_inhibits) {
            if (inhibition.enzyme === enz.enzyme) {
              const strengthVal =
                inhibition.strength === 'strong' ? 80
                : inhibition.strength === 'moderate' ? 50
                : 20;
              maxStrength = Math.max(maxStrength, strengthVal);
              inhibitors.push({
                name: drug.generic_name,
                strength: inhibition.strength,
              });
            }
          }
        }
      }

      return { ...enz, inhibitors, maxInhibition: maxStrength };
    });
  }, [activeDrugs]);

  // Drugs metabolized via inhibited enzymes (potential interaction warning)
  const affectedDrugs = useMemo(() => {
    const affected: { name: string; enzyme: string; risk: string }[] = [];
    const inhibitedEnzymes = enzymeData
      .filter(e => e.maxInhibition > 0)
      .map(e => e.enzyme);

    if (inhibitedEnzymes.length === 0) return affected;

    for (const { drug } of activeDrugs) {
      if (drug.pk && 'cyp_metabolized' in drug.pk) {
        // Future: check cyp_metabolized field
      }
      // For now, flag drugs that also inhibit the same enzyme
      // (self-inhibition = altered metabolism)
      if (drug.cyp_inhibits) {
        for (const inh of drug.cyp_inhibits) {
          if (inhibitedEnzymes.includes(inh.enzyme)) {
            affected.push({
              name: drug.generic_name,
              enzyme: inh.enzyme,
              risk: inh.strength === 'strong' ? 'high' : 'moderate',
            });
          }
        }
      }
    }
    return affected;
  }, [activeDrugs, enzymeData]);

  const hasInhibition = enzymeData.some(e => e.maxInhibition > 0);

  return (
    <IndicatorPopup
      isOpen={isOpen}
      onClose={onClose}
      title="CYP-ферменты: метаболизм препаратов"
      accentColor="#ef4444"
      balance={balance}
    >
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* Per-enzyme breakdown */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12, padding: 20, minWidth: 320,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.08em', color: 'rgba(255,255,255,0.38)', marginBottom: 12,
          }}>
            ИНГИБИРОВАНИЕ ПО ФЕРМЕНТАМ
          </div>

          {enzymeData.map((enz) => (
            <div key={enz.enzyme} style={{ marginBottom: 14 }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 3,
              }}>
                <span style={{ fontSize: 13, color: enz.color, fontWeight: 600 }}>
                  {enz.label}
                </span>
                <span style={{
                  fontSize: 12, fontFamily: 'var(--font-mono)',
                  color: enz.maxInhibition > 50 ? '#ef4444' : enz.maxInhibition > 0 ? '#f59e0b' : '#22c55e',
                }}>
                  {enz.maxInhibition > 0 ? `-${enz.maxInhibition}%` : 'OK'}
                </span>
              </div>
              <div style={{
                height: 6, background: 'rgba(255,255,255,0.06)',
                borderRadius: 3, overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${enz.maxInhibition}%`,
                  background: enz.maxInhibition > 50 ? '#ef4444' : enz.maxInhibition > 0 ? '#f59e0b' : 'transparent',
                  borderRadius: 3,
                  transition: 'width 0.5s ease',
                }} />
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 3 }}>
                Субстраты: {enz.substrates}
              </div>
              {enz.inhibitors.length > 0 && (
                <div style={{ marginTop: 3 }}>
                  {enz.inhibitors.map((inh, i) => (
                    <span key={i} style={{
                      fontSize: 10,
                      color: inh.strength === 'strong' ? '#ef4444' : '#f59e0b',
                      marginRight: 8,
                    }}>
                      {inh.name} ({inh.strength})
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Risk assessment */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12, padding: 20, minWidth: 260,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.08em', color: 'rgba(255,255,255,0.38)', marginBottom: 12,
          }}>
            ОЦЕНКА РИСКОВ
          </div>

          {!hasInhibition ? (
            <div style={{
              fontSize: 13, color: '#22c55e', fontWeight: 600, marginBottom: 8,
            }}>
              Нет значимой ингибиции CYP-ферментов
            </div>
          ) : (
            <>
              <div style={{
                fontSize: 13, color: '#f59e0b', fontWeight: 600, marginBottom: 8,
              }}>
                Обнаружена CYP-ингибиция
              </div>
              <div style={{
                fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 12,
              }}>
                Ингибирование CYP-ферментов может увеличить плазменные
                концентрации других препаратов, метаболизируемых через
                те же ферменты. Это эквивалентно увеличению дозы.
              </div>
            </>
          )}

          {affectedDrugs.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{
                fontSize: 11, fontWeight: 600, color: '#f59e0b', marginBottom: 6,
              }}>
                Препараты с изменённым метаболизмом:
              </div>
              {affectedDrugs.map((d, i) => (
                <div key={i} style={{
                  fontSize: 11, color: 'var(--text-secondary)',
                  marginBottom: 4, paddingLeft: 8,
                  borderLeft: `2px solid ${d.risk === 'high' ? '#ef4444' : '#f59e0b'}`,
                }}>
                  {d.name} ({d.enzyme})
                </div>
              ))}
            </div>
          )}

          {/* Future: CYP genotype display */}
          <div style={{
            marginTop: 16, paddingTop: 12,
            borderTop: '1px solid rgba(255,255,255,0.06)',
            fontSize: 10, color: 'var(--text-secondary)',
          }}>
            Генотипирование CYP2D6/2C19 позволяет предсказать
            фенотип метаболизма (PM/IM/EM/UM) и скорректировать дозы.
            Загрузите генетический профиль в настройках.
          </div>
        </div>
      </div>
    </IndicatorPopup>
  );
}
