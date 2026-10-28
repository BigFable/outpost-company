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
import { deepFreeze } from './freeze';
import { treeValue } from './formulas';
import { rngPick, rngRange, type Rng } from './rng';
import {
  COVE_GROUNDS, GROUNDS, groundMix, mixWeight, SPECIES_CLIENTS, SPECIES_ORDER_CHANCE, SPECIES_ORDER_OFF_TRACT, SPECIES_ORDER_PREM, type GroundId,
} from './species';

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
  /** Ground type (species overhaul): sets the mix and its twist. */
  ground: GroundId;
  /** Mix-weighted skid and haul weight (pine = 1): idle skidding and hauling move bd ft ÷ wt. */
  wt: number;
  /** Asking price; present on land-office listings only. */
  price?: number;
  hire?: { mill: string; rate: number };
  /** The AFK lot: a big, poor, cheap cutover to leave the camp running on. */
  afk?: boolean;
}

/** Build a tract with weight-averaged tree stats (and skid/haul weight). No randomness. */
export function makeTract(name: string, mix: MixEntry[], trees: number, miles: number, slope: SlopeId, ground: GroundId = 'coast'): Tract {
  let hp = 0, bf = 0, val = 0, w = 0;
  mix.forEach(([id, wt]) => { const s = SPECIES[id]; hp += s.hp * wt; bf += s.bf * wt; val += treeValue(s) * wt; w += wt; });
  return { name, mix, trees, left: trees, miles, slope, hp: hp / w, bf: bf / w, val: val / w, road: false, ground, wt: mixWeight(mix) };
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
 * Draws, in order: older-tier roll, then
 * - on Cove ground (era 0, or the older-tier roll down to Cove Landing): ground, main share, rest species, trees, miles, slope, place, lot;
 * - otherwise (the slice-1 mixed stand): species a, species b, weight, trees, miles, slope, place, lot.
 * Nine draws either way. Hemlock swamps are flat or rolling and price ×0.9.
 */
export function genTract(rng: Rng, era: number, o: TractListingOpts): Tract {
  const tier = Math.max(0, era - (rng() < 0.3 ? 1 : 0));
  let mix: MixEntry[], ground: GroundId;
  if (tier === 0) {
    ground = rngPick(rng, COVE_GROUNDS);
    mix = groundMix(rng, GROUNDS[ground]);
  } else {
    ground = 'mixed';
    const pool = ERA_SPECIES[era] ?? [];
    const a = rngPick(rng, pool);
    let b = rngPick(rng, pool);
    if (b === a) b = pool[(pool.indexOf(a) + 1) % pool.length] as SpeciesId;
    const wa = Math.round(rngRange(rng, 5, 8));
    mix = [[a, wa], [b, 10 - wa]];
  }
  const g = GROUNDS[ground];
  const trees = Math.round((TRACT_BASE[tier] ?? 0) * rngRange(rng, 0.6, 1.5));
  const miles = Math.round(rngRange(rng, 1, 12) * 2) / 2;
  const slope = rngPick<SlopeId>(rng, g.slopes);
  const t = makeTract(lotName(rng), mix, trees, miles, slope, ground);
  t.price = tractPrice(t.trees * t.val, miles, slope, o.stumpMult * (g.landMult ?? 1));
  const sz = (o.thinSurvey ? 0.8 : 1) * (o.cruiser ? 1.25 : 1);
  if (sz !== 1) { t.trees = t.left = Math.max(5, Math.round(t.trees * sz)); }
  return t;
}

/**
 * After a push inland the land office always lists at least one tract priced
 * at or under this share of that push's price, so a camp that spent its cash
 * on the push can still buy timber (Steam Camp cash trap fix).
 */
export const PUSH_TRACT_SHARE = 0.5;

/** Price ceiling for the guaranteed listing after pushing to an era that cost `pushCost`. */
export function pushTractCap(pushCost: number): number {
  return Math.floor(pushCost * PUSH_TRACT_SHARE);
}

/**
 * The same listing with fewer trees, so its price is at most `maxPrice`. No
 * draws. Price is linear in trees, so price per tree is kept; at least 1 tree.
 * Returns the tract unchanged when it already fits.
 */
export function fitTractPrice(t: Tract, maxPrice: number): Tract {
  const price = t.price ?? 0;
  if (price <= maxPrice || t.trees <= 0) return t;
  const trees = Math.max(1, Math.floor(t.trees * maxPrice / price));
  return { ...t, trees, left: trees, price: Math.min(Math.round(price * trees / t.trees), Math.max(0, Math.floor(maxPrice))) };
}

/**
 * Make sure at least one listing is priced at or under `maxPrice`: when none is,
 * the cheapest listing (lowest index on a tie) is shrunk with fitTractPrice.
 * No draws, so it never changes the rng sequence.
 */
export function ensureAffordableListing(listings: readonly Tract[], maxPrice: number): Tract[] {
  const out = listings.slice();
  if (!out.length || out.some((t) => (t.price ?? 0) <= maxPrice)) return out;
  let j = 0;
  out.forEach((t, i) => { if ((t.price ?? 0) < ((out[j] as Tract).price ?? 0)) j = i; });
  out[j] = fitTractPrice(out[j] as Tract, maxPrice);
  return out;
}

/**
 * A full land-office board of `n` listings. Draws: n × genTract, in slot order
 * (the old three genTract() calls). With `maxPrice` set, ensureAffordableListing
 * runs afterwards and draws nothing more.
 */
export function genListings(rng: Rng, era: number, o: TractListingOpts, n = 3, maxPrice?: number): Tract[] {
  const out: Tract[] = [];
  for (let i = 0; i < n; i++) out.push(genTract(rng, era, o));
  return maxPrice === undefined ? out : ensureAffordableListing(out, maxPrice);
}

// ---------- the AFK lot (owner request 2026-10-25): a lot you buy before going away so the camp never runs out of timber

/** AFK lot numbers (balance agent to tune). Trees are × TRACT_BASE[era]; per-tree stats multiply the mix average. */
export const AFK_LOT = deepFreeze({
  /** Chance a fresh land-office board carries one (never more than one; owner-approved 2026-10-25: always one). */
  chance: 1,
  /** Trees, × a normal tract for the era (a normal listing draws 0.6-1.5; owner-approved 2026-10-25: was 4-6). */
  trees: [12, 18] as readonly [number, number],
  /** Small second-growth stems: board feet and chops per tree. */
  bfMult: 0.7, hpMult: 0.75,
  /** Poor grade, more pulp: value per tree (value per bd ft is valMult ÷ bfMult, about 0.71). */
  valMult: 0.5,
  /** Land price on top of the usual 42% of gross (cheaper per tree; owner-approved 2026-10-25: was 0.8). */
  landMult: 0.4,
  /** Close to the cove: haul miles. */
  miles: [1, 3] as readonly [number, number],
});
/** The AFK lot's mix per era: the common conifers, pine-led. */
export const AFK_MIX: readonly (readonly (readonly [SpeciesId, number])[])[] = deepFreeze([
  [['pine', 50], ['hemlock', 30], ['spruce', 20]],
  [['pine', 50], ['hemlock', 30], ['spruce', 20]],
  [['pine', 45], ['hemlock', 35], ['spruce', 20]],
  [['pine', 40], ['hemlock', 40], ['spruce', 20]],
]);

/**
 * An AFK lot for the era: 12-18× the trees of a normal tract, small poor stems,
 * flat or rolling, 1-3 mi out, land ×0.4. Draws, in order: trees, miles,
 * slope, place, lot. The prototype feeds it its own stream ('land'), so the
 * board's other draws are untouched.
 */
export function genAfkLot(rng: Rng, era: number, o: TractListingOpts): Tract {
  const e = Math.max(0, Math.min(TRACT_BASE.length - 1, era));
  const trees = Math.round((TRACT_BASE[e] ?? 60) * rngRange(rng, AFK_LOT.trees[0], AFK_LOT.trees[1]));
  const miles = Math.round(rngRange(rng, AFK_LOT.miles[0], AFK_LOT.miles[1]) * 2) / 2;
  const g = GROUNDS.cutover, slope = rngPick<SlopeId>(rng, g.slopes);
  const mix: MixEntry[] = (AFK_MIX[e] ?? []).map((m) => [m[0], m[1]] as MixEntry);
  const t = makeTract(lotName(rng), mix, trees, miles, slope, 'cutover');
  t.bf *= AFK_LOT.bfMult; t.hp *= AFK_LOT.hpMult; t.val *= AFK_LOT.valMult; t.afk = true;
  t.price = tractPrice(t.trees * t.val, miles, slope, o.stumpMult * AFK_LOT.landMult);
  const sz = (o.thinSurvey ? 0.8 : 1) * (o.cruiser ? 1.25 : 1);
  if (sz !== 1) { t.trees = t.left = Math.max(5, Math.round(t.trees * sz)); }
  return t;
}

// ---------- land office lot slots (owner-approved 2026-10-28, docs/design/lot-slots.md section 5)

/** One land-office slot: how many species its lot carries and how many lifetime lots cut out open it. */
export interface LotSlot {
  readonly name: string;
  /** Species on the slot's lot (the AFK lot's mix is fixed). */
  readonly species: number;
  /** Lifetime lots cut out (`stats.tracts`) that open the slot. */
  readonly need: number;
  /** The lot carries one rare tree (the next era's new species) at RARE_SHARE. */
  readonly rare?: boolean;
  /** The slot lists the AFK lot. */
  readonly afk?: boolean;
}

/**
 * The four slots, one listing each. Slot 1 is today's listing (genTract, with the
 * push-tract price guarantee); slots 2 and 3 list genRichTract lots; slot 4 the AFK lot.
 * Unlocks count lifetime lots cut out, so they stay open through close camp.
 */
export const LOT_SLOTS: readonly LotSlot[] = deepFreeze([
  { name: 'Company lot', species: 2, need: 0 },
  { name: 'Surveyed lot', species: 3, need: 2 },
  { name: "Cruiser's pick", species: 4, need: 3, rare: true },
  { name: 'AFK lot', species: 3, need: 4, afk: true },
]);

/** Main species share on a rich lot, and the rare tree's share (percent). */
export const RICH_MAIN_SHARE: readonly [number, number] = deepFreeze([40, 60]);
export const RARE_SHARE: readonly [number, number] = deepFreeze([10, 20]);
/** Smallest share of any other species on a rich lot (percent). */
export const RICH_MIN_SHARE = 5;

/** How many slots are open after `lotsCutOut` lifetime lots (slot 1 always). */
export function slotsOpen(lotsCutOut: number): number {
  const n = Math.max(0, Number(lotsCutOut) || 0);
  let k = 0;
  while (k < LOT_SLOTS.length && n >= (LOT_SLOTS[k] as LotSlot).need) k++;
  return Math.max(1, k);
}

/** Lots still to cut out before slot `k` (0-based) opens; 0 when open. */
export function lotsToOpen(k: number, lotsCutOut: number): number {
  const s = LOT_SLOTS[k];
  return s ? Math.max(0, s.need - Math.max(0, Number(lotsCutOut) || 0)) : 0;
}

/** The rare tree for slot 3 in an era: the next era's new species; in the last era its newest species (cloudwood). */
export function rareSpecies(era: number): SpeciesId | null {
  const e = Math.max(0, Math.min(ERA_SPECIES.length - 1, era));
  const pool = ERA_SPECIES[e] ?? [], next = ERA_SPECIES[e + 1];
  const nx = next ? next.filter((x) => !pool.includes(x)) : [];
  return nx[0] ?? pool[pool.length - 1] ?? null;
}

/**
 * Species a charter order may name: the era's pool, plus slot 3's rare tree
 * once slot 3 is open (charter orders only ask for trees you can get now).
 */
export function orderSpeciesPool(era: number, open: number): SpeciesId[] {
  const e = Math.max(0, Math.min(ERA_SPECIES.length - 1, era));
  const out = (ERA_SPECIES[e] ?? []).slice();
  const r = rareSpecies(era);
  if (open >= 3 && r && !out.includes(r)) out.push(r);
  return out;
}

/**
 * A slot 2 or slot 3 lot: `n` species from the current era (no older-tier roll),
 * main species 40–60%, the others split the rest (each at least 5%); with `rare`,
 * one of the n is the era's rare tree at 10–20%. Era 0 lots take the main
 * species' Cove ground (pine coast, spruce point, hemlock swamp); later eras are
 * mixed stands. Same size and price formula as genTract.
 * Draws, in order: one per picked era species (n, or n − 1 with rare), main
 * share, rare share (with rare), one weight per other era species, trees,
 * miles, slope, place, lot.
 */
export function genRichTract(rng: Rng, era: number, n: number, rare: boolean, o: TractListingOpts): Tract {
  const e = Math.max(0, Math.min(ERA_SPECIES.length - 1, era));
  const r = rare ? rareSpecies(e) : null;
  const base = (ERA_SPECIES[e] ?? []).filter((x) => x !== r);
  const pick: SpeciesId[] = [];
  while (pick.length < (r ? n - 1 : n) && base.length) pick.push(base.splice(Math.floor(rng() * base.length), 1)[0] as SpeciesId);
  const mainW = Math.round(rngRange(rng, RICH_MAIN_SHARE[0], RICH_MAIN_SHARE[1]));
  const rareW = r ? Math.round(rngRange(rng, RARE_SHARE[0], RARE_SHARE[1])) : 0;
  const rest = 100 - mainW - rareW, others = pick.slice(1);
  const ws = others.map(() => 0.5 + rng()), tot = ws.reduce((a, b) => a + b, 0);
  const mix: MixEntry[] = [[pick[0] ?? 'pine', mainW]];
  others.forEach((x, i) => mix.push([x, Math.max(RICH_MIN_SHARE, Math.round(rest * (ws[i] as number) / tot))]));
  if (r) mix.push([r, rareW]);
  const cove: Partial<Record<SpeciesId, GroundId>> = { pine: 'coast', spruce: 'headland', hemlock: 'swamp' };
  const ground: GroundId = e === 0 ? (cove[pick[0] ?? 'pine'] ?? 'coast') : 'mixed';
  const g = GROUNDS[ground];
  const trees = Math.round((TRACT_BASE[e] ?? 0) * rngRange(rng, 0.6, 1.5));
  const miles = Math.round(rngRange(rng, 1, 12) * 2) / 2;
  const slope = rngPick<SlopeId>(rng, g.slopes);
  const t = makeTract(lotName(rng), mix, trees, miles, slope, ground);
  t.price = tractPrice(t.trees * t.val, miles, slope, o.stumpMult * (g.landMult ?? 1));
  const sz = (o.thinSurvey ? 0.8 : 1) * (o.cruiser ? 1.25 : 1);
  if (sz !== 1) { t.trees = t.left = Math.max(5, Math.round(t.trees * sz)); }
  return t;
}

/** Charter orders shown on the board at once (owner request 2026-10-25; was 2). */
export const OFFER_BOARD_SIZE = 4;

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
  const t = makeTract(name, [[a, wa], [b, 10 - wa]], trees, miles, slope, 'mixed');
  t.hire = { mill: rngPick(rng, MILLS), rate: HIRE_RATE };
  t.val *= t.hire.rate;
  return t;
}

/** A regular charter order. `sp` marks a species order: only that species' share of each delivery counts, and missing it costs nothing. */
export interface Offer { mill: string; vol: number; dur: number; prem: number; penalty: number; sp?: SpeciesId }

/** Species a species order may name, and each one's share of the current tract (for sizing the order). */
export interface OfferSpeciesOpts {
  readonly species: readonly SpeciesId[];
  readonly share: Readonly<Partial<Record<SpeciesId, number>>>;
}

const sig2 = (raw: number): number => { const mag = Math.pow(10, Math.floor(Math.log10(raw)) - 1); return Math.round(raw / mag) * mag; };

/**
 * A charter order sized to haul capacity (bd ft/s, floor 8): volume over a
 * 4-8 minute window, rounded to two significant figures.
 * `perBf` is the current tract's value per board foot (0.2 with no tract).
 * Draws, in order: duration, volume share, mill, premium; then, only with
 * `so` naming at least one species: species roll, and on a hit (1 in 3) the
 * species and its premium. A species order is sized by that species' share
 * of the current tract (SPECIES_ORDER_OFF_TRACT when it is not in it), pays
 * +30–55%, names the species' client and carries no penalty.
 */
export function genOffer(rng: Rng, haulCapacity: number, perBf: number, so?: OfferSpeciesOpts): Offer {
  const cap = Math.max(8, haulCapacity);
  const dur = Math.round(rngRange(rng, 240, 480) / 30) * 30;
  const raw = Math.max(2000, cap * dur * rngRange(rng, 0.4, 0.75));
  const vol = sig2(raw);
  const o: Offer = { mill: rngPick(rng, MILLS), vol, dur, prem: Math.round(rngRange(rng, 0.15, 0.4) * 100) / 100, penalty: Math.round(vol * perBf * 0.25) };
  if (!so || !so.species.length || rng() >= SPECIES_ORDER_CHANCE) return o;
  const sp = rngPick(rng, so.species);
  const share = so.share[sp] ?? 0;
  o.sp = sp;
  o.mill = SPECIES_CLIENTS[sp].client;
  o.vol = Math.max(1000, sig2(raw * (share > 0 ? share : SPECIES_ORDER_OFF_TRACT)));
  o.prem = Math.round(rngRange(rng, SPECIES_ORDER_PREM[0], SPECIES_ORDER_PREM[1]) * 100) / 100;
  o.penalty = 0;
  return o;
}

/** Weighted pick of a species from a tract mix. One draw. Null only if float rounding exhausts the loop. */
export function pickFromMix(rng: Rng, mix: readonly (readonly [SpeciesId, number])[]): SpeciesId | null {
  const tot = mix.reduce((a, m) => a + m[1], 0);
  let r = rng() * tot;
  for (const [id, w] of mix) { r -= w; if (r <= 0) return id; }
  return null;
}

// ---------- perk drafts

/**
 * Perks that can be offered: set-2 perks need Old Reach hands; non-commons appear once per run;
 * a perk with `cap` needs at least that many active charter orders (`orderCap`, default 1).
 */
export function draftPool(drafted: readonly string[], lore: boolean, orderCap = 1): PerkDef[] {
  return PERKS.filter((p) => (!p.set || lore) && (p.r === 'common' || !drafted.includes(p.id)) && (!p.cap || orderCap >= p.cap));
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
