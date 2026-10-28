// Land office lot slots (owner 2026-10-28, docs/design/lot-slots.md section 5): one listing per slot, locked rows with
// the goal and progress, unlocks at 2 / 3 / 4 lifetime lots cut out that stay through close camp, a slot relists what
// you buy from it, the AFK lot only in slot 4, charter orders only for trees you can get now, and old saves.
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
 const rows=()=>[...d.querySelectorAll('#sales .row.lot')];
 const slots=()=>E('S.forSale.map(t=>t.slot).join()');
 // finish the crews' lot (a tiny one) so the lifetime count goes up the way play does
 const cutOne=()=>E(`S.forSale=S.forSale; const t=Core.makeTract('Tiny, Lot 1',[['pine',1]],1,1,'flat'); t.seq=S.tractSeq++; S.tracts.unshift(t); finishTract(); render(true);`);
 E('S.weather.off=true; S.weather.cur=null; S.cash=0; render(true);');

 // ---------- 1. a new company: slot 1 only, three compact locked rows
 ok(E('S.stats.tracts')===0 && slots()==='0' && !E('S.forSale.some(t=>t.afk)'),'new company: one listing (slot 1), no AFK lot');
 const lk=d.querySelectorAll('#sales .row.locked[data-locked]');
 ok(lk.length===3 && [...lk].map(r=>r.dataset.slot).join()==='1,2,3','three locked rows for slots 2-4');
 ok(/Surveyed lot/.test(lk[0].textContent) && /Opens at 2 lots cut out · 2 more lots/.test(lk[0].textContent) && !lk[0].querySelector('button'),'locked row shows the goal and progress: '+lk[0].textContent.replace(/\s+/g,' ').trim());
 ok(/AFK lot/.test(lk[2].textContent) && /4 more lots/.test(lk[2].textContent),'the AFK lot row is locked until 4 lots');
 ok(rows()[0].querySelectorAll('.stat').length>0 && rows()[0].querySelector('button.buy'),'slot 1 listing has the color-coded stat chips and a buy button');

 // ---------- 2. unlocks: 2 lots, 3 lots, 4 lots
 cutOne();
 ok(slots()==='0' && /1 more lot\b/.test(d.querySelector('#sales .row.locked[data-slot="1"]').textContent),'after 1 lot: still locked, "1 more lot"');
 cutOne();
 ok(slots()==='0,1' && /New land office slot: Surveyed lot/.test(E('S.log.map(l=>l.text).join("|")')),'2 lots cut out: slot 2 opens with a note');
 const s2=E('S.forSale[1]');
 ok(s2.mix.length===3 && !s2.afk && s2.mix.every(m=>['pine','spruce','hemlock'].includes(m[0])),'slot 2 lists a 3-species Cove lot: '+s2.mix.map(m=>m.join(' ')).join(', '));
 ok(rows()[1].querySelectorAll('.stat').length>0 && /Surveyed lot/.test(rows()[1].querySelector('.slotchip').textContent),'slot 2 listing has stat chips and its slot name');
 cutOne();
 const s3=E('S.forSale[2]');
 ok(slots()==='0,1,2' && s3.mix.length===4 && s3.mix.some(m=>m[0]==='maple'),'3 lots: slot 3 opens with a 4-species lot incl. maple');
 const mw=s3.mix.find(m=>m[0]==='maple')[1]; ok(mw>=10 && mw<=20,'the rare maple is 10-20%: '+mw);
 ok(/Rare: Maple/.test(rows()[2].textContent),'slot 3 listing names its rare tree');
 cutOne();
 ok(slots()==='0,1,2,3' && E('S.forSale[3].afk')===true && d.querySelectorAll('#sales .row.locked').length===0,'4 lots: the AFK lot opens in slot 4; no locked rows left');
 ok(E('S.stats.slots')===4,'opened slots are recorded');

 // ---------- 3. relisting: a slot relists its own kind; the AFK lot waits for the next board
 E('S.cash=1e9;');
 const n2=E('S.forSale[1].name'); E('buyTract(1); render(true);');
 ok(slots()==='0,1,2,3' && E('S.forSale[1].mix.length')===3 && E('S.forSale[1].name')!==n2,'buying from slot 2 relists slot 2 with a new 3-species lot');
 E('buyTract(2); render(true);'); ok(E('S.forSale[2].slot')===2 && E('S.forSale[2].mix.length')===4,'buying from slot 3 relists slot 3');
 E('buyTract(0); render(true);'); ok(E('S.forSale[0].slot')===0 && E('S.forSale[0].mix.length')===2,'buying from slot 1 relists a 2-species lot');
 // the AFK lot is always for sale (owner 2026-10-28): buying it lists another at once, so idle players can buy several in a row
 const a0=E('S.forSale[3].name'), own0=E('S.tracts.filter(t=>t.afk).length');
 E('buyTract(3); render(true);');
 ok(slots()==='0,1,2,3' && E('S.forSale[3].afk')===true && E('S.forSale[3].name')!==a0 && !E('S.afkHeld') && !d.querySelector('#sales .row.locked'),'buying the AFK lot lists another AFK lot at once (no restock wait)');
 E('buyTract(3); buyTract(3); render(true);');
 ok(E('S.tracts.filter(t=>t.afk).length')===own0+3 && E('S.forSale[3].afk')===true,'three AFK lots bought in a row, slot 4 still listed');
 const a1=E('S.forSale[3].name'), n1=E('S.forSale[0].name');
 E('S.saleT=0; tick(0.1); render(true);');
 ok(slots()==='0,1,2,3' && E('S.forSale[3].name')===a1 && E('S.forSale[0].name')!==n1,'the 3-minute refresh relists the other slots and keeps the AFK listing');
 ok(E('S.forSale.filter(t=>t.afk).length')===1 && E('S.forSale.slice(0,3).every(t=>!t.afk)'),'the AFK lot is only ever in slot 4');

 // ---------- 4. charter orders: only trees you can get now
 const orderSp=()=>{ const sp=new Set(); for(let i=0;i<60;i++){ E('S.contracts=[]; refreshOffers();'); E('S.offers').forEach(o=>{ if(o.sp) sp.add(o.sp); }); } return sp; };
 ok(E('offerSpecies().species.includes("maple")'),'slot 3 open: maple on the board can be ordered');
 E(`S.stats.tracts=2; S.stats.slots=2; S.forSale=S.forSale.filter(t=>t.slot<2); S.forSale.push(Object.assign(Core.makeTract('Stale, Lot 3',[['pine',50],['maple',50]],60,2,'flat'),{slot:1,price:10}));`);
 ok(!E('offerSpecies().species.includes("maple")') && !orderSp().has('maple'),'slot 3 locked: no maple orders, even with maple on the board');
 // several active orders (2026-10-26): with room for more than one order and one already running, the rule still holds
 E(`S.run.perks=(S.run.perks||[]).concat(['overbook']); S.contracts=[Object.assign(genOffer(true),{t0:S.t})];`);
 ok(E('ordCap()')>1 && E('!ordFull()'),'overbooked: room for another order next to the active one');
 { const sp=new Set(); for(let i=0;i<60;i++){ E('refreshOffers();'); E('S.offers').forEach(o=>{ if(o.sp) sp.add(o.sp); }); } ok(!sp.has('maple'),'slot 3 locked with an order running: still no maple orders'); }
 E(`S.run.perks=S.run.perks.filter(p=>p!=='overbook'); S.contracts=[];`);
 E(`S.stats.tracts=4; S.stats.slots=4; refreshSales();`);

 // ---------- 5. close camp keeps the slots
 const n0=E('S.run.n');
 E(`S.run.deliv=Core.CLOSE_VOL+1; closeCamp(); S.run.setup&&startRun([]); render(true);`);
 ok(E('S.run.n')===n0+1 && slots()==='0,1,2,3' && E('S.stats.tracts')===4,'after close camp all four slots are still open');

 // ---------- 6. old saves: lifetime lots from the stats; an old board keeps its listings in open slots
 w.dispatchEvent(new w.Event('pagehide'));
 const old=JSON.parse(w.localStorage.getItem('timberline-v2'));
 const mkOld=(lots, board)=>{ const o=JSON.parse(JSON.stringify(old)); o.stats={...o.stats, tracts:lots}; delete o.stats.slots; delete o.afkHeld; o.log=[]; o.forSale=board; o.last=Date.now(); return JSON.stringify(o); };
 const cove=n=>({name:'Old cove, Lot '+n, mix:[['pine',6],['hemlock',4]], trees:40, left:40, miles:1, slope:'flat', hp:20.8, bf:208, val:36, road:false, price:600, ground:'coast'});
 const afkOld={...cove(9), name:'Cutover, Lot 9', ground:'cutover', afk:true, trees:900, left:900};
 dom.window.close();
 dom=mk({'timberline-v2':mkOld(1, [cove(1), cove(2), cove(3), afkOld])}); await sleep(300); w=dom.window; d=w.document; E=s=>w.__eval(s);
 ok(errs.length===0,'old save loads without errors '+errs.slice(0,2).join(' '));
 ok(slots()==='0' && E('S.forSale[0].name')==='Old cove, Lot 1' && E('S.stats.slots')===1 && !E('S.forSale.some(t=>t.afk)'),'old save, 1 lot cut out: keeps one listing in slot 1, the AFK lot leaves the board');
 ok(d.querySelectorAll('#sales .row.locked[data-locked]').length===3,'old save shows the three locked rows');
 dom.window.close();
 dom=mk({'timberline-v2':mkOld(7, [cove(1), cove(2), afkOld])}); await sleep(300); w=dom.window; d=w.document; E=s=>w.__eval(s);
 ok(slots()==='0,1,2,3' && E('S.forSale[1].name')==='Old cove, Lot 2' && E('S.forSale[3].name')==='Cutover, Lot 9' && E('S.forSale[2].mix.length')===4,'old save, 7 lots cut out: all four slots open; old listings kept, slot 3 filled');
 ok(E('S.stats.slots')===4 && !/New land office slot/.test(E('S.log.map(l=>l.text).join("|")')),'old saves open their slots quietly (no unlock notes)');
 dom.window.close();
 // a save from when a bought AFK lot left slot 4 empty until the next board (afkHeld): the AFK lot is listed again on load
 { const o=JSON.parse(mkOld(7, [cove(1), cove(2), cove(3)])); o.afkHeld=true; o.saleT=170;
   dom=mk({'timberline-v2':JSON.stringify(o)}); await sleep(300); w=dom.window; d=w.document; E=s=>w.__eval(s); }
 ok(slots()==='0,1,2,3' && E('S.forSale[3].afk')===true && E('S.afkHeld')===false && !d.querySelector('#sales .row.locked'),'old save holding the AFK slot: the AFK lot is for sale again at once');

 ok(errs.length===0,'no console errors '+errs.slice(0,3).join(' | '));
 console.log(fails?fails+' FAILED':'ALL PASS'); process.exit(fails?1:0);
})();
