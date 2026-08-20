# Roadmap

> **Revision note (2026-08-20):** The GDD dropped Karate Bout and the multi-Chao autochess board in favor of a single-Chao 24-entrant Tournament bracket, with Breeding now a core mechanic. Phases 0 and 1 below are historical fact (already built, still valid) and untouched. Everything from Phase 2 onward is **rewritten** to match the new direction — the old Phase 2 ("run structure": node map), Phase 3 ("autochess layer": board/Fruit/Species-Tag breakpoints), and part of Phase 5 (breeding as a stretch item) no longer describe where this project is going. See [`game-design-document.md`](../01-design/game-design-document.md)'s own revision note for the full design rationale.

## Sequencing principle

The original risk still applies in spirit, just aimed at a different stack of layers: Race mechanics, the Tournament bracket, Environment Interludes, and Breeding are each their own system, and stacking all of them before any is played risks the same "overwhelming, can't tell what's working" failure mode the original sequencing principle was written to avoid. So the build order below is still **layered, not featured-complete-per-system**: get the bracket working end-to-end with no Environment/Breeding first, then add Environment, then add Breeding — each playable and evaluable before the next layer stacks on.

## Phase 0 — Foundation *(historical, complete)*

Not a playable milestone; sets up the structure everything else builds on.

- [x] Monorepo scaffold (`packages/sim`, `packages/app`) per [`architecture.md`](../02-technical/architecture.md#4-module-boundaries). pnpm + Turborepo, matching `GMSim`'s conventions (strict `tsconfig.base.json`, Prettier, vitest).
- [x] Seeded RNG implementation (`sim/rng`), zero other randomness sources anywhere in `sim`. Mulberry32, `createRng`/`rollInRange`/`pickRandom`, unit-tested for determinism and range bounds.
- [x] Core types from [`data-schemas.md`](../02-technical/data-schemas.md) implemented as actual TS (`packages/sim/src/types.ts`) — including a `BondedCard`/`RolledStatGrant` refinement and a `custom` `EffectOp` escape hatch discovered during implementation and folded back into that doc.
- [x] ~30-card slice of the example set ([`card-set-list.md`](../01-design/card-set-list.md)) authored as real data — all 14 Green + all 14 Red cards, plus 4 colorless Items and 2 Habitats (34 cards total), in `packages/sim/src/cards/data/`.
- [x] Bonding rules engine (`packages/sim/src/chao/`): `createChao`, `bondCard` (slot occupancy + replacement + grade rolls), `consumeRegimen`, `recomputeDerived` (color identity, alignment, species tag counts), `computeSplashTax` — 17 passing unit tests in `bonding.test.ts` and `rng/index.test.ts`.

**Done when:** ✅ Met — `sim` package builds, has the type surface, and unit tests construct a `Chao`, bond a `BondCard` to it, and assert the resulting stat/slot/tag state.

## Phase 1 — Vertical slice: one Chao, one draft, one event *(historical, complete)*

- [x] Draft engine: pack generation, bot-drafting scoring heuristic, tick-by-tick pass-and-pick state machine covering 3 rounds (`packages/sim/src/draft/`). 26 tests.
- [x] Bonding UI: apply a drafted card to a single Chao's slot, see the stat/body change live (`GardenScreen.tsx`).
- [x] Race Leg resolver + Karate Bout resolver, sharing a trigger-matching/effect-execution core (`packages/sim/src/events/`). 23 tests. **The Bout resolver here is now legacy** per the 2026-08-20 pivot — see Phase 2 below.
- [x] Event-log playback UI, with a compile-time exhaustiveness guard on `SimEvent` narration.
- [x] Minimal Garden Board view, folded into `GardenScreen.tsx`.

**Done when:** ✅ Met — full build/typecheck/test green (62 sim tests), verified end-to-end with a real Playwright browser pass through all 45 draft picks + bonding + both event types.

**Card set expansion *(historical, complete, done ahead of schedule)*:** all 5 stat colors implemented as real card data (85 cards total, matching `card-set-list.md` in full except the deliberately-deferred modal Twin Garden Spring card), guarded by a `coreGardenSet.test.ts` structural-invariant suite. 68 sim tests passing as of this milestone. See git history for the two real bugs found and fixed along the way (Race resolver's shortcut-fork stat check; the "Graze" keyword's permanent-vs-regen mixup) and the CardBadge negative-number display bug found during a visual check.

---

**Everything below this line was rewritten 2026-08-20 to match the Tournament-bracket pivot.**

## Phase 2 — Remove Bout, expand Race Legs

Cleanup + the one Race-side mechanical change the new design needs before a bracket can be built on top of it.

- [ ] Remove `packages/sim/src/events/bout.ts`, `bout.test.ts`, `packages/app/src/game/rival.ts`, and the "Run a Karate Bout" UI button/handler. Remove the now-meaningless `'bout'` value from `TechniqueCard.scope` (or collapse the field entirely if every Technique is Race-scoped now — worth a final check once the removal is done).
- [ ] Expand `race.ts`'s Leg vocabulary to include Climb and Jump (GDD §5.1 — resolve the open question on whether they're new stats or reflavors of Power/Run before implementing; default proposal is reflavors, see roadmap's open-questions table below).
- [ ] Support 5–8 Legs per Race (up from the current fixed-shape course), with a validation/generation helper that guarantees at least 3 distinct Leg types per course.
- [ ] Audit `packages/sim/src/cards/data/*.ts` for keywords/effects that only ever fire on now-dead Bout-only triggers (`bout_start`, `round_start`, `on_hit`, `on_dodge`) — GDD §4.2's content follow-up. Decide per-card: reflavor to a Race trigger, or leave dormant with a clear code comment (matching how `custom` ops are already documented) pending a real content pass.

**Done when:** `pnpm build`/`typecheck`/`test` all green with no Bout code remaining; a Race can be configured with 5–8 Legs across at least 3 types including Climb/Jump; the card-data audit is at least logged (even if not every card is fixed yet).

## Phase 3 — Tournament bracket core loop

The bracket itself, with no Environment Interludes or Breeding yet — just prove 24 entrants can play down to a ranked Final Race.

- [ ] New `packages/sim/src/tournament/` module (architecture.md §5.5): bracket state (4 groups of 6 → consolidate → 3 → Final Race), a pure per-race "eliminate last place" step function in the same `(state, ...) → (state', events)` shape as the draft engine's `advanceTick`.
- [ ] Entrant generation: the player's Chao plus 23 non-player Chao. Start with the cheap procedural stat/cosmetic roll (architecture.md §2's recommendation), not a full mini-draft per bot — revisit only if playtesting shows the bracket feels hollow (GDD §8's risk note).
- [ ] Resolve the "does the player only actively play their own bracket path" open question (see below) and implement accordingly — likely: the player's group's races are played interactively, other groups' races resolve instantly in the background to produce next-round entrants.
- [ ] First/Second Evolution trigger points: decide what bracket-progress milestones (if any) replace the old "Act 1 boss / Act 2 boss" map triggers (GDD §3.4, architecture.md §5.4).
- [ ] Minimal UI: a bracket/standings view, race-by-race progression, elimination messaging, Final Race → 1st/2nd/3rd result screen (no breeding UI yet — just show the placements).

**Done when:** a playtester can start a Tournament, play through their own group's races across all 3 rounds (with off-path groups resolving silently), reach the Final Race, and see a 1st/2nd/3rd result — entirely without an Environment Interlude or Breeding existing yet.

## Phase 4 — Environment Interludes

- [ ] `Environment` state: separate from the Chao (the direct descendant of the old Garden Board, now scoped to one Chao's support structure), holding Habitat Cards. Resolve what a Habitat Card actually *does* now that Fruit income is gone (open question below) before implementing its effect.
- [ ] The Environment Interlude Booster: 3 packs of 3 cards each, pick 1 per pack, no passing/bots involved (GDD §4.5, §6.3) — likely doesn't need the existing `draft/` module's pack-passing machinery at all; probably a new, much simpler function.
- [ ] Apply-then-train flow: drafted cards get applied to the Environment first, then remaining picks get bonded/consumed onto the Chao, per the GDD's explicit ordering.
- [ ] Wire the two Interlude gates into the Phase 3 bracket state machine: fires after Round 1 and after Round 2, **not** before the Final Race.

**Done when:** both Interludes are playable in sequence within a full Tournament run, and picks made during them visibly affect the Chao and/or Environment before the next round's races.

## Phase 5 — Breeding & Tournament-to-Tournament progression

- [ ] Breeding eligibility-pool computation (GDD §6.4's tiered exclusion: 1st place excludes only the other 2 finalists, 2nd excludes the Group1234 pool, 3rd excludes Group1234+Group12+Group34) — pure set logic over entrants tagged with "furthest round reached."
- [ ] Breeding resolution: implement the proposed stat-blend/strength-factor algorithm and the proposed cosmetic-inheritance (partial-slot-inheritance) algorithm from GDD §6.4 as a first pass, clearly labeled as unbalanced/untuned pending playtesting.
- [ ] Elimination-is-final rule: losing without a breeding pick ends the run (GDD §6.6) — a run-over/score screen.
- [ ] Scoring: implement *some* placement-based point formula (exact numbers are an open question below — ship a simple version, e.g. flat points per race placement summed across the run, and revisit).
- [ ] Next-Tournament generation: 3 babies fill 3 of 24 slots; the other 21 are freshly generated, with the past-Tournament-winners-pool seeding mechanism (GDD §6.5) resolved at whatever level of fidelity is feasible for a first pass (even a flat "X% chance an entrant is drawn from a small in-memory pool of past winners" is a reasonable v1).
- [ ] Chao inspection UI: view stats and current visual/cosmetic state at any time.

**Done when:** a full tournament-to-tournament loop is playable — win or place well enough to breed, see 3 babies enter a freshly generated next Tournament, or lose without breeding and see a final score screen.

## Phase 6 — Card system follow-through

- [ ] Implement Awakening (GDD §4.6): 3 copies of the same Bond Card fuse into an Awakened version at **3.5×** a single copy's average stat grant. Doesn't exist in code at all yet — this was previously scoped as an "autochess layer" feature and got cut along with the board, but the mechanic itself survives per the GDD rewrite.
- [ ] Resolve and implement whatever replaces Fruit-funded splash tax for color-identity cost (GDD §4.4's open question) — a new currency, a hard restriction, or cut entirely.
- [ ] Finish the Phase 2 card-data audit: reflavor (or formally retire) any remaining Bout-only-triggered keywords.
- [ ] Balance pass: leg-check variance, Awakening power level, breeding formula constants, scoring weights — all the placeholder numbers flagged throughout the GDD.

## Phase 7 — Stretch / post-MVP

1. **Multiplayer live co-draft** (architecture.md §9) — network-backed draft seat, if the pack-passing Draft Booster format survives the open question below.
2. **Async Tournament entrants** (architecture.md §9) — real players' saved Chao lineages filling non-player bracket slots, replacing (or supplementing) procedural generation.
3. **Cosmetic-only long-term unlock track** (was GDD §7.6's "Difficulty Rank," survives as a stretch idea even though the rest of that section was cut).
4. **Larger card-set expansion** (was Phase 4's target — 180–220 cards recommended, revisit once real repeat-Tournament data exists).
5. **A Kindergarten-style narrative event**, if one still has a home anywhere in the new structure (e.g. inside an Environment Interlude) — open question below; may simply be cut along with the map it used to live on.

## Open design questions

Raised during the 2026-08-20 design discussion, not yet resolved. Roughly ordered by how soon they'll block implementation:

| Question | Relevant phase | Notes |
|---|---|---|
| Does the player only actively play races within their own bracket path, with other groups resolved via background simulation? | 3 | Assumed yes in this doc (it's the only practical way to avoid making the player watch/click through 22 races per Tournament) — not yet confirmed. |
| Are Climb and Jump new Stats, or reflavors of the existing Power/Run checks under new names? | 2 | GDD §5.1 proposes reflavoring (Climb→Power, Jump→Run) rather than growing the Stat union — pending confirmation. |
| Does the original 15-card pack-passing Draft Booster format still exist anywhere, or is the Environment Interlude's 3-packs-of-3 the *only* card acquisition now? | 2, 4 | The Tournament spec as given never mentions the big draft format at all — worth confirming explicitly rather than assuming it quietly survives. |
| How are the 23 non-player Tournament entrants generated — a full mini-draft/bonding pass each (textured, expensive), or a cheap procedural stat-and-cosmetic roll (fast, flatter)? | 3 | GDD §8 flags the risk of a hollow-feeling bracket if entrants are just numbers; architecture.md §2 recommends starting cheap. |
| What does a Habitat Card actually do now that Fruit income (its original effect) is gone? | 4 | Needs a decision before the Environment's mechanical identity means anything beyond "a place cards go." |
| What replaces Fruit-funded splash tax for color-identity cost — a new currency, a hard restriction, something Environment-granted, or is it cut entirely? | 6 | Currently color identity has zero cost, which may make color commitment meaningless (GDD §8's risk note). |
| Does Happiness still exist as a tracked value, and if so, for what? | 5 | Its only original purpose (gating the reincarnation cocoon) is gone; could be repurposed or cut. |
| Breeding formula tuning: the per-stat blend-weight range (proposed 0.3–0.7), the per-baby strength factor range (proposed 10–20%), and whether alignment/Traits partially inherit at all. | 5 | GDD §6.4 has a concrete first-draft proposal — flagged as unplaytested, not a locked design. |
| Cosmetic-inheritance curve: the proposed `inheritedSlotCount = min(4, floor(tournamentNumber / 3))` placeholder — is this the right shape/pace for "specialization creeps in gradually"? | 5 | Purely illustrative in the GDD; needs real tuning once there's something to play. |
| Past-Tournament-winners pool mechanism: how large, how it refreshes, local-to-one-save vs. shared/global, what fraction of the 21 non-baby entrant slots draw from it. | 5 | GDD §6.5 names the *intent* (preserve/escalate difficulty) without a mechanism. |
| Scoring formula: exactly what earns points per race placement, and how they sum across a whole Tournament run. | 5 | "Just give points for how they finish in each race," per the original spec — no formula chosen yet. |
| Does Awakening (GDD §4.6) realistically come up under the much smaller Environment Interlude booster (3 cards per Interlude, 2 Interludes per Tournament = 6 cards total from that source) if the big pack-passing draft doesn't survive? | 2, 4, 6 | Getting 3 copies of the same card is far likelier from a 45-card draft than a 6-card trickle — depends heavily on the "does the big draft format survive" question above. |
| Does a Kindergarten-style narrative event still have a home (e.g. inside an Environment Interlude), or is it cut along with the map it used to live on? | 7 | Low priority — stretch-scoped either way. |

## Trademark & naming

"Chao," "Chaos Drive," "Chao Garden," and related terms belong to SEGA. This entire doc set uses them because that's the clearest way to specify *what's being cloned* during design — not because they're intended to ship. Before any build leaves personal/prototype use:

- [ ] Rename the creature (currently "Chao") to an original name across code, assets, and docs.
- [ ] Rename "Chaos Drive" → the Regimen Card flavor text/naming already mostly stands on its own (GDD §4.2) and doesn't need "Chaos Drive" as a literal in-game term — audit for stray references.
- [ ] Rename "Chao Garden," "Chao Race," "Jewel Cup" — SEGA-specific proper nouns, even though the *mechanics* they name are being reinterpreted, not copied wholesale. ("Chao Karate" no longer needs renaming — it's removed rather than kept under a new name.)
- [ ] Original visual design for creature bodies/mutations — do not reference or trace SEGA's Chao model/art.
- [ ] Legal review of the final name/branding before any public distribution (storefront listing, trailer, itch.io page, etc.) — this checklist is a starting point, not a substitute for that.
