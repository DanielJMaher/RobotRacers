import type { Rng } from '../rng';
import type { BondCard, Chao, HabitatCard, SeedCard, StatColor } from '../types';
import { bondCard, type BondResult, computeSplashTax } from '../chao/bonding';

// The Environment (GDD §6.9, roadmap.md Phase 4) — separate from the Chao,
// scoped to a single Chao's support structure. Exactly 3 Habitat Slots; a
// filled slot generates Fruit of its color at Tournament start and after
// every race. Fruit itself is tracked as a single pooled number, not
// per-color (splash tax was decided 2026-08-20 to be color-agnostic, see
// types.ts's SeedCard doc comment) — a Habitat/Seed's *color* is flavor and
// what the UI displays a slot as producing, but only star level changes how
// much Fruit a trigger actually generates.

export interface HabitatSlot {
  color: StatColor; // from whichever HabitatCard(s) were placed here
  starLevel: 1 | 2; // 2 after combining 3 same-color Habitat cards... in practice 2, since only 3 Habitat cards are ever drawn total (one per main-draft pack) and 2-star combining consumes 2 of them, GDD §6.9
  seedSlots: number; // 1 at star 1, 2 at star 2
  plantedSeedColors: StatColor[]; // 0..seedSlots, display-only (see module doc comment)
}

export interface Environment {
  slots: (HabitatSlot | undefined)[]; // exactly 3; undefined = an "Open Fort" empty slot
  unplacedHabitats: HabitatCard[]; // drawn (via the Draft Booster's bonus pull) but not yet placed
  availableSeeds: SeedCard[]; // drafted (main Booster or either Interlude) but not yet planted
  fruit: number; // pooled, spendable on splash tax
}

const SLOT_COUNT = 3;
const BASE_HABITAT_FRUIT = 2; // GDD §6.9: base rate, 1-star Habitat
const COMBINED_HABITAT_BONUS_FRUIT = 1; // +1 base Fruit at 2-star (3 total)
const OPEN_FORT_FRUIT = 1; // Wildcard Fruit, half a filled slot's base volume

// Flat splash-tax cost for bonding an off-color card (GDD §4.4) — exact
// tuning is explicit Phase 6 balance work (same status as computeSplashTax's
// own doc comment); this is just a first-draft placeholder callers can use
// rather than each inventing their own number.
export const DEFAULT_SPLASH_TAX = 3;

export function createEnvironment(drawnHabitats: HabitatCard[]): Environment {
  return {
    slots: new Array(SLOT_COUNT).fill(undefined),
    unplacedHabitats: drawnHabitats,
    availableSeeds: [],
    fruit: 0,
  };
}

// Records a newly-drafted Seed card as available to plant — called whenever
// the main Draft Booster or either Environment Interlude Booster hands the
// player a Seed. Kept separate from `unplacedHabitats`/`fruit` bookkeeping
// but the same pattern: Seeds, unlike Bond/Regimen cards, are consumed by
// planting (GDD §6.9 — "one-time plant, no replanting"), so they can't just
// live forever in the shared drafted pool the way repeatedly-bondable Bond
// Cards do.
export function addAvailableSeed(environment: Environment, seed: SeedCard): Environment {
  return { ...environment, availableSeeds: [...environment.availableSeeds, seed] };
}

function habitatColorOf(card: HabitatCard): StatColor {
  const color = card.fixedColors[0];
  if (color === undefined) {
    throw new Error(`habitatColorOf: ${card.id} has no fixedColors`);
  }
  return color;
}

// True iff placing `unplacedHabitats[cardIndex]` into `slots[slotIndex]`
// would succeed — either the slot is empty (Open Fort), or it already holds
// a 1-star Habitat of the exact same color (combining into 2-star). Meant
// for the UI to disable invalid placements rather than relying on
// placeHabitatCard's thrown errors for control flow.
export function canPlaceHabitatCard(environment: Environment, cardIndex: number, slotIndex: number): boolean {
  const card = environment.unplacedHabitats[cardIndex];
  if (card === undefined) return false;
  const existingSlot = environment.slots[slotIndex];
  if (existingSlot === undefined) return true;
  return existingSlot.color === habitatColorOf(card) && existingSlot.starLevel === 1;
}

// Places one of the still-unplaced drafted Habitat cards into a slot.
// Placement is permanent (GDD §6.9): a filled slot can only be grown
// (combined with a matching-color card), never swapped for a different one.
// Placing a 2nd same-color card onto an already-filled 1-star slot combines
// them into a 2-star Habitat in that same slot (mirrors Awakening's 3-of-a-
// kind fusion concept, §4.6 — Awakening itself isn't implemented yet, so
// this is a standalone implementation, not literally shared code with it).
export function placeHabitatCard(environment: Environment, cardIndex: number, slotIndex: number): Environment {
  if (!canPlaceHabitatCard(environment, cardIndex, slotIndex)) {
    throw new Error(
      `placeHabitatCard: cannot place card ${cardIndex} into slot ${slotIndex} (placement is permanent, GDD §6.9)`,
    );
  }
  const card = environment.unplacedHabitats[cardIndex]!;
  const existingSlot = environment.slots[slotIndex];
  const color = habitatColorOf(card);
  const nextSlot: HabitatSlot =
    existingSlot === undefined
      ? { color, starLevel: 1, seedSlots: 1, plantedSeedColors: [] }
      : { ...existingSlot, starLevel: 2, seedSlots: 2 };

  return {
    ...environment,
    slots: environment.slots.map((slot, i) => (i === slotIndex ? nextSlot : slot)),
    unplacedHabitats: environment.unplacedHabitats.filter((_, i) => i !== cardIndex),
  };
}

// True iff `slots[slotIndex]` is filled and has an open Seed slot.
export function canPlantSeed(environment: Environment, slotIndex: number): boolean {
  const slot = environment.slots[slotIndex];
  return slot !== undefined && slot.plantedSeedColors.length < slot.seedSlots;
}

// Plants one of the still-available drafted Seed cards into a filled slot
// with an open Seed slot (GDD §6.9) — one-time, removes the Seed from
// `availableSeeds` so it can't be replanted elsewhere.
export function plantSeed(environment: Environment, seedIndex: number, slotIndex: number): Environment {
  const seed = environment.availableSeeds[seedIndex];
  if (seed === undefined) {
    throw new Error(`plantSeed: no available Seed card at index ${seedIndex}`);
  }
  if (!canPlantSeed(environment, slotIndex)) {
    throw new Error(`plantSeed: slot ${slotIndex} has no open Seed slot`);
  }
  const slot = environment.slots[slotIndex]!;
  const nextSlot: HabitatSlot = { ...slot, plantedSeedColors: [...slot.plantedSeedColors, seed.color] };
  return {
    ...environment,
    slots: environment.slots.map((s, i) => (i === slotIndex ? nextSlot : s)),
    availableSeeds: environment.availableSeeds.filter((_, i) => i !== seedIndex),
  };
}

function slotFruitPerTrigger(slot: HabitatSlot | undefined): number {
  if (slot === undefined) return OPEN_FORT_FRUIT;
  return BASE_HABITAT_FRUIT + (slot.starLevel === 2 ? COMBINED_HABITAT_BONUS_FRUIT : 0);
}

// Fires at Tournament start and after every race (GDD §6.9) — sums every
// slot's per-trigger output (filled or Open Fort) into the pooled balance.
export function triggerFruitGain(environment: Environment): Environment {
  const gain = environment.slots.reduce((sum, slot) => sum + slotFruitPerTrigger(slot), 0);
  return { ...environment, fruit: environment.fruit + gain };
}

export interface SplashBondResult extends BondResult {
  environment: Environment;
  ok: boolean; // false = insufficient Fruit; chao/environment are returned unchanged
  taxPaid: number;
}

// Bonds a Bond Card, paying its splash tax (GDD §4.4) from the Environment's
// pooled Fruit if the card is off the Chao's current color identity —
// decided 2026-08-20: pooled (not per-color) Fruit, hard block if short. A
// thin wrapper over chao/bonding.ts's bondCard(), which stays color-tax-
// agnostic — layering this on top keeps that existing, tested engine
// primitive untouched.
export function bondCardWithSplashTax(
  chao: Chao,
  environment: Environment,
  card: BondCard,
  baseTax: number,
  rng: Rng,
): SplashBondResult {
  const tax = computeSplashTax(chao, card, baseTax);
  if (tax > environment.fruit) {
    return { chao, environment, events: [], ok: false, taxPaid: 0 };
  }
  const { chao: bonded, events } = bondCard(chao, card, rng);
  return {
    chao: bonded,
    environment: { ...environment, fruit: environment.fruit - tax },
    events,
    ok: true,
    taxPaid: tax,
  };
}
