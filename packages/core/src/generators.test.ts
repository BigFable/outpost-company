import { describe, expect, it } from 'vitest';
import { GOLDEN } from './__fixtures__/prototype-golden';
import { ERA_SPECIES, ERAS, PERKS, TRACT_BASE } from './content';
import { eraCost } from './formulas';
import {
  AFK_LOT, AFK_MIX, genAfkLot, draftPool, draftWeight, ensureAffordableListing, fitTractPrice, genHire, genListings, genOffer, genRichTract, genTract, LOT_SLOTS, lotsToOpen, makeTract, orderSpeciesPool, rareSpecies, slotsOpen, PUSH_TRACT_SHARE, pushTractCap, milesWithRoad, pickFromMix, roadCost, rollDraft, tractPrice,
} from './generators';
import { rngPick, rngRange } from './rng';
import { GROUNDS, mixWeight, SPECIES_CLIENTS, speciesId } from './species';
import type { SlopeId } from './content';
import type { MixEntry } from './generators';
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
    expect(t).toMatchObject({ trees: 40, left: 40, road: false, ground: 'coast' });
    expect(t.hp).toBeCloseTo(18.4, 12);
    expect(t.bf).toBeCloseTo(216, 12);
    expect(t.wt).toBeCloseTo(0.6 * 1 + 0.4 * 1.1, 12);
    expect(t.val).toBeCloseTo((40.5 * 6 + 240 * (0.45 * 0.2 + 0.55 * 0.08) * 4) / 10, 12);
  });
});

describe('genTract', () => {
  it('keeps the prototype draw sequence: the mixed stand matches the captured listings draw for draw', () => {
    // species overhaul slice 1: Cove ground listings are new, but every listing still takes 9 draws,
    // so later listings stay aligned and mixed-stand ones match the pre-M2 names, mixes, sizes and slopes
    let compared = 0;
    for (const c of GOLDEN.tracts as GoldenTractCase[]) {
      const rng = simLcg(c.seed);
      const got = [0, 1, 2].map(() => genTract(rng, c.era, { stumpMult: c.stumpMult, thinSurvey: c.thinSurvey, cruiser: c.cruiser }));
      got.forEach((t, i) => {
        if (t.ground !== 'mixed') return;
        const want = c.forSale[i] as { name: string; mix: [string, number][]; trees: number; miles: number; slope: string };
        expect({ name: t.name, mix: t.mix, trees: t.trees, miles: t.miles, slope: t.slope }).toEqual({ name: want.name, mix: want.mix.map(([id, w]) => [speciesId(id), w]), trees: want.trees, miles: want.miles, slope: want.slope });
        compared++;
      });
    }
    expect(compared).toBeGreaterThan(10);
  });
  it('lists Cove grounds at Cove Landing: coast bottoms, spruce headland, hemlock swamp', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed < 60; seed++) {
      const t = genTract(simLcg(seed), 0, { stumpMult: 1, thinSurvey: false, cruiser: false });
      seen.add(t.ground);
      const g = GROUNDS[t.ground];
      const [main, w] = must(t.mix[0]);
      expect(main).toBe(g.main);
      expect(w % 5).toBe(0);
      expect(w).toBeGreaterThanOrEqual(must(g.mainW)[0]);
      expect(w).toBeLessThanOrEqual(must(g.mainW)[1]);
      expect(g.rest).toContain(must(t.mix[1])[0]);
      expect(must(t.mix[1])[1]).toBe(100 - w);
      expect(g.slopes).toContain(t.slope);
      expect(t.wt).toBeCloseTo(mixWeight(t.mix), 12);
    }
    expect([...seen].sort()).toEqual(['coast', 'headland', 'swamp']);
  });
  it('prices a hemlock swamp at 0.9 and keeps it flat or rolling', () => {
    // older-tier 0.9, ground 0.99 -> swamp, main 0.5, rest 0, trees .5, miles 0, slope 0.99 -> rolling, place 0, lot 0
    const t = genTract(scripted([0.9, 0.99, 0.5, 0, 0.5, 0, 0.99, 0, 0]), 0, { stumpMult: 1, thinSurvey: false, cruiser: false });
    expect(t.ground).toBe('swamp');
    expect(t.slope).toBe('rolling');
    expect(t.mix).toEqual([['hemlock', 75], ['spruce', 25]]);
    expect(t.price).toBe(tractPrice(t.trees * t.val, t.miles, 'rolling', 0.9));
  });
  it('uses exactly 9 draws per listing', () => {
    const r = scripted(Array(9).fill(0.5));
    genTract(r, 2, { stumpMult: 1, thinSurvey: false, cruiser: false });
    expect(r.used()).toBe(9);
  });
  it('drops to the previous tier on a low roll and never mixes a species with itself', () => {
    // older-tier roll 0.1 (<0.3), species a=b=first -> b bumps to the next species
    // at Steam Camp an older-tier roll lists a Cove ground with Cove-sized timber
    const r = scripted([0.1, 0, 0, 0, 0.5, 0, 0, 0, 0]);
    const t = genTract(r, 1, { stumpMult: 1, thinSurvey: false, cruiser: false });
    expect(t.ground).toBe('coast');
    expect(t.mix).toEqual([['pine', 60], ['spruce', 40]]);
    expect(t.trees).toBe(Math.round(must(TRACT_BASE[0]) * 1.05));
    // at Diesel Road the older tier is Steam Camp: the mixed stand, where a species never mixes with itself
    const m = genTract(scripted([0.1, 0, 0, 0.5, 0.5, 0, 0, 0, 0]), 2, { stumpMult: 1, thinSurvey: false, cruiser: false });
    expect(m.ground).toBe('mixed');
    expect(m.mix.map((x) => x[0])).toEqual(['pine', 'spruce']);
    expect(m.trees).toBe(Math.round(must(TRACT_BASE[1]) * 1.05));
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
    // same draws as the pre-M2 prototype; tree stats follow the species overhaul
    for (const c of GOLDEN.hires as unknown as { era: number; seed: number; hire: { name: string; mix: MixEntry[]; trees: number; miles: number; slope: SlopeId; hire: unknown } }[]) {
      const t = genHire(simLcg(c.seed), c.era), h = c.hire;
      expect({ name: t.name, mix: t.mix, trees: t.trees, miles: t.miles, slope: t.slope, hire: t.hire }).toEqual({ name: h.name, mix: h.mix, trees: h.trees, miles: h.miles, slope: h.slope, hire: h.hire });
      const plain = makeTract(h.name, h.mix, h.trees, h.miles, h.slope, 'mixed');
      expect(t.val).toBeCloseTo(plain.val * 0.45, 12);
      expect(t.ground).toBe('mixed');
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

describe('genOffer species orders', () => {
  const so = { species: ['spruce', 'pine'] as const, share: { spruce: 0.7, pine: 0.3 } };
  it('draws nothing extra without species options', () => {
    const r = scripted([0, 0, 0, 0]);
    expect(genOffer(r, 0, 0.2).sp).toBeUndefined();
    expect(r.used()).toBe(4);
  });
  it('one roll decides: a miss leaves an any-wood order (5 draws)', () => {
    const r = scripted([0, 0, 0, 0, 0.5]);
    const o = genOffer(r, 0, 0.2, { species: [...so.species], share: so.share });
    expect(o.sp).toBeUndefined();
    expect(o.penalty).toBe(100);
    expect(r.used()).toBe(5);
  });
  it('a species order names the client, pays 30-55%, is sized by the species share and is free to miss', () => {
    const r = scripted([0.5, 0.5, 0, 0, 0.1, 0, 1 - 1e-9]);
    const plain = genOffer(scripted([0.5, 0.5, 0, 0]), 100, 0.2);
    const o = genOffer(r, 100, 0.2, { species: [...so.species], share: so.share });
    expect(r.used()).toBe(7);
    expect(o.sp).toBe('spruce');
    expect(o.mill).toBe(SPECIES_CLIENTS.spruce.client);
    expect(o.prem).toBe(0.55);
    expect(o.penalty).toBe(0);
    expect(o.vol).toBeLessThan(plain.vol);
    expect(Math.abs(o.vol / (plain.vol * 0.7) - 1)).toBeLessThan(0.06);
  });
  it('sizes an order for a species off the current tract at the off-tract share', () => {
    const o = genOffer(scripted([0.5, 0.5, 0, 0, 0.1, 0.99, 0]), 100, 0.2, { species: ['spruce', 'hemlock'], share: {} });
    expect(o.sp).toBe('hemlock');
    expect(o.prem).toBe(0.3);
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
    expect(draftPool([], true, 2).length).toBe(PERKS.length);
    expect(draftPool([], true).length).toBe(PERKS.filter((p) => !p.cap).length);
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

describe('land office lot slots', () => {
  const o = { stumpMult: 1, thinSurvey: false, cruiser: false };
  it('four slots: 2, 3, 4 species and the AFK lot, opening at 0 / 2 / 3 / 4 lots', () => {
    expect(LOT_SLOTS.map((s) => s.need)).toEqual([0, 2, 3, 4]);
    expect(LOT_SLOTS.map((s) => s.species).slice(0, 3)).toEqual([2, 3, 4]);
    expect(LOT_SLOTS[2]?.rare).toBe(true);
    expect(LOT_SLOTS[3]?.afk).toBe(true);
  });
  it('the AFK slot is always for sale (no restock wait); no other slot is', () => {
    expect(LOT_SLOTS.map((s) => !!s.always)).toEqual([false, false, false, true]);
    // relisting after a buy draws a fresh, equivalent AFK lot from the same stream: same mix, size range and price rule
    const rng = simLcg(42), base = TRACT_BASE[1] ?? 0;
    const a = genAfkLot(rng, 1, o), b = genAfkLot(rng, 1, o), c = genAfkLot(rng, 1, o);
    for (const t of [a, b, c]) {
      expect(t.afk).toBe(true);
      expect(t.mix).toEqual(AFK_MIX[1]?.map((m) => [m[0], m[1]]));
      expect(t.trees).toBeGreaterThanOrEqual(Math.round(base * AFK_LOT.trees[0]));
      expect(t.trees).toBeLessThanOrEqual(Math.round(base * AFK_LOT.trees[1]));
      expect(t.price).toBe(tractPrice(t.trees * t.val, t.miles, t.slope, AFK_LOT.landMult));
    }
    expect(new Set([a.name, b.name, c.name]).size).toBeGreaterThan(1);
  });
  it('unlock thresholds count lifetime lots cut out', () => {
    expect([0, 1, 2, 3, 4, 9].map(slotsOpen)).toEqual([1, 1, 2, 3, 4, 4]);
    expect(slotsOpen(Number.NaN)).toBe(1);
    expect(lotsToOpen(1, 0)).toBe(2);
    expect(lotsToOpen(1, 1)).toBe(1);
    expect(lotsToOpen(3, 4)).toBe(0);
    expect(lotsToOpen(0, 0)).toBe(0);
  });
  it('rare tree per era: maple, oak, cloudwood, cloudwood', () => {
    expect([0, 1, 2, 3].map(rareSpecies)).toEqual(['maple', 'oak', 'cloudwood', 'cloudwood']);
  });
  it('species count per slot, current era only, rare at 10-20%', () => {
    for (let era = 0; era < 4; era++) {
      const rng = simLcg(era + 7);
      for (let i = 0; i < 200; i++) {
        const t2 = genRichTract(rng, era, 3, false, o);
        expect(t2.mix.length).toBe(3);
        expect(new Set(t2.mix.map((m) => m[0])).size).toBe(3);
        t2.mix.forEach(([id]) => expect(ERA_SPECIES[era]).toContain(id));
        const t3 = genRichTract(rng, era, 4, true, o);
        expect(t3.mix.length).toBe(4);
        expect(new Set(t3.mix.map((m) => m[0])).size).toBe(4);
        const r = must(t3.mix.find((m) => m[0] === rareSpecies(era)));
        const share = r[1] / t3.mix.reduce((a, m) => a + m[1], 0);
        expect(share).toBeGreaterThanOrEqual(0.09);
        expect(share).toBeLessThanOrEqual(0.21);
        expect(r[1]).toBeGreaterThanOrEqual(10);
        expect(r[1]).toBeLessThanOrEqual(20);
        const main = must(t3.mix[0])[1];
        expect(main).toBeGreaterThanOrEqual(40);
        expect(main).toBeLessThanOrEqual(60);
        t3.mix.forEach((m) => expect(m[1]).toBeGreaterThanOrEqual(5));
        expect(t3.price).toBeGreaterThan(0);
        if (era > 0) expect(t3.ground).toBe('mixed');
      }
    }
  });
  it('documents its draws: species picks, shares, weights, trees, miles, slope, place, lot', () => {
    const r = scripted([0, 0, 0, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0, 0, 0]);
    const t = genRichTract(r, 0, 4, true, o);
    expect(r.used()).toBe(12);
    expect(t.mix.map((m) => m[0])).toEqual(['pine', 'spruce', 'hemlock', 'maple']);
    expect(t.ground).toBe('coast');
    const r2 = scripted([0, 0, 0, 0.5, 0.5, 0.5, 0.5, 0.5, 0, 0, 0]);
    expect(genRichTract(r2, 0, 3, false, o).mix.length).toBe(3);
    expect(r2.used()).toBe(11);
  });
  it('orders name the rare tree only once slot 3 is open', () => {
    expect(orderSpeciesPool(0, 2)).toEqual(['pine', 'spruce', 'hemlock']);
    expect(orderSpeciesPool(0, 3)).toEqual(['pine', 'spruce', 'hemlock', 'maple']);
    expect(orderSpeciesPool(1, 1)).not.toContain('oak');
    expect(orderSpeciesPool(1, 4)).toContain('oak');
    expect(orderSpeciesPool(3, 4)).toEqual([...must(ERA_SPECIES[3])]);
  });
});
