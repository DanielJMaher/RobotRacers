// Core type surface for @chao-draft/sim, transcribed from
// docs/02-technical/data-schemas.md with a few refinements made during
// implementation (documented inline where they diverge from that doc —
// data-schemas.md has been updated to match).

// ---------------------------------------------------------------------------
// Core enums
// ---------------------------------------------------------------------------

export type StatColor = 'green' | 'red' | 'black' | 'blue' | 'white';
// green=Stamina, red=Run, black=Power, blue=Fly, white=Swim

export type Stat = 'swim' | 'fly' | 'run' | 'power' | 'stamina' | 'mind' | 'luck';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export type BondSlot = 'head' | 'back' | 'hands' | 'feet';

export type SpeciesTag = 'rabbit' | 'bird' | 'fish' | 'reptile' | 'insect' | 'beast' | 'dragon';

export type Alignment = 'hero' | 'dark' | 'neutral';

export type CardType = 'bond' | 'regimen' | 'technique' | 'trait' | 'item' | 'habitat';

// ---------------------------------------------------------------------------
// Effects (shared trigger/effect shape — architecture.md §5.3)
// ---------------------------------------------------------------------------

export type TriggerCondition =
  | { on: 'leg_start'; legType?: 'sprint' | 'obstacle' | 'water' | 'air' }
  | { on: 'leg_won' }
  | { on: 'round_start' }
  | { on: 'on_hit'; as: 'attacker' | 'defender' }
  | { on: 'on_dodge' }
  | { on: 'stamina_below'; fraction: number }
  | { on: 'bout_start' }
  | { on: 'race_start' }
  | { on: 'manual' }; // player-triggered by loading before the event, GDD §6.3

export type EffectOp =
  | { op: 'modifyStat'; stat: Stat; amount: number }
  | { op: 'grantFruit'; amount: number }
  | { op: 'preventDamage'; amount: number | 'all' }
  | { op: 'forceEvade' }
  | { op: 'forceHit' }
  | { op: 'autoWinLeg' }
  | { op: 'autoResolveDNF'; result: 'safe' }
  // Phase 0 escape hatch: several keyword effects in the example card set
  // (e.g. "Rooted", "Overclock", "Unshakeable") don't map cleanly onto the
  // primitives above yet. Real execution semantics are a Phase 1 concern —
  // the Race Leg resolver and Karate Bout resolver (architecture.md §5.2-5.3)
  // are what give these teeth. Until that resolver exists, `custom` lets
  // card data exist and type-check without guessing at premature mechanics.
  | { op: 'custom'; description: string };

export interface TriggeredEffect {
  trigger: TriggerCondition;
  apply: EffectOp[];
  onceLimit?: 'per_round' | 'per_bout' | 'per_race' | 'per_generation';
}

export interface StaticModifier {
  stat: Stat;
  amount: number;
}

export type KeywordEffect = TriggeredEffect; // keywords are just named, reusable TriggeredEffects

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------

export interface CardBase {
  id: string; // stable id, e.g. "bond.bramble_hare"
  name: string;
  rarity: Rarity;
  type: CardType;
  color: StatColor | 'colorless';
  flavorText?: string;
}

export interface StatGrant {
  stat: Stat;
  min: number; // grade-roll floor, GDD §4.3
  max: number; // grade-roll ceiling
}

export interface BondCard extends CardBase {
  type: 'bond';
  slot: BondSlot;
  statGrants: StatGrant[]; // usually 1, sometimes 2 (a primary + minor stat)
  speciesTags: SpeciesTag[]; // 1-2 tags, GDD §5.5
  keyword?: KeywordEffect;
  bodyMutation: string; // asset/animation key for the cosmetic change
}

export interface RegimenCard extends CardBase {
  type: 'regimen';
  statGrants: StatGrant[];
  // no slot, no speciesTags, no bodyMutation — deliberately "just numbers"
}

export interface TechniqueCard extends CardBase {
  type: 'technique';
  energyCost: number;
  scope: 'race' | 'bout';
  effect: TriggeredEffect;
  exileOnUse: boolean; // true for most Legendary techniques, GDD §4.2
}

export interface TraitCard extends CardBase {
  type: 'trait';
  effect: TriggeredEffect;
}

export interface ItemCard extends CardBase {
  type: 'item';
  color: 'colorless';
  effect: TriggeredEffect | StaticModifier;
}

export interface HabitatCard extends CardBase {
  type: 'habitat';
  fixedColors: StatColor[]; // 1 for common Habitats, 2 for e.g. Twin Garden Spring
  fruitPerRound: number;
  splashTaxReduction: number; // 0..1, applied per fixedColor
}

export type Card = BondCard | RegimenCard | TechniqueCard | TraitCard | ItemCard | HabitatCard;

// ---------------------------------------------------------------------------
// Chao
// ---------------------------------------------------------------------------

// REFINEMENT vs. data-schemas.md: that doc originally had `Chao.bondSlots`
// hold a bare `BondCard`. That's not enough to reverse a slot's contribution
// when it gets overwritten (GDD §3.5), because grade rolls are randomized per
// bond (GDD §4.3) — two Chao bonding "the same" card can gain different
// amounts. A BondedCard pairs the static card with the specific roll it got
// this time, so un-bonding is exact subtraction, not a re-roll or a guess.
export interface RolledStatGrant {
  stat: Stat;
  amount: number;
}

export interface BondedCard {
  card: BondCard;
  rolledGrants: RolledStatGrant[];
}

export interface Chao {
  id: string;
  name: string;
  bornGeneration: number; // which run created it (for reincarnation lineage)

  stats: Record<Stat, number>;
  bondSlots: Partial<Record<BondSlot, BondedCard>>;
  traits: TraitCard[]; // max 2, GDD §3.5 / §4.2
  items: ItemCard[]; // freely re-equippable, not slot-limited the same way

  speciesTagCounts: Partial<Record<SpeciesTag, number>>; // derived, for board-wide breakpoints
  colorIdentity: StatColor[]; // derived from bonded card colors, GDD §4.4
  alignment: Alignment; // derived, GDD §3.3
  alignmentValue: number; // -1..1 raw slider, for UI/debug

  evolutionStage: 0 | 1 | 2; // 0=unevolved, 1=first (alignment-based), 2=second (color-based)

  age: number; // consumed against the Generation's Age budget
  happiness: number; // Rest Garden / DNF-tracked, feeds reincarnation check
  currentStamina: number; // hp-pool-in-the-moment, distinct from the base stat
}

// ---------------------------------------------------------------------------
// Draft state
// ---------------------------------------------------------------------------

export interface DraftSeat {
  seatId: string;
  isPlayer: boolean;
  colorAffinity: Record<StatColor, number>; // bot heuristic state, architecture.md §6
  pool: Card[];
}

export interface DraftState {
  seed: number;
  packs: Card[][]; // one array per seat, mutated as picks/passes happen
  seats: DraftSeat[];
  round: number; // which pick number we're on
  packSize: 15;
  packsPerDraft: 3;
  direction: 'left' | 'right'; // alternates per pack, standard MTG draft convention
}

// ---------------------------------------------------------------------------
// Run / Generation state
// ---------------------------------------------------------------------------

export interface MapNode {
  id: string;
  type:
    | 'draft'
    | 'race'
    | 'bout'
    | 'elite'
    | 'kindergarten'
    | 'rest'
    | 'black_market'
    | 'boss';
  connectsTo: string[]; // outgoing node ids
  completed: boolean;
}

export interface Charm {
  id: string;
  name: string;
  effect: TriggeredEffect | StaticModifier;
}

export interface Generation {
  generationNumber: number; // increments each reincarnation, GDD §7.5
  seed: number;

  map: MapNode[];
  currentNodeId: string;

  board: Chao[]; // 2-6, GDD §5.1
  boardLevel: number; // controls board size cap
  pool: Card[]; // shared drafted cards, not yet bonded
  fruit: number;
  charms: Charm[];

  ageBudget: number;
  ageUsed: number;

  winStreak: number; // GDD §5.6
  lossStreak: number;
}

export interface MetaProgression {
  difficultyRank: number;
  unlockedRecipes: string[]; // card ids permanently available at future starts, GDD §7.5
  cosmeticUnlocks: string[];
}

export interface GameState {
  schemaVersion: number; // bump on any breaking shape change — architecture.md §8
  generation: Generation;
  meta: MetaProgression;
}

// ---------------------------------------------------------------------------
// Event log (replay — architecture.md §5.1)
// ---------------------------------------------------------------------------

export type SimEvent =
  | { type: 'grade_roll'; cardId: string; stat: Stat; roll: number }
  | { type: 'turn_order'; chaoId: string; runStat: number; result: 'first' | 'second' }
  | { type: 'hit'; attackerId: string; defenderId: string; damage: number }
  | { type: 'evasion_check'; chaoId: string; roll: number; threshold: number; result: boolean }
  | { type: 'leg_result'; chaoId: string; legType: string; success: boolean }
  | { type: 'dnf'; chaoId: string }
  | { type: 'technique_fired'; cardId: string; chaoId: string }
  | { type: 'trait_fired'; cardId: string; chaoId: string }
  | { type: 'fruit_gained'; amount: number; reason: string };

export interface ResolutionResult {
  finalState: GameState;
  events: SimEvent[]; // fed to the UI for playback, architecture.md §5.1
}
