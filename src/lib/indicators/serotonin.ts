import type { ActiveDrug } from './balance';
import type { IndicatorBalance } from '@/types/indicators';
import { calculateBalance } from './balance';
import { SEROTONIN_WEIGHTS } from '@/constants/receptor-weights';

export function calculateSerotoninBalance(
  activeDrugs: ActiveDrug[]
): IndicatorBalance {
  return calculateBalance({
    indicatorId: '5HT',
    activeDrugs,
    weights: SEROTONIN_WEIGHTS,
  });
}
