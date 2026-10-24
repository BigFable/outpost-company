import { describe, expect, it } from 'vitest';
import type { Season } from './content';
import {
  genHaulTrack, haulBonus, haulDrive, haulGhostAt, haulGrade, haulPar, haulRules, haulSpill, haulStepCar, newHaulCar,
  HAUL_FLAT, HAUL_LEN, HAUL_MAX_GRADE, HAUL_START, HAUL_STORE_RUNAWAY,
} from './haul';
import { scripted, simLcg } from './test-rng';

const SEASONS: Season[] = ['Spring', 'Summer', 'Fall', 'Winter'];
const KITS: string[][] = [[], ['hay', 'bunks'], ['hay', 'bunks', 'corduroy', 'icerd', 'airbrakes'], ['roughlock', 'hillhitch', 'binders', 'lookout']];
const PERKS: string[][] = [[], ['daredevil'], ['overload'], ['gravity', 'highball'], ['iceking']];

describe('haul road', () => {
  it('draws p0, p1, a0, a1 in that order (4 draws)', () => {
    const r = scripted([0.5, 0.25, 0, 1 - 1e-9]);
    const t = genHaulTrack(r);
    expect(r.used()).toBe(4);
    expect([t.p0, t.p1, t.a0]).toEqual([3, 1.5, 45]);
    expect(t.a1).toBeCloseTo(30, 6);
  });
  it('never exceeds the max grade', () => {
    for (let s = 1; s <= 200; s++) {
      const t = genHaulTrack(simLcg(s));
      for (let x = 0; x <= HAUL_LEN; x += 3) expect(Math.abs(haulGrade(t, x))).toBeLessThanOrEqual(HAUL_MAX_GRADE + 1e-9);
    }
  });
  it('starts flat or gently downhill and launches clean from a standstill for every load, season and kit', () => {
    let checked = 0;
    for (let s = 1; s <= 40; s++) {
      const t = genHaulTrack(simLcg(s));
      for (let x = 0; x <= HAUL_FLAT; x += 2) expect(haulGrade(t, x)).toBeGreaterThanOrEqual(0);
      for (const season of SEASONS) for (const upg of KITS) for (const perks of PERKS) {
        const r = haulRules({ era: s % 4, season, upg, perks });
        for (const n of [1, r.limit, r.limit + r.maxOver]) {
          const car = newHaulCar(n); let prev = 0, time = 0;
          while (car.x < HAUL_FLAT) {
            haulStepCar(t, r.phys, car, true, false, 1 / 60); time += 1 / 60;
            expect(car.v).toBeGreaterThanOrEqual(prev - 1e-9); // never loses speed: no stall-out
            prev = car.v;
          }
          expect(time).toBeLessThan(4);
          expect(car.spill).toBe(0);
          checked++;
        }
      }
    }
    expect(checked).toBe(40 * 4 * 4 * 5 * 3);
  }, 60000);
});

describe('par', () => {
  it('is reachable by the competent driver without losing a log, at par and finer frame steps', () => {
    for (let s = 1; s <= 80; s++) {
      const t = genHaulTrack(simLcg(s));
      for (const season of SEASONS) for (const upg of [KITS[0] as string[], KITS[2] as string[]]) for (const perks of PERKS) {
        const r = haulRules({ era: s % 4, season, upg, perks });
        for (const n of [r.limit, r.limit + r.maxOver]) {
          const { par } = haulPar(t, r, n);
          for (const dt of [1 / 60, 1 / 30]) {
            const d = haulDrive(t, r.phys, n, dt);
            expect(d.spill).toBe(0);
            expect(d.time).toBeLessThanOrEqual(par);
          }
        }
      }
    }
  }, 60000);
  it('is the competent time plus about 15%, and tighter with Highballer', () => {
    const t = genHaulTrack(simLcg(7));
    const r = haulRules({ era: 0, season: 'Summer', upg: [], perks: [] });
    const d = haulDrive(t, r.phys, 10);
    expect(haulPar(t, r, 10).par).toBe(Math.ceil(d.time * 1.15));
    const hb = haulRules({ era: 0, season: 'Summer', upg: [], perks: ['highball'] });
    expect(haulPar(t, hb, 10).par).toBeLessThanOrEqual(haulPar(t, r, 10).par);
  });
  it('heavier loads and spring mud get a longer par', () => {
    const t = genHaulTrack(simLcg(3));
    const r = haulRules({ era: 0, season: 'Summer', upg: [], perks: [] });
    const sp = haulRules({ era: 0, season: 'Spring', upg: [], perks: [] });
    expect(haulPar(t, r, 16).par).toBeGreaterThanOrEqual(haulPar(t, r, 4).par);
    expect(haulPar(t, sp, 7).par).toBeGreaterThan(haulPar(t, r, 7).par);
  });
  it('ghost gives par-pace time along the road', () => {
    const g = [0, 1, 3];
    expect(haulGhostAt(g, 0)).toBe(0);
    expect(haulGhostAt(g, 30)).toBe(2);
    expect(haulGhostAt(g, 999)).toBe(3);
    const t = genHaulTrack(simLcg(2)), r = haulRules({ era: 0, season: 'Fall', upg: [], perks: [] });
    const p = haulPar(t, r, 10);
    expect(haulGhostAt(p.ghost, HAUL_LEN)).toBeLessThanOrEqual(p.par);
    expect(haulGhostAt(p.ghost, HAUL_START)).toBeLessThan(1);
  });
});

describe('haul bonus', () => {
  it('a max legal load is never fined: every part is >= 0 in every season', () => {
    for (const season of SEASONS) for (const upg of KITS) {
      const { limit } = haulRules({ era: 0, season, upg, perks: [] });
      for (const t of [5, 20, 60]) for (const spill of [0, 1, 3]) {
        const b = haulBonus({ n0: limit, n: limit - spill, limit, spill, t, par: 20 });
        for (const v of [b.load, b.overweight, b.clean, b.pace, b.total]) expect(v).toBeGreaterThanOrEqual(0);
      }
    }
  });
  it('pays more for fuller, cleaner, faster loads', () => {
    const base = { limit: 10, spill: 0, par: 20 };
    const half = haulBonus({ ...base, n0: 5, n: 5, t: 25 }), full = haulBonus({ ...base, n0: 10, n: 10, t: 25 });
    expect(full.total).toBeGreaterThan(half.total);
    expect(full.load).toBe(0.25);
    const fast = haulBonus({ ...base, n0: 10, n: 10, t: 16 }), par = haulBonus({ ...base, n0: 10, n: 10, t: 20 });
    expect(par.pace).toBeCloseTo(0.1, 12);
    expect(fast.pace).toBeCloseTo(0.3, 12);
    expect(fast.total).toBeGreaterThan(par.total);
    const spilled = haulBonus({ ...base, n0: 10, n: 7, spill: 3, t: 16 });
    expect(spilled.clean).toBe(0);
    expect(spilled.pace).toBeCloseTo(0.15, 12);
  });
  it('overweight is a chosen risk with a visible premium, only when the whole load arrives', () => {
    const whole = haulBonus({ n0: 14, n: 14, limit: 10, spill: 0, t: 30, par: 20 });
    expect(whole.overweight).toBeCloseTo(0.2, 12);
    expect(haulBonus({ n0: 14, n: 10, limit: 10, spill: 4, t: 30, par: 20 }).overweight).toBe(0);
    expect(haulBonus({ n0: 14, n: 14, limit: 10, spill: 0, t: 30, par: 20, overPay: 0.08 }).overweight).toBeCloseTo(0.32, 12);
  });
});

describe('haul rules: improvements and perks', () => {
  const R = (upg: string[], perks: string[] = [], season: Season = 'Summer') => haulRules({ era: 0, season, upg, perks });
  it('keeps the old season limits and bunks', () => {
    expect(R([]).limit).toBe(10);
    expect(R([], [], 'Spring').limit).toBe(7);
    expect(R(['corduroy'], [], 'Spring').limit).toBe(9);
    expect(R(['bunks']).limit).toBe(14);
  });
  it('load binders: +2 limit and half the spill', () => {
    const b = R(['binders']);
    expect(b.limit).toBe(12);
    expect(haulSpill(R([]).phys, 10)).toBe(3);
    expect(haulSpill(b.phys, 10)).toBe(2);
    expect(haulSpill(b.phys, 1)).toBe(1);
  });
  it('rough-lock chains hold the rig back on a downgrade off the gas', () => {
    const t = genHaulTrack(simLcg(11));
    let x = HAUL_FLAT; while (haulGrade(t, x) < 0.1) x += 2;
    const a = newHaulCar(10), b = newHaulCar(10); a.x = b.x = x; a.v = b.v = 100;
    haulStepCar(t, R([]).phys, a, false, false, 0.1); haulStepCar(t, R(['roughlock']).phys, b, false, false, 0.1);
    expect(b.v).toBeLessThan(a.v);
  });
  it('hill hitch climbs faster and never crawls below 7 mph', () => {
    const t = genHaulTrack(simLcg(11));
    let x = HAUL_FLAT; while (haulGrade(t, x) > -0.15) x += 2;
    const a = newHaulCar(16), b = newHaulCar(16); a.x = b.x = x;
    haulStepCar(t, R([]).phys, a, true, false, 0.05); haulStepCar(t, R(['hillhitch']).phys, b, true, false, 0.05);
    expect(b.v).toBeGreaterThanOrEqual(45);
    expect(b.v).toBeGreaterThan(a.v);
  });
  it('road lookout is flagged for the HUD', () => {
    expect(R(['lookout']).lookout).toBe(true);
    expect(R([]).lookout).toBe(false);
  });
  it('overload artist: 4 more logs over the limit, handles like a legal load, bigger premium', () => {
    const o = R([], ['overload']);
    expect(o.maxOver).toBe(R([]).maxOver + 4);
    expect(o.phys.massCap).toBe(10);
    expect(o.overPay).toBeGreaterThan(R([]).overPay);
  });
  it('gravity road stores braking for climbs and swallows a runaway instead of spilling', () => {
    const t = genHaulTrack(simLcg(5));
    let x = HAUL_FLAT; while (haulGrade(t, x) < 0.1) x += 2;
    const p = R([], ['gravity']).phys;
    const car = newHaulCar(10); car.x = x; car.v = 100;
    haulStepCar(t, p, car, false, true, 0.1);
    expect(car.store).toBeGreaterThan(0);
    car.store = HAUL_STORE_RUNAWAY; car.v = 400; car.x = x;
    expect(haulStepCar(t, p, car, true, false, 0.001)).toBe(-1);
    expect(car.n).toBe(10);
    expect(car.spill).toBe(0);
  });
  it('downhill daredevil and ice road king keep their rules', () => {
    expect(R([], ['daredevil']).phys.runaway).toBe(275);
    expect(R([], ['daredevil']).phys.spillMult).toBe(2);
    expect(R([], ['iceking'], 'Spring').phys.spillMult).toBe(2);
    expect(R([], ['iceking'], 'Winter').phys.spillMult).toBe(1);
  });
});
