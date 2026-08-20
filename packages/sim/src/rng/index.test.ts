import { describe, expect, it } from 'vitest';
import { createRng, pickRandom, rollInRange } from './index';

describe('createRng', () => {
  it('is deterministic for a given seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    const seqA = Array.from({ length: 20 }, () => a());
    const seqB = Array.from({ length: 20 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it('produces different sequences for different seeds', () => {
    const a = createRng(1);
    const b = createRng(2);
    const seqA = Array.from({ length: 10 }, () => a());
    const seqB = Array.from({ length: 10 }, () => b());
    expect(seqA).not.toEqual(seqB);
  });

  it('stays within [0, 1)', () => {
    const rng = createRng(7);
    for (let i = 0; i < 1000; i++) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('rollInRange', () => {
  it('stays within the inclusive [min, max] bounds over many rolls', () => {
    const rng = createRng(123);
    for (let i = 0; i < 500; i++) {
      const roll = rollInRange(rng, 6, 10);
      expect(roll).toBeGreaterThanOrEqual(6);
      expect(roll).toBeLessThanOrEqual(10);
      expect(Number.isInteger(roll)).toBe(true);
    }
  });

  it('supports a single-value range', () => {
    const rng = createRng(9);
    expect(rollInRange(rng, 4, 4)).toBe(4);
  });

  it('throws if max is less than min', () => {
    const rng = createRng(1);
    expect(() => rollInRange(rng, 10, 5)).toThrow();
  });
});

describe('pickRandom', () => {
  it('only ever returns elements from the array', () => {
    const rng = createRng(55);
    const options = ['a', 'b', 'c'];
    for (let i = 0; i < 100; i++) {
      expect(options).toContain(pickRandom(options, rng));
    }
  });

  it('is deterministic for a given seed', () => {
    const options = [1, 2, 3, 4, 5];
    const a = createRng(8);
    const b = createRng(8);
    const picksA = Array.from({ length: 10 }, () => pickRandom(options, a));
    const picksB = Array.from({ length: 10 }, () => pickRandom(options, b));
    expect(picksA).toEqual(picksB);
  });

  it('throws on an empty array', () => {
    const rng = createRng(1);
    expect(() => pickRandom([], rng)).toThrow();
  });
});
