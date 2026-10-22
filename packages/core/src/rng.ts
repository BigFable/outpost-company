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
