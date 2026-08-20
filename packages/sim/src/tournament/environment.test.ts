import { describe, expect, it } from 'vitest';
import { sunlitMeadow, windsweptCliff } from '../cards/data/habitat';
import { brambleHare, packleafTortoise } from '../cards/data/green';
import { dustdashLizard } from '../cards/data/red';
import { cinderSeed, emberSeed } from '../cards/data/seeds';
import { createChao } from '../chao/factory';
import { createRng } from '../rng';
import {
  addAvailableSeed,
  bondCardWithSplashTax,
  createEnvironment,
  placeHabitatCard,
  plantSeed,
  triggerFruitGain,
} from './environment';

describe('createEnvironment', () => {
  it('starts with 3 empty (Open Fort) slots and 0 Fruit', () => {
    const env = createEnvironment([sunlitMeadow, windsweptCliff]);
    expect(env.slots).toEqual([undefined, undefined, undefined]);
    expect(env.fruit).toBe(0);
    expect(env.unplacedHabitats).toEqual([sunlitMeadow, windsweptCliff]);
  });
});

describe('placeHabitatCard', () => {
  it('places a card into an empty slot as a 1-star Habitat', () => {
    const env = createEnvironment([sunlitMeadow]);
    const placed = placeHabitatCard(env, 0, 0);
    expect(placed.slots[0]).toEqual({ color: 'green', starLevel: 1, seedSlots: 1, plantedSeedColors: [] });
    expect(placed.unplacedHabitats).toEqual([]);
  });

  it('combines a 2nd same-color card placed onto an occupied slot into a 2-star Habitat', () => {
    const env = createEnvironment([sunlitMeadow, sunlitMeadow]);
    const afterFirst = placeHabitatCard(env, 0, 0);
    const afterSecond = placeHabitatCard(afterFirst, 0, 0); // index 0 again — the 2nd sunlitMeadow shifted down

    expect(afterSecond.slots[0]).toEqual({ color: 'green', starLevel: 2, seedSlots: 2, plantedSeedColors: [] });
    expect(afterSecond.unplacedHabitats).toEqual([]);
  });

  it('throws when placing a different color onto an already-occupied slot (placement is permanent)', () => {
    const env = createEnvironment([sunlitMeadow, windsweptCliff]);
    const afterFirst = placeHabitatCard(env, 0, 0);
    expect(() => placeHabitatCard(afterFirst, 0, 0)).toThrow();
  });

  it('throws for an out-of-range card index', () => {
    const env = createEnvironment([sunlitMeadow]);
    expect(() => placeHabitatCard(env, 5, 0)).toThrow();
  });
});

describe('plantSeed', () => {
  it('plants into a filled slot with an open Seed slot, consuming the Seed from availableSeeds', () => {
    const env = addAvailableSeed(placeHabitatCard(createEnvironment([sunlitMeadow]), 0, 0), cinderSeed);
    const seeded = plantSeed(env, 0, 0);
    expect(seeded.slots[0]?.plantedSeedColors).toEqual(['black']); // cinderSeed is black
    expect(seeded.availableSeeds).toEqual([]);
  });

  it('throws when planting into an empty (Open Fort) slot', () => {
    const env = addAvailableSeed(createEnvironment([]), cinderSeed);
    expect(() => plantSeed(env, 0, 0)).toThrow();
  });

  it('throws once every Seed slot on a 1-star Habitat is full', () => {
    const env = addAvailableSeed(
      addAvailableSeed(placeHabitatCard(createEnvironment([sunlitMeadow]), 0, 0), cinderSeed),
      emberSeed,
    );
    const seeded = plantSeed(env, 0, 0);
    expect(() => plantSeed(seeded, 0, 0)).toThrow(); // seedIndex 0 is now emberSeed, but the slot is full
  });

  it('allows 2 planted Seeds on a 2-star Habitat', () => {
    const combined = placeHabitatCard(
      placeHabitatCard(createEnvironment([sunlitMeadow, sunlitMeadow]), 0, 0),
      0,
      0,
    );
    const withSeeds = addAvailableSeed(addAvailableSeed(combined, cinderSeed), emberSeed);
    const seeded = plantSeed(plantSeed(withSeeds, 0, 0), 0, 0);
    expect(seeded.slots[0]?.plantedSeedColors).toEqual(['black', 'red']);
    expect(seeded.availableSeeds).toEqual([]);
  });

  it('throws for an out-of-range Seed index', () => {
    const env = placeHabitatCard(createEnvironment([sunlitMeadow]), 0, 0);
    expect(() => plantSeed(env, 5, 0)).toThrow();
  });
});

describe('triggerFruitGain', () => {
  it('grants 1 Wildcard Fruit per Open Fort (empty) slot', () => {
    const env = createEnvironment([]);
    expect(triggerFruitGain(env).fruit).toBe(3); // 3 empty slots x 1
  });

  it('grants 2 base Fruit per 1-star Habitat, 3 for a 2-star', () => {
    const oneStar = placeHabitatCard(createEnvironment([sunlitMeadow]), 0, 0);
    expect(triggerFruitGain(oneStar).fruit).toBe(2 + 1 + 1); // 1 filled (2) + 2 Open Fort (1 each)

    const twoStar = placeHabitatCard(
      placeHabitatCard(createEnvironment([sunlitMeadow, sunlitMeadow]), 0, 0),
      0,
      0,
    );
    expect(triggerFruitGain(twoStar).fruit).toBe(3 + 1 + 1); // 1 combined (3) + 2 Open Fort (1 each)
  });

  it('accumulates across multiple triggers', () => {
    const env = createEnvironment([]);
    const afterTwo = triggerFruitGain(triggerFruitGain(env));
    expect(afterTwo.fruit).toBe(6); // 3 Open Fort x 1 x 2 triggers
  });
});

describe('bondCardWithSplashTax', () => {
  it('bonds for free on-color even with 0 Fruit', () => {
    const chao = createChao({ id: 'c1', name: 'Test Chao', bornGeneration: 1 });
    const rng = createRng(2);
    const { chao: greenChao } = bondCardWithSplashTax(chao, createEnvironment([]), brambleHare, 3, rng);
    // A 2nd green card onto an already-green identity — still on-color, still free.
    const result = bondCardWithSplashTax(greenChao, createEnvironment([]), packleafTortoise, 3, rng);
    expect(result.ok).toBe(true);
    expect(result.taxPaid).toBe(0);
  });

  it('blocks an off-color bond when Fruit is insufficient', () => {
    const chao = createChao({ id: 'c1', name: 'Test Chao', bornGeneration: 1 });
    const rng = createRng(3);
    const { chao: greenChao } = bondCardWithSplashTax(chao, createEnvironment([]), brambleHare, 3, rng);
    const poorEnv = createEnvironment([]); // 0 Fruit
    const result = bondCardWithSplashTax(greenChao, poorEnv, dustdashLizard, 3, rng); // red, off-color

    expect(result.ok).toBe(false);
    expect(result.taxPaid).toBe(0);
    expect(result.chao).toBe(greenChao); // unchanged
    expect(result.environment).toBe(poorEnv); // unchanged
  });

  it('pays the tax from pooled Fruit and succeeds when enough is banked', () => {
    const chao = createChao({ id: 'c1', name: 'Test Chao', bornGeneration: 1 });
    const rng = createRng(4);
    const { chao: greenChao } = bondCardWithSplashTax(chao, createEnvironment([]), brambleHare, 3, rng);
    const richEnv = triggerFruitGain(createEnvironment([])); // 3 Fruit from 3 Open Fort slots
    const result = bondCardWithSplashTax(greenChao, richEnv, dustdashLizard, 3, rng); // red, off-color, tax 3

    expect(result.ok).toBe(true);
    expect(result.taxPaid).toBe(3);
    expect(result.environment.fruit).toBe(0);
    expect(result.chao.colorIdentity).toEqual(['green', 'red']);
  });
});
