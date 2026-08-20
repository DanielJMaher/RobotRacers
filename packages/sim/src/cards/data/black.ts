import type { BondCard, RegimenCard, TechniqueCard, TraitCard } from '../../types';

// "Core Garden" example set — Black (Power) cards.
// Source: docs/01-design/card-set-list.md
//
// Same convention as green.ts/red.ts: `custom` EffectOps mark keyword text
// that doesn't map to an existing typed op yet — the Race/Bout resolvers
// fire and log these, with no mechanical effect, until a future pass gives
// them real semantics.

export const snappingTurtle: BondCard = {
  id: 'bond.snapping_turtle',
  name: 'Snapping Turtle',
  rarity: 'common',
  type: 'bond',
  color: 'black',
  slot: 'hands',
  statGrants: [{ stat: 'power', min: 7, max: 11 }],
  speciesTags: ['reptile'],
  bodyMutation: 'heavy_jaw',
};

export const ironHideBoar: BondCard = {
  id: 'bond.iron_hide_boar',
  name: 'Iron-Hide Boar',
  rarity: 'common',
  type: 'bond',
  color: 'black',
  slot: 'hands',
  statGrants: [{ stat: 'power', min: 8, max: 12 }],
  speciesTags: ['beast'],
  bodyMutation: 'iron_hide',
  keyword: {
    // Bulldoze: direct match to the existing autoWinLeg op, same pattern as
    // dustdashLizard's Bolt (red.ts).
    trigger: { on: 'leg_start', legType: 'obstacle' },
    apply: [{ op: 'autoWinLeg' }],
    onceLimit: 'per_race',
  },
};

export const stagBeetlePincer: BondCard = {
  id: 'bond.stag_beetle_pincer',
  name: 'Stag Beetle Pincer',
  rarity: 'common',
  type: 'bond',
  color: 'black',
  slot: 'hands',
  statGrants: [
    { stat: 'power', min: 6, max: 10 },
    { stat: 'stamina', min: 2, max: 4 },
  ],
  speciesTags: ['insect'],
  bodyMutation: 'mandibles',
};

export const crushblowTonic: RegimenCard = {
  id: 'regimen.crushblow_tonic',
  name: 'Crushblow Tonic',
  rarity: 'common',
  type: 'regimen',
  color: 'black',
  statGrants: [{ stat: 'power', min: 10, max: 14 }],
};

export const grindingStone: RegimenCard = {
  id: 'regimen.grinding_stone',
  name: 'Grinding Stone',
  rarity: 'common',
  type: 'regimen',
  color: 'black',
  // The set's one deliberate downside common (card-set-list.md) — a genuine
  // tradeoff so late Black picks aren't strictly good, per that doc's
  // set-design notes. rollInRange handles a negative min===max fine.
  statGrants: [
    { stat: 'power', min: 5, max: 8 },
    { stat: 'fly', min: -2, max: -2 },
  ],
};

export const heavyStrike: TechniqueCard = {
  id: 'technique.heavy_strike',
  name: 'Heavy Strike',
  rarity: 'uncommon',
  type: 'technique',
  color: 'black',
  energyCost: 1,
  scope: 'bout',
  exileOnUse: false,
  effect: {
    trigger: { on: 'round_start' },
    apply: [
      { op: 'custom', description: "This Chao's next hit ignores the defender's Swim entirely." },
    ],
    onceLimit: 'per_round',
  },
};

export const warthogTusks: BondCard = {
  id: 'bond.warthog_tusks',
  name: 'Warthog Tusks',
  rarity: 'uncommon',
  type: 'bond',
  color: 'black',
  slot: 'hands',
  statGrants: [{ stat: 'power', min: 13, max: 18 }],
  speciesTags: ['beast'],
  bodyMutation: 'tusks',
  keyword: {
    trigger: { on: 'on_hit', as: 'attacker' },
    apply: [{ op: 'custom', description: "Knockback+: on hit, delays the defender's next action." }],
  },
};

export const bloodrockIdol: TraitCard = {
  id: 'trait.bloodrock_idol',
  name: 'Bloodrock Idol',
  rarity: 'uncommon',
  type: 'trait',
  color: 'black',
  effect: {
    // Direct match: stamina_below is an existing trigger, modifyStat an
    // existing op — a real mechanically-live case, not a custom placeholder.
    trigger: { on: 'stamina_below', fraction: 0.5 },
    apply: [{ op: 'modifyStat', stat: 'power', amount: 3 }],
    onceLimit: 'per_generation',
  },
};

export const ramsCharge: BondCard = {
  id: 'bond.rams_charge',
  name: "Ram's Charge",
  rarity: 'uncommon',
  type: 'bond',
  color: 'black',
  slot: 'head',
  statGrants: [{ stat: 'power', min: 10, max: 14 }],
  speciesTags: ['beast'],
  bodyMutation: 'curled_horns',
  keyword: {
    trigger: { on: 'bout_start' },
    apply: [{ op: 'custom', description: 'Charge: deals bonus damage on the opening action of a Bout.' }],
  },
};

export const obsidianClaw: BondCard = {
  id: 'bond.obsidian_claw',
  name: 'Obsidian Claw',
  rarity: 'rare',
  type: 'bond',
  color: 'black',
  slot: 'hands',
  statGrants: [{ stat: 'power', min: 17, max: 23 }],
  speciesTags: ['beast'],
  bodyMutation: 'obsidian_claws',
  keyword: {
    trigger: { on: 'on_hit', as: 'attacker' },
    apply: [
      { op: 'custom', description: 'Rend: ignores half of Unshakeable/shield-type Trait protections.' },
    ],
  },
};

export const sacrificialOffering: TechniqueCard = {
  id: 'technique.sacrificial_offering',
  name: 'Sacrificial Offering',
  rarity: 'rare',
  type: 'technique',
  color: 'black',
  energyCost: 2,
  scope: 'bout',
  exileOnUse: false,
  effect: {
    trigger: { on: 'manual' },
    apply: [
      {
        op: 'custom',
        description:
          'Sacrifice 10 Stamina: deal Power-equal bonus damage this round, ignoring Evasion.',
      },
    ],
  },
};

export const bonebreakerInstinct: TraitCard = {
  id: 'trait.bonebreaker_instinct',
  name: 'Bonebreaker Instinct',
  rarity: 'rare',
  type: 'trait',
  color: 'black',
  effect: {
    trigger: { on: 'on_hit', as: 'attacker' },
    apply: [
      {
        op: 'custom',
        description: "This Chao's knockback also reduces the defender's Run for the rest of the round.",
      },
    ],
  },
};

export const warlordsFang: BondCard = {
  id: 'bond.warlords_fang',
  name: "Warlord's Fang",
  rarity: 'legendary',
  type: 'bond',
  color: 'black',
  slot: 'hands',
  statGrants: [{ stat: 'power', min: 26, max: 34 }],
  speciesTags: ['beast'],
  bodyMutation: 'dark_fang_plating',
  keyword: {
    trigger: { on: 'on_hit', as: 'attacker' },
    apply: [
      {
        op: 'custom',
        description:
          'Executioner: instantly wins the Bout if this hit would bring the defender below 10% Stamina.',
      },
    ],
  },
};

export const totalEclipse: TechniqueCard = {
  id: 'technique.total_eclipse',
  name: 'Total Eclipse',
  rarity: 'legendary',
  type: 'technique',
  color: 'black',
  energyCost: 3,
  scope: 'bout',
  exileOnUse: true,
  effect: {
    trigger: { on: 'round_start' },
    apply: [
      { op: 'custom', description: "This Bout: all of this Chao's actions this round ignore Evasion and Swim both." },
    ],
  },
};

export const blackCards = [
  snappingTurtle,
  ironHideBoar,
  stagBeetlePincer,
  crushblowTonic,
  grindingStone,
  heavyStrike,
  warthogTusks,
  bloodrockIdol,
  ramsCharge,
  obsidianClaw,
  sacrificialOffering,
  bonebreakerInstinct,
  warlordsFang,
  totalEclipse,
];
