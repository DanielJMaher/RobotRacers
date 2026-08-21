import type { Rng } from '../rng';
import { rollInRange } from '../rng';
import type { BondCard, BondedCard, Chao, ItemCard, PotionCard, RolledStatGrant, SimEvent, TraitCard } from '../types';
import { recomputeDerived } from './derived';

export interface BondResult {
  chao: Chao;
  events: SimEvent[];
  // No `replacedCard` anymore (GDD §3.5, corrected 2026-08-20) — bonding is
  // cumulative now; nothing is ever replaced, so there's nothing to report.
}

function rollStatGrants(
  card: BondCard | PotionCard,
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

// Consumes a Potion Card (GDD §4.2, renamed from Regimen 2026-08-20): a
// permanent, one-time flat stat grant with no slot and no species tags —
// and, deliberately, no effect on color identity or alignment, since a
// consumed card isn't "currently bonded/attached" the way a Bond or Trait
// card is (GDD §3.3 scopes alignment to attached cards specifically). Not
// reversible; there's nothing left to overwrite once it's spent. One-time
// use is enforced at the app layer (a Potion's pool entry is removed the
// same way a Bond Card's is), not here — this function just applies the
// grant, same as it always has.
export function consumePotion(
  chao: Chao,
  card: PotionCard,
  rng: Rng,
): { chao: Chao; events: SimEvent[] } {
  const stats = { ...chao.stats };
  const { rolled, events } = rollStatGrants(card, rng);
  for (const grant of rolled) {
    stats[grant.stat] += grant.amount;
  }
  return { chao: { ...chao, stats }, events };
}

// Max simultaneously-equipped Trait Cards (GDD §3.5/§4.2) — unlike Bond
// Cards, Traits don't stack unboundedly; the design is 2 active at a time,
// freely swappable (unbondTrait below), not a one-time-use consumable.
export const MAX_TRAITS = 2;

// Bonds a Trait Card (added 2026-08-21 — until now `chao.traits` existed on
// the type but nothing ever populated it, so no Trait effect could ever
// fire). Unlike bondCard, a Trait carries no statGrants to roll — its only
// effect is the TriggeredEffect that events/shared.ts's collectTriggerables
// picks up once it's in this array. Still feeds color identity/alignment
// (derived.ts already reads chao.traits for both), so recomputeDerived runs
// here too. Caller (tournament/environment.ts's bondTraitWithCost) is
// responsible for checking MAX_TRAITS before calling this — kept as a
// precondition rather than a silent no-op/throw here, matching how
// bondCard/consumePotion don't duplicate the pool-index bookkeeping the app
// layer already owns.
export function bondTrait(chao: Chao, card: TraitCard): { chao: Chao; events: SimEvent[] } {
  return { chao: recomputeDerived({ ...chao, traits: [...chao.traits, card] }), events: [] };
}

// Unbonds one Trait by card id (the first match, if the same Trait is
// somehow equipped twice) — frees a slot for a different Trait. No Fruit
// refund: the cost was for the choice to run with that Trait for a while,
// not a rental fee (same one-way-spend model as unequipItem below).
export function unbondTrait(chao: Chao, cardId: string): Chao {
  const index = chao.traits.findIndex((t) => t.id === cardId);
  if (index === -1) return chao;
  const traits = [...chao.traits.slice(0, index), ...chao.traits.slice(index + 1)];
  return recomputeDerived({ ...chao, traits });
}

// Equips an Item Card (added 2026-08-21, alongside bondTrait — "items need
// to have a purpose, currently they do nothing"). Items are uncapped and
// freely re-equippable (Chao.items' own doc comment) rather than one-time-
// use like Bond/Potion cards: a StaticModifier effect (a flat passive stat
// bonus — see events/shared.ts's isStaticModifier) is folded into base
// stats right here, once, at equip time; a TriggeredEffect effect is left
// alone (it fires later, during a Race, via collectTriggerables reading
// chao.items) — either way the ItemCard itself is appended to chao.items so
// it's recognized as currently equipped.
export function equipItem(chao: Chao, card: ItemCard): { chao: Chao; events: SimEvent[] } {
  const stats =
    'trigger' in card.effect
      ? chao.stats
      : { ...chao.stats, [card.effect.stat]: chao.stats[card.effect.stat] + card.effect.amount };
  return { chao: { ...chao, stats, items: [...chao.items, card] }, events: [] };
}

// Unequips one Item by card id (first match) — reverses a StaticModifier's
// stat bonus exactly (safe: it's the same fixed amount that was added at
// equip time), leaving a TriggeredEffect item with nothing to reverse since
// it never mutated stats directly.
export function unequipItem(chao: Chao, cardId: string): Chao {
  const index = chao.items.findIndex((i) => i.id === cardId);
  if (index === -1) return chao;
  const item = chao.items[index]!;
  const stats =
    'trigger' in item.effect
      ? chao.stats
      : { ...chao.stats, [item.effect.stat]: chao.stats[item.effect.stat] - item.effect.amount };
  const items = [...chao.items.slice(0, index), ...chao.items.slice(index + 1)];
  return { ...chao, stats, items };
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
