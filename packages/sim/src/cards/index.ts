import type { Card } from '../types';
import { blackCards } from './data/black';
import { blueCards } from './data/blue';
import { colorlessCards } from './data/colorless';
import { greenCards } from './data/green';
import { habitatCards } from './data/habitat';
import { potionCards } from './data/potions';
import { redCards } from './data/red';
import { seedCards } from './data/seeds';
import { whiteCards } from './data/white';

export * from './data/black';
export * from './data/blue';
export * from './data/colorless';
export * from './data/green';
export * from './data/habitat';
export * from './data/potions';
export * from './data/red';
export * from './data/seeds';
export * from './data/white';

// The full "Core Garden" example set — all 5 colors, colorless Items,
// Habitats, Seeds, and Potions, matching docs/01-design/card-set-list.md in
// full (minus Twin Garden Spring, deliberately deferred — see habitat.ts).
export const coreGardenSet: Card[] = [
  ...greenCards,
  ...redCards,
  ...blackCards,
  ...blueCards,
  ...whiteCards,
  ...colorlessCards,
  ...habitatCards,
  ...seedCards,
  ...potionCards,
];
