import { describe, expect, it } from 'vitest';
import { SLOPES } from './content';
import { genTract, makeTract } from './generators';
import { idlePrimeChance } from './items';
import {
  eraLotAverages, LOT_STAT_BAND, LOT_STAT_BANDS, LOT_STAT_DIR, LOT_STATS, lotStatAverages, lotStatChips, primeChance, statVerdict, type LotStatId,
} from './lotstats';
import { simLcg } from './test-rng';

describe('era lot averages', () => {
  it('are stable: the same object every call, and frozen', () => {
    const a = eraLotAverages(0);
    expect(eraLotAverages(0)).toBe(a);
    expect(Object.isFrozen(a)).toBe(true);
  });
  it('never touch the game rng (a private stream)', () => {
    const r1 = simLcg(7), r2 = simLcg(7);
    const t1 = genTract(r1, 1, { stumpMult: 1, thinSurvey: false, cruiser: false });
    eraLotAverages(1); eraLotAverages(2);
    const t2 = genTract(r2, 1, { stumpMult: 1, thinSurvey: false, cruiser: false });
    expect(t2).toEqual(t1);
  });
  it('follow the generator parameters', () => {
    const a0 = eraLotAverages(0);
    // Cove Landing: pine, spruce and hemlock only (hp 14-20), haul 1-12 mi (mean 6.5), slopes from the grounds' lists
    expect(a0.chops).toBeGreaterThan(14); expect(a0.chops).toBeLessThan(20);
    expect(a0.haul).toBeCloseTo(6.5, 0);
    expect(a0.slope).toBeGreaterThan(SLOPES.steep.skid); expect(a0.slope).toBeLessThan(SLOPES.flat.skid);
    expect(a0.weight).toBeGreaterThan(0.8); expect(a0.weight).toBeLessThan(1.1);
    expect(a0.share.maple ?? 0).toBe(0);
    const shares = Object.values(a0.share).reduce((x, y) => x + (y ?? 0), 0);
    expect(shares).toBeCloseTo(1, 9);
    // later eras add hardwoods: more chops and more value a tree
    expect(eraLotAverages(1).chops).toBeGreaterThan(a0.chops);
    expect(eraLotAverages(3).value).toBeGreaterThan(eraLotAverages(1).value);
    expect(eraLotAverages(1).share.maple ?? 0).toBeGreaterThan(0);
    // price a tree is about 42% of value, less for distance and slope
    expect(a0.price / a0.value).toBeGreaterThan(0.2); expect(a0.price / a0.value).toBeLessThan(0.42);
  });
  it('Prime average is the idle trickle with no felling-game pace, more with it', () => {
    expect(lotStatAverages(0).prime).toBeCloseTo(idlePrimeChance(0), 12); // every Cove species makes Prime spars
    expect(lotStatAverages(0, 0.3).prime).toBeGreaterThan(lotStatAverages(0).prime);
  });
});

describe('better or worse than average', () => {
  it('direction per stat: fewer chops, lower weight, shorter haul, lower price are better; more value, gentler slope, more Prime', () => {
    const lower: LotStatId[] = ['chops', 'weight', 'haul', 'price'], higher: LotStatId[] = ['value', 'slope', 'prime'];
    for (const id of lower) { expect(LOT_STAT_DIR[id]).toBe(-1); expect(statVerdict(id, 50, 100)).toBe('good'); expect(statVerdict(id, 150, 100)).toBe('bad'); }
    for (const id of higher) { expect(LOT_STAT_DIR[id]).toBe(1); expect(statVerdict(id, 150, 100)).toBe('good'); expect(statVerdict(id, 50, 100)).toBe('bad'); }
    expect(LOT_STATS.length).toBe(lower.length + higher.length);
  });
  it('within ±10% is about average', () => {
    expect(LOT_STAT_BAND).toBe(0.1);
    expect(statVerdict('chops', 109, 100)).toBe('even');
    expect(statVerdict('chops', 110, 100)).toBe('even');
    expect(statVerdict('chops', 111, 100)).toBe('bad');
    expect(statVerdict('value', 89, 100)).toBe('bad');
    expect(statVerdict('prime', 0, 0)).toBe('even');
    expect(statVerdict('prime', 0.1, 0)).toBe('good');
    // weights bunch up (0.8-1.1): ±5%
    expect(LOT_STAT_BANDS.weight).toBe(0.05);
    expect(statVerdict('weight', 1.04, 1)).toBe('even');
    expect(statVerdict('weight', 1.06, 1)).toBe('bad');
    expect(statVerdict('weight', 1.06, 1, 0.1)).toBe('even');
  });
});

describe('lot stat chips', () => {
  it('a spruce point on flat ground, 2 mi out: light, few chops, short haul and gentle slope are green', () => {
    const t = makeTract('Spruce point, Lot 3', [['spruce', 90], ['pine', 10]], 60, 2, 'flat', 'headland');
    t.price = 300;
    const c = Object.fromEntries(lotStatChips(t, 0).map((x) => [x.id, x]));
    expect(lotStatChips(t, 0).map((x) => x.id)).toEqual(LOT_STATS);
    expect(c.chops?.verdict).toBe('good'); expect(c.chops?.value).toBeCloseTo(14.6, 9);
    expect(c.weight?.verdict).toBe('good');
    expect(c.haul?.verdict).toBe('good');
    expect(c.slope?.verdict).toBe('good');
    expect(c.price?.value).toBeCloseTo(5, 9); expect(c.price?.verdict).toBe('good');
    expect(c.value?.verdict).toBe('bad'); // spruce is cheap wood
    expect(c.prime?.verdict).toBe('even'); // idle: 2% on any Cove lot
    expect(c.chops?.avg).toBe(eraLotAverages(0).chops);
  });
  it('a heavy hemlock swamp, 12 mi, steep: heavy, far and steep are red', () => {
    const t = makeTract('Swamp', [['hemlock', 90], ['spruce', 10]], 60, 12, 'steep', 'swamp');
    const c = Object.fromEntries(lotStatChips(t, 0).map((x) => [x.id, x.verdict]));
    expect(c).toMatchObject({ weight: 'bad', haul: 'bad', slope: 'bad' });
    expect(c.price).toBeUndefined(); // an owned lot has no asking price
  });
  it('a maple lot makes no Prime: red against the era average', () => {
    const t = makeTract('Maple', [['maple', 100]], 60, 6.5, 'rolling', 'mixed');
    expect(primeChance(t, 1)).toBe(0);
    expect(lotStatChips(t, 1).find((x) => x.id === 'prime')?.verdict).toBe('bad');
  });
  it('a species card reads only the stats it carries', () => {
    const ids = lotStatChips({ mix: [['spruce', 1]], hp: 14, val: 20, wt: 0.8 }, 0, 0, ['chops', 'value', 'weight', 'prime']).map((x) => x.id);
    expect(ids).toEqual(['chops', 'value', 'weight', 'prime']);
  });
});
