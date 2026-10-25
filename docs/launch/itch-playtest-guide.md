# itch.io playtest guide (for the owner)

*Draft by the launch agent, 25 Oct 2026. Nothing here has been done for you: creating the account, uploading and sharing are your steps. itch.io changes its screens now and then. Names of the embed, access and key settings come from itch.io's own help pages (listed at the end). A few other labels (marked "from memory") I could not confirm and may look different on the day. If a screen does not match, stop and ask.*

**What this gets you:** a private web page where friends press Play and the game runs in their browser, on a laptop or a phone. No installs. Only people you give the link to can see it.

## Before you start (the master dev prepares this, not you)

1. **One file called `index.html`.** The playtest build is a single HTML file. itch.io can take a single HTML file, but only if it needs no other files. The safest route is a **zip** with `index.html` at the top level (not inside a folder). The master dev can make that zip for you with a name like `outpost-playtest-v3.zip`. Put a build number in the zip name so you always know which one friends are on.
2. **Phone check.** The current prototype has no phone "viewport" setting in its page header (I checked `prototype/timberline.html`). Without it, phones show a tiny zoomed-out desktop page. Your 25 Oct decision already says the next playtest build must work on a phone, so ask the master dev to confirm that line is in the build before you upload. Test it on one phone first.
3. **Internet needed.** The page loads its fonts from Google Fonts, so players need to be online the first time.

## Step 1. Create the account (you)

1. Go to itch.io and choose **Register**. Use a username you can live with: the web address will be `yourname.itch.io/game-name`.
2. Confirm your email.
3. In the account settings, you can leave payments and tax forms alone. A free private playtest page needs neither.

## Step 2. Create the project (you)

1. Click your name at top right, then **Dashboard**, then **Create new project** (from memory; the FlatRedBall page I opened calls it "Upload new project". Same thing).
2. **Title:** a plain working title such as "Outpost Company (playtest)". Do not use "RuneScape" or "Melvor" anywhere on this page.
3. **Project URL:** you can change this later, so keep it short.
4. **Kind of project:** choose **HTML**. This is what makes the game run in the browser.
5. **Pricing:** choose the free option ("No payments", from memory). A free page keeps things simple.
6. Short description: one line, for example "Private playtest. Please do not share this link."

## Step 3. Upload the build (you)

1. Under **Uploads**, click **Upload files** and pick the zip.
2. When it finishes, tick the box **This file will be played in the browser** next to that file. This is the step people forget: without it, itch.io offers a download instead of a Play button.
3. If you ever upload more than one file, tick it on only one.

## Step 4. Embed settings (you)

These are under **Embed options**, further down the same page.

| Setting | Choose | Why |
| --- | --- | --- |
| **Embed options** | **Click to launch in fullscreen** is the best fit for phones. Otherwise **Embed in page** with a size of about 1280 wide by 800 tall | Fullscreen launch fills a phone screen and needs no fixed size. The game must resize itself, which your phone-width layout is meant to do |
| **Mobile friendly** | **On** | itch.io then forces fullscreen launch for phone visitors. If this is off, phone visitors see a "may not work" warning |
| **Fullscreen button** | **On** | Lets laptop players fill the screen |
| **Scrollbars** | **Off** if the page fits; **On** if testers report cut-off panels | The game is a tall page. If anyone cannot reach the bottom, turn this on |
| **Click to play** | Leave **On** (the default) | Players press one button to start. This also avoids sound problems in some browsers |

## Step 5. Make it private (you)

Scroll to the access settings at the bottom of the edit page (itch.io calls this access control). itch.io has three modes:

- **Draft** (the default). Only you, and anyone with the secret preview link, can see it. itch.io says it does not recommend giving out projects in this mode.
- **Restricted.** Only people you approve can see it. You approve people with a download key, or you add a password.
- **Public.** Everyone, including search engines. **Do not choose this.**

**Recommended: Restricted with a password.**

1. Choose **Restricted**.
2. Tick **Also allow a password to view page** and type a password you do not use anywhere else.
3. **Save** the project (the button at the bottom of the edit page).

## Step 6. Get a link to send to friends (you)

Two ways. Pick one.

- **Password link (easiest).** Share the normal page address with the password on the end: `https://yourname.itch.io/game-name?password=thepassword`. The itch.io help says you can put the password in the web address so visitors do not have to type it. An itch.io staff member gave this exact format on the forum, from memory, and a user confirmed it works. **Test the link in a private or incognito window before you send it.**
- **Download keys (one per person).** In the project, open the **Distribute** tab, find **Download keys**, and generate a singular key for each friend with a label like "Sam". You can see whether it was used and revoke it later. The friend needs an itch.io account to attach the key, so this is more work for them. Use it if you want to stop one person without changing the password for everyone.

If you would rather skip all of this, **Draft** plus the secret link also works, but anyone who gets the link from a friend can open it.

I could not verify from the help pages whether a Restricted page that someone reaches by password lets them play in the browser without a key. **Test it yourself in incognito mode before inviting anyone.** If it asks for a key, use download keys or fall back to Draft with the secret link.

## Step 7. Update the build later (you)

1. Open the project, **Edit project**.
2. In **Uploads**, upload the new zip. Tick **This file will be played in the browser** on it, and delete the old file (or leave it, but then testers might get the old one).
3. **Save.** The same link now loads the new build. Tell testers to refresh the page.
4. Saves: itch.io puts each upload in a new folder on the same site, and saves stay with the browser, so friends normally keep their progress across updates. A big save-format change can still break saves. The prototype is built to load old saves (key `timberline-v2`), and the master dev will say if a build cannot.

## What phone playtesters should expect (copy this to friends)

> **Playing on your phone**
> - Tap the Play button, then the game opens fullscreen. Rotate your phone sideways if the mini-games feel cramped.
> - **Your save lives in your phone's browser**, not in an account. It is kept on that phone, in that browser, only.
> - **Do not use a private/incognito tab.** The save disappears when it closes.
> - On iPhones, Safari can erase saved data for sites you have not opened in about a week, and some phones do not keep saves for games shown inside another page. If you lose progress, that is why, not you. Tell me.
> - Do not clear "website data" or "history and cookies" in your browser settings, or the save goes too.
> - You need an internet connection the first time you open it.
> - If you want the game to stay put: open it once a week, and use the same browser each time.
> - Please send me: what phone and browser you used, anything you could not tap, anything cut off the screen, and when you got bored.

Why the warning: a forum thread I opened reports that Safari (iPhone and Mac) and Firefox do not reliably keep saved data for games shown inside another page, which is how itch.io shows browser games. Others point to Safari clearing data for sites left idle for a week. I could not find a single definitive cause. The practical fix is an **Export save** button in the game (a text code friends can copy). That is a build request for the master dev, not something you do.

## Checklist

- [ ] Phone viewport line confirmed in the build (master dev)
- [ ] Zip made, `index.html` at the top, version in the name (master dev)
- [ ] Account created (you)
- [ ] Project created with Kind of project: HTML (you)
- [ ] Zip uploaded, "This file will be played in the browser" ticked (you)
- [ ] Embed options set; Mobile friendly on (you)
- [ ] Restricted plus password; link tested in incognito (you)
- [ ] Friends get the link and the phone note (you)

## Sources (opened 25 Oct 2026)

- itch.io, Uploading HTML5 games (zip and index.html, embed options): https://itch.io/docs/creators/html5
- itch.io, Access control (Draft, Restricted, Public, password): https://itch.io/docs/creators/access-control
- itch.io, Download keys (Distribute tab): https://itch.io/docs/creators/download-keys
- itch.io forum, Restricted mode, password in the URL: https://itch.io/t/1404646/restricted-mode-project-include-password-in-url-how
- itch.io forum, How do I password protect my project page: https://itch.io/t/58582/how-can-i-password-protect-my-project-page
- itch.io blog, More embed options for HTML5 games: https://itch.io/updates/more-embed-options-for-html5-games
- FlatRedBall docs, Publishing to itch.io (the "This file will be played in the browser" box and "Kind of project: HTML"): https://docs.flatredball.com/flatredball/tutorials/distribution/itch.io
- itch.io forum, How does itch.io store save data: https://itch.io/t/1171960/how-does-itchio-store-save-data
- intfiction forum, Local storage clears on mobile browsers: https://intfiction.org/t/local-storage-clears-on-mobile-browsers-deleting-saved-games/74647

Not verified: itch.io's own help pages did not mention the "This file will be played in the browser" box (the FlatRedBall page does), and I could not open itch.io's quick-start page. The exact on-screen wording may differ.
