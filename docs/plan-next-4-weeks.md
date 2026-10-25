# Plan: 2026-10-26 to 2026-11-22

Sized for the owner at 4 to 6 hours a week, directing the agent team. Gates are rules, not hopes: a week does not start its build until its gate is met.

## Week 1 (Oct 26 - Nov 1): get the preview into hands
**Team builds**
- Phone build: touch controls and phone-width layout (the phone audit feeds it).
- Merge `build/species-seasons` and the land office/queue rework (`build/tract-queue`) into one playtest file, with QA smoke and save-compatibility checks and a balance run.
- Bug hunt fixes; Steam spike continues.

**Owner**
- Play the species + seasons preview once; note what felt different.
- Decide whether the round 3 file goes to friends as soon as the phone build passes QA.

**Gate:** nothing goes to friends until `npm test` passes and the phone build works on a real phone.

## Week 2 (Nov 2 - 8): playtest round 3, Steam spike result
**Team builds**
- itch.io web build (a private, unlisted page).
- Steam spike report: achievements, cloud save, Windows, Mac, Steam Deck, with a go or no-go.
- Species slice 2 starts only if the phone build has shipped.

**Owner**
- Create the itch.io account and upload the build (the team prepares the file and steps).
- Send the link to the playtesters, including the phone player. Ask two questions: "Why did you buy the lot you bought?" and "Did a season card ever make you open a mini-game?"
- Steam fee call: $100 per app, recouped after $1,000 in sales. Recommendation: pay only after the spike says go.
- Test the desktop build on any real Windows or Mac machine you can borrow.

**Gate G1:** Steam spike go or no-go.

## Week 3 (Nov 9 - 15): act on feedback
**Team builds**
- Fixes from round 3 feedback.
- Species slice 2 (mill and heavy-wood games) if the phone build is out and the owner accepted slice 1.
- Late-run active-play design reviewed; if approved, a small first build.
- Balance run on every change against the targets.

**Owner**
- Rule on the late-run active-play design and any tuning misses.
- Review the store-page plan; decide what, if anything, goes public. Nothing is published without you.

**Gate:** seasons slice 2 only after species slice 1 is accepted.

## Week 4 (Nov 16 - 22): checkpoint
**Team builds**
- Finish slice 2 work; QA regression and save-compatibility pass; fresh balance baseline.
- Producer brief with the roadmap re-dated.

**Owner**
- Playtest round 4 on the new file, on at least two real devices (one phone, one computer).
- Decide the next month: continue species/seasons, or start Raising (construction) planning.
- Open items still waiting: working title, what the 3-year clock counts from.

**Gate:** release checklist for any file sent out: tests pass, old saves load, balance inside targets or the owner accepts the miss.

## Risks to watch
- Scope creep: species and seasons each have three slices; ship slices, not systems.
- Active-play ratio stays under 1.5x, which breaks a design pillar.
- Playtesters' phones and browsers differ; test on real devices, not just emulators.
