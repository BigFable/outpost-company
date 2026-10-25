# Seasonal events: the weather rolls at every season change

**Status: Proposal for the owner.** *Design reviewer, 2026-10-25. Builds on the season factors in `packages/core/src/formulas.ts`, `sawmill-camp.md`, `prime-timber-drops-inventory.md` and `species-overhaul.md` (landed on main today; collisions are named in section 3b). All numbers are starting values for the balance agent.*

## For the owner: what changes

Today the seasons are a fixed rhythm: mud in spring, frozen roads in winter, the same every year. After this change, **every time the season turns, the coast deals a card.** Sometimes it is nothing ("Fog on the water, normal work"). Sometimes it is good: the supply ship comes in early, the days run long, the inlet freezes into an ice road. Sometimes it is bad: a thaw flood turns the skid trails to soup, an equinox gale makes every fall a gamble, a blizzard shuts the woods for half a season.

- **The card is a dispatch, not a pop-up.** It slides into the season box at the top of the screen in the company's voice, says what it changes, and folds away by itself. A season lasts two and a half minutes, so the game never stops you to read it.
- **Every bad event has a way through.** Idle crews just ride it out, a little slower. If you play, each bad event has a counter: finish a good mini-game run on the slowed job and you clear half the trouble. Each bad event also has a silver lining (a flood floats logs down to the cove for free; a gale throws wreckage up on the haul road, so you find more ship's fittings).
- **Bad luck is capped.** Never two bad events in a row, the first hours of a new company only deal good or quiet seasons, and no outpost should come out more than 6% slower because of bad weather.
- **The board back home can buy weather help** with Charter Shares: an almanac that shows next season's card early, a summer charter for better summer yields, storm signals that make bad events rarer, and an insurance policy that cancels one bad event per outpost.
- **Brave players can ask for worse weather.** New charter clauses (Storm coast, Long winter) and a curse perk raise the odds of bad events in return for more Charter Shares.
- **Some events post an order.** After a storm, the settlement wants timber for a new bridge; during the salmon run, the box factory wants cannery crates in a hurry. Missing one costs nothing.
- **While you are away,** the weather keeps rolling. When you come back, the return summary lists the seasons you missed and what each one did.

---

## 1. The roll

**When:** at every season change (every `SEASON_LEN` = 150 s), in `tick()`, which also runs offline. The calendar is company-wide and already survives close camp, so **one weather serves both camps**: a gale hits the Logging camp and the Sawmill at once, each in its own way. Closing either camp does not touch the weather (pillar 4).

**What rolls:** one event from that season's table (section 2) on a seeded stream (`rng.events`). Each table has a "nothing" entry of weight 30–34.

**One season ahead:** the roll for season N+1 happens when season N starts and is stored as `weather.next`. Nothing changes for players without the almanac; with it, they see the card a season early. Rolling ahead means the almanac can never be gamed by reloading.

**Duration:** `season` (150 s), `half` (the first 75 s, some with a different second half), or `instant` (a one-time effect at the start, with a season-long tail if listed).

**Stacking with existing seasons:** an event multiplies on top of `seasonFactor()`. After both, each stage's factor is **clamped to 0.4–1.6**. Spring mud ×0.5 plus a thaw flood ×0.8 gives 0.4, never less. Events never stack with each other: one event at a time.

**Bad-luck rules (all in core, all tested):**
- **No two bad events in a row.** A bad roll right after a bad event becomes "nothing". (Storm coast and the *Storm season* curse loosen this to "no three in a row".)
- **Gentle start:** a brand-new company's first 4 season changes deal only good or nothing, and the very first card is always *Supply ship in* or *Long days*.
- **Payroll guard:** no event can put crews into arrears. If an upkeep or price effect would leave cash under 2 minutes of upkeep, that effect pauses ("The board covers the shortfall").
- **Instant losses are capped:** a slash fire burns at most 15% of stems on the ground, once per season.

**How it shows:**
- **Dispatch card** in the season tile (`tSeason`): event name, two lines of story, one line of effects ("Skidding ×0.8 · logs float down to the cove"), the counter, and a timer bar. It folds away after 8 s. The season sub-line then reads the event ("Thaw flood: skid slowed, 0:52 left"). It never opens a modal and never interrupts a mini-game: the card queues while a game is open.
- **First sight:** the first time a player meets an event, the card stays open until clicked, and the event enters the **Almanac** page of the collection log (28 events plus 3 harsh ones). Each first sighting counts as an unlock for the 20-minute gap target, and the ladders "Weathered 10 storms" and "Every season's card" become achievements.
- **Activity log:** one `note()` line per event, as today.
- **Return summary:** offline seasons are listed, grouped ("4 quiet seasons · Thaw flood, Spring 1893: 3,100 bd ft floated to the cove · Blizzard, Winter 1893: half a season lost, then packed roads"), up to 6 lines, with a net line ("Weather this time away: about 2% slower than a quiet stretch"). First sightings made offline open as cards after the summary.

## 2. Event tables

Effects are multipliers on idle crews unless marked. "Game" lists mini-game rule changes. Weights per season sum to 100. Tone: **G** good, **N** neutral or mixed, **B** bad.

### Spring (base: mud, skid and haul ×0.5; strong felling wind)

| Event | Tone | Wt | Lasts | Crews, prices, mill, drops | Game | Counter / silver lining |
| --- | --- | --- | --- | --- | --- | --- |
| Grey spring | — | 34 | — | none | — | — |
| **Thaw flood** | B | 14 | season | Skidding ×0.8 (counts as mud: Corduroy halves it, *Swamp boots* ignores it, *Greased runners* turns it into ×1.1 more); mill water ×1.2 | Skid: +3 mud patches. Haul: spring road limit −1 | Silver: **river drive**, 15% of the landing floats to the cove and sells at once. Posts *Rebuild the Charter Creek bridge* |
| Spring drive | G | 12 | season | Hauling ×1.25; mill water ×1.15 | Haul: par +10% | — |
| Supply ship in | G | 12 | instant + season | Crews, machines and cutting rights cost 15% less this season; +1 ship's fitting | — | — |
| Fog bank | N | 12 | season | Hauling ×0.9; idle finds ×2 (fog-glass weight ×2) | Haul: road hidden past 120 yd (Road lookout: 240 yd; *Lamp-lighter* ignores fog) | Silver: the finds |
| Late frost | N | 10 | half | Felling ×0.85; mud eased: skid and haul mud ×0.75 instead of ×0.5 | Buck: **frost shake**, one log per stem has a hairline crack (grade 3), drawn on the stem and named in the piece readout | Net positive for skid and haul |
| Survey party returns | G | 6 | instant | The next land office refresh lists one more lot; +1 survey marker | — | — |

### Summer (base: normal; skid game has 2 mud patches)

| Event | Tone | Wt | Lasts | Crews, prices, mill, drops | Game | Counter / silver lining |
| --- | --- | --- | --- | --- | --- | --- |
| Long light | — | 30 | — | none | — | — |
| **Long days** | G | 18 | season | Every stage ×1.1 | All games: pace boosts +10 s | *Summer charter* makes it ×1.2 |
| Fish run | N | 12 | season | Half the hands go to the salmon: every stage ×0.85, upkeep ×0.75; mill sawyers ×0.9 | — | Posts *Cannery shook* (rush order) |
| **Dry spell, fire watch** | B | 12 | season | Felling ×1.0. If stems on the ground exceed 2 min of bucking output, a slash fire can burn 15% of them (once) | — | Counter: keep stems moving (bucking game, *Bottleneck boss*). Silver: burnt-over ground, the next lot costs 20% less |
| Low water | B (mill) | 10 | season | Mill water ×0.7. Logging: dry trails, skidding ×1.15 | Skid: no mud patches | Good for Logging, bad for the mill: a cross-camp trade |
| Frigate in the cove | G | 10 | season | Prime spars sell ×2 this season | — | Posts *Topmast for the frigate* |
| Thunderstorm | B | 8 | half | Felling ×0.85 (crews shelter); mill water ×1.2 | Fell: one gust shift during the back cut, flagged by the wind arrow 1 s ahead | Silver: rain ends fire risk until next Summer |

### Fall (base: normal)

| Event | Tone | Wt | Lasts | Crews, prices, mill, drops | Game | Counter / silver lining |
| --- | --- | --- | --- | --- | --- | --- |
| Fog on the water | — | 30 | — | none | — | — |
| **Equinox gale** | B | 14 | season | Hauling ×0.85 (windthrow across the road); felling ×1.1 (the wind fells the weak ones) | Fell: wind ×1.5, shown on the gauge | Silver: a perfect fall in a gale rolls on the top-tier find table and stamps +1 Prime; haul fittings ×2 (wreck wash). Posts the bridge order |
| Second summer | G | 14 | season | Skidding ×1.15, hauling ×1.1 | Skid: no mud | — |
| Early freeze | N | 12 | season | **Counts as Winter** for every winter rule: fell ×0.85, skid and haul ×1.25, Road sprinkler sled, *Ice road king*, *Frost feller*, maple's Winter felling; mill water as Winter | Haul: winter road (weaker brakes without the sprinkler). Fell: winter wind | Net good for haul |
| Glut at the cove | B | 10 | season | Log price ×0.88 | — | Silver: cutting rights −20% this season, and the regular charter order premium +15 points |
| Wreck on the bar | N | 10 | instant + season | Idle haul finds of ship's fittings ×3 | — | Posts *Salvage the wreck* |
| Early charter ship | G | 10 | season | Every sale ×1.08; the regular charter order gets +60 s | — | — |

### Winter (base: felling ×0.85, skid and haul ×1.25; strong wind; no mud)

| Event | Tone | Wt | Lasts | Crews, prices, mill, drops | Game | Counter / silver lining |
| --- | --- | --- | --- | --- | --- | --- |
| Hard frost | — | 30 | — | none | — | — |
| **Blizzard** | B | 12 | half, then half | First 75 s: every stage ×0.6 (Road sprinkler: hauling unaffected). Last 75 s: packed snow, hauling ×1.2 | Haul: road edges drawn dashed, view 60% | Silver: the packed road |
| Ice bridge | G | 14 | season | Hauling ×1.3 more (clamped at 1.6); skidding ×1.1 | Haul: road limit +2; brakes as in summer | Stacks with *Ice road king* inside the clamp |
| Cold snap | B | 12 | season | Felling ×0.85 more (*Frost feller* ignores it); mill water ×0.6 (Steam engine house, *Waste burner* and *Freshet* ignore it) | Saw for grade: frozen logs, one more hidden knot per log | Silver: **ice harvest**, the mill cuts pond ice for the ship, $ per idle sawyer |
| Short rations | B | 10 | season | The supply ship is iced out: upkeep ×1.25 (payroll guard applies) | — | Silver: the ship's master buys spars, Prime spars sell ×1.5. Counter: *Frugal cook*, Company store, the bunkhouse |
| Clear cold | G | 12 | season | Idle finds ×1.5, fog-glass weight ×3 | Haul: the whole road shows. Fell: the true fall line shows (as with the Gunning stick) | — |
| Midwinter feast | G | 10 | season | Every stage ×1.05 | All games: pace boosts +15 s | — |

**Hot-spring basin** lots (species doc: "never freezes") ignore Early freeze, Ice bridge and Cold snap's felling penalty on that tract.

**Harsh events** (only with the Long winter clause, section 4): *Ice jam* (Spring, B, wt 10: hauling ×0.6 for 75 s, then the jam breaks and 30% of the landing floats down), *Whiteout* (Winter, B, wt 10: every stage ×0.5 for 75 s, no pace boosts; +2 Charter Shares at close camp).

**Clear the road (base rule, the active counter).** While a bad event slows a stage, a mini-game run on that stage at mid tier or better (q ≥ 0.55) halves that stage's remaining penalty for the rest of the event. One run per event per stage. It shows on the card ("Skid a clean turn to clear the trails"). Idle players lose only the penalty, which the tables keep small.

## 3. Perks

| Perk | Rarity | Rule |
| --- | --- | --- |
| *Salvage rights* | Rare | Every bad event leaves a find in the warehouse when it ends: flood → burl, fire → amber pitch, gale or wreck → ship's fitting, blizzard or cold → survey marker |
| *Fair-weather foreman* | Rare | A good event carries into the next season when that season rolls "nothing" |
| *Storm crew* | Rare | *Clear the road* takes any finished run (not mid tier), clears the whole penalty, and grants a pace boost |
| *River pig* | Rare | Thaw flood, Spring drive and Ice jam float 40% of the landing to the cove (not 15–30%) |
| ***Ill wind*** | **Legendary** | "It's an ill wind that blows nobody good." Bad events' crew penalties become bonuses of the same size (gale hauling ×0.85 → ×1.15). Mini-game hazards and silver linings stay |
| *Storm season* | **Curse** | Bad-event weights ×2, and bad events may come twice in a row. Every bad event that runs its full course adds +2% to this outpost's Charter Shares (at most +30%) |
| *Fair-weather crews* | **Curse** | Every crew works ×1.2 in good and quiet seasons, but bad events hit twice as hard (the 0.4 floor still holds) |
| *Ice saw* (Sawmill) | Rare | Cold snap and Ice bridge: the ice harvest pays double, and frozen logs hide no extra knots in Saw for grade |

**Existing season perks, reviewed:**
- *Ice road king* fits. Change its text from "Winter on the Reach" to "On winter roads (Winter or an Early freeze)". It stacks with Ice bridge inside the 1.6 clamp.
- *Swamp boots* gains value: Thaw flood counts as mud. It was the weakest season perk, so this helps.
- *Greased runners*: flood mud makes it stronger (spring skid up to 1.2 × 1.1, inside the clamp). Fine for a legendary.
- *Lamp-lighter* (order perk) ignores Fog bank and Blizzard view limits in the haul game.
- *Absentee directors*: *Clear the road* still works (it is not a pace boost).
- *Bottleneck boss* is now the counter to fire. No change.

### 3b. Collisions with `species-overhaul.md`

- **Spruce wind ×1.5 × Equinox gale ×1.5 (× spruce headlands ×1.2) = 2.7× wind.** Cap the felling wind multiplier product at **2.0** and say so in the status line. Otherwise gale spruce becomes unplayable.
- **Frost feller** ("Winter felling no longer slows") also covers Early freeze and Cold snap's felling penalty. One rule: Early freeze counts as Winter for every winter rule, species traits included (maple's Winter ×1.15 and 2 Prime maple).
- **Maple sap stain** (Spring felling ×0.85) stacks with Late frost (×0.85) to 0.72, inside the floor. Accept.
- **Hemlock peel season** keys off the calendar season, not events. Second summer does not make tanbark pay in Fall.
- **Orders:** the species doc gives the Admiralty spar yard regular spruce orders. My *Topmast for the frigate* is a one-off item order from a visiting frigate's carpenter, not the Admiralty, so the clients stay distinct. The bridge order stays "any wood" so it does not shadow Landfall Pier Works' hemlock order.

## 4. Charter upgrades and clauses

**The board back home (Logging meta tree, Charter Shares):**

| Node | Cost | Effect |
| --- | --- | --- |
| *Weather almanac* | 8 | The season tile shows next season's card ("Next: Thaw flood") |
| *Summer charter* | 10 | In Summer every crew works ×1.1, and good Summer events are half again as strong (Long days ×1.15 → ×1.2 on top) |
| *Storm signals* | 12 | Bad-event weights ×0.7 (the freed weight goes to "nothing") |
| *Underwriters' policy* | 14 | Once per outpost, cancel a bad event when it rolls: a "Claim the policy" button on the card. With auto-claim (default on), it cancels the first Thaw flood, Dry spell, Equinox gale or Blizzard |

**The mill's board (Sawmill shares):** *Mill race* (6): Low water and Cold snap cost the mill half as much.

**Charter clauses (multiply Charter Shares at close camp):**

| Clause | × | Rule |
| --- | --- | --- |
| *Dry summer* (reworked) | 1.25 | Felling −10% stays. Its separate random fire is removed; instead Dry spell's weight ×3 in Summer. One fire rule, not two |
| *Storm coast* (new) | 1.25 | Bad-event weights ×1.6 all year; "no three bad in a row" |
| *Long winter* (new) | 1.2 | Fall rolls on the Winter table, and Ice jam and Whiteout join the tables |

*Dividends due* and *Thin survey* need no change. *Survey party returns* adds a lot under *Thin survey* as usual.

## 5. Event orders

A third order slot, **Dispatch**, under the regular charter order and the special orders. One open at a time. **Missed orders are withdrawn with no penalty.** Share bonuses count toward the existing **+25% special-order cap** and never exceed it.

| Order | Posted by | Needs | Due | Reward |
| --- | --- | --- | --- | --- |
| Rebuild the Charter Creek bridge | Thaw flood, Equinox gale, Blizzard | 4 min of current hauling output, delivered | End of next season | Those board feet sell ×1.3; +2% order bonus |
| Cannery shook (Fogline Box & Crate) | Fish run | 3 min of output | This season | Those board feet sell ×1.4 |
| Topmast for the frigate | Frigate in the cove | 2 Prime spars | End of next season | +3% order bonus and $ (10 min of income) |
| Salvage the wreck | Wreck on the bar | 2 Prime spars (shoring) | End of next season | 1 fog-glass |
| Plank the levee (Sawmill) | Thaw flood, mill open | 3,000 bf Common lumber | End of next season | +3% Sawmill order bonus |

Board-foot needs scale with current output at posting, so they fit every era. Idle fills them by delivering as usual. Item orders favor active players, as intended.

## 6. Mini-game impacts

Every change shows in play: the game's status line opens with the event ("Equinox gale: wind ×1.5. A perfect fall counts as top tier for finds."), and the guide (?) lists active weather.

| Game | Events that change it |
| --- | --- |
| **Place a fall** | Equinox gale: wind ×1.5 (cap 2.0 with species). Thunderstorm: one flagged gust shift. Early freeze: winter wind. Clear cold: true fall line shown |
| **Plan the cuts** | Late frost: frost shake (one cracked log per stem, drawn and named) |
| **Skid a turn** | Thaw flood: +3 mud patches. Low water and Second summer: no mud |
| **Drive a load** | Thaw flood: limit −1. Spring drive: par +10%. Fog bank: view 120 yd. Early freeze: winter road. Blizzard: dashed edges, view 60%. Ice bridge: limit +2, summer brakes. Clear cold: full road |
| **Saw for grade** | Cold snap: +1 hidden knot per log (*Ice saw* removes it) |
| All games | Long days +10 s and Midwinter feast +15 s on pace boosts; *Clear the road* during bad events |

## 7. Balance guardrails and sim needs

**Expected effect:** about 24 season changes per hour and about 60 per outpost, so luck averages out over a run. The tables are tuned so that **a year of weather averages 0.98–1.03× a quiet year** for idle throughput. About 1.1 bad events per year.

| Target | Expected effect |
| --- | --- |
| Active vs casual 1.5–2× | Up by about 0.03–0.08× (*Clear the road*, item orders, finds in gales). Today's miss is 1.29×, so this helps but is not the fix |
| Idle closes camp every run | Unchanged. No event can stop a stage (floor 0.4), cost wages, or burn more than 15% of one pile |
| Run 2 vs run 1, 25–40% | Almanac, Summer charter and Storm signals add about 3–5% from run 2 on. Their prices (8–14) keep them after the first close camp. Check that run 2 stays at or below 40% |
| Gap under 20 min | Helps: 28 first sightings and the weather ladders |
| Soft-locks | None: the payroll guard, the fire cap, no zero factors |

**Variance limit:** across 20 seeds, the worst outpost may be at most **6% slower** than the same seed with events off (8% with Storm coast or *Storm season*). The bad-luck rules are the first lever; event sizes are the second.

**The bot must model:** the `events` stream, rolled one season ahead; tables, weights, clauses and meta; idle effects inside `tick` (stage, price, upkeep, mill power, drift, fire, finds); the clamp and guards; mini-game hazards as changes to success odds (gale fell perfect −0.08, fog and blizzard clean haul −0.05/−0.10, flood clean skid −0.06, frost buck ≥90% −0.05, cold snap saw −0.05); *Clear the road* for the minigame profile; auto-claim insurance; Dispatch orders (board-foot ones fill themselves). **Report per profile:** events on vs off (mean and worst seed), bad events per outpost, longest bad streak, payroll-guard triggers, fires and stems burned, the Dispatch share of the order bonus, and the standard targets.

## 8. Data model (`packages/core/src/weather.ts`)

```ts
export type EventTone = 'good' | 'neutral' | 'bad';
export type EventEffect =
  | { kind: 'stage'; stage: Stage | 'all'; mult: number; half?: 1 | 2 }
  | { kind: 'price' | 'upkeep' | 'hire' | 'tractPrice' | 'millPower' | 'millSawyers'; mult: number }
  | { kind: 'finds'; mult: number; item?: ItemId } | { kind: 'item'; item: ItemId; qty: number }
  | { kind: 'drift'; share: number }                 // landing floats to the cove
  | { kind: 'fire'; share: number; minStemsMin: number }
  | { kind: 'seasonAs'; season: Season }             // Early freeze
  | { kind: 'game'; game: 'fell' | 'buck' | 'skid' | 'haul' | 'saw' | 'all'; rule: string; value?: number };
export interface SeasonEventDef {
  readonly id: string; readonly season: Season; readonly tone: EventTone; readonly weight: number;
  readonly name: string; readonly card: string; readonly counter?: string; readonly silver?: string;
  readonly lasts: 'season' | 'half' | 'instant'; readonly effects: readonly EventEffect[];
  readonly order?: string; readonly harsh?: boolean; readonly noFreezeImmune?: boolean;
}
export const EVENT_CLAMP = [0.4, 1.6] as const;
// pure: eventWeights(season, mods, meta, perks), rollEvent(season, lastTone, startProtect, rng),
// eventStageFactor(ev, stage, tSinceStart, opts), clampSeason(f), eventGameRules(ev, game)
```

- The prototype's `seasonF()` becomes `clampSeason(seasonFactor(...) × eventStageFactor(...))`. With no event, the result is byte-identical, so the baseline holds.
- `rng.events` is a new `streamRng` key. Logging's `Math.random` draws stay untouched.
- **Save (`timberline-v2`):** `weather: { cur: {id, t0, cleared: Stage[]} | null, next: string | null, lastTone: 'none', seen: {}, changes: 0, away: [] }`, plus `run.policyUsed: false`. Deep-merge on `load()`. Add `weather` to `closeCamp()`'s `keep`, and reset `run.policyUsed`. An old save has no `weather`: the first roll happens at the next season change, and `changes: 0` would wrongly trigger the gentle start, so set `changes` to `S.stats.winters × 4` on migration.

## 9. Build plan

**Slice 1: the roll proves itself (Logging only, about 3 days).** `weather.ts` with 4 events per season (nothing, one good, one bad, one mixed): Supply ship / Thaw flood / Fog bank; Long days / Dry spell / Fish run; Second summer / Equinox gale / Early freeze; Ice bridge / Blizzard / Clear cold. Idle effects, the clamp, the bad-luck rules, the payroll guard and the Dry summer rework. The dispatch card, the season sub-line, the return summary and the Almanac page. Mini-game hazards for the four bad events and *Clear the road*. *Weather almanac* and *Storm signals*. *Ill wind* and *Storm season*. Sim support and a balance run. *Playtest question: "Did a season card ever make you open a mini-game?"*

**Slice 2: the full coast.** The rest of the tables; Sawmill hooks (water, sawyers, ice harvest, Saw for grade frost); Dispatch orders; *Summer charter*, *Underwriters' policy*, *Mill race*; Storm coast and Long winter with the harsh events; the remaining perks; the species collisions (wind cap, *Frost feller*, hot-spring immunity) once species slice 1 lands. *Playtest question: "Which card did you hope for, and which did you dread?"*

## 10. Owner questions

1. **A card every season (every 2.5 minutes), or one per year?** **Recommendation: every season,** as you asked, with about a third of rolls being "nothing" and a card that never stops play. Once a year would make each event a 10-minute slog, and that is the worse trade.
2. **One weather for both camps?** **Recommendation: yes.** It is one coast, and it creates trades (Low water helps Logging and hurts the mill). The effects are small and capped, so a reset in one camp never stalls the other.
3. **Does the *Storm season* curse's share bonus count inside the +25% special-order cap?** **Recommendation: no.** It is a curse payout like a charter clause, capped on its own at +30%. Folding it into the order cap would make the curse worthless to anyone filling orders.
