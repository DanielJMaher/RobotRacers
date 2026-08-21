import type { SeedCard } from '../../types';

// "Core Garden" example set — Seed cards, new 2026-08-20 (roadmap.md Phase
// 4, GDD §6.9's revived Fruit economy). Drafted like any other card, from
// both the main Draft Booster and the Environment Interlude Booster;
// planted into a filled Habitat Slot via tournament/environment.ts.
//
// One per color, common rarity, to start — real drop-rate/count tuning is
// explicit Phase 6 balance work (GDD §6.9's own closing note), not decided
// here.

export const verdantSeed: SeedCard = {
  id: 'seed.verdant_seed',
  name: 'Verdant Seed',
  rarity: 'common',
  type: 'seed',
  color: 'green',
  flavorText: 'Plant it anywhere green, and it acts like it always belonged there.',
};

export const emberSeed: SeedCard = {
  id: 'seed.ember_seed',
  name: 'Ember Seed',
  rarity: 'common',
  type: 'seed',
  color: 'red',
  flavorText: 'Warm to the touch even before it takes root.',
};

export const cinderSeed: SeedCard = {
  id: 'seed.cinder_seed',
  name: 'Cinder Seed',
  rarity: 'common',
  type: 'seed',
  color: 'black',
  flavorText: 'Looks burnt out. Grows anyway.',
};

export const stormSeed: SeedCard = {
  id: 'seed.storm_seed',
  name: 'Storm Seed',
  rarity: 'common',
  type: 'seed',
  color: 'blue',
  flavorText: 'Never quite touches the ground it is planted in.',
};

export const tidalSeed: SeedCard = {
  id: 'seed.tidal_seed',
  name: 'Tidal Seed',
  rarity: 'common',
  type: 'seed',
  color: 'white',
  flavorText: 'Carried in on the tide, and never quite carried back out.',
};

export const seedCards = [verdantSeed, emberSeed, cinderSeed, stormSeed, tidalSeed];
