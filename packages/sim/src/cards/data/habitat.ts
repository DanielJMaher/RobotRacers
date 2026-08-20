import type { HabitatCard } from '../../types';

// "Core Garden" example set — Habitat cards (attach to the Garden Board, not
// a Chao). Source: docs/01-design/card-set-list.md

export const sunlitMeadow: HabitatCard = {
  id: 'habitat.sunlit_meadow',
  name: 'Sunlit Meadow',
  rarity: 'common',
  type: 'habitat',
  color: 'green',
  fixedColors: ['green'],
  fruitPerRound: 1,
  splashTaxReduction: 0.5,
};

export const windsweptCliff: HabitatCard = {
  id: 'habitat.windswept_cliff',
  name: 'Windswept Cliff',
  rarity: 'common',
  type: 'habitat',
  color: 'red',
  fixedColors: ['red'],
  fruitPerRound: 1,
  splashTaxReduction: 0.5,
};

export const ironQuarry: HabitatCard = {
  id: 'habitat.iron_quarry',
  name: 'Iron Quarry',
  rarity: 'common',
  type: 'habitat',
  color: 'black',
  fixedColors: ['black'],
  fruitPerRound: 1,
  splashTaxReduction: 0.5,
};

export const cloudTerrace: HabitatCard = {
  id: 'habitat.cloud_terrace',
  name: 'Cloud Terrace',
  rarity: 'common',
  type: 'habitat',
  color: 'blue',
  fixedColors: ['blue'],
  fruitPerRound: 1,
  splashTaxReduction: 0.5,
};

export const tidepoolCove: HabitatCard = {
  id: 'habitat.tidepool_cove',
  name: 'Tidepool Cove',
  rarity: 'common',
  type: 'habitat',
  color: 'white',
  fixedColors: ['white'],
  fruitPerRound: 1,
  splashTaxReduction: 0.5,
};

// Twin Garden Spring ("any two, chosen at draft") is deliberately not
// implemented here: it needs a modal/choice-on-pick draft mechanic (pick the
// card, then pick which 2 colors it fixes) that draft/engine.ts doesn't
// support yet — a card-content task shouldn't quietly grow into an engine
// feature. Revisit once the draft engine has a concept of a card-pick-time
// choice.

export const habitatCards = [sunlitMeadow, windsweptCliff, ironQuarry, cloudTerrace, tidepoolCove];
