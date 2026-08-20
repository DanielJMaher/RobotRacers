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

export const colorlessCards = [luckyBell, trainingWeights, tinyMirror, chaosFragment];
