/**
 * Species rules as data plus pure helpers (docs/design/species-overhaul.md, slice 1:
 * the Cove trio made distinct). Grounds, weights, the seasonal-trait hook,
 * felling and bucking rules, species charter orders and the land office's
 * camp-fit hint.
 *
 * Slice 1 gives pine, spruce and hemlock their own rules. Maple, oak and
 * cloudwood keep the standard (pine) rules until slice 3.
 */
import { deepFreeze } from './freeze';
import { SPECIES, type Season, type SlopeId, type SpeciesId } from './content';
import { treeValue } from './formulas';
import { rngPick, rngRange, type Rng } from './rng';

/** Old save ids that map to a current species (`walnut` was renamed `cloudwood`). */
export const SPECIES_ALIAS: Readonly<Record<string, SpeciesId>> = deepFreeze({ walnut: 'cloudwood' });

/** A save's species id as a current SpeciesId (aliases applied); null when unknown. */
export function speciesId(id: unknown): SpeciesId | null {
  if (typeof id !== 'string') return null;
  if (Object.prototype.hasOwnProperty.call(SPECIES, id)) return id as SpeciesId;
  return SPECIES_ALIAS[id] ?? null;
}

// ---------- seasonal traits (the hook the seasons work composes with)

/**
 * Seasonal traits of a species, keyed by the calendar season (never by a
 * season event): `mult` scales the tree's value, `bark` adds dollars a tree.
 * Hemlock's peel season pays $14 a tree of tanbark in Spring and Summer;
 * maple felled in Winter is worth ×1.15, in Spring ×0.85 (sap stain).
 */
export interface SpeciesSeasonTrait { readonly mult: number; readonly bark: number }
export const SPECIES_SEASON: Readonly<Partial<Record<SpeciesId, Readonly<Partial<Record<Season, SpeciesSeasonTrait>>>>>> = deepFreeze({
  hemlock: { Spring: { mult: 1, bark: 14 }, Summer: { mult: 1, bark: 14 } },
  maple: { Winter: { mult: 1.15, bark: 0 }, Spring: { mult: 0.85, bark: 0 } },
});
/** Hemlock tanbark, dollars a tree in peel season. */
export const TANBARK = 14;

/** The seasonal trait of a species this season (×1, +$0 when it has none). */
export function speciesSeasonTrait(sp: SpeciesId, season: Season): SpeciesSeasonTrait {
  return SPECIES_SEASON[sp]?.[season] ?? { mult: 1, bark: 0 };
}

/** Value of one tree of this species felled this season: treeValue × mult + bark. */
export function speciesSeasonValue(sp: SpeciesId, season: Season): number {
  const t = speciesSeasonTrait(sp, season);
  return treeValue(SPECIES[sp]) * t.mult + t.bark;
}

/**
 * Felling-value factor for a tract mix this season: the mix-weighted seasonal
 * tree value over the plain one. The prototype multiplies a tract's per-tree
 * value by it when trees are felled, so hire jobs and perks scale alike.
 * Exactly 1 when no species in the mix has a trait this season.
 */
export function seasonValueFactor(mix: readonly (readonly [SpeciesId, number])[], season: Season): number {
  let plain = 0, now = 0, hit = false;
  for (const [id, w] of mix) {
    const sp = speciesId(id); if (!sp) continue;
    const v = treeValue(SPECIES[sp]);
    const t = SPECIES_SEASON[sp]?.[season];
    if (t) hit = true;
    plain += v * w; now += (t ? v * t.mult + t.bark : v) * w;
  }
  return hit && plain > 0 ? now / plain : 1;
}

// ---------- mixes

/** Weight-averaged skid and haul weight of a mix (pine = 1). */
export function mixWeight(mix: readonly (readonly [SpeciesId, number])[]): number {
  let wt = 0, w = 0;
  for (const [id, n] of mix) { const sp = speciesId(id); if (!sp) continue; wt += SPECIES[sp].wt * n; w += n; }
  return w > 0 ? wt / w : 1;
}

/** Share (0..1) of a species in a mix. */
export function mixShare(mix: readonly (readonly [SpeciesId, number])[], sp: SpeciesId): number {
  const tot = mix.reduce((a, m) => a + m[1], 0);
  return tot > 0 ? mix.reduce((a, m) => a + (m[0] === sp ? m[1] : 0), 0) / tot : 0;
}

/** The species with the biggest share of a mix (first on a tie). */
export function mainSpecies(mix: readonly (readonly [SpeciesId, number])[]): SpeciesId | null {
  let best: SpeciesId | null = null, bw = -Infinity;
  for (const [id, w] of mix) if (w > bw) { best = id; bw = w; }
  return best;
}

// ---------- grounds (land-office listings)

export type GroundId = 'coast' | 'headland' | 'swamp' | 'mixed';
export interface GroundDef {
  readonly id: GroundId; readonly name: string; readonly era: number;
  /** Main species and its share range in percent; absent on the legacy mixed stand. */
  readonly main?: SpeciesId; readonly mainW?: readonly [number, number];
  readonly rest?: readonly SpeciesId[];
  readonly slopes: readonly SlopeId[];
  /** Land price multiplier. */
  readonly landMult?: number;
  /** Felling-game wind multiplier. */
  readonly windMult?: number;
  /** One line for the listing card. */
  readonly twist?: string;
}
const ANY_SLOPE: readonly SlopeId[] = ['flat', 'flat', 'rolling', 'rolling', 'steep'];
export const GROUNDS: Readonly<Record<GroundId, GroundDef>> = deepFreeze({
  coast:    { id: 'coast', name: 'Coast bottoms', era: 0, main: 'pine', mainW: [60, 80], rest: ['spruce', 'hemlock'], slopes: ANY_SLOPE },
  headland: { id: 'headland', name: 'Spruce headland', era: 0, main: 'spruce', mainW: [60, 90], rest: ['pine'], slopes: ANY_SLOPE, windMult: 1.2,
    twist: 'Windy: felling-game wind ×1.2' },
  swamp:    { id: 'swamp', name: 'Hemlock swamp', era: 0, main: 'hemlock', mainW: [60, 90], rest: ['spruce'], slopes: ['flat', 'flat', 'rolling'], landMult: 0.9,
    twist: 'Flat or rolling only; land ×0.9' },
  // slice 1: later eras keep the old two-species draw until their own grounds land (slice 3)
  mixed:    { id: 'mixed', name: 'Mixed stand', era: 1, slopes: ANY_SLOPE },
});
/** Cove Landing grounds, in draw order. */
export const COVE_GROUNDS: readonly GroundId[] = deepFreeze(['coast', 'headland', 'swamp']);

/** A ground id from a save (unknown or missing → 'coast', the spec's default for old tracts). */
export function groundId(id: unknown): GroundId {
  return typeof id === 'string' && Object.prototype.hasOwnProperty.call(GROUNDS, id) ? id as GroundId : 'coast';
}

/**
 * A Cove ground's mix: main share rounded to 5%, the rest one other species.
 * Draws, in order: main share, rest species.
 */
export function groundMix(rng: Rng, g: GroundDef): [SpeciesId, number][] {
  const [lo, hi] = g.mainW ?? [60, 80];
  const w = Math.round(rngRange(rng, lo, hi) / 5) * 5;
  const rest = rngPick<SpeciesId>(rng, g.rest ?? ['pine']);
  return [[g.main ?? 'pine', w], [rest, 100 - w]];
}

// ---------- felling rules

export interface FellRules {
  /** Wind multiplier on the fall. */
  readonly wind: number;
  /** Green hinge zone (share of the stump), before Mill file. */
  readonly hinge: readonly [number, number];
  /** Back-cut speed multiplier. */
  readonly cut: number;
  /** Half-width of the opening, degrees. */
  readonly half: number;
  /** Seconds the tree takes to fall. */
  readonly fallS: number;
  /** Value lost when the tree lands on a rock. */
  readonly rockLoss: number;
  /** A hinge thinner than this barber-chairs (0: only a hinge cut right through). */
  readonly chairBelow: number;
  /** One-line species tag shown in the felling game. */
  readonly tag: string;
}
const FELL_STD: FellRules = { wind: 1, hinge: [0.08, 0.2], cut: 1, half: 10, fallS: 0.9, rockLoss: 0.4, chairBelow: 0, tag: '' };
export const FELL_RULES: Readonly<Partial<Record<SpeciesId, FellRules>>> = deepFreeze({
  pine: { ...FELL_STD, tag: 'Fogbound pine: the honest all-rounder. Standard wind, hinge and cut.' },
  spruce: { ...FELL_STD, wind: 1.5, cut: 1.25, fallS: 0.8,
    tag: 'Shore spruce: tall and shallow-rooted. The wind pushes it half again as hard, and the back cut goes quicker.' },
  hemlock: { ...FELL_STD, hinge: [0.1, 0.2], rockLoss: 0.6, chairBelow: 0.05,
    tag: 'Mist hemlock: brittle. The green hinge starts at 10%, a hinge under 5% barber-chairs, and a rock break loses 60%.' },
});

/** Felling rules for a species (the standard rules when it has none of its own yet). */
export function fellRules(sp: SpeciesId | string | null | undefined): FellRules {
  const id = speciesId(sp);
  return (id && FELL_RULES[id]) || { ...FELL_STD, tag: id ? `${SPECIES[id].name}: standard wind, hinge and cut.` : '' };
}

/** Green hinge zone for a species: Mill file widens every species alike (−2 points low, +5 high). */
export function hingeZone(sp: SpeciesId | string | null | undefined, file: boolean): [number, number] {
  const [lo, hi] = fellRules(sp).hinge;
  return file ? [Math.round((lo - 0.02) * 100) / 100, Math.round((hi + 0.05) * 100) / 100] : [lo, hi];
}

// ---------- bucking rules

export interface BuckRules {
  /** Stem length range, ft (drawn in 2 ft steps). */
  readonly L: readonly [number, number];
  /** Butt diameter range, in. */
  readonly d0: readonly [number, number];
  /** Smallest sawlog top, in. */
  readonly top: number;
  /** Knot count range (inclusive). */
  readonly knots: readonly [number, number];
  /** Knot positions as a share of the stem length. */
  readonly knotAt: readonly [number, number];
  /** Butt rot: chance, then length range in ft. */
  readonly rot: readonly [number, number, number];
  /** Chance of a sweep. */
  readonly sweep: number;
  /** Ring shake: chance, then band length range in ft; sawlogs crossing it are grade 3. */
  readonly shake?: readonly [number, number, number];
  /** Value multiplier by sawlog length. */
  readonly lenP: Readonly<Record<number, number>>;
  /** Shortest grade 1 log the scaler stamps Prime (score ≥ 90%). */
  readonly g1Prime: number;
  /** Bucking-game find weight multiplier for amber pitch (pitch pockets). */
  readonly pitchMult: number;
  /** One-line species tag shown in the bucking game. */
  readonly tag: string;
  /** The species rule in the bucking guide. */
  readonly guide: string;
}
const LEN_STD: Readonly<Record<number, number>> = { 8: 0.9, 10: 1, 12: 1.05, 14: 1.1, 16: 1.15 };
const BUCK_STD: BuckRules = { L: [38, 62], d0: [20, 32], top: 8, knots: [2, 4], knotAt: [0.3, 0.95], rot: [0.5, 2, 6], sweep: 0.45,
  lenP: LEN_STD, g1Prime: 12, pitchMult: 1, tag: '', guide: '' };
export const BUCK_RULES: Readonly<Partial<Record<SpeciesId, BuckRules>>> = deepFreeze({
  pine: { ...BUCK_STD, pitchMult: 2, tag: 'Fogbound pine: pitch pockets. Bucking finds amber pitch twice as often.',
    guide: '<b>Fogbound pine:</b> pitch pockets, so amber pitch turns up twice as often. 16 ft logs pay ×1.15.' },
  spruce: { ...BUCK_STD, L: [44, 66], d0: [16, 26], knots: [3, 5], knotAt: [0.5, 0.95], rot: [0.2, 2, 4], sweep: 0.2,
    lenP: { ...LEN_STD, 16: 1.25 }, g1Prime: 14,
    tag: 'Shore spruce: clear butt logs. Knots only in the top half, and 16 ft spar lengths pay ×1.25.',
    guide: '<b>Shore spruce:</b> knots only in the top half, so the butt logs run clear. 16 ft spar lengths pay ×1.25; Prime needs a grade 1 log of 14 ft.' },
  hemlock: { ...BUCK_STD, L: [36, 56], d0: [22, 34], knots: [2, 3], rot: [0.8, 4, 10], sweep: 0.3, shake: [0.4, 4, 6],
    lenP: { 8: 1, 10: 1, 12: 1, 14: 1, 16: 1 },
    tag: 'Mist hemlock: deep butt rot, and ring shake can drop a band of the stem to grade 3. Every length pays the same.',
    guide: '<b>Mist hemlock:</b> butt rot runs 4–10 ft, and ring shake makes any sawlog that crosses it grade 3. Every sawlog length pays the same.' },
});

/** Bucking rules for a species (the standard rules when it has none of its own yet). */
export function buckRules(sp: SpeciesId | string | null | undefined): BuckRules {
  const id = speciesId(sp);
  return (id && BUCK_RULES[id]) || { ...BUCK_STD, tag: id ? `${SPECIES[id].name}: standard stem.` : '' };
}

// ---------- species charter orders

/** Client and line for a species order (one regular charter order in three). */
export interface SpeciesClient { readonly client: string; readonly line: string }
export const SPECIES_CLIENTS: Readonly<Record<SpeciesId, SpeciesClient>> = deepFreeze({
  spruce: { client: 'the Admiralty spar yard', line: 'long straight spruce' },
  pine: { client: 'the Company shipwrights', line: 'pine for planking' },
  hemlock: { client: 'Landfall Pier Works', line: 'hemlock for pilings and pier decking' },
  maple: { client: 'Harbor Planing Mill', line: 'maple for flooring' },
  oak: { client: 'the Cove cooperage', line: 'oak for staves' },
  cloudwood: { client: 'the Landfall City works', line: 'cloudwood beams' },
});
/** Chance a regular charter order is a species order. */
export const SPECIES_ORDER_CHANCE = 1 / 3;
/** Species order premium range (any wood pays 15–40%). */
export const SPECIES_ORDER_PREM: readonly [number, number] = deepFreeze([0.3, 0.55]);
/** Share used to size a species order for a species not in the current tract. */
export const SPECIES_ORDER_OFF_TRACT = 0.6;

// ---------- the land office: what a lot is good for, and how it fits the camp

/** "Best for" line per species. */
export const BEST_FOR: Readonly<Record<SpeciesId, string>> = deepFreeze({
  pine: 'boards and amber pitch', spruce: 'Prime spars (3 from a perfect fall)', hemlock: 'tanbark in Spring and Summer',
  maple: 'boards', oak: 'boards', cloudwood: 'big timber',
});

/** Weight tag for a listing: skid and haul move ÷ weight (light under 0.97, heavy over 1.03). */
export function weightTag(wt: number): { key: 'light' | 'average' | 'heavy'; text: string } {
  const f = Math.round(100 / wt) / 100;
  if (wt < 0.97) return { key: 'light', text: `Light: skid and haul ×${f}` };
  if (wt > 1.03) return { key: 'heavy', text: `Heavy: skid and haul ×${f}` };
  return { key: 'average', text: 'Average weight' };
}

export interface CampCaps {
  /** Felling, chops per second. */
  readonly fell: number;
  /** Bucking, bd ft per second. */
  readonly buck: number;
  /** Skidding and hauling, bd ft per second for pine-weight wood (before ÷ weight). */
  readonly skid: number;
  readonly haul: number;
}
/** Hint thresholds: fallers/teams ratio above TEAMS_SHORT or below FALLERS_SHORT. */
export const CAMP_FIT_TEAMS_SHORT = 1.25;
export const CAMP_FIT_FALLERS_SHORT = 0.8;
export interface CampFit { readonly key: 'none' | 'good' | 'teams' | 'fallers'; readonly ratio: number; readonly text: string }

/**
 * Camp fit for a lot: your felling capacity on its trees (chops ÷ hp × bf)
 * against your skid and haul capacity on its wood (the slower of the two,
 * ÷ the lot's weight).
 */
export function campFit(c: CampCaps, t: { readonly hp: number; readonly bf: number; readonly wt: number }): CampFit {
  const fell = t.hp > 0 ? c.fell / t.hp * t.bf : 0;
  const move = Math.min(c.skid, c.haul) / (t.wt || 1);
  if (!(fell > 0) || !(move > 0)) return { key: 'none', ratio: 0, text: 'Camp fit: hire fallers and teams to see how this lot suits your camp.' };
  const ratio = fell / move;
  if (ratio > CAMP_FIT_TEAMS_SHORT) return { key: 'teams', ratio, text: 'Camp fit: your fallers are ahead of your teams here, so this wood will pile up at the stump. Lighter wood suits this camp.' };
  if (ratio < CAMP_FIT_FALLERS_SHORT) return { key: 'fallers', ratio, text: 'Camp fit: your teams are ahead of your fallers here. Heavy, easy-felling wood suits this camp.' };
  return { key: 'good', ratio, text: 'Camp fit: good. Your fallers and teams are matched on this wood.' };
}

/**
 * Bd ft per second the camp would work on a lot: the slowest of felling
 * (chops ÷ hp × bf), bucking, and skidding and hauling ÷ weight (hauling also
 * × distance factor).
 */
export function tractThroughput(c: CampCaps, t: { readonly hp: number; readonly bf: number; readonly wt: number }, distance = 1): number {
  const wt = t.wt || 1;
  return Math.min(t.hp > 0 ? c.fell / t.hp * t.bf : 0, c.buck, c.skid / wt, c.haul * distance / wt);
}

/**
 * A buyer's score for a listing, "best value per work for my camp": value per
 * dollar of land (× distance factor) times the dollars a second the camp would
 * earn on it. With no crews the throughput floors at a token rate, so the
 * score falls back to value per dollar and value per bd ft.
 */
export function tractScore(c: CampCaps, t: { readonly hp: number; readonly bf: number; readonly wt: number; readonly trees: number; readonly val: number; readonly price?: number }, distance = 1): number {
  const thr = Math.max(0.01, tractThroughput(c, t, distance));
  return (t.trees * t.val * distance / Math.max(1, t.price ?? 1)) * thr * (t.bf > 0 ? t.val / t.bf : 0);
}
