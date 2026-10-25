// Bug-hunt fixes (docs/qa/bug-hunt-2026-10-25.md) beyond the repro tests in tests/repro: catch-up when the tab wakes (visibility,
// focus, Date.now gaps), the 4 h cap told to the player, the damaged-save notice and its Save backup button, past-outpost rows
// validated on load, a sticky first-sighting card giving way, the Saw for grade hold refunded on reload, and fmt edge cases.
const {mk,sleep,ok,fails}=require('./repro/_h');
(async()=>{
 // ---------- QA-03: a Date.now gap (sleeping machine: performance.now stood still) caught up on the next tick, with the summary
 {
  const g=await mk(null,{live:true,wait:400}); const {E,clock,w,d}=g;
  let t0=E('S.t'); clock.now+=20*60*1000; await sleep(250);
  ok(E('S.t')-t0>=1190,'a 20 min wall-clock gap is caught up by the loop: +'+(E('S.t')-t0).toFixed(0)+' s');
  ok(E('S.log.some(l=>/While away/.test(l.text))') || E('S.felled')===0,'the catch-up writes the While away line when anything happened');
  // visibilitychange to visible runs the same catch-up straight away
  E('clearInterval(loop)'); t0=E('S.t'); clock.now+=15*60*1000;
  Object.defineProperty(d,'hidden',{value:false,configurable:true}); d.dispatchEvent(new w.Event('visibilitychange'));
  ok(E('S.t')-t0>=890,'visibilitychange (visible) catches up 15 min at once: +'+(E('S.t')-t0).toFixed(0)+' s');
  t0=E('S.t'); clock.now+=12*60*1000; w.dispatchEvent(new w.Event('focus'));
  ok(E('S.t')-t0>=710,'window focus catches up too: +'+(E('S.t')-t0).toFixed(0)+' s');
  // the cap: 9 h away counts 4 h and says so
  t0=E('S.t'); E('dispQ.length=0; dCur=null'); clock.now+=9*3600*1000; w.dispatchEvent(new w.Event('focus'));
  const dt=E('S.t')-t0; ok(dt>=4*3600-1 && dt<=4*3600+1,'9 h away counts exactly the 4 h cap: '+dt.toFixed(0)+' s');
  const away=E('JSON.stringify(dispQ.concat(dCur?[dCur]:[]).filter(c=>c.kind==="away").map(c=>c.lines))');
  ok(/away 9 h.*first 4 h/.test(away),'the return summary says the cap applied: '+away.slice(0,160));
  ok(E('S.log.some(l=>/9 h, counted 4 h|only 4 h counted/.test(l.text))'),'the activity log names both times');
  ok(!g.errs.length,'no console errors: '+g.errs.slice(0,2).join(' | ').slice(0,300));
  g.dom.window.close();
 }
 // ---------- QA-08: a damaged save is kept, the player is told, and Save backup can show it
 {
  const bad='{"v":2,"cash":123,"own":{"axeman":3';
  const g=await mk({'timberline-v2':bad},{wait:400}); const {E,w,d}=g;
  ok(w.localStorage.getItem('timberline-v2-broken')===bad,'the unreadable text is kept under timberline-v2-broken');
  ok(E('S.log.some(l=>/could not be read/.test(l.text))'),'the activity log tells the player');
  E("openWh('ledger')"); const b=d.getElementById('svBroken');
  ok(!!b,'Save backup offers "Show the damaged save"');
  if(b){ b.click(); ok(d.getElementById('svOut').value===bad && !d.getElementById('svOut').hidden,'the button shows the damaged text for copying'); }
  E('save()'); ok(w.localStorage.getItem('timberline-v2-broken')===bad,'autosave does not touch the backup');
  g.dom.window.close();
  // a non-v2 save is kept the same way
  const g2=await mk({'timberline-v2':'{"v":1,"cash":5}'},{wait:300});
  ok(g2.w.localStorage.getItem('timberline-v2-broken')==='{"v":1,"cash":5}','a save of another version is kept too');
  g2.dom.window.close();
 }
 // ---------- QA-12 / QA-06: damaged runs rows and cash load without breaking the page
 {
  const save=JSON.stringify({v:2,cash:null,runs:[{n:1},null,'x',{n:2,era:99,mods:['nope'],min:'a'}],mruns:[{},7]});
  const g=await mk({'timberline-v2':save},{wait:400}); const {E,d}=g;
  ok(E('S.cash')===0,'cash:null loads as 0');
  ok(E('S.runs.length')===2 && E('S.runs.every(x=>Array.isArray(x.mods) && ERAS[x.era])'),'runs rows are cleaned: '+E('JSON.stringify(S.runs)'));
  ok(E('S.mruns.length')===1,'mill runs rows are cleaned');
  ok(/Outpost 2/.test(d.getElementById('pastRuns').textContent),'the past outposts list renders');
  ok(!g.errs.length,'no console errors: '+g.errs.slice(0,2).join(' | ').slice(0,300));
  g.dom.window.close();
 }
 // ---------- QA-13: a sticky first-sighting card gives way to a newer card after a season
 {
  const g=await mk(null,{wait:300}); const {E}=g;
  E(`dispQ.length=0; dCur=null; S.weather.seen={}; dispQ.push({kind:'event', id:'ice_bridge', first:true}); renderDispatch()`);
  ok(E('dCur && dCur.sticky'),'first sighting is sticky');
  E(`S.t+=SEASON_LEN*2; renderDispatch()`); ok(E('dCur && dCur.id')==='ice_bridge','with nothing waiting it stays up');
  E(`dispQ.push({kind:'event', id:'blizzard', first:true}); renderDispatch()`);
  ok(E('dCur && dCur.id')==='blizzard','a newer card replaces it once it has been up a season: '+E('dCur && dCur.id'));
  g.dom.window.close();
 }
 // ---------- QA-02: a log picked but not sawn when the page closes comes back on reload
 {
  const g=await mk(null,{wait:300}); const {E,w}=g;
  E('S.run.deliv=Core.CLOSE_VOL+1; closeCamp(); S.run.setup&&startRun([]); S.bulk.logs=20000; S.bank[SPAR]=3; S.story.card=false');
  E('openMG("saw"); cancelAnimationFrame(MG.raf); W.deck=[{log:Core.genSawLog(sawRng,{prime:true}),src:"prime"}]; sawPick(0); save()');
  ok(E('bankN(SPAR)')===2,'picking holds the spar');
  const g2=await mk({'timberline-v2':w.localStorage.getItem('timberline-v2')},{wait:300});
  ok(g2.E('bankN(SPAR)')===3 && !g2.E('S.camps.sawmill.sawHold'),'reload gives the held spar back');
  // sawing a board makes the log spent: closing then refunds nothing
  E('closeMG(); openMG("saw"); cancelAnimationFrame(MG.raf); W.deck=[{log:Core.genSawLog(sawRng,{prime:true}),src:"prime"}]; sawPick(0); sawSaw(); closeMG()');
  ok(E('bankN(SPAR)')===2,'after the first board the spar is spent');
  g.dom.window.close(); g2.dom.window.close();
 }
 // ---------- QA-05 / QA-07: fmt and the lock
 {
  const g=await mk(null,{wait:300}); const {E,d}=g; const f=n=>E(`fmt(${n})`);
  ok(f(9.96)==='10' && f(999.4)==='999' && f(999.6)==='1.00K' && f(9999)==='10.0K' && f(99999)==='100K' && f(-999999)==='-1.00M' && f(1234567)==='1.23M',
    'fmt: '+[9.96,999.4,999.6,9999,99999,-999999,1234567].map(f).join(' '));
  E(`S.orders.autoFill=false; S.locks.push('logging.prime_spar'); addItem('logging.prime_spar',4,true); openWh('stock')`);
  ok(d.querySelector('[data-s1="logging.prime_spar"]').disabled && d.querySelector('[data-sa="logging.prime_spar"]').disabled,'Sell 1 and Sell all are disabled on a locked item');
  d.querySelector('[data-lk="logging.prime_spar"]').click();
  ok(!d.querySelector('[data-sa="logging.prime_spar"]').disabled,'unlocking enables them again');
  g.dom.window.close();
 }
 console.log(fails()?'FAILURES: '+fails():'ALL PASS'); process.exit(fails()?1:0);
})();
