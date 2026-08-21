import { describe, expect, it } from 'vitest';
import { dustdashLizard } from '../cards/data/red';
import { meadowFawn } from '../cards/data/green';
import { bondCard } from '../chao/bonding';
import { createChao } from '../chao/factory';
import { createRng } from '../rng';
import type { LegType, RaceConfig } from './race';
import { generateRaceCourse, resolveRace } from './race';

describe('resolveRace', () => {
  it('completes every leg when stats comfortably clear the difficulty curve', () => {
    const base = createChao({ id: 'c1', name: 'Test Chao', bornGeneration: 1 });
    const chao = { ...base, stats: { ...base.stats, run: 50, power: 50, swim: 50, fly: 50, stamina: 100 } };
    const config: RaceConfig = {
      legs: [
        { type: 'start', difficulty: 10, staminaCost: 5 },
        { type: 'sprint', difficulty: 10, staminaCost: 5 },
        { type: 'obstacle', difficulty: 10, staminaCost: 5 },
      ],
    };

    const result = resolveRace({ chao, loadedTechniques: [] }, config, createRng(1));

    expect(result.finished).toBe(true);
    expect(result.legsCompleted).toBe(3);
    expect(result.events.filter((e) => e.type === 'leg_result' && e.success)).toHaveLength(3);
  });

  it('DNFs once Stamina runs out before the course ends', () => {
    const base = createChao({ id: 'c1', name: 'Test Chao', bornGeneration: 1 });
    const chao = { ...base, stats: { ...base.stats, run: 50, stamina: 8 } };
    const config: RaceConfig = {
      legs: [
        { type: 'start', difficulty: 10, staminaCost: 5 },
        { type: 'sprint', difficulty: 10, staminaCost: 5 },
        { type: 'sprint', difficulty: 10, staminaCost: 5 },
      ],
    };

    const result = resolveRace({ chao, loadedTechniques: [] }, config, createRng(1));

    expect(result.finished).toBe(false);
    expect(result.events.some((e) => e.type === 'dnf')).toBe(true);
  });

  it('takes the shortcut fork when the Chao clears the shortcut threshold', () => {
    const base = createChao({ id: 'c1', name: 'Test Chao', bornGeneration: 1 });
    const chao = { ...base, stats: { ...base.stats, fly: 100, run: 0, stamina: 50 } };
    const config: RaceConfig = {
      legs: [
        {
          type: 'sprint',
          difficulty: 200, // the normal path is essentially impossible with run=0
          staminaCost: 5,
          fork: { shortcutStat: 'fly', shortcutThreshold: 20, shortcutDifficulty: 10 },
        },
      ],
    };

    const result = resolveRace({ chao, loadedTechniques: [] }, config, createRng(1));

    // fly=100 clears the shortcut threshold (20) comfortably even with
    // variance, and the shortcut leg's own difficulty (10) is trivial —
    // whereas the normal Sprint check (run=0 vs difficulty 200) could not
    // possibly succeed. Completing the leg proves the fork was taken.
    expect(result.legsCompleted).toBe(1);
    expect(result.finished).toBe(true);
  });

  it('takes the normal path when the shortcut threshold is not met', () => {
    const base = createChao({ id: 'c1', name: 'Test Chao', bornGeneration: 1 });
    const chao = { ...base, stats: { ...base.stats, fly: 0, run: 100, stamina: 50 } };
    const config: RaceConfig = {
      legs: [
        {
          type: 'sprint',
          difficulty: 10,
          staminaCost: 5,
          fork: { shortcutStat: 'fly', shortcutThreshold: 200, shortcutDifficulty: 0 },
        },
      ],
    };

    const result = resolveRace({ chao, loadedTechniques: [] }, config, createRng(1));

    // fly=0 can never clear a threshold of 200, forcing the normal path;
    // run=100 vs difficulty 10 succeeds easily there.
    expect(result.legsCompleted).toBe(1);
    expect(result.finished).toBe(true);
  });

  it("applies a Bond Card keyword's restoreStamina during the race (Graze)", () => {
    const base = createChao({ id: 'c1', name: 'Test Chao', bornGeneration: 1 });
    const { chao: withFawn } = bondCard(base, meadowFawn, createRng(9)); // attaches the Graze keyword (back region)
    // Stamina is pinned to a fixed value after bonding purely so the
    // arithmetic below is exact regardless of the bond's random grade roll —
    // bondedCards (what the keyword actually reads from) is untouched by this.
    const chao = { ...withFawn, stats: { ...withFawn.stats, run: 50, stamina: 100 } };
    const config: RaceConfig = {
      legs: [
        { type: 'sprint', difficulty: 10, staminaCost: 5 },
        { type: 'sprint', difficulty: 10, staminaCost: 5 },
      ],
    };

    const result = resolveRace({ chao, loadedTechniques: [] }, config, createRng(1));

    // currentStamina starts at the full 100 (reset at race start), so leg
    // 1's Graze regen has no room to apply (already at max) — only leg 2's
    // regen counts. Net loss is 5 + (5 - 1) = 9, not the full 10.
    expect(result.finalChao.currentStamina).toBe(100 - 9);
    expect(result.events.some((e) => e.type === 'keyword_fired' && e.cardId === meadowFawn.id)).toBe(
      true,
    );
  });

  it("auto-wins a matching Sprint leg via a Bond Card's autoWinLeg keyword", () => {
    const base = createChao({ id: 'c1', name: 'Test Chao', bornGeneration: 1 });
    const { chao: withLizard } = bondCard(base, dustdashLizard, createRng(9));
    const chao = { ...withLizard, stats: { ...withLizard.stats, run: 0, stamina: 50 } }; // run=0 would otherwise fail
    const config: RaceConfig = {
      legs: [{ type: 'sprint', difficulty: 999, staminaCost: 5 }],
    };

    const result = resolveRace({ chao, loadedTechniques: [] }, config, createRng(1));

    expect(result.legsCompleted).toBe(1);
    expect(result.events.some((e) => e.type === 'keyword_fired' && e.cardId === dustdashLizard.id)).toBe(
      true,
    );
  });

  it('is deterministic for a given seed', () => {
    const base = createChao({ id: 'c1', name: 'Test Chao', bornGeneration: 1 });
    const chao = { ...base, stats: { ...base.stats, run: 30, power: 30, swim: 30, fly: 30, stamina: 40 } };
    const config: RaceConfig = {
      legs: [
        { type: 'start', difficulty: 25, staminaCost: 5 },
        { type: 'sprint', difficulty: 25, staminaCost: 5 },
        { type: 'obstacle', difficulty: 25, staminaCost: 5 },
      ],
    };

    const resultA = resolveRace({ chao, loadedTechniques: [] }, config, createRng(77));
    const resultB = resolveRace({ chao, loadedTechniques: [] }, config, createRng(77));

    expect(resultA.finished).toBe(resultB.finished);
    expect(resultA.legsCompleted).toBe(resultB.legsCompleted);
    expect(resultA.events).toEqual(resultB.events);
  });

  it('resolves Climb and Jump legs against their own dedicated stats, not Power/Run', () => {
    const base = createChao({ id: 'c1', name: 'Test Chao', bornGeneration: 1 });
    // High Power/Run but zero Climb/Jump — if Climb/Jump were reflavors of
    // Power/Run these legs would trivially succeed; they should instead fail.
    const chao = {
      ...base,
      stats: { ...base.stats, power: 100, run: 100, climb: 0, jump: 0, stamina: 100 },
    };
    const config: RaceConfig = {
      legs: [
        { type: 'climb', difficulty: 20, staminaCost: 5 },
        { type: 'jump', difficulty: 20, staminaCost: 5 },
      ],
    };

    const result = resolveRace({ chao, loadedTechniques: [] }, config, createRng(1));

    expect(result.legsCompleted).toBe(0);
    expect(result.events.filter((e) => e.type === 'leg_result')).toEqual([
      { type: 'leg_result', chaoId: 'c1', legType: 'climb', success: false, stat: 'climb', difficulty: 20 },
      { type: 'leg_result', chaoId: 'c1', legType: 'jump', success: false, stat: 'jump', difficulty: 20 },
    ]);
  });
});

describe('generateRaceCourse', () => {
  it('produces between 5 and 8 legs by default, starting with Start', () => {
    for (let seed = 0; seed < 30; seed++) {
      const course = generateRaceCourse(createRng(seed));
      expect(course.legs.length).toBeGreaterThanOrEqual(5);
      expect(course.legs.length).toBeLessThanOrEqual(8);
      expect(course.legs[0]!.type).toBe('start');
    }
  });

  it('always includes at least 3 distinct Leg types', () => {
    for (let seed = 0; seed < 30; seed++) {
      const course = generateRaceCourse(createRng(seed));
      const distinctTypes = new Set(course.legs.map((leg) => leg.type));
      expect(distinctTypes.size).toBeGreaterThanOrEqual(3);
    }
  });

  it('only forks Water or Air legs, never others', () => {
    for (let seed = 0; seed < 30; seed++) {
      const course = generateRaceCourse(createRng(seed));
      for (const leg of course.legs) {
        if (leg.fork) {
          expect(['water', 'air']).toContain(leg.type as LegType);
        }
      }
    }
  });

  it('respects an explicit legCount override', () => {
    const course = generateRaceCourse(createRng(5), 6);
    expect(course.legs).toHaveLength(6);
  });

  it('is deterministic for a given seed', () => {
    const a = generateRaceCourse(createRng(42));
    const b = generateRaceCourse(createRng(42));
    expect(a).toEqual(b);
  });

  it('produces a resolvable course (resolveRace runs without throwing)', () => {
    const base = createChao({ id: 'c1', name: 'Test Chao', bornGeneration: 1 });
    const chao = {
      ...base,
      stats: { ...base.stats, run: 20, power: 20, swim: 20, fly: 20, climb: 20, jump: 20, stamina: 80 },
    };
    const course = generateRaceCourse(createRng(3));
    expect(() => resolveRace({ chao, loadedTechniques: [] }, course, createRng(4))).not.toThrow();
  });
});
