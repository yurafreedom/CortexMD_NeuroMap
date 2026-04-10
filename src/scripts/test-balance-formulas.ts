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
  // CRITICAL: must match Test 1 exactly (-69.2)
  const test1Value = -69.2;
  const diff = Math.abs(balance.value - test1Value);
  assert('matches Test 1', diff < 0.1, `value=${balance.value.toFixed(1)} vs test1=${test1Value}`);
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

// Summary
console.log('=== Summary ===');
console.log(`Passed: ${passed}/${passed + failed}`);
if (failed > 0) {
  console.log(`FAILED: ${failed} test(s)`);
  process.exit(1);
}
