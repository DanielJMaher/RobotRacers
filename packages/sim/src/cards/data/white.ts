import type { BondCard, TechniqueCard, TraitCard } from '../../types';

// "Core Garden" example set — White (Swim) cards.
// Source: docs/01-design/card-set-list.md
//
// Migrated 2026-08-20 (roadmap.md Phase 2.5) to the corrected Bond Card
// model: `slot` -> per-grant `region` (feet->legs, back unchanged),
// `bodyMutation: string` -> `bodyMutations: {region: string}`. Mechanical
// schema migration only — see green.ts's header note for the full rationale.
//
// Rewritten 2026-08-21 (roadmap.md Phase 5.9) — same pass as the other color
// files: every keyword/effect below uses only currently-live triggers/ops,
// and every card got a flavorText line. Guardian's Oath (a multi-Chao board
// mechanic with no meaning in this single-Chao design) got the fullest
// rework here; Still Waters is the one card that directly motivated adding
// the new `race_end` trigger this same pass — see its own note.
//
// Potion cards (Clearwater Draught, Tidepool Tonic) moved out to
// cards/data/potions.ts 2026-08-20 (roadmap.md Phase 5.5), which now
// consolidates every color's Potions into one cross-color file — see that
// file's own header note for why.

export const koiPondElder: BondCard = {
  id: 'bond.koi_pond_elder',
  name: 'Koi Pond Elder',
  rarity: 'common',
  type: 'bond',
  color: 'white',
  flavorText: 'Has outlasted every pond it has ever lived in.',
  statGrants: [{ stat: 'swim', min: 7, max: 11, region: 'back' }],
  speciesTags: ['fish'],
  bodyMutations: { back: 'trailing_fins' },
};

export const harborSealPup: BondCard = {
  id: 'bond.harbor_seal_pup',
  name: 'Harbor Seal Pup',
  rarity: 'common',
  type: 'bond',
  color: 'white',
  flavorText: 'Barely tries and still outpaces the current.',
  statGrants: [{ stat: 'swim', min: 8, max: 12, region: 'back' }],
  speciesTags: ['beast'],
  bodyMutations: { back: 'seal_flippers' },
  keyword: {
    // Was "Buoyant: reduces the Stamina cost of Water legs" — no EffectOp
    // targets a Leg's cost directly (that's a race.ts-local config value,
    // not Chao state). Reflavored to the same net effect via the closest
    // real primitive: a Stamina top-up specifically on Water Legs.
    trigger: { on: 'leg_start', legType: 'water' },
    apply: [{ op: 'restoreStamina', amount: 3 }],
  },
};

export const reedCrane: BondCard = {
  id: 'bond.reed_crane',
  name: 'Reed Crane',
  rarity: 'common',
  type: 'bond',
  color: 'white',
  flavorText: 'One leg in the water, one eye on the sky.',
  statGrants: [
    { stat: 'swim', min: 6, max: 10, region: 'legs' },
    { stat: 'fly', min: 2, max: 4, region: 'legs' },
  ],
  speciesTags: ['bird'],
  bodyMutations: { legs: 'long_legs' },
};

export const guardStance: TechniqueCard = {
  id: 'technique.guard_stance',
  name: 'Guard Stance',
  rarity: 'uncommon',
  type: 'technique',
  color: 'white',
  flavorText: 'Braces before the course even begins, and holds through the whole thing.',
  energyCost: 1,
  exileOnUse: false,
  // Was "takes half damage from the next hit this round" — a Bout-only
  // damage mechanic. Reflavored to a real, permanent Stamina brace loaded
  // before the Race — NOT restoreStamina (resolveRace already resets
  // currentStamina to full right before 'manual' fires, so a restore there
  // is always wasted; modifyStat raises the base stat instead).
  effect: {
    trigger: { on: 'manual' },
    apply: [{ op: 'modifyStat', stat: 'stamina', amount: 4 }],
  },
};

export const coralTurtleShell: BondCard = {
  id: 'bond.coral_turtle_shell',
  name: 'Coral Turtle Shell',
  rarity: 'uncommon',
  type: 'bond',
  color: 'white',
  flavorText: 'Armor that only gets tougher with age.',
  statGrants: [{ stat: 'swim', min: 13, max: 18, region: 'back' }],
  speciesTags: ['reptile'],
  bodyMutations: { back: 'coral_shell' },
  keyword: {
    // Was a direct preventDamage 'all', once per Bout — a real op, but one
    // the Race resolver never consumes (no damage concept in a Race at all;
    // that was Bout-specific). Reflavored to a real permanent Swim surge,
    // granted fresh at the start of every Race.
    trigger: { on: 'race_start' },
    apply: [{ op: 'modifyStat', stat: 'swim', amount: 4 }],
  },
};

export const stillWaters: TraitCard = {
  id: 'trait.still_waters',
  name: 'Still Waters',
  rarity: 'uncommon',
  type: 'trait',
  color: 'white',
  flavorText: 'Calm all the way to the finish line.',
  effect: {
    // Was "if this Chao finishes the Race without using any Techniques,
    // gain double Fruit" — no trigger could check that retrospective
    // condition (whole-Race event history isn't visible to a single
    // TriggerCondition predicate). This is the card that directly motivated
    // adding a real `race_end` trigger (types.ts, 2026-08-21): simplified to
    // "on finishing the Race" — still true to "Still Waters" as a reward
    // for a calm, uneventful finish, just without the Technique condition.
    trigger: { on: 'race_end', outcome: 'finished' },
    apply: [{ op: 'grantFruit', amount: 4 }],
  },
};

export const otterPaddle: BondCard = {
  id: 'bond.otter_paddle',
  name: 'Otter Paddle',
  rarity: 'uncommon',
  type: 'bond',
  color: 'white',
  flavorText: 'Water is just a different kind of ground to it.',
  statGrants: [{ stat: 'swim', min: 11, max: 15, region: 'legs' }],
  speciesTags: ['beast'],
  bodyMutations: { legs: 'webbed_paws' },
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
  flavorText: 'Ancient armor that has never once needed replacing.',
  statGrants: [{ stat: 'swim', min: 17, max: 23, region: 'back' }],
  speciesTags: ['fish'],
  bodyMutations: { back: 'ancient_scales' },
  keyword: {
    // Was "Aegis: Trait Cards that would remove protections instead fail"
    // — dead (Bout removed, and no shield/protection-removal mechanic
    // exists anywhere to defend against in the first place). Reflavored to
    // a real permanent surge each Race, matching its rare tier.
    trigger: { on: 'race_start' },
    apply: [{ op: 'modifyStat', stat: 'swim', amount: 5 }],
  },
};

export const steadyHand: TechniqueCard = {
  id: 'technique.steady_hand',
  name: 'Steady Hand',
  rarity: 'rare',
  type: 'technique',
  color: 'white',
  flavorText: 'Holds its line no matter what the course throws at it.',
  energyCost: 2,
  exileOnUse: false,
  // Was "cannot be knocked back or have action order changed this round" —
  // dead (Bout-only). Reflavored to a real, permanent Swim surge loaded
  // before the Race, matching its rare tier.
  effect: {
    trigger: { on: 'manual' },
    apply: [{ op: 'modifyStat', stat: 'swim', amount: 6 }],
  },
};

export const guardiansOath: TraitCard = {
  id: 'trait.guardians_oath',
  name: "Guardian's Oath",
  rarity: 'rare',
  type: 'trait',
  color: 'white',
  flavorText: 'An oath that holds firmest exactly when it is tested.',
  effect: {
    // Was "whenever another Chao on your board would DNF, give up your own
    // Leg result to save them" — fundamentally a multi-Chao board mechanic
    // (the Tournament resolves each Chao's Race independently; there's no
    // shared "board" a single Chao's Trait could reach across). Fully
    // reflavored rather than forced into a shape that only pretends to
    // match: the oath now holds firm for the Chao wearing it, right when
    // the Race turns hardest.
    trigger: { on: 'stamina_below', fraction: 0.3 },
    apply: [{ op: 'modifyStat', stat: 'swim', amount: 5 }],
    onceLimit: 'per_race',
  },
};

export const ninefoldTideTheUnbroken: BondCard = {
  id: 'bond.ninefold_tide_the_unbroken',
  name: 'Ninefold Tide, the Unbroken',
  rarity: 'legendary',
  type: 'bond',
  color: 'white',
  flavorText: 'The tide goes out for everyone else. Not for this one.',
  statGrants: [{ stat: 'swim', min: 28, max: 36, region: 'back' }],
  speciesTags: ['fish', 'reptile'],
  bodyMutations: { back: 'layered_scale_armor_calm_expression' },
  keyword: {
    // Was "Sanctuary: cannot take damage below 1 Stamina more than once per
    // Bout" — dead since Bout was removed. Reflavored to a legendary
    // permanent surge, granted fresh at the start of every Race.
    trigger: { on: 'race_start' },
    apply: [{ op: 'modifyStat', stat: 'swim', amount: 8 }],
  },
};

export const perfectCalm: TechniqueCard = {
  id: 'technique.perfect_calm',
  name: 'Perfect Calm',
  rarity: 'legendary',
  type: 'technique',
  color: 'white',
  flavorText: 'Nothing about this course was ever going to rattle it.',
  energyCost: 3,
  exileOnUse: true,
  effect: {
    // Was autoResolveDNF (kept — genuinely live) plus "auto-wins any single
    // Leg of your choice" — no player-facing "pick a Leg" selection exists
    // anywhere in the resolver, so that half was always dead. Replaced with
    // a real permanent Swim surge instead of a fake choice mechanic.
    trigger: { on: 'race_start' },
    apply: [
      { op: 'autoResolveDNF', result: 'safe' },
      { op: 'modifyStat', stat: 'swim', amount: 6 },
    ],
  },
};

export const whiteCards = [
  koiPondElder,
  harborSealPup,
  reedCrane,
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
