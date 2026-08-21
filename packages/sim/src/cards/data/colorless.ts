import type { ItemCard } from '../../types';

// "Core Garden" example set — colorless Item cards.
// Source: docs/01-design/card-set-list.md
//
// Rewritten 2026-08-21 (roadmap.md Phase 5.9), per the user's direct
// complaint: "items need to have a purpose, currently they do ntohhing."
// The original 10 cards were largely authored against pre-pivot systems
// that got cut entirely before any of this shipped — cocoon/reincarnation/
// happiness-threshold (the old run-map design) and Species Tag breakpoints
// (the old autochess board) — leaving 8 of 10 as `custom` ops with an
// explicit "Requires Phase 2/Phase 3" comment admitting they had no home to
// hook into. These keep the same 10 names/rarities/flavor identities (no
// reason to throw away good names) but every effect below is built only
// from EffectOps/triggers events/race.ts actually consumes as of this
// rewrite — see events/shared.ts's collectTriggerables (now reads
// chao.items) and chao/bonding.ts's equipItem/unequipItem for how these
// reach a Chao at all.

export const luckyBell: ItemCard = {
  id: 'item.lucky_bell',
  name: 'Lucky Bell',
  rarity: 'common',
  type: 'item',
  color: 'colorless',
  flavorText: 'A tiny bell, worn smooth by curious hands. It never quite stops ringing.',
  effect: { stat: 'luck', amount: 1 }, // unchanged — this one already worked
};

export const trainingWeights: ItemCard = {
  id: 'item.training_weights',
  name: 'Training Weights',
  rarity: 'common',
  type: 'item',
  color: 'colorless',
  flavorText: "Heavier than it looks. Chao grumble, then get stronger anyway.",
  // Was a `custom` "boost the next Bond Card's roll" text effect with no
  // resolver hook. Reframed as a real passive: a small, permanent Power
  // bump for wearing it at all — simple, common-rarity, on-theme.
  effect: { stat: 'power', amount: 2 },
};

export const chaoWhistle: ItemCard = {
  id: 'item.chao_whistle',
  name: 'Chao Whistle',
  rarity: 'common',
  type: 'item',
  color: 'colorless',
  flavorText: 'One sharp note, and tired legs remember how to move.',
  // Was "+1 Energy for the next event" — Energy isn't tracked as persisted
  // state (architecture.md §5.2/§6.3), so there was nothing to add 1 to.
  // Reframed as a real Race-time pick-me-up. NOT triggered at race_start:
  // resolveRace already resets currentStamina to full right before that
  // checkpoint fires (events/shared.ts's resetCurrentStamina), so a
  // restoreStamina there would always be wasted — stamina_below is the
  // checkpoint that's actually meaningful for a "second wind" effect.
  effect: {
    trigger: { on: 'stamina_below', fraction: 0.6 },
    apply: [{ op: 'restoreStamina', amount: 4 }],
    onceLimit: 'per_race',
  },
};

export const tinyMirror: ItemCard = {
  id: 'item.tiny_mirror',
  name: 'Tiny Mirror',
  rarity: 'uncommon',
  type: 'item',
  color: 'colorless',
  flavorText: 'It shows the Chao a braver reflection than the one that walked up to it.',
  // Was "copy your highest stat's color as a splash-tax color" — no
  // bonding-time hook reads an equipped Item at all. Reframed as a
  // Race-time confidence boost: once Stamina drops under half, the Chao
  // finds a second wind.
  effect: {
    trigger: { on: 'stamina_below', fraction: 0.5 },
    apply: [{ op: 'restoreStamina', amount: 6 }],
    onceLimit: 'per_race',
  },
};

export const emblemOfPassage: ItemCard = {
  id: 'item.emblem_of_passage',
  name: 'Emblem of Passage',
  rarity: 'uncommon',
  type: 'item',
  color: 'colorless',
  flavorText: 'Stamped by no one in particular. Doors open anyway.',
  // Was "ignore splash tax once per Garden phase" — splash tax is computed
  // at bonding time (chao/bonding.ts's computeSplashTax), not a Race
  // trigger, so an equipped Item (only visible to the trigger system) could
  // never have reached it. Reframed as a literal "find your way through" —
  // an alternate route on Climb Legs via Power instead of Climb, matching
  // the "Emblem lets you pass where others can't" flavor almost exactly.
  effect: {
    trigger: { on: 'leg_start', legType: 'climb' },
    apply: [{ op: 'grantAlternateRoute', legType: 'climb', altStat: 'power', description: 'Muscles through instead of scaling.' }],
  },
};

export const oldBellCollar: ItemCard = {
  id: 'item.old_bell_collar',
  name: 'Old Bell Collar',
  rarity: 'uncommon',
  type: 'item',
  color: 'colorless',
  flavorText: "Belonged to somebody's champion, once. It still sounds like a win.",
  // Was "+5% Fruit from every win" — grantFruit takes a flat amount, not a
  // percentage, and there was no live checkpoint to scale off of anyway.
  // Reframed as a flat Fruit trickle on every cleared Leg — modest, but
  // adds up over a full course, and now actually lands in the Environment
  // (applyFruitEvents, tournament/environment.ts).
  effect: {
    trigger: { on: 'leg_won' },
    apply: [{ op: 'grantFruit', amount: 1 }],
  },
};

export const chaosFragment: ItemCard = {
  id: 'item.chaos_fragment',
  name: 'Chaos Fragment',
  rarity: 'rare',
  type: 'item',
  color: 'colorless',
  flavorText: 'A shard of something that used to be one shape and is now unconvinced of that.',
  // Unchanged — this one already worked as a flat all-around passive boost.
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

export const twinSoulCharm: ItemCard = {
  id: 'item.twin_soul_charm',
  name: 'Twin Soul Charm',
  rarity: 'rare',
  type: 'item',
  color: 'colorless',
  flavorText: 'Two halves of the same idea, worn together so neither one forgets the other.',
  // Was "next Bond Card counts double toward Species Tag breakpoints" — a
  // Phase 3 autochess-board mechanic that never got built (roadmap.md never
  // resurrected it; the Tournament is single-Chao, not a multi-unit board).
  // Reframed as a genuine risk/reward once-per-race swing: a strong
  // Stamina refill the moment things get dicey.
  effect: {
    trigger: { on: 'stamina_below', fraction: 0.3 },
    apply: [{ op: 'restoreStamina', amount: 12 }],
    onceLimit: 'per_race',
  },
};

export const secondChanceEgg: ItemCard = {
  id: 'item.second_chance_egg',
  name: 'Second Chance Egg',
  rarity: 'legendary',
  type: 'item',
  color: 'colorless',
  flavorText: "It hasn't hatched yet. Somehow that's exactly the point.",
  // Was "treat a failed happiness threshold as passed at cocoon time" — the
  // whole cocoon/reincarnation state machine (Phase 2's run structure) was
  // cut before this ever had anything to hook into. Originally reframed
  // around autoResolveDNF ("survive a Race you'd otherwise DNF"); DNF
  // itself was removed 2026-08-21, so this is now a legendary-tier
  // last-resort recovery instead — the biggest of the stamina_below Items.
  effect: {
    trigger: { on: 'stamina_below', fraction: 0.1 },
    apply: [{ op: 'restoreStamina', amount: 20 }],
    onceLimit: 'per_race',
  },
};

export const foundersMedallion: ItemCard = {
  id: 'item.founders_medallion',
  name: "Founder's Medallion",
  rarity: 'legendary',
  type: 'item',
  color: 'colorless',
  flavorText: 'Every Chao that ever wore this one finished what it started.',
  // Was "reincarnation stat carryover 10% -> 20%" — same Phase 2 dependency
  // as Second Chance Egg, same non-existent hook. Reframed as a strong,
  // permanent all-around passive befitting a legendary heirloom — the
  // "founder" that steadies everything a little, always active, no trigger
  // needed at all.
  effect: { stat: 'stamina', amount: 6 },
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
