/**
 * Regional balance calculation.
 * Extends the universal balance formula with PET-derived
 * regional receptor density weighting (Hansen et al. 2022).
 *
 * Regional occupancy = global_occupancy × density_multiplier
 * where density_multiplier ∈ [0, 1] from regional-density.ts
 *
 * This gives region-specific indicator values: e.g. sertraline's
 * SERT effect is 3x stronger in insula (0.907) vs dlPFC (0.287).
 */

import type { IndicatorId, IndicatorBalance, IndicatorBreakdown, ContributingDrug } from '@/types/indicators';
import type { Receptor, ReceptorBinding } from '@/types/pharmacology';
import type { CortexMDRegion } from '@/data/regional-density';
import { REGIONAL_DENSITY } from '@/data/regional-density';
import { calculateOccupancy, estimateBrainConcentration_nM } from './occupancy';
import { getZoneForValue } from '@/constants/indicator-zones';
import type { ActiveDrug } from './balance';
import {
  DA_WEIGHTS,
  NA_WEIGHTS,
  SEROTONIN_WEIGHTS,
  GLUTAMATE_WEIGHTS,
} from '@/constants/receptor-weights';

/**
 * Mapping from Receptor type names to regional-density.ts receptor keys.
 * Only receptors that exist in the PET dataset are mapped.
 * Unmapped receptors get density = 1.0 (no regional modulation).
 */
const RECEPTOR_TO_DENSITY_KEY: Partial<Record<Receptor, string>> = {
  '5HT1A': '5HT1A',
  '5HT1B': '5HT1B',
  '5HT2A': '5HT2A',
  '5HT4': '5HT4',
  '5HT6': '5HT6',
  'SERT': 'SERT',
  'nACh_alpha4beta2': 'nAChR_a4b2',
  'CB1': 'CB1',
  'D1': 'D1',
  'D2': 'D2',
  'DAT': 'DAT',
  'GABAa': 'GABAa',
  'H3': 'H3',
  'M1': 'M1',
  'mGluR5': 'mGluR5',
  'mu': 'mu',
  'NET': 'NET',
  'NMDA': 'NMDA',
};

function getDensity(region: CortexMDRegion, receptor: Receptor): number {
  const densityKey = RECEPTOR_TO_DENSITY_KEY[receptor];
  if (!densityKey) return 1.0; // No PET data for this receptor → neutral
  return REGIONAL_DENSITY[region]?.[densityKey] ?? 1.0;
}

/**
 * Process bindings with regional density scaling.
 */
function processRegionalBindings(
  bindings: ReceptorBinding[],
  concentration: number,
  dose_mg: number,
  weights: Partial<Record<Receptor, number>>,
  breakdown: IndicatorBreakdown,
  drugContrib: ContributingDrug,
  region: CortexMDRegion,
  scale: number = 1.0,
) {
  for (const binding of bindings) {
    const weight = weights[binding.receptor];
    if (!weight) continue;

    const occupancy = binding.ki_nM === 0
      ? (dose_mg > 0 ? 0.5 : 0)
      : calculateOccupancy(concentration, binding.ki_nM);

    // Regional density modulation
    const density = getDensity(region, binding.receptor);
    const occupancyPercent = occupancy * 100 * scale * density;
    const weightedContrib = occupancyPercent * weight;

    drugContrib.receptors_hit.push(binding.receptor);

    switch (binding.type) {
      case 'agonist':
        breakdown.agonist += weightedContrib;
        drugContrib.contribution += weightedContrib;
        break;
      case 'inverse_agonist':
        breakdown.inverse_agonist += weightedContrib;
        drugContrib.contribution -= weightedContrib;
        break;
      case 'antagonist':
        breakdown.antagonist += weightedContrib;
        drugContrib.contribution -= weightedContrib * 0.5;
        break;
      case 'partial_agonist': {
        const efficacy = binding.intrinsic_efficacy ?? 0.5;
        const partialContrib = weightedContrib * efficacy;
        breakdown.partial_agonist += partialContrib;
        drugContrib.contribution += partialContrib;
        break;
      }
      case 'reuptake_inhibitor':
        breakdown.reuptake_inhibitor += weightedContrib;
        drugContrib.contribution += weightedContrib;
        break;
      case 'releaser':
      case 'inhibitor':
      case 'modulator':
      case 'precursor':
        breakdown.agonist += weightedContrib;
        drugContrib.contribution += weightedContrib;
        break;
    }
  }
}

export interface RegionalBalanceParams {
  indicatorId: IndicatorId;
  activeDrugs: ActiveDrug[];
  weights: Partial<Record<Receptor, number>>;
  region: CortexMDRegion;
}

/**
 * Calculate indicator balance for a specific brain region.
 * Same formula as calculateBalance, but each receptor's occupancy
 * is scaled by its PET-derived density in the given region.
 */
export function calculateRegionalBalance(params: RegionalBalanceParams): IndicatorBalance {
  const { indicatorId, activeDrugs, weights, region } = params;

  const breakdown: IndicatorBreakdown = {
    agonist: 0,
    inverse_agonist: 0,
    antagonist: 0,
    partial_agonist: 0,
    reuptake_inhibitor: 0,
  };

  const contributing_drugs: ContributingDrug[] = [];

  for (const { drug, dose_mg } of activeDrugs) {
    const concentration = estimateBrainConcentration_nM(dose_mg, drug.id);
    const drugContrib: ContributingDrug = {
      drug_id: drug.id,
      contribution: 0,
      receptors_hit: [],
    };

    processRegionalBindings(drug.bindings, concentration, dose_mg, weights, breakdown, drugContrib, region);

    if (drug.active_metabolites) {
      for (const metabolite of drug.active_metabolites) {
        processRegionalBindings(
          metabolite.bindings,
          concentration,
          dose_mg,
          weights,
          breakdown,
          drugContrib,
          region,
          metabolite.formation_fraction,
        );
      }
    }

    if (drugContrib.receptors_hit.length > 0) {
      contributing_drugs.push(drugContrib);
    }
  }

  const raw_net =
    breakdown.agonist
    + 0.5 * breakdown.partial_agonist
    - breakdown.inverse_agonist
    - 0.5 * breakdown.antagonist
    + breakdown.reuptake_inhibitor;

  const value = 100 * Math.tanh(raw_net / 100);
  const zone = getZoneForValue(value);

  return {
    id: indicatorId,
    value,
    raw_net,
    breakdown,
    zone,
    contributing_drugs,
  };
}

/**
 * Calculate all core indicator balances for a region.
 * Returns a map of indicatorId → IndicatorBalance.
 * Uses canonical weights from @/constants/receptor-weights.
 */
export function calculateAllRegionalBalances(
  activeDrugs: ActiveDrug[],
  region: CortexMDRegion,
): Record<string, IndicatorBalance> {
  const result: Record<string, IndicatorBalance> = {};

  result.DA = calculateRegionalBalance({ indicatorId: 'DA', activeDrugs, weights: DA_WEIGHTS, region });
  result.NA = calculateRegionalBalance({ indicatorId: 'NA', activeDrugs, weights: NA_WEIGHTS, region });
  result['5HT'] = calculateRegionalBalance({ indicatorId: '5HT', activeDrugs, weights: SEROTONIN_WEIGHTS, region });
  result.Glu = calculateRegionalBalance({ indicatorId: 'Glu', activeDrugs, weights: GLUTAMATE_WEIGHTS, region });

  return result;
}
