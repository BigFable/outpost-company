/**
 * The cutting queue (owner feedback, 2026-10-25): what a lot does for your
 * open orders (order fit), what it does to your camp (the camp note), and how
 * the queue of owned lots is ordered. Pure helpers, no randomness: nothing
 * here changes a draw or a game number, it only reads them.
 *
 * Capacities (`QueueCaps`) are the camp's rates with no site factors: felling
 * in chops a second; bucking, skidding and hauling in bd ft a second for
 * pine-weight wood on flat ground at one mile. Each lot then applies its own
 * slope, haul distance and weight, the same way `stageRate` does in play.
 */
import { deepFreeze } from './freeze';
import { SLOPES, SPECIES, SEASONS, type Season, type SlopeId, type SpeciesId } from './content';
import { distanceFactor, slopeFactor } from './formulas';
import { idlePrimeChance, PRIME_RULES, type ItemId } from './items';
import { mainSpecies, mixShare, speciesId, SPECIES_SEASON, type GroundId } from './species';

/** Price of moving crews to another owned lot. Free for now (owner may add a cost later). */
export const TRACT_SWITCH_COST = 0;

export type QueueStage = 'fell' | 'buck' | 'skid' | 'haul';
export const QUEUE_STAGES: readonly QueueStage[] = deepFreeze(['fell', 'buck', 'skid', 'haul']);

export interface QueueCaps { readonly fell: number; readonly buck: number; readonly skid: number; readonly haul: number }

/** The parts of a tract (owned or listed) these helpers read. `left` defaults to `trees`. */
export interface QueueLot {
  readonly name: string;
  readonly mix: readonly (readonly [SpeciesId, number])[];
  readonly trees: number;
  readonly left?: number;
  readonly hp: number;
  readonly bf: number;
  readonly val: number;
  readonly wt?: number;
  readonly miles: number;
  readonly slope: SlopeId;
  readonly ground?: GroundId;
  /** The AFK lot (Cutover slash country): the note says what it is for. */
  readonly afk?: boolean;
  /** The lot stash's picking factor on felling and skidding (1 when crews cut everything). */
  readonly pick?: number;
}

const leftOf = (l: QueueLot): number => Math.max(0, l.left ?? l.trees);

/** Bd ft a second each stage would work on this lot (felling as chops ÷ hp × bf). */
export function lotRates(c: QueueCaps, l: QueueLot, skyline = false): Record<QueueStage, number> {
  const wt = l.wt && l.wt > 0 ? l.wt : 1, pk = l.pick && l.pick > 0 ? l.pick : 1;
  return {
    fell: l.hp > 0 ? c.fell / l.hp * l.bf * pk : 0,
    buck: c.buck,
    skid: c.skid * slopeFactor(l.slope, skyline) / wt * pk,
    haul: c.haul * distanceFactor(l.miles) / wt,
  };
}

/** The slowest stage on this lot sets the camp's bd ft a second. */
export function lotThroughput(c: QueueCaps, l: QueueLot, skyline = false): number {
  const r = lotRates(c, l, skyline);
  return Math.max(0, Math.min(r.fell, r.buck, r.skid, r.haul));
}

/** Seconds to cut out what is left of the lot at the camp's pace (Infinity with no crews). */
export function cutOutSeconds(c: QueueCaps, l: QueueLot, skyline = false): number {
  const thr = lotThroughput(c, l, skyline), bf = leftOf(l) * l.bf;
  if (bf <= 0) return 0;
  return thr > 0 ? bf / thr : Infinity;
}

/** Mix-weighted seasonal value factor (hemlock tanbark, maple), as `seasonValueFactor` but on read-only data. */
function seasonFactorOf(mix: readonly (readonly [SpeciesId, number])[], season: Season): number {
  let plain = 0, now = 0, hit = false;
  for (const [id, w] of mix) {
    const sp = speciesId(id); if (!sp) continue;
    const s = SPECIES[sp], v = s.bf * (s.saw * s.sawP + (1 - s.saw) * s.pulpP);
    const t = SPECIES_SEASON[sp]?.[season];
    if (t) hit = true;
    plain += v * w; now += (t ? v * t.mult + t.bark : v) * w;
  }
  return hit && plain > 0 ? now / plain : 1;
}

/** Log value a second of camp work on this lot, this season (bd ft a second × value per bd ft × species season factor). */
export function lotValueRate(c: QueueCaps, l: QueueLot, season: Season, skyline = false): number {
  return l.bf > 0 ? lotThroughput(c, l, skyline) * (l.val / l.bf) * seasonFactorOf(l.mix, season) : 0;
}

// ---------- order fit

/** A charter order for one species (signed, or on the board if signed now). `need` is bd ft still to deliver. */
export interface SpeciesFitOrder {
  readonly kind: 'species'; readonly id: string; readonly short: string;
  readonly sp: SpeciesId; readonly need: number; readonly secondsLeft: number; readonly signed: boolean;
}
/** A warehouse need for an item a lot can make (Prime): special orders and structures. `need` is after warehouse stock. */
export interface ItemFitOrder {
  readonly kind: 'item'; readonly id: string; readonly short: string;
  readonly item: ItemId; readonly itemName: string; readonly need: number;
}
export type FitOrder = SpeciesFitOrder | ItemFitOrder;

export interface FitCtx {
  readonly caps: QueueCaps;
  readonly era: number;
  /** Perfect falls per tree felled so far (the felling-game pace); 0 for an idle player. */
  readonly perfRate?: number;
  readonly skyline?: boolean;
}

export interface FitLine {
  readonly orderId: string;
  readonly kind: 'species' | 'item';
  /** Share of the order this lot fills (species) or items it should make (item). 0 when it no longer helps. */
  readonly amount: number;
  /** Share of what the order still needs (after the lots ahead of it) that this lot covers, 0..1. */
  readonly share: number;
  /** True when this lot covers the rest of the order. */
  readonly fills: boolean;
  readonly text: string;
}

/** Highest perfect-fall rate the estimate trusts (most stems are crew-felled). */
export const FIT_PERF_RATE_MAX = 0.5;

/**
 * Expected Prime of one item a lot makes per tree felled: idle crews (the 2%
 * trickle, one log) plus the player's perfect-fall pace × the species'
 * perfect-fall count, weighted by the mix.
 */
export function primePerTree(l: QueueLot, item: ItemId, era: number, perfRate = 0): number {
  const idle = idlePrimeChance(era), pr = Math.max(0, Math.min(FIT_PERF_RATE_MAX, perfRate));
  let n = 0;
  for (const r of PRIME_RULES) {
    if (r.item !== item) continue;
    const s = mixShare(l.mix, r.species);
    if (s > 0) n += s * (idle + pr * r.perfectFall);
  }
  return n;
}

/** Expected Prime of an item from what is left of a lot. */
export function primeEstimate(l: QueueLot, item: ItemId, era: number, perfRate = 0): number {
  return leftOf(l) * primePerTree(l, item, era, perfRate);
}

const spWord = (sp: SpeciesId): string => SPECIES[sp].name.toLowerCase();
const pct = (x: number): number => Math.max(1, Math.min(99, Math.round(x * 100 / 5) * 5));

/** Bd ft of the order's species that `lots` deliver in turn before `seconds` run out, and the seconds they take. */
function speciesFlow(c: QueueCaps, lots: readonly QueueLot[], sp: SpeciesId, seconds: number, skyline: boolean): { bf: number; t: number } {
  let t = 0, bf = 0;
  for (const l of lots) {
    const dur = cutOutSeconds(c, l, skyline);
    const use = Math.min(dur, Math.max(0, seconds - t));
    if (use > 0 && isFinite(use)) bf += use * lotThroughput(c, l, skyline) * mixShare(l.mix, sp);
    t += dur;
  }
  return { bf, t };
}

/**
 * What a lot does for each open order, counting what the lots `ahead` of it
 * in the queue deliver first. A species order counts the lot's share of each
 * delivery before the deadline; an item need counts the expected Prime.
 * Orders the lot cannot serve at all are left out.
 */
export function orderFit(lot: QueueLot, orders: readonly FitOrder[], ctx: FitCtx, ahead: readonly QueueLot[] = []): FitLine[] {
  const out: FitLine[] = [], sky = !!ctx.skyline;
  for (const o of orders) {
    if (!(o.need > 0)) continue;
    if (o.kind === 'species') {
      const share = mixShare(lot.mix, o.sp); if (share <= 0) continue;
      const w = spWord(o.sp), tag = o.signed ? 'the' : 'the offered';
      const before = speciesFlow(ctx.caps, ahead, o.sp, o.secondsLeft, sky);
      const still = Math.max(0, o.need - before.bf);
      if (still <= 0) { out.push({ orderId: o.id, kind: 'species', amount: 0, share: 0, fills: false, text: `${Math.round(share * 100)}% ${w}, but lots ahead already fill ${tag} ${w} order.` }); continue; }
      const thr = lotThroughput(ctx.caps, lot, sky);
      if (!(thr > 0)) { out.push({ orderId: o.id, kind: 'species', amount: share * 0.01, share: 0, fills: false, text: `${Math.round(share * 100)}% ${w}: helps ${tag} ${w} order once crews are on it.` }); continue; }
      const time = Math.max(0, o.secondsLeft - before.t);
      const got = Math.min(still, Math.min(cutOutSeconds(ctx.caps, lot, sky), time) * thr * share);
      if (got <= 0) { out.push({ orderId: o.id, kind: 'species', amount: 0, share: 0, fills: false, text: `${Math.round(share * 100)}% ${w}, but ${tag} ${w} order ends before crews get here.` }); continue; }
      const fills = got >= still - 1e-6, of = got / o.need;
      const text = fills
        ? (before.bf > 0 ? `Finishes ${tag} ${w} order in time, after the lots ahead.` : `Enough to fill ${tag} ${w} order in time.`)
        : `Fills about ${pct(of)}% of ${tag} ${w} order in time.`;
      out.push({ orderId: o.id, kind: 'species', amount: of, share: got / still, fills, text: text + (o.signed ? '' : ' (if you sign now)') });
    } else {
      const per = primePerTree(lot, o.item, ctx.era, ctx.perfRate ?? 0); if (per <= 0) continue;
      const est = leftOf(lot) * per;
      const before = ahead.reduce((a, l) => a + primeEstimate(l, o.item, ctx.era, ctx.perfRate ?? 0), 0);
      const still = Math.max(0, o.need - before);
      const n = est >= 10 ? Math.round(est) : Math.round(est * 10) / 10;
      if (still <= 0) { out.push({ orderId: o.id, kind: 'item', amount: 0, share: 0, fills: false, text: `≈ ${n} ${o.itemName}, but lots ahead already cover ${o.short}.` }); continue; }
      const fills = est >= still - 1e-9;
      const text = fills ? `≈ ${n} ${o.itemName} for ${o.short}, enough to fill it.` : `≈ ${n} of the ${Math.ceil(still)} ${o.itemName} ${o.short} still needs.`;
      out.push({ orderId: o.id, kind: 'item', amount: est, share: Math.min(1, est / still), fills, text });
    }
  }
  return out;
}

/**
 * For each order, the index of the lot that serves it best (the most of the
 * order covered; the first on a tie). Orders no lot helps are left out. With
 * `lots` (the same order as `fits`), the AFK lot never takes the badge.
 */
export function bestFor(fits: readonly (readonly FitLine[])[], lots?: readonly { readonly afk?: boolean }[]): Record<string, number> {
  const best: Record<string, { i: number; a: number }> = {};
  fits.forEach((lines, i) => { if (lots?.[i]?.afk) return; lines.forEach((f) => {
    if (!(f.amount > 0)) return;
    const b = best[f.orderId];
    if (!b || f.amount > b.a + 1e-9) best[f.orderId] = { i, a: f.amount };
  }); });
  const out: Record<string, number> = {};
  for (const k in best) out[k] = (best[k] as { i: number }).i;
  return out;
}

// ---------- the camp note

export interface CampNoteCtx {
  readonly skyline?: boolean;
  /** The season for species traits (an Early freeze counts as Winter). */
  readonly season: Season;
  /** The lot crews are on now, to compare value an hour; omit when there is none (or for the active lot itself). */
  readonly current?: QueueLot | null;
  /** Active weather and its factors on each stage (already inside the caps); only stages ≠ 1 matter. */
  readonly weather?: { readonly name: string; readonly factors: Partial<Record<QueueStage, number>> } | null;
  /** Money formatter (defaults to whole dollars). */
  readonly money?: (n: number) => string;
}
export interface CampNote {
  /** 'none' with no crews, 'matched' within the threshold, else the slowest stage. */
  readonly key: 'none' | 'matched' | QueueStage;
  /** How far the slowest stage falls behind (0..1). */
  readonly behind: number;
  /** Value an hour on this lot and on the current one. */
  readonly perHour: number;
  readonly perHourNow: number | null;
  /** One or two lines of plain advice. */
  readonly short: string;
  /** The optional "details" lines. */
  readonly details: readonly string[];
}
/** The AFK lot's lead line. */
export const AFK_NOTE = 'Best for time away: poor wood, but lots of it.';
/** Below this gap the stages count as matched. */
export const CAMP_NOTE_MATCHED = 0.1;
/** Site factors under this are called out in the short note when they hit the slowest stage. */
export const CAMP_NOTE_SITE_FLAG = 0.9;

const CREW: Readonly<Record<QueueStage, string>> = deepFreeze({ fell: 'fallers', buck: 'buckers', skid: 'teams', haul: 'haulers' });
const VERB: Readonly<Record<QueueStage, string>> = deepFreeze({ fell: 'felling', buck: 'bucking', skid: 'skidding', haul: 'hauling' });
const f2 = (x: number): string => (Math.round(x * 100) / 100).toString();
const nextSeason = (s: Season): Season => SEASONS[(SEASONS.indexOf(s) + 1) % 4] as Season;

const upper = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
const sameTrait = (a?: { mult: number; bark: number }, b?: { mult: number; bark: number }): boolean => !!a && !!b && a.mult === b.mult && a.bark === b.bark;
const pays = (t?: { mult: number; bark: number }): boolean => !!t && (t.bark > 0 || t.mult > 1);

/** Species season lines for a mix: what pays now (`now`), and what pays later (`later`). Species under 10% of the mix are skipped. */
export function seasonLines(mix: readonly (readonly [SpeciesId, number])[], season: Season): { now: string[]; later: string[] } {
  const now: string[] = [], later: string[] = [];
  for (const [id] of mix) {
    const sp = speciesId(id); if (!sp || mixShare(mix, sp) < 0.1) continue;
    const tr = SPECIES_SEASON[sp]; if (!tr) continue;
    const w = spWord(sp), t = tr[season];
    let until: Season = nextSeason(season);
    for (let i = 0; i < 3 && sameTrait(t, tr[until]); i++) until = nextSeason(until);
    if (t && t.bark > 0) now.push(`Bark season: ${w} pays +$${t.bark} a tree until ${until}.`);
    else if (t && t.mult > 1) now.push(`${season} ${w} is worth ×${f2(t.mult)} until ${until}.`);
    else if (t && t.mult < 1) now.push(`${season} sap stains ${w}: worth ×${f2(t.mult)} until ${until}.`);
    else {
      let s = nextSeason(season);
      for (let i = 0; i < 3 && !pays(tr[s]); i++) s = nextSeason(s);
      const u = tr[s];
      if (u && u.bark > 0) later.push(`${upper(w)} pays +$${u.bark} a tree in bark from ${s}.`);
      else if (u && u.mult > 1) later.push(`${upper(w)} felled in ${s} is worth ×${f2(u.mult)}.`);
    }
  }
  return { now, later };
}

/**
 * Plain, specific advice for a lot: which stage will hold the camp back and
 * by how much, what the haul and slope do, value an hour against the current
 * lot, and any season or weather that matters. `short` is one or two lines.
 */
export function campNote(c: QueueCaps, lot: QueueLot, ctx: CampNoteCtx): CampNote {
  const sky = !!ctx.skyline, money = ctx.money ?? ((n: number) => `$${Math.round(n)}`);
  const r = lotRates(c, lot, sky);
  const wt = lot.wt && lot.wt > 0 ? lot.wt : 1, main = mainSpecies(lot.mix);
  const word = main ? spWord(main) : 'mixed wood';
  const lead = (wt > 1.03 ? 'Heavy ' : wt < 0.97 ? 'Light ' : '') + word;
  const Lead = upper(lead);
  const perHour = lotValueRate(c, lot, ctx.season, sky) * 3600;
  const perHourNow = ctx.current ? lotValueRate(c, ctx.current, ctx.season, sky) * 3600 : null;
  const sf = slopeFactor(lot.slope, sky), df = distanceFactor(lot.miles);
  const seas = seasonLines(lot.mix, ctx.season);
  const details: string[] = [];
  details.push(`On this lot: felling ${f2(r.fell)}, bucking ${f2(r.buck)}, skidding ${f2(r.skid)}, hauling ${f2(r.haul)} wood/s.`);
  details.push(`Weight ${f2(wt)}: skid and haul ×${f2(1 / wt)}. ${lot.miles} mi haul: hauling ×${f2(df)}. ${upper(SLOPES[lot.slope].label)} ground: skidding ×${f2(sf)}.`);

  const anyCrew = r.fell > 0 && r.buck > 0 && r.skid > 0 && r.haul > 0;
  if (!anyCrew) {
    const miss = QUEUE_STAGES.filter((s) => !(r[s] > 0)).map((s) => CREW[s]);
    const short = `${Lead}: hire ${miss.join(' and ')} to see how this lot suits your camp.` + (seas.now[0] ? ` ${seas.now[0]}` : '');
    return { key: 'none', behind: 0, perHour, perHourNow, short: lot.afk ? `${AFK_NOTE} ${short}` : short, details: [...details, ...seas.now.slice(1), ...seas.later] };
  }
  let neck: QueueStage = 'fell';
  for (const s of QUEUE_STAGES) if (r[s] < r[neck]) neck = s;
  const others = QUEUE_STAGES.filter((s) => s !== neck).map((s) => r[s]);
  const behind = neck === 'fell' ? 1 - r.fell / Math.min(...others) : 1 - r[neck] / r.fell;
  let s1: string, key: CampNote['key'];
  if (behind < CAMP_NOTE_MATCHED) { key = 'matched'; s1 = `${Lead}: a good match for your camp, every stage within ${Math.round(CAMP_NOTE_MATCHED * 100)}%.`; }
  else if (neck === 'fell') { key = 'fell'; s1 = `${Lead}: your fallers are slowest here, so the camp waits about ${Math.round(behind * 100)}% of the time.`; }
  else { key = neck; s1 = `${Lead}: your ${CREW[neck]} are slowest here; ${VERB[neck]} falls about ${Math.round(behind * 100)}% behind felling.`; }
  // the site, when it is what slows the slowest stage
  const site: string[] = [];
  if (key === 'skid' && sf < CAMP_NOTE_SITE_FLAG) site.push(`${SLOPES[lot.slope].label} ground slows skidding ×${f2(sf)}`);
  if (key === 'haul' && df < CAMP_NOTE_SITE_FLAG) site.push(`the ${lot.miles} mi haul slows hauling ×${f2(df)}`);
  if (site.length) s1 = s1.replace(/\.$/, '') + ` (${site.join('; ')}).`;
  // weather on the slowest stage
  const wf = ctx.weather && key !== 'matched' ? ctx.weather.factors[neck as QueueStage] : undefined;
  if (ctx.weather && wf !== undefined && wf !== 1) details.push(`${ctx.weather.name}: ${VERB[neck as QueueStage]} ×${f2(wf)} this season, ${wf < 1 ? 'which makes' : 'which shrinks'} this gap${wf < 1 ? ' worse' : ''}.`);
  let s2 = `About ${money(perHour)} of logs an hour`;
  if (perHourNow !== null && perHourNow > 0) {
    const d = perHour / perHourNow - 1;
    const cn = ctx.current ? ctx.current.name : 'the current lot';
    s2 += Math.abs(d) < 0.05 ? `, about the same as ${cn}.` : `, ${Math.round(Math.abs(d) * 100)}% ${d > 0 ? 'more' : 'less'} than ${cn}.`;
  } else s2 += '.';
  if (seas.now[0]) s2 += ` ${seas.now[0]}`;
  details.push(...seas.now.slice(1), ...seas.later);
  const wline = ctx.weather && wf !== undefined && wf !== 1 && wf < 1 ? ` ${ctx.weather.name} makes it worse for now.` : '';
  if (lot.afk) {
    // the AFK lot: what it is for and how long it lasts come first; the bottleneck moves to the details
    const sec = cutOutSeconds(c, lot, sky);
    details.unshift(s1 + wline);
    const last = isFinite(sec) ? `about ${sec >= 3600 ? `${f2(Math.round(sec / 360) / 10)} h` : `${Math.max(1, Math.round(sec / 60))} min`} of work for your camp now` : 'a long time';
    return { key, behind: Math.max(0, behind), perHour, perHourNow, short: `${AFK_NOTE} It lasts ${last}, so crews keep cutting while you are away. ${s2}`.replace(/\s+/g, ' ').trim(), details };
  }
  return { key, behind: Math.max(0, behind), perHour, perHourNow, short: `${s1}${wline} ${s2}`.replace(/\s+/g, ' ').trim(), details };
}

// ---------- queue order

export type QueueMode = 'bought' | 'deadline' | 'value' | 'hand';
export const QUEUE_MODES: readonly QueueMode[] = deepFreeze(['bought', 'deadline', 'value', 'hand']);
export const QUEUE_MODE_LABEL: Readonly<Record<QueueMode, string>> = deepFreeze({
  bought: 'As bought', deadline: 'Deadline', value: 'Value', hand: 'By hand',
});
export interface QueueKey {
  /** Purchase order. */
  readonly seq: number;
  /** Seconds to the earliest deadline among the orders the lot serves (Infinity when none). */
  readonly deadline: number;
  /** Value an hour on the lot. */
  readonly perHour: number;
  /** The AFK lot: in every auto mode it waits behind the normal lots (owner-approved 2026-10-25). */
  readonly afk?: boolean;
}

/**
 * The order of the waiting lots (indices into `keys`) under a mode. Stable:
 * 'hand' keeps the given order; 'bought' sorts by purchase; 'deadline' puts
 * lots that serve the soonest order first (then value, then purchase);
 * 'value' sorts by value an hour (then purchase). In every mode but 'hand',
 * AFK lots go behind the normal lots, so a lot bought later is cut first.
 */
export function queueOrder(keys: readonly QueueKey[], mode: QueueMode): number[] {
  const idx = keys.map((_, i) => i);
  if (mode === 'hand') return idx;
  const k = (i: number): QueueKey => keys[i] as QueueKey;
  return idx.sort((a, b) => {
    const A = k(a), B = k(b);
    if (!!A.afk !== !!B.afk) return A.afk ? 1 : -1;
    if (mode === 'deadline' && A.deadline !== B.deadline) return A.deadline < B.deadline ? -1 : 1;
    if (mode !== 'bought' && A.perHour !== B.perHour) return B.perHour - A.perHour;
    return (A.seq - B.seq) || (a - b);
  });
}

/** Move one entry of a list from `from` to `to` (both clamped), returning a new list. */
export function moveEntry<T>(list: readonly T[], from: number, to: number): T[] {
  const out = list.slice();
  if (from < 0 || from >= out.length) return out;
  const t = Math.max(0, Math.min(out.length - 1, to));
  const [x] = out.splice(from, 1);
  out.splice(t, 0, x as T);
  return out;
}
