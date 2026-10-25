// Hauling mini-game (playtest 1): no stall-out starts, no fine for a max legal load, a fair par the competent
// driver reaches, pay that rewards full/clean/fast loads, the new haul improvements and perks, old saves load.
const {JSDOM, VirtualConsole}=require('jsdom');const fs=require('fs');
const errs=[]; const vc=new VirtualConsole(); vc.on('error',e=>errs.push(String(e&&e.stack||e))); vc.on('jsdomError',e=>errs.push('jsdom:'+e.message));
const START="window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});";
const src=fs.readFileSync(__dirname+'/../prototype/timberline.html','utf8');
if(!src.includes(START)) throw new Error('start line not found');
const html=src.replace(START,'window.__eval = s => eval(s); '+START);
const mk=(store)=>new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,url:'https://x.test/',beforeParse(w){
  if(store) for(const k in store) w.localStorage.setItem(k,store[k]);
  w.HTMLCanvasElement.prototype.getContext=function(){return new Proxy({},{get:(t,p)=>p==='measureText'?()=>({width:10}):p in t?t[p]:()=>{},set:(t,p,v)=>(t[p]=v,true)});};
  w.addEventListener('error',e=>errs.push('win:'+e.message));}});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let fails=0; const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m); if(!c) fails++;};
// drive the open haul with the competent-driver policy (or full gas), one fixed step at a time
const DRIVE=`(pol => { let i=0; while(H && H.phase==='drive' && i++<40000){
  const c = pol==='gas' ? {gas:true, brk:false} : Core.haulPolicy(H.rules.phys, H.v, Core.haulGrade(H.track, H.x));
  MG.keys.ArrowRight=c.gas; MG.keys.ArrowLeft=c.brk; haulStep(1/60); } MG.keys={}; return H.phase; })`;
(async()=>{
 const dom=mk(); await sleep(300); const w=dom.window, d=w.document, E=s=>w.__eval(s);
 const st=()=>d.getElementById('mgStatus').textContent;
 const haul=(season, setup)=>{ E(`closeMG(); S.season=${season}; S.landing={bf:1e6, val:2e5}; ${setup||''} openMG('haul'); cancelAnimationFrame(MG.raf);`); };

 // 1. spring, max legal load, competent driver: no fine, full pay ticket, under par
 haul(0, `S.upg=[]; S.run.perks=[]; S.cash=0; S.owed=0;`);
 ok(E('H.n')===E('H.limit') && E('H.limit')===7,'spring default load is the max legal load (7): '+E('H.n'));
 ok(/Target \d+ s/.test(st()) && !/fine/i.test(st()),'load screen shows par and no fine: '+st().slice(0,120));
 E(`haulGo()`); ok(E('H.v')===0 && E(`Core.haulGrade(H.track, H.x)`)>=0,'starts at a standstill on a flat or downhill stretch');
 E(`MG.keys.ArrowRight=true; for(let i=0;i<60;i++) haulStep(1/60); MG.keys={};`);
 ok(E('H.v')>60,'clean launch: rolling after a second of gas: '+Math.round(E('H.v')));
 ok(E(DRIVE)('par')==='done','competent drive reaches the cove');
 const r=E('H.result');
 ok(E('H.spill')===0 && E('H.t')<=E('H.par'),'competent driver beats par with nothing lost: '+E('H.t').toFixed(1)+' vs '+E('H.par'));
 ok(Math.abs(E('S.cash')-(r.rev+r.bonus))<1e-6 && r.bonus>0,'cash = sale + bonus, nothing deducted: '+Math.round(E('S.cash')));
 ok(/Full load \+15%/.test(st()) && /Nothing lost \+10%/.test(st()) && /Beat target \+([6-9]|1[0-8])%/.test(st()) && /Total/.test(st()),'end ticket explains the pay: '+st().slice(0,200));
 ok(!/fine/i.test(st()),'no fine on the end ticket');
 ok(E('S.stats.parHaul')===1 && E('S.stats.cleanHaul')===1,'par and clean haul counted');

 // 2. many roads, every season, legal and overweight loads: never a deduction, competent driver under par
 let worst=1e9, over=0, bad=0;
 for(let k=0;k<24;k++){ const sea=k%4;
   haul(sea, `S.upg=${k%3?"['hay','bunks']":"[]"}; S.run.perks=[]; S.cash=0; S.owed=0;`);
   if(k%2){ E('H.n=H.maxN; haulLoadUI();'); over++; }
   E('haulGo()'); E(DRIVE)('par'); const rr=E('H.result');
   worst=Math.min(worst, E('S.cash')-rr.rev);
   if(E('H.spill')!==0 || E('H.t')>E('H.par')) bad++;
 }
 ok(worst>=0,'no haul ever pays less than its sale (no fines): min bonus '+worst.toFixed(2));
 ok(bad===0,'competent driver under par with nothing lost on 24 roads ('+over+' overweight): misses '+bad);

 // 3. overweight is a chosen, visible risk with a premium
 haul(1, `S.upg=[]; S.run.perks=[]; S.cash=0;`);
 E('H.n=H.limit+3; haulLoadUI();');
 ok(/3 over the limit: \+15% pay/.test(st()),'overweight shows its premium: '+st().slice(0,160));
 E('haulGo()'); E(DRIVE)('par');
 ok(E('H.spill')>0 || /Over limit \+15%/.test(st()),'overweight premium paid when the load arrives whole: '+st().slice(0,160));

 // 4. full gas the whole way can run away on a downgrade; the ticket says what to do
 let ran=0; for(let k=0;k<6 && !ran;k++){ haul(1, `S.upg=[]; S.run.perks=[];`); E('haulGo()'); E(DRIVE)('gas'); if(E('H.spill')>0) ran++; }
 ok(ran===0 || /brake before/.test(st()),'a runaway explains how to avoid it: '+st().slice(-90));

 // 5. new improvements and perks apply in the game
 haul(1, `S.upg=['roughlock','hillhitch','lookout','binders']; S.run.perks=['gravity','overload','highball'];`);
 ok(E('H.limit')===12 && E('H.maxN')===E('H.limit')+10,'binders +2 limit, overload artist +4 over: '+E('H.limit')+'/'+E('H.maxN'));
 ok(E('H.rules.phys.jake')>0 && E('H.rules.phys.crawl')===45 && E('H.rules.lookout') && E('H.rules.phys.store'),'rough locks, hill hitch, lookout and gravity road reach the rig');
 E('haulGo()'); E('haulStep(1/60); haulDraw();');
 ok(errs.length===0,'lookout and gravity HUD draw without errors');
 const games=E('S.run.games||0'); E(DRIVE)('par');
 ok(E('H.t')<=E('H.par') ? E('S.run.games')-games===2 : true,'Highballer: a haul under par counts twice toward the draft');

 // 6. unlock routes: mini-game and crews' route
 E(`S.upg=[]; S.ach=[]; Object.assign(S.stats,{parHaul:2, winters:6, cleanHaul:0, run_haul:0, contracts:0, fullLoads:0, tracts:0}); checkUnlocks(true);`);
 ok(E(`S.upg.includes('roughlock') && S.upg.includes('hillhitch') && !S.upg.includes('binders') && !S.upg.includes('lookout')`),'rough locks (beat par twice) and hill hitch (6 winters) unlock: '+E('S.upg.join()'));
 E(`S.stats.tracts=40; S.ach=Array.from({length:24},(_, i)=>'x'+i); checkUnlocks(true);`);
 ok(E(`S.upg.includes('binders') && S.upg.includes('lookout')`),'binders and lookout have crews\' routes: '+E('S.upg.join()'));
 E('closeMG()');

 // 7. an old save without the new stat loads
 w.dispatchEvent(new w.Event('pagehide'));
 const save=JSON.parse(w.localStorage.getItem('timberline-v2')); delete save.stats.parHaul; save.last=Date.now(); dom.window.close();
 const dom2=mk({'timberline-v2':JSON.stringify(save)}); await sleep(300);
 ok(dom2.window.__eval('S.stats.parHaul')===0,'old save gets parHaul = 0');
 dom2.window.__eval(`S.landing={bf:5000,val:1000}; openMG('haul'); haulGo();`);
 ok(dom2.window.__eval(`H.phase`)==='drive','old save can drive a load');
 dom2.window.__eval('closeMG()');
 await sleep(100);
 ok(errs.length===0,'no console errors'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
 console.log(fails?`${fails} FAILED`:'ALL PASS'); process.exit(fails?1:0);
})();
