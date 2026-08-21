# Chao Draft *(working title)*

A design and technical spec for a spiritual-successor to the **Chao Garden** (Sonic Adventure DX / SA2B), with one core swap:

> Instead of raising your creature by feeding it animals found in the world, you raise it by **drafting cards** — MTG-style booster draft — and building it up the way a Slay the Spire run builds a deck.

Everything else about the source material — a creature you *coach* rather than *control*, stat-driven racing, alignment, evolution, breeding — is kept and reinterpreted through that lens.

> **2026-08-20 design pivot:** the original plan paired the draft with a Dota Underlords-style multi-Chao "autochess board" (Fruit economy, board leveling, synergy breakpoints) inside a Slay-the-Spire node-map run. Both are **cut**. In their place: a single Chao competes in a 24-entrant single-elimination **Tournament** bracket; Karate Bouts are removed (races only); and **Breeding** — previously a deferred stretch idea — is now the game's central meta-progression mechanic, determining which Chao carry forward into the next Tournament. See the GDD's revision note for the full rationale.

**"Chao" is a Sega trademark.** This is a fan-scoped design exercise / personal prototype, not a commercial product. Before any public release, rename the creature, the world, and any other SEGA-owned terms (see [`docs/03-roadmap/roadmap.md`](docs/03-roadmap/roadmap.md#trademark--naming) for a rebrand checklist). Internally, this doc set keeps "Chao" because that's the clearest way to describe what's being replicated.

## Document map

| Doc | Contents |
|---|---|
| [`docs/00-research/chao-garden-research.md`](docs/00-research/chao-garden-research.md) | Sourced research on the original Chao Garden's stats, feeding, evolution, alignment, racing, karate, breeding, and lifespan systems — the baseline every design decision below is measured against. |
| [`docs/01-design/game-design-document.md`](docs/01-design/game-design-document.md) | The full GDD: design pillars, card types, the draft loop, race resolution, and the Tournament bracket / Environment Interludes / Breeding structure that replaced the original run-map + autochess-board design (see its 2026-08-20 revision note). |
| [`docs/01-design/card-set-list.md`](docs/01-design/card-set-list.md) | A concrete example card set — ~90 cards across 5 colors + colorless, with rarities, stats, keywords, and species tags — to prove the system produces real draftable choices, not just a framework. |
| [`docs/02-technical/architecture.md`](docs/02-technical/architecture.md) | Recommended tech stack, system architecture, module boundaries, determinism/simulation strategy, save format, multiplayer/async-ghost approach. |
| [`docs/02-technical/data-schemas.md`](docs/02-technical/data-schemas.md) | Concrete TypeScript interfaces / JSON schemas for Chao, Card, Roster, Run, Draft, and Match state. |
| [`docs/03-roadmap/roadmap.md`](docs/03-roadmap/roadmap.md) | Phased build plan (vertical slice → MVP → content pass), milestones, open design risks, trademark/rebrand checklist. |

## One-paragraph pitch

Every run is one **Tournament**: your Chao enters a 24-entrant single-elimination bracket (4 groups of 6, last place eliminated each race) alongside 23 others. Between bracket rounds you retreat to your **Environment** to draft a few more cards and train. Races resolve automatically from stats and equipped cards — you were never the one swimming, you're the coach. Place in the top 3 of the Final Race and you get to **breed** with an opponent of your choosing (the widest pool of partners for 1st place, the narrowest for 3rd); the resulting foal — weaker than either parent, and looking closer to a base Chao than either specialized parent — enters the next Tournament. Lose without being picked to breed, and the run is over.

## Play it live

**https://danieljmaher.github.io/RobotRacers/** — auto-deployed from `master` via `.github/workflows/deploy-pages.yml` on every push.

## Status

**Design fully resolved; Phase 5.7 of the implementation catch-up complete (2026-08-20) — the core tournament-to-tournament loop is fully playable, hosted live, with real Bond/Potion Card scarcity, race timing, color-blended Potions, and basic procedural card art on top.** The docs (GDD, architecture, roadmap) describe the Tournament-bracket direction above in full — no open design questions remain, only balance/tuning numbers. See [`docs/03-roadmap/roadmap.md`](docs/03-roadmap/roadmap.md) for what's next (the rest of Phase 6's card-system follow-through — balance, deferred UI).

What exists today:

- A pnpm + Turborepo monorepo (`packages/sim`, `packages/app`), matching the conventions used elsewhere in this dev environment (strict TypeScript, Vitest, Prettier).
- `@chao-draft/sim`: a pure, DOM-free simulation core — the full type surface from [`data-schemas.md`](docs/02-technical/data-schemas.md) *(not yet updated for the Tournament pivot — still describes the old Generation/board shape; deliberately deferred, see the roadmap)*, a seeded RNG, all 5 stat colors plus Climb/Jump support, colorless Items, Habitats, Seeds, and Potions (renamed from "Regimen" 2026-08-20, now including 10 color-blended cards up to 3 colors, rarity-gated the same way Bond Card complexity is) as real card data (106 cards), a bonding rules engine (cumulative, unbounded bonding across 5 Body Regions with mixed positive/negative stat grants, plus Awakening — 3 copies of a card fuse into one 3.5x-average-grant application), a full draft engine, a Race Leg resolver, a display-only race-timing layer (per-Leg + total times to the tenth of a second, calibrated to a real reference point), a Tournament bracket engine (24-entrant generation + scouting, a shared rank-a-field/eliminate-last-place primitive, the full Round 1 → Round 2 → Round 3 → Final Race state machine with Evolution triggers), an Environment engine (Habitat placement/2-star combining, Seed planting, pooled Fruit generation, an enforced splash tax, a solo 3-pack Environment Interlude Booster), and a Breeding engine (`tournament/breeding.ts`): tiered breeding-eligibility pools exactly matching GDD §6.4's exclusion rules, the flat 10%+10% stat-inheritance formula, and full Tournament-to-tournament roster generation (3 lineage babies + 21 fresh, every time). Karate Bout is fully removed. 126 passing unit tests.
- `@chao-draft/app`: a playable Vite + React Tournament that loops — draft, place Habitats, play a full Tournament (bonding with splash tax, Environment Interludes, scouting), and on reaching the Final Race, pick a breeding partner and watch all 3 finalists' pairings resolve; if you bred, your own baby becomes your starting Chao for a fresh Draft Booster and the cycle continues. **Bond and Potion Cards are both one-time use** — bonding (or Awakening 3 Bond Card copies together), or drinking a Potion, spends the specific drafted card for good, same lifecycle as Habitat and Seed cards. **A real per-race Results screen** shows a ranked table with every Chao's total time and per-Leg breakdown after every race, not just a scrolling log. Every card now renders **basic procedural filler art** (`CardArt.tsx`) — a color/rarity-driven gradient and border plus a flat-icon silhouette keyed to card type (and Species Tag, for Bond Cards) — generated entirely from card data, no image assets or art pipeline yet. Elimination before the Final Race ends the run outright. Chao inspection/lineage UI (Name/Height/Weight/Record, ancestry) is deliberately deferred (Phase 6).
- **Hosting**: a GitHub Actions workflow builds and deploys `packages/app/dist` to GitHub Pages on every push to `master` — see "Play it live" above.

Run `pnpm install`, then `pnpm build` / `pnpm typecheck` / `pnpm test` from the repo root, or `pnpm --filter @chao-draft/app dev` to play the current build locally. Next up per the roadmap: the rest of Phase 6 — balance tuning and the deferred inspection/lineage UI and race-reward hooks.
