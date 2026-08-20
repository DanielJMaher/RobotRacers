import type { DraftPickEvent, SimEvent } from '@chao-draft/sim';

// Human-readable narration for the sim's event log — the UI's answer to the
// "does auto-resolution feel earned" design risk (GDD §10): a Race/Bout
// result should read as a small story, not a black-box number.
export function narrateSimEvent(event: SimEvent): string {
  switch (event.type) {
    case 'grade_roll':
      return `Rolled +${event.roll} ${event.stat} from ${event.cardId}.`;
    case 'turn_order':
      return `${event.chaoId} acts first this round (Run ${event.runStat}).`;
    case 'hit':
      return `${event.attackerId} hits ${event.defenderId} for ${event.damage} damage.`;
    case 'evasion_check':
      return event.result
        ? `${event.chaoId} dodges! (roll ${event.roll.toFixed(2)} < ${event.threshold.toFixed(2)} evasion chance)`
        : `${event.chaoId} fails to dodge (roll ${event.roll.toFixed(2)} ≥ ${event.threshold.toFixed(2)} evasion chance).`;
    case 'leg_result':
      return event.success
        ? `${event.chaoId} clears the ${event.legType} leg!`
        : `${event.chaoId} fumbles the ${event.legType} leg.`;
    case 'dnf':
      return `${event.chaoId} runs out of Stamina and does not finish.`;
    case 'technique_fired':
      return `Technique ${event.cardId} activates on ${event.chaoId}.`;
    case 'trait_fired':
      return `Trait ${event.cardId} triggers on ${event.chaoId}.`;
    case 'keyword_fired':
      return `${event.cardId}'s keyword triggers on ${event.chaoId}.`;
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
