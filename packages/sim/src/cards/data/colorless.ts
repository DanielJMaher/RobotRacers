import type { ItemCard } from '../../types';

// "Core Garden" example set — colorless Item cards.
// Source: docs/01-design/card-set-list.md

export const luckyBell: ItemCard = {
  id: 'item.lucky_bell',
  name: 'Lucky Bell',
  rarity: 'common',
  type: 'item',
  color: 'colorless',
  effect: { stat: 'luck', amount: 1 },
};

export const trainingWeights: ItemCard = {
  id: 'item.training_weights',
  name: 'Training Weights',
  rarity: 'common',
  type: 'item',
  color: 'colorless',
  effect: {
    trigger: { on: 'manual' },
    apply: [
      {
        op: 'custom',
        description: "+2 to this Generation's next Bond Card's stat roll (consumed on next bond).",
      },
    ],
  },
};

export const tinyMirror: ItemCard = {
  id: 'item.tiny_mirror',
  name: 'Tiny Mirror',
  rarity: 'uncommon',
  type: 'item',
  color: 'colorless',
  effect: {
    trigger: { on: 'manual' },
    apply: [
      {
        op: 'custom',
        description:
          "Copy this Chao's highest stat's color as a second, minor color for splash-tax purposes only.",
      },
    ],
  },
};

export const chaosFragment: ItemCard = {
  id: 'item.chaos_fragment',
  name: 'Chaos Fragment',
  rarity: 'rare',
  type: 'item',
  color: 'colorless',
  effect: {
    trigger: { on: 'manual' },
    apply: [
      { op: 'modifyStat', stat: 'swim', amount: 1 },
      { op: 'modifyStat', stat: 'fly', amount: 1 },
      { op: 'modifyStat', stat: 'run', amount: 1 },
      { op: 'modifyStat', stat: 'power', amount: 1 },
      { op: 'modifyStat', stat: 'stamina', amount: 1 },
    ],
  },
};

export const chaoWhistle: ItemCard = {
  id: 'item.chao_whistle',
  name: 'Chao Whistle',
  rarity: 'common',
  type: 'item',
  color: 'colorless',
  effect: {
    // Energy isn't tracked as persisted Chao/game state (it's a per-event
    // loadout-UI concept today — architecture.md §6.3/§5.2 note the resolver
    // deliberately doesn't enforce or track an Energy budget itself), so
    // there's no StaticModifier target for "+1 Energy" yet.
    trigger: { on: 'manual' },
    apply: [{ op: 'custom', description: '+1 Energy for this Chao\'s next Race or Bout only.' }],
  },
};

export const emblemOfPassage: ItemCard = {
  id: 'item.emblem_of_passage',
  name: 'Emblem of Passage',
  rarity: 'uncommon',
  type: 'item',
  color: 'colorless',
  effect: {
    // Splash tax is computed at bonding time by computeSplashTax
    // (chao/bonding.ts), not as a Race/Bout trigger — this card's real home
    // is a future bonding-engine integration, not the event resolvers.
    trigger: { on: 'manual' },
    apply: [{ op: 'custom', description: 'This Chao ignores splash tax once per Garden phase.' }],
  },
};

export const oldBellCollar: ItemCard = {
  id: 'item.old_bell_collar',
  name: 'Old Bell Collar',
  rarity: 'uncommon',
  type: 'item',
  color: 'colorless',
  effect: {
    // grantFruit's amount is a flat number, not a percentage-of-winnings,
    // and there's no single trigger spanning both Race and Bout "wins" —
    // leg_won is the closest race-side approximation; Bout-win scaling
    // isn't modeled by any checkpoint yet.
    trigger: { on: 'leg_won' },
    apply: [
      { op: 'custom', description: '+5% Fruit from every win this Chao contributes to (Race legs and Bouts).' },
    ],
  },
};

export const twinSoulCharm: ItemCard = {
  id: 'item.twin_soul_charm',
  name: 'Twin Soul Charm',
  rarity: 'rare',
  type: 'item',
  color: 'colorless',
  effect: {
    // Species Tag breakpoints are a Phase 3 (autochess board) mechanic —
    // roadmap.md. No board/synergy code exists yet for this to hook into.
    trigger: { on: 'manual' },
    apply: [
      {
        op: 'custom',
        description:
          'The next Bond Card fused on this Chao counts double toward Species Tag breakpoints. Requires Phase 3.',
      },
    ],
  },
};

export const secondChanceEgg: ItemCard = {
  id: 'item.second_chance_egg',
  name: 'Second Chance Egg',
  rarity: 'legendary',
  type: 'item',
  color: 'colorless',
  effect: {
    // Cocoon/happiness-threshold/reincarnation logic is Phase 2 (run
    // structure) — roadmap.md. No Generation state machine exists yet.
    trigger: { on: 'manual' },
    apply: [
      {
        op: 'custom',
        description:
          'Once per Generation, if this Chao would fail the happiness threshold at cocoon time, treat it as passed. Requires Phase 2.',
      },
    ],
  },
};

export const foundersMedallion: ItemCard = {
  id: 'item.founders_medallion',
  name: "Founder's Medallion",
  rarity: 'legendary',
  type: 'item',
  color: 'colorless',
  effect: {
    // Same Phase 2 dependency as Second Chance Egg — reincarnation's 10%
    // stat carryover (GDD §7.5) doesn't exist as code yet.
    trigger: { on: 'manual' },
    apply: [
      {
        op: 'custom',
        description:
          "This Chao's reincarnation stat carryover (normally 10%) becomes 20%. Requires Phase 2.",
      },
    ],
  },
};

export const colorlessCards = [
  luckyBell,
  trainingWeights,
  chaoWhistle,
  tinyMirror,
  emblemOfPassage,
  oldBellCollar,
  chaosFragment,
  twinSoulCharm,
  secondChanceEgg,
  foundersMedallion,
];
