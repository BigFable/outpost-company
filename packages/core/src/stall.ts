/**
 * The company advance (2026-10-28, no-soft-lock pillar): a zero-income stall
 * and its rescue. Pure helpers, no randomness.
 *
 * A stall: logs (or standing trees) sit in a pile that a missing crew blocks,
 * the camp has sold nothing for STALL_SEC, and cash is short of the cheapest
 * crews that would unblock it. A player can work by hand; an idle player
 * cannot. The rescue: the company advances those crews, and half of each
 * later log sale repays it. Hauling never stalls (a local buyer carts logs
 * off a landing with no haul crew), so only felling, bucking and skidding count.
 * A camp with no crews at all is the opening of an outpost, worked by hand,
 * and never counts as a stall.
 */
import { deepFreeze } from './freeze';
import { EQUIPMENT, type Stage } from './content';
import { crewCount, crewRate, equipmentCost, type Owned } from './formulas';

/** Seconds without a sale before the company steps in. */
export const STALL_SEC = 120;
/** Share of each log sale (after wages owed) that repays an advance. */
export const ADVANCE_REPAY_SHARE = 0.5;

/** The chain up to the landing, upstream first. */
const CHAIN: readonly Stage[] = deepFreeze(['fell', 'buck', 'skid']);

export interface StallInput {
  /** Cash in hand. */
  readonly cash: number;
  /** Seconds since the last sale. */
  readonly sinceSale: number;
  /** Crews and machines owned. */
  readonly own: Owned;
  /** Current era: only crews of this era or earlier can be advanced. */
  readonly era: number;
  /** Trees left on the lot the crews are on (0 with no lot). */
  readonly trees: number;
  /** Felled trees waiting for bucking, bd ft. */
  readonly stems: number;
  /** Bucked logs waiting for skidding, bd ft. */
  readonly cut: number;
  /** Price factor on crews (bunkhouse, events); 1 by default. */
  readonly hireMult?: number;
}

export interface CrewAdvance { readonly id: string; readonly stage: Stage; readonly cost: number }
export interface StallRescue { readonly crews: readonly CrewAdvance[]; readonly cost: number }

/** The cheapest crew for a stage at this era, priced at the next unit (null when none is available). */
export function cheapestCrew(stage: Stage, era: number, own: Owned, hireMult = 1): CrewAdvance | null {
  let best: CrewAdvance | null = null;
  for (const e of EQUIPMENT) {
    if (e.stage !== stage || e.era > era) continue;
    const cost = equipmentCost(e.cost * hireMult, own[e.id] || 0);
    if (!best || cost < best.cost) best = { id: e.id, stage, cost };
  }
  return best;
}

/**
 * The crews a stalled camp is missing between its furthest-along pile and the landing,
 * ignoring time and cash (null when nothing is blocked). The furthest-along pile with
 * stock decides: logs (skid), felled trees (buck, skid) or standing trees (fell, buck, skid).
 */
export function blockedCrews(input: Omit<StallInput, 'cash' | 'sinceSale'>): StallRescue | null {
  const from = input.cut > 1e-6 ? 2 : input.stems > 1e-6 ? 1 : input.trees >= 1 ? 0 : -1;
  if (from < 0 || crewCount(input.own) === 0) return null;
  const crews: CrewAdvance[] = [];
  for (const st of CHAIN.slice(from)) {
    if (crewRate(st, input.own) > 0) continue;
    const c = cheapestCrew(st, input.era, input.own, input.hireMult ?? 1);
    if (c) crews.push(c);
  }
  if (!crews.length) return null;
  return { crews, cost: crews.reduce((a, c) => a + c.cost, 0) };
}

/**
 * A zero-income stall: a missing crew blocks the furthest-along pile, nothing has sold for
 * STALL_SEC and cash cannot pay for the missing crews. Returns the crews to advance, or null.
 */
export function stallRescue(input: StallInput): StallRescue | null {
  if (!(input.sinceSale >= STALL_SEC)) return null;
  const b = blockedCrews(input);
  return b && input.cash < b.cost ? b : null;
}

/** How much of a sale's net revenue goes to repaying an advance still owed. */
export function advanceRepay(net: number, owed: number): number {
  if (!(net > 0) || !(owed > 0)) return 0;
  return Math.min(owed, net * ADVANCE_REPAY_SHARE);
}
