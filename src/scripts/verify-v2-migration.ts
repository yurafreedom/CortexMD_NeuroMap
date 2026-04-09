/**
 * Verification script for v1→v2 migration
 * Run: npx tsx src/scripts/verify-v2-migration.ts
 */

import { DRUGS } from '../data/drugs';
import { DRUGS_V2 } from '../data/drugs.v2';

const v1Ids = Object.keys(DRUGS);
const v2Ids = Object.keys(DRUGS_V2);

console.log('=== V2 Migration Verification ===\n');
console.log(`V1 drug count: ${v1Ids.length}`);
console.log(`V2 drug count: ${v2Ids.length}`);
console.log(`New in V2:     ${v2Ids.filter(id => !DRUGS[id]).join(', ')}`);
console.log('');

// Check every v1 drug is in v2
const missing = v1Ids.filter(id => !DRUGS_V2[id]);
if (missing.length > 0) {
  console.log(`❌ MISSING from V2: ${missing.join(', ')}`);
} else {
  console.log('✅ All V1 drugs present in V2');
}

// Data corrections check
console.log('\n=== Data Corrections ===');

// A3a: opipramol s1
const opi = DRUGS_V2['opipramol'];
const opiS1 = opi?.bindings.find(b => b.receptor === 's1');
console.log(`A3a opipramol s1: Ki=${opiS1?.ki_nM} (should be 50, was 0.2) → ${opiS1?.ki_nM === 50 ? '✅' : '❌'}`);

// A3b: atomoxetine no s1
const atm = DRUGS_V2['atomoxetine'];
const atmS1 = atm?.bindings.find(b => b.receptor === 's1');
console.log(`A3b atomoxetine s1: ${atmS1 ? '❌ still present' : '✅ removed'}`);

// A3c: donepezil s1 with source
const don = DRUGS_V2['donepezil'];
const donS1 = don?.bindings.find(b => b.receptor === 's1');
console.log(`A3c donepezil s1: Ki=${donS1?.ki_nM}, source=${donS1?.source ? 'present' : 'MISSING'} → ${donS1?.ki_nM === 14.6 && donS1?.source ? '✅' : '❌'}`);

// A4: Partial agonists
console.log('\n=== Partial Agonists (A4) ===');
for (const [id, receptor, expectedIE] of [
  ['aripiprazole', 'D2', 0.30],
  ['aripiprazole', '5HT1A', 0.50],
  ['brexpiprazole', 'D2', 0.35],
  ['brexpiprazole', '5HT1A', 0.50],
  ['cariprazine', 'D2', 0.25],
  ['cariprazine', 'D3', 0.40],
  ['buspirone', '5HT1A', 0.50],
  ['pridopidine', 's1', 0.80],
] as const) {
  const drug = DRUGS_V2[id];
  const binding = drug?.bindings.find(b => b.receptor === receptor);
  const ok = binding?.type === 'partial_agonist' && binding?.intrinsic_efficacy === expectedIE;
  console.log(`  ${id} ${receptor}: type=${binding?.type}, ie=${binding?.intrinsic_efficacy} → ${ok ? '✅' : '❌'}`);
}

// A5: Glu bindings
console.log('\n=== Glutamate Bindings (A5) ===');
for (const [id, receptor] of [
  ['ketamine', 'NMDA'],
  ['ketamine', 's1'],
  ['memantine', 'NMDA'],
  ['dextromethorphan', 'GluN2B'],
  ['lamotrigine', 'presynapticGluRelease'],
  ['nac_supp', 'cystineGlutamateAntiporter'],
  ['topiramate', 'AMPA'],
  ['riluzole', 'glutamateUptake'],
] as const) {
  const drug = DRUGS_V2[id];
  const binding = drug?.bindings.find(b => b.receptor === receptor);
  console.log(`  ${id} ${receptor}: ${binding ? '✅' : '❌ MISSING'}`);
}

// A6: Vortioxetine s1
const vort = DRUGS_V2['vortioxetine'];
const vortS1 = vort?.bindings.find(b => b.receptor === 's1');
console.log(`\nA6 vortioxetine s1: Ki=${vortS1?.ki_nM} → ${vortS1 ? '✅' : '❌'}`);

// A7: DHEA s1
const dhea = DRUGS_V2['dhea'];
const dheaS1 = dhea?.bindings.find(b => b.receptor === 's1');
console.log(`A7 DHEA s1: Ki=${dheaS1?.ki_nM} → ${dheaS1 ? '✅' : '❌'}`);

console.log('\n=== Done ===');
