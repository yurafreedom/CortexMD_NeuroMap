import type { IndicatorZone } from '@/types/indicators';

export const INDICATOR_ZONES: IndicatorZone[] = [
  {
    id: 'critical_low',
    min: -100,
    max: -30,
    color: '#ef4444',
    label: 'Critical deficit',
    label_ru: 'Критический дефицит',
  },
  {
    id: 'low',
    min: -30,
    max: -10,
    color: '#f59e0b',
    label: 'Below normal',
    label_ru: 'Снижено',
  },
  {
    id: 'neutral',
    min: -10,
    max: 10,
    color: '#94a3b8',
    label: 'Neutral',
    label_ru: 'Нейтрально',
  },
  {
    id: 'mild_high',
    min: 10,
    max: 30,
    color: '#84cc16',
    label: 'Mild stimulation',
    label_ru: 'Лёгкая стимуляция',
  },
  {
    id: 'therapeutic',
    min: 30,
    max: 100,
    color: '#22c55e',
    label: 'Therapeutic window',
    label_ru: 'Терапевтическое окно',
  },
];

export function getZoneForValue(value: number): IndicatorZone {
  for (const zone of INDICATOR_ZONES) {
    if (value >= zone.min && value < zone.max) return zone;
  }
  return INDICATOR_ZONES[INDICATOR_ZONES.length - 1];
}
