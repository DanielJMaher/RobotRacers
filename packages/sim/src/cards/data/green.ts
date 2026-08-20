import type { BondCard, RegimenCard, TechniqueCard, TraitCard } from '../../types';

// "Core Garden" example set — Green (Stamina) cards.
// Source: docs/01-design/card-set-list.md

export const packleafTortoise: BondCard = {
  id: 'bond.packleaf_tortoise',
  name: 'Packleaf Tortoise',
  rarity: 'common',
  type: 'bond',
  color: 'green',
  slot: 'feet',
  statGrants: [{ stat: 'stamina', min: 8, max: 12 }],
  speciesTags: ['reptile'],
  bodyMutation: 'shell',
};

export const brambleHare: BondCard = {
  id: 'bond.bramble_hare',
  name: 'Bramble Hare',
  rarity: 'common',
  type: 'bond',
  color: 'green',
  slot: 'feet',
  statGrants: [
    { stat: 'stamina', min: 6, max: 10 },
    { stat: 'run', min: 2, max: 4 },
  ],
  speciesTags: ['rabbit'],
  bodyMutation: 'long_ears',
};

export const meadowFawn: BondCard = {
  id: 'bond.meadow_fawn',
  name: 'Meadow Fawn',
  rarity: 'common',
  type: 'bond',
  color: 'green',
  slot: 'back',
  statGrants: [{ stat: 'stamina', min: 7, max: 11 }],
  speciesTags: ['beast'],
  bodyMutation: 'fawn_spots',
  keyword: {
    trigger: { on: 'leg_start' },
    apply: [{ op: 'modifyStat', stat: 'stamina', amount: 1 }],
  },
};

export const deeprootFruit: RegimenCard = {
  id: 'regimen.deeproot_fruit',
  name: 'Deeproot Fruit',
  rarity: 'common',
  type: 'regimen',
  color: 'green',
  statGrants: [{ stat: 'stamina', min: 10, max: 14 }],
};

export const sunlitBerries: RegimenCard = {
  id: 'regimen.sunlit_berries',
  name: 'Sunlit Berries',
  rarity: 'common',
  type: 'regimen',
  color: 'green',
  statGrants: [
    { stat: 'stamina', min: 4, max: 6 },
    { stat: 'mind', min: 1, max: 1 },
  ],
};

export const secondWind: TechniqueCard = {
  id: 'technique.second_wind',
  name: 'Second Wind',
  rarity: 'uncommon',
  type: 'technique',
  color: 'green',
  energyCost: 1,
  scope: 'race',
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
  slot: 'back',
  statGrants: [{ stat: 'stamina', min: 14, max: 20 }],
  speciesTags: ['beast'],
  bodyMutation: 'bark_patches',
  keyword: {
    trigger: { on: 'manual' },
    apply: [
      {
        op: 'custom',
        description: 'Rooted: +50% effect from all future Green Regimen cards bonded to this Chao.',
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
  slot: 'back',
  statGrants: [
    { stat: 'stamina', min: 12, max: 16 },
    { stat: 'swim', min: 4, max: 6 },
  ],
  speciesTags: ['reptile', 'beast'],
  bodyMutation: 'mossy_shell_plates',
};

export const evergreenWarden: BondCard = {
  id: 'bond.evergreen_warden',
  name: 'Evergreen Warden',
  rarity: 'rare',
  type: 'bond',
  color: 'green',
  slot: 'feet',
  statGrants: [{ stat: 'stamina', min: 18, max: 24 }],
  speciesTags: ['beast'],
  bodyMutation: 'root_boots',
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

export const heartroot: RegimenCard = {
  id: 'regimen.heartroot',
  name: 'Heartroot',
  rarity: 'rare',
  type: 'regimen',
  color: 'green',
  statGrants: [{ stat: 'stamina', min: 20, max: 28 }],
};

export const thousandYearChaoOak: BondCard = {
  id: 'bond.thousand_year_chao_oak',
  name: 'Thousand-Year Chao-Oak',
  rarity: 'legendary',
  type: 'bond',
  color: 'green',
  slot: 'back',
  statGrants: [{ stat: 'stamina', min: 28, max: 36 }],
  speciesTags: ['beast', 'reptile'],
  bodyMutation: 'bark_plating_canopy',
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
  scope: 'race',
  exileOnUse: true,
  effect: {
    trigger: { on: 'leg_won' },
    apply: [{ op: 'grantFruit', amount: 1 }],
  },
};

export const greenCards = [
  packleafTortoise,
  brambleHare,
  meadowFawn,
  deeprootFruit,
  sunlitBerries,
  secondWind,
  oldGrowth,
  tortoiseshellWard,
  hollowLogDen,
  evergreenWarden,
  ancientGroveBlessing,
  heartroot,
  thousandYearChaoOak,
  bountifulHarvest,
];
