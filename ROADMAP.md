# Roadmap

*Updated 2026-10-25. Status values: done, in progress, next, later. Decisions live in `DECISIONS.md`; the four-week plan is `docs/plan-next-4-weeks.md`.*

## Done
| Date | Milestone | Notes |
| --- | --- | --- |
| 2026-10-22 | Roguelite prototype in Timberline (drafts, close camp, Legacy, meta tree) | Balance fixes accepted and landed 2026-10-24 |
| 2026-10-22 | Direction, setting, stack, price, support, Early Access path, per-skill prestige | See `DECISIONS.md`. Still open: working title, what the 3-year clock counts from |
| 2026-10-22 | Re-theme to Outpost Company | Display text only. Owner still to confirm era years, Charter Shares, species names |
| 2026-10-22 | Build foundation (M0-M1): balance baseline, TypeScript workspace, Vite, Electron shell, CI | `pnpm run check` runs what CI runs |
| 2026-10-22 | Core extraction (M2): formulas, generators and content data in `packages/core` | Behavior identical; 58 unit tests |
| 2026-10-24 | Playtest round 1 | Owner and two friends; feedback in `reports/2026-10-24-playtest-1.md` |
| 2026-10-24 | Playtest 1 fixes: hauling overhaul, bucking guides, skid perks, bulk buys | Plus pre-round-2 balance fixes (Steam Camp cash trap, mid-game achievement, haul bonus trim) |
| 2026-10-24 | Design specs: Prime timber and warehouse; Sawmill camp; Fishing camp; mini-game value options | `docs/design/` |
| 2026-10-24 | Playtest round 2 build: warehouse, Prime timber, finds, special orders, Sawmill camp | Owner's Sawmill fixes applied; baseline re-recorded |
| 2026-10-25 | Design specs: species overhaul and seasonal events | Both approved by the owner with rulings |
| 2026-10-25 | Species slice 1 (Cove trio) and seasons slice 1 (weather cards), built and merged for testing | Preview file delivered to the owner |
| 2026-10-25 | Owner tuning applied to the preview: regular first order, Fish run x0.92, time-weighted bad-luck measure, c20 needs 16 | Branch `build/species-seasons`; not yet on main |

## In progress
| Work | Where | Notes |
| --- | --- | --- |
| Species slice 1 + seasons slice 1 | `build/species-1`, `build/seasons-1`, merged in `build/species-seasons` | Awaiting owner playtest, then merge to main |
| Land office and cutting-queue rework (order-fit notes, camp note, switch lot, new queue) | `build/tract-queue` (owner-named; not yet pushed) | Owner decision 2026-10-25 |
| Phone build: touch controls, phone-width layout | Agents: phone audit under way | Required for the next playtest file |
| Bug hunt | QA agent, no branch yet | |
| Steam spike (achievements, cloud save, Win/Mac/Deck) | Agent under way | Gate G1 |
| Store-page plan | Launch agent | Nothing goes public without the owner |
| Late-run active-play design | Design reviewer | Aimed at the active-play miss below |

## Next
1. Phone build ships; playtest round 3 (species + seasons, on phones too).
2. Steam spike result and the owner's Steam fee call (G1).
3. itch.io web build for friends.
4. Species slice 2 (mill and heavy-wood games), after the phone build.
5. Seasons slice 2 (full coast, Sawmill hooks, dispatch orders), after species slice 1 is accepted.

## Later
- Species slice 3 (hardwoods, giant cloudwood); Sawmill finds, special orders and later mill structures.
- Fishing camp (third camp, 9 skills in 1.0); Raising, Surveying, then the rest.
- Vertical slice, fun check (G3), public demo, Next Fest (June 2027, needs 2,000 wishlists), Early Access about Sep 2027 at $7.99, 1.0 about Mar 2028 at $9.99, three-year update cycle. Details in `docs/service-plan.md`.

## Open balance misses
Last recorded baseline (6 seeds, 3 runs, 8 h), after the 2026-10-24 fixes:
- Active play pays too little: mini-game vs casual about 1.29x by time to Diesel Road and 1.10-1.37x by Charter Shares per minute (target 1.5-2x). Sawmill active vs casual about 1.26x. Prime timber and special orders were the answer; the late-run design is the next step.
- Mini-game run 2 is 15% faster than run 1 (target 25-40%). Idle 25% and casual 39% pass.
- Achievement/unlock gaps of 28-48 min late in run 3 (target under 20). Counting perk drafts, every profile is under 16 min. Idle unlock gaps also persist late in Sawmill runs 2-3.
- Species and seasons slice 1 balance runs: owner tuning applied; re-check after merge.
