const {JSDOM}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync(__dirname+'/'+(process.env.GAME||'game.html'),'utf8'); const NEW=!process.env.GAME;
function run(profile, seed, hours=4){
  // seeded random
  let x=seed*9301+49297; const rnd=()=>{x=(x*9301+49297)%233280; return x/233280;};
  const dom=new JSDOM(html,{runScripts:'dangerously',beforeParse(w){w.Math.random=rnd; w.__SIM=true;}});
  const G=dom.window.__G; const S=G.S;
  G.refreshSales(); G.refreshOffers(); S.hireOffer=G.genHire(); G.setSite(); G.newTree();
  const dt=0.5, T=hours*3600; const ev=[]; let lastBuy=0, longest={gap:0,at:0,era:0}; const stats={stump:0,noTimber:0,short:0,neg:0,neck:{}, hire:0, contractsWon:0, contractsLost:0};
  const eraT=[0]; let lastContract=null;
  const reserve=()=>G.upkeep()*1.5;
  const cap = st => st==='fell' ? G.fellBf(G.rate('fell')) : G.rate(st);
  const STG=['fell','buck','skid','haul'];
  const bought=(what)=>{ const gap=S.t-lastBuy; if(gap>longest.gap) longest={gap, at:S.t, era:S.era, what}; lastBuy=S.t; };
  // manual work model: clicks/s applied to the stage with the biggest relative shortfall.
  // every profile clicks 2/s for the first 5 minutes (a fair opening); 'clicker' keeps clicking.
  const clickRate = profile==='clicker' ? (()=>2) : (t=>t<300?2:0);
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
        const q=rnd(); const m = q<pPerf?1.25:q<pGood?1.1:q<.93?.8:.6;
        G.fellK(t,k); S.stems.val += t.val*k*(m-1); if(t.left<1) G.finishTract(); else G.newTree();
        st.run_fell++; if(m>=1.1) st.goodFell++; if(m===1.25){ st.perfFell++; G.grantBoost('fell'); }
        mgClock=8+rest; }
      else if(pick==='buck' && S.stems.bf>0){ const skill = (has('scalestick')?.06:0)+(has('grade')?.06:0);
        const r=Math.min(1, .72 + rnd()*.3 + skill); G.move(S.stems,S.cut,Math.min(S.stems.bf,Math.max(G.tract()?G.tract().bf:200, G.rate('buck')*25)),(0.5+0.7*r)*G.umult('value'));
        st.run_buck++; if(r>=.85) st.buck85++; if(r>=.9) st.buck90++; if(r>=.999) st.perfBuck++; if(r>=.97) G.grantBoost('buck'); mgClock=20+rest; }
      else if(pick==='skid' && S.cut.bf>0){ const pClean = .3 + (has('swamper')?.2:0) + (has('peavey')?.05:0) + (has('gps')?.2:0);
        const clean=rnd()<pClean; G.move(S.cut,S.landing,(60+G.baseRate('skid')*15)*2, clean||has('skyline')?1:.9);
        st.run_skid++; if(sea==='Spring') st.mudRuns++; if(clean){ st.cleanSkid++; G.grantBoost('skid'); } mgClock=16+rest; }
      else if(pick==='haul' && S.landing.bf>0){ const pClean = .35 + (has('hay')?.15:0) + (has('airbrakes')?.2:0) + (has('bunks')?.05:0);
        const clean=rnd()<pClean, full = clean || rnd()<.5; G.deliver(Math.min(S.landing.bf,(15+G.baseRate('haul')*2)*(10+(has('bunks')?4:0))*(full?1:.7)));
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
    G.checkAch(true); if(!stats.upgT) stats.upgT=[]; while(S.upg.length>stats.upgT.length) stats.upgT.push(Math.round(S.t/60)); if(!stats.achT) stats.achT=[]; if(S.ach&&S.ach.length>stats.achT.length) stats.achT.push(Math.round(S.t/60));
    // bot decisions
    if(G.atRisk() && S.hireOffer && !G.hireActive()){ G.acceptHire(); stats.hire++; }
    const queued=S.tracts.reduce((a,t)=>a+t.left,0);
    if(S.tracts.length<2){
      const best=S.forSale.map((t,i)=>({i,score:t.trees*t.val*G.distF()/t.price,price:t.price})).filter(o=>o.price<=S.cash-reserve()).sort((a,b)=>b.score-a.score)[0];
      if(best){ stats.stump+=best.price; G.buyTract(best.i); bought('tract'); }
    }
    if(!S.contract && S.offers.length){ const hc=Math.min(...STG.map(cap))||1; const o=S.offers.find(o=>o.vol<=hc*o.dur*0.8); if(o){ G.accept(S.offers.indexOf(o)); } }
    const nx=G.ERAS[S.era+1];
    if(nx && S.cash>=nx.cost+reserve()){ S.cash-=nx.cost; S.era++; S.year=Math.max(S.year,nx.year); G.refreshSales(); G.refreshOffers(); eraT.push(S.t); bought('era'); continue; }
    const saving = nx && S.ema*60*25 >= nx.cost; stats.savingT=(stats.savingT||0)+(saving?1:0);
    if(saving && S.tracts.length>=2) continue;

    // equipment for bottleneck, keep a tract reserve when queue low
    const neck=STG.reduce((a,b)=>cap(b)<cap(a)?b:a);
    const opts=G.EQ.filter(e=>e.stage===neck&&e.era<=S.era).map(e=>({e,c:G.eqCost(e)})).sort((a,b)=>b.e.rate/b.c - a.e.rate/a.c);
    const tractRes = S.tracts.length<2 ? G.cheapestSale() : 0;
    if(opts[0] && S.cash>=opts[0].c+reserve()+(isFinite(tractRes)?tractRes*0.5:0)){ S.cash-=opts[0].c; S.own[opts[0].e.id]=(S.own[opts[0].e.id]||0)+1; bought('eq:'+opts[0].e.id); }
  }
  return {profile, seed, eraT, era:S.era, cash:S.cash, earned:S.earned, felled:S.felled, longest, stats};
}
module.exports={run};
if(require.main===module){
  const out=[];
  for(const p of ['idle','casual','clicker','minigame']) for(const seed of [1,2,3]){ const r=run(p,seed,+process.argv[2]||4); out.push(r);
    console.log(JSON.stringify({p:r.profile,seed:r.seed,eraMin:r.eraT.map(t=>Math.round(t/60)),era:r.era,earned:Math.round(r.earned),
      wallMin:+(r.longest.gap/60).toFixed(1),wallAtMin:Math.round(r.longest.at/60),wallEra:r.longest.era,wallBroke:r.longest.what,
      noTimberMin:Math.round(r.stats.noTimber/60),shortMin:Math.round(r.stats.short/60),negMin:Math.round(r.stats.neg/60),hires:r.stats.hire,
      stumpPct:Math.round(r.stats.stump/r.earned*100),savingMin:Math.round((r.stats.savingT||0)/60),achMin:(r.stats.achT||[]).join(','),upgMin:(r.stats.upgT||[]).join(','),contracts:r.stats.contractsWon+'/'+(r.stats.contractsWon+r.stats.contractsLost)}));
    fs.writeFileSync(__dirname+`/neck_${p}_${seed}.json`,JSON.stringify(r.stats.neck));
  }
}
