import { describe, expect, it } from 'vitest';
import { must } from './test-rng';
import { streamRng } from './rng';
import {
  boardGradeName, boardValue, bundlesStillNeeded, bunkhouseMult, canCloseMill, cantSquared, coveLogPrice, freeSawyers, genSawLog, GRADE_MIX,
  knotShows, lumberPrice, maxSawyers, millLegacyGain, millPower, millRate, newSawCut, nextBoard, quarterSawn, sawAdvice, sawBest, sawBoard,
  sawBestPlan, sawCellBf, sawDraftPool, sawPar, sawQuality, sawSpeedBonus, sawValue, sawyerCost, SAW_PERKS, structureNext, STRUCTURES, turnLog, type SawLog,
} from './sawmill';

const logs = (n: number, o = {}): SawLog[] => { const st: Record<string, number> = {}, r = streamRng(st, 's', 7); return Array.from({ length: n }, () => genSawLog(r, o)); };

describe('structures', () => {
  it('saw pit, pond, headrig and a three-level bunkhouse; next level and bundles', () => {
    expect(STRUCTURES.map((s) => s.id)).toEqual(['sawmill.pit', 'sawmill.pond', 'sawmill.headrig', 'logging.bunkhouse']);
    expect(structureNext({}, 'sawmill.pond')?.cash).toBe(100);
    expect(structureNext({ 'sawmill.pond': 1 }, 'sawmill.pond')).toBeNull();
    expect(structureNext({}, 'nope')).toBeNull();
    expect(bundlesStillNeeded({})).toBe(28);
    expect(bundlesStillNeeded({ 'logging.bunkhouse': 2 })).toBe(16);
    expect(bunkhouseMult({ 'logging.bunkhouse': 3 })).toBeCloseTo(0.857375);
    expect(bunkhouseMult({})).toBe(1);
  });
  it('mill power, rate, room and sawyers', () => {
    expect(millPower({}, 'Winter')).toBe(1);
    expect(millPower({ 'sawmill.pond': 1 }, 'Spring')).toBeCloseTo(3.25);
    expect(millRate(2, {}, 'Fall', 1) * 60).toBeCloseTo(60);
    expect(maxSawyers({})).toBe(6);
    expect(maxSawyers({ 'sawmill.pond': 1, 'sawmill.headrig': 1 })).toBe(60);
    expect(freeSawyers({ 'sawmill.headrig': 1 })).toBe(4);
    expect(sawyerCost(0)).toBe(40);
    expect(sawyerCost(1)).toBe(44);
  });
  it('prices, shares and close camp', () => {
    expect(lumberPrice('clear', 1)).toBeCloseTo(0.75);
    expect(coveLogPrice(1)).toBeCloseTo(0.3);
    expect(GRADE_MIX.clear + GRADE_MIX.select + GRADE_MIX.common).toBeCloseTo(1);
    expect(millLegacyGain(150000, false)).toBe(8);
    expect(millLegacyGain(150000, true)).toBe(9);
    expect(canCloseMill(149999)).toBe(false);
    expect(canCloseMill(150000)).toBe(true);
  });
  it('five perks; Pond monkey stacks, the rest once', () => {
    expect(SAW_PERKS).toHaveLength(5);
    expect(sawDraftPool(['chaincarriage', 'pondmonkey']).map((p) => p.id)).toEqual(['sawyerseye', 'pondmonkey', 'turndog', 'bigstick']);
  });
});

describe('Saw for grade', () => {
  it('generates logs by size; Prime logs are mostly Clear', () => {
    const ls = logs(60);
    expect(new Set(ls.map((l) => l.n))).toEqual(new Set([6, 8, 10]));
    const clearShare = (l: SawLog) => l.zones.filter((z) => z === 0).length / l.zones.filter((z) => z >= 0).length;
    const avg = (xs: SawLog[]) => xs.reduce((a, l) => a + clearShare(l), 0) / xs.length;
    expect(avg(logs(40, { prime: true }))).toBeGreaterThan(avg(ls) + 0.1);
    expect(logs(1, { giant: true })[0]?.n).toBe(12);
  });
  it('boards come off the facing side, knots drop a grade, slabs are worth nothing', () => {
    const l = must(logs(1, { n: 8 })[0]), c = newSawCut(l);
    const b = nextBoard(l, c, 0);
    expect(b.width).toBe(4);
    const took = sawBoard(l, c);
    expect(took).toEqual(b);
    expect(c.top).toBe(1);
    expect(c.opened[0]).toBe(true);
    expect(boardValue(l, { face: 0, width: 4, grade: 0, knots: 0 })).toBe(12);
    expect(boardValue(l, { face: 0, width: 1, grade: -1, knots: 0 })).toBe(0);
    turnLog(c); expect(c.face).toBe(1); expect(c.turns).toBe(1);
    expect(boardGradeName(1)).toBe('select');
  });
  it('hidden knots show once their face is opened, or one board ahead with Sawyer’s eye', () => {
    const l: SawLog = { ...must(logs(1, { n: 8 })[0]), knots: [{ cell: 2, hidden: true }] };
    const c = newSawCut(l);
    expect(knotShows(l, c, must(l.knots[0]), false)).toBe(false);
    expect(knotShows(l, c, must(l.knots[0]), true)).toBe(true);
    c.opened[0] = true;
    expect(knotShows(l, c, must(l.knots[0]), false)).toBe(true);
  });
  it('par is the saw-around pattern; the best plan beats it; sawing ends at the squared cant', () => {
    let sumR = 0;
    for (const l of logs(40)) {
      const par = sawPar(l), best = sawBest(l);
      expect(best).toBeGreaterThanOrEqual(par);
      sumR += best / par;
      const c = newSawCut(l); let guard = 0;
      while (!c.done && guard++ < 100) { if (sawAdvice(l, c, false) === 'turn') turnLog(c); else sawBoard(l, c); }
      expect(c.done).toBe(true);
      expect(cantSquared(l, c)).toBe(true);
      expect(sawValue(l, c)).toBeLessThanOrEqual(best + 1e-9);
    }
    expect(sumR / 40).toBeGreaterThan(1.05);
  });
  it('the best plan replays to the best value', () => {
    for (const l of logs(12)) {
      const c = newSawCut(l);
      for (const f of sawBestPlan(l)) { c.face = f; sawBoard(l, c); }
      expect(sawValue(l, c)).toBeCloseTo(sawBest(l));
    }
  });
  it('quality, speed bonus, Quarter-sawn and board feet per cell', () => {
    expect(sawQuality(0.8)).toBeCloseTo(0.4);
    expect(sawQuality(1)).toBeCloseTo(0.7);
    expect(sawQuality(1.15)).toBeCloseTo(0.97);
    expect(sawQuality(2)).toBe(1);
    expect(sawSpeedBonus(20)).toBeCloseTo(0.1);
    expect(sawSpeedBonus(-3)).toBe(0);
    expect(quarterSawn(true, 0.98, 1.2)).toBe(1);
    expect(quarterSawn(true, 0.99, 1.3)).toBe(2);
    expect(quarterSawn(false, 1, 2)).toBe(0);
    expect(sawCellBf(30)).toBe(3);
  });
});
