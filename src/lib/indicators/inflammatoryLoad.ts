/**
 * Inflammatory Load Calculator.
 *
 * Aggregates inflammatory biomarkers into a single 0–100 score
 * reflecting systemic inflammatory burden. Higher = more inflammation.
 *
 * Markers and their weighting rationale:
 * - CRP (hs): most validated psychiatric inflammation marker (weight 0.30)
 * - IL-6: key cytokine in depression pathophysiology (weight 0.25)
 * - TNF-α: linked to anhedonia and fatigue (weight 0.20)
 * - Homocysteine: neurotoxic, NMDA agonism (weight 0.15)
 * - ESR: non-specific but widely available (weight 0.10)
 *
 * Each marker is scored 0–100 based on how far above normal it is,
 * then weighted and summed.
 *
 * Clinical thresholds:
 * 0–15: Low inflammatory load
 * 15–40: Moderate (consider anti-inflammatory augmentation)
 * 40–70: High (likely contributing to treatment resistance)
 * 70–100: Severe (rule out autoimmune/infectious etiology)
 */

export interface InflammatoryMarker {
  name: string;
  value: number;
}

export interface InflammatoryLoadResult {
  score: number;           // 0–100
  zone: InflammatoryZone;
  markers: MarkerScore[];
  missingMarkers: string[];
}

export interface MarkerScore {
  name: string;
  value: number;
  score: number;           // 0–100 individual contribution
  weight: number;
}

export interface InflammatoryZone {
  label: string;
  color: string;
  recommendation: string;
}

interface MarkerDef {
  /** Upper limit of normal */
  uln: number;
  /** Weight in total score */
  weight: number;
  /** Value at which individual score = 100 (3x ULN typical) */
  ceiling: number;
}

const MARKER_DEFS: Record<string, MarkerDef> = {
  'CRP (hs)':     { uln: 1.0,  weight: 0.30, ceiling: 10.0 },
  'IL-6':         { uln: 7.0,  weight: 0.25, ceiling: 30.0 },
  'TNF-α':        { uln: 8.1,  weight: 0.20, ceiling: 25.0 },
  'Homocysteine': { uln: 15.0, weight: 0.15, ceiling: 30.0 },
  'ESR':          { uln: 20.0, weight: 0.10, ceiling: 60.0 },
};

const ALL_MARKER_NAMES = Object.keys(MARKER_DEFS);

function scoreMarker(value: number, def: MarkerDef): number {
  if (value <= def.uln) return 0;
  const excess = value - def.uln;
  const range = def.ceiling - def.uln;
  return Math.min(100, (excess / range) * 100);
}

const ZONES: InflammatoryZone[] = [
  { label: 'Low', color: '#22c55e', recommendation: 'No anti-inflammatory intervention needed.' },
  { label: 'Moderate', color: '#f59e0b', recommendation: 'Consider omega-3, NAC, or anti-inflammatory augmentation.' },
  { label: 'High', color: '#f97316', recommendation: 'Likely contributing to treatment resistance. Investigate etiology.' },
  { label: 'Severe', color: '#ef4444', recommendation: 'Rule out autoimmune, infectious, or malignant etiology.' },
];

function getZone(score: number): InflammatoryZone {
  if (score < 15) return ZONES[0];
  if (score < 40) return ZONES[1];
  if (score < 70) return ZONES[2];
  return ZONES[3];
}

/**
 * Calculate inflammatory load from available lab results.
 * Pass only inflammatory markers that have been tested.
 */
export function calculateInflammatoryLoad(
  labResults: InflammatoryMarker[]
): InflammatoryLoadResult {
  const available = new Set(labResults.map(r => r.name));
  const missingMarkers = ALL_MARKER_NAMES.filter(n => !available.has(n));

  const markers: MarkerScore[] = [];
  let totalWeight = 0;
  let weightedSum = 0;

  for (const result of labResults) {
    const def = MARKER_DEFS[result.name];
    if (!def) continue;

    const score = scoreMarker(result.value, def);
    markers.push({
      name: result.name,
      value: result.value,
      score,
      weight: def.weight,
    });
    weightedSum += score * def.weight;
    totalWeight += def.weight;
  }

  // Normalize by available weight (so partial data still gives a score)
  const finalScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

  return {
    score: Math.round(finalScore * 10) / 10,
    zone: getZone(finalScore),
    markers,
    missingMarkers,
  };
}
