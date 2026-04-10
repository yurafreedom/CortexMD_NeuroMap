/**
 * Standardized symptom assessment scales.
 * PHQ-9: Patient Health Questionnaire (depression) — Kroenke et al. 2001
 * GAD-7: Generalized Anxiety Disorder — Spitzer et al. 2006
 * PCL-5: PTSD Checklist for DSM-5 — Weathers et al. 2013
 * ASRS: Adult ADHD Self-Report Scale v1.1 — Kessler et al. 2005
 */

export type ScaleType = 'PHQ9' | 'GAD7' | 'PCL5' | 'ASRS';

export interface ScaleDefinition {
  id: ScaleType;
  name: string;
  questionCount: number;
  maxScore: number;
  /** Answer options with their numeric values */
  options: { value: number; labelKey: string }[];
  /** Translation key prefix for questions: `${keyPrefix}.q1`, `${keyPrefix}.q2`, etc. */
  keyPrefix: string;
  /** Severity thresholds: [cutoff, labelKey, color] */
  thresholds: [number, string, string][];
}

export const SYMPTOM_SCALES: ScaleDefinition[] = [
  {
    id: 'PHQ9',
    name: 'PHQ-9',
    questionCount: 9,
    maxScore: 27,
    options: [
      { value: 0, labelKey: 'phq9_opt0' },
      { value: 1, labelKey: 'phq9_opt1' },
      { value: 2, labelKey: 'phq9_opt2' },
      { value: 3, labelKey: 'phq9_opt3' },
    ],
    keyPrefix: 'phq9',
    thresholds: [
      [0, 'minimal', '#22c55e'],
      [5, 'mild', '#84cc16'],
      [10, 'moderate', '#f59e0b'],
      [15, 'moderately_severe', '#f97316'],
      [20, 'severe', '#ef4444'],
    ],
  },
  {
    id: 'GAD7',
    name: 'GAD-7',
    questionCount: 7,
    maxScore: 21,
    options: [
      { value: 0, labelKey: 'gad7_opt0' },
      { value: 1, labelKey: 'gad7_opt1' },
      { value: 2, labelKey: 'gad7_opt2' },
      { value: 3, labelKey: 'gad7_opt3' },
    ],
    keyPrefix: 'gad7',
    thresholds: [
      [0, 'minimal', '#22c55e'],
      [5, 'mild', '#84cc16'],
      [10, 'moderate', '#f59e0b'],
      [15, 'severe', '#ef4444'],
    ],
  },
  {
    id: 'PCL5',
    name: 'PCL-5',
    questionCount: 20,
    maxScore: 80,
    options: [
      { value: 0, labelKey: 'pcl5_opt0' },
      { value: 1, labelKey: 'pcl5_opt1' },
      { value: 2, labelKey: 'pcl5_opt2' },
      { value: 3, labelKey: 'pcl5_opt3' },
      { value: 4, labelKey: 'pcl5_opt4' },
    ],
    keyPrefix: 'pcl5',
    thresholds: [
      [0, 'below_cutoff', '#22c55e'],
      [31, 'probable_ptsd', '#f59e0b'],
      [50, 'severe_ptsd', '#ef4444'],
    ],
  },
  {
    id: 'ASRS',
    name: 'ASRS v1.1',
    questionCount: 18,
    maxScore: 72,
    options: [
      { value: 0, labelKey: 'asrs_opt0' },
      { value: 1, labelKey: 'asrs_opt1' },
      { value: 2, labelKey: 'asrs_opt2' },
      { value: 3, labelKey: 'asrs_opt3' },
      { value: 4, labelKey: 'asrs_opt4' },
    ],
    keyPrefix: 'asrs',
    thresholds: [
      [0, 'unlikely', '#22c55e'],
      [24, 'possible', '#f59e0b'],
      [46, 'likely', '#ef4444'],
    ],
  },
];

export function getSeverity(scale: ScaleDefinition, score: number): { label: string; color: string } {
  let result = { label: scale.thresholds[0][1], color: scale.thresholds[0][2] };
  for (const [cutoff, label, color] of scale.thresholds) {
    if (score >= cutoff) result = { label, color };
  }
  return result;
}
