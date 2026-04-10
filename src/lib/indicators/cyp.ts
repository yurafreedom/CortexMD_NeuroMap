import type { ActiveDrug } from './balance';
import type { IndicatorBalance, IndicatorBreakdown } from '@/types/indicators';
import { getZoneForValue } from '@/constants/indicator-zones';

/**
 * CYP enzyme inhibition indicator.
 *
 * Unlike other indicators, CYP is NOT a receptor balance — it's a
 * percent inhibition score. Uses drug.cyp_inhibits data.
 *
 * 0% inhibition = neutral (good), 100% inhibition = critical (bad).
 * Mapped to standard ±100 range: value = -total_inhibition.
 *
 * V1 focuses on CYP2D6 only. V2 will expand to per-enzyme breakdown.
 */
export function calculateCYPBalance(
  activeDrugs: ActiveDrug[]
): IndicatorBalance {
  let total_inhibition = 0;

  for (const { drug } of activeDrugs) {
    if (drug.cyp_inhibits) {
      for (const inhibition of drug.cyp_inhibits) {
        if (inhibition.enzyme === 'CYP2D6') {
          const strength =
            inhibition.strength === 'strong' ? 80
            : inhibition.strength === 'moderate' ? 50
            : 20;
          total_inhibition = Math.max(total_inhibition, strength);
        }
      }
    }
  }

  // CYP uses inverted scale: inhibition is negative
  const value = -total_inhibition;

  const breakdown: IndicatorBreakdown = {
    agonist: 0,
    inverse_agonist: total_inhibition,
    antagonist: 0,
    partial_agonist: 0,
    reuptake_inhibitor: 0,
  };

  return {
    id: 'CYP',
    value,
    raw_net: -total_inhibition,
    breakdown,
    zone: getZoneForValue(value),
    contributing_drugs: [],
  };
}
