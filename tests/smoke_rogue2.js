// drives buck/skid/haul/fell games with rule-changing perks injected through a save
const {JSDOM, VirtualConsole}=require('jsdom');const fs=require('fs');
const errs=[]; const vc=new VirtualConsole(); vc.on('error',e=>errs.push(String(e&&e.stack||e))); vc.on('jsdomError',e=>errs.push('jsdom:'+e.message));
const html=fs.readFileSync(__dirname+'/../prototype/timberline.html','utf8');
const mk=(store)=>new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,url:'https://x.test/',beforeParse(w){
  if(store) for(const k in store) w.localStorage.setItem(k,store[k]);
  w.HTMLCanvasElement.prototype.getContext=function(){return new Proxy({},{get:(t,p)=>p==='measureText'?()=>({width:10}):p in t?t[p]:()=>{},set:(t,p,v)=>(t[p]=v,true)});};
  w.addEventListener('error',e=>errs.push('win:'+e.message));}});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let fails=0; const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m); if(!c) fails++;};
(async()=>{
 let dom=mk(); await sleep(300); let w=dom.window; w.dispatchEvent(new w.Event('pagehide'));
 const st=JSON.parse(w.localStorage.getItem('timberline-v2')); dom.window.close();
 st.stems={bf:5000,val:1000}; st.cut={bf:5000,val:1000}; st.landing={bf:8000,val:1600}; st.season=3; st.st=0;
 st.run.perks=['four','iceking','scaler','hotsaw','domino','widow','daredevil','swamp','neck','strict']; st.last=Date.now();
 dom=mk({'timberline-v2':JSON.stringify(st)}); await sleep(300); w=dom.window; const d=w.document;
 const kd=(c,t='keydown')=>w.dispatchEvent(new w.KeyboardEvent(t,{code:c,key:c,bubbles:true}));
 const g=[...d.querySelectorAll('#chain .act.game')];
 ok(d.querySelectorAll('#perks .perk').length===10,'10 perks listed');
 // buck
 g[1].click(); [...d.querySelectorAll('#mgBtns button')].find(b=>/Send/.test(b.textContent)).click();
 ok(/You got/.test(d.getElementById('mgStatus').textContent),'buck run: '+d.getElementById('mgStatus').textContent.slice(0,70));
 d.getElementById('mgClose').click();
 // skid with 4-log turn
 g[2].click(); const four=[...d.querySelectorAll('#mgBtns button')].find(b=>/4 logs/.test(b.textContent));
 ok(!!four,'4-log turn offered by Four-log turns'); four.click();
 kd('ArrowDown'); for(let i=0;i<240 && !/Landed/.test(d.getElementById('mgStatus').textContent);i++) await sleep(500); kd('ArrowDown','keyup');
 ok(/Landed a \d+-log turn/.test(d.getElementById('mgStatus').textContent),'skid run: '+d.getElementById('mgStatus').textContent.slice(0,70));
 d.getElementById('mgClose').click();
 // haul in winter with ice road king
 g[3].click(); ok(/Logging sled|logs on/.test(d.getElementById('mgStatus').textContent),'haul load: '+d.getElementById('mgStatus').textContent.slice(0,90));
 [...d.querySelectorAll('#mgBtns button')].find(b=>b.textContent.startsWith('Head')).click();
 kd('ArrowRight'); await sleep(16000); kd('ArrowRight','keyup');
 ok(/Delivered|Lost/.test(d.getElementById('mgStatus').textContent),'haul run: '+d.getElementById('mgStatus').textContent.slice(0,90));
 d.getElementById('mgClose').click();
 await sleep(300);
 ok(!d.getElementById('draftBtn').hidden,'drafts queued: '+d.getElementById('draftBtn').textContent);
 // reroll disabled with 0 rerolls, Later closes, Escape closes
 d.getElementById('draftBtn').click(); ok(d.getElementById('dReroll').disabled,'reroll disabled with none left');
 w.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true})); await sleep(100);
 ok(d.getElementById('draft').hidden,'Escape closes draft, queue kept: '+d.getElementById('draftBtn').textContent);
 // phone width: no element wider than viewport is hard to test in jsdom; check the run bar exists
 ok(!!d.getElementById('runbar'),'run bar present');
 await sleep(200);
 ok(errs.length===0,'no console errors'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
 console.log(fails?`${fails} FAILED`:'ALL PASS'); process.exit(fails?1:0);
})();
