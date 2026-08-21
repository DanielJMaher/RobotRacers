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

// Renamed from BondSlot 2026-08-20 (GDD §3.5, corrected): these were
// originally 4 exclusive slots (one card each, replacing on rebond). They're
// now accumulation buckets a card's stat grants can be tagged with — any
// number of cards can touch the same region. 5 regions, locked: the
// original 4 (head/back/hands/feet) become head/back/arms/legs, plus a new
// torso region. `hands`→`arms` and `feet`→`legs` are renames, not new ideas.
export type BodyRegion = 'legs' | 'arms' | 'back' | 'head' | 'torso';

export type SpeciesTag = 'rabbit' | 'bird' | 'fish' | 'reptile' | 'insect' | 'beast' | 'dragon';

export type Alignment = 'hero' | 'dark' | 'neutral';

// 'seed' added 2026-08-20 (roadmap.md Phase 4, GDD §6.9's revived economy).
// 'potion' renamed from 'regimen' 2026-08-20.
export type CardType = 'bond' | 'potion' | 'technique' | 'trait' | 'item' | 'habitat' | 'seed';

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
  // Added 2026-08-21 (roadmap.md Phase 5.9 — "hook Traits into races"):
  // fires once at the very end of resolveRace, after the last Leg — the
  // counterpart to race_start. This is what backs "if you complete the
  // Race, ..." style cards (e.g. white.ts's Still Waters) — deliberately a
  // plain "the Race is over" check rather than a one-off "...without using
  // a Technique" condition some cards were originally flavored around,
  // since that needs whole-race event history a single TriggerCondition
  // predicate isn't set up to see. Originally carried an `outcome:
  // 'finished' | 'dnf'` field to distinguish the two ways a Race could end;
  // removed the same day DNF itself was removed (below) — every Race now
  // always finishes, so there was nothing left to distinguish.
  | { on: 'race_end' }
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
  // Added 2026-08-20 (GDD §3.5): a special-traversal/shortcut mechanic for
  // creature-flavored cards (e.g. "Elephant walks the riverbed instead of
  // swimming") — deliberately separate from the existing Fly/Swim fork
  // threshold check (race.ts's LegFork) rather than an extension of it, so a
  // card can grant a wholly different way to clear a Leg. `legType` reuses
  // the same inlined leg-type union as `leg_start`'s above rather than
  // importing LegType from events/race.ts, for the same reason noted there
  // (types.ts is foundational; race.ts depends on it, not the reverse).
  // `altStat` added 2026-08-21 when this op was finally wired up in
  // race.ts (it shipped as a type-only placeholder before that, per the
  // note this replaces): the stat the Leg is actually checked against
  // instead of its normal one (LEG_STAT in race.ts), at the same
  // difficulty — e.g. an Elephant checks Power instead of Swim on a Water
  // Leg because it walks the riverbed rather than swimming across.
  | {
      op: 'grantAlternateRoute';
      legType: 'sprint' | 'obstacle' | 'climb' | 'jump' | 'water' | 'air';
      altStat: Stat;
      description: string;
    }
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
  min: number; // grade-roll floor, GDD §4.3 — CAN be negative (GDD §3.5: a
  // card can carry drawbacks; negatives are always smaller in magnitude
  // than a card's positives, an authoring rule, not a type-level constraint)
  max: number; // grade-roll ceiling — can also be negative, if min is too
  region?: BodyRegion; // which Body Region this grant is tagged to (GDD
  // §3.5). Set on BondCard grants; omitted on PotionCard grants, which
  // have no body/cosmetic effect at all (GDD §4.2 — "no slot... deliberately
  // 'just numbers'"). Optional rather than required because of that split.
}

export interface BondCard extends CardBase {
  type: 'bond';
  // No single `slot` field anymore (GDD §3.5, corrected 2026-08-20) — a
  // card can touch multiple Body Regions at once; each StatGrant carries
  // its own region tag instead. Bonding is cumulative and unbounded: any
  // number of Bond Cards can be bonded over a Chao's life, all stacking,
  // never replacing (see Chao.bondedCards below).
  statGrants: StatGrant[]; // 1+ grants, each independently regioned and signed
  speciesTags: SpeciesTag[]; // 1-2 tags, GDD §5.5
  keyword?: KeywordEffect;
  // One cosmetic mutation per Body Region this card touches — replaces the
  // old single `bodyMutation: string` field, since one card can now affect
  // several regions at once (GDD §3.5's Penguin example: Legs, Arms, Back).
  bodyMutations: Partial<Record<BodyRegion, string>>;
}

// Renamed from RegimenCard 2026-08-20 — the "feed it fruit" side of the
// original design (as opposed to Bond Cards' "feed it an animal"): a
// permanent, one-time flat stat grant, deliberately "just numbers" — no
// slot, no speciesTags, no bodyMutation, no color-identity/splash-tax
// effect (GDD §3.3 — consumed, not attached).
export interface PotionCard extends CardBase {
  type: 'potion';
  statGrants: StatGrant[];
  // Blending (added 2026-08-20): a Potion can span up to 2 EXTRA colors
  // beyond its primary `color`, for up to 3 total — omitted entirely for a
  // mono Potion (the common case). Rarity gates how many, mirroring Bond
  // Cards' own rarity-gated complexity (GDD §3.5): Common = mono only,
  // Uncommon = mono or a 2-color blend, Rare = 2- or 3-color, Legendary =
  // 3-color (the biggest splash). A working default, not deeply tuned.
  secondaryColors?: StatColor[]; // 0-2 entries
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
  // Base Fruit generated per trigger by a single (1-star) placed Habitat —
  // GDD §6.9's revived economy: 2 per trigger, at Tournament start and after
  // every race. `splashTaxReduction` (a per-card tax-discount stat) was the
  // pre-revival design and no longer applies now that Fruit itself funds the
  // splash tax directly (GDD §4.4) — removed 2026-08-20 rather than left
  // dormant, since nothing in the revived design reads it.
  fruitPerRound: number;
}

// New 2026-08-20 (roadmap.md Phase 4, GDD §6.9): a Seed converts 1 unit of a
// planted Habitat Slot's Fruit output to this color. Drafted from both the
// Draft Booster and the Environment Interlude Booster, like any other card.
// One-time plant, no replanting (tournament/environment.ts enforces this by
// removing a planted Seed from the player's pool of plantable Seeds).
// NOTE: Fruit itself is tracked as a single pooled number, not per-color
// (GDD §4.4's splash tax was decided 2026-08-20 to be color-agnostic) — so a
// planted Seed's `color` is flavor/display only for now (it changes what a
// Habitat Slot visibly produces, per GDD §6.9's worked examples) and doesn't
// change the total Fruit a trigger generates. Only Habitat star level does.
export interface SeedCard extends CardBase {
  type: 'seed';
  color: StatColor;
}

export type Card =
  | BondCard
  | PotionCard
  | TechniqueCard
  | TraitCard
  | ItemCard
  | HabitatCard
  | SeedCard;

// ---------------------------------------------------------------------------
// Chao
// ---------------------------------------------------------------------------

// A BondedCard pairs the static card with the specific rolled amount it got
// this time — needed because grade rolls are randomized per bond (GDD §4.3),
// so two Chao bonding "the same" card can gain different amounts.
export interface RolledStatGrant {
  stat: Stat;
  amount: number; // can be negative — see StatGrant's doc comment
  region?: BodyRegion; // carried through from the StatGrant this was rolled from
}

export interface BondedCard {
  card: BondCard;
  rolledGrants: RolledStatGrant[];
  // Set when this entry came from Awakening (GDD §4.6, roadmap.md) — 3
  // copies of the same card fused into one 3.5x-average-grant application —
  // rather than a normal single bond. Flavor/history-display only; doesn't
  // change how the grants themselves are folded into stats/derived fields.
  awakened?: boolean;
}

export interface Chao {
  id: string;
  name: string;
  bornGeneration: number; // which run created it (for reincarnation lineage)

  stats: Record<Stat, number>;
  // REPLACES the old `bondSlots: Partial<Record<BondSlot, BondedCard>>`
  // (GDD §3.5, corrected 2026-08-20). That was a 4-slot exclusive record —
  // bonding a new card into an occupied slot deleted the old one, which was
  // simply wrong: any number of Bond Cards can be bonded over a Chao's
  // life, and every one keeps contributing. This is that full, append-only
  // history — nothing is ever removed from it.
  bondedCards: BondedCard[];
  traits: TraitCard[]; // max 2, GDD §3.5 / §4.2
  items: ItemCard[]; // freely re-equippable, not slot-limited the same way

  speciesTagCounts: Partial<Record<SpeciesTag, number>>; // derived, for board-wide breakpoints
  colorIdentity: StatColor[]; // derived from bonded card colors, GDD §4.4
  alignment: Alignment; // derived, GDD §3.3
  alignmentValue: number; // -1..1 raw slider, for UI/debug
  // NEW 2026-08-20 (GDD §3.5): per-region cosmetic look, derived — for each
  // Body Region, whichever Species Tag has the most accumulated
  // contributions to that region "wins," and this holds that tag's
  // bodyMutation string. Discrete top-contributor-wins, not a rendered
  // blend (decided 2026-08-20 — a true blend needs a production art
  // pipeline that isn't being built). Absent regions have no bonded
  // contribution yet.
  regionLooks: Partial<Record<BodyRegion, string>>;

  evolutionStage: 0 | 1 | 2; // 0=unevolved, 1=first (alignment-based), 2=second (color-based)
  // Set once, at the moment each Evolution triggers (Tournament roadmap.md
  // Phase 3, GDD §3.4) — frozen thereafter, independent of any later drift in
  // the live `alignment`/color-identity fields above. The "small passive"
  // GDD §3.4 mentions each Evolution granting is an explicit open TODO, not
  // implemented here — this only locks in the cosmetic/flavor identity.
  evolvedAlignment?: Alignment; // First Evolution: alignment at that moment
  evolvedColor?: StatColor; // Second Evolution: dominant bonded color at that moment

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
// `dnf` was removed 2026-08-21, per the user's direct request ("remove the
// entire DNF crap - we are not looking for DNFs") — resolveRace no longer
// ever cuts a Race short, so there's no DNF outcome left to log at all.
export type SimEvent =
  | { type: 'grade_roll'; cardId: string; stat: Stat; roll: number }
  // `stat`/`difficulty` added for the race-timing follow-up (roadmap.md) —
  // whichever stat/difficulty actually decided this Leg (the fork's
  // shortcut check if taken, the leg's own otherwise), so a display-only
  // timing computation doesn't need to re-derive fork logic.
  | { type: 'leg_result'; chaoId: string; legType: string; success: boolean; stat: Stat; difficulty: number }
  | { type: 'technique_fired'; cardId: string; chaoId: string }
  | { type: 'trait_fired'; cardId: string; chaoId: string }
  // Added during Phase 1 (see roadmap.md): Bond Card keywords fire during
  // Race/Bout resolution exactly like Traits and Techniques do (they share
  // the same TriggeredEffect shape), but weren't given their own event kind
  // in the original data-schemas.md pass — trait_fired doesn't fit since a
  // Bond keyword isn't a Trait Card.
  | { type: 'keyword_fired'; cardId: string; chaoId: string }
  // Added 2026-08-21 alongside Item equipping (chao/bonding.ts) — an
  // equipped Item's TriggeredEffect (as opposed to a passive
  // StaticModifier, applied silently at equip time) firing during a Race,
  // same idea as trait_fired/keyword_fired for their own card kinds.
  | { type: 'item_fired'; cardId: string; chaoId: string }
  | { type: 'fruit_gained'; amount: number; reason: string };

export interface ResolutionResult {
  finalState: GameState;
  events: SimEvent[]; // fed to the UI for playback, architecture.md §5.1
}
