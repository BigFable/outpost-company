// npm run balance:check — re-runs the simulation and compares it with the
// golden baseline. A metric passes when |now - baseline| <= max(absolute, relative * baseline).
'use strict';
const fs = require('fs');
const path = require('path');
const s = require('./sim-metrics.cjs');

const base = JSON.parse(fs.readFileSync(path.join(__dirname, 'baseline.json'), 'utf8'));
const { relative, absolute } = base.tolerance;
console.log(`Running: ${base.command}`);
const { summary } = s.summarize(s.runSim());

let fails = 0;
let total = 0;
for (const p of base.profiles) {
  for (const run of Object.keys(base.summary[p])) {
    for (const m of [...s.METRICS, 'unfinished']) {
      const want = base.summary[p][run][m];
      const got = summary[p]?.[run]?.[m] ?? null;
      let ok;
      if (want === null || got === null) ok = want === got;
      else if (m === 'unfinished') ok = got <= want;
      else ok = Math.abs(got - want) <= Math.max(absolute, Math.abs(want) * relative);
      total++;
      if (!ok) fails++;
      console.log(`${ok ? 'PASS' : 'FAIL'} ${p.padEnd(9)} ${run} ${m.padEnd(10)} baseline ${String(want).padStart(6)}  now ${String(got).padStart(6)}`);
    }
  }
}
console.log(fails ? `BALANCE CHECK FAILED: ${fails}/${total} metrics outside tolerance` : `BALANCE CHECK PASSED: ${total}/${total} metrics within tolerance`);
process.exit(fails ? 1 : 0);
