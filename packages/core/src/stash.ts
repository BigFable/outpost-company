/**
 * The lot stash (docs/design/lot-stash-and-camp-money.md, part A, slice 1):
 * a tree count per species on each lot, a rule per species (Any, First,
 * Skip), which trees crews cut under those rules, and what picking costs.
 * Pure helpers, no randomness.
 *
 * Counts (`Stand`) may be fractional: under Any every species is felled in
 * proportion, so a lot's mix never drifts. Show them rounded.
 */
import { deepFreeze } from './freeze';
import { SPECIES, type SpeciesId } from './content';
import { treeValue } from './formulas';
import { mainSpecies, mixWeight, speciesId } from './species';

export type StashRule = 'any' | 'first' | 'skip';
export const STASH_RULES: readonly StashRule[] = deepFreeze(['any', 'first', 'skip']);
export const STASH_RULE_LABEL: Readonly<Record<StashRule, string>> = deepFreeze({ any: 'Any', first: 'First', skip: 'Skip' });
export type StashRules = Partial<Record<SpeciesId, StashRule>>;

/** Trees standing per species on one lot. */
export type Stand = Partial<Record<SpeciesId, number>>;

/** A species counts as standing from half a tree (it shows as 1). */
export const STAND_MIN = 0.5;

/** The picking cost: felling and skidding run at 0.5 + 0.5 × the share of the lot's standing trees being cut. */
export function pickFactor(share: number): number {
  return 0.5 + 0.5 * Math.max(0, Math.min(1, share));
}

/** The rule for a species (Any when unset or unknown). */
export function stashRule(rules: StashRules | null | undefined, sp: SpeciesId): StashRule {
  const r = rules ? rules[sp] : undefined;
  return r === 'first' || r === 'skip' ? r : 'any';
}

/** True when every species is on Any (today's behaviour). */
export function rulesAllAny(rules: StashRules | null | undefined): boolean {
  if (!rules) return true;
  for (const k in rules) { const r = (rules as Record<string, unknown>)[k]; if (r === 'first' || r === 'skip') return false; }
  return true;
}

/** Sum of a stand. */
export function standTotal(stand: Stand): number {
  let n = 0;
  for (const k in stand) n += Math.max(0, (stand as Record<string, number>)[k] ?? 0);
  return n;
}

/**
 * A stand from a lot's mix and its trees left (save migration and new lots):
 * round(left × share) per species, the remainder to the main species. Whole trees.
 */
export function standFromMix(mix: readonly (readonly [SpeciesId, number])[], left: number): Stand {
  const out: Stand = {}, n = Math.max(0, Math.round(left));
  const tot = mix.reduce((a, m) => a + Math.max(0, m[1]), 0);
  const main = mainSpecies(mix);
  if (!main || tot <= 0) { if (n > 0) out.pine = n; return out; }
  let given = 0;
  for (const [id, w] of mix) {
    const c = Math.round(n * Math.max(0, w) / tot);
    out[id] = (out[id] ?? 0) + c; given += c;
  }
  out[main] = (out[main] ?? 0) + (n - given);
  // rounding may overshoot: take any excess back from the biggest counts, never below 0
  for (const id of Object.keys(out) as SpeciesId[]) {
    if ((out[id] as number) < 0) {
      let debt = -(out[id] as number); out[id] = 0;
      for (const [o] of mix) { if (debt <= 0) break; const c = out[o] ?? 0; const d = Math.min(c, debt); out[o] = c - d; debt -= d; }
    }
  }
  return out;
}

/**
 * A lot's stand made sound: a missing or broken one comes from the mix; one
 * whose sum is off from `left` is rescaled to it (keeping its proportions).
 */
export function fixStand(stand: unknown, mix: readonly (readonly [SpeciesId, number])[], left: number): Stand {
  const L = Math.max(0, left);
  if (!stand || typeof stand !== 'object' || Array.isArray(stand)) return standFromMix(mix, L);
  const out: Stand = {};
  for (const [k, v] of Object.entries(stand as Record<string, unknown>)) {
    const id = speciesId(k), n = typeof v === 'number' && isFinite(v) ? Math.max(0, v) : 0;
    if (id && n > 0) out[id] = (out[id] ?? 0) + n;
  }
  const tot = standTotal(out);
  if (tot <= 0) return standFromMix(mix, L);
  if (Math.abs(tot - L) > 1e-6) for (const k of Object.keys(out) as SpeciesId[]) out[k] = (out[k] as number) * L / tot;
  return out;
}

/** Species standing on a lot, in the lot's mix order (then any others). */
export function standingSpecies(stand: Stand, mix: readonly (readonly [SpeciesId, number])[]): SpeciesId[] {
  const out: SpeciesId[] = [];
  for (const [id] of mix) if (!out.includes(id) && (stand[id] ?? 0) >= STAND_MIN) out.push(id);
  for (const k of Object.keys(stand) as SpeciesId[]) if (!out.includes(k) && (stand[k] ?? 0) >= STAND_MIN) out.push(k);
  return out;
}

export interface CutPlan {
  /** Species crews fell now. */
  readonly species: readonly SpeciesId[];
  /**
   * 'all': every species standing (no picking); 'first': only the First species;
   * 'rest': everything not Skipped; 'skipped': only Skipped trees are left, so crews cut them.
   */
  readonly mode: 'all' | 'first' | 'rest' | 'skipped';
  /** Share of the lot's standing trees being cut (1 under 'all'). */
  readonly share: number;
  /** Felling and skidding factor: exactly 1 under 'all'. */
  readonly factor: number;
  /** Trees of the cut species standing. */
  readonly count: number;
  /** True when only some species are cut (the factor applies). */
  readonly picking: boolean;
}

/**
 * Which trees crews fell on a lot under the rules. First species standing
 * come first (sharing the effort in their counts); with none, everything not
 * Skipped; with only Skipped trees left, those (never stall). `ignore` (the
 * AFK lot, hire jobs) cuts everything.
 */
export function cutPlan(stand: Stand, mix: readonly (readonly [SpeciesId, number])[], rules: StashRules | null | undefined, ignore = false): CutPlan {
  const standing = standingSpecies(stand, mix);
  const all = (mode: CutPlan['mode']): CutPlan => ({ species: standing, mode, share: 1, factor: 1, count: standTotal(stand), picking: false });
  if (ignore || standing.length < 2 || rulesAllAny(rules)) {
    if (!ignore && standing.length === 1 && stashRule(rules, standing[0] as SpeciesId) === 'skip') return all('skipped');
    return all('all');
  }
  const first = standing.filter((s) => stashRule(rules, s) === 'first');
  const rest = standing.filter((s) => stashRule(rules, s) !== 'skip');
  let pick: SpeciesId[], mode: CutPlan['mode'];
  if (first.length) { pick = first; mode = 'first'; }
  else if (rest.length) { pick = rest; mode = 'rest'; }
  else return all('skipped');
  if (pick.length === standing.length) return all(mode === 'first' ? 'first' : 'all');
  const tot = standTotal(stand), count = pick.reduce((a, s) => a + (stand[s] ?? 0), 0);
  const share = tot > 0 ? count / tot : 1;
  return { species: pick, mode, share, factor: pickFactor(share), count, picking: true };
}

/**
 * Fell `k` trees: from `species` in proportion to their counts, and once they
 * run out, from the rest in proportion. Returns a new stand that sums to the
 * old total − k (never below 0).
 */
export function fellFromStand(stand: Stand, species: readonly SpeciesId[], k: number): Stand {
  const out: Stand = { ...stand };
  let left = Math.max(0, k);
  const take = (ids: readonly SpeciesId[]): void => {
    const tot = ids.reduce((a, s) => a + Math.max(0, out[s] ?? 0), 0);
    if (tot <= 0 || left <= 0) return;
    const n = Math.min(left, tot);
    for (const s of ids) { const c = Math.max(0, out[s] ?? 0); out[s] = n >= tot ? 0 : c - n * c / tot; }
    left -= n;
  };
  take(species);
  if (left > 0) take((Object.keys(out) as SpeciesId[]).filter((s) => !species.includes(s)));
  for (const s of Object.keys(out) as SpeciesId[]) if (!((out[s] as number) > 1e-9)) out[s] = 0;
  return out;
}

/** Plain (pine-rule) averages of a mix: chops, bd ft and value a tree. */
function mixAvg(mix: readonly (readonly [SpeciesId, number])[]): { hp: number; bf: number; val: number } {
  let hp = 0, bf = 0, val = 0, w = 0;
  for (const [id, n] of mix) { const s = SPECIES[id]; if (!s || !(n > 0)) continue; hp += s.hp * n; bf += s.bf * n; val += treeValue(s) * n; w += n; }
  return w > 0 ? { hp: hp / w, bf: bf / w, val: val / w } : { hp: 0, bf: 0, val: 0 };
}

/** The lot fields `standStats` reads. */
export interface StandLot {
  readonly mix: readonly (readonly [SpeciesId, number])[];
  readonly hp: number; readonly bf: number; readonly val: number;
}

/** Tree stats of some species on a lot. The lot's own multipliers (the AFK lot's small stems, a hire job's rate) carry over. */
export interface StandStats { readonly mix: [SpeciesId, number][]; readonly hp: number; readonly bf: number; readonly val: number; readonly wt: number }

/**
 * Chops, bd ft, value and weight a tree for `species` on a lot, weighted by
 * their counts. Each is the species' own figure × (the lot's average ÷ its
 * mix's plain average), so lot multipliers carry over.
 */
export function standStats(lot: StandLot, stand: Stand, species: readonly SpeciesId[]): StandStats {
  const mix: [SpeciesId, number][] = species.filter((s) => (stand[s] ?? 0) > 0).map((s) => [s, stand[s] as number]);
  const use = mix.length ? mix : lot.mix.map((m) => [m[0], m[1]] as [SpeciesId, number]);
  const base = mixAvg(lot.mix), now = mixAvg(use);
  const k = (a: number, b: number): number => (b > 0 ? a / b : 1);
  return {
    mix: use,
    hp: now.hp * k(lot.hp, base.hp), bf: now.bf * k(lot.bf, base.bf), val: now.val * k(lot.val, base.val),
    wt: mixWeight(use),
  };
}

// ---------- the Trees tab

export interface StashLotEntry { readonly i: number; readonly n: number; readonly share: number }
export interface StashRow {
  readonly sp: SpeciesId;
  readonly trees: number;
  readonly bf: number;
  /** Plain value of those trees (before the season), with lot multipliers. */
  readonly val: number;
  /** Lots holding it, by queue index. */
  readonly lots: readonly StashLotEntry[];
}

/**
 * Every owned tree by species: count, bd ft and value, and the lots holding
 * each (share = that species' share of the lot's standing trees). Species in
 * first-seen order across the queue.
 */
export function stashTotals(lots: readonly (StandLot & { readonly stand: Stand })[]): StashRow[] {
  const rows = new Map<SpeciesId, { trees: number; bf: number; val: number; lots: StashLotEntry[] }>();
  lots.forEach((l, i) => {
    const tot = standTotal(l.stand);
    for (const sp of standingSpecies(l.stand, l.mix)) {
      const n = l.stand[sp] ?? 0, st = standStats(l, l.stand, [sp]);
      const r = rows.get(sp) ?? { trees: 0, bf: 0, val: 0, lots: [] };
      r.trees += n; r.bf += n * st.bf; r.val += n * st.val; r.lots.push({ i, n, share: tot > 0 ? n / tot : 0 });
      rows.set(sp, r);
    }
  });
  return [...rows.entries()].map(([sp, r]) => ({ sp, ...r }));
}
