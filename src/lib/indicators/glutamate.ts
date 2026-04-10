import type { ActiveDrug } from './balance';
import type { IndicatorBalance } from '@/types/indicators';
import { calculateBalance } from './balance';
import { GLUTAMATE_WEIGHTS } from '@/constants/receptor-weights';

/**
 * Glutamate system balance.
 *
 * NOTE: For glutamate, cystine-glutamate antiporter (NAC mechanism)
 * works in reverse — it reduces extrasynaptic glutamate, which is
 * BENEFICIAL for the patient. In V1 we use the standard formula where
 * NAC shows a positive value, conceptually corresponding to
 * "balancing glutamate toward normal". V2 may require special handling.
 */
export function calculateGlutamateBalance(
  activeDrugs: ActiveDrug[]
): IndicatorBalance {
  return calculateBalance({
    indicatorId: 'Glu',
    activeDrugs,
    weights: GLUTAMATE_WEIGHTS,
  });
}
