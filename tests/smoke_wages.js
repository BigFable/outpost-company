// Rising wages + the wage cap (owner decision 2026-10-28): each extra crew of one type is paid 10% of its base wage more
// than the last; the rise stops at 60% of a slow income average, and base wages are always paid. The hire row shows the
// wage of the next crew, a short note under the buy toggle says when the cap is on, the wage multipliers still apply,
// and old saves load.
const {mk,ok,fails}=require('./repro/_h');
const near=(a,b,e=1e-6)=>Math.abs(a-b)<e;
(async()=>{
 {
  const g=await mk(null,{wait:300}); const {E,d}=g;
  const setup=(own,inc)=>E(`S.weather.off=true; S.weather.cur=null; S.weather.next=null; S.util={}; S.own=${JSON.stringify(own)}; S.payEma=${inc}/60; S.ui.buyN=1; render(true);`);
  ok(E('Core.WAGE_STEP')===0.1 && E('Core.WAGE_CAP_SHARE')===0.6 && E('WAGE.step')===0.1 && E('WAGE.cap')===0.6,'step 10%, cap 60%');
  // ---------- 1. rising wages per type
  setup({axeman:3, bucker:1}, 1e6);
  ok(near(E('upkeep()'), 3*(1+1.1+1.2) + 3),'3 axemen are paid 3 + 3.3 + 3.6, the bucker 3: $'+E('upkeep()').toFixed(2)+'/min');
  ok(near(E('fullUpkeep()'), E('upkeep()')),'with every crew busy, full wages match');
  const row=id=>d.querySelector('#eq .row:has(.buy)') && [...d.querySelectorAll('#eq .row')].find(r=>r.querySelector('b').textContent===E(`EQ.find(e=>e.id==='${id}').name`));
  const wageTxt=id=>row(id).querySelector('.wage').textContent;
  ok(wageTxt('axeman')==='next one $3.9/min wages','the hire row shows the next axeman\'s wage: '+wageTxt('axeman'));
  ok(wageTxt('crosscut')==='$10/min wages','a type you have none of shows its base wage: '+wageTxt('crosscut'));
  ok(/\+\$3\.9\/min wages/.test(row('axeman').querySelector('.buy').getAttribute('aria-label')),'the buy button\'s label names the added wage');
  E('S.ui.buyN=10; render(true);');
  ok(wageTxt('axeman')==='10 more: +$53/min wages','×10 shows what the next ten add: '+wageTxt('axeman'));
  E('S.ui.buyN=1; render(true);');
  // ---------- 2. multipliers still apply to rising wages (bunkhouse level 1: ×0.95)
  const u0=E('upkeep()'); E('S.structures["logging.bunkhouse"]=1; render(true);');
  ok(near(E('upkeep()')/u0, .95),'the bunkhouse still makes wages ×0.95');
  ok(wageTxt('axeman')===`next one $${E('fmt(3.9*.95)')}/min wages`,'the next-crew wage includes the bunkhouse: '+wageTxt('axeman'));
  E('S.structures={}; render(true);');
  // Fish run (wages ×0.75) still applies on top
  E(`S.weather.off=false; S.weather.cur={id:'fish_run', t0:S.t, cleared:[], fired:false, guarded:false, when:''};`);
  ok(near(E('upkeep()'), u0*.75),'a Fish run still cuts wages to ×0.75');
  E('S.weather.off=true; S.weather.cur=null;');
  const note=()=>d.getElementById('wageNote').textContent;
  ok(note()==='Each extra crew of one type is paid 10% more.','the note explains rising wages: '+note());
  // ---------- 3. the cap: 20 axemen want 3 × (20 + 19) = $117/min; base pay is $60/min
  setup({axeman:20}, 150);
  ok(near(E('upkeep()'), 90) && E('wageBill().capped'),'with $150/min income the rise stops at 60%: $'+E('upkeep()').toFixed(2));
  ok(note()==='Each extra crew of one type is paid 10% more. Wages capped at 60% of income.','the note says the cap is on: '+note());
  setup({axeman:20}, 1000);
  ok(near(E('upkeep()'), 117) && !E('wageBill().capped'),'with high income the full rising wage is paid');
  // ---------- 4. no income: base wages, exactly as before rising wages; the payroll guard and wages owed work as before
  setup({axeman:20}, 0);
  ok(near(E('upkeep()'), 60),'with no income only base pay is charged: $'+E('upkeep()'));
  ok(note()==='Each extra crew of one type is paid 10% more. Income is low, so only base wages are paid.','the note says base pay: '+note());
  E('S.cash=0; S.owed=0;');
  ok(E('payGuard()')===true,'the payroll guard is on with no cash');
  E('S.cut={bf:0,val:0}; S.stems={bf:0,val:0}; S.landing={bf:0,val:0}; S.tracts=[]; tick(1);');
  ok(E('S.owed')>0 && E('S.short')===true,'with no cash the wages are owed and crews go to half speed, as before');
  ok(E('S.owed') < E('fullUpkeep()')*5 + 1,'wages owed stay under 5 minutes of wages');
  // ---------- 5. close camp resets the slow income average with the rest of the outpost
  ok(E('fresh().payEma')===undefined && E('(()=>{ const s=S.payEma; delete S.payEma; const w=wageBill(1,true).wages; S.payEma=s; return w; })()')===60,'a new outpost (close camp) starts with no income average: base pay');
  ok(!g.errs.length,'no console errors: '+g.errs.join(' | '));
  g.dom.window.close();
 }
 // ---------- 6. an old save (no payEma) loads; the average starts at the camp's income now
 {
  const save=JSON.stringify({v:2,cash:10,t:900,ema:5,own:{axeman:4}});
  const g=await mk({'timberline-v2':save},{wait:300}); const {E}=g;
  ok(near(E('S.payEma'),5,0.1),'an old save starts the wage cap average at its income: '+E('S.payEma'));
  ok(E('upkeep()')>0 && isFinite(E('upkeep()')),'wages are a number after loading an old save');
  ok(!g.errs.length,'no console errors on an old save');
  g.dom.window.close();
 }
 if(fails()){ console.log(fails()+' FAILED'); process.exit(1); } console.log('smoke_wages: all passed');
})();
