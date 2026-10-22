// Headless Electron smoke test: launches the shell hidden, waits for the
// legacy prototype to load and fails on console errors. On Linux without a
// display it wraps itself in xvfb-run when available.
'use strict';
const { spawnSync } = require('node:child_process');
const electron = require('electron'); // path to the binary
const args = ['.', '--no-sandbox', '--disable-gpu'];
const env = { ...process.env, OUTPOST_SMOKE: '1' };
let cmd = electron;
let argv = args;
if (process.platform === 'linux' && !process.env.DISPLAY) {
  const which = spawnSync('which', ['xvfb-run']);
  if (which.status === 0) { cmd = 'xvfb-run'; argv = ['-a', electron, ...args]; }
}
const r = spawnSync(cmd, argv, { cwd: __dirname, env, encoding: 'utf8', timeout: 60000 });
const out = (r.stdout || '') + (r.stderr || '');
const line = (r.stdout || '').split('\n').find((l) => l.startsWith('{'));
if (r.status === 0 && line) { console.log('PASS electron shell loaded the prototype:', line); process.exit(0); }
console.error('FAIL electron smoke test (exit ' + r.status + ')\n' + out.slice(-3000));
process.exit(1);
