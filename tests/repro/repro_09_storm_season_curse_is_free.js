// BALANCE QA-09 (major, owner call): the Storm season curse (bad-event weights x2, +2% Charter Shares per weathered bad event, up to +30%) costs
// almost no speed, because bad events are small. Mean stage factor over a year, by table (ignores the no-two-in-a-row rule, which only lowers the cost):
// plain 0.996, Storm season 0.988 (-0.9%), Ill wind 1.021, Storm season + Ill wind 1.030 (a net BONUS, on top of up to +30% shares).
// Expected for a curse: a visible cost (design target: worst outpost at most 8% slower with Storm season). Here the cost is under 1.5%.
const {mk,ok,fails}=require('./_h');
(async()=>{
 const g=await mk(); const {E}=g;
 const mean=(o)=>E(`(()=>{let tot=0,n=0;for(const sn of Core.SEASONS){const rows=Core.eventWeights(sn,{stormSeason:${!!o.storm}});const W=rows.reduce((a,r)=>a+r.w,0);
   for(const r of rows){let f=0,c=0;for(let t=0;t<150;t+=5)for(const st of ['fell','buck','skid','haul']){const b=Core.seasonFactor(sn,st,{});f+=Core.composeSeason(b,Core.eventStageFactor(r.def,st,t,{illWind:${!!o.ill}}))/b;c++;}tot+=(r.w/W)*(f/c);}n++;}return tot/n;})()`);
 const plain=mean({}), storm=mean({storm:true}), both=mean({storm:true,ill:true});
 ok(storm<plain-0.02,'Storm season alone slows a year by '+((1-storm/plain)*100).toFixed(2)+'% (a curse worth +30% shares should cost more than 2%)');
 ok(both<=plain,'Storm season + Ill wind is '+((both/plain-1)*100).toFixed(2)+'% vs plain (should not be faster than a quiet year while also paying shares)');
 process.exit(fails()?1:0);
})();
