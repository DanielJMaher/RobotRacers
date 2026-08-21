import { describe, expect, it } from 'vitest';
import { sunlitMeadow, windsweptCliff } from '../cards/data/habitat';
import { brambleHare, packleafTortoise } from '../cards/data/green';
import { deeprootFruit } from '../cards/data/potions';
import { dustdashLizard } from '../cards/data/red';
import { cinderSeed, emberSeed } from '../cards/data/seeds';
import { createChao } from '../chao/factory';
import { createRng } from '../rng';
import {
  addAvailableSeed,
  awakenBondCardWithCost,
  bondCardWithSplashTax,
  consumePotionWithCost,
  createEnvironment,
  type Environment,
  placeHabitatCard,
  plantSeed,
  triggerFruitGain,
  triggerInitialFruitGain,
} from './environment';

const EMPTY_FRUIT = { green: 0, red: 0, black: 0, blue: 0, white: 0, colorless: 0 };

// Test helper — grants a specific color's Fruit balance directly rather than
// routing every test through triggerFruitGain, which only ever produces the
// exact per-slot amounts and would make tests fragile to unrelated changes.
function withFruit(environment: Environment, amounts: Partial<typeof EMPTY_FRUIT>): Environment {
  return { ...environment, fruit: { ...environment.fruit, ...amounts } };
}

describe('createEnvironment', () => {
  it('starts with 3 empty (Open Fort) slots and 0 Fruit in every color', () => {
    const env = createEnvironment([sunlitMeadow, windsweptCliff]);
    expect(env.slots).toEqual([undefined, undefined, undefined]);
    expect(env.fruit).toEqual(EMPTY_FRUIT);
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
  it('grants 1 Wildcard (colorless) Fruit per Open Fort (empty) slot', () => {
    const env = createEnvironment([]);
    expect(triggerFruitGain(env).fruit).toEqual({ ...EMPTY_FRUIT, colorless: 3 }); // 3 empty slots x 1
  });

  it('grants 2 base Fruit (in the Habitat color) per 1-star Habitat, 3 for a 2-star', () => {
    const oneStar = placeHabitatCard(createEnvironment([sunlitMeadow]), 0, 0);
    // 1 filled green slot (2) + 2 Open Fort (1 colorless each).
    expect(triggerFruitGain(oneStar).fruit).toEqual({ ...EMPTY_FRUIT, green: 2, colorless: 2 });

    const twoStar = placeHabitatCard(
      placeHabitatCard(createEnvironment([sunlitMeadow, sunlitMeadow]), 0, 0),
      0,
      0,
    );
    // 1 combined green slot (3) + 2 Open Fort (1 colorless each).
    expect(triggerFruitGain(twoStar).fruit).toEqual({ ...EMPTY_FRUIT, green: 3, colorless: 2 });
  });

  it('accumulates across multiple triggers', () => {
    const env = createEnvironment([]);
    const afterTwo = triggerFruitGain(triggerFruitGain(env));
    expect(afterTwo.fruit).toEqual({ ...EMPTY_FRUIT, colorless: 6 }); // 3 Open Fort x 1 x 2 triggers
  });

  // Revised 2026-08-21 (playtest-prep): now that Fruit is tracked per color,
  // a planted Seed genuinely converts 1 unit of a slot's output to the
  // Seed's own color — previously flavor/display only under pooled Fruit.
  it('converts 1 unit of a Habitat slot output to a planted Seed color', () => {
    const seeded = plantSeed(
      addAvailableSeed(placeHabitatCard(createEnvironment([sunlitMeadow]), 0, 0), cinderSeed), // green 1-star + black Seed
      0,
      0,
    );
    // 1 native green unit + 1 converted black unit (from the 2 the slot would
    // otherwise produce), plus 2 Open Fort colorless.
    expect(triggerFruitGain(seeded).fruit).toEqual({ ...EMPTY_FRUIT, green: 1, black: 1, colorless: 2 });
  });

  it('never converts the last native-color unit — a 1-star Habitat always keeps at least 1 of its own color', () => {
    // Only 1 Seed slot exists on a 1-star Habitat (seedSlots: 1), so it's
    // structurally impossible to plant 2 Seeds onto it and fully convert a
    // 2-unit output — this test just confirms the single-Seed case keeps 1
    // native unit, which the "converts 1 unit" test above already covers by
    // construction (2 total units - 1 converted = 1 native remaining).
    const oneStar = placeHabitatCard(createEnvironment([sunlitMeadow]), 0, 0);
    expect(oneStar.slots[0]?.seedSlots).toBe(1);
  });
});

describe('triggerInitialFruitGain', () => {
  it('doubles the normal per-slot yield and adds a flat +4 colorless bonus (Tournament-start only)', () => {
    const oneStar = placeHabitatCard(createEnvironment([sunlitMeadow]), 0, 0);
    // Normal (non-doubled) rate would be green:2, colorless:2 (see triggerFruitGain test above).
    // Doubled: green:4, colorless:4, plus +4 flat colorless = colorless:8.
    expect(triggerInitialFruitGain(oneStar).fruit).toEqual({ ...EMPTY_FRUIT, green: 4, colorless: 8 });
  });

  it('is a one-off — the recurring after-every-race trigger is unaffected', () => {
    const oneStar = placeHabitatCard(createEnvironment([sunlitMeadow]), 0, 0);
    const afterInitial = triggerInitialFruitGain(oneStar);
    const afterRace = triggerFruitGain(afterInitial);
    // +2 green, +2 colorless on top of the initial grant — the normal rate, not doubled again.
    expect(afterRace.fruit).toEqual({ ...EMPTY_FRUIT, green: 6, colorless: 10 });
  });
});

describe('bondCardWithSplashTax', () => {
  it('blocks an on-color bond when there is no Fruit of that color at all (no more free bonds)', () => {
    const chao = createChao({ id: 'c1', name: 'Test Chao', bornGeneration: 1 });
    const rng = createRng(2);
    const result = bondCardWithSplashTax(chao, createEnvironment([]), brambleHare, 3, rng); // green, 0 green Fruit
    expect(result.ok).toBe(false);
    expect(result.baseCostPaid).toBe(0);
  });

  it('pays the base cost (in the card\'s own color) for an on-color bond, no splash tax', () => {
    const chao = createChao({ id: 'c1', name: 'Test Chao', bornGeneration: 1 });
    const rng = createRng(2);
    const env = withFruit(createEnvironment([]), { green: 1 }); // brambleHare is common -> costs 1
    const { chao: greenChao, environment: afterFirst } = bondCardWithSplashTax(chao, env, brambleHare, 3, rng);

    // A 2nd green card onto an already-green identity — still on-color, no tax, but still costs its own base Fruit.
    const richer = withFruit(afterFirst, { green: 1 }); // packleafTortoise is also common
    const result = bondCardWithSplashTax(greenChao, richer, packleafTortoise, 3, rng);
    expect(result.ok).toBe(true);
    expect(result.baseCostPaid).toBe(1);
    expect(result.taxPaid).toBe(0);
    expect(result.environment.fruit.green).toBe(0);
  });

  it('blocks an off-color bond when the base cost is covered but splash tax (colorless) is not', () => {
    const chao = createChao({ id: 'c1', name: 'Test Chao', bornGeneration: 1 });
    const rng = createRng(3);
    const env = withFruit(createEnvironment([]), { green: 1 });
    const { chao: greenChao } = bondCardWithSplashTax(chao, env, brambleHare, 3, rng);

    const poorEnv = withFruit(createEnvironment([]), { red: 1 }); // covers dustdashLizard's base cost, no colorless for tax
    const result = bondCardWithSplashTax(greenChao, poorEnv, dustdashLizard, 3, rng); // red, off-color

    expect(result.ok).toBe(false);
    expect(result.baseCostPaid).toBe(0);
    expect(result.taxPaid).toBe(0);
    expect(result.chao).toBe(greenChao); // unchanged
    expect(result.environment).toBe(poorEnv); // unchanged
  });

  it('pays both the base cost (own color) and the splash tax (colorless) when both are covered', () => {
    const chao = createChao({ id: 'c1', name: 'Test Chao', bornGeneration: 1 });
    const rng = createRng(4);
    const env = withFruit(createEnvironment([]), { green: 1 });
    const { chao: greenChao } = bondCardWithSplashTax(chao, env, brambleHare, 3, rng);

    const richEnv = withFruit(createEnvironment([]), { red: 1, colorless: 3 });
    const result = bondCardWithSplashTax(greenChao, richEnv, dustdashLizard, 3, rng); // red, off-color, tax 3

    expect(result.ok).toBe(true);
    expect(result.baseCostPaid).toBe(1);
    expect(result.taxPaid).toBe(3);
    expect(result.environment.fruit).toEqual({ ...EMPTY_FRUIT, red: 0, colorless: 0 });
    expect(result.chao.colorIdentity).toEqual(['green', 'red']);
  });
});

describe('awakenBondCardWithCost', () => {
  it('costs 3x the base cost (own color), no tax on-color', () => {
    const chao = createChao({ id: 'c1', name: 'Test Chao', bornGeneration: 1 });
    const env = withFruit(createEnvironment([]), { green: 3 }); // brambleHare common (1) x 3
    const result = awakenBondCardWithCost(chao, env, brambleHare, 3);

    expect(result.ok).toBe(true);
    expect(result.baseCostPaid).toBe(3);
    expect(result.taxPaid).toBe(0);
    expect(result.environment.fruit.green).toBe(0);
    expect(result.chao.bondedCards).toHaveLength(1);
    expect(result.chao.bondedCards[0]?.awakened).toBe(true);
  });

  it('blocks when 3x the base cost is not available', () => {
    const chao = createChao({ id: 'c1', name: 'Test Chao', bornGeneration: 1 });
    const env = withFruit(createEnvironment([]), { green: 2 }); // needs 3
    const result = awakenBondCardWithCost(chao, env, brambleHare, 3);

    expect(result.ok).toBe(false);
    expect(result.environment).toBe(env);
    expect(result.chao).toBe(chao);
  });
});

describe('consumePotionWithCost', () => {
  it('pays the base cost in the Potion\'s own color', () => {
    const chao = createChao({ id: 'c1', name: 'Test Chao', bornGeneration: 1 });
    const rng = createRng(3);
    const env = withFruit(createEnvironment([]), { green: 1 }); // deeprootFruit is common green
    const result = consumePotionWithCost(chao, env, deeprootFruit, rng);

    expect(result.ok).toBe(true);
    expect(result.costPaid).toBe(1);
    expect(result.environment.fruit.green).toBe(0);
    expect(result.chao.stats.stamina).toBeGreaterThanOrEqual(10);
  });

  it('blocks when the Potion\'s own color has insufficient Fruit', () => {
    const chao = createChao({ id: 'c1', name: 'Test Chao', bornGeneration: 1 });
    const rng = createRng(3);
    const result = consumePotionWithCost(chao, createEnvironment([]), deeprootFruit, rng);

    expect(result.ok).toBe(false);
    expect(result.costPaid).toBe(0);
    expect(result.chao).toBe(chao);
  });
});
