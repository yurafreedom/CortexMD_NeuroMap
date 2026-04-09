# CortexMD — Project Instructions for Claude Code

## Project Context

CortexMD is a Next.js + Supabase + Three.js neuropharmacology visualization 
tool for psychiatric medications. Built by a solo founder. Currently in an 
active 6-phase data model migration (drugs v1 → v2 with extended receptor 
profiles, partial agonists, glutamate system, conditional indicators).

The product is positioned as an **educational tool** for understanding 
molecular pharmacology — NOT clinical decision support, NOT AI psychiatrist. 
This positioning has legal and architectural implications throughout the 
codebase.

## Stack

- Next.js 16 (app router, TypeScript strict mode)
- Supabase (PostgreSQL + auth + Row Level Security)
- Three.js for 3D brain visualization
- Vercel for deployment
- iron-session for admin authentication
- Claude API for AI chat features

## Working Style

Solo founder works in verified sprints. Expects:
- Direct communication, no hedging
- Concrete numbers and verification, not "should work"
- Honest acknowledgment of mistakes and uncertainty
- Phase-by-phase progress with explicit checkpoints

Has been burned multiple times by AI coding tools claiming "build successful" 
or "file created" without actual verification. Never make those claims 
without proof.

---

## CRITICAL RULES — These are non-negotiable

### Verification of file operations

1. **NEVER claim "file created" without verification.** After creating any 
   file, run `ls -la <path>` AND `cat <path>` (or `head -50` for long files) 
   and show output. "I created the file" without ls+cat is unacceptable.

2. **After creating API routes**, run `find src -name "route.ts" | grep <route_name>` 
   to verify the file is in the correct location and Next.js will discover it.

3. **After multi-file operations**, run `find` over the affected directory 
   and list every file you claim to have created. If a file is missing from 
   the find output, say so explicitly.

### Verification of data operations

4. **After any data migration or modification**, run `cat` on each modified 
   record (or `grep -A N` for the relevant section) and show output BEFORE 
   committing. Never commit data changes blind.

5. **NEVER "correct" scientific values on your own interpretation.** This 
   includes Ki values, EC50, IC50, doses, bioavailability, half-lives, 
   receptor affinities, or any pharmacological constant. If a value looks 
   strange or wrong — STOP and ask. Do not silently change it. Do not 
   "fix" it based on what you think it should be.

6. **NEVER invent or fabricate source citations.** If you don't have a 
   verified PMID or DOI, write `"source": "needs verification"` instead 
   of constructing a plausible-looking citation. Fake sources destroy 
   scientific integrity and create compliance liability for the project.

### Decision making

7. **If you encounter ambiguity or two valid interpretations of an 
   instruction — STOP and ask.** Do not guess. Do not pick the one that 
   seems easier. Ask which interpretation is correct.

8. **After each phase of multi-phase work — STOP and wait for explicit 
   "продолжай" or "continue".** Do not proceed to the next phase 
   automatically, even if the current phase looks complete to you.

9. **Never auto-recover from errors with assumptions.** If a build fails, 
   a test fails, or a file is unexpectedly different — report it and ask, 
   don't try to silently fix it.

---

## Honest Behavior is Rewarded

The most valuable thing you can do is tell the truth about uncertainty.

- "I'm not sure if this is the right approach" → leads to clarification
- "I think I might have made an error in step 3" → leads to fast fix
- "These source citations I cannot verify" → leads to clean data
- "The build claims success but I haven't tested the actual route" → 
  leads to real verification

Honest acknowledgment leads to faster progress. Hidden errors compound 
into weeks of debugging later.

The opposite — claiming success without verification, fabricating data 
to "complete" a task, silently changing values to make tests pass — these 
are fatal violations of trust on this project. They have happened before. 
They must not happen again.

---

## Specific Rules for CortexMD Data Files

### `src/data/drugs.v2.ts` and pharmacology data

- Every Ki value MUST come from a real published source or be marked as 
  "needs verification"
- Receptor types (`agonist`, `inverse_agonist`, `antagonist`, 
  `partial_agonist`, `reuptake_inhibitor`) are clinically critical — 
  sertraline σ1 is `inverse_agonist` not `agonist`, this distinction 
  matters for the entire cascade logic
- Partial agonists must include `intrinsic_efficacy` field (0-1)
- When in doubt about pharmacological classification, ask the user

### `src/lib/indicators/` and formula files

- The unified balance formula is `100 * tanh(net / 100)` where 
  `net = ag + 0.5*partial - inv - 0.5*ant + ri`
- σ1 logic must be consistent between BottomBar and CascadeOverlay 
  (single source of truth)
- Five indicator zones: critical_low, low, neutral, mild_high, therapeutic

### Migrations and Supabase

- Never run migrations without showing them first
- All new tables need RLS policies
- User data tables must have `user_id UUID REFERENCES auth.users(id)`

---

## Phase Workflow Protocol

When given a multi-phase task:

1. Read the full phase specification before starting
2. Execute Phase N completely
3. Run `npm run build` and `npm run typecheck` — both must pass
4. Verify all files created/modified with `find` + `ls` + selective `cat`
5. Commit with descriptive message including phase number
6. Write a summary of what was done, what was verified, and what is 
   uncertain or needs review
7. **STOP** and wait for explicit "продолжай"
8. Do NOT start Phase N+1 until told to

If anything in Phase N is uncertain, ambiguous, or hit a blocker — 
report it and ask BEFORE committing, not after.

---

## When You Make a Mistake

This will happen. The protocol is:

1. Acknowledge clearly what went wrong
2. Show exactly what was affected
3. Propose a specific fix
4. Wait for approval before applying
5. Do not apologize repeatedly — once is enough, then focus on the fix

Defensive justification, hedging, or trying to minimize the error wastes 
time. Direct acknowledgment + concrete fix proposal is what works.
