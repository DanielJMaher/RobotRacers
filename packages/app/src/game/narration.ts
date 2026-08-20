import type { DraftPickEvent, SimEvent } from '@chao-draft/sim';

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
