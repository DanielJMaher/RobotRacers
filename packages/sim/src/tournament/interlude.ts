import type { Rng } from '../rng';
import { pickRandom } from '../rng';
import type { Card } from '../types';
import type { CardPool } from '../draft/pool';

// The Environment Interlude Booster (GDD §4.5, §6.3, roadmap.md Phase 4): 3
// packs of 3 cards each, pick 1 per pack, no passing/bots involved — a solo
// choice, much smaller stakes than the main Draft Booster. Deliberately not
// built on top of draft/engine.ts's pack-passing machinery (there's no
// "other seat" to model here), per that module's own doc comment.
//
// Card selection is a flat random pick across every non-Habitat card
// (commons through legendaries pooled together, sampling with replacement —
// same convention as generateSpellPack) rather than mirroring the main
// pack's rarity-slotted structure. The GDD doesn't specify a rarity curve
// for this smaller format, and "much smaller stakes per pick" reads as
// intentionally lightweight — an explicit placeholder for Phase 6 tuning,
// not a considered balance decision.

const PACK_COUNT = 3;
const CARDS_PER_PACK = 3;

function allNonHabitatCards(pool: CardPool): Card[] {
  return [...pool.byRarity.common, ...pool.byRarity.uncommon, ...pool.byRarity.rare, ...pool.byRarity.legendary];
}

export interface InterludeDraftState {
  packs: Card[][]; // always PACK_COUNT packs of CARDS_PER_PACK cards
  currentPackIndex: number;
  pickedCards: Card[];
  isComplete: boolean;
}

export function createInterludeDraft(pool: CardPool, rng: Rng): InterludeDraftState {
  const cards = allNonHabitatCards(pool);
  const packs = Array.from({ length: PACK_COUNT }, () =>
    Array.from({ length: CARDS_PER_PACK }, () => pickRandom(cards, rng)),
  );
  return { packs, currentPackIndex: 0, pickedCards: [], isComplete: false };
}

// Picks one card from the current pack; advances to the next pack, or
// completes the Interlude Booster once all 3 picks are made.
export function pickInterludeCard(state: InterludeDraftState, index: number): InterludeDraftState {
  if (state.isComplete) {
    throw new Error('pickInterludeCard: this Interlude Booster is already complete');
  }
  const pack = state.packs[state.currentPackIndex];
  if (pack === undefined) {
    throw new Error(`pickInterludeCard: no pack at index ${state.currentPackIndex}`);
  }
  const picked = pack[index];
  if (picked === undefined) {
    throw new Error(`pickInterludeCard: no card at index ${index} (pack has ${pack.length} cards)`);
  }

  const nextPackIndex = state.currentPackIndex + 1;
  return {
    ...state,
    currentPackIndex: nextPackIndex,
    pickedCards: [...state.pickedCards, picked],
    isComplete: nextPackIndex >= PACK_COUNT,
  };
}
