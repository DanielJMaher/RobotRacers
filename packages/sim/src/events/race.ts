import type { Rng } from '../rng';
import { rollInRange } from '../rng';
import type { Chao, SimEvent, Stat, TechniqueCard, TriggerCondition } from '../types';
import { fireTriggers, resetCurrentStamina } from './shared';

export type LegType = 'start' | 'sprint' | 'obstacle' | 'water' | 'air';

const LEG_STAT: Record<LegType, Stat> = {
  start: 'run',
  sprint: 'run',
  obstacle: 'power',
  water: 'swim',
  air: 'fly',
};

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
  finished: boolean; // false = DNF
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

  // 'manual' effects (Second Wind, Tortoiseshell Ward's autoResolveDNF) are
  // treated as firing once at race start — GDD §6.3 frames them as "loaded
  // before the event", not tied to an in-race condition, so there's no
  // later checkpoint for them to wait for.
  const raceStart = fireTriggers(
    chao,
    participant.loadedTechniques,
    (t) => t.on === 'race_start' || t.on === 'manual',
  );
  chao = raceStart.chao;
  events.push(...raceStart.events);
  const cannotDNF = raceStart.controlOps.some((op) => op.op === 'autoResolveDNF');

  let legsCompleted = 0;
  let finished = true;

  for (const leg of config.legs) {
    const legStart = fireTriggers(chao, participant.loadedTechniques, legStartPredicate(leg.type));
    chao = legStart.chao;
    events.push(...legStart.events);
    const autoWin = legStart.controlOps.some((op) => op.op === 'autoWinLeg');

    let success: boolean;
    if (autoWin) {
      success = true;
    } else if (leg.fork) {
      // Both the "do you take the shortcut" check and the shortcut leg
      // itself are resolved against the fork's Fly/Swim stat, not the leg's
      // normal stat — you're flying/swimming across, not running (GDD §6.2).
      // Only the non-shortcut path uses the leg's own stat.
      const tookShortcut = checkLeg(chao, leg.fork.shortcutStat, leg.fork.shortcutThreshold, rng);
      success = tookShortcut
        ? checkLeg(chao, leg.fork.shortcutStat, leg.fork.shortcutDifficulty, rng)
        : checkLeg(chao, LEG_STAT[leg.type], leg.difficulty, rng);
    } else {
      success = checkLeg(chao, LEG_STAT[leg.type], leg.difficulty, rng);
    }

    events.push({ type: 'leg_result', chaoId: chao.id, legType: leg.type, success });
    chao = { ...chao, currentStamina: Math.max(0, chao.currentStamina - leg.staminaCost) };

    if (success) {
      legsCompleted++;
      const legWon = fireTriggers(chao, participant.loadedTechniques, (t) => t.on === 'leg_won');
      chao = legWon.chao;
      events.push(...legWon.events);
    }

    if (chao.currentStamina <= 0 && !cannotDNF) {
      finished = false;
      events.push({ type: 'dnf', chaoId: chao.id });
      break;
    }
  }

  return { finished, legsCompleted, finalChao: chao, events };
}
