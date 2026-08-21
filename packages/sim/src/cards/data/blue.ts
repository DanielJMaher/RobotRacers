import type { BondCard, TechniqueCard, TraitCard } from '../../types';

// "Core Garden" example set — Blue (Fly) cards.
// Source: docs/01-design/card-set-list.md
//
// Migrated 2026-08-20 (roadmap.md Phase 2.5) to the corrected Bond Card
// model: `slot` -> per-grant `region` (all Back here, unchanged name),
// `bodyMutation: string` -> `bodyMutations: {region: string}`. Mechanical
// schema migration only — see green.ts's header note for the full rationale.
//
// Rewritten 2026-08-21 (roadmap.md Phase 5.9) — same pass as the other color
// files: every keyword/effect below uses only currently-live triggers/ops,
// and every card got a flavorText line. Tidewatcher's Eye and Mirage Step
// were the two hardest cases here — a draft-time peek and a Bout-only dodge
// respectively, neither with any Race-side equivalent — so both were
// reflavored to genuinely different mechanics rather than forced into a
// shape that only pretends to match their old text. See each card's own
// note. Hummingbird Dash's "Hover" keyword turned out to be an unusually
// perfect fit for the newly-wired grantAlternateRoute op — see its note.
//
// Potion cards (Windcatcher Draught, Cloudsight Tonic) moved out to
// cards/data/potions.ts 2026-08-20 (roadmap.md Phase 5.5) — see that file's
// own header note.

export const dartingSparrow: BondCard = {
  id: 'bond.darting_sparrow',
  name: 'Darting Sparrow',
  rarity: 'common',
  type: 'bond',
  color: 'blue',
  flavorText: 'Changes direction faster than the eye can follow it.',
  statGrants: [{ stat: 'fly', min: 7, max: 11, region: 'back' }],
  speciesTags: ['bird'],
  bodyMutations: { back: 'small_wings' },
};

export const glassfinGuppy: BondCard = {
  id: 'bond.glassfin_guppy',
  name: 'Glassfin Guppy',
  rarity: 'common',
  type: 'bond',
  color: 'blue',
  flavorText: 'Fins so clear they seem to slip through the air itself.',
  statGrants: [{ stat: 'fly', min: 6, max: 10, region: 'back' }],
  speciesTags: ['fish'],
  bodyMutations: { back: 'glass_fins' },
  keyword: {
    // Was "Slipstream: +10% Evasion vs. the first hit each Bout" — dead
    // since Bout was removed. Reflavored to slipping through the very first
    // Leg's resistance with ease, same "first Leg" convention used across
    // the other color files.
    trigger: { on: 'leg_start' },
    apply: [{ op: 'modifyStat', stat: 'fly', amount: 4 }],
    onceLimit: 'per_race',
  },
};

export const paperKiteMoth: BondCard = {
  id: 'bond.paper_kite_moth',
  name: 'Paper Kite Moth',
  rarity: 'common',
  type: 'bond',
  color: 'blue',
  flavorText: 'Weighs almost nothing. The wind does most of the work.',
  statGrants: [
    { stat: 'fly', min: 8, max: 12, region: 'back' },
    { stat: 'mind', min: 1, max: 1, region: 'back' },
  ],
  speciesTags: ['insect'],
  bodyMutations: { back: 'patterned_wings' },
};

export const feint: TechniqueCard = {
  id: 'technique.feint',
  name: 'Feint',
  rarity: 'uncommon',
  type: 'technique',
  color: 'blue',
  flavorText: 'Commits to a direction it never actually takes.',
  energyCost: 1,
  exileOnUse: false,
  // Was a direct forceEvade — a real EffectOp, but one the Race resolver
  // never consumes (no dodge/evasion concept in a Race at all; that was
  // Bout-specific, per the GDD's 2026-08-20 revision note). Reflavored to a
  // real, live burst at the first Leg.
  effect: {
    trigger: { on: 'leg_start' },
    apply: [{ op: 'modifyStat', stat: 'fly', amount: 5 }],
    onceLimit: 'per_race',
  },
};

export const hummingbirdDash: BondCard = {
  id: 'bond.hummingbird_dash',
  name: 'Hummingbird Dash',
  rarity: 'uncommon',
  type: 'bond',
  color: 'blue',
  flavorText: "Never touches the water at all. Why would it?",
  statGrants: [{ stat: 'fly', min: 13, max: 18, region: 'back' }],
  speciesTags: ['bird'],
  bodyMutations: { back: 'blurred_wings' },
  keyword: {
    // Was "Hover: always takes the shortcut fork if the Fly threshold is
    // met, no variance roll" — a live trigger with a dead `custom` op. This
    // turned out to be an exact match for grantAlternateRoute (wired up
    // 2026-08-21 alongside this rewrite): it hovers across the Water Leg on
    // Fly instead of swimming, no fork/threshold roll needed at all.
    trigger: { on: 'leg_start', legType: 'water' },
    apply: [
      { op: 'grantAlternateRoute', legType: 'water', altStat: 'fly', description: 'Hovers across instead of swimming.' },
    ],
  },
};

export const tidewatchersEye: TraitCard = {
  id: 'trait.tidewatchers_eye',
  name: "Tidewatcher's Eye",
  rarity: 'uncommon',
  type: 'trait',
  color: 'blue',
  flavorText: 'Sees trouble coming from further off than anyone else.',
  // Was a draft-time "look at 2 extra cards" effect — no TriggerCondition
  // represents a draft pack-open event at all (every trigger here is
  // Race-scoped), so this had no engine hook whatsoever, not even a dead
  // one. Reflavored entirely to a real Race-time vigilance effect: steadies
  // the Chao the moment Stamina gets dangerous, before it becomes a DNF.
  effect: {
    trigger: { on: 'stamina_below', fraction: 0.4 },
    apply: [{ op: 'restoreStamina', amount: 6 }],
    onceLimit: 'per_race',
  },
};

export const riptideMinnow: BondCard = {
  id: 'bond.riptide_minnow',
  name: 'Riptide Minnow',
  rarity: 'uncommon',
  type: 'bond',
  color: 'blue',
  flavorText: 'Rides a current only it can feel.',
  statGrants: [
    { stat: 'fly', min: 11, max: 15, region: 'back' },
    { stat: 'swim', min: 3, max: 5, region: 'back' },
  ],
  speciesTags: ['fish'],
  bodyMutations: { back: 'fin_crest' },
};

export const stormpetrelWing: BondCard = {
  id: 'bond.stormpetrel_wing',
  name: 'Stormpetrel Wing',
  rarity: 'rare',
  type: 'bond',
  color: 'blue',
  flavorText: 'Storms do not ground it. They carry it further.',
  statGrants: [{ stat: 'fly', min: 17, max: 23, region: 'back' }],
  speciesTags: ['bird'],
  bodyMutations: { back: 'storm_feathers' },
  keyword: {
    // Was "Evasive Mastery: Evasion doubled vs. Power-type attackers" —
    // dead since Bout was removed. Reflavored to a real permanent surge,
    // granted fresh at the start of every Race.
    trigger: { on: 'race_start' },
    apply: [{ op: 'modifyStat', stat: 'fly', amount: 5 }],
  },
};

export const readTheWind: TechniqueCard = {
  id: 'technique.read_the_wind',
  name: 'Read the Wind',
  rarity: 'rare',
  type: 'technique',
  color: 'blue',
  flavorText: "Catches the best air before anyone else notices it's there.",
  energyCost: 2,
  exileOnUse: false,
  // Was "reveal the next Leg's type before choosing which Techniques to
  // load" — a pre-Race planning aid with no stat/trigger shape to express
  // it in. Reflavored to its rare tier's most direct translation: a
  // stronger permanent Fly surge at every Race's start.
  effect: {
    trigger: { on: 'race_start' },
    apply: [{ op: 'modifyStat', stat: 'fly', amount: 6 }],
  },
};

export const mirageStep: TraitCard = {
  id: 'trait.mirage_step',
  name: 'Mirage Step',
  rarity: 'rare',
  type: 'trait',
  color: 'blue',
  flavorText: 'Every step it takes might not be where it actually lands.',
  effect: {
    // Was a direct forceEvade, once per Bout — dead since Bout was removed
    // and forceEvade was never consumed by the Race resolver anyway.
    // Reflavored to a real recovery effect: the illusion buys it a moment
    // to catch its breath every time it clears a Leg.
    trigger: { on: 'leg_won' },
    apply: [{ op: 'restoreStamina', amount: 3 }],
  },
};

export const skydancerFirstOfFlight: BondCard = {
  id: 'bond.skydancer_first_of_flight',
  name: 'Skydancer, First of Flight',
  rarity: 'legendary',
  type: 'bond',
  color: 'blue',
  flavorText: 'The sky remembers this one by name.',
  statGrants: [{ stat: 'fly', min: 28, max: 36, region: 'back' }],
  speciesTags: ['bird'],
  bodyMutations: { back: 'iridescent_wings_trailing_feathers' },
  keyword: {
    // Direct match: autoWinLeg gated to Air legs specifically.
    trigger: { on: 'leg_start', legType: 'air' },
    apply: [{ op: 'autoWinLeg' }],
    onceLimit: 'per_race',
  },
};

export const perfectRead: TechniqueCard = {
  id: 'technique.perfect_read',
  name: 'Perfect Read',
  rarity: 'legendary',
  type: 'technique',
  color: 'blue',
  flavorText: 'Reads the wind so well it barely needs wings at all.',
  energyCost: 3,
  exileOnUse: true,
  // Was "see the opponent's remaining loaded Techniques" — an opposing-
  // Chao-info mechanic with no meaning in a solo Race resolution.
  // Reflavored to its legendary tier's most direct translation: an
  // overwhelming one-time Fly burst loaded before the Race.
  effect: {
    trigger: { on: 'manual' },
    apply: [{ op: 'modifyStat', stat: 'fly', amount: 10 }],
  },
};

export const blueCards = [
  dartingSparrow,
  glassfinGuppy,
  paperKiteMoth,
  feint,
  hummingbirdDash,
  tidewatchersEye,
  riptideMinnow,
  stormpetrelWing,
  readTheWind,
  mirageStep,
  skydancerFirstOfFlight,
  perfectRead,
];
