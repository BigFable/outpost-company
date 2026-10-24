// Tuning rules (2026-10-22): repeat bounties at a lower rate with a per-outpost cap, Charter Shares bonus per push inland,
// a slower crews' route to improvements for idle players, and a limit of two pace-boosted stages at once.
const {JSDOM, VirtualConsole}=require('jsdom');const fs=require('fs');
const errs=[]; const vc=new VirtualConsole(); vc.on('error',e=>errs.push(String(e&&e.stack||e))); vc.on('jsdomError',e=>errs.push('jsdom:'+e.message));
// expose an eval hook inside the game's closure (the same injection point sim/build.py uses)
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
(async()=>{
 const dom=mk(); await sleep(300); const w=dom.window, d=w.document, E=s=>w.__eval(s);

 // 1. Charter Shares: +8 per push inland, shown in the close-camp breakdown
 E(`S.run.deliv=180000; S.era=0;`); ok(E('legacyNow()')===3,'no era bonus at the cove: '+E('legacyNow()'));
 E(`S.era=2;`); ok(E('legacyNow()')===3+16,'two pushes inland add 16 shares: '+E('legacyNow()'));
 E(`render(true)`); ok(/\+ 16 for 2 pushes inland/.test(d.getElementById('closeBox').textContent),'close box explains the era bonus');
 E(`S.era=0;`);

 // 2. Repeat bounties pay 25% and stop at 20% of the next push inland ($3,000 at the cove)
 E(`S.ach.push('d10k','d50k'); S.run.bounty=[]; S.run.base={deliv:0,earned:0,felled:0}; S.run.bountyPaid=0; S.stats.deliv=6e4; S.cash=0;`);
 ok(E('checkBounties()')===2 && E('S.cash')===Math.round(150*.25)+Math.round(500*.25),'bounties pay 25% of the original reward: '+E('S.cash'));
 E(`S.ach.push('d250k','d1m','d3m'); S.stats.deliv=4e6; S.cash=0;`);
 const paid=E('checkBounties()'), cash=E('S.cash');
 ok(paid===3,'three more bounties met: '+paid);
 ok(E('S.run.bountyPaid')===3000 && cash===3000-163,'bounty cash stops at $3,000 an outpost at the cove: '+cash);
 ok(E('checkBounties()')===0 && E('S.cash')===cash,'each bounty pays once per outpost');

 // 3. Crews' route: Swamping crew unlocks from 6 filled charter orders with no mini-game runs
 ok(!E(`has('swamper')`),'swamping crew locked at start');
 ok(/or fill 6 charter orders/i.test(E(`reqText(UPG.find(u=>u.id==='swamper'))`)),'requirement text names both routes');
 E(`S.stats.contracts=6; checkUnlocks(true);`);
 ok(E(`has('swamper')`),'swamping crew unlocked by the crews\' route');
 ok(!E(`has('gunstick')`),'mini-game-only gear has no crews\' route');
 ok(/or finish 20 tracts/i.test(E(`reqText(UPG.find(u=>u.id==='wedges'))`)),'felling wedges idle route is 20 tracts');
 E(`S.stats.tracts=19; checkUnlocks(true);`); ok(!E(`has('wedges')`),'wedges still locked at 19 tracts');
 E(`S.stats.tracts=20; checkUnlocks(true);`); ok(E(`has('wedges')`),'wedges unlock at 20 tracts');
 E(`S.ach.length=0; for(let i=0;i<36;i++) S.ach.push('x'+i); checkUnlocks(true);`); ok(E(`has('grade')`),'grade unlocks from 36 achievements');
 E(`S.ach.length=0; S.ach.push('d10k','d50k','d250k','d1m','d3m');`);
 ok(E(`S.stats.run_fell`)===0,'no mini-game runs were needed');

 // 4. Pace boosts: at most two stages at once, at most 120 s banked
 E(`S.boost={}; S.run.perks=[]; grantBoost('fell'); grantBoost('buck'); grantBoost('skid');`);
 const on=E(`['fell','buck','skid','haul'].filter(k=>(S.boost[k]||0)>S.t)`);
 ok(on.length===2 && on.includes('skid') && on.includes('buck'),'third boost replaces the oldest: '+on.join(','));
 E(`for(let i=0;i<10;i++) grantBoost('skid');`); ok(E(`S.boost.skid-S.t`)<=120,'boost bank capped at 120 s');
 E(`S.boost={}; S.run.perks=['golden']; grantBoost('fell');`);
 ok(E(`['fell','buck','skid','haul'].filter(k=>(S.boost[k]||0)>S.t).length`)===4,'Fog lifts still boosts every stage');

 // 5. old saves without the new fields still load
 E(`S.run.perks=[]; delete S.run.bountyPaid;`); w.dispatchEvent(new w.Event('pagehide'));
 const st=JSON.parse(w.localStorage.getItem('timberline-v2')); delete st.run.bountyPaid; dom.window.close();
 const dom2=mk({'timberline-v2':JSON.stringify(st)}); await sleep(300);
 ok(dom2.window.__eval('S.run.n')===1 && dom2.window.__eval(`has('swamper')`),'save reloads with the unlocked improvement');
 dom2.window.close();

 await sleep(100);
 ok(errs.length===0,'no console errors'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
 console.log(fails?`${fails} FAILED`:'ALL PASS'); process.exit(fails?1:0);
})();
