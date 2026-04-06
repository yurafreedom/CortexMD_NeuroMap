import { DRUGS } from '../data/drugs';
import { occ } from './pharmacology';

/** Active drugs map: drugId → current dose */
export type ActiveDrugs = Record<string, number>;

export interface Sigma1Balance {
  ag: number;
  inv: number;
  ant: number;
  net: number;
}

/**
 * Calculate sigma-1 receptor balance across all active drugs.
 * Sums occupancy contributions by s1 type: agonist, inverse agonist, antagonist.
 * Net = agonist - inverse - antagonist.
 */
export function s1Bal(activeDrugs: ActiveDrugs): Sigma1Balance {
  let ag = 0;
  let inv = 0;
  let ant = 0;
  Object.keys(activeDrugs).forEach((did) => {
    const d = DRUGS[did];
    if (!d || !d.ki || !d.ki.s1) return;
    const o = occ(did, 's1', activeDrugs);
    if (d.s1t === 'ag') ag += o;
    else if (d.s1t === 'inv') inv += o;
    else if (d.s1t === 'ant') ant += o;
  });
  return { ag, inv, ant, net: ag - inv - ant };
}
