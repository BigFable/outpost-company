import { describe, expect, it } from 'vitest';
import { must, scripted } from './test-rng';
import {
  BUCK_PRIME_MAX, countEvents, CURRENCIES, DROP_TABLES, dropTier, idlePrimeChance, itemDef, itemSellPrice, ITEMS, ORDER_BONUS_CAP, ORDER_PERKS,
  orderBonus, orderRemaining, primeFromBuck, primeFromFall, PRIME_RULES, renameOldText, rollDrop, rollIdleDrop, SPECIAL_ORDERS,
} from './items';
import { PERKS } from './content';
import { streamRng } from './rng';

describe('items', () => {
  it('are namespaced, unique and frozen; every order, drop and Prime rule names a known item', () => {
    const ids = ITEMS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => /^(logging|sawmill)\./.test(id))).toBe(true);
    expect(Object.isFrozen(ITEMS[0])).toBe(true);
    const known = (id: string) => expect(itemDef(id)).toBeDefined();
    for (const t of Object.values(DROP_TABLES)) t.entries.forEach((e) => known(e.item));
    for (const o of SPECIAL_ORDERS) { o.needs.forEach((n) => known(n.item)); o.trigger.forEach(known); o.rewardItems?.forEach((n) => known(n.item)); }
    PRIME_RULES.forEach((p) => known(p.item));
  });
  it('only cash and Charter Shares are currencies (owner ruling)', () => {
    expect(CURRENCIES.map((c) => c.name)).toEqual(['Cash', 'Charter Shares', 'Charter Shares']);
  });
  it('sell price scales with the era', () => {
    expect(itemSellPrice('logging.prime_spar', 0)).toBe(40);
    expect(itemSellPrice('logging.prime_spar', 1)).toBe(200);
    expect(itemSellPrice('logging.prime_spar', 3)).toBe(1789);
    expect(itemSellPrice('nope', 0)).toBe(0);
  });
});

describe('Prime timber', () => {
  it('perfect falls by species: the Prime spar split 1/3/1; hardwoods make none yet', () => {
    expect(primeFromFall('pine')).toEqual({ item: 'logging.prime_spar', qty: 1 });
    expect(primeFromFall('spruce')).toEqual({ item: 'logging.prime_spar', qty: 3 });
    expect(primeFromFall('hemlock')?.qty).toBe(1);
    expect(primeFromFall('oak')).toBeNull();
    // the Cove average per perfect fall stays 5/3 (Admiralty pacing)
    expect((['pine', 'spruce', 'hemlock'] as const).reduce((a, sp) => a + (primeFromFall(sp)?.qty ?? 0), 0) / 3).toBeCloseTo(5 / 3, 12);
  });
  it('bucking spruce needs a 14 ft grade 1 log; pine and hemlock 12 ft', () => {
    expect(primeFromBuck('spruce', [{ len: 12, g: 1 }], 1)).toBeNull();
    expect(primeFromBuck('spruce', [{ len: 14, g: 1 }], 1)?.qty).toBe(1);
    expect(primeFromBuck('pine', [{ len: 12, g: 1 }], 1)?.qty).toBe(1);
    expect(primeFromBuck('hemlock', [{ len: 12, g: 1 }], 1)?.qty).toBe(1);
  });
  it('rollDrop weightMult favours an item without changing the draws', () => {
    const t = DROP_TABLES.buck;
    // chance roll 0, then entry pick at 0.8: plain weights 70/20 pick burl (0.8*90=72 > 70), pitch x2 picks pitch (0.8*160=128 < 140)
    expect(rollDrop(t, 2, scripted([0, 0.8]))?.item).toBe('logging.burl');
    expect(rollDrop(t, 2, scripted([0, 0.8]), 1, { 'logging.amber_pitch': 2 })?.item).toBe('logging.amber_pitch');
  });
  it('bucking: grade 1 logs of 12 ft or more at 90%+, capped', () => {
    const segs = [{ len: 12, g: 1 }, { len: 16, g: 1 }, { len: 14, g: 1 }, { len: 10, g: 1 }, { len: 16, g: 2 }];
    expect(primeFromBuck('spruce', segs, 0.95)?.qty).toBe(BUCK_PRIME_MAX);
    expect(primeFromBuck('spruce', [{ len: 10, g: 1 }], 1)).toBeNull();
    expect(primeFromBuck('spruce', segs, 0.89)).toBeNull();
    expect(primeFromBuck('maple', segs, 1)).toBeNull();
  });
  it('idle chance keeps Prime per tract steady', () => {
    expect(idlePrimeChance(0)).toBeCloseTo(0.02);
    expect(idlePrimeChance(2) * 15000).toBeCloseTo(1.2);
  });
  it('countEvents: exact for small n, expected count for large n', () => {
    expect(countEvents(scripted([0.01, 0.5, 0.01]), 3, 0.02)).toBe(2);
    expect(countEvents(scripted([0.3]), 1000, 0.0105)).toBe(11);
    expect(countEvents(scripted([0.9]), 1000, 0.0105)).toBe(10);
    expect(countEvents(scripted([]), 0, 0.5)).toBe(0);
  });
});

describe('finds', () => {
  it('tier from quality', () => {
    expect([dropTier(1), dropTier(0.97), dropTier(0.6), dropTier(0.55), dropTier(0.2)]).toEqual([2, 2, 1, 1, 0]);
  });
  it('rollDrop: chance by tier, entries by tier', () => {
    const fell = DROP_TABLES.fell;
    expect(rollDrop(fell, 2, scripted([0.24, 0.99]))?.item).toBe('logging.fog_glass');
    expect(rollDrop(fell, 2, scripted([0.25]))).toBeNull();
    expect(rollDrop(fell, 1, scripted([0.09, 0.99]))?.item).toBe('logging.burl');
    expect(rollDrop(fell, 0, scripted([0.03]))).toBeNull();
    expect(rollDrop(DROP_TABLES.haul, 0, scripted([0.001, 0.5]))).toBeNull();
    expect(rollDrop(DROP_TABLES.haul, 2, scripted([0.1, 0.7]))).toEqual({ item: 'logging.ships_fitting', qty: 2 });
  });
  it('buck finds more amber pitch: 35% base, 6% an idle roll', () => {
    expect(DROP_TABLES.buck.baseChance).toBe(0.35);
    expect(DROP_TABLES.buck.idlePerMin).toBe(0.06);
    expect(rollDrop(DROP_TABLES.buck, 2, scripted([0.34, 0.1]))?.item).toBe('logging.amber_pitch');
    expect(rollDrop(DROP_TABLES.buck, 2, scripted([0.35]))).toBeNull();
    expect(rollIdleDrop(DROP_TABLES.buck, scripted([0.059, 0.1]))?.item).toBe('logging.amber_pitch');
    expect(rollIdleDrop(DROP_TABLES.buck, scripted([0.06]))).toBeNull();
  });
  it('rollIdleDrop: 2% a roll, rares at a tenth of their weight', () => {
    expect(rollIdleDrop(DROP_TABLES.fell, scripted([0.03]))).toBeNull();
    // fell idle pool: burl 50, fog-glass 10 × 0.1 = 1
    expect(rollIdleDrop(DROP_TABLES.fell, scripted([0.01, 50.5 / 51]))?.item).toBe('logging.fog_glass');
    expect(rollIdleDrop(DROP_TABLES.fell, scripted([0.01, 0.5]))?.item).toBe('logging.burl');
    expect(rollIdleDrop(DROP_TABLES.haul, scripted([0.01, 0.5]))).toEqual({ item: 'logging.ships_fitting', qty: 1 });
    expect(rollIdleDrop(DROP_TABLES.buck, scripted([0.05, 0.1]), 3)?.item).toBe('logging.amber_pitch');
  });
});

describe('special orders', () => {
  it('two orders, rule-changing perks unlocked once, not in the base pool', () => {
    expect(SPECIAL_ORDERS.map((o) => o.id)).toEqual(['admiralty_spar', 'caulk_perseverance']);
    expect(ORDER_PERKS.every((p) => !PERKS.some((q) => q.id === p.id))).toBe(true);
    for (const o of SPECIAL_ORDERS) expect(ORDER_PERKS.some((p) => p.id === o.unlockPerk)).toBe(true);
  });
  it('bonus is capped at 25%', () => {
    expect(ORDER_BONUS_CAP).toBe(0.25);
    expect(orderBonus(0)).toBe(1);
    expect(orderBonus(0.23)).toBeCloseTo(1.23);
    expect(orderBonus(0.46)).toBe(1.25);
    expect(orderBonus(-1)).toBe(1);
  });
  it('remaining needs after partial hand-ins', () => {
    const o = must(SPECIAL_ORDERS[0]);
    expect(orderRemaining(o, { 'logging.prime_spar': 12 })).toEqual([{ item: 'logging.prime_spar', qty: 4 }, { item: 'logging.amber_pitch', qty: 2 }]);
    expect(orderRemaining(o, { 'logging.prime_spar': 30, 'logging.amber_pitch': 2 })).toEqual([]);
  });
  it('owner-approved sizes: Admiralty 16 spars + 2 pitch, Caulk 6 pitch + 3 fittings', () => {
    expect(SPECIAL_ORDERS.map((o) => o.needs.map((n) => n.qty))).toEqual([[16, 2], [6, 3]]);
  });
});

describe('streamRng', () => {
  it('is seeded, advances its saved state and stays in [0, 1)', () => {
    const a: Record<string, number> = {}, b: Record<string, number> = {};
    const ra = streamRng(a, 'drops', 42), rb = streamRng(b, 'drops', 42);
    const xs = Array.from({ length: 50 }, ra);
    expect(xs).toEqual(Array.from({ length: 50 }, rb));
    expect(xs.every((x) => x >= 0 && x < 1)).toBe(true);
    const saved = { ...a }, more = ra();
    expect(streamRng(saved, 'drops')()).toBe(more);
  });
});

describe('resource renames', () => {
  it('old names in saved text read in the new words, and the rewrite is idempotent', () => {
    const old = 'New find: Burl. Filled “Admiralty spar order”: 3 Prime spars, 2 amber pitch, a ship’s fitting and Fog-glass. Closed mill run 1: 30K bd ft sawn. Achievement: 10 MBF.';
    const now = renameOldText(old);
    expect(now).toBe('New find: Swirl knot. Filled “Admiralty mast order”: 3 Prime logs, 2 amber sap, a shipwreck bronze and Fog lens. Closed mill run 1: 30K wood sawn. Achievement: 10K wood.');
    expect(renameOldText(now)).toBe(now);
    expect(renameOldText('Used a survey marker. New find: Survey marker. Pitch boiler and Spar man unlocked.')).toBe('Used a restock token. New find: Restock token. Sap boiler and Prime hunter unlocked.');
  });
  it('every live item name is plain (no old lingo left)', () => {
    for (const i of ITEMS) expect(renameOldText(i.name)).toBe(i.name);
    expect(ITEMS.map((i) => i.name)).toEqual(['Prime log', 'Swirl knot', 'Amber sap', 'Restock token', 'Shipwreck bronze', 'Fog lens', 'Prime board', 'Plank bundle']);
  });
});
