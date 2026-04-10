/**
 * Lab reference ranges with numeric bounds for automated interpretation.
 * Sources: Standard clinical laboratory reference intervals.
 *
 * Each test has:
 * - low/high bounds for normal range
 * - optional optimal range (tighter clinical target)
 * - clinical significance tags for psychiatric context
 * - flag thresholds for critical values
 */

export type LabCategory =
  | 'thyroid'
  | 'hpa'
  | 'inflammatory'
  | 'vitamin'
  | 'metabolic'
  | 'hematology'
  | 'hepatorenal'
  | 'drug_level'
  | 'hormone';

export type LabFlag = 'normal' | 'low' | 'high' | 'critical_low' | 'critical_high' | 'optimal';

export interface LabReference {
  test_name: string;
  unit: string;
  category: LabCategory;
  /** Normal reference range */
  ref_low: number | null;
  ref_high: number | null;
  /** Optimal range (stricter, clinically preferred) */
  optimal_low?: number;
  optimal_high?: number;
  /** Critical values requiring immediate attention */
  critical_low?: number;
  critical_high?: number;
  /** Psychiatric relevance note */
  psych_note: string;
  /** Is this an inflammatory marker? */
  inflammatory?: boolean;
  /** Is this part of HPA axis? */
  hpa?: boolean;
}

export const LAB_REFERENCES: Record<string, LabReference> = {
  'TSH': {
    test_name: 'TSH', unit: 'mIU/L', category: 'thyroid',
    ref_low: 0.4, ref_high: 4.0, optimal_low: 1.0, optimal_high: 2.5,
    critical_low: 0.01, critical_high: 10.0,
    psych_note: 'Subclinical hypothyroidism (TSH 4–10) mimics depression. Hyperthyroidism mimics anxiety/mania.',
  },
  'Free T4': {
    test_name: 'Free T4', unit: 'ng/dL', category: 'thyroid',
    ref_low: 0.8, ref_high: 1.8, optimal_low: 1.0, optimal_high: 1.5,
    psych_note: 'Low fT4 with normal TSH suggests central hypothyroidism. T3 augmentation used in treatment-resistant depression.',
  },
  'Free T3': {
    test_name: 'Free T3', unit: 'pg/mL', category: 'thyroid',
    ref_low: 2.3, ref_high: 4.2,
    psych_note: 'Poor T4→T3 conversion (low T3, normal T4) associated with depression and cognitive symptoms.',
  },
  'Cortisol (AM)': {
    test_name: 'Cortisol (AM)', unit: 'µg/dL', category: 'hpa',
    ref_low: 6, ref_high: 23, optimal_low: 10, optimal_high: 18,
    critical_low: 3, critical_high: 30,
    psych_note: 'Elevated AM cortisol: HPA hyperactivation (depression, PTSD). Low: adrenal insufficiency, burnout.',
    hpa: true,
  },
  'DHEA-S': {
    test_name: 'DHEA-S', unit: 'µg/dL', category: 'hpa',
    ref_low: 35, ref_high: 430,
    psych_note: 'Low DHEA-S with high cortisol = high cortisol/DHEA-S ratio → chronic stress, neuroinflammation.',
    hpa: true,
  },
  'Testosterone': {
    test_name: 'Testosterone', unit: 'ng/dL', category: 'hormone',
    ref_low: 300, ref_high: 1000, optimal_low: 400, optimal_high: 700,
    psych_note: 'Low testosterone: fatigue, anhedonia, cognitive fog, reduced motivation. Check in treatment-resistant depression.',
  },
  'Estradiol': {
    test_name: 'Estradiol', unit: 'pg/mL', category: 'hormone',
    ref_low: 10, ref_high: 40,
    psych_note: 'Fluctuations trigger mood instability. Low estradiol associated with depression in perimenopause.',
  },
  'Prolactin': {
    test_name: 'Prolactin', unit: 'ng/mL', category: 'hormone',
    ref_low: 2, ref_high: 18, critical_high: 50,
    psych_note: 'Elevated by D2 antagonists (antipsychotics). >50 requires pituitary workup.',
  },
  'Vitamin D (25-OH)': {
    test_name: 'Vitamin D (25-OH)', unit: 'ng/mL', category: 'vitamin',
    ref_low: 30, ref_high: 100, optimal_low: 40, optimal_high: 60,
    critical_low: 10,
    psych_note: 'Deficiency (<20) linked to depression severity. Supplementation improves outcomes in deficient patients.',
  },
  'Vitamin B12': {
    test_name: 'Vitamin B12', unit: 'pg/mL', category: 'vitamin',
    ref_low: 200, ref_high: 900, optimal_low: 400, optimal_high: 800,
    critical_low: 150,
    psych_note: 'Deficiency causes cognitive decline, depression, neuropathy. Common with metformin, PPIs, vegetarian diet.',
  },
  'Folate': {
    test_name: 'Folate', unit: 'ng/mL', category: 'vitamin',
    ref_low: 3, ref_high: 17, optimal_low: 8, optimal_high: 15,
    psych_note: 'Low folate impairs methylation → reduced monoamine synthesis. MTHFR TT genotype requires L-methylfolate.',
  },
  'Ferritin': {
    test_name: 'Ferritin', unit: 'ng/mL', category: 'vitamin',
    ref_low: 20, ref_high: 250, optimal_low: 50, optimal_high: 150,
    psych_note: 'Low ferritin (<30): fatigue, restless legs, poor ADHD stimulant response. Iron cofactor for tyrosine hydroxylase.',
  },
  'CRP (hs)': {
    test_name: 'CRP (hs)', unit: 'mg/L', category: 'inflammatory',
    ref_low: null, ref_high: 1.0, optimal_high: 0.5,
    critical_high: 10.0,
    psych_note: 'hs-CRP >3 mg/L: systemic inflammation. Predicts poor SSRI response; consider anti-inflammatory augmentation.',
    inflammatory: true,
  },
  'ESR': {
    test_name: 'ESR', unit: 'mm/hr', category: 'inflammatory',
    ref_low: null, ref_high: 20,
    psych_note: 'Non-specific inflammation marker. Chronic elevation suggests autoimmune or infectious etiology.',
    inflammatory: true,
  },
  'IL-6': {
    test_name: 'IL-6', unit: 'pg/mL', category: 'inflammatory',
    ref_low: null, ref_high: 7, critical_high: 20,
    psych_note: 'Key pro-inflammatory cytokine. Elevated in depression, promotes IDO activation → tryptophan shunting away from 5-HT.',
    inflammatory: true,
  },
  'TNF-α': {
    test_name: 'TNF-α', unit: 'pg/mL', category: 'inflammatory',
    ref_low: null, ref_high: 8.1,
    psych_note: 'Elevated TNF-α linked to anhedonia and fatigue in depression. Anti-TNF therapy improves mood in autoimmune patients.',
    inflammatory: true,
  },
  'Homocysteine': {
    test_name: 'Homocysteine', unit: 'µmol/L', category: 'inflammatory',
    ref_low: 5, ref_high: 15, optimal_high: 10,
    critical_high: 20,
    psych_note: 'Elevated: impaired methylation (check B12, folate, MTHFR). Neurotoxic via NMDA agonism and oxidative stress.',
    inflammatory: true,
  },
  'Lithium level': {
    test_name: 'Lithium level', unit: 'mEq/L', category: 'drug_level',
    ref_low: 0.6, ref_high: 1.2, optimal_low: 0.6, optimal_high: 0.8,
    critical_high: 1.5,
    psych_note: 'Therapeutic range 0.6–1.2. Toxicity >1.5: tremor, confusion, seizures. Check q3-6mo.',
  },
  'Valproate level': {
    test_name: 'Valproate level', unit: 'µg/mL', category: 'drug_level',
    ref_low: 50, ref_high: 100, optimal_low: 75, optimal_high: 100,
    critical_high: 150,
    psych_note: 'Therapeutic 50–100. Hepatotoxicity risk with high levels. Monitor LFTs concurrently.',
  },
  'Glucose (fasting)': {
    test_name: 'Glucose (fasting)', unit: 'mg/dL', category: 'metabolic',
    ref_low: 70, ref_high: 100,
    critical_low: 50, critical_high: 200,
    psych_note: 'Metabolic syndrome screening. Antipsychotics (esp. olanzapine, clozapine) increase risk.',
  },
  'HbA1c': {
    test_name: 'HbA1c', unit: '%', category: 'metabolic',
    ref_low: null, ref_high: 5.7,
    critical_high: 9.0,
    psych_note: '5.7–6.4: prediabetes. Monitor with SGAs. Diabetes increases depression risk 2-3x.',
  },
  'ALT': {
    test_name: 'ALT', unit: 'U/L', category: 'hepatorenal',
    ref_low: 7, ref_high: 56, critical_high: 200,
    psych_note: 'Monitor with valproate, carbamazepine, nefazodone. 3x ULN requires drug discontinuation review.',
  },
  'AST': {
    test_name: 'AST', unit: 'U/L', category: 'hepatorenal',
    ref_low: 10, ref_high: 40, critical_high: 200,
    psych_note: 'Elevated with hepatotoxic psych meds. AST>ALT suggests alcohol-related damage.',
  },
  'Creatinine': {
    test_name: 'Creatinine', unit: 'mg/dL', category: 'hepatorenal',
    ref_low: 0.7, ref_high: 1.3, critical_high: 2.0,
    psych_note: 'Monitor with lithium (nephrotoxicity). Elevated creatinine requires lithium dose adjustment.',
  },
  'CBC WBC': {
    test_name: 'CBC WBC', unit: '×10³/µL', category: 'hematology',
    ref_low: 4.5, ref_high: 11.0,
    critical_low: 2.0, critical_high: 20.0,
    psych_note: 'Monitor with clozapine (agranulocytosis risk). WBC <3.5 with clozapine requires REMS protocol.',
  },
  'Hemoglobin': {
    test_name: 'Hemoglobin', unit: 'g/dL', category: 'hematology',
    ref_low: 12, ref_high: 17, critical_low: 7,
    psych_note: 'Anemia causes fatigue and cognitive impairment mimicking depression.',
  },
};

/**
 * Evaluate a lab result against reference ranges.
 */
export function flagLabResult(testName: string, value: number): LabFlag {
  const ref = LAB_REFERENCES[testName];
  if (!ref) return 'normal';

  if (ref.critical_low != null && value < ref.critical_low) return 'critical_low';
  if (ref.critical_high != null && value > ref.critical_high) return 'critical_high';
  if (ref.optimal_low != null && ref.optimal_high != null) {
    if (value >= ref.optimal_low && value <= ref.optimal_high) return 'optimal';
  }
  if (ref.ref_low != null && value < ref.ref_low) return 'low';
  if (ref.ref_high != null && value > ref.ref_high) return 'high';
  return 'normal';
}

export const FLAG_COLORS: Record<LabFlag, string> = {
  optimal: '#22c55e',
  normal: '#94a3b8',
  low: '#f59e0b',
  high: '#f59e0b',
  critical_low: '#ef4444',
  critical_high: '#ef4444',
};

export const FLAG_LABELS: Record<LabFlag, string> = {
  optimal: 'Optimal',
  normal: 'Normal',
  low: 'Low',
  high: 'High',
  critical_low: 'Critical Low',
  critical_high: 'Critical High',
};
