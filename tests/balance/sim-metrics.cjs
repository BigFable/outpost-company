// Shared helpers for the golden balance baseline (tech plan M0).
// Runs the existing harness exactly as `npm run sim` does and turns its
// JSON lines into per-profile, per-run metrics.
'use strict';
const { execFileSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const HOURS = 8;
const POLICY = 'gas';
const PROFILES = ['idle', 'casual', 'minigame', 'idle-away'];
const SEEDS = [1, 2, 3];
const METRICS = ['steam', 'gas', 'min', 'L', 'drafts'];
const COMMAND = `python3 sim/build.py prototype/timberline.html sim/game_rogue.html && node sim/sim_rogue.js ${HOURS} ${POLICY} ${PROFILES.join(',')} ${SEEDS.join(',')}`;

function runSim() {
  execFileSync('python3', ['sim/build.py', 'prototype/timberline.html', 'sim/game_rogue.html'], { cwd: ROOT, stdio: 'inherit' });
  // stderr carries harmless jsdom "canvas not implemented" noise; drop it.
  const out = execFileSync('node', ['sim/sim_rogue.js', String(HOURS), POLICY, PROFILES.join(','), SEEDS.join(',')], {
    cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024,
  });
  return out.split('\n').filter((l) => l.startsWith('{')).map((l) => JSON.parse(l));
}

const mean = (xs) => {
  const v = xs.filter((x) => typeof x === 'number');
  return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 100) / 100 : null;
};

/** Turn raw harness lines into { seeds: {...}, summary: {profile: {run1: {metric: mean}}} } */
function summarize(lines) {
  const seeds = {};
  const summary = {};
  for (const p of PROFILES) {
    seeds[p] = {};
    summary[p] = {};
    const mine = lines.filter((l) => l.p === p);
    for (const l of mine) {
      seeds[p][l.seed] = l.runs.map((r) => ({
        run: r.n, steam: r.steam, gas: r.gas, min: r.min, L: r.L, drafts: r.drafts ?? null, unfinished: !!r.unf,
      }));
    }
    for (let i = 0; i < 3; i++) {
      const runs = mine.map((l) => l.runs[i]).filter(Boolean);
      const row = {};
      for (const m of METRICS) row[m] = mean(runs.map((r) => r[m]));
      row.unfinished = runs.filter((r) => r.unf).length;
      summary[p]['run' + (i + 1)] = row;
    }
  }
  return { seeds, summary };
}

module.exports = { ROOT, HOURS, POLICY, PROFILES, SEEDS, METRICS, COMMAND, runSim, summarize };
