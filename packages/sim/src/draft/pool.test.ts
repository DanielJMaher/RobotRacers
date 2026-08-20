import { describe, expect, it } from 'vitest';
import { coreGardenSet } from '../cards';
import { createRng } from '../rng';
import {
  buildCardPool,
  DEFAULT_PACK_CONFIG,
  drawBonusHabitat,
  generateSpellPack,
} from './pool';

describe('buildCardPool', () => {
  it('buckets non-habitat cards by rarity and separates habitats out', () => {
    const pool = buildCardPool(coreGardenSet);

    expect(pool.byRarity.common.length).toBeGreaterThan(0);
    expect(pool.byRarity.uncommon.length).toBeGreaterThan(0);
    expect(pool.byRarity.rare.length).toBeGreaterThan(0);
    expect(pool.byRarity.legendary.length).toBeGreaterThan(0);
    expect(pool.habitats.length).toBeGreaterThan(0);

    for (const bucket of Object.values(pool.byRarity)) {
      expect(bucket.every((card) => card.type !== 'habitat')).toBe(true);
    }
  });
});

describe('generateSpellPack', () => {
  it('produces exactly commons + uncommons + rareSlots cards, none of them Habitats', () => {
    const pool = buildCardPool(coreGardenSet);
    const rng = createRng(1);
    const pack = generateSpellPack(pool, rng);

    const expectedSize =
      DEFAULT_PACK_CONFIG.commons + DEFAULT_PACK_CONFIG.uncommons + DEFAULT_PACK_CONFIG.rareSlots;
    expect(pack).toHaveLength(expectedSize);
    expect(pack.every((card) => card.type !== 'habitat')).toBe(true);
  });

  it('is deterministic for a given seed', () => {
    const pool = buildCardPool(coreGardenSet);
    const packA = generateSpellPack(pool, createRng(77));
    const packB = generateSpellPack(pool, createRng(77));
    expect(packA.map((c) => c.id)).toEqual(packB.map((c) => c.id));
  });
});

describe('drawBonusHabitat', () => {
  it('returns a Habitat card from the pool', () => {
    const pool = buildCardPool(coreGardenSet);
    const rng = createRng(3);
    const habitat = drawBonusHabitat(pool, rng);
    expect(habitat?.type).toBe('habitat');
  });

  it('returns undefined when the pool has no Habitat cards', () => {
    const pool = buildCardPool(coreGardenSet.filter((c) => c.type !== 'habitat'));
    const rng = createRng(3);
    expect(drawBonusHabitat(pool, rng)).toBeUndefined();
  });
});
