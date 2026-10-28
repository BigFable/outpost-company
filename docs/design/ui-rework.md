# UI rework: a sidebar game, one screen at a time

**Status: Proposal for the owner.** *Design reviewer, 2026-10-28. Owner request: "A UI rework that is closer to Melvor Idle." Clickable mockup: `docs/design/ui-rework-mockup.html` (open it in a browser; buttons at the top switch desktop/phone and light/dark). Two projects run alongside this one and own their own internals: the inventory revamp (item art, the Warehouse grid's contents) and the rotating perk shop (replaces the draft). This doc only gives them a place on screen.*

## In plain language (for the owner)

Today the whole game is one long page: on a laptop you scroll through about 6 screens of panels, on a phone about 16. Cash shows twice, pop-ups cover the buttons, and the Warehouse is a pop-up list.

After the rework the game looks like the skilling idle games you know, built in our own 1890 style:

- **A sidebar on the left** lists your camps (Logging, Sawmill, later Fishing and the rest), each with its outpost number and a thin bar showing how close it is to closing camp. Under the camps: **Warehouse, Shop, Charter board, Company board, Almanac, Settings.** A small dot on a row means "something here needs you".
- **A top bar** always shows money (each camp's cash, Charter Shares), the season with its weather, the log price, and a **bell** that lists what needs you now (a perk to pick, an order about to run out, wages owed, an empty mill pond).
- **One main screen at a time.** Tap Logging and you see only Logging, split into a few tabs: **Work** (the four stages with progress bars and Play buttons), **Lots** (the land office slots and the cutting queue), **Crews**, **Camp** (era, improvements, bunkhouse, goals) and **Log**.
- **The Warehouse is a grid of item squares** with counts, like a bank. Tap one to see what it is, who needs it, and sell or lock it.
- **The Shop** is a new screen for the rotating perk shop. **The Charter board** gathers every order in one place: special orders, charter orders (several at once), mill log orders and hire jobs.
- **Phones:** the sidebar becomes a row of five big tabs along the bottom (Camp, Orders, Warehouse, Shop, More). The top bar shrinks to cash, season and the bell. Each screen fits in one or two thumb scrolls instead of sixteen.
- **Mini-games** open inside the main area on a computer (the sidebar and top bar stay visible) and full screen on a phone.

We take the conventions only, never their look: no copied art, icons, names, colors or layouts. Ours is a company ledger on a foggy coast: paper and ink in light mode, a lamp-lit night in dark mode, ruled lines, slab-serif titles, our orange accent. The store-page trademark rules (section 6 of `docs/launch/steam-store-page-draft.md`) apply to the UI too: no other game's name anywhere in the build, and no skill icons that imitate theirs.

**Build plan, three slices, each one playable with tests passing:** (1) the frame: sidebar, top bar, bottom tabs, every existing panel moved into a screen unchanged; (2) the camp screens split into tabs, the Charter board, the bell; (3) the Warehouse grid and the Shop screen, joined to the two parallel projects.

**Questions for you** are at the end (section 9).

---

## 1. What we took from the genre, and what we did not

Sources opened: the Melvor Idle wiki pages [Bank](https://wiki.melvoridle.com/w/Bank), [Shop](https://wiki.melvoridle.com/w/Shop), [Mastery](https://wiki.melvoridle.com/w/Mastery) and [Settings](https://wiki.melvoridle.com/w/Settings); Steam discussions [3199240675512402566](https://steamcommunity.com/app/1267910/discussions/0/3199240675512402566) and [4034726898982112460](https://steamcommunity.com/app/1267910/discussions/0/4034726898982112460). The wiki's Woodcutting page and an Epic Games guide would not load; the rest is general genre knowledge.

| Convention | What the sources say | Our version |
| --- | --- | --- |
| Persistent left sidebar of skills with levels | Settings: the sidebar can collapse to icons; it shows skill levels ("Show Virtual Levels") | Sidebar of **camps**, each with outpost number, era and a close-camp bar. Collapses to icons on mid-width screens; becomes bottom tabs on phones |
| One main panel per skill | Each skill has its own page; buttons for skill-specific tools sit on that page (Steam thread: compost buttons "along the top" of Farming; mastery pool spent "on a skill's page") | One screen per camp, with tabs inside it |
| Bank as an icon grid | Bank: items in tabs, new items glow, search filters the tab, clicking an item opens a panel to sell (slider, All but 1, All) and **lock** against accidental sale; a bulk "sell mode" | Warehouse grid with filter chips, search, a "new" glow, a side panel (bottom sheet on phone) with Sell 1 / Sell all / Lock. We already have lock and "Sell spares" |
| Shop screen | Shop: grouped sections (general upgrades, skill upgrades), each item with requirement, cost and bonus | Shop screen with a section per camp; the rotating perk shop fills it |
| Small notifications | Settings: small notifications when items or money arrive; level-ups can be a small notice or a big pop-up | Small, top-right, never over a sheet or mini-game; anything that needs action goes into the bell list |
| Compact progress bars, tooltips | Mastery: per-skill progress and a pool shown on the skill page; Settings: hover for a short description | Thin bars on every stage, order and sidebar row; tooltips on chips (hover on desktop, tap on phone) |
| Dark mode | A setting | Already have light and dark, both kept |

**Not taken:** the dark blue-grey sidebar, colored round skill icons, the "level 1–99" number, mastery, combat, any wording or layout measured from their screens. Our sidebar is a ruled ledger page; our icons are simple line drawings of tools (axe, saw blade, crate, ship's bell, scroll).

## 2. Information architecture

```
┌ Sidebar ───────────┐┌ Top bar ─────────────────────────────────────────────┐
│ OUTPOST COMPANY    ││ Logging $412K · Mill $5.2K · Shares 38 · Winter 1893 │
│ CAMPS              ││ Ice bridge · Log price ×1.11 ↗ · [bell 3]            │
│  Logging   Out. 3  │└──────────────────────────────────────────────────────┘
│  ▬▬▬▬▬▬▬▭▭  ●      │┌ Main screen ─────────────────────────────────────────┐
│  Sawmill   Run 2   ││  (one at a time)                                     │
│  Fishing   in fog  ││                                                      │
│ COMPANY            ││                                                      │
│  Warehouse   ●     ││                                                      │
│  Shop              ││                                                      │
│  Charter board 2   ││                                                      │
│  Company board     ││                                                      │
│  Almanac           ││                                                      │
│  Settings          ││                                                      │
└────────────────────┘└──────────────────────────────────────────────────────┘
```

### Sidebar rows

| Row | Shows | Dot means |
| --- | --- | --- |
| **Logging** | "Outpost 3 · Cove Landing", bar = progress to close camp (era goal or bd ft goal, whichever is nearer) | perk to pick, wages owed, no lot queued, close camp ready |
| **Sawmill** | "Mill run 2 · Saw pit", same bar. Hidden until the first Logging close camp, then shown with "New" | perk to pick, pond empty and buying off, structure affordable for the first time |
| **Fishing** and later camps | Greyed, "In the fog", with one line on how it opens. Shows the road ahead without spoilers | — |
| **Warehouse** | Item count | new items (count clears on visit, as `S.newCount` today) |
| **Shop** | Time to new stock | new stock arrived |
| **Charter board** | Active orders count | an order inside its last season, or ready to hand in |
| **Company board** | Shares to spend | a node you can afford |
| **Almanac** | Seen / total events | new entry |
| **Settings** | — | — |

### Top bar (always visible)

Left to right: **cash of the camp you are on** (big), the other camp's cash (small), **Charter Shares** for that camp, **season tile** (season, year, the weather card's name and a 1-line effect; tap opens the full card), **log price** with the spark line, **bell** with a count. On a camp screen a **Pick perk / Shop** button sits at the right end when there is something to pick.

The current header (brand, tagline, ledger strip, camp tabs, tally, run bar) collapses into this one bar. Cash no longer shows twice. The brand moves to the top of the sidebar.

### The bell: "Needs you now"

A short list, newest first, each line with one button that goes to the right place. Only things the player can act on; news goes to the camp log.

| Item | Button |
| --- | --- |
| Perk ready (Logging, Sawmill) | Pick |
| Charter order ends this season, or a special order can be handed in | Open order |
| Wages owed | Go to Crews |
| No lot after this one | Go to Lots |
| Mill pond empty, buying off | Turn on |
| Close camp ready | Close camp |
| Weather card waiting (when it arrived during a mini-game) | Read |

Toasts stay for good news (achievements, Prime timber, finds): max 2 at once on phones, in the bottom corner of the main area (just above the bottom tabs on phones) so they never cover the camp header buttons, and they wait while a sheet or mini-game is open (fixes phone audit H3 and M7).

## 3. Main screens

### 3.1 Logging

**Camp header** (top of the screen, always): "Logging · Outpost 3", current lot name, close-camp bar, three small stats (net a minute, perks, shares if closed now), buttons **Pick perk (1)** and **Close camp**. Extra rules for this outpost show as chips.

**Tabs:** Work · Lots · Crews · Camp · Log. The last tab opened is remembered (`S.ui.logTab`).

| Tab | Contents | From today's panel |
| --- | --- | --- |
| **Work** | Current lot card (the tree to chop, chops left, trees left bar, done in). **Four stage cards** in a row (two by two on phones): Fell, Buck, Skid, Haul. Each card: rate per minute, stock waiting (bar), "slowest" tag, weather effect chip if the season changes it, and **Play** (opens the mini-game) plus the hand button (Chop +1 etc.). Under them: the **Logs to the mill** slider | Current lot + Stump to mill |
| **Lots** | **Land office**: four slot cards side by side (Company lot, Surveyed lot, Cruiser's pick, AFK lot), locked slots show "Cut out 1 more lot". Listings keep the **color chips** (green ▲ / red ▼) and the "i" for notes. Under it, the **cutting queue** with its **Lots / Trees** switch; Trees opens first (decision 2026-10-26) with Any / First / Skip per species and the picking note | Cutting queue + Lots for sale |
| **Crews** | Buy ×1 / ×10 / ×25 / Max, then one compact row per crew or machine, grouped by stage | Crews and machines |
| **Camp** | Era track and "Move up to …" button, improvements as cards with progress bars, bunkhouse, next goals | Company panel |
| **Log** | Run stats and the camp log | This outpost + Camp log |

Perks the player holds show as a row of small chips in the header; tap one for its text. Close camp opens the existing confirm-in-page flow, then the next-outpost rules sheet.

### 3.2 Sawmill

Same header shape ("Sawmill · Mill run 2 · Saw pit"). Tabs: **Mill · Structures · Sawyers · Run**.

| Tab | Contents |
| --- | --- |
| **Mill** | A sawing card with a thin bar for the log on the carriage, bd ft a minute, water power for the season (with the weather effect chip), **Saw boards** (Play). Log pond as a level bar with **Buy logs: on/off**. Lumber yard as three tiles (Clear, Select, Common) with **Bundle: on/off** and plank bundles. Mill cash in and out on one line (logs bought from Logging at 0.5×, bundles sold) |
| **Structures** | One card per structure: what it does, its cost as small item chips (icon, count, have/need in green or red), **Build**. Built ones collapse to a one-line row with their level |
| **Sawyers** | Hire rows, as Crews |
| **Run** | Perks, run stats, close camp, past mill runs |

### 3.3 Warehouse

A full screen, no longer a pop-up. **Tabs:** Stock · Collection. (The Almanac moves to its own sidebar row; the Ledger tab moves to the camp Log tabs.)

- **Bulk stock** strip on top: Log pond (bd ft), Lumber yard (bd ft by grade). These are not grid items.
- **Filter chips:** All, Prime timber, Finds, Lumber, Mill goods; and a search box.
- **The grid:** square tiles, about 64 px on desktop and 4–5 per row on phones (each at least 56 px). Each tile: the item's picture (placeholder art from the inventory project), count bottom-right, rarity shown by the tile's edge style (not color alone), a "new" glow, a small lock mark, and a small flag when an order needs it.
- **Item panel** (right column on desktop, bottom sheet on phone): name, rarity, one-line text, "Admiralty needs 11 more · 5 kept for building", **Sell 1**, **Sell all**, **Lock**. **Sell spares** stays as a button on top of the grid.

The inventory project owns item art, categories and sorting; this layout is the frame it fills.

### 3.4 Shop

A full screen with one section per camp (Logging, Sawmill), then a Company section if the shop project wants one. Each offer is a card: name (4 words), one-line rule, price, **Buy**. A line on top: "New stock in 1:42 (next season)". The perk shop project owns what is sold, prices, rotation and rerolls. This screen replaces the draft modal; the **Pick perk** button in the camp header becomes **Shop (2 new)** if the owner approves that project.

### 3.5 Charter board

Every order in one place, filterable by camp (All, Logging, Sawmill).

| Section | Card contents |
| --- | --- |
| **Special orders** (from the warehouse) | Client, what they want as item chips with have/need bars, reward (shares %, perk unlock), deadline, **Hand in**. Auto-fill toggle at section top |
| **Active charter orders** (several at once) | Buyer, bd ft progress bar, bonus %, time left bar, fine if missed. "2 of 3 active" in the heading |
| **Mill log orders** | "Mill wants 6,000 bd ft of Oak by fall", 1.2× price, free to miss |
| **Offers** | The 4-offer board (first slot always a regular order), each with order-fit note and **Sign** |
| **Hire jobs** | One at a time, as today |

### 3.6 Company board, Almanac, Settings

- **Company board:** the Charter Share boards of every camp, one section each (Logging's board, the mill's board), past outposts below. Later home of Landfall City.
- **Almanac:** the weather events (seen and unseen), and the collection log moved from the Warehouse.
- **Settings:** theme (auto/light/dark), number format, toast level (all / important / none), save backup, new company (with the in-page confirm).

## 4. Phones (under 700 px wide)

- **Bottom tabs, 5 large buttons (at least 56 px tall):** **Camp** (the camp you were last on; tap again to switch camps in a small sheet), **Orders** (Charter board), **Warehouse**, **Shop**, **More** (opens the sidebar as a drawer from the left: all camps, Company board, Almanac, Settings). Badges and dots as in the sidebar.
- **Top bar, one line:** camp cash, season chip, bell. Tap the cash for the full money list.
- **Camp tabs** (Work, Lots, Crews, Camp, Log) become a scrolling row of chips under the camp header; the header itself shrinks to one line plus the close-camp bar.
- **Stage cards** go two by two; land office slots stack one per row; the warehouse grid shows 5 per row; item panels are bottom sheets.
- **Mini-games** open full screen with a one-line status, help behind "?" (phone audit H2).
- The 44 px tap-target rule and the 12 px text floor from `tests/phone/phone_smoke.cjs` hold for every new element.
- Mid-width (700–1100 px, tablets and small laptops): the sidebar collapses to icons with names on hover/long-press.

## 5. Mini-games

Every Play button opens its game **inside the main area** on desktop: the sidebar and top bar stay, so the player can see cash and the bell, but the sidebar is dimmed and leaving needs **Close**. On phones it is full screen. The game's own sheet code (`#mg`) moves into the main area with no change to the games. Toasts and weather cards wait until it closes. The idle camp keeps running underneath, as today.

## 6. Where every existing feature goes

| Today | New place |
| --- | --- |
| Brand and tagline | Sidebar top |
| Ledger strip (cash, shares, warehouse, special order) | Top bar (cash, shares); warehouse count to the sidebar row; special order to the Charter board row count |
| Camp tabs Logging / Sawmill | Sidebar camp rows |
| Tally (cash, net a minute, season, log price) | Top bar; net a minute to the camp header |
| Weather card (`#dispatch`) | Season tile in the top bar; opens as a card under the top bar for 8 s, then folds into the tile |
| Run bar (outpost, mods, perks, close now, pick perk) | Camp header |
| Wages owed / no timber banners | Bell items, plus a thin banner on the camp header |
| Current lot | Logging › Work |
| Cutting queue (Lots / Trees, chips, Any/First/Skip) | Logging › Lots, under the land office |
| Stump to mill (chain, mill slider) | Logging › Work stage cards |
| Land office slots (4) | Logging › Lots, four slot cards |
| Crews and machines | Logging › Crews |
| Orders and hire jobs (special, hire, charter) | Charter board |
| Company (eras, improvements, bunkhouse, goals) | Logging › Camp |
| The board (Charter Shares) | Company board |
| This outpost (perks, stats, close camp) + Camp log | Camp header (perks, close camp) and Logging › Log |
| Sawmill panels | Sawmill tabs (Mill, Structures, Sawyers, Run) |
| Warehouse modal (Stock, Collection, Almanac, Ledger) | Warehouse screen; Almanac screen; Ledger to camp Log tabs |
| Draft modal | Stays a sheet until the perk shop lands, then the Shop screen |
| Story, new-run, mini-game sheets | Unchanged sheets (mini-game moves into the main area) |
| Save backup / New company | Settings |

## 7. Build slices

Rules for every slice: element ids that tests and the sim use stay (`#tabMill`, `#qTabs`, `#stash`, `#sales`, `#draftBtn`, `#mgCanvas`…); new state goes in `S.ui` with defaults merged on load (`timberline-v2` saves keep loading); both themes; `npm test` and `pnpm run test:phone` pass; the sim's DOM-free core is untouched, so balance does not move.

**Slice 1: the frame (about 2 days).** Sidebar, top bar, bottom tabs on phones, a `S.ui.screen` router. Every existing panel moves as is into its screen (Logging screen holds today's Logging panels, Sawmill likewise, Warehouse modal becomes the Warehouse screen, the board becomes Company board, orders become the Charter board). Header collapses into the top bar. Toasts move under the top bar and wait behind sheets. Tests: update selectors only where a modal became a screen (`openWh`), add phone checks for the bottom tabs. Proves the shape with almost no logic change.

**Slice 2: camp tabs, stage cards, bell (about 3 days).** Logging and Sawmill tabs, stage cards with Play buttons and weather chips, land office slot cards, camp header with perks and close camp, the bell list and sidebar dots, mini-games inside the main area. Charter board sections and filters. Tests: tab switching, bell items appear and route, phone tap-target and text-size checks on each tab.

**Slice 3: Warehouse grid, Shop, Almanac, Settings (about 2 days, plus joining work).** Grid and item panel (art and categories from the inventory project), Shop screen hosting the perk shop (or the draft until it lands), Almanac screen, Settings, tooltips. Tests: sell/lock from the grid, the shop flow, save round-trip with the new `S.ui` fields.

## 8. Risks

- **Two parallel projects land in the same file.** Agree now: they write their content into `#whGrid` and `#shopBody`; slice 1 creates those containers early.
- **Hidden things get forgotten.** On one long page everything is in view; with screens, orders can expire unseen. The bell and sidebar dots must cover every "act soon" case before slice 2 ships; QA checks a full idle hour with only the bell.
- **More taps on desktop** for players who liked seeing everything. The Work tab carries the stage cards, cash and season are always on top, and the sidebar shows both camps' progress, so the common check takes one glance.

## 9. Questions for the owner

1. **Phones: bottom tabs (recommended) or a slide-out menu only?** Bottom tabs are one tap to anything; a menu keeps more screen for the game.
2. **What does a camp "level" mean in the sidebar?** We have no 1–99 level. I recommend outpost number plus a close-camp bar. Alternative: a lifetime camp rank that rises with total bd ft (a new number to balance).
3. **Mini-games on desktop: inside the main area (recommended) or full window?**
4. **Fishing and later camps visible as greyed "in the fog" rows from the start?** Recommended: yes, it shows where the game goes. Say no if you would rather keep them a surprise.
