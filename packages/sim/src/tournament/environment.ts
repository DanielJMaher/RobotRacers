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

// Freely sets (or clears) slotIndex's color — the PRIMARY way a player gets
// their 3 Habitat colors now (playtest-prep, added 2026-08-21, per the
// user's direct request: "It is an open selection - I can choose any
// habitat for any of the slots"). Replaces relying on the Draft Booster's
// random per-pack bonus Habitat card (draft/pool.ts's drawBonusHabitat,
// still unchanged and still fires) as the only way to get a color into a
// slot at all — that mechanic previously left the player with whatever 3
// colors the RNG happened to hand them (a real, confirmed complaint: "i
// didnt get to set my habitat to whatever i want i was stuck with 1 white
// and 2 black"). Bonus-drafted Habitat cards are now purely optional
// upside: still placeable via placeHabitatCard, either to fill a slot left
// at Open Fort, or to grow an already-freely-chosen matching-color slot to
// 2-star — see that function, unchanged below.
//
// Freely re-choosable (no cost, no card consumed) right up until the app
// layer stops calling this (at "Continue to Tournament") — GDD §6.9's
// "placement is permanent" still applies from that point on, same as
// always, just enforced by the app no longer offering the choice UI rather
// than by this function itself. Only blocked once a slot has actually been
// grown to 2-star (via a real drafted card) — at that point its color is
// genuinely locked in, matching the existing permanence rule.
export function setHabitatChoice(
  environment: Environment,
  slotIndex: number,
  color: StatColor | undefined,
): Environment {
  const existing = environment.slots[slotIndex];
  if (existing !== undefined && existing.starLevel === 2) {
    throw new Error(`setHabitatChoice: slot ${slotIndex} is already a 2-star Habitat, its color is locked`);
  }
  const nextSlot: HabitatSlot | undefined =
    color === undefined ? undefined : { color, starLevel: 1, seedSlots: 1, plantedSeedColors: [] };
  return { ...environment, slots: environment.slots.map((s, i) => (i === slotIndex ? nextSlot : s)) };
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

// Charges a base cost (in the card's own color) plus an optional splash tax
// (always colorless). Fixed 2026-08-21 — a real bug in the first draft of
// this system, caught by the user hitting it directly: the base cost used to
// require the FULL amount from the card's exact color bucket, with no
// fallback. With only 3 Habitat slots and 5 colors, at least 2 colors are
// *always* stuck at 0 native Fruit forever — under the old rule, any card of
// those colors (including a 3-copy Awakening) was PERMANENTLY unusable, no
// matter how much Wildcard Fruit was banked. That directly contradicts the
// GDD's own established rule that "a Wildcard Fruit spends as any color"
// (§6.9, Open Fort) — splash tax already honored that; the base cost didn't.
// Now: the card's own color is drawn down first, and colorless covers
// whatever's left short (in addition to covering splash tax, if any) — so
// colorless Fruit is what actually keeps every color usable, exactly as
// intended, rather than a color you never funded being dead forever.
function chargeFruit(
  fruit: FruitPool,
  color: StatColor | 'colorless',
  baseCost: number,
  tax: number,
): { ok: true; fruit: FruitPool; baseCostFromColorless: number } | { ok: false } {
  if (color === 'colorless') {
    const need = baseCost + tax;
    if (fruit.colorless < need) return { ok: false };
    return { ok: true, fruit: { ...fruit, colorless: fruit.colorless - need }, baseCostFromColorless: 0 };
  }
  const ownHave = fruit[color];
  const fromOwn = Math.min(baseCost, ownHave);
  const shortfall = baseCost - fromOwn;
  const colorlessNeeded = shortfall + tax;
  if (fruit.colorless < colorlessNeeded) return { ok: false };
  return {
    ok: true,
    fruit: { ...fruit, [color]: ownHave - fromOwn, colorless: fruit.colorless - colorlessNeeded },
    baseCostFromColorless: shortfall,
  };
}

export interface SplashBondResult extends BondResult {
  environment: Environment;
  ok: boolean; // false = insufficient Fruit; chao/environment are returned unchanged
  baseCostPaid: number; // total base cost (own-color + any colorless covering a shortfall)
  baseCostFromColorless: number; // the portion of baseCostPaid that came from colorless, if the own color fell short
  taxPaid: number; // splash tax specifically — always colorless
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
  const charge = chargeFruit(environment.fruit, card.color, baseCost, tax);
  if (!charge.ok) {
    return { chao, environment, events: [], ok: false, baseCostPaid: 0, baseCostFromColorless: 0, taxPaid: 0 };
  }
  const { chao: bonded, events } = bondCard(chao, card, rng);
  return {
    chao: bonded,
    environment: { ...environment, fruit: charge.fruit },
    events,
    ok: true,
    baseCostPaid: baseCost,
    baseCostFromColorless: charge.baseCostFromColorless,
    taxPaid: tax,
  };
}

export interface AwakenCostResult {
  chao: Chao;
  environment: Environment;
  events: SimEvent[];
  ok: boolean;
  baseCostPaid: number;
  baseCostFromColorless: number;
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
  const charge = chargeFruit(environment.fruit, card.color, baseCost, tax);
  if (!charge.ok) {
    return { chao, environment, events: [], ok: false, baseCostPaid: 0, baseCostFromColorless: 0, taxPaid: 0 };
  }
  const { chao: awakened, events } = awakenBondCard(chao, card);
  return {
    chao: awakened,
    environment: { ...environment, fruit: charge.fruit },
    events,
    ok: true,
    baseCostPaid: baseCost,
    baseCostFromColorless: charge.baseCostFromColorless,
    taxPaid: tax,
  };
}

export interface PotionCostResult {
  chao: Chao;
  environment: Environment;
  events: SimEvent[];
  ok: boolean;
  costPaid: number;
  costFromColorless: number;
}

// Potions now cost Fruit too (playtest-prep, 2026-08-21) — base cost only,
// in the card's own color (falling back to colorless for any shortfall,
// same as bondCardWithSplashTax/awakenBondCardWithCost). No splash-tax
// layer: a consumed Potion never interacts with color identity at all
// (GDD §3.3/§4.2 — it isn't "attached" the way a Bond/Trait card is), so
// there's nothing to charge an off-color surcharge against.
export function consumePotionWithCost(
  chao: Chao,
  environment: Environment,
  card: PotionCard,
  rng: Rng,
): PotionCostResult {
  const cost = FRUIT_COST_BY_RARITY[card.rarity];
  const charge = chargeFruit(environment.fruit, card.color, cost, 0);
  if (!charge.ok) {
    return { chao, environment, events: [], ok: false, costPaid: 0, costFromColorless: 0 };
  }
  const { chao: fed, events } = consumePotion(chao, card, rng);
  return {
    chao: fed,
    environment: { ...environment, fruit: charge.fruit },
    events,
    ok: true,
    costPaid: cost,
    costFromColorless: charge.baseCostFromColorless,
  };
}
