import type { BondCard, TechniqueCard, TraitCard } from '../../types';

// "Core Garden" example set — Black (Power) cards.
// Source: docs/01-design/card-set-list.md
//
// Migrated 2026-08-20 (roadmap.md Phase 2.5) to the corrected Bond Card
// model: `slot` -> per-grant `region` (hands->arms here), `bodyMutation:
// string` -> `bodyMutations: {region: string}`. Mechanical schema migration
// only — see green.ts's header note for the full rationale.
//
// Rewritten 2026-08-21 (roadmap.md Phase 5.9) — same pass as green.ts/red.ts:
// every keyword/effect below uses only currently-live triggers/ops, and
// every card got a flavorText line. See green.ts's header note for the full
// context. Bloodrock Idol's stamina_below Trait, previously declared live
// but never actually checked anywhere, is now genuinely live too — see
// events/race.ts's per-Leg stamina_below checkpoint, added this same pass.
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
  flavorText: 'Its jaw closes on obstacles the way most Chao close on doubt.',
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
  flavorText: "Doesn't go around anything. Never has.",
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
  flavorText: 'Locks onto a problem and simply outlasts it.',
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
  flavorText: 'One good hit is worth a dozen careful ones.',
  energyCost: 1,
  exileOnUse: false,
  // Was "next hit ignores the defender's Swim entirely" — a Bout-only
  // damage mechanic with nothing left to hook into. Reflavored to a real,
  // live burst loaded before the Race, same 'manual' convention as green.ts's
  // Second Wind/Old Growth.
  effect: {
    trigger: { on: 'manual' },
    apply: [{ op: 'modifyStat', stat: 'power', amount: 5 }],
  },
};

export const warthogTusks: BondCard = {
  id: 'bond.warthog_tusks',
  name: 'Warthog Tusks',
  rarity: 'uncommon',
  type: 'bond',
  color: 'black',
  flavorText: 'Every charge leaves the ground a little more broken than it found it.',
  statGrants: [{ stat: 'power', min: 13, max: 18, region: 'arms' }],
  speciesTags: ['beast'],
  bodyMutations: { arms: 'tusks' },
  keyword: {
    // Was "Knockback+: on hit, delays the defender's next action" — a Bout-
    // only concept with no Race meaning. Reflavored to Feral Momentum's
    // pattern (red.ts) but Power-flavored: every cleared Leg hits harder.
    trigger: { on: 'leg_won' },
    apply: [{ op: 'modifyStat', stat: 'power', amount: 2 }],
  },
};

export const bloodrockIdol: TraitCard = {
  id: 'trait.bloodrock_idol',
  name: 'Bloodrock Idol',
  rarity: 'uncommon',
  type: 'trait',
  color: 'black',
  flavorText: 'Carved from something that remembers being struck, and hitting back.',
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
  flavorText: 'Lowers its head once. That is usually enough.',
  statGrants: [{ stat: 'power', min: 10, max: 14, region: 'head' }],
  speciesTags: ['beast'],
  bodyMutations: { head: 'curled_horns' },
  keyword: {
    // Was "Charge: bonus damage on the opening action of a Bout" — dead
    // since Bout was removed. Reflavored to hit hardest right out of the
    // gate, same "first Leg" convention as red.ts's Adrenaline Rush.
    trigger: { on: 'leg_start' },
    apply: [{ op: 'modifyStat', stat: 'power', amount: 5 }],
    onceLimit: 'per_race',
  },
};

export const obsidianClaw: BondCard = {
  id: 'bond.obsidian_claw',
  name: 'Obsidian Claw',
  rarity: 'rare',
  type: 'bond',
  color: 'black',
  flavorText: 'Cuts deep enough to find reserves it did not know it had.',
  statGrants: [{ stat: 'power', min: 17, max: 23, region: 'arms' }],
  speciesTags: ['beast'],
  bodyMutations: { arms: 'obsidian_claws' },
  keyword: {
    // Was "Rend: ignores half of shield-type Trait protections" — dead
    // (no shield/protection concept exists in the Race resolver at all).
    // Reflavored to match its own flavor line above: digging in finds
    // hidden Stamina reserves on every cleared Leg.
    trigger: { on: 'leg_won' },
    apply: [{ op: 'restoreStamina', amount: 3 }],
  },
};

export const sacrificialOffering: TechniqueCard = {
  id: 'technique.sacrificial_offering',
  name: 'Sacrificial Offering',
  rarity: 'rare',
  type: 'technique',
  color: 'black',
  flavorText: 'Gives everything, right at the start, and holds nothing back for later.',
  energyCost: 2,
  exileOnUse: false,
  // Was "Sacrifice 10 Stamina: deal Power-equal bonus damage this round,
  // ignoring Evasion" — a Bout-only damage mechanic. There's no live way to
  // spend Stamina as a cost (restoreStamina only ever heals, and nothing
  // else touches currentStamina downward outside a Leg's own cost), so
  // rather than fake a "cost" this reflavors to a straightforward, honest
  // burst — no sacrifice, just an all-in opening surge.
  effect: {
    trigger: { on: 'manual' },
    apply: [{ op: 'modifyStat', stat: 'power', amount: 6 }],
  },
};

export const bonebreakerInstinct: TraitCard = {
  id: 'trait.bonebreaker_instinct',
  name: 'Bonebreaker Instinct',
  rarity: 'rare',
  type: 'trait',
  color: 'black',
  flavorText: 'Gets meaner exactly when the course does.',
  effect: {
    // Was "knockback reduces the defender's Run for the rest of the round"
    // — dead (Bout-only). Reflavored to a real late-Race power spike, one
    // tier stronger than Bloodrock Idol's own stamina_below Trait above.
    trigger: { on: 'stamina_below', fraction: 0.3 },
    apply: [{ op: 'modifyStat', stat: 'power', amount: 5 }],
    onceLimit: 'per_race',
  },
};

export const warlordsFang: BondCard = {
  id: 'bond.warlords_fang',
  name: "Warlord's Fang",
  rarity: 'legendary',
  type: 'bond',
  color: 'black',
  flavorText: "Doesn't just finish a course. Conquers it.",
  statGrants: [{ stat: 'power', min: 26, max: 34, region: 'arms' }],
  speciesTags: ['beast'],
  bodyMutations: { arms: 'dark_fang_plating' },
  keyword: {
    // Was "Executioner: instantly wins the Bout below 10% Stamina" — dead
    // since Bout was removed. Reflavored to a legendary permanent Power
    // surge, granted fresh every Race.
    trigger: { on: 'race_start' },
    apply: [{ op: 'modifyStat', stat: 'power', amount: 6 }],
  },
};

export const totalEclipse: TechniqueCard = {
  id: 'technique.total_eclipse',
  name: 'Total Eclipse',
  rarity: 'legendary',
  type: 'technique',
  color: 'black',
  flavorText: 'For one course, nothing else about this Chao matters but how hard it hits.',
  energyCost: 3,
  exileOnUse: true,
  // Was "ignores Evasion and Swim this round" — Bout-only. Reflavored to
  // its legendary tier's most direct translation: an overwhelming, one-time
  // Power surge loaded before the Race.
  effect: {
    trigger: { on: 'manual' },
    apply: [{ op: 'modifyStat', stat: 'power', amount: 10 }],
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
  flavorText: 'Treats a rock face like a door that has not opened yet.',
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
  flavorText: "Gravity is a suggestion it stopped taking seriously long ago.",
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
