import type { Rng } from './rng';

/** The sim harness's seeded LCG (sim/sim_rogue.js), for reproducing prototype golden values in tests. */
export function simLcg(seed: number): Rng {
  let x = seed * 9301 + 49297;
  return () => { x = (x * 9301 + 49297) % 233280; return x / 233280; };
}

/** Replays a fixed list of draws; throws if a function draws more than expected. */
export function scripted(values: readonly number[]): Rng & { used: () => number } {
  let i = 0;
  const f = (() => {
    if (i >= values.length) throw new Error(`scripted rng exhausted after ${values.length} draws`);
    return values[i++] as number;
  }) as Rng & { used: () => number };
  f.used = () => i;
  return f;
}

/** Test helper: unwrap a value the test knows is present (fails loudly otherwise). */
export function must<T>(v: T | undefined | null): T {
  if (v === undefined || v === null) throw new Error('must: value missing');
  return v;
}
