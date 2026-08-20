import type { Rng } from '../rng';
import type { Chao, SimEvent, TechniqueCard } from '../types';
import { fireTriggers, resetCurrentStamina } from './shared';

// GDD §6.1's damage formula: max(1, Power - Swim/2). A placeholder pending
// real playtesting — see docs/03-roadmap/roadmap.md's open tuning question.
const DAMAGE_FLOOR = 1;
function computeDamage(attackerPower: number, defenderSwim: number): number {
  return Math.max(DAMAGE_FLOOR, attackerPower - defenderSwim / 2);
}

// Placeholder evasion curve: Fly maps linearly to dodge chance, capped at
// 60% around Fly=120. Evasion is only reachable at all once a Chao has its
// second evolution (GDD §3.4 — wings aren't just cosmetic).
const EVASION_FLY_CAP = 120;
const EVASION_MAX_CHANCE = 0.6;
function computeEvasionChance(chao: Chao): number {
  if (chao.evolutionStage < 2) return 0;
  return Math.min(EVASION_MAX_CHANCE, (chao.stats.fly / EVASION_FLY_CAP) * EVASION_MAX_CHANCE);
}

const DEFAULT_ROUNDS = 3;

export interface BoutParticipant {
  chao: Chao;
  loadedTechniques: TechniqueCard[];
}

export interface BoutConfig {
  rounds: number;
}

export interface BoutResult {
  winner: 'a' | 'b' | 'draw';
  finalA: Chao;
  finalB: Chao;
  events: SimEvent[];
}

// Run determines turn order each round (ties broken by Luck) — GDD §6.1.
// NOTE: the GDD also gestures at Run producing genuinely *more actions*, not
// just priority, but gives no threshold/formula for when that kicks in.
// That's left as an open tuning question (roadmap.md) rather than guessed at
// here; this resolver implements the well-defined half (order) only.
function turnOrder(a: Chao, b: Chao): ['a', 'b'] | ['b', 'a'] {
  if (a.stats.run !== b.stats.run) return a.stats.run > b.stats.run ? ['a', 'b'] : ['b', 'a'];
  if (a.stats.luck !== b.stats.luck) return a.stats.luck > b.stats.luck ? ['a', 'b'] : ['b', 'a'];
  return ['a', 'b']; // fully tied — stable default rather than an extra random tiebreak
}

export function resolveBout(
  participantA: BoutParticipant,
  participantB: BoutParticipant,
  rng: Rng,
  config: BoutConfig = { rounds: DEFAULT_ROUNDS },
): BoutResult {
  let a = resetCurrentStamina(participantA.chao);
  let b = resetCurrentStamina(participantB.chao);
  const events: SimEvent[] = [];

  const boutStartA = fireTriggers(a, participantA.loadedTechniques, (t) => t.on === 'bout_start');
  a = boutStartA.chao;
  events.push(...boutStartA.events);
  const boutStartB = fireTriggers(b, participantB.loadedTechniques, (t) => t.on === 'bout_start');
  b = boutStartB.chao;
  events.push(...boutStartB.events);

  for (let round = 0; round < config.rounds; round++) {
    if (a.currentStamina <= 0 || b.currentStamina <= 0) break;

    const roundStartA = fireTriggers(a, participantA.loadedTechniques, (t) => t.on === 'round_start');
    a = roundStartA.chao;
    events.push(...roundStartA.events);
    const roundStartB = fireTriggers(b, participantB.loadedTechniques, (t) => t.on === 'round_start');
    b = roundStartB.chao;
    events.push(...roundStartB.events);

    const order = turnOrder(a, b);
    const firstChao = order[0] === 'a' ? a : b;
    events.push({
      type: 'turn_order',
      chaoId: firstChao.id,
      runStat: firstChao.stats.run,
      result: 'first',
    });

    for (const actorKey of order) {
      const attacker = actorKey === 'a' ? a : b;
      const defenderBefore = actorKey === 'a' ? b : a;
      if (defenderBefore.currentStamina <= 0) break; // already downed earlier this round

      const defenderTechniques = actorKey === 'a' ? participantB.loadedTechniques : participantA.loadedTechniques;
      const evasionChance = computeEvasionChance(defenderBefore);
      const roll = rng();
      const dodged = roll < evasionChance;
      events.push({
        type: 'evasion_check',
        chaoId: defenderBefore.id,
        roll,
        threshold: evasionChance,
        result: dodged,
      });

      let defenderAfter: Chao;
      if (dodged) {
        const dodgeTriggers = fireTriggers(defenderBefore, defenderTechniques, (t) => t.on === 'on_dodge');
        defenderAfter = dodgeTriggers.chao;
        events.push(...dodgeTriggers.events);
      } else {
        const damage = computeDamage(attacker.stats.power, defenderBefore.stats.swim);
        const damaged = {
          ...defenderBefore,
          currentStamina: Math.max(0, defenderBefore.currentStamina - damage),
        };
        events.push({
          type: 'hit',
          attackerId: attacker.id,
          defenderId: defenderBefore.id,
          damage,
        });
        const hitTriggers = fireTriggers(
          damaged,
          defenderTechniques,
          (t) => t.on === 'on_hit' && t.as === 'defender',
        );
        defenderAfter = hitTriggers.chao;
        events.push(...hitTriggers.events);
      }

      if (actorKey === 'a') b = defenderAfter;
      else a = defenderAfter;
    }
  }

  let winner: BoutResult['winner'];
  if (a.currentStamina <= 0 && b.currentStamina <= 0) winner = 'draw';
  else if (a.currentStamina <= 0) winner = 'b';
  else if (b.currentStamina <= 0) winner = 'a';
  else if (a.currentStamina > b.currentStamina) winner = 'a';
  else if (b.currentStamina > a.currentStamina) winner = 'b';
  else winner = 'draw';

  return { winner, finalA: a, finalB: b, events };
}
