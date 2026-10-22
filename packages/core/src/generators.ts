/**
 * Procedural generation with an injected RNG (tech plan M2): land-office
 * tracts, cut-for-hire jobs, charter orders, tree picks and perk drafts.
 *
 * Draw order is part of the contract. Each function documents the order of
 * its rng() calls; the seeded sim baseline depends on it.
 */
import {
  ERA_SPECIES, MILLS, PERKS, PLACES, RARITY, SLOPES, SPECIES, TRACT_BASE,
  type PerkDef, type Rarity, type SlopeId, type SpeciesId,
} from './content';
import { treeValue } from './formulas';
import { rngPick, rngRange, type Rng } from './rng';

/** A species and its weight in a tract's mix. Mutable tuples: tracts live in the save. */
export type MixEntry = [SpeciesId, number];

export interface Tract {
  name: string;
  mix: MixEntry[];
  trees: number;
  left: number;
  miles: number;
  slope: SlopeId;
  /** Average chops to fell one tree. */
  hp: number;
  /** Average board feet per tree. */
  bf: number;
  /** Average dollar value per tree. */
  val: number;
  road: boolean;
  /** Asking price; present on land-office listings only. */
  price?: number;
  hire?: { mill: string; rate: number };
}

/** Build a tract with weight-averaged tree stats. No randomness. */
export function makeTract(name: string, mix: MixEntry[], trees: number, miles: number, slope: SlopeId): Tract {
  let hp = 0, bf = 0, val = 0, w = 0;
  mix.forEach(([id, wt]) => { const s = SPECIES[id]; hp += s.hp * wt; bf += s.bf * wt; val += treeValue(s) * wt; w += wt; });
  return { name, mix, trees, left: trees, miles, slope, hp: hp / w, bf: bf / w, val: val / w, road: false };
}

function lotName(rng: Rng): string {
  // draws: place, lot number
  return `${rngPick(rng, PLACES)}, Lot ${Math.floor(rngRange(rng, 2, 40))}`;
}

export interface TractListingOpts {
  /** Product of 'stump' perk multipliers (Friendly land agent). */
  readonly stumpMult: number;
  /** Thin survey clause: listings carry 20% fewer trees. */
  readonly thinSurvey: boolean;
  /** Timber cruiser perk: listings carry 25% more trees. */
  readonly cruiser: boolean;
}

/**
 * A land-office listing for the current era.
 * Draws, in order: older-tier roll, species a, species b, weight, trees, miles, slope, place, lot.
 */
export function genTract(rng: Rng, era: number, o: TractListingOpts): Tract {
  const tier = Math.max(0, era - (rng() < 0.3 ? 1 : 0));
  const pool = ERA_SPECIES[era] ?? [];
  const a = rngPick(rng, pool);
  let b = rngPick(rng, pool);
  if (b === a) b = pool[(pool.indexOf(a) + 1) % pool.length] as SpeciesId;
  const wa = Math.round(rngRange(rng, 5, 8));
  const mix: MixEntry[] = [[a, wa], [b, 10 - wa]];
  const trees = Math.round((TRACT_BASE[tier] ?? 0) * rngRange(rng, 0.6, 1.5));
  const miles = Math.round(rngRange(rng, 1, 12) * 2) / 2;
  const slope = rngPick<SlopeId>(rng, ['flat', 'flat', 'rolling', 'rolling', 'steep']);
  const t = makeTract(lotName(rng), mix, trees, miles, slope);
  t.price = tractPrice(t.trees * t.val, miles, slope, o.stumpMult);
  const sz = (o.thinSurvey ? 0.8 : 1) * (o.cruiser ? 1.25 : 1);
  if (sz !== 1) { t.trees = t.left = Math.max(5, Math.round(t.trees * sz)); }
  return t;
}

/** Cutting-rights price: 42% of gross value, cheaper with distance (floor 55%) and slope. */
export function tractPrice(gross: number, miles: number, slope: SlopeId, stumpMult: number): number {
  return Math.round(gross * 0.42 * Math.max(0.55, 1.12 - 0.04 * miles) * SLOPES[slope].disc * stumpMult);
}

/** One-off cost to build a haul road into a bought tract. */
export function roadCost(t: Pick<Tract, 'trees' | 'val'>): number {
  return Math.round(t.trees * t.val * 0.07);
}

/** Haul distance after building a road: halved, rounded to half a mile, at least 0.5. */
export function milesWithRoad(miles: number): number {
  return Math.max(0.5, Math.round(miles / 2 * 2) / 2);
}

/** Cut-for-hire jobs pay this share of market value. */
export const HIRE_RATE = 0.45;

/**
 * A cut-for-hire job (bigger and closer than listings, paid at HIRE_RATE).
 * Draws, in order: species a, species b, weight, place, lot, trees, miles, slope, mill.
 */
export function genHire(rng: Rng, era: number): Tract {
  const pool = ERA_SPECIES[era] ?? [];
  const a = rngPick(rng, pool), b = rngPick(rng, pool.filter((x) => x !== a));
  const wa = Math.round(rngRange(rng, 5, 8));
  const name = lotName(rng);
  const trees = Math.round((TRACT_BASE[era] ?? 0) * rngRange(rng, 1, 1.5));
  const miles = Math.round(rngRange(rng, 1, 4) * 2) / 2;
  const slope = rngPick<SlopeId>(rng, ['flat', 'flat', 'rolling']);
  const t = makeTract(name, [[a, wa], [b, 10 - wa]], trees, miles, slope);
  t.hire = { mill: rngPick(rng, MILLS), rate: HIRE_RATE };
  t.val *= t.hire.rate;
  return t;
}

export interface Offer { mill: string; vol: number; dur: number; prem: number; penalty: number }

/**
 * A charter order sized to haul capacity (bd ft/s, floor 8): volume over a
 * 4-8 minute window, rounded to two significant figures.
 * `perBf` is the current tract's value per board foot (0.2 with no tract).
 * Draws, in order: duration, volume share, mill, premium.
 */
export function genOffer(rng: Rng, haulCapacity: number, perBf: number): Offer {
  const cap = Math.max(8, haulCapacity);
  const dur = Math.round(rngRange(rng, 240, 480) / 30) * 30;
  const raw = Math.max(2000, cap * dur * rngRange(rng, 0.4, 0.75));
  const mag = Math.pow(10, Math.floor(Math.log10(raw)) - 1);
  const vol = Math.round(raw / mag) * mag;
  return { mill: rngPick(rng, MILLS), vol, dur, prem: Math.round(rngRange(rng, 0.15, 0.4) * 100) / 100, penalty: Math.round(vol * perBf * 0.25) };
}

/** Weighted pick of a species from a tract mix. One draw. Null only if float rounding exhausts the loop. */
export function pickFromMix(rng: Rng, mix: readonly (readonly [SpeciesId, number])[]): SpeciesId | null {
  const tot = mix.reduce((a, m) => a + m[1], 0);
  let r = rng() * tot;
  for (const [id, w] of mix) { r -= w; if (r <= 0) return id; }
  return null;
}

// ---------- perk drafts

/** Perks that can be offered: set-2 perks need Old Reach hands; non-commons appear once per run. */
export function draftPool(drafted: readonly string[], lore: boolean): PerkDef[] {
  return PERKS.filter((p) => (!p.set || lore) && (p.r === 'common' || !drafted.includes(p.id)));
}

/** Draft weight of a rarity at draft quality q (0..1): better runs favour rare and legendary perks. */
export function draftWeight(r: Rarity, q: number): number {
  return RARITY[r].w * (r === 'rare' ? 1 + 1.2 * q : r === 'legendary' ? 1 + 4 * q * q : r === 'curse' ? 1 + 0.5 * q : 1);
}

/** Roll `n` distinct perk ids from `pool` by weight. One draw per card. */
export function rollDraft(rng: Rng, pool: readonly PerkDef[], n: number, q: number): string[] {
  const left = pool.slice(), out: string[] = [];
  const w = (p: PerkDef) => draftWeight(p.r, q);
  while (out.length < n && left.length) {
    const tot = left.reduce((a, p) => a + w(p), 0);
    let x = rng() * tot, i = 0;
    for (; i < left.length - 1; i++) { x -= w(left[i] as PerkDef); if (x <= 0) break; }
    out.push((left[i] as PerkDef).id);
    left.splice(i, 1);
  }
  return out;
}
