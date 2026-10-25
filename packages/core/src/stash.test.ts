import { describe, expect, it } from 'vitest';
import { SPECIES } from './content';
import { treeValue } from './formulas';
import { AFK_LOT, genAfkLot, makeTract } from './generators';
import { lotRates } from './queue';
import { simLcg } from './test-rng';
import {
  cutPlan, fellFromStand, fixStand, pickFactor, rulesAllAny, standFromMix, standStats, standTotal, stashRule, stashTotals,
} from './stash';

describe('tree counts per species', () => {
  it('come from the mix and trees left, whole trees, the remainder to the main species', () => {
    expect(standFromMix([['pine', 6], ['hemlock', 4]], 40)).toEqual({ pine: 24, hemlock: 16 });
    const s = standFromMix([['pine', 50], ['hemlock', 30], ['spruce', 20]], 7);
    expect(standTotal(s)).toBe(7);
    expect(Object.values(s).every((n) => Number.isInteger(n) && n >= 0)).toBe(true);
    // 3 species at a third each round to 1 + 1 + 1 of 2: the excess comes back off a count
    const t = standFromMix([['pine', 1], ['spruce', 1], ['hemlock', 1]], 2);
    expect(standTotal(t)).toBe(2);
    expect(Object.values(t).every((n) => n >= 0)).toBe(true);
    expect(standFromMix([], 5)).toEqual({ pine: 5 });
  });
  it('a missing or broken save stand is rebuilt; one off from trees left is rescaled', () => {
    const mix: [ 'pine' | 'spruce', number][] = [['pine', 70], ['spruce', 30]];
    expect(fixStand(undefined, mix, 10)).toEqual({ pine: 7, spruce: 3 });
    expect(fixStand('x', mix, 10)).toEqual({ pine: 7, spruce: 3 });
    expect(fixStand({ walnut: 4, pine: 'a', bogus: 3 }, mix, 4)).toEqual({ cloudwood: 4 });
    const r = fixStand({ pine: 10, spruce: 10 }, mix, 10);
    expect(r.pine).toBeCloseTo(5, 9); expect(r.spruce).toBeCloseTo(5, 9);
  });
});

describe('rules and the cut plan', () => {
  const mix: ['pine' | 'spruce' | 'hemlock', number][] = [['pine', 60], ['spruce', 30], ['hemlock', 10]];
  const stand = { pine: 60, spruce: 30, hemlock: 10 };
  it('default to Any, and all Any cuts everything at full speed', () => {
    expect(stashRule(undefined, 'pine')).toBe('any');
    expect(stashRule({ pine: 'nonsense' as never }, 'pine')).toBe('any');
    expect(rulesAllAny({ pine: 'any' })).toBe(true);
    expect(rulesAllAny({ pine: 'skip' })).toBe(false);
    const p = cutPlan(stand, mix, {});
    expect(p).toMatchObject({ mode: 'all', factor: 1, share: 1, picking: false, count: 100 });
  });
  it('First cuts only that species, at 0.5 + 0.5 × its share', () => {
    const p = cutPlan(stand, mix, { spruce: 'first' });
    expect(p.species).toEqual(['spruce']);
    expect(p.mode).toBe('first');
    expect(p.share).toBeCloseTo(0.3, 9);
    expect(p.factor).toBeCloseTo(0.65, 9);
    expect(pickFactor(0.8)).toBeCloseTo(0.9, 9);
    expect(pickFactor(0.2)).toBeCloseTo(0.6, 9);
    expect(pickFactor(1)).toBe(1);
    // two First species share the effort
    expect(cutPlan(stand, mix, { spruce: 'first', hemlock: 'first' }).species).toEqual(['spruce', 'hemlock']);
  });
  it('no First species left on the lot: cut the rest (Any)', () => {
    const p = cutPlan({ pine: 60, spruce: 0, hemlock: 10 }, mix, { spruce: 'first' });
    expect(p.mode).toBe('all');
    expect(p.factor).toBe(1);
  });
  it('Skip leaves a species standing; only Skipped trees left: cut them', () => {
    const p = cutPlan(stand, mix, { hemlock: 'skip' });
    expect(p.mode).toBe('rest');
    expect(p.species).toEqual(['pine', 'spruce']);
    expect(p.factor).toBeCloseTo(0.95, 9);
    const q = cutPlan({ pine: 0, spruce: 0, hemlock: 10 }, mix, { hemlock: 'skip' });
    expect(q).toMatchObject({ mode: 'skipped', factor: 1, picking: false });
    expect(q.species).toEqual(['hemlock']);
    const all = cutPlan(stand, mix, { pine: 'skip', spruce: 'skip', hemlock: 'skip' });
    expect(all.mode).toBe('skipped');
  });
  it('the AFK lot (ignore) cuts everything whatever the rules', () => {
    expect(cutPlan(stand, mix, { spruce: 'first', hemlock: 'skip' }, true)).toMatchObject({ mode: 'all', factor: 1 });
  });
});

describe('felling from the stand', () => {
  it('takes from the cut species, then the rest, and keeps the total', () => {
    const s = fellFromStand({ pine: 6, spruce: 2 }, ['spruce'], 3);
    expect(s.spruce).toBe(0);
    expect(s.pine).toBeCloseTo(5, 9);
    expect(standTotal(s)).toBeCloseTo(5, 9);
  });
  it('under Any takes every species in proportion, so the mix never drifts', () => {
    let s = standFromMix([['pine', 6], ['hemlock', 4]], 40);
    for (let i = 0; i < 25; i++) s = fellFromStand(s, ['pine', 'hemlock'], 1);
    expect(standTotal(s)).toBeCloseTo(15, 9);
    expect((s.pine as number) / standTotal(s)).toBeCloseTo(0.6, 9);
    s = fellFromStand(s, ['pine', 'hemlock'], 99);
    expect(standTotal(s)).toBe(0);
  });
});

describe('stats of the trees being cut', () => {
  it('are the species own figures, with the lot multipliers kept (AFK lot)', () => {
    const t = makeTract('Mixed', [['pine', 50], ['spruce', 50]], 100, 1, 'flat');
    const st = standStats(t, { pine: 50, spruce: 50 }, ['spruce']);
    expect(st.hp).toBeCloseTo(SPECIES.spruce.hp, 9);
    expect(st.bf).toBeCloseTo(SPECIES.spruce.bf, 9);
    expect(st.val).toBeCloseTo(treeValue(SPECIES.spruce), 9);
    expect(st.wt).toBeCloseTo(0.8, 9);
    const afk = genAfkLot(simLcg(3), 0, { stumpMult: 1, thinSurvey: false, cruiser: false });
    const a = standStats(afk, { pine: 10, hemlock: 0, spruce: 0 }, ['pine']);
    expect(a.bf).toBeCloseTo(SPECIES.pine.bf * AFK_LOT.bfMult, 6);
    expect(a.val).toBeCloseTo(treeValue(SPECIES.pine) * AFK_LOT.valMult, 6);
  });
  it('the picking factor slows felling and skidding only', () => {
    const t = makeTract('Mixed', [['pine', 1]], 10, 1, 'flat');
    const caps = { fell: 10, buck: 100, skid: 100, haul: 100 };
    const a = lotRates(caps, t), b = lotRates(caps, { ...t, pick: 0.6 });
    expect(b.fell).toBeCloseTo(a.fell * 0.6, 9);
    expect(b.skid).toBeCloseTo(a.skid * 0.6, 9);
    expect(b.buck).toBe(a.buck);
    expect(b.haul).toBe(a.haul);
    expect(lotRates(caps, { ...t, pick: 1 })).toEqual(a);
  });
});

describe('the Trees tab totals', () => {
  it('sum every owned tree by species, with the lots that hold it', () => {
    const a = makeTract('A', [['pine', 60], ['spruce', 40]], 10, 1, 'flat');
    const b = makeTract('B', [['spruce', 100]], 5, 1, 'flat');
    const rows = stashTotals([{ ...a, stand: { pine: 6, spruce: 4 } }, { ...b, stand: { spruce: 5 } }]);
    expect(rows.map((r) => r.sp)).toEqual(['pine', 'spruce']);
    const sp = rows[1];
    expect(sp?.trees).toBe(9);
    expect(sp?.bf).toBeCloseTo(9 * SPECIES.spruce.bf, 6);
    expect(sp?.lots).toEqual([{ i: 0, n: 4, share: 0.4 }, { i: 1, n: 5, share: 1 }]);
  });
});
