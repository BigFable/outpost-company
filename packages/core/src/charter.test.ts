import { describe, expect, it } from 'vitest';
import { META, PERKS } from './content';
import { missedOrderFine, ORDER_CAP_MAX, orderCapacity, OVERBOOK_FINE_PER_BF, splitDelivery, splitOrder, type SplitOrder } from './charter';
import { missedPenalty } from './formulas';
import { draftPool } from './generators';

const share = (m: Record<string, number>) => (sp: string) => m[sp] ?? 0;

describe('orderCapacity', () => {
  it('is 1 by default and adds board nodes and perks', () => {
    expect(orderCapacity()).toBe(1);
    expect(orderCapacity({ clerks: true })).toBe(2);
    expect(orderCapacity({ clerks: true, office: true })).toBe(3);
    expect(orderCapacity({ clerks: true, office: true, clerkPerk: true })).toBe(4);
    expect(orderCapacity({ overbook: true })).toBe(3);
    expect(orderCapacity({ clerks: true, office: true, clerkPerk: true, overbook: true })).toBe(ORDER_CAP_MAX);
  });
});

describe('splitDelivery', () => {
  it('matches the single-contract rule with one order', () => {
    expect(splitDelivery(100, [{ need: 500, end: 9, prem: 0.2 }], share({})).into).toEqual([100]);
    expect(splitDelivery(100, [{ need: 30, end: 9, prem: 0.2 }], share({})).into).toEqual([30]);
    const amt = 137.3, sh = 0.37;
    expect(splitDelivery(amt, [{ sp: 'spruce', need: 1e6, end: 9, prem: 0.4 }], share({ spruce: sh })).into[0]).toBe(Math.min(amt * sh, 1e6));
  });
  it('fills tree orders first, then the soonest deadline', () => {
    const orders: SplitOrder[] = [
      { need: 1000, end: 50, prem: 0.2 },
      { need: 1000, end: 10, prem: 0.2 },
      { sp: 'spruce', need: 1000, end: 99, prem: 0.4 },
    ];
    expect(splitOrder(orders)).toEqual([2, 1, 0]);
    const r = splitDelivery(100, orders, share({ spruce: 0.6 }));
    expect(r.into[2]).toBeCloseTo(60, 12);
    expect(r.into[1]).toBeCloseTo(40, 12);
    expect(r.into[0]).toBe(0);
    expect(r.paid).toEqual(r.into);
  });
  it('passes the rest on once an order is full, and never credits more than the load', () => {
    const r = splitDelivery(100, [{ need: 30, end: 1, prem: 0.2 }, { need: 500, end: 2, prem: 0.2 }], share({}));
    expect(r.into).toEqual([30, 70]);
    const two = splitDelivery(100, [{ sp: 'pine', need: 500, end: 1, prem: 0.3 }, { sp: 'pine', need: 500, end: 2, prem: 0.3 }], share({ pine: 0.5 }));
    expect(two.into).toEqual([50, 0]);
    const sum = splitDelivery(100, [{ sp: 'pine', need: 500, end: 1, prem: 0.3 }, { sp: 'oak', need: 500, end: 2, prem: 0.3 }, { need: 500, end: 3, prem: 0.3 }], share({ pine: 0.5, oak: 0.5 }));
    expect(sum.into.reduce((a, b) => a + b, 0)).toBeCloseTo(100, 12);
  });
  it('Rush clerk: same-kind orders fill from the same logs, each log pays one bonus', () => {
    const orders: SplitOrder[] = [{ sp: 'pine', need: 500, end: 1, prem: 0.3 }, { sp: 'pine', need: 20, end: 2, prem: 0.5 }, { need: 500, end: 3, prem: 0.2 }];
    const r = splitDelivery(100, orders, share({ pine: 0.5 }), true);
    expect(r.into).toEqual([50, 20, 50]);
    expect(r.paid).toEqual([30, 20, 50]); // the 0.5 order pays on its 20, the 0.3 order on the other 30
    const reg = splitDelivery(100, [{ need: 500, end: 1, prem: 0.2 }, { need: 500, end: 2, prem: 0.2 }], share({}), true);
    expect(reg.into).toEqual([100, 100]);
    expect(reg.paid.reduce((a, b) => a + b, 0)).toBe(100);
  });
  it('handles empty loads and no orders', () => {
    expect(splitDelivery(0, [{ need: 5, end: 1, prem: 0.1 }], share({})).into).toEqual([0]);
    expect(splitDelivery(10, [], share({})).into).toEqual([]);
  });
});

describe('missedOrderFine', () => {
  it('matches missedPenalty without Overbooked', () => {
    for (const [pen, done, vol, hs, sp] of [[400, 100, 1000, false, false], [400, 0, 1000, true, false], [0, 50, 900, false, true]] as const)
      expect(missedOrderFine({ penalty: pen, done, vol, ...(sp ? { sp: 'pine' as const } : {}) }, hs, false)).toBe(missedPenalty(pen, done, vol, hs, sp));
  });
  it('Overbooked: a missed tree order costs a small fine; Handshake deals still clear it', () => {
    expect(missedOrderFine({ penalty: 0, done: 1000, vol: 3000, sp: 'pine' }, false, true)).toBe(Math.round(2000 * OVERBOOK_FINE_PER_BF));
    expect(missedOrderFine({ penalty: 0, done: 1000, vol: 3000, sp: 'pine' }, true, true)).toBe(0);
  });
});

describe('content: order perks and board nodes', () => {
  it('adds two board tiers, the second needing the first', () => {
    const a = META.find((m) => m.id === 'clerks'), b = META.find((m) => m.id === 'office');
    expect(a && !a.req).toBe(true);
    expect(b?.req).toBe('clerks');
    expect((b?.cost ?? 0) > (a?.cost ?? 0)).toBe(true);
  });
  it('Rush clerk is offered only with room for two orders', () => {
    expect(PERKS.find((p) => p.id === 'rush')?.cap).toBe(2);
    expect(draftPool([], false).some((p) => p.id === 'rush')).toBe(false);
    expect(draftPool([], false, 2).some((p) => p.id === 'rush')).toBe(true);
    expect(draftPool([], false).some((p) => p.id === 'clerk')).toBe(true);
    expect(draftPool(['clerk'], false).some((p) => p.id === 'clerk')).toBe(false);
  });
});
