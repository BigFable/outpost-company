// Seasonal events, slice 1 (docs/design/seasonal-events.md): the dispatch card, the return summary, the Almanac,
// the four bad events' hazards and Clear the road, Weather almanac and Storm signals, Ill wind, Storm season
// (its bonus outside the 25% special-order cap), the Dry summer rework, and old saves loading.
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
(async()=>{
 const dom=mk(); await sleep(300); const w=dom.window, d=w.document, E=s=>w.__eval(s);
 const card=()=>d.getElementById('dispatch');
 // stop the live loop so the test drives time
 E('clearInterval(loop)');
 // set an event as the current weather (rich enough not to trip the payroll guard)
 const setEv=id=>E(`S.weather.cur={id:'${id}', t0:S.t-S.st, cleared:[], fired:false, guarded:false, when:'test'}; S.cash=1e7; S.owed=0;`);
 const turn=next=>E(`${next?`S.weather.next='${next}';`:''} S.st=SEASON_LEN-0.05; tick(0.1); render(true);`);

 // 1. a new company: the first roll is the gentle opener (Winter follows the opening Fall: Ice bridge)
 ok(E('S.weather.changes')>=1 && E('S.weather.next')==='ice_bridge','new company: next season’s card is rolled ahead, and the first card is the friendly one: '+E('S.weather.next'));
 turn(null);
 ok(E('season()')==='Winter' && E('S.weather.cur.id')==='ice_bridge','season change deals Ice bridge as the first card');
 ok(!card().hidden && /Ice bridge/.test(card().textContent),'dispatch card shows in the season box: '+card().textContent.slice(0,80));
 ok(/New in the almanac/.test(card().textContent) && E('dCur.sticky'),'first sighting: the card stays open until clicked');
 ok(/Ice bridge: .*haul ×1.3/.test(d.getElementById('tSeasonSub').textContent) && /left/.test(d.getElementById('tSeasonSub').textContent),'season sub-line reads the event and its time left: '+d.getElementById('tSeasonSub').textContent);
 ok(d.querySelector('.modal:not([hidden])')===null,'the card is not a modal');
 ok(d.querySelectorAll('#sales [data-fit]').length===E('S.forSale.length') && E('S.forSale.length')>0,'the land-office species cards render alongside the weather card');
 E(`S.weather.burnt=true; render(true)`); ok([...d.querySelectorAll('#sales button[data-i]')].every((b,i)=>b.textContent===E(`money(tractCost(S.forSale[${i}]))`)),'listing cards show the weather-adjusted price'); E(`S.weather.burnt=false; render(true)`);
 E('S.t+=60; render(true)'); ok(!card().hidden,'a first-sighting card does not fold away by itself');
 d.getElementById('dOk').click(); ok(card().hidden,'clicking the card folds it away');
 // a seen-before card folds after 8 s
 E(`S.season=3; S.weather.seen.hard_frost={first:'x', n:1};`); turn('hard_frost'); E('S.season=3'); // (stays winter for the test)
 E('S.weather.cur.id="hard_frost"; dispQ.length=0; dCur=null; dispQ.push({kind:"event", id:"hard_frost", first:false}); render(true)');
 ok(!card().hidden && /Hard frost/.test(card().textContent),'a seen card shows');
 E('S.t+=9; render(true)'); ok(card().hidden,'and folds away after 8 s');
 // the card queues while a mini-game is open
 E(`S.stems={bf:5000,val:1000}; openMG('buck'); cancelAnimationFrame(MG.raf); dispQ.push({kind:'event', id:'hard_frost', first:false}); render(true);`);
 ok(card().hidden && E('dispQ.length')===1,'with a mini-game open the card waits');
 E('closeMG()'); ok(!card().hidden,'and shows when the game closes');
 E('dispQ.length=0; dCur=null; render(true)');

 // 2. clamp: spring mud 0.5 × thaw flood 0.8 = 0.4; no event leaves the season factor untouched
 E(`S.season=0; S.upg=[]; S.run.perks=[]; S.weather.cur=null;`); const quiet=E(`seasonF('skid')`);
 setEv('thaw_flood'); ok(Math.abs(E(`seasonF('skid')`)-0.4)<1e-9 && quiet===0.5,'flood in spring mud: skid 0.5 → 0.4 (clamp floor), quiet '+quiet);

 // 3. hazards inside the mini-games, and Clear the road
 // Thaw flood: +3 mud patches in the skid game, haul road limit −1
 E(`S.cut={bf:1e5,val:2e4}; openMG('skid'); cancelAnimationFrame(MG.raf);`);
 ok(E('K.mud.filter(m=>m.flood).length')===3 && E('K.mud.length')===8,'Thaw flood: the skid game has 3 more mud patches (5 spring + 3)');
 ok(/Thaw flood: 3 more mud patches/.test(d.getElementById('mgStatus').textContent) && /Skid a clean turn/.test(d.getElementById('mgStatus').textContent),'skid status line opens with the event and its counter');
 ok(/Weather: Thaw flood/.test(d.getElementById('mgHelp').textContent),'the game help names the weather');
 E('closeMG()');
 E(`S.landing={bf:1e5,val:2e4}; openMG('haul'); cancelAnimationFrame(MG.raf);`); const limFlood=E('H.limit'); E('closeMG(); S.weather.cur=null'); E(`openMG('haul'); cancelAnimationFrame(MG.raf);`); const lim0=E('H.limit'); E('closeMG()');
 ok(limFlood===lim0-1,`Thaw flood: spring road limit −1 (${limFlood} vs ${lim0})`);
 // Clear the road: a good skid run halves the flood's skid penalty
 setEv('thaw_flood'); const before=E(`seasonF('skid')`);
 E(`S.cut={bf:1e5,val:2e4}; openMG('skid'); cancelAnimationFrame(MG.raf); K.logs=2; K.phase='run'; K.par=99; K.t=10; K.hits=0; skidFinish();`);
 ok(E(`S.weather.cur.cleared.includes('skid')`),'a clean skid turn clears the trails');
 ok(/Clear the road/.test(d.getElementById('mgStatus').textContent),'the run’s result says so: '+d.getElementById('mgStatus').textContent.slice(-110));
 const fF=E(`Core.eventStageFactor(Core.eventDef('thaw_flood'),'skid',0,evOpts('skid'))`);
 ok(Math.abs(fF-0.9)<1e-9 && E(`seasonF('skid')`)>before,`flood skid penalty halved: ×${fF} (season factor ${before} → ${E(`seasonF('skid')`)})`);
 E('closeMG()');
 E(`S.weather.cur.cleared=[]; runDone('skid', .4);`); ok(!E(`S.weather.cur.cleared.includes('skid')`),'a poor run (under mid tier) does not clear it');

 // Equinox gale: felling-game wind ×1.5 shown on the gauge; hauling ×0.85 for idle crews
 E(`S.season=2; S.weather.cur=null;`); const hq=E(`seasonF('haul')`); setEv('equinox_gale');
 ok(Math.abs(E(`seasonF('haul')`)-0.85*hq)<1e-9 && Math.abs(E(`seasonF('fell')`)-1.1)<1e-9,'gale: idle hauling ×0.85, felling ×1.1');
 E(`openMG('fell'); cancelAnimationFrame(MG.raf);`);
 ok(E('F.wind.mult')===1.5 && /Equinox gale: wind ×1.5/.test(d.getElementById('mgStatus').textContent),'gale: felling wind ×1.5, named in the status line');
 E('closeMG()');
 E(`S.landing={bf:1e5,val:2e4}; openMG('haul'); cancelAnimationFrame(MG.raf);`);
 ok(/Drive a clean load to clear the road/.test(d.getElementById('mgStatus').textContent),'gale: the haul game names its counter');
 E('closeMG(); runDone("haul", 1)'); ok(E(`S.weather.cur.cleared.includes('haul')`) && Math.abs(E(`seasonF('haul')`)-0.925*hq)<1e-9,'a clean haul clears half the gale’s hauling penalty');

 // Blizzard: first half every stage ×0.6, snow hides 40% of the road, dashed edges; second half packed road ×1.2
 E(`S.season=3; S.weather.cur=null; S.upg=[];`); const bq=E(`seasonF('buck')`); setEv('blizzard'); E('S.st=10');
 ok(Math.abs(E(`seasonF('buck')`)-0.6*bq)<1e-9,'blizzard first half: bucking ×0.6');
 E(`S.landing={bf:1e5,val:2e4}; openMG('haul'); cancelAnimationFrame(MG.raf);`);
 ok(E('H.snow')===0.6 && E('H.dashed')===true && /you see 60% ahead/.test(d.getElementById('mgStatus').textContent),'blizzard: the haul game shows 60% of the road ahead with dashed edges');
 E('haulDraw(); closeMG()');
 E(`S.upg=['icerd']`); ok(Math.abs(E(`Core.eventStageFactor(Core.eventDef('blizzard'),'haul',10,evOpts('haul'))`)-1)<1e-9,'the Road sprinkler sled keeps hauling going in a blizzard');
 E(`S.upg=[]; S.st=100;`); ok(Math.abs(E(`Core.eventStageFactor(Core.eventDef('blizzard'),'haul',S.st,evOpts('haul'))`)-1.2)<1e-9 && E(`seasonF('buck')`)===bq,'blizzard second half: packed road hauling ×1.2, the rest back to normal');
 E(`S.landing={bf:1e5,val:2e4}; openMG('haul'); cancelAnimationFrame(MG.raf);`); ok(E('H.snow')===0,'no snow view in the second half'); E('closeMG()');

 // Dry spell: a slash fire burns 15% of the stems when they pile up (once); a good bucking run clears the slash (half the burn)
 E(`S.season=1; S.stems={bf:1e6,val:2e5};`); setEv('dry_spell');
 E(`S.rng.events=1; for(let i=0;i<4000 && !S.weather.cur.fired;i++) weatherTick(0.5);`);
 ok(E('S.weather.cur.fired') && Math.abs(E('S.stems.bf')-850000)<1,'dry spell: a slash fire burns 15% of the stems once: '+E('S.stems.bf'));
 const b1=E('S.stems.bf'); E('for(let i=0;i<400;i++) weatherTick(0.5)'); ok(E('S.stems.bf')===b1,'only once per season');
 ok(E('S.weather.burnt') && /Burnt-over ground/.test(d.getElementById('saleMeta').textContent+E('(render(true), $("saleMeta").textContent)')),'silver lining: the land office notes burnt-over ground');
 const p0=E('S.forSale[0].price'); ok(E('tractCost(S.forSale[0])')===Math.round(p0*0.8),'the next lot costs 20% less');
 setEv('dry_spell'); E(`S.stems={bf:1e6,val:2e5}; runDone('buck', .9);`);
 ok(E(`S.weather.cur.cleared.includes('buck')`),'a good bucking run clears the slash');
 E(`for(let i=0;i<4000 && !S.weather.cur.fired;i++) weatherTick(0.5);`); ok(Math.abs(E('S.stems.bf')-925000)<1,'after clearing, a fire burns half as much (7.5%)');
 ok(E(`Core.MODS.find(m=>m.id==='drought').desc`).includes('Dry spell') && !/Math\.random\(\) < dt\*\.003/.test(src),'Dry summer rework: one fire rule (the clause triples Dry spell), the old random fire is gone');
 const dryW=E(`Core.eventWeights('Summer',{drySummer:true}).find(r=>r.def.id==='dry_spell').w`); ok(dryW===36,'Dry summer: Dry spell weight ×3');

 // 4. Ill wind: bad weather's crew penalties become bonuses; Clear the road no longer needed
 E(`S.season=2; S.weather.cur=null; S.run.perks=['illwind'];`); const hq2=E(`seasonF('haul')`); setEv('equinox_gale');
 ok(Math.abs(E(`seasonF('haul')`)-1.15*hq2)<1e-9,'Ill wind: the gale’s hauling ×0.85 becomes ×1.15');
 E(`S.landing={bf:1e5,val:2e4}; openMG('fell'); cancelAnimationFrame(MG.raf);`); ok(E('F.wind.mult')===1.5,'Ill wind keeps the mini-game hazard (gale wind)'); E('closeMG()');
 ok(E(`PMAP.illwind.r`)==='legendary' && E(`Core.draftPool([],false).some(p=>p.id==='illwind')`),'Ill wind is a legendary in the draft pool');
 E(`S.run.perks=[]`);

 // 5. Storm season: bad weights ×2, two bad in a row allowed, +2% per full bad event, outside the 25% special-order cap
 E(`S.run.perks=['stormseason']; S.run.stormN=0; S.season=2;`); setEv('equinox_gale'); turn('fog_water');
 ok(E('S.run.stormN')===1 && E('S.stats.storms')>=1,'a bad event that runs its full course counts for Storm season');
 E(`S.run.deliv=4e6; S.era=1; S.orders.bonusPct=0.9; S.run.stormN=40;`);
 const g=E(`Core.legacyGain(S.run.deliv, S.era, S.run.mods, !!meta('legacy'))`), L=E('legacyNow()');
 ok(L===Math.floor(g*1.25*1.3),`Storm season +30% stacks on top of the capped +25% order bonus: ${L} = floor(${g.toFixed(2)} × 1.25 × 1.30)`);
 E('S.run.stormN=5'); ok(E('legacyNow()')===Math.floor(g*1.25*1.1),'+2% per storm: 5 storms = +10%');
 E('render(true)'); ok(/storm season/.test(d.getElementById('closeBox').textContent),'the close-camp box names the storm season multiplier');
 // two bad in a row are allowed with the curse, never without
 const streakTest=perks=>E(`(() => { S.run.perks=${JSON.stringify(perks)}; const W=S.weather, keep={...W}; W.changes=100; W.streak=0; let pairs=0, bad=0; S.rng.events=7;
   for(let i=0;i<3000;i++){ const was=W.streak; const id=rollWeather(SEASONS[i%4]); if(Core.eventDef(id).tone==='bad'){ bad++; if(was) pairs++; } }
   Object.assign(W, keep); return {pairs, bad}; })()`);
 const plain=streakTest([]), storm=streakTest(['stormseason']);
 ok(plain.pairs===0 && storm.pairs>0 && storm.bad>plain.bad*1.5,`Storm season: bad weather more often (${storm.bad} vs ${plain.bad} of 3000) and sometimes twice in a row (${storm.pairs})`);
 E(`S.run.perks=[]; S.run.stormN=0; S.orders.bonusPct=0;`);

 // 6. Board upgrades: Weather almanac shows next season’s card; Storm signals make bad weather rarer
 E(`S.meta.legacy=100; buyMeta('almanac'); S.weather.next='blizzard'; render(true);`);
 ok(!d.getElementById('tSeasonNext').hidden && /Next: Blizzard/.test(d.getElementById('tSeasonNext').textContent),'Weather almanac: the season tile shows next season’s card');
 const sig=E(`(() => { const r=[]; for(const on of [false,true]){ if(on) buyMeta('signals'); const W=S.weather, keep={...W}; W.changes=100; S.rng.events=11; let bad=0;
   for(let i=0;i<3000;i++){ W.streak=0; if(Core.eventDef(rollWeather(SEASONS[i%4])).tone==='bad') bad++; } Object.assign(W, keep); r.push(bad); } return r; })()`);
 ok(sig[1]<sig[0]*0.8 && sig[1]>sig[0]*0.6,`Storm signals: bad weather about 30% rarer (${sig[1]} vs ${sig[0]} of 3000)`);

 // 7. the Almanac page in the warehouse
 E(`openWh('almanac')`); const ab=d.getElementById('whBody').textContent;
 ok(/cards seen/.test(ab) && /Ice bridge/.test(ab) && /\?\?\?/.test(ab) && /Next season: Blizzard/.test(ab),'Almanac page lists seen cards, hides unseen ones, and shows the almanac’s next card');
 ok(E(`[...$('whTabs').querySelectorAll('button')].some(b=>b.dataset.t==='almanac')`),'Almanac tab in the warehouse');
 E('closeWh()');

 // 8. weather survives close camp (company-wide); a Supply ship cheapens crews and land
 setEv('supply_ship'); const eq=E(`EQ.find(e=>e.id==='axeman')`); ok(E(`eqCost(EQ.find(e=>e.id==='axeman'))`)===Math.ceil(eq.cost*0.85*Math.pow(1.15,E('own("axeman")'))),'Supply ship: crews 15% cheaper');
 E(`S.run.deliv=1e6; S.era=1; S.run.setup=false; S.weather.burnt=false;`); const seen0=E('Object.keys(S.weather.seen).length'); E('closeCamp()');
 ok(E('S.weather.cur && S.weather.cur.id')==='supply_ship' && E('Object.keys(S.weather.seen).length')===seen0,'closing camp keeps the weather and the almanac');

 // 9. the return summary after time away, with first sightings after it
 const save=JSON.parse(E('JSON.stringify(S)')); save.last=Date.now()-2*3600*1000; save.weather.seen={}; save.weather.cur=null; save.weather.next=null; save.weather.changes=50;
 const dom2=mk({'timberline-v2':JSON.stringify(save)}); await sleep(400); const w2=dom2.window, d2=w2.document, E2=s=>w2.__eval(s); E2('clearInterval(loop)');
 const c2=d2.getElementById('dispatch');
 ok(!c2.hidden && /while you were away/.test(c2.textContent) && /Weather this time away/.test(c2.textContent),'return summary card after time away: '+c2.textContent.slice(0,160));
 ok(c2.querySelectorAll('li').length>=1 && c2.querySelectorAll('li').length<=6,'summary lists up to 6 lines: '+c2.querySelectorAll('li').length);
 ok(E2('dispQ.filter(c=>c.first).length')>=1,'first sightings made offline open as cards after the summary');
 d2.getElementById('dOk').click(); ok(!c2.hidden && /New in the almanac/.test(c2.textContent),'then the first sighting card opens');
 ok(E2('S.log.some(l=>/New in the weather almanac/.test(l.text))'),'activity log lines for the offline weather');

 // 10. old saves load: a save without weather gets defaults, no gentle start for a veteran company
 const old=JSON.parse(E('JSON.stringify(S)')); delete old.weather; delete old.rng.events; delete old.run.stormN; delete old.stats.storms; old.stats.winters=5; old.last=Date.now();
 const dom3=mk({'timberline-v2':JSON.stringify(old)}); await sleep(400); const E3=s=>dom3.window.__eval(s); E3('clearInterval(loop)');
 ok(E3('typeof S.weather')==='object' && E3('S.weather.cur')===null && E3('S.weather.changes')>=20,'old save: weather defaults, changes set from 5 winters (no gentle start): '+E3('S.weather.changes'));
 ok(typeof E3('S.rng.events')==='number' && E3('S.run.stormN')===0 && E3('S.stats.storms')===0,'old save: events stream seeded, new counters default to 0');
 E3('S.st=SEASON_LEN-0.05; tick(0.1); render(true)'); ok(!!E3('S.weather.cur') && !!E3('S.weather.next'),'old save: the first roll happens at the next season change');

 await sleep(100);
 ok(errs.length===0,'no console errors'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
 console.log(fails?`${fails} FAILED`:'ALL PASS'); process.exit(fails?1:0);
})();
