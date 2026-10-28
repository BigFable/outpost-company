const {JSDOM, VirtualConsole}=require('jsdom');const fs=require('fs');
const D=__dirname+'/';
const errs=[]; const vc=new VirtualConsole(); vc.on('error',e=>errs.push(String(e&&e.stack||e))); vc.on('jsdomError',e=>errs.push('jsdom:'+e.message));
const html=fs.readFileSync(D+'../prototype/timberline.html','utf8');
const mk=(store)=>new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,url:'https://x.test/',beforeParse(w){
  if(store) for(const k in store) w.localStorage.setItem(k,store[k]);
  w.HTMLCanvasElement.prototype.getContext=function(){return new Proxy({},{get:(t,p)=>p==='measureText'?()=>({width:10}):p in t?t[p]:()=>{},set:(t,p,v)=>(t[p]=v,true)});};
  w.addEventListener('error',e=>errs.push('win:'+e.message));
}});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
// Poll a condition instead of racing fixed sleeps against the game loop (jsdom timers slow down under CPU load).
const waitFor=async(f,ms=15000)=>{ const t0=Date.now(); while(Date.now()-t0<ms){ try{ if(f()) return true; }catch(e){} await sleep(20); } return false; };
let fails=0; const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m); if(!c) fails++;};
(async()=>{
 // 1. legacy save loads (v2 without run fields)
 const old={v:2,cash:500,era:0,year:1881,season:1,st:10,t:1000,stems:{bf:0,val:0},cut:{bf:0,val:0},landing:{bf:0,val:0},own:{axeman:2},upg:['file'],tracts:[],site:{miles:1,slope:'flat'},forSale:[],offers:[],boost:{},owed:0,rep:3,ach:['first_tree'],stats:{deliv:12345,run_fell:4},log:[],ph:[],last:Date.now()};
 let dom=mk({'timberline-v2':JSON.stringify(old)}); await sleep(300);
 let w=dom.window,d=w.document;
 const keyS=()=>JSON.parse(w.localStorage.getItem('timberline-v2')||'null');
 ok(d.getElementById('rbRun').textContent==='Outpost 1','old save loads as Outpost 1');
 ok(/12\.3K/.test(d.getElementById('runStats').textContent),'old save delivered carried into run stats');
 ok(d.title==='Outpost Company' && /Outpost Company/.test(d.querySelector('.brand h1').textContent),'re-theme: title and brand are Outpost Company');
 ok(/Charter Shares/.test(d.getElementById('legacyPanel').textContent) && !/Timberline/.test(d.body.textContent),'re-theme: Charter Shares wording, no Timberline left');
 // M2: the prototype stays one self-contained file and runs on the inlined packages/core bundle
 ok(!/<script[^>]*\ssrc=/.test(html) && d.querySelectorAll('script#outpost-core').length===1,'single file: core inlined, no external scripts');
 ok(w.Core && Object.isFrozen(w.Core.EQUIPMENT) && w.Core.marketPrice(0)===1+0.18*Math.sin(1),'window.Core exposes frozen content and formulas');
 ok(d.querySelectorAll('#eq .row').length===w.Core.EQUIPMENT.length && /Play 1 skid game/.test(d.getElementById('upgs').textContent),'equipment and improvement panels built from Core data');
 dom.window.close();

 // 2. fresh game: drive the felling game with pointer events
 dom=mk(); await sleep(300); w=dom.window; d=w.document;
 // Record every toast as it is added: toasts expire after 4.5s and are capped at 4, so reading the DOM later races them.
 const seenToasts=[]; new w.MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>seenToasts.push(n.textContent)))).observe(d.getElementById('toasts'),{childList:true});
 const g=[...d.querySelectorAll('#chain .act.game')];
 g[0].click(); ok(!d.getElementById('mg').hidden,'felling game opens');
 const cv=d.getElementById('mgCanvas'); const pe=(t)=>cv.dispatchEvent(new w.MouseEvent(t,{bubbles:true,clientX:5,clientY:5}));
 pe('pointerdown'); pe('pointerup');           // aim
 pe('pointerdown'); pe('pointerup');           // arm
 pe('pointerdown'); await sleep(2000); pe('pointerup'); // saw
 await waitFor(()=>/Fell another/.test(d.getElementById('mgBtns').textContent));
 ok(/Fell another/.test(d.getElementById('mgBtns').textContent),'felling run finished: '+d.getElementById('mgStatus').textContent.slice(0,60));
 const db=d.getElementById('draftBtn');
 // toasts wait while a sheet is open (they never cover a mini-game), then show when it closes
 await waitFor(()=>!db.hidden);
 await sleep(0); ok(!seenToasts.some(t=>/Perk ready/.test(t)) && d.getElementById('toasts').childElementCount===0,'no toast over the open mini-game');
 d.getElementById('mgClose').click();
 await waitFor(()=>d.getElementById('mg').hidden);
 await sleep(0);
 // The held queue is flushed newest-first up to the cap (4 desktop), so extra queued toasts from the same run (a perfect-fall achievement,
 // a first find: timing/random dependent) can legitimately push "Perk ready" out. Either it shows, or the cap was filled by newer toasts.
 // The Pick perk button (checked next) is the guaranteed signal.
 ok(seenToasts.some(t=>/Perk ready/.test(t)) || seenToasts.length>=4,'draft toast shown once the mini-game closes (or the toast cap was filled by newer toasts: '+seenToasts.length+')');
 ok(!db.hidden && /Pick perk \(1\)/.test(db.textContent),'draft queued after mini-game: '+db.textContent);
 db.click(); ok(!d.getElementById('draft').hidden,'draft modal opens');
 const cards=[...d.querySelectorAll('#dCards .pcard')]; ok(cards.length===3,'3 cards offered');
 const pid=cards[0].dataset.p; cards[0].click();
 await sleep(250);
 ok(d.getElementById('draft').hidden,'draft modal closes after pick');
 ok(d.getElementById('perks').textContent.length>10 && d.getElementById('rbPerks').textContent==='1','perk listed in active perks ('+pid+')');
 // 3. bucking game via button + Send, and skid quick run through keyboard
 // 4. close camp: fake progress
 const r=JSON.parse(JSON.stringify(keyS()||{}));
 w.eval; // no globals exposed; use saved state reload route
 w.dispatchEvent(new w.Event('pagehide')); const st=keyS(); st.run.deliv=900000; st.stats.deliv=900000; st.cash=12345; st.era=1; st.run.era=1;
 dom.window.close();
 dom=mk({'timberline-v2':JSON.stringify(st)}); await sleep(400); w=dom.window; d=w.document;
 ok(/^14$/.test(d.getElementById("rbLegacy").textContent),'projected legacy shown: '+d.getElementById('rbLegacy').textContent);
 d.getElementById('closeArm').click(); await sleep(250);
 ok(!!d.getElementById('closeYes'),'two-step confirm appears');
 d.getElementById('closeYes').click(); await sleep(300);
 ok(!d.getElementById('newrun').hidden,'new-run modifier modal opens');
 ok(d.getElementById('rbRun').textContent==='Outpost 2','run counter = Outpost 2');
 ok(/^14$/.test(d.getElementById("rbBank").textContent),'legacy banked: '+d.getElementById('rbBank').textContent);
 // achievements rework: "Loaded the ship" (close camp once) pays $500 into the new outpost
ok(/^\$(0|500)$/.test(d.getElementById('lsCashV').textContent),'cash reset (top bar): '+d.getElementById('lsCashV').textContent);
 ok(/Cove woodlot/.test(d.getElementById('tName').textContent),'fresh cove woodlot');
 // pick modifiers
 const mods=[...d.querySelectorAll('#nrMods .modb')]; ok(mods.length===3,'3 modifiers');
 mods[1].click(); d.querySelector('#nrMods [data-m="beetle"]').click();
 ok(/1\.56/.test(d.getElementById('nrStart').textContent),'modifier multiplier shown: '+d.getElementById('nrStart').textContent);
 d.getElementById('nrStart').click(); await sleep(250);
 ok(d.getElementById('newrun').hidden,'run started');
 ok(/Dividends due/.test(d.getElementById('rbMods').textContent)&&/Thin survey/.test(d.getElementById('rbMods').textContent),'modifiers shown in run bar');
 // buy meta node
 const buy=d.querySelector('#metaList [data-meta="sled"]'); ok(buy && !buy.disabled,'meta node affordable');
 buy.click(); await sleep(250);
 ok(/Owned/.test(d.getElementById('metaList').textContent),'meta node owned');
 const s2=JSON.parse(w.localStorage.getItem('timberline-v2')); // may be stale until save; force pagehide
 w.dispatchEvent(new w.Event('pagehide'));
 const s3=JSON.parse(w.localStorage.getItem('timberline-v2'));
 ok(s3.meta.nodes.includes('sled') && s3.meta.legacy===14-5 && s3.run.mods.length===2 && s3.v===2,'saved meta+mods, v=2');
 ok(s3.ach.length>0 && s3.upg.includes !== undefined,'achievements kept');
 // skid game smoke with 4-log perk absent: just open + choose + keys
 dom.window.close();
 await sleep(100);
 ok(errs.length===0,'no console errors'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
 console.log(fails?`${fails} FAILED`:'ALL PASS'); process.exit(fails?1:0);
})();
