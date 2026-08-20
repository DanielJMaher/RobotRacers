import type { Chao } from '@chao-draft/sim';
import { createChao } from '@chao-draft/sim';

// A fixed baseline opponent for Phase 1's Karate Bout demo. Phase 3's
// autochess layer (docs/03-roadmap/roadmap.md) is what eventually replaces
// this with a real board of AI or async-ghost Chao — this is deliberately
// just enough to exercise resolveBout, which needs two participants.
export function createRivalChao(): Chao {
  const base = createChao({ id: 'rival', name: 'Training Dummy', bornGeneration: 0 });
  return {
    ...base,
    stats: { ...base.stats, swim: 15, fly: 10, run: 15, power: 15, stamina: 40, mind: 5, luck: 5 },
    evolutionStage: 1,
  };
}
