// The company advance (2026-10-28, no-soft-lock pillar): an idle camp with an axeman, a bucker and a sled but no skid crew,
// a lot bought and $0 piles logs it cannot move and sells nothing. After 2 min with no sale the company advances an ox team,
// sales start again, half of each sale repays the advance, close camp forgives what is left, and old saves load.
const {mk,ok,fails}=require('./repro/_h');
(async()=>{
 // ---------- 1. the stall, reproduced, and the rescue
 {
  const g=await mk(null,{wait:300}); const {E,d}=g;
  E(`S.weather.off=true; S.weather.cur=null; S.weather.next=null;
     S.own={axeman:2, bucker:1, sled:1}; S.cash=0; S.owed=0; S.lastSale=S.t;
     S.cut={bf:14000, val:2800}; S.stems={bf:0,val:0}; S.landing={bf:0,val:0}; render(true);`);
  ok(E('Core.crewRate("skid", S.own)')===0 && E('S.cash')===0,'setup: no skid crew, $0 cash, 14k bd ft of logs waiting');
  E('for(let i=0;i<110;i++) tick(1); render(true);');
  ok(E('own("oxen")')===0 && E('S.adv')===0,'no advance before 2 minutes without a sale');
  const ban=d.getElementById('stall');
  ok(!ban.hidden && /Logs are stuck: no ox team and no cash\. The company advances one in \d+ s, or work it by hand\./.test(ban.textContent),'the banner warns in plain words: '+ban.textContent);
  ok(E('stallNow()')===null && E('stallSoon().crews[0].id')==='oxen','the detector waits for the stall time; the early warning names the ox team');
  E('for(let i=0;i<15;i++) tick(1); render(true);');
  ok(E('own("oxen")')===1,'after 2 minutes with no sale the company advances an ox team');
  ok(E('S.adv')===90 && E('S.stats.advances')===1,'the advance is owed: $'+E('S.adv'));
  ok(E('S.log.some(l=>/The company advanced a crew: ox team \\(\\$90\\)\\. Half of each log sale repays it\\./.test(l.text))'),'the activity log says what happened');
  ok(ban.hidden && !d.getElementById('advOwed').hidden && /Company advance owed: \$\d+/.test(d.getElementById('advOwed').textContent),'the stuck banner gives way to the owed line');
  // sales resume and repay half of each sale
  const earned0=E('S.earned');
  E('for(let i=0;i<60;i++) tick(1); render(true);');
  const got=E('S.earned')-earned0;
  ok(got>0 && E('S.t-S.lastSale')<5,'logs reach the landing and sell again: $'+got.toFixed(0)+' in a minute');
  ok(E('S.adv')<90,'half of each sale repays the advance: $'+E('S.adv').toFixed(1)+' still owed');
  ok(90-E('S.adv')<=got*.5+1e-6,'the repayment is at most half of what sold (wages owed from the stall come first)');
  ok(E('stallNow()')===null,'no second advance while logs sell');
  ok(!g.errs.length,'no console errors: '+g.errs.slice(0,2).join(' | ').slice(0,300));
  g.dom.window.close();
 }
 // ---------- 2. no advance in the opening (no crews yet), with cash for the crew, or with nothing to sell
 {
  const g=await mk(null,{wait:300}); const {E}=g;
  E('S.weather.off=true; S.weather.cur=null; S.weather.next=null; S.own={}; S.cash=0; S.lastSale=S.t;');
  E('for(let i=0;i<200;i++) tick(1);');
  ok(E('Object.keys(S.own).length')===0 && E('S.adv')===0,'a new outpost with no crews is worked by hand: no advance');
  E('S.own={axeman:1,bucker:1,sled:1}; S.cut={bf:5000,val:1000}; S.cash=500; S.lastSale=S.t; for(let i=0;i<130;i++) tick(1);');
  ok(E('own("oxen")')===0,'with cash for the ox team the company does not step in');
  E('S.cash=0; S.tracts=[]; S.cut={bf:0,val:0}; S.stems={bf:0,val:0}; S.lastSale=S.t; for(let i=0;i<130;i++) tick(1);');
  ok(E('own("oxen")')===0 && E('S.adv')===0,'out of timber is the hire job rescue, not an advance');
  g.dom.window.close();
 }
 // ---------- 3. close camp forgives the advance; the stall clock restarts at the new outpost
 {
  const g=await mk(null,{wait:300}); const {E}=g;
  E('S.adv=55; S.lastSale=0; S.t=5000; S.run.t0=0;');
  E('S.era=2; S.run.era=2;'); // close camp needs the gas era
  const can=E('canClose()');
  if(can){ E('closeCamp(); startRun([]);');
    ok(E('S.adv')===0,'close camp forgives what is still owed');
    ok(E('S.lastSale')===E('S.t'),'the stall clock starts at the new outpost'); }
  else ok(false,'close camp available in this setup');
  g.dom.window.close();
 }
 // ---------- 4. an old save (no adv, no lastSale) loads owing nothing, with the clock at its time
 {
  const save=JSON.stringify({v:2,cash:10,t:900,own:{axeman:1}});
  const g=await mk({'timberline-v2':save},{wait:300}); const {E}=g;
  ok(E('S.adv')===0 && E('S.lastSale')<=E('S.t') && E('S.lastSale')>=900,'an old save loads with no advance and the stall clock at its time: '+E('S.lastSale'));
  ok(E('S.stats.advances')===0,'the advance count starts at 0');
  ok(!g.errs.length,'no console errors on an old save');
  g.dom.window.close();
 }
 if(fails()){ console.log(fails()+' FAILED'); process.exit(1); } console.log('smoke_stall: all passed');
})();
