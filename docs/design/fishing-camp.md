# Fishing camp: the second skill, and how camps feed each other

**Status: Draft for owner review.** *Design reviewer, 2026-10-24. Needs the warehouse, drops and special orders from `prime-timber-drops-inventory.md` first. All numbers are starting values for the balance agent.*

## What the player sees (for the owner)

The first time you close camp on Logging, the charter ship's captain reports: "Silver fish so thick off Gull Spit you could walk on them, if you could see them through the fog." A **Fishing** tab opens. Logging starts its next run as usual; the two camps run side by side and each closes camp on its own.

The fishing camp starts as two hands with hand-lines on a shingle beach. Everything else you **build from what Logging sends you**: Prime spars become a jetty and poles, amber pitch tars the nets, burls smoke the fish, ship's fittings rig the boats. Your best felling now pays off in a second camp.

It works both ways. The **smokehouse** makes **smoked rations**; while Logging has rations in the warehouse, its crews cost 15% less upkeep. So you choose where your Prime spars go: an Admiralty order for Charter Shares, or a boat slip that doubles your catch.

Fishing's twist is **tide and fog**. The tide turns every few minutes and each fishing ground fishes best on the flood or the ebb. Fog banks slow the catch but bring stranger finds. Each Fishing run you pick a ground, the way Logging picks a tract.

The mini-game, **Strike and land**, takes about 15 seconds. You see the fish's shadows before you strike and choose how big to go. Bigger fish are harder and pay more; a landed giant is a **Prize fish**, Fishing's Prime timber.

**Roster change:** Fishing was planned for the first update. It now joins 1.0, and I recommend it takes the **Hauling skill's** slot (question 1).

---

## 1. When and how it opens

- **Trigger:** the first Logging close camp. A one-time story card, then the Fishing tab with a "new" badge.
- **Founding crate:** 4 Prime spars and 2 amber pitch arrive with the card, enough for the first two structures even for an idle player. No soft-lock.
- **Per-skill prestige:** Fishing has its own outpost state, till, Charter Shares (`shares.fishing`), drafts and meta branch. Closing either camp resets only that camp. The warehouse is shared and never resets.
- **Separate tills:** items cross between camps, cash does not. A player with $1M from Domino fall must not buy out the fishing camp in a minute.

## 2. Structures (built from Logging items)

Instant builds: items from the warehouse, cash from the Fishing till. When Raising ships, it takes over construction (build time, upgrades).

| # | Structure | Cost | Unlocks / does |
| --- | --- | --- | --- |
| 1 | **Plank jetty** | 3 Prime spars, $100 | Up to 4 hands (from 2); Strike and land moves to the jetty end, where bigger fish are in reach |
| 2 | **Pole rack** | 1 Prime spar, 2 amber pitch, $150 | Idle catch ×1.5; crews land mid-size fish |
| 3 | **Smokehouse** | 2 Prime spars, 3 burls, $400 | Smoked fish (sells 2×) and **smoked rations** for Logging |
| 4 | **Net loft** | 2 Prime spars, 6 amber pitch, $800 | Fog no longer cuts the catch; unlocks **Shoot the net** |
| 5 | **Dory slip** | 6 Prime spars, 4 amber pitch, 2 ship's fittings, $2,000 | +4 hands; opens Deep Gully |
| 6 | **Tide board** | 2 Prime spars, 1 fog-glass, 1 survey marker, $1,500 | Forecasts fog; boats follow the best tide on their own |
| 7 | **Steam cannery** | 8 Prime hardwood, 6 ship's fittings, $15,000 | Advances Fishing to the Steam Cannery era |

**Closing a Fishing camp strips the structures**, and half their items (rounded down) go back to the warehouse as salvage. That is the fiction, it keeps Logging drops in demand every Fishing run, and rebuilding stays cheap. A meta node, *Standing jetty*, keeps the jetty.

**Two-way flow (one item back, on purpose):**

| Direction | Items | Effect |
| --- | --- | --- |
| Logging → Fishing | Prime spar, amber pitch, burl, ship's fitting, fog-glass, survey marker, Prime hardwood | Structure costs |
| Fishing → Logging | **Smoked ration** | While stocked, Logging upkeep ×0.85. Logging eats 12 per hour of work, offline too. Running out just ends the bonus |

## 3. Idle loop, special mechanic, eras

**Idle loop.** `catch lb/min = hands × gear × ground × tide × fog`. Fresh catch sells at the landing. With a smokehouse, a slider sets the share smoked (default 50%): smoked fish sells 2×, and every 50 lb smoked makes 1 ration. **No spoilage**, which would punish idle players. Offline uses tide and fog averages (closed form).

**Special mechanic.**
- **Tide:** an 8-minute flood/ebb cycle shown as a clock on the panel. The ground's best tide gives ×1.25, the other ×0.75. Active players learn to play on the good tide.
- **Fog banks:** cover the ground about a quarter of the time, 2–4 minutes each: catch ×0.7 (×1.0 with the Net loft), find chance ×2.
- **Grounds as biomes:** pick 1 of 3 at the start of each run, like Logging tracts.

| Ground | Best tide | Twist |
| --- | --- | --- |
| Kelp Shallows | Flood | Small fish, finds ×1.5 |
| Gull Spit Bar | Ebb | Tide swing ×1.5 / ×0.5 |
| Deep Gully (Dory slip) | Either | Big fish, fog twice as often |

Later regions add grounds (Ice Edge in the Glacier Valleys closes in Winter).

**Eras** mirror the company's years: **Shore Station** 1890 (hand-lines, dories, smoke); **Steam Cannery** 1905 (steam tender, trap nets), reached by building the cannery; **Diesel Seiners** 1950 and **Deepwater Grounds** 1990 come later with Logging's later regions. **Close camp unlocks** at Steam Cannery or 40,000 lb shipped.

## 4. Mini-games

Playtest 1 rules: rules shown in play, harder choices pay more (never fined), par set from what is in front of you.

### Strike and land (8–20 s, first)

1. **Pick:** 2–3 shadows circle under the jetty, each labelled with size (S, M, L, Giant) and payout. Click the one you want.
2. **Strike:** the bobber dips; click inside a closing ring (400 ms, tighter for big fish).
3. **Land:** hold to reel, release when the fish runs. Keep the tension needle in the green band; outside it, the line frays. The fish's stamina drains while you are in the band.

- **Par:** stamina ÷ drain at band centre, +30%, shown as a ghost tick on the timer.
- **Score:** weight × size (S 1, M 2.5, L 5, Giant 10) × 1.5 if under par × up to 1.2 for line health. A lost fish still pays half its weight. No zero runs.
- **Quality `q`:** lost 0.3, landed 0.6, landed under par with ≥ 80% line ≥ 0.97. A top-tier L gives 1 **Prize fish**, a Giant 2.
- **Average vs great:** an average M is worth about 6 minutes of one hand's idle catch. A Giant under par is worth about 30 minutes, plus Prize fish and a top-tier drop roll.
- **Relaxed players:** S and M have wide, forgiving bands, and a "hold / release" arrow assist is on for the first 5 runs.

### Shoot the net (15–25 s, after the Net loft)

Drag a net line across the water ahead of a school, reading the current arrows. Fish that cross the net count. Par is the catch from a straight net across the school's shown path; top tier is 90% of the school.

## 5. Perks

| Perk | Rarity | Rule |
| --- | --- | --- |
| *Following shoal* | Rare | Landing an L or Giant under par makes the next bite one size bigger, chaining up to 3 (Fishing's Domino fall) |
| *Fog fisher* | Uncommon | Fog raises catch ×1.2 instead of cutting it |
| *Long slack* | Uncommon | Your best tide lasts 50% longer, the other shorter |
| *Gut on deck* | Uncommon | Fresh fish makes rations; no smokehouse needed |
| *Bait bucket* | Common | A lost fish becomes bait: your next strike window doubles |
| *Kelp combers* | Common | Idle finds ×3 on Kelp Shallows, catch ×0.85 |
| *Heavy tackle* | Uncommon | The line never breaks, but landing over par pays half |
| *Galley share* | Uncommon | Each ration feeds Logging twice as long |
| *Tide-reader* | Rare | Once per tide, choose flood or ebb now |
| *Silver run* | Legendary | Once per outpost, 10 minutes: idle catch ×3 and every bite is L or bigger |
| *Leviathan line* | Legendary | 1 bite in 8 is a Leviathan: land it for a full tide's catch, 3 Prize fish and a rare find; lose it and the pole rests 60 s |
| *Sea-fog charter* (C) | Curse | Fog twice as often, idle catch +40%, and in fog the bobber is hidden: strike on the line's twitch |

## 6. Items and special orders

Finds use Logging's roll rule (tier from `q`; idle rolls at 2% per 60 s of work).

| Item | Rarity | From | For |
| --- | --- | --- | --- |
| Prize fish | Made | Top-tier L/Giant; idle 1% per hand-hour | Orders; sells 3× |
| Smoked ration | Made | Smokehouse | Logging upkeep; Victualling order |
| Glass float | Common | Strike, net | Sells; collection |
| Ship's fitting | Uncommon | Net (wreck snags) | **Shared with Logging**: boats, Logging orders |
| Drowned chart | Uncommon | Net, Deep Gully | Draft reroll (2 per outpost); future Surveying |
| Fog pearl | Rare | Top tier in fog | Sells high; can stand in for fog-glass |
| Ambergris | Rare | Deep Gully, top tier | Sells very high; collection |

| Order (Fishing board, 25% cap per skill) | Needs | Reward | Due |
| --- | --- | --- | --- |
| Victual the charter ship | 40 rations, 4 Prize fish | +15% fishing shares, unlocks *Galley share* | 2 outposts |
| Outfit the survey launch | 8 Prime spars, 4 ship's fittings, 1 drowned chart | +10% fishing shares, unlocks *Tide-reader* | 3 outposts |

## 7. Balance guardrails

- **First structure** under 5 minutes after Fishing opens (the crate); idle reaches the smokehouse in under 20.
- **Idle is enough:** an idle player closes Fishing camp every run. Every required item has an idle source (Prime trickle, idle finds, salvage); only the optional Tide board needs fog-glass.
- **Active 1.5–2×** per skill and for both camps together.
- **Rations:** ×0.85 upkeep at most, no stacking. Logging run 2 stays 25–40% faster than run 1 with rations in.
- **Contention:** the idle bot still fills at least one Admiralty order per 2 outposts while Fishing competes for spars.
- **Item sales** under 5% of each camp's earnings; **unlock gap** under 20 minutes across both camps.

**Sim bot must model:** both skills ticking at once on their own RNG streams (`fishing.catch`, `fishing.drops`); the shared warehouse; the crate; a build policy (jetty, poles, smokehouse, dory slip, net loft, then orders); salvage; ration making and eating, offline too; tide/fog averages for idle and real cycles for active; Strike and land `simulate(botSkill)` with size choice (casual picks M, mini-game bot picks L/Giant); independent close camp per skill. Report per profile: time to each structure, Fishing outposts per 8 h, Logging speed with and without rations, spars spent on structures vs orders, and the standard targets.

## 8. Data model

Fishing is a `SkillModule` in `packages/skills/fishing`. New content types go in `packages/core` so Sawmilling and Raising reuse them.

```ts
export interface StructureDef {
  readonly id: string; readonly skill: SkillId; readonly name: string;      // 'fishing.jetty'
  readonly cost: { readonly items: readonly ItemStack[]; readonly cash: number };
  readonly requires?: UnlockExpr; readonly modifiers?: readonly ModifierSpec[];
  readonly unlocks?: readonly string[];   // 'minigame:fishing.net', 'ground:fishing.deep_gully'
  readonly salvage: number;               // share of item cost returned at close camp
}
export interface GroundDef { readonly id: string; readonly region: string;
  readonly bestTide: 'flood' | 'ebb' | 'either'; readonly tideSwing: number;
  readonly fogRate: number; readonly findMult: number; readonly requires?: UnlockExpr }
export interface SupplyDef { readonly item: ItemId; readonly consumer: SkillId;     // rations
  readonly perHour: number; readonly whileStocked: readonly ModifierSpec[] }      // logging.upkeep ×0.85
// SkillContent gains: structures?, grounds?, supplies?
```

- Generalize `PrimeRule` to `MadeItemRule` (Prime spar, Prize fish).
- Items both camps make move to a `company.` namespace (`company.ship_fitting`), with a save migration.
- Save: `camps.fishing = { cash, hands, built, ground, era, run }`, `shares.fishing`, `story.fishingOpened`; `bank` stays top-level. Deep-merge nested defaults on load; Fishing close camp clears `camps.fishing` only.
- Build Fishing in `packages/skills`, not inside `timberline.html`; the playtest page can still be bundled as one file.

## 9. Build order

**Second playtest (smallest version that proves camps feed each other):**
1. Warehouse, Prime spars and five finds (Prime timber spec, section 8). Prerequisite.
2. Fishing opens on first close camp: story card, founding crate, separate till.
3. **Jetty, Pole rack, Smokehouse.**
4. Idle loop with the tide (no fog yet), one ground (Gull Spit Bar), close camp at 40,000 lb.
5. **Strike and land** with size choice, par and the assist.
6. Rations → Logging upkeep ×0.85.
7. Five perks: *Following shoal, Long slack, Bait bucket, Heavy tackle, Silver run*.
8. Sim support and a balance run.

Playtest questions: "Did you play a felling round to get spars for the fishing camp?" and "Which fish size did you go for, and why?"

**Then:** fog, Net loft and Shoot the net; Dory slip and Deep Gully; three grounds per run; Tide board; the rest of the perks; Fishing finds and orders; the Steam Cannery era.

## 10. Owner questions

1. **What makes room for Fishing in 1.0?** (a) It replaces the Hauling skill, (b) it replaces Prospecting, or (c) 1.0 grows to 9 skills. **Recommendation: (a).** Hauling already lives in Logging as a mini-game and was on the cut line. The slice becomes Logging and Fishing, then Sawmilling and Raising.
2. **Do structures reset at Fishing close camp?** **Recommendation: yes, with half the items back as salvage.** That matches "strip the outpost," keeps Logging drops useful, and leaves permanent buildings as meta rewards.
3. **Separate cash per camp?** **Recommendation: yes.** Shared cash lets one big Logging run buy out every new camp.
