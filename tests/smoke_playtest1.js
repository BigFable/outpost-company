// Playtest 1 (2026-10-24): bucking guide, segment preview, Suggest a cut and its cost, the bucking exploit fixes,
// Greased runners, huge skid turns, and the equipment buy multiplier.
const {JSDOM, VirtualConsole}=require('jsdom');const fs=require('fs');
const errs=[]; const vc=new VirtualConsole(); vc.on('error',e=>errs.push(String(e&&e.stack||e))); vc.on('jsdomError',e=>errs.push('jsdom:'+e.message));
const START="window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});";
const src=fs.readFileSync(__dirname+'/../prototype/timberline.html','utf8');
if(!src.includes(START)) throw new Error('start line not found');
const html=src.replace(START,'window.__eval = s => eval(s); '+START);
const mk=(store,seed)=>new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,url:'https://x.test/',beforeParse(w){
  if(store) for(const k in store) w.localStorage.setItem(k,store[k]);
  if(seed){ let x=seed; w.Math.random=()=>{ x=(x*9301+49297)%233280; return x/233280; }; }
  w.HTMLCanvasElement.prototype.getContext=function(){return new Proxy({},{get:(t,p)=>p==='measureText'?()=>({width:10}):p in t?t[p]:()=>{},set:(t,p,v)=>(t[p]=v,true)});};
  w.addEventListener('error',e=>errs.push('win:'+e.message));}});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let fails=0; const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m); if(!c) fails++;};
const btn=(d,re)=>[...d.querySelectorAll('#mgBtns button')].find(b=>re.test(b.textContent));
async function baseSave(){ const dom=mk(); await sleep(300); const w=dom.window; w.dispatchEvent(new w.Event('pagehide'));
  const st=JSON.parse(w.localStorage.getItem('timberline-v2')); dom.window.close(); st.last=Date.now(); return st; }
(async()=>{
 const base=await baseSave();
 // ---------- 1. bucking: first-time guide, preview, hint, exploit fixes
 let st=JSON.parse(JSON.stringify(base)); st.stems={bf:1e6,val:2e5};
 let dom=mk({'timberline-v2':JSON.stringify(st)},7); await sleep(300); let w=dom.window, d=w.document, E=s=>w.__eval(s);
 ok(E('S.ui.buckGuide')===true && E('S.ui.buckIntro')===false,'new company: bucking guides on, guide card not yet seen');
 const g=()=>[...d.querySelectorAll('#chain .act.game')];
 g()[1].click();
 ok(!d.getElementById('mgGuide').hidden && /8, 10, 12, 14 or 16 ft/.test(d.getElementById('mgGuide').textContent),'first bucking run shows the 3-step guide');
 ok(d.querySelectorAll('#mgGuide li:not(.sprules)').length===3 && d.querySelectorAll('#mgGuide li.sprules').length===1 && !d.getElementById('mgGuideBtn').hidden,'guide has 3 steps, the species rules and a ? button');
 d.getElementById('mgGuideOk').click();
 ok(d.getElementById('mgGuide').hidden && E('S.ui.buckIntro')===true,'Got it dismisses the guide and remembers it');
 d.getElementById('mgGuideBtn').click(); ok(!d.getElementById('mgGuide').hidden,'? shows the guide again'); d.getElementById('mgGuideBtn').click();
 ok(d.getElementById('mgGuide').hidden,'? hides it again');
 // preview by keyboard on the canvas
 const cv=d.getElementById('mgCanvas'); const key=(code,o={})=>cv.dispatchEvent(new w.KeyboardEvent('keydown',{code,key:code,bubbles:true,...o}));
 const goTo=ft=>{ for(let i=0;i<80;i++) key('ArrowLeft'); for(let i=1;i<ft;i++) key('ArrowRight'); };
 const peek=()=>d.getElementById('mgPeek').textContent;
 goTo(5); ok(/At 5 ft: a 5 ft piece from the base, pulp \((too short|rot)\), worth \$/.test(peek()),'preview names pulp and why: '+peek());
 const L=E('B.L'); const best=E('B.optPre.cuts.slice()'); const first=best[0];
 goTo(first); const pv=E(`seg(0, ${first})`);
 ok(new RegExp(`At ${first} ft: .*(grade ${pv.g} log|pulp)`).test(peek()) && /worth \$/.test(peek()),'preview names the grade and value of the hovered piece: '+peek());
 // valid-length marks are anchored to the last cut
 key('Enter'); ok(E('B.cuts.length')===1,'Enter places a cut at the cursor');
 key('Enter'); ok(E('B.cuts.length')===0,'Enter again takes it out');
 // exploit fix: closing and reopening keeps the same stem (no free rerolls)
 goTo(first); key('Enter'); d.getElementById('mgClose').click(); g()[1].click();
 ok(E('B.L')===L && E('B.cuts.length')===1 && d.getElementById('mgGuide').hidden,'reopening keeps the unsent stem and its cuts, guide stays dismissed');
 // hints: follow Suggest a cut to the best plan
 E('B.cuts=[]'); let hints=0;
 for(let i=0;i<20;i++){ btn(d,/^Hint$/).click(); const s=d.getElementById('mgStatus').textContent; if(/cuts match the best plan/.test(s)) break; hints++;
   const m=/(cut at|remove the cut at) (\d+) ft/.exec(s); ok(!!m||i>0,'hint says where: '+s.slice(0,60)); if(!m) break; goTo(+m[2]); key('Enter'); }
 btn(d,/^Hint$/).click(); ok(E('B.hints')===hints,'asking again for a plan that matches costs nothing');
 ok(hints===best.length && JSON.stringify(E('B.cuts.slice().sort((a,b)=>a-b)'))===JSON.stringify(best),`hints lead to the best plan (${hints} cuts)`);
 const before={pb:E('S.stats.perfBuck'), rb:E('S.stats.run_buck'), cv:E('S.cut.val'), base:E('B.amt*(S.stems.val/S.stems.bf)*vmult()')};
 btn(d,/Send/).click(); let s=d.getElementById('mgStatus').textContent;
 const want=Math.max(0,100-Math.min(15,3*hints));
 ok(new RegExp(`You got 100% .*−${100-want} for ${hints} hints?: ${want}%`).test(s),'hints reduce the score: '+s.slice(0,110));
 ok(E('S.stats.perfBuck')===before.pb && E('S.stats.run_buck')===before.rb+1,'a hinted plan counts as a run but not as full value');
 // payout: hinted perfect plan pays .5+.7*score, below a self-planned perfect stem
 const paid=(E('S.cut.val')-before.cv)/before.base;
 ok(want<100 && Math.abs(paid-(.5+.7*want/100))<1e-6,`hinted perfect plan pays ×${paid.toFixed(3)} instead of ×1.2 for full value`);
 // exploit fix: an uncut stem sent straight away does not count as a run (no draft or goal farming)
 btn(d,/Cut another/).click(); const p0=E('S.run.prog'), g0=E('S.run.games||0'), r0=E('S.stats.run_buck');
 btn(d,/Send/).click(); s=d.getElementById('mgStatus').textContent;
 ok(/does not count as a run/.test(s) && E('S.stats.run_buck')===r0 && E('S.run.prog')===p0 && E('(S.run.games||0)')===g0,'an uncut stem gives no run, draft progress or goal credit');
 // exploit fix: pulp is priced by volume, so chopping the top into 1 ft pieces adds nothing and the best plan has no slivers
 btn(d,/Cut another/).click();
 const split=E('(()=>{ const a=seg(0,B.L).val; let b=0; for(let i=0;i<B.L;i++) b+=seg(i,i+1).val; return [a,b]; })()');
 ok(Math.abs(split[0]-split[1])<1e-6*split[0],'pulp value is the same however finely it is cut');
 ok(E('(()=>{ const c=[0,...B.optPre.cuts,B.L]; let tops=0; for(let i=1;i<c.length;i++) if(seg(c[i-1],c[i]).why==="top under 8 in") tops++; return tops<=1; })()'),'best plan leaves the top as one pulp piece');
 // exploit fix: Scaler's friend pays a 90% plan as 100% but no longer counts it as full value
 E(`S.run.perks.push('scaler'); B.cuts=B.optPre.cuts.slice(); B.hints=2;`); const pb=E('S.stats.perfBuck');
 btn(d,/Send/).click(); s=d.getElementById('mgStatus').textContent;
 ok(/counted as 100%/.test(s) && E('S.stats.perfBuck')===pb,"Scaler's friend pays 94% as 100% without granting full value");
 btn(d,/Cut another/).click(); E('B.cuts=B.optPre.cuts.slice();'); btn(d,/Send/).click();
 ok(E('S.stats.perfBuck')===pb+1 && /You got 100% of the best/.test(d.getElementById('mgStatus').textContent),'a self-planned perfect stem is still full value');
 // guides toggle
 btn(d,/Cut another/).click(); const gb=d.getElementById('bGuide'); ok(gb && gb.getAttribute('aria-pressed')==='true','Guides toggle shows on');
 gb.click(); ok(E('S.ui.buckGuide')===false && d.getElementById('bGuide').getAttribute('aria-pressed')==='false' && d.activeElement===d.getElementById('bGuide'),'Guides toggle turns off and keeps focus');
 goTo(12); ok(!/grade|pulp/.test(peek()),'with guides off the preview gives only the length');
 d.getElementById('bGuide').click();
 d.getElementById('mgClose').click();
 dom.window.close();

 // ---------- 2. Greased runners and huge skid turns
 st=JSON.parse(JSON.stringify(base)); st.cut={bf:1e6,val:2e5}; st.season=0; st.st=0; st.own={oxen:2};
 dom=mk({'timberline-v2':JSON.stringify(st)}); await sleep(300); w=dom.window; d=w.document; const E2=s=>w.__eval(s);
 ok(E2(`Core.PERKS.find(p=>p.id==='greased').r`)==='legendary' && E2(`Core.draftPool([], false).some(p=>p.id==='greased')`),'Greased runners is a legendary perk in the draft pool');
 const r0s=E2(`rate('skid')`); E2(`S.run.perks.push('greased')`); const r1s=E2(`rate('skid')`);
 ok(Math.abs(r1s/r0s-1.2/0.5)<1e-9,`idle: spring mud speeds skidding ×1.2 instead of ×0.5 (${r0s.toFixed(2)} -> ${r1s.toFixed(2)})`);
 E2(`S.run.perks.push('swamp')`); ok(Math.abs(E2(`rate('skid')`)/r0s-2.4)<1e-9,'Swamp boots unchanged and does not cancel the boost');
 // mini-game: a team in mud moves faster with greased runners, slower without
 const g2=[...d.querySelectorAll('#chain .act.game')]; g2[2].click();
 ok(/drive through mud/.test(d.getElementById('mgHelp').textContent),'skid help tells you to drive through mud');
 btn(d,/2 logs/).click();
 const mudSpeed=perks=>E2(`(()=>{ S.run.perks=${JSON.stringify(perks)}; K.mud=[{x:K.pos.x,y:K.pos.y,rx:400,ry:400}]; K.cxAt=()=>K.pos.x; K.stumps=[]; K.vel={x:0,y:0}; K.stopT=0; MG.keys={ArrowDown:true}; const y=K.pos.y; for(let i=0;i<30;i++) skidStep(.05); MG.keys={}; const v=(K.pos.y-y)/1.5; K.pos.y=y; return v; })()`);
 const vNone=mudSpeed([]), vSwamp=mudSpeed(['swamp']), vGrease=mudSpeed(['greased']);
 ok(vNone<vSwamp && vSwamp<vGrease && vGrease>vSwamp*1.4,`mud: slowed ${vNone.toFixed(0)}, swamp boots ${vSwamp.toFixed(0)}, greased ${vGrease.toFixed(0)} px/s`);
 d.getElementById('mgClose').click();
 // improvement ladder: 5, 8 and 12 logs, +1 with Four-log turns; each also has an idle route
 ok(['chokers','arch','bundle'].every(id=>E2(`Core.IMPROVEMENT_ALT_REQS['${id}']`) && E2(`Core.IMPROVEMENT_REQS['${id}']`)),'skid-train improvements have a mini-game route and an idle route');
 E2(`S.upg.push('chokers','arch','bundle'); S.run.perks=['four']; S.season=3; S.era=3; S.own={};`);
 g2[2].click(); const labels=[...d.querySelectorAll('#mgBtns button')].map(b=>b.textContent);
 ok(['1 log','2 logs','3 logs','5 logs','8 logs','13 logs'].every(t=>labels.some(l=>l.includes(t))),'turn sizes offered: '+labels.join(' | '));
 const cut0=E2('S.cut.bf'), sl0=E2('S.stats.skidLogs');
 btn(d,/13 logs/).click();
 ok(E2('K.chain.length')===27 && E2('K.speed')<E2('(105+3*18)*0.62*1.15'),'13-log train: 13 logs in the chain, slower than a 4-log turn');
 // drive it down the trail by holding the pointer ahead of the team
 const kd=(c,t='keydown')=>w.dispatchEvent(new w.KeyboardEvent(t,{code:c,key:c,bubbles:true}));
 for(let i=0;i<300 && E2('K.phase')==='run';i++){ const dx=E2('K.cxAt(K.pos.y+60)-K.pos.x');
   kd('ArrowDown'); if(dx>8){ kd('ArrowRight'); kd('ArrowLeft','keyup'); } else if(dx<-8){ kd('ArrowLeft'); kd('ArrowRight','keyup'); } else { kd('ArrowLeft','keyup'); kd('ArrowRight','keyup'); }
   await sleep(250); }
 kd('ArrowDown','keyup'); kd('ArrowLeft','keyup'); kd('ArrowRight','keyup');
 s=d.getElementById('mgStatus').textContent;
 const L0=E2(`60+baseRate('skid')*15`), wantBf=L0*E2('Core.skidTurnLoad(13)');
 ok(/Landed 13 logs/.test(s),'a 13-log train is completable: '+s.slice(0,90));
 ok(Math.abs((cut0-E2('S.cut.bf'))-wantBf)<1e-6*wantBf && E2('S.stats.skidLogs')===sl0+13,`payout scales with logs (${Math.round(wantBf)} bd ft = 14.95 light turns), 13 logs counted toward the ladder`);
 const sw=E2('(()=>{ let m=0; for(let i=1;i<K.chain.length;i++){ const p=K.chain[i]; m=Math.max(m, Math.abs(p.x-K.cxAt(p.y))); } return m; })()');
 ok(isFinite(sw),'chain stays finite after the run');
 d.getElementById('mgClose').click();
 dom.window.close();

 // ---------- 3. equipment buy multiplier
 st=JSON.parse(JSON.stringify(base)); st.cash=10000; st.own={};
 dom=mk({'timberline-v2':JSON.stringify(st)}); await sleep(300); w=dom.window; d=w.document; const E3=s=>w.__eval(s);
 const cost=(b,o)=>Math.ceil(b*Math.pow(1.15,o)); const tot=(b,o,n)=>{let t=0; for(let i=0;i<n;i++) t+=cost(b,o+i); return t;};
 const tg=[...d.querySelectorAll('#buyN button')]; ok(tg.length===4 && tg.every(b=>b.type==='button') && tg[0].getAttribute('aria-pressed')==='true','buy toggle ×1 ×10 ×25 Max, ×1 pressed');
 const axe=()=>[...d.querySelectorAll('#eq .row')].find(r=>/Axeman/.test(r.textContent));
 tg[1].click(); await sleep(250);
 ok(tg[1].getAttribute('aria-pressed')==='true' && tg[0].getAttribute('aria-pressed')==='false','×10 pressed');
 ok(E3(`buyPlan(EQ.find(e=>e.id==='axeman')).total`)===tot(40,0,10) && /^×10 · \$/.test(axe().querySelector('.buy').textContent),`×10 shows the exact total (${tot(40,0,10)}): `+axe().querySelector('.buy').textContent);
 E3('S.cash=10000'); axe().querySelector('.buy').click();
 ok(E3('S.own.axeman')===10 && Math.abs(E3('S.cash')-(10000-tot(40,0,10)))<1e-9,'one click buys 10 for the exact total');
 tg[2].click(); ok(E3(`buyPlan(EQ.find(e=>e.id==='axeman')).total`)===tot(40,10,25),'×25 total follows the cost curve from the units owned');
 tg[3].click(); E3('S.cash=5000'); E3('render()');
 let n=0; while(tot(40,10,n+1)<=5000) n++;
 ok(E3(`buyPlan(EQ.find(e=>e.id==='axeman')).count`)===n && axe().querySelector('.buy').textContent.startsWith(`×${n} · `),`Max shows the most you can afford (${n}): `+axe().querySelector('.buy').textContent);
 axe().querySelector('.buy').click();
 ok(E3('S.own.axeman')===10+n && E3('S.cash')<cost(40,10+n) && Math.abs(E3('S.cash')-(5000-tot(40,10,n)))<1e-9,'Max buys as many as you can afford');
 E3('S.cash=10'); E3('render()'); const bb=axe().querySelector('.buy');
 ok(bb.disabled && /Max/.test(bb.textContent),'Max with too little cash is disabled: '+bb.textContent);
 w.dispatchEvent(new w.Event('pagehide')); const saved=JSON.parse(w.localStorage.getItem('timberline-v2'));
 ok(saved.ui && saved.ui.buyN==='max','buy amount is saved');
 dom.window.close();
 // old save without ui loads with defaults
 st=JSON.parse(JSON.stringify(base)); delete st.ui; delete st.stats.skidLogs;
 dom=mk({'timberline-v2':JSON.stringify(st)}); await sleep(300); w=dom.window;
 ok(w.__eval('S.ui.buyN')===1 && w.__eval('S.ui.buckGuide')===true && w.__eval('S.stats.skidLogs')===0,'old save gets the new defaults');
 dom.window.close();

 await sleep(100);
 ok(errs.length===0,'no console errors'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
 console.log(fails?`${fails} FAILED`:'ALL PASS'); process.exit(fails?1:0);
})();
