# Species overhaul: every tree a decision

**Status: Proposal for the owner.** *Design reviewer, 2026-10-25. Builds on `prime-timber-drops-inventory.md` and `sawmill-camp.md`. All numbers are starting values for the balance agent. Domino fall is not changed without the owner (decision of 2026-10-24); see question 1.*

## For the owner: what changes

Today the six trees are nearly the same tree with different price tags. A later species is simply better, and once wood is felled the game forgets what it was. After this change, each species is good at one thing and bad at another, and the game remembers the species all the way to the mill:

- **Some trees fell fast but are heavy to move.** Others are light but cheap. If your camp has lots of fallers and few teams, you buy different land than a camp that has lots of horses.
- **Each mini-game reads the tree in front of you.** Spruce catches the wind. Maple leans. Hemlock is brittle and rotten at the butt. Oak is slow to saw but forgiving. A giant cloudwood takes a careful lay. The game shows each rule on screen as you play.
- **Some wood is worth more as logs and some as boards.** You choose which species float down to the Sawmill and which you sell straight off the landing.
- **Charter orders ask for particular wood.** The Admiralty wants spruce spars, the cooperage wants oak, and the city wants cloudwood beams.
- **The land office shows what each lot is good for,** so you choose land by what you want to cut.

| Species | Where and when | How common | Identity in one line |
| --- | --- | --- | --- |
| **Fogbound pine** | Coast bottoms, from Cove Landing | Common | The honest all-rounder: good logs, good boards, and amber pitch |
| **Shore spruce** | Spruce headlands, from Cove Landing | Common | Light, fast and cheap by the foot. Lay one perfectly and it is the Admiralty's spar tree |
| **Mist hemlock** | Hemlock swamps, from Cove Landing | Common | Cheap land, rotten butts, heavy to move, and tanbark money in peel season |
| **Glacier maple** | Glacier benches, from Steam Camp | Uncommon | The winter hardwood: fell it frozen, then saw it for flooring and birdseye figure |
| **Hot-spring oak** | Hot-spring basins, from Diesel Road | Uncommon | Heavy as iron. Worth twice as much as boards, and the cooperage pays for short clear bolts |
| **Giant cloudwood** | Giant groves, Into the Interior | Rare | One tree is a week's work. A perfect lay makes heartwood and the city's beams. A bad lay shatters it |

The names stay the same. They already sound like Outpost Company, and players have learned them. Inside the code, `walnut` becomes `cloudwood`, and old saves convert on their own. A seventh tree, **Ghost cedar** (light, rot-proof wood for pilings, shingles and dories), fits best with the Fishing camp (question 2).

---

**Scope boundary.** This doc covers species traits that depend on the season: hemlock's peel season, maple's Winter felling and the basin that never freezes. Events rolled at a season change, weather perks and weather charter upgrades belong to `seasonal-events.md`, which is being written in parallel. Check *Frost feller* and the season factors against that doc when it lands.

## 1. Design rule

**Same-era species land within ±10% on net value per unit of camp work, but each one loads a different stage.** Only cloudwood breaks that rule, on purpose: it is a rare jackpot, about 2.2× on net, and it costs a lot of land money and felling time. *Net value per work* is the tree's value minus its land price, divided by a labor index of 3 × chops + 0.25 × bf + 0.77 × bf × weight (the labor index uses Cove crew upkeep per unit of rate). The decision comes from the shape of your camp and the season, not from a bigger number.

## 2. Stats (Cove Landing dollars; era scale still comes from tract size)

| | Pine | Spruce | Hemlock | Maple | Oak | Cloudwood |
| --- | --- | --- | --- | --- | --- | --- |
| Chops to fell (`hp`), today → new | 20 → 20 | 16 → **14** | 22 → **16** | 28 → **26** | 32 → 32 | 30 → **140** |
| Board feet per tree | 200 | 160 → **180** | 220 → **240** | 260 → **240** | 300 → **280** | 280 → **1,200** |
| bf per chop (felling ease) | 10 | 12.9 | **15** | 9.2 | 8.8 | 8.6 |
| Sawlog share | .75 | .60 → **.45** | .50 → **.45** | .55 → **.60** | .60 → **.65** | .70 → **.80** |
| Sawlog $/bf | .25 | .23 → **.24** | .18 → **.20** | .42 → **.36** | .52 → **.40** | 1.40 → **.70** |
| Pulp $/bf | .06 | .07 → **.09** (best pulp) | .06 → **.08** | .05 | .05 → **.04** | .04 |
| Value per tree | $40.5 | $28.4 | $32.2 (+$14 tanbark in Spring and Summer) | $56.6 | $76.7 | $682 |
| **Weight** (new; skid and haul move bf ÷ weight) | 1.0 | **0.8** | **1.1** | **1.35** | **1.6** | **1.4** |
| Season | none | none | Peel season: +$14 a tree in Spring and Summer | Felled in Winter ×1.15, in Spring ×0.85 (sap stain) | none (the basin is warm) | none |
| Prime from a perfect fall | 1 Prime spar | **3 Prime spars** | 1 Prime spar | 1 Prime maple (2 in Winter) | 2 Prime oak | 1 Cloudwood heartwood |
| Board value at the mill per bf sawn (× its log price) | $.44 (1.75×) | $.36 (1.48×) | $.30 (1.58×) | $.74 (2.06×) | $.79 (1.97×) | $1.61 (2.30×) |
| **Net value per work, pine = 100** | 100 | 93, plus the most Prime | 67 off season, **118** in peel season | 96, plus the mill and Winter | 98, plus Prime oak | **221** |

**The trade-offs, in short:**
- **Pine** is the benchmark, the best conifer at the mill, and the pitch tree.
- **Spruce** fells fast and moves light, so it suits a camp short on teams. It is poor as boards and it carries the Admiralty.
- **Hemlock** is the easiest tree to fell and the hardest to move. Its land is the cheapest, because the land office prices logs and ignores bark. It is a seasonal play.
- **Maple and oak** load skid and haul heavily: they need horses, donkeys and rigs, not fallers. They are worth the most when they go to the mill.
- **Cloudwood** loads felling (140 chops a tree) and costs a fortune in land. It pays out only to the camp that can feed it.

At Cove Landing the three conifers are now about 3.5:2.5:3 in value instead of 1.5:1:1, so the cash trap fix (`PUSH_TRACT_SHARE`) still holds. Cloudwood drops from about 4.8× pine to 2.2×. No playtester has reached the Interior yet (question 3).

## 3. Mini-game impact (each rule shows in play)

Each game opens with a one-line species tag in the status bar, for example "Shore spruce: tall and shallow-rooted. The wind pushes it half again as hard." The guide (?) lists the species rules too. Playtest 1's rules still hold: harder means more pay, never a fine.

**Felling (Place a fall)**

| | Wind × | Lean (drawn as an arrow) | Green hinge zone | Back-cut speed | Opening half-width | Fall time | Misses |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Pine | 1.0 | none | 8–20% | ×1 | 10° | 0.9 s | standard |
| Spruce | **1.5** | none | 8–20% | ×1.25 | 10° | 0.8 s | standard |
| Hemlock | 1.0 | none | **10–20%** | ×1 | 10° | 0.9 s | **Brittle:** a rock break loses 60% (not 40%), and a hinge under 5% barber-chairs |
| Maple | 0.6 | **6–14° to one side** | 8–20% | ×0.85 | 9° | 1.0 s | standard |
| Oak | 0.4 | 0–8° | **6–24%** | **×0.7** | 10° | 1.1 s | standard (slow and forgiving) |
| Cloudwood | 1.2 | 0–6° | 8–18% | **×0.5** | **6°** | 2.0 s | Hung −50%, broke −75%. Perfect: +40% value and heartwood |

Mill file and Felling wedges change every species by the same amount. Lean adds to the fall the way wind does, and the gunning stick shows both. Today the game draws the species from the tree on view (`S.vis`), and it keeps doing so.

**Bucking (Plan the cuts)**

| | Stem length | Butt dia. | Min top | Knots | Butt rot | Sweep | Species rule | Length values |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Pine | 38–62 ft | 20–32 in | 8 in | 2–4 | 50%, 2–6 ft | 45% | Pitch pockets: amber pitch drop weight ×2 | 16 ft ×1.15 (today's) |
| Spruce | 44–66 | 16–26 | 8 | 3–5, **top half only** | 20%, 2–4 ft | 20% | Clear butt logs | **16 ft ×1.25** (spar lengths) |
| Hemlock | 36–56 | 22–34 | 8 | 2–3 | **80%, 4–10 ft** | 30% | **Ring shake** (40%): a 4–6 ft band that makes grade 3 | 8–16 ft all ×1.0 |
| Maple | 28–44 | 18–28 | **10** | 1–2 | 30%, 2–5 ft | **65%** | none | **10–12 ft ×1.1** (flooring) |
| Oak | 24–40 | 26–40 | **12** | 1–3 | 60%, 3–8 ft | 40% | **Stave bolts:** a grade 1 piece of 8 ft is ×1.2 | 16 ft ×0.95 |
| Cloudwood | 70–100 | 40–60 | **16** | 1–2 | 25%, 8–14 ft | 15% | **Beam lengths:** 20 and 24 ft become valid | 20–24 ft ×1.3 |

The Scaler's stick length marks already show values. They now read the species table, so the game teaches each rule without a tutorial wall.

**Skidding (Skid a turn):** team speed ×(1 ÷ weight)^0.5 and train swing ×weight. Par comes from that speed, so it stays fair. A heavy turn is harder and moves wood worth more per board foot, so it pays more. The turn's species is drawn from the tract mix, the same way bucking draws it today, and it shows at the pick: "Oak turn: heavy, swings wide."

**Hauling (Drive a load):** the road limit is counted in **pine-log loads**. A log of a given species takes `weight` of a slot, so the limit is spruce 12, pine 10, hemlock 9, maple and cloudwood 7, oak 6. Rig mass follows the slots. The load screen says "Oak weighs 1.6 logs each: road limit 6." Overload artist counts slots, not logs.

**Saw for grade:** see section 6.

## 4. Charter orders

**Regular delivery contracts.** One order in three becomes a **species order**. It names a species in your current tract or on the land office board. Only that species' share of each delivery counts toward it (delivery × its mix weight). It pays a +30–55% premium, against +15–40% for "any wood", and **a missed species order costs nothing**. The client fits the wood:

| Species | Client and line |
| --- | --- |
| Spruce | the Admiralty spar yard: "long straight spruce" |
| Pine | the Company shipwrights: "pine for planking" |
| Hemlock | Landfall Pier Works: "hemlock for pilings and pier decking" |
| Maple | Harbor Planing Mill: "maple for flooring" |
| Oak | the Cove cooperage: "oak for staves" |
| Cloudwood | the Landfall City works: "cloudwood beams" |

**Special orders** (the warehouse board). Two open at most, deadlines count outposts, missed orders return with no penalty, and the +25% bonus cap stays.

| Order | Opens | Needs | Reward | Change |
| --- | --- | --- | --- | --- |
| Admiralty spar order | First Prime spar | 16 Prime spars, 2 amber pitch | +15%, *Spar man* | Kept. Spruce tracts now fill it fastest |
| Caulk the *Perseverance* | First pitch and first fitting | 6 amber pitch, 3 ship's fittings | +8%, *Pitch boiler* | Kept. Pine bucking finds the pitch |
| Company House floor | Steam Camp, first Prime maple | 8 Prime maple, 2 burls | +12%, unlocks *Frost feller* | New |
| Cove cooperage | Diesel Road, first Prime oak | 10 Prime oak, 4 ship's fittings (hoops) | +12%, unlocks *Stave bolter* | New |
| Landfall cornerstone | Into the Interior | 4 Cloudwood heartwood, 6 Prime maple, 6 Prime oak, 2 petrified knots | +25%, a building on the Landfall screen | Now asks for each hardwood by name |
| *Sawmill:* Quarter-sawn deck | Sawmill, first Quarter-sawn oak | 12 Quarter-sawn boards **from oak**, 6 Prime spars | +15% Sawmill shares | Replaces the generic Admiralty deck planking |
| *Sawmill:* Landfall pier | Sawmill, Steam Mill era | 20,000 bf hemlock beams, 10 plank bundles | +12% Sawmill shares | Now hemlock |

## 5. Perks

**New perks** (they change rules; commons stay as numbers):

| Perk | Rarity | Rule |
| --- | --- | --- |
| *Frost feller* | Rare (from Company House floor) | Maple and oak felled in Winter get the perfect-fall +25% even when crews fell them, and Winter felling no longer slows. Spring felling ×0.8 |
| *Stave bolter* | Rare (from Cooperage) | Bucking oak: every grade 1 piece of 8 ft is a stave bolt at ×1.5. A score of 90% or better stamps 1 Prime oak. Idle oak bucking ×0.9 |
| *Bark peelers* | Rare | Hemlock tanbark pays all year, but hemlock stems lose their sawlog value (all pulp) |
| *Light rigging* | Rare | Haul game: every log takes one slot, whatever its weight. Heavy loads handle like pine |
| *Spar tree* | **Legendary** | Once per tract, the tallest spruce is rigged as a high-lead spar tree. For the rest of the tract, skidding ignores slope and weight, both idle and in the skid game |
| *Unsurveyed ground* | **Curse** | Land office listings hide their species ("mixed wood, unsurveyed") until you buy, but cost 30% less |
| *Hardwood buckers* | Common | Bucking ×1.3 on maple and oak tracts |

**Existing perks with species:**
- *Domino fall* chains count trees, so on cloudwood one chain is worth roughly 6 to 7 times as much as a chain on pine. **This must not change without the owner** (question 1).
- *Overload artist* counts weight slots (above).
- *Spar man* covers every conifer, and spruce is now its best target.
- *Pitch boiler* works best on pine.
- *Widowmaker's luck* has more barber chairs to save on hemlock.
- *Greased runners* also lets heavy logs slide through mud, so it pairs with oak.
- *Hot saw* is unchanged (its tree count already divides by chops).
- *Timber cruiser* scales every species alike.

**Sawmill perks:** *Ray fleck* (rare) makes Quarter-sawn oak from every face. *Pond monkey* now puts Prime logs and then the best-value species first.

## 6. The Sawmill by species

The mill **saws sawlogs only**: the pond takes delivery × sawlog share, and pulp is sold. The **pond keeps a stock per species**.

| | Idle mix Clear / Select / Common | Board price × | Saw speed × | $ per sawyer-minute (index) | Saw for grade rule | Product |
| --- | --- | --- | --- | --- | --- | --- |
| Pine | 20 / 35 / 45 | 1.0 | 1.0 | .44 | Hidden pitch pockets drop amber pitch | Planks |
| Spruce | 30 / 30 / 40 | 0.75 | **1.3** | .47 | Wide Clear rim. Only 25% of knots are hidden (not 50%). Saw time 0.45 s | Light planking |
| Hemlock | 10 / 30 / 60 | 0.8 | 1.0 | .30 | Hidden **shake ring**: boards crossing it are Common | Plank bundles at 400 bf (not 500), pier beams |
| Maple | 25 / 35 / 40 | 1.6 | 0.7 | .52 | Hidden figure cells in the rim: a Clear board through one is a **Birdseye figure** | Flooring |
| Oak | 20 / 35 / 45 | 1.8 | 0.6 | .47 | **Every Clear board after the first turn is Quarter-sawn** (×2), so turning early pays | Quarter-sawn oak |
| Cloudwood | 40 / 35 / 25 | 3.0 | 0.5 | .81 | A **Beam** button saws a heart cant of 4 cells or more as one beam | Cloudwood beam (city) |

**Log slider and pond.** The slider keeps one share. Under it sits a row of species toggles: **"Send to the mill: pine · spruce · hemlock · maple · oak · cloudwood"**. All are on by default, and each shows its "×1.75 as boards" figure. Turn spruce off and sell it as pulp; send oak and sell hemlock. The mill still pays half price for the logs it takes. **Saw order:** "Best value per hour" (default, so idle players never set it), "Bundles first" (hemlock first, while the bunkhouse needs bundles), or by hand. Cove buying stays and buys pine.

The oak tension is real: the mill pays almost twice as much for it, but it saws at 0.6× speed. Sawyer time becomes the mill's bottleneck, and that is where new sawyers and structures go.

## 7. Prime timber and finds by species

| Species | Perfect fall | Bucking (score ≥ 90%) | Idle crews (today's 2% rule) | Species find |
| --- | --- | --- | --- | --- |
| Pine | 1 Prime spar | grade 1 ≥ 12 ft | Prime spar | Amber pitch ×2 weight |
| Spruce | **3** Prime spars | grade 1 ≥ 14 ft | Prime spar | none |
| Hemlock | 1 Prime spar | grade 1 ≥ 12 ft | Prime spar | none (tanbark is cash) |
| Maple | 1 Prime maple (2 in Winter) | grade 1 ≥ 10 ft | Prime maple | Burl ×2 weight; Birdseye figure at the mill |
| Oak | 2 Prime oak | 8 ft stave bolt, with *Stave bolter* | Prime oak | none |
| Cloudwood | 1 Cloudwood heartwood | grade 1 beam length | heartwood at one tenth of the chance | Fog-glass ×2 weight |

The average Prime per perfect fall at Cove stays 1.67 ((1 + 3 + 1) ÷ 3), so Admiralty pacing holds. "Prime hardwood" was never built, so it splits into **Prime maple** and **Prime oak** at no save cost.

## 8. Tract listings

Every listing gets a **ground** that sets its mix and its twist:

| Ground | From | Mix | Twist |
| --- | --- | --- | --- |
| Coast bottoms | Cove | Pine 60–80%, rest spruce or hemlock | none |
| Spruce headlands | Cove | Spruce 60–90%, rest pine | Felling-game wind ×1.2 |
| Hemlock swamp | Cove | Hemlock 60–90%, rest spruce | Flat or rolling only; land ×0.9 |
| Glacier bench | Steam | Maple 40–80%, rest spruce or pine | Rolling or steep |
| Hot-spring basin | Diesel | Oak 40–80%, rest maple or hemlock | Never freezes: no Winter felling slowdown and no Winter skid or haul bonus |
| Giant grove | Interior, 1 listing in 6 | Cloudwood 15–30%, rest spruce or hemlock | Trees ×0.15 (giants), price as usual |

Older grounds stay in later eras, with the existing 30% older-tier roll. **The listing card** shows the ground name, a species bar with percentages, value per tree, chops per tree, a weight tag ("Heavy: skid and haul ×0.7"), a "best for" line (Prime spars / boards / pulp / tanbark), and a **camp fit** hint. The hint compares your felling capacity with your skid and haul capacity: "Your fallers are ahead: heavy wood suits this camp." The land price stays at 42% of gross **log** value, so tanbark, mill premiums and Prime are what a sharp buyer gets for free.

## 9. Balance guardrails and sim needs

- **The CLAUDE.md targets hold:** active vs casual 1.5–2×, the idle player closes camp every run, run 2 is 25–40% faster than run 1, no gap over 20 minutes, no soft-locks.
- **Same-era net value within ±10%** on a year average (cloudwood ≤ 2.3×). The balance agent checks this with the bot, not just the index.
- **Choosing land is not a mini-game.** The idle bot picks by "best value per work for my camp", so species decisions help idle and active alike, and the active ratio should barely move. The risks to watch are cloudwood (bad lays lose up to 75%) and the oak Quarter-sawn rule.
- **The mill pond gets about 45% less** at Cove (the sawlog share averages 0.55). Pond flow per Logging delivery must stay within 10% of today's, so the balance agent should first raise `MILL_SHARE_DEFAULT` from 10% to 15–20% or lower `MILL_CLOSE_BF`, keeping the rule that the slider must not starve Logging.
- **No species can soft-lock.** Every era lists at least one light or average-weight ground, and the push-tract guarantee still applies.
- **Idle has every source:** idle Prime by species, tanbark in idle, and species orders that are free to miss.

**The bot must model:** species stats and weight (skid and haul ÷ weight), grounds and the new `genTract` draws, the season factors (tanbark, maple), Prime by species, species contracts (share counting, no penalty), the per-species pond, the sawlog-only intake, saw order and toggles, the per-species mill mix, speed and price, and a tract-choice policy per profile. Report a per-species share of the wood cut by profile, Prime per outpost by species, special orders filled, and the standard targets. **Re-record the baseline:** the draw order changes.

## 10. Data model and saves

```ts
export type SpeciesId = 'pine' | 'spruce' | 'hemlock' | 'maple' | 'oak' | 'cloudwood';
export const SPECIES_ALIAS: Record<string, SpeciesId> = { walnut: 'cloudwood' };
export interface SpeciesDef {
  name; hp; bf; saw; sawP; pulpP; shape: 'con' | 'dec';          // existing
  wt: number;                                                   // skid/haul weight
  season?: Partial<Record<Season, number>>; bark?: number;      // maple; hemlock $ per tree in Spring/Summer
  fell: { wind: number; lean: [number, number]; hinge: [number, number]; cut: number; half: number; fallS: number; rockLoss?: number; hungLoss?: number; perfect?: number };
  buck: { L: [number, number]; d0: [number, number]; top: number; knots: [number, number]; knotsTopHalf?: boolean;
          rot: [number, number, number]; sweep: number; shake?: number; lenP: Record<number, number>; extraLens?: number[]; g1Prime: number };
  mill: { mix: Record<BoardGrade, number>; mult: number; speed: number; hiddenKnots: number; rule?: 'pitch' | 'shake' | 'figure' | 'quarter' | 'beam' };
  prime: { item: ItemId; perfect: number; winter?: number };
}
export interface GroundDef { id; name; era; main: SpeciesId; mainW: [number, number]; rest: SpeciesId[]; slopes: SlopeId[]; landMult?; windMult?; noFreeze?; treeMult? }
```

- `Tract` gains `ground` and `wt` (mix-weighted). `makeTract` averages `wt`. `stageRate` divides skid and haul by `wt`. `fellK` applies the season factor and tanbark to `S.stems.val`.
- `Offer` gains `sp?: SpeciesId`. `missedPenalty` returns 0 when `sp` is set.
- The pond changes from `bulk.logs: number` to `bulk.logsBy: Record<SpeciesId, number>`. `deliver()` splits `amt × saw` by the current tract mix (an approximation: the landing does not track species). `millTick` saws by saw order. `genSawLog` takes `species`. `LUMBER_MULT` is multiplied by `mill.mult`.
- `PRIME_RULES` comes from `SPECIES[*].prime`. Add the items `logging.prime_maple`, `logging.prime_oak`, `logging.cloudwood_heartwood` and `sawmill.cloudwood_beam`.
- **Saves (`timberline-v2`):** on load, map `walnut` to `cloudwood` in `tract.mix`, the listings, the hires, `S.vis` and `buckKeep.sp`. A tract without `ground` gets `'coast'`, and its `wt` is recomputed from the mix. `bulk.logs` moves to `bulk.logsBy.pine`. New UI fields (`millSend` toggles, `sawOrder`) merge with defaults. A test should load an old fixture with a walnut tract and a full pond.

## 11. Build plan

**Slice 1: the Cove trio made distinct (round 3 playtest, the first 30 minutes).** New stats and weight for pine, spruce and hemlock, with idle skid and haul ÷ weight. Hemlock tanbark. Coast, headland and swamp grounds with the new listing card and camp fit hint. Felling and bucking rules for the three, shown in play. Prime spar split 1/3/1. Species contracts. The `walnut` migration. Sim support and a balance run. *Playtest question: "Why did you buy the lot you bought?"*

**Slice 2: the mill and the heavy-wood games.** Sawlog-only intake, the per-species pond, send toggles and saw order. The species mill table, and Saw for grade species rules for pine, spruce and hemlock. Weight in the skid and haul games, with *Light rigging*. The Landfall pier in hemlock. *Playtest question: "Which species did you keep from the mill, and why?"*

**Slice 3: hardwoods and the giant.** Maple, oak and cloudwood mechanics in every game. Prime maple, Prime oak and heartwood. Glacier bench, hot-spring basin and giant grove grounds. The Company House floor, the Cooperage, the cornerstone and Quarter-sawn deck orders. *Frost feller, Stave bolter, Spar tree, Unsurveyed ground, Bark peelers, Hardwood buckers, Ray fleck.* The ruling on Domino and cloudwood.

## 12. Owner questions

1. **Domino fall on cloudwood.** Today a chain fells as many trees again. On a 1,200 bf cloudwood that is about 7× a pine chain. **Recommendation:** leave Domino exactly as playtesters have it everywhere, except that a chain stops when it reaches a cloudwood. Nothing changes before the Interior.
2. **Ghost cedar, a seventh species** (light, rot-proof; pilings, shingles, dories). **Recommendation:** add it with the Fishing camp, where it has a job, not now.
3. **Cloudwood's value drops from about 4.8× pine to about 2.2×,** in return for rarity, cost and the shattering risk. **Recommendation:** accept. No player has reached the Interior, so nobody loses anything.
