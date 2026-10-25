import { describe, expect, it } from 'vitest';
import { distanceFactor } from './formulas';
import { TRACT_BASE, type SpeciesId } from './content';
import { AFK_LOT, AFK_MIX, genAfkLot, makeTract, OFFER_BOARD_SIZE, tractPrice } from './generators';
import { idlePrimeChance } from './items';
import {
  bestFor, campNote, cutOutSeconds, lotRates, lotThroughput, lotValueRate, moveEntry, orderFit, primeEstimate, primePerTree,
  queueOrder, seasonLines, TRACT_SWITCH_COST, type FitOrder, type QueueCaps,
} from './queue';

const caps: QueueCaps = { fell: 14, buck: 1000, skid: 100, haul: 1000 };
const spruce = () => makeTract('Spruce lot', [['spruce', 100]], 100, 1, 'flat', 'headland');
const pine = () => makeTract('Pine lot', [['pine', 100]], 10, 1, 'flat');

describe('lot rates and throughput', () => {
  it('apply weight, slope and haul distance per lot', () => {
    const r = lotRates(caps, spruce());
    expect(r.fell).toBeCloseTo(180, 9); // 14 chops/s ÷ 14 hp × 180 bf
    expect(r.skid).toBeCloseTo(125, 9); // 100 ÷ 0.8
    expect(r.haul).toBeCloseTo(1250, 9);
    expect(lotThroughput(caps, spruce())).toBeCloseTo(125, 9);
    const far = makeTract('Far', [['pine', 1]], 10, 5, 'steep');
    const rf = lotRates(caps, far);
    expect(rf.skid).toBeCloseTo(55, 9);
    expect(rf.haul).toBeCloseTo(1000 * distanceFactor(5), 9);
    expect(lotRates(caps, far, true).skid).toBeCloseTo(92, 9); // skyline floors steep at 0.92
  });
  it('time to cut out uses what is left, and is Infinity with no crews', () => {
    const t = spruce();
    expect(cutOutSeconds(caps, t)).toBeCloseTo(100 * 180 / 125, 9);
    t.left = 50;
    expect(cutOutSeconds(caps, t)).toBeCloseTo(50 * 180 / 125, 9);
    expect(cutOutSeconds({ fell: 0, buck: 0, skid: 0, haul: 0 }, t)).toBe(Infinity);
  });
  it('value a second reads the species season (hemlock tanbark)', () => {
    const h = makeTract('Swamp', [['hemlock', 1]], 10, 1, 'flat', 'swamp');
    const fall = lotValueRate(caps, h, 'Fall'), summer = lotValueRate(caps, h, 'Summer');
    expect(summer / fall).toBeCloseTo((32.16 + 14) / 32.16, 6);
  });
  it('switching is free for now (a single constant)', () => { expect(TRACT_SWITCH_COST).toBe(0); });
});

describe('order fit', () => {
  const ctx = { caps, era: 0, perfRate: 0.1 };
  const spOrder: FitOrder = { kind: 'species', id: 'c', short: 'spruce order', sp: 'spruce', need: 12500, secondsLeft: 50, signed: true };
  const admiralty: FitOrder = { kind: 'item', id: 'admiralty_spar', short: 'the Admiralty order', item: 'logging.prime_spar', itemName: 'Prime spars', need: 16 };

  it('estimates the share of a species order filled before it expires', () => {
    const [f] = orderFit(spruce(), [spOrder], ctx);
    expect(f?.amount).toBeCloseTo(0.5, 9); // 50 s × 125 bd ft/s of 12,500
    expect(f?.fills).toBe(false);
    expect(f?.text).toBe('Fills about 50% of the spruce order before it expires.');
  });
  it('counts the lots queued ahead: their time and their share of the species', () => {
    const [f] = orderFit(spruce(), [spOrder], ctx, [pine()]); // pine takes 20 s and has no spruce
    expect(f?.amount).toBeCloseTo(0.3, 9);
    const big = orderFit(spruce(), [{ ...spOrder, secondsLeft: 1000 }], ctx)[0];
    expect(big?.fills).toBe(true);
    expect(big?.text).toBe('Enough to fill the spruce order before it expires.');
    const late = orderFit(spruce(), [{ ...spOrder, secondsLeft: 10 }], ctx, [pine()])[0];
    expect(late?.amount).toBe(0);
    expect(late?.text).toMatch(/expires before crews reach it/);
    const covered = orderFit(spruce(), [{ ...spOrder, need: 100 }], ctx, [spruce()])[0];
    expect(covered?.amount).toBe(0);
    expect(covered?.text).toMatch(/lots ahead of it should already fill/);
  });
  it('marks offers on the board as "if you sign it now", and skips lots without the species', () => {
    expect(orderFit(spruce(), [{ ...spOrder, signed: false }], ctx)[0]?.text).toMatch(/offered spruce order.*\(if you sign it now\)$/);
    expect(orderFit(pine(), [spOrder], ctx)).toEqual([]);
  });
  it('estimates Prime from the idle trickle and the felling-game pace', () => {
    expect(primePerTree(spruce(), 'logging.prime_spar', 0, 0)).toBeCloseTo(idlePrimeChance(0), 12);
    expect(primePerTree(spruce(), 'logging.prime_spar', 0, 0.1)).toBeCloseTo(0.02 + 0.3, 12); // spruce stamps 3
    expect(primePerTree(spruce(), 'logging.prime_spar', 0, 9)).toBeCloseTo(0.02 + 1.5, 12); // pace capped at 0.5
    expect(primeEstimate(pine(), 'logging.prime_spar', 0, 0.1)).toBeCloseTo(1.2, 12);
    expect(primePerTree(spruce(), 'logging.burl', 0, 0.1)).toBe(0);
    const [f] = orderFit(spruce(), [admiralty], ctx);
    expect(f?.amount).toBeCloseTo(32, 9);
    expect(f?.fills).toBe(true);
    expect(f?.text).toBe('≈ 32 Prime spars toward the Admiralty order, enough to fill it.');
    const part = orderFit(pine(), [admiralty], ctx)[0];
    expect(part?.text).toBe('≈ 1.2 of the 16 Prime spars the Admiralty order still needs.');
    expect(orderFit(pine(), [admiralty], ctx, [spruce()])[0]?.amount).toBe(0); // the spruce lot ahead covers it
  });
  it('picks the best lot for each order, first on a tie', () => {
    const lots = [pine(), spruce(), spruce()];
    const fits = lots.map((l) => orderFit(l, [spOrder, admiralty], ctx));
    expect(bestFor(fits)).toEqual({ c: 1, admiralty_spar: 1 });
    expect(bestFor([[], []])).toEqual({});
  });
});

describe('camp note', () => {
  const heavy = () => makeTract('Swamp lot', [['hemlock', 100]], 50, 1, 'flat', 'swamp');
  it('names the slowest stage and how far it falls behind', () => {
    const n = campNote({ fell: 10, buck: 1000, skid: 132, haul: 1000 }, heavy(), { season: 'Fall' });
    expect(n.key).toBe('skid');
    expect(n.behind).toBeCloseTo(0.2, 9); // 132 ÷ 1.1 = 120 against felling 150
    expect(n.short).toMatch(/^Heavy hemlock: your teams are the slowest stage here; expect skidding to fall behind felling by about 20%\./);
    expect(n.short).toMatch(/About \$\d+ of logs an hour\./);
    expect(n.details.length).toBeGreaterThanOrEqual(2);
  });
  it('says when the fallers are the slowest, when the camp is matched, and when crews are missing', () => {
    expect(campNote({ fell: 2, buck: 1000, skid: 1000, haul: 1000 }, spruce(), { season: 'Fall' }).key).toBe('fell');
    const m = campNote({ fell: 14, buck: 1000, skid: 144, haul: 1000 }, spruce(), { season: 'Fall' });
    expect(m.key).toBe('matched');
    expect(m.short).toMatch(/^Light spruce: well matched/);
    const none = campNote({ fell: 1, buck: 0, skid: 0, haul: 0 }, spruce(), { season: 'Fall' });
    expect(none.key).toBe('none');
    expect(none.short).toMatch(/hire buckers and teams and haulers/);
  });
  it('calls out a slope or haul that slows the slowest stage, and compares value an hour with the current lot', () => {
    const steep = makeTract('Steep', [['pine', 1]], 10, 1, 'steep');
    const n = campNote({ fell: 10, buck: 1000, skid: 100, haul: 1000 }, steep, { season: 'Fall', current: pine(), money: (x) => `$${x.toFixed(0)}` });
    expect(n.key).toBe('skid');
    expect(n.short).toMatch(/\(steep ground slows skidding ×0\.55\)/);
    expect(n.short).toMatch(/% less than Pine lot\./);
    expect(n.perHourNow).toBeGreaterThan(n.perHour);
    const same = campNote(caps, pine(), { season: 'Fall', current: pine() });
    expect(same.short).toMatch(/about the same as Pine lot/);
  });
  it('mentions the season (tanbark now or later) and weather on the slowest stage', () => {
    const now = campNote({ fell: 10, buck: 1000, skid: 132, haul: 1000 }, heavy(), { season: 'Spring', weather: { name: 'Storm season', factors: { skid: 0.8 } } });
    expect(now.short).toMatch(/Tanbark season: hemlock pays \+\$14 a tree in bark until Fall\./);
    expect(now.short).toMatch(/Storm season makes it worse for now/);
    expect(now.details.join(' ')).toMatch(/Storm season: skidding ×0\.8 this season/);
    const later = campNote(caps, heavy(), { season: 'Fall' });
    expect(later.details.join(' ')).toMatch(/Hemlock pays \+\$14 a tree in tanbark from Spring\./);
    expect(seasonLines([['maple', 1]], 'Winter').now[0]).toBe('Winter maple is worth ×1.15 felled now, until Spring.');
    expect(seasonLines([['maple', 1]], 'Spring').now[0]).toMatch(/sap stain: maple is worth ×0\.85 until Summer/);
    expect(seasonLines([['pine', 95], ['hemlock', 5]], 'Spring')).toEqual({ now: [], later: [] });
  });
});

describe('queue order', () => {
  const keys = [
    { seq: 3, deadline: Infinity, perHour: 50 },
    { seq: 1, deadline: 300, perHour: 10 },
    { seq: 2, deadline: 100, perHour: 20 },
    { seq: 0, deadline: Infinity, perHour: 90 },
  ];
  it('sorts as bought, by deadline, by value, or keeps the hand order', () => {
    expect(queueOrder(keys, 'bought')).toEqual([3, 1, 2, 0]);
    expect(queueOrder(keys, 'deadline')).toEqual([2, 1, 3, 0]);
    expect(queueOrder(keys, 'value')).toEqual([3, 0, 2, 1]);
    expect(queueOrder(keys, 'hand')).toEqual([0, 1, 2, 3]);
  });
  it('moves an entry, clamping the target', () => {
    expect(moveEntry(['a', 'b', 'c', 'd'], 3, 0)).toEqual(['d', 'a', 'b', 'c']);
    expect(moveEntry(['a', 'b', 'c'], 0, 9)).toEqual(['b', 'c', 'a']);
    expect(moveEntry(['a', 'b'], 5, 0)).toEqual(['a', 'b']);
  });
});

describe('the AFK lot (Cutover slash country)', () => {
  const opts = { stumpMult: 1, thinSurvey: false, cruiser: false };
  const rng = (seed: number) => { let x = seed; return () => { x = (x * 9301 + 49297) % 233280; return x / 233280; }; };
  it('is big, poor, cheap per tree, flat or rolling and close in, in every era', () => {
    for (let era = 0; era < 4; era++) for (let s = 1; s < 30; s++) {
      const t = genAfkLot(rng(s), era, opts), base = TRACT_BASE[era] as number;
      expect(t.afk).toBe(true);
      expect(t.ground).toBe('cutover');
      expect(t.trees).toBeGreaterThanOrEqual(Math.round(base * AFK_LOT.trees[0]));
      expect(t.trees).toBeLessThanOrEqual(Math.round(base * AFK_LOT.trees[1]));
      expect(['flat', 'rolling']).toContain(t.slope);
      expect(t.miles).toBeGreaterThanOrEqual(1); expect(t.miles).toBeLessThanOrEqual(3);
      const plain = makeTract('p', (AFK_MIX[era] ?? []).map((m) => [m[0], m[1]] as [SpeciesId, number]), t.trees, t.miles, t.slope);
      expect(t.val).toBeCloseTo(plain.val * AFK_LOT.valMult, 9);
      expect(t.val / t.bf).toBeLessThan(plain.val / plain.bf);
      expect((t.price as number) / t.trees).toBeLessThan(tractPrice(plain.trees * plain.val, t.miles, t.slope, 1) / plain.trees * 0.5);
    }
  });
  it('draws five times and takes the thin survey and cruiser sizes', () => {
    let n = 0; const r = rng(3); genAfkLot(() => { n++; return r(); }, 0, opts);
    expect(n).toBe(5);
    expect(genAfkLot(rng(3), 0, { ...opts, cruiser: true }).trees).toBe(Math.round(genAfkLot(rng(3), 0, opts).trees * 1.25));
  });
  it('lasts several times a normal lot under idle crews but earns less an hour', () => {
    const c: QueueCaps = { fell: 5, buck: 200, skid: 150, haul: 300 };
    const a = genAfkLot(rng(5), 0, opts), g = makeTract('Good', [['pine', 100]], 60, 1, 'flat');
    expect(cutOutSeconds(c, a)).toBeGreaterThan(2.5 * cutOutSeconds(c, g));
    expect(lotValueRate(c, a, 'Fall')).toBeLessThan(0.85 * lotValueRate(c, g, 'Fall'));
    expect(campNote(c, a, { season: 'Fall' }).short).toMatch(/^Best for leaving the camp running: poor wood, but acres of it\. It holds about/);
  });
  it('the charter board shows four orders', () => { expect(OFFER_BOARD_SIZE).toBe(4); });
});
