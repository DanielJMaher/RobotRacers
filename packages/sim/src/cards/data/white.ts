import type { BondCard, RegimenCard, TechniqueCard, TraitCard } from '../../types';

// "Core Garden" example set — White (Swim) cards.
// Source: docs/01-design/card-set-list.md
//
// Same `custom`-op convention as the other color files. Two cards here hit
// gaps worth flagging individually: Tidepool Tonic's Happiness bonus (not a
// Stat) and Guardian's Oath, which is fundamentally a multi-Chao board
// mechanic with no meaning until Phase 3's board exists — see their notes.

export const koiPondElder: BondCard = {
  id: 'bond.koi_pond_elder',
  name: 'Koi Pond Elder',
  rarity: 'common',
  type: 'bond',
  color: 'white',
  slot: 'back',
  statGrants: [{ stat: 'swim', min: 7, max: 11 }],
  speciesTags: ['fish'],
  bodyMutation: 'trailing_fins',
};

export const harborSealPup: BondCard = {
  id: 'bond.harbor_seal_pup',
  name: 'Harbor Seal Pup',
  rarity: 'common',
  type: 'bond',
  color: 'white',
  slot: 'back',
  statGrants: [{ stat: 'swim', min: 8, max: 12 }],
  speciesTags: ['beast'],
  bodyMutation: 'seal_flippers',
  keyword: {
    // Reduces a Water leg's staminaCost — no EffectOp targets a Leg's cost
    // directly (that's a race.ts-local config value, not Chao state).
    trigger: { on: 'leg_start', legType: 'water' },
    apply: [{ op: 'custom', description: 'Buoyant: reduces the Stamina cost of Water legs.' }],
  },
};

export const reedCrane: BondCard = {
  id: 'bond.reed_crane',
  name: 'Reed Crane',
  rarity: 'common',
  type: 'bond',
  color: 'white',
  slot: 'feet',
  statGrants: [
    { stat: 'swim', min: 6, max: 10 },
    { stat: 'fly', min: 2, max: 4 },
  ],
  speciesTags: ['bird'],
  bodyMutation: 'long_legs',
};

export const clearwaterDraught: RegimenCard = {
  id: 'regimen.clearwater_draught',
  name: 'Clearwater Draught',
  rarity: 'common',
  type: 'regimen',
  color: 'white',
  statGrants: [{ stat: 'swim', min: 10, max: 14 }],
};

export const tidepoolTonic: RegimenCard = {
  id: 'regimen.tidepool_tonic',
  name: 'Tidepool Tonic',
  rarity: 'common',
  type: 'regimen',
  color: 'white',
  // card-set-list.md's flavor text also grants "+2 Happiness" — Happiness
  // isn't a Stat (it's a separate Chao field, chao.happiness, fed by Rest
  // Garden nodes and DNF tracking per the GDD), so it can't be expressed via
  // RegimenCard's statGrants. Implemented as the Swim grant alone.
  statGrants: [{ stat: 'swim', min: 5, max: 8 }],
};

export const guardStance: TechniqueCard = {
  id: 'technique.guard_stance',
  name: 'Guard Stance',
  rarity: 'uncommon',
  type: 'technique',
  color: 'white',
  energyCost: 1,
  exileOnUse: false,
  effect: {
    // "Half damage" is a multiplier, not a flat amount — preventDamage's
    // schema is a flat number or 'all', so it doesn't fit; custom instead.
    trigger: { on: 'round_start' },
    apply: [{ op: 'custom', description: 'Takes half damage from the next hit this round.' }],
    onceLimit: 'per_round',
  },
};

export const coralTurtleShell: BondCard = {
  id: 'bond.coral_turtle_shell',
  name: 'Coral Turtle Shell',
  rarity: 'uncommon',
  type: 'bond',
  color: 'white',
  slot: 'back',
  statGrants: [{ stat: 'swim', min: 13, max: 18 }],
  speciesTags: ['reptile'],
  bodyMutation: 'coral_shell',
  keyword: {
    // Direct match: preventDamage 'all' for the first round each Bout.
    // NOTE: same caveat as Feint (blue.ts) — bout.ts doesn't yet consume
    // preventDamage from controlOps, so this fires and logs without
    // mechanically zeroing damage until that wiring exists.
    trigger: { on: 'round_start' },
    apply: [{ op: 'preventDamage', amount: 'all' }],
    onceLimit: 'per_bout',
  },
};

export const stillWaters: TraitCard = {
  id: 'trait.still_waters',
  name: 'Still Waters',
  rarity: 'uncommon',
  type: 'trait',
  color: 'white',
  effect: {
    // Conditional on NOT using any Technique for the whole Race — no
    // "race_end" trigger exists to check that retrospectively; race_start
    // is used as the least-wrong placeholder.
    trigger: { on: 'race_start' },
    apply: [
      {
        op: 'custom',
        description: 'If this Chao finishes the Race without using any Techniques, gain double Fruit.',
      },
    ],
  },
};

export const otterPaddle: BondCard = {
  id: 'bond.otter_paddle',
  name: 'Otter Paddle',
  rarity: 'uncommon',
  type: 'bond',
  color: 'white',
  slot: 'feet',
  statGrants: [{ stat: 'swim', min: 11, max: 15 }],
  speciesTags: ['beast'],
  bodyMutation: 'webbed_paws',
  keyword: {
    // Direct match: autoWinLeg gated to Water legs.
    trigger: { on: 'leg_start', legType: 'water' },
    apply: [{ op: 'autoWinLeg' }],
    onceLimit: 'per_race',
  },
};

export const leviathansScale: BondCard = {
  id: 'bond.leviathans_scale',
  name: "Leviathan's Scale",
  rarity: 'rare',
  type: 'bond',
  color: 'white',
  slot: 'back',
  statGrants: [{ stat: 'swim', min: 17, max: 23 }],
  speciesTags: ['fish'],
  bodyMutation: 'ancient_scales',
  keyword: {
    trigger: { on: 'bout_start' },
    apply: [
      {
        op: 'custom',
        description:
          "Aegis: Trait Cards that would remove this Chao's shields/protections instead fail.",
      },
    ],
  },
};

export const steadyHand: TechniqueCard = {
  id: 'technique.steady_hand',
  name: 'Steady Hand',
  rarity: 'rare',
  type: 'technique',
  color: 'white',
  energyCost: 2,
  exileOnUse: false,
  effect: {
    trigger: { on: 'round_start' },
    apply: [
      { op: 'custom', description: 'Cannot be knocked back or have action order changed this round.' },
    ],
    onceLimit: 'per_round',
  },
};

export const guardiansOath: TraitCard = {
  id: 'trait.guardians_oath',
  name: "Guardian's Oath",
  rarity: 'rare',
  type: 'trait',
  color: 'white',
  effect: {
    // Fundamentally a multi-Chao board mechanic ("another Chao on your
    // board") — meaningless until Phase 3's board of 2-6 Chao exists
    // (roadmap.md). race_start is a placeholder trigger with no real hook.
    trigger: { on: 'race_start' },
    apply: [
      {
        op: 'custom',
        description:
          "Whenever another Chao on your board would DNF, this Chao may give up its own Leg result to save them. Requires Phase 3's multi-Chao board to mean anything.",
      },
    ],
  },
};

export const ninefoldTideTheUnbroken: BondCard = {
  id: 'bond.ninefold_tide_the_unbroken',
  name: 'Ninefold Tide, the Unbroken',
  rarity: 'legendary',
  type: 'bond',
  color: 'white',
  slot: 'back',
  statGrants: [{ stat: 'swim', min: 28, max: 36 }],
  speciesTags: ['fish', 'reptile'],
  bodyMutation: 'layered_scale_armor_calm_expression',
  keyword: {
    trigger: { on: 'on_hit', as: 'defender' },
    apply: [
      {
        op: 'custom',
        description:
          'Sanctuary: cannot take Karate damage below 1 Stamina remaining more than once per Bout.',
      },
    ],
    onceLimit: 'per_bout',
  },
};

export const perfectCalm: TechniqueCard = {
  id: 'technique.perfect_calm',
  name: 'Perfect Calm',
  rarity: 'legendary',
  type: 'technique',
  color: 'white',
  energyCost: 3,
  exileOnUse: true,
  effect: {
    trigger: { on: 'race_start' },
    apply: [
      { op: 'autoResolveDNF', result: 'safe' },
      {
        op: 'custom',
        description:
          'Also automatically wins any single Leg of your choice — specific-leg selection is not modeled yet.',
      },
    ],
  },
};

export const whiteCards = [
  koiPondElder,
  harborSealPup,
  reedCrane,
  clearwaterDraught,
  tidepoolTonic,
  guardStance,
  coralTurtleShell,
  stillWaters,
  otterPaddle,
  leviathansScale,
  steadyHand,
  guardiansOath,
  ninefoldTideTheUnbroken,
  perfectCalm,
];
