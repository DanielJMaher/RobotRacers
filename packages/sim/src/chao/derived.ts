import type { BodyRegion, Chao, SpeciesTag, StatColor } from '../types';

// Alignment weight per color, GDD §3.3: Green/White pull Hero, Black/Red pull
// Dark, Blue is a neutral damper (it counts toward the denominator below,
// diluting the swing, but never pushes the sum either direction itself).
const ALIGNMENT_WEIGHT: Record<StatColor, number> = {
  green: 1,
  white: 1,
  black: -1,
  red: -1,
  blue: 0,
};

// How far from 0 the normalized alignment value has to be before it reads as
// Hero/Dark instead of Neutral. A placeholder pending playtesting — see
// docs/03-roadmap/roadmap.md's open numeric-tuning question.
const ALIGNMENT_NEUTRAL_BAND = 0.15;

function coloredCardColors(chao: Chao): StatColor[] {
  const colors: StatColor[] = [];
  for (const { card } of chao.bondedCards) {
    if (card.color !== 'colorless') {
      colors.push(card.color);
    }
  }
  for (const trait of chao.traits) {
    if (trait.color !== 'colorless') {
      colors.push(trait.color);
    }
  }
  return colors;
}

function computeColorIdentity(chao: Chao): StatColor[] {
  return Array.from(new Set(coloredCardColors(chao))).sort();
}

function computeAlignment(chao: Chao): { alignment: Chao['alignment']; alignmentValue: number } {
  const colors = coloredCardColors(chao);

  if (colors.length === 0) {
    return { alignment: 'neutral', alignmentValue: 0 };
  }

  const rawSum = colors.reduce((sum, color) => sum + ALIGNMENT_WEIGHT[color], 0);
  const alignmentValue = Math.max(-1, Math.min(1, rawSum / colors.length));

  const alignment: Chao['alignment'] =
    alignmentValue > ALIGNMENT_NEUTRAL_BAND
      ? 'hero'
      : alignmentValue < -ALIGNMENT_NEUTRAL_BAND
        ? 'dark'
        : 'neutral';

  return { alignment, alignmentValue };
}

function computeSpeciesTagCounts(chao: Chao): Partial<Record<SpeciesTag, number>> {
  const counts: Partial<Record<SpeciesTag, number>> = {};
  for (const { card } of chao.bondedCards) {
    for (const tag of card.speciesTags) {
      counts[tag] = (counts[tag] ?? 0) + 1;
    }
  }
  return counts;
}

// Per-region visual look (GDD §3.5, new 2026-08-20): for every Body Region a
// bonded card touches, every one of that card's Species Tags gets credited
// toward that region's tally — a card that spans Legs/Arms/Back credits all
// its tags to all three. Whichever tag ends up with the highest count per
// region "wins," and that tag's bodyMutation string for that region is the
// look shown. Discrete top-contributor-wins, not a rendered blend (decided
// 2026-08-20 — a true blend needs a production art pipeline that isn't
// being built). Ties keep whichever tag was found first (stable, not
// random) — a reasonable placeholder, not deeply tuned.
function computeRegionLooks(chao: Chao): Partial<Record<BodyRegion, string>> {
  const tagCountsByRegion = new Map<BodyRegion, Map<SpeciesTag, number>>();
  const mutationByRegionAndTag = new Map<BodyRegion, Map<SpeciesTag, string>>();

  for (const { card } of chao.bondedCards) {
    for (const region of Object.keys(card.bodyMutations) as BodyRegion[]) {
      const mutation = card.bodyMutations[region];
      if (mutation === undefined) continue;

      const tagCounts = tagCountsByRegion.get(region) ?? new Map<SpeciesTag, number>();
      const mutations = mutationByRegionAndTag.get(region) ?? new Map<SpeciesTag, string>();
      for (const tag of card.speciesTags) {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
        mutations.set(tag, mutation);
      }
      tagCountsByRegion.set(region, tagCounts);
      mutationByRegionAndTag.set(region, mutations);
    }
  }

  const looks: Partial<Record<BodyRegion, string>> = {};
  for (const [region, tagCounts] of tagCountsByRegion) {
    let winningTag: SpeciesTag | undefined;
    let winningCount = -1;
    for (const [tag, count] of tagCounts) {
      if (count > winningCount) {
        winningTag = tag;
        winningCount = count;
      }
    }
    const mutation = winningTag !== undefined ? mutationByRegionAndTag.get(region)?.get(winningTag) : undefined;
    if (mutation !== undefined) {
      looks[region] = mutation;
    }
  }
  return looks;
}

// Recomputes every field on a Chao that's *derived* from what's currently
// bonded/attached, rather than tracked incrementally — this is what makes
// bonding cumulative cards (GDD §3.5) correct by construction instead of
// needing careful add/remove bookkeeping elsewhere. See data-schemas.md's
// note on treating these as fields a pure function refreshes, not state any
// call site mutates directly.
export function recomputeDerived(chao: Chao): Chao {
  const colorIdentity = computeColorIdentity(chao);
  const { alignment, alignmentValue } = computeAlignment(chao);
  const speciesTagCounts = computeSpeciesTagCounts(chao);
  const regionLooks = computeRegionLooks(chao);
  return { ...chao, colorIdentity, alignment, alignmentValue, speciesTagCounts, regionLooks };
}
