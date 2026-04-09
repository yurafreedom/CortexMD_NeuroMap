/**
 * CortexMD v2 Drug Schema — Extended receptor binding model
 * with PK profiles, intrinsic efficacy, and CYP interactions.
 */

// ─── Receptor Types ──────────────────────────────────────

export type ReceptorType =
  | 'agonist'
  | 'inverse_agonist'
  | 'antagonist'
  | 'partial_agonist'
  | 'reuptake_inhibitor'
  | 'releaser'
  | 'inhibitor'           // enzyme inhibitor (e.g., AChE, MAO)
  | 'modulator'           // allosteric modulator, channel blocker, etc.
  | 'precursor';          // substrate/precursor (e.g., L-DOPA, L-Tyrosine)

// ─── Receptor Union ──────────────────────────────────────
// Full union of receptors tracked in CortexMD.

export type Receptor =
  // Monoamine transporters
  | 'SERT' | 'DAT' | 'NET'
  // Dopamine receptors
  | 'D1' | 'D2' | 'D3' | 'D4' | 'D5'
  // Serotonin receptors
  | '5HT1A' | '5HT1B' | '5HT1D'
  | '5HT2A' | '5HT2B' | '5HT2C'
  | '5HT3' | '5HT4' | '5HT6' | '5HT7'
  // Adrenergic receptors
  | 'alpha1' | 'alpha2A' | 'alpha2B' | 'alpha2C'
  | 'beta1' | 'beta2'
  // Histamine receptors
  | 'H1' | 'H2' | 'H3'
  // Muscarinic (ACh) receptors
  | 'M1' | 'M2' | 'M3' | 'M4' | 'M5'
  // Nicotinic ACh receptors
  | 'nACh_alpha4beta2' | 'nACh_alpha7'
  // Cholinesterase
  | 'AChE' | 'BuChE'
  // GABA system
  | 'GABAa' | 'GABAb' | 'GABAa_alpha1' | 'GABAa_alpha2' | 'GABAa_alpha3' | 'GABAa_alpha5'
  | 'alpha2delta'   // pregabalin/gabapentin target (Ca channel subunit)
  // Glutamate system
  | 'NMDA' | 'GluN2A' | 'GluN2B'
  | 'AMPA' | 'kainate'
  | 'mGluR1' | 'mGluR2' | 'mGluR3' | 'mGluR5'
  | 'cystineGlutamateAntiporter'
  | 'glutamateUptake'        // riluzole mechanism
  | 'presynapticGluRelease'  // lamotrigine mechanism (Na-channel mediated)
  // Sigma receptors
  | 's1' | 's2'
  // Opioid receptors
  | 'mu' | 'kappa' | 'delta'
  // Endocannabinoid
  | 'CB1' | 'CB2' | 'FAAH'
  // MAO enzymes
  | 'MAO_A' | 'MAO_B'
  // COMT
  | 'COMT'
  // Ion channels
  | 'Nav' | 'Cav' | 'HCN' | 'TRPV1'
  // PPAR
  | 'PPARa' | 'PPARg'
  // Melatonin
  | 'MT1' | 'MT2'
  // Other
  | 'VMAT2'       // vesicular monoamine transporter 2
  | 'TAAR1';      // trace amine-associated receptor 1

// ─── Brain Regions ───────────────────────────────────────

export type BrainRegion =
  | 'dlPFC' | 'vmPFC' | 'ofc' | 'acc' | 'insula'
  | 'amygdala' | 'hippo' | 'nac' | 'vta' | 'snc'
  | 'raphe' | 'lc' | 'brainstem' | 'spinal'
  | 'parietal' | 'cerebellum' | 'hypothalamus'
  | 'striatum' | 'thalamus' | 'pag';

// ─── Receptor Binding ────────────────────────────────────

export interface ReceptorBinding {
  receptor: Receptor;
  ki_nM: number;
  type: ReceptorType;
  /** Intrinsic efficacy 0.0–1.0 for partial agonists */
  intrinsic_efficacy?: number;
  /** Literature source */
  source?: string;
  /** Brain regions where this binding is most relevant */
  region?: BrainRegion[];
}

// ─── PK Profile ──────────────────────────────────────────

export interface PETOccupancyEntry {
  receptor: Receptor;
  typical_dose_mg: number;
  occupancy_percent: number;
  source: string;
}

export interface PKProfile {
  molecular_weight_g_mol: number;
  oral_bioavailability: number;    // 0.0–1.0
  protein_binding: number;         // 0.0–1.0
  brain_plasma_ratio: number;
  half_life_hours: number;
  active_metabolites?: string[];
  pet_occupancy?: PETOccupancyEntry[];
}

// ─── CYP Interactions ────────────────────────────────────

export type CYPEnzyme = 'CYP2D6' | 'CYP2C19' | 'CYP3A4' | 'CYP1A2' | 'CYP2B6';

export interface CYPInteraction {
  enzyme: CYPEnzyme;
  strength: 'weak' | 'moderate' | 'strong';
}

// ─── Drug Schema V2 ─────────────────────────────────────

export interface DrugSchemaV2 {
  id: string;
  brand_name: string;
  generic_name: string;
  drug_class: string;
  indications: string[];
  bindings: ReceptorBinding[];
  pk: PKProfile;
  cyp_inhibits?: CYPInteraction[];
  cyp_induces?: CYPInteraction[];
  cyp_metabolized_by?: CYPEnzyme[];
  color: string;
  region_targets: BrainRegion[];

  // ── Legacy compat fields (populated during migration) ──
  /** Original v1 drug entry short label */
  legacy_short: string;
  /** Original v1 Russian name */
  legacy_name_ru: string;
  /** Original v1 doses array */
  doses: number[];
  /** Original v1 default dose */
  default_dose: number;
  /** Original v1 dose unit */
  dose_unit: string;
  /** Warn dose threshold */
  warn_dose?: number;
  /** Max dose threshold */
  max_dose?: number;
  /** Warn text */
  warn_text?: string;
  /** Per-dose warnings */
  warnings?: Record<number, string>;
  /** Is OTC */
  is_otc?: boolean;
}
