// A small, seeded, deterministic PRNG (mulberry32). This is the ONLY source
// of randomness anywhere in @chao-draft/sim — architecture.md §5.1 requires
// every roll to be reproducible from (seed, call order), so nothing in this
// package may call Math.random() directly.

export type Rng = () => number; // returns a float in [0, 1)

export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  return function next(): number {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Inclusive integer roll in [min, max] — used for card grade rolls (GDD §4.3).
export function rollInRange(rng: Rng, min: number, max: number): number {
  if (max < min) {
    throw new Error(`rollInRange: max (${max}) is less than min (${min})`);
  }
  return min + Math.floor(rng() * (max - min + 1));
}

// Picks a uniformly random element from a non-empty array — used for pack
// generation (draft/pool.ts) and anywhere else sampling-with-replacement is
// needed. The non-null assertion is safe: `index` is always < arr.length by
// construction, so `arr[index]` can never actually be undefined here even
// though noUncheckedIndexedAccess can't prove that itself.
export function pickRandom<T>(arr: readonly T[], rng: Rng): T {
  if (arr.length === 0) {
    throw new Error('pickRandom: cannot pick from an empty array');
  }
  const index = Math.floor(rng() * arr.length);
  return arr[index]!;
}

// Fisher-Yates shuffle, returning a new array (the input is never mutated).
// Added 2026-08-20 for race course generation (events/race.ts), but generic
// enough for any future use.
export function shuffle<T>(arr: readonly T[], rng: Rng): T[] {
  const result = arr.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = result[i]!;
    result[i] = result[j]!;
    result[j] = temp;
  }
  return result;
}
