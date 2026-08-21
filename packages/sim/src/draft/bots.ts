import type { Card, DraftSeat, Rarity, SpeciesTag, StatColor } from '../types';

// Bot drafting: a deterministic scoring heuristic, not ML (architecture.md
// §6) — simple enough to unit test against a specific pool/pack and tune by
// adjusting the constants below.

export function initialColorAffinity(): Record<StatColor, number> {
  return { green: 0.5, red: 0.5, black: 0.5, blue: 0.5, white: 0.5 };
}

const RARITY_POWER_WEIGHT: Record<Rarity, number> = {
  common: 1,
  uncommon: 2,
  rare: 3.5,
  legendary: 6,
};

// Non-Bond/Potion cards don't have a stat total to compare — this flat
// baseline is a placeholder heuristic (see roadmap.md's open tuning
// questions) rather than a mechanically-derived number.
const NON_STAT_CARD_BASELINE = 8;

function statTotal(card: Card): number {
  if (card.type === 'bond' || card.type === 'potion') {
    return card.statGrants.reduce((sum, grant) => sum + (grant.min + grant.max) / 2, 0);
  }
  return NON_STAT_CARD_BASELINE;
}

export function rawPower(card: Card): number {
  return RARITY_POWER_WEIGHT[card.rarity] * 4 + statTotal(card);
}

// Colorless cards fit any archetype (GDD §4.4), so they get a flat
// medium-affinity score rather than reading a specific color's weight.
const COLORLESS_AFFINITY = 0.5;

function colorAffinityMatch(seat: DraftSeat, card: Card): number {
  if (card.color === 'colorless') return COLORLESS_AFFINITY;
  return seat.colorAffinity[card.color];
}

// How many Species Tags a card shares with what's already in the seat's
// pool, normalized to roughly [0, 1]. Capped so a couple of early on-tag
// picks don't instantly saturate the score.
const TAG_SYNERGY_CAP = 4;

function tagSynergyWithPool(seat: DraftSeat, card: Card): number {
  if (card.type !== 'bond' || card.speciesTags.length === 0) return 0;

  const poolTagCounts = new Map<SpeciesTag, number>();
  for (const poolCard of seat.pool) {
    if (poolCard.type === 'bond') {
      for (const tag of poolCard.speciesTags) {
        poolTagCounts.set(tag, (poolTagCounts.get(tag) ?? 0) + 1);
      }
    }
  }

  const sharedCount = card.speciesTags.reduce(
    (sum, tag) => sum + (poolTagCounts.get(tag) ?? 0),
    0,
  );
  return Math.min(1, sharedCount / TAG_SYNERGY_CAP);
}

// Rough normalization so rawPower sits in roughly [0, 1] alongside the other
// two signals — legendaries (rarity weight 6*4=24, plus stat total) cap out
// near the top of the range.
const POWER_NORMALIZATION = 30;

// Pick 1–3: mostly raw power, lightly influenced by affinity.
// Pick 4+: the documented 0.4 power / 0.4 affinity / 0.2 tag-synergy split.
const EARLY_PICK_THRESHOLD = 3;
const EARLY_POWER_WEIGHT = 0.85;
const EARLY_AFFINITY_WEIGHT = 0.15;
const LATE_POWER_WEIGHT = 0.4;
const LATE_AFFINITY_WEIGHT = 0.4;
const LATE_SYNERGY_WEIGHT = 0.2;

export function scoreCardForSeat(seat: DraftSeat, card: Card): number {
  const normalizedPower = Math.min(1, rawPower(card) / POWER_NORMALIZATION);
  const affinity = colorAffinityMatch(seat, card);

  if (seat.pool.length < EARLY_PICK_THRESHOLD) {
    return normalizedPower * EARLY_POWER_WEIGHT + affinity * EARLY_AFFINITY_WEIGHT;
  }

  const synergy = tagSynergyWithPool(seat, card);
  return (
    normalizedPower * LATE_POWER_WEIGHT +
    affinity * LATE_AFFINITY_WEIGHT +
    synergy * LATE_SYNERGY_WEIGHT
  );
}

export function chooseBotCardIndex(seat: DraftSeat, pack: Card[]): number {
  if (pack.length === 0) {
    throw new Error('chooseBotCardIndex: cannot choose from an empty pack');
  }
  let bestIndex = 0;
  let bestScore = scoreCardForSeat(seat, pack[0]!);
  for (let i = 1; i < pack.length; i++) {
    const score = scoreCardForSeat(seat, pack[i]!);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }
  return bestIndex;
}

const AFFINITY_NUDGE = 0.08;

// After a seat picks a card, its affinity for that card's color(s) nudges up
// (architecture.md §6) — this is what makes bots "commit to a lane" over the
// course of a draft, and, as a side effect, produces believable open-color
// signals for a human drafter to read.
export function nudgeAffinity(seat: DraftSeat, card: Card): DraftSeat {
  if (card.color === 'colorless') return seat;
  const colorAffinity = { ...seat.colorAffinity };
  colorAffinity[card.color] = Math.min(1, colorAffinity[card.color] + AFFINITY_NUDGE);
  return { ...seat, colorAffinity };
}
