const {JSDOM}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync(__dirname+'/'+(process.env.GAME||'game_rogue.html'),'utf8'); const NEW=!process.env.GAME;
function run(profile, seed, hours=4, opt={}){
  const RUNS=opt.runs||3, NOPERK=!!process.env.NOPERK, NOMETA=!!process.env.NOMETA, CAP=(opt.capMin||150)*60, POLICY=opt.policy||'gas';
  // seeded random
  let x=seed*9301+49297; const rnd=()=>{x=(x*9301+49297)%233280; return x/233280;};
  const dom=new JSDOM(html,{runScripts:'dangerously',beforeParse(w){w.Math.random=rnd; w.__SIM=true;}});
  const G=dom.window.__G; const S=G.S;
  G.normalize(); G.refreshSales(); G.refreshOffers(); S.hireOffer=G.genHire(); G.setSite(); G.newTree();
  const RANK={legendary:0,rare:1,common:2,curse:3}; let achCash=0, achSeen=0;
  const runsOut=[]; let peakLpm=0, runStart=0, runT=0, curDrafts=0;
  const META_ORDER = profile==='idle' ? ['sled','gas','foremen','cash','steam','starter','legacy','lore','reroll','nest','pace','four'] : ['sled','foremen','cash','gas','steam','pace','starter','legacy','lore','reroll','four','nest'];
  const draftAll=()=>{ if(NOPERK){ S.run.dq.length=0; return; } let n=0; while(S.run.dq.length && n<50){ const off=G.currentOffer(); if(!off) break; const best=off.slice().sort((a,b)=>score(b)-score(a))[0];
      if(S.run.rerolls>0 && score(best)<2){ G.reroll(); continue; } G.pickPerk(best); curDrafts++; n++; } };
  const P=id=>G.perk(id);
  const IDLE_RULES={neck:4,store:3,snowball:4,handshake:2,cruiser:3,scrip:3,absentee:profile==='idle'?4:1,iceking:2,swamp:2};
  const GAME_RULES={domino:5,bull:4,golden:5,hotsaw:4,widow:3,scaler:3,four:4,daredevil:2,iceking:3,swamp:3,pacer:2,absentee:-5};
  function score(id){ const p=G.PMAP[id]; const base={legendary:3,rare:2,common:1.5,curse:1}[p.r];
    if(profile==='idle') return (IDLE_RULES[id]||0) + (p.m && !p.m.click ? 2 : 0) + base*.1;
    if(profile==='minigame') return (GAME_RULES[id]||0) + (IDLE_RULES[id]||0)*.3 + (p.m && !p.m.click ? 1.5 : 0) + base*.2;
    return Math.max(GAME_RULES[id]||0, IDLE_RULES[id]||0)*.8 + (p.m && !p.m.click ? 1.8 : 0) + base*.2; }
  const lHist=[];
  const dt=0.5, T=hours*3600; const ev=[]; let lastBuy=0, longest={gap:0,at:0,era:0}; const stats={stump:0,noTimber:0,short:0,neg:0,neck:{}, hire:0, contractsWon:0, contractsLost:0};
  const eraT=[0]; let lastContract=null;
  const reserve=()=>G.upkeep()*1.5;
  const cap = st => st==='fell' ? G.fellBf(G.rate('fell')) : G.rate(st);
  const STG=['fell','buck','skid','haul'];
  const bought=(what)=>{ const gap=S.t-lastBuy; if(gap>longest.gap) longest={gap, at:S.t, era:S.era, what}; lastBuy=S.t; };
  // manual work model: clicks/s applied to the stage with the biggest relative shortfall
  const clickRate = profile==='idle' ? (t=>t-runStart<300?2:0) : profile==='clicker' ? (()=>2) : (()=>0);
  const mg = profile==='minigame';
  let mgClock=0;
  for(let t=0;t<T;t+=dt){
    G.tick(dt);
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
      const has=id=>S.upg.includes(id), st=S.stats, sea=['Spring','Summer','Fall','Winter'][S.season];
      const pick = S.landing.bf>50?'haul':S.cut.bf>50?'skid':S.stems.bf>50?'buck':'fell';
      const rest = profile==='casual' ? 110 : 0;
      if(pick==='fell' && G.tract()){ const t=G.tract(); const k=Math.min(t.left,Math.max(1,Math.round(G.rate('fell')/t.hp*20)));
        const pPerf = has('gunstick') ? .5 : .3, pGood = (has('wedges') ? .85 : .65);
        const q=rnd(); let m = q<pPerf?1.25:q<pGood?1.1:q<.93?.8:.6; if(m===.6 && P('widow') && rnd()<.5) m=1.25;
        const kk=k*(P('hotsaw')?2:1); const k1=Math.min(t.left,kk);
        G.fellK(t,k1); S.stems.val += t.val*k1*(m-1); if(t.left<1) G.finishTract(); else G.newTree();
        if(m===1.25 && P('domino')){ let c=0; do{ const t2=G.tract(); if(!t2) break; const k2=Math.min(t2.left,k1); G.fellK(t2,k2); S.stems.val+=t2.val*k2*.25; c++; if(t2.left<1) G.finishTract(); else G.newTree(); } while(rnd()<.5 && c<6); }
        st.run_fell++; if(m>=1.1) st.goodFell++; if(m===1.25){ st.perfFell++; G.grantBoost('fell'); }
        G.runDone('fell', {1.25:1,1.1:.6,.8:.3,.6:.15}[m]);
        mgClock=8+rest; }
      else if(pick==='buck' && S.stems.bf>0){ const skill = (has('scalestick')?.06:0)+(has('grade')?.06:0);
        let r=Math.min(1, .72 + rnd()*.3 + skill); if(P('scaler') && r>=.9) r=1; G.runDone('buck', r); G.move(S.stems,S.cut,Math.min(S.stems.bf,Math.max(G.tract()?G.tract().bf:200, G.rate('buck')*25)),(0.5+0.7*r)*G.umult('value'));
        st.run_buck++; if(r>=.85) st.buck85++; if(r>=.9) st.buck90++; if(r>=.999) st.perfBuck++; if(r>=.97) G.grantBoost('buck'); mgClock=20+rest; }
      else if(pick==='skid' && S.cut.bf>0){ const pClean = .3 + (has('swamper')?.2:0) + (has('peavey')?.05:0) + (has('gps')?.2:0);
        const clean=rnd()<pClean*(P('four')?.85:1); G.move(S.cut,S.landing,(60+G.baseRate('skid')*15)*(P('four')?4.6:2)*(sea==='Spring'&&!P('swamp')?.8:1), clean||has('skyline')?1:.9); G.runDone('skid', clean?1:.4);
        st.run_skid++; if(sea==='Spring') st.mudRuns++; if(clean){ st.cleanSkid++; G.grantBoost('skid'); } mgClock=16+rest; }
      else if(pick==='haul' && S.landing.bf>0){ const pClean = .35 + (has('hay')?.15:0) + (has('airbrakes')?.2:0) + (has('bunks')?.05:0);
        const clean=rnd()<pClean+(P('daredevil')?.1:0), full = clean || rnd()<(P('daredevil')?.45:.5); G.deliver(Math.min(S.landing.bf,(15+G.baseRate('haul')*2)*(sea==='Winter'&&P('iceking')?2:1)*(10+(has('bunks')?4:0))*(full?1:(P('daredevil')?.4:.7)))); G.runDone('haul', clean?1:full?.6:.25);
        st.run_haul++; if(sea==='Spring') st.mudRuns++; if(sea==='Winter') st.winterHauls++; if(full) st.fullLoads++; if(clean){ st.cleanHaul++; G.grantBoost('haul'); } mgClock=24+rest; }
      else mgClock=5;
    }}
    // stats
    if(!G.tract()) stats.noTimber+=dt;
    if(S.short) stats.short+=dt;
    if((S.ema-S.upEma)<0) stats.neg+=dt;
    if(G.tract()){ const neck=STG.reduce((a,b)=>cap(b)<cap(a)?b:a); const k=S.era+':'+neck; stats.neck[k]=(stats.neck[k]||0)+dt; }
    if(lastContract && (!S.contract || S.contract.mill!==lastContract.mill || S.contract.vol!==lastContract.vol)){ if(S.t < lastContract.end) stats.contractsWon++; else stats.contractsLost++; }
    lastContract=S.contract?{...S.contract}:null;
    if(Math.round(S.t*2)%2!==0) continue; // decide once per second
    G.checkAch(true); draftAll(); while(achSeen<S.ach.length){ const id=S.ach[achSeen++]; const a=G.ACH.find(a=>a.id===id); if(a && S.era<2){ achCash+=a.cash; if(process.env.ACHLOG) console.error(Math.round((S.t-runStart)/60),a.id,a.cash);} }
    // close-camp policy
    if(S.t-runT>=60 && G.canClose()){ const rm=(S.t-runStart)/60, L=G.legacyNow(), lpm=L/rm; if(lpm>peakLpm) peakLpm=lpm; runT=S.t;
      lHist.push(L); const L5=lHist.length>5?lHist[lHist.length-6]:0; const marg=(L-L5)/5;
      const L10=lHist.length>10?lHist[lHist.length-11]:0;
      const stop = POLICY==='gas' ? S.era>=2 : (S.era>=1 && rm>20 && L>=10 && (L-L10)/10 < L/rm*.9);
      if(stop || S.t-runStart>=CAP){
        runsOut.push({n:S.run.n, min:Math.round(rm), steam:S.run.eraT[1]!=null?Math.round(S.run.eraT[1]/60):null, gas:S.run.eraT[2]!=null?Math.round(S.run.eraT[2]/60):null, legacy:L, achCash, perks:S.run.perks.map(id=>id).join(','), drafts:curDrafts, mods:S.run.mods.join(','), deliv:Math.round(S.run.deliv)});
        if(runsOut.length>=RUNS) break;
        G.closeCamp(); if(!NOMETA) for(const id of META_ORDER){ const m=G.META.find(x=>x.id===id); if(S.meta.legacy<m.cost) break; G.buyMeta(id); }
        G.startRun(opt.mods&&runsOut.length>=1?opt.mods:[]); S.run.t0=S.t; runStart=S.t; peakLpm=0; lHist.length=0; curDrafts=0; achCash=0; lastBuy=S.t; eraT.length=0;
        continue; } } if(!stats.upgT) stats.upgT=[]; while(S.upg.length>stats.upgT.length) stats.upgT.push(Math.round(S.t/60)); if(!stats.achT) stats.achT=[]; if(S.ach&&S.ach.length>stats.achT.length) stats.achT.push(Math.round(S.t/60));
    // bot decisions
    if(G.atRisk() && S.hireOffer && !G.hireActive() && !P('scrip')){ G.acceptHire(); stats.hire++; }
    const queued=S.tracts.reduce((a,t)=>a+t.left,0);
    if(S.tracts.length<2){
      const best=S.forSale.map((t,i)=>({i,score:t.trees*t.val*G.distF()/t.price,price:t.price})).filter(o=>o.price<=S.cash-reserve()).sort((a,b)=>b.score-a.score)[0];
      if(best){ stats.stump+=best.price; G.buyTract(best.i); bought('tract'); }
    }
    if(!S.contract && S.offers.length){ const hc=Math.min(...STG.map(cap))||1; const o=S.offers.find(o=>o.vol<=hc*o.dur*0.8); if(o){ G.accept(S.offers.indexOf(o)); } }
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
  return {runsOut, meta:S.meta, profile, seed, eraT, era:S.era, cash:S.cash, earned:S.earned, felled:S.felled, longest, stats};
}
module.exports={run};
if(require.main===module){
  const hours=+process.argv[2]||8, policy=process.argv[3]||'gas', profs=(process.argv[4]||'idle,casual,minigame').split(','), seeds=(process.argv[5]||'1,2,3').split(',').map(Number);
  const mods=process.env.MODS?process.env.MODS.split(','):null;
  for(const p of profs) for(const seed of seeds){ const r=run(p,seed,hours,{policy,mods});
    console.log(JSON.stringify({p, seed, runs:r.runsOut.map(x=>({n:x.n,min:x.min,steam:x.steam,gas:x.gas,L:x.legacy,ach$:x.achCash,deliv:x.deliv,drafts:x.drafts,perks:x.perks,unf:x.unfinished})), meta:r.meta.nodes.join(','), bank:r.meta.legacy})); }
}
