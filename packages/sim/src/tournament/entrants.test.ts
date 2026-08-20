import { describe, expect, it } from 'vitest';
import { createRng } from '../rng';
import { computeScoutingRead, generateEntrant, generateEntrantNames } from './entrants';

describe('generateEntrantNames', () => {
  it('returns the requested count with no duplicates', () => {
    const names = generateEntrantNames(23, createRng(1));
    expect(names).toHaveLength(23);
    expect(new Set(names).size).toBe(23);
  });

  it('throws if more names are requested than the pool has', () => {
    expect(() => generateEntrantNames(1000, createRng(1))).toThrow();
  });
});

describe('generateEntrant', () => {
  it('rolls leg-relevant stats within range and leaves bonded cards/traits/items empty', () => {
    const chao = generateEntrant('e1', 'Test Entrant', 1, createRng(5));

    for (const stat of ['swim', 'fly', 'run', 'power', 'climb', 'jump'] as const) {
      expect(chao.stats[stat]).toBeGreaterThanOrEqual(10);
      expect(chao.stats[stat]).toBeLessThanOrEqual(60);
    }
    expect(chao.stats.stamina).toBeGreaterThanOrEqual(60);
    expect(chao.stats.stamina).toBeLessThanOrEqual(150);
    expect(chao.bondedCards).toEqual([]);
    expect(chao.traits).toEqual([]);
    expect(chao.items).toEqual([]);
    expect(chao.id).toBe('e1');
    expect(chao.name).toBe('Test Entrant');
  });
});

describe('computeScoutingRead', () => {
  it('buckets leg-relevant stats and stamina into 1-5', () => {
    const chao = generateEntrant('e1', 'Test Entrant', 1, createRng(9));
    const read = computeScoutingRead(chao);

    for (const stat of ['swim', 'fly', 'run', 'power', 'climb', 'jump', 'stamina'] as const) {
      expect(read[stat]).toBeGreaterThanOrEqual(1);
      expect(read[stat]).toBeLessThanOrEqual(5);
    }
    // mind/luck aren't Leg-relevant (GDD §6.7) and shouldn't appear at all.
    expect(read.mind).toBeUndefined();
    expect(read.luck).toBeUndefined();
  });

  it('buckets low stats as 1 and very high stats as 5', () => {
    const chao = generateEntrant('e1', 'Test Entrant', 1, createRng(9));
    const low = { ...chao, stats: { ...chao.stats, run: 1, stamina: 1 } };
    const high = { ...chao, stats: { ...chao.stats, run: 999, stamina: 999 } };

    expect(computeScoutingRead(low).run).toBe(1);
    expect(computeScoutingRead(low).stamina).toBe(1);
    expect(computeScoutingRead(high).run).toBe(5);
    expect(computeScoutingRead(high).stamina).toBe(5);
  });
});
