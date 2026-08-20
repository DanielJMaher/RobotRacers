import type { Card } from '../types';
import { blackCards } from './data/black';
import { blueCards } from './data/blue';
import { colorlessCards } from './data/colorless';
import { greenCards } from './data/green';
import { habitatCards } from './data/habitat';
import { redCards } from './data/red';
import { whiteCards } from './data/white';

export * from './data/black';
export * from './data/blue';
export * from './data/colorless';
export * from './data/green';
export * from './data/habitat';
export * from './data/red';
export * from './data/white';

// The full "Core Garden" example set — all 5 colors, colorless Items, and
// Habitats, matching docs/01-design/card-set-list.md in full (minus Twin
// Garden Spring, deliberately deferred — see habitat.ts).
export const coreGardenSet: Card[] = [
  ...greenCards,
  ...redCards,
  ...blackCards,
  ...blueCards,
  ...whiteCards,
  ...colorlessCards,
  ...habitatCards,
];
