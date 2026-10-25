// Runs every repro test in this folder. Not wired into `npm test` on purpose: each test asserts the CORRECT behavior,
// so a FAIL line means the bug is still present. Usage: node tests/repro/run_all.js
const {spawnSync}=require('child_process');const fs=require('fs');const path=require('path');
let bugs=0;
for(const f of fs.readdirSync(__dirname).filter(f=>/^repro_.*\.js$/.test(f)).sort()){
  const r=spawnSync('node',[path.join(__dirname,f)],{encoding:'utf8',timeout:120000});
  const out=(r.stdout||'')+(r.stderr||''); const failed=r.status!==0;
  console.log((failed?'BUG PRESENT  ':'fixed        ')+f); if(failed){bugs++; console.log(out.split('\n').filter(l=>/FAIL|Error/.test(l)).map(l=>'    '+l).join('\n'));}
}
console.log(bugs+' repro(s) still failing');
