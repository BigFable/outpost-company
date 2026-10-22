import { describe, expect, it } from 'vitest';
import { must } from './test-rng';
import {
  achievementMet, achievementProgress, ACHIEVEMENTS, bountyMetric, requirementProgress, type AchMetric,
} from './achievements';
import {
  EQUIPMENT, ERA_SPECIES, ERAS, IMPROVEMENT_REQS, IMPROVEMENTS, META, MODS, PERKS, RARITY, SPECIES, STAGES, TRACT_BASE,
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
    expect(ACHIEVEMENTS).toHaveLength(55);
  });
});

describe('achievements', () => {
  const reader = (vals: Partial<Record<AchMetric, number>>) => (m: AchMetric) => vals[m];
  const byId = (id: string) => must(ACHIEVEMENTS.find((a) => a.id === id));

  it('ladders compare >= target and report progress', () => {
    const a = byId('d10k');
    expect(achievementMet(a, reader({ deliv: 9999 }))).toBe(false);
    expect(achievementMet(a, reader({ deliv: 10000 }))).toBe(true);
    expect(achievementProgress(a, reader({ deliv: 500 }))).toEqual([500, 10000]);
    expect(bountyMetric(a)).toBe('deliv');
    expect(bountyMetric(byId('crew10'))).toBe('crew');
    expect(bountyMetric(byId('pf1'))).toBe('perfFell');
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
