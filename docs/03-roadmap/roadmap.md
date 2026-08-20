# Roadmap

## Sequencing principle

GDD §10 flags the core risk directly: three resource-management layers (draft/bonding, run-map, autochess-board) stacked at once risks overwhelming what should still feel like a low-stakes creature-raising game. So the build order below is **layered, not featured-complete-per-system**: each phase should be *playable and evaluable on its own* before the next layer is added, specifically so playtesting can answer "is this layer additive or just noisy" at each step rather than only after everything is combined.

## Phase 0 — Foundation

Not a playable milestone; sets up the structure everything else builds on.

- [ ] Monorepo scaffold (`packages/sim`, `packages/app`) per [`architecture.md`](../02-technical/architecture.md#4-module-boundaries).
- [ ] Seeded RNG implementation (`sim/rng`), zero other randomness sources anywhere in `sim`.
- [ ] Core types from [`data-schemas.md`](../02-technical/data-schemas.md) implemented as actual TS.
- [ ] ~30-card slice of the example set ([`card-set-list.md`](../01-design/card-set-list.md)) authored as real data (enough to exercise one full color pair, e.g. all of Green + Red + a few colorless/Habitat).

**Done when:** `sim` package builds, has the type surface, and a handful of hand-written unit tests can construct a `Chao`, bond a `BondCard` to it, and assert the resulting stat/slot/tag state — with no UI yet.

## Phase 1 — Vertical slice: one Chao, one draft, one event

The smallest loop that proves the *core swap* (feeding → drafting) actually feels good, deliberately with no run-map and no multi-Chao board yet.

- [ ] Draft engine: open a single 15-card pack against N bot seats, pick, pass, resolve 3 packs (architecture.md §6).
- [ ] Bonding UI: apply a drafted card to a single Chao's slot, see the stat/body change.
- [ ] Race Leg resolver + Karate Bout resolver (architecture.md §5.2–5.3), each runnable standalone against the one Chao.
- [ ] Event-log playback UI for both (architecture.md §5.1) — this is the piece most directly answering the "does auto-resolution feel earned" design risk (GDD §10), so it should be treated as core scope, not polish.
- [ ] Minimal Garden Board view (even static art is fine) so bonding has a visual payoff.

**Done when:** a playtester can draft ~10 cards, bond several onto one Chao, run it through a Race and a Bout, and read back *why* it won or lost from the event log — without needing any run/map/economy systems to exist yet.

**Explicit non-goals for this phase:** map/node graph, Fruit economy, multiple Chao, alignment/evolution, reincarnation. All deferred to later phases on purpose — Phase 1 is scoped to test the draft-and-bond loop in isolation.

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

- [ ] Expand the card set from the ~95-card proof-of-concept to a real target size (recommend starting around 180–220 — big enough for repeat-Generation variety, still small enough for one person/small team to balance; revisit after Phase 3 playtesting shows how fast players burn through the smaller set).
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
