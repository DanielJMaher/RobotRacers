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

const ALL_LEG_STATS: Stat[] = ['swim', 'fly', 'run', 'power', 'climb', 'jump'];

function makeChao(id: string, value: number, stamina: number): Chao {
  const chao = createChao({ id, name: id, bornGeneration: 1 });
  const stats = { ...chao.stats };
  for (const stat of ALL_LEG_STATS) stats[stat] = value;
  stats.stamina = stamina;
  return { ...chao, stats };
}

describe('createTournament', () => {
  it('builds 24 entrants total, with the player in a 6-entrant active group', () => {
    const player = makeChao('player', 40, 150);
    const state = createTournament(player, createRng(1));

    expect(Object.keys(state.entrants)).toHaveLength(24);
    expect(state.phase).toBe('round1');
    expect(state.activeGroup).toHaveLength(6);
    expect(state.activeGroup).toContain('player');
    expect(state.playerChaoId).toBe('player');
  });

  it('pre-resolves round2Partner and round3Partner as 3 disjoint entrants each', () => {
    const player = makeChao('player', 40, 150);
    const state = createTournament(player, createRng(2));

    expect(state.round2Partner).toHaveLength(3);
    expect(state.round3Partner).toHaveLength(3);
    const allIds = [...state.activeGroup, ...state.round2Partner, ...state.round3Partner];
    expect(new Set(allIds).size).toBe(12); // 6 + 3 + 3, no overlap
  });

  it('marks every non-active entrant as eliminated in round 1 or 2', () => {
    const player = makeChao('player', 40, 150);
    const state = createTournament(player, createRng(3));
    const pending = new Set([...state.activeGroup, ...state.round2Partner, ...state.round3Partner]);

    for (const [id, meta] of Object.entries(state.entrants) as [string, TournamentEntrantMeta][]) {
      if (pending.has(id)) continue;
      expect(meta.eliminatedInRound).toBeGreaterThanOrEqual(1);
      expect(meta.eliminatedInRound).toBeLessThanOrEqual(2);
    }
  });
});

// Drives an overwhelmingly strong player through 9 group races (3 per round)
// to reach the Final Race deterministically, regardless of the randomly
// generated bots' stats (capped much lower, see tournament/entrants.ts).
function playThroughGroupStages(state: TournamentState, rng: () => number) {
  let current = state;
  let lastOutcome: ReturnType<typeof advancePlayerGroupRace> | undefined;
  while (current.phase === 'round1' || current.phase === 'round2' || current.phase === 'round3') {
    lastOutcome = advancePlayerGroupRace(current, [], rng);
    current = lastOutcome.state;
  }
  return { state: current, lastOutcome };
}

describe('advancePlayerGroupRace', () => {
  it('carries an overwhelmingly strong player through all 3 rounds to the Final Race', () => {
    const rng = createRng(7);
    const player = makeChao('player', 999, 999);
    const initial = createTournament(player, rng);

    const { state } = playThroughGroupStages(initial, rng);

    expect(state.phase).toBe('final_race');
    expect(state.activeGroup).toHaveLength(3);
    expect(state.activeGroup).toContain('player');
    expect(state.entrants['player']!.chao.evolutionStage).toBe(2);
    expect(state.entrants['player']!.chao.evolvedAlignment).toBe('neutral'); // no bonded cards -> neutral
    expect(state.playerScore).toBeGreaterThan(0);
  });

  it('ends the run when the player is last-placed out of their group', () => {
    const weakPlayer = makeChao('player', 0, 1);
    const strongBots = [
      makeChao('bot1', 200, 500),
      makeChao('bot2', 200, 500),
      makeChao('bot3', 200, 500),
      makeChao('bot4', 200, 500),
      makeChao('bot5', 200, 500),
    ];
    const entrants: Record<string, { chao: Chao; isPlayer: boolean; originGroup: 1 }> = {};
    for (const chao of [weakPlayer, ...strongBots]) {
      entrants[chao.id] = { chao, isPlayer: chao.id === 'player', originGroup: 1 };
    }
    const state: TournamentState = {
      entrants,
      playerChaoId: 'player',
      phase: 'round1',
      activeGroup: Object.keys(entrants),
      racesRunThisRound: 0,
      playerScore: 0,
      round2Partner: [],
      round3Partner: [],
    };

    const outcome = advancePlayerGroupRace(state, [], createRng(8));
    expect(outcome.playerEliminated).toBe(true);
    expect(outcome.eliminatedChaoId).toBe('player');
    expect(outcome.state.phase).toBe('eliminated');
    expect(outcome.state.activeGroup).toEqual([]);
  });

  it('throws once the group stage is already past (final_race/complete/eliminated)', () => {
    const player = makeChao('player', 40, 150);
    const state = createTournament(player, createRng(9));
    const doneState: TournamentState = { ...state, phase: 'complete' };
    expect(() => advancePlayerGroupRace(doneState, [], createRng(10))).toThrow();
  });
});

describe('runFinalRace', () => {
  it('ranks all 3 finalists, assigns finalPlacement, and completes the tournament', () => {
    const rng = createRng(11);
    const player = makeChao('player', 999, 999);
    const initial = createTournament(player, rng);
    const { state: readyForFinal } = playThroughGroupStages(initial, rng);

    const { state } = runFinalRace(readyForFinal, [], rng);

    expect(state.phase).toBe('complete');
    expect(state.finalRanking).toHaveLength(3);
    for (const id of state.finalRanking!) {
      expect(state.entrants[id]!.finalPlacement).toBeGreaterThanOrEqual(1);
      expect(state.entrants[id]!.finalPlacement).toBeLessThanOrEqual(3);
    }
    // The overwhelmingly strongest Chao should place 1st.
    expect(state.finalRanking![0]).toBe('player');
    expect(state.entrants['player']!.finalPlacement).toBe(1);
  });

  it('throws if called before the group stage reaches final_race', () => {
    const player = makeChao('player', 40, 150);
    const state = createTournament(player, createRng(12));
    expect(() => runFinalRace(state, [], createRng(13))).toThrow();
  });
});
