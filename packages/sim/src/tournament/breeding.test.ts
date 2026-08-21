import { describe, expect, it } from 'vitest';
import { createChao } from '../chao/factory';
import { createRng } from '../rng';
import type { Chao, Stat } from '../types';
import {
  advancePlayerGroupRace,
  createTournament,
  runFinalRace,
  type TournamentEntrantMeta,
  type TournamentState,
} from './bracket';
import { breedChao, computeBreedingPools, prepareNextTournament } from './breeding';

const ALL_LEG_STATS: Stat[] = ['swim', 'fly', 'run', 'power', 'climb', 'jump'];

function makeChao(id: string, value: number, stamina: number): Chao {
  const chao = createChao({ id, name: id, bornGeneration: 1 });
  const stats = { ...chao.stats };
  for (const stat of ALL_LEG_STATS) stats[stat] = value;
  stats.stamina = stamina;
  return { ...chao, stats };
}

function meta(chao: Chao, originGroup: 1 | 2 | 3 | 4, overrides: Partial<TournamentEntrantMeta> = {}): TournamentEntrantMeta {
  return { chao, isPlayer: false, originGroup, ...overrides };
}

// Hand-built 24-entrant bracket state matching GDD §6.2's real shape exactly
// (4 groups of 6 -> Round 1 -> Group12/Group34 -> Round 2 -> Group1234 ->
// Round 3 -> 3 finalists), so computeBreedingPools's tiered exclusion math
// can be checked against known-correct membership rather than just sizes.
function buildCompletedBracketState(): TournamentState {
  const entrants: Record<string, TournamentEntrantMeta> = {};

  // Round-1 eliminated (3 per group, 12 total) — untouched originGroup only.
  for (const [group, ids] of [
    [1, ['g1e1', 'g1e2', 'g1e3']],
    [2, ['g2e1', 'g2e2', 'g2e3']],
    [3, ['g3e1', 'g3e2', 'g3e3']],
    [4, ['g4e1', 'g4e2', 'g4e3']],
  ] as [1 | 2 | 3 | 4, string[]][]) {
    for (const id of ids) entrants[id] = meta(makeChao(id, 10, 100), group, { eliminatedInRound: 1 });
  }

  // Round-2 eliminated (3 from each side, 6 total): reached Round 2 from
  // their origin group, cut before Round 3.
  for (const [group, ids] of [
    [1, ['g1s3']],
    [2, ['g2s2', 'g2s3']],
    [3, ['g3s3']],
    [4, ['g4s2', 'g4s3']],
  ] as [1 | 2 | 3 | 4, string[]][]) {
    for (const id of ids) entrants[id] = meta(makeChao(id, 20, 100), group, { eliminatedInRound: 2 });
  }

  // Round-3 eliminated (3 total): reached Round 3 (Group1234) but not the
  // Final Race.
  entrants['g2s1'] = meta(makeChao('g2s1', 30, 100), 2, { eliminatedInRound: 3 });
  entrants['g3s2'] = meta(makeChao('g3s2', 30, 100), 3, { eliminatedInRound: 3 });
  entrants['g4s1'] = meta(makeChao('g4s1', 30, 100), 4, { eliminatedInRound: 3 });

  // The 3 Final Race finalists.
  entrants['g1s1'] = meta(makeChao('g1s1', 40, 100), 1, { finalPlacement: 1, isPlayer: true });
  entrants['g1s2'] = meta(makeChao('g1s2', 40, 100), 1, { finalPlacement: 2 });
  entrants['g3s1'] = meta(makeChao('g3s1', 40, 100), 3, { finalPlacement: 3 });

  return {
    entrants,
    playerChaoId: 'g1s1',
    phase: 'complete',
    activeGroup: [],
    racesRunThisRound: 0,
    playerScore: 18,
    round2Partner: [],
    round3Partner: [],
    finalRanking: ['g1s1', 'g1s2', 'g3s1'],
  };
}

describe('computeBreedingPools', () => {
  const state = buildCompletedBracketState();
  const pools = computeBreedingPools(state);

  it('1st place excludes only the other 2 finalists (21 eligible)', () => {
    expect(pools.first).toHaveLength(21);
    expect(pools.first).not.toContain('g1s1');
    expect(pools.first).not.toContain('g1s2');
    expect(pools.first).not.toContain('g3s1');
    expect(pools.first).toContain('g2s1'); // a Round-3 casualty is a legal pick for 1st
  });

  it('2nd place excludes the whole Group1234 pool (18 eligible)', () => {
    expect(pools.second).toHaveLength(18);
    for (const id of ['g1s1', 'g1s2', 'g3s1', 'g2s1', 'g3s2', 'g4s1']) {
      expect(pools.second, id).not.toContain(id);
    }
    expect(pools.second).toContain('g1s3'); // a Round-2 casualty is still eligible for 2nd
  });

  it('3rd place narrows to only Round-1 casualties (12 eligible)', () => {
    expect(pools.third).toHaveLength(12);
    const expected = [
      'g1e1', 'g1e2', 'g1e3', 'g2e1', 'g2e2', 'g2e3',
      'g3e1', 'g3e2', 'g3e3', 'g4e1', 'g4e2', 'g4e3',
    ];
    expect(new Set(pools.third)).toEqual(new Set(expected));
  });

  it('throws if the Final Race has not resolved yet', () => {
    const { finalRanking: _finalRanking, ...notDone } = state;
    expect(() => computeBreedingPools(notDone as TournamentState)).toThrow();
  });
});

describe('breedChao', () => {
  it('applies the flat 10%+10% formula to every stat, rounded', () => {
    const parentA = makeChao('a', 50, 100);
    const parentB = makeChao('b', 30, 60);
    const baby = breedChao(parentA, parentB, 'baby', 'Baby', 2);

    // swim/fly/run/power/climb/jump all set to the "value" param above.
    for (const stat of ALL_LEG_STATS) {
      expect(baby.stats[stat]).toBe(Math.round(0.1 * 50 + 0.1 * 30)); // 8
    }
    expect(baby.stats.stamina).toBe(Math.round(0.1 * 100 + 0.1 * 60)); // 16
    expect(baby.id).toBe('baby');
    expect(baby.name).toBe('Baby');
    expect(baby.bornGeneration).toBe(2);
  });

  it('otherwise starts as a fresh blank-slate Chao', () => {
    const baby = breedChao(makeChao('a', 50, 100), makeChao('b', 30, 60), 'baby', 'Baby', 2);
    expect(baby.bondedCards).toEqual([]);
    expect(baby.traits).toEqual([]);
    expect(baby.items).toEqual([]);
    expect(baby.alignment).toBe('neutral');
    expect(baby.evolutionStage).toBe(0);
  });
});

function playThroughToFinalRace(rng: () => number) {
  const player = makeChao('player', 999, 999);
  let state = createTournament(player, rng);
  while (state.phase === 'round1' || state.phase === 'round2' || state.phase === 'round3') {
    state = advancePlayerGroupRace(state, [], rng).state;
  }
  return runFinalRace(state, [], rng).state;
}

describe('prepareNextTournament', () => {
  it('builds the player a baby, and exactly 23 others (2 lineage babies + 21 fresh)', () => {
    const rng = createRng(20);
    const completed = playThroughToFinalRace(rng);
    expect(completed.finalRanking![0]).toBe('player'); // overwhelmingly strong player -> 1st place

    const pools = computeBreedingPools(completed);
    const chosenPartner = pools.first[0]!;
    const setup = prepareNextTournament(completed, pools, chosenPartner, rng);

    expect(setup.breeding.pairs).toHaveLength(3);
    const playerPair = setup.breeding.pairs.find((p) => p.finalistId === 'player')!;
    expect(playerPair.partnerId).toBe(chosenPartner);
    expect(setup.playerBaby.id).toBe(playerPair.baby.id);
    expect(setup.playerBaby.bornGeneration).toBe(2); // player's bornGeneration (1) + 1

    expect(setup.others).toHaveLength(23);
    const otherBabyIds = setup.breeding.pairs
      .filter((p) => p.finalistId !== 'player')
      .map((p) => p.baby.id);
    for (const id of otherBabyIds) {
      expect(setup.others.some((c) => c.id === id)).toBe(true);
    }
    // No duplicate names across the full next-Tournament roster (player's
    // baby + the 23 others) — all drawn from one shared shuffle.
    const allNames = [setup.playerBaby.name, ...setup.others.map((c) => c.name)];
    expect(new Set(allNames).size).toBe(allNames.length);
  });

  it('throws if the player is not one of the 3 Final Race finalists', () => {
    const state = buildCompletedBracketState();
    const notPlayerState: TournamentState = { ...state, playerChaoId: 'g2s1' }; // a Round-3 casualty, not a finalist
    const pools = computeBreedingPools(notPlayerState);
    expect(() => prepareNextTournament(notPlayerState, pools, undefined, createRng(21))).toThrow();
  });
});

describe('createTournament with an explicit `others` roster', () => {
  it('uses the provided 23 entrants unchanged instead of generating fresh ones', () => {
    const player = makeChao('player', 40, 150);
    const others = Array.from({ length: 23 }, (_, i) => makeChao(`fixed-${i}`, 10, 100));
    const state = createTournament(player, createRng(22), others);

    for (const chao of others) {
      expect(state.entrants[chao.id]).toBeDefined();
    }
  });

  it('throws if the provided roster is not exactly 23 entrants', () => {
    const player = makeChao('player', 40, 150);
    const tooFew = Array.from({ length: 5 }, (_, i) => makeChao(`fixed-${i}`, 10, 100));
    expect(() => createTournament(player, createRng(23), tooFew)).toThrow();
  });
});
