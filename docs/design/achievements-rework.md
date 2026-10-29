# Achievements rework

**Status: Built on `build/achievements` (owner decision 2026-10-28: "Rework achievements around the game's real milestones, so most need closing camp, the Sawmill and later outposts").** *Engineer, 2026-10-28. Source of truth: `packages/core/src/achievements.ts`; this page lists what is there.*

## In plain language (for the owner)

A playtester earned every achievement without ever closing camp, because most of the old list was big lifetime numbers (deliver a billion wood, fell 100,000 trees) that one very long first outpost can reach.

The new list has **63 achievements in three groups**:

- **First outpost (23).** What a normal first landing reaches: first tree, first crew, all four stages crewed, the full land office, Steam Camp and Diesel Road, a first Prime log and special order, the big crew milestones. A player who never closes camp can finish this group and nothing else, which is **37% of the list** (the cap was 40%).
- **Across outposts (27).** Every one needs at least one close camp: close camp 1 and 3 times, close an outpost faster than your first, reach Steam Camp within 15 minutes on a later outpost, Diesel Road in 3 outposts, the Sawmill (first mill run, logs sent to the mill, the full bunkhouse, top sawing), special orders, perks and curses over several outposts, and the bigger lifetime ladders.
- **Long haul (13).** Collections and the road to Landfall City: close camp 5 and 10 times, Into the Interior, every kind of tree, every weather card, every warehouse item, 3 fog lenses, 10 special orders, 5 mill runs, 200 Charter Shares, a hundred million wood and $100M in sales.

The Almanac screen now shows the whole list, grouped by these three, with a progress bar on each one that counts up. One you cannot earn yet says **"Close camp to unlock"** (or "Close camp 2 more times"). The Camp tab keeps its "Next goals" box (now only goals you can earn now) and gets an **All achievements** button.

**Rewards** keep the same cash and reputation structure, and the first outpost pays about what it did before, so the first landing keeps its pace. These pacing rules changed (the first outpost now has 23 achievements instead of about 35, and achievements met early now unlock at close camp):

1. A perk pick comes every **3** goals met (new achievements plus repeat bonuses), not every 5. With 5 the idle bot lost 2–3 perk picks and took about 70 minutes on its first outpost instead of 65.
2. One achievement pays **at most half the cost of the next push inland** right away (at the cove: half of Steam Camp). The board holds the rest and pays it when the outpost reaches its next era. Without this, achievements a long first outpost had already met (for example 30,000 trees) unlocked the moment camp closed and the next outpost bought Steam Camp in its first minute.
3. For the same reason the big ladders that moved to Across outposts pay less than before (30,000 trees $80,000, was $200,000; 60 lots $60,000, was $150,000; ten million wood $50,000; $5M in sales $60,000; ten winters $15,000), and the new close-camp goals pay mostly reputation and small cash.

The "crews' route" improvements that need a number of achievements were moved to match: Road lookout 16 (was 24), Grade rules 28 (was 36), Two-way radios 42 (was 46).

**Old saves** keep every achievement whose id is still in the list. Three old ones map to the closest new one (`c20` → `c5`, `crew50` → `crew30`, `w5` → `w1`; each old one implies the new one). The rest of the removed ones are dropped from the list; the cash and reputation they paid stay. New lifetime counters are filled in from what an old save still knows (its past-outposts list, warehouse finds, the current outpost).

## Rules the tests hold

- Every Across outposts and Long haul achievement has an explicit "closed camp at least N times" condition, or reads a number that only moves after a close camp (Charter Shares, mill runs, top sawing, the bunkhouse, logs sent to the mill, later Steam Camp, faster closes). `closesNeeded()` reports how many close camps it needs; the screen uses it for the hint.
- A company that never closes camp, with every other number as high as you like, earns exactly the 23 First outpost achievements (`achievements.test.ts`, `tests/smoke_achievements.js`).
- First outpost achievements need no close camp.

## New lifetime numbers (saved in `S.stats`, kept through close camp)

| Metric | What it counts | Old saves start from |
| --- | --- | --- |
| `closes` | Outposts closed (outpost number − 1) | the outpost number |
| `shares` | Charter Shares earned in all (Logging) | `S.meta.total` |
| `slots` | Land office slots open | existing |
| `afkLots` | AFK lots bought | 1 if one is held, else 0 |
| `prime` | Prime logs made (not the founding crate) | Prime found minus the crate |
| `spOrders` | Special orders filled | `S.orders.filled` |
| `maxOrders` | Most charter orders running at once | orders running now |
| `species` | Kinds of tree felled (`S.stats.sp`) | pine and hemlock (the Cove woodlot), plus lots partly cut |
| `perks`, `curses` | Perks picked (Logging and Sawmill), curse perks picked | perks in the past-outposts list; curses this outpost |
| `millRuns` | Mill runs closed | the mill run number |
| `sawTop` | Top results in Saw boards | 0 |
| `bunk` | Bunkhouse level | existing |
| `toMill` | Wood sent to the Sawmill | this outpost's |
| `steamLater` | Fastest Steam Camp (minutes) on an outpost after the first | past outposts |
| `firstMin`, `beatFirst` | The first outpost's length; outposts closed faster than it | past outposts |
| `dieselRuns` | Outposts that reached Diesel Road | past outposts and this one |
| `fogLens`, `items` | Fog lenses found; kinds of warehouse item found | warehouse finds |

`S.achHeld` (company-wide, kept through close camp) is reward cash the board is holding until the next era.

## Every achievement

"Close camps needed" is what the screen's hint counts down. Ladder achievements pay a repeat bonus (25% of the cash, capped per outpost) when one outpost's own numbers reach the target again.

### First outpost (23)

| id | Name | Description | Condition | Cash | Rep | Ladder | Close camps needed |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `first_tree` | Timber! | Fell your first tree. | felled >= 1 | $10 | — |  | — |
| `first_sale` | First load | Deliver logs to the cove. | deliv > 0 | $15 | — |  | — |
| `first_crew` | On the payroll | Hire your first crew. | crew >= 1 | $25 | — |  | — |
| `w1` | Wintered over | Work through a winter. | winters >= 1 | $250 | — | yes | — |
| `full_chain` | Every stage crewed | Have a crew working all four stages. | crewedStages >= 4 | $100 | 1 |  | — |
| `c5` | Reliable supplier | Fill 5 charter orders. | contracts >= 5 | $1,750 | 1 | yes | — |
| `crew30` | Big outfit | Own 30 crews or machines. | crew >= 30 | $4,400 | 1 | yes | — |
| `d50k` | Fifty thousand wood | Deliver 50,000 wood. | deliv >= 50000 | $950 | 1 | yes | — |
| `prime1` | Stamped Prime | Make your first Prime log. | prime >= 1 | $100 | — |  | — |
| `slot4` | Full land office | Open all four land office slots. | slots >= 4 | $1,050 | 1 |  | — |
| `tr10` | Ten lots | Finish 10 lots. | tracts >= 10 | $2,800 | 1 | yes | — |
| `era1` | Full steam | Reach Steam Camp. | era >= 1 | — | 2 |  | — |
| `t1k` | Thousand trees | Fell 1,000 trees. | felled >= 1000 | $12,700 | 1 | yes | — |
| `crew75` | Industrial outfit | Own 75 crews or machines. | crew >= 75 | $100,000 | 2 | yes | — |
| `crew120` | Company of the Reach | Own 120 crews or machines. | crew >= 120 | $500,000 | 2 | yes | — |
| `d1m` | A million wood | Deliver 1,000,000 wood. | deliv >= 1e6 | $7,800 | 2 | yes | — |
| `d3m` | Three million wood | Deliver 3 million wood. | deliv >= 3e6 | $33,500 | 1 | yes | — |
| `e1m` | Millionaire charter | Earn $1M in sales. | earned >= 1e6 | $33,000 | 1 | yes | — |
| `tr30` | Thirty lots | Finish 30 lots. | tracts >= 30 | $63,000 | 2 | yes | — |
| `t10k` | Ten thousand trees | Fell 10,000 trees. | felled >= 10000 | $40,000 | 1 | yes | — |
| `sp1` | Special delivery | Fill a special order from the charter board. | spOrders >= 1 | $1,000 | 1 |  | — |
| `allround` | All-around logger | Get a clean run in every mini-game. | perfFell >= 1 and perfBuck >= 1 and cleanSkid >= 1 and cleanHaul >= 1 | $1,500 | 2 |  | — |
| `era2` | Diesel Road | Reach Diesel Road. | era >= 2 | — | 2 |  | — |

Total: $803,950 cash, 25 reputation.

### Across outposts (27)

| id | Name | Description | Condition | Cash | Rep | Ladder | Close camps needed |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `close1` | Loaded the ship | Close camp for the first time. | closes >= 1 | $250 | 1 |  | 1 |
| `close3` | Third charter | Close camp 3 times. | closes >= 3 | $2,000 | 2 |  | 3 |
| `beatfirst` | Old hands | Close an outpost faster than your first. | beatFirst >= 1 | $1,000 | 2 |  | 1 |
| `quicksteam` | Quick steam | On a later outpost, reach Steam Camp within 15 minutes. | steamLater <= 15 | $1,000 | 1 |  | 1 |
| `diesel3` | Diesel veteran | Reach Diesel Road in 3 outposts. | dieselRuns >= 3 and closes >= 2 | $10,000 | 2 |  | 2 |
| `shares50` | Board favorite | Earn 50 Charter Shares in all. | shares >= 50 | $500 | 1 |  | 1 |
| `mill1` | Saw it here | Close your first mill run. | millRuns >= 1 | $750 | 1 |  | 1 |
| `tomill` | Logs for the mill | Send 100,000 wood to the Sawmill. | toMill >= 1e5 | $750 | 1 |  | 1 |
| `bunk3` | Full bunkhouse | Build the bunkhouse to level 3. | bunk >= 3 | $2,000 | 2 |  | 1 |
| `sawtop` | Top sawyer | Get top sawing in Saw boards. | sawTop >= 1 | $400 | 1 |  | 1 |
| `sp3` | Charter regular | Fill 3 special orders. | spOrders >= 3 and closes >= 1 | $1,500 | 2 |  | 1 |
| `orders3` | Busy clerks | Run 3 charter orders at once. | maxOrders >= 3 and closes >= 1 | $750 | 1 |  | 1 |
| `afk3` | Away on business | Buy 3 AFK lots. | afkLots >= 3 and closes >= 1 | $750 | 1 |  | 1 |
| `perks30` | Seasoned charter | Pick 30 perks. | perks >= 30 and closes >= 1 | $1,000 | 1 |  | 1 |
| `curse3` | Cursed but rich | Take 3 curse perks. | curses >= 3 and closes >= 1 | $750 | 1 |  | 1 |
| `t30k` | Thirty thousand trees | Fell 30,000 trees. | felled >= 30000 and closes >= 1 | $80,000 | 1 | yes | 1 |
| `d10m` | Ten million wood | Deliver 10 million wood. | deliv >= 1e7 and closes >= 1 | $50,000 | 3 | yes | 1 |
| `e5m` | Five million in sales | Earn $5M in sales. | earned >= 5e6 and closes >= 1 | $60,000 | 1 | yes | 1 |
| `tr45` | Forty-five lots | Finish 45 lots. | tracts >= 45 and closes >= 1 | $20,000 | 1 | yes | 1 |
| `tr60` | Sixty lots | Finish 60 lots. | tracts >= 60 and closes >= 1 | $60,000 | 2 | yes | 1 |
| `c50` | Steady supplier | Fill 50 charter orders. | contracts >= 50 and closes >= 1 | $25,000 | 1 | yes | 1 |
| `w10` | Ten winters | Work through ten winters. | winters >= 10 and closes >= 1 | $15,000 | 1 | yes | 1 |
| `wx10` | Ten storms | Ride out 10 bad-weather seasons to the end. | storms >= 10 and closes >= 1 | $900 | 1 | yes | 1 |
| `pf25` | Faller of note | Land 25 perfect falls. | perfFell >= 25 and closes >= 1 | $600 | 1 | yes | 1 |
| `pb25` | Grader’s favorite | Cut 25 trunks for full value. | perfBuck >= 25 and closes >= 1 | $600 | 1 | yes | 1 |
| `cs25` | Teamster | Make 25 clean skids. | cleanSkid >= 25 and closes >= 1 | $600 | 1 | yes | 1 |
| `ch25` | Road boss | Make 25 clean hauls. | cleanHaul >= 25 and closes >= 1 | $600 | 1 | yes | 1 |

Total: $336,700 cash, 35 reputation.

### Long haul (13)

| id | Name | Description | Condition | Cash | Rep | Ladder | Close camps needed |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `close5` | Five outposts | Close camp 5 times. | closes >= 5 | $5,000 | 2 |  | 5 |
| `close10` | Ten outposts | Close camp 10 times. | closes >= 10 | $20,000 | 3 |  | 10 |
| `era3` | Into the Interior | Reach Into the Interior. | era >= 3 and closes >= 1 | — | 3 |  | 1 |
| `shares200` | Charter partner | Earn 200 Charter Shares in all. | shares >= 200 | $10,000 | 2 |  | 1 |
| `mill5` | Mill master | Close 5 mill runs. | millRuns >= 5 | $5,000 | 2 |  | 1 |
| `alltrees` | Every tree on the coast | Fell all six kinds of tree, redwood too. | species >= 6 and closes >= 1 | $5,000 | 2 |  | 1 |
| `wxall` | Every season’s card | See every weather card in the Almanac. | almanac >= 16 and closes >= 1 | $1,500 | 2 |  | 1 |
| `fog3` | Fog collector | Find 3 fog lenses. | fogLens >= 3 and closes >= 1 | $3,000 | 1 |  | 1 |
| `items` | Full warehouse | Find every kind of item in the warehouse. | items >= 8 and closes >= 1 | $5,000 | 2 |  | 1 |
| `sp10` | Charter house | Fill 10 special orders. | spOrders >= 10 and closes >= 1 | $5,000 | 2 |  | 1 |
| `c100` | Company supplier | Fill 100 charter orders. | contracts >= 100 and closes >= 1 | $150,000 | 2 | yes | 1 |
| `d100m` | A hundred million | Deliver 100 million wood. | deliv >= 1e8 and closes >= 3 | $900,000 | 3 | yes | 3 |
| `e100m` | Founders of Landfall | Earn $100M in sales. | earned >= 1e8 and closes >= 3 | $2,000,000 | 2 | yes | 3 |

Total: $3,109,500 cash, 28 reputation.

## What happened to the old list (58)

| Old id | Now |
| --- | --- |
| `first_tree`, `first_sale`, `first_crew`, `w1`, `c5`, `crew30`, `d50k`, `tr10`, `t1k`, `crew75`, `crew120`, `d1m`, `d3m`, `e1m`, `tr30`, `t10k`, `allround`, `era1`, `era2` | Kept (First outpost). `full_chain` kept, renamed "Every stage crewed" (the Sawmill made "Stump to mill" confusing). |
| `t30k`, `d10m`, `e5m`, `tr60`, `w10`, `wx10` | Kept, now Across outposts (need one close camp) |
| `wxall`, `era3`, `d100m`, `e100m` | Kept, now Long haul (need close camps) |
| `c20`, `crew50`, `w5` | Mapped to `c5`, `crew30`, `w1` in old saves |
| `d10k`, `e10k` | Folded into `d50k` (cash added) |
| `d250k` | Folded into `d1m` |
| `d2m`, `w5` | Folded into `d3m` |
| `e100k` | Folded into `e1m` |
| `t100`, `t3k` | Folded into `t1k` |
| `tr3`, `hire1` | Folded into `tr10` and `slot4` |
| `c1` | Folded into `c5` |
| `c10`, `c20` | Folded into `tr30` |
| `crew10`, `crew50` | Folded into `crew30`, `crew75` |
| `pf1`, `pb1`, `cs1`, `ch1` | Covered by `allround` |
| `pf10`, `pb10`, `cs10`, `ch10` | Replaced by the 25-run ladders (`pf25`, `pb25`, `cs25`, `ch25`) |
| `d30m`, `d300m`, `d1b`, `e25m`, `t100k` | Dropped (grind-only numbers; `d100m` and `e100m` remain) |

"Folded" means the old reward's cash went into the kept one, so a first outpost earns about the same money at about the same times.

## Screen

- Almanac screen (sidebar "Almanac · Achievements and weather"): an **Achievements** panel above the weather cards. Three groups with "N of M" counts. Each row: name, reward, one line, and a progress bar when there is something to count. Done ones get a green **Done** chip. Ones that need more close camps get a grey chip, "Close camp to unlock" or "Close camp 2 more times", and no bar.
- Camp tab, "Next goals": only goals that can be earned now, plus an **All achievements** button.
- Toasts and the camp log show what was paid now and what the board holds until the next era.

## Simulation (engineer's run, 2026-10-28; balance agent to confirm)

`npm run sim` (8 hours, gas policy, seeds 1–3). Means over seeds. "Gap" is the longest stretch with no new achievement, improvement, era, lot slot, structure or Almanac card (target under 20 minutes).

| Profile | Longest gap per seed, before → after | Achievements earned, run 1 / run 2 / run 3, before → after | Run length (min), before → after |
| --- | --- | --- | --- |
| idle | 14.9, 11.8, 16.4 → 8.8, 15.8, 16.5 | 34 / 2.3 / 2 → 21.3 / 7 / 9.3 | 65 / 48 / 34 → 61 / 44 / 41 |
| casual | 29.2, 16.2, 17.2 → 10.8, 10.0, 11.1 | 36.3 / 3.3 / 1.7 → 20.7 / 8.3 / 8.7 | 53 / 36 / 38 → 54 / 41 / 29 |
| minigame | 8.7, 8.9, 17.3 → 13.9, 11.9, 9.7 | 34.7 / 6.3 / 2.7 → 20.7 / 9.7 / 8.3 | 38 / 38 / 29 → 35 / 33 / 25 |
| idle-away | 60, 60, 60 → 42.5, 52.1, 42.3 | 33.7 / 5 / 0.7 → 21 / 11 / 7.3 | 121 / 86 / 121 → 111 / 67 / 66 |

idle-away's gap is its 40-minute away stretches (nothing can unlock while the bot is away); it shortened.

Against `tests/balance/baseline.json`: perk picks and Charter Shares stay inside tolerance for every profile and run. 21 of 72 timing numbers move outside it, mostly later outposts getting faster (casual and minigame runs 2–3, idle-away runs 2–3), idle run 3 slower, and Steam Camp in run 1 a few minutes sooner. Run 2 vs run 1: idle 28% faster, casual 24%, minigame 6% (it was 1% before), idle-away 40%. The baseline was not re-recorded.
