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

export const habitatCards = [sunlitMeadow, windsweptCliff];
