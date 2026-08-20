// Core type surface for @chao-draft/sim, transcribed from
// docs/02-technical/data-schemas.md with a few refinements made during
// implementation (documented inline where they diverge from that doc —
// data-schemas.md has been updated to match).

// ---------------------------------------------------------------------------
// Core enums
// ---------------------------------------------------------------------------

export type StatColor = 'green' | 'red' | 'black' | 'blue' | 'white';
// green=Stamina, red=Run, black=Power, blue=Fly, white=Swim

// Climb and Jump added 2026-08-20 (roadmap.md Phase 2) — genuinely new,
// dedicated stats, not reflavors of Power/Run (GDD §3.1). They resolve their
// own Leg types alongside, not instead of, Obstacle/Sprint.
export type Stat = 'swim' | 'fly' | 'run' | 'power' | 'stamina' | 'mind' | 'luck' | 'climb' | 'jump';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export type BondSlot = 'head' | 'back' | 'hands' | 'feet';

export type SpeciesTag = 'rabbit' | 'bird' | 'fish' | 'reptile' | 'insect' | 'beast' | 'dragon';

export type Alignment = 'hero' | 'dark' | 'neutral';

export type CardType = 'bond' | 'regimen' | 'technique' | 'trait' | 'item' | 'habitat';

// ---------------------------------------------------------------------------
// Effects (shared trigger/effect shape — architecture.md §5.3)
// ---------------------------------------------------------------------------

// Karate Bout was removed 2026-08-20 (GDD's revision note) — races only.
// `round_start`/`on_hit`/`on_dodge`/`bout_start` are Bout-only trigger kinds
// with no resolver left to fire them; they're kept here (not deleted)
// because existing card data still authors keywords/effects against them
// (packages/sim/src/cards/data/*.ts) and the Phase 2 audit's decision was to
// leave that data dormant pending a real Race-relevant reflavor, not force a
// rewrite of every affected card right now. `stamina_below` survives on its
// own merits — Stamina still depletes across Race Legs, so it's a live,
// reachable trigger under the Race resolver, not a Bout-only leftover.
export type TriggerCondition =
  | { on: 'leg_start'; legType?: 'sprint' | 'obstacle' | 'climb' | 'jump' | 'water' | 'air' }
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
  // Distinct from modifyStat: restores the in-the-moment currentStamina HP
  // pool (clamped at the Chao's base stamina stat), rather than permanently
  // raising that base stat. Added during Phase 1 after discovering
  // meadowFawn's "regen 1 Stamina between legs" keyword had been miscoded as
  // a permanent modifyStat — see packages/sim/src/cards/data/green.ts.
  | { op: 'restoreStamina'; amount: number }
  | { op: 'grantFruit'; amount: number }
  | { op: 'preventDamage'; amount: number | 'all' }
  | { op: 'forceEvade' }
  | { op: 'forceHit' }
  | { op: 'autoWinLeg' }
  | { op: 'autoResolveDNF'; result: 'safe' }
  // Phase 0 escape hatch: several keyword effects in the example card set
  // (e.g. "Rooted", "Overclock", "Unshakeable") don't map cleanly onto the
  // primitives above yet. Real execution semantics are a resolver concern —
  // the Race Leg resolver (architecture.md §5.2) is what gives these teeth.
  // `custom` lets card data exist and type-check without guessing at
  // premature mechanics. Some cards using `preventDamage`/`forceEvade`/
  // `forceHit` were originally authored for the now-removed Karate Bout
  // (see the GDD's 2026-08-20 revision note) — the Race resolver doesn't
  // consume these ops from controlOps either, so they're dormant the same
  // way `custom` ops are, pending a Race-relevant reflavor.
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
  // `scope` (originally 'race' | 'bout') was removed 2026-08-20: with Karate
  // Bout cut, every Technique is Race-scoped, so the field carried no
  // information anymore. Existing cards that were authored as 'bout' are
  // still valid data — see the Phase 2 audit note on EffectOp's `custom`
  // variant for how their dormant effects are handled.
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

// REFINEMENT vs. an earlier draft of this doc/type (see data-schemas.md's
// Phase 1 implementation-status note): `packs`/`round`/`packSize`/
// `packsPerDraft` were originally too under-specified to actually drive a
// tick-by-tick engine (no in-round pick counter, no distinction between
// "packs currently in front of each seat" and pack size as a fixed config
// value). draft/engine.ts is the reference implementation this now matches.
export interface DraftState {
  seed: number; // stored for provenance/debugging only — the live Rng used
  // to open packs is threaded through as a parameter at call sites (see
  // draft/engine.ts's doc comment), never re-derived from this field.
  seats: DraftSeat[];
  currentRound: number; // 0-based, < packsPerDraft
  currentPick: number; // 0-based tick within the current round, < packSize
  packsPerDraft: number; // 3, standard MTG draft convention
  packSize: number; // spell cards only — the bonus Habitat isn't part of what circulates, see draft/pool.ts
  packsInFront: Card[][]; // index i = the pack currently in front of seat i; empty between rounds
  direction: 'left' | 'right'; // this round's pass direction — alternates each round
  isComplete: boolean;
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

// `turn_order`/`hit`/`evasion_check` were removed 2026-08-20 along with
// Karate Bout — unlike the dormant-but-kept TriggerCondition/EffectOp
// variants above, no card data anywhere references these SimEvent kinds
// directly (cards author triggers and ops, not log events), and no
// resolver produces them anymore now that bout.ts is deleted, so there's
// nothing "dormant" to preserve — they were purely Bout's own output shape.
export type SimEvent =
  | { type: 'grade_roll'; cardId: string; stat: Stat; roll: number }
  | { type: 'leg_result'; chaoId: string; legType: string; success: boolean }
  | { type: 'dnf'; chaoId: string }
  | { type: 'technique_fired'; cardId: string; chaoId: string }
  | { type: 'trait_fired'; cardId: string; chaoId: string }
  // Added during Phase 1 (see roadmap.md): Bond Card keywords fire during
  // Race/Bout resolution exactly like Traits and Techniques do (they share
  // the same TriggeredEffect shape), but weren't given their own event kind
  // in the original data-schemas.md pass — trait_fired doesn't fit since a
  // Bond keyword isn't a Trait Card.
  | { type: 'keyword_fired'; cardId: string; chaoId: string }
  | { type: 'fruit_gained'; amount: number; reason: string };

export interface ResolutionResult {
  finalState: GameState;
  events: SimEvent[]; // fed to the UI for playback, architecture.md §5.1
}
