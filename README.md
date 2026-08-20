# Chao Draft *(working title)*

A design and technical spec for a spiritual-successor to the **Chao Garden** (Sonic Adventure DX / SA2B), with one core swap:

> Instead of raising your creature by feeding it animals found in the world, you raise it by **drafting cards** — MTG-style booster draft — and building it up the way a Slay the Spire run builds a deck, while your wider stable of creatures is managed like an autochess board (Dota Auto Chess / Dota Underlords).

Everything else about the source material — a creature you *coach* rather than *control*, stat-driven racing and battling, alignment, evolution, breeding, lifespan and reincarnation — is kept and reinterpreted through that lens.

**"Chao" is a Sega trademark.** This is a fan-scoped design exercise / personal prototype, not a commercial product. Before any public release, rename the creature, the world, and any other SEGA-owned terms (see [`docs/03-roadmap/roadmap.md`](docs/03-roadmap/roadmap.md#trademark--naming) for a rebrand checklist). Internally, this doc set keeps "Chao" because that's the clearest way to describe what's being replicated.

## Document map

| Doc | Contents |
|---|---|
| [`docs/00-research/chao-garden-research.md`](docs/00-research/chao-garden-research.md) | Sourced research on the original Chao Garden's stats, feeding, evolution, alignment, racing, karate, breeding, and lifespan systems — the baseline every design decision below is measured against. |
| [`docs/01-design/game-design-document.md`](docs/01-design/game-design-document.md) | The full GDD: design pillars, how each of the three inspirations (MTG Draft / Slay the Spire / Autochess) maps onto a Chao Garden system, card types, the draft loop, the roster/autochess layer, run structure, combat & race resolution, UI flow. |
| [`docs/01-design/card-set-list.md`](docs/01-design/card-set-list.md) | A concrete example card set — ~90 cards across 5 colors + colorless, with rarities, stats, keywords, and species tags — to prove the system produces real draftable choices, not just a framework. |
| [`docs/02-technical/architecture.md`](docs/02-technical/architecture.md) | Recommended tech stack, system architecture, module boundaries, determinism/simulation strategy, save format, multiplayer/async-ghost approach. |
| [`docs/02-technical/data-schemas.md`](docs/02-technical/data-schemas.md) | Concrete TypeScript interfaces / JSON schemas for Chao, Card, Roster, Run, Draft, and Match state. |
| [`docs/03-roadmap/roadmap.md`](docs/03-roadmap/roadmap.md) | Phased build plan (vertical slice → MVP → content pass), milestones, open design risks, trademark/rebrand checklist. |

## One-paragraph pitch

Every run is one **Generation**: you hatch a Chao, and over its natural lifespan you build a small stable (2–6 creatures) by opening **Draft Boosters** at map nodes — passing packs, picking cards, building a limited pool — then **bonding** those cards onto your Chao to change their stats, their body, and their moveset, exactly like feeding used to. Races and Karate Bouts are resolved automatically from stats and equipped cards, because you were never the one swimming or punching — you're the coach, same as the original. Between events you manage gold, reroll shops, level up your stable, and chase species-synergy breakpoints, autochess-style. When your Chao's life ends, if it lived well, it reincarnates: 10% of its stats and a piece of its card pool carry into the next Generation — the game's built-in meta-progression hook, taken directly from a mechanic the original already had.

## Status

**Phases 0 and 1 complete** — see [`docs/03-roadmap/roadmap.md`](docs/03-roadmap/roadmap.md) for the full build order. What exists today:

- A pnpm + Turborepo monorepo (`packages/sim`, `packages/app`), matching the conventions used elsewhere in this dev environment (strict TypeScript, Vitest, Prettier).
- `@chao-draft/sim`: a pure, DOM-free simulation core — the full type surface from [`data-schemas.md`](docs/02-technical/data-schemas.md), a seeded RNG, all 5 stat colors plus colorless Items and Habitats implemented as real card data (85 cards, matching [`card-set-list.md`](docs/01-design/card-set-list.md) in full except one deliberately-deferred modal card), a bonding rules engine (`createChao`, `bondCard`, `consumeRegimen`, `recomputeDerived`, `computeSplashTax`), a full draft engine (pack generation, bot drafting with a scoring heuristic, a tick-by-tick pass-and-pick state machine), and Race Leg / Karate Bout resolvers sharing a trigger-matching/effect-execution core — 68 passing unit tests, including a structural-invariant suite over the whole card set.
- `@chao-draft/app`: a playable Vite + React vertical slice — draft a full 3-pack draft against 3 AI bot seats, bond drafted cards onto your Chao and watch its stats/slots/alignment update live, load Technique cards, then run a Race or Karate Bout and read the outcome back from a narrated, human-readable event log. Verified end-to-end in a real browser (Playwright-driven click-through of all 45 picks + bonding + both event types, zero console errors).

Run `pnpm install`, then `pnpm build` / `pnpm typecheck` / `pnpm test` from the repo root, or `pnpm --filter @chao-draft/app dev` to play the current vertical slice. Next up: Phase 2 (run/map structure, alignment-driven evolution, reincarnation) — see the roadmap.
