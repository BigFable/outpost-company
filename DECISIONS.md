# Decisions

Owner decisions only, newest first. Each entry: date, decision, why.

| Date | Decision | Why |
| --- | --- | --- |
| 2026-10-25 | Species overhaul approved as designed in docs/design/species-overhaul.md, with: Domino fall unchanged (it can chain through Giant cloudwood); Giant cloudwood stays near 4.8× pine value (not cut to 2.2×); Ghost cedar deferred to the Fishing camp | Owner's calls on the species design |
| 2026-10-24 | Sawmill fixes: log slider default 20%→10% and the mill pays half price for logs it takes; more amber pitch (buck finds base chance .2→.35, idle .02→.06/min); easier special orders (Admiralty 24 spars + 4 pitch → 16 + 2; Caulk 10 pitch → 6). Special-order bonus cap stays at 25% | Balance check of the Sawmill build: the slider cut idle run-2 speed-up to 15%; pitch made orders nearly unfillable; the 35% cap never binds |
| 2026-10-24 | Before round 2: fix the Steam Camp cash trap (pushing to Steam Camp always lists a tract priced at or under half the push price), add a mid-game delivery achievement around 2M bd ft (~$10K), and trim haul bonuses to about 60% (full load +25%→+15%, under par +10–30%→+6–18%) | Balance check of the playtest 1 fixes: up to 21 min stuck without timber after a windfall push; haul pay pulled big achievements into the first minutes of run 2 |
| 2026-10-24 | Domino fall stays as playtesters have it; its balancing is cut short | Owner: more playtesting first |
| 2026-10-24 | Second camp is the Sawmill, not Fishing: the game goes Logging → Sawmill, and the Sawmill opens after the first Logging close camp. Supersedes the Fishing-second decision earlier today | Owner: "I want the game to go from logging to sawmill" |
| 2026-10-24 | Fishing stays in the game as a later camp; 1.0 has 9 skills | Owner chose to add Fishing rather than cut a skill |
| 2026-10-24 | Camp structures stay built when a camp closes camp | Owner's call: camps get easier every run |
| 2026-10-24 | Build now for playtest round 2: warehouse, Prime timber drops, and the second camp (Sawmill), after the current mini-game fixes land | Owner approved the build |
| 2026-10-24 | Assumed, owner to confirm: each camp keeps its own cash | Owner didn't pick; recommended so a big Logging run can't instantly buy out a new camp |
| 2026-10-24 | After the first prestige the game widens: a Fishing camp opens as the second skill. Logging produces progressive item drops (fine/Prime logs) used to build and improve other camps, e.g. the fishing dock and poles | Owner's call from playtest 1; Fishing fits the fogbound coast and gives logging drops a purpose |
| 2026-10-24 | Playtest 1 fixes: hauling overhaul (no stall-outs, no max-load fine, par from the track, better haul perks and improvements); bucking guides and hint; skid mud-boost legendary perk and huge log trains; equipment buy multiplier | Feedback from the owner and friends |
| 2026-10-24 | Prime timber build waits for playtest feedback from the owner and friends | Owner wants player feedback before more gameplay changes |
| 2026-10-24 | No new currency: keep cash and Charter Shares only (Old silver cut) | Fewer currencies to track |
| 2026-10-24 | Missed special orders come back later with no penalty | Friendly to idle and casual players |
| 2026-10-24 | Balance agent may raise the special-order bonus cap from 25% to 35% only if active play stays below 1.5× casual | Room to reach the active-play target |
| 2026-10-24 | Mini-game value: build Prime timber + special charter orders, extended with item drops, an inventory, and tracking for additional currencies. Named hands is rejected | Owner's pick from docs/design/minigame-value-options.md; gives active play an output idle can't easily make |
| 2026-10-24 | Accept the interim balance fixes (bounty rate .6→.25 with a per-outpost cap, +8 Charter Shares per era, idle unlock routes for 17 improvements, max 2 boosted stages) with the Felling wedges idle route raised from 12 to 20 tracts | Removes the idle stall and keeps run 2 25–40% faster; verified on 6 seeds, no soft-locks |
| 2026-10-24 | Fix the simulation bot so every player type gets the same opening clicks, then record a new official balance baseline | The idle bot's head start distorted the speed comparisons |
| 2026-10-24 | Design reviewer proposes ways mini-games give something idle can't; options come to the owner before anything is built. Further gameplay changes wait for playtest feedback from the owner and friends | Number tweaks alone can't make active play pay off; owner wants player feedback first |
| 2026-10-22 | Prestige is per skill: closing camp resets only that skill | Other outposts keep running during a reset (design pillar 4) |
| 2026-10-22 | All updates during the 3-year cycle are free; no paid expansions | Owner's call: maximum goodwill; revenue comes from new buyers |
| 2026-10-22 | Launch path: Early Access first (about 6 months), then 1.0 | Player feedback before 1.0; producer's recommendation |
| 2026-10-22 | Early Access price $7.99, rising to $9.99 at 1.0 | Rewards early buyers; 1.0 is the $9.99 full experience |
| 2026-10-22 | Stack: TypeScript + web UI, mini-games on canvas, packaged for Steam with Electron | Owner doesn't code and asked for whatever is easiest for owner + Claude to build together; this stack is what AI writes best, keeps the prototype and simulation bot, and gives a web demo for free |
| 2026-10-22 | Price: $9.99, the full experience at that price (premium, no free-to-play) | Matches Melvor Idle's proven price point; owner wants players to get the whole game |
| 2026-10-22 | Support commitment: at least 3 years of updates after launch | Owner's call; idle players stay for years and expect a steady update cadence |
| 2026-10-22 | Standing agents: master dev plus engineer, balance, QA, design review, producer and launch agents; weekly producer check-in and weekly market watch | Owner wants an agent team to guide the game from prototype to sale |
| 2026-10-22 | Project lives in a GitHub repo | Code, docs, sim and reports in one place every agent session can reach |
| 2026-10-22 | Setting: Outpost Company (1890 alt-history expedition, no combat) | Best fit with the logging prototype, strongest differentiation, lowest art burden (scored 8.5/10) |
| 2026-10-22 | Direction: idle roguelite skilling game ("Melvor-style with mini-game progression"); Timberline becomes the Logging skill | Owner's pitch |
| 2026-10-22 | Improvements unlock from mini-game runs, not cash | Owner: upgrades should reward play, not eat income |
