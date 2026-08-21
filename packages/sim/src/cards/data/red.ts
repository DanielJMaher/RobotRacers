import type { BondCard, TechniqueCard, TraitCard } from '../../types';

// "Core Garden" example set — Red (Run) cards.
// Source: docs/01-design/card-set-list.md
//
// Migrated 2026-08-20 (roadmap.md Phase 2.5) to the corrected Bond Card
// model: `slot` -> per-grant `region` (feet->legs, hands->arms, head/back
// unchanged), `bodyMutation: string` -> `bodyMutations: {region: string}`.
// This is a mechanical schema migration, not a content redesign — see
// green.ts's header note for the full rationale.
//
// Rewritten 2026-08-21 (roadmap.md Phase 5.9) — same pass as green.ts: every
// keyword/effect below uses only currently-live triggers/ops, and every card
// got a flavorText line. See green.ts's header note for the full context.
//
// Potion cards (Quickstep Draught, Racing Stripe Tonic, Bounding Draught)
// moved out to cards/data/potions.ts 2026-08-20 (roadmap.md Phase 5.5) —
// see that file's own header note.

export const skitterFinch: BondCard = {
  id: 'bond.skitter_finch',
  name: 'Skitter Finch',
  rarity: 'common',
  type: 'bond',
  color: 'red',
  flavorText: "Too small to fly far, too fast to catch on the ground.",
  statGrants: [{ stat: 'run', min: 7, max: 11, region: 'legs' }],
  speciesTags: ['bird'],
  bodyMutations: { legs: 'quick_tap_feet' },
};

export const dustdashLizard: BondCard = {
  id: 'bond.dustdash_lizard',
  name: 'Dustdash Lizard',
  rarity: 'common',
  type: 'bond',
  color: 'red',
  flavorText: 'Leaves the plain behind in a haze before anyone else has left the start line.',
  statGrants: [{ stat: 'run', min: 8, max: 12, region: 'legs' }],
  speciesTags: ['reptile'],
  bodyMutations: { legs: 'sprinting_legs' },
  keyword: {
    trigger: { on: 'leg_start', legType: 'sprint' },
    apply: [{ op: 'autoWinLeg' }],
    onceLimit: 'per_race',
  },
};

export const firecrackerBeetle: BondCard = {
  id: 'bond.firecracker_beetle',
  name: 'Firecracker Beetle',
  rarity: 'common',
  type: 'bond',
  color: 'red',
  flavorText: 'Its wing case pops like a spark the instant it starts moving.',
  statGrants: [
    { stat: 'run', min: 6, max: 9, region: 'arms' },
    { stat: 'power', min: 2, max: 4, region: 'arms' },
  ],
  speciesTags: ['insect'],
  bodyMutations: { arms: 'bright_wing_case' },
};

export const adrenalineRush: TechniqueCard = {
  id: 'technique.adrenaline_rush',
  name: 'Adrenaline Rush',
  rarity: 'uncommon',
  type: 'technique',
  color: 'red',
  flavorText: 'The heart jumps first. The legs just try to keep up.',
  energyCost: 1,
  exileOnUse: false,
  // Was "takes two actions instead of one this round" — a round-based Bout
  // mechanic with nothing left to hook into. Reflavored to a real, live
  // burst right out of the gate: fires at the very first Leg (Start always
  // leads a generated course — events/race.ts's generateRaceCourse), once.
  effect: {
    trigger: { on: 'leg_start' },
    apply: [{ op: 'modifyStat', stat: 'run', amount: 5 }],
    onceLimit: 'per_race',
  },
};

export const cinderSprinter: BondCard = {
  id: 'bond.cinder_sprinter',
  name: 'Cinder Sprinter',
  rarity: 'uncommon',
  type: 'bond',
  color: 'red',
  flavorText: 'Every stride kicks up embers that never quite catch up to it.',
  statGrants: [{ stat: 'run', min: 13, max: 18, region: 'legs' }],
  speciesTags: ['beast'],
  bodyMutations: { legs: 'ember_trail_paws' },
  keyword: {
    // Was "Overclock: +Run scaling with banked Fruit, capped at +6" — no
    // EffectOp reads the Environment's Fruit at all (only Chao state), so
    // there was nothing to scale off of. Reflavored to a flat, real burst
    // every Race — smaller than the scaling cap implied, but genuinely live.
    trigger: { on: 'race_start' },
    apply: [{ op: 'modifyStat', stat: 'run', amount: 4 }],
  },
};

export const startlingCry: TraitCard = {
  id: 'trait.startling_cry',
  name: 'Startling Cry',
  rarity: 'uncommon',
  type: 'trait',
  color: 'red',
  flavorText: "A sharp cry, and suddenly it's not there anymore.",
  effect: {
    // Was "on being targeted by an enemy Technique, gain +Run" — a Bout-
    // only trigger with no Race equivalent. Reflavored to the same startled
    // burst, keyed to the Race's own danger signal: running low on Stamina.
    trigger: { on: 'stamina_below', fraction: 0.4 },
    apply: [{ op: 'modifyStat', stat: 'run', amount: 4 }],
    onceLimit: 'per_race',
  },
};

export const jackrabbitReflex: BondCard = {
  id: 'bond.jackrabbit_reflex',
  name: 'Jackrabbit Reflex',
  rarity: 'uncommon',
  type: 'bond',
  color: 'red',
  flavorText: "Reacts before it's even decided to.",
  statGrants: [{ stat: 'run', min: 10, max: 14, region: 'head' }],
  speciesTags: ['rabbit'],
  bodyMutations: { head: 'alert_long_ears' },
  keyword: {
    // Was "First Move: always acts first in round 1 of a Bout" — dead since
    // Bout was removed. Reflavored to a real, permanent Race-start reflex.
    trigger: { on: 'race_start' },
    apply: [{ op: 'modifyStat', stat: 'run', amount: 3 }],
  },
};

export const blazingCometWing: BondCard = {
  id: 'bond.blazing_comet_wing',
  name: 'Blazing Comet Wing',
  rarity: 'rare',
  type: 'bond',
  color: 'red',
  flavorText: 'Streaks across the course like it fell out of the sky moving.',
  statGrants: [
    { stat: 'run', min: 16, max: 22, region: 'back' },
    { stat: 'fly', min: 4, max: 6, region: 'back' },
  ],
  speciesTags: ['bird'],
  bodyMutations: { back: 'trailing_sparks' },
};

export const falseStart: TechniqueCard = {
  id: 'technique.false_start',
  name: 'False Start',
  rarity: 'rare',
  type: 'technique',
  color: 'red',
  flavorText: "It's not really a false start if nobody catches it.",
  energyCost: 2,
  exileOnUse: false,
  // Was "Run doubled for the Start leg only" — a temporary, leg-scoped
  // multiplier nothing in the engine can express (modifyStat is a flat,
  // permanent change, matching every other keyword's established
  // precedent — e.g. Feral Momentum below). Reflavored to a real one-time
  // burst at the first Leg instead of a temporary doubling.
  effect: {
    trigger: { on: 'leg_start' },
    apply: [{ op: 'modifyStat', stat: 'run', amount: 6 }],
    onceLimit: 'per_race',
  },
};

export const feralMomentum: TraitCard = {
  id: 'trait.feral_momentum',
  name: 'Feral Momentum',
  rarity: 'rare',
  type: 'trait',
  color: 'red',
  flavorText: 'Every cleared Leg feeds the next one. It only ever speeds up.',
  effect: {
    trigger: { on: 'leg_won' },
    apply: [{ op: 'modifyStat', stat: 'run', amount: 2 }],
  },
};

export const sonicBoomSprinter: BondCard = {
  id: 'bond.sonic_boom_sprinter',
  name: 'Sonic Boom Sprinter',
  rarity: 'legendary',
  type: 'bond',
  color: 'red',
  flavorText: 'The course barely has time to notice it was there.',
  statGrants: [{ stat: 'run', min: 24, max: 32, region: 'legs' }],
  speciesTags: ['beast'],
  bodyMutations: { legs: 'motion_blur_streaks' },
  keyword: {
    // Was "Breakneck: always takes the shortcut fork, no threshold check
    // needed" — no EffectOp can bypass a fork's threshold roll outright.
    // Reflavored to the same outcome in spirit: a legendary Fly/Swim surge
    // big enough that every shortcut threshold clears in practice.
    trigger: { on: 'race_start' },
    apply: [
      { op: 'modifyStat', stat: 'fly', amount: 15 },
      { op: 'modifyStat', stat: 'swim', amount: 15 },
    ],
  },
};

export const photoFinish: TechniqueCard = {
  id: 'technique.photo_finish',
  name: 'Photo Finish',
  rarity: 'legendary',
  type: 'technique',
  color: 'red',
  flavorText: 'Finds one more gear exactly when the course is watching closest.',
  energyCost: 3,
  exileOnUse: true,
  // Was "if 2nd place or worse on the final Leg, move up one placement" —
  // no mid-Race placement-vs-rivals concept exists (fieldRace.ts only ranks
  // AFTER every racer's Race has independently resolved). Reflavored to a
  // real late-Race surge: a big burst the moment Stamina is nearly spent.
  effect: {
    trigger: { on: 'stamina_below', fraction: 0.15 },
    apply: [{ op: 'modifyStat', stat: 'run', amount: 8 }],
    onceLimit: 'per_race',
  },
};

// Jump cards, added 2026-08-20 (roadmap.md Phase 2) — Jump is a genuinely
// new, dedicated Stat (GDD §3.1), proposed to live in Red as a secondary
// stat lane alongside Run (GDD §3.2), same as some Bond Cards already grant
// a primary + minor stat pair.

export const springHeelHare: BondCard = {
  id: 'bond.spring_heel_hare',
  name: 'Spring-Heel Hare',
  rarity: 'common',
  type: 'bond',
  color: 'red',
  flavorText: 'Every step is half a hop it never quite finishes.',
  statGrants: [
    { stat: 'run', min: 6, max: 9, region: 'legs' },
    { stat: 'jump', min: 4, max: 7, region: 'legs' },
  ],
  speciesTags: ['rabbit'],
  bodyMutations: { legs: 'coiled_leg_muscles' },
};

export const cliffhopperGoat: BondCard = {
  id: 'bond.cliffhopper_goat',
  name: 'Cliffhopper Goat',
  rarity: 'uncommon',
  type: 'bond',
  color: 'red',
  flavorText: 'Treats a gap in the trail as an invitation, not an obstacle.',
  statGrants: [{ stat: 'jump', min: 10, max: 15, region: 'legs' }],
  speciesTags: ['beast'],
  bodyMutations: { legs: 'spring_loaded_hooves' },
  keyword: {
    trigger: { on: 'leg_start', legType: 'jump' },
    apply: [{ op: 'autoWinLeg' }],
    onceLimit: 'per_race',
  },
};

export const redCards = [
  skitterFinch,
  dustdashLizard,
  firecrackerBeetle,
  adrenalineRush,
  cinderSprinter,
  startlingCry,
  jackrabbitReflex,
  blazingCometWing,
  falseStart,
  feralMomentum,
  sonicBoomSprinter,
  photoFinish,
  springHeelHare,
  cliffhopperGoat,
];
