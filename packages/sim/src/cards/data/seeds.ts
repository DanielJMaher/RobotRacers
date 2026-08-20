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
};

export const emberSeed: SeedCard = {
  id: 'seed.ember_seed',
  name: 'Ember Seed',
  rarity: 'common',
  type: 'seed',
  color: 'red',
};

export const cinderSeed: SeedCard = {
  id: 'seed.cinder_seed',
  name: 'Cinder Seed',
  rarity: 'common',
  type: 'seed',
  color: 'black',
};

export const stormSeed: SeedCard = {
  id: 'seed.storm_seed',
  name: 'Storm Seed',
  rarity: 'common',
  type: 'seed',
  color: 'blue',
};

export const tidalSeed: SeedCard = {
  id: 'seed.tidal_seed',
  name: 'Tidal Seed',
  rarity: 'common',
  type: 'seed',
  color: 'white',
};

export const seedCards = [verdantSeed, emberSeed, cinderSeed, stormSeed, tidalSeed];
