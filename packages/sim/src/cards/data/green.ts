import type { BondCard, TechniqueCard, TraitCard } from '../../types';

// "Core Garden" example set — Green (Stamina) cards.
// Source: docs/01-design/card-set-list.md
//
// Migrated 2026-08-20 (roadmap.md Phase 2.5) to the corrected Bond Card
// model: `slot` -> per-grant `region` (feet->legs, hands->arms, head/back
// unchanged), `bodyMutation: string` -> `bodyMutations: {region: string}`.
// This is a mechanical schema migration, not a content redesign — these
// cards still grant only positive stats from a single region each. Giving
// them the full multi-region mixed-sign "Penguin" treatment, and re-tuning
// stat numbers against GDD §3.2's tiered color matrix, stays tracked as
// separate future content work (roadmap.md Phase 6, alongside the
// 21→50-creature expansion) — not attempted in this pass.
//
// Rewritten 2026-08-21 (roadmap.md Phase 5.9), per the user's direct
// request ("recreate all the cards... a little more flair... traits need
// hooked into races"): every keyword/effect below now uses only currently-
// live triggers/ops (events/race.ts), and every card got a flavorText line.
// Previously-dead Bout-only keywords (bout_start, on_hit, custom-with-no-
// resolver) were reflavored to real Race-time mechanics rather than left
// dormant — see each card's own inline note for what changed and why.
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
  flavorText: 'Slow enough to count every leaf on the way past. Never in a hurry to lose.',
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
  flavorText: 'Darts through thorn and root without slowing down for either.',
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
  flavorText: "Catches its breath between every stride, like the meadow itself is exhaling with it.",
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
  flavorText: 'When the legs give out, the will carries the rest of the way.',
  energyCost: 1,
  exileOnUse: false,
  // Was autoResolveDNF ("never DNF") — removed 2026-08-21 along with DNF
  // itself (per the user's direct request: "we are not looking for DNFs").
  // Reflavored to what "Second Wind" describes literally: a real recovery
  // burst right when things get dire.
  effect: {
    trigger: { on: 'stamina_below', fraction: 0.25 },
    apply: [{ op: 'restoreStamina', amount: 12 }],
    onceLimit: 'per_race',
  },
};

export const oldGrowth: BondCard = {
  id: 'bond.old_growth',
  name: 'Old Growth',
  rarity: 'uncommon',
  type: 'bond',
  color: 'green',
  flavorText: 'Its roots run deeper than the soil — deep reserves, waiting to be tapped.',
  statGrants: [{ stat: 'stamina', min: 14, max: 20, region: 'back' }],
  speciesTags: ['beast'],
  bodyMutations: { back: 'bark_patches' },
  keyword: {
    // Was "Rooted: +50% effect from future Green Potions" — a `custom` op
    // with no resolver hook (bonding-time scaling isn't something a Race
    // trigger can reach). Reflavored to a real, permanent Stamina boost
    // loaded before every Race, same 'manual' convention as Second Wind/
    // Tortoiseshell Ward. NOTE: not restoreStamina — 'manual' fires right
    // after resolveRace already resets currentStamina to full (see
    // events/shared.ts's resetCurrentStamina), so a Stamina *restore* at
    // this exact checkpoint would always be a no-op. modifyStat raises the
    // base stat instead, which is never wasted.
    trigger: { on: 'manual' },
    apply: [{ op: 'modifyStat', stat: 'stamina', amount: 3 }],
  },
};

export const tortoiseshellWard: TraitCard = {
  id: 'trait.tortoiseshell_ward',
  name: 'Tortoiseshell Ward',
  rarity: 'uncommon',
  type: 'trait',
  color: 'green',
  flavorText: 'A shell thick enough that the Race itself cannot stop it.',
  // Was autoResolveDNF ("never DNF") — removed 2026-08-21 along with DNF
  // itself. Reflavored to the same "cannot be stopped" spirit via a strong,
  // last-resort Stamina recovery instead of a status immunity.
  effect: {
    trigger: { on: 'stamina_below', fraction: 0.2 },
    apply: [{ op: 'restoreStamina', amount: 8 }],
    onceLimit: 'per_generation',
  },
};

export const hollowLogDen: BondCard = {
  id: 'bond.hollow_log_den',
  name: 'Hollow Log Den',
  rarity: 'uncommon',
  type: 'bond',
  color: 'green',
  flavorText: 'A damp, mossy hideaway — equal parts den and diving board.',
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
  flavorText: 'Ancient bark for skin. It has weathered worse than a bad Leg.',
  statGrants: [{ stat: 'stamina', min: 18, max: 24, region: 'legs' }],
  speciesTags: ['beast'],
  bodyMutations: { legs: 'root_boots' },
  keyword: {
    // Was "Unshakeable: immune to the first negative Technique each Bout" —
    // dead since Karate Bout was removed. Reflavored to a real Race-time
    // safety net: when Stamina runs dangerously low, its roots anchor it
    // and it recovers a real chunk — still "unshakeable" in spirit.
    trigger: { on: 'stamina_below', fraction: 0.25 },
    apply: [{ op: 'restoreStamina', amount: 10 }],
    onceLimit: 'per_race',
  },
};

export const ancientGroveBlessing: TraitCard = {
  id: 'trait.ancient_grove_blessing',
  name: 'Ancient Grove Blessing',
  rarity: 'rare',
  type: 'trait',
  color: 'green',
  flavorText: 'Blessed by something older than the course it runs.',
  effect: {
    // Was "Stamina also used as a second defense check in Karate Bouts" —
    // dead since Bout was removed. Reflavored to a real, permanent Race-
    // start Stamina blessing — the grove's gift grows a little sturdier
    // with every Race this Chao runs.
    trigger: { on: 'race_start' },
    apply: [{ op: 'modifyStat', stat: 'stamina', amount: 5 }],
  },
};

export const thousandYearChaoOak: BondCard = {
  id: 'bond.thousand_year_chao_oak',
  name: 'Thousand-Year Chao-Oak',
  rarity: 'legendary',
  type: 'bond',
  color: 'green',
  flavorText: 'It was already old when the first Tournament was run.',
  statGrants: [{ stat: 'stamina', min: 28, max: 36, region: 'back' }],
  speciesTags: ['beast', 'reptile'],
  bodyMutations: { back: 'bark_plating_canopy' },
  keyword: {
    // Was "Evergreen: cannot be overwritten by future bonding" — moot now
    // that bonding is cumulative and never overwrites anyone (GDD §3.5,
    // corrected 2026-08-20 — true for every card, not just this one).
    // Reflavored to match its legendary weight: a thousand years of growth,
    // permanently added every time it steps onto a course.
    trigger: { on: 'manual' },
    apply: [{ op: 'modifyStat', stat: 'stamina', amount: 8 }],
  },
};

export const bountifulHarvest: TechniqueCard = {
  id: 'technique.bountiful_harvest',
  name: 'Bountiful Harvest',
  rarity: 'legendary',
  type: 'technique',
  color: 'green',
  flavorText: 'Every cleared Leg leaves something ripe behind it.',
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
