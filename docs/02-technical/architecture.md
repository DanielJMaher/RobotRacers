# Technical Architecture

*Companion to [`game-design-document.md`](../01-design/game-design-document.md). This doc covers stack, module boundaries, simulation strategy, persistence, and the multiplayer/async model. Concrete type definitions live in [`data-schemas.md`](data-schemas.md).*

## 1. Constraints the architecture has to satisfy

Pulled directly from the GDD, because they drive real technical decisions, not just design ones:

- **Pillar #1 ("you coach, don't pilot")** means Race/Bout resolution is a deterministic-given-inputs simulation, not a real-time game loop with player input mid-event. That's a huge simplification: no netcode-sensitive real-time state, no client-side prediction needed for the core loop.
- **Design risk on legibility** (GDD §10) means the simulation needs to produce a **replayable, steppable log**, not just a final result — the UI has to be able to play back "round 1: Run determined turn order, Power hit for 12, Evasion missed..." as a readable sequence.
- **Bot drafting** (GDD §4.5) needs to run for every AI seat in every draft, so it has to be fast and side-effect-free enough to run many times in tests without a UI.
- **Multiplayer is explicitly post-MVP** (GDD §9) but the core simulation should be written so that swapping "bot decides" for "network message decides" at the draft-pick and pre-event-loadout boundaries doesn't require rearchitecting — those are the only two points where another human's input would ever enter the system.

## 2. Recommended stack

Your other web-facing projects (`neumann-bridge`, `neumann-web-cockpit`) are TypeScript + Vite + Node, so this recommendation follows that lane rather than pulling in an unfamiliar engine (Unity/Godot) for what is, mechanically, a card-and-menu game with light 2D presentation — not a game that needs a 3D engine's physics/rendering pipeline.

| Layer | Recommendation | Why |
|---|---|---|
| **Simulation core** | Pure TypeScript, zero DOM/rendering dependencies, published as its own internal package (`@chao-draft/sim`) | Per §1, this is the part that most needs to be deterministic, unit-testable, and reusable headlessly (bot drafting, automated playtests, a future server-authoritative multiplayer mode all just call this package). Keeping it framework-free is the single most important structural decision in this doc. |
| **Rendering / UI** | React + Vite, Canvas or a lightweight 2D lib (e.g. PixiJS) for the Garden Board view; plain DOM/React for draft screens, map screens, card text | Draft/map/deckbuilding screens are fundamentally list-and-card UI — React is a good fit and matches your existing stack. The Garden Board (chao wandering around) is the only screen that benefits from a canvas layer; everything else doesn't need one. |
| **State management** | A single typed store (Zustand or Redux Toolkit) that wraps the sim core's state, not a second parallel state model | Avoids the classic "UI state and sim state drift apart" bug class. The store should hold exactly one `GameState` object shaped by the sim core; the UI reads/renders it and dispatches sim actions, it never mutates sim state directly. |
| **Persistence** | Local: serialize `GameState` to JSON in `localStorage`/IndexedDB (browser) or a flat file (if packaged as a desktop app via Tauri). Optional cloud save: a thin REST layer once accounts exist. | The whole `GameState` is already a plain serializable object if the sim core is written without classes-with-methods (prefer plain data + pure functions) — see §5. |
| **Server (post-MVP, for multiplayer draft/async ghosts)** | Node + the same `@chao-draft/sim` package, run server-side for the parts that need to be authoritative (draft pack contents, ghost-data storage) | Reusing the sim package server-side is only possible if it's kept framework-free per the row above — this is the payoff for that constraint. |
| **Bot drafting / AI** | Plain TS, no ML — weighted scoring functions (see §6) | The design doesn't need anything fancier; a scoring heuristic per bot personality is enough to produce believable signal-reading behavior, and it's fully deterministic and testable. |

**Alternative considered:** Godot 4 (GDScript or C#) was considered as a more "real game engine" option, and would be a reasonable choice if the Garden Board view grows a lot of physics/animation ambition later. It's not the recommendation for v1 because (a) it doesn't match your existing tooling, and (b) nothing in the GDD actually needs a physics engine — Race/Bout results are computed, not simulated in real-time space. Revisit this only if playtesting shows the Garden Board *view* (idle creatures wandering, being pet, etc.) wants to be a much richer real-time scene than a card game needs.

## 3. High-level architecture

```
┌─────────────────────────────────────────────────────────────┐
│  UI layer (React)                                            │
│  Screens: Map · Draft Booster · Garden Board · Race replay · │
│  Bout replay · Kindergarten Event · Black Market · Rest      │
│  ─ reads GameState from the store, dispatches Actions ─      │
└───────────────────────────┬───────────────────────────────────┘
                             │ Actions (PickCard, BondCard, LoadTechnique,
                             │ EnterNode, ResolveRace, ResolveBout, ...)
┌───────────────────────────▼───────────────────────────────────┐
│  @chao-draft/sim  (pure TS, no DOM)                           │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────────┐ │
│  │ Draft      │ │ Bonding /  │ │ Race/Bout  │ │ Run/Map        │ │
│  │ engine     │ │ card rules │ │ resolver   │ │ state machine  │ │
│  │ (§6)       │ │ engine     │ │ (§5)       │ │ (node graph,   │ │
│  │            │ │            │ │            │ │ generation)    │ │
│  └───────────┘ └───────────┘ └───────────┘ └───────────────┘ │
│  Seeded RNG (single source, see §5.1) threaded through all of it │
└───────────────────────────┬───────────────────────────────────┘
                             │ serializes to
┌───────────────────────────▼───────────────────────────────────┐
│  Persistence: GameState → JSON → localStorage / file / (later) │
│  server                                                        │
└─────────────────────────────────────────────────────────────┘
```

## 4. Module boundaries

Package layout, assuming an npm workspace/monorepo (Turborepo, matching the pattern already used in `GMSim`):

```
chao-clone/
  packages/
    sim/                  # @chao-draft/sim — pure TS, no deps on React/DOM
      src/
        cards/            # card definitions, data-driven from card-set-list.md content
        chao/              # Chao entity, stats, evolution, bonding rules
        draft/             # booster generation, bot drafting (§6)
        events/            # Race leg resolver, Karate Bout resolver (§5)
        run/               # map/node graph, Generation state machine, reincarnation
        rng/               # seeded RNG (single implementation, no Math.random() elsewhere)
        state/             # GameState shape + reducers/actions
      test/                # unit + property tests (§7)
    app/                   # React + Vite front end
      src/
        screens/
        components/
        store/             # thin wrapper around @chao-draft/sim's reducers
  docs/                    # this doc set
```

**Hard rule:** nothing in `packages/sim` imports from `packages/app`, and nothing in `packages/sim` calls `Math.random()`, `Date.now()`, or touches the DOM. This is what keeps the simulation replayable, server-portable, and testable without a browser.

## 5. Simulation strategy

### 5.1 Determinism & the replay log

A single seeded PRNG (e.g. a small xorshift/mulberry32 implementation, no external dependency needed) is threaded through every function that needs randomness — pack contents, grade rolls, Evasion checks, Luck-broken ties. The seed lives on the `GameState` (per-Generation) and every roll is logged as a discrete **Event** (`{ type: 'EvasionCheck', chaoId, roll, threshold, result }`) rather than silently mutating state.

This buys two things directly called for in the GDD:

- **The legibility risk (GDD §10)** — the UI can play the Event log back at whatever pace it wants, narrating "Run determined turn order... Power hit for 12... Evasion missed" instead of just flashing a final number.
- **Testability** — a fixed seed makes an entire Race or Bout resolution a pure function from `(GameState, seed) → (GameState', Event[])`, trivially snapshot-testable.

### 5.2 Race Leg resolver

Implements GDD §6.2 as a pure function per Leg: `resolveLeg(chao, leg, loadedTechniques, rng) → LegResult`. A full Race is a fold over its Legs, threading Stamina depletion and DNF state through, with loaded Technique triggers checked against each Leg's Event stream.

### 5.3 Karate Bout resolver

Implements GDD §6.1 the same way: `resolveRound(attacker, defender, rng) → RoundResult`, folded over the Bout's round count, with Trait triggers checked against the Event stream exactly like Techniques are in the Race resolver — Traits and Techniques should share one trigger-matching implementation (both are "effect fires when Event X happens"), not two parallel systems, since GDD §4.2 defines them with the same trigger/effect shape.

### 5.4 Bonding & evolution rules engine

A pure rules module that, given a Chao and a card, returns whether the bond is legal (slot availability, splash tax cost) and what state changes it produces (stat roll within the card's grade range, slot occupancy, Species Tag accumulation, recomputed color identity → recomputed alignment per GDD §3.3). Evolution checks (GDD §3.4) run as a side-effect-free predicate evaluated at the two fixed run-progress points (Act 1 boss, Act 2 boss), not as continuous polling.

## 6. Bot drafting

Each AI seat gets a lightweight **archetype affinity profile**: a weight per color (0–1) initialized flat and updated as it picks, using the standard limited-draft heuristic:

1. **Pick 1–3 (open pack):** score every card mostly on raw power (rarity + stat total), lightly influenced by affinity.
2. **Pick 4+ :** score = `rawPower * 0.4 + colorAffinityMatch * 0.4 + tagSynergyWithPoolSoFar * 0.2`; after each pick, nudge the bot's affinity weights toward the picked card's colors (this is what produces "bots commit to a lane" behavior and, as a side effect, produces believable open-color signals for the human player to read, per GDD §4.5).
3. Bots never see other seats' pools (no cheating) — only their own accumulated pool and the pack in front of them, same information the human player has.

This is a scoring heuristic, deliberately not ML — it's simple enough to unit test ("given this pool and this pack, assert the bot doesn't take an off-color Common over an on-color Rare") and tunable by adjusting the three weights above.

## 7. Testing strategy

| Layer | Approach |
|---|---|
| `sim/cards`, `sim/chao` | Standard unit tests — bonding legality, splash tax math, evolution predicates. |
| `sim/events` (Race/Bout resolvers) | Snapshot tests against fixed seeds (same seed + same inputs must always produce the same Event log — this is the regression suite that protects determinism itself) + property tests (e.g. "Stamina never goes negative," "a Chao with 0 Run never wins the turn-order check against a Chao with positive Run"). |
| `sim/draft` (bot drafting) | Scenario tests against constructed packs ("bot with high Red affinity, given a pack with one on-color Rare and one off-color Legendary, picks according to the documented weight formula" — asserts the formula, not a vibe). |
| `app` | Component tests for card/screen rendering; a small number of end-to-end tests (Playwright) covering one full Generation start-to-cocoon path, since that's the path most likely to break silently when any one system changes. |

## 8. Persistence & save format

`GameState` is one JSON-serializable object (RNG seed + current state, not the full Event log — the log is derived/replayable, not saved, to keep save files small) containing: current Generation (map position, board of Chao, pool, Fruit, Charms, Age budget remaining) and meta-progression (unlocked reincarnation recipes, Difficulty Rank, cosmetic unlocks). A save is just `JSON.stringify(gameState)`; a load is `JSON.parse` plus a schema-version check (see `data-schemas.md` for the versioning field) so future card-set changes don't corrupt old saves silently — unrecognized card IDs in an old save should be reported, not crash the load.

## 9. Multiplayer / async model

Deliberately scoped post-MVP (GDD §9), but designed for here so the MVP architecture doesn't need to be reworked to support it later:

- **Live co-draft:** the draft engine (§6) already models "a seat" as an interface (`pickCard(pack) → Card`) that bots implement. A network-backed seat implementing the same interface (wait for a message, timeout to a bot pick if a player disconnects) is a drop-in replacement — no change to the draft engine itself.
- **Async ghost Rivals:** an Elite/Boss node's opponent board can be sourced from a real player's finished Generation (their final board + pool, snapshotted server-side) instead of a hand-tuned AI board. Because Bout/Race resolution is a pure function of two boards + a seed (§5), "fight a ghost" requires zero new resolver logic — only a new source for where the opposing `Chao[]` comes from.
- Both require a server component (Node, reusing `@chao-draft/sim` per §2) to hold shared draft-session state and a ghost-board store; neither requires real-time netcode, since per pillar #1 there's no real-time input during an event, only during the (turn-based, low-frequency) draft pick itself.

## 10. Performance

Not a significant concern for v1: card counts are small (dozens, not thousands), Race/Bout resolution is a handful of arithmetic operations per Leg/round, and the only rendering load is a small 2D scene (Garden Board) plus standard card-UI DOM. No profiling work is warranted before there's an actual performance complaint from playtesting.
