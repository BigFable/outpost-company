/**
 * Logging rate, cost and prestige formulas, moved from prototype/timberline.html (tech plan M2).
 *
 * Exactness rule: the sim baseline must stay byte-identical, so each function
 * keeps the prototype's floating-point order of operations. Multiplier chains
 * are applied left to right with `applyMults` (((base*a)*b)*c), never pre-multiplied.
 */
import {
  CLOSE_VOL, EQUIPMENT, ERAS, IMPROVEMENTS, MODS, PERKS, SLOPES,
  type MultKey, type PerkDef, type Season, type SlopeId, type SpeciesDef, type Stage,
} from './content';

/** Multiply `base` by each factor in order. */
export function applyMults(base: number, mults: readonly number[]): number {
  let r = base;
  for (const m of mults) r *= m;
  return r;
}

// ---------- trees and tracts

/** Dollar value of one average tree: sawlog share at sawlog price plus the rest as pulp. */
export function treeValue(s: SpeciesDef): number {
  return s.bf * (s.saw * s.sawP + (1 - s.saw) * s.pulpP);
}

// ---------- equipment and crews

/** Price of the next unit: +15% per unit already owned, rounded up. */
export function equipmentCost(baseCost: number, owned: number): number {
  return Math.ceil(baseCost * Math.pow(1.15, owned));
}

export type Owned = Readonly<Record<string, number | undefined>>;

/** Summed rate of every crew and machine owned for one stage, before multipliers. */
export function crewRate(stage: Stage, own: Owned): number {
  return EQUIPMENT.reduce((a, e) => (e.stage === stage ? a + e.rate * (own[e.id] || 0) : a), 0);
}

/** Total crew count (used by achievements). */
export function crewCount(own: Owned): number {
  return EQUIPMENT.reduce((a, e) => a + (own[e.id] || 0), 0);
}

/**
 * Upkeep per minute before multipliers. Crews with nothing to do (utilisation
 * below 1) are paid `idleShare` of their wage: 0.25 normally, 0 with Company store.
 */
export function crewUpkeep(own: Owned, util: Readonly<Partial<Record<Stage, number>>>, idleShare: number): number {
  return EQUIPMENT.reduce((a, e) => a + e.up * (own[e.id] || 0) * (idleShare + (1 - idleShare) * (util[e.stage] ?? 1)), 0);
}

/** Upkeep per minute if every crew worked flat out, before multipliers. */
export function crewUpkeepFull(own: Owned): number {
  return EQUIPMENT.reduce((a, e) => a + e.up * (own[e.id] || 0), 0);
}

// ---------- multipliers from improvements and perks

/** Product of an improvement multiplier over the improvements owned, in table order. */
export function improvementMult(owned: readonly string[], key: MultKey): number {
  return IMPROVEMENTS.reduce((m, u) => {
    const v = u.mult[key];
    return owned.includes(u.id) && v ? m * v : m;
  }, 1);
}

const PERK_BY_ID: ReadonlyMap<string, PerkDef> = new Map(PERKS.map((p) => [p.id, p]));

/** Product of a perk multiplier over drafted perks (copies stack), in draft order. */
export function perkMult(perks: readonly string[], key: MultKey): number {
  let m = 1;
  for (const id of perks) {
    const v = PERK_BY_ID.get(id)?.m?.[key];
    if (v) m *= v;
  }
  return m;
}

/** How many copies of a perk were drafted. */
export function perkCount(perks: readonly string[], id: string): number {
  return perks.filter((x) => x === id).length;
}

// ---------- site and season factors

export interface SeasonOpts {
  /** Swamp boots perk: spring mud does not slow skidding. */
  readonly swampBoots: boolean;
  /** Corduroy roads improvement: spring mud costs half as much. */
  readonly corduroy: boolean;
  /** Road sprinkler sled improvement: winter hauling ×1.5. */
  readonly iceRoad: boolean;
  /** Ice road king perk: winter hauling ×1.4. */
  readonly iceKing: boolean;
}

/** Seasonal speed factor for a stage. Spring mud slows skid and haul; winter freezes the ground. */
export function seasonFactor(season: Season, stage: Stage, o: SeasonOpts): number {
  if (season === 'Spring' && stage === 'skid' && o.swampBoots) return 1;
  if (season === 'Spring' && (stage === 'skid' || stage === 'haul')) return o.corduroy ? 0.75 : 0.5;
  if (season === 'Winter') {
    if (stage === 'fell') return 0.85;
    if (stage === 'skid') return 1.25;
    if (stage === 'haul') return 1.25 * (o.iceRoad ? 1.5 : 1) * (o.iceKing ? 1.4 : 1);
  }
  return 1;
}

/** Skidding factor for ground slope; skyline yarding floors it at 0.92. */
export function slopeFactor(slope: SlopeId, skyline: boolean): number {
  const sl = SLOPES[slope].skid;
  return skyline ? Math.max(sl, 0.92) : sl;
}

/** Hauling factor for haul distance in miles (1.0 at one mile). */
export function distanceFactor(miles: number): number {
  return 1.07 / (1 + 0.07 * miles);
}

/** Pace-boost speed multiplier. */
export function boostFactor(bull: boolean): number {
  return bull ? 2 : 1.5;
}

/** Seconds a pace boost lasts. */
export function boostLength(radios: boolean, pacerCopies: number, fiddler: boolean): number {
  return (radios ? 45 : 30) + 15 * pacerCopies + (fiddler ? 10 : 0);
}

export interface StageRateInput {
  /** crewRate × improvement/perk/meta multipliers. */
  readonly base: number;
  readonly season: number;
  /** boostFactor() while a pace boost runs, else 1. */
  readonly boost: number;
  readonly slope: number;
  readonly distance: number;
}

/** Effective per-second rate of a stage (before payroll efficiency). */
export function stageRate(stage: Stage, i: StageRateInput): number {
  let r = i.base * i.season * i.boost;
  if (stage === 'skid') r *= i.slope;
  if (stage === 'haul') r *= i.distance;
  return r;
}

/** Board feet moved by one click of hand work. `hand` is the hand-work multiplier. */
export function handAmount(stage: Stage, hand: number, slope: number, distance: number): number {
  if (stage === 'buck') return 30 * hand;
  if (stage === 'skid') return 20 * hand * slope;
  if (stage === 'haul') return 25 * hand * distance;
  return 0;
}

// ---------- market

/** Market price multiplier at sim time `t` seconds: a slow swell plus a short chop, about 0.76 to 1.24. */
export function marketPrice(t: number): number {
  return 1 + 0.18 * Math.sin(t / 300 + 1) + 0.06 * Math.sin(t / 41);
}

// ---------- hire work and contracts

/** Advance paid on signing a cut-for-hire job. */
export function mobilization(trees: number, val: number, upkeepPerMin: number): number {
  return Math.round(Math.max(40, Math.min(upkeepPerMin * 4, trees * val * 0.3)));
}

/** Penalty for a missed charter order, scaled by the share left undelivered. */
export function missedPenalty(penalty: number, done: number, vol: number, handshake: boolean): number {
  return handshake ? 0 : Math.round(penalty * (1 - done / vol));
}

// ---------- eras

export interface EraDiscounts { readonly steam: boolean; readonly gas: boolean }

/** Price of pushing on to era `i`; Infinity past the last era. */
export function eraCost(i: number, d: EraDiscounts): number {
  const era = ERAS[i];
  return era ? Math.round(era.cost * (i === 1 && d.steam ? 0.8 : 1) * (i === 2 && d.gas ? 0.75 : 1)) : Infinity;
}

// ---------- close camp (Charter Shares)

/**
 * Charter Shares before multipliers for `delivered` board feet:
 * √(d ÷ 20,000) up to 10M bd ft (≈22.4), then +8 per tenfold beyond, so a long
 * run pays but a fresh run pays better per minute.
 */
export function legacyBase(delivered: number): number {
  return delivered <= 1e7 ? Math.sqrt(delivered / 20000) : Math.sqrt(500) + 8 * Math.log10(delivered / 1e7);
}

/** Product of the chosen charter clauses' share multipliers (unknown ids count as ×1). */
export function clauseMult(mods: readonly string[]): number {
  return mods.reduce((m, id) => m * (MODS.find((x) => x.id === id)?.x || 1), 1);
}

/** Charter Shares banked by closing camp now. */
export function legacyGain(delivered: number, mods: readonly string[], chronicler: boolean): number {
  return Math.floor(legacyBase(delivered) * clauseMult(mods) * (chronicler ? 1.15 : 1));
}

/** The charter ship takes a cargo once the outpost reaches Steam Camp or delivers CLOSE_VOL. */
export function canCloseCamp(era: number, delivered: number): boolean {
  return era >= 1 || delivered >= CLOSE_VOL;
}
