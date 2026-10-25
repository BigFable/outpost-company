// Phone build (jsdom part): viewport meta, toasts wait while a sheet is open, the save backup (copy as text, validate,
// confirm, load), and touch bucking (first tap previews, second tap on the same spot cuts). Layout, tap sizes and
// touch-driven runs of every mini-game are checked in a real Chromium by tests/phone/phone_smoke.cjs (pnpm run test:phone).
const {JSDOM, VirtualConsole}=require('jsdom');const fs=require('fs');
const errs=[]; const vc=new VirtualConsole(); vc.on('error',e=>errs.push(String(e&&e.stack||e))); vc.on('jsdomError',e=>errs.push('jsdom:'+e.message));
const START="window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});";
const src=fs.readFileSync(__dirname+'/../prototype/timberline.html','utf8');
if(!src.includes(START)) throw new Error('start line not found');
const html=src.replace(START,'window.__eval = s => eval(s); '+START);
const mk=()=>new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,url:'https://x.test/',beforeParse(w){
  w.HTMLCanvasElement.prototype.getContext=function(){return new Proxy({},{get:(t,p)=>p==='measureText'?()=>({width:10}):p in t?t[p]:()=>{},set:(t,p,v)=>(t[p]=v,true)});};
  w.HTMLCanvasElement.prototype.getBoundingClientRect=function(){return {left:0,top:0,right:640,bottom:400,width:640,height:400,x:0,y:0};};
  w.addEventListener('error',e=>errs.push('win:'+e.message));}});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let fails=0; const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m); if(!c) fails++;};
(async()=>{
 const dom=mk(); await sleep(300); const w=dom.window, d=w.document, E=s=>w.__eval(s), $=id=>d.getElementById(id);
 ok(/width=device-width/.test((d.querySelector('meta[name=viewport]')||{}).content||''),'viewport meta for phones');
 // toasts
 E(`openWh('stock'); toast({name:'Queued', line:'x'})`); await sleep(0);
 ok($('toasts').childElementCount===0,'no toast while a sheet is open');
 $('whClose').click(); await sleep(0);
 ok(/Queued/.test($('toasts').textContent),'the toast shows once the sheet closes');
 // save backup
 E(`S.cash = 4321`); E(`openWh('ledger')`);
 ok(!!$('svCopy') && !!$('svIn') && !!$('svLoad'),'save backup in the warehouse ledger');
 const txt=E('saveText()'); ok(/^OUTPOST-SAVE:/.test(txt),'save as text');
 const bad=s=>{ try { E(`readSaveText(${JSON.stringify(s)})`); return ''; } catch(e){ return e.message; } };
 ok(/not an Outpost Company save/.test(bad('hello')) && /damaged/.test(bad(txt.slice(0,80))) && /Paste a save/.test(bad('  ')) && /not an Outpost/.test(bad('{"v":1}')),'junk, cut-short, empty and wrong-version saves are refused with a message');
 ok(E(`readSaveText(${JSON.stringify(txt)}).cash`)===4321 && E(`readSaveText(${JSON.stringify(JSON.stringify({...JSON.parse(w.localStorage.getItem('timberline-v2')),cash:9}))}).cash`)===9,'tagged text and raw JSON both read');
 E(`S.cash = 5`);
 $('svIn').value=txt; $('svLoad').click();
 ok(E('S.cash')<100 && /Press again/.test($('svMsg').textContent) && $('svLoad').textContent==='Replace company','first press asks to confirm');
 $('svLoad').click();
 ok(E('S.cash')>=4321 && /Save loaded/.test($('svMsg').textContent),'second press loads the save');
 $('whClose').click();
 // touch bucking
 E(`S.stems.bf = 5000; S.stems.val = 5000; S.ui.buckIntro = true; openMG('buck'); cancelAnimationFrame(MG.raf); B.cuts = []`);
 const cv=$('mgCanvas'), L=E('B.L');
 const pe=(type,x,pt)=>{ const e=new w.MouseEvent(type,{bubbles:true,cancelable:true,clientX:x,clientY:120,button:0}); Object.defineProperty(e,'pointerType',{value:pt}); cv.dispatchEvent(e); };
 const tap=(x,pt='touch')=>{ pe('pointerdown',x,pt); pe('pointerup',x,pt); };
 const x16=40+16*560/L, x30=40+30*560/L;
 tap(x16); ok(E('B.cuts.length')===0 && /At 16 ft/.test($('mgPeek').textContent) && /Tap again/.test($('mgPeek').textContent),'touch: first tap previews without cutting');
 tap(x30); ok(E('B.cuts.length')===0 && /At 30 ft/.test($('mgPeek').textContent),'touch: a tap elsewhere moves the preview');
 tap(x30+2); ok(E('JSON.stringify(B.cuts)')==='[30]','touch: a second tap on the same spot cuts');
 tap(x30+2); ok(E('B.cuts.length')===0,'touch: tapping the cut again takes it out');
 tap(x16,'mouse'); ok(E('JSON.stringify(B.cuts)')==='[16]','mouse clicks still cut at once');
 E('closeMG()');
 ok(errs.length===0,'no console errors'+(errs.length?': '+errs.join(' | '):''));
 dom.window.close();
 console.log(fails?`${fails} FAILED`:'ALL PASS'); process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
