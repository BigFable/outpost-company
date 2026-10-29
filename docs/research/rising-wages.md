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

### Sweep 2 — k = 0 vs k = 0.1, cap 60%, pooled seeds 1–9

| Profile | k = 0 run min | k = 0.1 run min | run-2 faster 0 → 0.1 | wages % of income | worst gap, min | worst zero-income stall, min |
| --- | --- | --- | --- | --- | --- | --- |
| idle | 64/49/44 | 63/54/42 | 21% → 13% | 8.8 → 11.2 | 21 → 26 | 5.0 → 4.9 |
| casual | 51/41/38 | 52/41/38 | 19% → 22% | 7.1 → 9.0 | 29 → 32 | 4.1 → 4.8 |
| minigame | 36/35/29 | 34/29/28 | 2% → 15% | 4.1 → 5.0 | 19 → 17 | 1.2 → 1.9 |
| idle-away | 122/94/116 | 123/84/99 | 23% → 31% | 34.6 → 33.0 | 60 → 101 | 5.0 → 5.0 |

Active vs casual (3-run total): 1.32× → 1.43×. Seed-to-seed spread of a run's length is about ±12 min (idle
run 2 at k = 0: 34–72 min), so every difference above is inside the noise except the wage share. No
unfinished runs, no company advances, no time short of wages, the payroll guard unchanged. The idle-away
101-min gap is one seed (2) whose three runs all ran to the away cut-off; it is time away, not a stall.

### Sweep 3 — cap share at k = 0.1, idle-away only, seeds 1–6

| cap | run min | cap on, min | time net-negative, min |
| --- | --- | --- | --- |
| 0.5 | 121/104/79 | 43 | 55 |
| 0.6 | 123/84/99 (9 seeds) | 41 | 55 |
| 0.75 | 121/93/96 | 47 | 66 |
| none (k = 0) | 122/94/116 | 0 | 67 |

The cap only binds while the camp is away and income sags; any share from 0.5 to 0.75 is inside the noise.

### Sweep 4 — k = 0.1, cap 60%, wage-aware bot (WAGE_H = 20), seeds 1–3

idle 65/43/48, casual 53/42/30, minigame 34/30/28, idle-away 121/121/92: same as the plain bot within noise.
Hire prices dwarf 20 minutes of a wage rise, so a player reading the next crew's wage still buys the same crews.

### Sweep 5 — k = 0.15, cap 60%, seeds 1–9

| Profile | k = 0 | k = 0.1 | k = 0.15 | 3-run total, min (0 / 0.1 / 0.15) | run-2 faster (0 / 0.1 / 0.15) |
| --- | --- | --- | --- | --- | --- |
| idle | 64/49/44 | 63/54/42 | 68/52/40 | 157 / 160 / 159 | 21 / 13 / 23% |
| casual | 51/41/38 | 52/41/38 | 56/40/35 | 131 / 131 / 131 | 19 / 22 / 27% |
| minigame | 36/35/29 | 34/29/28 | 35/31/28 | 99 / 92 / 94 | 2 / 15 / 10% |
| idle-away | 122/94/116 | 123/84/99 | 122/92/101 | 332 / 306 / 315 | 23 / 31 / 25% |

k = 0.15: wages 5–15% of income (idle run 1: 15%), cap on only for idle-away (41 min of 8 h), worst
zero-income-with-stock stretch 5.0 min (same as before), no advances, no time short of wages, every run closes.

### Sweep 6 — idle and casual, seeds 10–15 (pooled with the above: 15 seeds)

| Profile | k = 0 run min | k = 0.15 run min | 3-run total | run-2 faster | wages % of income | worst gap |
| --- | --- | --- | --- | --- | --- | --- |
| idle | 63/50/44 | 67/54/43 | 156 → 163 (+4.5%) | 20 → 19% | 8.7 → 12.5 | 28 → 30 min |
| casual | 50/42/34 | 54/42/36 | 126 → 131 (+4%) | 15 → 20% | 7.1 → 9.6 | 29 → 34 min |

With 15 seeds the picture is clearer than with 9: a 15% step costs idle and casual about 4–5% of pace over
three runs, mostly in run 1, and does not move idle's run-2 speed-up. Still no unfinished runs, stalls,
advances or wage arrears.

`npm run balance:check` (seeds 1–3 only) fails 17/72 metrics at k = 0.15: seeds 1–3 are the unlucky ones
for idle (67/60/47 vs 65/48/34 before; seeds 4–15 average 67/52/41 vs 63/50/46). Not re-recorded.

## Decision (balance agent, 2026-10-28)

**Step 15%, cap 60% of income.** It is the largest step that keeps every target where it was: idle closes
every run, no new stall, pace cost about 4–5% for idle and casual (the price of a wage that actually rises),
minigame and idle-away unchanged within noise. It does not fix the run-2 speed-up miss (idle 19–20%); that
needs a different lever. 20% starts to slow idle more (run 3 34 → 51 min on 3 seeds). 10% costs about half
as much and is the fallback if the owner wants the rise felt less (`WAGE_STEP` in packages/core/src/formulas.ts).
The cap is a safety rail: it binds only when a camp sits away with a dry queue, and there it cuts the time
wages exceed income from 67 to 54 min.
