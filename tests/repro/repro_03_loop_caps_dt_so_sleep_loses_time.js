// BUG QA-03 (major, needs a human check in a real hidden tab): the game loop clamps dt to 5 s (timberline.html ~7598) and the only catch-up
// (offline()) runs at page load. A browser that throttles a hidden tab (Chrome: one timer a minute after 5 minutes hidden), a sleeping laptop or a
// frozen tab therefore gives the player at most 5 game seconds per timer callback. Idle progress is the game's first pillar.
// Expected: after a 10-minute gap between callbacks the game advances ~10 minutes (same catch-up as a reload).
const {mk,sleep,ok,fails}=require('./_h');
(async()=>{
 let p=0; const g=await mk(null,{live:true,wait:400,pre:(w)=>{ Object.defineProperty(w.performance,'now',{value:()=>p,configurable:true}); }});
 const {E}=g; const t0=E('S.t'); p+=600000; await sleep(350); const t1=E('S.t');
 ok(t1-t0>=590,'10 minutes between timer callbacks advance the game by '+(t1-t0).toFixed(1)+' s (expected ~600)');
 process.exit(fails()?1:0);
})();
