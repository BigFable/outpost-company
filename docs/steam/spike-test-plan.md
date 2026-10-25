# Steam spike: test plan and go/no-go

Roadmap milestone 4 (tech plan week 2). This page is for the owner. You don't need to code: you download a build, run it next to Steam, click a few buttons, and send us a report.

## What we are testing

Can our game, built with Electron, talk to Steam on the machines players use? There are five questions:

1. **Does it run?** The game must start and play normally on Windows, Mac and Steam Deck, with or without Steam open.
2. **Achievements.** When you earn an achievement in the game, does it unlock in Steam too?
3. **Cloud save.** Does the save upload to Steam Cloud, and does another device pick it up?
4. **Overlay.** Does the Steam overlay (Shift+Tab) appear over the game? Electron makes this hard, so we expect it may not.
5. **Steam Deck Game Mode.** Does the game launch and run from Gaming Mode?

We don't own a Steam app yet, so the build borrows **Spacewar**, Valve's free public test app (app ID 480). Steam may show you as "Playing Spacewar". That is expected. The achievements you unlock are Spacewar's, mapped to five of ours:

| In our game | Spacewar achievement used for the test | Our planned Steam name |
| --- | --- | --- |
| Timber! (fell your first tree) | ACH_WIN_ONE_GAME | ACH_FIRST_TREE |
| First load to the cove | ACH_TRAVEL_FAR_ACCUM | ACH_FIRST_SALE |
| On the payroll (first crew) | ACH_TRAVEL_FAR_SINGLE | ACH_FIRST_CREW |
| Stump to mill | ACH_HEAVY_FIRE | ACH_STUMP_TO_MILL |
| A million board feet | ACH_WIN_100_GAMES | ACH_MILLION_BOARD_FEET |

## Step 0, once: the Steamworks SDK files (your decision)

Valve does not allow its Steam library files (the "Steamworks SDK redistributables") to be stored in our code, so they have to be added to the build separately. **Without them, every build says "no Steam".** That only proves the game survives without Steam, not that it works with it.

What it takes:
1. Sign in at partner.steamgames.com with your Steam account and accept Valve's Steamworks SDK terms. As far as we can tell this is free and separate from the $100 app fee. **If Valve asks for payment or a company sign-up at this point, stop and tell the master dev.** Accepting Valve's terms is a legal step, so the decision is yours.
2. Download the Steamworks SDK zip from the Downloads page.
3. Give the zip to the master dev. They put a private download link into the repository's secret settings (`STEAMWORKS_SDK_ZIP_URL`), and from then on every build includes the files. The zip is never committed to the code.

## Step 1: get the build

The master dev runs the "Desktop build (Steam spike)" workflow on GitHub and sends you the link to the run. To find it yourself: the repository on GitHub → **Actions** → **Desktop build (Steam spike)** → the newest green run → **Artifacts** at the bottom. You need to be signed in to GitHub.

| Device | Download | Then |
| --- | --- | --- |
| Windows PC | `outpost-company-windows` | Unzip it. Inside is another zip; unzip that into a folder such as `Desktop\Outpost`. |
| Mac (Apple Silicon: M1 or newer) | `outpost-company-mac-apple-silicon` | Unzip it, then unzip the inner zip. Drag **Outpost Company** to Applications. |
| Steam Deck | `outpost-company-linux-steamdeck` | See the Steam Deck section below. |

Intel Macs are not covered by this spike build.

## Step 2: run the checks on each device

Before you start: Steam is open and you are logged in.

**Windows.** Double-click `Outpost Company.exe`. Windows may warn "Windows protected your PC" because the build is not signed. Click **More info → Run anyway**.

**Mac.** Open Outpost Company from Applications. The first time, macOS blocks it because it is not signed. Go to **System Settings → Privacy & Security**, scroll down, click **Open Anyway**, then open the game again. (On older macOS, right-click the app → Open → Open also works.)

Then, on every device:

| # | Do this | You should see | Write down |
| --- | --- | --- | --- |
| 1 | Wait for the game to open. | The normal game. In the bottom-right corner, a small box: **Steam test (connected)**. Click it to open the panel. | Connected or "no Steam"? |
| 2 | Read the panel. | "Steam: connected, app 480", "Cloud: on". | Anything red. |
| 3 | Click **Clear test achievements**, then click again to confirm. | "Cleared the test achievements on Steam." All five show "locked". | OK / failed |
| 4 | Click **Unlock test achievement**. | "Unlocked ACH_WIN_ONE_GAME on Steam." If the overlay works, Steam also pops up an achievement notice. | Did the Steam popup appear? |
| 5 | Clear again (step 3). Then play: fell your first tree. | The game's own "Timber!" toast. Within about 5 seconds the panel shows `first_tree → ACH_WIN_ONE_GAME: unlocked`. | OK / failed, and roughly how long it took |
| 6 | Press **Shift+Tab** (on the Deck, press the STEAM button). | Maybe the Steam overlay, maybe nothing. The panel line "Overlay:" says what Steam reports. | Did the overlay appear? |
| 7 | Click **Try overlay mode (restarts)**, then click again to confirm. The game restarts. Repeat step 6. Then switch it back off the same way. | Overlay mode is experimental, so it may look wrong. | Did the overlay appear? Did the game look and play normally? |
| 8 | Click **Test cloud save**. | "Wrote and read back a Steam Cloud file." | OK / failed |
| 9 | Click **Copy report**. Paste it into an email or message to the master dev. | "Report copied." The report is also saved as a file; the message shows where. | Send it |
| 10 | Close the game window. Quit Steam completely (Steam menu → Exit). Start the game again. | The game plays normally. The panel says **no Steam**. | Did it start and play? |

**Cloud between two devices (if you have two).** Play for a minute on device A, then close the game. Wait a minute. Start the game on device B with the same Steam account. Open the panel: it should say "Started from: cloud. Steam Cloud save is newer than this device", and your cash and progress should match device A. The game only uploads at most once a minute and when you close it, so always close the game on A before you start it on B.

## Steam Deck

1. Hold the power button → **Switch to Desktop**.
2. Open the browser, sign in to GitHub and download `outpost-company-linux-steamdeck` (Step 1).
3. In the file manager (Dolphin), open Downloads. Right-click the download → **Extract → Extract archive here**. Do the same with the `.tar.gz` file inside.
4. Open the extracted folder. Double-click `outpost-company` to check it runs in Desktop Mode, then close it.
5. Open Steam (in Desktop Mode) → **Games → Add a Non-Steam Game to My Library → Browse**. Pick the `outpost-company` file in that folder, then click **Add Selected Programs**.
6. Return to Gaming Mode (desktop icon "Return to Gaming Mode"). Go to **Library → Non-Steam** → **outpost-company** → **Play**.
7. Run the checks in Step 2 with the touchscreen.
8. If the game shows a black screen or closes at once: open its **Properties → Launch Options**, type `--no-sandbox`, and try again. Write down whether that fixed it.
9. Optional, only if the Linux build fails in Gaming Mode: add the Windows build's `Outpost Company.exe` as a non-Steam game the same way. In its Properties → Compatibility, tick "Force the use of a specific Steam Play compatibility tool" and pick the newest Proton. Then retry.

## How to report

For each device, send:
- the pasted **Copy report** text
- the "Write down" answers from the table, even rough ones like "step 6: nothing happened"
- a phone photo of anything odd

## Go or no-go

**Go** (we keep Electron and build on it) when all of these hold:
- The game starts and plays on Windows and on Steam Deck in Gaming Mode. On the Deck, needing `--no-sandbox` or the Proton fallback still counts as a go, with follow-up work.
- Achievements unlock in Steam from real play (step 5) on Windows and on the Deck.
- With Steam closed, the game runs normally on every device you tried (step 10).
- No crashes when you close the game.
- Cloud save works on at least one device (step 8). If it fails everywhere, we treat that as "needs our own app ID" rather than a no-go: Spacewar's cloud space is shared and limited, and our own app can also use Steam's Auto-Cloud, which needs no code.

**The overlay is not a go/no-go item** (tech plan risk table). If it never appears, players still see our in-game achievement toasts, and we revisit the overlay with our own app ID.

**No-go** (we keep the game code and swap the desktop shell, as the tech plan allows) if any of these happen:
- The game will not run in Steam Deck Gaming Mode, even with `--no-sandbox` and the Proton fallback.
- Achievements never unlock on Windows while Steam shows as connected.
- Having Steam open makes the game crash or hang.

**Mac** results are useful but do not decide go/no-go on their own: unsigned Mac builds are awkward until we sign them (see below).

## What this spike can't cover yet

- **Uploading to a private Steam branch (SteamPipe)** needs our own app ID.
- **Steam Cloud with our own quota, and Auto-Cloud setup** need our own app.
- **Our real achievement names and icons** need our own app.
- Everything here was built and tested headless on Linux **without a Steam client**. Nobody has yet seen it work against a real Steam client. That is what this test is for.

## Decisions waiting on the owner

1. **Steamworks SDK terms** (Step 0): accept Valve's SDK terms and share the zip with the team. Needed before any "connected" test.
2. **Steam Direct fee, $100 per app**, recouped after $1,000 of sales. This gets us our own app ID, needed for real achievements, our own cloud space, private beta branches and the Deck review. Recommendation: pay it once this spike says go.
3. **Apple Developer account, $99 a year**, for signed Mac builds that open without the "Open Anyway" step. Recommendation: wait until the Mac version matters (demo time).
4. **Easier downloads**: we could attach builds to a GitHub "release" instead of Actions artifacts, so no GitHub sign-in is needed. If the repository is public, the build becomes public, so this is your call.
5. **Achievement API names** become permanent once published on Steam. The planned names above are a draft for you to approve when the real app exists.

## For the team (technical notes)

- Code: `packages/platform` (interface, Steam adapter, start rule, cloud writer, achievement mirror; unit-tested with a fake Steam), `apps/desktop/steam-host.cjs` (main-process host and IPC), `apps/desktop/preload.cjs` (context-isolated bridge and test panel).
- Library: steamworks-ffi-node 0.11.3, published 24 Sep 2026; koffi is pinned to 3.3.2 through `overrides` in `pnpm-workspace.yaml`. Both are unpacked from the ASAR.
- Start rule (`chooseStartSave`): if only one save is valid, use it. If both are, use the one with the later `last` time. On a tie, keep the local save. A local save that gets replaced is backed up to `<userData>/save-backups/`.
- Cloud upload: at most once per 60 seconds, plus a flush when the game quits. Achievements mirror from the save blob about 5 seconds after they are earned. Mirroring is idempotent and only unlocks.
- Overrides: `OUTPOST_STEAM=0` turns Steam off; `OUTPOST_STEAM_APP_ID` or a `steam_appid.txt` beside the executable sets the app ID; `OUTPOST_STEAMWORKS_SDK` points to a folder containing `redistributable_bin/`.
- The test panel only appears when the app ID is 480.
