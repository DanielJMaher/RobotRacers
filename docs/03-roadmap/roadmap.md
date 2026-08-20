# Roadmap

## Sequencing principle

GDD §10 flags the core risk directly: three resource-management layers (draft/bonding, run-map, autochess-board) stacked at once risks overwhelming what should still feel like a low-stakes creature-raising game. So the build order below is **layered, not featured-complete-per-system**: each phase should be *playable and evaluable on its own* before the next layer is added, specifically so playtesting can answer "is this layer additive or just noisy" at each step rather than only after everything is combined.

## Phase 0 — Foundation

Not a playable milestone; sets up the structure everything else builds on.

- [x] Monorepo scaffold (`packages/sim`, `packages/app`) per [`architecture.md`](../02-technical/architecture.md#4-module-boundaries). pnpm + Turborepo, matching `GMSim`'s conventions (strict `tsconfig.base.json`, Prettier, vitest).
- [x] Seeded RNG implementation (`sim/rng`), zero other randomness sources anywhere in `sim`. Mulberry32, `createRng`/`rollInRange`, unit-tested for determinism and range bounds.
- [x] Core types from [`data-schemas.md`](../02-technical/data-schemas.md) implemented as actual TS (`packages/sim/src/types.ts`) — including a `BondedCard`/`RolledStatGrant` refinement and a `custom` `EffectOp` escape hatch discovered during implementation and folded back into that doc.
- [x] ~30-card slice of the example set ([`card-set-list.md`](../01-design/card-set-list.md)) authored as real data — all 14 Green + all 14 Red cards, plus 4 colorless Items and 2 Habitats (34 cards total), in `packages/sim/src/cards/data/`.
- [x] Bonding rules engine (`packages/sim/src/chao/`): `createChao`, `bondCard` (slot occupancy + replacement + grade rolls), `consumeRegimen`, `recomputeDerived` (color identity, alignment, species tag counts), `computeSplashTax` — 17 passing unit tests in `bonding.test.ts` and `rng/index.test.ts`.

**Done when:** `sim` package builds, has the type surface, and a handful of hand-written unit tests can construct a `Chao`, bond a `BondCard` to it, and assert the resulting stat/slot/tag state — with no UI yet. **✅ Met** (`pnpm build`, `pnpm typecheck`, and `pnpm test` all pass; `packages/app` is a placeholder shell only — Phase 1 wires it to `sim`).

## Phase 1 — Vertical slice: one Chao, one draft, one event

The smallest loop that proves the *core swap* (feeding → drafting) actually feels good, deliberately with no run-map and no multi-Chao board yet.

- [x] Draft engine: open a single 15-card pack against N bot seats, pick, pass, resolve 3 packs (architecture.md §6). `packages/sim/src/draft/` — `pool.ts` (pack generation, sampling-with-replacement, a guaranteed bonus Habitat per pack mirroring MTG's land slot), `bots.ts` (the documented rawPower/affinity/tag-synergy scoring heuristic), `engine.ts` (the tick-by-tick pass-and-pick state machine, direction alternating each round). 26 unit/integration tests including a full-draft determinism check.
- [x] Bonding UI: apply a drafted card to a single Chao's slot, see the stat/body change. `packages/app/src/components/GardenScreen.tsx` — clicking a Bond Card calls `bondCard` and the slot list re-renders with the new card + body mutation immediately; confirmed live in a Playwright-driven browser pass (see below).
- [x] Race Leg resolver + Karate Bout resolver (architecture.md §5.2–5.3), each runnable standalone against the one Chao. `packages/sim/src/events/race.ts` and `bout.ts`, sharing a trigger-matching/effect-execution core in `shared.ts` (`collectTriggerables`, `applyEffectOps`, `fireTriggers`) exactly as architecture.md §5.3 calls for. 23 tests across both resolvers plus the shared module.
- [x] Event-log playback UI for both (architecture.md §5.1). `packages/app/src/game/narration.ts` maps every `SimEvent` to a readable line (with a compile-time exhaustiveness guard so a future event kind can't silently go unnarrated); the Garden screen's Event Log panel renders the growing list live.
- [x] Minimal Garden Board view (even static art is fine) so bonding has a visual payoff. Folded into `GardenScreen.tsx` rather than a separate screen — stats, alignment, color identity, evolution stage, and all 4 Bond Slots (with body-mutation text) are visible at all times while bonding decisions are made, which is also where the payoff is most legible.

**Done when:** a playtester can draft ~10 cards, bond several onto one Chao, run it through a Race and a Bout, and read back *why* it won or lost from the event log — without needing any run/map/economy systems to exist yet. **✅ Met** — `pnpm build`/`typecheck`/`test` all pass (62 sim tests total), and a full Playwright-driven pass through all 45 draft picks → bonding → Race → Bout confirmed correct behavior and legible narration with zero console/page errors.

**Two real bugs found and fixed during implementation** (not left as known issues): the Race resolver's shortcut-fork logic was checking the wrong stat for the shortcut leg itself (GDD §6.2 — both the "do you take the shortcut" check and the shortcut leg itself should use the fork's Fly/Swim stat, not the leg's normal stat; only the non-shortcut path should use the normal stat); and `meadowFawn`'s "Graze — regen 1 Stamina between legs" keyword had been authored as a permanent `modifyStat` in Phase 0, which would have inflated the base stat forever instead of regenerating in-race HP — fixed by adding a distinct `restoreStamina` EffectOp. Both are documented inline where fixed and in `data-schemas.md`.

**Explicit non-goals for this phase (unchanged):** map/node graph, Fruit economy, multiple Chao, reincarnation, evolution-stage *advancement* (the field exists and is displayed, but no trigger ever moves a Chao from stage 0 → 1 → 2 yet — that's the Act 1/Act 2 boss logic in Phase 2). Alignment computation was already built in Phase 0 (`recomputeDerived`) and is simply now visible in the Garden screen — it was never actually out of scope, just not yet surfaced in a UI.

## Phase 2 — Run structure

Adds the Slay-the-Spire layer around the Phase 1 loop.

- [ ] Node graph generator (GDD §7.2) + map UI.
- [ ] Generation/Age-budget state machine, ending at a Boss node.
- [ ] Alignment computation + two-stage evolution (GDD §3.3–3.4).
- [ ] Happiness tracking → cocoon check → reincarnation carry-over (GDD §7.5).
- [ ] Rest Garden, Kindergarten Event, Black Market node types (GDD §7.3) — can start as simple/placeholder effects, don't need full content yet.
- [ ] Charms (GDD §7.4).

**Done when:** a full Generation is playable start-to-cocoon with a single Chao, and finishing well visibly carries something (stats or a recipe) into a fresh run.

## Phase 3 — Autochess layer

Adds the multi-Chao board and its economy on top of a working single-Chao run.

- [ ] Board of 2–6 Chao, boardLevel-gated (GDD §5.1).
- [ ] Fruit economy: base income, Habitat income, win/loss streak bonuses (GDD §5.2, §5.6).
- [ ] Black Market as a real reroll/buy-singles shop (GDD §5.3).
- [ ] Species Tag breakpoints, board-wide bonuses (GDD §5.5).
- [ ] Awakening (3-copy fusion) (GDD §5.4).
- [ ] Splash tax + Habitat fixing tuned together as one knob (per the GDD's own risk note, GDD §10).

**Done when:** a full board can be drafted for, leveled, and fielded across a Generation, and a playtester can articulate *why* they're targeting a specific Species Tag breakpoint or archetype — i.e., the autochess layer is producing legible strategic decisions, not just more numbers.

## Phase 4 — Content pass

- [x] *(done early, 2026-08-20, ahead of Phase 2/3)* All 5 stat colors implemented as real card data in `packages/sim/src/cards/data/` — Green and Red were Phase 0/1 scope; Black, Blue, and White were added afterward to match `card-set-list.md` in full. 85 cards total (everything in that doc except Twin Garden Spring, deliberately deferred — it needs a modal/choice-on-pick draft mechanic the draft engine doesn't support yet). A `coreGardenSet.test.ts` structural-invariant suite (no duplicate ids, valid stat ranges, every color/rarity represented) now guards the whole hand-authored set. Several cards' flavor text referenced mechanics that don't exist yet (Phase 2/3 systems, board-level effects, draft-time choices, a couple of schema mismatches like Happiness-isn't-a-Stat) — each is flagged with an inline code comment rather than silently dropped or half-implemented; see the `custom` EffectOp notes in `black.ts`/`blue.ts`/`white.ts`/`colorless.ts`.
- [ ] Expand the card set from the current ~85-card set to a real target size (recommend starting around 180–220 — big enough for repeat-Generation variety, still small enough for one person/small team to balance; revisit after Phase 3 playtesting shows how fast players burn through the smaller set).
- [ ] Full Kindergarten Event content (a real pool of narrative nodes, not placeholders).
- [ ] Difficulty Rank modifiers (GDD §7.6).
- [ ] Balance pass specifically on: splash tax curve, Awakening power level, Legendary rate, Species Tag breakpoint values.

## Phase 5 — Stretch / post-MVP

Everything explicitly deferred earlier, in likely priority order:

1. **Breeding** (GDD §8) — two-parent allele inheritance applied to card-grade rolls, cross-Generation.
2. **Multiplayer live co-draft** (architecture.md §9) — network-backed draft seat.
3. **Async ghost Rivals** (architecture.md §9) — real player boards as Elite/Boss opponents.
4. **Cosmetic-only long-term unlock track** (GDD §7.6).

## Open design questions (not yet resolved — flag before relevant phase starts)

| Question | Relevant phase | Notes |
|---|---|---|
| Exact numeric tuning (splash tax curve, damage formula constants, Age budget length) | 1–4 | GDD deliberately left these as tunable placeholders (e.g. `damage = max(1, Power − Swim/2)`) — needs real playtesting data, not more design-on-paper. |
| Should Rest Garden's "early reincarnation gamble" (GDD §7.3) be available more than once per Generation? | 2 | Could either be a good comeback/bail-out valve or could undercut the "lifetime" framing if overused — needs a playtest read. |
| Bot seat count and personality variety (architecture.md §6) — how many distinct affinity-weight "personalities" are worth authoring? | 1 | Start with 1 generic profile; only invest in variety if Phase 1 playtesting shows drafts feel same-y. |
| Target card-set size (180–220 suggested in Phase 4) | 4 | Genuinely an open number — revisit with real repeat-play data on how fast the ~95-card set gets stale. |

## Trademark & naming

"Chao," "Chaos Drive," "Chao Garden," and related terms belong to SEGA. This entire doc set uses them because that's the clearest way to specify *what's being cloned* during design — not because they're intended to ship. Before any build leaves personal/prototype use:

- [ ] Rename the creature (currently "Chao") to an original name across code, assets, and docs.
- [ ] Rename "Chaos Drive" → the Regimen Card flavor text/naming already mostly stands on its own (GDD §4.2) and doesn't need "Chaos Drive" as a literal in-game term — audit for stray references.
- [ ] Rename "Chao Garden," "Chao Race," "Chao Karate," "Kindergarten," "Black Market Chao," "Jewel Cup" — all SEGA-specific proper nouns, even though the *mechanics* they name are being reinterpreted, not copied wholesale.
- [ ] Original visual design for creature bodies/mutations — do not reference or trace SEGA's Chao model/art.
- [ ] Legal review of the final name/branding before any public distribution (storefront listing, trailer, itch.io page, etc.) — this checklist is a starting point, not a substitute for that.
