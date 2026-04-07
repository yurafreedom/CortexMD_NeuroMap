/**
 * σ1 display zones and mock display function.
 * @yura: replace getSigma1Display with real impl from sigma1 patch
 */

export type Sigma1ZoneId = 'critical' | 'caution' | 'neutral' | 'mild' | 'therapeutic';

export interface Sigma1Zone {
  id: Sigma1ZoneId;
  min: number;
  max: number;
  color: string;
  label: string;
}

export const SIGMA1_ZONES: readonly Sigma1Zone[] = [
  { id: 'critical', min: -100, max: -30, color: '#ef4444', label: 'Критическая' },
  { id: 'caution', min: -30, max: -10, color: '#f59e0b', label: 'Каутион' },
  { id: 'neutral', min: -10, max: 10, color: '#94a3b8', label: 'Нейтральная' },
  { id: 'mild', min: 10, max: 30, color: '#84cc16', label: 'Лёгкий агонизм' },
  { id: 'therapeutic', min: 30, max: 100, color: '#22c55e', label: 'Терапевтический' },
] as const;

export interface Sigma1Display {
  value: number;
  zone: Sigma1ZoneId;
  color: string;
  label: string;
  breakdown: { ag: number; inv: number; ant: number };
}

/**
 * @yura: replace with real impl from sigma1 patch.
 * Currently returns a mock based on s1Bal() output.
 */
export function getSigma1Display(activeDrugs: Record<string, number>): Sigma1Display {
  // Mock — will be replaced with real implementation
  void activeDrugs;
  return {
    value: 0,
    zone: 'neutral',
    color: '#94a3b8',
    label: 'Нейтральная',
    breakdown: { ag: 0, inv: 0, ant: 0 },
  };
}

/** Find which zone a balance value falls into */
export function getZoneForValue(value: number): Sigma1Zone {
  for (const zone of SIGMA1_ZONES) {
    if (value >= zone.min && value < zone.max) return zone;
  }
  // Clamp to extremes
  return value < SIGMA1_ZONES[0].min ? SIGMA1_ZONES[0] : SIGMA1_ZONES[SIGMA1_ZONES.length - 1];
}

/** Get the "normal" zone range string from zones data */
export function getNormalRangeLabel(): string {
  const neutral = SIGMA1_ZONES.find(z => z.id === 'neutral');
  if (!neutral) return '−10…+10';
  return `${neutral.min}…+${neutral.max}`;
}
