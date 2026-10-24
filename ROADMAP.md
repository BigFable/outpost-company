# Roadmap

Status values: done · in progress · next · later.

| # | Milestone | Status | Notes |
| --- | --- | --- | --- |
| 1 | Roguelite prototype in Timberline (drafts, close camp, Legacy, meta tree) | done | Interim balance fixes landed 2026-10-24; see open tuning items below |
| 2 | Decisions: engine, business model, per-skill vs global prestige, working title | in progress | Decided: TypeScript + Electron; $9.99 full experience; 3-year support. Also decided: per-skill prestige, Early Access ($7.99) then 1.0 ($9.99), all updates free. Open: working title, what the 3-year clock counts from |
| 3 | Re-theme Logging to Outpost Company (names, regions as biomes, close-camp fiction) | done | Display text only; balance identical. Owner to confirm era years, Charter Shares, species names |
| 3b | Build foundation (tech plan M0–M1): balance baseline, TypeScript workspace, Vite, Electron shell, CI | done | `pnpm run check` runs everything CI runs |
| 4a | Core extraction (tech plan M2): formulas, generators and content data in packages/core, inlined into the prototype | done | Behavior byte-identical; 58 unit tests. Next: M3 (game state, tick, seeded RNG streams) |
| 4b | Playtest round 2 build: warehouse, Prime timber, finds, special orders, Sawmill camp | done | Landed 2026-10-24 with the owner's Sawmill fixes (log slider 10% and half price for logs the company takes, more amber pitch, smaller special orders); balance baseline re-recorded. Deferred: Sawmill finds and special orders, the edger and later mill structures, 3 more finds, the Lamp-lighter, collection achievements. Open misses: mill active vs casual about 1.26× (target 1.5–2×); idle unlock gaps late in runs 2–3 |
| 4 | Electron + Steam go/no-go spike (achievements, cloud save on Windows, Mac, Steam Deck) | later | Week 2 of the tech plan |
| 5 | Vertical slice: shared core + Logging + Sawmilling + Raising + roguelite layer | later | About 10 weeks after the stack decision |
| 6 | Playtest round with a small group | later | Bot checks balance targets on every change |
| 7 | Steam page, trailer, demo; aim for a 2027 Next Fest (June or October) | later | Needs 2,000+ wishlists going in |
| 8 | Launch on Steam at $9.99 | later | Months 10–14 by the research estimate |
| 9 | Three-year update cycle | later | Draft plan in `docs/service-plan.md`: 8-skill 1.0 scope, pre-launch gates, Early Access vs 1.0, quarterly cadence for years 1-3. Decided: Early Access ($7.99) then 1.0 ($9.99), all updates free, prestige per skill. Open: what the 3-year clock counts from |

## Open tuning items
Landed 2026-10-24: bounty rate .25 with a 20% per-outpost cap, +8 Charter Shares per era, idle unlock routes for 17 improvements, at most 2 boosted stages; the bot now gives every profile the same opening clicks, and the balance baseline is re-recorded. Further tuning waits for playtest feedback (owner, 2026-10-24). Remaining misses (6 seeds, 3 runs, 8 h):
- Active play pays too little: mini-game vs casual is 1.29× by time to Diesel Road (gas policy) and 1.10–1.37× by Charter Shares per minute (target 1.5–2×). The owner picked Prime timber + special charter orders to address this (DECISIONS.md, 2026-10-24).
- Mini-game players' run 2 is only 15% faster than run 1 (gas policy; target 25–40%). Idle 25%, casual 39% pass. Under the shares-per-minute policy, run 2 barely beats run 1 for idle and mini-game players.
- Achievement/unlock gaps run 28–48 min, longest late in run 3 when early ladders are already held (target under 20 min). Counting perk drafts as events, every profile stays under 16 min.
