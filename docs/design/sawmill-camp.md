# Sawmill camp: the second skill, and how camps feed each other

**Status: Approved for build (playtest round 2).** *Design reviewer, 2026-10-24. Owner rulings of 2026-10-24 folded in: the Sawmill is the second camp, structures stay built, each camp keeps its own cash (assumed, owner to confirm). Needs the warehouse, Prime timber and finds from `prime-timber-drops-inventory.md`. All numbers are starting values for the balance agent.*

## What the player sees (for the owner)

The first time you close camp on Logging, the charter ship leaves a crate on the beach: saw blades, a few Prime spars, and a note from the directors. "The company will no longer ship raw logs home. Saw them here." A **Sawmill** tab opens. Logging starts its next run as usual; the two camps run side by side and each closes camp on its own.

The mill starts as a **saw pit**: two sawyers whipsawing logs by hand. You build the rest from what Logging sends you. Prime spars and amber pitch dam a **mill pond** and turn a water wheel. Ship's fittings mount a **headrig**. Every structure stays built, so each Sawmill run starts stronger than the last.

Logs come from your Logging camp. A slider on the Logging board sends a share of every delivery to the company mill instead of selling it. More logs make the mill grow faster but leave Logging less cash, and that is the first real choice between camps. If the pond runs dry, the mill buys logs at the cove with its own cash, so it never stops.

The mill sends something back: **plank bundles**. With them you raise a **bunkhouse** at the logging camp, level by level, and every level makes crews cheaper to keep. Logging feeds the mill and the mill houses the loggers.

The mini-game, **Saw for grade**, takes about 15 seconds. A log sits on the carriage; you take boards off one face, and you decide when to turn the log. Clean outer wood makes Clear boards, the knotty heart only Common. Hidden knots show up as you cut. A great sawyer beats the "saw around" pattern and turns a Prime log into **Quarter-sawn boards** that the Admiralty pays for.

## 1. When and how it opens

- **Trigger:** first Logging close camp. A one-time story card, then the Sawmill tab with a "new" badge.
- **Founding crate:** 6 Prime spars, 2 amber pitch, 1 ship's fitting and 20,000 bf of company logs. That covers the mill pond and the headrig, so an idle player who made few Prime spars is not stuck.
- **Per-skill prestige:** the Sawmill has its own outpost state, cash, Charter Shares (`shares.sawmill`), drafts and meta branch. Closing either camp resets only that camp. Structures and the warehouse never reset.
- **Separate cash:** items and logs cross between camps; cash does not. A $1M Domino-fall run cannot buy out the mill in a minute.
- **Camp money (model 4, slice 1, built 2026-10-25):** cash crosses only as payment for goods. The mill pays Logging 0.8× the cove price for slider logs, from mill cash. **Short of cash, the mill takes only the logs it can pay for; Logging sells the rest at the cove** (no debt, no stall, Logging is never short-paid). Logging pays the mill $40 per plank bundle when it builds a bunkhouse level (it cannot build without the cash). The founding crate adds $300 of mill cash once. A ledger line in each camp shows logs and bundles paid this run. Constants: `CAMP_MONEY` in `packages/core/src/sawmill.ts`. Mill log orders (a 5th charter-board card) are slice 2.
- **Camp money tuning (2026-10-26):** the mill pays 0.5× (was 0.8×). The crate's $300 of mill cash comes at the start of every mill run. The mill board's `saw.advance` is now **Log crate**: each mill run starts with 3,000 bd ft of logs in the pond (it no longer gives $300). **Auto slider:** the slider is a cap (0–50%, default 10%); Logging sends the mill what it can saw, its sawing rate × 5 minutes minus the pond stock, up to the cap (`millFlowBf`). The note under it reads "Sending 6% now. Cap 10%."

**No overlap with the existing mill fiction.** Logging keeps its outside buyers: delivery contracts, the charter order and *Bucking for grade*, which is about **log** grades (No. 1, 2, 3 sawlogs). The Sawmill grades **boards** with different words: **Clear, Select, Common**. Two renames in Logging so names don't clash: the buyer "the Cove Sawmill" becomes "the Cove timber merchant", and the tally's "Cove mill price" becomes "Cove log price". Bucking cuts a stem into lengths; Saw for grade opens one log into boards. Different cut, different screen.

## 2. Structures (built from Logging items + Sawmill cash)

Instant builds. **Structures stay built through close camp.** When Raising ships, it takes over construction (build time, upgrades).

| # | Structure | Cost | Unlocks / does |
| --- | --- | --- | --- |
| 0 | **Saw pit** | Start | 2 sawyers, hand power, 40 bf/min |
| 1 | **Mill pond & wheel** | 3 Prime spars, 2 amber pitch, $100 | Water power: throughput ×2.5; logs wait in the pond. Seasons now matter (section 3) |
| 2 | **Circular headrig** | 2 Prime spars, 1 ship's fitting, $250 | +2 sawyers; Saw for grade gets the full carriage (turn and dog the log); unlocks cutting patterns |
| 3 | **Edger & trimmer** | 3 Prime spars, 2 ship's fittings, $800 | Edges waney boards: 20% of Common becomes Select |
| 4 | **Drying yard** | 5 Prime spars, 2 burls, $1,200 | Seasoned lumber sells ×1.3 after 10 minutes in the yard; seasoned orders open |
| 5 | **Steam engine house** | 6 Prime spars, 4 ship's fittings, 4 amber pitch, $4,000 | Burns the mill's own slab: no winter slowdown, +2 sawyers |
| 6 | **Filing room** | 2 Prime spars, 1 fog-glass, 1 survey marker, $2,500 | Idle sawyers cut to a good pattern (Clear yield as if a 70% mini-game) |
| 7 | **Planing mill** | 6 Prime hardwood, 4 ship's fittings, $15,000 | Dressed lumber ×1.5; advances the Sawmill to the Steam Mill era |

Since structures are permanent, Logging items keep their value through **upgrades** (each structure has levels 2 and 3 at 2× and 4× the item cost, +25% to its effect), special orders, and Prime logs being the best input to the mill.

**Two-way flow (one item back, on purpose):**

| Direction | Goods | Effect |
| --- | --- | --- |
| Logging → Sawmill | Company logs (bf, by slider); Prime spars, Prime hardwood, pitch, fittings, burls, fog-glass, markers | Mill input and structure costs. A Prime log saws as a guaranteed 60% Clear |
| Sawmill → Logging | **Plank bundle** (made from Common lumber, 1 per 500 bf) | Raise the **bunkhouse** at the logging camp: 5 levels at 4, 8, 16, 32, 64 bundles. Each level: crew upkeep ×0.95 and hiring ×0.95 (×0.77 at level 5). Permanent, like all structures |

## 3. Idle loop, special mechanic, eras

**Idle loop.**
- **Logs in:** company logs land in the **log pond**, a bulk board-foot stock in the warehouse, so it survives either camp closing. The Logging slider sends 0–50% of deliveries there (default 20%). With "buy at the cove" on (default), an empty pond buys logs at market price from Sawmill cash.
- **Sawing:** `bf/min = sawyers × saw × power(season)`. Lumber comes out by grade: an average log gives Clear 20%, Select 35%, Common 45%; a Prime log gives Clear 60%.
- **Lumber out:** it piles in the **lumber yard** (outpost stock) and sells at Clear 3×, Select 2×, Common 1× the log price per bf. Plank bundles are taken from Common first (toggle).
- **Cutting pattern** (after the headrig), one setting per run: **Boards** (more Clear, ×0.8 speed), **Planks** (default), **Beams** (×1.3 speed, all Common, wanted by Landfall orders). Lumber by dimension lives here.
- **Offline:** closed form, with seasonal power averaged over the time away.

**Special mechanic: water and waste.** The mill runs on water until steam.

| Season | Water power | Note |
| --- | --- | --- |
| Spring freshet | ×1.3 | Pond full |
| Summer | ×1.0 | |
| Fall | ×0.9 | |
| Winter | ×0.6 | Wheel half-frozen |

The Steam engine house ends the winter slowdown by burning **slab**, the waste from squaring logs. Cutting for Boards makes the most slab. Without the engine, slab just sells as firewood.

**Mill sites as biomes:** pick 1 of 3 sites at the start of each run, like Logging tracts. The mill's structures go with it.

| Site | Twist |
| --- | --- |
| Whistle Pond | Steady water (winter ×0.8), cove logs cost ×1.2 |
| Cove Mouth | Tidewater: cove logs ×0.8, Admiralty orders +5%, water ×0.85 all year |
| Glass Creek Falls | Freshet ×1.6, winter ×0.4 |

**Eras** follow the company's years: **Pit & Wheel** 1890 (whipsaw, sash saw, water); **Steam Mill** 1905 (circular headrig, steam, planer), reached with the Planing mill; **Band Mill** 1950 and **Scanner Mill** 1990 come later with Logging's later regions. **Close camp unlocks** at Steam Mill or 150,000 bf sawn.

## 4. Mini-games

Playtest 1 rules: rules shown in play, harder choices pay more (never fined), par set from the log in front of you.

### Saw for grade (12–20 s, first)

1. **Pick the log (2–3 s):** 2–3 logs on the deck, each labelled with diameter and log grade, Prime logs marked. Bigger and Prime logs pay more and hide more defects.
2. **Saw:** the log shows end-on, with each face's grade zone shaded (Clear rim, Select band, Common heart) and visible knots marked. **Space / click Saw** takes one board off the facing side, and the board drops with its grade stamped on it. Hidden knots and shake appear in the new face.
3. **Turn:** **Turn / right-click** rotates the log 90° (the dogs reset, 1 s). Turn when the face drops to a lower grade; that is the sawyer's whole decision.
4. **End:** the log is a squared cant (auto-sawn to Common) or time runs out.

- **Par:** the value of the standard "saw around" pattern (turn after every 2 boards) on this exact log, computed at setup. Shown as a target bar.
- **Score:** board value ÷ par. A speed bonus of up to +10% if you finish with time left. A bad run still sells its boards. No zero runs.
- **Quality `q`:** below par 0.5, at par 0.7, ≥ 115% of par 0.97+. Top tier on a Prime log stamps 1–2 Clear boards as **Quarter-sawn boards**.
- **Average vs great:** an average run is worth about 5 minutes of one sawyer's idle output; a great run on a Prime log about 25 minutes, plus Quarter-sawn boards and a top-tier drop roll.
- **Relaxed players:** a "sawyer's mark" assist (on for the first 5 runs, toggle after) puts an arrow on the better move. Small logs have only 2 faces worth turning.

### Edge the board (8–12 s, after the Edger; second build)

Boards slide past on chains; drag the two edger guides to the widest clean width before each board reaches the saw. Wane outside the guides costs grade; guides inside the clean wood waste it. Par is the clean width of each board.

## 5. Perks

| Perk | Rarity | Rule |
| --- | --- | --- |
| *Chain carriage* | Rare | A top-tier log rolls the next log straight onto the carriage with its outer boards one grade higher, chaining up to 3 (the Sawmill's Domino fall) |
| *Quarter-sawn* | Rare | Every 4th Clear board from a Prime log is Quarter-sawn, idle included |
| *Grade stamp* | Uncommon | Select counts as Clear for orders; Clear sells ×0.85 |
| *Sawyer's eye* | Uncommon | Saw for grade shows hidden defects one face ahead |
| *Gang saw* | Uncommon | Every Saw takes two boards: fewer choices, double speed; idle ×1.3, Clear share ×0.8 |
| *Waste burner* | Uncommon | Slab powers a donkey boiler: winter power never drops below ×0.9, even without steam |
| *Pond monkey* | Common | Prime logs are sawn first and give 1 extra Clear board each |
| *Turn and dog* | Common | Turning in the mini-game is instant; Turn no longer resets the speed bonus |
| *Shingle weaver* | Common | Slab and Common offcuts make shingles: plank bundles cost half |
| *Big stick* | Legendary | Once per outpost, a giant log arrives: a 6-face Saw for grade, and every Clear board from it counts ×3 for orders |
| *Freshet* | Legendary | The pond never drops: spring water power all year |
| *Hot saw* (C) | Curse | Idle speed ×1.5; but sawing 3 boards without turning overheats the saw (the run ends), and idle mills stop 5 minutes in every hour |

## 6. Items and special orders

Finds use Logging's roll rule (tier from `q`; idle rolls at 2% per 60 s of work).

| Item | Rarity | From | For |
| --- | --- | --- | --- |
| Quarter-sawn board | Made | Top-tier Prime log; *Quarter-sawn* perk | Admiralty order; future Raising (fine work); sells 4× |
| Plank bundle | Made | Common lumber | Logging bunkhouse; Landfall order; later Fishing jetty and dories |
| Tramp iron | Common | Saw, idle (old spikes in logs) | Sells as scrap; future Smithing |
| Spalted board | Uncommon | Saw, idle | Sells high; collection |
| Birdseye figure | Rare | Top-tier maple (Steam era on) | Sells very high; Landfall order; collection |

| Order (Sawmill board, 25% cap per skill) | Needs | Reward | Due |
| --- | --- | --- | --- |
| Admiralty deck planking | 12 Quarter-sawn boards, 6 Prime spars | +15% sawmill shares, unlocks *Quarter-sawn* | 2 outposts |
| Landfall pier | 20,000 bf beams, 10 plank bundles, 4 tramp iron | +12% sawmill shares, lights the pier on the Landfall screen | 3 outposts |

Bulk lumber can be handed in from the yard; partial hand-ins persist across close camp, like item hand-ins.

## 7. Balance guardrails

- **First structure** under 5 minutes after the Sawmill opens (the crate); an idle player reaches the edger in under 20.
- **Idle is enough:** the idle player closes Sawmill camp every run. Logs always flow (slider plus cove buying). Every required item has an idle source; only the optional Filing room needs fog-glass.
- **Active 1.5–2×** per skill and for both camps together.
- **The slider must not starve Logging:** at the default 20%, Logging run 1 timing stays within 10% of today's baseline.
- **Permanent structures and the bunkhouse** both speed up every later run. Run 2 vs run 1 must stay within 25–40% per skill. The bunkhouse is capped at ×0.77 upkeep. If run 3 or later goes too fast, raise upgrade costs before touching the targets.
- **Contention:** the idle bot still fills at least one Admiralty spar order per 2 outposts while the mill competes for spars.
- **Item and lumber sales:** the mill's cash comes from lumber by design; find sales stay under 5% of each camp's earnings.
- **Unlock gap** under 20 minutes across both camps (structures and upgrades count).

**The sim bot must model:** both skills ticking at once on separate RNG streams (`sawmill.saw`, `sawmill.drops`); the shared warehouse and log pond; the slider (by profile: idle 20%, casual and mini-game bots optimise between 10% and 40%); cove buying; the crate; a build policy (pond, headrig, edger, drying yard, steam, then upgrades and orders); seasonal power, averaged for offline; grade mix by log quality; plank bundles and bunkhouse levels feeding Logging upkeep; Saw for grade `simulate(botSkill)` with log choice; and close camp per skill. Report per profile: time to each structure, Sawmill outposts per 8 h, Logging speed by bunkhouse level, spars spent on structures vs orders, and the standard targets.

## 8. Data model

The Sawmill is a `SkillModule` in `packages/skills/sawmill`. The shared content types go in `packages/core`, where Fishing and Raising reuse them.

```ts
export interface StructureDef {
  readonly id: string; readonly skill: SkillId; readonly name: string;   // 'sawmill.headrig'
  readonly levels: readonly { readonly items: readonly ItemStack[]; readonly cash: number;
                              readonly modifiers: readonly ModifierSpec[] }[];
  readonly requires?: UnlockExpr;
  readonly unlocks?: readonly string[];   // 'minigame:sawmill.edger', 'pattern:beams'
  readonly target?: SkillId;              // the bunkhouse is a sawmill-built structure in Logging's camp
}
export interface SiteDef { readonly id: string; readonly region: string;
  readonly power: Readonly<Record<Season, number>>; readonly logCost: number; readonly orderBonus?: number }
export type BulkId = 'company.logs_bf' | `${SkillId}.lumber.${'clear'|'select'|'common'}`;
// SkillContent gains: structures?, sites?, bulk?  (bulk stocks are counted in bf, not items)
```

- Generalize `PrimeRule` to `MadeItemRule` (Prime spar, Quarter-sawn board).
- The warehouse gets **bulk stocks** next to item counts: `company.logs_bf` (the log pond). Outpost lumber stays in the camp state.
- Save: `camps.sawmill = { cash, sawyers, site, era, pattern, yard, run }`; top-level `structures: Record<string, number>` (levels, never reset); `shares.sawmill`; `story.sawmillOpened`; `logging.millShare: 0.2`. Deep-merge nested defaults on load. Sawmill close camp clears `camps.sawmill` only, and `closeCamp()` must keep `structures`.
- Build the Sawmill in `packages/skills`, not inside `timberline.html`. The playtest page can still be bundled as one file.

## 9. Build order

**Playtest round 2 (smallest version that proves camps feed each other):**
1. Warehouse, Prime spars and the five finds (Prime timber spec, section 8).
2. The Sawmill opens on first Logging close camp: story card, crate, separate cash, the Logging slider, cove buying.
3. **Saw pit, Mill pond & wheel, Circular headrig.**
4. The idle loop with three grades and seasonal water power; one site (Whistle Pond); Planks pattern only; close camp at 150,000 bf.
5. **Saw for grade** with log choice, par and the assist.
6. Plank bundles → bunkhouse levels 1–3 at the logging camp.
7. Five perks: *Chain carriage, Sawyer's eye, Pond monkey, Turn and dog, Big stick*.
8. Sim support and a balance run.

Playtest questions: "Did you change the log slider, and why?" and "When did you turn the log?"

**Then:** edger and Edge the board; drying yard and steam; cutting patterns; three sites; filing room; upgrades; the remaining perks and the curse; Sawmill finds and orders; the Planing mill and the Steam Mill era.

## 10. Owner questions

1. **Confirm separate cash per camp.** **Recommendation: yes** (assumed in this spec).
2. **Where do the mill's logs come from?** (a) A Logging slider plus cove buying as backup, (b) the mill only buys at the cove, (c) Logging feeds the mill automatically with no choice. **Recommendation: (a).** It is the clearest choice between the two camps, and the backup keeps idle and closed-camp cases from stalling.
