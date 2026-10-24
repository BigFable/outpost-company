# What mini-games give that idle can't

*Design reviewer, 2026-10-24. Options for the owner; nothing is built yet.*

## The problem in plain words

Right now every mini-game reward is speed: a 30-second pace boost, +25% log value on a perfect fall, a little more draft progress, and earlier improvement unlocks (which now also have idle routes). Idle crews work 24 hours a day, so a few minutes of boosted speed gets diluted. The simulation puts active players at about 1.2× casual, against a target of 1.5–2×, and six rounds of number tweaks have not moved it.

One honest point first: anything an idle player can *also* reach is, in the end, still a speed advantage. The fix is not to escape that. It is to make active play produce a **different kind of thing**, something that compounds across runs and across skills rather than a short burst that hours of idle drown out. Every option below follows that rule, and every one keeps a slower idle path so pillar 1 holds.

(Already built and not enough on its own: better runs raise draft quality, so good play already favours rare perks. Keep it; it is not the answer.)

## The options

### 1. Prime timber and special charter orders
- **What you get:** A perfect fall or a top-grade cut marks those logs **Prime**. Special charter orders (an Admiralty spar order, the Landfall City cornerstone beams) want only Prime stock and pay extra Charter Shares or a one-off unlock.
- **Idle path:** Idle crews turn out a small share of Prime logs (about 2%, more with an improvement), so an idle player fills a special order every second outpost or so instead of every outpost.
- **Why it feels worth it:** A perfect fall leaves a visible pile of something you made, not a timer that runs out. **Risk:** if special orders gate regions or the city, they become mandatory. They must stay a premium path, never the only one.
- **Other skills:** Sawmilling's head rig makes clear quarter-sawn boards; Raising's frame game makes plumb-true buildings (one extra neighbour bonus); Surveying makes sworn surveys (a tract whose quality is known for sure). Prime output from one skill feeds the next skill's special orders, so active play in Logging speeds up Sawmilling. This is the strongest fit with "every skill is a run" plus the shared item graph.
- **Build size:** Medium.
- **Sim measure:** Prime made per hour for each bot; special orders filled per outpost (idle bot should fill at least one every two outposts); share of Charter Shares that comes from Prime.

### 2. Named hands (crew training)
- **What you get:** A streak of good runs promotes a crew lead to a named hand ("Ole Brandt, head faller") and you **choose** one trait from two. Traits change rules: *Reads the lean* (fog never hides lean), *Spar man* (one tree per tract is always Prime), *Night fallers* (the felling crew keeps working through winter at half pace). Named hands stay through closing camp.
- **Idle path:** Seniority. A crew that works three winters is promoted anyway, with a **random** trait. Active players get choice and speed; idle players get the same people later and by luck.
- **Why it feels worth it:** People, not numbers. Players remember Ole. **Risk:** permanent power across runs can break the "run 2 is 25–40% faster" target. Cap it at three named hands per skill, with traits that shape a run rather than multiply it.
- **Other skills:** head sawyer, master framer, chief chainman. Same promotion rule and trait slot, new trait list per skill.
- **Build size:** Medium.
- **Sim measure:** Time to first promotion and to a full roster for each bot; run-over-run speed with and without named hands.

### 3. Foreman's call
- **What you get:** After a strong run, the foreman brings you a choice for this outpost: "A spar tree stands on the ridge: divert a crew for a week" or "Fog bank coming in: push on blind for ×1.5, or hold."
- **Idle path:** One call per season comes to everyone. If you don't answer, the board takes the safe option.
- **Why it feels worth it:** It creates a decision and a story. **Risk:** it overlaps the perk draft and can feel like "more perks". It is fun, but it doesn't add much speed.
- **Other skills:** Easy. Each skill writes its own call deck.
- **Build size:** Small (it can reuse the draft window).
- **Sim measure:** How often the active bot sees calls compared with idle; how much choosing well changes outpost time.

### 4. Records open the map
- **What you get:** Personal bests (cleanest skid, longest perfect-fall streak) go into the Company Gazette. Each record notice unlocks a charter clause or a region variant early, such as the *Fog Felling* clause or a Giant Groves tract.
- **Idle path:** The same clauses and variants also unlock from lifetime Charter Shares.
- **Why it feels worth it:** Bragging rights and something new to try. **Risk:** low. Value is also low, because it unlocks variety rather than progress.
- **Other skills:** Every mini-game has a record.
- **Build size:** Small.
- **Sim measure:** Mostly the "under 20 minutes without an unlock" target, because records fill the gaps between unlocks.

### 5. The company ledger (keep one perk)
- **What you get:** An outpost closed with enough perfect runs lets you sign one perk you drafted into the ledger, and you start the next outpost with it.
- **Idle path:** The existing board upgrade gives a *random* common perk at the start.
- **Why it feels worth it:** It hits run 2 hard and right away. **Risk:** it works against "every run is different" and the run-2 speed target. Limit it to common and rare perks.
- **Other skills:** Works as-is.
- **Build size:** Small.
- **Sim measure:** Run-2 speed for each bot; how often the same perk is kept again and again (if one perk dominates, cut the option).

### 6. Craft mastery
- **What you get:** Each mini-game builds mastery only from good plays. Mastery levels unlock rules for that game, such as giant trees in two cuts at level 3.
- **Idle path:** Idle work builds mastery at one fifth of the rate.
- **Why it feels worth it:** Steady visible growth. **Risk:** grindy, and it is exactly what Melvor Idle 2 already does (mastery grows from idle actions). Weakest at setting us apart.
- **Build size:** Medium.
- **Sim measure:** Mastery per hour for each bot.

## Comparison

| # | Option | Active gets | Idle path | Fun | Risk of being mandatory | Generalizes | Build | Rank |
|---|---|---|---|---|---|---|---|---|
| 1 | Prime timber + special orders | Prime stock, bigger share payouts | about 2% Prime from crews | High: tangible | Medium (keep orders optional) | Excellent: feeds other skills | Medium | **1** |
| 2 | Named hands | Chosen rule-changing traits, sooner | Seniority, random trait | High: attachment | Medium (cap the roster) | Excellent | Medium | **2** |
| 3 | Foreman's call | More decisions | Board picks the safe option | Medium–high | Low | Good | Small | 3 |
| 4 | Records open the map | Early clauses and variants | Lifetime shares | Medium | Low | Good | Small | 4 |
| 5 | Company ledger | Keep a chosen perk | Random common perk | Medium | High (run variety) | Good | Small | 5 |
| 6 | Craft mastery | Mastery rules | 1/5 rate | Low–medium | Medium | Good | Medium | 6 |

## Recommendation: Prime timber plus named hands

They cover each other's weaknesses. Prime timber turns good play into **stuff** that flows through the item graph and into Charter Shares, which is the currency that compounds across runs. That is where the missing 0.3–0.8× should come from. Named hands turn good play into **people** whose traits change the rules, which meets pillar 3 and gives the player an emotional stake. Both reuse the same promotion and order patterns in every skill.

Keep the pace boosts as they are, but stop treating them as the main lever. Cap what Prime earns (for example, special orders add at most 25% to an outpost's Charter Shares) so active play cannot pass 2×.

## Smallest playtestable version (Logging only)

1. **Prime logs.** A perfect fall, or a grade-1 cut in Plan the cuts, makes those logs Prime, shown as a separate count on the log pile. Idle crews make 2% Prime.
2. **One special order:** the Admiralty spar order, offered once per company stage: "Ship 40 Prime logs before winter." Reward: bonus Charter Shares (capped as above) and a stamped line in the Gazette. Unused Prime logs sell for double.
3. **One named-hand slot** on the felling crew. Three perfect falls in a row promote the lead, and you pick one of two traits from a pool of four. The idle route is a random trait after three winters worked. The hand stays through closing camp.

Sim checks: active vs casual over three outposts lands at 1.5–2×; the idle bot fills at least one spar order every two outposts and gets promoted by its third outpost; run 2 stays 25–40% faster; no soft-locks. Playtest question for friends: "Did you *want* to play the mini-games, or did you feel you *had* to?"

If this works, Sawmilling gets clear boards and a head sawyer next, using the same rules.

## How this sets us apart

Melvor Idle 2 has no runs, no drafts and no mini-games, and its mastery grows from idle repetition. Our version: your hands make the Prime spars and the men who earn their names, and those carry into the next outpost and into the next skill. Against LumberBoy (lose what you don't get back to the truck), the Logging run is not a race to bank wood. It is a season where good falls become company legend.
