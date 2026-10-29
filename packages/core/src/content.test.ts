import { describe, expect, it } from 'vitest';
import { must } from './test-rng';
import {
  achievementMet, achievementProgress, ACHIEVEMENTS, BOUNTY_CAP, BOUNTY_RATE, bountyCap, bountyMetric, bountyPay,
  improvementProgress, improvementReqText, requirementProgress, type AchMetric,
} from './achievements';
import {
  EQUIPMENT, ERA_SPECIES, ERAS, IMPROVEMENT_ALT_REQS, IMPROVEMENT_REQS, IMPROVEMENTS, META, MODS, PERKS, RARITY, SPECIES, STAGES, TRACT_BASE,
} from './content';

describe('content tables', () => {
  it('are frozen', () => {
    expect(Object.isFrozen(EQUIPMENT)).toBe(true);
    expect(Object.isFrozen(EQUIPMENT[0])).toBe(true);
    expect(Object.isFrozen(SPECIES.pine)).toBe(true);
    expect(Object.isFrozen(must(IMPROVEMENTS[0]).mult)).toBe(true);
  });
  it('have unique ids', () => {
    for (const list of [EQUIPMENT, IMPROVEMENTS, PERKS, META, MODS, ACHIEVEMENTS]) {
      const ids = list.map((x) => x.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
  it('reference only known stages, species, eras and rarities', () => {
    const stages = STAGES.map((s) => s.id);
    for (const e of EQUIPMENT) { expect(stages).toContain(e.stage); expect(e.era).toBeLessThan(ERAS.length); }
    for (const u of IMPROVEMENTS) expect(u.era).toBeLessThan(ERAS.length);
    for (const pool of ERA_SPECIES) for (const id of pool) expect(SPECIES[id]).toBeDefined();
    expect(ERA_SPECIES.length).toBe(ERAS.length);
    expect(TRACT_BASE.length).toBe(ERAS.length);
    for (const p of PERKS) expect(RARITY[p.r]).toBeDefined();
  });
  it('every improvement has an unlock requirement and every requirement an improvement', () => {
    expect(Object.keys(IMPROVEMENT_REQS).sort()).toEqual(IMPROVEMENTS.map((u) => u.id).sort());
  });
  it('known prototype values', () => {
    expect(ERAS.map((e) => e.cost)).toEqual([0, 15000, 1000000, 10000000]);
    expect(EQUIPMENT.find((e) => e.id === 'axeman')).toMatchObject({ rate: 1, cost: 40, up: 3 });
    expect(IMPROVEMENTS.find((u) => u.id === 'cook')?.mult).toEqual({ fell: 1.25, buck: 1.25 });
    expect(ACHIEVEMENTS).toHaveLength(63);
  });
});

describe('achievements', () => {
  const reader = (vals: Partial<Record<AchMetric, number>>) => (m: AchMetric) => vals[m];
  const byId = (id: string) => must(ACHIEVEMENTS.find((a) => a.id === id));

  it('d3m sits between the 1M delivery ladder and the 10M one', () => {
    const ids = ACHIEVEMENTS.map((x) => x.id), a = byId('d3m');
    expect(ids.indexOf('d1m')).toBeLessThan(ids.indexOf('d3m'));
    expect(ids.indexOf('d3m')).toBeLessThan(ids.indexOf('d10m'));
    expect(a).toMatchObject({ ladder: true, tier: 'first', when: [{ metric: 'deliv', op: '>=', value: 3e6 }] });
    expect(byId('d1m').cash).toBeLessThan(a.cash);
    expect(a.cash).toBeLessThan(byId('d10m').cash);
    expect(achievementMet(a, reader({ deliv: 2999999 }))).toBe(false);
    expect(achievementMet(a, reader({ deliv: 3e6 }))).toBe(true);
    expect(bountyMetric(a)).toBe('deliv');
  });
  it('ladders compare >= target and report progress', () => {
    const a = byId('d50k');
    expect(achievementMet(a, reader({ deliv: 49999 }))).toBe(false);
    expect(achievementMet(a, reader({ deliv: 50000 }))).toBe(true);
    expect(achievementProgress(a, reader({ deliv: 500 }))).toEqual([500, 50000]);
    expect(bountyMetric(a)).toBe('deliv');
    expect(bountyMetric(byId('crew30'))).toBe('crew');
    expect(bountyMetric(byId('pf25'))).toBe('perfFell');
  });
  it('first sale needs strictly more than zero delivered', () => {
    expect(achievementMet(byId('first_sale'), reader({ deliv: 0 }))).toBe(false);
    expect(achievementMet(byId('first_sale'), reader({ deliv: 0.1 }))).toBe(true);
  });
  it('one-off achievements have no progress bar or bounty', () => {
    expect(achievementProgress(byId('era1'), reader({ era: 0 }))).toBeNull();
    expect(bountyMetric(byId('allround'))).toBeNull();
  });
  it('all-around needs every mini-game, and missing stats never count', () => {
    const a = byId('allround');
    expect(achievementMet(a, reader({ perfFell: 1, perfBuck: 2, cleanSkid: 1 }))).toBe(false);
    expect(achievementMet(a, reader({ perfFell: 1, perfBuck: 2, cleanSkid: 1, cleanHaul: 3 }))).toBe(true);
    expect(achievementMet(byId('full_chain'), reader({ crewedStages: 3 }))).toBe(false);
    expect(achievementMet(byId('full_chain'), reader({ crewedStages: 4 }))).toBe(true);
  });
  it('improvement requirements sum their stats and treat missing ones as 0', () => {
    expect(requirementProgress(must(IMPROVEMENT_REQS.cook), { run_fell: 4, run_buck: 3 })).toEqual([7, 10]);
    expect(requirementProgress(must(IMPROVEMENT_REQS.smith), {})).toEqual([0, 25]);
  });
});

describe('repeat bounties', () => {
  it('pay 25% of the reward, capped at 20% of the next era per outpost', () => {
    expect(BOUNTY_RATE).toBe(0.25);
    expect(BOUNTY_CAP).toBe(0.2);
    expect(bountyCap(15000, 0)).toBe(3000);
    expect(bountyCap(Infinity, 10000000)).toBe(2000000);
    expect(bountyPay(500, 3000, 0)).toBe(125);
    expect(bountyPay(150, 3000, 0)).toBe(38);
    expect(bountyPay(20000, 3000, 2837)).toBe(163);
    expect(bountyPay(20000, 3000, 3000)).toBe(0);
    expect(bountyPay(20000, 3000, 3500)).toBe(0);
  });
});

describe("improvements' crews' route", () => {
  it('20 improvements have an idle route, each for a real improvement', () => {
    const ids = IMPROVEMENTS.map((u) => u.id);
    expect(Object.keys(IMPROVEMENT_ALT_REQS)).toHaveLength(24);
    for (const id of ['chokers', 'arch', 'bundle']) expect(IMPROVEMENT_ALT_REQS[id]).toBeDefined();
    for (const id of Object.keys(IMPROVEMENT_ALT_REQS)) expect(ids).toContain(id);
    expect(IMPROVEMENT_ALT_REQS.gunstick).toBeUndefined();
    expect(must(IMPROVEMENT_ALT_REQS.wedges).target).toBe(20);
  });
  it('progress reports whichever route is closer to done', () => {
    expect(improvementProgress('swamper', { run_skid: 1 })).toEqual([1, 3]);
    expect(improvementProgress('swamper', { run_skid: 1, contracts: 5 })).toEqual([5, 6]);
    expect(improvementProgress('grade', { buck85: 0, achievements: 20 })).toEqual([20, 28]);
    expect(improvementProgress('gunstick', { contracts: 99 })).toEqual([0, 3]);
  });
  it('text names both routes', () => {
    expect(improvementReqText('swamper')).toBe('Play 3 skid games, or fill 6 orders');
    expect(improvementReqText('wedges')).toBe('Land 3 good falls, or finish 20 lots');
    expect(improvementReqText('gunstick')).toBe('Play 3 felling games');
    expect(improvementReqText('chokers')).toBe('Skid 12 logs in the skid game, or finish 40 lots');
  });
  it('skid-train improvements progress on logs skidded or the idle milestone', () => {
    expect(improvementProgress('arch', { skidLogs: 30 })).toEqual([30, 60]);
    expect(improvementProgress('bundle', { skidLogs: 10, contracts: 140 })).toEqual([140, 150]);
  });
});
