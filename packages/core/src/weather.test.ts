import { describe, expect, it } from 'vitest';
import { SEASONS, type Season, type Stage } from './content';
import { ACHIEVEMENTS } from './achievements';
import { seasonFactor } from './formulas';
import { ORDER_BONUS_CAP, orderBonus } from './items';
import { streamRng } from './rng';
import { must, scripted } from './test-rng';
import {
  awaySummary, composeSeason, effectiveSeason, EVENT_CLAMP, eventDef, eventFindWeights, eventGameRules, eventMult, eventSlows, eventStageFactor,
  eventWeights, FIRST_CARD, gameRule, GENTLE_CHANGES, HALF_SEC, payrollGuard, rollEvent, SEASON_EVENTS, STORM_SEASON_CAP, stormSeasonMult, windMult,
} from './weather';

const ev = (id: string) => must(eventDef(id));
const ctx = { badStreak: 0, maxBad: 1, changes: 10 };
const STAGES: Stage[] = ['fell', 'buck', 'skid', 'haul'];

describe('event tables', () => {
  it('slice 1: four events per season, one "nothing" of weight 30-34 each', () => {
    for (const s of SEASONS) {
      const rows = SEASON_EVENTS.filter((e) => e.season === s);
      expect(rows).toHaveLength(4);
      const none = rows.filter((e) => e.tone === 'none');
      expect(none).toHaveLength(1);
      expect(must(none[0]).weight).toBeGreaterThanOrEqual(30);
      expect(must(none[0]).weight).toBeLessThanOrEqual(34);
      expect(rows.filter((e) => e.tone === 'bad')).toHaveLength(1);
      expect(rows.filter((e) => e.tone === 'good').length).toBeGreaterThanOrEqual(1);
    }
  });
  it('ids are unique, every bad event has a counter, the first card is good', () => {
    expect(new Set(SEASON_EVENTS.map((e) => e.id)).size).toBe(SEASON_EVENTS.length);
    for (const e of SEASON_EVENTS) if (e.tone === 'bad') expect(e.counter).toBeTruthy();
    for (const s of SEASONS) expect(ev(FIRST_CARD[s]).tone).toBe('good');
    for (const s of SEASONS) expect(ev(FIRST_CARD[s]).season).toBe(s);
  });
  it('the "Every season’s card" achievement needs every Almanac card', () => {
    const a = must(ACHIEVEMENTS.find((x) => x.id === 'wxall'));
    expect(must(a.when[0]).value).toBe(SEASON_EVENTS.length);
  });
  it('is frozen data', () => {
    expect(Object.isFrozen(SEASON_EVENTS)).toBe(true);
    expect(Object.isFrozen(ev('thaw_flood').effects)).toBe(true);
  });
});

describe('eventWeights', () => {
  it('uses the table weights by default', () => {
    expect(eventWeights('Spring').map((r) => r.w)).toEqual([34, 14, 12, 12]);
  });
  it('Storm signals: bad weight ×0.7, freed weight goes to nothing (total unchanged)', () => {
    const rows = eventWeights('Fall', { signals: true });
    const by = (id: string) => must(rows.find((r) => r.def.id === id)).w;
    expect(by('equinox_gale')).toBeCloseTo(14 * 0.7);
    expect(by('fog_water')).toBeCloseTo(30 + 14 * 0.3);
    expect(rows.reduce((a, r) => a + r.w, 0)).toBeCloseTo(70);
  });
  it('Storm season ×2 on bad; Dry summer ×3 on Dry spell only', () => {
    expect(must(eventWeights('Winter', { stormSeason: true }).find((r) => r.def.id === 'blizzard')).w).toBe(24);
    const sum = eventWeights('Summer', { drySummer: true });
    expect(must(sum.find((r) => r.def.id === 'dry_spell')).w).toBe(36);
    expect(must(sum.find((r) => r.def.id === 'fish_run')).w).toBe(12);
    expect(must(eventWeights('Spring', { drySummer: true }).find((r) => r.def.id === 'thaw_flood')).w).toBe(14);
  });
});

describe('rollEvent', () => {
  const rows = eventWeights('Spring'); // 34 nothing, 14 flood, 12 supply, 12 fog of 72
  it('draws exactly once and picks by weight', () => {
    const r = scripted([0]); expect(rollEvent('Spring', ctx, rows, r).id).toBe('grey_spring'); expect(r.used()).toBe(1);
    expect(rollEvent('Spring', ctx, rows, scripted([34.5 / 72])).id).toBe('thaw_flood');
    expect(rollEvent('Spring', ctx, rows, scripted([49 / 72])).id).toBe('supply_ship');
    expect(rollEvent('Spring', ctx, rows, scripted([0.9999])).id).toBe('fog_bank');
  });
  it('never two bad in a row (one bad allowed after a bad with Storm season)', () => {
    const flood = 34.5 / 72;
    expect(rollEvent('Spring', { ...ctx, badStreak: 1 }, rows, scripted([flood])).id).toBe('grey_spring');
    expect(rollEvent('Spring', { ...ctx, badStreak: 1, maxBad: 2 }, rows, scripted([flood])).id).toBe('thaw_flood');
    expect(rollEvent('Spring', { ...ctx, badStreak: 2, maxBad: 2 }, rows, scripted([flood])).id).toBe('grey_spring');
  });
  it('gentle start: the first card is the season’s good headline, then only good or nothing', () => {
    for (const s of SEASONS) {
      const r = scripted([0.5]);
      expect(rollEvent(s, { ...ctx, changes: 0 }, eventWeights(s), r).id).toBe(FIRST_CARD[s]);
      expect(r.used()).toBe(1);
    }
    for (let c = 1; c < GENTLE_CHANGES; c++) {
      expect(rollEvent('Spring', { ...ctx, changes: c }, rows, scripted([34.5 / 72])).id).toBe('grey_spring');
      expect(rollEvent('Spring', { ...ctx, changes: c }, rows, scripted([0.9999])).id).toBe('grey_spring'); // fog bank (mixed)
      expect(rollEvent('Spring', { ...ctx, changes: c }, rows, scripted([49 / 72])).id).toBe('supply_ship');
    }
    expect(rollEvent('Spring', { ...ctx, changes: GENTLE_CHANGES }, rows, scripted([34.5 / 72])).id).toBe('thaw_flood');
  });
  it('over many seeded rolls with the guards: no bad pair, rates near the weights', () => {
    const st: Record<string, number> = {}; const rng = streamRng(st, 'events', 12345);
    let streak = 0, pairs = 0, bad = 0; const N = 4000;
    for (let i = 0; i < N; i++) {
      const s = SEASONS[i % 4] as Season;
      const e = rollEvent(s, { badStreak: streak, maxBad: 1, changes: 10 + i }, eventWeights(s), rng);
      if (e.tone === 'bad') { bad++; if (streak) pairs++; streak++; } else streak = 0;
    }
    expect(pairs).toBe(0);
    // raw bad share is about 52/290 = 18%; the no-pair rule trims it a little
    expect(bad / N).toBeGreaterThan(0.12); expect(bad / N).toBeLessThan(0.2);
  });
});

describe('stage factors and the clamp', () => {
  it('no event is exactly 1 and composeSeason returns the base untouched', () => {
    for (const st of STAGES) expect(eventStageFactor(undefined, st, 10)).toBe(1);
    for (const s of SEASONS) for (const st of STAGES) {
      const b = seasonFactor(s, st, { swampBoots: false, corduroy: false, iceRoad: true, iceKing: true });
      expect(composeSeason(b, 1)).toBe(b);
      expect(composeSeason(b, eventStageFactor(ev('grey_spring'), st, 10))).toBe(b);
    }
  });
  it('clamps to 0.4-1.6: spring mud 0.5 × flood 0.8 = 0.4; blizzard 0.6 on spring-like base is floored', () => {
    expect(composeSeason(0.5, eventStageFactor(ev('thaw_flood'), 'skid', 0))).toBeCloseTo(0.4);
    expect(composeSeason(0.5, 0.6)).toBe(EVENT_CLAMP[0]);
    expect(composeSeason(1.25, 1.3)).toBe(EVENT_CLAMP[1]); // ice bridge on a winter road
  });
  it('a good event never lifts a season already above the range further', () => {
    const sprinkler = 1.25 * 1.5 * 1.4; // winter haul, sprinkler and Ice road king
    expect(composeSeason(sprinkler, 1.3)).toBe(sprinkler);
    expect(composeSeason(sprinkler, 0.5)).toBeCloseTo(sprinkler * 0.5); // a bad event still bites
  });
  it('flood counts as mud: Corduroy halves it, Swamp boots ignores it, Greased runners make it ×1.1', () => {
    const f = ev('thaw_flood');
    expect(eventStageFactor(f, 'skid', 0)).toBe(0.8);
    expect(eventStageFactor(f, 'skid', 0, { corduroy: true })).toBeCloseTo(0.9);
    expect(eventStageFactor(f, 'skid', 0, { swampBoots: true })).toBe(1);
    expect(eventStageFactor(f, 'skid', 0, { greased: true })).toBe(1.1);
    expect(eventStageFactor(f, 'haul', 0)).toBe(1);
  });
  it('blizzard: every stage ×0.6 in the first half (sprinkler spares hauling), hauling ×1.2 after', () => {
    const b = ev('blizzard');
    for (const st of STAGES) expect(eventStageFactor(b, st, HALF_SEC - 1)).toBe(0.6);
    expect(eventStageFactor(b, 'haul', 10, { iceRoad: true })).toBe(1);
    expect(eventStageFactor(b, 'haul', HALF_SEC)).toBe(1.2);
    expect(eventStageFactor(b, 'fell', HALF_SEC)).toBe(1);
  });
  it('Clear the road halves the remaining penalty; Ill wind turns it into a bonus of the same size', () => {
    const g = ev('equinox_gale');
    expect(eventStageFactor(g, 'haul', 0, { cleared: true })).toBeCloseTo(0.925);
    expect(eventStageFactor(g, 'haul', 0, { illWind: true })).toBeCloseTo(1.15);
    expect(eventStageFactor(g, 'fell', 0, { illWind: true })).toBe(1.1); // bonuses stay as they are
    expect(eventStageFactor(ev('blizzard'), 'skid', 0, { illWind: true })).toBeCloseTo(1.4);
    expect(eventStageFactor(ev('fish_run'), 'fell', 0, { illWind: true })).toBe(0.85); // mixed events are not bad weather
  });
  it('payroll guard pauses every harmful stage effect, never a good one', () => {
    expect(eventStageFactor(ev('equinox_gale'), 'haul', 0, { guard: true })).toBe(1);
    expect(eventStageFactor(ev('equinox_gale'), 'fell', 0, { guard: true })).toBe(1.1);
    expect(eventStageFactor(ev('fish_run'), 'buck', 0, { guard: true })).toBe(1);
    expect(eventStageFactor(ev('long_days'), 'buck', 0, { guard: true })).toBe(1.1);
  });
  it('eventSlows names the stages Clear the road can clear', () => {
    expect(STAGES.filter((s) => eventSlows(ev('thaw_flood'), s, 0))).toEqual(['skid']);
    expect(STAGES.filter((s) => eventSlows(ev('equinox_gale'), s, 0))).toEqual(['haul']);
    expect(STAGES.filter((s) => eventSlows(ev('blizzard'), s, 0))).toEqual(STAGES);
    expect(STAGES.filter((s) => eventSlows(ev('blizzard'), s, HALF_SEC))).toEqual([]);
    expect(STAGES.filter((s) => eventSlows(ev('dry_spell'), s, 0))).toEqual(['buck']);
    expect(STAGES.filter((s) => eventSlows(ev('fish_run'), s, 0))).toEqual([]);
  });
  it('a year of plain weather averages near a quiet year for the bottleneck-free stage mean', () => {
    // weighted mean idle factor per stage, no perks: inside 0.97-1.04 (spec: 0.98-1.03 with the full tables)
    for (const st of STAGES) {
      let tot = 0, w = 0;
      for (const s of SEASONS) for (const r of eventWeights(s)) {
        const base = seasonFactor(effectiveSeason(s, r.def), st, { swampBoots: false, corduroy: false, iceRoad: false, iceKing: false });
        const quiet = seasonFactor(s, st, { swampBoots: false, corduroy: false, iceRoad: false, iceKing: false });
        const f = (composeSeason(base, eventStageFactor(r.def, st, 0)) + composeSeason(base, eventStageFactor(r.def, st, HALF_SEC))) / 2;
        tot += r.w * f / quiet; w += r.w;
      }
      expect(tot / w).toBeGreaterThan(0.97); expect(tot / w).toBeLessThan(1.04);
    }
  });
});

describe('other hooks', () => {
  it('eventMult: supply ship cheapens hires and land; fish run cuts upkeep; the guard drops only harm', () => {
    expect(eventMult(ev('supply_ship'), 'hire')).toBe(0.85);
    expect(eventMult(ev('supply_ship'), 'tractPrice')).toBe(0.85);
    expect(eventMult(ev('fish_run'), 'upkeep')).toBe(0.75);
    expect(eventMult(ev('fish_run'), 'upkeep', true)).toBe(0.75);
    expect(eventMult(undefined, 'price')).toBe(1);
    expect(eventMult(ev('fog_bank'), 'finds')).toBe(2);
  });
  it('find weights, effective season, game rules', () => {
    expect(eventFindWeights(ev('clear_cold'))).toEqual({ 'logging.fog_glass': 3 });
    expect(eventFindWeights(ev('equinox_gale'))).toEqual({ 'logging.ships_fitting': 2 });
    expect(effectiveSeason('Fall', ev('early_freeze'))).toBe('Winter');
    expect(effectiveSeason('Fall', ev('equinox_gale'))).toBe('Fall');
    expect(gameRule(ev('equinox_gale'), 'fell', 'wind', 1)).toBe(1.5);
    expect(gameRule(ev('thaw_flood'), 'skid', 'mudPlus')).toBe(3);
    expect(gameRule(ev('thaw_flood'), 'haul', 'limit')).toBe(-1);
    expect(gameRule(ev('ice_bridge'), 'haul', 'summerBrakes')).toBe(1);
    expect(gameRule(ev('blizzard'), 'haul', 'viewFrac', 1)).toBe(0.6);
    expect(eventGameRules(ev('long_days'), 'buck')).toEqual([{ rule: 'boostSec', value: 10 }]);
    expect(eventGameRules(undefined, 'fell')).toEqual([]);
  });
  it('wind cap 2.0 (gale × spruce headlands)', () => {
    expect(windMult(1.5)).toBe(1.5);
    expect(windMult(1.5, 1.5, 1.2)).toBe(2);
  });
  it('payroll guard: under 2 minutes of upkeep, never with no upkeep', () => {
    expect(payrollGuard(100, 60)).toBe(true);
    expect(payrollGuard(120, 60)).toBe(false);
    expect(payrollGuard(0, 0)).toBe(false);
  });
  it('Storm season: +2% per full bad event, at most +30%, outside the 25% special-order cap', () => {
    expect(stormSeasonMult(0)).toBe(1);
    expect(stormSeasonMult(5)).toBeCloseTo(1.1);
    expect(stormSeasonMult(40)).toBeCloseTo(1 + STORM_SEASON_CAP);
    // both together: the order bonus caps at 25%, the curse stacks on top
    expect(orderBonus(0.9) * stormSeasonMult(40)).toBeCloseTo((1 + ORDER_BONUS_CAP) * 1.3);
  });
  it('awaySummary groups quiet seasons and lists events, up to 6 lines', () => {
    const e = [{ id: 'grey_spring', when: 'Spring 1891' }, { id: 'long_light', when: 'Summer 1891' }, { id: 'thaw_flood', when: 'Spring 1892', detail: '3.1K bd ft floated to the cove' }];
    expect(awaySummary(e)).toEqual(['2 quiet seasons', 'Thaw flood, Spring 1892: 3.1K bd ft floated to the cove']);
    const many = Array.from({ length: 10 }, (_, i) => ({ id: 'blizzard', when: `Winter ${1890 + i}` }));
    const out = awaySummary(many);
    expect(out).toHaveLength(6);
    expect(out[0]).toBe('5 earlier events');
    expect(out[5]).toBe('Blizzard, Winter 1899');
  });
});
