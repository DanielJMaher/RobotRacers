# Technical Architecture

*Companion to [`game-design-document.md`](../01-design/game-design-document.md). This doc covers stack, module boundaries, simulation strategy, persistence, and the multiplayer/async model. Concrete type definitions live in [`data-schemas.md`](data-schemas.md).*

> **Revision note (2026-08-20):** The GDD dropped Karate Bout and the multi-Chao autochess board (Fruit economy, Species Tag breakpoints, board leveling) in favor of a single Chao competing in a 24-entrant Tournament bracket, with Breeding now core. This doc is updated to match. `packages/sim/src/events/bout.ts` and its test file still exist in the codebase as of this revision — they're legacy, not yet removed; see [`roadmap.md`](../03-roadmap/roadmap.md) for the cleanup task. `data-schemas.md`'s `Generation`/board-shaped types are similarly not yet updated — several pieces of the new Tournament's exact state shape are still open design questions (GDD §6.5, §7), so writing concrete TypeScript for them now would be premature.

## 1. Constraints the architecture has to satisfy

Pulled directly from the GDD, because they drive real technical decisions, not just design ones:

- **Pillar #1 ("you coach, don't pilot")** means Race resolution is a deterministic-given-inputs simulation, not a real-time game loop with player input mid-event. That's a huge simplification: no netcode-sensitive real-time state, no client-side prediction needed for the core loop.
- **Legibility** (GDD §8) means the simulation needs to produce a **replayable, steppable log**, not just a final result — the UI has to be able to play back "Chao clears the sprint leg... Chao fumbles the water leg..." as a readable sequence. This matters even more now that a Race directly determines elimination (GDD §5.1) — losing needs to feel *explained*, not arbitrary.
- **Bot drafting** (GDD §4.5) needs to run for every AI seat wherever the pack-passing Draft Booster format is actually used (still an open question per the GDD, §4.3) — it has to be fast and side-effect-free enough to run many times in tests without a UI.
- **The Tournament bracket** (GDD §6) needs 23 non-player entrants generated per Tournament, most of them never directly played by the user (GDD §6.2's assumption: only the player's own bracket path is actively simulated/watched) — so entrant generation and off-path race resolution both need to be cheap to run many times without a UI, same requirement as bot drafting.
- **Multiplayer is explicitly post-MVP** (GDD §7) but the core simulation should be written so that swapping "bot decides" for "network message decides" at the draft-pick boundary, and swapping "procedurally generated entrant" for "another real player's saved Chao," don't require rearchitecting.

## 2. Recommended stack

Your other web-facing projects (`neumann-bridge`, `neumann-web-cockpit`) are TypeScript + Vite + Node, so this recommendation follows that lane rather than pulling in an unfamiliar engine (Unity/Godot) for what is, mechanically, a card-and-menu game with light 2D presentation — not a game that needs a 3D engine's physics/rendering pipeline. Unchanged by the 2026-08-20 revision.

| Layer | Recommendation | Why |
|---|---|---|
| **Simulation core** | Pure TypeScript, zero DOM/rendering dependencies, published as its own internal package (`@chao-draft/sim`) | Per §1, this is the part that most needs to be deterministic, unit-testable, and reusable headlessly (bot drafting, entrant generation, off-path race simulation, automated playtests, a future server-authoritative multiplayer mode all just call this package). Keeping it framework-free is the single most important structural decision in this doc. |
| **Rendering / UI** | React + Vite, plain DOM/React for draft screens, the Environment screen, and the Tournament bracket view; a canvas layer is optional, not required | The bracket view is fundamentally a tree/list layout, not a physics scene — no canvas is strictly needed for it, unlike the original design's "Garden Board" (idle creatures wandering) which no longer exists as a screen concept. |
| **State management** | A single typed store (Zustand or Redux Toolkit) that wraps the sim core's state, not a second parallel state model | Avoids the classic "UI state and sim state drift apart" bug class. The store should hold exactly one `GameState` object shaped by the sim core; the UI reads/renders it and dispatches sim actions, it never mutates sim state directly. |
| **Persistence** | Local: serialize `GameState` to JSON in `localStorage`/IndexedDB (browser) or a flat file (if packaged as a desktop app via Tauri). Optional cloud save: a thin REST layer once accounts exist. | The whole `GameState` is already a plain serializable object if the sim core is written without classes-with-methods (prefer plain data + pure functions) — see §5. |
| **Server (post-MVP, for multiplayer draft/async entrants)** | Node + the same `@chao-draft/sim` package, run server-side for the parts that need to be authoritative (draft pack contents, a shared pool of past-Tournament-winner data for entrant seeding) | Reusing the sim package server-side is only possible if it's kept framework-free per the row above — this is the payoff for that constraint. |
| **Bot drafting / entrant AI** | Plain TS, no ML — weighted scoring functions (see §6) | The design doesn't need anything fancier; a scoring heuristic per bot personality is enough to produce believable signal-reading behavior, and it's fully deterministic and testable. The same style of cheap heuristic is the likely starting point for non-player Tournament entrant generation (GDD's open question, §8) rather than giving all 23 entrants a full simulated draft. |

**Alternative considered:** Godot 4 was considered as a more "real game engine" option; still not recommended for the same reasons as before — nothing in the (now Race-only) GDD needs a physics engine, and it doesn't match your existing tooling.

## 3. High-level architecture

```
┌─────────────────────────────────────────────────────────────┐
│  UI layer (React)                                            │
│  Screens: Tournament Bracket · Draft Booster · Environment · │
│  Race replay                                                  │
│  ─ reads GameState from the store, dispatches Actions ─      │
└───────────────────────────┬───────────────────────────────────┘
                             │ Actions (PickCard, BondCard, LoadTechnique,
                             │ AdvanceRound, ResolveRace, ChooseBreedingPartner, ...)
┌───────────────────────────▼───────────────────────────────────┐
│  @chao-draft/sim  (pure TS, no DOM)                           │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────────┐ │
│  │ Draft      │ │ Bonding /  │ │ Race       │ │ Tournament     │ │
│  │ engine     │ │ card rules │ │ resolver   │ │ bracket state  │ │
│  │ (§6)       │ │ engine     │ │ (§5.2)     │ │ machine +      │ │
│  │            │ │            │ │            │ │ breeding (§5.5)│ │
│  └───────────┘ └───────────┘ └───────────┘ └───────────────┘ │
│  Seeded RNG (single source, see §5.1) threaded through all of it │
└───────────────────────────┬───────────────────────────────────┘
                             │ serializes to
┌───────────────────────────▼───────────────────────────────────┐
│  Persistence: GameState → JSON → localStorage / file / (later) │
│  server                                                        │
└─────────────────────────────────────────────────────────────┘
```

The **Karate Bout resolver box from the original diagram is removed.** `bout.ts` still exists in the codebase but isn't part of the intended architecture going forward — see the revision note at the top of this doc.

## 4. Module boundaries

Package layout, assuming an npm workspace/monorepo (Turborepo, matching the pattern already used in `GMSim`):

```
chao-clone/
  packages/
    sim/                  # @chao-draft/sim — pure TS, no deps on React/DOM
      src/
        cards/            # card definitions, data-driven from card-set-list.md content
        chao/              # Chao entity, stats, evolution, bonding rules
        draft/             # booster generation, bot drafting (§6) — the pack-passing
                            # Draft Booster format; the Environment Interlude's smaller
                            # 3-packs-of-3 booster (GDD §6.3) is simple enough it may not
                            # need this module at all — open question, roadmap.md
        events/            # Race leg resolver. bout.ts (Karate Bout resolver) is legacy
                            # — retained for now, slated for removal (roadmap.md)
        tournament/         # NEW — bracket state machine (24→12→6→3→ranked), group
                            # consolidation, Environment Interlude gating, breeding
                            # eligibility-pool computation, entrant generation. Replaces
                            # the old `run/` module (node graph, Generation, reincarnation)
        rng/               # seeded RNG (single implementation, no Math.random() elsewhere)
        state/             # GameState shape + reducers/actions
      test/                # unit + property tests (§7)
    app/                   # React + Vite front end
      src/
        screens/           # Tournament Bracket, Draft Booster, Environment, Race replay
        components/
        store/             # thin wrapper around @chao-draft/sim's reducers
  docs/                    # this doc set
```

**Hard rule, unchanged:** nothing in `packages/sim` imports from `packages/app`, and nothing in `packages/sim` calls `Math.random()`, `Date.now()`, or touches the DOM. This is what keeps the simulation replayable, server-portable, and testable without a browser.

## 5. Simulation strategy

### 5.1 Determinism & the replay log

Unchanged from the original design: a single seeded PRNG (mulberry32, already implemented in `packages/sim/src/rng/`) is threaded through every function that needs randomness — pack contents, grade rolls, leg-check variance, breeding-stat rolls. Every roll is logged as a discrete **Event** rather than silently mutating state, so the UI can play back a Race (or, now, a whole Tournament round) as a readable sequence. This matters more than it did originally, since a Race now directly determines elimination (GDD §5.1) — the player needs to see *why* they lost, not just that they did.

### 5.2 Race Leg resolver

Implements GDD §5.1 as a pure function per Leg: `resolveLeg(chao, leg, loadedTechniques, rng) → LegResult`. A full Race is a fold over its Legs (now 5–8 of them, at least 3 distinct types per GDD §5.1), threading Stamina depletion and DNF state through, with loaded Technique triggers checked against each Leg's Event stream. Already implemented in `packages/sim/src/events/race.ts` for the original 4-leg-type version — extending it to the new leg vocabulary and 5–8-leg course lengths is Phase-level work, not yet done. **Resolved 2026-08-20:** Climb and Jump are confirmed as genuinely new `Stat` union members (not reflavors of Power/Run), which means `LEG_STAT`'s type in `race.ts` needs two new entries and `types.ts`'s `Stat` union needs two new literals — a small, mechanical schema change once this phase starts.

### 5.3 Karate Bout resolver — REMOVED from the design, legacy in code

The original design's `resolveRound(attacker, defender, rng) → RoundResult` Bout resolver (`packages/sim/src/events/bout.ts`) is cut per the GDD's 2026-08-20 revision. It still exists in the codebase and its tests still pass, but nothing in the current design calls for it. Left in place for now rather than deleted mid-discussion — see roadmap.md for the removal task once the pivot is fully settled.

The **shared trigger-matching/effect-execution core** it introduced (`collectTriggerables`/`applyEffectOps`/`fireTriggers` in `packages/sim/src/events/shared.ts`) is *not* Bout-specific — Traits, Bond Card keywords, and Techniques all share this mechanism regardless of which resolver checks their triggers, and the Race resolver already uses it. That part of the architecture survives the cut unchanged.

### 5.4 Bonding & evolution rules engine

A pure rules module that, given a Chao and a card, returns whether the bond is legal — **implemented 2026-08-20 (roadmap.md Phase 4)**: `tournament/environment.ts`'s `bondCardWithSplashTax()` checks the Environment's pooled Fruit balance against `computeSplashTax()`'s off-color cost and blocks the bond outright if short, rather than the tax being merely computed and never enforced (its Phase 0-3 status) — and what state changes it produces (stat roll within the card's grade range, slot occupancy, recomputed color identity → recomputed alignment per GDD §3.3). Evolution checks (GDD §3.4) run as a side-effect-free predicate evaluated at specific bracket-progress points — **implemented 2026-08-20 (roadmap.md Phase 3)**: First Evolution fires when the player's group first shrinks to 3 (end of Round 1), Second when it does again (end of Round 2) — the same milestones the two (not-yet-built) Environment Interludes will use. `applyFirstEvolution`/`applySecondEvolution` in `tournament/bracket.ts` set `Chao.evolutionStage` and freeze `evolvedAlignment`/`evolvedColor` at that moment; the "small passive" GDD §3.4 mentions is still an open TODO, not implemented.

### 5.5 Tournament bracket state machine — implemented 2026-08-20 (roadmap.md Phase 3)

Replaces the original design's map/node-graph state machine entirely. Lives in `packages/sim/src/tournament/`, split across `entrants.ts`, `fieldRace.ts`, and `bracket.ts`:

- **Bracket structure**: 4 groups of 6 → 2 groups of 6 (after consolidation) → 1 group of 6 → 3 ranked finalists, matching GDD §6.2's diagram. `advancePlayerGroupRace` is the per-race-and-eliminate step function, in the same shape as the draft engine's `advanceTick` (state in, state + events out); `runFinalRace` handles the terminal 10-Leg race. **A key implementation decision the original write-up didn't anticipate**: every bracket branch that never touches the player's own choices — the group paired with theirs for Round 2, and the entire opposite side of the bracket all the way to its own Round-2 finish — is resolved silently and eagerly at `createTournament()` time via `resolveGroupToTopThree`, rather than lazily whenever the player's path happens to reach that consolidation point. Since none of that resolution depends on player input, doing it eagerly is simpler than threading "has this off-path branch been resolved yet" through the state machine.
- **Multi-entrant race ranking** (a new technical question the original write-up didn't have, since the Race Leg resolver only ever tracked one Chao): `runFieldRace` in `fieldRace.ts` runs every entrant through the *same* generated course independently (races are parallel time-trials, not head-to-head, consistent with GDD §5.1) and ranks by `legsCompleted`, then remaining Stamina, then a seeded coin-flip. Decided 2026-08-20; richer signals for a future race-*animation* pass are a tracked TODO.
- **Draft Booster, once per Tournament**: runs before Round 1, reusing the existing `draft/` module unchanged — the player's seat plus bot seats, exactly like the original vertical slice, just gated to fire once at Tournament start before `createTournament()` takes over.
- **Entrant generation v1**: `generateEntrant` in `entrants.ts` — a cheap procedural stat roll, no drafting involved. v2 (each entrant running its own bot-drafted mini-pool, needing a new bot-bonding heuristic that still doesn't exist) remains deferred, per GDD §6.7.
- **Scouting**: `computeScoutingRead(chao) → Partial<Record<Stat, 1|2|3|4|5>>` in `entrants.ts` — buckets the 7 Leg-relevant stats into a fuzzy icon rating via simple fixed thresholds (explicitly not tuned, GDD §6.7's own framing), so any of the 24 entrants can be inspected without exposing exact numbers.
- **Environment Interlude gating — implemented 2026-08-20 (roadmap.md Phase 4)**: `bracket.ts` itself is unchanged (its `roundJustCompleted` signal already existed for the Evolution triggers above); the app layer (`useGame.ts`) is what actually pauses on that signal and switches to an `'interlude'` phase before letting the player continue to the next round's races. See §5.6 below for the full Environment/Interlude implementation.
- **Breeding eligibility-pool computation / resolution — implemented 2026-08-20 (roadmap.md Phase 5)**: `TournamentEntrantMeta.eliminatedInRound`/`finalPlacement`/`originGroup`, tracked since this section was first written specifically for this purpose, turned out sufficient — no new data-model work was needed after all. See §5.7 below.

Note that only the player's own bracket path is *resolved with visible events* (GDD §6.2, §6.7); off-path groups only produce a final ranking per race, not a full playable Event log, which keeps their simulation cost trivial even though 22 of 24 entrants' races are never directly watched.

### 5.6 The Environment: Habitats, Fruit, Seeds, and the Interlude Booster — implemented 2026-08-20 (roadmap.md Phase 4)

Lives in `packages/sim/src/tournament/environment.ts` and `interlude.ts`, per GDD §6.9:

- **`Environment` state**: exactly 3 Habitat Slots (`(HabitatSlot | undefined)[]`, `undefined` = Open Fort), a list of still-unplaced drafted Habitat cards, a list of still-plantable drafted Seed cards, and a single pooled Fruit number.
- **Fruit is pooled, not per-color** — a deliberate implementation-time simplification: §4.4's splash tax was decided to be color-agnostic, so there's no consumer anywhere for a per-color balance. A Habitat/Seed's color remains meaningful for *display* (what the UI shows a slot as producing) and for star-level math, just not for what a bond can actually be paid with.
- **Habitat placement/combining**: `placeHabitatCard()` either fills an empty slot (1-star) or combines onto a same-color 1-star slot (2-star, +1 base Fruit, +1 Seed slot) — `canPlaceHabitatCard()` lets the UI disable invalid placements up front rather than relying on thrown errors for control flow, the same pattern as everywhere else in this codebase that validates before mutating.
- **Seed planting**: `plantSeed()`/`canPlantSeed()`, symmetric to the above. Seeds are tracked in `Environment.availableSeeds` and removed on planting. (At the time this was written, Bond/Regimen cards stayed in the shared drafted pool forever and could be reused indefinitely, making this a contrast — Phase 5.5/5.6 later made Bond and Potion cards one-time use too, see §5.8/§5.9, so this is no longer a point of difference, just an example of the same one-time-use bookkeeping pattern arriving here first.)
- **The Interlude Booster** (`interlude.ts`): `createInterludeDraft`/`pickInterludeCard`, a tiny standalone state machine (3 packs of 3, no passing) — deliberately not built on `draft/engine.ts`, since there's no other seat to model, matching §6's own prediction.
- **App-side orchestration** (`useGame.ts`, not part of `sim`): a new `HabitatPlacementScreen` sits between the main draft and the Tournament; `EnvironmentPanel` shows ongoing Fruit/slots/plantable Seeds inside the Tournament layout; `InterludeBoosterScreen` takes over the screen (mirroring `DraftScreen`) whenever `roundJustCompleted` is 1 or 2.
- **Two real bugs caught via a live Playwright pass, both fixed before commit**: the Tournament-start Fruit trigger was firing at draft-completion time — before any Habitat placement happened, so it always computed against 3 empty slots regardless of what the player went on to place — moved to fire in the "continue to Tournament" transition instead. Separately, the Tournament layout's fixed 5-column CSS grid (`260px 1fr 260px 300px 300px`) caused the pool column's fixed-width card badges to visually overflow into the neighboring Environment column at normal viewport widths (~1280px), since the 4 fixed-width columns alone already exceeded that budget — fixed with `grid-template-columns: repeat(auto-fit, minmax(260px, 1fr))`, which wraps extra columns onto additional rows instead of overlapping.
- **Deliberately deferred** (GDD §6.9, decided 2026-08-20): Fastest-Leg and back-to-back-last-place race rewards need new per-Leg cross-racer tracking that nothing in `fieldRace.ts` does today (it only ranks the *whole* race, not leg-by-leg); this wasn't required by Phase 4's own "done" bar and is tracked as a follow-up.

### 5.7 Breeding & Tournament-to-tournament progression — implemented 2026-08-20 (roadmap.md Phase 5)

Lives in `packages/sim/src/tournament/breeding.ts`, per GDD §6.4/§6.5:

- **`computeBreedingPools`**: the tiered exclusion (1st excludes the other 2 finalists → 21 eligible; 2nd excludes the 6-entrant Group1234 pool → 18; 3rd excludes Group12 ∪ Group34 → 12, Round-1 casualties only) computed purely from `originGroup`/`eliminatedInRound`/`finalPlacement` — confirming §5.5's prediction that no new tracked fields were needed. Verified against a hand-built 24-entrant bracket state checking exact pool *membership*, not just sizes.
- **`breedChao`**: the flat `round(0.10*parentA + 0.10*parentB)` formula per stat, otherwise a blank `createChao()`-shaped baby, exactly per GDD §6.4.
- **`resolveBreeding`** (private) / **`prepareNextTournament`** (the public entry point): resolves all 3 finalists' breeding picks in one pass — the player's own pick is passed in explicitly, every other finalist picks uniformly at random from their own pool (a placeholder, same status as the bot-drafting heuristics) — then splits the result into the player's own baby (their new starting Chao) and the other 23 entrants (2 lineage babies + 21 fresh, one shared name-draw across all 24 so nothing collides).
- **A key implementation-time decision the docs hadn't pinned down**: reaching the Final Race and breeding means **the player's own baby becomes their playable Chao for the next Tournament**, not a fresh blank one — `createTournament` gained an optional `others: Chao[]` parameter (a pre-built 23-entrant roster) specifically to support this; Tournament 1 omits it and gets the original fully-procedural 23.
- **A second implementation-time decision, resolving a real ambiguity in GDD §6.6's wording**: elimination before the Final Race is instantly and unconditionally final — no rescue-by-later-breeding-pick mechanic, even though a literal reading of "isn't chosen... as a breeding partner" could imply one. This meant the already-shipped Phase 3 elimination logic needed **no changes** — the simpler reading was chosen specifically to avoid reworking it into "keep silently simulating a player's former group after they're cut."
- **App-side orchestration** (`useGame.ts`, not part of `sim`): a new `BreedingScreen.tsx` — partner picker (with scouting reads, reusing `computeScoutingRead`) → confirm → a results summary for all 3 pairings → "Start Next Tournament," which stashes the player's baby + the 23-entrant roster, resets `draft`/`environment`/pool state, and starts a fresh Draft Booster that consumes the stashed roster the moment it completes.
- **Deliberately deferred** (GDD §6.8, same pattern as Phase 4's race-reward hooks): the full Chao inspection/lineage UI (Name/Height/Weight/Record, raced-indicators, a Lineage tab) — needs a persisted per-Chao history and a real parent-A/parent-B graph, neither of which exist yet, and wasn't required by Phase 5's own completion bar.

### 5.8 Bond Cards as one-time use, Awakening, and race timing — implemented 2026-08-20 (roadmap.md Phase 5.5)

Requested directly by the user after playing the Phase 5 build — not originally its own roadmap phase (Awakening was already Phase 6 scope; the other two are corrections/additions that came out of that conversation).

- **Bond Cards are consumed on use.** This is a real behavior change: every prior phase allowed a single drafted Bond Card to be re-clicked and re-bonded indefinitely (the cumulative-bonding correction in Phase 2.5 fixed *how stacking accumulates*, but never addressed *card scarcity*). `useGame.ts` now tracks `usedPoolIndices: Set<number>` — indices into the combined pool (`draft`'s seat pool + `extraPool`), stable for a Tournament's lifetime since neither array reorders — and `GardenScreen.tsx` only renders still-unused Bond Card copies. Regimen/Technique/Item cards were left unchanged at the time this shipped (still infinitely reusable) — this correction was scoped to Bond Cards only, per the request that prompted it. **Regimen Cards later adopted the identical one-time-use treatment in Phase 5.6, reusing this same `usedPoolIndices` set — see §5.9.**
- **Awakening** (`chao/bonding.ts`'s `awakenBondCard(chao, card)`): 3 unused copies of the same Bond Card fuse into one enhanced application — 3.5× a single copy's *average* stat grant, deterministically (no rng at all, unlike a normal bond's grade roll) — producing exactly one `BondedCard` history entry flagged `awakened: true`. The UI offers this as an explicit alternative to bonding a copy individually (a small resolution of GDD §4.6's own ambiguous "the next time you bond it" phrasing, which could have been read as an automatic forced conversion instead of a player choice).
- **Race timing** (`packages/sim/src/events/timing.ts`): `computeRaceTiming(chao, events)` is a pure, **display-only** function over an already-resolved race's `leg_result` events — it reads new `stat`/`difficulty` fields added to that event (recording whichever check actually decided the Leg, including a taken shortcut fork) and produces a per-Leg + total time in seconds, rounded to the tenth. It does not feed back into `resolveRace`'s pass/fail, DNF, elimination, or `fieldRace.ts`'s ranking — all of that is untouched. Calibrated so a near-zero-stat Chao averages ~9.0s/Leg; the calibration had to explicitly account for the fact that a true 0-stat Chao *always* fumbles every Leg (0 can never clear 15-30 difficulty against only ±5 variance), so the fumble penalty is folded into that baseline rather than added on top of it — a real mistake in the first draft of the constants, caught by the test suite before it shipped.
- **App-side**: `PlayerRaceOutcome`/`FinalRaceOutcome` (bracket.ts) gained a `results: Record<string, RaceResult>` field (the per-entrant breakdown `fieldRace.ts` already computed internally, just not previously exposed) so the app layer can compute timing for every racer, not just the player. A new `RaceResultsScreen.tsx` renders a ranked table (place, name, total time, per-Leg breakdown) as a full-screen overlay — `useGame.ts`'s `raceResult` state takes priority over whatever `phase` is currently active, dismissed via a "Continue" button — shown after every group race and the Final Race. The scrolling Event Log is unchanged and still runs alongside it.

### 5.9 Regimen → Potion rebrand, one-time-use, and color-blending — implemented 2026-08-20 (roadmap.md Phase 5.6)

Requested directly by the user: after asking what Regimen Cards were and hearing the explanation, the name itself was flagged as unintuitive; the recommendation (rename + give them a genuine point of difference from Bond Cards, using the same rarity-gated-complexity moment they were about to get from one-time-use anyway) was accepted.

- **Global rename, no mechanical change on its own**: `RegimenCard` → `PotionCard` (`types.ts`), `consumeRegimen` → `consumePotion` (`chao/bonding.ts`), `'regimen'` → `'potion'` (`CardType` union, every card `id` prefix), `onConsumeRegimen` → `onConsumePotion` (`useGame.ts`/`GardenScreen.tsx`), `CardBadge.tsx`'s `describeCard()` switch case. Same schema, same numbers on every existing card — pure identifier/label rename.
- **One-time use, same pattern as Bond Cards (§5.8)**: `GardenScreen.tsx` now filters Potions by `poolIndex` the same way it already filtered Bond Cards — `pool.map((card, poolIndex) => ({card, poolIndex})).filter(...)` before type-narrowing, so removing already-used entries doesn't shift the remaining indices. Consuming a Potion adds its `poolIndex` to the same `usedPoolIndices: Set<number>` Bond Cards already use — no new piece of state needed, since the invariant ("a position in the combined pool, spent once, ever") is identical for both card types.
- **Color-blending, reusing the existing rarity-gated-complexity pattern (GDD §3.5)** that already governs Bond Card mechanical complexity by rarity: `PotionCard` gained `secondaryColors?: StatColor[]` (0–2 entries, so up to 3 total colors). Common stays single-color (unchanged cards); 10 new cards added — 5 Uncommon 2-color blends, 3 Rare 3-color blends, 2 Legendary 3-color blends (bigger grants). Grants within a blend are **not diluted** per color — total value is gated by rarity access to blending at all, the same design logic already used for existing multi-stat mono Potions.
- **Consolidated into one new cross-color file**, `cards/data/potions.ts` — mirrors the existing `habitat.ts`/`seeds.ts` layout. All 13 original mono Potions moved out of their respective color files (`green.ts`/`red.ts`/`black.ts`/`blue.ts`/`white.ts`), which each gained a header-comment note pointing to where their Potions went; `cards/index.ts` now imports/re-exports `potions.ts` and folds `potionCards` into `coreGardenSet`.
- **No changes needed to color identity, alignment, or splash tax** (`chao/derived.ts`, `computeSplashTax`) — confirmed a consumed Potion never fed into any of that to begin with (GDD §3.3 scopes alignment to attached cards specifically), so `secondaryColors` is additive/flavor with nothing existing to reconcile it against.
- **`CardBadge.tsx`** shows a blended Potion's full color set inline next to its stat grants (e.g. "... (blend: green/red)"), so a blend is visually distinguishable from a mono Potion in the Garden screen, not just via a tooltip or hidden field.

## 6. Bot drafting

Unchanged from the original design. Confirmed (2026-08-20) to still run, once per Tournament before Round 1 (GDD §4.5). Each AI seat gets a lightweight **archetype affinity profile**: a weight per color (0–1) initialized flat and updated as it picks:

1. **Pick 1–3 (open pack):** score every card mostly on raw power (rarity + stat total), lightly influenced by affinity.
2. **Pick 4+ :** score = `rawPower * 0.4 + colorAffinityMatch * 0.4 + tagSynergyWithPoolSoFar * 0.2`; after each pick, nudge the bot's affinity weights toward the picked card's colors.
3. Bots never see other seats' pools (no cheating) — only their own accumulated pool and the pack in front of them.

Already implemented in `packages/sim/src/draft/bots.ts`. The much smaller Environment Interlude booster (GDD §6.3 — 3 packs of 3, no passing, solo choice) likely doesn't need this machinery at all, since there's no "other seat" to model.

## 7. Testing strategy

| Layer | Approach |
|---|---|
| `sim/cards`, `sim/chao` | Standard unit tests — bonding legality, evolution predicates. Already covers most of this. |
| `sim/events` (Race resolver) | Snapshot tests against fixed seeds (same seed + same inputs must always produce the same Event log) + property tests (e.g. "Stamina never goes negative"). `bout.ts`'s existing tests remain green for now as legacy coverage, not a signal that Bout is still in scope. |
| `sim/draft` (bot drafting) | Scenario tests against constructed packs. Already covers this. |
| `sim/tournament` (NEW) | Bracket-advancement tests (a group of 6 correctly shrinks to 3 over 3 races, consolidation produces the right 6-chao groups), breeding eligibility-pool tests (each placement's exclusion set matches GDD §6.4 exactly), and a full-Tournament determinism test in the same style as the existing full-draft determinism test. |
| `app` | Component tests for card/screen rendering; a small number of end-to-end tests (Playwright) covering one full Tournament path for the player's Chao (was "one full Generation start-to-cocoon path" in the original design). |

## 8. Persistence & save format

`GameState` is one JSON-serializable object (RNG seed + current state, not the full Event log — the log is derived/replayable, not saved, to keep save files small). Its exact shape needs a rewrite once the Tournament design solidifies further — the original design's `Generation` (map position, board of Chao, pool, Fruit, Charms, Age budget remaining) doesn't fit a bracket at all. At minimum it will need: current bracket state (which round, which groups, who's been eliminated), the player's Chao + pool + Environment, and meta-progression (the persistent past-Tournament-winners pool from GDD §6.5, cosmetic unlocks). Not written as concrete TypeScript yet — `data-schemas.md` still describes the old shape; deferred until the open questions in GDD §6.5/§7 are resolved enough to commit to a schema.

## 9. Multiplayer / async model

Deliberately scoped post-MVP, but designed for here so the MVP architecture doesn't need to be reworked to support it later:

- **Live co-draft:** the draft engine (§6) already models "a seat" as an interface (`pickCard(pack) → Card`) that bots implement. A network-backed seat implementing the same interface is a drop-in replacement — no change to the draft engine itself. Applies only to the pack-passing Draft Booster format, if it survives the open question in GDD §4.3.
- **Async Tournament entrants:** a Tournament's 23 non-player slots (GDD §6.1) can be sourced from real other players' saved Chao (snapshotted server-side) instead of procedurally generated ones. Because Race resolution is a pure function of a Chao's data + a seed, this requires no new resolver logic — only a new source for where an entrant's `Chao` comes from. This is the direct replacement for the original design's "async ghost Rivals at Elite/Boss nodes" idea, and arguably a more natural fit now that the whole game is structured as a bracket of individually-owned competitors rather than boss encounters.
- Both require a server component (Node, reusing `@chao-draft/sim` per §2) to hold shared draft-session state and a shared entrant/winners pool; neither requires real-time netcode, since per pillar #1 there's no real-time input during a Race, only during the (turn-based, low-frequency) draft pick itself.

## 10. Performance

Not a significant concern for v1: card counts are small (dozens, not thousands), Race resolution is a handful of arithmetic operations per Leg, and 23 non-player entrants per Tournament (plus their off-path races, per GDD §6.2's assumption) is a small enough simulation workload to run synchronously without profiling concerns. Revisit only if playtesting surfaces an actual complaint.
