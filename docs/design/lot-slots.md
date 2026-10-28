# Land office lot slots

**Status: Proposal for the owner.** *Balance agent, 2026-10-26. Answers the owner request "4 lot slots unlocked by the player; slot 1 has two tree types, slots 2 and 3 more, slot 4 is the AFK lot". Builds on `species-overhaul.md` (grounds, era species), `lot-stash-and-camp-money.md` (picking cost) and the AFK lot decision of 2026-10-26. All timings come from the bot harness (8 h, 3 runs, seeds 1–6, gas policy) with a temporary prototype in a worktree; no game code on main changed.*

## In plain language (for the owner)

The land office gets **four slots, one lot in each**. Slot 1 is open from the start and always offers a plain two-species lot, like today. Slots 2 and 3 open later and offer richer lots: three species, then four species including one rarer tree you would not normally see yet (maple at Cove Landing). Slot 4 is the AFK lot.

**How slots open:** by **cutting out lots**. Finish 2 lots and slot 2 opens, 3 lots opens slot 3, 4 lots opens slot 4 (the AFK lot). The count is for the company's whole Logging history, so **slots stay open after close camp**. A new player opens all four in their first 15–20 minutes, one every few minutes. Each opening is a small "unlock" moment, and the AFK lot is ready before an idle player first steps away.

I compared four ways to unlock (Charter Share board, era, milestones, cash per outpost). Era and the Charter Share board open the AFK lot too late for idle players: up to an hour in, and in the era version it locks again every new outpost. Paying cash each outpost works on timing but turns into a chore you repeat every run. Milestones give the same timing with nothing to repeat.

---

## 1. The slots

| Slot | Name on the card | Lot it offers | Species | Opens (recommended) | Measured opening, run 1 (mean, range) |
| --- | --- | --- | --- | --- | --- |
| 1 | Company lot | Today's listing: a Cove ground (coast, headland, swamp) or the two-species mixed stand; keeps the 30% older-tier roll and the push-tract price guarantee | exactly 2 | always | 0 min |
| 2 | Surveyed lot | Current era only (no older-tier roll), main species 40–60%, the other two split the rest (each at least 5%) | 3 from the era pool | **2 lots cut out** (lifetime) | idle 11.0 (10–12), casual 8.7 (7–11), minigame 8.0 (7–11), idle-away 11.0 (10–12) |
| 3 | Cruiser's pick | As slot 2, plus one **rare** species at 10–20%: the next era's new tree (maple at Cove, oak at Steam Camp, cloudwood at Diesel Road; cloudwood at Interior) | 4: 3 from the era pool + 1 rare | **3 lots cut out** | idle 13.6 (12–15), casual 11.2 (9–12), minigame 10.8 (9–13), idle-away 13.6 (12–15) |
| 4 | AFK lot | Today's AFK lot unchanged (`AFK_LOT`: 12–18× trees, small poor stems, land ×0.4, 1–3 mi, cutover ground) | 3 (pine-led) | **4 lots cut out** | idle 15.7 (13–19), casual 13.7 (12–16), minigame 13.5 (11–16), idle-away 15.7 (13–19) |

**Refresh.** Each slot relists its own kind of lot the moment you buy from it. The whole board still refreshes every 3 minutes. The AFK lot, once bought, does not come back until the next board (as today). The push-tract guarantee (a lot at or under half the push price) applies to slot 1.

**Prices.** All slots use today's formula (42% of gross log value, distance and slope discounts, perks). Slot 2 and slot 3 lots are not cheaper or bigger. What they offer is variety, order options and the rare tree. Slot 3's rare tree uses its normal stats (Cove dollars), so it adds value per tree and Prime variety without breaking the ±10% same-era rule on net value per work.

**Species pool by era (from `ERA_SPECIES`).**

| Era | Pool | Slot 1 | Slot 2 | Slot 3 rare |
| --- | --- | --- | --- | --- |
| Cove Landing | pine, spruce, hemlock | ground pair | all three | maple |
| Steam Camp | + maple | 2 of 4 | 3 of 4 | oak |
| Diesel Road | + oak | 2 of 5 | 3 of 5 | cloudwood |
| Into the Interior | + cloudwood | 2 of 6 | 3 of 6 | cloudwood (always in) |

**Charter orders and the stash.** Species orders name a species on the current lot or on the board (`offerSpecies`). More slots put more species on the board, so the board offers more kinds of orders. On a three- or four-species lot each species has a small share, so picking it costs more (picking factor 0.5 + 0.5 × share: a 20% species picks at ×0.6, a 10–20% rare tree at ×0.55–0.6). That is the intended trade-off: slot 3 can fill the maple order early, but chasing it is slow. Measured side effect: with the rare tree on the board, more species orders name a tree the current lot does not hold. Species orders filled per idle 8 h fell from 4.7 to 3.8 (see finding 2).

## 2. Unlock options compared (measured)

The "open" control runs the same four-slot board with every slot open from the start, so it shows the layout's own effect apart from the unlock.

| Option | Rule tested | Slot 2 / 3 / 4 opens, idle run 1 (min) | AFK lot for idle-away | Idle-away dry while away | Resets on close camp? | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| Today (baseline) | 3 listings + AFK always | 0 / 0 / 0 | 0 min | 40% | n/a | reference |
| Control: all open | 4 slots, all open | 0 / 0 / 0 | 0 min | 51% | n/a | layout is safe |
| (a) Charter Share board | a node after the first close camp | not run: first close camp is at 69 min (idle), 133 min (idle-away) | 69–133 min, and none in run 1 | worse than (b) in run 1 | no | too late |
| (b) Era | slot 2 and AFK at Steam Camp, slot 3 at Diesel Road | 25.5 / 62.6 / 25.5 | 60 min, every run | **67%** | yes | fails idle |
| (c1) Milestones, 3 / 8 / 12 lots | lifetime lots cut out | 13.5 / 22.1 / 29.5 | **62 min** (idle-away cuts slowly) | **58%** | no | AFK too late |
| **(c2) Milestones, 2 / 3 / 4 lots** | lifetime lots cut out | **11.0 / 13.6 / 15.7** | **15.7 min** | **41%** | **no** | **recommended** |
| (d) Cash per outpost | slot cost = 1× / 3× / 1.5× a median lot ($640 / $1,925 / $960 at Cove; × era size) | 11.5 / 13.7 / 14.1 | 12.3 min | 40% | yes, rebought every outpost | works, but a chore |

The thresholds are capped by the idle-away player. They cut out their 3rd lot at 13.3 min and their 5th at 24 min, and they first leave at 20 min. Slot 4 can therefore need at most 4 lots, or the AFK lot misses the first time away.

## 3. Against the targets (seeds 1–6, 3 runs, 8 h)

| Target | Baseline (today) | Recommended (c2) | Pass? |
| --- | --- | --- | --- |
| Active vs casual 1.5–2× (casual ÷ minigame minutes; run 1 / mean of 3 runs) | 1.50 / 1.31 | 1.66 / 1.42 | run 1 pass; 3-run mean misses, as baseline does today |
| Idle closes camp every run | 18/18 runs | 18/18 runs | pass |
| Run 2 vs run 1, 25–40% faster | idle 35%, casual 25%, minigame 9% | idle 23%, casual 25%, minigame 2% | idle slips below the band (6-seed noise is about ±10 points: the open control gave 26%); minigame misses in both |
| Longest gap without an achievement or unlock, under 20 min | idle 18.6, casual 16.9, minigame 18.1 | idle 21.8, casual 25.0, minigame 18.6 | miss (see finding 3: not caused by slots) |
| Soft-locks | none | none (no timber-less minutes for present players; no unfinished runs) | pass |
| Idle-away: share of away time with no timber | 40% | 41% | unchanged |

## 4. Findings

1. **The AFK lot must open by about minute 18, or idle players lose it for their first absence.** Era gating left idle-away with no timber for 67% of away time, and slow milestones for 58%, against 40% today. Lifetime milestones at 2 / 3 / 4 lots keep it at 41%.
2. **More species on the board spreads species orders thinner.** Idle species orders filled per 8 h: 4.7 baseline, 3.8 with slots. Orders now name slot-3 rare trees that the current lot does not hold. *Proposal:* draw species orders from owned lots plus slot 1 only (`offerSpecies`), or let the rare tree appear in orders only after it has been bought once. Expected effect: back to about 4.5.
3. **The 20-minute gap misses sit in runs 2–3 (minutes 95–125), not in the slot window.** The same 25.0-minute casual seed-3 gap appears in the control, cash and milestone runs. One listing per slot changes the random draws, and that moves a pre-existing late gap; the slot unlocks themselves fall in minutes 8–19. The slot unlocks do not close late gaps because they are permanent. *Proposal for later:* a run-2+ unlock (e.g., the Cruiser's pick shows a second listing after the first Steam Camp push each outpost).

## 5. Recommendation

**Milestones, lifetime, Logging only:** slot 2 opens at 2 lots cut out, slot 3 at 3, slot 4 (the AFK lot) at 4 (`S.stats.tracts`, which already survives close camp). Slots never close again. This keeps idle viable, gives four unlock moments in the first 16 minutes, and is per-skill (pillar 4): the Sawmill is unaffected. Old saves with 4+ lots cut out start with all four slots open.

**Smallest version to build:**
- `generators.ts`: `LOT_SLOTS = [{species:2}, {species:3, need:2}, {species:4, rare:true, need:3}, {afk:true, need:4}]`; `genRichTract(rng, era, n, rare, opts)` (no older-tier roll; the rare draw takes from the next era's pool); listings carry `slot`.
- Prototype: `refreshSales` builds one listing per open slot; `buyTract` relists the same slot; a locked slot shows a card such as "Cut out 2 lots to open (1/2)"; an unlock note and log line when a slot opens. Hire jobs and the 3-minute refresh stay as they are.
- Sim: `sim_rogue.js` already reads the slots in the worktree prototype (`SLOTS` env, `TL.slot` timings, `afkLocked`); port the reporting with the build.
- Re-record the balance baseline, because one listing per slot changes the draw order.

## 6. Owner questions

1. All four slots open within the first ~16 minutes. Is that fine as onboarding, or do you want slots 2–3 to be a longer goal? The longer we wait, the later the AFK lot comes, unless slot 4 opens before slots 2 and 3.
2. Should the slot 3 rare tree (maple at Cove) be able to show up in species orders before you own any of it (finding 2)?
3. Slot 1 now shows one lot instead of three, so there is less choice early. The bots did not slow down. Would you like slot 1 to keep two listings anyway?
