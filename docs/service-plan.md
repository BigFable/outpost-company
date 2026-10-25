# Service Plan: Today Through Three Years After Launch

*Written 2026-10-22, revised after the owner's decisions (1.0 roster updated 2026-10-24: 9 skills, Sawmill second, Fishing added). Decided: $9.99 for the full experience; Early Access first (about 6 months) at $7.99, then 1.0 at $9.99; at least 3 years of updates, all free; prestige per skill; TypeScript + Electron. Still open: what the 3-year clock counts from.*

## 1. What "the full experience at $9.99" means

A player who buys at 1.0 should be able to play from a first outpost to founding Landfall City, and still have reasons to replay. Melvor Idle sells at the same price, so players will compare.

| Area | In 1.0 |
| --- | --- |
| Skills (9) | Gathering: **Logging, Fishing, Prospecting**. Refining: **Sawmilling, Smelting & Charcoal**. Crafting: **Raising, Smithing**. Support: **Surveying, Hauling**. Unlock order: Logging, then the **Sawmill** (opens on the first Logging close camp, `docs/design/sawmill-camp.md`), then **Fishing** (recommended: opens on the first Sawmill close camp, `docs/design/fishing-camp.md`), then the rest |
| Regions (3) | Fogbound Coast (starter), Giant Groves, Glacier Valleys |
| Run system | Drafted perks in every skill (about 12 each, plus about 15 shared, so roughly 125), about 10 charter clauses (difficulty modifiers), a Legacy tree per skill plus a company-wide one |
| Mini-games | 12 to 14, no more than 2 per skill, all optional (idle always works) |
| Shared systems | Fog map, camp grid, seasons with weather events (`docs/design/seasonal-events.md`), a species system with trade-offs and orders (`docs/design/species-overhaul.md`), two eras (hand tools, then steam), offline progress, about 100 achievements |
| Ending | Clearing all three regions founds Landfall City (stage one). The credits moment is real, and the city keeps growing in later updates |
| Platform | Steam Cloud saves, Windows, Mac, Linux, Steam Deck playable with a controller, English text |
| Length | About 25 to 40 hours to the ending, with replay value (my estimate, to be checked in playtests) |

**Cut line, if time runs short:** Prospecting and Hauling move to the first update, then Fishing. The minimum 1.0 is six skills (Logging, Sawmilling, Raising, Surveying, Smelting, Smithing), still with all three regions. The design reviewer should confirm that six still closes the tool loop.

**Deliberately left for updates:** Provisioning, Foraging, Hunting & Trapping, Engineering (later eras), regions four to six (Hot-Spring Basin, Petrified Wood, the Interior), Landfall City districts, challenge modes, more languages, mobile.

## 2. Pre-launch timeline

Week 1 starts today. Dates include no buffer unless noted. The tech plan advises adding about 25%.

| When | Weeks | What happens | Gate |
| --- | --- | --- | --- |
| Oct 22 to Nov 5, 2026 | 1-2 | Project set up; Steam and Electron spike | **G1: Steam spike go/no-go.** Achievements and cloud save work on Windows, Mac and Deck, or we switch the wrapper |
| Nov 2026 to Dec 31 | 3-10 | Shared core, Logging port, Sawmilling (playable since playtest round 2), species and seasons slices, Raising, roguelite layer | **G2: Vertical slice** (about Dec 31; realistically mid-January). Play it start to finish. Note the tech plan used Firemaking as the second skill; here it is Sawmilling (decided 2026-10-24), then Raising. Fishing comes later |
| Jan to Feb 2027 | 11-17 | Small playtest group; Surveying added; polish, controller support | **G3: Fun check.** Is run 2 fun, and are the balance targets met? If not, fix before adding content |
| Jan 2027 | - | Steam page ("Coming soon") goes live as soon as capsule art exists, to start collecting wishlists | Owner approves anything public |
| Feb 25 to Apr 1, 2027 | 18-23 | Public demo (itch.io web build, then Steam demo) | **G4: Demo ready** |
| Early May 2027 | - | Demo build submitted to Steam, 3 to 5 weeks ahead of the festival | **G5: Wishlist check.** 2,000 or more wishlists enter **Next Fest, June 14-21, 2027**. Under 2,000: wait for the October 2027 Next Fest |
| Jun to Aug 2027 | - | Fishing, Prospecting, Smelting, Smithing, Hauling; Glacier Valleys (species slice 3 hardwoods) | |
| About Sep 2027 | - | Early Access release at $7.99 | **G6: Release readiness.** Balance bots inside targets, no soft-locks, old saves load, owner signs off |
| About Mar 2028 | - | 1.0 | G6 again |

## 3. Launch path: Early Access first (decided)

| | **The plan: Early Access, then 1.0** | **Fallback note: straight to 1.0** |
| --- | --- | --- |
| Festival | June 2027 | October 2027 |
| First sale | About Sep 2027 (month 11), at $7.99, with 5 to 6 skills and 2 regions | About Feb to Mar 2028 (month 16 to 17) |
| 1.0 | About Mar 2028 at $9.99, after about 6 months in Early Access | Same day as first sale |
| The $9.99 promise | The store page says clearly that Early Access is unfinished and the price rises at 1.0 | True from day one |
| Risk | Players judge an unfinished game; early refunds and reviews; pressure to update on a schedule (Steam bars promised dates) | Longer silence, wishlists fade, no safety net for bugs |

**Gates for the plan:** G3 (the game is fun) and G5 (2,000 or more wishlists). If either fails, fall back to straight 1.0 with the October 2027 festival, or delay Early Access. Do not launch cold.

**Keep Early Access short.** Six months, not Melvor's two years. State the 1.0 plan and the content still to come on the store page, without promising dates.

**Open: what the 3-year clock counts from.** Options: (1) from first sale in Early Access, or (2) from 1.0. **Recommendation: from 1.0**, so a player who buys at 1.0 gets a full three years. The cost is about 3.5 years of work after first sale. Worded publicly, it is the owner's call.

## 4. Three-year update cycle (Year 1 begins at 1.0)

| Quarter | Year 1: Settling in | Year 2: Inland | Year 3: Landfall |
| --- | --- | --- | --- |
| **Q1** | Patches; Deck Verified push; quality-of-life (offline summary, filters, accessibility) | Quality-of-life; weekly challenge run (seeded) | Quality-of-life; mastery polish |
| **Q2** | **Major:** Provisioning + Foraging; morale system; Hot-Spring Basin (region 4) | **Major:** Engineering and the third era; Petrified Wood (region 5) | **Major:** the Interior (region 6); Landfall City districts |
| **Q3** | Summer event; new perk set for older skills; patch | Event; Hunting & Trapping; new mini-games for old skills | Event; final era; Landfall City expansion |
| **Q4** | Winter event; more languages; patch | Challenge modes (harder clauses); balance pass from player data | Anniversary event; Landfall City complete; decide what comes next |

*Builds toward:* Year 1, the coast is full and the camp feels alive. Year 2, the company pushes inland and the eras advance. Year 3, Landfall City becomes the visible home of the meta tree.

### All updates free (decided)

The two big content drops stay on the plan as **free major updates**: Year 2 Q2 (Engineering, the third era and Petrified Wood) and Year 3 Q2 (the Interior and Landfall City districts). No paid DLC.

**Revenue logic.** Money comes from new buyers, not from existing owners. Each major update is a reason for press, streamers, a Steam front-page update slot and a wishlist bump. Sales come from three sources:
- **Steam sales:** seasonal sales and a launch discount at 1.0. Note that raising the price blocks discounts for 30 days, so plan the $7.99 to $9.99 change and the first sale around that.
- **The 1.0 relaunch:** the biggest single marketing moment, with a new trailer and a second round of coverage.
- **Long tail:** each free update lifts reviews and word of mouth, which feeds the first two.

**Community.** Strong goodwill and good reviews. The trade-off: three years of work is funded by about one $9.99 purchase per player. Revenue is front-loaded around Early Access, 1.0 and the first year.

**What keeps three years sustainable without paid DLC:**
- A strict content budget per skill and a cut line, so each update stays small enough to finish.
- Agents do the recurring work (balance runs, QA, briefs), so the owner's time stays near 4 to 6 hours a week.
- Year 1 is deliberately light on cost, and the owner can still add a cosmetic supporter pack later (not decided).
- A quarterly review: if sales fall below the cost of continuing, scale the cadence to patches and events, which still honours "at least 3 years of updates". Any change goes to the owner.

## 5. What sustains three years

- **Skills are content, not code.** Each skill is a module of data (actions, perks, achievements) plus a few small named effects. The budget per skill: one idle loop, at most two mini-games, 10 to 15 perks, one Legacy branch. Roughly 8 to 10 weeks per skill pair, including the balance run.
- **Agent routines.** Balance simulation runs on every change, and a change that breaks a target fails. The producer writes a weekly brief. The launch agent does a weekly market watch. QA checks that old saves still load before every release.
- **Release rhythm.** Beta branch on Steam first, a week of testing, then public. Big update every quarter, patch about monthly.
- **Community.** A Discord for balance feedback. r/incremental_games allows one post per game every 30 days, so use that slot only for a demo or major update, and use Feedback Friday otherwise. Short clips of tree falls and run summaries for YouTube and streamers.
- **Owner time, realistic:** about 4 to 6 hours a week. That covers 30 minutes on the brief, an hour on decisions and playtesting, 1 to 2 hours on Discord and posts, and an hour of admin. Expect 10 to 15 hours in release weeks.

## 6. Risks and owner decisions

| Risk | Mitigation |
| --- | --- |
| Scope creep: skills times perks times mini-games | Per-skill budget; cut line in section 1 |
| Balance drift as content grows | Balance targets in CI; perk-dominance checks |
| Wishlists fall short of 2,000 | Move to the October festival; do not launch cold |
| Burnout over three years | Fixed cadence, public promises kept loose, content frozen when behind |
| Missing art and sound | Shared kit (one tileset, one camp-structure set); buy rather than build audio |

| Decision | Options | Recommendation |
| --- | --- | --- |
| What the 3-year clock counts from | First sale, or 1.0 | From 1.0 |
| Spending (about $1.5K to $8K: art, trailer, legal entity) | Minimum or fuller | Start minimal; spend after G5 |
| Naming and legal (title, trademark, use of "RuneScape" and "Melvor") | Own it with a lawyer check | Check before the Steam page goes live |
| Supporter pack and mobile | Now or later | Later, after 1.0 |
