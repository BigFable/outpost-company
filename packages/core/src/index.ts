/**
 * @outpost/core — pure game rules. Empty until tech plan stage M2, when the
 * prototype's formulas move here. Keep this package free of DOM, wall-clock
 * time and unseeded randomness.
 */

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
