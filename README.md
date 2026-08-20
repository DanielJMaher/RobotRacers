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

## Status

**Design fully resolved; Phase 2.5 of the implementation catch-up complete (2026-08-20).** The docs (GDD, architecture, roadmap) describe the Tournament-bracket direction above in full — no open design questions remain, only balance/tuning numbers. The code is catching up in the roadmap's phased order; Phase 2.5 (correct the Bond Card model to cumulative, multi-region, mixed-sign bonding) is done. See [`docs/03-roadmap/roadmap.md`](docs/03-roadmap/roadmap.md) for what's next (the Tournament bracket core loop, Phase 3).

What exists today:

- A pnpm + Turborepo monorepo (`packages/sim`, `packages/app`), matching the conventions used elsewhere in this dev environment (strict TypeScript, Vitest, Prettier).
- `@chao-draft/sim`: a pure, DOM-free simulation core — the full type surface from [`data-schemas.md`](docs/02-technical/data-schemas.md) *(not yet updated for the Tournament pivot — still describes the old Generation/board shape; deliberately deferred, see the roadmap)*, a seeded RNG, all 5 stat colors plus Climb/Jump support, colorless Items, and Habitats as real card data (91 cards), a bonding rules engine (cumulative, unbounded bonding across 5 Body Regions with mixed positive/negative stat grants — corrected 2026-08-20, no more 4-slot replace-on-rebond), a full draft engine (pack generation, bot drafting, a tick-by-tick pass-and-pick state machine), and a Race Leg resolver supporting 5–8-leg procedurally generated courses across 7 Leg types. Karate Bout is fully removed. 72 passing unit tests.
- `@chao-draft/app`: a playable Vite + React vertical slice — draft a full 3-pack draft against 3 AI bot seats, bond drafted cards onto your Chao (a growing Bonding History plus a per-region "look" summary, not a fixed slot grid), then run a Race (a fresh varied course each time) and read the outcome from a narrated event log.

Run `pnpm install`, then `pnpm build` / `pnpm typecheck` / `pnpm test` from the repo root, or `pnpm --filter @chao-draft/app dev` to play the current vertical slice. Next up per the roadmap: the Tournament bracket core loop (Phase 3).
