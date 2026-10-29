# Rising wages and the wage cap — tuning notes

Owner decision 2026-10-28: each extra crew of the same type is paid more than the last, with a cap so the
wages never pass a set share of income. Balance agent notes; interim numbers are kept here so a container
restart does not lose them.

## Formula (packages/core/src/formulas.ts)

- The nth crew of one type earns `up × (1 + k·(n−1))` a minute (k = `WAGE_STEP`).
- The wage bill is `max(base, min(rising, cap × income))` where base is every crew at its first-crew wage,
  income is a 2-minute average of sales (`S.payEma`) and cap = `WAGE_CAP_SHARE`. Base wages are always
  paid, so a camp with no income pays what it did before, and the payroll guard / company advance are unchanged.

## Method

`WAGE_STEP=<k> WAGE_CAP=<share> node sim/sim_rogue.js 8 gas <profile> <seed>` (knobs added to the harness),
profiles idle, casual, minigame, idle-away, 3 consecutive runs each. k = 0 is the game before rising wages.
`WAGE_H=<min>` (harness only) makes the bot count that many minutes of a crew's wage rise as part of its price,
like a player reading the hire row; with k = 0 it changes nothing.

## Interim results

### Sweep 1 — step k, cap 60%, seeds 1–3 (run minutes run1/run2/run3, mean)

| k | idle | casual | minigame | idle-away | run-2 faster (idle/casual/mg/away) | wages % of income (idle/casual/mg/away) | cap on, min (away) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 (before) | 65/48/34 | 53/36/38 | 38/38/29 | 121/86/121 | 26/31/0/29% | 9/8/4/34 | 0 |
| 0.05 | 68/48/41 | 51/38/39 | 37/30/33 | 130/91/86 | 29/26/16/30% | 10/8/4/42 | 54 |
| 0.10 | 66/49/38 | 55/43/31 | 37/30/29 | 121/101/103 | 24/21/19/17% | 12/9/5/33 | 43 |
| 0.20 | 65/49/51 | 50/37/35 | 34/31/26 | (not run) | 25/27/6/– | 13/11/5/– | – |

No unfinished runs, no stalls (zero-income-with-stock max 5 min, same as before), no company advances, no
time short of wages in any config. Wages are only 4–13% of income for the playing profiles, so the rise
moves run times by less than the seed noise at k ≤ 0.1. The cap only matters for idle-away (away for long
stretches, wages a third of income): it is on 40–55 min of the 8 hours there. k = 0.2 starts to show (idle
run 3 34 → 51 min, gap 16 → 25 min).
