// Round 2 balance fixes (owner, 2026-10-24): a push inland always lists a tract at or under half the push price
// (Steam Camp cash trap), the 2M bd ft delivery achievement (d2m), and haul bonuses trimmed to about 60%.
const {JSDOM, VirtualConsole}=require('jsdom');const fs=require('fs');
const errs=[]; const vc=new VirtualConsole(); vc.on('error',e=>errs.push(String(e&&e.stack||e))); vc.on('jsdomError',e=>errs.push('jsdom:'+e.message));
const START="window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});";
const src=fs.readFileSync(__dirname+'/../prototype/timberline.html','utf8');
if(!src.includes(START)) throw new Error('start line not found');
const html=src.replace(START,'window.__eval = s => eval(s); '+START);
const mk=(store)=>new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,url:'https://x.test/',beforeParse(w){
  if(store) for(const k in store) w.localStorage.setItem(k,store[k]);
  w.HTMLCanvasElement.prototype.getContext=function(){return new Proxy({},{get:(t,p)=>p==='measureText'?()=>({width:10}):p in t?t[p]:()=>{},set:(t,p,v)=>(t[p]=v,true)});};
  w.addEventListener('error',e=>errs.push('win:'+e.message));}});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let fails=0; const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m); if(!c) fails++;};
(async()=>{
 const dom=mk(); await sleep(300); const w=dom.window, d=w.document, E=s=>w.__eval(s);
 const cheapest=()=>E('cheapestSale()');

 // 1. Steam Camp push through the company tab button: always an affordable tract (many tries, real Math.random)
 let worst=0, tries=60;
 for(let i=0;i<tries;i++){
   E(`S.era=0; S.cash=eraCost(1); S.tracts=[]; render(true);`);
   d.getElementById('eraBuy').click();
   if(E('S.era')!==1){ ok(false,'push to Steam Camp did not happen'); break; }
   worst=Math.max(worst, cheapest());
 }
 ok(worst<=7500,`every Steam Camp push lists a tract at or under $7,500 (worst cheapest of ${tries}: $${worst})`);
 const shown=[...d.querySelectorAll('#sales .row.lot:not(.afk) button[data-i]')].length; // plus at most one AFK lot (cutover), on its own stream
 ok(shown===3,'land office still shows three regular listings: '+shown);
 // the 3-minute board refresh keeps the guarantee
 let worstR=0; for(let i=0;i<60;i++){ E(`S.saleT=0; tick(0.5);`); worstR=Math.max(worstR, cheapest()); }
 ok(worstR<=7500,'refreshed boards at Steam Camp keep a tract at or under $7,500: $'+worstR);
 // buying the cheap one: the replacement keeps the guarantee
 let worstB=0; for(let i=0;i<40;i++){ E(`refreshSales(); S.tracts=[]; S.cash=1e6;`); const j=E(`S.forSale.indexOf(S.forSale.reduce((a,t)=>t.price<a.price?t:a))`); E(`buyTract(${j})`); worstB=Math.max(worstB, cheapest()); }
 ok(worstB<=7500,'after buying the cheap listing the board still has one at or under $7,500: $'+worstB);
 // the cove (no push yet) is unchanged: no cap applied
 E('S.era=0'); ok(E('saleCap()')===undefined,'no listing cap at the cove');
 // a Diesel Road push uses the same rule (half of its price)
 E(`S.era=2; refreshSales();`); ok(cheapest()<=E('eraCost(2)')/2,'Diesel Road board has a tract at or under half its push price');

 // 2. d2m between d1m and d3m, pays $10K
 const ids=E('ACH.map(a=>a.id)');
 ok(ids.indexOf('d1m')<ids.indexOf('d2m') && ids.indexOf('d2m')<ids.indexOf('d3m'),'d2m sits between d1m and d3m');
 E(`S.ach=ACH.map(a=>a.id).filter(id=>id!=='d2m'&&id!=='d3m'); S.stats.deliv=2e6; S.cash=0; S.run.bounty=[]; S.run.bountyPaid=0;`);
 E('checkAch(true)');
 ok(E(`S.ach.includes('d2m')`) && !E(`S.ach.includes('d3m')`),'delivering 2M bd ft earns d2m only');
 ok(E('S.cash')>=10000,'d2m pays $10K: cash '+E('S.cash'));

 // 3. haul: the load screen and end ticket show the new caps
 E(`closeMG(); S.season=1; S.landing={bf:1e6, val:2e5}; S.upg=[]; S.run.perks=[]; openMG('haul'); cancelAnimationFrame(MG.raf);`);
 const st=()=>d.getElementById('mgStatus').textContent;
 ok(/Full load: \+15% pay/.test(st()) && /Lose nothing: \+10%\. Beat the target: \+6 to \+18%/.test(st()),'load screen states +15% full load, +10% whole, +6 to +18% under par: '+st().slice(-120));
 E(`H.n=Math.max(1,H.limit-3); haulLoadUI();`); ok(/A full load pays up to \+15%/.test(st()),'part load: full load pays up to +15%');
 E(`H.n=H.limit; haulLoadUI(); haulGo(); let i=0; while(H.phase==='drive' && i++<40000){ const c=Core.haulPolicy(H.rules.phys,H.v,Core.haulGrade(H.track,H.x)); MG.keys.ArrowRight=c.gas; MG.keys.ArrowLeft=c.brk; haulStep(1/60);} MG.keys={};`);
 const m=st().match(/Beat target \+(\d+)%/);
 ok(/Full load \+15%/.test(st()) && m && +m[1]>=6 && +m[1]<=18,'end ticket: full load +15%, under par within +6 to +18%: '+(m&&m[1]));

 await sleep(100);
 ok(errs.length===0,'no console errors'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
 console.log(fails?`${fails} FAILED`:'ALL PASS'); process.exit(fails?1:0);
})();
