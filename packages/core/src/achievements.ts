/**
 * Achievements and improvement unlock requirements as data (tech plan 2.1 principle 3).
 * Conditions read named metrics through a callback, so the caller decides where
 * the numbers come from (the prototype reads its save state; M3 reads GameState).
 *
 * Achievements rework (2026-10-28, docs/design/achievements-rework.md): three tiers
 * that follow the game's real milestones. "First outpost" can all be earned before
 * the first close camp; every "Across outposts" and "Long haul" achievement needs at
 * least one close camp, either through an explicit `closes` condition or a metric
 * that only moves once camp has closed (AFTER_CLOSE_METRICS). Tests hold both rules.
 */
import { deepFreeze } from './freeze';
import { IMPROVEMENT_ALT_REQS, IMPROVEMENT_REQS, type StatRequirement } from './content';
import { ITEMS } from './items';

/** Numbers an achievement condition can test. All are company lifetime numbers unless noted. */
export type AchMetric =
  | 'deliv' | 'earned' | 'felled' | 'tracts' | 'hires' | 'contracts' | 'winters'
  /** Current outpost: crews and machines owned, the era, stages with a working crew (0-4). */
  | 'crew' | 'era' | 'crewedStages'
  | 'perfFell' | 'perfBuck' | 'cleanSkid' | 'cleanHaul'
  /** Mini-games played, per game. */
  | 'run_fell' | 'run_buck' | 'run_skid' | 'run_haul'
  /** Bad weather seasons ridden out in full; Almanac cards seen. */
  | 'storms' | 'almanac'
  /** Outposts closed (close camp); Charter Shares earned in all (Logging). */
  | 'closes' | 'shares'
  /** Land office slots open (1-4); AFK lots bought. */
  | 'slots' | 'afkLots'
  /** Prime logs made (not counting the founding crate); special orders filled; most charter orders running at once. */
  | 'prime' | 'spOrders' | 'maxOrders'
  /** Kinds of tree felled (0-6). */
  | 'species'
  /** Perks picked (Logging and Sawmill); curse perks picked. */
  | 'perks' | 'curses'
  /** Mill runs closed; top results in Saw boards; bunkhouse level; wood sent to the mill. */
  | 'millRuns' | 'sawTop' | 'bunk' | 'toMill'
  /** Fastest Steam Camp (minutes after landing) on any outpost after the first; undefined until one. */
  | 'steamLater'
  /** Outposts closed faster than the first one; outposts that reached Diesel Road. */
  | 'beatFirst' | 'dieselRuns'
  /** Fog lenses found; kinds of warehouse item found (of ITEMS). */
  | 'fogLens' | 'items';

export interface AchCondition { readonly metric: AchMetric; readonly op: '>=' | '>' | '<='; readonly value: number }

/** first: the first outpost; across: needs closing camp; long: collections and the long haul (also needs closing camp). */
export type AchTier = 'first' | 'across' | 'long';
export interface AchTierDef { readonly id: AchTier; readonly name: string; readonly desc: string }
export const ACH_TIERS: readonly AchTierDef[] = deepFreeze([
  { id: 'first', name: 'First outpost', desc: 'Goals for your first landing.' },
  { id: 'across', name: 'Across outposts', desc: 'Close camp and land again to earn these.' },
  { id: 'long', name: 'Long haul', desc: 'Collections and big numbers over many outposts.' },
]);

export interface AchievementDef {
  readonly id: string;
  readonly name: string;
  readonly desc: string;
  readonly cash: number;
  readonly rep: number;
  readonly tier: AchTier;
  /** All must hold. */
  readonly when: readonly AchCondition[];
  /**
   * Ladder achievements show a progress bar and pay repeat bounties; their
   * first condition's metric is the bounty metric.
   */
  readonly ladder: boolean;
}

/** Reads a metric's current value. May return undefined for a stat an old save lacks. */
export type MetricReader = (metric: AchMetric) => number | undefined;

/** Metrics that stay at 0 (or undefined) until the company first closes camp. */
export const AFTER_CLOSE_METRICS: readonly AchMetric[] = deepFreeze<AchMetric[]>([
  'closes', 'shares', 'millRuns', 'sawTop', 'bunk', 'toMill', 'steamLater', 'beatFirst',
]);

const atLeast = (metric: AchMetric, value: number): AchCondition => ({ metric, op: '>=', value });
const closes = (n: number): AchCondition => atLeast('closes', n);
const ladder = (tier: AchTier, id: string, name: string, desc: string, metric: AchMetric, target: number, cash: number, rep: number, extra: AchCondition[] = []): AchievementDef =>
  ({ id, name, desc, cash, rep, tier, when: [atLeast(metric, target), ...extra], ladder: true });
const once = (tier: AchTier, id: string, name: string, desc: string, when: AchCondition[], cash: number, rep = 0): AchievementDef =>
  ({ id, name, desc, cash, rep, tier, when, ladder: false });

/** Kinds of item in the warehouse collection. */
const ITEM_KINDS = ITEMS.length;

export const ACHIEVEMENTS: readonly AchievementDef[] = deepFreeze([
  // ---------- First outpost (23): what a normal first landing reaches. Cash merged from the old early ladders keeps run 1's pace.
  once('first', 'first_tree', 'Timber!', 'Fell your first tree.', [atLeast('felled', 1)], 10),
  once('first', 'first_sale', 'First load', 'Deliver logs to the cove.', [{ metric: 'deliv', op: '>', value: 0 }], 15),
  once('first', 'first_crew', 'On the payroll', 'Hire your first crew.', [atLeast('crew', 1)], 25),
  ladder('first', 'w1', 'Wintered over', 'Work through a winter.', 'winters', 1, 250, 0),
  once('first', 'full_chain', 'Every stage crewed', 'Have a crew working all four stages.', [atLeast('crewedStages', 4)], 100, 1),
  ladder('first', 'c5', 'Reliable supplier', 'Fill 5 charter orders.', 'contracts', 5, 1750, 1),
  ladder('first', 'crew30', 'Big outfit', 'Own 30 crews or machines.', 'crew', 30, 4400, 1),
  ladder('first', 'd50k', 'Fifty thousand wood', 'Deliver 50,000 wood.', 'deliv', 5e4, 950, 1),
  once('first', 'prime1', 'Stamped Prime', 'Make your first Prime log.', [atLeast('prime', 1)], 100),
  once('first', 'slot4', 'Full land office', 'Open all four land office slots.', [atLeast('slots', 4)], 1050, 1),
  ladder('first', 'tr10', 'Ten lots', 'Finish 10 lots.', 'tracts', 10, 2800, 1),
  once('first', 'era1', 'Full steam', 'Reach Steam Camp.', [atLeast('era', 1)], 0, 2),
  ladder('first', 't1k', 'Thousand trees', 'Fell 1,000 trees.', 'felled', 1000, 12700, 1),
  ladder('first', 'crew75', 'Industrial outfit', 'Own 75 crews or machines.', 'crew', 75, 100000, 2),
  ladder('first', 'crew120', 'Company of the Reach', 'Own 120 crews or machines.', 'crew', 120, 500000, 2),
  ladder('first', 'd1m', 'A million wood', 'Deliver 1,000,000 wood.', 'deliv', 1e6, 7800, 2),
  ladder('first', 'd3m', 'Three million wood', 'Deliver 3 million wood.', 'deliv', 3e6, 33500, 1),
  ladder('first', 'e1m', 'Millionaire charter', 'Earn $1M in sales.', 'earned', 1e6, 33000, 1),
  ladder('first', 'tr30', 'Thirty lots', 'Finish 30 lots.', 'tracts', 30, 63000, 2),
  ladder('first', 't10k', 'Ten thousand trees', 'Fell 10,000 trees.', 'felled', 1e4, 40000, 1),
  once('first', 'sp1', 'Special delivery', 'Fill a special order from the charter board.', [atLeast('spOrders', 1)], 1000, 1),
  once('first', 'allround', 'All-around logger', 'Get a clean run in every mini-game.', [atLeast('perfFell', 1), atLeast('perfBuck', 1), atLeast('cleanSkid', 1), atLeast('cleanHaul', 1)], 1500, 2),
  once('first', 'era2', 'Diesel Road', 'Reach Diesel Road.', [atLeast('era', 2)], 0, 2),

  // ---------- Across outposts (27): close camp, open the Sawmill, land faster.
  once('across', 'close1', 'Loaded the ship', 'Close camp for the first time.', [closes(1)], 250, 1),
  once('across', 'close3', 'Third charter', 'Close camp 3 times.', [closes(3)], 2000, 2),
  once('across', 'beatfirst', 'Old hands', 'Close an outpost faster than your first.', [atLeast('beatFirst', 1)], 1000, 2),
  once('across', 'quicksteam', 'Quick steam', 'On a later outpost, reach Steam Camp within 15 minutes.', [{ metric: 'steamLater', op: '<=', value: 15 }], 1000, 1),
  once('across', 'diesel3', 'Diesel veteran', 'Reach Diesel Road in 3 outposts.', [atLeast('dieselRuns', 3), closes(2)], 10000, 2),
  once('across', 'shares50', 'Board favorite', 'Earn 50 Charter Shares in all.', [atLeast('shares', 50)], 500, 1),
  once('across', 'mill1', 'Saw it here', 'Close your first mill run.', [atLeast('millRuns', 1)], 750, 1),
  once('across', 'tomill', 'Logs for the mill', 'Send 100,000 wood to the Sawmill.', [atLeast('toMill', 1e5)], 750, 1),
  once('across', 'bunk3', 'Full bunkhouse', 'Build the bunkhouse to level 3.', [atLeast('bunk', 3)], 2000, 2),
  once('across', 'sawtop', 'Top sawyer', 'Get top sawing in Saw boards.', [atLeast('sawTop', 1)], 400, 1),
  once('across', 'sp3', 'Charter regular', 'Fill 3 special orders.', [atLeast('spOrders', 3), closes(1)], 1500, 2),
  once('across', 'orders3', 'Busy clerks', 'Run 3 charter orders at once.', [atLeast('maxOrders', 3), closes(1)], 750, 1),
  once('across', 'afk3', 'Away on business', 'Buy 3 AFK lots.', [atLeast('afkLots', 3), closes(1)], 750, 1),
  once('across', 'perks30', 'Seasoned charter', 'Pick 30 perks.', [atLeast('perks', 30), closes(1)], 1000, 1),
  once('across', 'curse3', 'Cursed but rich', 'Take 3 curse perks.', [atLeast('curses', 3), closes(1)], 750, 1),
  ladder('across', 't30k', 'Thirty thousand trees', 'Fell 30,000 trees.', 'felled', 3e4, 80000, 1, [closes(1)]),
  ladder('across', 'd10m', 'Ten million wood', 'Deliver 10 million wood.', 'deliv', 1e7, 50000, 3, [closes(1)]),
  ladder('across', 'e5m', 'Five million in sales', 'Earn $5M in sales.', 'earned', 5e6, 60000, 1, [closes(1)]),
  ladder('across', 'tr45', 'Forty-five lots', 'Finish 45 lots.', 'tracts', 45, 20000, 1, [closes(1)]),
  ladder('across', 'tr60', 'Sixty lots', 'Finish 60 lots.', 'tracts', 60, 60000, 2, [closes(1)]),
  ladder('across', 'c50', 'Steady supplier', 'Fill 50 charter orders.', 'contracts', 50, 25000, 1, [closes(1)]),
  ladder('across', 'w10', 'Ten winters', 'Work through ten winters.', 'winters', 10, 15000, 1, [closes(1)]),
  ladder('across', 'wx10', 'Ten storms', 'Ride out 10 bad-weather seasons to the end.', 'storms', 10, 900, 1, [closes(1)]),
  ladder('across', 'pf25', 'Faller of note', 'Land 25 perfect falls.', 'perfFell', 25, 600, 1, [closes(1)]),
  ladder('across', 'pb25', 'Grader’s favorite', 'Cut 25 trunks for full value.', 'perfBuck', 25, 600, 1, [closes(1)]),
  ladder('across', 'cs25', 'Teamster', 'Make 25 clean skids.', 'cleanSkid', 25, 600, 1, [closes(1)]),
  ladder('across', 'ch25', 'Road boss', 'Make 25 clean hauls.', 'cleanHaul', 25, 600, 1, [closes(1)]),

  // ---------- Long haul (13): collections and the road to Landfall City.
  once('long', 'close5', 'Five outposts', 'Close camp 5 times.', [closes(5)], 5000, 2),
  once('long', 'close10', 'Ten outposts', 'Close camp 10 times.', [closes(10)], 20000, 3),
  once('long', 'era3', 'Into the Interior', 'Reach Into the Interior.', [atLeast('era', 3), closes(1)], 0, 3),
  once('long', 'shares200', 'Charter partner', 'Earn 200 Charter Shares in all.', [atLeast('shares', 200)], 10000, 2),
  once('long', 'mill5', 'Mill master', 'Close 5 mill runs.', [atLeast('millRuns', 5)], 5000, 2),
  once('long', 'alltrees', 'Every tree on the coast', 'Fell all six kinds of tree, redwood too.', [atLeast('species', 6), closes(1)], 5000, 2),
  once('long', 'wxall', 'Every season’s card', 'See every weather card in the Almanac.', [atLeast('almanac', 16), closes(1)], 1500, 2),
  once('long', 'fog3', 'Fog collector', 'Find 3 fog lenses.', [atLeast('fogLens', 3), closes(1)], 3000, 1),
  once('long', 'items', 'Full warehouse', 'Find every kind of item in the warehouse.', [atLeast('items', ITEM_KINDS), closes(1)], 5000, 2),
  once('long', 'sp10', 'Charter house', 'Fill 10 special orders.', [atLeast('spOrders', 10), closes(1)], 5000, 2),
  ladder('long', 'c100', 'Company supplier', 'Fill 100 charter orders.', 'contracts', 100, 150000, 2, [closes(1)]),
  ladder('long', 'd100m', 'A hundred million', 'Deliver 100 million wood.', 'deliv', 1e8, 900000, 3, [closes(3)]),
  ladder('long', 'e100m', 'Founders of Landfall', 'Earn $100M in sales.', 'earned', 1e8, 2e6, 2, [closes(3)]),
]);

const ACH_BY_ID: ReadonlyMap<string, AchievementDef> = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));
export function achievementDef(id: string): AchievementDef | undefined { return ACH_BY_ID.get(id); }

/**
 * Old saves: earned ids from before the rework that now live on under another id.
 * Every other id that is no longer in ACHIEVEMENTS is dropped (its cash and reputation stay paid).
 */
export const ACH_RENAMED: Readonly<Record<string, string>> = deepFreeze({ c20: 'c5', crew50: 'crew30', w5: 'w1' });

/** An old save's earned list: kept ids stay in order, renamed ones map, unknown ones drop, no repeats. */
export function migrateAchievements(ids: readonly unknown[]): string[] {
  const out: string[] = [];
  for (const raw of Array.isArray(ids) ? ids : []) {
    if (typeof raw !== 'string') continue;
    const id = ACH_BY_ID.has(raw) ? raw : ACH_RENAMED[raw];
    if (id && ACH_BY_ID.has(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

function holds(c: AchCondition, read: MetricReader): boolean {
  const v = read(c.metric);
  if (v === undefined || v === null || Number.isNaN(v)) return false;
  return c.op === '>' ? v > c.value : c.op === '<=' ? v <= c.value : v >= c.value;
}

/** True when every condition holds. */
export function achievementMet(def: AchievementDef, read: MetricReader): boolean {
  return def.when.every((c) => holds(c, read));
}

/** [current, target] for a ladder achievement's progress bar; null for one-off achievements. */
export function achievementProgress(def: AchievementDef, read: MetricReader): [number | undefined, number] | null {
  const c = def.when[0];
  if (!def.ladder || !c) return null;
  return [read(c.metric), c.value];
}

/**
 * [current, target] for the achievements list: the first condition that counts
 * up to a target above 1 (not the close-camp gate). Null when there is nothing to count.
 */
export function achievementBar(def: AchievementDef, read: MetricReader): [number, number] | null {
  const c = def.when.find((x) => x.metric !== 'closes' && x.op === '>=' && x.value > 1);
  if (!c) return null;
  return [Math.max(0, read(c.metric) ?? 0), c.value];
}

/**
 * Close camps this achievement needs before it can be earned: its `closes`
 * condition, or 1 when it reads a metric that only moves after a close camp; 0 for first-outpost ones.
 */
export function closesNeeded(def: AchievementDef): number {
  let n = 0;
  for (const c of def.when) {
    if (c.metric === 'closes') n = Math.max(n, c.value);
    else if (AFTER_CLOSE_METRICS.includes(c.metric)) n = Math.max(n, 1);
  }
  return n;
}

/** The metric a repeat bounty measures for this achievement (ladders only). */
export function bountyMetric(def: AchievementDef): AchMetric | null {
  return def.ladder && def.when[0] ? def.when[0].metric : null;
}

/** Repeat bounties pay this share of the original cash reward. */
export const BOUNTY_RATE = 0.25;
/** Repeat bounties pay an outpost at most this share of the cost of its next push inland. */
export const BOUNTY_CAP = 0.2;
/**
 * New achievements and repeat bounties met this outpost ("goals") queue a perk
 * pick every this many. 3 since the rework (was 5): the first outpost has 23
 * achievements, not 58, so a first landing still earns about as many perk picks.
 */
export const GOALS_PER_DRAFT = 3;

/**
 * One achievement pays at most this share of the next push inland now (of the current era's cost at the
 * last era); the board holds the rest and pays it when the outpost reaches its next era. Since the rework,
 * achievements already met in an earlier outpost unlock the moment camp closes, so without this a new
 * landing at the cove could collect $200,000 and skip straight past Steam Camp.
 */
export const ACH_PAY_CAP = 0.5;
export function achievementPayCap(nextEraCost: number, currentEraCost: number): number {
  return Math.round(ACH_PAY_CAP * (Number.isFinite(nextEraCost) ? nextEraCost : currentEraCost));
}
/** [paid now, held for the next era] for `cash` owed under `cap`. */
export function splitReward(cash: number, cap: number): [number, number] {
  const c = Math.max(0, cash), now = Math.min(c, Math.max(0, cap));
  return [now, c - now];
}

/**
 * Most repeat-bounty cash one outpost can collect: BOUNTY_CAP of the next era's
 * cost, or of the current era's cost once the last era is reached.
 */
export function bountyCap(nextEraCost: number, currentEraCost: number): number {
  return Math.round(BOUNTY_CAP * (Number.isFinite(nextEraCost) ? nextEraCost : currentEraCost));
}

/** Cash one repeat bounty pays: BOUNTY_RATE of the reward, limited by what the cap has left (never negative). */
export function bountyPay(cash: number, cap: number, paidSoFar: number): number {
  return Math.max(0, Math.min(Math.round(cash * BOUNTY_RATE), cap - paidSoFar));
}

/** [current, target] for an improvement unlock: the sum of the named run stats. */
export function requirementProgress(req: StatRequirement, stats: Readonly<Record<string, number | undefined>>): [number, number] {
  return [req.stats.reduce((a, k) => a + (stats[k] || 0), 0), req.target];
}

/**
 * [current, target] of whichever unlock route (mini-game or crews') is closer
 * to done. The crews' route may read the derived stat `achievements` (count of
 * achievements earned), which the caller adds to `stats`.
 */
export function improvementProgress(id: string, stats: Readonly<Record<string, number | undefined>>): [number, number] {
  const req = IMPROVEMENT_REQS[id], alt = IMPROVEMENT_ALT_REQS[id];
  const a: [number, number] = req ? requirementProgress(req, stats) : [0, 1];
  const b = alt ? requirementProgress(alt, stats) : null;
  return b && b[0] / b[1] > a[0] / a[1] ? b : a;
}

/** Unlock text naming both routes: "Finish 3 skidding runs, or fill 6 charter orders". */
export function improvementReqText(id: string): string {
  const req = IMPROVEMENT_REQS[id], alt = IMPROVEMENT_ALT_REQS[id];
  if (!req) return alt ? alt.text : '';
  return req.text + (alt ? ', or ' + alt.text.charAt(0).toLowerCase() + alt.text.slice(1) : '');
}
