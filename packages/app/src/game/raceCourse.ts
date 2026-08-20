import type { RaceConfig } from '@chao-draft/sim';

// A fixed demo course for Phase 1. Phase 2's map/node system (see
// docs/03-roadmap/roadmap.md) is what eventually generates real per-node
// race configs — this is just enough to exercise resolveRace end to end,
// including its shortcut fork on the Water leg.
export const DEMO_RACE_COURSE: RaceConfig = {
  legs: [
    { type: 'start', difficulty: 15, staminaCost: 8 },
    { type: 'sprint', difficulty: 20, staminaCost: 10 },
    {
      type: 'water',
      difficulty: 25,
      staminaCost: 10,
      fork: { shortcutStat: 'fly', shortcutThreshold: 20, shortcutDifficulty: 15 },
    },
    { type: 'obstacle', difficulty: 25, staminaCost: 10 },
  ],
};
