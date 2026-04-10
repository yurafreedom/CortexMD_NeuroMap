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
} from '../constants/receptor-weights';

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

// Summary
console.log('=== Summary ===');
console.log(`Passed: ${passed}/${passed + failed}`);
if (failed > 0) {
  console.log(`FAILED: ${failed} test(s)`);
  process.exit(1);
}
