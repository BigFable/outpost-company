// The lot stash (docs/design/lot-stash-and-camp-money.md, part A, slice 1): tree counts per species on each lot, the Trees
// tab of the cutting queue, the Any / First / Skip rule per species, Cut here, the picking cost on felling and skidding,
// species-order credit by the trees actually cut, the never-stall fallbacks (the AFK lot ignores the rules), and old saves.
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
const near=(a,b,e=1e-6)=>Math.abs(a-b)<=e*Math.max(1,Math.abs(b));
(async()=>{
 let dom=mk(); await sleep(300); let w=dom.window, d=w.document, E=s=>w.__eval(s);
 const $=id=>d.getElementById(id);
 const click=el=>el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
 // a camp with two mixed lots: crews on the pine-hemlock lot, a spruce-pine lot waiting
 E(`S.season=2; S.weather.cur=null; S.weather.off=true; S.cash=1e6; S.own={axeman:2, bucker:20, oxen:4, sled:6}; S.upg=[]; S.run.perks=[]; S.contracts=[];
   S.tracts=[Object.assign(Core.makeTract('Home lot',[['pine',70],['hemlock',30]],100,1,'flat'),{seq:0}), Object.assign(Core.makeTract('Spruce head, Lot 7',[['spruce',80],['pine',20]],50,2,'rolling','headland'),{seq:1})];
   S.tractSeq=2; S.ui.stashRule={}; normalize(); setSite(); newTree(); render(true);`);

 // ---------- 1. tree counts per species
 ok(JSON.stringify(E('S.tracts[0].stand'))==='{"pine":70,"hemlock":30}' && JSON.stringify(E('S.tracts[1].stand'))==='{"spruce":40,"pine":10}','each lot has a tree count per species from its mix');
 const r0=E(`(()=>{ const t=tract(), b={hp:t.hp, bf:t.bf, val:t.val}; return {b, v:{hp:cutOf(t).hp, bf:cutOf(t).bf, val:cutOf(t).val, pf:cutOf(t).pf}, rate:rate('fell')}; })()`);
 ok(r0.v.hp===r0.b.hp && r0.v.bf===r0.b.bf && r0.v.val===r0.b.val && r0.v.pf===1,'every rule on Any: crews cut the lot as before (same averages, no slowdown)');
 for(let i=0;i<60;i++) E('tick(1)');
 const st=E('S.tracts[0].stand'), lf=E('S.tracts[0].left');
 ok(lf<100 && near(st.pine+st.hemlock, lf) && near(st.pine/(st.pine+st.hemlock), .7),'under Any felling takes every species in proportion ('+lf+' left, pine '+(st.pine/lf*100).toFixed(1)+'%)');

 // ---------- 2. the Trees tab
 const tabs=[...d.querySelectorAll('#qTabs button')];
 ok(tabs.map(b=>b.textContent).join()==='Lots,Trees' && !$('qTrees').hidden && $('qLots').hidden && E('S.ui.qView')==='trees' && tabs[1].getAttribute('aria-pressed')==='true','a Lots tab next to Trees; Trees shows by default');
 click(tabs[0]);
 ok($('qTrees').hidden && !$('qLots').hidden && E('S.ui.qView')==='lots' && d.querySelectorAll('#tq .qrow').length===2,'tap Lots: the queue rows show');
 click(tabs[1]);
 ok(!$('qTrees').hidden && $('qLots').hidden && E('S.ui.qView')==='trees','tap Trees: the stash shows again');
 let cards=[...d.querySelectorAll('#stash .scard')];
 ok(cards.map(c=>c.dataset.sp).join()==='pine,hemlock,spruce','one card per species owned: '+cards.map(c=>c.dataset.sp).join());
 const pc=cards[0].textContent;
 ok(/Pine/.test(pc) && /\d+ trees · [\d.]+K wood · \$[\d.]+K?/.test(pc) && /Chops 20/.test(cards[0].querySelector('[data-stat="chops"]').textContent) && cards[0].querySelector('[data-stat="weight"]') && cards[0].querySelector('[data-stat="prime"]'),'a card shows trees, bd ft, value, chops, weight and Prime: '+cards[0].querySelector('summary').textContent.trim());
 ok(/Light/.test(cards[2].querySelector('summary').textContent) && cards[2].querySelector('[data-stat="weight"]').dataset.v==='good','spruce is tagged light');
 const pineLots=[...cards[0].querySelectorAll('.slots li')];
 ok(pineLots.length===2 && /Home lot: \d+ trees \(70%\)/.test(pineLots[0].textContent) && /Crews here/.test(pineLots[0].textContent) && /Spruce head, Lot 7: 10 trees \(20%\) · hilly · 2 mi/.test(pineLots[1].textContent),'tap a species: its lots, with count, share, slope and miles');
 ok(cards.every(c=>[...c.querySelectorAll('.srule button')].map(b=>b.textContent).join()==='Any,First,Skip' && c.querySelector('.srule [aria-pressed="true"]').textContent==='Any'),'each species has Any / First / Skip, Any by default');
 // the spruce order it serves
 E(`S.contracts=[{mill:'the Admiralty spar yard', sp:'spruce', vol:4000, done:0, dur:900, end:S.t+900, prem:.4, penalty:0}]; render(true);`);
 cards=[...d.querySelectorAll('#stash .scard')];
 ok(/Serves the spruce order/.test(cards[2].textContent) && !/Serves the spruce order/.test(cards[1].textContent),'a card names the orders its trees serve');

 // ---------- 3. Cut here
 click(cards[2].querySelector('[data-cut]'));
 ok(E('tract().name')==='Spruce head, Lot 7' && E('S.tracts[1].name')==='Home lot','Cut here moves the crews to that lot');
 ok(/Crews here/.test(d.querySelector('#stash .scard[data-sp="spruce"] .slots li').textContent),'and the card shows crews there');

 // ---------- 4. First: the picking cost and the order credit
 const fullFell=E(`rate('fell')`), fullSkid=E(`rate('skid')`), fullHaul=E(`rate('haul')`);
 const credit0=E('orderShare(S.contracts[0])');
 ok(near(credit0,.8),'under Any the spruce order gets the lot mix share of each delivery (80%)');
 click(d.querySelector('#stash [data-rsp="pine"][data-r="first"]'));
 ok(E('S.ui.stashRule.pine')==='first' && d.querySelector('#stash [data-rsp="pine"][data-r="first"]').getAttribute('aria-pressed')==='true','tap First: the rule is set');
 const v=E('cutOf(tract())');
 ok(v.mode==='first' && v.species.join()==='pine' && near(v.pf,.6) && near(v.hp, 20) && near(v.bf, 200),'First on pine (20% of the lot): crews fell pine only at ×0.6');
 const w0=E('tract().wt'), w1=v.wt;
 ok(near(E(`rate('fell')`), fullFell*.6) && near(E(`rate('skid')`), fullSkid*w0/w1*.6) && near(E(`rate('haul')`), fullHaul*w0/w1),'felling and skidding ×0.6; hauling changes only with the weight of the pine');
 ok(/Picking pine on Spruce head, Lot 7: felling and skidding ×0\.6\./.test($('pickNote').textContent) && !$('pickNote').hidden,'the panel says what picking costs: '+$('pickNote').textContent);
 ok(E('orderShare(S.contracts[0])')===0,'species order credit follows the trees cut: picking pine gives the spruce order nothing');
 E(`S.ui.stashRule={}; setStashRule('spruce','first');`);
 ok(E('orderShare(S.contracts[0])')===1 && near(E('cutOf(tract()).pf'), .9),'First on spruce (80%): the spruce order gets every delivery, at ×0.9');
 const done0=E('S.contracts[0].done'); E(`S.landing={bf:1000, val:100}; deliver(1000);`);
 ok(near(E('S.contracts[0].done')-done0, 1000),'a delivery counts in full toward the spruce order');
 // fell the spruce out: then crews cut the rest (Any)
 E(`S.landing={bf:0,val:0}; S.cut={bf:0,val:0}; S.stems={bf:0,val:0};`);
 E(`fellK(tract(), 30);`);
 const s1=E('tract().stand');
 ok(near(s1.spruce,10) && near(s1.pine,10) && E('tract().picked')===true,'felling under First takes spruce only ('+JSON.stringify(s1)+')');
 E(`fellK(tract(), 15);`);
 const s2=E('tract().stand');
 ok(s2.spruce===0 && near(s2.pine,5),'a batch that runs out of spruce goes on to the rest ('+JSON.stringify(s2)+')');
 const vr=E('cutOf(tract())');
 ok(vr.mode==='all' && vr.pf===1 && vr.species.join()==='pine' && near(vr.hp,20),'no First species left: crews cut the rest at full speed');
 ok(/No spruce on Spruce head, Lot 7\. Cutting the rest\./.test(E('pickNoteText()')),'with a note: '+E('pickNoteText()'));
 // the bucking game and idle Prime read the trees crews cut
 ok(E('mixPick(tract())')==='pine','the bucking game draws from the trees being cut');

 // ---------- 5. Skip, and the never-stall fallbacks
 E(`S.ui.stashRule={}; rulesAny=true; rulesV++; S.contracts=[];
   S.tracts=[Object.assign(Core.makeTract('Alpha, Lot 2',[['pine',50],['hemlock',50]],10,1,'flat'),{seq:5}), Object.assign(Core.makeTract('Beta, Lot 3',[['pine',100]],10,1,'flat'),{seq:6})];
   S.ui.qOrder='bought'; S.hp=null; setSite(); newTree(); setStashRule('hemlock','skip');`);
 ok(E('cutOf(tract())').species.join()==='pine' && near(E('cutOf(tract()).pf'),.75),'Skip hemlock: crews fell only the pine (×0.75)');
 for(let i=0;i<400 && E('tract().name')==='Alpha, Lot 2';i++) E('tick(1)');
 ok(E('tract().name')==='Beta, Lot 3' && E('S.tracts[1].name')==='Alpha, Lot 2' && near(E('S.tracts[1].stand.hemlock'),5),'a lot with only Skipped trees left drops to the bottom; its hemlock is left standing');
 ok(E('S.log').some(l=>/Hemlock left standing on Alpha, Lot 2\. Crews moved to Beta, Lot 3\./.test(l.text)),'with a camp log note');
 E(`S.tracts[0].left=1; S.tracts[0].stand={pine:1};`);
 for(let i=0;i<60 && E('S.tracts.length')>1;i++) E('tick(1)');
 ok(E('tract() && tract().name')==='Alpha, Lot 2' && E('cutOf(tract()).mode')==='skipped','only Skipped trees left anywhere: crews cut them');
 const lA=E('tract().left'); for(let i=0;i<30;i++) E('tick(1)');
 ok(E('S.tracts.length')===0 || E('tract().left')<lA,'and keep cutting (never stall)');
 ok(E('S.log').some(l=>/Out of other wood, cutting hemlock on Alpha, Lot 2\./.test(l.text)),'with one note');
 // the AFK lot ignores the rules
 E(`S.tracts=[Object.assign(Core.genAfkLot(Core.streamRng(S.rng,'land'), 0, saleOpts()),{seq:9})]; S.hp=null; setSite(); newTree(); S.ui.stashRule={pine:'first', hemlock:'skip'}; rulesAny=false; rulesV++;`);
 ok(E('cutOf(tract()).mode')==='all' && E('cutOf(tract()).pf')===1 && /ignores tree rules/.test(E('pickNoteText()')),'the AFK lot ignores the rules: crews cut everything at full speed');

 // ---------- 6. old saves: lots get tree counts from their mix and trees left; rules default to Any
 E(`S.ui.stashRule={}; save();`);
 const raw=JSON.parse(w.localStorage.getItem('timberline-v2'));
 raw.tracts=[{name:'Old one',mix:[['pine',6],['walnut',4]],trees:40,left:13,miles:1,slope:'flat',hp:20,bf:200,val:40,road:false,seq:0}];
 delete raw.ui.stashRule; delete raw.ui.qView; raw.last=Date.now(); raw.own={};
 dom.window.close(); dom=mk({'timberline-v2':JSON.stringify(raw)}); await sleep(300); w=dom.window; d=w.document;
 const E2=s=>w.__eval(s);
 ok(JSON.stringify(E2('tract().stand'))==='{"pine":8,"cloudwood":5}','old save: an old lot gets counts from its mix and trees left (8 pine, 5 redwood of 13)');
 ok(JSON.stringify(E2('S.ui.stashRule'))==='{}' && E2('S.ui.qView')==='trees' && !d.getElementById('qTrees').hidden && E2('rulesAny')===true,'old save: every species on Any, the Trees tab first');
 ok(E2('cutOf(tract()).hp')===20 && E2('cutOf(tract()).pf')===1,'old save: crews cut as before');
 // rules survive a save and reload
 E2(`setStashRule('pine','first'); S.ui.qView='lots'; save();`);
 const raw2=w.localStorage.getItem('timberline-v2');
 dom.window.close(); dom=mk({'timberline-v2':raw2}); await sleep(300); w=dom.window;
 ok(w.__eval('S.ui.stashRule.pine')==='first' && w.__eval('cutOf(tract()).species.join()')==='pine','rules and counts survive a reload');
 ok(w.__eval('S.ui.qView')==='trees' && !w.document.getElementById('qTrees').hidden && w.document.getElementById('qLots').hidden,'a save left on the Lots tab opens on Trees again (the switch lasts for the session)');

 ok(errs.length===0,'no console errors'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
 dom.window.close();
 console.log(fails?`\n${fails} FAILED`:'\nall passed'); process.exit(fails?1:0);
})().catch(e=>{console.error(e); process.exit(1);});
