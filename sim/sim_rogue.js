const {JSDOM}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync(__dirname+'/'+(process.env.GAME||'game_rogue.html'),'utf8'); const NEW=!process.env.GAME;
function run(profile, seed, hours=4, opt={}){
  // 'idle-away' plays exactly like 'idle' while present, but checks in on a schedule (AWAY_MIN present / away minutes, default
  // 20/40). While away the bot makes no decisions; the game just ticks. Policy (balance agent, 2026-10-25): on leaving, if the
  // queue would run out before it is back and the AFK lot costs <= cash - 1.5x upkeep, buy it, then top the queue up with normal
  // lots; on return, put the crews on the first normal lot (cutNow). Never buy the AFK lot while present. NOAFK=1 skips the AFK buy.
  const AWAYP = profile==='idle-away', PB = AWAYP ? 'idle' : profile;
  const RUNS=opt.runs||3, NOPERK=!!process.env.NOPERK, NOMETA=!!process.env.NOMETA, CAP=(opt.capMin||150)*60, POLICY=opt.policy||'gas';
  // seeded random
  let x=seed*9301+49297; const rnd=()=>{x=(x*9301+49297)%233280; return x/233280;};
  const dom=new JSDOM(html,{runScripts:'dangerously',beforeParse(w){w.Math.random=rnd; w.__SIM=true;}});
  const G=dom.window.__G; const S=G.S; const Core=dom.window.Core;
  G.normalize(); G.refreshSales(); G.refreshOffers(); S.hireOffer=G.genHire(); G.setSite(); G.newTree();
  // playtest 2: finds and the Sawmill draw from their own seeded streams, so the logging draws above stay byte-exact
  if(S.rng){ S.rng.drops=(seed*7919+1)>>>0; S.rng.saw=(seed*104729+3)>>>0; S.rng.events=(seed*15485863+5)>>>0; S.rng.land=(seed*32452843+7)>>>0; }
  // seasonal events (slice 1): on unless NOEVENTS=1 or opt.noEvents; the weather rolls on its own stream, so Math.random draws stay the bot's
  const EVENTS=!!S.weather && !(opt.noEvents || process.env.NOEVENTS);
  if(S.weather && !EVENTS) S.weather.off=true;
  const evNow=()=>EVENTS && G.evNow ? G.evNow() : null, gr=(game,rule,d=0)=>Core.gameRule(evNow()||undefined,game,rule,d);
  const wx0=()=>S.weather?{...S.weather.stats, storms:S.stats.storms||0, cleared:S.stats.cleared||0}:{}; let wxRun=wx0(); const wxPace={tw:0,n:0};
  const MILL=!!G.closeMill, SPAR='logging.prime_spar'; if(MILL && process.env.MILLSHARE!=null) S.millShare=+process.env.MILLSHARE; const XT={ev:[],pondDry:0,millDry:0,coveSpend:0,millNeg:0,spFill:0,spMiss:0,pickLow:0,cFill:0,cMiss:0,capMax:1,activeMax:0};
  // the lot stash: every profile keeps every species on Any (the default) unless opt.stash / STASH=first, which sets First on
  // the signed tree order's species (and back to Any when it ends); the xt line then reports tree orders filled and missed
  // and the minutes crews spent under a picking factor below 0.8
  const STASH=(opt.stash||process.env.STASH||'any')==='first' && !!G.setStashRule; let stashSp=null;
  const millRunsOut=[], millEv=[]; let millOpenT=null, slot=0, sawN=0, runItem0=null;
  const itemSnap=()=>({prime:(S.found[SPAR]||{}).total||0, sales:S.run.itemSales||0, orders:S.run.ordersFilled||0, toMill:S.run.toMill||0});
  // Saw for grade, played through the game's own functions: the expert takes the full-knowledge best plan 7 runs in 10,
  // otherwise (and the casual bot always) follows the sawyer's mark; thinking time between moves
  function sawGame(expert){
    G.sawInit(0); const deck=G.W.deck; let i=deck.findIndex(d=>d.src!=='pond' && G.deckOk(d));
    if(i<0){ let bn=-1; deck.forEach((d,j)=>{ if(G.deckOk(d) && d.log.n>bn){ bn=d.log.n; i=j; } }); }
    if(i<0) return 5;
    G.sawPick(i); const W=G.W; const best=expert && (sawN++ % 10) < 7; const plan=best ? Core.sawBestPlan(W.log) : null; let k=0;
    for(let guard=0; W.phase==='saw' && guard<300; guard++){
      let act;
      if(plan){ if(k>=plan.length){ act='finish'; } else if(W.cut.face!==plan[k]) act='turn'; else { act='saw'; k++; } }
      else act=Core.sawAdvice(W.log, W.cut, G.sawEye());
      if(act==='finish'){ G.sawStep(0); break; }
      if(act==='turn') G.sawTurn(); else G.sawSaw();
      if(W.phase==='saw') G.sawStep(W.busy+(expert?.15:.45));
    }
    if(W.phase==='saw'){ // plan ended early: finish the cant
      const c=W.cut; while(W.phase==='saw' && !c.done){ G.sawSaw(); if(W.phase==='saw') G.sawStep(W.busy+.01); } }
    return W.t;
  }
  const MILL_PERKS=['sawyerseye','chaincarriage','bigstick','pondmonkey','turndog'];
  function millBot(){
    const m=S.camps.sawmill; if(millOpenT==null) millOpenT=S.t;
    // log slider: idle keeps the 10% default; the others aim for 10-30 minutes of logs in the pond, between 10% and 40%
    if(PB!=='idle' && !process.env.MILLFIX){ const r=G.millRateNow()*60, left=r>0 ? S.bulk.logs/r : 99; S.millShare = left>30 ? .1 : left<10 ? .4 : .2; }
    for(const id of ['sawmill.pond','sawmill.headrig','logging.bunkhouse']) while(G.canBuild(id)){ G.buildStructure(id); millEv.push({id:id.split('.')[1]+S.structures[id], min:+((S.t-millOpenT)/60).toFixed(1)}); }
    let keep=0; for(const id of ['sawmill.pond','sawmill.headrig']){ const nx=Core.structureNext(S.structures,id); if(nx && nx.items.every(x=>G.bankN(x.item)>=x.qty)) keep=Math.max(keep,nx.cash); }
    for(let n=0; n<10 && G.millSawyers()<Core.maxSawyers(S.structures) && m.cash>=Core.sawyerCost(m.hired)+keep; n++) G.hireSawyer();
    for(let n=0; n<20 && m.dq.length; n++){ const off=G.currentOffer('sawmill'); if(!off) break; G.pickPerk(off.slice().sort((a,b)=>MILL_PERKS.indexOf(a)-MILL_PERKS.indexOf(b))[0],'sawmill'); }
    if(G.canCloseMill()){ millRunsOut.push({n:m.n, min:Math.round((S.t-m.t0)/60), L:G.millLegacyNow(), games:m.games, hired:m.hired}); G.closeMill();
      for(const x of Core.MILL_META){ if(S.shares.sawmill.nodes.includes(x.id)) continue; if(!G.buyMillMeta(x.id)) break; } }
  }
  const RANK={legendary:0,rare:1,common:2,curse:3}; let achCash=0, achSeen=0;
  const runsOut=[]; let peakLpm=0, runStart=0, runT=0, curDrafts=0;
  const META_ORDER = PB==='idle' ? ['sled','gas','foremen','cash','steam','clerks','starter','legacy','office','lore','reroll','nest','pace','four'] : ['sled','foremen','cash','gas','steam','clerks','pace','starter','legacy','office','lore','reroll','four','nest'];
  const draftAll=()=>{ if(NOPERK){ S.run.dq.length=0; return; } let n=0; while(S.run.dq.length && n<50){ const off=G.currentOffer(); if(!off) break; const best=off.slice().sort((a,b)=>score(b)-score(a))[0];
      if(S.run.rerolls>0 && score(best)<2){ G.reroll(); continue; }
      if(MILL && score(best)<2 && G.canMarker()){ G.markerReroll(); continue; } // a survey marker buys a reroll (2 per outpost)
      G.pickPerk(best); curDrafts++; n++; } };
  const P=id=>G.perk(id);
  const IDLE_RULES={clerk:2,rush:2,overbook:1.5,illwind:3,neck:4,store:3,snowball:4,handshake:2,cruiser:3,scrip:3,absentee:PB==='idle'?4:1,iceking:2,swamp:2,greased:3,pitchboiler:2};
  const GAME_RULES={illwind:3,domino:5,bull:4,golden:5,hotsaw:4,widow:3,scaler:3,four:4,daredevil:2,iceking:3,swamp:3,pacer:2,greased:4,absentee:-5,gravity:4,overload:3,highball:3,sparman:2,pitchboiler:2};
  function score(id){ const p=G.PMAP[id]; const base={legendary:3,rare:2,common:1.5,curse:1}[p.r];
    if(PB==='idle') return (IDLE_RULES[id]||0) + (p.m && !p.m.click ? 2 : 0) + base*.1;
    if(profile==='minigame') return (GAME_RULES[id]||0) + (IDLE_RULES[id]||0)*.3 + (p.m && !p.m.click ? 1.5 : 0) + base*.2;
    return Math.max(GAME_RULES[id]||0, IDLE_RULES[id]||0)*.8 + (p.m && !p.m.click ? 1.8 : 0) + base*.2; }
  const lHist=[];
  const dt=0.5, T=hours*3600; const ev=[]; let lastBuy=0, longest={gap:0,at:0,era:0}; const stats={stump:0,noTimber:0,short:0,neg:0,neck:{}, hire:0, contractsWon:0, contractsLost:0};
  const eraT=[0]; let lastContract=[];
  const reserve=()=>G.upkeep()*1.5;
  const AWAY=(process.env.AWAY_MIN||'20,40').split(',').map(Number), NOAFK=!!process.env.NOAFK;
  const AX={awayMin:0, dryAwayMin:0, leaves:0, queueOk:0, afkBuys:0, afkBroke:0, fillBuys:0, afkCutMin:0}; let wasAway=false;
  const capsNow=()=>({fell:G.rate('fell'), buck:G.rate('buck'), skid:G.rate('skid',1), haul:G.rate('haul',1)});
  const queueSec=()=>S.tracts.reduce((a,t)=>a+Core.cutOutSeconds(capsNow(),t),0);
  const bestNormal=()=>S.forSale.map((t,i)=>({i,afk:!!t.afk,score:Core.tractScore(capsNow(),t,Core.distanceFactor(t.miles)),price:t.price})).filter(o=>!o.afk && o.price<=S.cash-reserve()).sort((a,b)=>b.score-a.score)[0];
  const cap = st => st==='fell' ? G.fellBf(G.rate('fell')) : G.rate(st);
  const STG=['fell','buck','skid','haul'];
  const bought=(what)=>{ const gap=S.t-lastBuy; if(gap>longest.gap) longest={gap, at:S.t, era:S.era, what}; lastBuy=S.t; };
  // manual work model: clicks/s applied to the stage with the biggest relative shortfall.
  // every profile clicks 2/s for the first 5 minutes of each run (a fair opening); 'clicker' keeps clicking.
  const OPEN_CLICKS=2, OPEN_SEC=300;
  const clickRate = profile==='clicker' ? (()=>2) : (t=>t-runStart<OPEN_SEC?OPEN_CLICKS:0);
  const mg = profile==='minigame';
  let mgClock=0;
  for(let t=0;t<T;t+=dt){
    const c0=(S.contracts||[]).slice();
    G.tick(dt);
    for(const c of c0) if(c.sp && !S.contracts.includes(c)){ if(c.done>=c.vol-1e-6) XT.spFill++; else XT.spMiss++; }
    if(G.cutOf && G.tract() && G.cutOf(G.tract()).pf<0.8) XT.pickLow+=dt;
    // manual clicks
    const cr=clickRate(S.t);
    if(cr>0){
      let n=cr*dt;
      while(n-- > 0){
        const tr=G.tract();
        // work downstream-most pile with stock, else chop
        if(S.landing.bf>0){ G.deliver(G.handAmt('haul')); }
        else if(S.cut.bf>0){ G.move(S.cut,S.landing,G.handAmt('skid')); }
        else if(S.stems.bf>0){ G.move(S.stems,S.cut,G.handAmt('buck'),G.umult('value')); }
        else if(tr){ G.damage(G.umult('click')); }
      }
    }
    // mini-game runs: 'minigame' plays back to back; 'casual' plays one every ~2 minutes
    if(mg || profile==='casual'){ mgClock-=dt; if(mgClock<=0){
      const has=id=>S.upg.includes(id), st=S.stats, sea=G.effSeason ? G.effSeason() : ['Spring','Summer','Fall','Winter'][S.season];
      const pick = S.landing.bf>50?'haul':S.cut.bf>50?'skid':S.stems.bf>50?'buck':'fell';
      const rest = profile==='casual' ? 110 : 0;
      // with the Sawmill open, every third mini-game is Saw for grade (one player, two camps)
      if(MILL && S.camps.sawmill && (++slot % 3)===0 && !G.sawBlock()){ mgClock=sawGame(mg)+3+rest; }
      else if(pick==='fell' && G.tract()){ const t=G.tract(); const k=Math.min(t.left,Math.max(1,Math.round(G.rate('fell')/t.hp*20)));
        const pPerf = (has('gunstick') ? .5 : .3) - (gr('fell','wind',1)>1 ? .08 : 0), pGood = (has('wedges') ? .85 : .65);
        const q=rnd(); let m = q<pPerf?1.25:q<pGood?1.1:q<.93?.8:.6; if(m===.6 && P('widow') && rnd()<.5) m=1.25;
        // Prime from a perfect fall (Spar man: good falls too), species from the tract on the drops stream
        if(MILL && (m===1.25 || m===1.1)){ const sp=Core.pickFromMix(G.drng, t.mix); if(sp) G.fellPrime(m===1.25?'perfect':'good', sp); }
        const kk=k*(P('hotsaw')?2:1); const k1=Math.min(t.left,kk);
        G.fellK(t,k1); S.stems.val += t.val*k1*(m-1); if(t.left<1) G.finishTract(); else G.newTree();
        if(m===1.25 && P('domino')){ let c=0; do{ const t2=G.tract(); if(!t2) break; const k2=Math.min(t2.left,k1); G.fellK(t2,k2); S.stems.val+=t2.val*k2*.25; c++; if(t2.left<1) G.finishTract(); else G.newTree(); } while(rnd()<.5 && c<6); }
        st.run_fell++; if(m>=1.1) st.goodFell++; if(m===1.25){ st.perfFell++; if(!P('sparman')) G.grantBoost('fell'); }
        G.runDone('fell', {1.25:1,1.1:.6,.8:.3,.6:.15}[m]);
        mgClock=8+rest; }
      else if(pick==='buck' && S.stems.bf>0){ const skill = (has('scalestick')?.06:0)+(has('grade')?.06:0);
        // Scaler's friend pays 90%+ as 100% but full value (perfBuck) needs the raw score (playtest 1 exploit fix)
        const r0=Math.min(1, .72 + rnd()*.3 + skill); let r=r0; if(P('scaler') && r>=.9) r=1; G.runDone('buck', r, false, G.tract()?Core.mainSpecies(G.tract().mix):null); G.move(S.stems,S.cut,Math.min(S.stems.bf,Math.max(G.tract()?G.tract().bf:200, G.rate('buck')*25)),(0.5+0.7*r)*G.umult('value'));
        // Prime from grade 1 cuts at 90%+: Binomial(3, .45) logs of 12 ft+, two at most; Pitch boiler boils a pulp piece to pitch
        if(MILL && r0>=.9 && G.tract()){ let n=0; for(let j=0;j<3;j++) if(G.drng()<.45) n++; const sp=Core.pickFromMix(G.drng, G.tract().mix), pr=sp?Core.primeFromFall(sp):null; if(pr && n) G.addItem(pr.item, Math.min(2,n)); }
        if(MILL && P('pitchboiler')) G.addItem('logging.amber_pitch', 1);
        st.run_buck++; if(r>=.85) st.buck85++; if(r>=.9) st.buck90++; if(r0>=.999) st.perfBuck++; if(r>=.97) G.grantBoost('buck'); mgClock=20+rest; }
      else if(pick==='skid' && S.cut.bf>0){ const pClean = .3 + (has('swamper')?.2:0) + (has('peavey')?.05:0) + (has('gps')?.2:0);
        // turn size: a full 2-log turn, or the biggest turn once perks or improvements allow 4+ logs (4 logs is the old Four-log turns case)
        const top=Core.maxSkidLogs(S.upg, !!P('four')), n=top>3?top:2;
        const clean=rnd()<pClean*(n>=4?.85*Math.sqrt(4/n):1)-(gr('skid','mudPlus')?.06:0);
        const mud=sea==='Spring'?(P('greased')?1.1:P('swamp')?1:.8):1;
        G.move(S.cut,S.landing,(60+G.baseRate('skid')*15)*Core.skidTurnLoad(n)*mud, clean||has('skyline')?1:.9); G.runDone('skid', clean?1:.4);
        st.run_skid++; st.skidLogs=(st.skidLogs||0)+n; if(sea==='Spring') st.mudRuns++; if(clean){ st.cleanSkid++; G.grantBoost('skid'); }
        mgClock=16*(n>4?Core.skidTurnSpeed(4)/Core.skidTurnSpeed(n):1)+rest; }
      else if(pick==='haul' && S.landing.bf>0){
        // haul game model (packages/core/src/haul.ts): seasonal road limit, overweight only with Overload artist,
        // pay = sale + Core.haulBonus (full load, overweight premium, nothing lost, under par). No extra rnd() draws.
        const C=dom.window.Core, R=G.haulRulesNow ? G.haulRulesNow() : C.haulRules({era:S.era, season:sea, upg:S.upg, perks:S.run.perks}), hb=P('highball');
        const wxHaul=(gr('haul','viewYd')?.05:0)+(gr('haul','viewFrac') && S.st<C.HALF_SEC?.10:0);
        const pClean = (.35 + (has('hay')?.15:0) + (has('airbrakes')?.2:0) + (has('bunks')?.05:0) + (has('roughlock')?.05:0) + (has('hillhitch')?.05:0) + (has('lookout')?.08:0) + (P('gravity')?.15:0)) * (hb?.9:1);
        const clean=rnd()<pClean+(P('daredevil')?.1:0)-wxHaul, full = clean || rnd()<(P('daredevil')?.45:.5);
        const unit=(15+G.baseRate('haul')*2)*(sea==='Winter'&&P('iceking')?2:1), n0=R.limit+(P('overload')?4:0);
        const keep = full ? 1 : P('gravity') ? .9 : has('binders') ? .85 : (P('daredevil')?.4:.7), n=full?n0:Math.max(1,Math.round(n0*keep));
        const t = clean ? .85 : full ? 1.05 : .95, under = t<=1;
        const rev=G.deliver(Math.min(S.landing.bf,unit*n));
        const b=C.haulBonus({n0, n, limit:R.limit, spill:n0-n, t, par:1, overPay:R.overPay}); G.haulPay(rev*b.total);
        const q=clean?1:full?.6:.25; G.runDone('haul', q); if(hb && under) G.runDone('haul', q, true);
        st.run_haul++; if(sea==='Spring') st.mudRuns++; if(sea==='Winter') st.winterHauls++; if(full) st.fullLoads++; if(under) st.parHaul=(st.parHaul||0)+1; if(clean){ st.cleanHaul++; G.grantBoost('haul'); } mgClock=24+rest; }
      else mgClock=5;
    }}
    // stats
    if(MILL && S.camps.sawmill){ if(S.bulk.logs<1){ XT.pondDry+=dt; XT.dryRun=(XT.dryRun||0)+dt; XT.dryMax=Math.max(XT.dryMax||0,XT.dryRun); } else XT.dryRun=0; if(S.camps.sawmill.dry) XT.millDry+=dt; }
    if(!G.tract()) stats.noTimber+=dt;
    if(S.short) stats.short+=dt;
    if((S.ema-S.upEma)<0) stats.neg+=dt;
    if(G.tract()){ const neck=STG.reduce((a,b)=>cap(b)<cap(a)?b:a); const k=S.era+':'+neck; stats.neck[k]=(stats.neck[k]||0)+dt; }
    // several active orders (2026-10-26): an order that left the list was filled (before its deadline) or missed
    for(const c of lastContract) if(!S.contracts.includes(c)){ if(c.done>=c.vol-1e-6){ stats.contractsWon++; XT.cFill++; } else { stats.contractsLost++; XT.cMiss++; } }
    lastContract=S.contracts.slice(); XT.capMax=Math.max(XT.capMax,G.ordCap()); XT.activeMax=Math.max(XT.activeMax,S.contracts.length);
    // weather pace (the bad-luck measure, time-weighted): each second's slowdown of the bottleneck with the weather against the
    // same moment with it muted, averaged over the seconds with timber to cut (a slow second late in the run counts no more than an early one)
    if(EVENTS && G.setWxMute && Math.round(S.t*2)%2===0){ const nc=()=>G.tract()?Math.min(...STG.map(cap)):0; const a=nc(); let b=a; if(evNow()){ G.setWxMute(true); b=nc(); G.setWxMute(false); } if(b>0){ wxPace.tw+=1-a/b; wxPace.n++; } }
    if(AWAYP){
      if(G.tract() && G.tract().afk) AX.afkCutMin+=dt/60;
      const cyc=(AWAY[0]+AWAY[1])*60, ph=(S.t-runStart)%cyc, away=(S.t-runStart)>OPEN_SEC && ph>=AWAY[0]*60;
      if(away){ AX.awayMin+=dt/60; if(!G.tract()) AX.dryAwayMin+=dt/60; }
      if(away && !wasAway){ // leaving
        const i=S.forSale.findIndex(t=>t.afk), t=S.forSale[i], need=queueSec() < AWAY[1]*60; AX.leaves++; if(!need) AX.queueOk++;
        if(!NOAFK && t && need){ if(t.price<=S.cash-reserve()){ stats.stump+=t.price; G.buyTract(i); AX.afkBuys++; } else AX.afkBroke++; }
        for(let g=0; g<5 && S.tracts.length<5 && queueSec() < AWAY[1]*60; g++){ const o=bestNormal(); if(!o) break; stats.stump+=o.price; G.buyTract(o.i); AX.fillBuys++; } }
      if(!away && wasAway && G.tract() && G.tract().afk){ const j=S.tracts.findIndex(t=>!t.afk); if(j>0) G.cutNow(j); } // back
      wasAway=away; if(away) continue;
    }
    if(Math.round(S.t*2)%2!==0) continue; // decide once per second
    if(MILL && S.camps.sawmill) millBot();
    { const k=(S.ach.length)+'/'+S.upg.length+'/'+S.era+'/'+Object.values(S.structures||{}).reduce((a,b)=>a+b,0)+'/'+(S.weather?Object.keys(S.weather.seen).length:0); if(k!==XT.k){ XT.k=k; XT.ev.push(S.t); } }
    G.checkAch(true); draftAll(); while(achSeen<S.ach.length){ const id=S.ach[achSeen++]; const a=G.ACH.find(a=>a.id===id); if(a && S.era<2){ achCash+=a.cash; if(process.env.ACHLOG) console.error(Math.round((S.t-runStart)/60),a.id,a.cash);} }
    // close-camp policy
    if(S.t-runT>=60 && G.canClose()){ const rm=(S.t-runStart)/60, L=G.legacyNow(), lpm=L/rm; if(lpm>peakLpm) peakLpm=lpm; runT=S.t;
      lHist.push(L); const L5=lHist.length>5?lHist[lHist.length-6]:0; const marg=(L-L5)/5;
      const L10=lHist.length>10?lHist[lHist.length-11]:0;
      const stop = POLICY==='gas' ? S.era>=2 : (S.era>=1 && rm>20 && L>=10 && (L-L10)/10 < L/rm*.9);
      if(stop || S.t-runStart>=CAP){
        if(MILL) G.sellSurplus(); // sell surplus at close camp
        const L2=MILL ? G.legacyNow() : L, i0=runItem0||{prime:0,sales:0,orders:0,toMill:0}, i1=itemSnap();
        runsOut.push({n:S.run.n, min:Math.round(rm), steam:S.run.eraT[1]!=null?Math.round(S.run.eraT[1]/60):null, gas:S.run.eraT[2]!=null?Math.round(S.run.eraT[2]/60):null, legacy:L2, achCash, perks:S.run.perks.map(id=>id).join(','), drafts:curDrafts, cf:S.run.cFilled||0, mods:S.run.mods.join(','), deliv:Math.round(S.run.deliv),
          ...(EVENTS ? {wx:(()=>{ const a=wxRun, b=wx0(); return {bad:b.bad-a.bad, storms:b.storms-a.storms, cleared:b.cleared-a.cleared, guard:b.guard-a.guard, fires:b.fires-a.fires, burned:Math.round(b.burned-a.burned), maxStreak:b.maxStreak, stormN:S.run.stormN||0, pacePct:+(wxPace.tw/Math.max(1,wxPace.n)*100).toFixed(2)}; })()} : {}),
          ...(MILL ? {prime:i1.prime-i0.prime, orders:i1.orders, bonus:Math.round(Math.min(.25,S.orders.bonusPct)*100), salesPct:+(i1.sales/Math.max(1,S.run.earned)*100).toFixed(2), toMill:Math.round(i1.toMill), bunk:S.structures['logging.bunkhouse']||0} : {})});
        if(runsOut.length>=RUNS) break;
        G.closeCamp(); wxRun=wx0(); wxPace.tw=0; wxPace.n=0; runItem0={prime:(S.found[SPAR]||{}).total||0, sales:0, orders:0, toMill:0}; if(!NOMETA) for(const id of META_ORDER){ const m=G.META.find(x=>x.id===id); if(S.meta.legacy<m.cost) break; G.buyMeta(id); }
        G.startRun(opt.mods&&runsOut.length>=1?opt.mods:[]); S.run.t0=S.t; runStart=S.t; peakLpm=0; lHist.length=0; curDrafts=0; achCash=0; lastBuy=S.t; eraT.length=0;
        continue; } } if(!stats.upgT) stats.upgT=[]; while(S.upg.length>stats.upgT.length) stats.upgT.push(Math.round(S.t/60)); if(!stats.achT) stats.achT=[]; if(S.ach&&S.ach.length>stats.achT.length) stats.achT.push(Math.round(S.t/60));
    // bot decisions
    // Company scrip allows a hire job only when out of timber and cash; atRisk() and acceptHire() apply the game's own rule
    if(G.atRisk() && S.hireOffer && !G.hireActive()){ const h=S.tracts.length; G.acceptHire(); if(S.tracts.length>h) stats.hire++; }
    const queued=S.tracts.reduce((a,t)=>a+t.left,0);
    if(S.tracts.filter(t=>!t.afk).length<2 && S.tracts.length<3){ // an owned AFK lot does not count as a lot in hand
      // species overhaul: every profile buys by "best value per work for my camp" (Core.tractScore on pine-weight capacities); no draws
      const caps={fell:G.rate('fell'), buck:G.rate('buck'), skid:G.rate('skid',1), haul:G.rate('haul',1)};
      // the AFK lot (cutover) is never bought here: only idle-away buys it, on leaving (Core.tractScore scores it 0 anyway)
      const best=S.forSale.map((t,i)=>({i,afk:!!t.afk,score:Core.tractScore(caps,t,Core.distanceFactor(t.miles)),price:t.price})).filter(o=>!o.afk && o.price<=S.cash-reserve()).sort((a,b)=>b.score-a.score)[0];
      if(best){ stats.stump+=best.price; G.buyTract(best.i); bought('tract');
        if(AWAYP && G.tract() && G.tract().afk){ const j=S.tracts.findIndex(t=>!t.afk); if(j>0) G.cutNow(j); } } // present: crews off the AFK lot
    }
    // several active orders: sign up to capacity while the orders already signed leave room (the haul rate they still need)
    for(let g=0; g<6 && !G.ordFull() && S.offers.length; g++){ const hc=Math.min(...STG.map(cap))||1; const sh=o=>o.sp ? (G.tract()?Core.mixShare(G.tract().mix,o.sp):0) : 1;
      // with First on the order's species the whole delivery counts, but crews pick at 0.5 + 0.5 × its share
      const need=o=>STASH && o.sp ? o.vol/Core.pickFactor(sh(o)) : o.vol/sh(o);
      const busy=S.contracts.reduce((a,c)=>a+(c.vol-c.done)/Math.max(.1,sh(c))/Math.max(30,c.end-S.t),0);
      const o=S.offers.find(o=>sh(o)>0 && need(o)<=(hc-busy)*o.dur*0.8); if(!o) break; G.accept(S.offers.indexOf(o)); }
    if(STASH){ const want=(S.contracts.find(c=>c.sp)||{}).sp||null; if(want!==stashSp){ if(stashSp) G.setStashRule(stashSp,'any'); if(want) G.setStashRule(want,'first'); stashSp=want; } }
    const nx=G.ERAS[S.era+1];
    const ec=G.eraCost(S.era+1);
    if(nx && S.cash>=ec+reserve()){ S.cash-=ec; S.era++; S.year=Math.max(S.year,nx.year); G.refreshSales(); G.refreshOffers(); eraT.push(S.t); bought('era'); continue; }
    const saving = nx && S.ema*60*25 >= ec; stats.savingT=(stats.savingT||0)+(saving?1:0);
    if(saving && S.tracts.length>=2) continue;

    // equipment for bottleneck, keep a tract reserve when queue low
    const neck=STG.reduce((a,b)=>cap(b)<cap(a)?b:a);
    const opts=G.EQ.filter(e=>e.stage===neck&&e.era<=S.era).map(e=>({e,c:G.eqCost(e)})).sort((a,b)=>b.e.rate/b.c - a.e.rate/a.c);
    const tractRes = S.tracts.length<2 ? G.cheapestSale() : 0;
    if(opts[0] && S.cash>=opts[0].c+reserve()+(isFinite(tractRes)?tractRes*0.5:0)){ S.cash-=opts[0].c; S.own[opts[0].e.id]=(S.own[opts[0].e.id]||0)+1; bought('eq:'+opts[0].e.id); }
  }
  if(runsOut.length<RUNS) runsOut.push({n:S.run.n, min:Math.round((S.t-runStart)/60), steam:S.run.eraT[1]!=null?Math.round(S.run.eraT[1]/60):null, gas:S.run.eraT[2]!=null?Math.round(S.run.eraT[2]/60):null, legacy:G.legacyNow(), unfinished:true, perks:S.run.perks.join(','), deliv:Math.round(S.run.deliv)});
  const items = MILL ? (()=>{ const by={made:0,common:0,uncommon:0,rare:0}; Object.entries(S.found).forEach(([id,f])=>{ const d=Core.itemDef(id); if(d && f.first!=='Founding crate') by[d.rarity]+=f.total; });
    return {primeTotal:(S.found[SPAR]||{}).total||0, findsPerHour:{common:+(by.common/hours).toFixed(1), uncommon:+(by.uncommon/hours).toFixed(1), rare:+(by.rare/hours).toFixed(2)}, ordersFilled:S.orders.filled, openOrders:S.orders.open.map(o=>o.id+":"+JSON.stringify(o.given)), pitchFound:(S.found["logging.amber_pitch"]||{}).total||0, stockEnd:Object.values(S.bank).reduce((a,n)=>a+n,0)}; })() : null;
  const mill = MILL && S.camps.sawmill ? {openMin:millOpenT!=null?Math.round(millOpenT/60):null, firstStructMin:millEv.length?millEv[0].min:null, events:millEv, runs:millRunsOut, cur:{n:S.camps.sawmill.n, min:Math.round((S.t-S.camps.sawmill.t0)/60), sawn:Math.round(S.camps.sawmill.sawn), games:S.camps.sawmill.games}, shares:S.shares.sawmill.total} : null;
  const endT=runsOut.length? (runsOut.reduce((a,r)=>a+r.min,0)*60):S.t; let gap=0,gapAt=0,prev=0; for(const t of XT.ev.concat([Math.min(S.t,endT)])){ if(t>endT) break; if(t-prev>gap){gap=t-prev;gapAt=prev;} prev=t; }
  const xt={gapMin:+(gap/60).toFixed(1), gapAt:Math.round(gapAt/60), pondDryMin:Math.round(XT.pondDry/60), pondDryMaxMin:+((XT.dryMax||0)/60).toFixed(1), millDryMin:Math.round(XT.millDry/60), negMin:Math.round(stats.neg/60), noTimberMin:Math.round(stats.noTimber/60), shortMin:Math.round(stats.short/60), buyGapMin:Math.round(longest.gap/60), buyGapWhat:longest.what, coveSpend:S.camps&&S.camps.sawmill?Math.round(S.camps.sawmill.logCost||0):0, millCash:S.camps&&S.camps.sawmill?Math.round(S.camps.sawmill.cash):0, hire:stats.hire,
    stash:STASH?'first':'any', spFill:XT.spFill, spMiss:XT.spMiss, pickLowMin:Math.round(XT.pickLow/60), cFill:XT.cFill, cMiss:XT.cMiss, capMax:XT.capMax, activeMax:XT.activeMax};
  return {...(AWAYP ? {AX:Object.fromEntries(Object.entries(AX).map(([k,v])=>[k,Math.round(v*10)/10]))} : {}), xt, runsOut, meta:S.meta, profile, seed, eraT, era:S.era, cash:S.cash, earned:S.earned, felled:S.felled, longest, stats, items, mill};
}
module.exports={run};
if(require.main===module){
  const hours=+process.argv[2]||8, policy=process.argv[3]||'gas', profs=(process.argv[4]||'idle,casual,minigame').split(','), seeds=(process.argv[5]||'1,2,3').split(',').map(Number);
  const mods=process.env.MODS?process.env.MODS.split(','):null;
  for(const p of profs) for(const seed of seeds){ const r=run(p,seed,hours,{policy,mods});
    console.log(JSON.stringify({p, seed, ...(r.AX ? {AX:r.AX} : {}), runs:r.runsOut.map(x=>({n:x.n,min:x.min,steam:x.steam,gas:x.gas,L:x.legacy,ach$:x.achCash,deliv:x.deliv,drafts:x.drafts,cf:x.cf,perks:x.perks,unf:x.unfinished,wx:x.wx,
      ...(x.prime!=null ? {prime:x.prime, orders:x.orders, bonus:x.bonus, salesPct:x.salesPct, toMill:x.toMill, bunk:x.bunk} : {})})), meta:r.meta.nodes.join(','), bank:r.meta.legacy, xt:r.xt, items:r.items, mill:r.mill})); }
}
