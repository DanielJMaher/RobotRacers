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
- [ ] Add `climb` and `jump` to the `Stat` union in `types.ts` (**resolved 2026-08-20: these are real new stats, not reflavors of Power/Run** — GDD §3.1). Update `race.ts`'s `LEG_STAT` map with `obstacle→power`, `climb→climb`, `sprint→run`, `jump→jump` as four distinct entries (previously Climb/Jump didn't exist at all).
- [ ] Support 5–8 Legs per Race (up from the current fixed-shape course), with a validation/generation helper that guarantees at least 3 distinct Leg types per course, now drawing from up to 7 types (start/sprint/obstacle/climb/jump/water/air).
- [ ] Author a handful of Climb- and Jump-granting cards (proposed color mapping, GDD §3.2: Climb→Black, Jump→Red — flagged as an interpretation, not locked) so the new stats have at least some card support to test against.
- [ ] Audit `packages/sim/src/cards/data/*.ts` for keywords/effects that only ever fire on now-dead Bout-only triggers (`bout_start`, `round_start`, `on_hit`, `on_dodge`) — GDD §4.2's content follow-up. Decide per-card: reflavor to a Race trigger, or leave dormant with a clear code comment (matching how `custom` ops are already documented) pending a real content pass.

**Done when:** `pnpm build`/`typecheck`/`test` all green with no Bout code remaining; a Race can be configured with 5–8 Legs across at least 3 types including Climb/Jump; the card-data audit is at least logged (even if not every card is fixed yet).

## Phase 3 — Tournament bracket core loop

The bracket itself, with no Environment Interludes or Breeding yet — just prove 24 entrants can play down to a ranked Final Race.

- [ ] New `packages/sim/src/tournament/` module (architecture.md §5.5): bracket state (4 groups of 6 → consolidate → 3 → Final Race), a pure per-race "eliminate last place" step function in the same `(state, ...) → (state', events)` shape as the draft engine's `advanceTick`.
- [ ] The Draft Booster, once per Tournament before Round 1 (**resolved 2026-08-20: it survives, in addition to the Environment Interlude booster** — GDD §4.5, §6.2) — reuse the existing `draft/` module unchanged, just gate it to fire once at Tournament start.
- [ ] Entrant generation **v1** (resolved 2026-08-20: build the cheap version first): the player's Chao plus 23 non-player Chao via a procedural stat/cosmetic roll, no drafting. (v2 — a real mini-draft + new bot-bonding heuristic per entrant — is written up in GDD §6.7 as a deferred upgrade; don't build it yet.)
- [ ] Scouting: `computeScoutingRead(chao)`-style function bucketing any entrant's real stats into a fuzzy 1–5 icon rating per Leg-relevant stat (GDD §6.7, resolved 2026-08-20 — build this alongside v1 entrant generation, not deferred).
- [ ] Confirmed (2026-08-20): only the player's own bracket path is actively simulated with visible events; other groups resolve to a final ranking only, no Event log needed for them (architecture.md §5.5). Full off-path race visibility is a deferred upgrade (GDD §6.7).
- [ ] First/Second Evolution trigger points: decide what bracket-progress milestones (if any) replace the old "Act 1 boss / Act 2 boss" map triggers (GDD §3.4, architecture.md §5.4).
- [ ] Minimal UI: a bracket/standings view, race-by-race progression, elimination messaging, Final Race → 1st/2nd/3rd result screen (no breeding UI yet — just show the placements). Entrant inspection should show the scouting-icon read for any of the 24, not just the player's own Chao.

**Done when:** a playtester can start a Tournament, play through their own group's races across all 3 rounds (with off-path groups resolving silently), reach the Final Race, and see a 1st/2nd/3rd result — entirely without an Environment Interlude or Breeding existing yet.

## Phase 4 — Environment Interludes

- [ ] `Environment` state: separate from the Chao (the direct descendant of the old Garden Board, now scoped to one Chao's support structure) — **resolved 2026-08-20, fully specified**: exactly 3 Habitat Slots, each generating Fruit of its color at Tournament start + after every race (base 2/trigger). See GDD §6.9 for the complete revived economy.
- [ ] New `Seed` card type (GDD §4.2, §6.9): drafted from both the Draft Booster and the Environment Interlude Booster; plants into a filled Habitat Slot, converting 1 unit of its output to the Seed's color. One-time plant, no replanting.
- [ ] Habitat "2-star" combining (GDD §6.9, mirrors Awakening §4.6): 3 same-color Habitat Cards fuse into +1 base Fruit and +1 Seed slot. Needs its own duplicate-detection logic, parallel to (but separate from) Bond Card Awakening.
- [ ] Habitat placement lock-in: after the initial Draft Booster completes, placing a Habitat into one of the 3 slots is **permanent** — growable (combine, seed) but never swappable. Different rule from Bond Slots (which *do* allow overwriting) — don't accidentally reuse the Bond Slot replacement logic here.
- [ ] "Open Fort" mechanic: an unfilled Habitat Slot produces 1 colorless Wildcard Fruit per trigger (half the volume of a filled slot, but spendable as any color) instead of sitting inert.
- [ ] Race reward hooks tied to the economy (GDD §6.9): Fastest-Leg reward (random Fruit, or a chance at a Seed) and back-to-back-last-place reward (a Fruit *and* a Seed) both need the Race resolver to track, per racer, per Leg: who had the best completion, and who's on a last-place streak — this rides on the same full-field-ranking capability Phase 5's scoring formula already needs, just at Leg granularity instead of race granularity.
- [ ] The Environment Interlude Booster: 3 packs of 3 cards each, pick 1 per pack, no passing/bots involved (GDD §4.5, §6.3) — likely doesn't need the existing `draft/` module's pack-passing machinery at all; probably a new, much simpler function. Now also a source of Seed cards, not just the usual card types.
- [ ] Apply-then-train flow: drafted cards get applied to the Environment first, then remaining picks get bonded/consumed onto the Chao, per the GDD's explicit ordering.
- [ ] Wire the two Interlude gates into the Phase 3 bracket state machine: fires after Round 1 and after Round 2, **not** before the Final Race.

**Done when:** both Interludes are playable in sequence within a full Tournament run, Habitat Slots can be filled/combined/seeded, Open Fort is a viable choice, and picks made during Interludes visibly affect the Chao and/or Environment before the next round's races.

## Phase 5 — Breeding & Tournament-to-Tournament progression

- [ ] Breeding eligibility-pool computation (GDD §6.4's tiered exclusion: 1st place excludes only the other 2 finalists, 2nd excludes the Group1234 pool, 3rd excludes Group1234+Group12+Group34) — pure set logic over entrants tagged with "furthest round reached."
- [ ] Breeding resolution — **resolved 2026-08-20, simplified**: `baby.stat = round(0.10 * parentA.stat + 0.10 * parentB.stat)` for every stat, flat and deterministic, no RNG. Baby otherwise starts as a fresh `createChao()`-shaped entity — empty Bond Slots, no Traits/Items, Neutral alignment by construction. Cosmetic/skill inheritance (the "looks like a modified base Chao, specialization creeps in over many Tournaments" idea) is **explicitly deferred** to a future design session — don't build it now, don't guess at it either.
- [ ] Elimination-is-final rule: losing without a breeding pick ends the run (GDD §6.6) — a run-over/score screen.
- [ ] Scoring — **resolved 2026-08-20**: 1st place = 6 points, 1 fewer per place behind (2nd=5 ... 6th=1), summed across every race the player's Chao runs. DNF = last place for that race's field. **Needs full-field ranking in the Race resolver**, not just single-Chao pass/fail — a prerequisite this phase needs anyway for group-stage elimination, now made explicit.
- [ ] Next-Tournament generation — **resolved 2026-08-20, simple**: always exactly 3 lineage babies (one per breeding finalist) + 21 freshly random entrants, every Tournament. No pool, no draw rate, no size/decay to tune — see GDD §6.5's worked example. Local-to-save only (GDD §6.5 — not shared/multiplayer, not soon).
- [ ] Chao data model needs parent-A/parent-B links (a real lineage graph, not just flat stat inheritance) and a persisted per-Chao record (placements, wins) — this is new scope the lineage-inspection feature below depends on.
- [ ] Chao inspection UI (GDD §6.8, new 2026-08-20): Name/Height/Weight/Record on any entrant; a "raced this Chao" indicator (head-to-head history against this exact individual, realistically scoped to within one bracket) and a "raced its predecessors" indicator (history against this entrant's parent(s) from an earlier Tournament) — both clickable into the underlying history; a Lineage tab showing the full ancestry chain with each ancestor's record and Height/Weight. Height/Weight themselves are new cosmetic attributes with only a placeholder generation rule proposed (GDD §6.8) — low priority to tune exactly.

**Done when:** a full tournament-to-tournament loop is playable — win or place well enough to breed, see 3 babies enter a freshly generated next Tournament, or lose without breeding and see a final score screen.

## Phase 6 — Card system follow-through

- [ ] Implement Awakening (GDD §4.6): 3 copies of the same Bond Card fuse into an Awakened version at **3.5×** a single copy's average stat grant. Doesn't exist in code at all yet — this was previously scoped as an "autochess layer" feature and got cut along with the board, but the mechanic itself survives per the GDD rewrite.
- [ ] Implement splash tax (GDD §4.4 — **resolved 2026-08-20**: funded by the revived Fruit economy, GDD §6.9). Only the tax *curve* (flat vs. scaling with distance from identity) is still an open number, folded into the balance pass below.
- [ ] Author Seed cards and any additional Habitat Cards needed for real content coverage (currently only 2 Habitats exist in code — `sunlitMeadow`, `windsweptCliff` — plus 3 more added later for Black/Blue/White; none for the new Seed type at all yet).
- [ ] Finish the Phase 2 card-data audit: reflavor (or formally retire) any remaining Bout-only-triggered keywords.
- [ ] Balance pass: leg-check variance, Awakening power level, breeding formula constants, scoring weights, splash tax curve, **and the whole revived Fruit/Habitat/Seed economy** (base Fruit rates, Seed drop odds, Open Fort viability) — all the placeholder numbers flagged throughout the GDD.
- [ ] Future ideas explicitly deferred, not built now (GDD §6.9): a large-margin-win reward to incentivize mono-color builds; a 2-for-1 trade value for spending Wildcard Fruit on colorless Item Cards; an item/event to re-base a permanently-locked Habitat.

## Phase 7 — Stretch / post-MVP

1. **Entrant generation v2** (GDD §6.7, written up 2026-08-20): each non-player entrant runs its own mini-draft (existing `draft/bots.ts` heuristic) plus a new bot-bonding heuristic that doesn't exist yet (greedily bond highest-`rawPower` card per slot). Upgrade path from Phase 3's v1 procedural roll, once the core loop is proven and playtesting shows the bracket feels hollow.
2. **Full off-path bracket visibility** (GDD §6.7, written up 2026-08-20): let the player actually watch (not just scout) other groups' races, full event-log playback — not just a final ranking. Upgrade path from Phase 3's "own path only" scope.
3. **Multiplayer live co-draft** (architecture.md §9) — network-backed draft seat for the (now-confirmed-surviving) pack-passing Draft Booster.
4. **Async Tournament entrants** (architecture.md §9) — real players' saved Chao lineages filling non-player bracket slots, replacing (or supplementing) procedural generation. A natural extension of entrant generation v2 above.
5. **Cosmetic-only long-term unlock track** (was GDD §7.6's "Difficulty Rank," survives as a stretch idea even though the rest of that section was cut).
6. **Larger card-set expansion** (was Phase 4's target — 180–220 cards recommended, revisit once real repeat-Tournament data exists).
7. **A Kindergarten-style narrative event** — the user likes the idea but confirmed (2026-08-20) it's **unneeded in the design right now**; kept as a TODO to consider later, not an active open question. See the explanation below the open-questions table for what it was and the options for where it could go, whenever it's picked back up.
8. **Rolling lineage from the eliminated/losing pool** (GDD §6.5, written up 2026-08-20): letting Gen 2 through Gen X draw on non-finalist eliminated Chao too, not just the 3 breeding finalists' babies — a genuine "rolling lineage" upgrade over the simple 3-and-21 split. Explicitly deferred by the user, not built now.

## Open design questions

Raised during the 2026-08-20 design discussion, resolved across two sessions the same day. Struck-through rows are resolved, kept for the record; the rest are still open.

| Question | Relevant phase | Notes |
|---|---|---|
| ~~Does the player only actively play races within their own bracket path?~~ | 3 | **Resolved:** yes, for now — other groups resolve via background simulation with a final ranking only, no full Event log. Off-path races get scouting icons (GDD §6.7) instead of full visibility; full visibility is Phase 7's stretch item. |
| ~~Are Climb and Jump new Stats, or reflavors of Power/Run?~~ | 2 | **Resolved:** genuinely new, distinct Stats — not reflavors. Color mapping (Climb→Black, Jump→Red, as secondary stats) is still an interpretation, not locked (GDD §3.2). |
| ~~Does the original 15-card pack-passing Draft Booster format still exist?~~ | 2, 3 | **Resolved:** yes, alongside the Environment Interlude booster — runs once per Tournament, before Round 1. |
| ~~How are the 23 non-player Tournament entrants generated?~~ | 3 | **Resolved:** cheap procedural roll for v1 (build now); a full mini-draft-per-entrant v2 is written up in GDD §6.7 as a deferred upgrade (Phase 7), not built yet. |
| ~~Breeding formula tuning~~ | 5 | **Resolved, simplified:** flat `0.10*parentA + 0.10*parentB` per stat, no RNG (GDD §6.4). Cosmetic/skill inheritance is explicitly **deferred** to a future "Next Up" discussion, not decided and not guessed at. |
| ~~Scoring formula~~ | 5 | **Resolved:** 1st=6 points, 1 fewer per place behind, down to 6th=1; DNF = last place for that race's field. Requires the Race resolver to rank a full field, not just the player's one Chao — see Phase 5. |
| Does Happiness still exist as a tracked value, and if so, for what? | 5 | **Shelved (2026-08-20), not cut** — flagged by the user as "could definitely become an interesting balance mechanic," deliberately parked for a dedicated future design pass rather than decided now or discarded by default. |
| ~~What does a Habitat Card actually do, and what replaces Fruit-funded splash tax?~~ | 4, 6 | **Resolved and substantially expanded (2026-08-20):** Fruit, Habitats, and splash tax are all revived, plus genuinely new mechanics beyond the original design — Seed cards, Habitat "2-star" combining, permanent-placement/growable-not-swappable Habitats, the "Open Fort" empty-slot strategy with Wildcard Fruit, and Fastest-Leg/back-to-back-last-place race rewards. Full spec in GDD §6.9. Only the exact numbers (base rates, tax curve, Seed odds) remain open, folded into Phase 6's balance pass. |
| ~~Past-Tournament-winners pool mechanism~~ | 5 | **Resolved, and simpler than expected:** there's no pool at all — literal lineage Chao (not stat templates), always exactly 3 babies + 21 fresh random per Tournament, local-to-save only. See GDD §6.5's worked example. Pulling from the broader *eliminated* pool for a true rolling lineage is a named Phase 7 stretch item (#8 above), not built now. |
| ~~Kindergarten~~ | 7 | **Resolved:** the user likes the idea but it's confirmed unneeded right now — shelved as a TODO for later, the same treatment as Happiness, not an active question to resolve soon. See the explanation below the table for what it was, kept for whenever this gets picked back up. |

**What Kindergarten actually was, for context:** in the source material, the Kindergarten is a passive training location distinct from active feeding — a schoolhouse where a Chao learns instruments and other lessons, gated by (and raising) its Mind stat. The original pre-pivot GDD turned this into a "?"-style narrative map node with Mind-gated outcomes. That map is gone now, so Kindergarten has no home — three real options, none chosen yet: **(1)** fold an occasional narrative choice into an Environment Interlude alongside the booster draft; **(2)** give it its own new Interlude-adjacent moment; **(3)** cut it entirely, since nothing else in the Tournament structure obviously needs a Mind-gated narrative event to exist. Whichever way this goes, the actual *content* (a real pool of written vignettes) was always deferred content-pass work regardless — "what does Kindergarten do" and "what does Kindergarten say" are two separate open items.
| Does a Kindergarten-style narrative event still have a home (e.g. inside an Environment Interlude), or is it cut along with the map it used to live on? | 7 | Low priority — stretch-scoped either way. |

## Trademark & naming

"Chao," "Chaos Drive," "Chao Garden," and related terms belong to SEGA. This entire doc set uses them because that's the clearest way to specify *what's being cloned* during design — not because they're intended to ship. Before any build leaves personal/prototype use:

- [ ] Rename the creature (currently "Chao") to an original name across code, assets, and docs.
- [ ] Rename "Chaos Drive" → the Regimen Card flavor text/naming already mostly stands on its own (GDD §4.2) and doesn't need "Chaos Drive" as a literal in-game term — audit for stray references.
- [ ] Rename "Chao Garden," "Chao Race," "Jewel Cup" — SEGA-specific proper nouns, even though the *mechanics* they name are being reinterpreted, not copied wholesale. ("Chao Karate" no longer needs renaming — it's removed rather than kept under a new name.)
- [ ] Original visual design for creature bodies/mutations — do not reference or trace SEGA's Chao model/art.
- [ ] Legal review of the final name/branding before any public distribution (storefront listing, trailer, itch.io page, etc.) — this checklist is a starting point, not a substitute for that.
