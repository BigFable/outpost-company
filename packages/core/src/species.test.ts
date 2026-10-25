import { describe, expect, it } from 'vitest';
import { SPECIES } from './content';
import { missedPenalty, stageRate, treeValue } from './formulas';
import {
  BUCK_RULES, buckRules, campFit, COVE_GROUNDS, FELL_RULES, fellRules, groundId, groundMix, GROUNDS, hingeZone, mainSpecies, mixShare, mixWeight,
  SPECIES_ALIAS, SPECIES_CLIENTS, speciesId, speciesSeasonTrait, speciesSeasonValue, seasonValueFactor, TANBARK, tractScore, tractThroughput, weightTag,
} from './species';
import { scripted } from './test-rng';

describe('Cove trio stats (species overhaul slice 1)', () => {
  it('match the spec table: values per tree and weights', () => {
    expect(treeValue(SPECIES.pine)).toBeCloseTo(40.5, 9);
    expect(treeValue(SPECIES.spruce)).toBeCloseTo(28.35, 9);
    expect(treeValue(SPECIES.hemlock)).toBeCloseTo(32.16, 9);
    expect([SPECIES.pine.wt, SPECIES.spruce.wt, SPECIES.hemlock.wt]).toEqual([1, 0.8, 1.1]);
    expect([SPECIES.spruce.hp, SPECIES.hemlock.hp, SPECIES.spruce.bf, SPECIES.hemlock.bf]).toEqual([14, 16, 180, 240]);
  });
  it('leaves cloudwood near 4.8x pine (owner ruling) and the hardwoods at weight 1 until slice 3', () => {
    expect(treeValue(SPECIES.cloudwood) / treeValue(SPECIES.pine)).toBeGreaterThan(4.7);
    expect([SPECIES.maple.wt, SPECIES.oak.wt, SPECIES.cloudwood.wt]).toEqual([1, 1, 1]);
  });
});

describe('save ids', () => {
  it('maps walnut to cloudwood and rejects unknown ids', () => {
    expect(SPECIES_ALIAS.walnut).toBe('cloudwood');
    expect(speciesId('walnut')).toBe('cloudwood');
    expect(speciesId('spruce')).toBe('spruce');
    expect(speciesId('teak')).toBeNull();
    expect(speciesId(3)).toBeNull();
    expect(groundId('swamp')).toBe('swamp');
    expect(groundId(undefined)).toBe('coast');
    expect(groundId('moon')).toBe('coast');
  });
});

describe('seasonal-trait hook', () => {
  it('hemlock tanbark pays in Spring and Summer only (calendar season)', () => {
    expect(speciesSeasonTrait('hemlock', 'Spring').bark).toBe(TANBARK);
    expect(speciesSeasonTrait('hemlock', 'Summer').bark).toBe(14);
    expect(speciesSeasonTrait('hemlock', 'Fall').bark).toBe(0);
    expect(speciesSeasonValue('hemlock', 'Summer')).toBeCloseTo(32.16 + 14, 9);
    expect(speciesSeasonValue('pine', 'Summer')).toBeCloseTo(40.5, 9);
  });
  it('maple is worth x1.15 felled in Winter and x0.85 in Spring', () => {
    expect(speciesSeasonValue('maple', 'Winter')).toBeCloseTo(treeValue(SPECIES.maple) * 1.15, 9);
    expect(speciesSeasonValue('maple', 'Spring')).toBeCloseTo(treeValue(SPECIES.maple) * 0.85, 9);
  });
  it('tract factor: exactly 1 with no trait, the weighted ratio otherwise', () => {
    expect(seasonValueFactor([['pine', 6], ['spruce', 4]], 'Summer')).toBe(1);
    expect(seasonValueFactor([['pine', 6], ['hemlock', 4]], 'Fall')).toBe(1);
    const f = seasonValueFactor([['pine', 6], ['hemlock', 4]], 'Spring');
    expect(f).toBeCloseTo((40.5 * 6 + (32.16 + 14) * 4) / (40.5 * 6 + 32.16 * 4), 9);
    expect(seasonValueFactor([['walnut' as 'cloudwood', 1]], 'Spring')).toBe(1);
  });
});

describe('mixes', () => {
  it('weight, share and main species', () => {
    expect(mixWeight([['spruce', 75], ['pine', 25]])).toBeCloseTo(0.85, 12);
    expect(mixWeight([])).toBe(1);
    expect(mixShare([['spruce', 75], ['pine', 25]], 'pine')).toBe(0.25);
    expect(mixShare([['spruce', 75]], 'hemlock')).toBe(0);
    expect(mainSpecies([['pine', 4], ['hemlock', 6]])).toBe('hemlock');
  });
});

describe('grounds', () => {
  it('Cove grounds per the spec: mixes, slopes and twists', () => {
    expect(COVE_GROUNDS).toEqual(['coast', 'headland', 'swamp']);
    expect(GROUNDS.coast).toMatchObject({ main: 'pine', mainW: [60, 80], rest: ['spruce', 'hemlock'] });
    expect(GROUNDS.headland).toMatchObject({ main: 'spruce', mainW: [60, 90], rest: ['pine'], windMult: 1.2 });
    expect(GROUNDS.swamp).toMatchObject({ main: 'hemlock', mainW: [60, 90], rest: ['spruce'], landMult: 0.9 });
    expect(GROUNDS.swamp.slopes).not.toContain('steep');
  });
  it('groundMix uses two draws and rounds the main share to 5%', () => {
    const r = scripted([0.5, 0.99]);
    expect(groundMix(r, GROUNDS.coast)).toEqual([['pine', 70], ['hemlock', 30]]);
    expect(r.used()).toBe(2);
    expect(groundMix(scripted([1 - 1e-9, 0]), GROUNDS.swamp)).toEqual([['hemlock', 90], ['spruce', 10]]);
  });
});

describe('felling rules', () => {
  it('spruce catches the wind and cuts quick; hemlock is brittle', () => {
    expect(fellRules('spruce')).toMatchObject({ wind: 1.5, cut: 1.25, fallS: 0.8 });
    expect(fellRules('hemlock')).toMatchObject({ hinge: [0.1, 0.2], rockLoss: 0.6, chairBelow: 0.05 });
    expect(fellRules('pine')).toMatchObject({ wind: 1, hinge: [0.08, 0.2], cut: 1, half: 10, fallS: 0.9, rockLoss: 0.4, chairBelow: 0 });
    expect(fellRules('maple')).toMatchObject({ wind: 1, rockLoss: 0.4 });
    expect(fellRules('maple').tag).toContain('Glacier maple');
    for (const sp of ['pine', 'spruce', 'hemlock'] as const) expect(FELL_RULES[sp]?.tag).toMatch(new RegExp('^' + SPECIES[sp].name));
  });
  it('Mill file widens every species alike', () => {
    expect(hingeZone('pine', false)).toEqual([0.08, 0.2]);
    expect(hingeZone('pine', true)).toEqual([0.06, 0.25]);
    expect(hingeZone('hemlock', true)).toEqual([0.08, 0.25]);
  });
});

describe('bucking rules', () => {
  it('spruce: long, clean butts, knots in the top half, 16 ft spars x1.25, Prime from 14 ft', () => {
    const r = buckRules('spruce');
    expect(r).toMatchObject({ L: [44, 66], d0: [16, 26], knots: [3, 5], knotAt: [0.5, 0.95], rot: [0.2, 2, 4], sweep: 0.2, g1Prime: 14 });
    expect(r.lenP[16]).toBe(1.25);
  });
  it('hemlock: deep rot, ring shake 40%, all lengths x1.0', () => {
    const r = buckRules('hemlock');
    expect(r).toMatchObject({ L: [36, 56], d0: [22, 34], knots: [2, 3], rot: [0.8, 4, 10], sweep: 0.3, shake: [0.4, 4, 6] });
    expect(Object.values(r.lenP)).toEqual([1, 1, 1, 1, 1]);
  });
  it('pine keeps today\'s stem and finds pitch twice as often; others fall back to it', () => {
    expect(buckRules('pine')).toMatchObject({ L: [38, 62], d0: [20, 32], knots: [2, 4], rot: [0.5, 2, 6], sweep: 0.45, pitchMult: 2 });
    expect(buckRules('pine').lenP[16]).toBe(1.15);
    expect(buckRules('oak').pitchMult).toBe(1);
    expect(BUCK_RULES.spruce?.guide).toContain('14 ft');
  });
});

describe('species orders and penalties', () => {
  it('every species has a client', () => {
    for (const sp of Object.keys(SPECIES)) expect(SPECIES_CLIENTS[sp as keyof typeof SPECIES_CLIENTS].client).toBeTruthy();
    expect(SPECIES_CLIENTS.spruce.client).toBe('the Admiralty spar yard');
  });
  it('a missed species order costs nothing', () => {
    expect(missedPenalty(100, 0, 1000, false, true)).toBe(0);
    expect(missedPenalty(100, 0, 1000, false)).toBe(100);
  });
});

describe('weight', () => {
  it('idle skid and haul move bd ft / weight; felling and bucking ignore it; weight 1 is exact', () => {
    const i = { base: 10, season: 1, boost: 1, slope: 0.8, distance: 0.9 };
    expect(stageRate('skid', { ...i, weight: 0.8 })).toBeCloseTo(10 * 0.8 / 0.8, 12);
    expect(stageRate('haul', { ...i, weight: 1.1 })).toBeCloseTo(10 * 0.9 / 1.1, 12);
    expect(stageRate('fell', { ...i, weight: 1.1 })).toBe(10);
    expect(stageRate('buck', { ...i, weight: 1.1 })).toBe(10);
    expect(stageRate('skid', { ...i, weight: 1 })).toBe(stageRate('skid', i));
  });
  it('weight tags', () => {
    expect(weightTag(0.8)).toEqual({ key: 'light', text: 'Light: skid and haul ×1.25' });
    expect(weightTag(1.1).key).toBe('heavy');
    expect(weightTag(1.1).text).toBe('Heavy: skid and haul ×0.91');
    expect(weightTag(1).key).toBe('average');
  });
});

describe('camp fit', () => {
  const lot = { hp: 16, bf: 240, wt: 1.1 };
  it('compares felling capacity with skid and haul capacity on the lot\'s wood', () => {
    // fell 2 chops/s on hemlock = 30 bf/s; teams 20 bf/s pine = 18.2 bf/s hemlock -> ratio 1.65
    expect(campFit({ fell: 2, buck: 99, skid: 20, haul: 40 }, lot)).toMatchObject({ key: 'teams' });
    expect(campFit({ fell: 1, buck: 99, skid: 60, haul: 60 }, lot).key).toBe('fallers');
    expect(campFit({ fell: 1, buck: 99, skid: 16.5, haul: 16.5 }, lot).key).toBe('good');
    expect(campFit({ fell: 0, buck: 0, skid: 0, haul: 0 }, lot).key).toBe('none');
  });
  it('a lighter lot suits a camp short on teams', () => {
    const c = { fell: 2, buck: 99, skid: 22, haul: 40 };
    const spruce = { hp: 14, bf: 180, wt: 0.8 };
    expect(campFit(c, spruce).ratio).toBeLessThan(campFit(c, lot).ratio);
  });
  it('throughput is the slowest stage; score prefers value per dollar and per work', () => {
    const c = { fell: 2, buck: 25, skid: 20, haul: 40 };
    expect(tractThroughput(c, lot)).toBeCloseTo(20 / 1.1, 9);
    expect(tractThroughput(c, lot, 0.5)).toBeCloseTo(20 / 1.1, 9);
    expect(tractThroughput({ ...c, haul: 10 }, lot, 0.5)).toBeCloseTo(5 / 1.1, 9);
    const a = { ...lot, trees: 50, val: 32, price: 500 };
    expect(tractScore(c, a)).toBeGreaterThan(tractScore(c, { ...a, price: 900 }));
    expect(tractScore(c, a)).toBeGreaterThan(tractScore({ ...c, skid: 5 }, a));
    expect(tractScore({ fell: 0, buck: 0, skid: 0, haul: 0 }, a)).toBeGreaterThan(0);
  });
});
