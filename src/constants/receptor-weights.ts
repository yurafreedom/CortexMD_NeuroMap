import type { Receptor } from '@/types/pharmacology';

/**
 * Receptor weights determine the relative contribution of each receptor
 * to the overall system indicator. The primary receptor/transporter gets 1.0,
 * others are scaled by clinical significance.
 *
 * Keys MUST match Receptor union in src/types/pharmacology.ts.
 */

export const DA_WEIGHTS: Partial<Record<Receptor, number>> = {
  DAT: 1.0,
  D2: 0.7,
  D3: 0.5,
  D1: 0.3,
  D4: 0.1,
  D5: 0.1,
};

export const NA_WEIGHTS: Partial<Record<Receptor, number>> = {
  NET: 1.0,
  alpha2A: 0.6,     // autoreceptor — critical for feedback
  alpha1: 0.4,
  alpha2B: 0.2,
  alpha2C: 0.2,
  beta1: 0.3,
  beta2: 0.2,
};

export const SEROTONIN_WEIGHTS: Partial<Record<Receptor, number>> = {
  SERT: 1.0,
  '5HT1A': 0.7,    // autoreceptor + heteroreceptor
  '5HT2A': 0.7,    // psychedelic + antipsychotic mechanism
  '5HT2C': 0.5,
  '5HT3': 0.4,
  '5HT7': 0.3,
  '5HT1B': 0.3,
  '5HT1D': 0.2,
  '5HT6': 0.2,
  '5HT2B': 0.2,
};

export const GLUTAMATE_WEIGHTS: Partial<Record<Receptor, number>> = {
  NMDA: 0.8,
  GluN2B: 1.0,      // extrasynaptic — key for ketamine mechanism
  GluN2A: 0.6,      // synaptic, pro-survival
  AMPA: 0.5,
  mGluR5: 0.4,
  mGluR2: 0.3,
  mGluR3: 0.3,
  cystineGlutamateAntiporter: 0.6,
};

export const SIGMA1_WEIGHTS: Partial<Record<Receptor, number>> = {
  s1: 1.0,
};

export const GABA_WEIGHTS: Partial<Record<Receptor, number>> = {
  GABAa_alpha1: 0.7, // sedation
  GABAa_alpha2: 0.6, // anxiolysis
  GABAa_alpha3: 0.5,
  GABAa_alpha5: 0.4,
  GABAb: 0.3,
};

export const HISTAMINE_WEIGHTS: Partial<Record<Receptor, number>> = {
  H1: 1.0,
  H2: 0.3,
  H3: 0.2,
};

export const ALPHA1_WEIGHTS: Partial<Record<Receptor, number>> = {
  alpha1: 1.0,
};

export const OPIOID_WEIGHTS: Partial<Record<Receptor, number>> = {
  mu: 0.8,
  kappa: 0.4,
  delta: 0.3,
};
