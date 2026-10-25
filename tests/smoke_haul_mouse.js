// Hauling is fully playable with the mouse alone (owner feedback): load with the buttons, then drive a whole road with
// pointer events only with the one-button scheme: hold = gas, release = coast, brake by dragging down or holding the brake pedal.
const {JSDOM, VirtualConsole}=require('jsdom');const fs=require('fs');
const errs=[]; const vc=new VirtualConsole(); vc.on('error',e=>errs.push(String(e&&e.stack||e))); vc.on('jsdomError',e=>errs.push('jsdom:'+e.message));
const START="window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});";
const src=fs.readFileSync(__dirname+'/../prototype/timberline.html','utf8');
if(!src.includes(START)) throw new Error('start line not found');
const html=src.replace(START,'window.__eval = s => eval(s); '+START);
const mk=()=>new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,url:'https://x.test/',beforeParse(w){
  w.HTMLCanvasElement.prototype.getContext=function(){return new Proxy({},{get:(t,p)=>p==='measureText'?()=>({width:10}):p in t?t[p]:()=>{},set:(t,p,v)=>(t[p]=v,true)});};
  // the canvas is laid out at its logical size, so client coordinates are canvas coordinates
  w.HTMLCanvasElement.prototype.getBoundingClientRect=function(){return {left:0,top:0,right:640,bottom:400,width:640,height:400,x:0,y:0};};
  w.addEventListener('error',e=>errs.push('win:'+e.message));}});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let fails=0; const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m); if(!c) fails++;};
(async()=>{
 const dom=mk(); await sleep(300); const w=dom.window, d=w.document, E=s=>w.__eval(s);
 const cv=d.getElementById('mgCanvas');
 const pe=(type,x,y)=>cv.dispatchEvent(new w.MouseEvent(type,{bubbles:true,cancelable:true,clientX:x,clientY:y,button:0,buttons:type==='pointerup'?0:1}));
 const click=el=>el.dispatchEvent(new w.MouseEvent('click',{bubbles:true,cancelable:true,button:0}));
 const btn=re=>[...d.querySelectorAll('#mgBtns button')].find(b=>re.test(b.textContent));
 const PD=E('HAUL_PEDAL');
 // one road per style; the driver's decisions come from the par driver, but every input is a pointer event
 const styles={
   hold(state, want){ // single button: hold = gas, drag down = brake, release = coast
     const mode = want.brk ? 'brk' : want.gas ? 'gas' : 'coast'; if (state.m === mode) return;
     if (mode === 'coast'){ pe('pointerup', 320, 200); state.down = false; }
     else { if (!state.down){ pe('pointerdown', 320, 200); state.down = true; } pe('pointermove', 320, mode === 'brk' ? 270 : 200); }
     state.m = mode; },
   pedal(state, want){ // gas by holding the road, brake by holding the pedal
     const mode = want.brk ? 'brk' : want.gas ? 'gas' : 'coast'; if (state.m === mode) return;
     if (state.down){ pe('pointerup', 0, 0); state.down = false; }
     if (mode === 'gas'){ pe('pointerdown', 320, 200); state.down = true; }
     if (mode === 'brk'){ const x = PD.x0 + PD.w/2, y = 400 + PD.y0 + PD.h/2; pe('pointerdown', x, y); state.down = true; }
     state.m = mode; },
 };
 for (const [name, drive] of Object.entries(styles)){
   for (const season of [0, 1, 3]){
     E(`closeMG(); S.season=${season}; S.landing={bf:1e6, val:2e5}; S.upg=[]; S.run.perks=[]; S.owed=0; openMG('haul'); cancelAnimationFrame(MG.raf);`);
     const n0=E('H.n'); click(btn(/^\+ Log/)); const n1=E('H.n'); click(btn(/^− Log/));
     if (name==='hold' && season===0) ok(n1===n0+1 && E('H.n')===n0 && E('H.maxN')>=n1,'loading: + Log and − Log work with mouse clicks');
     click(btn(/^Drive$/)); if (name==='hold' && season===0) ok(E('H.phase')==='drive','loading: Drive works with a mouse click');
     const state={}; let i=0;
     while (E('H.phase')==='drive' && i++ < 20000){
       const want=E('Core.haulPolicy(H.rules.phys, H.v, Core.haulGrade(H.track, H.x))'); drive(state, want);
       E('haulStep(1/60); haulStep(1/60)');
     }
     if (state.down) pe('pointerup', 0, 0);
     const t=E('H.t'), par=E('H.par'), spill=E('H.spill');
     ok(E('H.phase')==='done' && spill===0 && t<=par, `${name} (${['spring','summer','fall','winter'][season]}): mouse-only haul reaches the cove under par with no runaway (${t.toFixed(1)} s, par ${par})`);
   }
 }
 // controls: no hidden half-screen zones, release coasts, the first drive shows the hint once
 E(`closeMG(); S.ui.haulHint=false; S.landing={bf:1e6, val:2e5}; openMG('haul'); cancelAnimationFrame(MG.raf); haulGo();`);
 ok(E('H.hint')===true && E('S.ui.haulHint')===true,'first drive shows the on-screen controls hint, and remembers it');
 pe('pointerdown', 100, 200); E('haulStep(1/60)'); ok(E('H.ctl.gas')===true,'holding the left half is gas (no hidden brake zone)');
 pe('pointermove', 100, 260); E('haulStep(1/60)'); ok(E('H.ctl.brk')===true,'dragging down while held brakes');
 pe('pointerup', 100, 260); E('haulStep(1/60)'); ok(!E('H.ctl.gas') && !E('H.ctl.brk'),'releasing coasts');
 pe('pointerdown', PD.x0+20, 400+PD.y0+20); E('haulStep(1/60)'); ok(E('H.ctl.brk')===true,'holding the brake pedal brakes'); pe('pointerup', 0, 0);
 ok(/Hold on the road for gas/.test(d.getElementById('mgStatus').textContent),'drive instructions explain the one-button controls');
 E('haulDraw()');
 E(`closeMG(); openMG('haul'); cancelAnimationFrame(MG.raf); haulGo();`); ok(E('H.hint')===false,'later drives skip the hint');

 E('closeMG()');
 await sleep(100);
 ok(errs.length===0,'no console errors'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
 console.log(fails?`${fails} FAILED`:'ALL PASS'); process.exit(fails?1:0);
})();
