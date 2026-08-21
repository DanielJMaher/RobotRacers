import type { PotionCard } from '../../types';

// "Core Garden" example set — Potion cards (renamed from "Regimen" 2026-08-20,
// per the user's own read: these are the "feed it fruit" side of the
// original design, as opposed to Bond Cards' "feed it an animal" — a
// permanent, one-time flat stat grant with no slot, no species tag, no
// visual change, and no color-identity/splash-tax effect. Consolidated into
// one cross-color file (rather than staying scattered across each color's
// file) now that blending means a Potion doesn't always belong to just one
// color — mirrors habitat.ts/seeds.ts's own cross-color file layout.
//
// Same one-time-use lifecycle as every other card type now (roadmap.md
// Phase 5.5) — enforced at the app layer, not here.
//
// Blending (added 2026-08-20): a Potion can span up to 2 EXTRA colors
// beyond its primary `color`, mirroring Bond Cards' own rarity-gated
// complexity (GDD §3.5) — Common stays mono, Uncommon introduces 2-color
// blends, Rare and Legendary use 3-color blends. Existing mono Potions
// below are unchanged from their original "Regimen" numbers; the blended
// ones are new content with a first-draft per-stat range (not diluted
// per grant, since more colors is meant to be a real step up in total
// value) — exact numbers are Phase 6 balance-pass placeholders, same
// status as every other numeric constant in this codebase.

// --- Mono Potions (renamed from Regimen, numbers unchanged) ---

export const deeprootFruit: PotionCard = {
  id: 'potion.deeproot_fruit',
  name: 'Deeproot Fruit',
  rarity: 'common',
  type: 'potion',
  color: 'green',
  flavorText: 'Tastes like patience. Somehow that helps.',
  statGrants: [{ stat: 'stamina', min: 10, max: 14 }],
};

export const sunlitBerries: PotionCard = {
  id: 'potion.sunlit_berries',
  name: 'Sunlit Berries',
  rarity: 'common',
  type: 'potion',
  color: 'green',
  flavorText: 'Warm all the way through, like they remember the sun.',
  statGrants: [
    { stat: 'stamina', min: 4, max: 6 },
    { stat: 'mind', min: 1, max: 1 },
  ],
};

export const heartroot: PotionCard = {
  id: 'potion.heartroot',
  name: 'Heartroot',
  rarity: 'rare',
  type: 'potion',
  color: 'green',
  flavorText: 'Grows in the dark, for exactly this kind of moment.',
  statGrants: [{ stat: 'stamina', min: 20, max: 28 }],
};

export const quickstepDraught: PotionCard = {
  id: 'potion.quickstep_draught',
  name: 'Quickstep Draught',
  rarity: 'common',
  type: 'potion',
  color: 'red',
  flavorText: 'Goes down fast. So does everything after it.',
  statGrants: [{ stat: 'run', min: 10, max: 14 }],
};

export const racingStripeTonic: PotionCard = {
  id: 'potion.racing_stripe_tonic',
  name: 'Racing Stripe Tonic',
  rarity: 'common',
  type: 'potion',
  color: 'red',
  flavorText: 'Paints a stripe down the back that was never really there.',
  statGrants: [
    { stat: 'run', min: 5, max: 8 },
    { stat: 'luck', min: 1, max: 1 },
  ],
};

export const boundingDraught: PotionCard = {
  id: 'potion.bounding_draught',
  name: 'Bounding Draught',
  rarity: 'common',
  type: 'potion',
  color: 'red',
  flavorText: 'One sip, and the ground stops feeling necessary.',
  statGrants: [{ stat: 'jump', min: 8, max: 12 }],
};

export const crushblowTonic: PotionCard = {
  id: 'potion.crushblow_tonic',
  name: 'Crushblow Tonic',
  rarity: 'common',
  type: 'potion',
  color: 'black',
  flavorText: 'Smells like iron. Works like it too.',
  statGrants: [{ stat: 'power', min: 10, max: 14 }],
};

export const grindingStone: PotionCard = {
  id: 'potion.grinding_stone',
  name: 'Grinding Stone',
  rarity: 'common',
  type: 'potion',
  color: 'black',
  flavorText: 'Sharpens what it touches. Wears down what it does not need.',
  // The set's one deliberate downside common (card-set-list.md) — a genuine
  // tradeoff so late Black picks aren't strictly good, per that doc's
  // set-design notes. rollInRange handles a negative min===max fine.
  statGrants: [
    { stat: 'power', min: 5, max: 8 },
    { stat: 'fly', min: -2, max: -2 },
  ],
};

export const quarryGripTonic: PotionCard = {
  id: 'potion.quarry_grip_tonic',
  name: 'Quarry Grip Tonic',
  rarity: 'common',
  type: 'potion',
  color: 'black',
  flavorText: 'Leaves the hands rough and the grip unshakeable.',
  statGrants: [{ stat: 'climb', min: 8, max: 12 }],
};

export const windcatcherDraught: PotionCard = {
  id: 'potion.windcatcher_draught',
  name: 'Windcatcher Draught',
  rarity: 'common',
  type: 'potion',
  color: 'blue',
  flavorText: 'Bottled wind. It never quite settles once it is opened.',
  statGrants: [{ stat: 'fly', min: 10, max: 14 }],
};

export const cloudsightTonic: PotionCard = {
  id: 'potion.cloudsight_tonic',
  name: 'Cloudsight Tonic',
  rarity: 'common',
  type: 'potion',
  color: 'blue',
  flavorText: 'The higher it looks, the clearer everything gets.',
  // card-set-list.md's flavor text also grants "draw an extra card at your
  // next Draft Booster" — PotionCard's schema is deliberately stat-grants-
  // only (GDD §4.2: "no slot, no speciesTags, no bodyMutation... always
  // safe to take"), so there's no field to attach a draft-time bonus to.
  // Implemented as the stat grant alone; the draft bonus is dropped rather
  // than bolted on awkwardly.
  statGrants: [{ stat: 'fly', min: 4, max: 6 }],
};

export const clearwaterDraught: PotionCard = {
  id: 'potion.clearwater_draught',
  name: 'Clearwater Draught',
  rarity: 'common',
  type: 'potion',
  color: 'white',
  flavorText: 'So clear it is easy to forget it is there at all — until it works.',
  statGrants: [{ stat: 'swim', min: 10, max: 14 }],
};

export const tidepoolTonic: PotionCard = {
  id: 'potion.tidepool_tonic',
  name: 'Tidepool Tonic',
  rarity: 'common',
  type: 'potion',
  color: 'white',
  flavorText: 'Collected at low tide, from the calmest pool on the shore.',
  // card-set-list.md's flavor text also grants "+2 Happiness" — Happiness
  // isn't a Stat (it's a separate Chao field, chao.happiness, fed by Rest
  // Garden nodes and DNF tracking per the GDD), so it can't be expressed via
  // PotionCard's statGrants. Implemented as the Swim grant alone.
  statGrants: [{ stat: 'swim', min: 5, max: 8 }],
};

// --- Blended Potions (new 2026-08-20) — 2-color at Uncommon ---

export const bramblefireTonic: PotionCard = {
  id: 'potion.bramblefire_tonic',
  name: 'Bramblefire Tonic',
  rarity: 'uncommon',
  type: 'potion',
  color: 'green',
  secondaryColors: ['red'],
  flavorText: 'Slow-burning at first, then all at once.',
  statGrants: [
    { stat: 'stamina', min: 6, max: 9 },
    { stat: 'run', min: 6, max: 9 },
  ],
};

export const ashbloodDraught: PotionCard = {
  id: 'potion.ashblood_draught',
  name: 'Ashblood Draught',
  rarity: 'uncommon',
  type: 'potion',
  color: 'red',
  secondaryColors: ['black'],
  flavorText: 'Bitter going down. Nobody drinks it for the taste.',
  statGrants: [
    { stat: 'run', min: 6, max: 9 },
    { stat: 'power', min: 6, max: 9 },
  ],
};

export const stormforgedElixir: PotionCard = {
  id: 'potion.stormforged_elixir',
  name: 'Stormforged Elixir',
  rarity: 'uncommon',
  type: 'potion',
  color: 'black',
  secondaryColors: ['blue'],
  flavorText: 'Brewed in the eye of something that was still angry when it was bottled.',
  statGrants: [
    { stat: 'power', min: 6, max: 9 },
    { stat: 'fly', min: 6, max: 9 },
  ],
};

export const tidewindPotion: PotionCard = {
  id: 'potion.tidewind_potion',
  name: 'Tidewind Potion',
  rarity: 'uncommon',
  type: 'potion',
  color: 'blue',
  secondaryColors: ['white'],
  flavorText: 'Where the wind meets the water, and neither one wins.',
  statGrants: [
    { stat: 'fly', min: 6, max: 9 },
    { stat: 'swim', min: 6, max: 9 },
  ],
};

export const springwaterTonic: PotionCard = {
  id: 'potion.springwater_tonic',
  name: 'Springwater Tonic',
  rarity: 'uncommon',
  type: 'potion',
  color: 'white',
  secondaryColors: ['green'],
  flavorText: 'Cold, clean, and older than the garden it flows through.',
  statGrants: [
    { stat: 'swim', min: 6, max: 9 },
    { stat: 'stamina', min: 6, max: 9 },
  ],
};

// --- Blended Potions — 3-color at Rare ---

export const primalSurgePotion: PotionCard = {
  id: 'potion.primal_surge_potion',
  name: 'Primal Surge Potion',
  rarity: 'rare',
  type: 'potion',
  color: 'green',
  secondaryColors: ['red', 'black'],
  flavorText: "Everything the earth ever built into one Chao, poured out at once.",
  statGrants: [
    { stat: 'stamina', min: 8, max: 12 },
    { stat: 'run', min: 8, max: 12 },
    { stat: 'power', min: 8, max: 12 },
  ],
};

export const deepCurrentElixir: PotionCard = {
  id: 'potion.deep_current_elixir',
  name: 'Deep Current Elixir',
  rarity: 'rare',
  type: 'potion',
  color: 'black',
  secondaryColors: ['blue', 'white'],
  flavorText: 'Pulled from a current with no visible bottom.',
  statGrants: [
    { stat: 'power', min: 8, max: 12 },
    { stat: 'fly', min: 8, max: 12 },
    { stat: 'swim', min: 8, max: 12 },
  ],
};

export const verdantRushTonic: PotionCard = {
  id: 'potion.verdant_rush_tonic',
  name: 'Verdant Rush Tonic',
  rarity: 'rare',
  type: 'potion',
  color: 'white',
  secondaryColors: ['green', 'red'],
  flavorText: 'The whole course feels shorter after drinking it.',
  statGrants: [
    { stat: 'swim', min: 8, max: 12 },
    { stat: 'stamina', min: 8, max: 12 },
    { stat: 'run', min: 8, max: 12 },
  ],
};

// --- Blended Potions — 3-color at Legendary (bigger grants) ---

export const wyldstormElixir: PotionCard = {
  id: 'potion.wyldstorm_elixir',
  name: 'Wyldstorm Elixir',
  rarity: 'legendary',
  type: 'potion',
  color: 'green',
  secondaryColors: ['black', 'blue'],
  flavorText: 'Three storms, bottled together, that never learned to stop fighting each other.',
  statGrants: [
    { stat: 'stamina', min: 14, max: 18 },
    { stat: 'power', min: 14, max: 18 },
    { stat: 'fly', min: 14, max: 18 },
  ],
};

export const bloodtidePotion: PotionCard = {
  id: 'potion.bloodtide_potion',
  name: 'Bloodtide Potion',
  rarity: 'legendary',
  type: 'potion',
  color: 'red',
  secondaryColors: ['white', 'black'],
  flavorText: 'The tide turns red once, and the Chao that drinks it turns with it.',
  statGrants: [
    { stat: 'run', min: 14, max: 18 },
    { stat: 'swim', min: 14, max: 18 },
    { stat: 'power', min: 14, max: 18 },
  ],
};

export const potionCards = [
  deeprootFruit,
  sunlitBerries,
  heartroot,
  quickstepDraught,
  racingStripeTonic,
  boundingDraught,
  crushblowTonic,
  grindingStone,
  quarryGripTonic,
  windcatcherDraught,
  cloudsightTonic,
  clearwaterDraught,
  tidepoolTonic,
  bramblefireTonic,
  ashbloodDraught,
  stormforgedElixir,
  tidewindPotion,
  springwaterTonic,
  primalSurgePotion,
  deepCurrentElixir,
  verdantRushTonic,
  wyldstormElixir,
  bloodtidePotion,
];
