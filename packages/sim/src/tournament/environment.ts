import type { Rng } from '../rng';
import type { BondCard, Chao, HabitatCard, PotionCard, Rarity, SeedCard, SimEvent, StatColor } from '../types';
import { awakenBondCard, bondCard, type BondResult, computeSplashTax, consumePotion } from '../chao/bonding';

// The Environment (GDD §6.9, roadmap.md Phase 4) — separate from the Chao,
// scoped to a single Chao's support structure. Exactly 3 Habitat Slots; a
// filled slot generates Fruit of its color at Tournament start and after
// every race.
//
// Fruit is now tracked PER COLOR (playtest-prep, revised 2026-08-21, per the
// user's own direct request) — this replaces the earlier "single pooled
// number, color-agnostic" decision (GDD §4.4/§6.9's original implementation
// note). That simplification meant a Seed's color and a Habitat's own color
// were flavor/display only; both are now real, since a slot's per-trigger
// yield lands in its own color's bucket, and a planted Seed genuinely
// converts 1 unit of that yield to the Seed's color (capped by seedSlots, so
// a Habitat always keeps at least 1 unit of its native color — GDD §6.9).

export interface HabitatSlot {
  color: StatColor; // from whichever HabitatCard(s) were placed here
  starLevel: 1 | 2; // 2 after combining 3 same-color Habitat cards... in practice 2, since only 3 Habitat cards are ever drawn total (one per main-draft pack) and 2-star combining consumes 2 of them, GDD §6.9
  seedSlots: number; // 1 at star 1, 2 at star 2
  plantedSeedColors: StatColor[]; // 0..seedSlots — now genuinely converts output, see slotFruitByColor
}

// A per-color Fruit balance. 'colorless' is Wildcard Fruit (from an Open
// Fort slot, or the flat Tournament-start bonus, §6.9) — the only bucket
// splash tax (off-color surcharge) ever draws from, see bondCardWithSplashTax.
export type FruitPool = Record<StatColor | 'colorless', number>;

function emptyFruitPool(): FruitPool {
  return { green: 0, red: 0, black: 0, blue: 0, white: 0, colorless: 0 };
}

export interface Environment {
  slots: (HabitatSlot | undefined)[]; // exactly 3; undefined = an "Open Fort" empty slot
  unplacedHabitats: HabitatCard[]; // drawn (via the Draft Booster's bonus pull) but not yet placed
  availableSeeds: SeedCard[]; // drafted (main Booster or either Interlude) but not yet planted
  fruit: FruitPool;
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

// A per-card-rarity base Fruit cost, paid in the card's own color, for
// bonding/consuming/awakening it at all (playtest-prep, added 2026-08-21,
// per the user's direct request: "when we use a card we are paying the
// card's cost in the appropriate colored fruit... there needs to be a cost
// benefit struggle"). Every card used to be free on-color — only reaching
// off-identity ever cost anything. First-draft placeholder numbers, same
// tuning status as DEFAULT_SPLASH_TAX and everything else in this file;
// real per-creature costs (a cheap Otter vs. an expensive Dolphin) are
// GDD §3.2's still-pending 50-creature pass, not this one.
export const FRUIT_COST_BY_RARITY: Record<Rarity, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  legendary: 4,
};

// Awakening fuses 3 copies at once (GDD §4.6) — costs 3x a single copy's
// base Fruit cost, proportional to consuming 3 creatures in one application,
// but only ONE splash-tax charge (it's one bonding event, same as a normal
// bond only ever pays tax once).
const AWAKEN_COST_MULTIPLIER = 3;

export function createEnvironment(drawnHabitats: HabitatCard[]): Environment {
  return {
    slots: new Array(SLOT_COUNT).fill(undefined),
    unplacedHabitats: drawnHabitats,
    availableSeeds: [],
    fruit: emptyFruitPool(),
  };
}

// Records a newly-drafted Seed card as available to plant — called whenever
// the main Draft Booster or either Environment Interlude Booster hands the
// player a Seed. Kept separate from `unplacedHabitats`/`fruit` bookkeeping
// but the same pattern: Seeds are consumed by planting (GDD §6.9 —
// "one-time plant, no replanting"), same one-time-use lifecycle Bond/Potion
// cards now also follow (roadmap.md Phase 5.5) — this bookkeeping predates
// that change and was already modeling a spend-once card correctly.
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

// Per-slot yield, broken down by color. A slot's `seedSlots` is always
// exactly (total units - 1), so capping conversions at `plantedSeedColors`
// (already capped by canPlantSeed/plantSeed) automatically leaves at least 1
// unit of the Habitat's own color untouched — no separate clamp needed.
function slotFruitByColor(slot: HabitatSlot | undefined): Partial<FruitPool> {
  if (slot === undefined) return { colorless: OPEN_FORT_FRUIT };
  const totalUnits = BASE_HABITAT_FRUIT + (slot.starLevel === 2 ? COMBINED_HABITAT_BONUS_FRUIT : 0);
  const nativeUnits = totalUnits - slot.plantedSeedColors.length;
  const result: Partial<FruitPool> = { [slot.color]: nativeUnits };
  for (const seedColor of slot.plantedSeedColors) {
    result[seedColor] = (result[seedColor] ?? 0) + 1;
  }
  return result;
}

function addPerColor(fruit: FruitPool, perColor: Partial<FruitPool>, multiplier: number): FruitPool {
  const next = { ...fruit };
  for (const [color, amount] of Object.entries(perColor) as [keyof FruitPool, number][]) {
    next[color] += amount * multiplier;
  }
  return next;
}

// Fires after every race (GDD §6.9) — sums every slot's per-trigger output
// (filled or Open Fort) into its own color's bucket, unchanged rate. See
// triggerInitialFruitGain for the doubled, Tournament-start-only version.
export function triggerFruitGain(environment: Environment): Environment {
  let fruit = environment.fruit;
  for (const slot of environment.slots) {
    fruit = addPerColor(fruit, slotFruitByColor(slot), 1);
  }
  return { ...environment, fruit };
}

// Tournament-start only (playtest-prep, requested 2026-08-21): double the
// normal per-slot yield, plus a flat colorless Wildcard bonus on top — a
// real opening budget so the player can actually afford to use their
// drafted pool once card costs are real (see FRUIT_COST_BY_RARITY below).
// Deliberately NOT used for the recurring after-every-race trigger, which
// stays at the normal rate via triggerFruitGain above.
const INITIAL_FRUIT_MULTIPLIER = 2;
const INITIAL_FLAT_COLORLESS_BONUS = 4;

export function triggerInitialFruitGain(environment: Environment): Environment {
  let fruit = environment.fruit;
  for (const slot of environment.slots) {
    fruit = addPerColor(fruit, slotFruitByColor(slot), INITIAL_FRUIT_MULTIPLIER);
  }
  fruit = { ...fruit, colorless: fruit.colorless + INITIAL_FLAT_COLORLESS_BONUS };
  return { ...environment, fruit };
}

// Builds a { color: amount } charge map, collapsing correctly even in the
// (practically nonexistent, but type-legal — CardBase.color is StatColor |
// 'colorless') case where a card's own color IS 'colorless': both the base
// cost and any splash tax then draw from the exact same bucket, added
// together, rather than one silently overwriting the other.
function buildCharges(color: StatColor | 'colorless', baseCost: number, tax: number): Partial<FruitPool> {
  const charges: Partial<FruitPool> = {};
  charges[color] = (charges[color] ?? 0) + baseCost;
  charges.colorless = (charges.colorless ?? 0) + tax;
  return charges;
}

function tryChargeFruit(
  fruit: FruitPool,
  charges: Partial<FruitPool>,
): { ok: true; fruit: FruitPool } | { ok: false } {
  const entries = Object.entries(charges) as [keyof FruitPool, number][];
  const canAfford = entries.every(([color, amount]) => fruit[color] >= amount);
  if (!canAfford) return { ok: false };
  const next = { ...fruit };
  for (const [color, amount] of entries) next[color] -= amount;
  return { ok: true, fruit: next };
}

export interface SplashBondResult extends BondResult {
  environment: Environment;
  ok: boolean; // false = insufficient Fruit; chao/environment are returned unchanged
  baseCostPaid: number;
  taxPaid: number;
}

// Bonds a Bond Card, now paying TWO things (playtest-prep, revised
// 2026-08-21): a base Fruit cost in the card's OWN color, always (this is
// new — every card used to be free on-color, which is exactly why "I just
// use all the cards on my Chao" had no real cost-benefit struggle to it),
// plus the existing splash tax (GDD §4.4) from the colorless/Wildcard bucket
// specifically if the card is off the Chao's current color identity. A thin
// wrapper over chao/bonding.ts's bondCard(), which stays cost-agnostic —
// layering this on top keeps that existing, tested engine primitive
// untouched.
export function bondCardWithSplashTax(
  chao: Chao,
  environment: Environment,
  card: BondCard,
  baseTax: number,
  rng: Rng,
): SplashBondResult {
  const baseCost = FRUIT_COST_BY_RARITY[card.rarity];
  const tax = computeSplashTax(chao, card, baseTax);
  const charge = tryChargeFruit(environment.fruit, buildCharges(card.color, baseCost, tax));
  if (!charge.ok) {
    return { chao, environment, events: [], ok: false, baseCostPaid: 0, taxPaid: 0 };
  }
  const { chao: bonded, events } = bondCard(chao, card, rng);
  return {
    chao: bonded,
    environment: { ...environment, fruit: charge.fruit },
    events,
    ok: true,
    baseCostPaid: baseCost,
    taxPaid: tax,
  };
}

export interface AwakenCostResult {
  chao: Chao;
  environment: Environment;
  events: SimEvent[];
  ok: boolean;
  baseCostPaid: number;
  taxPaid: number;
}

// Awakening (GDD §4.6) now costs Fruit too, same pattern as a normal bond —
// 3x the base cost (fusing 3 copies at once) in the card's own color, plus
// one splash-tax charge if off-identity.
export function awakenBondCardWithCost(
  chao: Chao,
  environment: Environment,
  card: BondCard,
  baseTax: number,
): AwakenCostResult {
  const baseCost = FRUIT_COST_BY_RARITY[card.rarity] * AWAKEN_COST_MULTIPLIER;
  const tax = computeSplashTax(chao, card, baseTax);
  const charge = tryChargeFruit(environment.fruit, buildCharges(card.color, baseCost, tax));
  if (!charge.ok) {
    return { chao, environment, events: [], ok: false, baseCostPaid: 0, taxPaid: 0 };
  }
  const { chao: awakened, events } = awakenBondCard(chao, card);
  return {
    chao: awakened,
    environment: { ...environment, fruit: charge.fruit },
    events,
    ok: true,
    baseCostPaid: baseCost,
    taxPaid: tax,
  };
}

export interface PotionCostResult {
  chao: Chao;
  environment: Environment;
  events: SimEvent[];
  ok: boolean;
  costPaid: number;
}

// Potions now cost Fruit too (playtest-prep, 2026-08-21) — base cost only,
// in the card's own color. No splash-tax layer: a consumed Potion never
// interacts with color identity at all (GDD §3.3/§4.2 — it isn't "attached"
// the way a Bond/Trait card is), so there's nothing to charge an off-color
// surcharge against.
export function consumePotionWithCost(
  chao: Chao,
  environment: Environment,
  card: PotionCard,
  rng: Rng,
): PotionCostResult {
  const cost = FRUIT_COST_BY_RARITY[card.rarity];
  const charge = tryChargeFruit(environment.fruit, { [card.color]: cost });
  if (!charge.ok) {
    return { chao, environment, events: [], ok: false, costPaid: 0 };
  }
  const { chao: fed, events } = consumePotion(chao, card, rng);
  return { chao: fed, environment: { ...environment, fruit: charge.fruit }, events, ok: true, costPaid: cost };
}
