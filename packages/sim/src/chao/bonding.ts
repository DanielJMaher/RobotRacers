import type { Rng } from '../rng';
import { rollInRange } from '../rng';
import type { BondCard, BondedCard, Chao, RegimenCard, RolledStatGrant, SimEvent } from '../types';
import { recomputeDerived } from './derived';

export interface BondResult {
  chao: Chao;
  events: SimEvent[];
  // No `replacedCard` anymore (GDD §3.5, corrected 2026-08-20) — bonding is
  // cumulative now; nothing is ever replaced, so there's nothing to report.
}

function rollStatGrants(
  card: BondCard | RegimenCard,
  rng: Rng,
): { rolled: RolledStatGrant[]; events: SimEvent[] } {
  const rolled: RolledStatGrant[] = [];
  const events: SimEvent[] = [];
  for (const grant of card.statGrants) {
    const amount = rollInRange(rng, grant.min, grant.max);
    // exactOptionalPropertyTypes: only include `region` when the grant
    // actually has one — passing `region: undefined` explicitly is a
    // different (rejected) thing from omitting the property entirely.
    rolled.push(
      grant.region === undefined
        ? { stat: grant.stat, amount }
        : { stat: grant.stat, amount, region: grant.region },
    );
    events.push({ type: 'grade_roll', cardId: card.id, stat: grant.stat, roll: amount });
  }
  return { rolled, events };
}

// Bonds a Bond Card onto the Chao (GDD §3.5, corrected 2026-08-20). Any
// number of Bond Cards can be bonded over a Chao's lifetime — this simply
// rolls the new card's grants (each independently signed and Body-Region-
// tagged) and appends them to the accumulated history. Nothing is ever
// reversed or replaced: an earlier version of this function checked for an
// "occupied slot" and subtracted the previous card's contribution first,
// which was the wrong model entirely (see the GDD's revision note).
export function bondCard(chao: Chao, card: BondCard, rng: Rng): BondResult {
  const stats = { ...chao.stats };
  const { rolled, events } = rollStatGrants(card, rng);
  for (const grant of rolled) {
    stats[grant.stat] += grant.amount;
  }

  const bondedCard: BondedCard = { card, rolledGrants: rolled };
  const nextChao: Chao = {
    ...chao,
    stats,
    bondedCards: [...chao.bondedCards, bondedCard],
  };

  return {
    chao: recomputeDerived(nextChao),
    events,
  };
}

// Awakening (GDD §4.6, roadmap.md Phase 6, implemented alongside the
// one-time-use Bond Card correction): 3 copies of the same Bond Card fuse
// into a single, more powerful application — 3.5x a single copy's AVERAGE
// stat grant, deterministic (no grade roll, no rng) rather than a fresh
// random roll. This is a genuinely different mechanic from normal bonding
// (reliable and large vs. random-in-range), not just "bond it 3 times" —
// it produces exactly ONE BondedCard history entry, flagged `awakened`.
const AWAKENING_MULTIPLIER = 3.5;

export function awakenBondCard(chao: Chao, card: BondCard): BondResult {
  const stats = { ...chao.stats };
  const rolled: RolledStatGrant[] = [];
  const events: SimEvent[] = [];

  for (const grant of card.statGrants) {
    const amount = Math.round(((grant.min + grant.max) / 2) * AWAKENING_MULTIPLIER);
    rolled.push(
      grant.region === undefined
        ? { stat: grant.stat, amount }
        : { stat: grant.stat, amount, region: grant.region },
    );
    stats[grant.stat] += amount;
    events.push({ type: 'grade_roll', cardId: card.id, stat: grant.stat, roll: amount });
  }

  const bondedCard: BondedCard = { card, rolledGrants: rolled, awakened: true };
  const nextChao: Chao = { ...chao, stats, bondedCards: [...chao.bondedCards, bondedCard] };

  return { chao: recomputeDerived(nextChao), events };
}

// Consumes a Regimen Card (GDD §4.2): a permanent, one-time flat stat grant
// with no slot and no species tags — and, deliberately, no effect on color
// identity or alignment, since a consumed card isn't "currently bonded/
// attached" the way a Bond or Trait card is (GDD §3.3 scopes alignment to
// attached cards specifically). Not reversible; there's nothing left to
// overwrite once it's spent.
export function consumeRegimen(
  chao: Chao,
  card: RegimenCard,
  rng: Rng,
): { chao: Chao; events: SimEvent[] } {
  const stats = { ...chao.stats };
  const { rolled, events } = rollStatGrants(card, rng);
  for (const grant of rolled) {
    stats[grant.stat] += grant.amount;
  }
  return { chao: { ...chao, stats }, events };
}

// Splash tax (GDD §4.4): bonding a card whose color isn't already in the
// Chao's color identity costs extra Fruit. The GDD's "small tax for a shared
// color, larger tax for a fully foreign color" language assumes a distance
// metric between colors that the design doesn't actually define anywhere —
// docs/01-design/card-set-list.md ends up naming all 10 two-color pairs as
// equally valid archetypes, not an ally/enemy wheel — so this Phase 0
// implementation uses the simplest rule the docs unambiguously support: 0 tax
// on-color (or before any identity exists yet), flat `baseTax` off-color.
// Finer-grained tiers are an open tuning question, docs/03-roadmap/roadmap.md.
export function computeSplashTax(
  chao: Chao,
  card: { color: BondCard['color'] },
  baseTax: number,
): number {
  if (card.color === 'colorless') return 0;
  if (chao.colorIdentity.length === 0) return 0;
  if (chao.colorIdentity.includes(card.color)) return 0;
  return baseTax;
}
