# Decisions

Owner decisions only, newest first. Each entry: date, decision, why.

| Date | Decision | Why |
| --- | --- | --- |
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
