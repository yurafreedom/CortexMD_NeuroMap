import type { ActiveDrug } from './balance';
import type { IndicatorBalance } from '@/types/indicators';
import { calculateBalance } from './balance';
import { DA_WEIGHTS } from '@/constants/receptor-weights';

export function calculateDopamineBalance(
  activeDrugs: ActiveDrug[]
): IndicatorBalance {
  return calculateBalance({
    indicatorId: 'DA',
    activeDrugs,
    weights: DA_WEIGHTS,
  });
}
