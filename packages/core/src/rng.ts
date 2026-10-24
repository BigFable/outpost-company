/**
 * Injected randomness. Core never calls Math.random (lint enforced): every
 * random function takes an `Rng` that returns a float in [0, 1).
 *
 * The prototype passes `Math.random` (which the sim harness seeds), so the
 * order of draws below is part of the contract: changing it changes every
 * seeded sim run. Seeded named streams arrive in stage M3.
 */
export type Rng = () => number;

/** Uniform float in [a, b). One draw. Same as the prototype's `rnd(a, b)`. */
export function rngRange(rng: Rng, a: number, b: number): number {
  return a + rng() * (b - a);
}

/** Uniform element of a non-empty list. One draw. Same as the prototype's `pick(a)`. */
export function rngPick<T>(rng: Rng, list: readonly T[]): T {
  if (list.length === 0) throw new RangeError('rngPick: empty list');
  return list[Math.floor(rng() * list.length)] as T;
}

/**
 * A named, seeded random stream whose state lives in the save (mulberry32).
 * New systems (finds, the Sawmill) draw from their own streams so the logging
 * sim's Math.random draws stay byte-exact. `state[key]` is a uint32 seed and is
 * advanced on every draw; a missing key starts from `seed`.
 */
export function streamRng(state: Record<string, number>, key: string, seed = 0x9e3779b9): Rng {
  return () => {
    let a = ((state[key] ?? seed) + 0x6d2b79f5) >>> 0;
    state[key] = a;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    a = (t ^ (t >>> 14)) >>> 0;
    return a / 4294967296;
  };
}
