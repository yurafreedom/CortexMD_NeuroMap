import type { ActiveDrug } from './balance';
import type { IndicatorBalance } from '@/types/indicators';
import { calculateBalance } from './balance';
import { NA_WEIGHTS } from '@/constants/receptor-weights';

export function calculateNorepinephrineBalance(
  activeDrugs: ActiveDrug[]
): IndicatorBalance {
  return calculateBalance({
    indicatorId: 'NA',
    activeDrugs,
    weights: NA_WEIGHTS,
  });
}
