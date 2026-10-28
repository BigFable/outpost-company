# Resource names: one tier ladder, plain names

**Status: Approved (owner, 2026-10-28)**: the rename table, the tier ladder, "wood" as the unit, and perk tiers left alone for now. Burl → Swirl knot and Survey marker → Restock token (owner picks, 2026-10-28). *Design reviewer, 2026-10-28. Owner request: "Gamify and simplify all inventory resources in the game — Prime spar should probably just be 'Prime log', and so forth. Make it more easily digestible to someone who doesn't fully know logging lingo." Builds on `inventory-revamp.md` (icons and frames; its tier colors are superseded by section 1 here), `prime-timber-drops-inventory.md`, `sawmill-camp.md`, `species-overhaul.md`, `fishing-camp.md`, `perk-shop.md` and the glossary in `docs/style/plain-language.md`. Text only: no ids, saves, numbers or balance change.*

## For the owner: what changes

Today the game speaks three trade languages at once. Logs are "grade 1, 2, 3" and "pulp". Boards are "Clear, Select, Common". Items are "Common, Uncommon, Rare, Made". A new player has to learn that grade 1 beats grade 3, that Clear beats Select, and that a "spar" is a good log.

After this change there is **one ladder of five words**, used for logs, boards and items alike:

> **Common → Good → Fine → Prime → Rare**

- A log you cut is a **Common log**, **Good log**, **Fine log** or, stamped by a great cut, a **Prime log**. The scraps are **Firewood**.
- The mill makes **Common boards**, **Good boards**, **Fine boards** and, from a great run on a Prime log, **Prime boards**.
- Finds sit on the same ladder: a swirl knot is Common, a brass token is Good, a fog lens is Rare.
- The frame around every picture shows the tier with a color **and** a count of diamonds (0 to 4), and the word is written in the detail pane. Prime is yellow, Rare is orange.
- "bd ft" becomes **wood**: "Deliver 10K wood", "Log pond 18K wood". The numbers do not change (1 wood = 1 board foot); only the label does.

The 1890 flavor stays where it costs nothing: *Amber sap*, *Shipwreck bronze*, *Fog lens*, the Admiralty, the Perseverance, the Log pond.

## 1. The tier ladder

| Tier | Means | Frame (color + shape) | Token | Used for |
| --- | --- | --- | --- | --- |
| *Scrap* (floor, not a rung) | Worth a little, sold on the spot | No frame, dashed grey outline, no diamonds | `--r-scrap` (new) | Firewood (pulp), saw-game scrap |
| **Common** | Everyday stuff | Grey, 1 px, **0 diamonds** | `--r-common` | Common logs, Common boards, plank bundles, Amber sap, Swirl knots |
| **Good** | Better than most | Green, 2 px, **1 diamond** | `--r-good` (was `--r-uncommon`) | Good logs, Good boards, uncommon finds |
| **Fine** | Top quality from normal work | Blue, 2 px, **2 diamonds** | `--r-fine` (new) | Fine logs, Fine boards, Marbled board |
| **Prime** | Stamped for skill: the best cut, the best fall | Yellow, 3 px, **3 diamonds** | `--r-prime` (was `--r-made`) | Prime log, Prime maple, Prime oak, Prime boards, Redwood beam, Prize fish |
| **Rare** | Luck: few ever turn up | Orange, 3 px plus a thin outer ring, **4 diamonds** | `--r-rare` (was violet) | Fog lens, Stone knot, Redwood heart, Bird's-eye board, Fog pearl, Ambergris |

**Rules.**
- **Tier means how hard it is to get**, and so roughly how much it is worth. It is not an exact price: a Common swirl knot sells for more than a Good brass token. The detail pane always shows the price.
- **One diamond system (owner, 2026-10-28).** Diamonds sit on the top edge of the frame: 0, 1, 2, 3, 4. The frame gets heavier as the tier rises (1, 2, 2, 3, 3 px), and only Rare adds the outer ring. A small **P** may stay on a Prime item's *icon* as the grader's mark, but it is decoration: the 3 diamonds are the tier mark.
- **Colors (starting values, light / dark theme):** Common grey `#7A7368` / `#9A958C`; Good green `#3F7D3A` / `#6DBB5F`; Fine blue `#2F6DB5` / `#6FA8E8`; Prime yellow (dark gold) `#8A6D00` / `#F2CC3D`; Rare orange `#C04A10` / `#FF8A3D`. All reach 3.7:1 or better against both tile shades (`--tile`, `--tile-hi`) in each theme. Yellow and orange sit about 27° of hue apart. In the dark theme Prime is also much lighter than Rare; in the light theme yellow has to be a dark gold to stay readable on paper, so the two match in lightness and differ only in hue there. QA checks them side by side in both themes and in a grayscale screenshot, where the diamond count alone must tell every tier apart.
- **Orange is now Rare only.** The warehouse's orange "new" dot becomes a dark ink dot, so orange always means Rare. Red keeps meaning losses and fines.
- **Never color alone.** Diamond count and frame weight carry the tier; the tile's accessible label and the detail pane say the word ("Prime log, Prime tier, 14 held").
- **Prime is earned, Rare is luck.** Prime always comes from a great mini-game result or the idle trickle; Rare is a drop roll. That is why Prime sits below Rare even though Prime items are what orders want most.
- **The tier word goes in the name only for logs and boards** ("Fine boards"). Finds keep their own names; their tier shows on the frame.
- **Blue is new.** Check it against the "needed" ring, links and the dark theme. The **Q** badge for Quarter-sawn and the CL/SE/CO grade tags go away; Prime boards and board tiers show diamonds like everything else.

**Mapping the old scales onto it.**

| Old | New tier |
| --- | --- |
| Log grade 1 / 2 / 3 / pulp | Fine / Good / Common / Firewood (scrap) |
| A grade 1 log stamped Prime (score 90%+, long enough) | Prime |
| Board grade Clear / Select / Common | Fine / Good / Common |
| Quarter-sawn board | Prime |
| Item rarity Common / Uncommon / Rare | Common / Good / Rare (Fine for the Marbled board) |
| Item rarity Made | Prime for Prime timber and top goods; Common for plank bundles and rations |
| Log grade on the mill deck (1 best) | Fine / Good / Common log |

**Perks keep their own labels** (Common, Rare, Legendary, Curse) in the Shop. See owner question 4.

## 2. Rename table

Ids stay exactly as they are (section 5). "Keep" means the name is already plain.

### Logs and wood (mini-game labels, piles, not warehouse items)

| Current name | New name | What it's for | Tier |
| --- | --- | --- | --- |
| stem / trunk (felled tree) | Felled tree | A tree on the ground, waiting to be cut into logs | — |
| sawlog, log | Log | What bucking cuts a felled tree into | — |
| grade 1 log (G1) | **Fine log** | Clean, straight wood. Pays the most | Fine |
| grade 2 log (G2) | **Good log** | A few knots. Pays well | Good |
| grade 3 log (G3) | **Common log** | Bent or cracked. Pays a little | Common |
| pulp (sold by the cord) | **Firewood** | Rot, the thin top and short ends. Sold on the spot | Scrap |
| Prime spar | **Prime log** | A perfect log. Builds the mill and fills big orders | Prime |
| Prime hardwood (old plan) | Prime maple / Prime oak (already split) | Perfect hardwood logs for the Company House, cooperage and planer | Prime |
| Cloudwood heartwood | **Redwood heart** | The core of a giant redwood. For Landfall City | Rare |
| logs in the woods / at the landing | keep | The piles between stages | — |
| Log pond (`S.bulk.logs`) | keep: **Log pond** | Logs waiting at the mill | — |
| Pine, Spruce, … logs (per-species pond) | keep: **Pine logs** etc. | The mill's stock by tree | — |

### Finds

| Current name | New name | What it's for | Tier |
| --- | --- | --- | --- |
| Burl | **Swirl knot** | A swirly lump of wood. Sells well; builds the drying yard | Common |
| Amber pitch | **Amber sap** | Hard tree sap. Seals ships and the water wheel's dam | Common |
| Survey marker | **Restock token** | A company token. Restocks the Shop now (2 per outpost) | Good |
| Ship's fitting | **Shipwreck bronze** | Bronze parts washed ashore. Builds saws and fixes ships | Good |
| Fog-glass | **Fog lens** | A smoky lens nobody can explain. Rare and valuable | Rare |
| Lost axe-head (planned) | **Old axe head** | Lost by crews long ago. Collect the maker's marks | Common |
| Petrified knot (planned) | **Stone knot** | A knot turned to stone. For the Landfall cornerstone | Rare |
| Tramp iron (planned) | **Old spikes** | Iron hidden in logs. Scrap for a future smithy | Common |
| Spalted board (planned) | **Marbled board** | A board with dark, marbled lines. A collector's piece | Fine |
| Birdseye figure (planned) | **Bird's-eye board** | Maple with tiny swirl "eyes". Landfall wants it | Rare |

### Boards and goods (Sawmill)

| Current name | New name | What it's for | Tier |
| --- | --- | --- | --- |
| Clear (lumber) | **Fine boards** | No knots. Sell for 3× | Fine |
| Select (lumber) | **Good boards** | A few knots. Sell for 2× | Good |
| Common (lumber) | **Common boards** | Knotty. Sell for 1×; tied into plank bundles | Common |
| Quarter-sawn board | **Prime board** | The best board, from a great run on a Prime log | Prime |
| Plank bundle | keep: **Plank bundle** | 500 wood of Common boards. Builds the bunkhouse | Common |
| Cloudwood beam (planned) | **Redwood beam** | A huge beam for Landfall's buildings | Prime |
| slab (already "scrap" in the saw game) | keep: **scrap** | The rounded outside of a log. Worth nothing | Scrap |
| Lumber yard | keep: **Lumber yard** | Where the mill's boards pile up (resets at mill close) | — |
| Tanbark (cash, not an item) | **Hemlock bark** | Hemlock bark sold in Spring and Summer. Paid as cash | — |

### Fishing stubs (planned)

| Current name | New name | What it's for | Tier |
| --- | --- | --- | --- |
| Prize fish | keep | A giant catch, stamped like Prime timber | Prime |
| Glass float | keep | A drifting net float. Collection | Common |
| Drowned chart | **Old sea chart** | A soaked map. Restocks the Shop now | Good |
| Fog pearl | keep | Fishing's fog lens | Rare |
| Ambergris | keep: **Ambergris** (desc "a waxy whale treasure") | Collection; sells high | Rare |
| Smoked ration | keep | Feeds Logging crews: wages ×0.85 while stocked | Common |

### Structures and categories that name a resource

| Current | New | Why |
| --- | --- | --- |
| Mill pond & wheel | **Water wheel** | "Mill pond" clashed with the Log pond stock |
| Edger & trimmer (planned) | **Edger** | Shorter |
| Filing room (planned) | **Saw shop** | Plain |
| Planing mill (planned) | **Planer** | Plain |
| Warehouse tab "Prime" / "Lumber" | **Prime** / **Boards** | Matches the item names |
| Toast labels "Prime timber" / "Mill goods" / "Find" | **Prime!** / **Made** / **Find** | Short, gamified |

## 3. Units: "wood"

**Decision: show board feet as "wood".** 1 wood = 1 bd ft. The `bf()` formatter prints "12K wood" instead of "12K bd ft"; rates print "40 wood/s". A small log-stack icon stands for it in tight spots (lumber-yard tiles, the ledger). The Almanac explains it once: "Wood is measured in board feet: a board 1 ft long, 1 ft wide, 1 in thick."

Why not the other options:
- **Keep "bd ft":** the exact lingo the owner wants gone, and it is on most screens.
- **Count logs or boards:** the bucking game shows real logs of 8–16 ft, so "1 log = 100 bd ft" would disagree with the logs on screen, and early rates turn into fractions ("0.12 logs/s"). Big round numbers are part of idle-game fun.

"wood" keeps every number, rate, order and achievement threshold the same, so nothing needs a balance check. Firewood is still paid by volume behind the scenes; the player only sees dollars.

## 4. Text that must change

Paths are `prototype/timberline.html` unless noted. Line numbers are as of today. Tests that assert on this text move with it.

**Core data (`packages/core/src`, then `core:inline`).**
- `items.ts`: names, plurals and descs of all 8 live items (Prime log, Swirl knot, Amber sap, Restock token, Shipwreck bronze, Fog lens, Prime board, Plank bundle); `from` lines ("grade 1 logs" → "Fine logs"); add the display `tier` field (section 5).
- `items.ts` special orders: "Admiralty spar order" → **Admiralty mast order**, text "The Admiralty wants Prime logs for ship masts, and amber sap to seal them." *Patch the Perseverance*: "needs amber sap and shipwreck bronze before she sails."
- `items.ts` order perks: *Spar man* → **Prime hunter** ("a good fall … also gives 1 Prime log"); *Pitch boiler* → **Sap boiler** ("each firewood piece becomes amber sap … Idle buckers find sap 3× as often").
- `sawmill.ts`: structure names and descs (Water wheel; Circular saw "needs shipwreck bronze"); bunkhouse costs read "plank bundles"; *Pond monkey* "each gives 1 extra Fine board"; *Chain carriage* "outer boards one tier better"; *Big stick* "its Fine boards are worth ×3"; the board-grade name helper returns Fine/Good/Common.
- `content.ts`: `STAGES` units 'bd ft/s' → 'wood/s'; improvement descs: *Measuring stick* "each cut's grade" → "each cut's tier", *Grade rules* → **Log grading** (keep effect); perk *Sharp grader* "Log value ×1.08" keep; *Bark peelers* (planned) "hemlock bark … all firewood".
- `achievements.ts` and the prototype copy (line ~2056): every "Deliver N bd ft" → "Deliver N wood"; names "10 MBF" → **10K wood**, "50 MBF" → **50K wood**, "A million board feet" → **A million wood**, "A billion board feet" → **A billion wood**. `CLOSE_VOL` text: "deliver 250K wood".
- `species.ts` / species tags (lines ~2680–2773): "amber pitch" → "amber sap"; "Prime needs a grade 1 log of 14 ft" → "Prime needs a Fine log of 14 ft"; hemlock "logs grade 3" → "Common logs"; listing "best for": "Prime spars (3 from a perfect fall)" → "Prime logs (3 from a perfect fall)", "pulp" → "firewood", "tanbark" → "hemlock bark".
- Weather and events (line ~5364): "ship's fittings" → "shipwreck bronze".

**Prototype UI.**
- Bucking guide (line 639–640): "Blue is a Fine log, green is Good (knots), grey is Common (bend), brown is firewood." "A top under 8 in is firewood."
- Bucking colors (`gradeCol`, line 7657) follow the ladder: Fine blue, Good green, Common grey, firewood dashed brown; a cut that will stamp Prime is yellow with 3 diamonds above it. Diamonds above each mark (0–3) back up the colors. Marks (line 7708) read "12′ Fine", not "12′ G1". `gradeName` (line 7566): "Fine log (knots)", "firewood (rot)".
- Bucking result (line 7645): "2 Fine logs stamped Prime: +2 to the warehouse". Pitch boiler line → Sap boiler.
- Felling result (line 7410): "Prime: +3 Prime logs".
- Lumber yard note (line 597): "Fine boards sell for 3×, Good 2×, Common 1× the log price. Common boards make plank bundles first while the bunkhouse needs them."
- Saw result (line 8784): "… Fine, … Good, … Common, and 1 Prime board to the warehouse". Mill deck labels (line 8826): "Log 1 · 14 in · Good log"; "uses 1 Prime log". Saw guide (line 7244) and status (line 8685): "Prime logs" already right.
- Structures note (line 613): "Built from Prime logs, finds and mill cash."
- Warehouse empty text (line 8982): "Perfect falls and great cuts make Prime logs."; groups (line 8977) "Prime", "Finds", "Made".
- Special orders hint (line 8922): "They start once you make a Prime log: get a perfect fall, or cut a tree at 90% or better."
- Founding crate note (line 8567): "saw blades, Prime logs, amber sap, shipwreck bronze and 20K wood of logs."
- Mill slider (line 8907) and close-mill confirm (line 9077): "log pond" → "Log pond", amounts in wood.
- Pine order fit hint (line 6695): "twice the amber sap when bucking".
- Tanbark pay toast and ledger line: "Hemlock bark +$14".

**Design docs and glossary** (when approved).
- `docs/style/plain-language.md`: glossary rows "bd ft" → "wood"; "Prime, Clear, Select, Common, pulp, grade 1–3" → the ladder; add Replaced rows (Prime spar → Prime log, pulp → firewood, Clear/Select → Fine/Good, Quarter-sawn → Prime board, amber pitch → amber sap, ship's fitting → shipwreck bronze, fog-glass → fog lens, tanbark → hemlock bark, Mill pond & wheel → Water wheel).
- `inventory-revamp.md`: tier frames rewritten to the diamond system (done 2026-10-28); tab "Lumber" → "Boards".
- `ui-rework.md`, `sawmill-camp.md`, `species-overhaul.md`, `fishing-camp.md`: names in future text follow this table (no rewrite of history needed; new text uses the new names).

## 5. What does not change

- **Ids:** `logging.prime_spar`, `logging.amber_pitch`, `logging.ships_fitting`, `logging.fog_glass`, `sawmill.quarter_sawn`, `sawmill.pond`, `BoardGrade` `'clear' | 'select' | 'common'`, log grades `1 | 2 | 3 | 'P'`, `S.bulk.logs`, perk ids `sparman` and `pitchboiler`, achievement ids `d10k` etc. Saves (`timberline-v2`), the sim and the RNG streams are untouched.
- **Numbers:** prices, chances, thresholds and rates. 1 wood = 1 bd ft.
- **`ItemDef.rarity`** keeps its values; drop tables read it. A new display field carries the ladder:

```ts
export type Tier = 'scrap' | 'common' | 'good' | 'fine' | 'prime' | 'rare';
// ItemDef gains: readonly tier: Tier   (a test fails if any item lacks one)
export const BOARD_TIER: Record<BoardGrade, Tier> = { clear: 'fine', select: 'good', common: 'common' };
export const LOG_TIER: Record<1 | 2 | 3 | 'P', Tier> = { 1: 'fine', 2: 'good', 3: 'common', P: 'scrap' };
export const TIER_LABEL: Record<Tier, string>; // 'Firewood' | 'Common' | 'Good' | 'Fine' | 'Prime' | 'Rare'
```

## 6. Smallest version first

**One text pass, one PR.** `items.ts` names and the `tier` field; board and log tier labels in the bucking and saw games; `bf()` prints "wood"; the strings in section 4; tests updated. The frame colors ride on the inventory revamp slice 1 (the five tier tokens and the 0–4 diamonds there). No sim run needed; QA checks phone width (Shipwreck bronze is the longest name at 16 characters) and an old save.

*Playtest question:* "Which is worth more, a Good log or a Fine log? A Prime board or Common boards?" Pass if a new player answers without help.

**Cut:** renaming perks beyond the two that name resources, renaming camp and place names, a separate Prime log per conifer species.

## 7. Owner decisions and the open pick

**Decided (2026-10-28):** "wood" replaces bd ft; the ladder Common → Good → Fine → Prime → Rare, with firewood below, as one diamond system (grey 0, green 1, blue 2, yellow 3, orange 4; Rare is orange, no longer violet); perk tiers stay Common, Rare, Legendary and Curse for now (perk cards get a different frame style from item tiles); Mill pond & wheel becomes Water wheel; Burl and Survey marker are renamed.

**Pending owner pick:**

1. **Burl** (a swirly lump that grows on a trunk; sells well, builds the drying yard).
   - **Swirl knot** (owner's pick; recommended): says what it looks like, matches the icon, and sits next to *Stone knot* as a pair.
   - Lucky knot: more gamified, but implies a luck effect it does not have.
   - Tree lump: the plainest, but sounds like junk for an item that sells well.
2. **Survey marker** (an old brass marker; per `perk-shop.md` it buys a full Shop restock, 2 per outpost).
   - Brass token (recommended): plain, matches the brass icon, and "token" says "spend me".
   - **Restock token** (owner's pick): names the use exactly, but loses all flavor and reads like a menu button.
   - Lucky marker: keeps the survey picture, but does not say what it does.
