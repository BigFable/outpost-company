// Adversarial fuzz: random actions + invariants. Usage: node fuzz.js <seed> <steps>
const {mk}=require('./_h');
let seed=+process.argv[2]||1, steps=+process.argv[3]||400;
const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}; const ri=(a,b)=>Math.floor(a+rnd()*(b-a+1)); const pick=a=>a[Math.floor(rnd()*a.length)];
const bad=[];
(async()=>{
 const g=await mk(null,{wait:200}); const {E,errs,clock,w}=g;
 // deterministic Math.random inside the page
 let x=seed|1; w.Math.random=()=>{x=(x*9301+49297)%233280;return x/233280;};
 const inv=(tag)=>{
  const r=E(`(()=>{const o=[];const chk=(n,v,neg)=>{if(typeof v!=='number'||!isFinite(v))o.push(n+'='+v);else if(!neg&&v<-1e-6)o.push(n+' negative '+v);};
   chk('cash',S.cash);chk('owed',S.owed);for(const p of ['stems','cut','landing']){chk(p+'.bf',S[p].bf);chk(p+'.val',S[p].val);}
   chk('bulk',S.bulk.logs);chk('meta',S.meta.legacy);for(const k in S.bank)chk('bank.'+k,S.bank[k]);
   if(S.camps.sawmill){const m=S.camps.sawmill;chk('mill.cash',m.cash);for(const g in m.yard)chk('yard.'+g,m.yard[g]);chk('mill.sawn',m.sawn);}
   chk('shares',S.shares.sawmill.legacy);chk('ema',S.ema,1);chk('t',S.t);chk('st',S.st);
   if(S.st>=SEASON_LEN+1e-6)o.push('st>=SEASON_LEN '+S.st);
   if(S.landing.bf>0&&!(S.landing.val>=0))o.push('landing val');
   if(S.run.dq.length!==S.run.drafts)o.push('drafts mismatch');
   if(S.weather.cur&&!Core.eventDef(S.weather.cur.id))o.push('bad cur');
   return o;})()`);
  if(r.length) bad.push(tag+': '+JSON.stringify(r)+' prev='+log.slice(-4).join(',')+' cashnow='+E('S.cash'));
 };
 const eqs=E('EQ.map(e=>e.id)');
 const log=[];
 for(let i=0;i<steps;i++){
  const a=ri(0,17); let name='';
  try{
   if(a<=3){ const dt=pick([.1,1,5,5,5]); name='tick '+dt; E(`for(let i=0;i<${ri(1,60)};i++)tick(${dt})`);}
   else if(a===4){ const id=pick(eqs); name='buy '+id; E(`S.cash+=${ri(0,50000)};S.ui.buyN=${JSON.stringify(pick([1,10,25,'max']))};buyEq(EQ.find(e=>e.id==='${id}'))`);}
   else if(a===5){ name='sellEq'; E(`(()=>{const e=EQ.find(e=>own(e.id)>0); if(e){S.own[e.id]--;S.cash+=Math.floor(eqCost(e)*.5);}})()`);}
   else if(a===6){ name='tract'; E(`S.cash+=1e5;buyTract(${ri(0,2)});`); if(rnd()<.5)E('if(tract()&&tract().roadCost)buildRoad()');}
   else if(a===7){ name='offline'; const s=pick([60,300,7200,28800]); clock.now+=s*1000; E(`S.last=Date.now()-${s*1000}; offline()`);}
   else if(a===8){ name='draft'; E(`queueDraft(${rnd()},'x'); (()=>{const o=currentOffer('logging'); if(o) pickPerk(pick(o))})()`.replace('pick(o)','o[Math.floor(Math.random()*o.length)]'));}
   else if(a===9){ name='mg:'; const k=pick(['fell','buck','skid','haul','saw']); name+=k;
     E(`openMG('${k}'); if(MG.raf) cancelAnimationFrame(MG.raf);`);
     if(E('MG.kind')){
      if(k==='fell') E(`F.phase='fall'; F.out={k:'${pick(['perfect','good','hung','broke','chair'])}',m:1.1,text:''}; fellFinish(); closeMG()`);
      if(k==='buck') E(`B.cuts=[${ri(2,9)},${ri(10,19)}]; buckSend(); closeMG()`);
      if(k==='skid') E(`K.logs=${ri(1,5)};K.phase='run';K.par=${ri(10,200)};K.t=${ri(1,300)};K.hits=${ri(0,6)}; skidFinish(); closeMG()`);
      if(k==='haul') E(`haulGo(); H.car.x=H.L; for(let i=0;i<${ri(0,3)};i++)H.car.spill=${ri(0,3)}; haulSync(); H.t=${ri(1,200)}; haulFinish(); closeMG()`);
      if(k==='saw') E(`(()=>{sawPick(${ri(0,2)}); if(W&&W.phase==='saw'){ for(let i=0;i<${ri(0,12)};i++){W.busy=0; if(Math.random()<.4)sawTurn(); else {sawSaw(); if(W.phase!=='saw')break;}} W.busy=0; if(W.phase==='saw')sawFinish(Math.random()<.3);} closeMG();})()`);
     } }
   else if(a===10){ name='closeCamp'; E(`S.run.deliv=Math.max(S.run.deliv,Core.CLOSE_VOL+1); S.run.setup&&startRun([]); if(canClose()){closeCamp(); S.run.setup&&startRun([]);}`);}
   else if(a===11){ name='warehouse'; E(`(()=>{const ids=Object.keys(S.bank); if(!ids.length)return; const id=ids[Math.floor(Math.random()*ids.length)]; const r=Math.random(); if(r<.3)sellItem(id,Math.floor(Math.random()*5)); else if(r<.5){const i=S.locks.indexOf(id); if(i<0)S.locks.push(id); else S.locks.splice(i,1);} else if(r<.75)sellSurplus(); else {S.orders.open.slice().forEach(o=>handIn(o.id,false));} })()`);}
   else if(a===12){ name='items'; E(`addItem(Core.ITEMS[Math.floor(Math.random()*Core.ITEMS.length)].id, ${ri(1,6)})`);}
   else if(a===13){ name='mill'; E(`S.cash+=1e5; if(S.camps.sawmill){const m=S.camps.sawmill; m.cash+=1e4; hireSawyer(); Core.STRUCTURES.filter(d=>d.target==='sawmill').forEach(d=>{S.bank[Core.structureNext(S.structures,d.id)?.items?.[0]?.item]=5; buildStructure(d.id);}); if(Math.random()<.3){m.sawn=Core.MILL_CLOSE_BF+1; closeMill();} S.millShare=Math.random()*.6; }`);}
   else if(a===14){ name='contract'; E(`if(S.offers.length)accept(0); if(S.hireOffer&&!hireActive())acceptHire()`);}
   else if(a===15){ name='save/reload'; E('save()'); const st=w.localStorage.getItem('timberline-v2'); JSON.parse(st); /* parse ok */ }
   else if(a===16){ name='weather'; E(`S.weather.cur={id:'${pick(E('Core.SEASON_EVENTS.map(e=>e.id)'))}',t0:S.t-S.st,cleared:[],fired:false,guarded:false,when:'x'}; ${rnd()<.5?"S.cash=1e7;":"S.cash=0;"}`);}
   else { name='perk'; E(`S.run.perks.push('${pick(['illwind','stormseason','greased','domino','hotsaw','swamp','iceking','neck','golden','absentee','store'])}')`);}
  }catch(e){ bad.push('EXC at step '+i+' '+name+': '+e.message.slice(0,200)+' '+(e.stack||'').split('\n')[1]); }
  log.push(name);
  inv('step '+i+' '+name);
  if(bad.length>6) break;
 }
 E('render(true)');
 console.log('seed',process.argv[2],'bad',bad.length?bad.slice(0,6):'none','errs',errs.slice(0,3).map(s=>s.slice(0,200)));
})();
