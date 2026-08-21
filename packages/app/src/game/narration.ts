import type { DraftPickEvent, EffectOp, SimEvent, StaticModifier, TriggerCondition, TriggeredEffect } from '@chao-draft/sim';

// Human-readable narration for the sim's event log — the UI's answer to the
// "does auto-resolution feel earned" design risk (GDD §8): a Race result
// should read as a small story, not a black-box number. (Karate Bout was
// removed 2026-08-20 — its own event kinds, turn_order/hit/evasion_check,
// no longer exist in SimEvent at all, so there's nothing to narrate for them.)
//
// `nameById` (added for the Tournament's group races, roadmap.md Phase 3)
// maps a chaoId to its display name — group races narrate every entrant's
// Legs, not just the player's, so raw ids like "entrant-7" would otherwise
// leak into the log. Falls back to the raw id if a name isn't supplied.
export function narrateSimEvent(event: SimEvent, nameById?: Record<string, string>): string {
  const name = (chaoId: string) => nameById?.[chaoId] ?? chaoId;
  switch (event.type) {
    case 'grade_roll':
      return `Rolled +${event.roll} ${event.stat} from ${event.cardId}.`;
    case 'leg_result':
      return event.success
        ? `${name(event.chaoId)} clears the ${event.legType} leg!`
        : `${name(event.chaoId)} fumbles the ${event.legType} leg.`;
    case 'dnf':
      return `${name(event.chaoId)} runs out of Stamina and does not finish.`;
    case 'technique_fired':
      return `Technique ${event.cardId} activates on ${name(event.chaoId)}.`;
    case 'trait_fired':
      return `Trait ${event.cardId} triggers on ${name(event.chaoId)}.`;
    case 'keyword_fired':
      return `${event.cardId}'s keyword triggers on ${name(event.chaoId)}.`;
    case 'item_fired':
      return `Item ${event.cardId} triggers on ${name(event.chaoId)}.`;
    case 'fruit_gained':
      return `+${event.amount} Fruit (${event.reason}).`;
    default: {
      // Exhaustiveness guard: a compile error here means a new SimEvent
      // variant was added without teaching this function to narrate it.
      const _exhaustive: never = event;
      return _exhaustive;
    }
  }
}

export function narrateDraftPick(event: DraftPickEvent, isPlayer: boolean): string {
  return isPlayer ? `You picked ${event.cardId}.` : `${event.seatId} picked ${event.cardId}.`;
}

// Turns a signed amount into "+3"/"-2" — negative already has its own
// minus sign, so only the positive case needs a `+` added.
function signed(amount: number): string {
  return amount >= 0 ? `+${amount}` : `${amount}`;
}

function describeTrigger(trigger: TriggerCondition): string {
  switch (trigger.on) {
    case 'leg_start':
      return trigger.legType ? `On ${trigger.legType} Leg` : 'On any Leg';
    case 'leg_won':
      return 'On Leg cleared';
    case 'stamina_below':
      return `Below ${Math.round(trigger.fraction * 100)}% Stamina`;
    case 'race_start':
      return 'At Race start';
    case 'race_end':
      return trigger.outcome === 'finished'
        ? 'On finishing the Race'
        : trigger.outcome === 'dnf'
          ? 'On DNF'
          : 'At Race end';
    case 'manual':
      return 'Loaded before the Race';
    // Bout-only, dormant triggers (Karate Bout was removed 2026-08-20) —
    // no live card should author these anymore, but old data/tests may
    // still reference them, so this stays exhaustive rather than throwing.
    case 'round_start':
      return 'On Round start (inactive — Bout was removed)';
    case 'on_hit':
      return `On ${trigger.as === 'attacker' ? 'landing a hit' : 'being hit'} (inactive — Bout was removed)`;
    case 'on_dodge':
      return 'On dodge (inactive — Bout was removed)';
    case 'bout_start':
      return 'On Bout start (inactive — Bout was removed)';
    default: {
      const _exhaustive: never = trigger;
      return _exhaustive;
    }
  }
}

function describeOp(op: EffectOp): string {
  switch (op.op) {
    case 'modifyStat':
      return `${op.stat} ${signed(op.amount)}`;
    case 'restoreStamina':
      return `restore ${op.amount} Stamina`;
    case 'grantFruit':
      return `+${op.amount} Fruit`;
    case 'autoWinLeg':
      return 'auto-clear the Leg';
    case 'autoResolveDNF':
      return 'never DNF';
    case 'grantAlternateRoute':
      return `check ${op.altStat} instead on ${op.legType} Legs`;
    // Bout-only, dormant ops — same status as the Bout-only triggers above.
    case 'preventDamage':
      return 'prevent damage (inactive — Bout was removed)';
    case 'forceEvade':
      return 'auto-evade (inactive — Bout was removed)';
    case 'forceHit':
      return 'auto-hit (inactive — Bout was removed)';
    case 'custom':
      return op.description;
    default: {
      const _exhaustive: never = op;
      return _exhaustive;
    }
  }
}

// Human-readable one-liner for a TriggeredEffect (a Trait Card's whole
// effect, an equipped Item's non-passive effect, or a Bond Card's keyword)
// — added 2026-08-21 directly per the user's request that "traits (and
// similar) need a description of what they do." Shared by CardBadge for
// all four card kinds that can carry one, rather than four near-duplicate
// formatters.
export function describeTriggeredEffect(effect: TriggeredEffect): string {
  const ops = effect.apply.map(describeOp).join(', ');
  const onceNote = effect.onceLimit === 'per_race' ? ' (once per Race)' : '';
  return `${describeTrigger(effect.trigger)}: ${ops}${onceNote}`;
}

export function describeStaticModifier(modifier: StaticModifier): string {
  return `Passive: ${modifier.stat} ${signed(modifier.amount)}`;
}
