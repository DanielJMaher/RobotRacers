import type { Chao, SpeciesTag, StatColor } from '../types';

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
  for (const bonded of Object.values(chao.bondSlots)) {
    if (bonded && bonded.card.color !== 'colorless') {
      colors.push(bonded.card.color);
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
  for (const bonded of Object.values(chao.bondSlots)) {
    if (!bonded) continue;
    for (const tag of bonded.card.speciesTags) {
      counts[tag] = (counts[tag] ?? 0) + 1;
    }
  }
  return counts;
}

// Recomputes every field on a Chao that's *derived* from what's currently
// bonded/attached, rather than tracked incrementally — this is what makes
// overwriting a Bond Slot (GDD §3.5) correct by construction instead of
// needing careful add/remove bookkeeping elsewhere. See data-schemas.md's
// note on treating these as fields a pure function refreshes, not state any
// call site mutates directly.
export function recomputeDerived(chao: Chao): Chao {
  const colorIdentity = computeColorIdentity(chao);
  const { alignment, alignmentValue } = computeAlignment(chao);
  const speciesTagCounts = computeSpeciesTagCounts(chao);
  return { ...chao, colorIdentity, alignment, alignmentValue, speciesTagCounts };
}
