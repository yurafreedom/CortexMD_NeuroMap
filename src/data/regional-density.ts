/**
 * Regional receptor density data for CortexMD.
 * Source: Hansen et al. 2022, Nature Neuroscience.
 * "Mapping neurotransmitter systems to the structural and functional
 *  organization of the human neocortex"
 * DOI: 10.1038/s41593-022-01186-3
 *
 * Data: PET-derived receptor density, Desikan-Killiany parcellation (68 regions),
 * averaged and mapped to CortexMD clinical brain regions.
 * Values normalized 0-1 per receptor across all regions (min-max).
 *
 * License: CC BY-NC-SA 4.0 (non-commercial)
 * Generated: 2026-04-10
 */

export type CortexMDRegion =
  | 'dlPFC'    // Dorsolateral prefrontal cortex
  | 'vmPFC'    // Ventromedial prefrontal cortex
  | 'acc'      // Anterior cingulate cortex
  | 'pcc'      // Posterior cingulate cortex
  | 'insula'   // Insular cortex
  | 'hippo'    // Hippocampal formation
  | 'amygdala' // Amygdala complex
  | 'temporal' // Superior/middle temporal
  | 'parietal' // Inferior/superior parietal
  | 'occipital'// Visual cortex
  | 'motor'    // Primary motor + paracentral
  | 'somatosensory' // Primary somatosensory
  | 'broca'    // Broca area (pars opercularis/triangularis)
  | 'precuneus'; // Precuneus

/**
 * Receptor density per region, normalized 0-1.
 * Higher value = more receptors of that type in that region.
 * Used to scale occupancy calculations by regional availability.
 *
 * Example: DAT in insula = 0.52, DAT in dlPFC = 0.02
 * → sertraline DAT effect is 26x stronger in insula than in dlPFC
 */
export const REGIONAL_DENSITY: Record<CortexMDRegion, Record<string, number>> = 
{
  "dlPFC": {
    "5HT1A": 0.601,
    "5HT1B": 0.188,
    "5HT2A": 0.493,
    "5HT4": 0.405,
    "5HT6": 0.153,
    "SERT": 0.287,
    "nAChR_a4b2": 0.502,
    "CB1": 0.437,
    "D1": 0.408,
    "D2": 0.2,
    "DAT": 0.298,
    "GABAa": 0.369,
    "H3": 0.107,
    "M1": 0.288,
    "mGluR5": 0.195,
    "mu": 0.485,
    "NET": 0.195,
    "NMDA": 0.244,
    "VAChT": 0.146
  },
  "vmPFC": {
    "5HT1A": 0.277,
    "5HT1B": 0.454,
    "5HT2A": 0.439,
    "5HT4": 0.318,
    "5HT6": 0.609,
    "SERT": 0.436,
    "nAChR_a4b2": 0.735,
    "CB1": 0.691,
    "D1": 0.424,
    "D2": 0.211,
    "DAT": 0.412,
    "GABAa": 0.649,
    "H3": 0.537,
    "M1": 0.502,
    "mGluR5": 0.576,
    "mu": 0.664,
    "NET": 0.851,
    "NMDA": 0.668,
    "VAChT": 0.675
  },
  "acc": {
    "5HT1A": 0.409,
    "5HT1B": 0.344,
    "5HT2A": 0.757,
    "5HT4": 0.555,
    "5HT6": 0.56,
    "SERT": 0.213,
    "nAChR_a4b2": 0.645,
    "CB1": 0.744,
    "D1": 0.455,
    "D2": 0.38,
    "DAT": 0.335,
    "GABAa": 0.536,
    "H3": 0.207,
    "M1": 0.635,
    "mGluR5": 0.363,
    "mu": 0.565,
    "NET": 0.473,
    "NMDA": 0.605,
    "VAChT": 0.116
  },
  "pcc": {
    "5HT1A": 0.148,
    "5HT1B": 0.77,
    "5HT2A": 0.81,
    "5HT4": 0.201,
    "5HT6": 0.809,
    "SERT": 0.232,
    "nAChR_a4b2": 0.742,
    "CB1": 0.266,
    "D1": 0.336,
    "D2": 0.056,
    "DAT": 0.335,
    "GABAa": 0.745,
    "H3": 0.204,
    "M1": 0.688,
    "mGluR5": 0.376,
    "mu": 0.334,
    "NET": 0.618,
    "NMDA": 0.662,
    "VAChT": 0.198
  },
  "insula": {
    "5HT1A": 0.665,
    "5HT1B": 0.472,
    "5HT2A": 0.489,
    "5HT4": 0.592,
    "5HT6": 0.96,
    "SERT": 0.907,
    "nAChR_a4b2": 0.728,
    "CB1": 0.9,
    "D1": 0.952,
    "D2": 0.972,
    "DAT": 0.891,
    "GABAa": 0.677,
    "H3": 0.61,
    "M1": 0.829,
    "mGluR5": 0.845,
    "mu": 0.805,
    "NET": 0.67,
    "NMDA": 0.848,
    "VAChT": 0.928
  },
  "hippo": {
    "5HT1A": 0.3,
    "5HT1B": 0.459,
    "5HT2A": 0.676,
    "5HT4": 0.448,
    "5HT6": 0.654,
    "SERT": 0.255,
    "nAChR_a4b2": 0.714,
    "CB1": 0.49,
    "D1": 0.533,
    "D2": 0.143,
    "DAT": 0.417,
    "GABAa": 0.654,
    "H3": 0.208,
    "M1": 0.522,
    "mGluR5": 0.535,
    "mu": 0.526,
    "NET": 0.549,
    "NMDA": 0.684,
    "VAChT": 0.282
  },
  "amygdala": {
    "5HT1A": 0.41,
    "5HT1B": 0.484,
    "5HT2A": 0.772,
    "5HT4": 0.654,
    "5HT6": 0.806,
    "SERT": 0.328,
    "nAChR_a4b2": 0.742,
    "CB1": 0.774,
    "D1": 0.395,
    "D2": 0.438,
    "DAT": 0.379,
    "GABAa": 0.596,
    "H3": 0.28,
    "M1": 0.757,
    "mGluR5": 0.61,
    "mu": 0.609,
    "NET": 0.653,
    "NMDA": 0.625,
    "VAChT": 0.3
  },
  "temporal": {
    "5HT1A": 0.471,
    "5HT1B": 0.39,
    "5HT2A": 0.804,
    "5HT4": 0.715,
    "5HT6": 0.611,
    "SERT": 0.303,
    "nAChR_a4b2": 0.605,
    "CB1": 0.643,
    "D1": 0.596,
    "D2": 0.445,
    "DAT": 0.44,
    "GABAa": 0.632,
    "H3": 0.252,
    "M1": 0.658,
    "mGluR5": 0.65,
    "mu": 0.663,
    "NET": 0.609,
    "NMDA": 0.641,
    "VAChT": 0.373
  },
  "parietal": {
    "5HT1A": 0.471,
    "5HT1B": 0.35,
    "5HT2A": 0.733,
    "5HT4": 0.719,
    "5HT6": 0.584,
    "SERT": 0.34,
    "nAChR_a4b2": 0.511,
    "CB1": 0.824,
    "D1": 0.397,
    "D2": 0.546,
    "DAT": 0.331,
    "GABAa": 0.467,
    "H3": 0.156,
    "M1": 0.708,
    "mGluR5": 0.454,
    "mu": 0.675,
    "NET": 0.388,
    "NMDA": 0.568,
    "VAChT": 0.152
  },
  "occipital": {
    "5HT1A": 0.345,
    "5HT1B": 0.488,
    "5HT2A": 0.696,
    "5HT4": 0.493,
    "5HT6": 0.683,
    "SERT": 0.225,
    "nAChR_a4b2": 0.717,
    "CB1": 0.629,
    "D1": 0.551,
    "D2": 0.238,
    "DAT": 0.355,
    "GABAa": 0.63,
    "H3": 0.343,
    "M1": 0.67,
    "mGluR5": 0.613,
    "mu": 0.576,
    "NET": 0.664,
    "NMDA": 0.706,
    "VAChT": 0.364
  },
  "motor": {
    "5HT1A": 0.177,
    "5HT1B": 0.431,
    "5HT2A": 0.565,
    "5HT4": 0.297,
    "5HT6": 0.391,
    "SERT": 0.191,
    "nAChR_a4b2": 0.427,
    "CB1": 0.433,
    "D1": 0.079,
    "D2": 0.124,
    "DAT": 0.226,
    "GABAa": 0.56,
    "H3": 0.101,
    "M1": 0.539,
    "mGluR5": 0.208,
    "mu": 0.308,
    "NET": 0.647,
    "NMDA": 0.38,
    "VAChT": 0.162
  },
  "somatosensory": {
    "5HT1A": 0.21,
    "5HT1B": 0.677,
    "5HT2A": 0.707,
    "5HT4": 0.22,
    "5HT6": 0.929,
    "SERT": 0.444,
    "nAChR_a4b2": 0.528,
    "CB1": 0.213,
    "D1": 0.453,
    "D2": 0.099,
    "DAT": 0.354,
    "GABAa": 0.865,
    "H3": 0.173,
    "M1": 0.932,
    "mGluR5": 0.563,
    "mu": 0.117,
    "NET": 0.71,
    "NMDA": 0.704,
    "VAChT": 0.163
  },
  "broca": {
    "5HT1A": 0.312,
    "5HT1B": 0.501,
    "5HT2A": 0.842,
    "5HT4": 0.805,
    "5HT6": 0.514,
    "SERT": 0.119,
    "nAChR_a4b2": 0.499,
    "CB1": 0.638,
    "D1": 0.308,
    "D2": 0.253,
    "DAT": 0.256,
    "GABAa": 0.6,
    "H3": 0.11,
    "M1": 0.635,
    "mGluR5": 0.623,
    "mu": 0.55,
    "NET": 0.527,
    "NMDA": 0.45,
    "VAChT": 0.18
  },
  "precuneus": {
    "5HT1A": 0.208,
    "5HT1B": 0.534,
    "5HT2A": 0.604,
    "5HT4": 0.127,
    "5HT6": 0.539,
    "SERT": 0.314,
    "nAChR_a4b2": 0.426,
    "CB1": 0.221,
    "D1": 0.577,
    "D2": 0.089,
    "DAT": 0.422,
    "GABAa": 0.841,
    "H3": 0.063,
    "M1": 0.354,
    "mGluR5": 0.274,
    "mu": 0.18,
    "NET": 0.49,
    "NMDA": 0.799,
    "VAChT": 0.146
  }
} as const;

/**
 * Get density multiplier for a receptor in a specific region.
 * Returns 1.0 if no regional data available (neutral fallback).
 */
export function getRegionalDensity(
  region: CortexMDRegion,
  receptor: string
): number {
  return REGIONAL_DENSITY[region]?.[receptor] ?? 1.0;
}

/**
 * Get top N receptors by density in a specific region.
 * Useful for "what dominates in this region" display.
 */
export function getTopReceptorsInRegion(
  region: CortexMDRegion,
  n: number = 5
): Array<{ receptor: string; density: number }> {
  const densities = REGIONAL_DENSITY[region];
  if (!densities) return [];
  return Object.entries(densities)
    .map(([receptor, density]) => ({ receptor, density }))
    .sort((a, b) => b.density - a.density)
    .slice(0, n);
}

/**
 * Get all regions sorted by density of a specific receptor.
 * Useful for "where is this receptor most dense" display.
 */
export function getRegionsByReceptorDensity(
  receptor: string
): Array<{ region: CortexMDRegion; density: number }> {
  const regions = Object.keys(REGIONAL_DENSITY) as CortexMDRegion[];
  return regions
    .map(region => ({
      region,
      density: REGIONAL_DENSITY[region]?.[receptor] ?? 0,
    }))
    .sort((a, b) => b.density - a.density);
}