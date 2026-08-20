# Data Schemas

Concrete TypeScript shapes for the core entities described in the [GDD](../01-design/game-design-document.md) and [architecture doc](architecture.md). These are illustrative, not final production types — treat them as the "this is precise enough to start building against" checkpoint. All types are plain data (no class methods), per the architecture doc's rule that `packages/sim` stays serializable and framework-free.

## Core enums

```typescript
type StatColor = "green" | "red" | "black" | "blue" | "white";
// green=Stamina, red=Run, black=Power, blue=Fly, white=Swim

type Stat = "swim" | "fly" | "run" | "power" | "stamina" | "mind" | "luck";

type Rarity = "common" | "uncommon" | "rare" | "legendary";

type BondSlot = "head" | "back" | "hands" | "feet";

type SpeciesTag =
  | "rabbit" | "bird" | "fish" | "reptile" | "insect" | "beast" | "dragon";

type Alignment = "hero" | "dark" | "neutral";

type CardType =
  | "bond" | "regimen" | "technique" | "trait" | "item" | "habitat";
```

## Cards

```typescript
interface CardBase {
  id: string;              // stable id, e.g. "bond.bramble_hare"
  name: string;
  rarity: Rarity;
  type: CardType;
  color: StatColor | "colorless";
  flavorText?: string;
}

interface StatGrant {
  stat: Stat;
  min: number;              // grade-roll floor, GDD §4.3
  max: number;               // grade-roll ceiling
}

interface BondCard extends CardBase {
  type: "bond";
  slot: BondSlot;
  statGrants: StatGrant[];   // usually 1, sometimes 2 (a primary + minor stat)
  speciesTags: SpeciesTag[]; // 1-2 tags, GDD §5.5
  keyword?: KeywordEffect;    // e.g. "Graze", "Bulwark" — see Effects below
  bodyMutation: string;       // asset/animation key for the cosmetic change
}

interface RegimenCard extends CardBase {
  type: "regimen";
  statGrants: StatGrant[];
  // no slot, no speciesTags, no bodyMutation — deliberately "just numbers"
}

interface TechniqueCard extends CardBase {
  type: "technique";
  energyCost: number;
  scope: "race" | "bout";
  effect: TriggeredEffect;
  exileOnUse: boolean;        // true for most Legendary techniques, GDD §4.2
}

interface TraitCard extends CardBase {
  type: "trait";
  effect: TriggeredEffect;
}

interface ItemCard extends CardBase {
  type: "item";
  color: "colorless";
  effect: TriggeredEffect | StaticModifier;
}

interface HabitatCard extends CardBase {
  type: "habitat";
  fixedColors: StatColor[];    // 1 for common Habitats, 2 for e.g. Twin Garden Spring
  fruitPerRound: number;
  splashTaxReduction: number;  // 0..1, applied per fixedColor
}

type Card =
  | BondCard | RegimenCard | TechniqueCard | TraitCard | ItemCard | HabitatCard;
```

## Effects (shared trigger/effect shape — architecture.md §5.3)

```typescript
type TriggerCondition =
  | { on: "leg_start"; legType?: "sprint" | "obstacle" | "water" | "air" }
  | { on: "leg_won" }
  | { on: "round_start" }
  | { on: "on_hit"; as: "attacker" | "defender" }
  | { on: "on_dodge" }
  | { on: "stamina_below"; fraction: number }
  | { on: "bout_start" }
  | { on: "race_start" }
  | { on: "manual" };  // player-triggered by loading before the event, GDD §6.3

interface TriggeredEffect {
  trigger: TriggerCondition;
  apply: EffectOp[];         // small ordered list of primitive ops, e.g.
                              // [{ op: "modifyStat", stat: "run", amount: 2 }]
  onceLimit?: "per_round" | "per_bout" | "per_race" | "per_generation";
}

interface StaticModifier {
  stat: Stat;
  amount: number;
}

type EffectOp =
  | { op: "modifyStat"; stat: Stat; amount: number }
  | { op: "grantFruit"; amount: number }
  | { op: "preventDamage"; amount: number | "all" }
  | { op: "forceEvade" }
  | { op: "forceHit" }
  | { op: "autoWinLeg" }
  | { op: "autoResolveDNF"; result: "safe" };

type KeywordEffect = TriggeredEffect; // keywords are just named, reusable TriggeredEffects
```

## Chao

```typescript
interface Chao {
  id: string;
  name: string;
  bornGeneration: number;         // which run created it (for reincarnation lineage)

  stats: Record<Stat, number>;
  bondSlots: Partial<Record<BondSlot, BondCard>>;
  traits: TraitCard[];             // max 2, GDD §3.5 / §4.2
  items: ItemCard[];               // freely re-equippable, not slot-limited the same way

  speciesTagCounts: Partial<Record<SpeciesTag, number>>; // derived, for board-wide breakpoints
  colorIdentity: StatColor[];      // derived from bonded card colors, GDD §4.4
  alignment: Alignment;             // derived, GDD §3.3
  alignmentValue: number;           // -1..1 raw slider, for UI/debug

  evolutionStage: 0 | 1 | 2;        // 0=unevolved, 1=first (alignment-based), 2=second (color-based)

  age: number;                      // consumed against the Generation's Age budget
  happiness: number;                // Rest Garden / DNF-tracked, feeds reincarnation check
  currentStamina: number;           // hp-pool-in-the-moment, distinct from the base stat
}
```

## Draft state

```typescript
interface DraftSeat {
  seatId: string;
  isPlayer: boolean;
  colorAffinity: Record<StatColor, number>; // bot heuristic state, architecture.md §6
  pool: Card[];
}

interface DraftState {
  seed: number;
  packs: Card[][];                 // one array per seat, mutated as picks/passes happen
  seats: DraftSeat[];
  round: number;                    // which pick number we're on
  packSize: 15;
  packsPerDraft: 3;
  direction: "left" | "right";      // alternates per pack, standard MTG draft convention
}
```

## Run / Generation state

```typescript
interface MapNode {
  id: string;
  type: "draft" | "race" | "bout" | "elite" | "kindergarten"
      | "rest" | "black_market" | "boss";
  connectsTo: string[];             // outgoing node ids
  completed: boolean;
}

interface Charm {
  id: string;
  name: string;
  effect: TriggeredEffect | StaticModifier;
}

interface Generation {
  generationNumber: number;         // increments each reincarnation, GDD §7.5
  seed: number;

  map: MapNode[];
  currentNodeId: string;

  board: Chao[];                    // 2-6, GDD §5.1
  boardLevel: number;                // controls board size cap
  pool: Card[];                      // shared drafted cards, not yet bonded
  fruit: number;
  charms: Charm[];

  ageBudget: number;
  ageUsed: number;

  winStreak: number;                 // GDD §5.6
  lossStreak: number;
}

interface MetaProgression {
  difficultyRank: number;
  unlockedRecipes: string[];         // card ids permanently available at future starts, GDD §7.5
  cosmeticUnlocks: string[];
}

interface GameState {
  schemaVersion: number;             // bump on any breaking shape change — architecture.md §8
  generation: Generation;
  meta: MetaProgression;
}
```

## Event log (replay — architecture.md §5.1)

```typescript
type SimEvent =
  | { type: "grade_roll"; cardId: string; stat: Stat; roll: number }
  | { type: "turn_order"; chaoId: string; runStat: number; result: "first" | "second" }
  | { type: "hit"; attackerId: string; defenderId: string; damage: number }
  | { type: "evasion_check"; chaoId: string; roll: number; threshold: number; result: boolean }
  | { type: "leg_result"; chaoId: string; legType: string; success: boolean }
  | { type: "dnf"; chaoId: string }
  | { type: "technique_fired"; cardId: string; chaoId: string }
  | { type: "trait_fired"; cardId: string; chaoId: string }
  | { type: "fruit_gained"; amount: number; reason: string };

interface ResolutionResult {
  finalState: GameState;
  events: SimEvent[];               // fed to the UI for playback, architecture.md §5.1
}
```

## Notes on using these shapes

- **Derived fields aren't stored redundantly where avoidable** (`colorIdentity`, `alignment`, `speciesTagCounts` on `Chao` are computed from `bondSlots`/`traits`/`items`) — but they're listed as fields here rather than pure getters because the sim core is plain-data/no-class per the architecture doc; treat them as fields that a `recomputeDerived(chao)` pure function refreshes after every bonding/unbonding operation, not fields any code writes to directly.
- **`ResolutionResult` is the only return shape** for `resolveRace` and `resolveBout` — both always return the new state *and* the event log together, so the "legibility" architectural requirement (architecture.md §5.1) can never accidentally be dropped by a call site that only wanted the final state.
- These types intentionally don't yet cover breeding (GDD §8, explicitly post-MVP) — when that's picked up, it'll need an `Egg` type carrying two-parent allele data, deferred until it's actually being built.
