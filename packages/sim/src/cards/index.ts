import type { Card } from '../types';
import { colorlessCards } from './data/colorless';
import { greenCards } from './data/green';
import { habitatCards } from './data/habitat';
import { redCards } from './data/red';

export * from './data/colorless';
export * from './data/green';
export * from './data/habitat';
export * from './data/red';

// The full "Core Garden" example set (~30-card Phase 0 slice — see
// docs/03-roadmap/roadmap.md Phase 0). Green and Red are complete color
// slices; a handful of colorless Items and Habitats round it out.
export const coreGardenSet: Card[] = [
  ...greenCards,
  ...redCards,
  ...colorlessCards,
  ...habitatCards,
];
