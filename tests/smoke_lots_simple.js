// Simpler lots (owner 2026-10-28): idle cutting stocked (Your lots and the AFK listing), the Stock and Priority tabs
// of Your lots, and the trimmed land office listing (tree mix, tree count, price, chops chip, haul chip).
const {JSDOM, VirtualConsole}=require('jsdom');const fs=require('fs');
const errs=[]; const vc=new VirtualConsole(); vc.on('error',e=>errs.push(String(e&&e.stack||e))); vc.on('jsdomError',e=>errs.push('jsdom:'+e.message));
const START="window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});";
const src=fs.readFileSync(__dirname+'/../prototype/timberline.html','utf8');
if(!src.includes(START)) throw new Error('start line not found');
const html=src.replace(START,'window.__eval = s => eval(s); '+START);
const mk=(store,seed)=>new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,url:'https://x.test/',beforeParse(w){
  if(store) for(const k in store) w.localStorage.setItem(k,store[k]);
  let x=seed||5; w.Math.random=()=>{ x=(x*9301+49297)%233280; return x/233280; };
  w.HTMLCanvasElement.prototype.getContext=function(){return new Proxy({},{get:(t,p)=>p==='measureText'?()=>({width:10}):p in t?t[p]:()=>{},set:(t,p,v)=>(t[p]=v,true)});};
  w.addEventListener('error',e=>errs.push('win:'+e.message));}});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let fails=0; const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m); if(!c) fails++;};
(async()=>{
 let dom=mk(); await sleep(300); let w=dom.window, d=w.document, E=s=>w.__eval(s);
 E('S.weather.off=true; S.weather.cur=null; render(true);');
 const txt=sel=>(d.querySelector(sel)||{}).textContent||'';

 // ---------- 1. idle cutting stocked
 ok(/Idle cutting stocked/.test(txt('#stocked')),'Your lots shows the idle cutting stocked line');
 // no crews at all: unknown
 E(`['fell','buck','skid','haul'].forEach(st=>EQ.filter(e=>e.stage===st).forEach(e=>{ S.own[e.id]=0; })); render(true);`);
 ok(txt('#stockedV')==='—','no crews: "—" ('+txt('#stockedV')+')');
 // a crew on every stage and a lot: the readout is Core's estimate in plain words
 E(`['fell','buck','skid','haul'].forEach(st=>{ const e=EQ.filter(x=>x.stage===st&&x.era<=S.era)[0]; S.own[e.id]=3; }); render(true);`);
 const want=E('Core.aboutTime(Core.stockedSeconds(bareCaps(), queueViews(), has("skyline")))');
 ok(/^about \d/.test(want) && txt('#stockedV')===want,'with crews the readout is the estimate: '+txt('#stockedV'));
 // more trees, more time
 const s0=E('stockedSec()');
 E(`S.cash=1e9; buyTract(0); render(true);`);
 ok(E('stockedSec()')>s0,'buying a lot raises the stocked time ('+Math.round(s0/60)+' → '+Math.round(E('stockedSec()')/60)+' min)');
 E(`S.tracts=[]; setSite(); render(true);`);
 ok(txt('#stockedV')==='none','no trees owned: "none"');
 // the AFK listing says how much one more adds
 E(`S.stats.tracts=4; S.stats.slots=4; refreshSales(); render(true);`);
 const afk=d.querySelector('#sales [data-afkt]');
 ok(afk && /Stocked now: none · this lot adds \+ about \d/.test(afk.textContent),'the AFK listing shows what one more adds: '+(afk&&afk.textContent));
 const add=E('Core.aboutTime(addsSec(S.forSale[3]))');
 E(`buyTract(3); render(true);`);
 ok(txt('#stockedV')===add,'after buying it the stocked time is what it said it adds ('+add+')');

 // ---------- 2. Your lots: Stock and Priority tabs
 E(`S.tracts=[Object.assign(Core.makeTract('Home lot',[['pine',70],['hemlock',30]],100,1,'flat'),{seq:S.tractSeq++}), Object.assign(Core.makeTract('Spruce head, Lot 7',[['spruce',80],['pine',20]],50,2,'rolling','headland'),{seq:S.tractSeq++})];
   S.tracts.forEach(t=>standOf(t)); setSite(); newTree(); S.ui.qView='stock'; render(true);`);
 const tabs=[...d.querySelectorAll('#qTabs button')];
 ok(tabs.map(b=>b.textContent).join()==='Stock,Priority' && tabs.every(b=>b.getAttribute('type')==='button'),'two tabs: Stock and Priority');
 const rows=[...d.querySelectorAll('#stock .stk[data-sp]')];
 ok(rows.map(r=>r.dataset.sp).join()==='pine,hemlock,spruce','one row per kind of tree owned (most first)');
 ok(rows[0].querySelector('.sw.sp-pine') && /Pine/.test(rows[0].textContent) && rows[0].querySelector('[data-stn="pine"]').textContent==='80','a row has the colour, the name and the count: '+rows[0].textContent);
 ok(rows[0].querySelector('[data-stb]').style.width==='100%' && Math.abs(parseFloat(rows[2].querySelector('[data-stb]').style.width)-50)<0.2,'bars scale to the biggest count (spruce 40 of 80 = 50%)');
 ok(!d.querySelector('#stock .stat, #stock .fit, #stock button'),'no stat chips, notes or buttons on Stock');
 ok(/^150 trees on 2 lots$/.test(txt('#stock .stk.total')),'a total line: '+txt('#stock .stk.total'));
 E(`setStashRule('spruce','skip'); S.ui.qView='stock'; render(true);`);
 ok(/Skip/.test(txt('#stock .stk[data-sp="spruce"]')) && !/Any/.test(txt('#stock .stk[data-sp="pine"]')),'a First or Skip rule shows as a tag on Stock');
 tabs[1].dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
 ok(E('S.ui.qView')==='priority' && !d.getElementById('qTrees').hidden && d.getElementById('qStock').hidden && d.querySelectorAll('#stash .scard').length===3,'tap Priority: the Any / First / Skip cards');
 ok(d.querySelector('#stash [data-rsp="spruce"][data-r="skip"]').getAttribute('aria-pressed')==='true','Priority shows the rule set');
 E(`setStashRule('spruce','any'); render(true);`);
 // old saves: the tab value maps across ('lots' → Stock, 'trees' → Priority) and a load opens on Stock
 ok(E(`qViewOf('lots')`)==='stock' && E(`qViewOf('trees')`)==='priority' && E(`qViewOf(undefined)`)==='stock','old tab values map to the new tabs');
 E(`S.ui.qView='trees'; render(true);`);
 ok(!d.getElementById('qTrees').hidden && tabs[1].getAttribute('aria-pressed')==='true','an old "trees" value shows Priority');
 E(`S.ui.qView='lots'; save();`);
 const raw=w.localStorage.getItem('timberline-v2'); dom.window.close();
 dom=mk({'timberline-v2':raw}); await sleep(300); w=dom.window; d=w.document; E=s=>w.__eval(s);
 ok(E('S.ui.qView')==='stock' && !d.getElementById('qStock').hidden && d.querySelectorAll('#stock .stk[data-sp]').length===3,'a save left on the old Lots tab loads on Stock with its trees');

 // ---------- 3. the land office listing: tree mix, tree count, price, chops chip, haul chip (Easy / OK / Hard)
 E(`S.weather.off=true; S.weather.cur=null; S.stats.tracts=4; S.stats.slots=4; refreshSales();
   S.forSale[0]=Object.assign(Core.makeTract('Near flat, Lot 1',[['pine',60],['hemlock',40]],50,1,'flat','coast'),{slot:0,price:400});
   S.forSale[1]=Object.assign(Core.makeTract('Mid hill, Lot 2',[['spruce',50],['pine',30],['hemlock',20]],50,4,'rolling','headland'),{slot:1,price:300});
   S.forSale[2]=Object.assign(Core.makeTract('Far steep, Lot 3',[['hemlock',60],['spruce',25],['maple',15]],50,9,'steep','swamp'),{slot:2,price:200});
   S.cash=350; render(true);`);
 const L=[...d.querySelectorAll('#sales .row.lot')], haul=c=>c.querySelector('[data-haul]');
 ok(L.length===4 && L.slice(0,3).map(c=>haul(c).dataset.haul).join()==='easy,ok,hard','haul chips: Easy, OK, Hard ('+L.map(c=>haul(c).dataset.haul).join()+')');
 ok(haul(L[0]).classList.contains('good') && haul(L[1]).classList.contains('even') && haul(L[2]).classList.contains('bad'),'haul chip colours: green, plain, red');
 ok(L.every(c=>[...c.querySelectorAll('.stat')].map(s=>s.dataset.stat).join()==='chops,haul'),'each listing has exactly two chips: chops and haul');
 ok(L.slice(0,3).every(c=>['good','bad','even'].includes(c.querySelector('[data-stat="chops"]').dataset.v)),'the chops chip is colour-coded against the average');
 ok(/^50 trees · Pine 60% · Hemlock 40%$/.test(L[0].querySelector('.lotl').textContent) && L[0].querySelectorAll('.spbar i').length===2,'tree count and mix, with the mix bar: '+L[0].querySelector('.lotl').textContent);
 const face=L.map(c=>c.querySelector('.info').textContent).join(' ');
 ok(!/bd ft|Best for|Value|Weight|Prime|Slope|a tree|of logs an hour|slowest/.test(face) && !d.querySelector('#sales details, #sales .ofit, #sales .fit'),'no bd ft, value, weight, Prime, best-for or camp-note text left on the listings');
 ok(L[1].querySelector('button.buy').textContent===E('money(300)') && !L[1].querySelector('button.buy').disabled && L[0].querySelector('button.buy').disabled,'the price is on the Buy button, which is off when you cannot pay');
 L[1].querySelector('button.buy').click();
 ok(E('S.tracts.some(t=>t.name==="Mid hill, Lot 2")'),'Buy still buys the lot');
 ok(L[3].classList.contains('afk') && /For time away/.test(L[3].textContent) && L[3].querySelector('[data-afkt]'),'the AFK listing keeps its "for time away" tag and the cutting time it adds');
 ok(/The AFK lot is always for sale/.test(txt('#saleMeta')),'the land office note says the AFK lot is always for sale');
 // locked slots still show what opens them
 E(`S.stats.tracts=2; S.stats.slots=2; refreshSales(); render(true);`);
 const lk=[...d.querySelectorAll('#sales .row.locked[data-locked]')];
 ok(lk.length===2 && /Opens at 3 lots cut out · 1 more lot/.test(lk[0].textContent) && /AFK lot/.test(lk[1].textContent),'locked slot rows keep the unlock goal');

 ok(errs.length===0,'no console errors '+errs.slice(0,3).join(' | '));
 console.log(fails?fails+' FAILED':'ALL PASS'); process.exit(fails?1:0);
})();
