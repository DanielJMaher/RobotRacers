import type { Rng } from '../rng';
import type { Card, DraftSeat, DraftState } from '../types';
import { chooseBotCardIndex, initialColorAffinity, nudgeAffinity } from './bots';
import type { CardPool, PackConfig } from './pool';
import { DEFAULT_PACK_CONFIG, generateSpellPack } from './pool';

// A single drafted pick, for UI history/replay — deliberately separate from
// the combat-focused SimEvent union in types.ts (a card pick isn't a Race or
// Bout event; see data-schemas.md's Phase 1 implementation-status note).
export interface DraftPickEvent {
  seatId: string;
  cardId: string;
  round: number;
  pick: number;
}

export interface CreateDraftParams {
  seed: number; // stored on DraftState for provenance/debugging only
  seatCount: number;
  playerSeatIndex: number;
  packConfig?: PackConfig;
}

// IMPORTANT: callers must reuse the SAME Rng instance across an entire draft
// session (createDraft, then startRound each time a round completes) rather
// than recreating one from `state.seed` per call. This matches the calling
// convention already established in chao/bonding.ts (bondCard/consumePotion
// both take `rng: Rng` as a parameter, never derive one internally from
// stored state) — the seed is persisted purely for provenance, not as a way
// to re-derive the sequence mid-draft.
export function createDraft(params: CreateDraftParams, cardPool: CardPool, rng: Rng): DraftState {
  const seats: DraftSeat[] = Array.from({ length: params.seatCount }, (_, i) => ({
    seatId: `seat-${i}`,
    isPlayer: i === params.playerSeatIndex,
    colorAffinity: initialColorAffinity(),
    pool: [],
  }));

  const config = params.packConfig ?? DEFAULT_PACK_CONFIG;
  const packSize = config.commons + config.uncommons + config.rareSlots;

  const state: DraftState = {
    seed: params.seed,
    seats,
    currentRound: 0,
    currentPick: 0,
    packsPerDraft: 3,
    packSize,
    packsInFront: [],
    direction: 'left',
    isComplete: false,
  };

  return startRound(state, cardPool, rng, config);
}

// Opens a fresh pack for every seat. Only callable between rounds (or at
// draft start), when no seat currently has cards in front of them.
//
// No longer hands out a random bonus Habitat card per round (removed
// 2026-08-21, playtest-prep) — Habitat colors are now a free player choice
// (tournament/environment.ts's setHabitatChoice), not something the draft
// randomly assigns. drawBonusHabitat/placeHabitatCard/canPlaceHabitatCard
// still exist and are still tested, but nothing calls them from the app
// anymore; kept in case a future mechanic (e.g. a dedicated Interlude
// option) reintroduces a real way to grow a Habitat to 2-star.
export function startRound(
  state: DraftState,
  cardPool: CardPool,
  rng: Rng,
  config: PackConfig = DEFAULT_PACK_CONFIG,
): DraftState {
  if (state.isComplete) {
    throw new Error('startRound: draft is already complete');
  }
  if (state.packsInFront.some((pack) => pack.length > 0)) {
    throw new Error('startRound: the current round is still in progress');
  }

  const packsInFront = state.seats.map(() => generateSpellPack(cardPool, rng, config));
  return { ...state, packsInFront };
}

function neighborIndex(seatIndex: number, seatCount: number, direction: 'left' | 'right'): number {
  return direction === 'left'
    ? (seatIndex + 1) % seatCount
    : (seatIndex - 1 + seatCount) % seatCount;
}

function applyPickAtIndex(
  seat: DraftSeat,
  pack: Card[],
  index: number,
): { seat: DraftSeat; picked: Card; remaining: Card[] } {
  const picked = pack[index];
  if (!picked) {
    throw new Error(`applyPickAtIndex: no card at index ${index} (pack has ${pack.length} cards)`);
  }
  const remaining = pack.filter((_, i) => i !== index);
  const nudged = nudgeAffinity(seat, picked);
  const seatAfter: DraftSeat = { ...nudged, pool: [...nudged.pool, picked] };
  return { seat: seatAfter, picked, remaining };
}

// Advances the draft by exactly one "tick": every seat picks one card from
// the pack currently in front of it (the human via `playerPickIndex`, every
// other seat via the bot heuristic in bots.ts), then remaining packs are
// passed to the next seat in the round's direction. If that empties every
// pack, either the next round opens (direction flips, per standard MTG
// draft convention) or the whole draft completes.
//
// Bot picks are pure functions of visible state (their own pool + the pack
// in front of them) — no randomness involved, so this function doesn't take
// an Rng at all. Only pack generation (startRound) needs one.
export function advanceTick(
  state: DraftState,
  playerPickIndex: number,
): { state: DraftState; events: DraftPickEvent[] } {
  if (state.isComplete) {
    throw new Error('advanceTick: draft is already complete');
  }

  const events: DraftPickEvent[] = [];
  const nextSeats: DraftSeat[] = [...state.seats];
  const afterPick: Card[][] = [];

  for (let i = 0; i < state.seats.length; i++) {
    const seat = state.seats[i]!;
    const pack = state.packsInFront[i]!;
    const index = seat.isPlayer ? playerPickIndex : chooseBotCardIndex(seat, pack);
    const { seat: seatAfter, picked, remaining } = applyPickAtIndex(seat, pack, index);
    nextSeats[i] = seatAfter;
    afterPick[i] = remaining;
    events.push({
      seatId: seat.seatId,
      cardId: picked.id,
      round: state.currentRound,
      pick: state.currentPick,
    });
  }

  const packsInFront: Card[][] = new Array(state.seats.length);
  for (let i = 0; i < state.seats.length; i++) {
    const target = neighborIndex(i, state.seats.length, state.direction);
    packsInFront[target] = afterPick[i]!;
  }

  const nextPick = state.currentPick + 1;
  const roundDone = nextPick >= state.packSize;

  if (!roundDone) {
    return {
      state: { ...state, seats: nextSeats, packsInFront, currentPick: nextPick },
      events,
    };
  }

  const nextRound = state.currentRound + 1;
  const draftDone = nextRound >= state.packsPerDraft;

  return {
    state: {
      ...state,
      seats: nextSeats,
      packsInFront: [],
      currentPick: 0,
      currentRound: nextRound,
      direction: draftDone ? state.direction : state.direction === 'left' ? 'right' : 'left',
      isComplete: draftDone,
    },
    events,
  };
}
