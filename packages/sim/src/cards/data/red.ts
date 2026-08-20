import type { BondCard, RegimenCard, TechniqueCard, TraitCard } from '../../types';

// "Core Garden" example set — Red (Run) cards.
// Source: docs/01-design/card-set-list.md

export const skitterFinch: BondCard = {
  id: 'bond.skitter_finch',
  name: 'Skitter Finch',
  rarity: 'common',
  type: 'bond',
  color: 'red',
  slot: 'feet',
  statGrants: [{ stat: 'run', min: 7, max: 11 }],
  speciesTags: ['bird'],
  bodyMutation: 'quick_tap_feet',
};

export const dustdashLizard: BondCard = {
  id: 'bond.dustdash_lizard',
  name: 'Dustdash Lizard',
  rarity: 'common',
  type: 'bond',
  color: 'red',
  slot: 'feet',
  statGrants: [{ stat: 'run', min: 8, max: 12 }],
  speciesTags: ['reptile'],
  bodyMutation: 'sprinting_legs',
  keyword: {
    trigger: { on: 'leg_start', legType: 'sprint' },
    apply: [{ op: 'autoWinLeg' }],
    onceLimit: 'per_race',
  },
};

export const firecrackerBeetle: BondCard = {
  id: 'bond.firecracker_beetle',
  name: 'Firecracker Beetle',
  rarity: 'common',
  type: 'bond',
  color: 'red',
  slot: 'hands',
  statGrants: [
    { stat: 'run', min: 6, max: 9 },
    { stat: 'power', min: 2, max: 4 },
  ],
  speciesTags: ['insect'],
  bodyMutation: 'bright_wing_case',
};

export const quickstepDraught: RegimenCard = {
  id: 'regimen.quickstep_draught',
  name: 'Quickstep Draught',
  rarity: 'common',
  type: 'regimen',
  color: 'red',
  statGrants: [{ stat: 'run', min: 10, max: 14 }],
};

export const racingStripeTonic: RegimenCard = {
  id: 'regimen.racing_stripe_tonic',
  name: 'Racing Stripe Tonic',
  rarity: 'common',
  type: 'regimen',
  color: 'red',
  statGrants: [
    { stat: 'run', min: 5, max: 8 },
    { stat: 'luck', min: 1, max: 1 },
  ],
};

export const adrenalineRush: TechniqueCard = {
  id: 'technique.adrenaline_rush',
  name: 'Adrenaline Rush',
  rarity: 'uncommon',
  type: 'technique',
  color: 'red',
  energyCost: 1,
  scope: 'bout',
  exileOnUse: false,
  effect: {
    trigger: { on: 'round_start' },
    apply: [
      { op: 'custom', description: 'This Chao takes two actions instead of one this round.' },
    ],
    onceLimit: 'per_round',
  },
};

export const cinderSprinter: BondCard = {
  id: 'bond.cinder_sprinter',
  name: 'Cinder Sprinter',
  rarity: 'uncommon',
  type: 'bond',
  color: 'red',
  slot: 'feet',
  statGrants: [{ stat: 'run', min: 13, max: 18 }],
  speciesTags: ['beast'],
  bodyMutation: 'ember_trail_paws',
  keyword: {
    trigger: { on: 'race_start' },
    apply: [
      {
        op: 'custom',
        description: 'Overclock: +Run scaling with banked Fruit, capped at +6.',
      },
    ],
  },
};

export const startlingCry: TraitCard = {
  id: 'trait.startling_cry',
  name: 'Startling Cry',
  rarity: 'uncommon',
  type: 'trait',
  color: 'red',
  effect: {
    trigger: { on: 'on_hit', as: 'defender' },
    apply: [
      {
        op: 'custom',
        description:
          'The first time each Bout this Chao is targeted by an enemy Technique, gain +Run equal to half current Run for the rest of the Bout.',
      },
    ],
    onceLimit: 'per_bout',
  },
};

export const jackrabbitReflex: BondCard = {
  id: 'bond.jackrabbit_reflex',
  name: 'Jackrabbit Reflex',
  rarity: 'uncommon',
  type: 'bond',
  color: 'red',
  slot: 'head',
  statGrants: [{ stat: 'run', min: 10, max: 14 }],
  speciesTags: ['rabbit'],
  bodyMutation: 'alert_long_ears',
  keyword: {
    trigger: { on: 'bout_start' },
    apply: [
      { op: 'custom', description: 'First Move: always acts first in round 1 of a Karate Bout.' },
    ],
  },
};

export const blazingCometWing: BondCard = {
  id: 'bond.blazing_comet_wing',
  name: 'Blazing Comet Wing',
  rarity: 'rare',
  type: 'bond',
  color: 'red',
  slot: 'back',
  statGrants: [
    { stat: 'run', min: 16, max: 22 },
    { stat: 'fly', min: 4, max: 6 },
  ],
  speciesTags: ['bird'],
  bodyMutation: 'trailing_sparks',
};

export const falseStart: TechniqueCard = {
  id: 'technique.false_start',
  name: 'False Start',
  rarity: 'rare',
  type: 'technique',
  color: 'red',
  energyCost: 2,
  scope: 'race',
  exileOnUse: false,
  effect: {
    trigger: { on: 'leg_start' },
    apply: [
      { op: 'custom', description: "This Chao's Run is doubled for the Start leg only." },
    ],
    onceLimit: 'per_race',
  },
};

export const feralMomentum: TraitCard = {
  id: 'trait.feral_momentum',
  name: 'Feral Momentum',
  rarity: 'rare',
  type: 'trait',
  color: 'red',
  effect: {
    trigger: { on: 'leg_won' },
    apply: [{ op: 'modifyStat', stat: 'run', amount: 2 }],
  },
};

export const sonicBoomSprinter: BondCard = {
  id: 'bond.sonic_boom_sprinter',
  name: 'Sonic Boom Sprinter',
  rarity: 'legendary',
  type: 'bond',
  color: 'red',
  slot: 'feet',
  statGrants: [{ stat: 'run', min: 24, max: 32 }],
  speciesTags: ['beast'],
  bodyMutation: 'motion_blur_streaks',
  keyword: {
    trigger: { on: 'race_start' },
    apply: [
      {
        op: 'custom',
        description: 'Breakneck: always takes the shortcut fork in a Race, no threshold check needed.',
      },
    ],
  },
};

export const photoFinish: TechniqueCard = {
  id: 'technique.photo_finish',
  name: 'Photo Finish',
  rarity: 'legendary',
  type: 'technique',
  color: 'red',
  energyCost: 3,
  scope: 'race',
  exileOnUse: true,
  effect: {
    trigger: { on: 'leg_start', legType: 'sprint' },
    apply: [
      {
        op: 'custom',
        description: 'If this Chao is in 2nd place or worse on the final Leg, instantly move up one placement.',
      },
    ],
  },
};

export const redCards = [
  skitterFinch,
  dustdashLizard,
  firecrackerBeetle,
  quickstepDraught,
  racingStripeTonic,
  adrenalineRush,
  cinderSprinter,
  startlingCry,
  jackrabbitReflex,
  blazingCometWing,
  falseStart,
  feralMomentum,
  sonicBoomSprinter,
  photoFinish,
];
