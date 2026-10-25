// BUG QA-04 (minor): closeCamp()'s keep-list has season and st but not year, so the company calendar jumps back to 1890 (the season stays).
// Design (seasonal-events.md section 1): the calendar is company-wide and survives close camp. Effects: almanac "first seen" labels repeat
// ("Winter 1890" twice), activity-log stamps go backwards.
const {mk,ok,fails}=require('./_h');
(async()=>{
 const g=await mk(); const {E}=g;
 E('S.year=1897; S.season=1; S.run.deliv=Core.CLOSE_VOL+1; closeCamp(); S.run.setup&&startRun([])');
 ok(E('S.year')===1897,'year after close camp: '+E('S.year')+' (was 1897); season '+E('season()'));
 process.exit(fails()?1:0);
})();
