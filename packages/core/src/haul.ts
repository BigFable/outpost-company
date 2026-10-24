/**
 * The hauling mini-game ("Drive a load") as pure rules: road generation, rig
 * physics, the competent-driver policy that sets par, and the haul pay bonus.
 * The prototype's haulInit/haulStep/haulFinish call these through window.Core.
 *
 * Grade convention: `haulGrade > 0` is downhill (the road drops towards the
 * cove, screen y grows), `< 0` is a climb.
 */
import type { Season } from './content';
import { perkCount } from './formulas';
import { rngRange, type Rng } from './rng';

/** Road length in game units (the canvas world). */
export const HAUL_LEN = 2600;
/** Where the rig starts. */
export const HAUL_START = 40;
/** End of the guaranteed starting stretch: flat with a gentle downhill tilt. */
export const HAUL_FLAT = 340;
/** Length over which the hills fade in after the starting stretch. */
export const HAUL_RAMP = 420;
/** Grade of the starting stretch (gentle downhill). */
export const HAUL_TILT = 0.03;
/** Steepest grade any generated road may have, up or down. */
export const HAUL_MAX_GRADE = 0.26;
/** Par = the competent driver's time × this margin. */
export const HAUL_PAR_MARGIN = 1.15;
/** Logs over the legal road limit you may choose to load. */
export const HAUL_MAX_OVER = 6;
/** Gravity road: store needed to swallow a runaway, and its cap (speed units). */
export const HAUL_STORE_RUNAWAY = 60;
export const HAUL_STORE_CAP = 160;
/** Ghost (par driver) samples every this many units of road. */
export const HAUL_GHOST_STEP = 20;

export interface HaulTrack {
  readonly L: number; readonly p0: number; readonly p1: number; readonly a0: number; readonly a1: number;
  /** Hill amplitude scale that keeps every grade within HAUL_MAX_GRADE. */
  readonly k: number;
}

const smooth = (u: number): number => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
const hills = (t: HaulTrack, x: number): number => t.a0 * Math.sin(x / 260 + t.p0) + t.a1 * Math.sin(x / 115 + t.p1);
const env = (t: HaulTrack, x: number): number => Math.min(smooth((x - HAUL_FLAT) / HAUL_RAMP), smooth((t.L - x) / 300));

/** Road height (screen y) at x. */
export function haulRoadY(t: HaulTrack, x: number): number {
  return 250 + HAUL_TILT * Math.min(Math.max(x, 0), HAUL_FLAT) - t.k * env(t, x) * hills(t, x);
}

/** Road grade at x (positive = downhill). Same 4-unit stencil the prototype always used. */
export function haulGrade(t: HaulTrack, x: number): number {
  return (haulRoadY(t, x + 2) - haulRoadY(t, x - 2)) / 4;
}

/** A new road. Four draws, in the prototype's old order: p0, p1, a0, a1. */
export function genHaulTrack(rng: Rng): HaulTrack {
  const p0 = rngRange(rng, 0, 6), p1 = rngRange(rng, 0, 6), a0 = rngRange(rng, 45, 70), a1 = rngRange(rng, 15, 30);
  const raw: HaulTrack = { L: HAUL_LEN, p0, p1, a0, a1, k: 1 };
  let g = 0;
  for (let x = HAUL_FLAT; x <= HAUL_LEN; x += 2) g = Math.max(g, Math.abs(haulGrade(raw, x)));
  return { ...raw, k: g > HAUL_MAX_GRADE * 0.98 ? HAUL_MAX_GRADE * 0.98 / g : 1 };
}

// ---------- rig rules

export interface HaulPhys {
  readonly power: number; readonly brake: number; readonly hillBrake: number; readonly drag: number;
  readonly runaway: number; readonly crawl: number; readonly climb: number; readonly jake: number;
  readonly store: boolean; readonly spillMult: number; readonly binders: boolean; readonly massCap: number;
}
export interface HaulRules {
  readonly limit: number; readonly maxOver: number; readonly parMargin: number; readonly lookout: boolean;
  readonly overPay: number; readonly phys: HaulPhys;
}
export interface HaulRulesInput { readonly era: number; readonly season: Season; readonly upg: readonly string[]; readonly perks: readonly string[] }

/** Load limit, physics and par margin for this rig, season, improvements and perks. */
export function haulRules(o: HaulRulesInput): HaulRules {
  const has = (id: string) => o.upg.includes(id), perk = (id: string) => perkCount(o.perks, id) > 0;
  const spring = o.season === 'Spring', winter = o.season === 'Winter';
  const limit = (spring ? (has('corduroy') ? 9 : 7) : 10) + (has('bunks') ? 4 : 0) + (has('binders') ? 2 : 0);
  return {
    limit,
    maxOver: HAUL_MAX_OVER + (perk('overload') ? 4 : 0),
    parMargin: HAUL_PAR_MARGIN * (perk('highball') ? 0.9 : 1),
    lookout: has('lookout'),
    overPay: perk('overload') ? 0.08 : 0.05,
    phys: {
      power: 190 + o.era * 15,
      brake: 240 * (winter ? (has('icerd') ? 0.75 : 0.55) : 1) * (has('airbrakes') ? 2 : 1),
      hillBrake: has('hay') ? 1.6 : 1,
      drag: spring ? (has('corduroy') ? 0.7 : 0.9) : winter && has('icerd') ? 0.45 : 0.6,
      runaway: (has('airbrakes') ? 275 : 235) + (perk('daredevil') ? 40 : 0),
      crawl: has('hillhitch') ? 45 : 18,
      climb: has('hillhitch') ? 1.5 : 1,
      jake: has('roughlock') ? 0.55 : 0,
      store: perk('gravity'),
      spillMult: (perk('daredevil') ? 2 : 1) * (spring && perk('iceking') ? 2 : 1),
      binders: has('binders'),
      massCap: perk('overload') ? limit : Infinity,
    },
  };
}

/** Rig mass for n logs (the prototype's .6 + n/10 × .8). */
export const haulMass = (n: number): number => 0.6 + n / 10 * 0.8;

export interface HaulCar { x: number; v: number; n: number; spill: number; store: number }
export const newHaulCar = (n: number): HaulCar => ({ x: HAUL_START, v: 0, n, spill: 0, store: 0 });

/** Logs a runaway throws off a load of n. */
export function haulSpill(phys: HaulPhys, n: number): number {
  const base = Math.max(1, Math.round(n * 0.3)) * phys.spillMult;
  return Math.min(n, phys.binders ? Math.max(1, Math.ceil(base / 2)) : base);
}

/**
 * Advance the rig by dt (mutates `car`). Returns logs lost to a runaway this
 * step, 0 for none, or -1 when the gravity store swallowed a runaway.
 */
export function haulStepCar(t: HaulTrack, p: HaulPhys, car: HaulCar, gas: boolean, brk: boolean, dt: number): number {
  const sl = haulGrade(t, car.x), m = haulMass(Math.min(car.n, p.massCap));
  const pull = 400 * sl, bk = p.brake * (sl > 0.02 ? p.hillBrake : 1) / m;
  let a = (gas ? p.power * (sl < 0 ? p.climb : 1) / m : 0) + pull - p.drag * car.v - (brk ? bk : 0);
  if (!gas && sl > 0 && p.jake) a -= p.jake * pull; // rough locks / engine brake hold back off the gas
  if (p.store){
    if (brk && sl > 0) car.store = Math.min(HAUL_STORE_CAP, car.store + bk * dt * 0.5);
    if (sl < 0 && car.store > 0){ const use = Math.min(-pull * dt, car.store); a += use / dt; car.store -= use; }
  }
  car.v = Math.min(320, Math.max(0, car.v + a * dt));
  if (gas && car.v < p.crawl) car.v = p.crawl; // low gear: you can always grind up a hill
  car.x += car.v * dt;
  if (car.v > p.runaway && sl > 0.06){
    car.v = 80;
    if (p.store && car.store >= HAUL_STORE_RUNAWAY){ car.store = 0; return -1; }
    const lost = haulSpill(p, car.n);
    car.n -= lost; car.spill += lost;
    return lost;
  }
  return 0;
}

/** The competent driver: gas below the comfort band, brake on downgrades near the runaway line. */
export function haulPolicy(p: HaulPhys, v: number, sl: number): { gas: boolean; brk: boolean } {
  const down = sl > 0.02;
  return { gas: !down || v < p.runaway - 60, brk: down && v > p.runaway - 30 };
}

export interface HaulDrive { readonly time: number; readonly spill: number; readonly ghost: readonly number[] }

/** Drive the whole road with the competent-driver policy at a fixed step. `ghost[i]` = time at x = i × HAUL_GHOST_STEP. */
export function haulDrive(t: HaulTrack, p: HaulPhys, n: number, dt = 1 / 60): HaulDrive {
  const car = newHaulCar(n), ghost: number[] = [0];
  let time = 0;
  while (car.x < t.L && time < 600){
    const c = haulPolicy(p, car.v, haulGrade(t, car.x));
    haulStepCar(t, p, car, c.gas, c.brk, dt);
    time += dt;
    while (ghost.length * HAUL_GHOST_STEP <= Math.min(car.x, t.L)) ghost.push(time);
  }
  return { time, spill: car.spill, ghost };
}

/** Par in whole seconds, from the competent driver on this road with this load. */
export function haulPar(t: HaulTrack, r: HaulRules, n: number): { par: number; ghost: readonly number[] } {
  const d = haulDrive(t, r.phys, n);
  return { par: Math.ceil(d.time * r.parMargin), ghost: d.ghost.map((g) => g * r.parMargin) };
}

/** Par-pace time at x, read from the ghost (linear between samples). */
export function haulGhostAt(ghost: readonly number[], x: number): number {
  const f = Math.max(0, x) / HAUL_GHOST_STEP, i = Math.floor(f);
  if (i >= ghost.length - 1) return ghost[ghost.length - 1] ?? 0;
  const a = ghost[i] ?? 0, b = ghost[i + 1] ?? a;
  return a + (b - a) * (f - i);
}

// ---------- pay

export interface HaulResult { readonly n0: number; readonly n: number; readonly limit: number; readonly spill: number; readonly t: number; readonly par: number; readonly overPay?: number }
export interface HaulBonus {
  /** Delivered logs over the legal limit (0..1). */
  readonly fill: number; readonly over: number;
  /** Bonus shares of the load's sale price. */
  readonly load: number; readonly overweight: number; readonly clean: number; readonly pace: number; readonly total: number;
  /** Seconds under par (negative = over). */
  readonly ahead: number;
}

/**
 * The haul bonus, as shares of the load's sale price. Never negative: a full
 * legal load earns the most load bonus, an overweight load delivered whole
 * earns a premium per extra log, and beating par pays more the further ahead.
 */
export function haulBonus(r: HaulResult): HaulBonus {
  const fill = r.limit > 0 ? Math.min(r.n, r.limit) / r.limit : 0, over = Math.max(0, r.n0 - r.limit);
  const whole = r.spill === 0 && r.n > 0;
  const load = r.n > 0 ? 0.25 * fill * fill : 0;
  const overweight = whole ? (r.overPay ?? 0.05) * over : 0;
  const clean = whole ? 0.1 : 0;
  const ahead = r.par - r.t;
  const pace = r.n > 0 && ahead >= 0 ? (0.1 + 0.2 * Math.min(1, ahead / (0.2 * r.par))) * (whole ? 1 : 0.5) : 0;
  return { fill, over, load, overweight, clean, pace, total: load + overweight + clean + pace, ahead };
}
