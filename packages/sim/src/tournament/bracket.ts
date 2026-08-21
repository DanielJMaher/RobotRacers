import type { Rng } from '../rng';
import { shuffle } from '../rng';
import type { Chao, SimEvent, StatColor, TechniqueCard } from '../types';
import type { RaceConfig, RaceResult } from '../events/race';
import { generateEntrant, generateEntrantNames } from './entrants';
import { resolveGroupToTopThree, runFieldRace, runGroupEliminationRace } from './fieldRace';

// Tournament bracket core loop (roadmap.md Phase 3, GDD §6.2). No Environment
// Interludes or Breeding yet — those are Phase 4/5. See architecture.md §5.5
// for the design this implements.

export interface TournamentEntrantMeta {
  chao: Chao;
  isPlayer: boolean;
  originGroup: 1 | 2 | 3 | 4; // which of the 4 Round-1 groups this entrant started in
  eliminatedInRound?: 1 | 2 | 3; // absent while still active, or for the 3 Final Race entrants
  finalPlacement?: 1 | 2 | 3; // set only once the Final Race resolves
}

export type TournamentPhase =
  | 'round1'
  | 'round2'
  | 'round3'
  | 'final_race'
  | 'complete' // reached and finished the Final Race
  | 'eliminated'; // the player's Chao was cut before the Final Race — run over, GDD §6.6

// 1st place scores 6, one fewer per place behind (GDD §6.6) — applied by
// placement number regardless of the current field size, so the 3-racer
// Final Race just uses the first 3 entries of the same fixed table.
const SCORE_TABLE: readonly number[] = [6, 5, 4, 3, 2, 1];

const ROUND_NUMBER: Record<'round1' | 'round2' | 'round3', 1 | 2 | 3> = {
  round1: 1,
  round2: 2,
  round3: 3,
};

const FINAL_RACE_LEG_COUNT = 10; // GDD §6.4 — "we will design this better later"

export interface TournamentState {
  entrants: Record<string, TournamentEntrantMeta>; // all 24, by chao id
  playerChaoId: string;
  phase: TournamentPhase;
  activeGroup: string[]; // chaoIds in the player's live group this round (or the 3 finalists once phase is 'final_race')
  racesRunThisRound: number; // 0..3
  playerScore: number;
  round2Partner: string[]; // pre-resolved top-3 chaoIds, merged in once Round 1 ends
  round3Partner: string[]; // pre-resolved top-3 chaoIds, merged in once Round 2 ends
  finalRanking?: string[]; // chaoIds, best to worst, once phase is 'complete'
}

function scoreForPlacement(placement: number): number {
  return SCORE_TABLE[placement - 1] ?? 0;
}

function dominantColor(chao: Chao): StatColor | undefined {
  const counts: Partial<Record<StatColor, number>> = {};
  for (const { card } of chao.bondedCards) {
    if (card.color === 'colorless') continue;
    counts[card.color] = (counts[card.color] ?? 0) + 1;
  }
  let winner: StatColor | undefined;
  let winnerCount = 0;
  for (const [color, count] of Object.entries(counts) as [StatColor, number][]) {
    if (count > winnerCount) {
      winner = color;
      winnerCount = count;
    }
  }
  return winner;
}

// First Evolution: locks in Hero/Dark/Neutral form (GDD §3.4), triggered
// (decided 2026-08-20) at the same bracket-progress point as Environment
// Interlude #1 — when the player's group first shrinks to 3, ending Round 1.
// Idempotent so it's safe to call unconditionally at that transition.
function applyFirstEvolution(chao: Chao): Chao {
  if (chao.evolutionStage >= 1) return chao;
  return { ...chao, evolutionStage: 1, evolvedAlignment: chao.alignment };
}

// Second Evolution: locks in the dominant stat color (GDD §3.4), triggered
// at the same point as Environment Interlude #2 — end of Round 2. The "small
// passive" GDD §3.4 mentions each Evolution granting remains an explicit
// open TODO (see the Chao.evolvedAlignment/evolvedColor doc comment) — this
// only locks in the cosmetic/flavor identity, no numeric bonus yet.
function applySecondEvolution(chao: Chao): Chao {
  if (chao.evolutionStage >= 2) return chao;
  const color = dominantColor(chao);
  return color === undefined
    ? { ...chao, evolutionStage: 2 }
    : { ...chao, evolutionStage: 2, evolvedColor: color };
}

// Builds all 24 entrants, assigns the 4 Round-1 groups, and eagerly resolves
// every branch that never touches the player's own choices (architecture.md
// §5.5: off-path groups only need a final ranking). Per GDD §6.2's fixed
// pairing (Group1+2 -> Group12, Group3+4 -> Group34), whichever of the other
// 3 groups is paired with the player's gets raced down to its own top 3
// (`round2Partner`, merged in once Round 1 ends); the remaining 2 groups are
// raced all the way through their own Round 1 *and* Round 2 to a single top 3
// (`round3Partner`, merged in once Round 2 ends) — none of that depends on
// anything the player does, so it all happens right here, up front.
//
// `others` (roadmap.md Phase 5): pass the 23 non-player entrants explicitly
// for a Tournament-to-tournament transition (2 lineage babies + 21 fresh,
// built by `tournament/breeding.ts`'s `prepareNextTournament`) — omit it for
// a fresh Tournament 1, which generates all 23 procedurally as before.
export function createTournament(playerChao: Chao, rng: Rng, others?: Chao[]): TournamentState {
  const resolvedOthers =
    others ??
    generateEntrantNames(23, rng).map((name, i) =>
      generateEntrant(`entrant-${i}`, name, playerChao.bornGeneration, rng),
    );
  if (resolvedOthers.length !== 23) {
    throw new Error(`createTournament: expected exactly 23 other entrants, got ${resolvedOthers.length}`);
  }
  const shuffled = shuffle([playerChao, ...resolvedOthers], rng);
  const groups: Chao[][] = [0, 1, 2, 3].map((g) => shuffled.slice(g * 6, g * 6 + 6));

  const playerGroupIdx = groups.findIndex((group) => group.some((c) => c.id === playerChao.id));
  const pairedIdx = playerGroupIdx % 2 === 0 ? playerGroupIdx + 1 : playerGroupIdx - 1;
  const offPathIdxs = [0, 1, 2, 3].filter((i) => i !== playerGroupIdx && i !== pairedIdx);

  const entrants: Record<string, TournamentEntrantMeta> = {};
  groups.forEach((group, groupIdx) => {
    for (const chao of group) {
      entrants[chao.id] = { chao, isPlayer: chao.id === playerChao.id, originGroup: (groupIdx + 1) as 1 | 2 | 3 | 4 };
    }
  });

  const pairedResult = resolveGroupToTopThree(groups[pairedIdx]!, rng); // Round 1 only, 6->3
  const offPathA = resolveGroupToTopThree(groups[offPathIdxs[0]!]!, rng); // Round 1, 6->3
  const offPathB = resolveGroupToTopThree(groups[offPathIdxs[1]!]!, rng); // Round 1, 6->3
  const offPathRound2 = resolveGroupToTopThree([...offPathA.survivors, ...offPathB.survivors], rng); // Round 2, 6->3

  for (const id of pairedResult.eliminatedChaoIds) entrants[id]!.eliminatedInRound = 1;
  for (const id of [...offPathA.eliminatedChaoIds, ...offPathB.eliminatedChaoIds]) {
    entrants[id]!.eliminatedInRound = 1;
  }
  for (const id of offPathRound2.eliminatedChaoIds) entrants[id]!.eliminatedInRound = 2;

  const round2Partner = pairedResult.survivors;
  const round3Partner = offPathRound2.survivors;
  for (const survivor of [...round2Partner, ...round3Partner]) {
    entrants[survivor.id] = { ...entrants[survivor.id]!, chao: survivor };
  }

  return {
    entrants,
    playerChaoId: playerChao.id,
    phase: 'round1',
    activeGroup: groups[playerGroupIdx]!.map((c) => c.id),
    racesRunThisRound: 0,
    playerScore: 0,
    round2Partner: round2Partner.map((c) => c.id),
    round3Partner: round3Partner.map((c) => c.id),
  };
}

export interface PlayerRaceOutcome {
  state: TournamentState;
  ranking: string[];
  raceEvents: SimEvent[];
  results: Record<string, RaceResult>; // per-entrant, for e.g. a Race Results screen's per-Leg timing
  course: RaceConfig;
  eliminatedChaoId: string;
  playerEliminated: boolean;
  roundJustCompleted?: 1 | 2 | 3; // set only on the race that closes out a round
}

// Advances the player's own active group by exactly one race: generates a
// course, runs the whole current group through it, cuts the last-place
// finisher, and — once that's the group's 3rd race — consolidates with the
// relevant pre-resolved partner (or, after Round 3, hands off to the Final
// Race) per GDD §6.2's diagram.
export function advancePlayerGroupRace(
  state: TournamentState,
  playerLoadedTechniques: TechniqueCard[],
  rng: Rng,
): PlayerRaceOutcome {
  if (state.phase !== 'round1' && state.phase !== 'round2' && state.phase !== 'round3') {
    throw new Error(`advancePlayerGroupRace: not in a group-race phase (currently ${state.phase})`);
  }

  const field = state.activeGroup.map((id) => state.entrants[id]!.chao);
  const outcome = runGroupEliminationRace(field, { [state.playerChaoId]: playerLoadedTechniques }, rng);

  const nextEntrants = { ...state.entrants };
  nextEntrants[outcome.eliminatedChaoId] = {
    ...nextEntrants[outcome.eliminatedChaoId]!,
    eliminatedInRound: ROUND_NUMBER[state.phase],
  };
  for (const survivor of outcome.survivingChaos) {
    nextEntrants[survivor.id] = { ...nextEntrants[survivor.id]!, chao: survivor };
  }

  const placement = outcome.ranking.indexOf(state.playerChaoId) + 1;
  const playerScore = state.playerScore + scoreForPlacement(placement);
  const playerEliminated = outcome.eliminatedChaoId === state.playerChaoId;
  const base = {
    ranking: outcome.ranking,
    raceEvents: outcome.raceEvents,
    results: outcome.results,
    course: outcome.course,
    eliminatedChaoId: outcome.eliminatedChaoId,
  };

  if (playerEliminated) {
    return {
      ...base,
      playerEliminated: true,
      state: { ...state, entrants: nextEntrants, phase: 'eliminated', activeGroup: [], playerScore },
    };
  }

  const racesRunThisRound = state.racesRunThisRound + 1;
  if (racesRunThisRound < 3) {
    return {
      ...base,
      playerEliminated: false,
      state: {
        ...state,
        entrants: nextEntrants,
        activeGroup: outcome.survivingChaos.map((c) => c.id),
        racesRunThisRound,
        playerScore,
      },
    };
  }

  // Round complete: consolidate with the relevant pre-resolved partner (or,
  // after Round 3, hand off to the Final Race) and apply whichever
  // Evolution fires at this milestone.
  const survivorIds = outcome.survivingChaos.map((c) => c.id);

  if (state.phase === 'round1') {
    const playerChao = applyFirstEvolution(nextEntrants[state.playerChaoId]!.chao);
    nextEntrants[state.playerChaoId] = { ...nextEntrants[state.playerChaoId]!, chao: playerChao };
    return {
      ...base,
      playerEliminated: false,
      roundJustCompleted: 1,
      state: {
        ...state,
        entrants: nextEntrants,
        phase: 'round2',
        activeGroup: [...survivorIds, ...state.round2Partner],
        racesRunThisRound: 0,
        playerScore,
      },
    };
  }

  if (state.phase === 'round2') {
    const playerChao = applySecondEvolution(nextEntrants[state.playerChaoId]!.chao);
    nextEntrants[state.playerChaoId] = { ...nextEntrants[state.playerChaoId]!, chao: playerChao };
    return {
      ...base,
      playerEliminated: false,
      roundJustCompleted: 2,
      state: {
        ...state,
        entrants: nextEntrants,
        phase: 'round3',
        activeGroup: [...survivorIds, ...state.round3Partner],
        racesRunThisRound: 0,
        playerScore,
      },
    };
  }

  // state.phase === 'round3': the 3 survivors go straight to the Final Race.
  return {
    ...base,
    playerEliminated: false,
    roundJustCompleted: 3,
    state: {
      ...state,
      entrants: nextEntrants,
      phase: 'final_race',
      activeGroup: survivorIds,
      racesRunThisRound: 0,
      playerScore,
    },
  };
}

export interface FinalRaceOutcome {
  state: TournamentState;
  ranking: string[];
  raceEvents: SimEvent[];
  results: Record<string, RaceResult>;
  course: RaceConfig;
}

// The Final Race (GDD §6.4): longer (10 Legs) and ranks all 3 survivors
// without eliminating anyone — 1st/2nd/3rd place is what Breeding (Phase 5,
// not built here) will key off of.
export function runFinalRace(
  state: TournamentState,
  playerLoadedTechniques: TechniqueCard[],
  rng: Rng,
): FinalRaceOutcome {
  if (state.phase !== 'final_race') {
    throw new Error(`runFinalRace: not ready for the Final Race (currently ${state.phase})`);
  }

  const field = state.activeGroup.map((id) => state.entrants[id]!.chao);
  const outcome = runFieldRace(
    field,
    { [state.playerChaoId]: playerLoadedTechniques },
    rng,
    FINAL_RACE_LEG_COUNT,
  );

  const nextEntrants = { ...state.entrants };
  outcome.ranking.forEach((id, index) => {
    nextEntrants[id] = {
      ...nextEntrants[id]!,
      chao: outcome.results[id]!.finalChao,
      finalPlacement: (index + 1) as 1 | 2 | 3,
    };
  });

  const placement = outcome.ranking.indexOf(state.playerChaoId) + 1;
  const playerScore = state.playerScore + scoreForPlacement(placement);

  return {
    ranking: outcome.ranking,
    raceEvents: outcome.raceEvents,
    results: outcome.results,
    course: outcome.course,
    state: { ...state, entrants: nextEntrants, phase: 'complete', playerScore, finalRanking: outcome.ranking },
  };
}
