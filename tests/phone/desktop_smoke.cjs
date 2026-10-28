// Desktop and mid-width layout smoke test (UI rework slice 2): the prototype in Chromium at a wide desktop and a narrow laptop.
// Checks the sidebar (full at wide, an icon rail with a names toggle at mid width), toasts inside the top bar clear of every
// control, the camp tabs and stage cards, and no sideways scroll. Run with `pnpm run test:phone` (needs a Playwright Chromium).
//   PLAYWRIGHT_BROWSERS_PATH  where Chromium lives (default /opt/pw-browsers)
//   PLAYWRIGHT_MODULE         path to the playwright package if it is not installed in this repo
//   SHOTS=<dir>               also save screenshots there
/* global window, document, innerWidth -- browser code inside page.evaluate */
'use strict';
const fs = require('fs');
const path = require('path');
process.env.PLAYWRIGHT_BROWSERS_PATH = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
let pw;
for (const m of [process.env.PLAYWRIGHT_MODULE, 'playwright', '/opt/npm-tools/node_modules/playwright'].filter(Boolean)) { try { pw = require(m); break; } catch { /* next */ } }
if (!pw) { console.log('SKIP desktop smoke: playwright is not installed (set PLAYWRIGHT_MODULE)'); process.exit(0); }
const { chromium } = pw;

const ROOT = path.resolve(__dirname, '..', '..');
const START = "window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});";
const src = fs.readFileSync(path.join(ROOT, 'prototype', 'timberline.html'), 'utf8');
if (!src.includes(START)) throw new Error('start line not found');
const TMP = fs.mkdtempSync(path.join(require('os').tmpdir(), 'desk-smoke-'));
const PAGE = path.join(TMP, 'game.html');
fs.writeFileSync(PAGE, src.replace(START, 'window.__eval = s => eval(s); ' + START));
const SHOTS = process.env.SHOTS ? path.resolve(process.env.SHOTS) : null;
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });

let fails = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run(name, width, height) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width, height } });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/ERR_FAILED|fonts/.test(m.text())) errs.push(m.text()); });
  await page.goto('file://' + PAGE);
  await page.waitForFunction(() => typeof window.__eval === 'function');
  await sleep(300);
  const E = (s) => page.evaluate((x) => window.__eval(x), s);
  const shot = async (n) => { if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `${name}--${n}.png`) }); };
  const noSideScroll = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  const mid = width <= 1060;
  await E(`S.cash = 4e5; openSawmill(true); S.story.card = false; $('story').hidden = true; S.stems.bf = S.cut.bf = S.landing.bf = 8000; S.stems.val = S.cut.val = S.landing.val = 8000;
    S.run.perks.push('greased'); queueDraft(1); $('toasts').innerHTML = ''; render(true)`);
  await sleep(200);

  // ---------- 1. sidebar: full at wide, an icon rail at mid width
  const side = await page.evaluate(() => { const s = document.getElementById('side').getBoundingClientRect(), nm = document.querySelector('#tabLog .nm').getBoundingClientRect(), rb = document.getElementById('railBtn').getBoundingClientRect();
    return { w: Math.round(s.width), name: nm.width > 20, rail: rb.width >= 44 && rb.height >= 44 }; });
  if (mid) {
    ok(side.w <= 80 && !side.name && side.rail, `${name}: the sidebar is an icon rail with a names button ${JSON.stringify(side)}`);
    const rows = await page.evaluate(() => [...document.querySelectorAll('#side .nav > button:not([hidden])')].map((b) => b.getBoundingClientRect()).every((r) => r.width >= 44 && r.height >= 44));
    ok(rows, `${name}: rail rows are 44 px or more`);
    await shot('rail');
    await page.click('#railBtn'); await sleep(250);
    const open = await page.evaluate(() => { const s = document.getElementById('side').getBoundingClientRect(), nm = document.querySelector('#navAlm .nm').getBoundingClientRect(); return { w: Math.round(s.width), name: nm.width > 20, shade: !document.getElementById('drawerBg').hidden }; });
    ok(open.w >= 220 && open.name && open.shade, `${name}: the names button shows the sidebar with names over the page ${JSON.stringify(open)}`);
    await shot('rail-open');
    await page.click('#navAlm'); await sleep(200);
    ok((await E('S.ui.screen')) === 'almanac' && await page.evaluate(() => !document.getElementById('app').classList.contains('drawer') && document.getElementById('side').getBoundingClientRect().width <= 80), `${name}: picking a row opens it and folds the rail back`);
    await page.click('#railBtn'); await sleep(200); await page.mouse.click(width - 30, height - 30); await sleep(200);
    ok(await page.evaluate(() => !document.getElementById('app').classList.contains('drawer')), `${name}: a click on the shade folds the rail`);
  } else {
    ok(side.w >= 220 && side.name && !side.rail, `${name}: the full sidebar with names ${JSON.stringify(side)}`);
    await page.click('#navAlm'); await sleep(200);
  }
  ok(await page.evaluate(() => !document.getElementById('scrAlm').hidden && document.getElementById('wh').hidden), `${name}: the Almanac opens its own screen`);
  await page.click('#tabLog'); await sleep(200);

  // ---------- 2. camp tabs and stage cards
  for (const id of ['ltWork', 'ltLots', 'ltCrews', 'ltCamp', 'ltLog']) {
    await page.click('#' + id); await sleep(120);
    ok(await page.evaluate((id) => document.getElementById(id).getAttribute('aria-selected') === 'true' && !document.getElementById(document.getElementById(id).getAttribute('aria-controls')).hidden, id) && await noSideScroll(), `${name}: tab ${id} opens, no sideways scroll`);
  }
  await page.click('#ltWork'); await sleep(120);
  const rowsOf = await page.evaluate(() => new Set([...document.querySelectorAll('#chain .stc')].map((c) => Math.round(c.getBoundingClientRect().top))).size);
  ok(rowsOf === (mid ? 2 : 1), `${name}: stage cards in ${mid ? 'two rows' : 'one row'} (${rowsOf})`);
  await shot('camp');

  // ---------- 3. toasts: inside the top bar, clear of cash, shares, the bell and the camp header buttons
  await E(`window.scrollTo(0, 0); toast({label:'Achievement', name:'Wintered over', line:'+$250 · reputation +1'})`); await sleep(400);
  const t = await page.evaluate(() => { const r = (el) => el.getBoundingClientRect(), box = (el) => { const b = r(el); return { left: b.left, right: b.right, top: b.top, bottom: b.bottom }; };
    const toastEl = document.querySelector('#toasts .toast'), tb = box(toastEl), top = box(document.getElementById('topbar'));
    const ctl = [...document.querySelectorAll('button, input, summary, a')].filter((b) => b.offsetParent && !document.getElementById('topbar').querySelector('.tinfo').contains(b)).map(box).filter((b) => b.right > b.left);
    return { tb, inTop: tb.top >= top.top - 1 && tb.bottom <= top.bottom + 1 && tb.left >= top.left - 1 && tb.right <= top.right + 1, hits: ctl.filter((c) => c.left < tb.right - 1 && tb.left < c.right - 1 && c.top < tb.bottom - 1 && tb.top < c.bottom - 1).length };
  });
  ok(t.inTop && t.hits === 0, `${name}: a toast shows inside the top bar and covers no control ${JSON.stringify({ inTop: t.inTop, hits: t.hits })}`);
  await shot('toast');
  await E(`window.scrollTo(0, 400)`); await sleep(100);
  const t2 = await page.evaluate(() => { const a = document.querySelector('#toasts .toast').getBoundingClientRect(), b = document.getElementById('topbar').getBoundingClientRect(); return a.top >= b.top - 1 && a.bottom <= b.bottom + 1; });
  ok(t2, `${name}: the toast stays in the top bar when the page scrolls`);
  await E(`$('toasts').innerHTML = ''; window.scrollTo(0, 0)`);

  // ---------- 4. the bell
  await page.click('#bellBtn'); await sleep(150);
  ok(await page.evaluate(() => { const r = document.getElementById('bellTray').getBoundingClientRect(); return !document.getElementById('bellTray').hidden && r.right <= innerWidth + 1 && r.left >= 0; }), `${name}: the bell list opens on screen`);
  await shot('bell');
  await page.click('#bellBtn'); await sleep(100);

  // ---------- 5. Sawmill tabs
  await page.click('#tabMill'); await sleep(200);
  for (const id of ['mtMill', 'mtStructs', 'mtSawyers', 'mtRun']) { await page.click('#' + id); await sleep(120);
    ok(await page.evaluate((id) => document.getElementById(id).getAttribute('aria-selected') === 'true', id) && await noSideScroll(), `${name}: Sawmill tab ${id} opens, no sideways scroll`); }
  await shot('sawmill');
  ok(errs.length === 0, `${name}: no page errors` + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  await browser.close();
}

(async () => {
  for (const [n, w, h] of [['desktop-1440', 1440, 900], ['laptop-1000', 1000, 760], ['tablet-768', 768, 1024]]) {
    try { await run(n, w, h); } catch (e) { ok(false, `${n}: ${e && e.stack || e}`); }
  }
  fs.rmSync(TMP, { recursive: true, force: true });
  console.log(fails ? `${fails} FAILED` : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})();
