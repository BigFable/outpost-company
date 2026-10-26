// Camp money, model 4 slice 1 (docs/design/lot-stash-and-camp-money.md, part B): each camp keeps its own cash and money
// crosses only with goods. The mill pays half the cove price for slider logs (only what it can afford; the rest sells at
// the cove), Logging pays $40 per plank bundle for the bunkhouse, the crate brings $300 of mill cash every mill run, a ledger
// line in each camp, and old saves load with the new fields defaulted (and the crate cash given once).
// Tuning (2026-10-26): 0.5x price, crate cash every mill run, the mill board's saw.advance is now the Log crate, and the
// auto slider: Logging sends what the mill can saw (rate x buffer minus the pond), up to the slider's cap.
const {JSDOM, VirtualConsole}=require('jsdom');const fs=require('fs');
const errs=[]; const vc=new VirtualConsole(); vc.on('error',e=>errs.push(String(e&&e.stack||e))); vc.on('jsdomError',e=>errs.push('jsdom:'+e.message));
const START="window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});";
const src=fs.readFileSync(__dirname+'/../prototype/timberline.html','utf8');
if(!src.includes(START)) throw new Error('start line not found');
const html=src.replace(START,'window.__eval = s => eval(s); '+START);
const mk=store=>new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,url:'https://x.test/',beforeParse(w){
  if(store) for(const k in store) w.localStorage.setItem(k,store[k]);
  let x=7; w.Math.random=()=>{ x=(x*9301+49297)%233280; return x/233280; };
  w.HTMLCanvasElement.prototype.getContext=function(){return new Proxy({},{get:(t,p)=>p==='measureText'?()=>({width:10}):p in t?t[p]:()=>{},set:(t,p,v)=>(t[p]=v,true)});};
  w.addEventListener('error',e=>errs.push('win:'+e.message));}});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let fails=0; const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m); if(!c) fails++;};
const near=(a,b)=>Math.abs(a-b)<1e-9;
(async()=>{
  let dom=mk(); await sleep(300); let w=dom.window, d=w.document, E=s=>w.__eval(s); const $=id=>d.getElementById(id);
  ok(E('Core.CAMP_MONEY.logPriceMult')===.5 && E('Core.CAMP_MONEY.bundlePrice')===40 && E('Core.CAMP_MONEY.crateCash')===300,'camp money constants are data in core');
  // ---------- the crate
  E('openSawmill(true)');
  ok(E('S.camps.sawmill.cash')===E('Core.FOUNDING_CRATE.cash')+300 && E('S.story.crateCash')===true,'the opening crate adds $300 of mill cash');
  E('S.camps.sawmill.sawn = Core.MILL_CLOSE_BF; closeMill()');
  ok(E('S.camps.sawmill.n')===2 && E('S.camps.sawmill.cash')===E('Core.FOUNDING_CRATE.cash')+300,'the crate cash comes every mill run: mill run 2 starts with it too');
  // ---------- the mill board's saw.advance: the Log crate (logs, not cash)
  const node=E(`JSON.stringify(Core.MILL_META.find(x=>x.id==='saw.advance'))`);
  ok(/"name":"Log crate"/.test(node) && /3,000 bd ft of logs/.test(node),'saw.advance is the Log crate: '+node);
  E(`S.shares.sawmill.legacy=99; buyMillMeta('saw.advance'); S.bulk.logs=0; S.camps.sawmill.sawn = Core.MILL_CLOSE_BF; closeMill()`);
  ok(E('S.camps.sawmill.n')===3 && E('S.bulk.logs')===3000 && E('S.camps.sawmill.cash')===E('Core.millStartCash()'),'with the Log crate, mill run 3 starts with 3,000 bd ft in the pond and no extra cash');
  E(`S.bulk.logs=0; S.camps.sawmill.sawn = Core.MILL_CLOSE_BF; closeMill()`); ok(E('S.bulk.logs')===3000,'and every mill run after');
  // ---------- the slider sale
  const del=(cash,pond=0)=>{ E(`S.millShare=.1; S.landing={bf:1000,val:200}; S.contracts=[]; S.owed=0; S.bulk.logs=${pond}; S.camps.sawmill.cash=${cash}`);
    const c0=E('S.cash'), r=E('deliver(1000)'); return {rev:r, got:E('S.cash')-c0, pond:E('S.bulk.logs'), mill:E('S.camps.sawmill.cash')}; };
  E(`S.millShare=0; S.landing={bf:1000,val:200}; S.contracts=[]; S.owed=0`); const full=E('deliver(1000)');
  E('S.run.millPaid=0; S.camps.sawmill.logPaid=0');
  const a=del(1e4);
  ok(E('millRateNow()*Core.MILL_FLOW_BUFFER_S')>=100,'test setup: the mill can saw more than the 10% cap of a delivery');
  ok(a.pond===100 && near(a.rev, full*.95) && near(1e4-a.mill, full*.05) && near(a.got, a.rev),'empty pond, mill with cash: takes the 10% cap, pays half the cove price; Logging gets the cove sale plus the mill’s payment');
  ok(near(E('S.run.millPaid'), full*.05) && near(E('S.camps.sawmill.logPaid'), full*.05),'both camps record the log payment');
  // round 4: logs floated to the mill pond are not charter deliveries; only the cove sale counts toward orders
  E(`S.millShare=.1; S.landing={bf:1000,val:200}; S.owed=0; S.bulk.logs=0; S.camps.sawmill.cash=1e4; S.contracts=[{mill:'A yard', vol:5000, done:0, dur:300, end:S.t+300, prem:.2, penalty:0}]`);
  const rc=E('deliver(1000)');
  ok(near(E('S.contracts[0].done'), 900) && near(rc, full*.95 + full*.9*.2),'a charter order counts only the 900 bd ft sold at the cove, its bonus at the cove price');
  E('S.contracts=[]');
  const b=del(full*.025);
  ok(near(b.pond, 50) && b.mill===0 && near(b.rev, full*(1-.05) + full*.025),'short of cash: the mill takes only the logs it can pay for, the rest sells at the cove');
  const c=del(0);
  ok(c.pond===0 && c.mill===0 && near(c.rev, full),'no mill cash: every log sells at the cove, Logging is paid in full, no debt');
  E('render(true)'); ok(/short of cash/.test($('millSlMeta').textContent) && /The mill pays half the cove price\./.test($('millSlMeta').textContent),'slider note says the mill pays half and when it is short of cash: '+$('millSlMeta').textContent);
  // ---------- the auto slider: sends what the mill can saw, up to the cap
  const tgt=E('millRateNow()*Core.MILL_FLOW_BUFFER_S');
  const f1=del(1e4, tgt-40); ok(near(f1.pond, tgt) && near(1e4-f1.mill, full*.04*.5),'pond nearly full: Logging sends only the 40 bd ft the mill can saw (4%), and the mill pays for those');
  const f2=del(1e4, tgt+500); ok(near(f2.pond, tgt+500) && f2.mill===1e4 && near(f2.rev, full),'pond full: nothing goes to the mill, every log sells at the cove');
  E('millFlow.sent=0; millFlow.amt=0'); del(1e4, tgt-40); E('render(true)');
  ok($('millFlow').textContent==='Sending 4% now. Cap 10%.' && $('millShareV').textContent==='up to 10%','flow line under the slider: '+$('millFlow').textContent+' / '+$('millShareV').textContent);
  E('millFlow.sent=0; millFlow.amt=0'); del(1e4, 0); E('render(true)');
  ok($('millFlow').textContent==='Sending 10% now. Cap 10%.','empty pond: sending the full cap: '+$('millFlow').textContent);
  const inp=$('millShare'); inp.value='30'; inp.dispatchEvent(new w.Event('input',{bubbles:true}));
  ok(E('S.millShare')===.3 && $('millFlow').textContent==='Sending 10% now. Cap 30%.','moving the slider sets the cap: '+$('millFlow').textContent);
  inp.value='0'; inp.dispatchEvent(new w.Event('input',{bubbles:true}));
  ok($('millFlow').textContent==='Sending 0% now. Cap 0%.' && $('millShareV').textContent==='off' && E(`S.landing={bf:1000,val:200}; S.bulk.logs=0; deliver(1000); S.bulk.logs`)===0,'cap 0%: nothing is sent');
  E('S.millShare=.1'); del(0,0);
  ok(/^With the mill this outpost: logs sold \+\$[\d.]+K? · bundles bought −\$0\.$/.test($('millLedger').textContent),'Logging ledger line: '+$('millLedger').textContent);
  // ---------- bundles for the bunkhouse
  E(`S.bank[BUNDLE]=4; S.cash=100; S.camps.sawmill.cash=0; render(true)`);
  ok(E(`canBuild('logging.bunkhouse')`)===false && $('bunkBuy').disabled && /\$160 to the mill/.test($('bunkGroup').textContent),'bunkhouse level 1 costs Logging $160 (4 bundles × $40); not enough Logging cash, no build');
  E(`S.cash=1000; render(true)`); $('bunkBuy').click();
  ok(E('S.structures["logging.bunkhouse"]')===1 && E('S.cash')===840 && E('S.camps.sawmill.cash')===160 && E('S.camps.sawmill.bundleIn')===160 && E('S.run.bundlePaid')===160,'building it pays $160 from Logging cash into mill cash');
  E('render(true)'); ok(/bundles bought −\$160/.test($('millLedger').textContent),'Logging ledger shows the bundles bought');
  $('tabMill').click(); E('render(true)');
  ok(/^With Logging this mill run: logs bought −\$[\d.]+K? · bundles sold \+\$160\.$/.test($('mLedger').textContent),'mill ledger line: '+$('mLedger').textContent);
  ok(E(`canBuild('sawmill.pond')`)===E(`bankN(SPAR)>=3 && bankN('logging.amber_pitch')>=2 && S.camps.sawmill.cash>=100`),'mill structures still pay mill cash only');
  // ---------- old saves
  E(`S.story.crateCash=false; delete S.camps.sawmill.logPaid; delete S.camps.sawmill.bundleIn; delete S.run.millPaid; delete S.run.bundlePaid; S.camps.sawmill.cash=50`);
  w.dispatchEvent(new w.Event('pagehide')); const st=w.localStorage.getItem('timberline-v2'); dom.window.close();
  const o=JSON.parse(st); ok(o.story.crateCash===false && o.camps.sawmill.logPaid===undefined,'test save has no camp-money fields (as before this change)');
  dom=mk({'timberline-v2':st}); await sleep(300); w=dom.window; d=w.document; E=s=>w.__eval(s);
  ok(E('S.camps.sawmill.logPaid')===0 && E('S.camps.sawmill.bundleIn')===0 && E('S.run.millPaid')===0 && E('S.run.bundlePaid')===0,'old save loads: ledger fields default to 0');
  ok(Math.abs(E('S.camps.sawmill.cash')-350)<1 && E('S.story.crateCash')===true,'an old save with an open mill gets the crate’s $300 once: '+E('S.camps.sawmill.cash'));
  w.dispatchEvent(new w.Event('pagehide')); const st2=w.localStorage.getItem('timberline-v2'); dom.window.close();
  dom=mk({'timberline-v2':st2}); await sleep(300); w=dom.window; E=s=>w.__eval(s);
  ok(Math.abs(E('S.camps.sawmill.cash')-350)<2,'and only once: reloading does not add it again');
  const s3=JSON.parse(st2); s3.camps.sawmill.cash='x'; dom.window.close();
  dom=mk({'timberline-v2':JSON.stringify(s3)}); await sleep(300); w=dom.window; E=s=>w.__eval(s);
  ok(E('S.camps.sawmill.cash')===0,'a broken mill cash value loads as $0');
  dom.window.close();
  ok(errs.length===0,'no console errors'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
  console.log(fails?fails+' FAILED':'ALL PASS'); process.exit(fails?1:0);
})();
