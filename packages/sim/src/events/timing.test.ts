import { describe, expect, it } from 'vitest';
import { createChao } from '../chao/factory';
import { createRng } from '../rng';
import type { RaceConfig } from './race';
import { resolveRace } from './race';
import { computeRaceTiming } from './timing';

// Calibration check (2026-08-20): the user's own reference point is a
// brand-new, near-zero-stat Gen-1 baby Chao averaging ~9.0 seconds/Leg
// (5 Legs in ~45s, 10 Legs in ~90s) across the 15-30 difficulty range.
describe('computeRaceTiming', () => {
  it('averages ~9.0 seconds/Leg for a zero-stat Chao across the difficulty range', () => {
    const chao = createChao({ id: 'c1', name: 'Baby', bornGeneration: 1 });
    // One Leg at each extreme of the difficulty range, zero relevant stat —
    // a 0-stat Chao can never clear 15-30 difficulty against only ±5
    // variance, so both Legs are guaranteed fumbles regardless of rng seed.
    const config: RaceConfig = {
      legs: [
        { type: 'sprint', difficulty: 15, staminaCost: 0 },
        { type: 'sprint', difficulty: 30, staminaCost: 0 },
      ],
    };
    const chaoWithStamina = { ...chao, stats: { ...chao.stats, stamina: 999 } }; // avoid a DNF muddying the leg count
    const result = resolveRace({ chao: chaoWithStamina, loadedTechniques: [] }, config, createRng(1));
    const timing = computeRaceTiming(chaoWithStamina, result.events);

    expect(timing.legs).toHaveLength(2);
    expect(timing.legs.every((leg) => !leg.success)).toBe(true);
    // 8.3 + 9.8 (each individually rounded to the nearest 0.1) = 18.1 / 2 =
    // 9.05 — a small, expected per-leg rounding artifact right at the
    // calibration target, not exactly 9.0.
    const average = timing.totalSeconds / timing.legs.length;
    expect(average).toBeGreaterThanOrEqual(8.9);
    expect(average).toBeLessThanOrEqual(9.1);
  });

  it('is faster for a higher relevant stat, all else equal', () => {
    const weak = createChao({ id: 'weak', name: 'Weak', bornGeneration: 1 });
    const strong = { ...weak, id: 'strong', stats: { ...weak.stats, run: 50 } };
    const config: RaceConfig = { legs: [{ type: 'sprint', difficulty: 20, staminaCost: 0 }] };

    const weakWithStamina = { ...weak, stats: { ...weak.stats, stamina: 999 } };
    const strongWithStamina = { ...strong, stats: { ...strong.stats, stamina: 999 } };

    const weakResult = resolveRace({ chao: weakWithStamina, loadedTechniques: [] }, config, createRng(2));
    const strongResult = resolveRace({ chao: strongWithStamina, loadedTechniques: [] }, config, createRng(2));

    const weakTiming = computeRaceTiming(weakWithStamina, weakResult.events);
    const strongTiming = computeRaceTiming(strongWithStamina, strongResult.events);

    expect(strongTiming.totalSeconds).toBeLessThan(weakTiming.totalSeconds);
  });

  it('penalizes a fumbled (failed) Leg with extra time', () => {
    const chao = createChao({ id: 'c1', name: 'Test', bornGeneration: 1 });
    const chaoWithStamina = { ...chao, stats: { ...chao.stats, stamina: 999 } };
    const config: RaceConfig = { legs: [{ type: 'sprint', difficulty: 30, staminaCost: 0 }] };
    const result = resolveRace({ chao: chaoWithStamina, loadedTechniques: [] }, config, createRng(3));

    expect(result.events.some((e) => e.type === 'leg_result' && !e.success)).toBe(true);
    const timing = computeRaceTiming(chaoWithStamina, result.events);
    expect(timing.legs[0]?.success).toBe(false);
    // A 0-stat Chao vs difficulty 30 without the fumble penalty would be
    // 4.75 + 0.1*30 = 7.75s; with the penalty it must be higher than that.
    expect(timing.legs[0]?.seconds).toBeGreaterThan(7.75);
  });

  it('rounds every value to the tenth of a second', () => {
    const chao = createChao({ id: 'c1', name: 'Test', bornGeneration: 1 });
    const chaoWithStamina = { ...chao, stats: { ...chao.stats, stamina: 999, run: 7 } };
    const config: RaceConfig = { legs: [{ type: 'sprint', difficulty: 22, staminaCost: 0 }] };
    const result = resolveRace({ chao: chaoWithStamina, loadedTechniques: [] }, config, createRng(4));
    const timing = computeRaceTiming(chaoWithStamina, result.events);

    for (const leg of timing.legs) {
      expect(Math.round(leg.seconds * 10)).toBe(leg.seconds * 10);
    }
    expect(Math.round(timing.totalSeconds * 10)).toBe(timing.totalSeconds * 10);
  });
});
