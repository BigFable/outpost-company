// Plain-language pass (2026-10-25, docs/style/plain-language.md): common tree names on screen with the save ids unchanged,
// no keyboard or mouse words anywhere a player reads (page, mini-game help and status lines, canvas text), and short buttons.
const {JSDOM, VirtualConsole}=require('jsdom');const fs=require('fs');
const errs=[]; const vc=new VirtualConsole(); vc.on('error',e=>errs.push(String(e&&e.stack||e))); vc.on('jsdomError',e=>errs.push('jsdom:'+e.message));
const START="window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});";
const src=fs.readFileSync(__dirname+'/../prototype/timberline.html','utf8');
if(!src.includes(START)) throw new Error('start line not found');
const html=src.replace(START,'window.__eval = s => eval(s); '+START);
// every string drawn on a mini-game canvas
const drawn=new Set();
const mk=(store)=>new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,url:'https://x.test/',beforeParse(w){
  if(store) for(const k in store) w.localStorage.setItem(k,store[k]);
  w.HTMLCanvasElement.prototype.getContext=function(){return new Proxy({},{get:(t,p)=>p==='measureText'?()=>({width:10}):p==='fillText'?(s=>drawn.add(String(s))):p in t?t[p]:()=>{},set:(t,p,v)=>(t[p]=v,true)});};
  w.addEventListener('error',e=>errs.push('win:'+e.message));}});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let fails=0; const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m); if(!c) fails++;};
// words that assume a keyboard or a mouse
// ("tap or click" is the device-neutral phrase the style guide allows)
const DEVICE_RE=/\b(press(ing)?|space ?bar|arrow keys?|mouse|right-click|click(ing)?|keyboard|enter key)\b|\((T|Space)\)|← \/ A/i;
const DEVICE={test:t=>DEVICE_RE.test(String(t).replace(/tap or click/gi,'tap'))};
// a button: at most 2 words once numbers, money, units, states and counts are dropped
const visible=d=>{ const b=d.body.cloneNode(true); b.querySelectorAll('script,style').forEach(x=>x.remove()); return b.textContent; };
const words=t=>t.replace(/\(.*?\)/g,' ').split(/[:·]/)[0].replace(/[−+]?\$?[\d.,]+[KMB]?/g,' ').replace(/\bbd ft\b|\bshares?\b|[×…▲▼⠿?%/]/g,' ').trim().split(/\s+/).filter(Boolean);
(async()=>{
 const dom=mk(); await sleep(300); const w=dom.window, d=w.document, E=s=>w.__eval(s);

 // 1. tree names: common names on screen, ids unchanged
 const names=E(`JSON.stringify(Object.fromEntries(Object.entries(Core.SPECIES).map(([k,v])=>[k,v.name])))`);
 ok(names===JSON.stringify({pine:'Pine',spruce:'Spruce',hemlock:'Hemlock',maple:'Maple',oak:'Oak',cloudwood:'Redwood'}),'species display names: '+names);
 ok(E(`Core.speciesId('walnut')`)==='cloudwood','old save id walnut still maps to cloudwood');
 ok(!/Fogbound pine|Shore spruce|Mist hemlock|Glacier maple|Hot-spring oak|cloudwood/i.test(visible(d)),'no old tree names on the page');

 // 2. a save from before the pass (old ids) shows the new names
 E(`S.tracts[0].mix=[['walnut',3],['pine',1]]; S.vis='walnut'; save();`);
 const st=w.localStorage.getItem('timberline-v2'); dom.window.close();
 const dom2=mk({'timberline-v2':st}); await sleep(300); const w2=dom2.window, d2=w2.document, E2=s=>w2.__eval(s);
 ok(E2('S.vis')==='cloudwood' && d2.getElementById('fTree').textContent==='Redwood' && /Redwood 75%/.test(d2.getElementById('tMeta').textContent),'old save: id kept as cloudwood, shown as Redwood: '+d2.getElementById('tMeta').textContent);

 // 3. every mini-game's help, status, buttons and canvas text, with no keyboard or mouse words
 E2(`S.cash=1e6; S.stems={bf:5000,val:2000}; S.cut={bf:5000,val:2000}; S.landing={bf:5000,val:2000}; openSawmill(true); S.bank['logging.prime_spar']=3; S.bulk.logs=1e5; render(true);`);
 const seen=[]; const btns=[];
 const grab=()=>{ seen.push($2('mgHelp').textContent, $2('mgStatus').textContent, $2('mgGear').textContent, $2('mgPeek').textContent, $2('mgGuide').textContent);
   d2.querySelectorAll('#mgBtns button').forEach(b=>btns.push(b.textContent)); E2('frame(performance.now())'); };
 const $2=id=>d2.getElementById(id);
 for(const k of ['fell','buck','skid','haul','saw']){
   E2(`openMG('${k}')`); grab();
   if(k==='fell'){ E2('fellPress()'); grab(); E2('F.hinge=.15; fellResolve(); fellFinish()'); grab(); }
   if(k==='buck'){ E2('B.hover={x:300,y:120}; buckPeek(); buckHint(); buckSend()'); grab(); }
   if(k==='skid'){ d2.querySelectorAll('#mgBtns button')[0].click(); grab(); E2('K.pos.y=K.WH; skidStep(.02)'); grab(); }
   if(k==='haul'){ E2('haulGo()'); grab(); E2('H.t=1; haulDraw(); H.x=H.L; haulStep(.02)'); grab(); }
   if(k==='saw'){ E2('sawPick(0); sawSaw(); sawTurn()'); grab(); E2('sawFinish(false)'); grab(); }
   E2('closeMG()');
 }
 const bad=[...new Set(seen.filter(t=>DEVICE.test(t)).concat([...drawn].filter(t=>DEVICE.test(t))))];
 ok(bad.length===0,'mini-game text names no keys or mouse buttons'+(bad.length?': '+bad.slice(0,3).join(' | '):''));
 ok(drawn.has('BRAKE') && drawn.has('hold to brake'),'the haul brake pedal says hold, not a key');

 // 4. the page itself, logging and sawmill views
 E2(`render(true)`); const logTxt=visible(d2);
 E2(`setCamp('sawmill')`); const millTxt=visible(d2); E2(`setCamp('logging')`);
 const m=(logTxt+' '+millTxt).replace(/tap or click/gi,'tap').match(DEVICE_RE);
 ok(!m,'page text names no keys or mouse buttons'+(m?': '+m[0]:''));

 // 5. buttons stay at two words (numbers, money and on/off states aside)
 E2(`render(true)`);
 const sel='button.act, button.buy, button.mbtn, button.closeb, button.sellb, #qMode button, .qbtns button, #buyN button, #whTabs button, .draftbtn, .linkbtn';
 const page=[...d2.querySelectorAll(sel)].map(b=>b.textContent).filter(t=>t.trim());
 const E3=E2(`setCamp('sawmill'), [...document.querySelectorAll(${JSON.stringify(sel)})].map(b=>b.textContent).filter(t=>t.trim())`);
 const long=[...page, ...E3, ...btns].filter(t=>words(t).length>2);
 ok(long.length===0,'every button is 2 words or fewer'+(long.length?': '+[...new Set(long)].slice(0,6).join(' | '):''));
 ok(['Fell tree','Cut logs','Skid logs','Drive load','Saw boards'].every(t=>E2('Object.values(GAMES)').includes(t)),'mini-game buttons: Fell tree, Cut logs, Skid logs, Drive load, Saw boards');
 dom2.window.close();

 await sleep(100);
 ok(errs.length===0,'no console errors'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
 console.log(fails?`${fails} FAILED`:'ALL PASS'); process.exit(fails?1:0);
})();
