# Lot stash and camp money

**Status: Proposal for the owner.** *Design reviewer, 2026-10-25. Answers the two owner requests in `reports/2026-10-25-owner-requests.md`. Builds on the round 3 cutting queue (`packages/core/src/queue.ts`), `species-overhaul.md` and `sawmill-camp.md`. Numbers are starting values for the balance agent.*

## In plain language (for the owner)

**A. The stash.** A new **Stash** view lists every tree you own, across all your lots, by species: "Spruce: 412 trees, 98,000 bd ft, $3,100, light, high Prime, fills the Admiralty order." Tap a species to see which lots hold it. Each species has a three-way switch: **Any** (cut it as it comes, the default), **First** (crews go for it first), **Skip** (leave it standing). Crews then move between lots by themselves to find what you asked for.

Cutting one species out of a mixed lot is slower, because the crews walk past the other trees. A lot that is mostly spruce costs almost nothing to pick through; a lot with a little spruce costs a lot. That is the decision: chase the spruce order now, or cut clean and keep the camp fast. If nothing you asked for is left, crews go back to cutting everything, so the camp never stops.

**B. Camp money.** Today the mill gets its logs for nothing and Logging just earns less, which feels like a tax. I recommend **"the mill pays for its logs"**: each camp keeps its own cash, but every log the mill takes is paid for from mill cash, at a fair company price. The mill also posts **log orders** on Logging's charter board ("Mill wants 6,000 bd ft of Oak by fall"), and Logging pays the mill for the plank bundles it uses. Money only crosses camps as payment for real goods, so a rich Logging run still cannot buy the mill outright, but each camp's success now shows in the other's books.

---

## Part A: Lot stash

### A1. What the player sees

The **Stash** sits at the top of the cutting queue panel as a second tab: **Lots** (today's queue) and **Trees** (new). Both read the same data.

| Column (Trees tab) | Example | Source |
| --- | --- | --- |
| Species and tag | Spruce · light | `SPECIES`, `weightTag` |
| Trees and bd ft | 412 · 98k | sum of `leftBy[sp]` over owned lots × species bf |
| Value | $3,100 | species value, this season (tanbark, maple) |
| Work | 3 chops, ×0.8 load | species hp and weight |
| Prime | 1 in 9 | `primePerTree` for that species alone |
| Orders | Admiralty, mill Oak | species orders, special orders and mill orders it serves |
| Rule | Any · First · Skip | the switch (three buttons, one word each) |

Tap a row to open it: the lots holding that species, each with its count, share, slope and miles, and **Cut here** (moves crews, as `cutNow` does today). On a phone it is one card per species, with the switch along the bottom. No scrolling tables.

### A2. The rule

One setting per species, saved for the camp (it survives close camp, like queue mode):

| Rule | Crews do |
| --- | --- |
| **Any** (default) | Fell what the lot holds, in its mix. Today's behaviour exactly |
| **First** | On a lot that holds a First species, fell only those until gone, then the rest of the lot. The queue prefers lots with a First species (new queue mode **By stash**, auto-selected when you set any First) |
| **Skip** | Never fell it. A lot whose only trees left are Skipped counts as cut out and drops to the bottom of the queue, marked "Hemlock left standing" |

Several species can be First: they share the effort in their mix ratio. No ranked list in slice 1; one ordering axis is enough.

### A3. The cost of picking

Selective cutting must cost something, or every player always picks the best tree and mixed lots mean nothing.

> **Picking factor** = 0.5 + 0.5 × (share of the lot's standing trees you are cutting). A lot that is 80% spruce cuts spruce at ×0.9; 20% spruce at ×0.6.

It applies to **felling and skidding** (walking to scattered stems and longer skid trails), not bucking or hauling. It shows in the camp note: "Picking Spruce here: felling and skidding ×0.6." The lot's slope and miles still apply as they do now (`lotRates`). Under **Any** the factor is 1.

The second cost is land: you paid for the hemlock you Skip. The Skip line says "Leaves $420 of timber standing." Skipped trees are lost at close camp, like all lots.

### A4. How it meets the rest of the game

| System | Interaction |
| --- | --- |
| **Queue** | Lot order still rules; the rule only filters which trees fall. **By stash** mode puts lots with the most First trees on top, then value an hour. Manual moves switch to **By hand**, as today |
| **Species orders** | Order credit uses the **cut mix** (what crews are actually felling), not the lot mix. Picking spruce on a 30% spruce lot credits 100% to the spruce order. This is the payoff |
| **Order fit notes** | `orderFit` reads the cut mix and the picking factor, so "Fills about 60% of the Spruce order" stays honest |
| **Idle and AFK** | Default Any never changes idle play. **Fallback:** if no owned lot has a First species standing, crews cut Any until one does, with a note. Skip never strands crews: if only Skipped trees remain everywhere, crews cut them (note: "Out of other wood, cutting Hemlock") rather than sit idle. The AFK lot ignores rules (it is the never-stall lot) |
| **Prime and finds** | Prime comes from the species felled, so First on spruce raises Prime spars. Idle 2% rule unchanged per tree |
| **Mini-games** | The felling game shows a First species tree when one is on the lot. Bucking and skidding draw from the cut mix |
| **Mill** | The pond receives the cut mix (needs the per-species pond from species slice 2; until then it stays one stock) |
| **Auto-buy land** | Not touched. The land office still shows fit notes per listing |

### A5. Data and saves

- Lot gains `leftBy: Partial<Record<SpeciesId, number>>`. On load, a lot without it gets `round(left × share)` per species, remainder to the main species. `left` becomes the sum.
- Felling decrements `leftBy[S.vis]`. `newTree` draws from the **cut mix**: `leftBy` filtered by rules, weighted. `hp`, `bf`, `val`, `wt` of the cut mix replace the lot averages in `lotRates` while picking.
- The landing gets `mix` (a running bd ft per species), so deliveries and orders credit the species actually cut, replacing today's "split by current tract mix" approximation.
- `S.ui.stashRule: Record<SpeciesId, 'any'|'first'|'skip'>`, merged with defaults; queue mode list adds `'stash'`.
- Core: `stashTotals(lots)`, `cutMix(lot, rules)`, `pickFactor(lot, rules)`, pure and tested.

### A6. Sim measures

Idle bot leaves all rules on Any (no change to targets). The casual bot sets First on the open species order's species. Report: species-order fill rate with and without rules, time spent under a picking factor below 0.8, Prime spars per outpost, and **active vs casual must stay ≤ 2×**: rules are menu play, so casual can use them too. Stall check: zero seconds of idle crews caused by rules.

---

## Part B: Sawmill and Logging money

### B1. Today

Separate cash per camp (assumed 2026-10-24, not yet confirmed). The slider sends 10% of deliveries to the pond; Logging is paid half price for that share; the **mill pays nothing**. The mill earns only from lumber. Bundles go to Logging free. So Logging pays for the mill's logs, and neither camp sees the other's money. The link is a tax, not a trade.

### B2. Four models

| | **1. One treasury** | **2. Set the log price** | **3. Head office** | **4. The mill pays (contracts)** |
| --- | --- | --- | --- | --- |
| What the player sees | One cash figure; each camp has a budget bar per season | A price slider: "Mill pays 80% of cove price" | Each camp sends a % of profit to head office; head office funds grants for either camp's structures | Mill cash pays Logging for each log taken; mill log orders on Logging's board; Logging pays mill cash for bundles |
| Decision | Split the budget | Which camp gets the margin | Where to invest the company's money | Which orders to fill; species to cut for the mill; sell logs out or in |
| Close camp | Muddled: whose cash resets? Needs a budget reset rule | Each camp's cash resets alone | Head office survives resets; a third purse | Each camp's cash resets alone; open mill orders carry over, unpaid |
| Anti-buyout | Weak: budget caps are the only wall | Good: transfer is limited by log volume | Needs a per-season grant cap and a match (the camp pays half) | Good: money moves only with goods, at fixed prices, bounded by saw rate |
| Idle | Fine | Fine (default price) | Fine if grants are automatic | Fine: mill pays by default, orders auto-sign |
| Risk | Breaks the reason for separate cash | A knob a sharp player pins to one end; not a fun choice | A new purse sits close to the "no new currency" ruling; most UI | Mill may start cash-poor; needs the crate's cash |

### B3. Recommendation: Model 4, "the mill pays"

It is the only model where money crossing camps always means something happened in the world: logs floated down, planks carted up. It turns the slider from a tax into a sale, ties straight into Part A (mill orders name species), and keeps per-skill prestige clean.

**Rules (starting values):**

| Flow | Price | Paid from | Paid to |
| --- | --- | --- | --- |
| Logs by slider | **0.8×** cove log price (no haul to the cove, so Logging's loss is small) | Mill cash | Logging cash |
| Mill log order (species, 1 open at a time, sized to 15 min of saw rate) | **1.2×** cove log price for that species | Mill cash | Logging cash |
| Plank bundle for the bunkhouse | **$40** each (below lumber value) | Logging cash | Mill cash |

- **If the mill is short of cash**, it takes only the logs it can pay for. The rest is sold at the cove as usual. Logging is never short-paid and never owed. No debts survive close camp.
- **Mill log orders** appear on Logging's charter board as a fifth card, client "Company mill". Missing one costs nothing. They count as species orders for the stash and the fit notes.
- **Slider stays** (0–50%, default 10%). The meta line under it reads: "Mill pays $0.80 per $1 of logs. Last season: +$1,240 to Logging."
- **Ledger strip** shows both camps: "Logging $8,200 · Mill $1,900", plus "Between camps this season: logs +$1,240, bundles −$160."
- **Founding crate** gains $300 of mill cash, so the first logs can be paid for.

**Why a big Logging run cannot buy the mill:** cash only enters the mill by selling lumber or bundles, and the bundle price is capped by bundles still needed. Cash only enters Logging from the mill at the mill's saw rate. A $1M Logging run changes nothing at the mill.

**Prestige:** closing Logging resets Logging cash only; the mill keeps sawing and buying from the cove. Closing the mill resets mill cash; the slider pays Logging nothing until the new mill earns.

### B4. Sim measures

| Measure | Target |
| --- | --- |
| Logging run 1 time vs today's baseline | within ±10% |
| Mill: time to first structure / to edger (idle) | under 5 / under 20 min |
| Mill cash never blocks log intake for more than 5 min (idle) | yes |
| Cross-camp money as a share of each camp's income | 5–20% (visible, not dominant) |
| Buyout test: Logging at $1M, mill gain in 10 min vs a $0 Logging | under +5% |
| Idle closes camp in both camps every run; run 2 vs run 1 per skill | yes; 25–40% |
| Active vs casual, both camps together | 1.5–2× |

---

## Smallest testable versions

**A, slice 1:** `leftBy` per lot with save migration, the **Trees** tab (species, trees, bd ft, value, orders), the Any/First/Skip switch, the picking factor, the fallback, order credit by cut mix, and a smoke test. Leave out: Prime column, By stash queue mode (First already reorders felling within the lot), landing species tracking. *Playtest question: "Did you set a species to First, and was it worth the slowdown?"*

**B, slice 1:** the mill pays 0.8× for slider logs from mill cash, Logging pays $40 per bundle, the crate's $300, and the ledger line. Mill log orders come in slice 2, after the per-species pond. *Playtest question: "Did you watch the other camp's money? Did it change what you did?"*

## Reviewer's notes

- **The risk in A is busywork.** Three buttons per species across six species is the ceiling. If playtesters set rules every few minutes, the picking factor is too soft; if nobody sets them, too hard. The sim's "time under ×0.8" tells us which.
- **Do not add a ranked priority list** until slice 1 shows players want it. First/Skip covers "cut only Spruce" and "skip Hemlock".
- **Model 4 makes the mill poorer early.** That is the honest cost of the mill paying its way. Watch the edger time; the fix is the crate cash or the 0.8×, not the transfer rule.
- **Setting fit is good:** a company mill that buys from its own logging side and a timber cruiser marking "spruce only" are both true to 1890 practice.

## Owner questions

1. **Confirm separate cash per camp,** with money crossing only as payment for logs and bundles (Model 4). **Recommendation: yes.** It keeps the reason for separate cash and fixes the "tax" feel.
2. **Should picking one species cost speed** (the picking factor)? **Recommendation: yes.** Without a cost, the stash rule is always on and mixed lots lose their meaning.
3. **What happens to Skipped trees when the camp runs short of wood?** **Recommendation:** crews cut them anyway with a note, so the camp never stalls. The alternative (truly never) risks an idle stall.
4. **Mill log orders on the Logging board** (slice 2)? **Recommendation: yes,** as a fifth card that is free to miss.
