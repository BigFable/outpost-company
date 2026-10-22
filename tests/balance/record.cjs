// Re-records tests/balance/baseline.json. Only run this when a balance change
// has been accepted by the owner (see CLAUDE.md), never to make a check pass.
'use strict';
const fs = require('fs');
const path = require('path');
const s = require('./sim-metrics.cjs');

const { seeds, summary } = s.summarize(s.runSim());
const baseline = {
  description: 'Golden balance baseline from the legacy prototype harness (tech plan M0). Means are over seeds.',
  recorded: new Date().toISOString().slice(0, 10),
  command: s.COMMAND,
  hours: s.HOURS,
  policy: s.POLICY,
  profiles: s.PROFILES,
  seeds: s.SEEDS,
  units: { steam: 'minutes into run to reach steam era', gas: 'minutes into run to reach gas era', min: 'run length in minutes (close camp)', L: 'Legacy earned', drafts: 'perk drafts taken' },
  tolerance: { relative: 0.1, absolute: 2 },
  summary,
  perSeed: seeds,
};
fs.writeFileSync(path.join(__dirname, 'baseline.json'), JSON.stringify(baseline, null, 2) + '\n');
console.log('Wrote tests/balance/baseline.json');
