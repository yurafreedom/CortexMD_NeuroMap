import type {
  IndicatorId,
  IndicatorBalance,
  IndicatorBreakdown,
  ContributingDrug,
} from '@/types/indicators';
import type { Receptor, DrugSchemaV2, ReceptorBinding } from '@/types/pharmacology';
import { calculateOccupancy, estimateBrainConcentration_nM } from './occupancy';
import { getZoneForValue } from '@/constants/indicator-zones';

export interface ActiveDrug {
  drug: DrugSchemaV2;
  dose_mg: number;
}

interface CalculateBalanceParams {
  indicatorId: IndicatorId;
  activeDrugs: ActiveDrug[];
  weights: Partial<Record<Receptor, number>>;
}

/**
 * Universal balance formula for all indicator systems.
 *
 * For each active drug, for each binding that matches a weighted receptor:
 *   1. Calculate occupancy via Hill equation
 *   2. Apply receptor weight
 *   3. Apply intrinsic efficacy for partial agonists
 *   4. Add to the appropriate breakdown bucket with correct sign
 *
 * Net formula: ag + 0.5*partial - inv - 0.5*ant + ri
 * Normalization: 100 * tanh(net / 100)
 */
/**
 * Process a set of bindings at a given concentration, accumulating into
 * breakdown and drugContrib. Used for both parent drug and metabolite bindings.
 */
function processBindings(
  bindings: ReceptorBinding[],
  concentration: number,
  dose_mg: number,
  weights: Partial<Record<Receptor, number>>,
  breakdown: IndicatorBreakdown,
  drugContrib: ContributingDrug,
  scale: number = 1.0,
) {
  for (const binding of bindings) {
    const weight = weights[binding.receptor];
    if (!weight) continue;

    // V1 APPROXIMATION: ki_nM=0 means functional mechanism without
    // classical receptor binding. Using fixed 50% occupancy as placeholder.
    // V2: replace with dose-response curves or empirical effect sizes.
    const occupancy = binding.ki_nM === 0
      ? (dose_mg > 0 ? 0.5 : 0)
      : calculateOccupancy(concentration, binding.ki_nM);
    const occupancyPercent = occupancy * 100 * scale;
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

export function calculateBalance(params: CalculateBalanceParams): IndicatorBalance {
  const { indicatorId, activeDrugs, weights } = params;

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

    // Parent drug bindings
    processBindings(drug.bindings, concentration, dose_mg, weights, breakdown, drugContrib);

    // Active metabolite bindings (scaled by formation_fraction)
    if (drug.active_metabolites) {
      for (const metabolite of drug.active_metabolites) {
        processBindings(
          metabolite.bindings,
          concentration,
          dose_mg,
          weights,
          breakdown,
          drugContrib,
          metabolite.formation_fraction,
        );
      }
    }

    if (drugContrib.receptors_hit.length > 0) {
      contributing_drugs.push(drugContrib);
    }
  }

  // Universal net formula
  const raw_net =
    breakdown.agonist
    + 0.5 * breakdown.partial_agonist
    - breakdown.inverse_agonist
    - 0.5 * breakdown.antagonist
    + breakdown.reuptake_inhibitor;

  // Tanh normalization to ±100 range
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
