import { describe, expect, it } from 'vitest';
import type { BondCard, DraftSeat } from '../types';
import {
  chooseBotCardIndex,
  initialColorAffinity,
  nudgeAffinity,
  rawPower,
  scoreCardForSeat,
} from './bots';

function makeSeat(overrides: Partial<DraftSeat> = {}): DraftSeat {
  return {
    seatId: 'seat-0',
    isPlayer: false,
    colorAffinity: initialColorAffinity(),
    pool: [],
    ...overrides,
  };
}

function makeBondCard(overrides: Partial<BondCard> = {}): BondCard {
  return {
    id: 'bond.test_card',
    name: 'Test Card',
    rarity: 'common',
    type: 'bond',
    color: 'green',
    slot: 'feet',
    statGrants: [{ stat: 'stamina', min: 5, max: 5 }],
    speciesTags: ['beast'],
    bodyMutation: 'test',
    ...overrides,
  };
}

describe('rawPower', () => {
  it('ranks a legendary above a common with a similar stat total', () => {
    const common = makeBondCard({ rarity: 'common' });
    const legendary = makeBondCard({ rarity: 'legendary', id: 'bond.legendary_test' });
    expect(rawPower(legendary)).toBeGreaterThan(rawPower(common));
  });
});

describe('scoreCardForSeat', () => {
  it('favors raw power almost entirely on an early pick (empty pool)', () => {
    const seat = makeSeat({ pool: [] });
    const commonOffColor = makeBondCard({ rarity: 'common', color: 'red' });
    const legendaryOnColor = makeBondCard({
      rarity: 'legendary',
      color: 'green',
      id: 'bond.legendary_test',
    });
    expect(scoreCardForSeat(seat, legendaryOnColor)).toBeGreaterThan(
      scoreCardForSeat(seat, commonOffColor),
    );
  });

  it('weights color affinity heavily once the pool has 3+ cards', () => {
    const seat = makeSeat({
      colorAffinity: { green: 1, red: 0.1, black: 0.5, blue: 0.5, white: 0.5 },
      pool: [makeBondCard(), makeBondCard(), makeBondCard()],
    });
    const greenCard = makeBondCard({ color: 'green', id: 'bond.green_test' });
    const redCard = makeBondCard({ color: 'red', id: 'bond.red_test' });
    // Same rarity and stat total — isolates the affinity term specifically.
    expect(scoreCardForSeat(seat, greenCard)).toBeGreaterThan(scoreCardForSeat(seat, redCard));
  });

  it('rewards Species Tag synergy with the existing pool once past the early picks', () => {
    const seat = makeSeat({
      pool: [
        makeBondCard({ speciesTags: ['rabbit'] }),
        makeBondCard({ speciesTags: ['rabbit'] }),
        makeBondCard({ speciesTags: ['rabbit'] }),
      ],
    });
    const rabbitCard = makeBondCard({ speciesTags: ['rabbit'], id: 'bond.rabbit_test' });
    const dragonCard = makeBondCard({ speciesTags: ['dragon'], id: 'bond.dragon_test' });
    expect(scoreCardForSeat(seat, rabbitCard)).toBeGreaterThan(scoreCardForSeat(seat, dragonCard));
  });
});

describe('chooseBotCardIndex', () => {
  it('returns the index of the highest-scoring card in the pack', () => {
    const seat = makeSeat({ pool: [] });
    const pack = [
      makeBondCard({ rarity: 'common', id: 'bond.low' }),
      makeBondCard({ rarity: 'legendary', id: 'bond.high' }),
      makeBondCard({ rarity: 'uncommon', id: 'bond.mid' }),
    ];
    expect(chooseBotCardIndex(seat, pack)).toBe(1);
  });

  it('throws on an empty pack', () => {
    expect(() => chooseBotCardIndex(makeSeat(), [])).toThrow();
  });
});

describe('nudgeAffinity', () => {
  it("increases affinity for the picked card's color", () => {
    const seat = makeSeat();
    const card = makeBondCard({ color: 'green' });
    const nudged = nudgeAffinity(seat, card);
    expect(nudged.colorAffinity.green).toBeGreaterThan(seat.colorAffinity.green);
    expect(nudged.colorAffinity.red).toBe(seat.colorAffinity.red);
  });

  it('leaves affinity unchanged for a colorless card', () => {
    const seat = makeSeat();
    // BondCard.color is typed StatColor | "colorless" (inherited from
    // CardBase) even though every Bond Card in the actual set is colored —
    // colorless is really an Item-only concept in practice, but the type
    // permits it here, which is all this test needs.
    const card = makeBondCard({ color: 'colorless' });
    const nudged = nudgeAffinity(seat, card);
    expect(nudged).toEqual(seat);
  });
});
