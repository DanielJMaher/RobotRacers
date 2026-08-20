import { describe, expect, it } from 'vitest';
import { createChao } from '../chao/factory';
import { createRng } from '../rng';
import type { Chao, TraitCard } from '../types';
import { resolveBout } from './bout';

function makeChao(overrides: Partial<Chao> = {}, statOverrides: Partial<Chao['stats']> = {}): Chao {
  const base = createChao({ id: 'chao', name: 'Test Chao', bornGeneration: 1 });
  return { ...base, stats: { ...base.stats, ...statOverrides }, ...overrides };
}

describe('resolveBout', () => {
  it('lets the higher-Power attacker win against a weak defender', () => {
    const a = makeChao({ id: 'a' }, { power: 30, run: 10, swim: 0, stamina: 20 });
    const b = makeChao({ id: 'b' }, { power: 0, run: 1, swim: 0, stamina: 20 });

    const result = resolveBout(
      { chao: a, loadedTechniques: [] },
      { chao: b, loadedTechniques: [] },
      createRng(1),
      { rounds: 5 },
    );

    expect(result.winner).toBe('a');
    expect(result.finalB.currentStamina).toBe(0);
    expect(result.events.some((e) => e.type === 'hit' && e.attackerId === 'a')).toBe(true);
  });

  it('gives turn order to the higher-Run Chao', () => {
    const a = makeChao({ id: 'a' }, { run: 50, stamina: 20 });
    const b = makeChao({ id: 'b' }, { run: 5, stamina: 20 });

    const result = resolveBout(
      { chao: a, loadedTechniques: [] },
      { chao: b, loadedTechniques: [] },
      createRng(2),
      { rounds: 1 },
    );

    const turnOrderEvent = result.events.find((e) => e.type === 'turn_order');
    expect(turnOrderEvent).toMatchObject({ chaoId: 'a', result: 'first' });
  });

  it('breaks a Run tie using Luck', () => {
    const a = makeChao({ id: 'a' }, { run: 10, luck: 5, stamina: 20 });
    const b = makeChao({ id: 'b' }, { run: 10, luck: 1, stamina: 20 });

    const result = resolveBout(
      { chao: a, loadedTechniques: [] },
      { chao: b, loadedTechniques: [] },
      createRng(3),
      { rounds: 1 },
    );

    const turnOrderEvent = result.events.find((e) => e.type === 'turn_order');
    expect(turnOrderEvent).toMatchObject({ chaoId: 'a', result: 'first' });
  });

  it('never lets a pre-second-evolution Chao dodge, regardless of Fly', () => {
    const a = makeChao({ id: 'a' }, { power: 10, stamina: 20 });
    const b = makeChao({ id: 'b', evolutionStage: 1 }, { fly: 999, swim: 0, stamina: 20 });

    const result = resolveBout(
      { chao: a, loadedTechniques: [] },
      { chao: b, loadedTechniques: [] },
      createRng(4),
      { rounds: 1 },
    );

    const evasionEvent = result.events.find((e) => e.type === 'evasion_check' && e.chaoId === 'b');
    expect(evasionEvent).toMatchObject({ threshold: 0 });
  });

  it('lets a second-evolution Chao with high Fly dodge sometimes', () => {
    const a = makeChao({ id: 'a' }, { power: 10, stamina: 20 });
    const b = makeChao({ id: 'b', evolutionStage: 2 }, { fly: 120, swim: 0, stamina: 20 });

    const result = resolveBout(
      { chao: a, loadedTechniques: [] },
      { chao: b, loadedTechniques: [] },
      createRng(4),
      { rounds: 1 },
    );

    const evasionEvent = result.events.find((e) => e.type === 'evasion_check' && e.chaoId === 'b');
    expect(evasionEvent).toMatchObject({ threshold: 0.6 });
  });

  it('fires bout_start Trait effects before any rounds resolve', () => {
    const boostTrait: TraitCard = {
      id: 'trait.pre_bout_boost',
      name: 'Pre-Bout Boost',
      rarity: 'common',
      type: 'trait',
      color: 'black',
      effect: {
        trigger: { on: 'bout_start' },
        apply: [{ op: 'modifyStat', stat: 'power', amount: 100 }],
      },
    };
    const a = makeChao({ id: 'a', traits: [boostTrait] }, { power: 0, stamina: 20 });
    const b = makeChao({ id: 'b' }, { swim: 0, stamina: 5 });

    const result = resolveBout(
      { chao: a, loadedTechniques: [] },
      { chao: b, loadedTechniques: [] },
      createRng(5),
      { rounds: 1 },
    );

    expect(result.events.some((e) => e.type === 'trait_fired' && e.cardId === boostTrait.id)).toBe(
      true,
    );
    // The boosted Power (100) should one-shot b's 5 Stamina.
    expect(result.finalB.currentStamina).toBe(0);
  });

  it('ends in a draw when both Chao are still standing with equal Stamina after all rounds', () => {
    const a = makeChao({ id: 'a' }, { power: 1, swim: 200, run: 5, stamina: 10 });
    const b = makeChao({ id: 'b' }, { power: 1, swim: 200, run: 5, stamina: 10 });

    const result = resolveBout(
      { chao: a, loadedTechniques: [] },
      { chao: b, loadedTechniques: [] },
      createRng(6),
      { rounds: 2 },
    );

    expect(result.winner).toBe('draw');
    expect(result.finalA.currentStamina).toBe(result.finalB.currentStamina);
    expect(result.finalA.currentStamina).toBeGreaterThan(0);
  });
});
