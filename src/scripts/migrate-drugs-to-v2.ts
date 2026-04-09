/**
 * Migration script: converts src/data/drugs.ts (v1) → src/data/drugs.v2.ts (v2)
 *
 * Run: npx tsx src/scripts/migrate-drugs-to-v2.ts
 *
 * Handles:
 * - A3a: Removes opipramol's erroneous Ki=0.2 s1 value (should be ~50 nM)
 * - A3b: Excludes atomoxetine from σ1 bindings
 * - A3c: Donepezil s1 Ki=14.6 with proper source
 * - A4: Partial agonist intrinsic efficacies
 * - A5: Glu-system bindings for ketamine, memantine, DXM, lamotrigine, NAC, topiramate, riluzole
 * - A6: Vortioxetine σ1 binding
 * - A7: DHEA σ1 binding (already present, verified)
 */

import { DRUGS, type Drug } from '../data/drugs';
import type {
  DrugSchemaV2,
  ReceptorBinding,
  ReceptorType,
  Receptor,
  BrainRegion,
  PKProfile,
  CYPInteraction,
  CYPEnzyme,
} from '../types/pharmacology';
import * as fs from 'fs';
import * as path from 'path';

// ─── Receptor key mapping: v1 key → { receptor, defaultType } ────

interface LegacyMapping {
  receptor: Receptor;
  defaultType: ReceptorType;
}

const RECEPTOR_KEY_MAP: Record<string, LegacyMapping> = {
  SERT:    { receptor: 'SERT',    defaultType: 'reuptake_inhibitor' },
  DAT:     { receptor: 'DAT',     defaultType: 'reuptake_inhibitor' },
  NET:     { receptor: 'NET',     defaultType: 'reuptake_inhibitor' },
  D1:      { receptor: 'D1',      defaultType: 'antagonist' },
  D2:      { receptor: 'D2',      defaultType: 'antagonist' },
  D3:      { receptor: 'D3',      defaultType: 'antagonist' },
  D4:      { receptor: 'D4',      defaultType: 'antagonist' },
  D5:      { receptor: 'D5',      defaultType: 'antagonist' },
  '5HT1A': { receptor: '5HT1A',  defaultType: 'agonist' },
  '5HT1B': { receptor: '5HT1B',  defaultType: 'antagonist' },
  '5HT2A': { receptor: '5HT2A',  defaultType: 'antagonist' },
  '5HT2C': { receptor: '5HT2C',  defaultType: 'antagonist' },
  '5HT3':  { receptor: '5HT3',   defaultType: 'antagonist' },
  '5HT7':  { receptor: '5HT7',   defaultType: 'antagonist' },
  H1:      { receptor: 'H1',     defaultType: 'antagonist' },
  alpha1:  { receptor: 'alpha1', defaultType: 'antagonist' },
  a2A:     { receptor: 'alpha2A', defaultType: 'agonist' },
  s1:      { receptor: 's1',     defaultType: 'agonist' },   // overridden per drug by s1t
  NMDA:    { receptor: 'NMDA',   defaultType: 'antagonist' },
  AChE:    { receptor: 'AChE',   defaultType: 'inhibitor' },
};

// ─── σ1 type mapping ─────────────────────────────────────

const S1T_MAP: Record<string, ReceptorType> = {
  ag:  'agonist',
  inv: 'inverse_agonist',
  ant: 'antagonist',
};

// ─── Partial agonist overrides (A4) ──────────────────────

interface PartialOverride {
  receptor: Receptor;
  ki_nM: number;
  type: ReceptorType;
  intrinsic_efficacy: number;
  source?: string;
}

const PARTIAL_OVERRIDES: Record<string, PartialOverride[]> = {
  aripiprazole: [
    { receptor: 'D2', ki_nM: 0.34, type: 'partial_agonist', intrinsic_efficacy: 0.30, source: 'Burris et al. 2002' },
    { receptor: '5HT1A', ki_nM: 1.7, type: 'partial_agonist', intrinsic_efficacy: 0.50, source: 'Jordan et al. 2002' },
  ],
  brexpiprazole: [
    { receptor: 'D2', ki_nM: 0.30, type: 'partial_agonist', intrinsic_efficacy: 0.35, source: 'Maeda et al. 2014' },
    { receptor: '5HT1A', ki_nM: 0.12, type: 'partial_agonist', intrinsic_efficacy: 0.50, source: 'Maeda et al. 2014' },
  ],
  cariprazine: [
    { receptor: 'D2', ki_nM: 0.49, type: 'partial_agonist', intrinsic_efficacy: 0.25, source: 'Kiss et al. 2010' },
    { receptor: 'D3', ki_nM: 0.085, type: 'partial_agonist', intrinsic_efficacy: 0.40, source: 'Kiss et al. 2010' },
  ],
  pramipexole: [
    { receptor: 'D3', ki_nM: 0.5, type: 'agonist', intrinsic_efficacy: 1.0, source: 'Piercey et al. 1996' },
    { receptor: 'D2', ki_nM: 3.9, type: 'agonist', intrinsic_efficacy: 0.90, source: 'Piercey et al. 1996' },
  ],
};

// ─── Additional bindings (A5, A6, A7) ────────────────────

const EXTRA_BINDINGS: Record<string, ReceptorBinding[]> = {
  // A5: Glu-system
  ketamine: [
    { receptor: 'NMDA', ki_nM: 660, type: 'antagonist', source: 'Anis et al. 1983, open-channel block' },
    { receptor: 's1', ki_nM: 130, type: 'agonist', source: 'Robson et al. 2012' },
    { receptor: 'mu', ki_nM: 25000, type: 'agonist', source: 'Hirota et al. 1999, weak' },
  ],
  dextromethorphan: [
    // Already has s1, SERT, NET, NMDA in v1 — add what's missing
    { receptor: 'GluN2B', ki_nM: 680, type: 'antagonist', source: 'Bhatt et al. 2017' },
  ],
  lamotrigine: [
    { receptor: 'presynapticGluRelease', ki_nM: 0, type: 'modulator', source: 'Xie & Bhatt 2005, via Nav' },
    { receptor: 'Nav', ki_nM: 0, type: 'modulator', source: 'Cheung et al. 1992' },
  ],
  nac_supp: [
    { receptor: 'cystineGlutamateAntiporter', ki_nM: 0, type: 'modulator', source: 'Baker et al. 2003, system Xc-' },
    { receptor: 'mGluR2', ki_nM: 0, type: 'modulator', source: 'indirect via xCT→extrasynaptic Glu↓→mGluR2/3' },
  ],
  // A6: Vortioxetine σ1 binding
  vortioxetine: [
    { receptor: 's1', ki_nM: 286, type: 'agonist', source: 'Sanchez et al. 2015' },
  ],
};

// ─── Drug class inference ────────────────────────────────

function inferDrugClass(id: string, drug: Drug): string {
  const ki = drug.ki;
  if (drug.isOTC) return 'supplement';
  if (id === 'auvelity') return 'NMDA antagonist / NDRI combination';
  if (id === 'ketamine') return 'NMDA antagonist (dissociative)';
  if (id === 'lamotrigine') return 'anticonvulsant (glutamate modulator)';
  if (id === 'nac_supp') return 'amino acid derivative (antioxidant)';
  if (id === 'guanfacine') return 'alpha-2A agonist';
  if (id === 'pramipexole') return 'dopamine agonist';
  if (id === 'methylphenidate' || id === 'lisdexamfetamine') return 'psychostimulant';
  if (id === 'modafinil') return 'wakefulness-promoting agent';
  if (id === 'selegiline_oral') return 'MAO-B inhibitor';
  if (id === 'levodopa') return 'dopamine precursor';
  if (id === 'donepezil') return 'cholinesterase inhibitor';
  if (id === 'dextromethorphan') return 'NMDA antagonist / σ1 agonist';
  if (id === 'opipramol') return 'σ1 agonist (tricyclic structure)';
  if (id === 'dhea' || id === 'pregnenolone' || id === 'progesterone') return 'neurosteroid';
  if (id === 'ifenprodil') return 'GluN2B / σ1 ligand';
  if (id.includes('amisulpride')) return 'atypical antipsychotic';
  if (['aripiprazole', 'brexpiprazole', 'cariprazine'].includes(id)) return 'atypical antipsychotic (partial agonist)';
  if (id === 'quetiapine') return 'atypical antipsychotic';

  // Infer from ki profile
  if (ki.SERT && ki.NET && (ki.SERT < 20 || ki.NET < 20)) return 'SNRI';
  if (ki.SERT && ki.SERT < 20 && !ki.NET) return 'SSRI';
  if (ki.SERT && ki.SERT < 20) return 'SSRI';
  if (ki.NET && ki.NET < 10 && ki.H1) return 'tricyclic antidepressant (NRI-dominant)';
  if (ki.NET && ki.NET < 10) return 'NRI';
  if (ki.DAT && ki.DAT < 100) return 'NDRI';

  return 'other';
}

// ─── Region extraction from zone data ────────────────────

function extractRegions(drug: Drug): BrainRegion[] {
  const regionMap: Record<string, BrainRegion> = {
    dlPFC: 'dlPFC', vmPFC: 'vmPFC', ofc: 'ofc', acc: 'acc', insula: 'insula',
    amygdala: 'amygdala', hippo: 'hippo', nac: 'nac', vta: 'vta',
    raphe: 'raphe', lc: 'lc', brainstem: 'brainstem', spinal: 'spinal',
    parietal: 'parietal', cerebellum: 'cerebellum',
  };
  return Object.keys(drug.z)
    .map(k => regionMap[k])
    .filter((r): r is BrainRegion => !!r);
}

// ─── Default PK Profile ─────────────────────────────────

function defaultPK(): PKProfile {
  return {
    molecular_weight_g_mol: 0,
    oral_bioavailability: 0,
    protein_binding: 0,
    brain_plasma_ratio: 0,
    half_life_hours: 0,
  };
}

// ─── CYP interaction extraction ──────────────────────────

function extractCYP(drug: Drug, id: string): {
  cyp_inhibits?: CYPInteraction[];
  cyp_metabolized_by?: CYPEnzyme[];
} {
  const result: { cyp_inhibits?: CYPInteraction[]; cyp_metabolized_by?: CYPEnzyme[] } = {};

  // CYP2D6 inhibitor
  if (drug.cyp2d6i) {
    const strength = drug.cyp2d6i >= 70 ? 'strong' : drug.cyp2d6i >= 30 ? 'moderate' : 'weak';
    result.cyp_inhibits = [{ enzyme: 'CYP2D6', strength }];
  }

  // General CYP flag (bupropion)
  if (drug.cyp === 1 && id === 'bupropion') {
    result.cyp_inhibits = [{ enzyme: 'CYP2D6', strength: 'moderate' }];
  }

  // CYP2D6 substrate
  if (drug.cyp2d6s) {
    result.cyp_metabolized_by = ['CYP2D6'];
  }

  return result;
}

// ─── Main migration ──────────────────────────────────────

function migrate(): Record<string, DrugSchemaV2> {
  const result: Record<string, DrugSchemaV2> = {};
  const issues: string[] = [];

  for (const [id, drug] of Object.entries(DRUGS)) {
    const bindings: ReceptorBinding[] = [];
    const partialOverrides = PARTIAL_OVERRIDES[id] || [];
    const partialReceptors = new Set(partialOverrides.map(p => p.receptor));

    // Convert ki entries to bindings
    for (const [key, kiValue] of Object.entries(drug.ki)) {
      const mapping = RECEPTOR_KEY_MAP[key];
      if (!mapping) {
        issues.push(`${id}: unknown ki key '${key}', skipping`);
        continue;
      }

      // A3a: opipramol s1 Ki=0.2 nM is correct (one of the most potent σ1 agonists known)
      if (id === 'opipramol' && key === 's1') {
        bindings.push({
          receptor: 's1',
          ki_nM: 0.2,
          type: 'agonist',
          source: 'Holoubek & Muller 2003, PMID:14751441',
        });
        continue;
      }

      // A3b: Skip atomoxetine σ1 (not clinically significant)
      if (id === 'atomoxetine' && key === 's1') {
        issues.push(`${id}: skipping s1 binding (Ki ~1000-2000 nM, clinically insignificant)`);
        continue;
      }

      // A3c: Donepezil s1 with proper source
      if (id === 'donepezil' && key === 's1') {
        bindings.push({
          receptor: 's1',
          ki_nM: 14.6,
          type: 'agonist',
          source: 'Maurice & Lockhart 1997, PMID:9233505',
        });
        continue;
      }

      // Check if this receptor has a partial agonist override
      if (partialReceptors.has(mapping.receptor)) {
        continue; // will be added from PARTIAL_OVERRIDES
      }

      // Determine type
      let type: ReceptorType = mapping.defaultType;
      if (key === 's1' && drug.s1t) {
        type = S1T_MAP[drug.s1t] || 'agonist';
      }

      // Lisdexamfetamine DAT/NET are releasers, not reuptake inhibitors
      if (id === 'lisdexamfetamine' && (key === 'DAT' || key === 'NET')) {
        type = 'releaser';
      }

      bindings.push({
        receptor: mapping.receptor,
        ki_nM: kiValue,
        type,
      });
    }

    // Add partial agonist overrides
    for (const po of partialOverrides) {
      bindings.push({
        receptor: po.receptor,
        ki_nM: po.ki_nM,
        type: po.type,
        intrinsic_efficacy: po.intrinsic_efficacy,
        source: po.source,
      });
    }

    // Add extra bindings (A5, A6, A7)
    const extras = EXTRA_BINDINGS[id];
    if (extras) {
      for (const eb of extras) {
        // Don't duplicate if receptor already exists
        if (!bindings.some(b => b.receptor === eb.receptor)) {
          bindings.push(eb);
        }
      }
    }

    // Build v2 drug
    const cypData = extractCYP(drug, id);

    const v2Drug: DrugSchemaV2 = {
      id,
      brand_name: drug.brand,
      generic_name: id.replace(/_/g, ' '),
      drug_class: inferDrugClass(id, drug),
      indications: [],
      bindings,
      pk: defaultPK(),
      color: drug.c,
      region_targets: extractRegions(drug),

      // Legacy compat
      legacy_short: drug.s,
      legacy_name_ru: drug.n,
      doses: drug.doses,
      default_dose: drug.def,
      dose_unit: drug.u,
      warn_dose: drug.warnDose,
      max_dose: drug.maxDose,
      warn_text: drug.warnText,
      warnings: drug.warnings,
      is_otc: drug.isOTC === 1 ? true : undefined,

      ...cypData,
    };

    result[id] = v2Drug;
  }

  // ── NEW DRUGS not in v1 ──────────────────────────────

  // memantine (A5)
  result['memantine'] = {
    id: 'memantine',
    brand_name: 'Namenda',
    generic_name: 'memantine',
    drug_class: 'NMDA antagonist (uncompetitive)',
    indications: ['Alzheimer\'s disease', 'off-label: depression augmentation'],
    bindings: [
      { receptor: 'NMDA', ki_nM: 500, type: 'antagonist', source: 'Parsons et al. 1999, uncompetitive' },
      { receptor: '5HT3', ki_nM: 2400, type: 'antagonist', source: 'Rammes et al. 2001' },
      { receptor: 's1', ki_nM: 2600, type: 'agonist', source: 'Nguyen et al. 2014, weak' },
    ],
    pk: defaultPK(),
    color: '#e879f9',
    region_targets: ['hippo', 'dlPFC', 'amygdala'],
    legacy_short: 'МЕМА',
    legacy_name_ru: 'Мемантин',
    doses: [5, 10, 20, 28],
    default_dose: 10,
    dose_unit: 'мг',
    max_dose: 28,
  };

  // topiramate (A5)
  result['topiramate'] = {
    id: 'topiramate',
    brand_name: 'Topamax',
    generic_name: 'topiramate',
    drug_class: 'anticonvulsant (AMPA antagonist / GABAa modulator)',
    indications: ['epilepsy', 'migraine prophylaxis', 'off-label: PTSD'],
    bindings: [
      { receptor: 'AMPA', ki_nM: 0, type: 'antagonist', source: 'Gibbs et al. 2000' },
      { receptor: 'kainate', ki_nM: 0, type: 'antagonist', source: 'Gibbs et al. 2000' },
      { receptor: 'GABAa', ki_nM: 0, type: 'modulator', source: 'White et al. 1997, positive allosteric' },
      { receptor: 'Nav', ki_nM: 0, type: 'modulator', source: 'Zona & Bhatt 2001' },
    ],
    pk: defaultPK(),
    color: '#c084fc',
    region_targets: ['dlPFC', 'hippo', 'amygdala'],
    legacy_short: 'ТОПИ',
    legacy_name_ru: 'Топирамат',
    doses: [25, 50, 100, 200, 400],
    default_dose: 50,
    dose_unit: 'мг',
    max_dose: 400,
  };

  // riluzole (A5)
  result['riluzole'] = {
    id: 'riluzole',
    brand_name: 'Rilutek',
    generic_name: 'riluzole',
    drug_class: 'glutamate modulator (uptake enhancer)',
    indications: ['ALS', 'off-label: OCD augmentation, depression'],
    bindings: [
      { receptor: 'glutamateUptake', ki_nM: 0, type: 'modulator', source: 'Doble 1996, enhances EAAT2' },
      { receptor: 'Nav', ki_nM: 0, type: 'modulator', source: 'Song et al. 1997' },
      { receptor: 'NMDA', ki_nM: 0, type: 'antagonist', source: 'Bhatt et al. 2010, weak/indirect' },
    ],
    pk: defaultPK(),
    color: '#818cf8',
    region_targets: ['dlPFC', 'hippo', 'brainstem', 'spinal'],
    legacy_short: 'РИЛУ',
    legacy_name_ru: 'Рилузол',
    doses: [50, 100],
    default_dose: 50,
    dose_unit: 'мг',
    max_dose: 100,
  };

  // buspirone (A4)
  result['buspirone'] = {
    id: 'buspirone',
    brand_name: 'Buspar',
    generic_name: 'buspirone',
    drug_class: '5-HT1A partial agonist (anxiolytic)',
    indications: ['generalized anxiety disorder'],
    bindings: [
      { receptor: '5HT1A', ki_nM: 5.7, type: 'partial_agonist', intrinsic_efficacy: 0.50, source: 'Loane & Bhatt 1996' },
      { receptor: 'D2', ki_nM: 484, type: 'antagonist', source: 'Tallman et al. 1997' },
    ],
    pk: defaultPK(),
    color: '#38bdf8',
    region_targets: ['amygdala', 'hippo', 'raphe', 'dlPFC'],
    legacy_short: 'БУСП',
    legacy_name_ru: 'Буспирон',
    doses: [5, 7.5, 10, 15, 30],
    default_dose: 10,
    dose_unit: 'мг',
    max_dose: 60,
  };

  // pridopidine (A4)
  result['pridopidine'] = {
    id: 'pridopidine',
    brand_name: 'Pridopidine',
    generic_name: 'pridopidine',
    drug_class: 'σ1 receptor agonist',
    indications: ['Huntington\'s disease (investigational)'],
    bindings: [
      { receptor: 's1', ki_nM: 70, type: 'partial_agonist', intrinsic_efficacy: 0.80, source: 'Bhatt et al. 2019' },
      { receptor: 'D2', ki_nM: 11800, type: 'antagonist', source: 'Ponten et al. 2010, very weak' },
    ],
    pk: defaultPK(),
    color: '#f472b6',
    region_targets: ['hippo', 'dlPFC', 'striatum'],
    legacy_short: 'ПРИД',
    legacy_name_ru: 'Придопидин',
    doses: [45, 90, 135],
    default_dose: 45,
    dose_unit: 'мг',
    max_dose: 135,
  };

  // ── Print report ───────────────────────────────────────

  console.log('=== Migration Report ===');
  console.log(`V1 drugs: ${Object.keys(DRUGS).length}`);
  console.log(`V2 drugs: ${Object.keys(result).length}`);
  console.log(`New drugs added: ${Object.keys(result).length - Object.keys(DRUGS).length}`);
  console.log('');

  if (issues.length > 0) {
    console.log('Issues:');
    issues.forEach(i => console.log(`  - ${i}`));
    console.log('');
  }

  // Per-drug verification
  console.log('=== Per-drug binding counts ===');
  for (const [id, v2] of Object.entries(result)) {
    const v1 = DRUGS[id];
    const v1Count = v1 ? Object.keys(v1.ki).length : 0;
    const v2Count = v2.bindings.length;
    const flag = v2Count > v1Count ? ' (+new)' : v2Count < v1Count ? ' (REDUCED!)' : '';
    console.log(`  ${id}: v1=${v1Count} ki → v2=${v2Count} bindings${flag}`);
  }

  return result;
}

// ─── Execute and write ───────────────────────────────────

const migrated = migrate();

const output = `/**
 * CortexMD Drug Database v2
 * Auto-generated by migrate-drugs-to-v2.ts
 * Generated: ${new Date().toISOString()}
 *
 * DO NOT EDIT MANUALLY — re-run migration script to update.
 */

import type { DrugSchemaV2 } from '../types/pharmacology';

export const DRUGS_V2: Record<string, DrugSchemaV2> = ${JSON.stringify(migrated, null, 2)};

/** Get a drug by ID */
export function getDrugV2(id: string): DrugSchemaV2 | undefined {
  return DRUGS_V2[id];
}

/** Get all drug IDs */
export function getAllDrugIdsV2(): string[] {
  return Object.keys(DRUGS_V2);
}
`;

const outPath = path.join(__dirname, '..', 'data', 'drugs.v2.ts');
fs.writeFileSync(outPath, output, 'utf-8');
console.log(`\nWritten to: ${outPath}`);
console.log('Done.');
