# Roadmap

*Updated 2026-10-26 (weekly brief `reports/2026-10-26-weekly.md`). Status values: done, in progress, next, later. Decisions live in `DECISIONS.md`; the four-week plan is `docs/plan-next-4-weeks.md`.*

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
| 2026-10-25 | Owner tuning applied to the preview: regular first order, Fish run x0.92, time-weighted bad-luck measure, c20 needs 16 | Merged to main with species + seasons slice 1 |
| 2026-10-25 | Species slice 1 + seasons slice 1 merged to main | |
| 2026-10-25 | Land office and cutting-queue rework (order-fit notes, camp note, lot switching, queue, 4-offer board, AFK lot) | AFK lot fixes per owner 2026-10-26 |
| 2026-10-25 | Phone build (touch, phone-width layout, save backup) and plain-language pass | Not yet checked on a real phone |
| 2026-10-25 | Bug hunt and fixes (12 of 13; Storm curse kept by owner) | Repro tests run in `npm test` |
| 2026-10-25 | Steam spike build and owner test plan (`docs/steam/spike-test-plan.md`) | Result waits on the owner's test run |
| 2026-10-25 | Launch drafts: itch.io playtest guide, store page draft, wishlist plan | `docs/launch/` |
| 2026-10-25 | Lot stash slice 1: Trees tab, Any / First / Skip per species, picking cost | |

## In progress
| Work | Where | Status | Notes |
| --- | --- | --- | --- |
| Round 4 file: camp money slice 1 + owner tuning, several charter orders at once, lot stat colors | `integrate/round4` (`build/camp-money`, `build/more-orders`); `build/lot-colors` not yet in | On track | Needs QA save check and a balance run before merge |
| Playtest round 3 (species + seasons, on phones too) | main | At risk | Phone build untested on a real phone; no file sent yet |
| Steam spike (achievements, cloud save, Win/Mac/Deck) | `docs/steam/spike-test-plan.md` | Blocked | Waiting on the owner to run the test (gate G1) |
| Store-page plan | `docs/launch/` | Waiting on owner | Nothing goes public without the owner |
| Late-run active-play design | `docs/design/late-run-active-play.md` | Waiting on owner | Proposal; aimed at the active-play miss below |
| Land office lot slots | `docs/design/lot-slots.md` | Waiting on owner | Proposal with measured unlock timings |

## Next
1. Finish and merge the round 4 file; real-phone check; playtest round 3.
2. Steam spike result and the owner's Steam fee call (G1).
3. itch.io web build for friends (unlisted).
4. Species slice 2 (mill and heavy-wood games), after round 3 feedback.
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
- Species and seasons slice 1: merged; baseline re-recorded 2026-10-25. Camp money tuning and multi-orders still need a balance run together before round 4 merges.
