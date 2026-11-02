# Roadmap

*Updated 2026-11-02 (weekly brief `reports/2026-11-02-weekly.md`). Status values: done, in progress, next, later. Decisions live in `DECISIONS.md`; the four-week plan is `docs/plan-next-4-weeks.md`.*

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
| 2026-10-28 | Round 5 merged: several charter orders, camp money slice 1 + tuning, color-coded lots, four lot slots, round 4 tuning | Balance baseline recorded for round 5 |
| 2026-10-28 | Zero-income stall rescue (company advance) | No-soft-lock pillar |
| 2026-10-28 | UI rework slices 1-2: sidebar, top bar with bell, phone bottom tabs, camp tabs, stage cards, Almanac screen | |
| 2026-10-28 | Designs approved: UI rework, inventory revamp, perk shop, resource names and tier ladder, achievements rework | `docs/design/` |

## In progress
| Work | Where | Status | Notes |
| --- | --- | --- | --- |
| Round 7b: UI slice 3a (Warehouse icons, renames, tier colors, Almanac/Settings), achievements rework (63), simpler lots + AFK lot always for sale, rising crew wages (15% step, 60% cap) | `integrate/round7b` | At risk | Tests pass; 21 of 72 timings off the baseline; needs balance sign-off, new baseline and QA save check before merge. No commits since 2026-10-28 |
| Playtest round 3 (on phones too) | main | At risk | Phone build untested on a real phone; no file sent. Recommendation: wait for round 7b |
| Steam spike (achievements, cloud save, Win/Mac/Deck) | `docs/steam/spike-test-plan.md` | Blocked | Waiting on the owner to run the test (gate G1) |
| Store-page plan | `docs/launch/` | Waiting on owner | Nothing goes public without the owner; drop RuneScape comparisons (Melvor 2 now carries the name) |

## Next
1. Merge round 7b; real-phone check; itch.io file for playtest round 3.
2. Steam spike result and the owner's Steam fee call (G1).
3. UI rework slice 3b: Shop screen with the perk shop.
4. "Follow your lead" (late-run active play), after the UI rework.
5. Species slice 2 and seasons slice 2, after round 3 feedback.

## Later
- Species slice 3 (hardwoods, giant cloudwood); Sawmill finds, special orders and later mill structures.
- Fishing camp (third camp, 9 skills in 1.0); Raising, Surveying, then the rest.
- Vertical slice, fun check (G3), public demo, Next Fest (June 2027, needs 2,000 wishlists), Early Access about Sep 2027 at $7.99, 1.0 about Mar 2028 at $9.99, three-year update cycle. Details in `docs/service-plan.md`.

## Open balance misses
Last recorded baseline (6 seeds, 3 runs, 8 h), after the 2026-10-24 fixes:
- Active play pays too little: mini-game vs casual about 1.29x by time to Diesel Road and 1.10-1.37x by Charter Shares per minute (target 1.5-2x). Sawmill active vs casual about 1.26x. Prime timber and special orders were the answer; the late-run design is the next step.
- Mini-game run 2 is 15% faster than run 1 (target 25-40%). Idle 25% and casual 39% pass.
- Achievement/unlock gaps of 28-48 min late in run 3 (target under 20). Counting perk drafts, every profile is under 16 min. Idle unlock gaps also persist late in Sawmill runs 2-3.
- Round 5 baseline recorded 2026-10-28. Round 7b (achievements, rising wages) moves 21 of 72 timings off it; mini-game run 2 is only 6% faster than run 1; rising wages leave idle run 2 at 19-20%. Needs a balance sign-off and new baseline before merge.
