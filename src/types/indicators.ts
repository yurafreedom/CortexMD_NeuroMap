import type { Receptor } from './pharmacology';

export type IndicatorId =
  | 'DA' | 'NA' | '5HT' | 'Glu' | 's1' | 'CYP'
  | 'GABA' | 'H1' | 'α1' | 'ACh' | 'Opioid';

export type IndicatorZoneId =
  | 'critical_low' | 'low' | 'neutral' | 'mild_high' | 'therapeutic';

export interface IndicatorZone {
  id: IndicatorZoneId;
  min: number;
  max: number;
  color: string;
  label: string;
  label_ru: string;
}

export interface IndicatorBreakdown {
  agonist: number;
  inverse_agonist: number;
  antagonist: number;
  partial_agonist: number;
  reuptake_inhibitor: number;
}

export interface IndicatorBalance {
  id: IndicatorId;
  value: number;          // -100 to +100, нормализованное значение
  raw_net: number;        // sum до tanh нормализации
  breakdown: IndicatorBreakdown;
  zone: IndicatorZone;
  contributing_drugs: ContributingDrug[];
}

export interface ContributingDrug {
  drug_id: string;
  contribution: number;   // знаковый вклад в net
  receptors_hit: Receptor[];
}
