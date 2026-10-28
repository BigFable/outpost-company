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

 ok(errs.length===0,'no console errors '+errs.slice(0,3).join(' | '));
 console.log(fails?fails+' FAILED':'ALL PASS'); process.exit(fails?1:0);
})();
