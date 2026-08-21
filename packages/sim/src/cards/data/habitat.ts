import type { HabitatCard } from '../../types';

// "Core Garden" example set — Habitat cards (attach to the Environment, not
// a Chao). Source: docs/01-design/card-set-list.md
//
// Updated 2026-08-20 (roadmap.md Phase 4, GDD §6.9's revived economy):
// `fruitPerRound` bumped 1 -> 2 (the revived design's base rate for a single
// placed Habitat) and `splashTaxReduction` dropped entirely — that was the
// pre-revival design's per-card tax discount, superseded now that Fruit
// itself funds the splash tax directly (GDD §4.4).

export const sunlitMeadow: HabitatCard = {
  id: 'habitat.sunlit_meadow',
  name: 'Sunlit Meadow',
  rarity: 'common',
  type: 'habitat',
  color: 'green',
  flavorText: 'Grass tall enough to hide in, and Fruit that never seems to run out.',
  fixedColors: ['green'],
  fruitPerRound: 2,
};

export const windsweptCliff: HabitatCard = {
  id: 'habitat.windswept_cliff',
  name: 'Windswept Cliff',
  rarity: 'common',
  type: 'habitat',
  color: 'red',
  flavorText: 'The wind never stops moving here. Neither does anything that lives on it.',
  fixedColors: ['red'],
  fruitPerRound: 2,
};

export const ironQuarry: HabitatCard = {
  id: 'habitat.iron_quarry',
  name: 'Iron Quarry',
  rarity: 'common',
  type: 'habitat',
  color: 'black',
  flavorText: 'Every rock here has been hit at least once. Most have been hit twice.',
  fixedColors: ['black'],
  fruitPerRound: 2,
};

export const cloudTerrace: HabitatCard = {
  id: 'habitat.cloud_terrace',
  name: 'Cloud Terrace',
  rarity: 'common',
  type: 'habitat',
  color: 'blue',
  flavorText: 'Built on nothing solid, and somehow the sturdiest ground around.',
  fixedColors: ['blue'],
  fruitPerRound: 2,
};

export const tidepoolCove: HabitatCard = {
  id: 'habitat.tidepool_cove',
  name: 'Tidepool Cove',
  rarity: 'common',
  type: 'habitat',
  color: 'white',
  flavorText: 'The tide leaves something behind every time it visits.',
  fixedColors: ['white'],
  fruitPerRound: 2,
};

// Twin Garden Spring ("any two, chosen at draft") is deliberately not
// implemented here: it needs a modal/choice-on-pick draft mechanic (pick the
// card, then pick which 2 colors it fixes) that draft/engine.ts doesn't
// support yet — a card-content task shouldn't quietly grow into an engine
// feature. Revisit once the draft engine has a concept of a card-pick-time
// choice.

export const habitatCards = [sunlitMeadow, windsweptCliff, ironQuarry, cloudTerrace, tidepoolCove];
