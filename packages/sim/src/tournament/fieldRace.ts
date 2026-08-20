import type { Rng } from '../rng';
import type { Chao, SimEvent, TechniqueCard } from '../types';
import { generateRaceCourse, resolveRace, type RaceConfig, type RaceResult } from '../events/race';

export interface FieldRaceOutcome {
  ranking: string[]; // chaoIds, best to worst
  results: Record<string, RaceResult>;
  raceEvents: SimEvent[]; // every participant's race events, concatenated best-to-worst
  course: RaceConfig;
}

// Runs every Chao in `field` through the SAME generated course independently
// — races here are parallel time-trials, not head-to-head combat, matching
// how the Race Leg resolver already works (GDD §5.1) — and ranks them. Only
// entrants with an entry in `loadedTechniquesByChaoId` load any Techniques;
// non-player entrants (v1, GDD §6.7) never draft, so they always run with
// none.
//
// Ranking/tiebreak rule (decided 2026-08-20): further along wins outright —
// a DNF naturally lands wherever its legsCompleted places it, which is
// exactly "last place for that race's field" when it IS the fewest legs
// completed (GDD §6.6) — no separate DNF special-case needed. Ties break on
// leftover Stamina, then a seeded coin-flip. A future race-animation pass
// may want richer signals than this; tracked as a TODO, not blocking here.
export function runFieldRace(
  field: Chao[],
  loadedTechniquesByChaoId: Partial<Record<string, TechniqueCard[]>>,
  rng: Rng,
  legCount?: number,
): FieldRaceOutcome {
  const course = generateRaceCourse(rng, legCount);
  const results: Record<string, RaceResult> = {};
  for (const chao of field) {
    const loadedTechniques = loadedTechniquesByChaoId[chao.id] ?? [];
    results[chao.id] = resolveRace({ chao, loadedTechniques }, course, rng);
  }

  const tiebreakRoll = new Map(field.map((chao) => [chao.id, rng()]));
  const ranking = field
    .map((chao) => chao.id)
    .sort((idA, idB) => {
      const a = results[idA]!;
      const b = results[idB]!;
      if (a.legsCompleted !== b.legsCompleted) return b.legsCompleted - a.legsCompleted;
      if (a.finalChao.currentStamina !== b.finalChao.currentStamina) {
        return b.finalChao.currentStamina - a.finalChao.currentStamina;
      }
      return tiebreakRoll.get(idB)! - tiebreakRoll.get(idA)!;
    });

  const raceEvents = ranking.flatMap((id) => results[id]!.events);
  return { ranking, results, raceEvents, course };
}

export interface GroupEliminationOutcome extends FieldRaceOutcome {
  eliminatedChaoId: string;
  survivingChaos: Chao[]; // post-race Chao, ranked best-to-worst, eliminatedChaoId removed
}

// One group-stage race: rank the field, cut the last-place finisher. This is
// the single core step both the player's own interactively-played group and
// silently-resolved off-path groups (bracket.ts) run — same mechanics
// either way, only whether events/interactivity are kept differs.
export function runGroupEliminationRace(
  field: Chao[],
  loadedTechniquesByChaoId: Partial<Record<string, TechniqueCard[]>>,
  rng: Rng,
): GroupEliminationOutcome {
  const outcome = runFieldRace(field, loadedTechniquesByChaoId, rng);
  const eliminatedChaoId = outcome.ranking[outcome.ranking.length - 1]!;
  const survivingChaos = outcome.ranking
    .filter((id) => id !== eliminatedChaoId)
    .map((id) => outcome.results[id]!.finalChao);
  return { ...outcome, eliminatedChaoId, survivingChaos };
}

export interface SilentGroupResult {
  survivors: Chao[]; // exactly 3, ranked best-to-worst
  eliminatedChaoIds: string[]; // in elimination order
}

// Silently races a group of 6 down to its top 3, with no interactivity and
// no kept per-Leg events — used for every bracket branch that never touches
// the player (architecture.md §5.5: off-path groups only need a final
// ranking, not a playable Event log).
export function resolveGroupToTopThree(field: Chao[], rng: Rng): SilentGroupResult {
  let remaining = field;
  const eliminatedChaoIds: string[] = [];
  while (remaining.length > 3) {
    const { survivingChaos, eliminatedChaoId } = runGroupEliminationRace(remaining, {}, rng);
    eliminatedChaoIds.push(eliminatedChaoId);
    remaining = survivingChaos;
  }
  return { survivors: remaining, eliminatedChaoIds };
}
