/**
 * Sanity tests for the unified balance formula.
 * Run: npx tsx src/scripts/test-balance-formulas.ts
 */

import { DRUGS_V2 } from '../data/drugs.v2';
import { calculateBalance } from '../lib/indicators/balance';
import {
  SIGMA1_WEIGHTS,
  SEROTONIN_WEIGHTS,
  DA_WEIGHTS,
  NA_WEIGHTS,
} from '../constants/receptor-weights';
import { calculateDopamineBalance } from '../lib/indicators/dopamine';
import { calculateNorepinephrineBalance } from '../lib/indicators/norepinephrine';
import { calculateSerotoninBalance } from '../lib/indicators/serotonin';
import { calculateGlutamateBalance } from '../lib/indicators/glutamate';
import { calculateSigma1Balance } from '../lib/indicators/sigma1';
import { calculateCYPBalance } from '../lib/indicators/cyp';
import {
  CONDITIONAL_INDICATORS,
  calculateACBScore,
  sumGABAaActivity,
  maxH1Occupancy,
  maxAlpha1Occupancy,
} from '../lib/indicators/conditional';

let passed = 0;
let failed = 0;

function assert(name: string, condition: boolean, detail: string) {
  if (condition) {
    console.log(`  ✓ ${name}`);
    passed++;
  } else {
    console.log(`  ✗ ${name} — ${detail}`);
    failed++;
  }
}

console.log('=== Balance Formula Sanity Tests ===\n');

// Test 1: Sertraline 100mg → σ1 should be negative (inverse agonist)
{
  const drug = DRUGS_V2['sertraline'];
  const balance = calculateBalance({
    indicatorId: 's1',
    activeDrugs: [{ drug, dose_mg: 100 }],
    weights: SIGMA1_WEIGHTS,
  });

  console.log('Test 1: Sertraline 100mg σ1');
  console.log(`  Value: ${balance.value.toFixed(1)}, Zone: ${balance.zone.id}`);
  console.log(`  Raw net: ${balance.raw_net.toFixed(1)}`);
  console.log(`  Breakdown: inv_ag=${balance.breakdown.inverse_agonist.toFixed(1)}`);
  assert('σ1 negative', balance.value < -10, `value=${balance.value.toFixed(1)}`);
  console.log('');
}

// Test 2: Sertraline 100mg → 5-HT should be positive (SERT inhibition)
{
  const drug = DRUGS_V2['sertraline'];
  const balance = calculateBalance({
    indicatorId: '5HT',
    activeDrugs: [{ drug, dose_mg: 100 }],
    weights: SEROTONIN_WEIGHTS,
  });

  console.log('Test 2: Sertraline 100mg 5-HT');
  console.log(`  Value: ${balance.value.toFixed(1)}, Zone: ${balance.zone.id}`);
  console.log(`  Breakdown: ri=${balance.breakdown.reuptake_inhibitor.toFixed(1)}`);
  assert('5-HT positive', balance.value > 10, `value=${balance.value.toFixed(1)}`);
  console.log('');
}

// Test 3: Bupropion 300mg → DA should be positive (DAT inhibition)
{
  const drug = DRUGS_V2['bupropion'];
  const balance = calculateBalance({
    indicatorId: 'DA',
    activeDrugs: [{ drug, dose_mg: 300 }],
    weights: DA_WEIGHTS,
  });

  console.log('Test 3: Bupropion 300mg DA');
  console.log(`  Value: ${balance.value.toFixed(1)}, Zone: ${balance.zone.id}`);
  console.log(`  Breakdown: ri=${balance.breakdown.reuptake_inhibitor.toFixed(1)}`);
  assert('DA positive', balance.value > 0, `value=${balance.value.toFixed(1)}`);
  console.log('');
}

// Test 4: Empty schema → value should be 0
{
  const balance = calculateBalance({
    indicatorId: 's1',
    activeDrugs: [],
    weights: SIGMA1_WEIGHTS,
  });

  console.log('Test 4: Empty schema σ1');
  console.log(`  Value: ${balance.value.toFixed(1)}`);
  assert('value is 0', Math.abs(balance.value) < 0.01, `value=${balance.value.toFixed(1)}`);
  console.log('');
}

// Test 5: Sertraline + Donepezil → σ1 should be closer to 0 than sertraline alone
{
  const sertraline = DRUGS_V2['sertraline'];
  const donepezil = DRUGS_V2['donepezil'];

  const sertOnly = calculateBalance({
    indicatorId: 's1',
    activeDrugs: [{ drug: sertraline, dose_mg: 100 }],
    weights: SIGMA1_WEIGHTS,
  });

  const combined = calculateBalance({
    indicatorId: 's1',
    activeDrugs: [
      { drug: sertraline, dose_mg: 100 },
      { drug: donepezil, dose_mg: 10 },
    ],
    weights: SIGMA1_WEIGHTS,
  });

  console.log('Test 5: Sertraline 100mg + Donepezil 10mg σ1');
  console.log(`  Sert only: ${sertOnly.value.toFixed(1)}`);
  console.log(`  Combined:  ${combined.value.toFixed(1)}`);
  assert(
    'donepezil compensates',
    Math.abs(combined.value) < Math.abs(sertOnly.value),
    `combined=${combined.value.toFixed(1)} vs sert=${sertOnly.value.toFixed(1)}`
  );
  console.log('');
}

// Test 6: Bupropion 300mg NA — should be positive (NET inhibition, weak)
{
  const drug = DRUGS_V2['bupropion'];
  const balance = calculateNorepinephrineBalance([{ drug, dose_mg: 300 }]);

  console.log('Test 6: Bupropion 300mg NA');
  console.log(`  Value: ${balance.value.toFixed(1)}, Zone: ${balance.zone.id}`);
  console.log(`  Breakdown: ri=${balance.breakdown.reuptake_inhibitor.toFixed(1)}`);
  assert('NA positive', balance.value > 0, `value=${balance.value.toFixed(1)}`);
  console.log('');
}

// Test 7: Aripiprazole 10mg DA — partial agonist, controlled value
{
  const drug = DRUGS_V2['aripiprazole'];
  const balance = calculateDopamineBalance([{ drug, dose_mg: 10 }]);

  console.log('Test 7: Aripiprazole 10mg DA');
  console.log(`  Value: ${balance.value.toFixed(1)}, Zone: ${balance.zone.id}`);
  console.log(`  Breakdown: partial=${balance.breakdown.partial_agonist.toFixed(1)}, ant=${balance.breakdown.antagonist.toFixed(1)}`);
  // Partial agonist at D2 (ie=0.30) — net should be moderate, not extreme
  assert('DA not extreme', Math.abs(balance.value) < 80, `value=${balance.value.toFixed(1)}`);
  console.log('');
}

// Test 8: Sertraline + Bupropion 5-HT — both contribute
{
  const sertraline = DRUGS_V2['sertraline'];
  const bupropion = DRUGS_V2['bupropion'];

  const sertOnly = calculateSerotoninBalance([{ drug: sertraline, dose_mg: 100 }]);
  const combined = calculateSerotoninBalance([
    { drug: sertraline, dose_mg: 100 },
    { drug: bupropion, dose_mg: 300 },
  ]);

  console.log('Test 8: Sertraline 100mg + Bupropion 300mg 5-HT');
  console.log(`  Sert only: ${sertOnly.value.toFixed(1)}`);
  console.log(`  Combined:  ${combined.value.toFixed(1)}`);
  // Bupropion has no significant SERT binding, so combined ≈ sert only
  assert('5-HT still high', combined.value > 10, `value=${combined.value.toFixed(1)}`);
  console.log('');
}

// Test 9: Ketamine NMDA effect through Glu indicator
{
  const drug = DRUGS_V2['ketamine'];
  const balance = calculateGlutamateBalance([{ drug, dose_mg: 0.5 }]);

  console.log('Test 9: Ketamine 0.5mg/kg Glu');
  console.log(`  Value: ${balance.value.toFixed(1)}, Zone: ${balance.zone.id}`);
  console.log(`  Breakdown: ant=${balance.breakdown.antagonist.toFixed(1)}, ag=${balance.breakdown.agonist.toFixed(1)}`);
  // Ketamine is NMDA antagonist — should show activity (non-zero)
  assert('Glu non-zero', Math.abs(balance.value) > 0, `value=${balance.value.toFixed(1)}`);
  console.log('');
}

// Test 10: Sertraline σ1 via calculateSigma1Balance — MUST equal Test 1
{
  const drug = DRUGS_V2['sertraline'];
  const balance = calculateSigma1Balance([{ drug, dose_mg: 100 }]);

  console.log('Test 10: Sertraline 100mg σ1 via calculateSigma1Balance');
  console.log(`  Value: ${balance.value.toFixed(1)}, Zone: ${balance.zone.id}`);
  // CRITICAL: must match Test 1 exactly (updated to -84.6 after Phase 8 metabolites)
  const test1Value = -84.6;
  const diff = Math.abs(balance.value - test1Value);
  assert('matches Test 1', diff < 0.2, `value=${balance.value.toFixed(1)} vs test1=${test1Value}`);
  console.log('');
}

// Test 11: Bupropion CYP2D6 inhibition
{
  const drug = DRUGS_V2['bupropion'];
  const balance = calculateCYPBalance([{ drug, dose_mg: 300 }]);

  console.log('Test 11: Bupropion 300mg CYP');
  console.log(`  Value: ${balance.value.toFixed(1)}, Zone: ${balance.zone.id}`);
  console.log(`  Inhibition: ${(-balance.value).toFixed(0)}%`);
  // Bupropion is moderate CYP2D6 inhibitor → value should be -50
  assert('CYP inhibited', balance.value < 0, `value=${balance.value.toFixed(1)}`);
  console.log('');
}

// === PHASE 3: Glu indicator tests ===
console.log('--- Phase 3: Glu Indicator ---\n');

// Test 12: Ketamine 0.5mg Glu — NMDA antagonist, non-zero (Ki=10)
{
  const drug = DRUGS_V2['ketamine'];
  const balance = calculateGlutamateBalance([{ drug, dose_mg: 0.5 }]);
  console.log('Test 12: Ketamine 0.5mg Glu');
  console.log(`  Value: ${balance.value.toFixed(1)}, Zone: ${balance.zone.id}`);
  console.log(`  Breakdown: ant=${balance.breakdown.antagonist.toFixed(1)}`);
  assert('Glu non-zero', Math.abs(balance.value) > 0, `value=${balance.value.toFixed(1)}`);
  console.log('');
}

// Test 13: Memantine 20mg Glu — NMDA antagonist (Ki=500)
{
  const drug = DRUGS_V2['memantine'];
  const balance = calculateGlutamateBalance([{ drug, dose_mg: 20 }]);
  console.log('Test 13: Memantine 20mg Glu');
  console.log(`  Value: ${balance.value.toFixed(1)}, Zone: ${balance.zone.id}`);
  console.log(`  Breakdown: ant=${balance.breakdown.antagonist.toFixed(1)}`);
  assert('Glu non-zero', Math.abs(balance.value) > 0, `value=${balance.value.toFixed(1)}`);
  console.log('');
}

// Test 14: NAC 1200mg Glu — cystine antiporter modulator (ki=0, functional fallback)
{
  const drug = DRUGS_V2['nac_supp'];
  const balance = calculateGlutamateBalance([{ drug, dose_mg: 1200 }]);
  console.log('Test 14: NAC 1200mg Glu');
  console.log(`  Value: ${balance.value.toFixed(1)}, Zone: ${balance.zone.id}`);
  console.log(`  Breakdown: ag=${balance.breakdown.agonist.toFixed(1)}`);
  assert('Glu non-zero (functional fallback)', Math.abs(balance.value) > 0, `value=${balance.value.toFixed(1)}`);
  console.log('');
}

// Test 15: Lamotrigine 200mg Glu — presynaptic Glu release inhibition (ki=0, functional fallback)
{
  const drug = DRUGS_V2['lamotrigine'];
  const balance = calculateGlutamateBalance([{ drug, dose_mg: 200 }]);
  console.log('Test 15: Lamotrigine 200mg Glu');
  console.log(`  Value: ${balance.value.toFixed(1)}, Zone: ${balance.zone.id}`);
  console.log(`  Breakdown: ag=${balance.breakdown.agonist.toFixed(1)}`);
  assert('Glu non-zero (functional fallback)', Math.abs(balance.value) > 0, `value=${balance.value.toFixed(1)}`);
  console.log('');
}

// Test 16: Topiramate 200mg Glu — AMPA/kainate antagonist (ki=0, functional fallback)
{
  const drug = DRUGS_V2['topiramate'];
  const balance = calculateGlutamateBalance([{ drug, dose_mg: 200 }]);
  console.log('Test 16: Topiramate 200mg Glu');
  console.log(`  Value: ${balance.value.toFixed(1)}, Zone: ${balance.zone.id}`);
  console.log(`  Breakdown: ant=${balance.breakdown.antagonist.toFixed(1)}`);
  assert('Glu non-zero (functional fallback)', Math.abs(balance.value) > 0, `value=${balance.value.toFixed(1)}`);
  console.log('');
}

// Test 17: Riluzole 100mg Glu — glutamate uptake enhancer (ki=0, functional fallback)
{
  const drug = DRUGS_V2['riluzole'];
  const balance = calculateGlutamateBalance([{ drug, dose_mg: 100 }]);
  console.log('Test 17: Riluzole 100mg Glu');
  console.log(`  Value: ${balance.value.toFixed(1)}, Zone: ${balance.zone.id}`);
  console.log(`  Breakdown: ag=${balance.breakdown.agonist.toFixed(1)}, ant=${balance.breakdown.antagonist.toFixed(1)}`);
  assert('Glu non-zero (functional fallback)', Math.abs(balance.value) > 0, `value=${balance.value.toFixed(1)}`);
  console.log('');
}

// Test 18: DXM (auvelity) 45mg Glu — NMDA antagonist (Ki=500)
{
  const drug = DRUGS_V2['auvelity'];
  const balance = calculateGlutamateBalance([{ drug, dose_mg: 45 }]);
  console.log('Test 18: Auvelity 45mg Glu');
  console.log(`  Value: ${balance.value.toFixed(1)}, Zone: ${balance.zone.id}`);
  console.log(`  Breakdown: ant=${balance.breakdown.antagonist.toFixed(1)}`);
  assert('Glu non-zero', Math.abs(balance.value) > 0, `value=${balance.value.toFixed(1)}`);
  console.log('');
}

// === PHASE 4: Conditional indicator tests ===
console.log('--- Phase 4: Conditional Indicators ---\n');

// Test 19: Sertraline only → no conditional triggers
{
  const drugs = [{ drug: DRUGS_V2['sertraline'], dose_mg: 100 }];
  const triggered = CONDITIONAL_INDICATORS.filter(ci => ci.detect(drugs)).map(ci => ci.id);
  console.log('Test 19: Sertraline 100mg → conditionals');
  console.log(`  Triggered: ${triggered.length === 0 ? 'none' : triggered.join(', ')}`);
  console.log(`  ACB score: ${calculateACBScore(drugs)}`);
  assert('no conditional triggers', triggered.length === 0, `triggered=${triggered.join(',')}`);
  console.log('');
}

// Test 20: Amitriptyline 75mg → ACh should appear (ACB=3)
{
  const drugs = [{ drug: DRUGS_V2['amitriptyline'], dose_mg: 75 }];
  const acb = calculateACBScore(drugs);
  const triggered = CONDITIONAL_INDICATORS.filter(ci => ci.detect(drugs)).map(ci => ci.id);
  console.log('Test 20: Amitriptyline 75mg → conditionals');
  console.log(`  ACB score: ${acb}`);
  console.log(`  Triggered: ${triggered.join(', ')}`);
  assert('ACh triggered', triggered.includes('ACh'), `ACB=${acb}, triggered=${triggered.join(',')}`);
  console.log('');
}

// Test 21: Quetiapine 100mg → H1 should appear (high H1 affinity, Ki=11)
{
  const drugs = [{ drug: DRUGS_V2['quetiapine'], dose_mg: 100 }];
  const h1occ = maxH1Occupancy(drugs);
  const a1occ = maxAlpha1Occupancy(drugs);
  const triggered = CONDITIONAL_INDICATORS.filter(ci => ci.detect(drugs)).map(ci => ci.id);
  console.log('Test 21: Quetiapine 100mg → conditionals');
  console.log(`  H1 occ: ${h1occ.toFixed(1)}%, α1 occ: ${a1occ.toFixed(1)}%`);
  console.log(`  Triggered: ${triggered.join(', ')}`);
  assert('H1 triggered', triggered.includes('H1'), `H1occ=${h1occ.toFixed(1)}, triggered=${triggered.join(',')}`);
  console.log('');
}

// Test 22: Topiramate 200mg → GABA should appear (GABAa modulation)
{
  const drugs = [{ drug: DRUGS_V2['topiramate'], dose_mg: 200 }];
  const gabaAct = sumGABAaActivity(drugs);
  const triggered = CONDITIONAL_INDICATORS.filter(ci => ci.detect(drugs)).map(ci => ci.id);
  console.log('Test 22: Topiramate 200mg → conditionals');
  console.log(`  GABA activity: ${gabaAct.toFixed(1)}%`);
  console.log(`  Triggered: ${triggered.join(', ')}`);
  assert('GABA triggered', triggered.includes('GABA'), `GABAact=${gabaAct.toFixed(1)}, triggered=${triggered.join(',')}`);
  console.log('');
}

// Test 23: Polypharmacy — amitriptyline + quetiapine → ACh + H1 + α1
{
  const drugs = [
    { drug: DRUGS_V2['amitriptyline'], dose_mg: 75 },
    { drug: DRUGS_V2['quetiapine'], dose_mg: 100 },
  ];
  const triggered = CONDITIONAL_INDICATORS.filter(ci => ci.detect(drugs)).map(ci => ci.id);
  console.log('Test 23: Amitriptyline 75mg + Quetiapine 100mg → conditionals');
  console.log(`  ACB: ${calculateACBScore(drugs)}, H1: ${maxH1Occupancy(drugs).toFixed(1)}%, α1: ${maxAlpha1Occupancy(drugs).toFixed(1)}%`);
  console.log(`  Triggered: ${triggered.join(', ')}`);
  assert('ACh triggered', triggered.includes('ACh'), `triggered=${triggered.join(',')}`);
  assert('H1 triggered', triggered.includes('H1'), `triggered=${triggered.join(',')}`);
  console.log('');
}

// === PHASE 8: Active metabolites tests ===
console.log('--- Phase 8: Active Metabolites ---\n');

// Test 24: Sertraline 100mg σ1 with metabolites — should be MORE negative
// than old Test 1 value because desmethylsertraline is also inverse agonist at σ1
{
  const drug = DRUGS_V2['sertraline'];
  const balance = calculateSigma1Balance([{ drug, dose_mg: 100 }]);

  console.log('Test 24: Sertraline 100mg σ1 (with desmethylsertraline metabolite)');
  console.log(`  Value: ${balance.value.toFixed(1)}, Zone: ${balance.zone.id}`);
  console.log(`  Raw net: ${balance.raw_net.toFixed(1)}`);
  // Old value without metabolites was -69.2 (raw_net=-85.1)
  // With metabolite (formation_fraction=0.5, s1 Ki=57 inverse_agonist), should be more negative
  assert('σ1 more negative with metabolite', balance.value < -69.2,
    `value=${balance.value.toFixed(1)} (was -69.2 without metabolite)`);
  console.log('');
}

// Test 25: Quetiapine 100mg NA — should be positive due to norquetiapine NET inhibition
{
  const drug = DRUGS_V2['quetiapine'];
  const balance = calculateNorepinephrineBalance([{ drug, dose_mg: 100 }]);

  console.log('Test 25: Quetiapine 100mg NA (with norquetiapine metabolite)');
  console.log(`  Value: ${balance.value.toFixed(1)}, Zone: ${balance.zone.id}`);
  console.log(`  Breakdown: ri=${balance.breakdown.reuptake_inhibitor.toFixed(1)}`);
  // Quetiapine parent has no NET binding, but norquetiapine has NET Ki=58 (RI)
  assert('NA positive from norquetiapine', balance.value > 0,
    `value=${balance.value.toFixed(1)}`);
  console.log('');
}

// Test 26: Fluoxetine 20mg 5-HT — metabolite should add to SERT effect
{
  const drug = DRUGS_V2['fluoxetine'];
  const balance = calculateSerotoninBalance([{ drug, dose_mg: 20 }]);

  console.log('Test 26: Fluoxetine 20mg 5-HT (with norfluoxetine metabolite)');
  console.log(`  Value: ${balance.value.toFixed(1)}, Zone: ${balance.zone.id}`);
  console.log(`  Breakdown: ri=${balance.breakdown.reuptake_inhibitor.toFixed(1)}, ant=${balance.breakdown.antagonist.toFixed(1)}`);
  // Parent SERT Ki=0.8 + norfluoxetine SERT Ki=20 (formation=0.8) + 5HT2C antagonism
  assert('5-HT positive', balance.value > 10, `value=${balance.value.toFixed(1)}`);
  console.log('');
}

// Summary
console.log('=== Summary ===');
console.log(`Passed: ${passed}/${passed + failed}`);
if (failed > 0) {
  console.log(`FAILED: ${failed} test(s)`);
  process.exit(1);
}
