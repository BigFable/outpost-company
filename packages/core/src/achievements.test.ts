import { describe, expect, it } from 'vitest';
import { must } from './test-rng';
import {
  ACH_RENAMED, ACH_TIERS, ACHIEVEMENTS, AFTER_CLOSE_METRICS, achievementBar, achievementDef, achievementMet, closesNeeded,
  GOALS_PER_DRAFT, migrateAchievements, achievementPayCap, splitReward, type AchMetric,
} from './achievements';
import { IMPROVEMENT_ALT_REQS } from './content';

const byId = (id: string) => must(achievementDef(id));
/** A company that has never closed camp, however long it played: after-close metrics are 0 (steamLater unset), the rest huge. */
const neverClosed = (m: AchMetric): number | undefined => m === 'steamLater' ? undefined : AFTER_CLOSE_METRICS.includes(m) ? 0 : 1e12;
/** A fresh company: nothing done yet. */
const fresh = (m: AchMetric): number | undefined => m === 'steamLater' ? undefined : m === 'slots' ? 1 : 0;

describe('achievement tiers (rework 2026-10-28)', () => {
  it('every achievement has a known tier, and tiers come in order', () => {
    const tiers = ACH_TIERS.map((t) => t.id);
    let last = 0;
    for (const a of ACHIEVEMENTS) {
      const i = tiers.indexOf(a.tier);
      expect(i).toBeGreaterThanOrEqual(0);
      expect(i).toBeGreaterThanOrEqual(last);
      last = i;
    }
  });
  it('has 40-60ish achievements, and at most 40% can be earned without closing camp', () => {
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(40);
    expect(ACHIEVEMENTS.length).toBeLessThanOrEqual(65);
    const noClose = ACHIEVEMENTS.filter((a) => achievementMet(a, neverClosed));
    expect(noClose.length / ACHIEVEMENTS.length).toBeLessThanOrEqual(0.4);
    expect(noClose.every((a) => a.tier === 'first')).toBe(true);
  });
  it('a company that never closes camp cannot finish any across-outposts or long-haul achievement', () => {
    for (const a of ACHIEVEMENTS.filter((x) => x.tier !== 'first')) {
      expect(achievementMet(a, neverClosed), a.id).toBe(false);
      expect(closesNeeded(a), a.id).toBeGreaterThanOrEqual(1);
    }
  });
  it('every first-outpost achievement can be earned before the first close camp', () => {
    for (const a of ACHIEVEMENTS.filter((x) => x.tier === 'first')) {
      expect(closesNeeded(a), a.id).toBe(0);
      expect(achievementMet(a, neverClosed), a.id).toBe(true);
    }
  });
  it('a fresh game has none, and the across tier opens step by step', () => {
    for (const a of ACHIEVEMENTS) expect(achievementMet(a, fresh), a.id).toBe(false);
    const oneClose = (m: AchMetric) => m === 'closes' ? 1 : fresh(m);
    expect(achievementMet(byId('close1'), oneClose)).toBe(true);
    expect(achievementMet(byId('close3'), oneClose)).toBe(false);
    expect(closesNeeded(byId('close3'))).toBe(3);
    expect(closesNeeded(byId('d100m'))).toBe(3);
    expect(closesNeeded(byId('mill1'))).toBe(1);
  });
  it('quick steam reads the fastest later Steam Camp and needs one', () => {
    const a = byId('quicksteam');
    expect(achievementMet(a, (m) => m === 'steamLater' ? 14.5 : 0)).toBe(true);
    expect(achievementMet(a, (m) => m === 'steamLater' ? 15.5 : 0)).toBe(false);
    expect(achievementMet(a, () => undefined)).toBe(false);
  });
  it('the list bar counts the main condition, not the close-camp gate', () => {
    expect(achievementBar(byId('t30k'), (m) => m === 'felled' ? 1200 : 0)).toEqual([1200, 3e4]);
    expect(achievementBar(byId('close3'), (m) => m === 'closes' ? 1 : 0)).toBeNull();
    expect(achievementBar(byId('era1'), () => 0)).toBeNull();
    expect(achievementBar(byId('d50k'), () => undefined)).toEqual([0, 5e4]);
  });
  it('a reward pays at most half the next push inland now; the rest waits for the next era', () => {
    expect(achievementPayCap(15000, 0)).toBe(7500);
    expect(achievementPayCap(Infinity, 10000000)).toBe(5000000);
    expect(splitReward(200000, 7500)).toEqual([7500, 192500]);
    expect(splitReward(4400, 7500)).toEqual([4400, 0]);
    expect(splitReward(-5, 7500)).toEqual([0, 0]);
    // the first outpost's big crew rewards land after Steam Camp, under the cap
    expect(byId('crew120').cash).toBeLessThanOrEqual(achievementPayCap(1000000, 15000));
  });
  it('perk picks from goals come every few goals', () => {
    expect(GOALS_PER_DRAFT).toBe(3);
  });
  it("the crews' route still reads achievement counts that a real company can reach", () => {
    const first = ACHIEVEMENTS.filter((a) => a.tier === 'first').length;
    expect(must(IMPROVEMENT_ALT_REQS.lookout).target).toBeLessThanOrEqual(first);
    expect(must(IMPROVEMENT_ALT_REQS.grade).target).toBeGreaterThan(first);
    expect(must(IMPROVEMENT_ALT_REQS.radios).target).toBeLessThan(ACHIEVEMENTS.length);
  });
});

describe('old saves keep their achievements', () => {
  it('kept ids stay, renamed ids map, removed ids drop, no repeats', () => {
    expect(migrateAchievements(['first_tree', 'd10k', 'd1m', 'crew50', 'crew30', 'w5', 'd1b', 'era3', 7, null, 'first_tree']))
      .toEqual(['first_tree', 'd1m', 'crew30', 'w1', 'era3']);
  });
  it('a save from before the rework that earned all 58 old achievements keeps every id that survives', () => {
    const old = ['first_tree', 'first_sale', 'first_crew', 'full_chain', 'd10k', 'd50k', 'd250k', 'd1m', 'd2m', 'd3m', 'd10m', 'd30m', 'd100m', 'd300m', 'd1b',
      'e10k', 'e100k', 'e1m', 'e5m', 'e25m', 'e100m', 't100', 't1k', 't3k', 't10k', 't30k', 't100k', 'tr3', 'tr10', 'tr30', 'tr60', 'hire1', 'c1', 'c5', 'c10', 'c20',
      'crew10', 'crew30', 'crew75', 'crew50', 'crew120', 'w1', 'w5', 'w10', 'pf1', 'pf10', 'pb1', 'pb10', 'cs1', 'cs10', 'ch1', 'ch10', 'allround', 'wx10', 'wxall', 'era1', 'era2', 'era3'];
    expect(old).toHaveLength(58);
    const now = migrateAchievements(old);
    for (const id of old) if (achievementDef(id)) expect(now).toContain(id);
    expect(now.every((id) => achievementDef(id))).toBe(true);
    // the playtester's company: earned everything without closing camp, and keeps far fewer than all of the new list
    expect(now.length).toBeLessThan(ACHIEVEMENTS.length * 0.6);
  });
  it('renames point at real achievements', () => {
    for (const to of Object.values(ACH_RENAMED)) expect(achievementDef(to)).toBeDefined();
    for (const from of Object.keys(ACH_RENAMED)) expect(achievementDef(from)).toBeUndefined();
  });
  it('handles a damaged list', () => {
    expect(migrateAchievements(undefined as unknown as string[])).toEqual([]);
    expect(migrateAchievements([{}, 'nope'] as unknown as string[])).toEqual([]);
  });
});
