# Phone audit: build/species-seasons (c487d4e)

Method: Playwright + Chromium, mobile emulation (iPhone 13 390x664 and Pixel 7 412x839 CSS px, hasTouch, isMobile), portrait and landscape. Mini-games driven with raw CDP touch events (tap, hold, drag, 1.2 s long-press). Full screenshots live outside the repo (scratchpad `phone-shots/`); six small ones are in `docs/qa/img/`. Line numbers refer to `prototype/timberline.html` on that branch. I could not see real Safari or a real touch screen; real-device items are listed at the end.

What works: no horizontal scroll at 390 or 412 wide, in either orientation. All five mini-games open, can be played to the end with touch alone, and close. Skid (drag) and haul (hold = gas, drag down = brake) respond correctly to touch. Long-press on the canvas raised no context menu and no text selection. The canvas has `touch-action:none` and `pointerdown` calls `preventDefault`, so playing does not scroll or zoom the page. Draft, close camp, new-run, warehouse and story modals all open, fit the screen (they scroll inside the sheet) and close. The canvas maps touch coordinates correctly (it uses `getBoundingClientRect`). Save and load work (3.6 KB). Skid ran at 60 fps headless (no real-GPU numbers). No console errors besides the blocked Google Fonts request.

## Issues, by severity

### High

**H1. No `<meta name="viewport">` (line 2 has only `claude:viewport-fit-sides`).** Shot: `img/no-viewport-meta.png`. Opened as a plain file, in Electron-less web builds, itch, or any host that does not inject one, a phone lays the page out at 980 px and shrinks it to about 40% (visualViewport scale 0.398, page height 1669). Everything below is then unreadable and every target is about 15 px. If the claude.ai artifact host injects a viewport this is hidden, but the Steam/web build will not. Fix: add `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` in `<head>`. 1 line. All other results below were measured with this meta added.

**H2. Mini-game canvas is pushed below the fold by help text, gear text and the first-run guide.** Shots: `img/buck-guide-covers-canvas.png`, `img/landscape-buck-no-canvas.png`. The header paragraph (`#mgHelp`) plus the gear line (`#mgGear`) takes about 350 px of the 664 px portrait screen. On first open of Buck or Saw, the guide opens too and the sheet is 1219 px tall inside a 638 px scroll area: the player sees only text and must scroll the modal to find the canvas. In landscape (664x390) the header alone fills the whole screen, so the canvas is never visible on open for any game (sheet scrollH 624 to 1004 vs 364 visible), and the canvas (606x379) is taller than the screen. Fix (CSS): under `@media (max-height:520px), (max-width:520px)` collapse `#mgHelp` and `#mgGear` behind the existing `?` button (or `display:none` plus a one-line status), make the buck/saw guide a bottom overlay or open collapsed on phones, and cap the canvas with `max-height:calc(100dvh - 150px); width:auto; margin:auto` (aspect-ratio is already set in `sizeCanvas`, line 5831 area). Lines: `.sheet` 184, `.mgc` 195, `openMG` ~5831, `setGuide`/`showGuide` ~6181. Medium (1 to 2 hours).

**H3. Toasts draw on top of modals and mini-game canvases.** Shots: `img/toasts-over-saw-canvas.png`, `img/draft-toast-overlap.png`. `.toasts` is `z-index:60`, above `.modal` at 50. Achievement, draft-ready and special-order toasts (up to 4 stacked, 340 px wide, about 10 s of presence) cover the bottom third of the canvas, which includes the Saw/Turn buttons painted on the canvas, the brake pedal in haul, and half the draft cards. They are `pointer-events:none`, so taps pass through, but the player cannot see what they are tapping. Fix: while any `.modal:not([hidden])` is open, queue toasts (or lower `.toasts` z-index below 50 and move them to the top, small). Lines 172, 182. Small.

**H4. Mini-game canvas is small in portrait and in-canvas text is tiny.** Shot: `img/skid-small-canvas.png`. The 640x400 logical canvas renders at 332x208 (iPhone) or 354x221 (Pixel), a scale of about 0.52 to 0.55. HUD text in the canvas (about 11 to 13 logical px: "Time 4 s par 10 s", "Wind 7 mph", wind arrow, "boards off", haul "Runaway" label, stump hits) becomes roughly 6 to 7 CSS px. The Saw and Turn buttons painted inside the saw canvas are about 89x30 CSS px (logical 172x58), under 44 px high. Fix: scale canvas fonts by `MG.LW / cv.clientWidth` (min about 12 CSS px), enlarge `SAW_BTN` to at least 44 CSS px tall at phone width (it can grow to about 80 logical px), and enlarge the haul brake pedal. Alternative: use real DOM buttons under the canvas for Saw and Turn on narrow screens. Grep `cx.font =` (52 places, e.g. lines 5988, 6002, 6036). Medium to large (a few hours, mostly mechanical).

### Medium

**M1. Tap targets under 44 px, almost all UI.** Portrait iPhone, all measured in CSS px. Chain buttons `.act` (Chop, Place a fall, Buck, Plan the cuts, Skid, Haul): 118x35. `.buy` (every purchase, shares upgrade, land purchase, Sign): 94x35 (about 40 of them). Buy quantity chips `.buyn button` (x1, x10, x25, Max): 46x31. `#mgClose`: 57x31. `#mgGuideBtn` (?): 34x31. `.closeb`/Later: about 57x31. Ledger cells and camp tabs are about 40 high. `#reset` ("Start a new company"): 125x18. `#spAuto`: 35 high. Modal `.mbtn` buttons: 38 high (mgBtns, draft Reroll 90x38). The `.mbtn` row is fine to widen but the 38 is below 44. Fix: one block `@media (pointer:coarse){ .act,.buy,.mbtn,.closeb,.sellb,.buyn button,.camptabs button,.lcell,.linkbtn{min-height:44px} .linkbtn{padding:12px 4px} }`. Small. Lines 113, 132, 139, 163, 194, 200, 254.

**M2. Mini-game copy and in-game hints name keyboard and mouse.** Strings tell the player "Press ? for the guide", "arrow keys and Enter work too", "Space works too", "Press and hold ... or use the arrow keys", "Hold the mouse button (or your finger)", on-canvas hints "BRAKE hold or <- / A", haul "Hold the button anywhere", and button labels "Turn the log (T)", "Saw a board (Space)". Not blocking, but the phone player reads text that does not apply. Lines 5807, 5810, 5910, 6267, 6310, 6468, saw button labels near 7213. Fix: a `const TOUCH = matchMedia('(pointer:coarse)').matches` and strip key hints; "Press ?" becomes "Tap ?". Small.

**M3. Buck "peek" is hover-driven.** `pointermove` sets `B.hover` and the peek line (`#mgPeek`, the green/dark/amber piece preview with grade and value) shows only while the pointer is over the canvas. On touch there is no hover: after a tap the peek text is the generic "Point along the stem..." and the player cannot preview a cut before committing (taps cut immediately). The guide promises "Read the piece before you cut". Fix: on touch, first tap moves the cut marker and shows the peek, second tap (or a "Cut here" button) commits; or drag to scrub then lift to cut. Lines 5866, 6139 (`buckClick`), 6267. Medium design call, small code.

**M4. Saw for grade: Turn uses the right mouse button as an alternative, and tap targets in-canvas are small (see H4).** `pointerdown` with `e.button===2` is only an alias; the on-canvas Turn button works with touch (verified). No functional bug. Listed for the copy.

**M5. Draft modal is cramped in portrait and has an orphan card.** Shot: `img/draft-toast-overlap.png`. `.cards` uses `repeat(auto-fit,minmax(160px,1fr))`, giving 2 columns at about 150 px wide, so card text wraps to 8 or more lines (legendary text "Skid game: mud speeds the team up instead of..."); the third card sits alone in row 2. Sheet is 640 of 664 px tall and scrolls. Fix: `@media (max-width:520px){.cards{grid-template-columns:1fr}.pcard{min-height:0}}` (cards become full-width rows, each short). Line 212. Small.

**M6. Landscape: sheet is `max-height:100%` of 390 px.** Draft, story, warehouse and new-run sheets all scroll (scrollH 398 to 776 vs 364). Nothing is lost, but the primary buttons (Make landfall, Stay/Go, Done) can be below the fold with no scroll cue. Fix: make `.sheet header` and the action bar `position:sticky` (top and bottom) so Close/Done are always on screen. Lines 184, 194.

**M7. Weather and achievement toasts: 4 stacked at 340 px wide on a 390 px screen.** At 390 wide they cover the bottom half of the page content; with `right:16px` and `max-width:calc(100vw - 32px)` they are fine horizontally. Fix with H3, and cap to 2 toasts on narrow screens. Line 172.

### Low

**L1. Fonts too small.** About 10.6 to 11.2 px: `SMALL` (5+4 elements), `.eyebrow` (9), `.chipl` chips, `.lcell small` (10.6 px), `.toast small` (10.9 px), `.era span` 12 px. Fix: raise to 12 px minimum under `@media (max-width:520px)`.

**L2. Fonts are loaded from Google Fonts at runtime.** On a phone with no network or an ad blocker the fallbacks are Rockwell/Georgia, system-ui and ui-monospace. Layout held up with the fallback in my runs (fonts blocked), so this is cosmetic. Bundle woff2 for the Steam build.

**L3. Chop stage is a `<button>` using `click`.** Works with touch (tested via the chain buttons, not the stage). Double-tap zoom is prevented by `touch-action` only on the canvas; on the main page a fast double-tap on the tree can trigger iOS double-tap zoom. Fix: `touch-action:manipulation` on `body` or `.stage, .act, .buy`. Line 83. Needs a real iPhone to confirm.

**L4. Mini-game `pointerleave` ends the fell hold** (line 5867). With pointer capture set, touch hold survives drags off the canvas; verified fell hold 1.2 s to finish. No bug on touch; a mouse cursor leaving the canvas still releases, which is intended.

**L5. Page is one very long column (about 8,400 px at 390 wide: 25,000 px at 3x).** Seven panels stacked: tract, chain, run panel, yard, land office, orders, company, legacy. Not a bug; a sticky bottom nav (Camp / Yard / Land / Orders) would make phone play practical. Design call.

**L6. Save behavior.** `localStorage` is written every 5 s and on `pagehide` and `visibilitychange` (lines 7545, 7600 area), which covers iOS tab kills. Private-mode failures are swallowed (`try/catch`). Offline catch-up is capped at 4 h. No issue found. Needs a real-device check that `pagehide` fires on iOS app switch.

## Needs a human with a real phone

- iPhone Safari: the address-bar resize (the sheet uses `inset:0`, not `dvh`; check the bottom buttons with the toolbar showing), safe-area insets with notch in landscape, double-tap zoom on the chop button, rubber-band scroll when dragging in a mini-game, and whether the long-press callout appears on buttons (add `-webkit-touch-callout:none; user-select:none` to `.act`, `.buy`, `.mbtn`, `.stage`; only `.stage` has `user-select:none` today).
- Dark theme at phone width (not screenshotted).
- Canvas drawing quality and legibility at DPR 3 (the canvas is resized to `clientWidth * dpr`; looks crisp in my screenshots, but real GPU frame rate during skid/haul is unmeasured).
- The weather card (`#dispatch`) and the Land Office `Sign`/buy flow were reviewed in portrait only; weather dispatch did not render in my forced-state test, so it was not looked at.
- Pixel 7 landscape was not run separately; iPhone landscape (664x390 emulated) matches.
- Android back button while a modal is open (nothing closes it; Escape only).

## Fix size estimate

Quick CSS batch (H1, H3, M1, M5, M6, L1, L3): about half a day. Mini-game layout (H2): half a day. In-canvas scaling and larger Saw/Turn and brake targets (H4): about one day. Copy and touch hints (M2, M3): half a day. Total about 2.5 days of engineer time for a playable phone build.
