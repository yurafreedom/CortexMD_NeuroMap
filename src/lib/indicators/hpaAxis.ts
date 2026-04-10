/**
 * HPA Axis Status Calculator.
 *
 * Uses Cortisol (AM) and DHEA-S to assess hypothalamic-pituitary-adrenal
 * axis function and chronic stress burden.
 *
 * Key metric: Cortisol/DHEA-S ratio
 * - Normal ratio depends on age/sex but generally:
 *   Low ratio (<0.05): adrenal insufficiency or DHEA supplementation
 *   Normal ratio (0.05–0.20): balanced HPA function
 *   High ratio (>0.20): chronic stress, HPA hyperactivation
 *   Very high ratio (>0.50): severe HPA dysregulation
 *
 * Psychiatric relevance:
 * - Melancholic depression: high cortisol, high ratio
 * - Atypical depression: low/normal cortisol, variable ratio
 * - PTSD: paradoxically low cortisol with high CRH (enhanced negative feedback)
 * - Burnout: low cortisol, low DHEA-S (both axes depleted)
 */

export interface HPAInput {
  cortisol_am?: number;    // µg/dL
  dhea_s?: number;         // µg/dL
}

export type HPAStatus =
  | 'normal'
  | 'hyperactivation'
  | 'severe_hyperactivation'
  | 'hypoactivation'
  | 'burnout'
  | 'insufficient_data';

export interface HPAResult {
  status: HPAStatus;
  cortisolLevel: 'low' | 'normal' | 'high' | 'unknown';
  dheaLevel: 'low' | 'normal' | 'high' | 'unknown';
  ratio: number | null;
  ratioInterpretation: string;
  color: string;
  recommendation: string;
}

function classifyCortisol(value: number): 'low' | 'normal' | 'high' {
  if (value < 6) return 'low';
  if (value > 23) return 'high';
  return 'normal';
}

function classifyDHEAS(value: number): 'low' | 'normal' | 'high' {
  if (value < 35) return 'low';
  if (value > 430) return 'high';
  return 'normal';
}

const STATUS_CONFIG: Record<HPAStatus, { color: string; recommendation: string }> = {
  normal: {
    color: '#22c55e',
    recommendation: 'HPA axis balanced. No intervention needed.',
  },
  hyperactivation: {
    color: '#f59e0b',
    recommendation: 'Elevated cortisol/DHEA-S ratio suggests chronic stress. Consider stress management, adaptogenic support.',
  },
  severe_hyperactivation: {
    color: '#ef4444',
    recommendation: 'Severe HPA dysregulation. Rule out Cushing\'s syndrome. Consider cortisol-lowering interventions.',
  },
  hypoactivation: {
    color: '#60a5fa',
    recommendation: 'Low cortisol pattern. May indicate adrenal fatigue or enhanced negative feedback (PTSD pattern). Check ACTH.',
  },
  burnout: {
    color: '#a78bfa',
    recommendation: 'Both cortisol and DHEA-S depleted. Suggests prolonged HPA exhaustion. Lifestyle intervention critical.',
  },
  insufficient_data: {
    color: '#475569',
    recommendation: 'Need both AM cortisol and DHEA-S to assess HPA axis status.',
  },
};

export function calculateHPAStatus(input: HPAInput): HPAResult {
  const { cortisol_am, dhea_s } = input;

  if (cortisol_am == null && dhea_s == null) {
    return {
      status: 'insufficient_data',
      cortisolLevel: 'unknown',
      dheaLevel: 'unknown',
      ratio: null,
      ratioInterpretation: 'No HPA markers available.',
      ...STATUS_CONFIG.insufficient_data,
    };
  }

  const cortisolLevel = cortisol_am != null ? classifyCortisol(cortisol_am) : 'unknown';
  const dheaLevel = dhea_s != null ? classifyDHEAS(dhea_s) : 'unknown';

  // Calculate ratio if both available
  let ratio: number | null = null;
  let ratioInterpretation = '';

  if (cortisol_am != null && dhea_s != null && dhea_s > 0) {
    ratio = cortisol_am / dhea_s;

    if (ratio < 0.05) {
      ratioInterpretation = 'Low ratio — relative cortisol deficiency or DHEA excess.';
    } else if (ratio <= 0.20) {
      ratioInterpretation = 'Normal ratio — balanced HPA function.';
    } else if (ratio <= 0.50) {
      ratioInterpretation = 'Elevated ratio — chronic stress pattern.';
    } else {
      ratioInterpretation = 'Very high ratio — severe HPA dysregulation.';
    }
  }

  // Determine status
  let status: HPAStatus;

  if (cortisol_am != null && dhea_s != null) {
    if (cortisolLevel === 'low' && dheaLevel === 'low') {
      status = 'burnout';
    } else if (ratio != null && ratio > 0.50) {
      status = 'severe_hyperactivation';
    } else if (ratio != null && ratio > 0.20) {
      status = 'hyperactivation';
    } else if (cortisolLevel === 'low') {
      status = 'hypoactivation';
    } else {
      status = 'normal';
    }
  } else if (cortisol_am != null) {
    if (cortisolLevel === 'high') status = 'hyperactivation';
    else if (cortisolLevel === 'low') status = 'hypoactivation';
    else status = 'normal';
  } else {
    status = 'insufficient_data';
  }

  return {
    status,
    cortisolLevel,
    dheaLevel,
    ratio,
    ratioInterpretation,
    ...STATUS_CONFIG[status],
  };
}
