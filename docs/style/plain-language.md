# Plain-language style guide

Every word a player reads: panels, buttons, cards, toasts, the camp log, mini-game help and status lines, perks, items, weather. Written for the phone build (2026-10-25), where space is short.

## Voice
- 1890 coast flavor, plain words. Place names (Fogbound Coast, Whistle Pond, Foghorn Point), ship and client names (the Perseverance, the Admiralty) and the era names carry the setting. Everything else uses everyday words.
- Talk to the player as "you". Say what happens, then the number: "Felling ×1.25", "Lots cost 15% less".
- Flavor goes in story cards and weather cards, one short line at most. Rules text has no flavor.
- Aim for a grade 6–7 reading level: short sentences, common words, one idea per sentence.

## Length limits
| Element | Limit |
| --- | --- |
| Button | 2 words, plus a number or state ("Pick perk (2)", "Auto-fill: on", "Sail · +12 shares") |
| Card or row title (perks, items, equipment, improvements, structures) | 4 words |
| Description | 1 short sentence, about 12 words. A rule with two parts may use two short sentences. |
| Help text (mini-game header, panel notes) | 3 short lines |
| Toast | a label, a name and one line |

## Device-neutral words
Never name a key or a mouse button. Use **tap** (it reads as tap or click), **hold**, **drag**, **let go**. Keyboard shortcuts still work; we just do not print them. "Tap ? for help", not "Press ?".

## Glossary
Kept game words (each is explained where the player first meets it):
| Word | Why kept | Explainer shown |
| --- | --- | --- |
| Fell, Buck, Skid, Haul | The four stage names; one word each, they fit the buttons | Work chain panel: "Fell trees, buck (cut) them into logs, skid (drag) logs to the landing, then haul them to the cove." |
| landing | Where logs wait for the haul; in the same explainer | Work chain panel |
| hinge | Core of the felling game | Felling help: "the uncut strip" |
| bd ft | Board feet, the volume unit everywhere | — |
| Charter Shares (short: shares), outpost, close camp, perk, reroll | Core loop words | Close camp panel |
| Prime, Clear, Select, Common, pulp, grade 1–3 | Item and grade names | Bucking guide, lumber yard |
| era | The four company stages (Cove Landing → Into the Interior) | Company panel |

Replaced:
| Old | New |
| --- | --- |
| tract, cutting rights, lots under contract | lot, buy a lot, your lots |
| stem (a felled tree before bucking) | trunk, felled trees |
| sawlog | log |
| turn (skid game load) | load; a clean turn → a clean skid |
| par | target, target time |
| pace boost | speed boost |
| upkeep | wages |
| premium | bonus |
| penalty | fine |
| bottleneck | slowest stage ("Slowest" chip) |
| draft (verb and button) | pick a perk ("Pick perk (1)") |
| charter clauses | extra rules |
| species order | tree order |
| cut for hire, hire work | hire job |
| barber chair | the trunk split |
| butt, butt rot, sweep, ring shake | base, rot, bend, cracks |
| cant (saw game) | the core |
| slab | scrap |
| headrig | circular saw |
| dispatch | season news |
| quiet season, counter, silver lining | calm season, fix, upside |
| scaler | grader (or dropped: "stamped Prime") |
| slash fire | brush fire |
| rolling (slope) | hilly |
| mill outpost | mill run |

Tree names (display only; save ids unchanged): pine → Pine, spruce → Spruce, hemlock → Hemlock, maple → Maple, oak → Oak, cloudwood → Redwood. Mid-sentence they are lowercase ("the pine order").

Mini-game names (buttons): Fell tree, Cut logs, Skid logs, Drive load, Saw boards. In rules text the games are "the felling game", "the bucking game", "the skid game", "the haul game" and "Saw boards".

## Numbers
- Use the game's formatters: `fmt` (1.2K, 3.4M), `money` ($1.2K, −$40), `bf` (12K bd ft), `mins` (30 s, 4.5 min, 1.2 h).
- Multipliers as ×1.25 (the × sign, no space). Changes as +15% or −20% (true minus sign). Ranges with an en dash: 4–10 ft.
- Whole percents. Seconds as "30 s". Distances as "2 mi", "120 yd".
- Never change a number when rewording. Text changes are not balance changes.

## Code rules
- Change display strings only. Ids, save keys, stat names and `data-*` values stay as they are.
- Strings the code parses stay parseable: weather `fx` lines keep the " · " separator (the season tile reads the first part).
- Tests that assert on display text move with the text.
