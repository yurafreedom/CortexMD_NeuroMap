import { DRUGS, Drug } from '../data/drugs';
import { RG, NT_REC } from '../data/brainRegions';

/** Active drugs map: drugId → current dose */
export type ActiveDrugs = Record<string, number>;

/**
 * Calculate total CYP2D6 inhibition percentage from active drugs.
 * Bupropion is the primary CYP2D6 inhibitor; fluoxetine adds a flat +75%.
 * Capped at 95%.
 */
export function cypVal(activeDrugs: ActiveDrugs): number {
  let t = 0;
  const d = activeDrugs.bupropion || 0;
  t += d >= 300 ? 80 : d >= 225 ? 70 : d >= 150 ? 45 : d >= 75 ? 20 : 0;
  if (activeDrugs.fluoxetine) t += 75;
  return Math.min(95, t);
}

/**
 * Effective dose of a drug after CYP2D6 metabolism adjustment.
 * Certain drugs (atomoxetine, vortioxetine, or those with cyp2d6s) are boosted
 * when CYP2D6 is inhibited.
 */
export function realD(id: string, activeDrugs: ActiveDrugs): number {
  const b = activeDrugs[id];
  if (!b) return 0;
  const c = cypVal(activeDrugs);
  const d = DRUGS[id];
  if (id === 'atomoxetine') return b * (1 + (c / 100) * 4);
  if (id === 'vortioxetine') return b * (1 + (c / 100) * 1.1);
  if (d && d.cyp2d6s) return b * (1 + (c / 100) * d.cyp2d6s);
  return b;
}

/**
 * Receptor occupancy (%) for a given drug at a specific receptor.
 * Uses hyperbolic (Michaelis-Menten-like) model: dose / (dose + Ki * factor).
 */
export function occ(id: string, rec: string, activeDrugs: ActiveDrugs): number {
  const d = DRUGS[id];
  if (!d || !d.ki || !d.ki[rec]) return 0;
  const dose = realD(id, activeDrugs);
  const ki = d.ki[rec];
  const f =
    id === 'pramipexole' ? 0.5 :
    id === 'cariprazine' ? 0.3 :
    id === 'guanfacine' ? 2 :
    1;
  return (dose / (dose + ki * f)) * 100;
}

/**
 * Best receptor occupancy a drug achieves for a given neurotransmitter system.
 * Falls back to a dose-based heuristic if no Ki data matches.
 */
export function drugOcc(did: string, nt: string, activeDrugs: ActiveDrugs): number {
  const d = DRUGS[did];
  if (!d) return 0;
  const recs = NT_REC[nt] || [];
  let best = 0;
  for (let r = 0; r < recs.length; r++) {
    if (d.ki && d.ki[recs[r]] !== undefined) {
      const o = occ(did, recs[r], activeDrugs);
      if (o > best) best = o;
    }
  }
  if (best > 0) return best;
  return Math.min(100, (realD(did, activeDrugs) / (d.def || 1)) * 50);
}

/**
 * Zone health for a specific neurotransmitter in a brain region.
 * Baseline is 65; each active drug with effects in that zone shifts it.
 * Clamped to [0, 250].
 */
export function zH(zid: string, nt: string, activeDrugs: ActiveDrugs): number {
  let t = 65;
  Object.keys(activeDrugs).forEach((did) => {
    const d = DRUGS[did];
    if (!d) return;
    const zf = d.z ? d.z[zid] : null;
    if (!zf) return;
    if (zf.nt.indexOf(nt) < 0 && nt !== 's1') return;
    if (nt === 's1' && zf.nt.indexOf('s1') < 0) return;
    const occupancy = drugOcc(did, nt, activeDrugs);
    const maxEff = zf.i * 8;
    let delta = (occupancy / 100) * maxEff;
    if (zf.bad) delta = -delta * 0.7;
    t += delta;
  });
  return Math.max(0, Math.min(250, t));
}

/**
 * Global health for a neurotransmitter across all brain regions.
 * Averages zH across zones that are affected by at least one active drug.
 */
export function gH(nt: string, activeDrugs: ActiveDrugs): number {
  const zs = Object.keys(RG);
  let s = 0;
  let c = 0;
  const m: Record<string, string[]> = {
    DA: ['DA', 'D3'],
    NA: ['NA'],
    '5-HT': ['5-HT'],
    s1: ['s1'],
  };
  const nts = m[nt] || [nt];
  nts.forEach((n) => {
    zs.forEach((z) => {
      const h = zH(z, n, activeDrugs);
      if (
        h !== 65 ||
        Object.keys(activeDrugs).some((d) => {
          const dr = DRUGS[d];
          return dr && dr.z && dr.z[z] && dr.z[z].nt.indexOf(n) >= 0;
        })
      ) {
        s += h;
        c++;
      }
    });
  });
  return c > 0 ? s / c : 65;
}

/**
 * Map a health value to a display color.
 */
export function hCol(v: number): string {
  return v < 60
    ? '#ef4444'
    : v < 80
      ? '#f59e0b'
      : v <= 160
        ? '#22c55e'
        : v <= 200
          ? '#f59e0b'
          : '#ef4444';
}

/**
 * Map a health value to a human-readable status string.
 */
export function hSt(v: number): string {
  return v < 60
    ? 'Дефицит'
    : v < 80
      ? 'Ниже нормы'
      : v <= 160
        ? 'Оптимум'
        : v <= 200
          ? 'Повышен'
          : 'Перегруз';
}
