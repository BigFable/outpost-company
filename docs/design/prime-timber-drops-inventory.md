# Prime timber, finds, the company warehouse and special orders

*Design reviewer, 2026-10-24. Build spec for the owner's pick (option 1 in `minigame-value-options.md`, extended). Named hands is out. All numbers are starting values for the balance agent.*

## What the player sees (for the owner)

When you lay a tree perfectly into the opening, the scaler stamps it **Prime**: "+2 Prime spars to the warehouse." A clean bucking job can stamp a couple more. Your idle crews spot the odd Prime tree on their own, about one in fifty trees.

Every mini-game can also turn up a **find**: a burl on a stump, a lump of amber pitch in a log, an old brass survey marker under a skid trail, a ship's fitting washed up beside the haul road. The better you play, the more often you find something and the rarer it can be. Idle crews find things too, just rarely.

Everything goes into the **company warehouse**, one shared store for every skill. It never fills up. It shows what each item is for, what the open orders still need, and a collection log of everything you have ever found. The warehouse belongs to the company, not the outpost, so it **stays when you close camp**.

The order board now sometimes carries a **special order**: "The Admiralty wants 24 Prime spars and 4 casks of pitch within two outposts." Filling one adds bonus Charter Shares when you close camp (at most +25% on top of that outpost's shares), unlocks a new perk for your drafts, and pays a little **Old silver**: coins from the 1840s expedition that never came home, turned up in the fog. A single ledger at the top of the screen shows cash, Charter Shares and Old silver.

Idle players fill special orders too, more slowly: roughly one every two outposts instead of one or two every outpost.

## 1. Prime timber

Prime logs are **counted items**, not board feet. Making one does not take anything off the log piles. The board-foot economy and the existing +25% perfect-fall value stay as they are.

| Source | Prime made |
| --- | --- |
| Perfect fall (felling game) | The tree you laid, by species: pine 2, spruce 2, hemlock 1 → **Prime spar**; maple 1, oak 1 → **Prime hardwood**; cloudwood 1 → **Cloudwood heartwood**. Trees your fallers drop alongside it are not Prime. *Domino fall* chains do not add Prime. |
| Bucking game, score ≥ 90% | 1 Prime per grade-1 sawlog of 12 ft or longer in your cuts, 2 at most per stem, species from the stem (`B.sp`). |
| Idle felling crews | Each crew-felled tree has a chance `0.02 × TRACT_BASE[0] ÷ TRACT_BASE[era]` to be Prime (1 log, tract species). That is 2% at Cove Landing, and it keeps the Prime per tract steady (about 1.2) as tracts grow from 60 to 120,000 trees. |

**Does Prime travel the chain?** No. It goes **straight to the warehouse when it is stamped**. Piles are bulk board feet with one average value. A second stream through stems, cut and landing would touch `move()`, spills, slash fires, offline catch-up and the sim for almost no visible gain. Skid and haul earn their keep through their own finds. If playtests say skid and haul feel left out, revisit "Prime waits at the landing" later.

Only conifers grow at Cove Landing, so the first playtest sees only Prime spars.

## 2. Finds (drops)

**Roll rule.** Each mini-game makes one drop roll, using the quality `q` it already passes to `runDone(kind, q)`:

| Tier | q | Drop chance × | Table it rolls on |
| --- | --- | --- | --- |
| Top (perfect fall, clean skid or haul, buck ≥ 97%) | ≥ 0.97 | 1.0 | All entries |
| Mid (good fall, full load, buck ≥ 85%) | 0.55–0.97 | 0.4 | Common and uncommon |
| Low | < 0.55 | 0.1 | Common only |

Base chance per game: fell 25%, buck 20%, skid 20%, haul 25%. Good play raises both how often you find something and what it can be. Rares come only from top results, with a tiny idle exception.

**Idle rule.** Each stage that works at least half its capacity rolls once per 60 s of work at 2%, on the common and uncommon entries, with rares at one tenth of their weight. That comes to about 5 finds an hour across the four stages.

| Game | Entries (weight) |
| --- | --- |
| Fell | Burl (50), Lost axe-head (35), Fog-glass (10, rare), Petrified knot (5, rare, Interior tracts only) |
| Buck | Amber pitch (70), Burl (20), Petrified knot (10, rare, Interior tracts only) |
| Skid | Survey marker (50), Lost axe-head (40), Fog-glass (10, rare) |
| Haul | Ship's fitting (60), Old silver ×1–2 (30, top tier only), Fog-glass (10, rare) |

## Items

| Item | Rarity | Comes from | For |
| --- | --- | --- | --- |
| Prime spar | Made | Perfect fall or grade-1 cut, conifers; idle 2% | Admiralty and Lighthouse orders; future Sawmilling (clear boards); sells for 2× a normal log |
| Prime hardwood | Made | Maple and oak, from Steam Camp on | Cornerstone order; future Raising (frames); sells |
| Cloudwood heartwood | Made, rare | Perfect fall on cloudwood (Interior) | Cornerstone order; Landfall City; collection |
| Burl | Common | Fell, buck | Sells well (veneer); future Sawmilling; collection |
| Amber pitch | Common | Buck (pitch pockets) | Caulking and Admiralty orders; future Smelting (naval stores) |
| Lost axe-head | Common | Fell, skid | Collection (6 maker's marks to find); sells; future Smithing scrap |
| Survey marker | Uncommon | Skid | Turn in 1 for a draft reroll (2 per outpost at most); future Surveying |
| Ship's fitting | Uncommon | Haul (wreck wash on the cove road) | Caulking and Lighthouse orders; future Raising hardware |
| Fog-glass | Rare | Top-tier fell, skid or haul | Lighthouse order; collection; sells high; future Surveying optics |
| Petrified knot | Rare | Fell, buck in Interior tracts | Cornerstone order; teaser for the Petrified Wood region; collection |

Ten items. Every one has a sink, a sale price, or a collection slot, and every sink is capped or finite (section 6).

## 3. The company warehouse

- **Unlimited slots, no stack cap.** Slots punish idle players: a full bank overnight silently eats finds and breaks pillar 1. Melvor's bank-slot chore is not worth copying.
- **Layout:** grouped Prime timber / Finds / Curios. Filters: by skill, "needed for an open order", "never sold". Sort by name, count or rarity.
- **Selling:** sell one or sell all. "Sell surplus" sells everything except what open orders still need and locked items. Locks per item. The sale price is item base × era scale (`TRACT_BASE[era] ÷ 60`) and pays cash into the current outpost.
- **Order tags:** each item shows "Admiralty needs 6 more".
- **Collection log:** every item, with "???" until first found. Once found, it shows where it drops, the first-found date and the lifetime count. Each full category is an achievement, which helps the 20-minute unlock target.

**Closing camp (pillar 4).**

| Kept | Lost |
| --- | --- |
| Warehouse contents, collection log, Old silver, Charter Shares, special-order progress and deadlines, unlocked order perks | Log piles, cash (except Nest egg), crews and equipment, the regular charter order, survey-marker rerolls used this outpost |

Why: the warehouse is the company's store at Landfall, and it is shared with Sawmilling and Raising. If closing Logging emptied it, a Logging reset would stall the other skills, which is exactly what pillar 4 forbids. Each skill's prestige wipes only that skill's outpost state.

## 4. Currencies

| Currency | Scope | Earned | Spent |
| --- | --- | --- | --- |
| Cash | Outpost (resets) | Log sales, item sales | Crews, equipment, tracts, eras |
| Charter Shares | Per skill (Logging now) | Closing camp, plus the special-order bonus | Meta nodes |
| **Old silver** (new) | Company-wide | Top-tier haul finds; special orders (1–3) | Commission a special order (3): post the order of your choice now with one extra outpost on its deadline. Later: the curio cabinet and Landfall City |

**Why exactly one new currency.** Shares are long-term power and cash is this outpost's working money. Silver is the active player's say over *which* order and *when*. It is never sold, it is never lost, and it lives in the ledger, not the warehouse. Everything else stays an item. No scrip: the name is already taken by the *Company scrip* curse perk, and it would only duplicate cash.

**Ledger:** one HUD strip showing Cash · Charter Shares · Old silver. Click it for this outpost's earned and spent, lifetime totals, and the special-order bonus pending at close camp ("+12% of 25%").

## 5. Special charter orders

They show on the order board next to the regular order, **two open at most**. Each appears once its trigger is met. Deadlines count **outposts closed**, not minutes, so idle players are never racing a clock. A missed order is withdrawn with no penalty and comes back two outposts later. Hand-ins can be partial: items go in from the warehouse as you choose, or automatically with "auto-fill" (on by default for idle).

| Order | Needs | Reward | Appears | Due |
| --- | --- | --- | --- | --- |
| Admiralty spar order | 24 Prime spars, 4 amber pitch | +15% shares, 1 silver, unlocks *Spar man* | First Prime spar | 2 outposts |
| Caulk the *Perseverance* | 10 amber pitch, 3 ship's fittings | +8% shares, 1 silver, unlocks *Pitch boiler* | First pitch and first fitting | 2 outposts |
| Lantern Bluff light | 2 fog-glass, 4 fittings, 6 Prime spars | +10% shares, 2 silver, unlocks *Lamp-lighter* | First fog-glass | 3 outposts |
| Landfall cornerstone | 4 cloudwood heartwood, 12 Prime hardwood, 2 petrified knots | +25% shares, 3 silver, lights a building on the Landfall screen (cosmetic) | Into the Interior era | 3 outposts |

**Bonus cap:** at close camp, `gain = legacyGain(...) × (1 + min(0.25, sum of bonus% filled this outpost))`. Orders repeat after they are filled. The perk unlock happens once.

**Order perks (rare, added to the draft pool; they change rules):**
- *Spar man:* in the felling game, a good fall on a conifer is also stamped Prime (1 log), but perfect falls no longer give a pace boost.
- *Pitch boiler:* bucking pulp pieces yield amber pitch instead of pulp value, and idle buckers find pitch three times as often.
- *Lamp-lighter:* the haul game shows the whole road ahead through the fog, and idle finds double in Fall and Winter.

**Idle path:** the 2% Prime trickle, idle finds and auto-fill. Two-outpost deadlines let a slow stockpile land. Target: the idle bot fills at least one special order every two outposts.

## 6. Balance guardrails

- **Every new reward is capped or finite.** The share bonus is at most +25% per outpost. Marker rerolls: at most 2 per outpost. Order perks: unlocked once, and drafted, not granted. Silver: one sink that only changes timing.
- **Prime adds no board feet** and does not count toward delivered volume or `CLOSE_VOL`.
- **Item sales stay below 5% of an active outpost's earnings.** The balance agent tunes `sell` to hold this.
- **Idle has every path:** the Prime trickle, idle finds, auto-fill and long deadlines.
- **Run 2:** carried-over stock lets an order land early in run 2. That pull is capped by the same +25%, so check that run 2 stays inside 25–40% faster.
- **Honest risk:** the +25% bonus may not lift active play from 1.2× to 1.5× on its own. If the sim says so, the first lever is the cap (up to 35%, owner question 3), not more drops.

**What the sim bot must model (`sim/sim_rogue.js`):**
1. Prime from perfect falls (its existing pPerf) by tract species. From bucks: if r ≥ .9, the count of grade-1 logs of 12 ft or longer is Binomial(3, .45), capped at 2. The idle trickle comes from crew-felled trees.
2. The drop roll per game by tier, and idle rolls per stage-minute, on a **separate seeded stream** so existing draws stay byte-exact.
3. Order posting, auto-fill hand-ins, deadlines, the bonus cap, perk unlocks entering the pool, survey-marker rerolls, and commissioning with silver at 3.
4. Sell surplus at close camp.

**Report per profile (idle, casual, minigame) over 3 outposts × 6 seeds:**
- Prime per outpost and per hour
- Finds per hour by rarity
- Special orders filled per outpost (idle ≥ 0.5)
- Share of Charter Shares from the bonus
- Item sales as % of earnings
- Silver earned and spent
- Warehouse stock at the end (hoarding check)
- The standard targets: active/casual 1.5–2×, run 2 vs run 1, longest gap, soft-locks

## 7. Data model (`packages/core`)

```ts
export type ItemId = string;            // namespaced: 'logging.prime_spar'
export type CurrencyId = 'cash' | 'shares.logging' | 'silver' | string;
export type ItemRarity = 'made' | 'common' | 'uncommon' | 'rare';
export interface ItemDef {
  readonly id: ItemId; readonly name: string; readonly desc: string; readonly flavor?: string;
  readonly skill: SkillId | 'company'; readonly category: 'prime' | 'find' | 'curio';
  readonly rarity: ItemRarity; readonly sell: number;   // Cove Landing dollars, × era scale
  readonly uses: readonly ('order' | 'reroll' | 'sell' | 'collection' | `future:${string}`)[];
}
export interface CurrencyDef { readonly id: CurrencyId; readonly name: string; readonly scope: 'outpost' | 'skill' | 'company'; readonly skill?: SkillId }
export interface DropEntry { readonly item?: ItemId; readonly currency?: CurrencyId; readonly qty: readonly [number, number]; readonly weight: number; readonly minTier: 0 | 1 | 2; readonly when?: string }
export interface DropTable {
  readonly id: string; readonly skill: SkillId; readonly game: string;   // 'fell' | 'buck' | ...
  readonly baseChance: number; readonly tierMult: readonly [number, number, number];
  readonly idlePerMin: number; readonly idleRareMult: number; readonly entries: readonly DropEntry[];
}
export interface PrimeRule { readonly species: SpeciesId; readonly item: ItemId; readonly perfectFall: number }
export interface SpecialOrderDef {
  readonly id: string; readonly skill: SkillId | 'company'; readonly client: string; readonly text: string;
  readonly needs: readonly ItemStack[]; readonly bonusPct: number; readonly silver: number;
  readonly unlockPerk?: string; readonly trigger: string; readonly dueOutposts: number; readonly minEra?: number;
}
export const ORDER_BONUS_CAP = 0.25;
// pure helpers, rng injected: dropTier(q), rollDrop(table, tier, rng), idleDropRolls(table, minutes, rng),
// primeFromFall(species), primeFromBuck(segments, r), idlePrimeChance(era), orderBonus(filled[])
```

**Save (`timberline-v2`), all new top-level keys with defaults:**

```ts
bank: {} as Record<ItemId, number>,
found: {} as Record<ItemId, { first: number; total: number }>,
locks: [] as ItemId[],
wallet: { silver: 0 },                  // cash stays S.cash, shares stay S.meta.legacy; the ledger reads them through a currency adapter
orders: { open: [] as { id: string; posted: number; due: number; given: Record<ItemId, number> }[],
          filled: {} as Record<string, number>, bonusPct: 0, autoFill: true },
run.markerRerolls: 0
```

Two traps for the engineer:
1. `load()` does a **shallow** `Object.assign(fresh(), d)`. Merge each new nested object with its defaults.
2. `closeCamp()` deletes every key that is not in `keep`. Add `bank`, `found`, `locks`, `wallet` and `orders` to `keep`, and reset `orders.bonusPct` to 0 after applying it.

**Future skills plug in** through `SkillContent`: `items`, `dropTables`, `primeRules`, `specialOrders`. The bank is shared, and ids are namespaced by skill. An order's `needs` can mix skills (Sawmilling's "quarter-sawn deck planks" needs `sawmilling.clear_board` plus `logging.prime_spar`), and that is how active play in one skill speeds up the next.

## 8. Smallest playtestable version (Logging prototype)

1. **Prime spars only:** from perfect falls and grade-1 bucks, plus the idle 2%.
2. **Five finds:** burl, amber pitch, survey marker, ship's fitting, fog-glass, with the tier rule and idle rolls.
3. **Warehouse panel:** list, sell, sell surplus, lock, order tags, collection log.
4. **Two special orders:** Admiralty spar and Caulk the *Perseverance*, with the bonus cap and the *Spar man* and *Pitch boiler* perks.
5. **Old silver** from haul finds and orders, with the one Commission sink.
6. **The ledger strip.**
7. **Sim support** and a balance run.

**Deferred:** Prime hardwood and heartwood, lost axe-head, petrified knot, the Lighthouse and Cornerstone orders, *Lamp-lighter*, the curio cabinet, Prime riding the pile chain, and cross-skill uses.

Playtest question: "Did a find ever make you play one more round?"

## 9. Owner questions

1. **Old silver and the lost 1840s expedition.** This adds a small mystery to the setting that Surveying can pay off later. *Recommend yes.*
2. **Missed special orders come back later with no penalty.** The alternative is a cost to your standing with the client. *Recommend no penalty* (pillar 1, cozy tone).
3. **If the sim shows active play below 1.5×, may the balance agent raise the order bonus cap from 25% up to 35%** without coming back to you? *Recommend yes,* still inside the 2× ceiling.
