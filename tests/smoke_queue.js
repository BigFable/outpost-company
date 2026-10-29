// The cutting queue (owner feedback 2026-10-25): order-fit notes and "Best for" badges on land-office listings, the
// actionable camp note with its details fold, switching the lot crews are on (progress kept), reordering (arrows, Cut next,
// Cut now, pointer drag for mouse and touch), the auto-order modes, crews moving on when a lot is cut out, old-save queue
// conversion, the bigger charter board (first slot always a regular order) and the AFK lot (Cutover slash country).
const {JSDOM, VirtualConsole}=require('jsdom');const fs=require('fs');
const errs=[]; const vc=new VirtualConsole(); vc.on('error',e=>errs.push(String(e&&e.stack||e))); vc.on('jsdomError',e=>errs.push('jsdom:'+e.message));
const START="window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});";
const src=fs.readFileSync(__dirname+'/../prototype/timberline.html','utf8');
if(!src.includes(START)) throw new Error('start line not found');
const html=src.replace(START,'window.__eval = s => eval(s); '+START);
const mk=(store,seed)=>new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,url:'https://x.test/',beforeParse(w){
  if(store) for(const k in store) w.localStorage.setItem(k,store[k]);
  let x=seed||7; w.Math.random=()=>{ x=(x*9301+49297)%233280; return x/233280; };
  w.HTMLCanvasElement.prototype.getContext=function(){return new Proxy({},{get:(t,p)=>p==='measureText'?()=>({width:10}):p in t?t[p]:()=>{},set:(t,p,v)=>(t[p]=v,true)});};
  w.addEventListener('error',e=>errs.push('win:'+e.message));}});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let fails=0; const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m); if(!c) fails++;};
(async()=>{
 let dom=mk(); await sleep(300); let w=dom.window, d=w.document, E=s=>w.__eval(s);
 const $=id=>d.getElementById(id);
 E(`S.season=2; S.weather.cur=null; S.cash=1e6; S.own={axeman:2, bucker:20, oxen:4, sled:6}; S.upg=[]; S.run.perks=[];`);

 // ---------- 1. order fit on listings: a signed spruce order and the Admiralty's Prime spars
 E(`S.tracts=[Object.assign(Core.makeTract('Home lot',[['pine',100]],30,1,'flat'),{seq:0})]; S.tractSeq=1; setSite(); newTree();
   S.forSale=[Core.makeTract('Pine flats, Lot 3',[['pine',90],['hemlock',10]],60,2,'flat','coast'), Core.makeTract('Spruce head, Lot 7',[['spruce',85],['pine',15]],60,2,'flat','headland'), Core.makeTract('Hemlock bog, Lot 9',[['hemlock',80],['spruce',20]],60,1,'flat','swamp')];
   S.forSale.forEach(t=>t.price=100);
   S.contracts=[{mill:'the Admiralty spar yard', sp:'spruce', vol:3000, done:0, dur:400, end:S.t+400, prem:.4, penalty:0}];
   S.orders.open=[{id:'admiralty_spar', posted:S.run.n, due:S.run.n+1, given:{}}]; S.bank={}; S.stats.perfFell=20; S.felled=100; render(true);`);
 // the land office listing no longer shows order fit (owner 2026-10-28: only what changes the choice); the helpers still run
 // for the charter board's "Best lot" line, so they are checked here through the page's own functions
 const cards=[...d.querySelectorAll('#sales .row.lot')];
 ok(cards.length===3 && !d.querySelector('#sales [data-best], #sales .ofit, #sales .fit, #sales details'),'listings carry no badges, order-fit lines or camp notes');
 const fitsNow=()=>E(`(()=>{ const o=fitOrders(); const f=S.forSale.map(t=>lotFits(t, aheadView(t), o)); return {f, best:Core.bestFor(f, S.forSale)}; })()`);
 let F=fitsNow();
 ok(F.best.contract===1 && F.best.admiralty_spar===1,'the spruce headland is still the best lot for the spruce order and the Admiralty spars');
 const sprFit=F.f[1].map(x=>x.text).join(' | ');
 ok(/spruce order in time/.test(sprFit) && /≈ \d+(\.\d)? (of the 16 )?Prime logs/.test(sprFit),'order fit names the spruce order and estimates Prime logs: '+sprFit);
 ok(!F.f[0].some(x=>x.orderId==='contract'),'a lot with no spruce makes no claim on the spruce order');
 E(`S.bank={'logging.prime_spar':16, 'logging.amber_pitch':2}; S.orders.autoFill=false; render(true);`);
 ok(fitsNow().best.admiralty_spar===undefined,'Prime already in the warehouse covers the order');
 E(`S.bank={}; render(true);`);
 const ob0=d.querySelector('#contracts [data-obest="contract"]');
 ok(ob0 && /Best lot: Spruce head, Lot 7 \(for sale\)/.test(ob0.textContent),'the charter board still names the best lot: '+(ob0&&ob0.textContent));
 // what is queued ahead counts too
 const before=E(`Core.orderFit(S.forSale[1], fitOrders(), {caps:bareCaps(), era:0, perfRate:perfRate()}, [])[0].amount`);
 const after=E(`Core.orderFit(S.forSale[1], fitOrders(), {caps:bareCaps(), era:0, perfRate:perfRate()}, S.tracts)[0].amount`);
 ok(after<=before,'the lots already queued ahead reduce what a listing can add before the deadline');

 // ---------- 3. switching lots keeps each lot's progress
 E(`S.contracts=[]; S.orders.open=[]; S.tracts=[Object.assign(Core.makeTract('Alpha',[['pine',100]],40,1,'flat'),{seq:0}), Object.assign(Core.makeTract('Beta',[['spruce',100]],30,6,'steep','headland'),{seq:1}), Object.assign(Core.makeTract('Gamma',[['hemlock',100]],20,2,'rolling','swamp'),{seq:2})];
   S.tractSeq=3; S.tracts[0].left=33; setSite(); S.hp=7; S.vis='pine'; S.ui.qOrder='bought'; S.ui.qView='stock'; render(true);`);
 // Your lots (2026-10-28): the per-lot queue list became the Stock tab; the queue itself still runs (Cut here on Priority)
 const stk=()=>[...d.querySelectorAll('#stock .stk[data-sp]')];
 ok(stk().map(r=>r.dataset.sp).join()==='pine,spruce,hemlock' && /33/.test(stk()[0].textContent) && /30/.test(stk()[1].textContent),'Stock lists the owned trees by kind: '+stk().map(r=>r.textContent).join(' | '));
 ok(!d.querySelector('#tq') && !d.querySelector('#qMode'),'the per-lot queue list and its order buttons are gone');
 ok(/Crews are on Alpha/.test($('queue').textContent),'the active tract panel says which lot crews are on');
 const cash0=E('S.cash');
 E('cutNow(1)');
 ok(E('tract().name')==='Beta' && E('S.site.miles')===6 && E('S.site.slope')==='steep','Cut now: crews move to Beta and its site applies');
 ok(E('S.tracts[1].name')==='Alpha' && E('S.tracts[1].left')===33 && E('S.tracts[1].cur')===7 && E('S.tracts[1].curSp')==='pine','Alpha keeps its trees left and the tree crews were on');
 ok(E('S.cash')===cash0 && E('Core.TRACT_SWITCH_COST')===0,'switching is instant and free');
 ok(/Crews moved to Beta/.test(E('S.log[0].text')),'the ledger notes the move');
 E(`damage(3)`); const betaHp=E('S.hp');
 E('cutNow(1)');
 ok(E('tract().name')==='Alpha' && E('S.hp')===7 && E('S.vis')==='pine' && E('S.site.miles')===1,'switching back resumes Alpha on the same tree (7 chops left)');
 ok(E('S.tracts[1].cur')===betaHp,'and Beta keeps its partial tree');

 // ---------- 4. reorder (the queue logic, now without its list: moveTract, Cut next, the order modes)
 E(`render(true)`);
 E('moveTract(2, 1)');
 ok(E('S.tracts.map(t=>t.name).join()')==='Alpha,Gamma,Beta' && E('S.ui.qOrder')==='hand','moving Gamma up sets the queue by hand');
 E('moveTract(1, 2)');
 ok(E('S.tracts.map(t=>t.name).join()')==='Alpha,Beta,Gamma','and back');
 E('cutNext(2)');
 ok(E('S.tracts.map(t=>t.name).join()')==='Alpha,Gamma,Beta' && E('tract().name')==='Alpha','Cut next puts Gamma second without moving the crews');
 E('moveTract(2, 0)');
 ok(E('S.tracts.map(t=>t.name).join()')==='Beta,Alpha,Gamma' && E('tract().name')==='Beta','moving Beta to the top moves the crews with it');
 ok(E('S.hp')===betaHp,'Beta resumes its partial tree');
 // order modes: value an hour puts the most valuable waiting lot first; crews stay put
 E(`setQueueMode('value')`);
 const vph=E(`S.tracts.slice(1).map(t=>Core.lotValueRate(bareCaps(), t, effSeason(), false))`);
 ok(E('tract().name')==='Beta' && vph[0]>=vph[1] && E('S.ui.qOrder')==='value','by value an hour: waiting lots sorted, crews stay on Beta');
 E(`setQueueMode('bought')`);
 ok(E('S.tracts.map(t=>t.name).join()')==='Beta,Alpha,Gamma','as bought: waiting lots in purchase order');
 E(`S.contracts=[{mill:'Landfall Pier Works', sp:'hemlock', vol:2000, done:0, dur:300, end:S.t+300, prem:.4, penalty:0}]; render(true);`);
 E(`setQueueMode('deadline')`);
 ok(E('S.tracts[1].name')==='Gamma','by order deadline: the hemlock lot that serves the signed hemlock order moves up');
 E(`S.contracts=[]`);
 // a cut-out lot hands the crews to the next in the queue
 E(`S.ui.qOrder='hand'; S.tracts[0].left=1; S.hp=1; damage(1);`);
 ok(E('tract().name')==='Gamma' && /Crews moved to Gamma/.test(E('S.log.find(e=>/^Finished /.test(e.text)).text')),'when the active lot is cut out, crews move to the next in the queue');
 // buying adds to the end; as bought keeps it there
 E(`S.ui.qOrder='bought'; S.forSale=[Core.makeTract('Delta, Lot 2',[['pine',1]],10,1,'flat')]; S.forSale[0].price=1; buyTract(0);`);
 ok(E('S.tracts[S.tracts.length-1].name')==='Delta, Lot 2' && E('S.tracts[S.tracts.length-1].seq')===3,'a bought lot joins the end of the queue with the next purchase number');

 // ---------- 5. the charter board: four offers, the first always a regular order; order fit on each species offer
 let firstRegular=true, counts=new Set(), sp=0;
 for(let i=0;i<40;i++){ E(`S.contracts=[]; refreshOffers();`); counts.add(E('S.offers.length')); if(E('S.offers[0].sp')) firstRegular=false; sp+=E('S.offers.filter(o=>o.sp).length'); }
 ok([...counts].join()==='4' && E('Core.OFFER_BOARD_SIZE')===4,'the charter board shows 4 orders');
 ok(firstRegular,'the first slot is always a regular (any wood) order');
 ok(sp>0,'the other slots can name a species ('+sp+' species offers in 40 boards)');
 E(`S.tracts=[]; S.hp=null; S.offers[1]={mill:'the Admiralty spar yard', sp:'spruce', vol:2000, dur:300, prem:.4, penalty:0}; S.forSale=[Core.makeTract('Spruce head, Lot 7',[['spruce',85],['pine',15]],60,2,'flat','headland')]; S.forSale[0].price=100; render(true);`);
 const ob=d.querySelector('#contracts [data-obest="offer1"]');
 ok(ob && /Best lot: Spruce head, Lot 7 \(for sale\)/.test(ob.textContent),'a species offer names the best lot for it: '+(ob&&ob.textContent));

 // ---------- 6. the AFK lot: Cutover slash country
 let afkBoards=0, multi=false, afk=null;
 E('S.stats.tracts=4; S.stats.slots=4;'); // lot slots (2026-10-28): the AFK lot lists in slot 4, open at 4 lots cut out
 for(let i=0;i<40;i++){ E('refreshSales()'); const n=E('S.forSale.filter(t=>t.afk).length'); if(n>1) multi=true; if(n){ afkBoards++; afk=E('JSON.parse(JSON.stringify(S.forSale.find(t=>t.afk)))'); } }
 ok(!multi && afkBoards===40,'exactly one AFK lot on every board ('+afkBoards+' of 40)');
 ok(afk && afk.ground==='cutover' && afk.trees>=12*60 && afk.trees<=18*60 && ['flat','rolling'].includes(afk.slope) && afk.miles<=3,'Cove AFK lot: 12-18x the trees, flat or rolling, close in: '+(afk&&afk.trees)+' trees');
 const reg=E(`Core.makeTract('x',[['pine',50],['hemlock',30],['spruce',20]],60,${afk.miles},'${afk.slope}','coast')`);
 const regPrice=E(`Core.tractPrice(${reg.trees*reg.val}, ${afk.miles}, '${afk.slope}', 1)`);
 ok(afk.price/afk.trees < regPrice/reg.trees*0.5 && afk.val/afk.bf < reg.val/reg.bf,'cheaper per tree and poorer per bd ft than a normal lot');
 E(`S.forSale=S.forSale.filter(t=>!t.afk); S.forSale.push(Core.genAfkLot(Core.streamRng(S.rng,'land'), 0, saleOpts())); render(true);`);
 const ac=d.querySelector('#sales .row.lot.afk');
 ok(ac && /For time away/.test(ac.textContent) && /this lot adds \+ about \d/.test(ac.querySelector('[data-afkt]').textContent),'the AFK card says what it is for and how much cutting it adds: '+(ac&&ac.querySelector('[data-afkt]').textContent));
 // worse an hour than a good lot for the same camp, but it lasts several times as long
 const r=E(`(()=>{ const a=S.forSale.find(t=>t.afk), g=Core.makeTract('Good',[['pine',100]],60,1,'flat','coast'), c=bareCaps();
   return {va:Core.lotValueRate(c,a,'Fall'), vg:Core.lotValueRate(c,g,'Fall'), ta:Core.cutOutSeconds(c,a), tg:Core.cutOutSeconds(c,g)}; })()`);
 ok(r.va < r.vg*0.85,'less log value an hour than a typical good pine lot of 60 trees ('+r.va.toFixed(2)+' vs '+r.vg.toFixed(2)+' $/s)');
 ok(r.ta > r.tg*2.5,'and it lasts much longer under the same crews ('+Math.round(r.ta)+' s vs '+Math.round(r.tg)+' s)');
 // buy it and leave the camp alone for ten minutes: crews are still cutting
 E(`S.tracts=[]; S.hp=null; S.cash=1e6; const i=S.forSale.findIndex(t=>t.afk); buyTract(i);`);
 ok(E('S.forSale.filter(t=>t.afk).length')===1 && E('S.forSale.length')===4,'buying the AFK lot lists another at once (always for sale, 2026-10-28)');
 const left0=E('tract().left'); for(let i=0;i<600;i++) E('tick(1)');
 ok(E('tract() && tract().afk') && E('tract().left')<left0 && E('tract().left')>0,'after ten idle minutes crews are still on the AFK lot: '+E('tract().left')+' of '+left0+' trees left');
 // queue order: a normal lot bought after the AFK lot is cut first in every auto mode; a lot moved by hand stays put
 const mkLot=n=>`Object.assign(Core.makeTract('${n}',[['pine',100]],60,1,'flat','coast'),{price:10})`;
 for(const m of ['bought','deadline','value']){
   E(`S.ui.qOrder='${m}'; S.tracts=[]; S.hp=null; S.tractSeq=0; S.forSale=[${mkLot('Home')}]; buyTract(0);
     S.forSale=[Core.genAfkLot(Core.streamRng(S.rng,'land'),0,saleOpts())]; buyTract(0);
     S.forSale=[${mkLot('Later A')}]; buyTract(0); S.forSale=[${mkLot('Later B')}]; buyTract(0); render(true);`);
   const order=E('S.tracts.map(t=>t.afk?"AFK":t.name).join()');
   ok(order==='Home,Later A,Later B,AFK','mode '+m+': lots bought after the AFK lot go ahead of it: '+order);
 }
 E(`S.ui.qOrder='bought'; S.tracts=[]; S.hp=null; S.forSale=[Core.genAfkLot(Core.streamRng(S.rng,'land'),0,saleOpts())]; buyTract(0); S.forSale=[${mkLot('Next')}]; buyTract(0);`);
 ok(E('S.tracts.map(t=>t.afk?"AFK":t.name).join()')==='AFK,Next','crews already on the AFK lot stay there; the new lot is next');
 E(`S.ui.qOrder='bought'; S.tracts=[]; S.hp=null; S.forSale=[${mkLot('Home')}]; buyTract(0); S.forSale=[${mkLot('Mid')}]; buyTract(0);
   S.forSale=[Core.genAfkLot(Core.streamRng(S.rng,'land'),0,saleOpts())]; buyTract(0); moveTract(2,1);`);
 ok(E('S.ui.qOrder')==='hand' && E('S.tracts.map(t=>t.afk?"AFK":t.name).join()')==='Home,AFK,Mid','moving the AFK lot by hand switches to by-hand order');
 E(`S.forSale=[${mkLot('Late')}]; buyTract(0); render(true);`);
 ok(E('S.tracts.map(t=>t.afk?"AFK":t.name).join()')==='Home,AFK,Mid,Late','by hand, the player\'s order is kept: a new lot joins the end');
 // the AFK lot never takes a "Best for" badge, even when it is the only lot that serves an order
 E(`S.ui.qOrder='bought'; S.tracts=[]; S.hp=null; S.contracts=[{mill:'the box factory', sp:'pine', vol:3000, done:0, dur:4000, end:S.t+4000, prem:.4, penalty:0}];
   S.forSale=[Core.genAfkLot(Core.streamRng(S.rng,'land'),0,saleOpts())]; render(true);`);
 ok(d.querySelectorAll('#sales [data-best]').length===0,'the AFK lot never carries a Best for badge');
 const obA=d.querySelector('#contracts [data-obest="contract"]');
 ok(obA && /No lot has enough pine/.test(obA.textContent),'and is never named the best lot for an order: '+(obA&&obA.textContent));
 E('S.contracts=[]; S.tracts=[]; S.hp=null; render(true);');

 // ---------- 7. old saves: tracts become the queue in their current order
 E(`S.ui.qOrder='hand'; save();`);
 const raw=JSON.parse(w.localStorage.getItem('timberline-v2'));
 raw.tracts=[{name:'Old one',mix:[['pine',6],['walnut',4]],trees:40,left:12,miles:1,slope:'flat',hp:20,bf:200,val:40,road:false},{name:'Old two',mix:[['pine',1]],trees:30,left:30,miles:3,slope:'rolling',hp:20,bf:200,val:40,road:false}];
 delete raw.tractSeq; delete raw.ui.qOrder; raw.hp=4; raw.last=Date.now(); raw.own={};
 dom.window.close(); dom=mk({'timberline-v2':JSON.stringify(raw)}); await sleep(300); w=dom.window; d=w.document;
 const E2=s=>w.__eval(s);
 ok(E2('S.tracts.map(t=>t.name).join()')==='Old one,Old two' && E2('S.tracts.map(t=>t.seq).join()')==='0,1' && E2('S.tractSeq')===2,'old save: the tracts arrays become the queue in their order, numbered 0 and 1');
 ok(E2('S.ui.qOrder')==='bought' && E2('S.hp')===4 && E2('tract().left')===12,'old save: as-bought order, and the current tree and trees left kept');
 ok(E2('S.ui.qView')==='stock' && !d.getElementById('qStock').hidden && d.getElementById('qTrees').hidden,'old save: Your lots opens on the Stock tab');
 d.querySelector('#qTabs [data-v="priority"]').click();
 ok(E2('S.ui.qView')==='priority' && !d.getElementById('qTrees').hidden && d.querySelectorAll('#stash .slots li').length>=2,'old save: Priority lists both lots under their trees');

 ok(errs.length===0,'no console errors'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
 dom.window.close();
 console.log(fails?`\n${fails} FAILED`:'\nall passed'); process.exit(fails?1:0);
})().catch(e=>{console.error(e); process.exit(1);});
