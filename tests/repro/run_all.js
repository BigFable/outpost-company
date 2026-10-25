// Runs every repro test in this folder (part of `npm test` since the 2026-10-25 bugfix pass). Each test asserts the CORRECT behavior,
// so a FAIL line means the bug is back. Exits 1 if any repro fails. Usage: node tests/repro/run_all.js
// Skipped on purpose (still runnable by hand, e.g. after a balance change):
//   repro_09: QA-09 Storm season curse. The owner chose to keep the curse as it is (2026-10-25), so this one is expected to "fail".
const {spawnSync}=require('child_process');const fs=require('fs');const path=require('path');
const SKIP={'repro_09_storm_season_curse_is_free.js':'QA-09 kept by owner decision'};
let bugs=0;
for(const f of fs.readdirSync(__dirname).filter(f=>/^repro_.*\.js$/.test(f)).sort()){
  if(SKIP[f]){ console.log('skipped      '+f+' ('+SKIP[f]+')'); continue; }
  const r=spawnSync('node',[path.join(__dirname,f)],{encoding:'utf8',timeout:120000});
  const out=(r.stdout||'')+(r.stderr||''); const failed=r.status!==0;
  console.log((failed?'BUG PRESENT  ':'fixed        ')+f); if(failed){bugs++; console.log(out.split('\n').filter(l=>/FAIL|Error/.test(l)).map(l=>'    '+l).join('\n'));}
}
console.log(bugs+' repro(s) still failing');
process.exit(bugs?1:0);
