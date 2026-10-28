/**
 * The Sawmill camp (second skill), smallest playtest-2 version:
 * structures that stay built, the seasonal idle loop producing boards by
 * grade, plank bundles and the logging bunkhouse, the mill's own close camp,
 * its five perks, and the "Saw for grade" mini-game rules.
 * Spec: docs/design/sawmill-camp.md. All numbers are starting values for the balance agent.
 */
import { deepFreeze } from './freeze';
import type { MetaNodeDef, PerkDef, Season } from './content';
import type { ItemStack } from './items';
import type { Rng } from './rng';

// ---------- structures

export interface StructureLevel { readonly items: readonly ItemStack[]; readonly cash: number; readonly effect: string }
export interface StructureDef {
  readonly id: string; readonly skill: 'sawmill'; readonly name: string; readonly desc: string;
  /** The camp it stands in: the bunkhouse is built by the mill at the logging camp. */
  readonly target: 'sawmill' | 'logging';
  readonly levels: readonly StructureLevel[];
}
export const STRUCTURES: readonly StructureDef[] = deepFreeze([
  {id:'sawmill.pit', skill:'sawmill', target:'sawmill', name:'Saw pit', desc:'Two sawyers saw logs by hand over a pit.',
    levels:[{items:[], cash:0, effect:'2 sawyers, hand power'}]},
  {id:'sawmill.pond', skill:'sawmill', target:'sawmill', name:'Water wheel', desc:'Dam the creek and turn a water wheel.',
    levels:[{items:[{item:'logging.prime_spar', qty:3}, {item:'logging.amber_pitch', qty:2}], cash:100, effect:'Water power: sawing ×2.5, room for 10 more sawyers. Seasons now matter'}]},
  {id:'sawmill.headrig', skill:'sawmill', target:'sawmill', name:'Circular saw', desc:'A big round saw on a moving log cart, run by the wheel.',
    levels:[{items:[{item:'logging.prime_spar', qty:2}, {item:'logging.ships_fitting', qty:1}], cash:250, effect:'+2 sawyers and room for 44 more; in Saw boards, turns take 1 s, not 2'}]},
  {id:'logging.bunkhouse', skill:'sawmill', target:'logging', name:'Bunkhouse', desc:'Beds for the logging crews.',
    levels:[
      {items:[{item:'sawmill.plank_bundle', qty:4}], cash:0, effect:'Wages and hiring ×0.95'},
      {items:[{item:'sawmill.plank_bundle', qty:8}], cash:0, effect:'Wages and hiring ×0.90'},
      {items:[{item:'sawmill.plank_bundle', qty:16}], cash:0, effect:'Wages and hiring ×0.86'},
    ]},
]);
export function structureDef(id: string): StructureDef | undefined { return STRUCTURES.find((s) => s.id === id); }

/** Structure levels built, by id. Never reset by any close camp. */
export type Structures = Readonly<Record<string, number | undefined>>;
const lvl = (s: Structures, id: string): number => s[id] ?? 0;

/** Cost of the next level of a structure, or null when it is fully built. */
export function structureNext(s: Structures, id: string): StructureLevel | null {
  const d = structureDef(id);
  return d ? d.levels[lvl(s, id)] ?? null : null;
}

/** Logging crew upkeep and hiring multiplier from the bunkhouse: ×0.95 per level. */
export function bunkhouseMult(s: Structures): number {
  return Math.pow(0.95, lvl(s, 'logging.bunkhouse'));
}

/** Plank bundles still needed to finish every bunkhouse level. */
export function bundlesStillNeeded(s: Structures): number {
  const d = structureDef('logging.bunkhouse');
  if (!d) return 0;
  return d.levels.slice(lvl(s, 'logging.bunkhouse')).reduce((a, l) => a + l.items.reduce((b, i) => b + i.qty, 0), 0);
}

// ---------- the idle loop

/** Board feet a sawyer saws per minute on hand power. */
export const SAWYER_BF_MIN = 30;
/** Sawyers in the saw pit at the start of every mill outpost. */
export const START_SAWYERS = 2;
/** Price of a sawyer: $40, +10% per sawyer hired this mill outpost. */
export const SAWYER_COST = 40;
export const SAWYER_COST_GROWTH = 1.1;
/** Price of the next sawyer after `hired` this mill outpost; `mult` is the hiring multiplier. */
export function sawyerCost(hired: number, mult = 1): number {
  return Math.ceil(SAWYER_COST * Math.pow(SAWYER_COST_GROWTH, hired) * mult);
}
/** Water power multiplier from the mill pond & wheel. */
export const POND_POWER = 2.5;
/** Whistle Pond: steady water (winter ×0.8), cove logs ×1.2. Other sites come later. */
export const SITE = deepFreeze({id:'whistle', name:'Whistle Pond', power:{Spring:1.3, Summer:1, Fall:0.9, Winter:0.8} as Readonly<Record<Season, number>>, logCost:1.2});
/** Cove log price per board foot (× market). */
export const COVE_LOG_PRICE = 0.25;
export type BoardGrade = 'clear' | 'select' | 'common';
export const BOARD_GRADES: readonly BoardGrade[] = deepFreeze(['clear', 'select', 'common']);
/** Lumber sells at this multiple of the cove log price per board foot. */
export const LUMBER_MULT: Readonly<Record<BoardGrade, number>> = deepFreeze({clear:3, select:2, common:1});
/** Grade mix of idle sawing. */
export const GRADE_MIX: Readonly<Record<BoardGrade, number>> = deepFreeze({clear:0.2, select:0.35, common:0.45});
/** Common lumber per plank bundle. */
export const BUNDLE_BF = 500;
/** Board feet sawn in one mill outpost before it can close camp. */
export const MILL_CLOSE_BF = 150000;

/** Most sawyers the mill has room for: 6 in the pit, +10 with the pond, +44 with the headrig. */
export function maxSawyers(s: Structures): number {
  return 6 + (lvl(s, 'sawmill.pond') ? 10 : 0) + (lvl(s, 'sawmill.headrig') ? 44 : 0);
}
/** Sawyers that come with the structures (the headrig brings 2). */
export function freeSawyers(s: Structures): number {
  return START_SAWYERS + (lvl(s, 'sawmill.headrig') ? 2 : 0);
}
/** Power factor: hand power is 1 all year; water is ×2.5 and seasonal. */
export function millPower(s: Structures, season: Season): number {
  return lvl(s, 'sawmill.pond') ? POND_POWER * SITE.power[season] : 1;
}
/** Board feet per second the mill saws. `mult` is perks and the board's support. */
export function millRate(sawyers: number, s: Structures, season: Season, mult: number): number {
  return sawyers * SAWYER_BF_MIN / 60 * millPower(s, season) * mult;
}
/** Dollars per board foot of lumber of a grade at a market multiplier. */
export function lumberPrice(g: BoardGrade, market: number): number {
  return COVE_LOG_PRICE * LUMBER_MULT[g] * market;
}
/** Dollars per board foot for cove logs. */
export function coveLogPrice(market: number): number {
  return COVE_LOG_PRICE * SITE.logCost * market;
}

/** Charter Shares for closing the mill: √(sawn ÷ 2,000), +15% with the mill chronicler. */
export function millLegacyGain(sawn: number, chronicler: boolean): number {
  return Math.floor(Math.sqrt(Math.max(0, sawn) / 2000) * (chronicler ? 1.15 : 1));
}
export function canCloseMill(sawn: number): boolean { return sawn >= MILL_CLOSE_BF; }

/** What the charter ship leaves on the beach the first time Logging closes camp. */
export const FOUNDING_CRATE = deepFreeze({
  items:[{item:'logging.prime_spar', qty:6}, {item:'logging.amber_pitch', qty:2}, {item:'logging.ships_fitting', qty:1}] as readonly ItemStack[],
  logsBf:20000, cash:60,
});
/** The log slider is a cap: the most of each Logging delivery the auto flow may send to the log pond. Default and bounds. */
export const MILL_SHARE_DEFAULT = 0.1;
export const MILL_SHARE_MAX = 0.5;
/** Auto flow: Logging keeps the log pond topped up to this many seconds of the mill's current sawing (15 min since balance round 4: 5 min left idle ponds dry after every close camp). */
export const MILL_FLOW_BUFFER_S = 900;
/**
 * Auto slider: board feet of a delivery of `amt` that Logging sends to the mill. It sends what the mill can saw
 * (sawing rate `rate` bd ft/s × the buffer, minus the `pond` stock), never more than the `cap` share of the delivery.
 */
export function millFlowBf(amt: number, cap: number, rate: number, pond: number): number {
  if (!(amt > 0) || !(cap > 0) || !(rate > 0)) return 0;
  const need = rate * MILL_FLOW_BUFFER_S - Math.max(0, pond);
  return need > 0 ? Math.min(amt * Math.min(cap, MILL_SHARE_MAX), need) : 0;
}

// ---------- camp money (docs/design/lot-stash-and-camp-money.md, part B, model 4, slice 1)
// Each camp keeps its own cash. Money crosses camps only with goods: logs floated down, plank bundles carted up.

/**
 * - `logPriceMult`: the mill pays Logging this share of the cove price (what Logging would get at the cove) for slider logs, from mill cash.
 * - `bundlePrice`: Logging pays the mill this much mill cash per plank bundle used in the bunkhouse.
 * - `crateCash`: mill cash in the Sawmill crate, given at the start of every mill run (on top of `FOUNDING_CRATE.cash`).
 */
export const CAMP_MONEY = deepFreeze({ logPriceMult: 0.5, bundlePrice: 40, crateCash: 300 });
/** Cash every mill run starts with: the founding crate's cash plus the camp-money crate cash. */
export function millStartCash(): number { return FOUNDING_CRATE.cash + CAMP_MONEY.crateCash; }
/** The mill board's "Log crate" node (saw.advance): bd ft of logs added to the log pond at the start of each mill run. */
export const LOG_CRATE_BF = 3000;

export interface MillLogSale { readonly bf: number; readonly cost: number }
/**
 * The slider's sale to the mill. `wantBf` is the auto flow's part of a delivery and `coveValue` what those logs would fetch at the cove.
 * Can't-afford rule: the mill takes only the logs it can pay for in full; Logging sells the rest at the cove as usual.
 * No debt, no stall: Logging is never short-paid and the mill never goes below $0.
 */
export function millLogSale(wantBf: number, coveValue: number, millCash: number): MillLogSale {
  if (!(wantBf > 0)) return { bf: 0, cost: 0 };
  const price = Math.max(0, coveValue) * CAMP_MONEY.logPriceMult, cash = Math.max(0, millCash);
  if (price <= cash) return { bf: wantBf, cost: price };
  return { bf: wantBf * (cash / price), cost: cash };
}
/** What Logging pays the mill for `bundles` plank bundles. */
export function bundleCost(bundles: number): number { return Math.max(0, bundles) * CAMP_MONEY.bundlePrice; }
/** Plank bundles one structure level uses. */
export function levelBundles(l: StructureLevel): number {
  return l.items.reduce((a, i) => a + (i.item === 'sawmill.plank_bundle' ? i.qty : 0), 0);
}

/** The mill's board (spent with Sawmill Charter Shares). */
export const MILL_META: readonly MetaNodeDef[] = deepFreeze([
  {id:'saw.advance', cost:3, name:'Log crate', desc:'Start each mill run with 3,000 wood of logs.'},
  {id:'saw.crew', cost:5, name:'Extra sawyers', desc:'Start each mill run with 2 more sawyers.'},
  {id:'saw.sharp', cost:8, name:'Saw filer', desc:'Every sawyer saws ×1.2.'},
  {id:'saw.chronicler', cost:10, name:'Mill clerk', desc:'Shares from closing the mill +15%.'},
]);

// ---------- perks (Sawmill drafts)

export const SAW_PERKS: readonly PerkDef[] = deepFreeze([
  {id:'chaincarriage', r:'rare', name:'Chain carriage', desc:'Saw boards: a top run brings the next log at once, outer boards one tier better, up to 3 logs.'},
  {id:'sawyerseye', r:'rare', name:'Sawyer’s eye', desc:'Saw boards: see hidden knots one board ahead on every side.'},
  {id:'pondmonkey', r:'common', name:'Pond monkey', desc:'Prime logs always come first, and each gives 1 extra Fine board.'},
  {id:'turndog', r:'common', name:'Turn and dog', desc:'Saw boards: turning the log is instant.'},
  {id:'bigstick', r:'legendary', name:'Big stick', desc:'Once per mill run, a giant log arrives: twice the wood, and its Fine boards are worth ×3.'},
]);
/** Sawmill perks that can be offered: commons stack (Pond monkey), the rest once per mill outpost. */
export function sawDraftPool(drafted: readonly string[]): PerkDef[] {
  return SAW_PERKS.filter((p) => (p.r === 'common' && p.id === 'pondmonkey') || !drafted.includes(p.id));
}

// ---------- Saw for grade

/** Zone code per cell: -1 bark/air, 0 Clear rim, 1 Select band, 2 Common heart. */
export type Zone = -1 | 0 | 1 | 2;
export interface SawKnot { readonly cell: number; readonly hidden: boolean }
export interface SawLog {
  /** Cells across (the log is an n × n grid seen end-on). */
  readonly n: number;
  readonly dia: number;
  /** Log grade label on the deck: 1 best. */
  readonly logGrade: 1 | 2 | 3;
  readonly prime: boolean;
  readonly giant: boolean;
  /** Chain carriage: the first board off each face is one grade higher. */
  readonly outerUp: boolean;
  readonly zones: readonly Zone[];
  readonly knots: readonly SawKnot[];
}
export interface SawBoard { readonly face: number; readonly width: number; readonly grade: number; readonly knots: number }
export interface SawCut {
  top: number; bottom: number; left: number; right: number;
  /** Face toward the saw: 0 top, 1 right, 2 bottom, 3 left. */
  face: number;
  /** Faces that have had a board taken (their knots show). */
  opened: boolean[];
  boards: SawBoard[];
  turns: number;
  done: boolean;
}

/** Time limit and action times (seconds). */
export const SAW_LIMIT = 20;
export const SAW_TIME = 0.6;
export const TURN_TIME_PIT = 2;
export const TURN_TIME_CARRIAGE = 1;
/** Clear boards from a Big stick log are worth this many times more. */
export const BIG_STICK_CLEAR = 3;
/** Value units per cell by board grade (0 Clear, 1 Select, 2 Common) – the same ratio as lumber prices. */
const GRADE_VALUE = [3, 2, 1] as const;

const SIZES = [{n:6, dia:14, knots:[1, 2]}, {n:8, dia:20, knots:[2, 3]}, {n:10, dia:26, knots:[3, 4]}] as const;

/**
 * A log for the deck. Draws, in order: size (unless prime/giant), pith x, pith y,
 * knot count, then per knot: cell (retried on bark), hidden.
 */
export function genSawLog(rng: Rng, o: { readonly prime?: boolean; readonly giant?: boolean; readonly outerUp?: boolean; readonly n?: number } = {}): SawLog {
  const size = o.giant ? {n:12, dia:34, knots:[3, 5]} : o.prime ? {n:10, dia:26, knots:[1, 2]} : (o.n ? SIZES.find((s) => s.n === o.n) : undefined) ?? (SIZES[Math.floor(rng() * 3)] as (typeof SIZES)[number]);
  const n = size.n, R = n / 2;
  const off = o.prime ? 3.6 : 2.4, px = (rng() - 0.5) * off, py = (rng() - 0.5) * off;
  const clearAt = o.prime ? 0.42 : 0.62, selectAt = o.prime ? 0.2 : 0.34;
  const zones: Zone[] = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const x = j + 0.5 - R, y = i + 0.5 - R;
    if (Math.hypot(x, y) > R) { zones.push(-1); continue; }
    const d = Math.hypot(x - px, y - py) / R;
    zones.push(d > clearAt ? 0 : d > selectAt ? 1 : 2);
  }
  const [k0, k1] = size.knots;
  const nk = k0 + Math.floor(rng() * (k1 - k0 + 1));
  const knots: SawKnot[] = [];
  for (let k = 0; k < nk; k++) {
    let cell = 0, tries = 0;
    do { cell = Math.floor(rng() * n * n); tries++; } while (tries < 40 && (zones[cell] === -1 || zones[cell] === 2 || knots.some((q) => q.cell === cell)));
    knots.push({cell, hidden: rng() < 0.5});
  }
  const logGrade = (nk <= 1 ? 1 : nk <= 3 ? 2 : 3) as 1 | 2 | 3;
  return {n, dia:size.dia, logGrade, prime:!!o.prime, giant:!!o.giant, outerUp:!!o.outerUp, zones, knots};
}

export function newSawCut(log: SawLog): SawCut {
  return {top:0, bottom:log.n - 1, left:0, right:log.n - 1, face:0, opened:[false, false, false, false], boards:[], turns:0, done:false};
}

/** Cell indices of the next board off `face`. */
export function boardCells(log: SawLog, c: SawCut, face: number): number[] {
  const out: number[] = [], n = log.n;
  if (c.top > c.bottom || c.left > c.right) return out;
  if (face === 0 || face === 2) { const i = face === 0 ? c.top : c.bottom; for (let j = c.left; j <= c.right; j++) if (log.zones[i * n + j] !== -1) out.push(i * n + j); }
  else { const j = face === 3 ? c.left : c.right; for (let i = c.top; i <= c.bottom; i++) if (log.zones[i * n + j] !== -1) out.push(i * n + j); }
  return out;
}

/** Is a knot showing: visible from the start, on a sawn face, or one board ahead with Sawyer's eye. */
export function knotShows(log: SawLog, c: SawCut, k: SawKnot, eye: boolean): boolean {
  if (!k.hidden) return true;
  const i = Math.floor(k.cell / log.n), j = k.cell % log.n;
  const onFace = [i === c.top, j === c.right, i === c.bottom, j === c.left];
  return onFace.some((on, f) => on && (eye || c.opened[f]));
}

/**
 * The board the next Saw takes off `face`. Grade 0 Clear, 1 Select, 2 Common, -1 slab
 * (under 2 cells wide). `known` limits knots to those showing (for previews).
 */
export function nextBoard(log: SawLog, c: SawCut, face: number, known?: { readonly eye: boolean }): SawBoard {
  const cells = boardCells(log, c, face);
  if (cells.length < 2) return {face, width:cells.length, grade:-1, knots:0};
  const kn = log.knots.filter((k) => cells.includes(k.cell) && (!known || knotShows(log, c, k, known.eye))).length;
  let g = Math.max(...cells.map((x) => log.zones[x] as number));
  if (log.outerUp && !c.opened[face]) g = Math.max(0, g - 1);
  g = Math.min(2, g + kn);
  return {face, width:cells.length, grade:g, knots:kn};
}

/** Value units of a board (width × grade value; Clear ×3 on a Big stick log). */
export function boardValue(log: SawLog, b: SawBoard): number {
  if (b.grade < 0) return 0;
  return b.width * (GRADE_VALUE[b.grade as 0 | 1 | 2]) * (log.giant && b.grade === 0 ? BIG_STICK_CLEAR : 1);
}

/** The heart cant is squared once both sides are at most half the log. */
export function cantSquared(log: SawLog, c: SawCut): boolean {
  const h = c.bottom - c.top + 1, w = c.right - c.left + 1, sq = Math.ceil(log.n / 2);
  return h <= 0 || w <= 0 || (h <= sq && w <= sq);
}
/** Wood cells left in the cant. */
export function cantCells(log: SawLog, c: SawCut): number {
  let k = 0;
  for (let i = c.top; i <= c.bottom; i++) for (let j = c.left; j <= c.right; j++) if (log.zones[i * log.n + j] !== -1) k++;
  return k;
}

/** Take one board off the facing side (mutates `c`). */
export function sawBoard(log: SawLog, c: SawCut): SawBoard {
  const b = nextBoard(log, c, c.face);
  c.boards.push(b); c.opened[c.face] = true;
  if (c.face === 0) c.top++; else if (c.face === 1) c.right--; else if (c.face === 2) c.bottom--; else c.left++;
  if (cantSquared(log, c)) c.done = true;
  return b;
}
export function turnLog(c: SawCut): void { c.face = (c.face + 1) % 4; c.turns++; }

/** Total value units: boards taken plus the rest of the cant sawn as Common. */
export function sawValue(log: SawLog, c: SawCut): number {
  return c.boards.reduce((a, b) => a + boardValue(log, b), 0) + cantCells(log, c) * GRADE_VALUE[2];
}

/** Par: the standard "saw around" pattern (two boards off a face, then turn) on this exact log. */
export function sawPar(log: SawLog): number {
  const c = newSawCut(log);
  for (let guard = 0; !c.done && guard < 200; guard++) {
    sawBoard(log, c); if (!c.done) sawBoard(log, c);
    turnLog(c);
  }
  return sawValue(log, c);
}

const stateKey = (c: SawCut) => `${c.top},${c.bottom},${c.left},${c.right},${c.opened.map(Number).join('')}`;
/** The best value any plan can get from the cant as it stands (full knowledge, no clock). */
export function sawBest(log: SawLog, from?: SawCut): number {
  const memo = new Map<string, number>();
  const go = (c: SawCut): number => {
    if (c.done) return sawValue(log, c) - c.boards.reduce((a, b) => a + boardValue(log, b), 0);
    const key = stateKey(c), hit = memo.get(key);
    if (hit !== undefined) return hit;
    let best = cantCells(log, c) * GRADE_VALUE[2];
    for (let f = 0; f < 4; f++) {
      const d: SawCut = {...c, opened:[...c.opened], boards:[], face:f};
      const b = sawBoard(log, d);
      best = Math.max(best, boardValue(log, b) + go(d));
    }
    memo.set(key, best);
    return best;
  };
  const c0 = from ? {...from, opened:[...from.opened], boards:[]} : newSawCut(log);
  return (from ? from.boards.reduce((a, b) => a + boardValue(log, b), 0) : 0) + go(c0);
}

/**
 * The faces a full-knowledge best plan saws, in order (one entry per board; the
 * plan stops early when finishing the cant as Common is worth more). Used by the
 * sim's expert sawyer; one DP per log.
 */
export function sawBestPlan(log: SawLog): number[] {
  const memo = new Map<string, { v: number; f: number }>();
  const go = (c: SawCut): { v: number; f: number } => {
    if (c.done) return { v: cantCells(log, c) * GRADE_VALUE[2], f: -1 };
    const key = stateKey(c), hit = memo.get(key);
    if (hit) return hit;
    let best = { v: cantCells(log, c) * GRADE_VALUE[2], f: -1 };
    for (let f = 0; f < 4; f++) {
      const d: SawCut = {...c, opened:[...c.opened], boards:[], face:f};
      const b = sawBoard(log, d), v = boardValue(log, b) + go(d).v;
      if (v > best.v + 1e-9) best = { v, f };
    }
    memo.set(key, best);
    return best;
  };
  const plan: number[] = [], c = newSawCut(log);
  for (let guard = 0; guard < 400 && !c.done; guard++) {
    const { f } = go({...c, opened:[...c.opened], boards:[]});
    if (f < 0) break;
    c.face = f; sawBoard(log, c); plan.push(f);
  }
  return plan;
}

/**
 * Sawyer's mark: the better move now, from what the sawyer can see.
 * 'saw' when the facing board is at least as good as the best board on the next
 * face round, else 'turn'. Ties favour sawing (turning costs time).
 */
export function sawAdvice(log: SawLog, c: SawCut, eye: boolean): 'saw' | 'turn' {
  if (c.done) return 'saw';
  const k = {eye};
  const score = (b: SawBoard) => (b.grade < 0 ? -1 : 3 - b.grade) * 100 + b.width;
  const here = score(nextBoard(log, c, c.face, k));
  let other = -Infinity;
  for (let f = 0; f < 4; f++) if (f !== c.face) other = Math.max(other, score(nextBoard(log, c, f, k)));
  return here >= other || nextBoard(log, c, c.face, k).grade === -1 && other < 0 ? 'saw' : 'turn';
}

/** Speed bonus: up to +10% for time left on the clock. */
export function sawSpeedBonus(timeLeft: number): number {
  return 0.1 * Math.max(0, Math.min(1, timeLeft / SAW_LIMIT));
}
/** Score (value × speed bonus ÷ par) to quality q: below par 0.5 or less, at par 0.7, 115% of par or more 0.97+. */
export function sawQuality(score: number): number {
  if (score < 1) return Math.max(0.1, 0.5 * score);
  if (score < 1.15) return 0.7 + (score - 1) / 0.15 * 0.27;
  return Math.min(1, 0.97 + (score - 1.15) * 0.3);
}
/** Quarter-sawn boards a top-tier run on a Prime log stamps: 1, or 2 at 125% of par. */
export function quarterSawn(prime: boolean, q: number, score: number): number {
  return prime && q >= 0.97 ? (score >= 1.25 ? 2 : 1) : 0;
}
/** Board feet one cell of a log yields: a medium log (≈ 50 cells) is 5 minutes of one sawyer. */
export function sawCellBf(perSawyerBfMin: number): number {
  return 5 * perSawyerBfMin / 50;
}
/** Grade name of a board grade number. */
export function boardGradeName(g: number): BoardGrade | 'slab' {
  return g === 0 ? 'clear' : g === 1 ? 'select' : g === 2 ? 'common' : 'slab';
}
