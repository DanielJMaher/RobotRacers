import { describe, expect, it } from 'vitest';
import { meadowFawn } from '../cards/data/green';
import { createChao } from '../chao/factory';
import { createRng } from '../rng';
import { bondCard } from '../chao/bonding';
import type { TechniqueCard, TraitCard } from '../types';
import { applyEffectOps, collectTriggerables, fireTriggers, resetCurrentStamina } from './shared';

function makeTrait(overrides: Partial<TraitCard> = {}): TraitCard {
  return {
    id: 'trait.test_trait',
    name: 'Test Trait',
    rarity: 'common',
    type: 'trait',
    color: 'green',
    effect: {
      trigger: { on: 'bout_start' },
      apply: [{ op: 'modifyStat', stat: 'power', amount: 3 }],
    },
    ...overrides,
  };
}

function makeTechnique(overrides: Partial<TechniqueCard> = {}): TechniqueCard {
  return {
    id: 'technique.test_technique',
    name: 'Test Technique',
    rarity: 'common',
    type: 'technique',
    color: 'red',
    energyCost: 1,
    exileOnUse: false,
    effect: {
      trigger: { on: 'round_start' },
      apply: [{ op: 'grantFruit', amount: 2 }],
    },
    ...overrides,
  };
}

describe('resetCurrentStamina', () => {
  it("sets currentStamina to the Chao's base stamina stat", () => {
    const base = createChao({ id: 'c1', name: 'Test', bornGeneration: 1 });
    const chao = { ...base, stats: { ...base.stats, stamina: 42 } };
    expect(resetCurrentStamina(chao).currentStamina).toBe(42);
  });
});

describe('collectTriggerables', () => {
  it('gathers Bond Card keywords, Trait Cards, and loaded Techniques', () => {
    const base = createChao({ id: 'c1', name: 'Test', bornGeneration: 1 });
    const { chao: withBond } = bondCard(base, meadowFawn, createRng(1)); // meadowFawn has a keyword
    const withTrait = { ...withBond, traits: [makeTrait()] };
    const technique = makeTechnique();

    const triggerables = collectTriggerables(withTrait, [technique]);
    const sources = triggerables.map((t) => t.source).sort();
    expect(sources).toEqual(['bond', 'technique', 'trait']);
  });
});

describe('applyEffectOps', () => {
  it('applies modifyStat and tags the fired event by source kind', () => {
    const chao = createChao({ id: 'c1', name: 'Test', bornGeneration: 1 });
    const result = applyEffectOps(
      chao,
      [{ op: 'modifyStat', stat: 'power', amount: 5 }],
      'trait.test_trait',
      'trait',
    );
    expect(result.chao.stats.power).toBe(5);
    expect(result.events).toContainEqual({
      type: 'trait_fired',
      cardId: 'trait.test_trait',
      chaoId: 'c1',
    });
    expect(result.controlOps).toHaveLength(0);
  });

  it('emits a keyword_fired event for a bond-sourced effect', () => {
    const chao = createChao({ id: 'c1', name: 'Test', bornGeneration: 1 });
    const result = applyEffectOps(chao, [{ op: 'modifyStat', stat: 'run', amount: 1 }], 'bond.x', 'bond');
    expect(result.events).toContainEqual({ type: 'keyword_fired', cardId: 'bond.x', chaoId: 'c1' });
  });

  it('emits a fruit_gained event for grantFruit without mutating stats', () => {
    const chao = createChao({ id: 'c1', name: 'Test', bornGeneration: 1 });
    const result = applyEffectOps(chao, [{ op: 'grantFruit', amount: 3 }], 'technique.x', 'technique');
    expect(result.chao.stats).toEqual(chao.stats);
    expect(result.events).toContainEqual({ type: 'fruit_gained', amount: 3, reason: 'technique.x' });
  });

  it('surfaces non-stateful ops as controlOps without mutating the Chao', () => {
    const chao = createChao({ id: 'c1', name: 'Test', bornGeneration: 1 });
    const result = applyEffectOps(chao, [{ op: 'autoWinLeg' }], 'bond.x', 'bond');
    expect(result.chao).toEqual(chao);
    expect(result.controlOps).toEqual([{ op: 'autoWinLeg' }]);
  });

  it('fires and logs a custom op without applying any mechanical effect', () => {
    const chao = createChao({ id: 'c1', name: 'Test', bornGeneration: 1 });
    const result = applyEffectOps(
      chao,
      [{ op: 'custom', description: 'flavor-only effect' }],
      'bond.x',
      'bond',
    );
    expect(result.chao).toEqual(chao);
    expect(result.controlOps).toEqual([{ op: 'custom', description: 'flavor-only effect' }]);
    expect(result.events).toContainEqual({ type: 'keyword_fired', cardId: 'bond.x', chaoId: 'c1' });
  });
});

describe('fireTriggers', () => {
  it('only applies triggerables matching the predicate', () => {
    const chao = { ...createChao({ id: 'c1', name: 'Test', bornGeneration: 1 }), traits: [makeTrait()] };
    const technique = makeTechnique();

    const boutStartResult = fireTriggers(chao, [technique], (t) => t.on === 'bout_start');
    expect(boutStartResult.chao.stats.power).toBe(3); // the trait fired
    expect(boutStartResult.events.some((e) => e.type === 'fruit_gained')).toBe(false); // technique did not

    const roundStartResult = fireTriggers(chao, [technique], (t) => t.on === 'round_start');
    expect(roundStartResult.chao.stats.power).toBe(0); // trait did not fire this time
    expect(roundStartResult.events).toContainEqual({ type: 'fruit_gained', amount: 2, reason: technique.id });
  });

  it('enforces a per_race onceLimit across repeated calls via the returned firedOnce set', () => {
    const trait = makeTrait({
      effect: {
        trigger: { on: 'leg_start' },
        apply: [{ op: 'modifyStat', stat: 'power', amount: 10 }],
        onceLimit: 'per_race',
      },
    });
    const chao = { ...createChao({ id: 'c1', name: 'Test', bornGeneration: 1 }), traits: [trait] };

    const first = fireTriggers(chao, [], (t) => t.on === 'leg_start');
    expect(first.chao.stats.power).toBe(10);

    // Simulate a second Leg of the same type within the same Race by
    // threading firedOnce through, as race.ts now does.
    const second = fireTriggers(first.chao, [], (t) => t.on === 'leg_start', first.firedOnce);
    expect(second.chao.stats.power).toBe(10); // unchanged — the onceLimit blocked a second firing
  });

  it('does not enforce a limit when firedOnce is not threaded through (a fresh call each time)', () => {
    const trait = makeTrait({
      effect: {
        trigger: { on: 'leg_start' },
        apply: [{ op: 'modifyStat', stat: 'power', amount: 10 }],
        onceLimit: 'per_race',
      },
    });
    const chao = { ...createChao({ id: 'c1', name: 'Test', bornGeneration: 1 }), traits: [trait] };

    const first = fireTriggers(chao, [], (t) => t.on === 'leg_start');
    const second = fireTriggers(first.chao, [], (t) => t.on === 'leg_start'); // no firedOnce passed
    expect(second.chao.stats.power).toBe(20);
  });

  it('threads the Chao through multiple matching triggerables in sequence', () => {
    const traitA = makeTrait({ id: 'trait.a' });
    const traitB = makeTrait({
      id: 'trait.b',
      effect: {
        trigger: { on: 'bout_start' },
        apply: [{ op: 'modifyStat', stat: 'power', amount: 4 }],
      },
    });
    const chao = { ...createChao({ id: 'c1', name: 'Test', bornGeneration: 1 }), traits: [traitA, traitB] };

    const result = fireTriggers(chao, [], (t) => t.on === 'bout_start');
    expect(result.chao.stats.power).toBe(7); // 3 + 4, applied cumulatively
  });
});
