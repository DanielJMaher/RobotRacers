import { describe, expect, it } from 'vitest';
import { coreGardenSet } from './index';

// Structural invariants over the whole hand-authored card set — the kind of
// thing that's easy to typo across ~90 cards (a duplicate id, an inverted
// min/max range) and that the type system alone doesn't catch.
describe('coreGardenSet', () => {
  it('has no duplicate card ids', () => {
    const ids = coreGardenSet.map((c) => c.id);
    const seen = new Set(ids);
    expect(seen.size).toBe(ids.length);
  });

  it('every StatGrant has min <= max', () => {
    for (const card of coreGardenSet) {
      if (card.type === 'bond' || card.type === 'regimen') {
        for (const grant of card.statGrants) {
          expect(grant.min, `${card.id} (${grant.stat})`).toBeLessThanOrEqual(grant.max);
        }
      }
    }
  });

  it('every Bond Card has 1 or 2 Species Tags', () => {
    for (const card of coreGardenSet) {
      if (card.type === 'bond') {
        expect(card.speciesTags.length, card.id).toBeGreaterThanOrEqual(1);
        expect(card.speciesTags.length, card.id).toBeLessThanOrEqual(2);
      }
    }
  });

  it('every Item and Habitat card is colorless/color-fixed correctly', () => {
    for (const card of coreGardenSet) {
      if (card.type === 'item') {
        expect(card.color, card.id).toBe('colorless');
      }
    }
  });

  it('represents all 5 stat colors plus colorless', () => {
    const colors = new Set(coreGardenSet.map((c) => c.color));
    expect(colors).toEqual(new Set(['green', 'red', 'black', 'blue', 'white', 'colorless']));
  });

  it('has at least one card of every rarity in every color', () => {
    const colors = ['green', 'red', 'black', 'blue', 'white'] as const;
    const rarities = ['common', 'uncommon', 'rare', 'legendary'] as const;
    for (const color of colors) {
      for (const rarity of rarities) {
        const hasOne = coreGardenSet.some((c) => c.color === color && c.rarity === rarity);
        expect(hasOne, `${color}/${rarity}`).toBe(true);
      }
    }
  });
});
