# The perk shop (the Quartermaster)

**Status: Proposal for the owner.** *Balance agent, 2026-10-28. Design and simulation only; no game code changed. All numbers are starting values.*

## For the owner, in plain words

The perk draft ("pick one of three cards") becomes a small **shop tent at each camp, the Quartermaster**. It always shows **5 perks for sale**: three of any rarity, one that is always rare or legendary, and one curse. Stock **rotates every 10 minutes** (one in-game year) and whenever you push inland. You can **hold** one perk through a rotation.

You pay with **perk picks**: the "Perk ready" count the game already gives you, now a number you can save and spend. A common or rare perk costs **1 pick**, a legendary costs **2**, and a curse is **free**. Picks come from exactly the places draft cards come from today: playing mini-games (the same growing meter), reaching a new era, five goals met, five orders filled. So there is **no new currency** and nothing new to learn about where perks come from. Picks, stock and perks all belong to one outpost and clear when that camp closes, like perks today.

**What the simulation says:** the shop is about as fast as the draft for every kind of player (all differences sit inside seed-to-seed noise). Idle players still close camp every run. Players get fewer perks but better ones (rare and legendary up from 32% to 40% for idle). **Paying with camp cash was clearly worse.** It slowed active players by about half (Diesel Road at 50 min instead of 33) and cut their lead over casual players to 1.1×. The shop does **not** fix the existing gap where active play is worth only about 1.1–1.2× from the second outpost on. That gap was already there with the draft and needs the "follow your lead" work.

**Why it is more fun than the draft:** you can see what is coming, plan around it ("save for Domino fall, it is on the shelf"), take a curse because it fits *this* run, and check back when the stock turns over. The draft's surprise moments come back as the always-rare slot and as fresh stock from every mini-game pick.

## Rules

### Stock
| Slot | What can show up | Notes |
| --- | --- | --- |
| 1–3 (open) | Any common, rare or legendary in the pool, weighted like the draft today (`Core.draftWeight`) | *Wider choice* (board) adds a 4th open slot (was: a 4th card) |
| 4 (featured) | Rare or legendary only | The roguelite "big find" of each rotation |
| 5 (board's bargain) | One curse | Free; its catch and its upside are the curse itself |

- The pool is the draft pool today: `Core.draftPool` (set-2 perks need *Old hands*), plus order perks once their special order is filled. Rare, legendary and curse perks are one per outpost, and commons stack, as now. An owned one-per-outpost perk never shows up again.
- A bought slot shows **Sold** until the next rotation, except that **each pick earned from mini-games also refills one sold slot** with a fresh card at that run's quality (the supply wagon brings one more crate). Active players see more stock, not just more picks.
- **Stock quality** works like draft quality today: a rotation uses the best mini-game result since the last rotation (floor 0.3). A new era rolls at 0.65 or better. Good play still tilts the shelf toward rare and legendary.

### Prices
| Item | Price in picks | Today's draft, for comparison |
| --- | --- | --- |
| Common perk | 1 | 1 card |
| Rare perk | 1 | 1 card |
| Legendary perk | 2 | 1 card (5% weight) |
| Curse | 0 (free) | 1 card (9% weight) |
| Hold a slot through a rotation | free, one slot at a time | n/a |
| Restock now | *Lucky compass* (1 per outpost), survey marker (2 per outpost) | Reroll |

Tested and rejected: **rare 2 / legendary 3** (more price texture, but the active bot's perks per run fell from 24 to 13 and active ÷ casual dropped to 1.33 / 1.10 / 1.03). A curse that *paid* a pick back (+1) made curses a free extra perk. The idle bot took about 2 a run and its run-2 speed-up fell to 22%.

### Rotation
- **Every 10 minutes of play** (one in-game year, so 4 seasons; the tent shows "new stock in 6:40").
- **On reaching a new era**: the supply ship restocks at quality 0.65 or better (replaces the era draft).
- **Hold**: tap the pin on one card and it stays through the next rotation. Pinning another card moves the pin.
- Rotation runs on game time, so offline catch-up rotates the stock too, and an idle player who comes back sees a full shelf, not a stale one.

### Per camp, per run
- Logging and the Sawmill each have their own tent, picks and stock (`S.run.shop`, `S.camps.sawmill.shop`). The mill tent has 3 slots (no curse slot: the mill pool is 5 perks and no curses).
- **Close camp clears that camp's picks, stock and pin**, along with its perks. Unspent picks are lost. The close-camp screen says so ("2 unspent picks will be lost"), so nobody hoards by mistake. Other camps are untouched (pillar 4).

## Currency decision

| Option | For | Against | Verdict |
| --- | --- | --- | --- |
| **Camp cash** (Melvor style) | Familiar; a real sink; a decision against equipment | Prices must scale ×1,000 across eras (we priced it at 5% / 12% / 30% of the next push inland, bought at most a quarter of spare cash). **Measured: active Diesel Road 33 → 50 min; active ÷ casual 1.15 / 1.13 / 1.08; casual ÷ idle 1.06 / 0.91 / 1.06; perks pull money from crews.** Cash-rich late eras would trivialise it. | **Rejected.** Breaks pillar 2 and makes perks a trap. |
| **Charter Shares** | Already a currency | It is the prestige currency: spending it in a run that will be wiped fights the company board and teaches "don't spend". | Rejected (not simulated). |
| **New per-run scrip** | Clean, tunable | The owner cut new currencies (2026-10-24). | Rejected. |
| **Perk picks** (the existing "Perk ready" count) | Earned exactly where drafts are earned; no new source; pillars 1 and 2 carry over unchanged; one small number on the tent | Fewer price levels to play with; needs a clear label so it does not read as a currency | **Chosen.** |

Shown simply: the top-bar button "Pick perk (2)" becomes **"Quartermaster · 2 picks"**. The picks never show up in the warehouse or the money line.

## Where perks come from now (old draft sources)
| Source today | With the shop |
| --- | --- |
| Mini-game meter (draft *n* needs *n* runs) | Same meter, gives 1 pick **and** refills one sold slot |
| Reaching Steam Camp / Diesel Road | 1 pick **and** a full restock at quality 0.65 or better |
| Five goals met, five orders filled | 1 pick each (idle's main source, unchanged) |
| Survey marker (2 per outpost) | A full restock now (was: a reroll) |
| *Lucky compass* board node | 1 free restock per outpost (was: +1 reroll) |
| *Wider choice* board node | +1 open slot (was: 4 cards) |
| *Old hands* board node | Same: set-2 perks enter the pool |
| *Camp stories* board node | Same: start with a random common perk |
| Highballer (beating par counts twice toward the next perk) | Same (counts twice toward the meter) |

## Save migration (key `timberline-v2`, merge with defaults)
- New `S.run.shop = {picks, stock:[], hold:null, q:0, last:S.t}` and the same on `S.camps.sawmill.shop`.
- On load: each queued draft in `S.run.dq` becomes 1 pick, and its best quality seeds `shop.q`. An open draft offer (`S.run.offer`) seeds the first stock, so the cards a player was looking at are still on sale. Then `dq` and `offer` are emptied. The empty fields stay in the save for one release, so an older build can still load it.
- `S.run.rerolls` and `markerRerolls` keep their meaning (restocks now). Nothing else moves.

## Measured results

*`sim/sim_rogue.js` in a balance worktree, extended with a `SHOP=picks|cash` mode that turns every queued draft into a pick (or a restock, for cash) and buys from the stock with each profile's existing perk scores. Bots save for a high-value legendary when it is in reach, take curses they score well, and use Lucky compass or markers when nothing is worth buying. Seeds 1–6, 3 runs, 8 h. The mill keeps its draft in the sim. Means over seeds; minutes to close camp (gas policy = close at Diesel Road).*

**Gas policy (the speed comparison)**
| | Draft today | Shop, chosen (1 / 1 / 2) | Shop, 1 / 2 / 3 | Cash shop |
| --- | --- | --- | --- | --- |
| Idle run 1 / 2 / 3, min | 67 / 46 / 42 | 62 / 46 / 43 | 64 / 51 / 42 | 62 / 47 / 48 |
| Idle run 2 / run 3 faster than run 1 | 32% / 38% | 25% / 30% | 20% / 35% | 23% / 21% |
| Casual run 2 / run 3 faster | 24% / 32% | 23% / 38% | 20% / 31% | 12% / 21% |
| Active (mini-game) run 1, min | 33 | 34 | 34 | 51 |
| **Active ÷ casual, runs 1 / 2 / 3** | **1.50 / 1.23 / 1.17** | **1.42 / 1.20 / 1.09** | 1.33 / 1.10 / 1.03 | 1.15 / 1.13 / 1.08 |
| Perks per run, idle / casual / active | 10 / 15 / 24 | 10 / 15 / 21 | 9 / 10 / 13 | 12 / 25 / 33 |
| Rare + legendary share, idle / casual / active | 32% / 60% / 59% | 40% / 64% / 61% | 33% / 56% / 70% | 28% / 42% / 36% |
| Curses per run, idle | 0.4 | 1.9 | 1.8 | 1.8 |
| Charter Shares per run, idle / casual / active | 33 / 29 / 29 | 32 / 29 / 28 | 33 / 29 / 29 | 33 / 32 / 33 |
| Longest gap, idle (unlocks only / incl. perks bought), min | 18.1 / 13.1 | 20.8 / 10.4 | 18.6 / 10.6 | 23.3 / n/a |
| Idle-away run 1 / 2 / 3, min | 125 / 97 / 75 | 122 / 87 / 96 | 121 / 103 / 83 | 122 / 95 / 84 |
| Unfinished runs, soft-locks | 0, none | 0, none | 0, none | 0, none |

**Lpm policy (close when shares per minute peak)**
| | Draft today | Shop, chosen (1 / 1 / 2) |
| --- | --- | --- |
| Charter Shares per hour, idle / casual / active / idle-away | 26.9 / 36.0 / 50.7 / 20.2 | 28.9 / 33.8 / 45.8 / 20.9 |
| Active ÷ casual, shares per hour | 1.41 | 1.36 |
| Perks per run, idle / casual / active | 7 / 14 / 23 | 7 / 14 / 19 |
| Rare + legendary share, idle / casual / active | 42% / 64% / 58% | 46% / 70% / 59% |
| Longest gap, idle (unlocks only / incl. perks bought), min | 20.7 / n/a | 19.1 / 12.9 |
| Unfinished runs (150-min cap) | 1 (idle-away) | 1 (idle-away) |

Under lpm, run length is the bot's choice, so read shares per hour, not minutes.

**Control (`NOPERK=1`, gas):** with no perks, idle run 1 takes 94 min (67 with the draft), and active ÷ casual is 1.68 / 1.37 / 1.19. Perks are worth about 28% of idle run-1 time. They also *narrow* the active lead, because the idle and casual bots pick idle-crew multipliers that active play cannot out-earn.

Noise check: two shop variants that differ only for active players gave idle results 2–5 points apart, so read differences under about 5 points of speed-up, or 0.1 of a ratio, as noise.

**What the numbers say**
1. **A picks shop is balance-neutral against the draft.** Run times, shares and speed-ups move within noise. Idle closes camp every run; no soft-locks or stalls.
2. **Price level matters for active play.** The active player's edge was perk *count* (24 a run, mostly stacked commons). Raising rare and legendary prices to 2 and 3 cut that to 13 and dropped active ÷ casual to 1.03 by run 3. At 1 / 1 / 2 the count stays near 21.
3. **Cash is a trap.** The active bot, with more restocks to see, spent $1.8–2.5M a run on perks instead of crews and was 50% slower.
4. **Existing misses stay misses.** Active ÷ casual is about 1.1–1.2 in runs 2–3 with the draft or the shop (target 1.5–2). Idle-away's 50–60 min gaps are its away time. Neither is caused by the shop; the "follow your lead" proposal (`late-run-active-play.md`) is the fix. Counting a perk bought as an event, the idle gap stays at 10–16 min in the shop variants (13 min for the draft).
5. **Curses are now taken about 2 a run by idle and casual players** (draft: about 0.5), because a free *Absent board* or *Company scrip* is all upside for an idle crew. This is fine for pillar 1 but makes them a no-brainer for idle. See owner question 2.

## Fun check
**Moment-to-moment decisions the shop creates:**
- *Spend or save:* 1 pick now on Road crew, or wait one meter for the legendary Fog lifts on the featured slot?
- *Pin:* hold the Ice road king card because winter is two seasons away.
- *Take the bargain:* Storm season is free; is this the outpost to ride out bad weather for shares?
- *Play to restock:* a sold-out shelf plus a nearly full meter is a reason to play one more haul run (refill). That ties pillar 2 to a visible thing on screen.
- *Check back:* a 10-minute clock gives idle players a reason to return that is not just "numbers went up".

**Where it loses to the draft:** the draft gives a small reveal every pick and never makes you think about saving. Some players will sit on picks and feel worse off. **Compensation:** prices stay low (1 / 1 / 2), the featured slot keeps the reveal, mini-game picks refill a slot, and the tent nudges "3 picks waiting" with the same toast as today. The roguelite feel holds because each rotation shows only 5 of about 25 perks, and stock is rolled per camp and per outpost.

## Build plan
**Slice 1, Logging only (small to medium):**
`Core.rollShop(rng, pool, q, slots)` and `Core.shopPrice(r)` in `packages/core`, with tests. `S.run.shop` with migration from `dq`/`offer`. The draft window becomes the tent: 5 cards with prices, Sold, a pin, "new stock in m:ss" and a restock button for compass and markers. `queueDraft` adds a pick instead of a card; era arrival restocks. Mini-game picks refill a slot. The sim drives the real functions (`buyPerk`, `holdSlot`, `restock`), and the bot's harness-only shop is deleted. Smoke test plus balance check: the gas table above must hold.

**Slice 2, the Sawmill tent plus polish:**
`S.camps.sawmill.shop` (3 slots, no curse slot), the close-camp warning for unspent picks, the board node text changes (*Lucky compass*, *Wider choice*), and the phone layout (cards in a 2-column grid). Balance check with the mill bot buying too.

## Owner questions
1. **Approve the picks shop as designed (1 / 1 / 2, curse free, 10-minute rotation, refill on mini-game picks)?** Recommendation: yes. It is balance-neutral and adds planning.
2. **Curses:** free (as tested; idle takes about 2 an outpost) or 1 pick (as in the draft today)? Recommendation: free for slice 1, then decide after a playtest.
3. **Name:** "Quartermaster" for the tent and "picks" for the count, or another 1890 name such as "Company commissary"?
