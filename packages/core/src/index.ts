/**
 * @outpost/core — pure game rules. No DOM, no wall-clock time, no unseeded
 * randomness (lint enforced).
 *
 * Stage M2: the prototype's formulas and content tables live here. The
 * prototype consumes this package as `window.Core`, a bundle inlined into
 * prototype/timberline.html by `pnpm run core:inline` (see packages/core/README.md).
 */
export * from './content';
export * from './achievements';
export * from './formulas';
export * from './generators';
export * from './haul';
export * from './items';
export * from './sawmill';
export * from './species';
export * from './queue';
export * from './stash';
export * from './weather';
export * from './rng';
export { deepFreeze } from './freeze';

/** Clamp a number into [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  if (min > max) throw new RangeError(`clamp: min ${min} > max ${max}`);
  return Math.min(max, Math.max(min, value));
}

/**
 * Split elapsed simulated milliseconds into whole fixed ticks plus the
 * leftover, the building block of the fixed-tick loop (tech plan 2.3).
 */
export function splitTicks(elapsedMs: number, tickMs: number): { ticks: number; remainderMs: number } {
  if (tickMs <= 0) throw new RangeError('splitTicks: tickMs must be positive');
  const safe = Math.max(0, elapsedMs);
  const ticks = Math.floor(safe / tickMs);
  return { ticks, remainderMs: safe - ticks * tickMs };
}
