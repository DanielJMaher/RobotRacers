import { describe, expect, it } from 'vitest';
import { createChao } from '../chao/factory';
import { createRng } from '../rng';
import type { Chao, Stat } from '../types';
import { resolveGroupToTopThree, runFieldRace, runGroupEliminationRace } from './fieldRace';

const ALL_LEG_STATS: Stat[] = ['swim', 'fly', 'run', 'power', 'climb', 'jump'];

// A Chao with every Leg-relevant stat pinned to `value` — deliberately
// extreme so a race's outcome is decided by stat gap, not by the +/-5
// variance roll or 15-30 difficulty range (events/race.ts), keeping these
// tests deterministic despite resolveRace's own randomness.
function makeChao(id: string, value: number, stamina: number): Chao {
  const chao = createChao({ id, name: id, bornGeneration: 1 });
  const stats = { ...chao.stats };
  for (const stat of ALL_LEG_STATS) stats[stat] = value;
  stats.stamina = stamina;
  return { ...chao, stats };
}

describe('runFieldRace', () => {
  it('ranks a strong Chao ahead of a weak one', () => {
    const strong = makeChao('strong', 200, 500);
    const weak = makeChao('weak', 0, 5);
    const { ranking } = runFieldRace([strong, weak], {}, createRng(1));
    expect(ranking).toEqual(['strong', 'weak']);
  });

  it('produces a ranking covering every entrant exactly once', () => {
    const field = [makeChao('a', 40, 100), makeChao('b', 30, 100), makeChao('c', 50, 100)];
    const { ranking } = runFieldRace(field, {}, createRng(2));
    expect(new Set(ranking)).toEqual(new Set(['a', 'b', 'c']));
    expect(ranking).toHaveLength(3);
  });
});

describe('runGroupEliminationRace', () => {
  it('eliminates exactly the last-place finisher', () => {
    const strong = makeChao('strong', 200, 500);
    const mid = makeChao('mid', 40, 100);
    const weak = makeChao('weak', 0, 5);
    const outcome = runGroupEliminationRace([strong, mid, weak], {}, createRng(3));

    expect(outcome.eliminatedChaoId).toBe('weak');
    expect(outcome.survivingChaos.map((c) => c.id)).toEqual(['strong', 'mid']);
  });
});

describe('resolveGroupToTopThree', () => {
  it('reduces a group of 6 to exactly 3 survivors with 3 eliminations, weakest first', () => {
    const field = [
      makeChao('rank1', 200, 500),
      makeChao('rank2', 160, 400),
      makeChao('rank3', 120, 300),
      makeChao('rank4', 80, 200),
      makeChao('rank5', 40, 100),
      makeChao('rank6', 0, 5),
    ];
    const { survivors, eliminatedChaoIds } = resolveGroupToTopThree(field, createRng(4));

    expect(survivors).toHaveLength(3);
    expect(eliminatedChaoIds).toHaveLength(3);
    expect(survivors.map((c) => c.id)).toEqual(['rank1', 'rank2', 'rank3']);
    expect(eliminatedChaoIds).toEqual(['rank6', 'rank5', 'rank4']);
  });
});
