// Starts the Vite dev server, fetches /legacy/ and checks that it serves the
// prototype byte for byte and that the page boots in jsdom without errors.
// Also checks the production build (apps/web/dist) carries the same bytes.
'use strict';
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const ROOT = path.resolve(__dirname, '..', '..');
const PROTO = fs.readFileSync(path.join(ROOT, 'prototype', 'timberline.html'), 'utf8');
let fails = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };

(async () => {
  const { createServer } = await import('vite');
  const server = await createServer({ root: path.join(ROOT, 'apps', 'web'), configFile: path.join(ROOT, 'apps', 'web', 'vite.config.ts'), server: { port: 0, open: false }, logLevel: 'error' });
  await server.listen();
  const base = server.resolvedUrls.local[0];
  try {
    const res = await fetch(new URL('legacy/', base));
    const html = await res.text();
    ok(res.status === 200, `dev server GET /legacy/ -> ${res.status}`);
    ok(html === PROTO, 'dev server serves prototype/timberline.html unchanged');
    const root = await fetch(base);
    ok(root.status === 200 && (await root.text()).includes('legacy/'), 'dev server root links to the legacy entry');

    const errs = [];
    const vc = new VirtualConsole();
    vc.on('error', (e) => errs.push(String(e && e.stack || e)));
    vc.on('jsdomError', (e) => errs.push('jsdom:' + e.message));
    const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc, url: new URL('legacy/', base).href,
      beforeParse(w) {
        // jsdom has no canvas; same stub as tests/smoke_rogue2.js
        w.HTMLCanvasElement.prototype.getContext = function () { return new Proxy({}, { get: (t, p) => p === 'measureText' ? () => ({ width: 10 }) : p in t ? t[p] : () => {}, set: (t, p, v) => (t[p] = v, true) }); };
        w.addEventListener('error', (e) => errs.push('win:' + e.message));
      } });
    await new Promise((r) => setTimeout(r, 500));
    ok(dom.window.document.title === 'Timberline', 'served page boots (title Timberline)');
    ok(dom.window.document.querySelectorAll('button').length > 0, 'served page renders buttons');
    ok(errs.length === 0, 'no console errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
    dom.window.close();
  } finally {
    await server.close();
  }

  const built = path.join(ROOT, 'apps', 'web', 'dist', 'legacy', 'index.html');
  ok(fs.existsSync(built) && fs.readFileSync(built, 'utf8') === PROTO, 'build output dist/legacy/index.html equals the prototype');

  console.log(fails ? `${fails} FAILED` : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
