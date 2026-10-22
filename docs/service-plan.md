# Service Plan: Today Through Three Years After Launch

*Written 2026-10-22. A plan for the owner to react to, not a set of decisions. Decided so far: $9.99 for the full experience, at least 3 years of updates, TypeScript + Electron. Still open: Early Access vs 1.0, and paid vs free expansions.*

## 1. What "the full experience at $9.99" means

A player who buys at 1.0 should be able to play from a first outpost to founding Landfall City, and still have reasons to replay. Melvor Idle sells at the same price, so players will compare.

| Area | In 1.0 |
| --- | --- |
| Skills (8) | Gathering: **Logging, Prospecting**. Refining: **Sawmilling, Smelting & Charcoal**. Crafting: **Raising, Smithing**. Support: **Surveying, Hauling** |
| Regions (3) | Fogbound Coast (starter), Giant Groves, Glacier Valleys |
| Run system | Drafted perks in every skill (about 12 each, plus about 15 shared, so roughly 110), about 10 charter clauses (difficulty modifiers), a Legacy tree per skill plus a company-wide one |
| Mini-games | 10 to 12, no more than 2 per skill, all optional (idle always works) |
| Shared systems | Fog map, camp grid, seasons, two eras (hand tools, then steam), offline progress, about 100 achievements |
| Ending | Clearing all three regions founds Landfall City (stage one). The credits moment is real, and the city keeps growing in later updates |
| Platform | Steam Cloud saves, Windows, Mac, Linux, Steam Deck playable with a controller, English text |
| Length | About 25 to 40 hours to the ending, with replay value (my estimate, to be checked in playtests) |

**Cut line, if time runs short:** Prospecting and Hauling move to the first update. The minimum 1.0 is six skills (Logging, Sawmilling, Raising, Surveying, Smelting, Smithing), still with all three regions. The design reviewer should confirm that six still closes the tool loop.

**Deliberately left for updates:** Provisioning, Fishing & Foraging, Hunting & Trapping, Engineering (later eras), regions four to six (Hot-Spring Basin, Petrified Wood, the Interior), Landfall City districts, challenge modes, more languages, mobile.

## 2. Pre-launch timeline

Week 1 starts today. Dates include no buffer unless noted. The tech plan advises adding about 25%.

| When | Weeks | What happens | Gate |
| --- | --- | --- | --- |
| Oct 22 to Nov 5, 2026 | 1-2 | Project set up; Steam and Electron spike | **G1: Steam spike go/no-go.** Achievements and cloud save work on Windows, Mac and Deck, or we switch the wrapper |
| Nov 2026 to Dec 31 | 3-10 | Shared core, Logging port, Sawmilling, Raising, roguelite layer | **G2: Vertical slice** (about Dec 31; realistically mid-January). Play it start to finish. Note the tech plan used Firemaking as the second skill; here it is Sawmilling and Raising |
| Jan to Feb 2027 | 11-17 | Small playtest group; Surveying added; polish, controller support | **G3: Fun check.** Is run 2 fun, and are the balance targets met? If not, fix before adding content |
| Jan 2027 | - | Steam page ("Coming soon") goes live as soon as capsule art exists, to start collecting wishlists | Owner approves anything public |
| Feb 25 to Apr 1, 2027 | 18-23 | Public demo (itch.io web build, then Steam demo) | **G4: Demo ready** |
| Early May 2027 | - | Demo build submitted to Steam, 3 to 5 weeks ahead of the festival | **G5: Wishlist check.** 2,000 or more wishlists enter **Next Fest, June 14-21, 2027**. Under 2,000: wait for the October 2027 Next Fest |
| Jun to Aug 2027 | - | Prospecting, Smelting, Smithing, Hauling; Glacier Valleys | |
| Sep 2027 or later | - | First paid release (path a) | **G6: Release readiness.** Balance bots inside targets, no soft-locks, old saves load, owner signs off |
| About Mar 2028 | - | 1.0 | G6 again |

## 3. Two launch paths

Next Fest can be used only once per game.

| | **(a) Early Access, then 1.0** | **(b) Straight to 1.0** |
| --- | --- | --- |
| Festival | June 2027 | October 2027 |
| First sale | About Sep 2027 (month 11), with 5 to 6 skills and 2 regions | About Feb to Mar 2028 (month 16 to 17) |
| 1.0 | About Mar 2028, after about 6 months in Early Access | Same day as first sale |
| The $9.99 promise | Not true during Early Access. Sell at $7.99, rising to $9.99 at 1.0, and say so on the page | True from day one |
| Time with no income or outside feedback | About 11 months | About 16 months |
| Main risks | Players judge an unfinished game; refunds and early reviews; pressure to update on a schedule (Steam bars promised dates) | Longer silence means wishlists fade; a launch with real bugs has no safety net; the research found underperformers spent longer in pre-release |
| Three-year clock | Starts at 1.0 | Starts at launch |

**The clock.** "3 years after launch" is ambiguous in Early Access. I suggest counting from 1.0 in both paths, so a player who buys at 1.0 gets a full three years. Under path (a) the owner then works about 3.5 years after the first sale. Stating the wording publicly is the owner's call.

**Recommendation: (a), kept short.** Six months, not Melvor's two years. It brings in money and real playtest data while the game is still easy to change, and it fits the $9.99 promise through the lower price until 1.0. Do it only if the June wishlist gate passes and the game is genuinely fun at G3. Otherwise take path (b) with the October festival.

## 4. Three-year update cycle (Year 1 begins at 1.0)

| Quarter | Year 1: Settling in | Year 2: Inland | Year 3: Landfall |
| --- | --- | --- | --- |
| **Q1** | Patches; Deck Verified push; quality-of-life (offline summary, filters, accessibility) | Quality-of-life; weekly challenge run (seeded) | Quality-of-life; mastery polish |
| **Q2** | **Major:** Provisioning + Fishing & Foraging; morale system; Hot-Spring Basin (region 4) | **Major:** Engineering and the third era; Petrified Wood (region 5) | **Major:** the Interior (region 6); Landfall City districts |
| **Q3** | Summer event; new perk set for older skills; patch | Event; Hunting & Trapping; new mini-games for old skills | Event; final era; Landfall City expansion |
| **Q4** | Winter event; more languages; patch | Challenge modes (harder clauses); balance pass from player data | Anniversary event; Landfall City complete; decide what comes next |

*Builds toward:* Year 1, the coast is full and the camp feels alive. Year 2, the company pushes inland and the eras advance. Year 3, Landfall City becomes the visible home of the meta tree.

### Expansion variants

| | **A: All free** | **B: Two paid expansions, $4.99 each** |
| --- | --- | --- |
| Which updates | Everything above is free | Year 2 Q2 (Engineering + Petrified Wood) and Year 3 Q2 (Interior + city districts) are paid. Everything else stays free, including all fixes, quality-of-life, events and the Year 1 content |
| Revenue logic | Only base sales and any supporter pack. Big updates cause sales spikes, but the tail is thin | Illustration only: per 1,000 base owners, $9.99 nets about $7,000 after Steam's 30% cut. If 30% buy an expansion (my assumption), each adds about $1,050 per 1,000 owners |
| Community | Goodwill and strong reviews; a very visible "love letter" game | Accepted by this audience when the base game is complete: Melvor sells three $4.99 expansions at about 92% positive. Backlash comes from paywalling things that feel basic |
| Risk | Three years of work funded by a single $9.99 purchase | Players feel nickel-and-dimed if expansion content was teased for free |

**Recommendation: B, with firm rules.** Year 1 is all free (builds reviews and trust). Expansions add new skills, regions and perk sets and never remove or gate quality-of-life, balance or the Landfall ending. Announce the rules at 1.0. The owner decides whether to say it before Early Access.

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
| Early Access or 1.0 | (a) or (b) | (a), short, gated on G3 and G5 |
| Paid expansions | A or B | B, with the rules above |
| Meaning of "3 years" | From first sale, or from 1.0 | From 1.0 |
| Prestige per skill or global | Per skill, global | Per skill (matches pillar 4) |
| Spending (about $1.5K to $8K: art, trailer, legal entity) | Minimum or fuller | Start minimal; spend after G5 |
| Naming and legal (title, trademark, use of "RuneScape" and "Melvor") | Own it with a lawyer check | Check before the Steam page goes live |
| Supporter pack and mobile | Now or later | Later, after 1.0 |
