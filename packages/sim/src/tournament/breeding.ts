import type { Rng } from '../rng';
import { pickRandom } from '../rng';
import type { Chao, Stat } from '../types';
import { createChao } from '../chao/factory';
import { generateEntrant, generateEntrantNames } from './entrants';
import type { TournamentState } from './bracket';

// Breeding & Tournament-to-Tournament progression (roadmap.md Phase 5, GDD
// §6.4/§6.5). Decided 2026-08-20: elimination before the Final Race ends the
// run outright, no rescue-by-breeding-pick mechanic — so every call into
// this module assumes the caller (the player) reached and finished the
// Final Race, i.e. `state.finalRanking` is set and the player is one of the
// 3 entries in it.

export interface BreedingPools {
  first: string[]; // eligible partner chaoIds for the 1st-place finisher (21 of 24)
  second: string[]; // 18 of 24
  third: string[]; // 12 of 24, Round-1 casualties only
}

function requireFinalRanking(state: TournamentState): [string, string, string] {
  const [firstId, secondId, thirdId] = state.finalRanking ?? [];
  if (firstId === undefined || secondId === undefined || thirdId === undefined) {
    throw new Error('the Final Race has not resolved yet (need exactly 3 entries in finalRanking)');
  }
  return [firstId, secondId, thirdId];
}

// Tiered breeding-eligibility exclusion (GDD §6.4): 1st place excludes only
// the other 2 finalists (21 eligible); 2nd excludes the whole Group1234 pool
// (the 6 who reached Round 3, 18 eligible); 3rd excludes Group1234, Group12,
// and Group34 (narrowing to the 12 who were cut in Round 1). Computed purely
// from each entrant's `originGroup`/`eliminatedInRound`/`finalPlacement` —
// fields already tracked since Phase 3 specifically so this needed no new
// data-model work.
export function computeBreedingPools(state: TournamentState): BreedingPools {
  const [firstId, secondId, thirdId] = requireFinalRanking(state);
  const allIds = Object.keys(state.entrants);

  // Group1234: the 6 who reached Round 3 (survived to become one of the 3
  // finalists, or were eliminated in Round 3 itself).
  const group1234 = new Set(
    allIds.filter((id) => {
      const meta = state.entrants[id]!;
      return meta.finalPlacement !== undefined || meta.eliminatedInRound === 3;
    }),
  );
  // Group12/Group34: the 6 who ever reached Round 2 from each side (survived
  // Round 1 from originGroup 1-or-2 / 3-or-4 respectively) — a strict
  // superset of Group1234's corresponding half, per GDD §6.4's worked math.
  const group12 = new Set(
    allIds.filter((id) => {
      const meta = state.entrants[id]!;
      return (meta.originGroup === 1 || meta.originGroup === 2) && meta.eliminatedInRound !== 1;
    }),
  );
  const group34 = new Set(
    allIds.filter((id) => {
      const meta = state.entrants[id]!;
      return (meta.originGroup === 3 || meta.originGroup === 4) && meta.eliminatedInRound !== 1;
    }),
  );

  return {
    first: allIds.filter((id) => id !== firstId && id !== secondId && id !== thirdId),
    second: allIds.filter((id) => id !== secondId && !group1234.has(id)),
    third: allIds.filter((id) => id !== thirdId && !group12.has(id) && !group34.has(id)),
  };
}

const ALL_STATS: readonly Stat[] = [
  'swim', 'fly', 'run', 'power', 'climb', 'jump', 'stamina', 'mind', 'luck',
];

// Breeding: stat inheritance, v1 simplified (GDD §6.4, decided 2026-08-20) —
// flat, deterministic, no RNG: baby.stat = round(0.10*parentA + 0.10*parentB)
// for every stat. Otherwise a fresh createChao()-shaped blank slate (empty
// bondedCards/traits/items, Neutral alignment by construction) — cosmetic
// and skill inheritance are explicitly deferred, not guessed at here.
export function breedChao(parentA: Chao, parentB: Chao, id: string, name: string, bornGeneration: number): Chao {
  const baby = createChao({ id, name, bornGeneration });
  const stats = { ...baby.stats };
  for (const stat of ALL_STATS) {
    stats[stat] = Math.round(0.1 * parentA.stats[stat] + 0.1 * parentB.stats[stat]);
  }
  return { ...baby, stats };
}

export interface BreedingPair {
  finalistId: string;
  partnerId: string;
  baby: Chao;
}

export interface BreedingOutcome {
  pairs: BreedingPair[]; // exactly 3, in 1st/2nd/3rd order
}

// Resolves all 3 finalists' breeding picks. The player's own pick (only
// meaningful for whichever finalist is the player) is passed in explicitly;
// every other finalist picks uniformly at random from their own eligible
// pool — a simple placeholder, same status as the bot-drafting heuristics
// elsewhere in this codebase.
function resolveBreeding(
  state: TournamentState,
  pools: BreedingPools,
  playerPartnerId: string | undefined,
  babyNames: readonly [string, string, string],
  rng: Rng,
): BreedingOutcome {
  const [firstId, secondId, thirdId] = requireFinalRanking(state);
  const finalists: readonly [string, readonly string[]][] = [
    [firstId, pools.first],
    [secondId, pools.second],
    [thirdId, pools.third],
  ];

  const pairs = finalists.map(([finalistId, pool], index): BreedingPair => {
    const partnerId =
      finalistId === state.playerChaoId && playerPartnerId !== undefined
        ? playerPartnerId
        : pickRandom(pool, rng);
    const parentA = state.entrants[finalistId]!.chao;
    const parentB = state.entrants[partnerId]!.chao;
    const baby = breedChao(parentA, parentB, `baby-${index}`, babyNames[index]!, parentA.bornGeneration + 1);
    return { finalistId, partnerId, baby };
  });

  return { pairs };
}

export interface NextTournamentSetup {
  breeding: BreedingOutcome;
  playerBaby: Chao; // the player's own new starting Chao for the next Tournament
  others: Chao[]; // the other 23 entrants: 2 lineage babies + 21 fresh, GDD §6.5
}

// The full Tournament-to-tournament transition (GDD §6.5): always exactly 3
// lineage babies (one per finalist) + 21 freshly random entrants, every
// time — no pool, no draw rate, no size/decay to tune. Requires the player
// to be one of the 3 Final Race finalists (per the decided elimination
// rule, that's the only way this ever gets called: an eliminated run ends
// outright with no path back into a next Tournament).
export function prepareNextTournament(
  state: TournamentState,
  pools: BreedingPools,
  playerPartnerId: string | undefined,
  rng: Rng,
): NextTournamentSetup {
  const playerChao = state.entrants[state.playerChaoId]!.chao;
  const bornGeneration = playerChao.bornGeneration + 1;

  // One shared name draw across all 24 next-Tournament entrants (3 babies +
  // 21 fresh) so no two entrants can ever collide on name.
  const allNames = generateEntrantNames(24, rng);
  const babyNames: readonly [string, string, string] = [allNames[0]!, allNames[1]!, allNames[2]!];
  const freshNames = allNames.slice(3);

  const breeding = resolveBreeding(state, pools, playerPartnerId, babyNames, rng);
  const playerPair = breeding.pairs.find((pair) => pair.finalistId === state.playerChaoId);
  if (playerPair === undefined) {
    throw new Error('prepareNextTournament: the player is not one of the 3 Final Race finalists');
  }

  const otherBabies = breeding.pairs
    .filter((pair) => pair.finalistId !== state.playerChaoId)
    .map((pair) => pair.baby);
  const fresh = freshNames.map((name, i) =>
    generateEntrant(`entrant-gen${bornGeneration}-${i}`, name, bornGeneration, rng),
  );

  return { breeding, playerBaby: playerPair.baby, others: [...otherBabies, ...fresh] };
}
