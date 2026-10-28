import { describe, expect, it } from 'vitest';
import { ADVANCE_REPAY_SHARE, STALL_SEC, advanceRepay, blockedCrews, cheapestCrew, stallRescue } from './stall';

const base = { cash: 0, sinceSale: STALL_SEC, own: { axeman: 1, bucker: 1, sled: 1 }, era: 0, trees: 30, stems: 0, cut: 5000 };

describe('the zero-income stall detector', () => {
  it('fires on logs piled up with no skid crew, no sales for the stall time and no cash', () => {
    expect(stallRescue(base)).toEqual({ crews: [{ id: 'oxen', stage: 'skid', cost: 90 }], cost: 90 });
  });
  it('waits for the stall time', () => {
    expect(stallRescue({ ...base, sinceSale: STALL_SEC - 1 })).toBeNull();
  });
  it('does not fire when cash can buy the missing crew', () => {
    expect(stallRescue({ ...base, cash: 90 })).toBeNull();
    expect(stallRescue({ ...base, cash: 89.9 })).not.toBeNull();
  });
  it('does not fire when every crew up to the landing is there', () => {
    expect(stallRescue({ ...base, own: { ...base.own, oxen: 1 } })).toBeNull();
  });
  it('does not fire with nothing to work (out of timber is the hire job rescue)', () => {
    expect(stallRescue({ ...base, trees: 0, stems: 0, cut: 0 })).toBeNull();
  });
  it('never fires before the first crew is hired: the opening is worked by hand', () => {
    expect(stallRescue({ ...base, own: {} })).toBeNull();
    expect(stallRescue({ ...base, own: { oxen: 0 } })).toBeNull();
  });
  it('ignores hauling: a local buyer carts logs off the landing', () => {
    expect(stallRescue({ ...base, own: { axeman: 1, bucker: 1, oxen: 1 } })).toBeNull();
  });
  it('advances every missing crew between the furthest-along pile and the landing', () => {
    const r = stallRescue({ ...base, own: { sled: 1 }, cut: 0, stems: 0 });
    expect(r?.crews.map((c) => c.id)).toEqual(['axeman', 'bucker', 'oxen']);
    expect(r?.cost).toBe(40 + 60 + 90);
    // logs in the cut pile: only skidding is needed to sell them
    expect(stallRescue({ ...base, own: { sled: 1 } })?.crews.map((c) => c.id)).toEqual(['oxen']);
    // felled trees: bucking and skidding
    expect(stallRescue({ ...base, own: { axeman: 1 }, cut: 0, stems: 100 })?.crews.map((c) => c.id)).toEqual(['bucker', 'oxen']);
  });
  it('prices the crew like the shop: hire factor and the per-unit curve, era-gated', () => {
    expect(cheapestCrew('skid', 0, {}, 0.8)).toEqual({ id: 'oxen', stage: 'skid', cost: 72 });
    expect(cheapestCrew('skid', 0, { oxen: 1 })?.cost).toBe(Math.ceil(90 * 1.15));
    expect(blockedCrews({ ...base, era: 2 })?.crews[0]?.id).toBe('oxen');
  });
});

describe('repaying an advance', () => {
  it('takes half of each sale until the advance is paid', () => {
    expect(advanceRepay(100, 90)).toBe(100 * ADVANCE_REPAY_SHARE);
    expect(advanceRepay(100, 20)).toBe(20);
    expect(advanceRepay(100, 0)).toBe(0);
    expect(advanceRepay(0, 90)).toBe(0);
    expect(advanceRepay(-5, 90)).toBe(0);
  });
});
