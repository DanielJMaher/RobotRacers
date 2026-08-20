import type { Rng } from '../rng';
import { pickRandom } from '../rng';
import type { Card, HabitatCard, Rarity } from '../types';

// A pack is 15 "spell slot" cards (drafted normally, passed around the
// table) plus 1 guaranteed bonus Habitat card, mirroring MTG's basic-land
// slot: the land/Habitat isn't part of what gets passed, it's just handed
// to you free with every pack (see drawBonusHabitat below).
export interface PackConfig {
  commons: number;
  uncommons: number;
  rareSlots: number;
  legendaryChance: number; // per rare slot — see docs/03-roadmap/roadmap.md tuning notes
}

export const DEFAULT_PACK_CONFIG: PackConfig = {
  commons: 10,
  uncommons: 3,
  rareSlots: 2,
  legendaryChance: 0.125, // ~1 in 8, per card-set-list.md's "~1 in 8 packs legendary"
};

export interface CardPool {
  byRarity: Record<Rarity, Card[]>; // excludes Habitat cards
  habitats: HabitatCard[];
}

export function buildCardPool(cards: Card[]): CardPool {
  const byRarity: Record<Rarity, Card[]> = { common: [], uncommon: [], rare: [], legendary: [] };
  const habitats: HabitatCard[] = [];
  for (const card of cards) {
    if (card.type === 'habitat') {
      habitats.push(card);
    } else {
      byRarity[card.rarity].push(card);
    }
  }
  return { byRarity, habitats };
}

// Generates the 15-card "spell" portion of a pack (sampling with
// replacement, same as a real print run has many physical copies of each
// card — this is also what makes 3-of-a-kind Awakening fusions, GDD §5.4,
// possible in the first place).
export function generateSpellPack(
  pool: CardPool,
  rng: Rng,
  config: PackConfig = DEFAULT_PACK_CONFIG,
): Card[] {
  const pack: Card[] = [];
  for (let i = 0; i < config.commons; i++) {
    pack.push(pickRandom(pool.byRarity.common, rng));
  }
  for (let i = 0; i < config.uncommons; i++) {
    pack.push(pickRandom(pool.byRarity.uncommon, rng));
  }
  for (let i = 0; i < config.rareSlots; i++) {
    const useLegendary = pool.byRarity.legendary.length > 0 && rng() < config.legendaryChance;
    pack.push(pickRandom(useLegendary ? pool.byRarity.legendary : pool.byRarity.rare, rng));
  }
  return pack;
}

export function drawBonusHabitat(pool: CardPool, rng: Rng): HabitatCard | undefined {
  if (pool.habitats.length === 0) return undefined;
  return pickRandom(pool.habitats, rng);
}
