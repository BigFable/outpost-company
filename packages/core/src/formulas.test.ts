import { describe, expect, it } from 'vitest';
import { must } from './test-rng';
import { GOLDEN } from './__fixtures__/prototype-golden';
import { EQUIPMENT, SPECIES } from './content';
import {
  applyMults, boostFactor, boostLength, canCloseCamp, clauseMult, crewCount, crewRate, crewUpkeep, crewUpkeepFull,
  distanceFactor, equipmentCost, eraCost, handAmount, improvementMult, legacyBase, legacyGain, marketPrice,
  missedPenalty, mobilization, perkCount, perkMult, seasonFactor, slopeFactor, stageRate, treeValue,
} from './formulas';

const NO_SEASON_OPTS = { swampBoots: false, corduroy: false, iceRoad: false, iceKing: false };

describe('treeValue', () => {
  it('prices sawlog share at sawlog price and the rest as pulp', () => {
    // pine: 200 * (.75*.25 + .25*.06) = 40.5
    expect(treeValue(SPECIES.pine)).toBeCloseTo(40.5, 12);
    expect(treeValue(SPECIES.walnut)).toBeCloseTo(280 * (0.7 * 1.4 + 0.3 * 0.04), 12);
  });
});

describe('applyMults', () => {
  it('multiplies left to right and returns base for no factors', () => {
    expect(applyMults(3, [])).toBe(3);
    expect(applyMults(2, [1.5, 2])).toBe(6);
  });
});

describe('equipmentCost', () => {
  it('matches the prototype for every captured case', () => {
    for (const [id, n, want] of GOLDEN.eqCost as [string, number, number][]) {
      const e = EQUIPMENT.find((x) => x.id === id);
      expect(e).toBeDefined();
      expect(equipmentCost(must(e).cost, n)).toBe(want);
    }
  });
  it('is the base price for the first unit and grows 15% per unit, rounded up', () => {
    expect(equipmentCost(40, 0)).toBe(40);
    expect(equipmentCost(40, 1)).toBe(46);
    expect(equipmentCost(40, 2)).toBe(Math.ceil(40 * 1.15 * 1.15));
  });
});

describe('crews', () => {
  it('sums rates per stage and ignores other stages and unknown ids', () => {
    expect(crewRate('fell', {})).toBe(0);
    expect(crewRate('fell', { axeman: 2, crosscut: 1, bucker: 5, nonsense: 9 })).toBe(2 * 1 + 4);
    expect(crewCount({ axeman: 2, bucker: 5 })).toBe(7);
  });
  it('pays idle crews a share of wages', () => {
    const own = { axeman: 1, bucker: 1 }; // up 3 + 3
    expect(crewUpkeepFull(own)).toBe(6);
    expect(crewUpkeep(own, {}, 0.25)).toBe(6); // missing util = fully busy
    expect(crewUpkeep(own, { fell: 0, buck: 0 }, 0.25)).toBe(1.5);
    expect(crewUpkeep(own, { fell: 0, buck: 0.5 }, 0)).toBe(1.5); // Company store: idle crews unpaid
  });
});

describe('multipliers', () => {
  it('multiplies owned improvements for a key', () => {
    expect(improvementMult([], 'fell')).toBe(1);
    expect(improvementMult(['wedges', 'cook'], 'fell')).toBe(1.15 * 1.25);
    expect(improvementMult(['wedges', 'cook'], 'haul')).toBe(1);
    expect(improvementMult(['smith', 'shop', 'telematics'], 'upkeep')).toBe(0.85 * 0.85 * 0.8);
  });
  it('stacks perk copies and ignores rule-only and unknown perks', () => {
    expect(perkMult([], 'fell')).toBe(1);
    expect(perkMult(['sharp', 'sharp', 'widow', 'nope'], 'fell')).toBe(1.25 * 1.25);
    expect(perkMult(['strong'], 'click')).toBe(3);
    expect(perkCount(['sharp', 'sharp', 'widow'], 'sharp')).toBe(2);
    expect(perkCount([], 'sharp')).toBe(0);
  });
});

describe('seasonFactor', () => {
  it('slows skid and haul in spring mud, less with corduroy, not skid with swamp boots', () => {
    expect(seasonFactor('Spring', 'skid', NO_SEASON_OPTS)).toBe(0.5);
    expect(seasonFactor('Spring', 'haul', { ...NO_SEASON_OPTS, corduroy: true })).toBe(0.75);
    expect(seasonFactor('Spring', 'skid', { ...NO_SEASON_OPTS, swampBoots: true })).toBe(1);
    expect(seasonFactor('Spring', 'haul', { ...NO_SEASON_OPTS, swampBoots: true })).toBe(0.5);
    expect(seasonFactor('Spring', 'fell', NO_SEASON_OPTS)).toBe(1);
  });
  it('speeds winter skid and haul and slows winter felling', () => {
    expect(seasonFactor('Winter', 'fell', NO_SEASON_OPTS)).toBe(0.85);
    expect(seasonFactor('Winter', 'buck', NO_SEASON_OPTS)).toBe(1);
    expect(seasonFactor('Winter', 'skid', NO_SEASON_OPTS)).toBe(1.25);
    expect(seasonFactor('Winter', 'haul', { ...NO_SEASON_OPTS, iceRoad: true, iceKing: true })).toBe(1.25 * 1.5 * 1.4);
  });
  it('is neutral in summer and fall', () => {
    for (const st of ['fell', 'buck', 'skid', 'haul'] as const) {
      expect(seasonFactor('Summer', st, NO_SEASON_OPTS)).toBe(1);
      expect(seasonFactor('Fall', st, NO_SEASON_OPTS)).toBe(1);
    }
  });
});

describe('site factors', () => {
  it('slope slows skidding; skyline floors it at 0.92', () => {
    expect(slopeFactor('flat', false)).toBe(1);
    expect(slopeFactor('steep', false)).toBe(0.55);
    expect(slopeFactor('steep', true)).toBe(0.92);
    expect(slopeFactor('flat', true)).toBe(1);
  });
  it('distance factor is 1 at one mile and falls with distance', () => {
    expect(distanceFactor(1)).toBeCloseTo(1, 15);
    expect(distanceFactor(12)).toBeCloseTo(1.07 / 1.84, 15);
    expect(distanceFactor(0.5)).toBeGreaterThan(1);
  });
  it('stageRate applies slope only to skid and distance only to haul', () => {
    const i = { base: 10, season: 0.5, boost: 2, slope: 0.8, distance: 0.5 };
    expect(stageRate('fell', i)).toBe(10);
    expect(stageRate('skid', i)).toBe(8);
    expect(stageRate('haul', i)).toBe(5);
  });
  it('hand work amounts per stage', () => {
    expect(handAmount('fell', 3, 0.5, 0.5)).toBe(0);
    expect(handAmount('buck', 2, 0.5, 0.5)).toBe(60);
    expect(handAmount('skid', 1, 0.8, 1)).toBe(16);
    expect(handAmount('haul', 1, 1, 0.5)).toBe(12.5);
  });
  it('pace boosts', () => {
    expect(boostFactor(false)).toBe(1.5);
    expect(boostFactor(true)).toBe(2);
    expect(boostLength(false, 0, false)).toBe(30);
    expect(boostLength(true, 2, true)).toBe(45 + 30 + 10);
  });
});

describe('marketPrice', () => {
  it('matches the prototype bit for bit at captured times', () => {
    for (const [t, want] of GOLDEN.market as [number, number][]) expect(marketPrice(t)).toBe(want);
  });
  it('stays inside its 0.76..1.24 band', () => {
    for (let t = 0; t < 20000; t += 7.3) {
      const m = marketPrice(t);
      expect(m).toBeGreaterThanOrEqual(0.76);
      expect(m).toBeLessThanOrEqual(1.24);
    }
  });
});

describe('contracts and hire', () => {
  it('mobilization advance is clamped between $40 and 4 minutes of upkeep', () => {
    expect(mobilization(10, 1, 0)).toBe(40);
    expect(mobilization(1000, 30, 100)).toBe(400);
    expect(mobilization(100, 30, 1e6)).toBe(900);
  });
  it('missed penalty scales with the undelivered share; handshake waives it', () => {
    expect(missedPenalty(1000, 0, 5000, false)).toBe(1000);
    expect(missedPenalty(1000, 2500, 5000, false)).toBe(500);
    expect(missedPenalty(1000, 5000, 5000, false)).toBe(0);
    expect(missedPenalty(1000, 0, 5000, true)).toBe(0);
  });
});

describe('eraCost', () => {
  it('matches the prototype with each discount combination', () => {
    for (const { nodes, costs } of GOLDEN.eraCost as { nodes: string[]; costs: (number | null)[] }[]) {
      const d = { steam: nodes.includes('steam'), gas: nodes.includes('gas') };
      // JSON stores Infinity as null
      expect(costs.map((_, i) => eraCost(i, d))).toEqual(costs.map((c) => (c === null ? Infinity : c)));
    }
  });
});

describe('close camp', () => {
  it('legacyBase is √(d/20000) up to 10M and continuous at the seam', () => {
    expect(legacyBase(0)).toBe(0);
    expect(legacyBase(20000)).toBe(1);
    expect(legacyBase(1e7)).toBeCloseTo(Math.sqrt(500), 12);
    expect(legacyBase(1e7 + 1)).toBeCloseTo(Math.sqrt(500), 5);
    expect(legacyBase(1e8)).toBeCloseTo(Math.sqrt(500) + 8, 12);
  });
  it('legacyGain matches the prototype for captured runs', () => {
    for (const { deliv, mods, nodes, L } of GOLDEN.legacy as { deliv: number; mods: string[]; nodes: string[]; L: number }[]) {
      expect(legacyGain(deliv, mods, nodes.includes('legacy'))).toBe(L);
    }
  });
  it('clause multiplier multiplies known clauses and ignores unknown ones', () => {
    expect(clauseMult([])).toBe(1);
    expect(clauseMult(['market', 'beetle'])).toBeCloseTo(1.56, 12);
    expect(clauseMult(['bogus'])).toBe(1);
  });
  it('the ship takes a cargo at Steam Camp or 250K bd ft', () => {
    expect(canCloseCamp(0, 249999)).toBe(false);
    expect(canCloseCamp(0, 250000)).toBe(true);
    expect(canCloseCamp(1, 0)).toBe(true);
  });
});
