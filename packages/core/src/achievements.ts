/**
 * Achievements and improvement unlock requirements as data (tech plan 2.1 principle 3).
 * Conditions read named metrics through a callback, so the caller decides where
 * the numbers come from (the prototype reads its save state; M3 reads GameState).
 */
import { deepFreeze } from './freeze';
import { IMPROVEMENT_ALT_REQS, IMPROVEMENT_REQS, type StatRequirement } from './content';

/** Numbers an achievement condition can test. `crewedStages` = stages with a working crew (0-4). */
export type AchMetric =
  | 'deliv' | 'earned' | 'felled' | 'tracts' | 'hires' | 'contracts' | 'crew' | 'winters'
  | 'perfFell' | 'perfBuck' | 'cleanSkid' | 'cleanHaul' | 'era' | 'crewedStages'
  /** Bad weather events weathered in full; Almanac cards seen (seasonal events). */
  | 'storms' | 'almanac';

export interface AchCondition { readonly metric: AchMetric; readonly op: '>=' | '>'; readonly value: number }

export interface AchievementDef {
  readonly id: string;
  readonly name: string;
  readonly desc: string;
  readonly cash: number;
  readonly rep: number;
  /** All must hold. */
  readonly when: readonly AchCondition[];
  /**
   * Ladder achievements show a progress bar and pay repeat bounties; their
   * single condition's metric is the bounty metric.
   */
  readonly ladder: boolean;
}

/** Reads a metric's current value. May return undefined for a stat an old save lacks. */
export type MetricReader = (metric: AchMetric) => number | undefined;

const ladder = (id: string, name: string, desc: string, metric: AchMetric, target: number, cash: number, rep: number): AchievementDef =>
  ({ id, name, desc, cash, rep, when: [{ metric, op: '>=', value: target }], ladder: true });
const once = (id: string, name: string, desc: string, when: AchCondition[], cash: number, rep = 0): AchievementDef =>
  ({ id, name, desc, cash, rep, when, ladder: false });
const atLeast = (metric: AchMetric, value: number): AchCondition => ({ metric, op: '>=', value });

export const ACHIEVEMENTS: readonly AchievementDef[] = deepFreeze([
  once('first_tree', 'Timber!', 'Fell your first tree.', [atLeast('felled', 1)], 10),
  once('first_sale', 'First load', 'Deliver logs to the cove.', [{ metric: 'deliv', op: '>', value: 0 }], 15),
  once('first_crew', 'On the payroll', 'Hire your first crew.', [atLeast('crew', 1)], 25),
  once('full_chain', 'Stump to mill', 'Have a crew working every stage.', [atLeast('crewedStages', 4)], 100, 1),
  ladder('d10k', '10 MBF', 'Deliver 10,000 bd ft.', 'deliv', 1e4, 150, 1),
  ladder('d50k', '50 MBF', 'Deliver 50,000 bd ft.', 'deliv', 5e4, 500, 1),
  ladder('d250k', 'Quarter million', 'Deliver 250,000 bd ft.', 'deliv', 2.5e5, 1800, 2),
  ladder('d1m', 'A million board feet', 'Deliver 1,000,000 bd ft.', 'deliv', 1e6, 6000, 2),
  ladder('d2m', 'Second shift', 'Deliver 2 million bd ft.', 'deliv', 2e6, 10000, 1),
  ladder('d3m', 'Three million', 'Deliver 3 million bd ft.', 'deliv', 3e6, 20000, 1),
  ladder('d10m', 'Ten million', 'Deliver 10 million bd ft.', 'deliv', 1e7, 70000, 3),
  ladder('d30m', 'Thirty million', 'Deliver 30 million bd ft.', 'deliv', 3e7, 250000, 2),
  ladder('d100m', 'A hundred million', 'Deliver 100 million bd ft.', 'deliv', 1e8, 900000, 3),
  ladder('d300m', 'Three hundred million', 'Deliver 300 million bd ft.', 'deliv', 3e8, 3e6, 2),
  ladder('d1b', 'A billion board feet', 'Deliver 1 billion bd ft.', 'deliv', 1e9, 12e6, 5),
  ladder('e10k', 'Ten thousand dollars', 'Earn $10K in sales.', 'earned', 1e4, 300, 0),
  ladder('e100k', 'Six figures', 'Earn $100K in sales.', 'earned', 1e5, 3000, 1),
  ladder('e1m', 'Millionaire charter', 'Earn $1M in sales.', 'earned', 1e6, 30000, 1),
  ladder('e5m', 'Five million in sales', 'Earn $5M in sales.', 'earned', 5e6, 120000, 1),
  ladder('e25m', 'Toast of the board', 'Earn $25M in sales.', 'earned', 2.5e7, 600000, 2),
  ladder('e100m', 'Founders of Landfall', 'Earn $100M in sales.', 'earned', 1e8, 2e6, 2),
  ladder('t100', 'Hundred trees', 'Fell 100 trees.', 'felled', 100, 200, 0),
  ladder('t1k', 'Thousand trees', 'Fell 1,000 trees.', 'felled', 1000, 2500, 1),
  ladder('t3k', 'Three thousand trees', 'Fell 3,000 trees.', 'felled', 3000, 10000, 1),
  ladder('t10k', 'Ten thousand trees', 'Fell 10,000 trees.', 'felled', 1e4, 40000, 2),
  ladder('t30k', 'Thirty thousand trees', 'Fell 30,000 trees.', 'felled', 3e4, 200000, 1),
  ladder('t100k', 'A hundred thousand', 'Fell 100,000 trees.', 'felled', 1e5, 700000, 3),
  ladder('tr3', 'Cut out', 'Finish 3 lots.', 'tracts', 3, 300, 0),
  ladder('tr10', 'Ten lots', 'Finish 10 lots.', 'tracts', 10, 2500, 1),
  ladder('tr30', 'Thirty lots', 'Finish 30 lots.', 'tracts', 30, 30000, 2),
  ladder('tr60', 'Sixty lots', 'Finish 60 lots.', 'tracts', 60, 150000, 2),
  ladder('hire1', 'Hired hands', 'Finish a hire job.', 'hires', 1, 150, 0),
  ladder('c1', 'Under contract', 'Fill an order.', 'contracts', 1, 250, 0),
  ladder('c5', 'Reliable supplier', 'Fill 5 orders.', 'contracts', 5, 1500, 1),
  ladder('c10', 'Steady supplier', 'Fill 10 orders.', 'contracts', 10, 8000, 1),
  ladder('c20', 'Preferred supplier', 'Fill 16 orders.', 'contracts', 16, 25000, 2),
  ladder('crew10', 'Ten-crew outfit', 'Own 10 crews or machines.', 'crew', 10, 400, 0),
  ladder('crew30', 'Big outfit', 'Own 30 crews or machines.', 'crew', 30, 4000, 1),
  ladder('crew75', 'Industrial outfit', 'Own 75 crews or machines.', 'crew', 75, 80000, 2),
  ladder('crew50', 'Fifty-crew outfit', 'Own 50 crews or machines.', 'crew', 50, 20000, 1),
  ladder('crew120', 'Company of the Reach', 'Own 120 crews or machines.', 'crew', 120, 500000, 2),
  ladder('w1', 'Wintered over', 'Work through a winter.', 'winters', 1, 250, 0),
  ladder('w5', 'Five winters', 'Work through five winters.', 'winters', 5, 3500, 1),
  ladder('w10', 'Ten winters', 'Work through ten winters.', 'winters', 10, 30000, 1),
  ladder('pf1', 'Right on target', 'Land a perfect fall.', 'perfFell', 1, 60, 0),
  ladder('pf10', 'Faller of note', 'Land 10 perfect falls.', 'perfFell', 10, 900, 1),
  ladder('pb1', 'Full value', 'Cut a trunk for full value.', 'perfBuck', 1, 60, 0),
  ladder('pb10', 'Grader’s favorite', 'Cut 10 trunks for full value.', 'perfBuck', 10, 900, 1),
  ladder('cs1', 'Clean skid', 'Beat the skid target time with no stump hits.', 'cleanSkid', 1, 60, 0),
  ladder('cs10', 'Teamster', 'Make 10 clean skids.', 'cleanSkid', 10, 900, 1),
  ladder('ch1', 'Clean haul', 'Beat the haul target with a full load, nothing lost.', 'cleanHaul', 1, 60, 0),
  ladder('ch10', 'Road boss', 'Make 10 clean hauls.', 'cleanHaul', 10, 900, 1),
  once('allround', 'All-around logger', 'Get a clean run in every mini-game.', [atLeast('perfFell', 1), atLeast('perfBuck', 1), atLeast('cleanSkid', 1), atLeast('cleanHaul', 1)], 1500, 2),
  ladder('wx10', 'Ten storms', 'Ride out 10 bad-weather seasons to the end.', 'storms', 10, 900, 1),
  once('wxall', 'Every season’s card', 'See every weather card.', [atLeast('almanac', 16)], 1500, 2),
  once('era1', 'Full steam', 'Reach Steam Camp.', [atLeast('era', 1)], 0, 2),
  once('era2', 'Diesel Road', 'Reach Diesel Road.', [atLeast('era', 2)], 0, 2),
  once('era3', 'Into the Interior', 'Reach Into the Interior.', [atLeast('era', 3)], 0, 3),
]);

function holds(c: AchCondition, read: MetricReader): boolean {
  const v = read(c.metric);
  if (v === undefined) return false;
  return c.op === '>' ? v > c.value : v >= c.value;
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

/** The metric a repeat bounty measures for this achievement (ladders only). */
export function bountyMetric(def: AchievementDef): AchMetric | null {
  return def.ladder && def.when[0] ? def.when[0].metric : null;
}

/** Repeat bounties pay this share of the original cash reward. */
export const BOUNTY_RATE = 0.25;
/** Repeat bounties pay an outpost at most this share of the cost of its next push inland. */
export const BOUNTY_CAP = 0.2;

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
