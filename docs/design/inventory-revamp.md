# Inventory revamp: item icons and the Warehouse screen

**Status: Proposal for the owner.** *Design reviewer, 2026-10-28. Owner request: "An inventory revamp to include placeholder art for items to communicate more visually." Builds on `prime-timber-drops-inventory.md`, `sawmill-camp.md`, `species-overhaul.md` and `fishing-camp.md`. Written to fit the parallel UI rework (left sidebar, top bar, Warehouse and Shop screens in the Melvor style). Mockup: `docs/design/inventory-mockup.html` (open it in a browser; it has light and dark themes and a phone view).*

## For the owner: what changes

Today the warehouse is a list of text rows. After this change it is a **grid of item pictures**, like Melvor's bank. Each item has its own small picture: a long pale pole for a Prime spar, an amber drop for pitch, a brass marker on a post, a bronze deadeye for a ship's fitting, a smoky lens for fog-glass. A Prime item may carry a small **P** on its picture, the grader's mark (decoration only; the diamonds show the tier).

- **Tier at a glance** (superseded by `resource-names.md`, owner 2026-10-28). One diamond system: Common grey 0 diamonds, Good green 1, Fine blue 2, Prime yellow 3, Rare orange 4. The tier is also written out, so colorblind players lose nothing.
- **Tap a picture** to see what it is, how many you have, what it sells for, which orders and buildings need it, and where it comes from. Sell one, sell the spares, or lock it so it is never sold.
- **Tabs** split the warehouse: All, Prime, Finds, Lumber, Logs, Collection. The Collection tab shows every item in the game; ones you have not found yet are dark shapes with a question mark.
- **The same pictures show up everywhere**: in the "new find" pop-ups, on order cards ("Admiralty needs 2 more" next to a spar picture) and on building costs.
- **These pictures are placeholders.** They are drawn by the game's own code, not by an artist, so they cost nothing and can be replaced one at a time later. The Steam page and trailer still need art drawn by a person.

## 1. Item catalog

23 items, 9 bulk stocks counted in board feet, and tanbark, which stays cash. **Live** = in `packages/core/src/items.ts` today. **Planned** = comes with species slice 3 or the Sawmill's later builds. **Fishing** = stub for the Fishing camp.

**Stack rules (all items):** one slot per item, no slot limit and no stack cap (an idle player's bank never fills overnight). Counts are whole numbers. Items belong to the company and survive every close camp. Sale price = base × √(TRACT_BASE[era] ÷ 60), paid to Logging's cash (unchanged). New sell values below are starting values; the balance agent holds item sales under 5% of an outpost's earnings.

### Prime timber (tab: Prime)

| Item | Id | Rarity | Sell | Uses | Comes from | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Prime spar | `logging.prime_spar` | Made | $40 | Admiralty and other orders; mill pond, circular saw, edger and other structures; a Prime log at the mill | Perfect falls (pine 1, spruce 3, hemlock 1), clean grade 1 cuts, idle crews about 1 tree in 50 | Live |
| Prime maple | `logging.prime_maple` | Made | $60 | Company House floor and cornerstone orders; Planing mill | Perfect falls on maple (2 in Winter), from Steam Camp | Planned |
| Prime oak | `logging.prime_oak` | Made | $70 | Cooperage and cornerstone orders; Planing mill | Perfect falls on oak (2 each), *Stave bolter*, from Diesel Road | Planned |
| Redwood heartwood | `logging.cloudwood_heartwood` | Rare | $200 | Landfall cornerstone; Landfall City; collection | A perfect fall on a giant redwood, Into the Interior | Planned |
| Prize fish | `fishing.prize_fish` | Made | $45 | Fishing orders | Top results landing a large or giant fish | Fishing |

### Finds (tab: Finds)

| Item | Id | Rarity | Sell | Uses | Comes from | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Burl | `logging.burl` | Common | $30 | Drying yard, smokehouse, Company House floor; collection | Felling and bucking games; idle | Live |
| Amber pitch | `logging.amber_pitch` | Common | $12 | Admiralty and Perseverance orders; mill pond, steam engine house | Bucking game (pine ×2); idle | Live |
| Survey marker | `logging.survey_marker` | Uncommon | $18 | Perk reroll (2 per outpost); filing room | Skid game | Live |
| Ship's fitting | `logging.ships_fitting` | Uncommon | $22 | Perseverance and cooperage orders; circular saw, edger | Haul game | Live |
| Fog-glass | `logging.fog_glass` | Rare | $90 | Filing room, Lantern Bluff order; collection | Top results in felling, skid and haul | Live |
| Lost axe-head | `logging.lost_axe_head` | Common | $8 | Collection (6 maker's marks); future Smithing scrap | Felling and skid games | Planned |
| Petrified knot | `logging.petrified_knot` | Rare | $110 | Landfall cornerstone; collection | Felling and bucking, Into the Interior | Planned |
| Tramp iron | `sawmill.tramp_iron` | Common | $4 | Landfall pier order; future Smithing | Saw boards; idle sawyers | Planned |
| Spalted board | `sawmill.spalted_board` | Uncommon | $35 | Collection | Saw boards; idle sawyers | Planned |
| Birdseye figure | `sawmill.birdseye` | Rare | $150 | Landfall order; collection | A Clear maple board through a figure cell | Planned |
| Glass float | `fishing.glass_float` | Common | $10 | Collection | Fishing games | Fishing |
| Drowned chart | `fishing.drowned_chart` | Uncommon | $18 | Perk reroll; survey launch order | Net game, Deep Gully | Fishing |
| Fog pearl | `fishing.fog_pearl` | Rare | $90 | Stands in for fog-glass; collection | Top results in fog | Fishing |
| Ambergris | `fishing.ambergris` | Rare | $250 | Collection | Top results, Deep Gully | Fishing |

### Lumber and goods (tab: Lumber)

| Item | Id | Rarity | Sell | Uses | Comes from | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Quarter-sawn board | `sawmill.quarter_sawn` | Made | $25 | Quarter-sawn deck order; future Raising | A great Saw boards run on a Prime log | Live |
| Plank bundle | `sawmill.plank_bundle` | Made | $10 | Bunkhouse; Landfall pier; Fishing jetty and dories | Common lumber at the Sawmill (500 bd ft each) | Live |
| Redwood beam | `sawmill.cloudwood_beam` | Made | $120 | Landfall orders; Landfall City | The Beam cut on a redwood log | Planned |
| Smoked ration | `fishing.smoked_ration` | Made | $3 | Logging wages ×0.85 while stocked; victualling order | The smokehouse | Fishing |

### Bulk stocks (counted in bd ft, not sold from the warehouse)

| Stock | Id | Tab | Where it lives | Stays at close camp |
| --- | --- | --- | --- | --- |
| Pine, Spruce, Hemlock, Maple, Oak, Redwood logs | `company.logs.<species>` | Logs | The company log pond, fed by the Logging slider and send toggles | Yes |
| Clear, Select, Common lumber | `sawmill.lumber.<grade>` | Lumber (read-only strip) | The Sawmill camp's lumber yard | No (resets when the mill closes camp) |

Log grades (No. 1–3) and pulp are not stocked: pulp sells at the landing, and the only log grade worth keeping is Prime, which is already an item. Today the pond is one number (`S.bulk.logs`); it splits by species with species slice 2 (`bulk.logsBy`). Until then the Logs tab shows one "Logs" card with the pine icon.

### Not an item

**Tanbark** (hemlock bark in Spring and Summer) stays cash, as the species design says. It gets an icon for the pay toast and the ledger line only (see owner question 3).

## 2. The placeholder icon system

**Style in one paragraph.** Each icon is a small engraving-style drawing on a 48×48 grid: one dark sepia ink outline (2 px, round joins) around flat fills from a muted 1890 coast palette (bark browns, heartwood amber, brass, verdigris bronze, fog grey-blue, sea-glass green), with a few thinner detail strokes at 70% for grain, rings and swirls. No gradients, no text except the badges. Icons look the same in light and dark themes, the way drawn art would; only the tile behind them changes. Every item is built from three parts: a **glyph** (the shape), a **tint** (species or material color) and an optional **badge** in the top-left corner.

### Parts

| Part | Values |
| --- | --- |
| Glyphs (22) | `spar` (Prime spar), `log` (Prime maple, Prime oak; bark pattern by species), `disc` (heartwood), `pile` (bulk logs), `board` (figure: clear, knots, quarter, spalt, birdseye), `bundle` (plank bundle; no straps + knot count for lumber grades), `beam`, `burl`, `drop`, `marker`, `deadeye`, `lens`, `axehead`, `knotstone`, `barkstrip`, `spikes`, `fish`, `float`, `chart`, `pearl`, `ambergris`, `parcel` |
| Tints | Species: pine, spruce, hemlock, maple, oak, redwood (each with base, light, dark and bark colors). Materials: amber, brass, bronze, fog, iron, stone, paper, silver, seaglass, pearl, wax, bark |
| Bark patterns | pine plates, spruce scales, hemlock furrows, maple smooth, oak blocks, redwood fibers. Species never rely on color alone; the name is always on the card or in the label |
| Badges | `prime`: small **P** on the icon (Prime timber, Prize fish), decoration only. The `q` and `grade` badges are cut: Prime boards and board tiers show diamonds |

### The tile around the icon

| Element | Rule |
| --- | --- |
| Tile | 56 × 56 px, rounded 6 px, warm paper well (`--tile`, `--tile-hi`; darker in the dark theme) |
| Tier frame | Diamonds on the top edge; frame weight grows with tier. Common: 1 px grey, 0. Good: 2 px green, 1. Fine: 2 px blue, 2. Prime: 3 px yellow, 3. Rare: 3 px orange plus a thin outer ring, 4. Tokens `--r-common`, `--r-good`, `--r-fine`, `--r-prime`, `--r-rare`, light and dark (values in `resource-names.md` §1). Firewood and scrap: dashed grey, no diamonds |
| Count | Bottom-right, mono numerals on a panel chip (1.2K style). A zero count shows muted |
| New | Dark ink dot, top-right (orange is reserved for Rare). Cleared per item when the player opens that item |
| Needed | "!" ring on the left edge when an open order or an unbuilt structure needs the item |
| Locked | Padlock chip, bottom-left |
| Not found (collection) | The same icon drawn as a flat silhouette at 25% (a CSS filter, so it also works on drawn art later), with a "?" |
| Sizes | 24 px (toasts, order cards, building costs), 48 px (grid), 96 px (detail pane) |

**Accessibility.** Every tile is a button whose label names the item, its rarity, its count and its states ("Prime log, Prime tier, 14 held, needed for an order or building"). Tier is shown by frame color, frame weight and diamond count, and written in the detail pane. Needed, new and locked each have a shape, not only a color. Arrow keys move between tiles. Silhouettes are labelled "Not found yet".

**Replacing with drawn art.** Every item has one icon key, its item id. `ICON_ART[key]` (an SVG string or an image path) overrides the generated icon; nothing else changes. Artists can replace icons one at a time, and the frame, badges, states and silhouettes keep working.

**Placeholders only.** These icons are for the game screens during Early Access. The store-page plan (`docs/launch/steam-store-page-draft.md`) still needs human-made art for the capsule, key art and the trailer; do not use these generated icons as marketing art.

## 3. The Warehouse screen

It is the Warehouse entry in the new sidebar (with a count of new items), and it replaces today's warehouse sheet. On a phone it is a full screen.

**Header.** "Warehouse", then "58 items · 3 new. Shared by every camp. Stays when you close camp." On the right, **Sell spares · $796**, with the line "Keeps what orders and buildings need, and anything locked." This stays one tap, so idle players never need the grid.

**Tabs** (with counts): All · Prime · Finds · Lumber · Logs · Collection. All groups by category. Tabs scroll sideways on a phone; the current tab is underlined.

**Tools** (All, Prime, Finds and Lumber): a search box ("Find an item"), Sort (Group, Name, Count, Value, Rarity) and filter chips (Needed, New, Spare, Locked; one at a time). On a phone the chips fold behind a **Filter** button.

**Grid.** Item tiles in rows, 5 across on a 360 px phone. Only items you hold show in the stock tabs; the Collection tab shows everything.

**Detail pane** (right column on wide screens, a bottom sheet on a phone):
- 96 px icon, name, rarity (pips and word) and skill.
- Facts: You have, Sells for, Needed, Spare.
- One-line description.
- **Needed for:** each open order ("Admiralty spar order 2") and each structure still to build ("Edger (to build) keep 3").
- **Comes from** and **Used for**.
- Buttons: **Sell 1 · $40**, **Sell spare (9)**, **Sell all**, **Lock**. Sell all on an item that orders or buildings need asks again on the page ("5 are needed for orders or building. Tap again to sell all 14.") Locked items cannot be sold and auto-fill skips them.

**Logs tab.** Wide cards, one per species in the pond: icon, "Pine logs", "18.4K bd ft", one line on what the mill makes of it. A note: "Logs are not sold here. The Sawmill saws them; Logging sells the rest at the cove." Tapping a card shows the stock and points to the send toggles on the Logging page.

**Lumber tab.** Lumber items as tiles, then a read-only strip "Lumber yard · Sawmill camp" with Clear, Select and Common in bd ft, marked "resets at mill close". Selling lumber stays on the Sawmill page.

**Collection tab.** One section per category with "7 of 10" and a progress bar. Found items show their lifetime count; the detail shows first found, lifetime total and held now. Unfound items show the silhouette, the rarity, and "Turns up in: the skid game" (owner question 2).

**Moves out of the warehouse** (coordinate with the UI rework): the **Almanac** becomes its own sidebar entry; the **Ledger** opens from the top bar's cash or shares; the **save backup** goes with the Ledger or a Settings screen.

## 4. Data model changes (`packages/core`)

```ts
// packages/core/src/icons.ts (new): pure, no DOM, testable in node
export type IconGlyph = 'spar' | 'log' | 'disc' | 'pile' | 'board' | 'bundle' | 'beam' | 'burl' | 'drop' | 'marker'
  | 'deadeye' | 'lens' | 'axehead' | 'knotstone' | 'barkstrip' | 'spikes' | 'fish' | 'float' | 'chart' | 'pearl' | 'ambergris' | 'parcel';
export type IconTint = SpeciesTint | 'amber' | 'brass' | 'bronze' | 'fog' | 'iron' | 'stone' | 'paper' | 'silver' | 'seaglass' | 'pearl' | 'wax' | 'bark';
export interface IconSpec {
  readonly glyph: IconGlyph; readonly tint: IconTint;
  readonly badge?: 'prime' | 'q' | 'grade'; readonly badgeText?: string;
  readonly pattern?: 'plates' | 'scales' | 'furrows' | 'smooth' | 'blocky' | 'fibrous';
  readonly figure?: 'clear' | 'knot1' | 'knots' | 'quarter' | 'spalt' | 'birdseye';
  readonly knots?: number; readonly straps?: boolean;
}
export const ICON_TINTS: Readonly<Record<IconTint, { b: string; l: string; d: string; bark?: string }>>;
export const ICON_ART: Record<string, string>;            // drawn-art overrides by key; empty for now
export function iconSvg(key: string, spec: IconSpec, label: string): string;   // the mockup's iconSvg, as is

// items.ts
export type ItemCategory = 'prime' | 'find' | 'mill' | 'goods';   // 'goods' = made goods of later camps (smoked ration)
export interface ItemDef { /* existing fields */ readonly icon: IconSpec }   // required: a test fails if any item lacks one
export interface BulkDef { readonly id: string; readonly name: string; readonly tab: 'logs' | 'lumber';
  readonly scope: 'company' | 'camp'; readonly icon: IconSpec; readonly desc: string }
export const BULK: readonly BulkDef[];
```

- The glyph code in the mockup's first script block is written to move into `icons.ts` unchanged (string building only).
- Tests: every `ITEMS` and `BULK` entry has an icon whose glyph and tint exist; `iconSvg` returns one `<svg viewBox="0 0 48 48">` with the label; an `ICON_ART` entry replaces the output.
- **Save (`timberline-v2`), merged with defaults:** `unseen: Record<ItemId, number>` (default `{}`; per-item new dots; the old `newCount` becomes the sum and is migrated by marking every held item unseen once), `ui.whTab` (old values `stock` → `all`, `log` → `collection`), `ui.whSort: 'default'`, `ui.whFilter: null`. Nothing about items, counts, locks or orders changes, so no balance change.

## 5. Build plan

**Slice 1: pictures everywhere, grid warehouse (smallest version that proves it).**
1. `icons.ts` with the 22 glyphs, and an `icon` on the 8 live items plus the single log pond.
2. The Warehouse as an icon grid with tabs All, Prime, Finds, Lumber, Logs, Collection; the tile states (count, new, needed, locked); the detail pane and phone bottom sheet; Sell 1, Sell spare, Sell all with the inline confirm, Lock, and Sell spares. Existing sell and lock logic is reused as is.
3. Collection with silhouettes and category progress.
4. 24 px icons in find toasts, order cards and structure costs.
5. Tests: icon coverage, a jsdom smoke test of the grid and detail, an old-save load. QA checks phone layout and both themes.

It works in today's warehouse sheet and moves into the new shell's Warehouse screen when the UI rework lands. *Playtest question: "Without reading, can you tell which items are rare and which ones an order needs?"*

**Slice 2: finding things in a big bank.**
Search, sort and filter chips; arrow-key grid movement; the Logs tab per species (with species slice 2's pond); the lumber-yard strip; collection achievements, one per full category (the balance agent checks the 20-minute gap); the `ICON_ART` hook with a sample swap. Every planned item ships with its icon when its feature ships, and the coverage test enforces it.

**Cut from both:** bank tabs the player can arrange, item stacking limits, bank slots, drag-to-sort. Unlimited slots stay (an idle player's bank must never fill).

## 6. Owner questions

1. **Rare items in violet instead of red.** ~~Recommendation: violet.~~ **Superseded (owner, 2026-10-28):** Rare is orange with 4 diamonds, Prime is yellow with 3; red still means "bad". See `resource-names.md` §1.
2. **What the collection shows for unfound items.** (a) A dark silhouette plus which game it turns up in, or (b) only "???". **Recommendation: (a).** It gives players a goal ("something rare hides in the skid game") without spoiling the item.
3. **Tanbark stays cash.** Making it an item would add a sell step and touch the hemlock balance. **Recommendation: keep it cash** and give it an icon only in its pay toast and the ledger.
