/**
 * Logging rate, cost and prestige formulas, moved from prototype/timberline.html (tech plan M2).
 *
 * Exactness rule: the sim baseline must stay byte-identical, so each function
 * keeps the prototype's floating-point order of operations. Multiplier chains
 * are applied left to right with `applyMults` (((base*a)*b)*c), never pre-multiplied.
 */
import {
  CLOSE_VOL, EQUIPMENT, ERAS, IMPROVEMENTS, MODS, PERKS, SKID_TURN_RUNGS, SLOPES,
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

/** Total price of buying `count` more units one after another (exactly the sum of each next-unit price). */
export function equipmentCostTotal(baseCost: number, owned: number, count: number): number {
  let total = 0;
  for (let i = 0; i < count; i++) total += equipmentCost(baseCost, owned + i);
  return total;
}

/** Most units `cash` can buy in a row (at most `cap`), and what they cost in all. */
export function equipmentMaxAffordable(baseCost: number, owned: number, cash: number, cap = 10000): { count: number; total: number } {
  let count = 0, total = 0;
  while (count < cap) {
    const next = equipmentCost(baseCost, owned + count);
    if (total + next > cash) break;
    total += next; count++;
  }
  return { count, total };
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

// ---------- rising wages and the wage cap (owner decision 2026-10-28)

/**
 * Rising wages: each extra crew of the same type is paid `WAGE_STEP` of the
 * base wage more than the one before. The nth crew earns up × (1 + k·(n−1)).
 * Tuned by sim 2026-10-28 (docs/research/rising-wages.md): 0.15 leaves every
 * profile's 3-run total unchanged within noise and moves time from run 1
 * (more crews per type) to runs 2–3; 0.2 starts to slow idle.
 */
export const WAGE_STEP = 0.15;
/**
 * The wage cap: rising wages stop at this share of income a minute (measured on
 * a slow average). Base wages (every crew at its type's first-crew wage) are
 * always paid, so the cap only ever trims the rise and a camp with no income
 * pays exactly what it did before rising wages.
 */
export const WAGE_CAP_SHARE = 0.6;
/** Seconds of the slow income average the wage cap reads (so the cap does not flicker with each sale). */
export const WAGE_CAP_AVG_SEC = 120;

/** Wage per minute of the `n`th crew of one type (n = 1 for the first), before multipliers. */
export function crewWage(up: number, n: number, k = WAGE_STEP): number {
  return n < 1 ? 0 : up * (1 + k * (n - 1));
}

/** Wages per minute of `count` crews of one type, before multipliers: up × (count + k·count·(count−1)/2). */
export function crewWagesFor(up: number, count: number, k = WAGE_STEP): number {
  const c = Math.max(0, count);
  return up * (c + (k * c * (c - 1)) / 2);
}

/** Extra wages per minute from hiring `add` more of a type that has `owned` already, before multipliers. */
export function crewWageAdded(up: number, owned: number, add = 1, k = WAGE_STEP): number {
  return crewWagesFor(up, owned + add, k) - crewWagesFor(up, owned, k);
}

/**
 * Upkeep per minute before multipliers, with rising wages per type (`k`; pass 0
 * for base wages). Crews with nothing to do (utilisation below 1) are paid
 * `idleShare` of their wage: 0.25 normally, 0 with Company store.
 */
export function crewUpkeep(own: Owned, util: Readonly<Partial<Record<Stage, number>>>, idleShare: number, k = WAGE_STEP): number {
  return EQUIPMENT.reduce((a, e) => a + crewWagesFor(e.up, own[e.id] || 0, k) * (idleShare + (1 - idleShare) * (util[e.stage] ?? 1)), 0);
}

/** Upkeep per minute if every crew worked flat out, before multipliers (rising wages per type; `k` = 0 for base wages). */
export function crewUpkeepFull(own: Owned, k = WAGE_STEP): number {
  return EQUIPMENT.reduce((a, e) => a + crewWagesFor(e.up, own[e.id] || 0, k), 0);
}

/**
 * The wage bill after the cap. `rising` and `base` are the bills with and
 * without rising wages (same multipliers); `incomePerMin` is the slow income
 * average. The rise stops at `share` of income, and the base bill is always
 * paid: max(base, min(rising, share × income)). At zero income this is the base
 * bill, so the payroll guard, wages owed and the company advance work as before.
 */
export function wageCap(rising: number, base: number, incomePerMin: number, share = WAGE_CAP_SHARE): { wages: number; capped: boolean } {
  const lim = Math.max(0, share * Math.max(0, incomePerMin));
  const wages = Math.max(base, Math.min(rising, lim));
  return { wages, capped: wages < rising - 1e-9 };
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
  /** Greased runners perk: spring mud speeds skidding ×1.2 instead of slowing it. */
  readonly greased?: boolean;
}

/** Seasonal speed factor for a stage. Spring mud slows skid and haul; winter freezes the ground. */
export function seasonFactor(season: Season, stage: Stage, o: SeasonOpts): number {
  if (season === 'Spring' && stage === 'skid' && o.greased) return 1.2;
  if (season === 'Spring' && stage === 'skid' && o.swampBoots) return 1;
  if (season === 'Spring' && (stage === 'skid' || stage === 'haul')) return o.corduroy ? 0.75 : 0.5;
  if (season === 'Winter') {
    if (stage === 'fell') return 0.85;
    if (stage === 'skid') return 1.25;
    if (stage === 'haul') return 1.25 * (o.iceRoad ? 1.5 : 1) * (o.iceKing ? 1.4 : 1);
  }
  return 1;
}

// ---------- skid-game turns

/** Largest skid-game turn: 3 logs, raised by choker, arch and bundle improvements; Four-log turns adds one more. */
export function maxSkidLogs(improvements: readonly string[], fourLog: boolean): number {
  let n = 3;
  for (const id of improvements) n = Math.max(n, SKID_TURN_RUNGS[id] ?? 0);
  return n + (fourLog ? 1 : 0);
}

/** Turn sizes offered: 1, 2 and 3 logs, the lower improvement rungs owned, and the largest turn (which replaces the top rung). */
export function skidTurnSizes(improvements: readonly string[], fourLog: boolean): number[] {
  const top = maxSkidLogs(improvements, fourLog);
  const rungs = Object.keys(SKID_TURN_RUNGS).filter((id) => improvements.includes(id)).map((id) => SKID_TURN_RUNGS[id] as number);
  const topRung = Math.max(3, ...rungs);
  const sizes = new Set([1, 2, 3, ...rungs.filter((n) => n < topRung), top]);
  return [...sizes].sort((a, b) => a - b);
}

/** Wood a turn moves, in light-turn loads: 1, 2, 3.2, 4.6, then 1.15 per log. */
export function skidTurnLoad(logs: number): number {
  return logs <= 4 ? ([1, 2, 3.2, 4.6][Math.max(1, logs) - 1] as number) : 1.15 * logs;
}

/** Team speed factor for a turn: heavier turns drag slower (0.62 at 4 logs, then falling with √(4/n)). */
export function skidTurnSpeed(logs: number): number {
  return logs <= 4 ? ([1.15, 1, 0.78, 0.62][Math.max(1, logs) - 1] as number) : 0.62 * Math.sqrt(4 / logs);
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

/** At most this many stages run pace-boosted at once (Fog lifts ignores the limit). */
export const BOOST_STAGES = 2;
/** A stage banks at most this many seconds of pace boost. */
export const BOOST_BANK = 120;
const BOOST_ORDER: readonly Stage[] = ['fell', 'buck', 'skid', 'haul'];

/** Pace-boost end times by stage, in sim seconds (a stage is boosted while its end time is after now). */
export type BoostState = Partial<Record<Stage, number>>;

/**
 * Pace-boost end times after a mini-game grants a boost to `stage` at time `t`.
 * Without Fog lifts (`golden`), the stages already boosted that ended soonest
 * drop (end time set to `t`) until fewer than BOOST_STAGES others remain; with
 * it, every stage is boosted. Each boosted stage banks at most BOOST_BANK s.
 * Returns a new object; the input is not changed.
 */
export function grantBoost(boost: Readonly<BoostState>, t: number, stage: Stage, len: number, golden: boolean): BoostState {
  const b: BoostState = { ...boost };
  if (!golden) {
    const on = BOOST_ORDER.filter((k) => k !== stage && (b[k] || 0) > t).sort((x, y) => (b[x] as number) - (b[y] as number));
    while (on.length >= BOOST_STAGES) b[on.shift() as Stage] = t;
  }
  for (const k of golden ? BOOST_ORDER : [stage]) b[k] = Math.min(t + BOOST_BANK, Math.max(b[k] || 0, t) + len);
  return b;
}

export interface StageRateInput {
  /** crewRate × improvement/perk/meta multipliers. */
  readonly base: number;
  readonly season: number;
  /** boostFactor() while a pace boost runs, else 1. */
  readonly boost: number;
  readonly slope: number;
  readonly distance: number;
  /** Skid and haul weight of the wood being worked (species overhaul; pine = 1, default 1). */
  readonly weight?: number;
}

/** Effective per-second rate of a stage (before payroll efficiency). Skidding and hauling move bd ft ÷ weight. */
export function stageRate(stage: Stage, i: StageRateInput): number {
  let r = i.base * i.season * i.boost;
  if (stage === 'skid') r *= i.slope;
  if (stage === 'haul') r *= i.distance;
  if ((stage === 'skid' || stage === 'haul') && i.weight !== undefined && i.weight !== 1 && i.weight > 0) r /= i.weight;
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

/** Penalty for a missed charter order, scaled by the share left undelivered. A species order (`speciesOrder`) is free to miss. */
export function missedPenalty(penalty: number, done: number, vol: number, handshake: boolean, speciesOrder = false): number {
  return handshake || speciesOrder ? 0 : Math.round(penalty * (1 - done / vol));
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

/** Charter Shares added per push inland (era reached) this outpost, before multipliers. */
export const ERA_SHARES = 8;

/**
 * Charter Shares banked by closing camp now: (legacyBase + ERA_SHARES × era)
 * × clauses × 1.15 with the chronicler, so closing after more eras pays fairly
 * even on a short outpost.
 */
export function legacyGain(delivered: number, era: number, mods: readonly string[], chronicler: boolean): number {
  return Math.floor((legacyBase(delivered) + ERA_SHARES * era) * clauseMult(mods) * (chronicler ? 1.15 : 1));
}

/** The charter ship takes a cargo once the outpost reaches Steam Camp or delivers CLOSE_VOL. */
export function canCloseCamp(era: number, delivered: number): boolean {
  return era >= 1 || delivered >= CLOSE_VOL;
}
