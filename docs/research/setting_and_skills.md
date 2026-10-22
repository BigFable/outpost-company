# Setting and Skill Roster Options

*Idle roguelite RuneScape: design options doc*

## 0. Constraints every option must meet

- **Logging must sit at the center of the item graph, not off to the side.** It is the only prototyped skill, so the setting has to make wood the first input to several other skills.
- **"Close camp" must make sense in the fiction.** A run ends and turns into Legacy. The setting has to give that a reason to happen.
- **Mini-games must be physical and readable**, at 8–25 s each, with aim, timing, steering or packing. They should never be menu puzzles.
- **Each skill needs one special mechanic**, the way Logging has tracts, contracts and seasons. Most skills should reuse a shared system (map nodes, orders, a calendar) with a twist, so a solo developer is not building 12 bespoke systems.
- **The long-term sink has to pull on every skill.** Otherwise players max three skills and ignore the rest.

Notation used below: **Idle** = idle loop; **MG** = mini-game(s); **SM** = special mechanic; **Perks** = two example rule-changing perks (C) marks a curse.

---

## Option A: "Timber & Iron" (historical frontier/industrial America, 1880–1990)

### A1. Premise and fantasy
You build a family resource company through a century of American industry, from ox teams and hand saws to diesel skidders and feller-bunchers. Eras are tech tiers, and every skill moves through the same four eras. **Player fantasy:** the self-made outfit. You know the work with your hands, and you own the town by the end.

### A2. Skill roster (12)

**Gathering**

| Skill | Idle | Mini-games | Special mechanic | Perks |
|---|---|---|---|---|
| **Logging** | Crews fell and yard timber from the active tract | Place a fall; Plan the cuts; Skid a turn; Drive a load (existing) | Timber tracts, mill contracts, seasons | *Widowmaker Ground* (C): +40% yield, and 1 in 20 falls loses a crew-hour. *Spring Drive*: in spring, logs float to the mill free and skip hauling. |
| **Mining** | Miners work the face of the current claim | **Shot the face**: place 3 charges on a rock face; spacing and depth set fragment size. **Muck out**: time ore cars on a switchback track. | Claims with veins that pinch out, so you prospect for new ones | *Assay Office*: low-grade ore counts as the next grade up for contracts. *Hollow Ground* (C): +50% ore; any skill can trigger a cave-in event that pauses Mining 10 min. |
| **Fishing & Canning** (salmon) | Boats and traps take the run | **Set the net**: drift a gillnet across a school's path against the current. **Fish wheel**: time the wheel's dips to the runs. | Fish runs: windows that pulse by season and get weaker with overfishing | *Hatchery*: overfishing raises next season's run instead of lowering it. *Cannery Row*: raw fish never spoils and always counts as canned for orders. |
| **Ranching & Farming** | Herds graze and fields grow on a seasonal clock | **Cut the herd**: steer a horse to split one marked steer from the herd. **Plow a furrow**: hold a straight line over uneven ground. | Shares the season calendar with Logging. Land gets better or worse depending on rotation. | *Stump Farm*: tracts that Logging has cleared become farmland. *Dust Bowl* (C): double yield for 2 seasons, then the land is barren for 1. |

**Refining**

| Skill | Idle | Mini-games | Special mechanic | Perks |
|---|---|---|---|---|
| **Sawmilling** | The mill breaks logs into lumber | **Head rig**: set the carriage dogs, then call each cut to get the most clear lumber out of a log with hidden defects (a reveal-as-you-cut version of Plan the cuts). | Mill layout: chain saw, edger and trimmer stations. The slowest one sets throughput. | *Waste Burner*: sawdust is fuel for Smelting and Steam. *Quarter-Sawn*: every 5th board is premium and counts double for Carpentry. |
| **Smelting & Charcoal** | Kilns and furnaces make charcoal, pig iron and steel | **Tap the furnace**: open the taphole when the heat bar sits in a moving window. **Bank the kiln**: manage 3 vents so a charcoal kiln burns evenly. | Fuel chemistry: charcoal, coal and coke give different grades and speeds | *Bessemer Blow*: steel needs no charcoal, only ore and time. *Cold Blast* (C): half fuel, and 1 in 4 bars is brittle (it still sells). |
| **Provisioning** (camp cook) | The cookhouse turns food into crew meals | **Cookhouse rush**: plate 6 orders on a timer by dragging items onto them. | Morale: fed crews in every skill get a speed buff that decays | *Sourdough Starter*: meals never lose quality while stored. *Flapjack King*: Logging crews eat half, and Mining crews eat double. |

**Crafting**

| Skill | Idle | Mini-games | Special mechanic | Perks |
|---|---|---|---|---|
| **Blacksmithing** | The forge makes tools, parts and hardware | **Draw the edge**: hammer strikes on a heat-colour timer. **Weld a link**: drop two pieces together at exact welding heat. | Tool durability: tools go into other skills' slots and wear out | *Spring Steel*: tools rebuild themselves when they break, once each. *Company Pattern*: all tools of one type share a single upgrade path. |
| **Carpentry** | The shop builds wagons, flumes, furniture and buildings | **Cut the joint**: trace a dovetail with a mouse guide. **Raise a bent**: balance a timber frame upright with pike poles. | Blueprints: building orders need a mix of grades and components | *Balloon Frame*: buildings cost 40% less lumber but 2× nails. *Heirloom*: furniture keeps value through a close camp, so it is the only output that is not converted. |
| **Machinery** (unlocks in the steam era) | The shop builds donkey engines, locomotives and later diesel parts | **Set the governor**: keep an engine's RPM in a band while load spikes come in. | Era gate: machinery is the gate to the next era for every skill | *Shay Gear*: machines run on any fuel. *Overclocked* (C): +60% speed; a breakdown halts the machine until it is repaired. |

**Support**

| Skill | Idle | Mini-games | Special mechanic | Perks |
|---|---|---|---|---|
| **Railroading** (logistics) | Trains carry goods between skill sites and markets | **Grade the line**: draw a track route under a slope limit. **Run the grade**: brake a loaded train downhill (a variant of Drive a load). | The network: distance and links set transfer speed and contract reach | *Common Carrier*: other operators pay you per shipment. *Switchback*: steep routes are allowed, but they cost speed. |
| **Commerce** (company store) | Agents sell output and fill orders | **Auction floor**: bid against 2 AI buyers with tells. | Market prices drift, and orders make players sell in bulk | *Scrip*: wages go back into your store, so meals and tools cost nothing. *Robber Baron* (C): prices +30%; random strikes pause 1 skill. |

### A3. Item flow
- Logging → Sawmilling (logs), Smelting (cordwood → charcoal), Railroading (ties, fuel), Mining (mine timbers)
- Sawmilling → Carpentry (lumber), Smelting (sawdust fuel)
- Mining → Smelting (ore, coal)
- Smelting → Blacksmithing (iron, steel), Machinery (steel)
- Blacksmithing → Logging, Mining and Farming (tools), Carpentry (nails, hardware)
- Machinery → Logging (donkey engine, skidder), Railroading (locomotives), Sawmilling (steam head rig)
- Carpentry → Railroading (cars, trestles), Fishing (boats), town buildings
- Ranching → Logging (oxen, horses), Provisioning (beef, flour)
- Fishing, Ranching → Provisioning → morale for all skills
- Everything → Commerce (cash)

**Strongest loops**
1. **Logging → charcoal → steel → axes → Logging.** This is the core tool loop.
2. **Logging → ties → Railroading → faster hauling for Logging and Mining.**
3. **Machinery gates eras for every skill.** It needs steel from Mining and Smelting and timber from Logging.
4. **Provisioning morale** is a soft buff that pulls on two gathering skills.

### A4. The run and "close camp"
A run is one **operation**: one camp, claim or mill site worked until it is played out. Close camp means selling the site, closing the camp and banking the know-how and capital as Legacy (company reputation). Biomes are **regions**: Great Lakes white pine, Southern longleaf, Pacific Northwest old growth, Rocky Mountain mining country, Alaska. Each region has its own species, terrain and seasons, which fits the existing tract system.

### A5. Long-term goal
**Build the company town and railroad**, then take the company **through the eras**. Machinery checkpoints gate each era, and each one needs output from most skills. The endgame is a 1990 diversified company, with optional "legacy contracts" such as a transcontinental bridge or a Liberty ship order. No combat is needed. Pressure comes from difficulty modifiers like fires, strikes, panics (1893, 1907, 1929) and conservation laws.

### A6. Fit with the prototype
**Carries over:** all four mini-games, tracts, contracts, seasons, the era ladder and the cash economy. **Changes needed:** cash stops being the main sink, and logs have to go to Sawmilling and Smelting as well as the market. Eras move from Logging-only to global, gated by Machinery.

### A7. Scope and commercial notes
- **Audience:** a niche-plus. It appeals to history fans and to the "satisfying work" crowd (Farming Simulator, Lumberjack's Dynasty, Gold Rush). It is weaker with Melvor's fantasy-leaning core.
- **Differentiation:** high. No idle game does Americana industry with this much craft.
- **Art:** moderate. Old photos and period illustration styles (engravings, WPA posters) give an achievable look, and AI art does well with them. Four eras means each skill needs 4× its props.
- **Risks:** 1880–1930 company-town history includes labor violence, scrip exploitation and Indigenous land seizure. Handle it honestly or players will notice. A pure-history theme also has a weaker progression fantasy at the high end, since a 1990 feller-buncher is less exciting than a dragon.

---

## Option B: "The Wildwood Reach" (original fantasy, light combat)

### B1. Premise and fantasy
The kingdom's old forest is waking up: trees older than the crown, deep-delves under the roots, and things that hunt in the dark. You lead a guild of Wardens who harvest the Reach without letting it swallow the valley. **Player fantasy:** the RuneScape/Melvor skill-lover's fantasy (gather, craft and gear up), with a forest that pushes back.

### B2. Skill roster (13)

**Gathering**

| Skill | Idle | Mini-games | Special mechanic | Perks |
|---|---|---|---|---|
| **Felling** | Cutters harvest common, then elder, then spirit-trees | Place a fall (now with a heartwood weak point); Plan the cuts (mark grain for enchantment value) | Groves wake: hard felling raises a "grove anger" meter that spawns a guardian fight | *Treesong*: felling a spirit-tree plants 2 saplings, so tracts regrow. *Sap-Mad* (C): ×2 resin; guardian spawn chance ×3. |
| **Delving** (mining) | Delvers dig root-caves for ore and crystal | **Crack the geode**: rotate it, find the fault line and strike once. **Lantern dark**: guide a cart through a dark tunnel, steering by sound and flicker. | Depth: each level adds richer ore and more danger. Lantern oil is a timer. | *Stonesense*: ore veins show on the tract map. *Deep Hunger* (C): depth ×2; Delvers sometimes don't come back. |
| **Angling** | Lines in lakes, rivers and the Underpool | **Reel**: hold line tension in a band while the fish runs. **Lure cast**: arc a cast into a ripple. | Moon phases change which species bite | *Wet Moon*: every phase counts as full moon. *Leviathan Bait* (C): 1% chance of a boss fish that takes the rod. |
| **Foraging & Herbcraft** | Gatherers collect herbs, mushrooms and pollen | **Pick clean**: snip stems without touching thorns. | Patches regrow by season and spread when left alone | *Mycelium Net*: mushrooms grow on Felling's stumps. *Briar Crown*: thorns are a reagent too. |

**Refining**

| Skill | Idle | Mini-games | Special mechanic | Perks |
|---|---|---|---|---|
| **Sawyering** | Pit saws and water mills make planks and staves | Head rig with hidden knots and **grain glyphs** that you can save for enchanting | Grain quality carries into crafted gear stats | *Living Grain*: planks keep a little regrowth, and Joinery items repair themselves. |
| **Smelting** | Furnaces make bars and alloys | Tap the furnace; **Alloy pour**: fill 2 moulds at the right ratio | Alloy recipes are found, not given | *Starmetal*: meteor drops from Delving smelt as top-tier bars. *Slag Spirits* (C): 10% slag becomes a fight; it drops runes. |
| **Alchemy** | Vats brew potions and reagents | **Stir**: keep a colour mixture in the target zone by adding drops | Volatility: high-power brews can explode and take a vat out of action | *Stable Base*: no explosions; potions last 2× longer. *Transmute*: excess herbs convert to a random ore. |
| **Cooking** | Kitchen fires make meals (food for combat and buffs) | **Sear**: flip on a timer; **Stew**: add ingredients in sequence | Freshness decays, and meals buff the next skill action | *Hearth Ward*: cooking fires keep groves calm. |

**Crafting**

| Skill | Idle | Mini-games | Special mechanic | Perks |
|---|---|---|---|---|
| **Smithing** | Anvils turn out tools, weapons and armour | Draw the edge; **Quench**: dip at the right colour | Masterwork rolls with affixes | *Twin Forge*: every craft makes a tool and a weapon. *Cursed Edge* (C): weapons +50% damage and drain the user. |
| **Joinery & Bowcraft** | Benches make bows, staves, shields and furniture | **String a bow**: draw-weight balance meter. **Cut the joint** | Grain glyphs from Sawyering become fixed affixes | *Ironwood*: wood items count as metal for armour. *Arrowstorm*: bows fire 2 arrows; arrows run out 2× faster. |
| **Glyphcarving** (magic) | Carvers cut glyphs into wood, stone and metal | **Trace the glyph**: draw a rune shape in one stroke inside a tolerance band | Glyph combos: 2 glyphs on 1 item create a third effect | *Echo*: one glyph in 10 carves twice. *Unbound* (C): glyphs are stronger and can switch off at random. |

**Support**

| Skill | Idle | Mini-games | Special mechanic | Perks |
|---|---|---|---|---|
| **Beastkeeping** | Raises draught beasts, mounts and companions | **Gentle**: match a beast's breathing rhythm to calm it | Bonds: a beast assigned to a skill levels with it | *Owlbond*: a pet reveals tract secrets. *Wild Blood* (C): beasts are strong and sometimes go feral. |
| **Wardcraft** | Builds wards and shrines that slow grove anger and buff the camp | **Ring the bounds**: walk a circle of posts before the dark closes in | Ward radius covers nearby skill sites | *Sanctuary*: no guardians spawn inside wards, but nothing rare drops there either. |

**Combat (auto-battle, 1 skill line)**

| Skill | Idle | Mini-games | Special mechanic | Perks |
|---|---|---|---|---|
| **Expeditions** | A party auto-fights through Reach paths for drops | **Parry**: a timing window against a boss tell. **Volley**: aim one arrow at a weak spot. | Gear, food and potions from every other skill set the outcome | *Lantern Line*: the party carries a ward and never ambushes. *Blood Moon* (C): double enemies, double drops. |

### B3. Item flow
- Felling → Sawyering, Cooking (firewood), Smelting (charcoal), Glyphcarving (heartwood)
- Sawyering → Joinery (planks, staves), Wardcraft (posts)
- Delving → Smelting (ore), Glyphcarving (crystal)
- Smelting → Smithing (bars)
- Smithing → Felling, Delving, Angling (tools); Expeditions (weapons, armour)
- Joinery → Expeditions (bows, shields), Angling (rods)
- Foraging → Alchemy, Cooking
- Angling → Cooking
- Alchemy, Cooking → Expeditions (consumables), all skills (buffs)
- Glyphcarving → enchants on Smithing and Joinery output
- Expeditions → rare drops (seeds, ores and recipes for every other skill), and they clear new regions
- Wardcraft → reduces Felling's grove anger

**Strongest loops**
1. **Felling raises grove anger → guardian fights → Expedition drops → spirit-tree seeds back to Felling.**
2. **Delving → Smelting → Smithing → better pick → deeper Delving.** This is the classic loop.
3. **Grain glyph pipeline:** Felling (grain) → Sawyering (keep the glyph) → Joinery and Glyphcarving (affix). Logging quality decisions matter three skills later.
4. **Expeditions as the hub that eats consumables.**

### B4. The run and "close camp"
A run is one **warden-camp** pushed into one grove. Close camp means you have taken what the grove can give and lit the warding fire as you leave. The grove sleeps again, and what the camp learned becomes Legacy (Lore). Biomes: Fernmarch (starter), Ashen Holt (burnt forest, fire perks), Drowned Wood (mangrove, Angling-heavy), Hoarfrost Pines, and the Hollow Heart (endgame, where trees are alive).

### B5. Long-term goal
**Clear the Reach, one region boss at a time** (a Grovewarden for each biome). Every skill feeds the expedition loadout. Players who don't like combat can let expeditions idle on easy paths. Pure skillers can play wards-only, which slows grove anger without killing anything.

### B6. Fit with the prototype
**Carries over:** the fall, cut and skid mini-games and the tract and season systems. **Changes needed:** eras become tiers of tree and tool. Mill contracts become guild commissions. Drive a load must become a cart or river-barge run. All of the historical art and copy gets thrown out.

### B7. Scope and commercial notes
- **Audience:** largest. It sits right next to Melvor (~1M+ owners), OSRS idlers, and IdleOn / Melvor-like Steam lists.
- **Differentiation:** lowest. The "Melvor clone with roguelite" pitch has to beat Melvor on depth, which a solo developer can't.
- **Scope:** combat is the trap here. Combat needs monsters, gear stats, balance and boss tells, and it doubles the item list. Fantasy also needs icons for every item tier, at around 400+ item icons. AI icon generation helps but needs a strict style lock.
- **Risks:** grove anger and wards are the main differentiator, so make sure they ship.

---

## Option C (wildcard): "Outpost Company" (alt-history expedition frontier, cozy-industrial)

### C1. Premise and fantasy
It is 1890. A new landmass, the Reach, has risen from the North Pacific fog: old-growth forests of impossible scale, glacier valleys, hot-spring basins and petrified groves. Your chartered company sends out crews to set up **outpost camps**, work the land, chart it and fall back before winter or disaster. Each expedition reaches further inland. **Player fantasy:** the expedition boss in a cozy, slightly uncanny frontier (Dorfromantik, Frostpunk-lite or Timberborn meets an idle game), on the way to founding the first city on the new continent.

**Why this is the wildcard:** the roguelite structure is literal here. "Close camp," biomes and runs are what an expedition company actually does. It keeps the hands-on Americana logging fantasy and the eras from Option A. It also gets fantasy-level biome variety without monsters or combat. It is cozy, it is new, and it is easy to market in one image: a tiny camp at the foot of a 300 m tree.

### C2. Skill roster (12)

**Gathering**

| Skill | Idle | Mini-games | Special mechanic | Perks |
|---|---|---|---|---|
| **Logging** | Crews fell and yard timber from the tract | All four existing ones; giant trees take multiple falls | Tracts, contracts (now **charter orders**), seasons | *Giant's Fall*: one giant tree per run that yields a whole season. *Fog Felling* (C): +50% speed; fog hides tree lean, so bad falls happen more often. |
| **Prospecting** (mining) | Crews pan, sink shafts and quarry | **Pan**: tilt and swirl to keep the heavies; **Shot the face** | Survey map: hidden deposits, and each reveal cuts down the fog of war | *Placer Luck*: river tracts give gold flecks while Logging works upstream. *Glory Hole* (C): ×2 ore; your camp map shrinks by one tile. |
| **Fishing & Foraging** | Nets, traps and berry crews supply food | Set the net; **Pick clean** | Run windows and seasonal patches | *Smokehouse*: food doesn't spoil over winter. *Strange Shoals*: 5% catch is a curio worth Legacy. |
| **Hunting & Trapping** (no combat; furs and hides) | Trap lines | **Set the trap**: place it on fresh tracks before they fade | Animal migration routes across tracts | *Fur Brigade*: furs count as cash for any order. |

**Refining**

| Skill | Idle | Mini-games | Special mechanic | Perks |
|---|---|---|---|---|
| **Sawmilling** | A portable mill, then a steam mill, makes lumber | Head rig with hidden defects | Mill layout bottleneck | *Waste Burner*: sawdust heats the camp, so winter costs no fuel. *Clear Grain*: giant-tree boards count double. |
| **Smelting & Charcoal** | Kilns and a bloomery, later a furnace | Bank the kiln; Tap the furnace | Fuel grades | *Wood-Fired Bloomery*: needs no coal; charcoal only. |
| **Provisioning** | The cookhouse feeds crews | Cookhouse rush | Morale across all skills; winter rationing | *Hardtack*: rations never spoil; morale is capped at 80%. |

**Crafting**

| Skill | Idle | Mini-games | Special mechanic | Perks |
|---|---|---|---|---|
| **Smithing** | Tools, hardware, rail spikes | Draw the edge; Weld a link | Tool durability across skills | *Field Forge*: tools repair at camp during night idle time. |
| **Raising** (construction) | Builds camp structures: bunkhouse, flume, smithy, lookout, dock | **Raise a bent**: balance and pin a timber frame; **Lay the flume**: connect sections on a slope | Camp grid: structures placed on a small tile map buff the skills next to them | *Balloon Frame*: buildings cost 40% less, and winter storms damage them. *Prefab*: one building survives close camp. |
| **Engineering** (era gate) | Builds the steam donkey, Shay locomotive, aerial tramway | Set the governor | Era advance for the company | *Shay Gear*: machines run on any fuel. |

**Support**

| Skill | Idle | Mini-games | Special mechanic | Perks |
|---|---|---|---|---|
| **Surveying** | Chain crews chart tracts and push back the fog | **Triangulate**: line up 3 sightings to fix a point; **Sound the river** | **Fog map**: the shared map every skill draws its sites from. Charting reveals tract quality and events. | *Lucky Compass*: one perfect tract is guaranteed each run. *Uncharted* (C): unknown tracts give ×2, and their lean, ore and hazards stay hidden. |
| **Hauling** (logistics) | Trails, then plank roads, rail and barges move goods to the landing | Drive a load; Run the grade | Distance from camp to the landing (the ship) sets the real throughput of every skill | *Ice Road*: winter hauling is free. *Back-haul*: empty return trips bring supplies. |

### C3. Item flow
- Logging → Sawmilling (logs), Smelting (cordwood), Raising (poles), Hauling (ties, sled runners)
- Sawmilling → Raising (lumber), Hauling (planks for roads, flumes)
- Prospecting → Smelting (ore)
- Smelting → Smithing (iron)
- Smithing → Logging, Prospecting, Hunting (tools); Raising (hardware); Hauling (rails)
- Engineering → Logging (donkey), Hauling (locomotive), Sawmilling (steam rig)
- Fishing, Foraging, Hunting → Provisioning → morale for all skills
- Raising → camp buildings that buff adjacent skills
- Surveying → tract quality for all gathering skills
- Hauling → gates export of everything to the **charter ship**: Legacy and cash

**Strongest loops**
1. **Logging → Sawmilling → Raising (bunkhouse, flume) → faster Logging.** This loop is closed with zero new raw materials.
2. **Logging → charcoal → Smithing → saws and axes → Logging.**
3. **Surveying reveals → better tracts for Logging and Prospecting → more output to push the fog back.**
4. **Hauling sits between camp and ship.** It is the logistics gate, so each run has a spatial puzzle.

### C4. The run and "close camp"
A run is one **outpost**: you land at a cove, chart, build and work the site. Close camp is literal. Winter or disaster ends the season (or you choose to leave), crews strip the camp, and the charter ship carries home the season's take. That cargo becomes Legacy (Charter Shares).

Biomes are **Reach regions**: Fogbound Coast (starter), Giant Groves (500 m trees), Glacier Valleys (ice roads, avalanche), Hot-Spring Basin (geothermal kilns, odd ores), Petrified Wood (stone-wood that only Smithing tools can cut) and the Interior (endgame). Difficulty modifiers are written as **charter clauses**: "Winter comes 20 days early," "No resupply ship," "Investors demand dividends."

### C5. Long-term goal
**Push inland and found Landfall City.** Each region you clear (charted plus one finished outpost) unlocks the next region and adds a permanent building to the city: the company's meta base, which is also the meta tree made visible. Every skill feeds the city's milestones, such as "the first railway into the Interior," "the Great Mill" and "the Deepwater Pier." No combat is needed. The pressure comes from **hazards** (fire, storms, fog, floods) that difficulty modifiers can turn up. Optional late content: "the Interior's mystery" story beats revealed by Surveying.

### C6. Fit with the prototype
**Carries over:** all four logging mini-games, tracts, seasons and contracts (reskinned as charter orders), plus the 1880→1990 eras as company tech. It reuses almost everything from Option A. **Changes needed:** cash becomes a secondary currency, regions become invented rather than historical, and the logging tract goes onto the shared fog map. That means building a simple map layer, which every later skill will reuse.

### C7. Scope and commercial notes
- **Audience:** large. It pulls in cozy builders (Dorfromantik, Timberborn, Townscaper), the "expedition/settlement" crowd (Frostpunk, The Long Dark lite) and idle and skill players. It is also streamable, because the "giant tree falls on camp" moment makes a good clip.
- **Differentiation:** high. The expedition frame explains the roguelite loop, and the alt-history mystery adds pull that pure history doesn't have.
- **Art:** moderate. Diorama or engraving style, one shared map tileset and one camp-structure kit for every skill. There is no monster roster. The weird biomes are recolours and scale changes of real ones (glacier, hot springs, petrified wood), which AI tools handle well.
- **Risks:** "cozy" and "survival" can pull in different directions. Hazards must stay soft, never a fail state, to protect "idle is always enough." The city meta-base is extra scope, so ship it as a static screen with lit buildings, not a playable builder.

---

## Comparison

| Setting | Audience size | Differentiation | Fit with prototype | Scope/art burden | Combat needed? | Score (/10) |
|---|---|---|---|---|---|---|
| **A. Timber & Iron** | Medium (history, sim) | High | **Excellent**, near 1:1 | Moderate: 4 eras × props | No | **7** |
| **B. Wildwood Reach** | **Large** (Melvor/OSRS) | Low–medium | Fair: reskin, lose eras | **High**: combat, 400+ icons | Yes (soft) | **5.5** |
| **C. Outpost Company** | Large (cozy + idle + expedition) | **High** | **Very good**: keeps eras and mini-games | Moderate: shared map + camp kit | No | **8.5** |

## Recommendation

**Go with C, "Outpost Company."** It keeps everything already built for Logging, including the historical crafting texture of A. It also adds the two things A lacks: a fiction where "run" and "close camp" mean something, and biome variety that makes roguelite regions exciting rather than "another forest in Oregon." It avoids B's combat and icon burden. If you later want danger, hazards and story can carry it without a combat system.

**First three skills: Logging + Sawmilling + Raising.**
- **Why these:** together they close a full loop with no new raw resource. Logging makes logs, Sawmilling turns them into lumber, Raising builds bunkhouses and flumes, and those buildings speed up Logging.
- **What it tests:** whether cross-skill dependence feels good before you add Mining, which is needed for Smithing.
- **Roguelite layer:**
  - Each skill gets its own perk draft, and some perks cross over, such as *Waste Burner* (Sawmilling sawdust heats the camp) and *Giant's Fall* (Logging) feeding *Clear Grain* (Sawmilling). Testing those is the cheapest way to check "perks change rules across skills."
  - Raising's camp grid tests the first piece of the region map.
  - Close camp on any one of the three while the other two keep running tests "a reset never stops everything."
- **What comes next:** add Surveying as skill 4, because it is the shared fog map every later skill uses. Then Prospecting and Smithing together to close the tool loop.
