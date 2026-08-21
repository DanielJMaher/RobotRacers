import type { BondCard, TechniqueCard, TraitCard } from '../../types';

// "Core Garden" example set — Black (Power) cards.
// Source: docs/01-design/card-set-list.md
//
// Same convention as green.ts/red.ts: `custom` EffectOps mark keyword text
// that doesn't map to an existing typed op yet — the Race resolver fires and
// logs these, with no mechanical effect, until a future pass gives them
// real semantics.
//
// Migrated 2026-08-20 (roadmap.md Phase 2.5) to the corrected Bond Card
// model: `slot` -> per-grant `region` (hands->arms here), `bodyMutation:
// string` -> `bodyMutations: {region: string}`. Mechanical schema migration
// only — see green.ts's header note for the full rationale.
//
// Potion cards (Crushblow Tonic, Grinding Stone, Quarry Grip Tonic) moved
// out to cards/data/potions.ts 2026-08-20 (roadmap.md Phase 5.5) — see that
// file's own header note.

export const snappingTurtle: BondCard = {
  id: 'bond.snapping_turtle',
  name: 'Snapping Turtle',
  rarity: 'common',
  type: 'bond',
  color: 'black',
  statGrants: [{ stat: 'power', min: 7, max: 11, region: 'arms' }],
  speciesTags: ['reptile'],
  bodyMutations: { arms: 'heavy_jaw' },
};

export const ironHideBoar: BondCard = {
  id: 'bond.iron_hide_boar',
  name: 'Iron-Hide Boar',
  rarity: 'common',
  type: 'bond',
  color: 'black',
  statGrants: [{ stat: 'power', min: 8, max: 12, region: 'arms' }],
  speciesTags: ['beast'],
  bodyMutations: { arms: 'iron_hide' },
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
  statGrants: [
    { stat: 'power', min: 6, max: 10, region: 'arms' },
    { stat: 'stamina', min: 2, max: 4, region: 'arms' },
  ],
  speciesTags: ['insect'],
  bodyMutations: { arms: 'mandibles' },
};

export const heavyStrike: TechniqueCard = {
  id: 'technique.heavy_strike',
  name: 'Heavy Strike',
  rarity: 'uncommon',
  type: 'technique',
  color: 'black',
  energyCost: 1,
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
  statGrants: [{ stat: 'power', min: 13, max: 18, region: 'arms' }],
  speciesTags: ['beast'],
  bodyMutations: { arms: 'tusks' },
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
  statGrants: [{ stat: 'power', min: 10, max: 14, region: 'head' }],
  speciesTags: ['beast'],
  bodyMutations: { head: 'curled_horns' },
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
  statGrants: [{ stat: 'power', min: 17, max: 23, region: 'arms' }],
  speciesTags: ['beast'],
  bodyMutations: { arms: 'obsidian_claws' },
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
  statGrants: [{ stat: 'power', min: 26, max: 34, region: 'arms' }],
  speciesTags: ['beast'],
  bodyMutations: { arms: 'dark_fang_plating' },
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
  exileOnUse: true,
  effect: {
    trigger: { on: 'round_start' },
    apply: [
      { op: 'custom', description: "This Bout: all of this Chao's actions this round ignore Evasion and Swim both." },
    ],
  },
};

// Climb cards, added 2026-08-20 (roadmap.md Phase 2) — Climb is a genuinely
// new, dedicated Stat (GDD §3.1), proposed to live in Black as a secondary
// stat lane alongside Power (GDD §3.2), same as some Bond Cards already
// grant a primary + minor stat pair.

export const boulderRam: BondCard = {
  id: 'bond.boulder_ram',
  name: 'Boulder Ram',
  rarity: 'common',
  type: 'bond',
  color: 'black',
  statGrants: [
    { stat: 'power', min: 6, max: 9, region: 'arms' },
    { stat: 'climb', min: 4, max: 7, region: 'arms' },
  ],
  speciesTags: ['beast'],
  bodyMutations: { arms: 'reinforced_shoulders' },
};

export const sheerFaceCrawler: BondCard = {
  id: 'bond.sheer_face_crawler',
  name: 'Sheer Face Crawler',
  rarity: 'uncommon',
  type: 'bond',
  color: 'black',
  statGrants: [{ stat: 'climb', min: 10, max: 15, region: 'arms' }],
  speciesTags: ['insect'],
  bodyMutations: { arms: 'gripping_claws' },
  keyword: {
    // Direct match: autoWinLeg gated to Climb legs, same pattern as
    // dustdashLizard's Bolt (red.ts) and otterPaddle's Current Rider (white.ts).
    trigger: { on: 'leg_start', legType: 'climb' },
    apply: [{ op: 'autoWinLeg' }],
    onceLimit: 'per_race',
  },
};

export const blackCards = [
  snappingTurtle,
  ironHideBoar,
  stagBeetlePincer,
  heavyStrike,
  warthogTusks,
  bloodrockIdol,
  ramsCharge,
  obsidianClaw,
  sacrificialOffering,
  bonebreakerInstinct,
  warlordsFang,
  totalEclipse,
  boulderRam,
  sheerFaceCrawler,
];
