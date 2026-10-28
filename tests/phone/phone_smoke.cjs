// Phone smoke test: the prototype in Chromium with phone emulation (iPhone 13 and Pixel 7, portrait and landscape).
// Checks layout (no sideways scroll, tap targets, text size), every panel and sheet, and plays all five mini-games
// to the end with touch events only. Not part of `pnpm test` (needs a Playwright Chromium): run `pnpm run test:phone`.
//   PLAYWRIGHT_BROWSERS_PATH  where Chromium lives (default /opt/pw-browsers)
//   PLAYWRIGHT_MODULE         path to the playwright package if it is not installed in this repo
//   SHOTS=<dir>               also save a screenshot of every panel, sheet and mini-game there
//   DEVICES="iPhone 13,..."   limit the devices
/* global window, document, getComputedStyle, NodeFilter, innerWidth, innerHeight, devicePixelRatio -- browser code inside page.evaluate */
'use strict';
const fs = require('fs');
const path = require('path');
process.env.PLAYWRIGHT_BROWSERS_PATH = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
let pw;
for (const m of [process.env.PLAYWRIGHT_MODULE, 'playwright', '/opt/npm-tools/node_modules/playwright'].filter(Boolean)) { try { pw = require(m); break; } catch { /* next */ } }
if (!pw) { console.log('SKIP phone smoke: playwright is not installed (set PLAYWRIGHT_MODULE)'); process.exit(0); }
const { chromium, devices } = pw;

const ROOT = path.resolve(__dirname, '..', '..');
const START = "window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});";
const src = fs.readFileSync(path.join(ROOT, 'prototype', 'timberline.html'), 'utf8');
if (!src.includes(START)) throw new Error('start line not found');
const TMP = fs.mkdtempSync(path.join(require('os').tmpdir(), 'phone-smoke-'));
const PAGE = path.join(TMP, 'game.html');
fs.writeFileSync(PAGE, src.replace(START, 'window.__eval = s => eval(s); ' + START));
const SHOTS = process.env.SHOTS ? path.resolve(process.env.SHOTS) : null;
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
const DEVS = (process.env.DEVICES || 'iPhone 13,iPhone 13 landscape,Pixel 7,Pixel 7 landscape').split(',').map((s) => s.trim());

let fails = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run(devName) {
  const dev = devices[devName]; if (!dev) throw new Error('no device ' + devName);
  const tag = devName.replace(/\s+/g, '-').toLowerCase();
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...dev });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/ERR_FAILED|fonts/.test(m.text())) errs.push(m.text()); });
  await page.goto('file://' + PAGE);
  await page.waitForFunction(() => typeof window.__eval === 'function');
  await sleep(400);
  const E = (s) => page.evaluate((x) => window.__eval(x), s);
  const cdp = await ctx.newCDPSession(page);
  const touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y]) => ({ x, y, id: 1, radiusX: 4, radiusY: 4, force: 1 })) });
  const tapXY = async (x, y) => { await touch('touchStart', [[x, y]]); await sleep(30); await touch('touchEnd', []); await sleep(60); };
  const tapEl = async (sel) => {
    await page.evaluate((s) => { const el = document.querySelector(s); if (el) el.scrollIntoView({ block: 'nearest' }); }, sel); await sleep(30);
    const b = await page.locator(sel).first().boundingBox(); if (!b) throw new Error('no box for ' + sel); await tapXY(b.x + b.width / 2, b.y + b.height / 2); };
  // the UI frame (slice 1): sidebar rows (#tabLog, #tabMill, ...) are in the More drawer on a phone, on screen otherwise
  const nav = async (sel) => {
    if (await page.evaluate(() => getComputedStyle(document.getElementById('bottomTabs')).display !== 'none')) { await tapEl('#btMore'); await sleep(300); }
    await tapEl(sel); await sleep(250); };
  // viewport screenshots only: Playwright's element screenshot turns the touch-pointer emulation off
  const shot = async (name, el) => { if (!SHOTS) return; const f = path.join(SHOTS, `${tag}--${name}.png`);
    if (el) { await page.evaluate((s) => { const e = document.querySelector(s); if (e) e.scrollIntoView({ block: 'start' }); }, el); await sleep(30); }
    await page.screenshot({ path: f }); };
  // canvas logical -> viewport
  const toScreen = async (lx, ly) => page.evaluate(([lx, ly]) => { const c = document.getElementById('mgCanvas').getBoundingClientRect(); const M = window.__eval('MG'); return [c.left + lx / M.LW * c.width, c.top + ly / M.LH * c.height]; }, [lx, ly]);

  const noSideScroll = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  // visible buttons and summaries under 44 CSS px (coarse pointer); skip ones clipped inside a scrolling box
  const smallTargets = () => page.evaluate(() => [...document.querySelectorAll('button, summary, input[type=range]')].filter((b) => {
    if (!b.offsetParent && getComputedStyle(b).position !== 'fixed') return false;
    const r = b.getBoundingClientRect(); if (!r.width || !r.height) return false;
    return r.height < 43.5 || r.width < 43.5;
  }).map((b) => `${b.id || b.className || b.tagName}:${Math.round(b.getBoundingClientRect().width)}x${Math.round(b.getBoundingClientRect().height)}`));
  // visible text under 12 CSS px
  const smallText = () => page.evaluate(() => { const out = new Set();
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) { if (!n.textContent.trim()) continue; const el = n.parentElement; if (!el || !el.offsetParent) continue;
      const fs = parseFloat(getComputedStyle(el).fontSize); if (fs < 11.95) out.add(`${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className && typeof el.className === 'string' ? '.' + el.className.split(' ').join('.') : ''}:${fs}`); }
    return [...out]; });

  // ---------- 1. fresh page
  ok(await page.evaluate(() => !!document.querySelector('meta[name=viewport]') && Math.abs(window.visualViewport.scale - 1) < .01), `${devName}: viewport meta, page at scale 1`);
  ok(await noSideScroll(), `${devName}: no sideways scroll on a fresh page`);
  await shot('main-top');
  ok(await page.evaluate(() => getComputedStyle(document.documentElement).touchAction === 'manipulation'), `${devName}: touch-action manipulation on the page (no double-tap zoom)`);
  // a company with everything open: Sawmill, warehouse items, an order, a weather card, a draft
  await E(`S.cash = 4e5; openSawmill(true); S.story.card = false; S.bulk.logs = 1e6; S.camps.sawmill.cash = 5000; S.stems.bf = S.cut.bf = S.landing.bf = 8000; S.stems.val = S.cut.val = S.landing.val = 8000;
    addItem('logging.burl', 3); addItem(SPAR, 4); addItem('logging.amber_pitch', 1);
    dispQ.push({kind:'event', id:Core.SEASON_EVENTS.find(e => e.tone === 'bad').id, first:true}); dCur = null; pumpDispatch(); render(true)`);
  await sleep(300);
  ok(await page.evaluate(() => !document.getElementById('dispatch').hidden), `${devName}: the weather card shows`);
  await shot('weather-card', '#dispatch');
  ok(await noSideScroll(), `${devName}: no sideways scroll with everything open`);
  const st = await smallTargets(); ok(st.length === 0, `${devName}: page tap targets are 44 px or more` + (st.length ? ': ' + st.slice(0, 12).join(' ') : ''));
  const sx = await smallText(); ok(sx.length === 0, `${devName}: page text is 12 px or more` + (sx.length ? ': ' + sx.slice(0, 12).join(' ') : ''));
  const panels = await page.evaluate(() => [...document.querySelectorAll('#logView .panel')].map((p, i) => { p.dataset.shot = 'p' + i; return (p.querySelector('.eyebrow') || {}).textContent || 'panel' + i; }));
  for (let i = 0; i < panels.length; i++) await shot('log-' + i + '-' + panels[i].replace(/\W+/g, '_').toLowerCase(), `[data-shot=p${i}]`);
  await shot('top-bar', '.top');
  // the cutting queue's Trees tab (lot stash): cards, the rule switch, a species' lots and Cut here, all by touch
  await E(`S.tracts.push(Object.assign(Core.makeTract('Spruce head, Lot 7', [['spruce', 80], ['pine', 20]], 50, 2, 'rolling', 'headland'), {seq: S.tractSeq++})); render(true)`);
  await tapEl('#qTabs [data-v=trees]'); await sleep(150);
  ok(await page.evaluate(() => !document.getElementById('qTrees').hidden && document.querySelectorAll('#stash .scard').length >= 2), `${devName}: the Trees tab opens with a tap`);
  await tapEl('#stash .scard[data-sp=spruce] summary'); await sleep(100);
  await tapEl('#stash [data-rsp=spruce][data-r=first]'); await sleep(100);
  ok((await E(`S.ui.stashRule.spruce`)) === 'first' && (await E(`tract().name`)) !== 'Spruce head, Lot 7', `${devName}: tap First sets the rule`);
  ok(await noSideScroll(), `${devName}: Trees tab has no sideways scroll`);
  const st3 = await smallTargets(); ok(st3.length === 0, `${devName}: Trees tab tap targets are 44 px or more` + (st3.length ? ': ' + st3.slice(0, 12).join(' ') : ''));
  const sx3 = await smallText(); ok(sx3.length === 0, `${devName}: Trees tab text is 12 px or more` + (sx3.length ? ': ' + sx3.slice(0, 12).join(' ') : ''));
  await tapEl('#stash .scard[data-sp=spruce] [data-cut]'); await sleep(150);
  ok((await E(`tract().name`)) === 'Spruce head, Lot 7' && /Picking spruce/.test(await page.evaluate(() => document.getElementById('pickNote').textContent)), `${devName}: Cut here moves the crews; the picking note shows`);
  await shot('queue-trees', '#queuePanel');
  await E(`setStashRule('spruce', 'any')`); await tapEl('#qTabs [data-v=lots]'); await sleep(100);
  // Sawmill tab
  await nav('#tabMill');
  ok(await page.evaluate(() => !document.getElementById('millView').hidden), `${devName}: Sawmill screen opens with a tap`);
  ok(await noSideScroll(), `${devName}: Sawmill tab has no sideways scroll`);
  const st2 = await smallTargets(); ok(st2.length === 0, `${devName}: Sawmill tap targets are 44 px or more` + (st2.length ? ': ' + st2.slice(0, 12).join(' ') : ''));
  const mp = await page.evaluate(() => [...document.querySelectorAll('#millView .panel')].map((p, i) => { p.dataset.shot = 'm' + i; return (p.querySelector('.eyebrow') || {}).textContent || 'panel' + i; }));
  for (let i = 0; i < mp.length; i++) await shot('mill-' + i + '-' + mp[i].replace(/\W+/g, '_').toLowerCase(), `[data-shot=m${i}]`);
  await nav('#tabLog');

  // ---------- 2. sheets: header and action bar stay on screen, no sideways scroll
  const sheetCheck = async (id, name) => {
    const r = await page.evaluate((id) => { const m = document.getElementById(id), sh = m.querySelector('.sheet'), r = sh.getBoundingClientRect(), hd = sh.querySelector('header').getBoundingClientRect();
      const bar = sh.querySelector('.mgbar'), br = bar ? bar.getBoundingClientRect() : null;
      return { fit: r.left >= -1 && r.right <= innerWidth + 1 && r.top >= -1 && r.bottom <= innerHeight + 1, head: hd.top >= -1 && hd.bottom <= innerHeight, bar: !br || (br.bottom <= innerHeight + 1 && br.top >= 0), side: sh.scrollWidth <= sh.clientWidth + 1 }; }, id);
    ok(r.fit && r.head && r.bar && r.side, `${devName}: ${name} sheet fits, header and buttons on screen ${JSON.stringify(r)}`);
    await shot('sheet-' + name);
  };
  // the warehouse is a screen now (UI rework slice 1), reached from the bottom tabs or the sidebar
  if (await page.evaluate(() => getComputedStyle(document.getElementById('bottomTabs')).display !== 'none')) await tapEl('#btWh'); else await tapEl('#lsWh');
  await sleep(200);
  ok(await page.evaluate(() => !document.getElementById('wh').hidden && document.getElementById('logView').hidden), `${devName}: the Warehouse screen opens with a tap`);
  ok(await noSideScroll(), `${devName}: Warehouse screen has no sideways scroll`);
  const stw = await smallTargets(); ok(stw.length === 0, `${devName}: Warehouse tap targets are 44 px or more` + (stw.length ? ': ' + stw.slice(0, 12).join(' ') : ''));
  await shot('screen-warehouse');
  for (const t of ['log', 'almanac', 'ledger']) { await tapEl(`#whTabs [data-t=${t}]`); await sleep(100); await shot('sheet-warehouse-' + t); }
  // save backup: copy, then load it back (validation, confirm step)
  await page.locator('#svCopy').scrollIntoViewIfNeeded(); await tapEl('#svCopy'); await sleep(200);
  const saveTxt = await page.evaluate(() => document.getElementById('svOut').value);
  ok(/^OUTPOST-SAVE:/.test(saveTxt) && saveTxt.length > 500, `${devName}: Copy save shows the save as text (${saveTxt.length} chars): ${await page.evaluate(() => document.getElementById('svMsg').textContent)}`);
  await shot('save-copy');
  await page.fill('#svIn', 'hello'); await tapEl('#svLoad'); await sleep(100);
  ok(/not an Outpost Company save/.test(await page.evaluate(() => document.getElementById('svMsg').textContent)), `${devName}: pasting junk gives a clear message`);
  await page.fill('#svIn', saveTxt.slice(0, 200)); await tapEl('#svLoad'); await sleep(100);
  ok(/damaged or cut short/.test(await page.evaluate(() => document.getElementById('svMsg').textContent)), `${devName}: a cut-short save gives a clear message`);
  await E(`S.cash = 7`);
  await page.fill('#svIn', saveTxt); await tapEl('#svLoad'); await sleep(100);
  const m3 = await page.evaluate(() => document.getElementById('svMsg').textContent);
  ok(/Press again/.test(m3) && (await E('S.cash')) < 1000, `${devName}: a good save asks to confirm before replacing the company: ${m3}`);
  await shot('save-confirm');
  await tapEl('#svLoad'); await sleep(200);
  ok((await E('S.cash')) > 1000 && /Save loaded/.test(await page.evaluate(() => document.getElementById('svMsg').textContent)), `${devName}: the pasted save loads (cash restored)`);
  await tapEl('#whClose'); await sleep(100);
  await E(`queueDraft(1); openDraft()`); await sleep(200); await sheetCheck('draft', 'draft');
  ok(await page.evaluate(() => { const c = [...document.querySelectorAll('#dCards .pcard')].map((x) => x.getBoundingClientRect()); return innerWidth > 520 || c.every((r) => Math.abs(r.left - c[0].left) < 1); }), `${devName}: draft cards in one column on a narrow screen`);
  await tapEl('#dClose'); await sleep(100);
  await E(`openNewRun()`); await sleep(150); await sheetCheck('newrun', 'new-run'); await E(`$('newrun').hidden = true`); await sleep(100);
  await E(`openStory()`); await sleep(150); await sheetCheck('story', 'story'); await E(`$('story').hidden = true`);
  // toasts wait while a sheet is open
  await E(`queueDraft(1); openDraft(); toast({name:'Test toast', line:'x'})`); await sleep(50);
  ok((await page.evaluate(() => document.getElementById('toasts').childElementCount)) === 0, `${devName}: no toast over an open sheet`);
  await tapEl('#dClose'); await sleep(100);
  ok((await page.evaluate(() => document.getElementById('toasts').childElementCount)) >= 1, `${devName}: the toast shows once the sheet closes`);
  await shot('toast');
  await E(`$('toasts').innerHTML = ''`);

  // ---------- 2b. every screen of the frame, by touch: bottom tabs on a phone, the sidebar otherwise
  const phoneTabs = await page.evaluate(() => getComputedStyle(document.getElementById('bottomTabs')).display !== 'none');
  for (const [sc, sel, tab] of [['orders', '#lsOrd', '#btOrders'], ['shop', '#navShop', '#btShop'], ['board', '#navBoard', null], ['almanac', '#navAlm', null], ['settings', '#navSet', null], ['logging', '#tabLog', '#btCamp']]) {
    if (phoneTabs && tab) { await tapEl(tab); await sleep(200); } else await nav(sel);
    ok((await E('S.ui.screen')) === sc && await page.evaluate(() => !document.getElementById('app').classList.contains('drawer')), `${devName}: ${sc} screen opens with a tap (drawer closed)`);
    ok(await noSideScroll(), `${devName}: ${sc} screen has no sideways scroll`);
    const t = await smallTargets(); ok(t.length === 0, `${devName}: ${sc} tap targets are 44 px or more` + (t.length ? ': ' + t.slice(0, 12).join(' ') : ''));
    const x = await smallText(); ok(x.length === 0, `${devName}: ${sc} text is 12 px or more` + (x.length ? ': ' + x.slice(0, 12).join(' ') : ''));
    await shot('screen-' + sc);
    if (sc === 'settings') ok(await page.evaluate(() => { const r = document.getElementById('reset').getBoundingClientRect(); return r.height >= 44; }), `${devName}: Start a new company is 44 px tall`);
  }
  if (phoneTabs) {
    await tapEl('#btMore'); await sleep(300);
    ok(await page.evaluate(() => { const r = document.getElementById('side').getBoundingClientRect(); return document.getElementById('app').classList.contains('drawer') && r.left >= -1 && r.right <= innerWidth; }), `${devName}: More opens the sidebar as a drawer`);
    await shot('drawer');
    await tapXY(await page.evaluate(() => innerWidth - 20), 300); await sleep(300);
    ok(await page.evaluate(() => !document.getElementById('app').classList.contains('drawer')), `${devName}: tapping outside closes the drawer`);
    ok(await page.evaluate(() => { const b = document.getElementById('bottomTabs').getBoundingClientRect(), t = document.getElementById('topbar').getBoundingClientRect(); return Math.abs(b.bottom - innerHeight) < 2 && b.height >= 56 && t.top >= -1 && t.height <= 60; }), `${devName}: bottom tabs at the bottom, one-line top bar`);
  }
  await tapEl('#bellBtn'); await sleep(150);
  ok(await page.evaluate(() => { const t = document.getElementById('bellTray'), r = t.getBoundingClientRect(); return !t.hidden && r.right <= innerWidth + 1 && r.left >= -1; }), `${devName}: the bell opens its list on screen`);
  await shot('bell');
  await tapEl('#bellBtn'); await sleep(100);

  // ---------- 3. mini-games, touch only
  const mgCheck = async (name) => {
    const r = await page.evaluate(() => { const c = document.getElementById('mgCanvas').getBoundingClientRect(), b = document.getElementById('mgBtns').getBoundingClientRect(), M = window.__eval('MG');
      const cv = document.getElementById('mgCanvas'), dpr = devicePixelRatio;
      return { canvas: c.top >= -1 && c.bottom <= innerHeight + 1 && c.left >= -1 && c.right <= innerWidth + 1, btns: b.top >= 0 && b.bottom <= innerHeight + 1 && b.height > 0,
        w: Math.round(c.width), crisp: Math.abs(cv.width - Math.round(c.width * dpr)) <= 2, text: +(M.k * window.__eval('fpx(11)')).toFixed(1), hud: +(11 * window.__eval('hudS(11)') * M.k).toFixed(1) }; });
    ok(r.canvas && r.btns && r.crisp && r.text >= 12 && r.hud >= 11.9, `${devName}: ${name} on open: canvas and buttons on screen, sharp, text >= 12 px ${JSON.stringify(r)}`);
    const sb = await smallTargets(); ok(sb.length === 0, `${devName}: ${name} buttons 44 px or more` + (sb.length ? ': ' + sb.join(' ') : ''));
  };
  const status = () => page.evaluate(() => document.getElementById('mgStatus').textContent);
  const btnText = () => page.evaluate(() => document.getElementById('mgBtns').textContent);
  const waitBtn = async (re, ms = 8000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (re.test(await btnText())) return true; await sleep(80); } return false; };

  // felling: tap to aim, tap again (arm), then hold for the back cut
  await E(`S.ui.buckIntro = false; S.ui.sawIntro = false`);
  await tapEl('#chain .act.game'); await sleep(250);
  ok((await E('MG.kind')) === 'fell', `${devName}: Place a fall opens with a tap`);
  await mgCheck('fell'); await shot('mg-fell-open');
  ok(await page.evaluate(() => getComputedStyle(document.getElementById('mgHelp')).display === 'none' && !document.getElementById('mgGuideBtn').hidden), `${devName}: help text sits behind the ? button`);
  await tapEl('#mgGuideBtn'); await sleep(150); await shot('mg-fell-help');
  ok(await page.evaluate(() => getComputedStyle(document.getElementById('mgHelp')).display !== 'none'), `${devName}: ? shows the help`);
  await mgCheck('fell with help open');
  await tapEl('#mgGuideBtn'); await sleep(100);
  const [fx, fy] = await toScreen(320, 200);
  await E(`F.aim = F.gap; F.sweep = Math.asin(Math.max(-1, Math.min(1, F.gap/75)))`);
  await tapXY(fx, fy); await sleep(50); // aim
  await touch('touchStart', [[fx, fy]]);
  const t0 = Date.now(); while ((await E('F.phase')) === 'cut' && (await E('F.hinge')) > (await E('hingeZone()'))[0] + .04 && Date.now() - t0 < 6000) await sleep(30);
  await shot('mg-fell-cut');
  await touch('touchEnd', []);
  ok(await waitBtn(/Fell another/), `${devName}: felling run finished with touch: ${(await status()).slice(0, 70)}`);
  await shot('mg-fell-done');
  await tapEl('#mgClose'); await sleep(150);

  // bucking: the first tap previews, a second tap on the same spot cuts, a tap elsewhere moves the preview
  await E(`S.stems.bf = 8000; S.stems.val = 8000; render(true)`);
  await E(`openMG('buck')`); await sleep(250);
  await mgCheck('buck'); await shot('mg-buck-open');
  ok(await page.evaluate(() => document.getElementById('mgGuide').hidden && document.getElementById('mgGuideBtn').classList.contains('new')), `${devName}: first bucking run keeps the guide closed and marks the ? button`);
  await tapEl('#mgGuideBtn'); await sleep(150); await shot('mg-buck-guide');
  ok(await page.evaluate(() => { const g = document.getElementById('mgGuide').getBoundingClientRect(), ok = document.getElementById('mgGuideOk').getBoundingClientRect(); return !document.getElementById('mgGuide').hidden && g.bottom <= innerHeight + 1 && ok.bottom <= innerHeight + 1 && ok.height >= 44; }) || await page.evaluate(() => { document.getElementById('mgGuideOk').scrollIntoView({ block: 'nearest' }); return true; }), `${devName}: ? opens the guide over the canvas`);
  await tapEl('#mgGuideOk'); await sleep(100);
  ok((await E('S.ui.buckIntro')) === true && await page.evaluate(() => document.getElementById('mgGuide').hidden), `${devName}: Got it closes the guide and remembers it`);
  await E(`B.cuts = []`);
  const L = await E('B.L'), ft = 16, [bx, by] = await toScreen(40 + ft * 560 / L, 120);
  await tapXY(bx, by); await sleep(80);
  const pk1 = await page.evaluate(() => document.getElementById('mgPeek').textContent);
  ok((await E('B.cuts.length')) === 0 && /At 16 ft/.test(pk1) && /(log|pulp)/.test(pk1) && /Tap again/.test(pk1), `${devName}: first tap previews the cut only: ${pk1}`);
  await shot('mg-buck-preview');
  const [bx2] = await toScreen(40 + 28 * 560 / L, 120);
  await tapXY(bx2, by); await sleep(80);
  ok((await E('B.cuts.length')) === 0 && /At 28 ft/.test(await page.evaluate(() => document.getElementById('mgPeek').textContent)), `${devName}: tapping elsewhere moves the preview`);
  await tapXY(bx2 + 3, by + 10); await sleep(80);
  ok((await E('JSON.stringify(B.cuts)')) === '[28]', `${devName}: a second tap on the same spot cuts there (${await E('JSON.stringify(B.cuts)')})`);
  // drag to scrub, lift, tap to cut
  await touch('touchStart', [[bx, by]]); for (let i = 0; i <= 6; i++) { const [mx] = await toScreen(40 + (8 + i) * 560 / L, 120); await touch('touchMove', [[mx, by]]); await sleep(20); } await touch('touchEnd', []); await sleep(60);
  ok((await E('JSON.stringify(B.cuts)')) === '[28]' && /At 14 ft/.test(await page.evaluate(() => document.getElementById('mgPeek').textContent)), `${devName}: dragging moves the preview without cutting`);
  const [bx3] = await toScreen(40 + 14 * 560 / L, 120); await tapXY(bx3, by); await sleep(80);
  ok((await E('JSON.stringify(B.cuts.slice().sort((a,b)=>a-b))')) === '[14,28]', `${devName}: then a tap cuts at 14 ft`);
  await shot('mg-buck-cuts');
  await tapEl('#mgBtns .mbtn.primary'); await sleep(200);
  ok(await waitBtn(/Cut another/), `${devName}: bucking run sent to the landing: ${(await status()).slice(0, 60)}`);
  await shot('mg-buck-done');
  await tapEl('#mgClose'); await sleep(150);

  // skidding: pick a turn, then hold a finger ahead of the team along the trail
  await E(`S.cut.bf = 8000; S.cut.val = 8000; render(true)`);
  await E(`openMG('skid')`); await sleep(250);
  await mgCheck('skid'); await shot('mg-skid-open');
  await tapEl('#mgBtns .mbtn'); await sleep(100);
  ok((await E('K.phase')) === 'run', `${devName}: a turn picked with a tap`);
  let down = false; const s0 = Date.now(); let shotMid = false;
  while ((await E('K && K.phase')) === 'run' && Date.now() - s0 < 45000) {
    const [lx, ly] = await E(`(() => { const y = K.pos.y + 70; return [K.cxAt(y), y - K.cam]; })()`);
    const [x, y] = await toScreen(lx, Math.min(395, ly));
    await touch(down ? 'touchMove' : 'touchStart', [[x, y]]); down = true; await sleep(40);
    if (!shotMid && Date.now() - s0 > 2500) { await shot('mg-skid-run'); shotMid = true; }
  }
  if (down) await touch('touchEnd', []);
  ok(await waitBtn(/Skid another/), `${devName}: skid run finished with touch: ${(await status()).slice(0, 70)}`);
  await shot('mg-skid-done');
  await tapEl('#mgClose'); await sleep(150);

  // hauling: hold on the road for gas, hold the pedal to brake near the red line
  await E(`S.landing.bf = 8000; S.landing.val = 8000; render(true)`);
  await E(`openMG('haul')`); await sleep(250);
  await mgCheck('haul'); await shot('mg-haul-load');
  await tapEl('#mgBtns .mbtn.primary'); await sleep(100);
  ok((await E('H.phase')) === 'drive', `${devName}: Head for the cove with a tap`);
  const PD = await E('HAUL_PEDAL'), M = await E('MG');
  ok(PD.h * M.k >= 44 && PD.w * M.k >= 44, `${devName}: brake pedal is ${Math.round(PD.w * M.k)}x${Math.round(PD.h * M.k)} CSS px`);
  const [gx, gy] = await toScreen(400, 200), [px, py] = await toScreen(PD.x0 + PD.w / 2, M.LH + PD.y0 + PD.h / 2);
  let mode = null, braked = false; const h0 = Date.now(); let hs = false;
  while ((await E('H && H.phase')) === 'drive' && Date.now() - h0 < 60000) {
    const [v, ra, g] = await E('[H.v, runaway(), Core.haulGrade(H.track, H.x + 40)]');
    const want = v > ra - 70 && g > 0 ? 'brk' : 'gas';
    if (want !== mode) { if (mode) await touch('touchEnd', []); const [x, y] = want === 'brk' ? [px, py] : [gx, gy]; await touch('touchStart', [[x, y]]); mode = want; }
    if (want === 'brk') { braked = braked || (await E('H.ctl && H.ctl.brk')); }
    if (!hs && Date.now() - h0 > 1500) { await shot('mg-haul-drive'); hs = true; }
    await sleep(40);
  }
  if (mode) await touch('touchEnd', []);
  ok(await waitBtn(/Haul another/), `${devName}: haul finished with touch${braked ? ' (braked with the pedal)' : ''}: ${(await status()).slice(0, 70)}`);
  await shot('mg-haul-done');
  await tapEl('#mgClose'); await sleep(150);

  // saw for grade: tap a log on the deck, then tap the on-canvas SAW and TURN buttons by the sawyer's mark
  await nav('#tabMill');
  await tapEl('#mSawBtn'); await sleep(250);
  ok((await E('MG.kind')) === 'saw' && (await E('W.phase')) === 'pick', `${devName}: Saw for grade opens on the log deck`);
  await mgCheck('saw'); await shot('mg-saw-deck');
  const dp = await E('deckPos(W.deck.length)'); const [dx, dy] = await toScreen(dp[0].x, dp[0].y);
  await tapXY(dx, dy); await sleep(100);
  ok((await E('W.phase')) === 'saw', `${devName}: tapping a log rolls it onto the carriage`);
  const SB = await E('SAW_BTN'); const k = (await E('MG')).k;
  ok(SB.saw.h * k >= 44 && SB.turn.h * k >= 44, `${devName}: on-canvas Saw and Turn are ${Math.round(SB.saw.w * k)}x${Math.round(SB.saw.h * k)} CSS px`);
  await mgCheck('saw cutting'); await shot('mg-saw-cut');
  let acts = 0;
  while ((await E('W.phase')) === 'saw' && acts < 200) {
    const a = await E('Core.sawAdvice(W.log, W.cut, sawEye())'); const r = a === 'turn' ? SB.turn : SB.saw;
    const [x, y] = await toScreen(r.x + r.w / 2, r.y + r.h / 2); await tapXY(x, y);
    await page.waitForFunction(() => window.__eval('!W || W.busy <= 0 || W.phase !== "saw"'), null, { timeout: 5000 }).catch(() => {});
    acts++;
  }
  ok((await E('W.phase')) === 'done' && /% of (par|target)/.test(await status()), `${devName}: a touch-only Saw for grade run finishes in ${acts} taps: ${(await status()).slice(0, 60)}`);
  await shot('mg-saw-done');
  await tapEl('#mgClose'); await sleep(150);

  ok(errs.length === 0, `${devName}: no page errors` + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  await browser.close();
}

(async () => {
  for (const d of DEVS) {
    try { await run(d); } catch (e) { ok(false, `${d}: ${e && e.stack || e}`); }
  }
  fs.rmSync(TMP, { recursive: true, force: true });
  console.log(fails ? `${fails} FAILED` : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})();
