import { describe, expect, it } from 'vitest';
import { brambleHare, deeprootFruit, hollowLogDen } from '../cards/data/green';
import { jackrabbitReflex, skitterFinch } from '../cards/data/red';
import { createRng } from '../rng';
import { awakenBondCard, bondCard, computeSplashTax, consumeRegimen } from './bonding';
import { createChao } from './factory';

describe('createChao', () => {
  it('starts with zero stats, no bonded cards, and neutral alignment', () => {
    const chao = createChao({ id: 'c1', name: 'Test Chao', bornGeneration: 1 });
    expect(chao.stats.stamina).toBe(0);
    expect(chao.stats.run).toBe(0);
    expect(chao.bondedCards).toEqual([]);
    expect(chao.colorIdentity).toEqual([]);
    expect(chao.alignment).toBe('neutral');
  });
});

describe('bondCard', () => {
  it("grants stats within the card's roll range and appends to the bonding history", () => {
    const chao = createChao({ id: 'c1', name: 'Test Chao', bornGeneration: 1 });
    const rng = createRng(42);

    const { chao: bonded, events } = bondCard(chao, brambleHare, rng);

    expect(bonded.stats.stamina).toBeGreaterThanOrEqual(6);
    expect(bonded.stats.stamina).toBeLessThanOrEqual(10);
    expect(bonded.stats.run).toBeGreaterThanOrEqual(2);
    expect(bonded.stats.run).toBeLessThanOrEqual(4);
    expect(bonded.bondedCards).toHaveLength(1);
    expect(bonded.bondedCards[0]?.card.id).toBe(brambleHare.id);
    expect(bonded.speciesTagCounts.rabbit).toBe(1);
    expect(events.filter((e) => e.type === 'grade_roll')).toHaveLength(2);
  });

  it('pulls color identity and alignment toward Hero when bonding a Green card', () => {
    const chao = createChao({ id: 'c1', name: 'Test Chao', bornGeneration: 1 });
    const rng = createRng(1);
    const { chao: bonded } = bondCard(chao, brambleHare, rng);

    expect(bonded.colorIdentity).toEqual(['green']);
    expect(bonded.alignment).toBe('hero');
    expect(bonded.alignmentValue).toBeGreaterThan(0);
  });

  it('accumulates onto a second bonded card instead of replacing the first (corrected 2026-08-20)', () => {
    const chao = createChao({ id: 'c1', name: 'Test Chao', bornGeneration: 1 });
    const rng = createRng(7);

    const afterFirst = bondCard(chao, brambleHare, rng); // legs: +stamina, +run, rabbit tag, green
    const afterSecond = bondCard(afterFirst.chao, skitterFinch, rng); // legs: +run, bird tag, red

    expect(afterSecond.chao.bondedCards).toHaveLength(2);
    expect(afterSecond.chao.bondedCards[0]?.card.id).toBe(brambleHare.id);
    expect(afterSecond.chao.bondedCards[1]?.card.id).toBe(skitterFinch.id);

    // brambleHare's stamina contribution is still present — bonding no longer reverses it.
    expect(afterSecond.chao.stats.stamina).toBeGreaterThanOrEqual(6);
    // Both species tags are present now.
    expect(afterSecond.chao.speciesTagCounts.rabbit).toBe(1);
    expect(afterSecond.chao.speciesTagCounts.bird).toBe(1);
    // Color identity now includes both colors — nothing is overwritten.
    expect(afterSecond.chao.colorIdentity).toEqual(['green', 'red']);
  });

  it('nets toward Neutral alignment when Green and Red are balanced across different regions', () => {
    const chao = createChao({ id: 'c1', name: 'Test Chao', bornGeneration: 1 });
    const rng = createRng(99);

    const afterGreen = bondCard(chao, brambleHare, rng); // legs region, green
    const afterRed = bondCard(afterGreen.chao, jackrabbitReflex, rng); // head region, red

    expect(afterRed.chao.colorIdentity).toEqual(['green', 'red']);
    expect(afterRed.chao.alignmentValue).toBe(0);
    expect(afterRed.chao.alignment).toBe('neutral');
  });

  it('accumulates multiple stat grants from a two-stat Bond Card', () => {
    const chao = createChao({ id: 'c1', name: 'Test Chao', bornGeneration: 1 });
    const rng = createRng(13);
    const { chao: bonded } = bondCard(chao, hollowLogDen, rng); // +stamina, +swim, back region

    expect(bonded.stats.stamina).toBeGreaterThanOrEqual(12);
    expect(bonded.stats.swim).toBeGreaterThanOrEqual(4);
    expect(bonded.speciesTagCounts.reptile).toBe(1);
    expect(bonded.speciesTagCounts.beast).toBe(1);
  });
});

describe('awakenBondCard', () => {
  it("grants 3.5x a single copy's AVERAGE stat grant, deterministically (no rng involved)", () => {
    const chao = createChao({ id: 'c1', name: 'Test Chao', bornGeneration: 1 });
    const { chao: awakened, events } = awakenBondCard(chao, brambleHare);

    // brambleHare: stamina 6-10 (avg 8 * 3.5 = 28), run 2-4 (avg 3 * 3.5 = 10.5 -> 11).
    expect(awakened.stats.stamina).toBe(28);
    expect(awakened.stats.run).toBe(11);
    expect(events.filter((e) => e.type === 'grade_roll')).toHaveLength(2);
  });

  it('is fully deterministic — awakening the same card twice gives identical results', () => {
    const chao = createChao({ id: 'c1', name: 'Test Chao', bornGeneration: 1 });
    const first = awakenBondCard(chao, brambleHare);
    const second = awakenBondCard(chao, brambleHare);
    expect(first.chao.stats).toEqual(second.chao.stats);
  });

  it('appends exactly one bondedCards entry, flagged awakened', () => {
    const chao = createChao({ id: 'c1', name: 'Test Chao', bornGeneration: 1 });
    const { chao: awakened } = awakenBondCard(chao, brambleHare);

    expect(awakened.bondedCards).toHaveLength(1);
    expect(awakened.bondedCards[0]?.awakened).toBe(true);
    expect(awakened.bondedCards[0]?.card.id).toBe(brambleHare.id);
    expect(awakened.speciesTagCounts.rabbit).toBe(1); // still folds into derived fields normally
  });
});

describe('consumeRegimen', () => {
  it('grants a permanent flat stat with no bonded card, tag, or identity change', () => {
    const chao = createChao({ id: 'c1', name: 'Test Chao', bornGeneration: 1 });
    const rng = createRng(3);

    const { chao: fed, events } = consumeRegimen(chao, deeprootFruit, rng);

    expect(fed.stats.stamina).toBeGreaterThanOrEqual(10);
    expect(fed.stats.stamina).toBeLessThanOrEqual(14);
    expect(fed.bondedCards).toEqual([]);
    expect(fed.colorIdentity).toEqual([]); // Regimen is consumed, not "attached" — GDD §3.3
    expect(fed.speciesTagCounts).toEqual({});
    expect(events).toHaveLength(1);
  });
});

describe('computeSplashTax', () => {
  it('is free for the first card bonded to a Chao with no color identity yet', () => {
    const chao = createChao({ id: 'c1', name: 'Test Chao', bornGeneration: 1 });
    expect(computeSplashTax(chao, brambleHare, 3)).toBe(0);
  });

  it("is free when the card's color already matches the Chao's identity", () => {
    const chao = createChao({ id: 'c1', name: 'Test Chao', bornGeneration: 1 });
    const rng = createRng(5);
    const { chao: bonded } = bondCard(chao, brambleHare, rng); // green identity
    expect(computeSplashTax(bonded, deeprootFruit, 3)).toBe(0); // also green
  });

  it('charges the base tax for an off-color card', () => {
    const chao = createChao({ id: 'c1', name: 'Test Chao', bornGeneration: 1 });
    const rng = createRng(5);
    const { chao: bonded } = bondCard(chao, brambleHare, rng); // green identity
    expect(computeSplashTax(bonded, skitterFinch, 3)).toBe(3); // red, off-color
  });

  it('never charges tax for colorless cards', () => {
    const chao = createChao({ id: 'c1', name: 'Test Chao', bornGeneration: 1 });
    const rng = createRng(5);
    const { chao: bonded } = bondCard(chao, brambleHare, rng);
    expect(computeSplashTax(bonded, { color: 'colorless' }, 3)).toBe(0);
  });
});
