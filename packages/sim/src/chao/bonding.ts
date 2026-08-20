import type { Rng } from '../rng';
import { rollInRange } from '../rng';
import type {
  BondCard,
  BondedCard,
  Chao,
  RegimenCard,
  RolledStatGrant,
  SimEvent,
} from '../types';
import { recomputeDerived } from './derived';

export interface BondResult {
  chao: Chao;
  events: SimEvent[];
  replacedCard: BondCard | null;
}

function rollStatGrants(
  card: BondCard | RegimenCard,
  rng: Rng,
): { rolled: RolledStatGrant[]; events: SimEvent[] } {
  const rolled: RolledStatGrant[] = [];
  const events: SimEvent[] = [];
  for (const grant of card.statGrants) {
    const amount = rollInRange(rng, grant.min, grant.max);
    rolled.push({ stat: grant.stat, amount });
    events.push({ type: 'grade_roll', cardId: card.id, stat: grant.stat, roll: amount });
  }
  return { rolled, events };
}

// Bonds a Bond Card into its slot (GDD §3.5, §4.2). If the slot is already
// occupied, the previous card's stat contribution and species tags are fully
// reversed first — bonding over a slot REPLACES, it does not stack, matching
// the source material's "feed a different animal type, lose the old look"
// tension (docs/00-research/chao-garden-research.md §2).
export function bondCard(chao: Chao, card: BondCard, rng: Rng): BondResult {
  const previous = chao.bondSlots[card.slot] ?? null;

  const stats = { ...chao.stats };
  if (previous) {
    for (const grant of previous.rolledGrants) {
      stats[grant.stat] -= grant.amount;
    }
  }

  const { rolled, events } = rollStatGrants(card, rng);
  for (const grant of rolled) {
    stats[grant.stat] += grant.amount;
  }

  const bondedCard: BondedCard = { card, rolledGrants: rolled };
  const nextChao: Chao = {
    ...chao,
    stats,
    bondSlots: { ...chao.bondSlots, [card.slot]: bondedCard },
  };

  return {
    chao: recomputeDerived(nextChao),
    events,
    replacedCard: previous?.card ?? null,
  };
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
