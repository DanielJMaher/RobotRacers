import { describe, expect, it } from 'vitest';
import { buildCardPool } from '../draft/pool';
import { coreGardenSet } from '../cards';
import { createRng } from '../rng';
import { createInterludeDraft, pickInterludeCard } from './interlude';

const POOL = buildCardPool(coreGardenSet);

describe('createInterludeDraft', () => {
  it('opens exactly 3 packs of 3 cards each, none of them Habitats', () => {
    const state = createInterludeDraft(POOL, createRng(1));
    expect(state.packs).toHaveLength(3);
    for (const pack of state.packs) {
      expect(pack).toHaveLength(3);
      for (const card of pack) {
        expect(card.type).not.toBe('habitat');
      }
    }
    expect(state.currentPackIndex).toBe(0);
    expect(state.pickedCards).toEqual([]);
    expect(state.isComplete).toBe(false);
  });
});

describe('pickInterludeCard', () => {
  it('advances through all 3 packs and completes after the 3rd pick', () => {
    const state = createInterludeDraft(POOL, createRng(2));
    const afterFirst = pickInterludeCard(state, 0);
    expect(afterFirst.currentPackIndex).toBe(1);
    expect(afterFirst.pickedCards).toHaveLength(1);
    expect(afterFirst.isComplete).toBe(false);

    const afterSecond = pickInterludeCard(afterFirst, 1);
    expect(afterSecond.pickedCards).toHaveLength(2);
    expect(afterSecond.isComplete).toBe(false);

    const afterThird = pickInterludeCard(afterSecond, 2);
    expect(afterThird.pickedCards).toHaveLength(3);
    expect(afterThird.isComplete).toBe(true);
  });

  it('throws once the Interlude Booster is already complete', () => {
    const state = createInterludeDraft(POOL, createRng(3));
    const done = pickInterludeCard(pickInterludeCard(pickInterludeCard(state, 0), 0), 0);
    expect(done.isComplete).toBe(true);
    expect(() => pickInterludeCard(done, 0)).toThrow();
  });

  it('throws for an out-of-range pick index', () => {
    const state = createInterludeDraft(POOL, createRng(4));
    expect(() => pickInterludeCard(state, 99)).toThrow();
  });
});
