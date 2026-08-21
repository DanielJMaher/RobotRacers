import type { Chao, SimEvent } from '../types';

// Race timing — a display-only computation over an already-resolved race's
// `leg_result` events. It does NOT feed back into pass/fail, DNF,
// elimination, scoring, or ranking, all of which remain exactly the
// existing stat-check/Stamina mechanics (events/race.ts, tournament/
// fieldRace.ts) — this only answers "how many seconds did that take,"
// purely for the results screen.
//
// Calibrated against the user's own reference point (2026-08-20): a
// brand-new, near-zero-stat Gen-1 baby Chao should average roughly 9.0
// seconds per Leg regardless of course length (a 5-Leg race in ~45s, a
// 10-Leg race in ~90s). Every constant below is a first-draft placeholder
// tuned to hit that one data point — real tuning is Phase 6 balance work,
// same status as every other numeric placeholder in this codebase.
//
// Important calibration note: a true 0-stat Chao *always* fumbles every Leg
// (Leg difficulty is 15-30, events/race.ts's variance is only ±5, so 0 can
// never clear even the easiest Leg) — so the 9.0s/Leg target already has to
// include the fumble penalty, not sit on top of it. At the difficulty
// range's midpoint (22.5) with the fumble penalty always applied:
//   9.0 = BASE_LEG_SECONDS + SECONDS_PER_MARGIN_POINT*22.5 + FUMBLE_PENALTY_SECONDS
const BASE_LEG_SECONDS = 4.75;
const SECONDS_PER_MARGIN_POINT = 0.1; // per point of (difficulty - relevant stat)
const FUMBLE_PENALTY_SECONDS = 2.0; // extra time for a failed (fumbled) Leg
const MIN_LEG_SECONDS = 2.0;

function computeLegTimeSeconds(relevantStatValue: number, difficulty: number, success: boolean): number {
  const margin = difficulty - relevantStatValue;
  const base = BASE_LEG_SECONDS + margin * SECONDS_PER_MARGIN_POINT;
  const withFumblePenalty = success ? base : base + FUMBLE_PENALTY_SECONDS;
  return Math.round(Math.max(MIN_LEG_SECONDS, withFumblePenalty) * 10) / 10;
}

export interface LegTiming {
  legType: string;
  success: boolean;
  seconds: number;
}

export interface RaceTiming {
  legs: LegTiming[];
  totalSeconds: number;
}

// Computes a per-Leg + total time breakdown for one Chao's already-resolved
// race, reading the `stat`/`difficulty` each `leg_result` event recorded
// (added specifically to support this) rather than re-deriving fork logic.
// `events` should be that Chao's own event list (e.g. a single entrant's
// `RaceResult.events`, not a multi-entrant field race's flattened log).
export function computeRaceTiming(chao: Chao, events: SimEvent[]): RaceTiming {
  const legs: LegTiming[] = [];
  for (const event of events) {
    if (event.type !== 'leg_result') continue;
    const seconds = computeLegTimeSeconds(chao.stats[event.stat], event.difficulty, event.success);
    legs.push({ legType: event.legType, success: event.success, seconds });
  }
  const totalSeconds = Math.round(legs.reduce((sum, leg) => sum + leg.seconds, 0) * 10) / 10;
  return { legs, totalSeconds };
}
