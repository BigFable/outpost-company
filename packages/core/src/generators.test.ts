import { describe, expect, it } from 'vitest';
import { GOLDEN } from './__fixtures__/prototype-golden';
import { ERA_SPECIES, ERAS, PERKS, TRACT_BASE } from './content';
import { eraCost } from './formulas';
import {
  draftPool, draftWeight, ensureAffordableListing, fitTractPrice, genHire, genListings, genOffer, genTract, makeTract, PUSH_TRACT_SHARE, pushTractCap, milesWithRoad, pickFromMix, roadCost, rollDraft, tractPrice,
} from './generators';
import { rngPick, rngRange } from './rng';
import { must, scripted, simLcg } from './test-rng';

type GoldenTractCase = { era: number; seed: number; stumpMult: number; thinSurvey: boolean; cruiser: boolean; forSale: unknown[] };

describe('rng helpers', () => {
  it('rngRange and rngPick each use one draw', () => {
    const r = scripted([0.5, 0.99]);
    expect(rngRange(r, 10, 20)).toBe(15);
    expect(rngPick(r, ['a', 'b', 'c'])).toBe('c');
    expect(r.used()).toBe(2);
  });
  it('rngPick rejects an empty list', () => {
    expect(() => rngPick(scripted([0]), [])).toThrow(RangeError);
  });
});

describe('makeTract', () => {
  it('weight-averages species stats', () => {
    const t = makeTract('Cove woodlot', [['pine', 6], ['hemlock', 4]], 40, 1, 'flat');
    expect(t).toMatchObject({ trees: 40, left: 40, road: false, hp: 20.8, bf: 208 });
    expect(t.val).toBeCloseTo((40.5 * 6 + 220 * (0.5 * 0.18 + 0.5 * 0.06) * 4) / 10, 12);
  });
});

describe('genTract', () => {
  it('reproduces the prototype listings for every era, seed and perk/clause variant', () => {
    for (const c of GOLDEN.tracts as GoldenTractCase[]) {
      const rng = simLcg(c.seed);
      const got = [0, 1, 2].map(() => genTract(rng, c.era, { stumpMult: c.stumpMult, thinSurvey: c.thinSurvey, cruiser: c.cruiser }));
      expect(got).toEqual(c.forSale);
    }
  });
  it('uses exactly 9 draws per listing', () => {
    const r = scripted(Array(9).fill(0.5));
    genTract(r, 2, { stumpMult: 1, thinSurvey: false, cruiser: false });
    expect(r.used()).toBe(9);
  });
  it('drops to the previous tier on a low roll and never mixes a species with itself', () => {
    // older-tier roll 0.1 (<0.3), species a=b=first -> b bumps to the next species
    const r = scripted([0.1, 0, 0, 0.5, 0.5, 0, 0, 0, 0]);
    const t = genTract(r, 1, { stumpMult: 1, thinSurvey: false, cruiser: false });
    expect(t.mix.map((m) => m[0])).toEqual(['pine', 'spruce']);
    expect(t.trees).toBe(Math.round(must(TRACT_BASE[0]) * 1.05));
  });
  it('clauses and perks scale tree count after pricing, never below 5', () => {
    const draws = [0.9, 0, 0.5, 0.5, 0, 0, 0, 0, 0];
    const plain = genTract(scripted(draws), 0, { stumpMult: 1, thinSurvey: false, cruiser: false });
    const thin = genTract(scripted(draws), 0, { stumpMult: 1, thinSurvey: true, cruiser: false });
    expect(thin.price).toBe(plain.price);
    expect(thin.trees).toBe(Math.max(5, Math.round(plain.trees * 0.8)));
    expect(thin.left).toBe(thin.trees);
  });
});

describe('tract economics', () => {
  it('tractPrice discounts distance (floor 55%) and slope', () => {
    expect(tractPrice(1000, 1, 'flat', 1)).toBe(Math.round(1000 * 0.42 * 1.08));
    expect(tractPrice(1000, 30, 'flat', 1)).toBe(Math.round(1000 * 0.42 * 0.55));
    expect(tractPrice(1000, 1, 'steep', 0.85)).toBe(Math.round(1000 * 0.42 * 1.08 * 0.65 * 0.85));
  });
  it('roads cost 7% of gross and halve haul distance, min half a mile', () => {
    expect(roadCost({ trees: 100, val: 10 })).toBe(70);
    expect(milesWithRoad(7)).toBe(3.5);
    expect(milesWithRoad(5.5)).toBe(3);
    expect(milesWithRoad(0.5)).toBe(0.5);
  });
});

describe('genHire', () => {
  it('reproduces the prototype hire jobs', () => {
    for (const c of GOLDEN.hires as { era: number; seed: number; hire: unknown }[]) {
      expect(genHire(simLcg(c.seed), c.era)).toEqual(c.hire);
    }
  });
  it('pays 45% of value and always mixes two different species', () => {
    for (let seed = 1; seed < 40; seed++) {
      const t = genHire(simLcg(seed), 3);
      expect(t.hire?.rate).toBe(0.45);
      expect(must(t.mix[0])[0]).not.toBe(must(t.mix[1])[0]);
      expect(ERA_SPECIES[3]).toContain(must(t.mix[1])[0]);
    }
  });
});

describe('genOffer', () => {
  it('reproduces the prototype charter orders for captured haul capacities', () => {
    for (const c of GOLDEN.offers as { seed: number; haulCap: number; perBf: number; offers: unknown[] }[]) {
      const rng = simLcg(c.seed);
      expect([genOffer(rng, c.haulCap, c.perBf), genOffer(rng, c.haulCap, c.perBf)]).toEqual(c.offers);
    }
  });
  it('floors capacity at 8 bd ft/s and volume at 2000, rounded to two significant figures', () => {
    const o = genOffer(scripted([0, 0, 0, 0]), 0, 0.2);
    expect(o.dur).toBe(240);
    expect(o.vol).toBe(2000);
    expect(o.prem).toBe(0.15);
    expect(o.penalty).toBe(Math.round(2000 * 0.2 * 0.25));
    const big = genOffer(scripted([0.5, 0.5, 0, 0]), 1234, 0.2);
    expect(String(big.vol).replace(/0+$/, '').length).toBeLessThanOrEqual(2);
  });
});

describe('pickFromMix', () => {
  it('picks by weight with one draw', () => {
    const mix = [['pine', 6], ['hemlock', 4]] as const;
    expect(pickFromMix(scripted([0]), mix)).toBe('pine');
    expect(pickFromMix(scripted([0.59]), mix)).toBe('pine');
    expect(pickFromMix(scripted([0.61]), mix)).toBe('hemlock');
  });
  it('returns null for an empty mix', () => {
    expect(pickFromMix(scripted([0.5]), [])).toBeNull();
  });
});

describe('drafts', () => {
  it('hides set-2 perks without lore and drafted non-commons, keeps commons', () => {
    const pool = draftPool(['sharp', 'widow'], false).map((p) => p.id);
    expect(pool).toContain('sharp');
    expect(pool).not.toContain('widow');
    expect(pool).not.toContain('store');
    expect(draftPool([], true).length).toBe(PERKS.length);
  });
  it('draft quality raises rare and legendary weights', () => {
    expect(draftWeight('common', 1)).toBe(60);
    expect(draftWeight('rare', 0)).toBe(26);
    expect(draftWeight('rare', 1)).toBeCloseTo(26 * 2.2, 12);
    expect(draftWeight('legendary', 1)).toBe(25);
    expect(draftWeight('curse', 1)).toBe(13.5);
  });
  it('rolls distinct cards, one draw each, and stops when the pool runs out', () => {
    const pool = draftPool([], false);
    const r = scripted([0, 0, 0]);
    const cards = rollDraft(r, pool, 3, 0.5);
    expect(cards).toEqual(pool.slice(0, 3).map((p) => p.id));
    expect(r.used()).toBe(3);
    expect(rollDraft(scripted([0.99, 0.99]), pool.slice(0, 2), 4, 0)).toHaveLength(2);
    expect(rollDraft(simLcg(5), pool, 4, 1).length).toBe(new Set(rollDraft(simLcg(5), pool, 4, 1)).size);
  });
  it('a draw of 0.999 picks the last card', () => {
    const pool = draftPool([], false);
    expect(rollDraft(scripted([0.999999]), pool, 1, 0)).toEqual([must(pool[pool.length - 1]).id]);
  });
});

describe('push-inland listing guarantee (Steam Camp cash trap)', () => {
  const O = { stumpMult: 1, thinSurvey: false, cruiser: false };
  it('caps at half the push price', () => {
    expect(PUSH_TRACT_SHARE).toBe(0.5);
    expect(pushTractCap(15000)).toBe(7500);
    expect(pushTractCap(12000)).toBe(6000);
  });
  it('genListings draws exactly like n genTract calls and only adds no-draw fitting', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const a = simLcg(seed), b = simLcg(seed);
      const plain = [0, 1, 2].map(() => genTract(a, 1, O));
      expect(genListings(b, 1, O)).toEqual(plain);
      const c = simLcg(seed), d = simLcg(seed);
      genListings(c, 1, O, 3, 7500); [0, 1, 2].forEach(() => genTract(d, 1, O));
      expect(c()).toBe(d()); // same position in the sequence afterwards
    }
  });
  it('every board after any push lists a tract at or under half the push price', () => {
    const variants = [O, { stumpMult: 0.85, thinSurvey: true, cruiser: false }, { stumpMult: 1, thinSurvey: false, cruiser: true }];
    let fitted = 0;
    for (let era = 1; era < ERAS.length; era++) for (const steam of [false, true]) for (const o of variants) {
      const cap = pushTractCap(eraCost(era, { steam, gas: false }));
      for (let seed = 1; seed <= 300; seed++) {
        const plain = genListings(simLcg(seed), era, o);
        const got = genListings(simLcg(seed), era, o, 3, cap);
        expect(Math.min(...got.map((t) => must(t.price)))).toBeLessThanOrEqual(cap);
        const changed = got.filter((t, i) => JSON.stringify(t) !== JSON.stringify(plain[i]));
        expect(changed.length).toBeLessThanOrEqual(1);
        if (changed.length) fitted++;
        for (const t of got) { expect(t.trees).toBeGreaterThanOrEqual(1); expect(t.left).toBe(t.trees); }
      }
    }
    expect(fitted).toBeGreaterThan(0); // era 1 hits the trap often without the guarantee
  });
  it('fitTractPrice keeps price per tree and leaves fitting tracts alone', () => {
    const t = { ...makeTract('X', [['pine', 6], ['spruce', 4]], 1000, 2, 'flat'), price: 20000 };
    expect(fitTractPrice(t, 25000)).toBe(t);
    const f = fitTractPrice(t, 7500);
    expect(f).toMatchObject({ trees: 375, left: 375, price: 7500, name: 'X', miles: 2 });
    expect(t.trees).toBe(1000); // not mutated
  });
  it('ensureAffordableListing shrinks only the cheapest listing when none fits', () => {
    const mk = (price: number) => ({ ...makeTract('L' + price, [['pine', 5], ['spruce', 5]], 100, 1, 'flat'), price });
    const board = [mk(30000), mk(9000), mk(12000)];
    const out = ensureAffordableListing(board, 7500);
    expect(out[0]).toBe(board[0]); expect(out[2]).toBe(board[2]);
    expect(must(out[1]).price).toBeLessThanOrEqual(7500);
    const ok = [mk(30000), mk(7000)];
    expect(ensureAffordableListing(ok, 7500)).toEqual(ok);
  });
});
