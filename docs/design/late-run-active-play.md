# Late-run active play: why it fades, and what to build

**Status: Proposal for the owner.** *Design reviewer, 2026-10-25. Design only; nothing is built. All numbers are starting values for the balance agent.*

## For the owner

Hands-on play pays well in your first outpost, then fades. Good play mostly earns *speed*, and in a four-stage camp speed only helps the slowest stage. The rewards that last (improvements, board nodes) reach every player by outpost 2 or 3. My recommendation: when you play a game well, **your crew copies your standard for a few minutes**, worth more in later eras. Add a **foreman's challenge** each outpost, have the Sawmill score by **board grade** instead of raw volume, and show the per-outpost goals that already exist so idle players see something new every few minutes.

## Diagnosis (checked in `prototype/timberline.html` and `packages/core/src`)

### 1. Active play fades after outpost 1 (1.6× falls to 1.1–1.3×)

- **Speed boosts stall behind the slowest stage.** A top result grants ×1.5 for 30 s on one stage, at most 2 stages at once (`BOOST_STAGES = 2`), 120 s banked. Throughput is set by the slowest of fell → buck → skid → haul. In outpost 1 crews are lopsided and boosts often hit the bottleneck. From outpost 2, *Seasoned foremen* (×1.2 all crews) and *Crew on the first boat* start every profile balanced, so two boosted stages mostly fill piles in front of the two that aren't.
- **Permanent rewards even out.** Mini-games unlock improvements sooner, but `S.upg` and lifetime `S.stats` survive close camp and 17 improvements have idle routes. By outpost 2 idle owns most of them: a one-time head start, not a rate advantage.
- **Charter Shares hit a ceiling.** The Logging board costs 121 shares in all; at about 30–45 an outpost, every profile nears a full board by outpost 3–4, so extra shares from play (orders capped at +25%) buy nothing. Bounties are capped at 20% of the next push inland for everyone.
- **Fixed payouts are a minor cause.** Felling (`rate('fell')` × 20 s) and skidding (60 + 15 s of rate) already scale with crews; only hand clicks and the skid game's flat 60 don't.

### 2. Saw for grade is worth too little (mill 1.26×)

- **Pegged to one sawyer.** `cellBfNow()` uses `SAWYER_BF_MIN`, so a medium log is 5 minutes of *one* sawyer whether the mill has 4 or 60. With 20 sawyers a game is about 15 s of mill output.
- **Same logs.** Game logs come from the pond (`sawPick`); when it is short, the game adds grade, not volume.
- **Grade feeds nothing that compounds.** Close camp (`MILL_CLOSE_BF` 150,000) and `millLegacyGain` count board feet, not grade. Better cuts only add cash, which has few uses once sawyers hit `maxSawyers` (60). Quarter-sawn boards only sell (Sawmill orders were deferred). The mill board costs just 26 shares.

### 3. Idle runs 2–3 go 26–34 min without an event

The sim counts achievements, improvements, eras and structures (`sim_rogue.js:146`). Late in run 2, idle holds every ladder, improvement and structure level, so the $1M→$10M stretch has nothing new. Repeat bounties fire every run but aren't counted and show only as a cash toast.

## Options: problem 1

**1A. The crew follows your lead.** A good result (q ≥ 0.85) puts that stage's crews on *your standard* for 3 min (banked up to 9): a **value** bonus on everything the stage moves, not speed. Cove Landing +4%, Steam Camp +7%, Diesel Road on +10%. All four stages can run at once, and it grows with every crew hired.
- *Sees:* a chip per stage, "Following your lead · 2:40".
- *Effect:* bonuses multiply down the chain (four stages at +10% ≈ ×1.46). Active covers about 85% of stage-time, casual about 30%: roughly +0.2–0.35× in runs 2–3, about +0.1× in run 1 thanks to era scaling. Run-over-run speed-up unchanged; nothing carries over.
- *Risk:* run 1 passing 2× (era scaling guards it); chip-babysitting. Perks bend it (*Straw boss:* one lead covers two stages).
- *Build:* small (boost-style timers, a value multiplier in `move()`/`deliver()`).
- *Sim:* coverage % per stage and profile; active÷casual per run by time to Diesel Road and shares per minute.

**1B. Foreman's challenge.** At landfall the foreman pins 3 era-scaled cards for this outpost: two **hand** cards ("Lay 6 perfect falls before Steam Camp", "Land a 5-log turn through spring mud") and one **crew** card ("Work a winter with no stage idle"). Each pays a rare-weighted draft (q 0.8) and counts as an unlock. Close camp brings new cards.
- *Sees:* three cards with progress bars on the order board.
- *Effect:* about 2 extra rule-changing perks per outpost for active, 1 for idle; a goal in every run; fixes much of problem 3.
- *Risk:* a chore list. Three cards, no penalty, no deadline.
- *Build:* small–medium (20-card deck, reuses the draft window).
- *Sim:* cards done per outpost and profile; gap minutes.

**1C. Raise the share ceiling** (order cap to 35%, a repeatable board node). Delayed, numbers only, speeds run 2 for everyone. Tiny build. *Not alone.*

**1D. Outpost tally.** Top-tier results per game this outpost switch on rules at 5/15/30 (Fell 5: crew Prime ×2; Skid 15: +1 log per turn). Strong late; overlaps drafts and feels grindy. Medium. Sim: time to each rung.

## Options: problem 2

**2A. The head sawyer's pattern.** 1A for the mill: a good Saw for grade shifts the idle mix from 20/35/45 to 30/35/35 (Clear/Select/Common) for 3 min.
- *Effect:* +11% value per bf (1.75→1.95 units) across every sawyer.
- *Risk:* little alone while cash has no sink (see 2B).
- *Build:* small, shares 1A's code. *Sim:* coverage; mill revenue per minute.

**2B. Graded feet.** Close camp and shares count Clear ×1.5, Select ×1, Common ×0.75; threshold 148,000 graded ft so idle close time stays put (idle mix averages 0.99).
- *Effect:* grade now speeds close camp and shares. With 2A, I expect mill active÷casual 1.45–1.6×.
- *Risk:* a new rule players must read ("graded feet"); the tally must show it.
- *Build:* small. *Sim:* mill close time per profile and run.

**2C. Products only the saw makes.** Quarter-sawn boards and Clear stock are the only inputs for bunkhouse levels 4–5, structure upgrades and the Admiralty deck planking order (+15% mill shares); idle gets them from the *Quarter-sawn* perk and Filing room.
- *Effect:* best fit with the item graph, but lands with deferred Sawmill content.
- *Risk:* idle starved of upgrades if the trickle is too thin.
- *Build:* medium. *Sim:* Quarter-sawn per hour; idle fills planking every 2 mill outposts.

**2D. Scale the log to the whole mill.** Tiny build, big volume jump, but grade still doesn't matter. *Not recommended.*

## Options: problem 3

**3A. Outpost milestones.** Show the repeat bounties as this outpost's milestone list ("Ship 5M bd ft this outpost: 3.1M"), count each as an event, a goal draft every third, and add Diesel Road and Interior rungs to the delivery and earnings ladders. Idle event about every 8–12 min late. Small. Sim: bounties in `XT.ev`.

**3B. Foreman's crew card** (1B), timed to land after Diesel Road.

**3C. Mill structure levels 2–3** (Sawmill spec). Late mill unlocks. Medium.

**3D. Season dispatch orders** (seasons slice 2) count as events once built.

## Recommendation

**1A + 2A as one rule, "follow your lead", in both camps; plus 2B graded feet, 3A outpost milestones and 1B foreman's challenge.**

1A/2A fix the root cause: play becomes a value bonus that scales with every crew or sawyer and expires, so it neither levels off nor carries across runs. 2B gives grade a route to close camp. 3A is nearly free and turns rewards that already fire into visible events. 1B gives the decision: a Diesel Road outpost in hour ten still has three cards to chase.

First 5 minutes: a perfect fall lights the fallers' chip. Tenth hour: you keep four chips lit while working a foreman's card. Fiction: the crew boss shows the gang how it's done; the foreman pins the outpost's challenges to the cookhouse door.

Cut for now: 1C, 1D, 2D. 2C with the deferred Sawmill content.

## Smallest testable version

1. **Follow your lead** on all four Logging stages: q ≥ 0.85, 3 min, bank 9, +4/+7/+10% by era, one chip per stage.
2. **Head sawyer's pattern:** mix 30/35/35 for 3 min.
3. **Graded feet** for mill close camp and shares (148,000).
4. **Outpost milestones:** existing bounties shown and counted; Diesel and Interior ladder rungs.
5. **Foreman's challenge, light:** 2 cards per outpost (1 hand, 1 crew) from 10; each pays a q 0.8 draft.

**Sim (6 seeds, 3 runs, 8 h) must show:** active÷casual 1.5–2× in *every* run for Logging and the mill; run 2 25–40% faster for every profile; idle longest gap under 20 min in runs 2–3; idle closes both camps every run; coverage %, cards done, graded feet per minute; no soft-locks.

Playtest question: "Did you play a game *because a chip was about to run out*, and did that feel like a choice or a chore?"

## Owner questions

1. **Approve the smallest version above for a first build?** Recommendation: yes.
2. **Graded feet changes what closes the mill.** Keep idle close times the same? Recommendation: yes.
