import type { Rng } from '../rng';
import { pickRandom, rollInRange, shuffle } from '../rng';
import type { Chao, EffectOp, SimEvent, Stat, TechniqueCard, TriggerCondition } from '../types';
import { fireTriggers, resetCurrentStamina } from './shared';

// Climb and Jump added 2026-08-20 (roadmap.md Phase 2, GDD §5.1) — genuinely
// new dedicated stats, sitting ALONGSIDE Obstacle/Sprint rather than
// replacing them. Obstacle still checks Power, Climb checks its own stat.
export type LegType = 'start' | 'sprint' | 'obstacle' | 'climb' | 'jump' | 'water' | 'air';

const LEG_STAT: Record<LegType, Stat> = {
  start: 'run',
  sprint: 'run',
  obstacle: 'power',
  climb: 'climb',
  jump: 'jump',
  water: 'swim',
  air: 'fly',
};

// The 6 "varied" leg types a generated course draws from, in addition to the
// always-present Start leg (see generateRaceCourse below).
const VARIABLE_LEG_TYPES: readonly LegType[] = [
  'sprint',
  'obstacle',
  'climb',
  'jump',
  'water',
  'air',
];

export interface LegFork {
  shortcutStat: 'fly' | 'swim'; // GDD §6.2: "a Fly or Swim threshold check"
  shortcutThreshold: number;
  shortcutDifficulty: number; // difficulty of the shortcut leg itself, if taken
}

export interface LegConfig {
  type: LegType;
  difficulty: number;
  staminaCost: number;
  fork?: LegFork;
}

export interface RaceConfig {
  legs: LegConfig[];
}

// Course-generation placeholder ranges (roadmap.md Phase 2 — "Support 5-8
// Legs per Race... with a validation/generation helper"). All tunable;
// nothing here is playtested.
const MIN_LEG_COUNT = 5;
const MAX_LEG_COUNT = 8;
const MIN_DISTINCT_LEG_TYPES = 3; // Start always counts as one of these
const DIFFICULTY_MIN = 15;
const DIFFICULTY_MAX = 30;
const STAMINA_COST_MIN = 6;
const STAMINA_COST_MAX = 12;
const FORK_CHANCE = 0.4; // only Water/Air legs can fork, GDD §5.1
const FORK_THRESHOLD_MIN = 15;
const FORK_THRESHOLD_MAX = 25;
const FORK_DIFFICULTY_MIN = 10;
const FORK_DIFFICULTY_MAX = 20;

function buildLeg(type: LegType, rng: Rng): LegConfig {
  const difficulty = rollInRange(rng, DIFFICULTY_MIN, DIFFICULTY_MAX);
  const staminaCost = rollInRange(rng, STAMINA_COST_MIN, STAMINA_COST_MAX);

  const canFork = type === 'water' || type === 'air';
  if (canFork && rng() < FORK_CHANCE) {
    return {
      type,
      difficulty,
      staminaCost,
      fork: {
        shortcutStat: type === 'water' ? 'swim' : 'fly',
        shortcutThreshold: rollInRange(rng, FORK_THRESHOLD_MIN, FORK_THRESHOLD_MAX),
        shortcutDifficulty: rollInRange(rng, FORK_DIFFICULTY_MIN, FORK_DIFFICULTY_MAX),
      },
    };
  }
  return { type, difficulty, staminaCost };
}

// Generates a randomized Race course (roadmap.md Phase 2): 5-8 Legs by
// default, always opening with a Start leg, guaranteeing at least 3
// distinct Leg types overall (Start counts as one) — assuming the normal
// default leg count; an explicit `legCount` override below 3 can't satisfy
// that guarantee and isn't expected to (a testing convenience, not a
// contract violation).
export function generateRaceCourse(rng: Rng, legCount?: number): RaceConfig {
  const count = legCount ?? rollInRange(rng, MIN_LEG_COUNT, MAX_LEG_COUNT);

  const additionalTypesNeeded = Math.max(
    0,
    Math.min(MIN_DISTINCT_LEG_TYPES - 1, count - 1, VARIABLE_LEG_TYPES.length),
  );
  const chosenTypes = shuffle(VARIABLE_LEG_TYPES, rng).slice(0, additionalTypesNeeded);

  // Fill any remaining slots by sampling (with repetition) from the chosen
  // types, so a course can repeat a type (e.g. two Sprint legs) without
  // ever dropping below the guaranteed distinct-type minimum. Safe against
  // an empty `chosenTypes`: that only happens when count === 1, in which
  // case remainingCount is also 0, so pickRandom is never reached on it.
  const remainingCount = count - 1 - chosenTypes.length;
  const filledTypes = [
    ...chosenTypes,
    ...Array.from({ length: Math.max(0, remainingCount) }, () => pickRandom(chosenTypes, rng)),
  ];

  const legs: LegConfig[] = [
    buildLeg('start', rng),
    ...shuffle(filledTypes, rng).map((type) => buildLeg(type, rng)),
  ];

  return { legs };
}

// Flat +/- variance applied to a stat check, so leg outcomes aren't 100%
// predictable from stats alone (an exact formula isn't specified in the
// GDD — placeholder pending playtesting, see roadmap.md).
const LEG_VARIANCE = 5;

function checkLeg(chao: Chao, stat: Stat, difficulty: number, rng: Rng): boolean {
  const variance = rollInRange(rng, -LEG_VARIANCE, LEG_VARIANCE);
  return chao.stats[stat] + variance >= difficulty;
}

function legStartPredicate(legType: LegType) {
  return (trigger: TriggerCondition): boolean =>
    trigger.on === 'leg_start' && (trigger.legType === undefined || trigger.legType === legType);
}

export interface RaceParticipant {
  chao: Chao;
  loadedTechniques: TechniqueCard[];
}

export interface RaceResult {
  legsCompleted: number;
  finalChao: Chao;
  events: SimEvent[];
}

// Resolves one Chao through a Race course, Leg by Leg (GDD §6.2). Scoped to
// a single participant, not a multi-racer field with placements — Phase 1's
// roadmap entry is explicit that the resolver only needs to run "standalone
// against the one Chao"; placement-vs-rivals is a later concern once boards
// of multiple Chao exist (roadmap Phase 3).
export function resolveRace(
  participant: RaceParticipant,
  config: RaceConfig,
  rng: Rng,
): RaceResult {
  let chao = resetCurrentStamina(participant.chao);
  const events: SimEvent[] = [];
  // Threaded through every fireTriggers call this Race so a `per_race`
  // onceLimit (shared.ts) is enforced across the whole course, not just
  // within one checkpoint — added 2026-08-21 alongside that enforcement.
  let firedOnce: ReadonlySet<string> = new Set();

  // 'manual' effects (Second Wind) are treated as firing once at race start
  // — GDD §6.3 frames them as "loaded before the event", not tied to an
  // in-race condition, so there's no later checkpoint for them to wait for.
  const raceStart = fireTriggers(
    chao,
    participant.loadedTechniques,
    (t) => t.on === 'race_start' || t.on === 'manual',
    firedOnce,
  );
  chao = raceStart.chao;
  events.push(...raceStart.events);
  firedOnce = raceStart.firedOnce;

  let legsCompleted = 0;

  for (const leg of config.legs) {
    const legStart = fireTriggers(chao, participant.loadedTechniques, legStartPredicate(leg.type), firedOnce);
    chao = legStart.chao;
    events.push(...legStart.events);
    firedOnce = legStart.firedOnce;
    const autoWin = legStart.controlOps.some((op) => op.op === 'autoWinLeg');
    // Added 2026-08-21 alongside `altStat` (types.ts): a matching
    // grantAlternateRoute swaps which stat this Leg checks — same
    // difficulty, different stat — rather than auto-succeeding outright,
    // so "walks the riverbed instead of swimming" still has to actually
    // clear the check on the alternate stat.
    const alternateRoute = legStart.controlOps.find(
      (op): op is Extract<EffectOp, { op: 'grantAlternateRoute' }> =>
        op.op === 'grantAlternateRoute' && op.legType === leg.type,
    );

    // `stat`/`difficulty` (added for roadmap.md's race-timing follow-up)
    // record whichever check actually decided this Leg, so a later
    // display-only timing computation can reconstruct "how hard was this for
    // this Chao" without re-deriving fork logic — the shortcut's Fly/Swim
    // check for a taken fork, the leg's own stat otherwise.
    let success: boolean;
    let usedStat: Stat;
    let usedDifficulty: number;
    if (autoWin) {
      success = true;
      usedStat = LEG_STAT[leg.type];
      usedDifficulty = leg.difficulty;
    } else if (leg.fork) {
      // Both the "do you take the shortcut" check and the shortcut leg
      // itself are resolved against the fork's Fly/Swim stat, not the leg's
      // normal stat — you're flying/swimming across, not running (GDD §6.2).
      // Only the non-shortcut path uses the leg's own stat (or an alternate
      // route's stat, if one was granted).
      const tookShortcut = checkLeg(chao, leg.fork.shortcutStat, leg.fork.shortcutThreshold, rng);
      if (tookShortcut) {
        usedStat = leg.fork.shortcutStat;
        usedDifficulty = leg.fork.shortcutDifficulty;
      } else {
        usedStat = alternateRoute?.altStat ?? LEG_STAT[leg.type];
        usedDifficulty = leg.difficulty;
      }
      success = checkLeg(chao, usedStat, usedDifficulty, rng);
    } else {
      usedStat = alternateRoute?.altStat ?? LEG_STAT[leg.type];
      usedDifficulty = leg.difficulty;
      success = checkLeg(chao, usedStat, usedDifficulty, rng);
    }

    events.push({
      type: 'leg_result',
      chaoId: chao.id,
      legType: leg.type,
      success,
      stat: usedStat,
      difficulty: usedDifficulty,
    });
    chao = { ...chao, currentStamina: Math.max(0, chao.currentStamina - leg.staminaCost) };

    if (success) {
      legsCompleted++;
      const legWon = fireTriggers(chao, participant.loadedTechniques, (t) => t.on === 'leg_won', firedOnce);
      chao = legWon.chao;
      events.push(...legWon.events);
      firedOnce = legWon.firedOnce;
    }

    // Checked fresh every Leg (not just once) so a "below X% Stamina" effect
    // keeps being available for as long as the Chao stays under threshold —
    // `per_race` onceLimit (if the card sets one) still caps it to a single
    // firing across the whole course, same as any other checkpoint.
    const staminaFraction = chao.currentStamina / chao.stats.stamina;
    const staminaBelow = fireTriggers(
      chao,
      participant.loadedTechniques,
      (t) => t.on === 'stamina_below' && staminaFraction <= t.fraction,
      firedOnce,
    );
    chao = staminaBelow.chao;
    events.push(...staminaBelow.events);
    firedOnce = staminaBelow.firedOnce;
    // No DNF break here — removed 2026-08-21 per the user's direct request
    // ("remove the entire DNF crap - we are not looking for DNFs"). Every
    // Chao now attempts every Leg in the course regardless of how low
    // Stamina drops; currentStamina still bottoms out at 0 (clamped above)
    // and still feeds `stamina_below` triggers and the final ranking's
    // tiebreak (tournament/fieldRace.ts), it just never cuts a Race short.
  }

  const raceEnd = fireTriggers(chao, participant.loadedTechniques, (t) => t.on === 'race_end', firedOnce);
  chao = raceEnd.chao;
  events.push(...raceEnd.events);

  return { legsCompleted, finalChao: chao, events };
}
