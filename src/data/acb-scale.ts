/**
 * Anticholinergic Cognitive Burden (ACB) Scale.
 *
 * Based on Boustani et al. 2008 (PMID:18544098) and subsequent updates.
 * Maps drug IDs (matching drugs.v2.ts) to ACB scores:
 *   1 = possible anticholinergic activity
 *   2 = clinically relevant anticholinergic activity
 *   3 = definite anticholinergic activity
 *
 * Only drugs present in our drugs.v2.ts database are included.
 * Source: Boustani M et al. "Impact of anticholinergics on the aging brain:
 * a review and practical application." Aging Health. 2008;4(3):311-320.
 */
export const ACB_SCORES: Record<string, number> = {
  // Score 3 — definite anticholinergic
  amitriptyline: 3,
  nortriptyline: 2,       // moderate — lower than amitriptyline
  desipramine: 2,         // moderate
  protriptyline: 2,       // moderate
  quetiapine: 1,          // low ACB despite sedation

  // Score 1 — possible anticholinergic
  fluoxetine: 1,
  fluvoxamine: 1,
  sertraline: 1,
  escitalopram: 1,
  venlafaxine: 1,
  duloxetine: 1,
  bupropion: 1,
  aripiprazole: 1,
  brexpiprazole: 1,
};
