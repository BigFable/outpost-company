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

(filled in as sweeps finish)
