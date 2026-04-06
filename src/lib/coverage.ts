import { Deficit } from '../data/defaultDeficits';

/** Active drugs map: drugId → current dose */
export type ActiveDrugs = Record<string, number>;

export interface CoverageResult {
  target: string;
  cov: number;
  covering: string[];
  blocking: string[];
  np: boolean;
  desc: string;
}

/**
 * Coverage calculation per need within a deficit.
 * Each need's coverage is 40% per covering drug present, halved if any blocker is active.
 * Non-pharmacological needs (coveredBy empty) return cov = -1.
 */
export function defCov(df: Deficit, activeDrugs: ActiveDrugs): CoverageResult[] {
  return df.needs.map((n) => {
    if (n.coveredBy.length === 0) {
      return {
        target: n.target,
        cov: -1,
        covering: [],
        blocking: [],
        np: true,
        desc: n.desc,
      };
    }
    const covering = n.coveredBy.filter((id) => activeDrugs[id] !== undefined);
    const blocking = (n.blockedBy || []).filter((id) => activeDrugs[id] !== undefined);
    let cov = Math.min(100, covering.length * 40);
    if (blocking.length > 0 && cov > 0) cov = Math.round(cov * 0.5);
    return {
      target: n.target,
      cov,
      covering,
      blocking,
      np: false,
      desc: n.desc,
    };
  });
}

/**
 * Total coverage percentage for a deficit (pharmacological needs only).
 * Average of individual need coverages, excluding non-pharmacological needs.
 */
export function defTotalCov(df: Deficit, activeDrugs: ActiveDrugs): number {
  const covs = defCov(df, activeDrugs);
  const pharma = covs.filter((c) => !c.np);
  if (pharma.length === 0) return 0;
  return Math.round(pharma.reduce((s, c) => s + c.cov, 0) / pharma.length);
}

/**
 * Map a coverage percentage to a display color.
 */
export function covCol(pct: number): string {
  if (pct <= 20) return '#ef4444';
  if (pct <= 40) return '#f97316';
  if (pct <= 60) return '#f59e0b';
  if (pct <= 80) return '#22c55e';
  return '#10b981';
}
