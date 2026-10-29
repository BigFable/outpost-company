/**
 * Lot stat chips (owner request 2026-10-26): each lot's key numbers, compared
 * with the average lot the land office lists in the player's era. Read-only:
 * no game draws, no game numbers change.
 *
 * The era averages are a fixed-seed sample of `genTract` on its own private
 * stream, so they follow the generator's parameters (tuning a range moves the
 * average) and never touch the game's rng. Neutral listing options: no land
 * agent, no survey clauses.
 */
import { SLOPES, SPECIES, type SlopeId, type SpeciesId } from './content';
import { deepFreeze } from './freeze';
import { distanceFactor, slopeFactor } from './formulas';
import { genTract } from './generators';
import { primePerTree, type QueueLot } from './queue';
import { PRIME_RULES, type ItemId } from './items';
import { mixShare } from './species';
import { streamRng } from './rng';

export type LotStatId = 'chops' | 'value' | 'weight' | 'haul' | 'slope' | 'price' | 'prime';
/** Display order, the same on every listing, queue row and tree card. */
export const LOT_STATS: readonly LotStatId[] = deepFreeze(['chops', 'value', 'weight', 'haul', 'slope', 'price', 'prime']);
/** +1 when a higher number is better, -1 when lower is better. Slope compares the skid factor (flat 1, hilly 0.8, steep 0.55). */
export const LOT_STAT_DIR: Readonly<Record<LotStatId, 1 | -1>> = deepFreeze({
  chops: -1, value: 1, weight: -1, haul: -1, slope: 1, price: -1, prime: 1,
});
/** Within this share of the average a stat counts as about average (neutral). */
export const LOT_STAT_BAND = 0.1;
/** Per-stat bands where ±10% is too wide: weights only run 0.8-1.1, so ±5%. */
export const LOT_STAT_BANDS: Readonly<Partial<Record<LotStatId, number>>> = deepFreeze({ weight: 0.05 });
/** Listings sampled per era for the averages. */
export const LOT_AVG_SAMPLES = 4000;
const LOT_AVG_SEED = 0x51a7c0de;

export interface EraLotAverages {
  /** Chops to fell one tree. */
  readonly chops: number;
  /** Dollar value per tree. */
  readonly value: number;
  /** Skid and haul weight (pine = 1). */
  readonly weight: number;
  /** Haul miles. */
  readonly haul: number;
  /** Skid factor of the slope. */
  readonly slope: number;
  /** Asking price per tree. */
  readonly price: number;
  /** Average share of each species in a listing's mix (Prime per tree is linear in the shares). */
  readonly share: Readonly<Partial<Record<SpeciesId, number>>>;
}

const cache = new Map<number, EraLotAverages>();

/** The average land-office listing for an era (cached; the same every call). */
export function eraLotAverages(era: number): EraLotAverages {
  const e = Math.max(0, Math.floor(era) || 0);
  const hit = cache.get(e); if (hit) return hit;
  const st: Record<string, number> = {}, rng = streamRng(st, 'lotavg', LOT_AVG_SEED);
  const o = { stumpMult: 1, thinSurvey: false, cruiser: false };
  let chops = 0, value = 0, weight = 0, haul = 0, slope = 0, price = 0;
  const share: Partial<Record<SpeciesId, number>> = {};
  const n = LOT_AVG_SAMPLES;
  for (let i = 0; i < n; i++) {
    const t = genTract(rng, e, o);
    chops += t.hp; value += t.val; weight += t.wt; haul += t.miles; slope += SLOPES[t.slope].skid;
    price += (t.price ?? 0) / Math.max(1, t.trees);
    for (const sp of Object.keys(SPECIES) as SpeciesId[]) { const s = mixShare(t.mix, sp); if (s > 0) share[sp] = (share[sp] ?? 0) + s; }
  }
  for (const k in share) share[k as SpeciesId] = (share[k as SpeciesId] as number) / n;
  const out: EraLotAverages = deepFreeze({ chops: chops / n, value: value / n, weight: weight / n, haul: haul / n, slope: slope / n, price: price / n, share });
  cache.set(e, out);
  return out;
}

const PRIME_ITEMS: readonly ItemId[] = [...new Set(PRIME_RULES.map((r) => r.item))];

/** Expected Prime of any kind per tree felled on a lot (idle trickle plus the felling-game pace). */
export function primeChance(l: Pick<QueueLot, 'mix'>, era: number, perfRate = 0): number {
  return PRIME_ITEMS.reduce((a, item) => a + primePerTree(l as QueueLot, item, era, perfRate), 0);
}

/** The era averages for every chip stat; Prime at the player's felling-game pace. */
export function lotStatAverages(era: number, perfRate = 0): Record<LotStatId, number> {
  const a = eraLotAverages(era);
  const mix = Object.entries(a.share) as [SpeciesId, number][];
  return { chops: a.chops, value: a.value, weight: a.weight, haul: a.haul, slope: a.slope, price: a.price, prime: primeChance({ mix }, era, perfRate) };
}

export type StatVerdict = 'good' | 'bad' | 'even';

/** Better or worse than the average: neutral within `band` (a share of the average; ±10%, weight ±5%). */
export function statVerdict(id: LotStatId, value: number, avg: number, band = LOT_STAT_BANDS[id] ?? LOT_STAT_BAND): StatVerdict {
  if (!isFinite(value) || !isFinite(avg)) return 'even';
  const d = avg > 0 ? value / avg - 1 : value > 0 ? Infinity : 0;
  if (Math.abs(d) <= band + 1e-9) return 'even';
  return (d > 0) === (LOT_STAT_DIR[id] > 0) ? 'good' : 'bad';
}

/** The parts of a lot the chips read. `price` is the asking price (listings only). */
export interface StatLot {
  readonly mix: readonly (readonly [SpeciesId, number])[];
  readonly trees?: number;
  readonly hp?: number;
  readonly val?: number;
  readonly wt?: number;
  readonly miles?: number;
  readonly slope?: SlopeId;
  readonly price?: number;
}
export interface StatChip {
  readonly id: LotStatId;
  readonly value: number;
  readonly avg: number;
  readonly verdict: StatVerdict;
}

/**
 * The chips for a lot, in LOT_STATS order. Stats the lot does not carry (no
 * price on an owned lot, no haul on a species card) are left out.
 */
export function lotStatChips(l: StatLot, era: number, perfRate = 0, only?: readonly LotStatId[]): StatChip[] {
  const avg = lotStatAverages(era, perfRate);
  const v: Partial<Record<LotStatId, number>> = {};
  if (l.hp !== undefined) v.chops = l.hp;
  if (l.val !== undefined) v.value = l.val;
  if (l.wt !== undefined) v.weight = l.wt > 0 ? l.wt : 1;
  if (l.miles !== undefined) v.haul = l.miles;
  if (l.slope !== undefined) v.slope = SLOPES[l.slope].skid;
  if (l.price !== undefined && l.trees) v.price = l.price / l.trees;
  v.prime = primeChance(l, era, perfRate);
  const out: StatChip[] = [];
  for (const id of LOT_STATS) {
    const x = v[id];
    if (x === undefined || (only && !only.includes(id))) continue;
    out.push({ id, value: x, avg: avg[id], verdict: statVerdict(id, x, avg[id]) });
  }
  return out;
}

// ---------- the haul chip (owner request 2026-10-28): distance and slope as one Easy / OK / Hard word on a listing

export type HaulEase = 'easy' | 'ok' | 'hard';
/**
 * Haul factor = distance factor x skid factor of the slope (1 at a flat mile).
 * Easy from 0.8 (flat out to 4 mi, hilly at 1 mi); Hard under 0.56 (any steep
 * lot, hilly from 8 mi); OK between.
 */
export const HAUL_EASE: Readonly<{ easy: number; hard: number }> = deepFreeze({ easy: 0.8, hard: 0.56 });
export interface HaulChip { readonly key: HaulEase; readonly factor: number; readonly verdict: StatVerdict }

/** The haul chip for a lot: its haul factor, Easy / OK / Hard, and the matching colour (good / even / bad). */
export function haulChip(l: { readonly miles: number; readonly slope: SlopeId }, skyline = false): HaulChip {
  const f = distanceFactor(Math.max(0, Number(l.miles) || 0)) * slopeFactor(l.slope, skyline);
  const key: HaulEase = f >= HAUL_EASE.easy - 1e-9 ? 'easy' : f < HAUL_EASE.hard ? 'hard' : 'ok';
  return { key, factor: f, verdict: key === 'easy' ? 'good' : key === 'hard' ? 'bad' : 'even' };
}
