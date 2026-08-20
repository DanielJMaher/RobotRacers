import type { Rng } from '../rng';
import { rollInRange, shuffle } from '../rng';
import type { Chao, Stat } from '../types';
import { createChao } from '../chao/factory';

// Entrant generation v1 (GDD §6.7, roadmap.md Phase 3) — the cheap version,
// built first per that decision: the 23 non-player Tournament entrants get a
// procedural stat roll standing in for "what a real draft+bonding pass would
// have produced," no actual drafting or bonding decisions involved. v2 (a
// real mini-draft + a new bot-bonding heuristic per entrant) is written up in
// the GDD as a deferred upgrade, not built here.

const LEG_RELEVANT_STATS: readonly Stat[] = ['swim', 'fly', 'run', 'power', 'climb', 'jump'];

// Placeholder ranges, not playtested — chosen so a generated entrant's Leg
// checks (difficulty 15-30, GDD §5.1) land in a plausible pass/fail mix
// against these stats plus the resolver's own +/-5 variance.
const STAT_MIN = 10;
const STAT_MAX = 60;
const STAMINA_MIN = 60;
const STAMINA_MAX = 150;

// A modest curated name pool so generated entrants read as individuals in
// the bracket/standings UI rather than "Entrant #7" — flavor only, no
// mechanical weight (mirrors the "coloring is purely cosmetic" decision for
// Bond Cards, GDD §3.5). Shuffled and consumed without replacement per
// Tournament so no two entrants in the same run share a name.
const ENTRANT_NAME_POOL: readonly string[] = [
  'Bramble', 'Ripple', 'Ember', 'Gale', 'Moss', 'Pebble', 'Clover', 'Frost',
  'Sable', 'Dune', 'Wisp', 'Cinder', 'Marsh', 'Thistle', 'Onyx', 'Shale',
  'Fern', 'Drift', 'Quartz', 'Willow', 'Hollow', 'Brook', 'Ash', 'Petal',
  'Slate', 'Tide', 'Birch', 'Flint', 'Reed', 'Storm',
];

export function generateEntrantNames(count: number, rng: Rng): string[] {
  if (count > ENTRANT_NAME_POOL.length) {
    throw new Error(
      `generateEntrantNames: requested ${count} names but the pool only has ${ENTRANT_NAME_POOL.length}`,
    );
  }
  return shuffle(ENTRANT_NAME_POOL, rng).slice(0, count);
}

// One non-player entrant: a fresh Chao (no bonded cards/traits/items,
// matching createChao's blank-slate shape — GDD §6.7's "no actual draft, no
// bonding decisions") with directly-rolled stats.
export function generateEntrant(id: string, name: string, bornGeneration: number, rng: Rng): Chao {
  const chao = createChao({ id, name, bornGeneration });
  const stats = { ...chao.stats };
  for (const stat of LEG_RELEVANT_STATS) {
    stats[stat] = rollInRange(rng, STAT_MIN, STAT_MAX);
  }
  stats.stamina = rollInRange(rng, STAMINA_MIN, STAMINA_MAX);
  return { ...chao, stats };
}

export type ScoutingRead = Partial<Record<Stat, 1 | 2 | 3 | 4 | 5>>;

// Upper bound for buckets 1-4; anything at/above the last threshold is a 5.
// First-draft placeholder — GDD §6.7 explicitly flags exact scouting numbers
// as low priority to tune, same status as the Leg difficulty/variance
// constants in events/race.ts.
const BUCKET_MAX: readonly number[] = [15, 30, 45, 60];
const STAMINA_BUCKET_MAX: readonly number[] = [45, 80, 115, 150]; // Stamina runs on a bigger scale

function bucket(value: number, thresholds: readonly number[]): 1 | 2 | 3 | 4 | 5 {
  for (let i = 0; i < thresholds.length; i++) {
    if (value < thresholds[i]!) return (i + 1) as 1 | 2 | 3 | 4;
  }
  return 5;
}

// GDD §6.7: a fuzzy, icon-friendly 1-5 read per Leg-relevant stat, bucketed
// from a Chao's real numbers rather than showing exact figures — lets a
// player "scout" any of the 24 entrants (not just ones they've raced) and
// think "I bet that one's a strong swimmer" without being handed a
// spreadsheet. A lightweight derived-data function, not a new simulation
// system, per that section's own framing.
export function computeScoutingRead(chao: Chao): ScoutingRead {
  const read: ScoutingRead = {};
  for (const stat of LEG_RELEVANT_STATS) {
    read[stat] = bucket(chao.stats[stat], BUCKET_MAX);
  }
  read.stamina = bucket(chao.stats.stamina, STAMINA_BUCKET_MAX);
  return read;
}
