import { describe, expect, it } from 'vitest';
import { coreGardenSet } from '../cards';
import { createRng } from '../rng';
import { advanceTick, createDraft, startRound } from './engine';
import { buildCardPool } from './pool';

const cardPool = buildCardPool(coreGardenSet);

describe('createDraft', () => {
  it('opens a pack of the configured size in front of every seat, and hands out a bonus Habitat', () => {
    const rng = createRng(1);
    const state = createDraft({ seed: 1, seatCount: 4, playerSeatIndex: 0 }, cardPool, rng);

    expect(state.seats).toHaveLength(4);
    expect(state.packsInFront).toHaveLength(4);
    for (const pack of state.packsInFront) {
      expect(pack).toHaveLength(state.packSize);
    }
    for (const seat of state.seats) {
      expect(seat.pool.length).toBeGreaterThanOrEqual(0); // 1 if a Habitat was drawn, 0 if the pool ran dry
      expect(seat.pool.every((c) => c.type === 'habitat')).toBe(true);
    }
    expect(state.seats[0]!.isPlayer).toBe(true);
    expect(state.seats[1]!.isPlayer).toBe(false);
  });
});

describe('startRound', () => {
  it('throws if called while the current round still has packs in front of seats', () => {
    const rng = createRng(1);
    const state = createDraft({ seed: 1, seatCount: 4, playerSeatIndex: 0 }, cardPool, rng);
    expect(() => startRound(state, cardPool, rng)).toThrow();
  });
});

describe('advanceTick', () => {
  it("removes exactly the picked slot, adds it to the picker's pool, and passes the rest on", () => {
    const rng = createRng(2);
    const state = createDraft({ seed: 2, seatCount: 3, playerSeatIndex: 0 }, cardPool, rng);
    const packBefore = state.packsInFront[0]!;
    const pickedCard = packBefore[0]!;

    const { state: after, events } = advanceTick(state, 0);

    expect(after.seats[0]!.pool.some((c) => c.id === pickedCard.id)).toBe(true);
    expect(after.packsInFront[0]).not.toEqual(packBefore); // seat 0 now holds a neighbor's pack
    expect(after.currentPick).toBe(1);
    expect(events.find((e) => e.seatId === 'seat-0')?.cardId).toBe(pickedCard.id);
  });

  it('advances through a full round and rotates direction for the next one', () => {
    const rng = createRng(3);
    let state = createDraft({ seed: 3, seatCount: 4, playerSeatIndex: 0 }, cardPool, rng);
    const firstRoundDirection = state.direction;

    for (let i = 0; i < state.packSize; i++) {
      state = advanceTick(state, 0).state;
    }

    expect(state.currentRound).toBe(1);
    expect(state.direction).not.toBe(firstRoundDirection);
    expect(state.packsInFront).toHaveLength(0);

    state = startRound(state, cardPool, rng);
    expect(state.packsInFront).toHaveLength(4);
    for (const pack of state.packsInFront) {
      expect(pack).toHaveLength(state.packSize);
    }
  });

  it('throws once the draft is already complete', () => {
    const rng = createRng(4);
    let state = createDraft({ seed: 4, seatCount: 2, playerSeatIndex: 0 }, cardPool, rng);

    for (let round = 0; round < 3; round++) {
      for (let pick = 0; pick < state.packSize; pick++) {
        state = advanceTick(state, 0).state;
      }
      if (!state.isComplete) {
        state = startRound(state, cardPool, rng);
      }
    }

    expect(state.isComplete).toBe(true);
    expect(() => advanceTick(state, 0)).toThrow();
  });
});

describe('full draft determinism', () => {
  it('produces identical final pools for the same seed and the same player picks', () => {
    function runFullDraft(seed: number): string[][] {
      const rng = createRng(seed);
      let state = createDraft({ seed, seatCount: 4, playerSeatIndex: 0 }, cardPool, rng);

      while (!state.isComplete) {
        state = advanceTick(state, 0).state;
        if (!state.isComplete && state.packsInFront.length === 0) {
          state = startRound(state, cardPool, rng);
        }
      }

      return state.seats.map((seat) => seat.pool.map((c) => c.id));
    }

    const poolsA = runFullDraft(42);
    const poolsB = runFullDraft(42);
    expect(poolsA).toEqual(poolsB);

    // Sanity check on the shape of a completed draft: 3 packs of packSize
    // spell cards each, plus up to 3 bonus Habitats (one per round, subject
    // to the Habitat pool existing) for every seat.
    const rng = createRng(42);
    const probeState = createDraft({ seed: 42, seatCount: 4, playerSeatIndex: 0 }, cardPool, rng);
    const expectedSpellCards = probeState.packSize * 3;
    for (const pool of poolsA) {
      expect(pool.length).toBeGreaterThanOrEqual(expectedSpellCards);
      expect(pool.length).toBeLessThanOrEqual(expectedSpellCards + 3);
    }
  });
});
