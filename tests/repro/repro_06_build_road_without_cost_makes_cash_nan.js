// BUG QA-06 (minor, hardening; the button is hidden in the UI so a player cannot reach it today): buildRoad() on a tract with no roadCost
// (the starting Cove woodlot, and any tract from an old save) does S.cash -= undefined, so cash becomes NaN. Nothing re-sanitises cash afterwards
// (tick, payroll and every buy compare against NaN), and save() writes null.
const {mk,ok,fails}=require('./_h');
(async()=>{
 const g=await mk(); const {E}=g;
 E('S.cash=1000; buildRoad()');
 ok(Number.isFinite(E('S.cash')),'cash after buildRoad() on the starting tract: '+E('S.cash'));
 process.exit(fails()?1:0);
})();
