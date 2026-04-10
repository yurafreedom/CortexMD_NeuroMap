/**
 * Hill equation for receptor occupancy calculation.
 *
 * occupancy = [drug] / ([drug] + Ki)
 * At [drug] = Ki → 50% occupancy
 * At [drug] = 10*Ki → ~91% occupancy
 */
export function calculateOccupancy(
  drugConcentration_nM: number,
  ki_nM: number
): number {
  if (drugConcentration_nM <= 0 || ki_nM <= 0) return 0;
  return drugConcentration_nM / (drugConcentration_nM + ki_nM);
}

/**
 * Simple dose-to-concentration estimate for V1.
 * Uses dose_mg as a rough proxy for brain concentration in nM.
 *
 * This is an APPROXIMATION — V2 will use real PK profiles
 * (bioavailability, protein binding, brain-plasma ratio).
 *
 * Empirical rough estimate that works for most SSRI/SNRI at
 * typical clinical doses. Takes the actual dose from active scheme.
 */
export function estimateBrainConcentration_nM(
  dose_mg: number,
  _drugId: string
): number {
  return dose_mg * 2;
}
