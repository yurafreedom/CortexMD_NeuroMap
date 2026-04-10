import type { ActiveDrug } from './balance';
import type { IndicatorBalance } from '@/types/indicators';
import { calculateBalance } from './balance';
import { SIGMA1_WEIGHTS } from '@/constants/receptor-weights';

/**
 * σ1 receptor system balance.
 *
 * Replaces the legacy s1Bal() from src/lib/sigma1.ts.
 * The old file is kept as fallback until BottomBar and CascadeOverlay
 * are switched to this function (subphase 2E).
 */
export function calculateSigma1Balance(
  activeDrugs: ActiveDrug[]
): IndicatorBalance {
  return calculateBalance({
    indicatorId: 's1',
    activeDrugs,
    weights: SIGMA1_WEIGHTS,
  });
}
