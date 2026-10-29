// Achievements rework (owner 2026-10-28, docs/design/achievements-rework.md): three tiers on the Almanac screen, locked
// ones that need closing camp say so, a long first outpost cannot finish the across-outposts tier, the new lifetime
// counters move with play and survive close camp, and old saves keep what they earned (and their cash).
const {JSDOM, VirtualConsole}=require('jsdom');const fs=require('fs');
const errs=[]; const vc=new VirtualConsole(); vc.on('error',e=>errs.push(String(e&&e.stack||e))); vc.on('jsdomError',e=>errs.push('jsdom:'+e.message));
const START="window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});";
const src=fs.readFileSync(__dirname+'/../prototype/timberline.html','utf8');
if(!src.includes(START)) throw new Error('start line not found');
const html=src.replace(START,'window.__eval = s => eval(s); '+START);
const mk=(store,seed)=>new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,url:'https://x.test/',beforeParse(w){
  if(store) for(const k in store) w.localStorage.setItem(k,store[k]);
  let x=seed||11; w.Math.random=()=>{ x=(x*9301+49297)%233280; return x/233280; };
  w.HTMLCanvasElement.prototype.getContext=function(){return new Proxy({},{get:(t,p)=>p==='measureText'?()=>({width:10}):p in t?t[p]:()=>{},set:(t,p,v)=>(t[p]=v,true)});};
  w.addEventListener('error',e=>errs.push('win:'+e.message));}});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let fails=0; const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m); if(!c) fails++;};
(async()=>{
 let dom=mk(); await sleep(300); let w=dom.window, d=w.document, E=s=>w.__eval(s);
 E('S.weather.off=true; S.weather.cur=null; render(true);');

 // ---------- 1. the list: three tiers on the Almanac screen, locked ones say "Close camp to unlock"
 ok(E('ACH.length')===63 && E('Core.ACH_TIERS.length')===3,'63 achievements in 3 tiers');
 d.getElementById('achAll').click(); await sleep(50);
 ok(E('S.ui.screen')==='almanac' && !d.getElementById('scrAlm').hidden,'All achievements opens the Almanac screen');
 const tiers=[...d.querySelectorAll('#achBody .achtier')];
 ok(tiers.map(t=>t.dataset.tier).join()==='first,across,long','grouped by tier: First outpost, Across outposts, Long haul');
 ok(/First outpost/.test(tiers[0].querySelector('h3').textContent) && /0 of 23/.test(tiers[0].querySelector('h3').textContent),'tier header counts: '+tiers[0].querySelector('h3').textContent);
 ok(!tiers[0].querySelector('.lockchip') && [...tiers[1].querySelectorAll('.goal')].every(g=>g.querySelector('.lockchip')) && [...tiers[2].querySelectorAll('.goal')].every(g=>/Close camp/.test(g.textContent)),'every across and long one shows a close-camp hint; first-outpost ones do not');
 ok(/Close camp to unlock/.test(d.querySelector('[data-ach="close1"]').textContent),'hint text: Close camp to unlock');
 ok(/Almanac/.test(d.getElementById('almBody').previousElementSibling.previousElementSibling.textContent) || /cards seen/.test(d.getElementById('almBody').textContent),'the weather cards are still on the Almanac screen');

 // ---------- 2. a first outpost played forever earns the whole first tier and nothing that needs closing camp
 E(`S.stats.deliv=2e9; S.earned=2e9; S.felled=2e6; S.stats.tracts=900; S.stats.contracts=900; S.stats.winters=90; S.era=3; S.stats.slots=4;
   ['perfFell','perfBuck','cleanSkid','cleanHaul','storms','run_fell','run_buck','run_skid','run_haul'].forEach(k=>S.stats[k]=500);
   S.stats.prime=900; S.stats.afkLots=20; S.stats.maxOrders=6; S.stats.perks=300; S.stats.curses=40; S.stats.dieselRuns=1;
   ['pine','spruce','hemlock','maple','oak','cloudwood'].forEach(k=>S.stats.sp[k]=1);
   Core.SEASON_EVENTS.forEach(e=>S.weather.seen[e.id]={n:1,first:'x'}); S.orders.filled={admiralty_spar:20};
   S.own.axeman=200; S.own.bucker=5; S.own.oxen=5; S.own.sled=5; S.cash=0; checkAch(true);`);
 const got=E('S.ach.slice()'), tierOf=id=>E(`Core.achievementDef(${JSON.stringify(id)}).tier`);
 ok(got.length===23 && got.every(id=>tierOf(id)==='first'),'never closing camp: only the 23 first-outpost achievements ('+got.length+')');
 ok(got.length/E('ACH.length')<=0.4,'at most 40% without closing camp');

 // ---------- 3. close camp: Loaded the ship, the first outpost's time, counters kept
 E(`S.run.deliv=3e5; S.era=0;`);
 const before={perks:E('S.stats.perks'), sp:E('Object.keys(S.stats.sp).length')};
 E('closeCamp(); startRun([]); checkAch(true); render(true);');
 ok(E(`S.ach.includes('close1')`) && E('S.stats.firstMin')>=0,'first close camp earns Loaded the ship and records the first outpost time');
 ok(E('S.stats.perks')===before.perks && E('Object.keys(S.stats.sp).length')===before.sp,'lifetime counters survive close camp');
 ok(E(`S.ach.includes('t30k') && S.ach.includes('d10m') && S.ach.includes('alltrees') && S.ach.includes('wxall')`),'gated ones a long first outpost already earned unlock after the close');
 ok(E('S.achHeld')>0 && E('S.cash')<=E('achCap()')+750,'at the cove the board holds the big rewards: paid '+E('S.cash')+', held '+E('S.achHeld'));
 { const held=E('S.achHeld'), c0=E('S.cash'); E('S.era=1; tick(0.1);');
   ok(E('S.achHeld')<held && E('S.cash')-c0>=Math.min(held, E('achCap()'))-1,'reaching Steam Camp pays what the board held'); E('S.cash=0;'); }
 ok(!E(`S.ach.includes('close3')`) && /Close camp 2 more times/.test(d.querySelector('[data-ach="close3"]').textContent),'close3 now says 2 more times');

 // ---------- 4. counters move with play
 E(`S.stats.perks=0; S.run.dq=[.5]; S.run.offer=null; const off=currentOffer(); pickPerk(off[0]);`);
 ok(E('S.stats.perks')===1,'picking a perk counts');
 E(`S.stats.prime=0; addItem('logging.prime_spar', 3, true);`);
 ok(E('S.stats.prime')===3,'Prime logs made count');
 E(`S.run.n=2; S.run.era=0; S.era=1; S.run.t0=S.t-600; S.stats.steamLater=undefined; delete S.stats.steamLater; tick(0.1);`);
 ok(Math.abs(E('S.stats.steamLater')-10)<0.2,'Steam Camp 10 min after landing on a later outpost: steamLater '+E('S.stats.steamLater'));

 // ---------- 5. an old save from before the rework: kept ids stay, renamed map, removed drop, cash untouched; counters seeded
 w.dispatchEvent(new w.Event('pagehide'));
 const cur=JSON.parse(w.localStorage.getItem('timberline-v2'));
 dom.window.close();
 const old=JSON.parse(JSON.stringify(cur));
 old.ach=['first_tree','d10k','d1m','crew50','w5','d1b','pf1','era1']; old.cash=12345; old.rep=7;
 ['afkLots','prime','maxOrders','sp','perks','curses','sawTop','toMill','beatFirst','dieselRuns','steamLater','firstMin'].forEach(k=>delete old.stats[k]);
 old.run.n=3; old.runs=[{n:2,min:40,deliv:1,earned:1,legacy:5,era:2,mods:[],perks:9,eraT:[null,12,40]},{n:1,min:60,deliv:1,earned:1,legacy:9,era:2,mods:[],perks:11,eraT:[null,25,60]}];
 old.log=[]; old.last=Date.now();
 dom=mk({'timberline-v2':JSON.stringify(old)}); await sleep(300); w=dom.window; E=s=>w.__eval(s);
 ok(errs.length===0,'old save loads without errors '+errs.slice(0,2).join(' '));
 const ach=E('S.ach.slice()');
 ok(['first_tree','d1m','crew30','w1','era1'].every(id=>ach.includes(id)) && !['d10k','d1b','pf1','crew50','w5'].some(id=>ach.includes(id)),'old ids: kept, mapped (crew50→crew30, w5→w1) or dropped: '+ach.join());
 ok(E('S.cash')>=12345 && E('S.rep')>=7,'earned cash and reputation are never taken away');
 ok(E('S.stats.firstMin')===60 && E('S.stats.beatFirst')===1 && E('S.stats.dieselRuns')>=2 && E('S.stats.steamLater')===12 && E('S.stats.perks')>=20,'old save counters seeded from the past outposts');
 ok(E(`S.ach.includes('beatfirst') && S.ach.includes('quicksteam') && S.ach.includes('close1')`),'and earn what those outposts already did');

 ok(errs.length===0,'no console errors '+errs.slice(0,3).join(' | '));
 console.log(fails?fails+' FAILED':'ALL PASS'); process.exit(fails?1:0);
})();
