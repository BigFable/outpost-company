import { describe, expect, it } from 'vitest';
import { clamp, splitTicks } from './index';

describe('clamp', () => {
  it('keeps values inside the range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });
  it('rejects an inverted range', () => {
    expect(() => clamp(1, 2, 0)).toThrow(RangeError);
  });
});

describe('splitTicks', () => {
  it('splits elapsed time into whole ticks and a remainder', () => {
    expect(splitTicks(1050, 100)).toEqual({ ticks: 10, remainderMs: 50 });
  });
  it('ignores negative elapsed time (clock rollback)', () => {
    expect(splitTicks(-500, 100)).toEqual({ ticks: 0, remainderMs: 0 });
  });
});
