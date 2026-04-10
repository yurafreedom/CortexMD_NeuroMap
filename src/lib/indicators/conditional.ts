import type { IndicatorBalance, IndicatorBreakdown } from '@/types/indicators';
import type { ActiveDrug } from './balance';
import { calculateBalance } from './balance';
import { calculateOccupancy, estimateBrainConcentration_nM } from './occupancy';
import { getZoneForValue } from '@/constants/indicator-zones';
import { GABA_WEIGHTS, HISTAMINE_WEIGHTS, ALPHA1_WEIGHTS, OPIOID_WEIGHTS } from '@/constants/receptor-weights';
import { ACB_SCORES } from '@/data/acb-scale';

// ─── Detection helpers ───────────────────────────────────────────────

/** Sum anticholinergic burden score across active drugs (Boustani 2008). */
export function calculateACBScore(activeDrugs: ActiveDrug[]): number {
  let total = 0;
  for (const { drug } of activeDrugs) {
    const score = ACB_SCORES[drug.id];
    if (score) total += score;
  }
  return total;
}

/** Sum GABAa occupancy-weighted activity across active drugs. */
export function sumGABAaActivity(activeDrugs: ActiveDrug[]): number {
  let total = 0;
  for (const { drug, dose_mg } of activeDrugs) {
    const conc = estimateBrainConcentration_nM(dose_mg, drug.id);
    for (const binding of drug.bindings) {
      if (binding.receptor === 'GABAa' || binding.receptor === 'GABAb' || binding.receptor === 'alpha2delta') {
        const occ = binding.ki_nM === 0
          ? (dose_mg > 0 ? 0.5 : 0)
          : calculateOccupancy(conc, binding.ki_nM);
        total += occ * 100;
      }
    }
  }
  return total;
}

/** Max H1 occupancy across active drugs. */
export function maxH1Occupancy(activeDrugs: ActiveDrug[]): number {
  let max = 0;
  for (const { drug, dose_mg } of activeDrugs) {
    const conc = estimateBrainConcentration_nM(dose_mg, drug.id);
    for (const binding of drug.bindings) {
      if (binding.receptor === 'H1') {
        const occ = binding.ki_nM === 0
          ? (dose_mg > 0 ? 0.5 : 0)
          : calculateOccupancy(conc, binding.ki_nM);
        max = Math.max(max, occ * 100);
      }
    }
  }
  return max;
}

/** Max alpha1 occupancy across active drugs. */
export function maxAlpha1Occupancy(activeDrugs: ActiveDrug[]): number {
  let max = 0;
  for (const { drug, dose_mg } of activeDrugs) {
    const conc = estimateBrainConcentration_nM(dose_mg, drug.id);
    for (const binding of drug.bindings) {
      if (binding.receptor === 'alpha1') {
        const occ = binding.ki_nM === 0
          ? (dose_mg > 0 ? 0.5 : 0)
          : calculateOccupancy(conc, binding.ki_nM);
        max = Math.max(max, occ * 100);
      }
    }
  }
  return max;
}

/** Sum opioid receptor activity across active drugs. */
export function sumOpioidActivity(activeDrugs: ActiveDrug[]): number {
  let total = 0;
  for (const { drug, dose_mg } of activeDrugs) {
    const conc = estimateBrainConcentration_nM(dose_mg, drug.id);
    for (const binding of drug.bindings) {
      if (binding.receptor === 'mu' || binding.receptor === 'kappa' || binding.receptor === 'delta') {
        const occ = binding.ki_nM === 0
          ? (dose_mg > 0 ? 0.5 : 0)
          : calculateOccupancy(conc, binding.ki_nM);
        total += occ * 100;
      }
    }
  }
  return total;
}

// ─── Balance calculators ─────────────────────────────────────────────

/** ACh is a SCORE indicator (ACB 0-N), not a balance indicator. */
export function calculateACBBalance(activeDrugs: ActiveDrug[]): IndicatorBalance {
  const score = calculateACBScore(activeDrugs);
  // Map ACB score to ±100 scale: negative = anticholinergic burden
  const value = -Math.min(100, score * 15);

  const breakdown: IndicatorBreakdown = {
    agonist: 0,
    inverse_agonist: score,
    antagonist: 0,
    partial_agonist: 0,
    reuptake_inhibitor: 0,
  };

  return {
    id: 'ACh',
    value,
    raw_net: -score,
    breakdown,
    zone: getZoneForValue(value),
    contributing_drugs: [],
  };
}

export function calculateGABABalance(activeDrugs: ActiveDrug[]): IndicatorBalance {
  return calculateBalance({
    indicatorId: 'GABA',
    activeDrugs,
    weights: GABA_WEIGHTS,
  });
}

export function calculateH1Balance(activeDrugs: ActiveDrug[]): IndicatorBalance {
  return calculateBalance({
    indicatorId: 'H1',
    activeDrugs,
    weights: HISTAMINE_WEIGHTS,
  });
}

export function calculateAlpha1Balance(activeDrugs: ActiveDrug[]): IndicatorBalance {
  return calculateBalance({
    indicatorId: 'α1',
    activeDrugs,
    weights: ALPHA1_WEIGHTS,
  });
}

export function calculateOpioidBalance(activeDrugs: ActiveDrug[]): IndicatorBalance {
  return calculateBalance({
    indicatorId: 'Opioid',
    activeDrugs,
    weights: OPIOID_WEIGHTS,
  });
}

// ─── Conditional indicator definitions ───────────────────────────────

export interface ConditionalIndicator {
  id: 'ACh' | 'GABA' | 'H1' | 'α1' | 'Opioid';
  label: string;
  shortLabel: string;
  color: string;
  threshold: number;
  detect(drugs: ActiveDrug[]): boolean;
  calculate(drugs: ActiveDrug[]): IndicatorBalance;
}

/**
 * Conditional indicators appear only when relevant drugs are active.
 * Priority order (left→right): ACh → GABA → H1 → α1 → Opioid
 * Higher clinical safety impact = further left.
 */
export const CONDITIONAL_INDICATORS: ConditionalIndicator[] = [
  {
    id: 'ACh',
    label: 'Anticholinergic burden',
    shortLabel: 'ACh',
    color: '#fbbf24',
    threshold: 3,
    detect: (drugs) => calculateACBScore(drugs) >= 3,
    calculate: (drugs) => calculateACBBalance(drugs),
  },
  {
    id: 'GABA',
    label: 'GABA modulation',
    shortLabel: 'GABA',
    color: '#06b6d4',
    threshold: 15,
    detect: (drugs) => sumGABAaActivity(drugs) >= 15,
    calculate: (drugs) => calculateGABABalance(drugs),
  },
  {
    id: 'H1',
    label: 'Histamine H1',
    shortLabel: 'H1',
    color: '#f472b6',
    threshold: 30,
    detect: (drugs) => maxH1Occupancy(drugs) >= 30,
    calculate: (drugs) => calculateH1Balance(drugs),
  },
  {
    id: 'α1',
    label: 'Alpha-1 adrenergic',
    shortLabel: 'α1',
    color: '#fb923c',
    threshold: 25,
    detect: (drugs) => maxAlpha1Occupancy(drugs) >= 25,
    calculate: (drugs) => calculateAlpha1Balance(drugs),
  },
  {
    id: 'Opioid',
    label: 'Opioid system',
    shortLabel: 'Opi',
    color: '#a3a3a3',
    threshold: 10,
    detect: (drugs) => sumOpioidActivity(drugs) >= 10,
    calculate: (drugs) => calculateOpioidBalance(drugs),
  },
];
