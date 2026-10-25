// BUG QA-02 (major): sawPick() spends the Prime spar and the pond logs the moment a log is picked. Done / Escape / the X / a page reload
// before the first board throws them away: no lumber, no refund. Expected: nothing is spent until the log is sawn (or it is refunded on abandon).
const {mk,ok,fails}=require('./_h');
(async()=>{
 const g=await mk(); const {E}=g;
 E('S.run.deliv=Core.CLOSE_VOL+1; closeCamp(); S.run.setup&&startRun([]); S.bulk.logs=20000; S.bank[SPAR]=3');
 E('openMG("saw"); cancelAnimationFrame(MG.raf); W.deck=[{log:Core.genSawLog(sawRng,{prime:true}),src:"prime"}]; sawPick(0)');
 E('closeMG()');   // the player hits Done before sawing anything
 ok(E('bankN(SPAR)')===3,'abandoning an unsawn Prime log keeps the spar: '+E('bankN(SPAR)')+' of 3');
 const p0=E('S.bulk.logs');
 E('openMG("saw"); cancelAnimationFrame(MG.raf); W.deck=[{log:Core.genSawLog(sawRng,{}),src:"pond"}]; sawPick(0)'); E('closeMG()');
 ok(E('S.bulk.logs')===p0,'abandoning an unsawn pond log keeps the pond logs: '+p0+' -> '+E('S.bulk.logs'));
 process.exit(fails()?1:0);
})();
