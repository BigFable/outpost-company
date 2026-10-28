/**
 * Several active charter orders at once (2026-10-26). Pure rules, no draws.
 *
 * Capacity: 1, +1 for the Second clerk board node, +1 for Charter office, +1 for the Extra clerk perk,
 * +2 for the Overbooked curse.
 *
 * The delivery split (`splitDelivery`): each load fills tree orders first, each from its own species'
 * share of the load, soonest deadline first; what is left fills regular orders, soonest deadline first.
 * Every log fills at most one order and pays at most one bonus. With the Rush clerk perk, orders of the
 * same kind (the same species, or any-wood orders) fill from the same logs; each log still pays one
 * bonus, the highest among the orders it filled.
 */
import type { SpeciesId } from './content';

/** Most active charter orders a run can reach (1 + 2 board nodes + Extra clerk + Overbooked). */
export const ORDER_CAP_MAX = 6;
/** Overbooked curse: a missed tree order costs this much cash per board foot left undelivered. */
export const OVERBOOK_FINE_PER_BF = 0.02;

export interface OrderCapOpts { clerks?: boolean; office?: boolean; clerkPerk?: boolean; overbook?: boolean }

/** Active charter orders allowed at once. */
export function orderCapacity(o: OrderCapOpts = {}): number {
  return Math.min(ORDER_CAP_MAX, 1 + (o.clerks ? 1 : 0) + (o.office ? 1 : 0) + (o.clerkPerk ? 1 : 0) + (o.overbook ? 2 : 0));
}

/** One active order as the split reads it: its species (none = any wood), what it still needs, its deadline and bonus. */
export interface SplitOrder { sp?: SpeciesId; need: number; end: number; prem: number }
export interface SplitResult {
  /** Board feet credited to each order, in the input order. */
  into: number[];
  /** Board feet on which each order pays its bonus (equals `into` unless Rush clerk shares logs). */
  paid: number[];
}

/** The fill order: tree orders before regular ones, then soonest deadline, then signing order. */
export function splitOrder(orders: readonly SplitOrder[]): number[] {
  return orders.map((_, i) => i).sort((a, b) => {
    const A = orders[a] as SplitOrder, B = orders[b] as SplitOrder;
    return (A.sp ? 0 : 1) - (B.sp ? 0 : 1) || A.end - B.end || a - b;
  });
}

/**
 * Split `amt` board feet of one delivery between active orders. `share(sp)` is that species' share of the
 * logs crews cut now (0..1). With one order this matches the old single-contract rule exactly:
 * a tree order takes min(amt × share, need), a regular order min(amt, need).
 */
export function splitDelivery(amt: number, orders: readonly SplitOrder[], share: (sp: SpeciesId) => number, rush = false): SplitResult {
  const into = orders.map(() => 0), paid = orders.map(() => 0);
  if (!(amt > 0)) return { into, paid };
  let left = amt;
  const spLeft = new Map<SpeciesId, number>();
  const pool = (sp: SpeciesId) => { if (!spLeft.has(sp)) spLeft.set(sp, amt * share(sp)); return spLeft.get(sp) as number; };
  const idx = splitOrder(orders);
  if (!rush) {
    for (const i of idx) {
      const o = orders[i] as SplitOrder, need = Math.max(0, o.need);
      const x = o.sp ? Math.min(pool(o.sp), need, left) : Math.min(left, need);
      if (o.sp) spLeft.set(o.sp, pool(o.sp) - x);
      left -= x; into[i] = x; paid[i] = x;
    }
    return { into, paid };
  }
  // Rush clerk: one group per kind, in fill order of each group's first order; each group draws from what is left
  const groups: number[][] = [], key = (o: SplitOrder) => o.sp || '';
  for (const i of idx) { const k = key(orders[i] as SplitOrder), g = groups.find((x) => key(orders[x[0] as number] as SplitOrder) === k); if (g) g.push(i); else groups.push([i]); }
  for (const g of groups) {
    const sp = (orders[g[0] as number] as SplitOrder).sp, avail = sp ? Math.min(pool(sp), left) : left;
    let used = 0;
    for (const i of g) { const x = Math.min(avail, Math.max(0, (orders[i] as SplitOrder).need)); into[i] = x; used = Math.max(used, x); }
    // each log pays one bonus: the highest bonus among the orders it filled
    let covered = 0;
    for (const i of g.slice().sort((a, b) => (orders[b] as SplitOrder).prem - (orders[a] as SplitOrder).prem || a - b)) {
      const extra = Math.max(0, (into[i] as number) - covered); paid[i] = extra; covered = Math.max(covered, into[i] as number);
    }
    if (sp) spLeft.set(sp, pool(sp) - used);
    left -= used;
  }
  return { into, paid };
}

/** Fine for a missed order: regular orders scale their fine by what is left; tree orders are free unless Overbooked. */
export function missedOrderFine(o: { penalty: number; done: number; vol: number; sp?: SpeciesId }, handshake: boolean, overbook: boolean): number {
  if (handshake) return 0;
  if (o.sp) return overbook ? Math.round(Math.max(0, o.vol - o.done) * OVERBOOK_FINE_PER_BF) : 0;
  return Math.round(o.penalty * (1 - o.done / o.vol));
}
