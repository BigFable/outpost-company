// Headless Electron smoke test. Launches the shell hidden, waits for the
// legacy prototype to load, fails on console errors, and checks the Steam bridge:
//  1. Steam absent: the game loads normally and the bridge reports "none".
//  2. (dev shell only) In-memory fake Steam with a newer cloud save: the start
//     rule takes the cloud save, the next autosave uploads to the cloud, and the
//     save's achievements mirror to Steam.
// On Linux without a display it wraps itself in xvfb-run when available.
//
//   node smoke.cjs             dev shell (electron .)
//   node smoke.cjs --packaged  the packaged Linux build in release/linux-unpacked
'use strict';
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const packaged = process.argv.includes('--packaged');
let bin;
let args;
if (packaged) {
  bin = path.join(__dirname, 'dist', 'release', 'linux-unpacked', 'outpost-company');
  if (!fs.existsSync(bin)) { console.error(`FAIL no packaged build at ${bin}; run pnpm --filter @outpost/desktop dist:linux`); process.exit(1); }
  args = ['--no-sandbox', '--disable-gpu'];
} else {
  bin = require('electron'); // path to the binary
  args = ['.', '--no-sandbox', '--disable-gpu'];
}

function launch(extraEnv) {
  // A throwaway profile so the smoke never touches a real save.
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'outpost-smoke-'));
  const env = { ...process.env, OUTPOST_SMOKE: '1', ...extraEnv };
  let cmd = bin;
  let argv = [...args, `--user-data-dir=${profile}`];
  if (process.platform === 'linux' && !process.env.DISPLAY) {
    const which = spawnSync('which', ['xvfb-run']);
    if (which.status === 0) { cmd = 'xvfb-run'; argv = ['-a', bin, ...argv]; }
  }
  const r = spawnSync(cmd, argv, { cwd: __dirname, env, encoding: 'utf8', timeout: 60000 });
  fs.rmSync(profile, { recursive: true, force: true });
  const out = (r.stdout || '') + (r.stderr || '');
  const line = (r.stdout || '').split('\n').find((l) => l.startsWith('{'));
  let result = null;
  try { result = line && JSON.parse(line); } catch { /* reported below */ }
  return { status: r.status, out, line, result };
}

function check(name, run, ok) {
  if (run.status === 0 && run.result && ok(run.result.bridge || {})) { console.log(`PASS ${name}:`, run.line); return true; }
  console.error(`FAIL ${name} (exit ${run.status})\n${run.out.slice(-3000)}`);
  return false;
}

const label = packaged ? ' (packaged)' : '';
const absent = check(`electron shell${label} loaded the prototype with Steam absent`,
  launch({ OUTPOST_STEAM_APP_ID: '', OUTPOST_FAKE_STEAM: '' }),
  (b) => b.backend === 'none' && b.panel === true);

const cloudSave = JSON.stringify({ v: 2, last: Date.now() + 60000, ach: ['first_tree', 'first_sale'] });
const fake = packaged || check('electron shell bridge against a fake Steam',
  launch({ OUTPOST_FAKE_STEAM: '1', OUTPOST_FAKE_CLOUD_SAVE: cloudSave, OUTPOST_SMOKE_WAIT_MS: '7000' }),
  (b) => b.backend === 'steam' && b.startSave === 'cloud' && b.cloudWrites >= 1
    && b.localAch.includes('first_tree')
    && ['ACH_WIN_ONE_GAME', 'ACH_TRAVEL_FAR_ACCUM'].every((n) => b.mirrored.includes(n)));

process.exit(absent && fake ? 0 : 1);
