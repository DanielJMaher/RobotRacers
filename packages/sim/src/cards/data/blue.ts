import type { BondCard, TechniqueCard, TraitCard } from '../../types';

// "Core Garden" example set — Blue (Fly) cards.
// Source: docs/01-design/card-set-list.md
//
// Same `custom`-op convention as green.ts/red.ts/black.ts. Tidewatcher's Eye
// hits a different kind of gap worth flagging individually: its card text
// describes a DRAFT-time effect (peeking extra cards) that no current
// trigger/resolver models at all — see its own inline note.
//
// Migrated 2026-08-20 (roadmap.md Phase 2.5) to the corrected Bond Card
// model: `slot` -> per-grant `region` (all Back here, unchanged name),
// `bodyMutation: string` -> `bodyMutations: {region: string}`. Mechanical
// schema migration only — see green.ts's header note for the full rationale.
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
  statGrants: [{ stat: 'fly', min: 6, max: 10, region: 'back' }],
  speciesTags: ['fish'],
  bodyMutations: { back: 'glass_fins' },
  keyword: {
    trigger: { on: 'bout_start' },
    apply: [{ op: 'custom', description: 'Slipstream: +10% Evasion vs. the first hit each Bout.' }],
  },
};

export const paperKiteMoth: BondCard = {
  id: 'bond.paper_kite_moth',
  name: 'Paper Kite Moth',
  rarity: 'common',
  type: 'bond',
  color: 'blue',
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
  energyCost: 1,
  exileOnUse: false,
  effect: {
    // Direct match to the existing forceEvade op. NOTE: the Race resolver
    // doesn't read controlOps to honor a forced dodge (there's no
    // evasion/dodge concept in a Race at all — that was Bout-specific,
    // GDD's 2026-08-20 revision note) — this fires and logs like a custom
    // op would, dormant pending a Race-relevant reflavor.
    trigger: { on: 'round_start' },
    apply: [{ op: 'forceEvade' }],
    onceLimit: 'per_round',
  },
};

export const hummingbirdDash: BondCard = {
  id: 'bond.hummingbird_dash',
  name: 'Hummingbird Dash',
  rarity: 'uncommon',
  type: 'bond',
  color: 'blue',
  statGrants: [{ stat: 'fly', min: 13, max: 18, region: 'back' }],
  speciesTags: ['bird'],
  bodyMutations: { back: 'blurred_wings' },
  keyword: {
    trigger: { on: 'leg_start', legType: 'water' },
    apply: [
      {
        op: 'custom',
        description:
          'Hover: always takes the shortcut fork if the Fly threshold is met, no variance roll.',
      },
    ],
  },
};

export const tidewatchersEye: TraitCard = {
  id: 'trait.tidewatchers_eye',
  name: "Tidewatcher's Eye",
  rarity: 'uncommon',
  type: 'trait',
  color: 'blue',
  // A draft-time effect ("look at 2 extra cards before picking") — no
  // TriggerCondition variant represents a draft pack-open event at all
  // (every trigger kind here is Race-scoped). 'manual' is used as the
  // least-wrong placeholder; this has no engine hook today.
  effect: {
    trigger: { on: 'manual' },
    apply: [
      {
        op: 'custom',
        description:
          'At the start of each Draft Booster, look at 2 extra cards from the pack before picking (then return them). No draft-engine hook yet.',
      },
    ],
  },
};

export const riptideMinnow: BondCard = {
  id: 'bond.riptide_minnow',
  name: 'Riptide Minnow',
  rarity: 'uncommon',
  type: 'bond',
  color: 'blue',
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
  statGrants: [{ stat: 'fly', min: 17, max: 23, region: 'back' }],
  speciesTags: ['bird'],
  bodyMutations: { back: 'storm_feathers' },
  keyword: {
    // "Doubled vs. Power-type attackers specifically" needs to know the
    // attacker's identity at evasion-calc time, which no current trigger
    // exposes — custom, attached at bout_start as a stand-in for "this
    // passive is active" (dormant now that Bout itself is removed).
    trigger: { on: 'bout_start' },
    apply: [
      { op: 'custom', description: 'Evasive Mastery: Evasion chance doubled vs. Power-type attackers.' },
    ],
  },
};

export const readTheWind: TechniqueCard = {
  id: 'technique.read_the_wind',
  name: 'Read the Wind',
  rarity: 'rare',
  type: 'technique',
  color: 'blue',
  energyCost: 2,
  exileOnUse: false,
  effect: {
    trigger: { on: 'race_start' },
    apply: [
      { op: 'custom', description: "Reveal the next Leg's type before choosing which Techniques to load." },
    ],
  },
};

export const mirageStep: TraitCard = {
  id: 'trait.mirage_step',
  name: 'Mirage Step',
  rarity: 'rare',
  type: 'trait',
  color: 'blue',
  effect: {
    trigger: { on: 'bout_start' },
    apply: [{ op: 'forceEvade' }],
    onceLimit: 'per_bout',
  },
};

export const skydancerFirstOfFlight: BondCard = {
  id: 'bond.skydancer_first_of_flight',
  name: 'Skydancer, First of Flight',
  rarity: 'legendary',
  type: 'bond',
  color: 'blue',
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
  energyCost: 3,
  exileOnUse: true,
  effect: {
    trigger: { on: 'bout_start' },
    apply: [
      {
        op: 'custom',
        description: "See the opponent's remaining loaded Techniques before choosing action order.",
      },
    ],
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
