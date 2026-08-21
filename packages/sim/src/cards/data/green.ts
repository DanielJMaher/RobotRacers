import type { BondCard, TechniqueCard, TraitCard } from '../../types';

// "Core Garden" example set — Green (Stamina) cards.
// Source: docs/01-design/card-set-list.md
//
// Migrated 2026-08-20 (roadmap.md Phase 2.5) to the corrected Bond Card
// model: `slot` -> per-grant `region` (feet->legs, hands->arms, head/back
// unchanged), `bodyMutation: string` -> `bodyMutations: {region: string}`.
// This is a mechanical schema migration, not a content redesign — these
// cards still grant only positive stats from a single region each. Giving
// them the full multi-region mixed-sign "Penguin" treatment is a tracked
// content follow-up (roadmap.md), not done here.
//
// Potion cards (Deeproot Fruit, Sunlit Berries, Heartroot) moved out to
// cards/data/potions.ts 2026-08-20 (roadmap.md Phase 5.5) — see that file's
// own header note.

export const packleafTortoise: BondCard = {
  id: 'bond.packleaf_tortoise',
  name: 'Packleaf Tortoise',
  rarity: 'common',
  type: 'bond',
  color: 'green',
  statGrants: [{ stat: 'stamina', min: 8, max: 12, region: 'legs' }],
  speciesTags: ['reptile'],
  bodyMutations: { legs: 'shell' },
};

export const brambleHare: BondCard = {
  id: 'bond.bramble_hare',
  name: 'Bramble Hare',
  rarity: 'common',
  type: 'bond',
  color: 'green',
  statGrants: [
    { stat: 'stamina', min: 6, max: 10, region: 'legs' },
    { stat: 'run', min: 2, max: 4, region: 'legs' },
  ],
  speciesTags: ['rabbit'],
  bodyMutations: { legs: 'long_ears' },
};

export const meadowFawn: BondCard = {
  id: 'bond.meadow_fawn',
  name: 'Meadow Fawn',
  rarity: 'common',
  type: 'bond',
  color: 'green',
  statGrants: [{ stat: 'stamina', min: 7, max: 11, region: 'back' }],
  speciesTags: ['beast'],
  bodyMutations: { back: 'fawn_spots' },
  keyword: {
    // "Graze — regen 1 Stamina between legs" (card-set-list.md): restores
    // the in-race HP pool, not a permanent stat increase — see the
    // restoreStamina EffectOp doc comment in types.ts.
    trigger: { on: 'leg_start' },
    apply: [{ op: 'restoreStamina', amount: 1 }],
  },
};

export const secondWind: TechniqueCard = {
  id: 'technique.second_wind',
  name: 'Second Wind',
  rarity: 'uncommon',
  type: 'technique',
  color: 'green',
  energyCost: 1,
  exileOnUse: false,
  effect: {
    trigger: { on: 'manual' },
    apply: [{ op: 'autoResolveDNF', result: 'safe' }],
    onceLimit: 'per_race',
  },
};

export const oldGrowth: BondCard = {
  id: 'bond.old_growth',
  name: 'Old Growth',
  rarity: 'uncommon',
  type: 'bond',
  color: 'green',
  statGrants: [{ stat: 'stamina', min: 14, max: 20, region: 'back' }],
  speciesTags: ['beast'],
  bodyMutations: { back: 'bark_patches' },
  keyword: {
    trigger: { on: 'manual' },
    apply: [
      {
        op: 'custom',
        description: 'Rooted: +50% effect from all future Green Potion cards used on this Chao.',
      },
    ],
  },
};

export const tortoiseshellWard: TraitCard = {
  id: 'trait.tortoiseshell_ward',
  name: 'Tortoiseshell Ward',
  rarity: 'uncommon',
  type: 'trait',
  color: 'green',
  effect: {
    trigger: { on: 'manual' },
    apply: [{ op: 'autoResolveDNF', result: 'safe' }],
    onceLimit: 'per_generation',
  },
};

export const hollowLogDen: BondCard = {
  id: 'bond.hollow_log_den',
  name: 'Hollow Log Den',
  rarity: 'uncommon',
  type: 'bond',
  color: 'green',
  statGrants: [
    { stat: 'stamina', min: 12, max: 16, region: 'back' },
    { stat: 'swim', min: 4, max: 6, region: 'back' },
  ],
  speciesTags: ['reptile', 'beast'],
  bodyMutations: { back: 'mossy_shell_plates' },
};

export const evergreenWarden: BondCard = {
  id: 'bond.evergreen_warden',
  name: 'Evergreen Warden',
  rarity: 'rare',
  type: 'bond',
  color: 'green',
  statGrants: [{ stat: 'stamina', min: 18, max: 24, region: 'legs' }],
  speciesTags: ['beast'],
  bodyMutations: { legs: 'root_boots' },
  keyword: {
    trigger: { on: 'bout_start' },
    apply: [
      {
        op: 'custom',
        description:
          'Unshakeable: immune to the first negative Technique played against this Chao each Bout.',
      },
    ],
    onceLimit: 'per_bout',
  },
};

export const ancientGroveBlessing: TraitCard = {
  id: 'trait.ancient_grove_blessing',
  name: 'Ancient Grove Blessing',
  rarity: 'rare',
  type: 'trait',
  color: 'green',
  effect: {
    trigger: { on: 'bout_start' },
    apply: [
      {
        op: 'custom',
        description:
          "This Chao's Stamina stat is also used as a second defense check in Karate Bouts (averaged with Swim).",
      },
    ],
  },
};

export const thousandYearChaoOak: BondCard = {
  id: 'bond.thousand_year_chao_oak',
  name: 'Thousand-Year Chao-Oak',
  rarity: 'legendary',
  type: 'bond',
  color: 'green',
  statGrants: [{ stat: 'stamina', min: 28, max: 36, region: 'back' }],
  speciesTags: ['beast', 'reptile'],
  bodyMutations: { back: 'bark_plating_canopy' },
  keyword: {
    trigger: { on: 'manual' },
    apply: [
      {
        op: 'custom',
        description: 'Evergreen: this Bond Card cannot be overwritten by future bonding (permanent slot lock).',
      },
    ],
  },
};

export const bountifulHarvest: TechniqueCard = {
  id: 'technique.bountiful_harvest',
  name: 'Bountiful Harvest',
  rarity: 'legendary',
  type: 'technique',
  color: 'green',
  energyCost: 2,
  exileOnUse: true,
  // card-set-list.md's flavor text says "for every Leg this Chao completes,
  // win or lose" — the TriggerCondition vocabulary only has leg_won, not a
  // neutral "leg attempted", so this fires on wins only. A minor
  // simplification of the original flavor text rather than a full
  // trigger-vocabulary expansion for one card.
  effect: {
    trigger: { on: 'leg_won' },
    apply: [{ op: 'grantFruit', amount: 1 }],
  },
};

export const greenCards = [
  packleafTortoise,
  brambleHare,
  meadowFawn,
  secondWind,
  oldGrowth,
  tortoiseshellWard,
  hollowLogDen,
  evergreenWarden,
  ancientGroveBlessing,
  thousandYearChaoOak,
  bountifulHarvest,
];
