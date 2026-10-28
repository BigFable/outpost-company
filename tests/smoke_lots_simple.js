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

 ok(errs.length===0,'no console errors '+errs.slice(0,3).join(' | '));
 console.log(fails?fails+' FAILED':'ALL PASS'); process.exit(fails?1:0);
})();
