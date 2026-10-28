// Playtest 2: the company warehouse, Prime timber and finds, special orders and the bonus cap, the Sawmill camp
// (opening and crate, separate cash, structures that stay built, the log slider and pond, cove buying, Saw for grade
// played with the mouse only, plank bundles and bunkhouse levels) and per-skill close camp.
const {JSDOM, VirtualConsole}=require('jsdom');const fs=require('fs');
const errs=[]; const vc=new VirtualConsole(); vc.on('error',e=>errs.push(String(e&&e.stack||e))); vc.on('jsdomError',e=>errs.push('jsdom:'+e.message));
const START="window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});";
const src=fs.readFileSync(__dirname+'/../prototype/timberline.html','utf8');
if(!src.includes(START)) throw new Error('start line not found');
const html=src.replace(START,'window.__eval = s => eval(s); '+START);
let mathCalls=0;
const mk=(store,seed)=>new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,url:'https://x.test/',beforeParse(w){
  if(store) for(const k in store) w.localStorage.setItem(k,store[k]);
  let x=seed||11; w.Math.random=()=>{ mathCalls++; x=(x*9301+49297)%233280; return x/233280; };
  w.HTMLCanvasElement.prototype.getContext=function(){return new Proxy({},{get:(t,p)=>p==='measureText'?()=>({width:10}):p in t?t[p]:()=>{},set:(t,p,v)=>(t[p]=v,true)});};
  w.HTMLCanvasElement.prototype.getBoundingClientRect=function(){return {left:0,top:0,right:640,bottom:400,width:640,height:400,x:0,y:0};};
  w.addEventListener('error',e=>errs.push('win:'+e.message));}});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let fails=0; const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m); if(!c) fails++;};
async function baseSave(){ const dom=mk(); await sleep(300); const w=dom.window; w.dispatchEvent(new w.Event('pagehide'));
  const st=JSON.parse(w.localStorage.getItem('timberline-v2')); dom.window.close(); st.last=Date.now(); return st; }
(async()=>{
 const base=await baseSave();
 let dom=mk({'timberline-v2':JSON.stringify(base)}); await sleep(300); let w=dom.window, d=w.document, E=s=>w.__eval(s);
 const $=id=>d.getElementById(id);
 // The game seeds its drops/saw streams from Date.now() (freshRng), so log rolls differed every run. Pin them.
 const SEED=+process.env.SAW_SEED||1234567;
 E(`S.rng.drops=${SEED}; S.rng.saw=${SEED*7+13}`);
 // ---------- 1. warehouse
 ok(E('bankTotal()')===0 && $('lsWhV').textContent==='0 items' && $('lsOrdV').textContent==='None' && $('tabMill').hidden,'new company: empty warehouse in the sidebar, no Sawmill row yet');
 ok(E('Core.ITEMS.length')===8 && E(`Core.ITEMS.every(i=>i.id.includes('.'))`),'item definitions are data in core, namespaced by skill');
 E(`addItem('logging.burl', 3); addItem('logging.fog_glass', 1); render(true)`);
 ok($('lsWhV').textContent==='4 items' && !$('lsWhNew').hidden && /4 new/.test($('lsWhNew').textContent),'ledger strip counts items with a new badge: '+$('lsWhNew').textContent);
 $('lsWh').click();
 ok(!$('wh').hidden && $('lsWhNew').hidden && d.querySelectorAll('#whBody .witem').length===2,'clicking the warehouse opens it and clears the new badge');
 const c0=E('S.cash'); d.querySelector('[data-s1="logging.burl"]').click();
 ok(E(`bankN('logging.burl')`)===2 && E('S.cash')-c0===E(`Core.itemSellPrice('logging.burl', 0)`),'Sell 1 pays the item price into the logging camp');
 d.querySelector('[data-lk="logging.fog_glass"]').click(); ok(E('S.locks.includes("logging.fog_glass")'),'lock an item');
 $('whSurplus').click(); ok(E(`bankN('logging.burl')`)===0 && E(`bankN('logging.fog_glass')`)===1,'Sell surplus sells unlocked items and keeps locked ones');
 [...$('whTabs').querySelectorAll('button')].find(b=>b.dataset.t==='log').click();
 const logTxt=$('whBody').textContent; ok(/2 of 8 found/.test(logTxt) && /\?\?\?/.test(logTxt) && /Burl/.test(logTxt) && /3 in all/.test(logTxt),'collection log: found items with lifetime count, ??? for the rest');
 [...$('whTabs').querySelectorAll('button')].find(b=>b.dataset.t==='ledger').click(); ok(/Item sales/.test($('whBody').textContent),'ledger tab');
 $('whClose').click();
 // ---------- 2. Prime timber and finds (separate seeded stream: no Math.random draws)
 E(`S.orders.autoFill=false; S.vis='pine'; F={sp:'pine', out:{k:'perfect', m:1.25, text:''}, phase:'fall'}; MG.kind='fell'`);
 const sp0=E(`bankN(SPAR)`), m0=mathCalls; E(`fellPrime('perfect','pine'); fellPrime('perfect','hemlock'); fellPrime('perfect','spruce'); fellPrime('good','spruce')`);
 ok(E(`bankN(SPAR)`)-sp0===5,'perfect fall: pine 1 Prime spar, hemlock 1, spruce 3 (the 1/3/1 split); a good fall none (without Spar man)');
 ok(E(`Core.primeFromBuck('pine', [{len:12,g:1},{len:16,g:1},{len:14,g:1},{len:10,g:1}], .92).qty`)===2 && E(`Core.primeFromBuck('pine', [{len:16,g:1}], .89)`)===null,'bucking: grade 1 logs of 12 ft+ at 90%+, two at most');
 ok(Math.abs(E('Core.idlePrimeChance(0)')-.02)<1e-12 && Math.abs(E('Core.idlePrimeChance(3)')*120000-1.2)<1e-9,'idle Prime: 2% at Cove Landing, ~1.2 a tract later');
 const tr=E(`JSON.stringify(Core.makeTract('t',[['pine',1]],1000,1,'flat'))`); E(`window.__t=${tr}; for(let i=0;i<5000;i++) idlePrime(window.__t, 1)`);
 const idleP=E('S.run.idlePrime'); ok(idleP>=60 && idleP<=145,`idle crews stamp about 1 tree in 50 Prime (${idleP} of 5000)`);
 E(`S.run.gameFinds=0`); for(let i=0;i<400;i++) E(`gameFind('haul', 1)`); const top=E('S.run.gameFinds'); E(`S.run.gameFinds=0`); for(let i=0;i<400;i++) E(`gameFind('haul', .2)`); const low=E('S.run.gameFinds');
 ok(top>60 && low===0,`better results find more: top-tier haul ${top}/400, low-tier ${low}/400 (fittings are uncommon)`);
 E(`S.run.gameFinds=0`); for(let i=0;i<400;i++) E(`gameFind('fell', .6)`); const mid=E('S.run.gameFinds'); ok(mid>15 && mid<70 && E(`(S.found['logging.fog_glass']||{}).total`)>=1,`mid tier rolls ×0.4 (${mid}/400); rares come from top results`);
 ok(mathCalls===m0,'finds and Prime draw from their own stream, never Math.random (logging sim stays byte-exact)');
 E(`S.run.idleFinds=0; S.util={fell:1,buck:1,skid:1,haul:1}; for(let i=0;i<30000;i++) idleFinds(1, {fell:1,buck:1,skid:1,haul:1})`);
 const idf=E('S.run.idleFinds'); ok(idf>=35 && idf<=90,`idle finds: about 2% per stage-minute, 6% at the buck (${idf} in 2,000 stage-minutes)`);
 // ---------- 3. special orders and the cap
 E(`addItem('logging.amber_pitch', 1)`);
 ok(E(`S.orders.open.some(o=>o.id==='admiralty_spar')`) && E(`S.orders.open.some(o=>o.id==='caulk_perseverance')`),'Admiralty posts on the first Prime spar, Caulk on the first pitch and fitting');
 E('render(true)'); ok(/Admiralty \d+\/18|Perseverance \d+\/9/.test($('lsOrdV').textContent),'ledger strip shows the closest open order: '+$('lsOrdV').textContent);
 E(`S.bank={}; S.orders.open.forEach(o=>o.given={}); S.orders.autoFill=false; render(true)`);
 ok(d.querySelectorAll('#specials .sorder').length===2,'order board lists both special orders');
 E(`addItem('logging.prime_spar', 16); addItem('logging.amber_pitch', 2); render(true)`);
 d.querySelector('[data-hand="admiralty_spar"]').click();
 ok(!E(`S.orders.open.some(o=>o.id==='admiralty_spar')`) && Math.abs(E('S.orders.bonusPct')-.15)<1e-9 && E(`S.orders.perks.includes('sparman')`),'filling Admiralty: +15% bonus, Spar man unlocked');
 ok(E(`perkPool().some(p=>p.id==='sparman')`) && !E(`perkPool().some(p=>p.id==='pitchboiler')`),'an unlocked order perk joins the Logging draft pool');
 E(`S.orders.autoFill=true; addItem('logging.amber_pitch', 6); addItem('logging.ships_fitting', 3)`);
 ok(!E(`S.orders.open.length`) && Math.abs(E('S.orders.bonusPct')-.23)<1e-9 && E(`bankN('logging.burl')`)===2,'auto-fill fills Caulk the Perseverance: +8%, 2 burls back');
 E(`S.run.deliv=5e6; S.orders.bonusPct=.6`); const baseL=E(`Core.legacyGain(S.run.deliv, S.era, S.run.mods, !!meta('legacy'))`);
 ok(E('legacyNow()')===Math.floor(baseL*1.25),`bonus is capped at +25%: ${baseL} -> ${E('legacyNow()')}`);
 E(`S.orders.bonusPct=0`); ok(E('legacyNow()')===baseL,'no orders: Charter Shares unchanged');
 // missed order: withdrawn with no penalty, items back, returns two outposts later
 E(`S.orders.open=[{id:'admiralty_spar', posted:1, due:1, given:{'logging.prime_spar':5}}]; S.orders.filledAt={}; S.bank['logging.prime_spar']=0`);
 // ---------- 4. first close camp opens the Sawmill with the crate
 const shares0=E('S.meta.legacy');
 E(`S.run.deliv=Core.CLOSE_VOL+1; S.orders.bonusPct=.08`); const expL=E('legacyNow()');
 ok(expL===Math.floor(E(`Core.legacyGain(S.run.deliv, S.era, S.run.mods, false)`)*1.08),'close-camp value includes the special-order bonus');
 E('closeCamp(); save(); boot();');
 ok(E('S.meta.legacy')-shares0===expL && E('S.orders.bonusPct')===0,'close camp pays the bonus once, then resets it');
 ok(E(`bankN('logging.prime_spar')`)>=5+6-5 && E(`S.orders.back.admiralty_spar`)===3 && !E(`S.orders.open.some(o=>o.id==='admiralty_spar')`),'missed order: withdrawn, hand-ins returned, back in two outposts, no penalty');
 ok(E('S.story.sawmillOpened') && E('!!S.camps.sawmill') && E('S.bulk.logs')===20000 && E('S.structures["sawmill.pit"]')===1,'first close camp opens the Sawmill: saw pit and 20,000 bd ft in the log pond');
 ok(E(`bankN('logging.amber_pitch')`)>=2 && E(`bankN('logging.ships_fitting')`)>=1 && E('S.camps.sawmill.cash')===Core_c(E),'founding crate: Prime spars, pitch, a fitting, and the mill’s own starting cash');
 function Core_c(E){ return E('Core.FOUNDING_CRATE.cash + Core.CAMP_MONEY.crateCash'); }
 ok(E('S.story.card')===true && E('S.bank.logging_burl===undefined') && E(`bankN('logging.burl')`)===2,'warehouse contents survive close camp; story card waits');
 E(`$('newrun').hidden=true; maybeStory()`); ok(!$('story').hidden && /Saw them here/.test($('stBody').textContent),'one-time story card');
 $('stGo').click(); ok($('story').hidden && E('S.ui.camp')==='sawmill' && !$('millView').hidden && $('logView').hidden && !$('tabMill').hidden && $('tabMill').getAttribute('aria-current')==='page','Open the Sawmill switches to the Sawmill screen');
 E('S.run.n===2 && (S.run.setup=false)');
 ok(E(`S.orders.open.some(o=>o.id==='admiralty_spar')`)===false,'missed order stays away until outpost 3');
 // ---------- 5. separate cash, structures, cove buying
 ok($('lsCashL').textContent==='Cash · Sawmill' && $('lsCashV').textContent===E('money(S.camps.sawmill.cash)'),'ledger strip shows the mill’s cash on the Sawmill tab');
 E(`S.cash=5000; S.camps.sawmill.cash=500; render(true)`);
 const pondBtn=d.querySelector('[data-build="sawmill.pond"]'); ok(!!pondBtn && !pondBtn.disabled,'Mill pond & wheel is buildable from the crate');
 const lc=E('S.cash'), sp1=E('bankN(SPAR)'); pondBtn.click();
 ok(E('S.structures["sawmill.pond"]')===1 && E('S.camps.sawmill.cash')===400 && E('S.cash')===lc && E('bankN(SPAR)')===sp1-3,'building pays mill cash and warehouse items; logging cash untouched');
 d.querySelector('[data-build="sawmill.headrig"]').click(); ok(E('S.structures["sawmill.headrig"]')===1 && E('S.camps.sawmill.cash')===150,'Circular headrig built');
 ok(E('millSawyers()')===4 && E('Core.maxSawyers(S.structures)')===60,'headrig brings 2 sawyers and room for more');
 const hc=E('Core.sawyerCost(0)'); $('mHire').click(); ok(E('millSawyers()')===5 && E('S.camps.sawmill.cash')===150-hc && E('S.cash')===lc,'hiring a sawyer pays mill cash');
 E(`S.bulk.logs=0; S.camps.sawmill.cash=100; S.camps.sawmill.sawn=0`); const mc=E('S.camps.sawmill.cash');
 E('millTick(10)'); ok(E('S.camps.sawmill.sawn')>0 && E('S.camps.sawmill.logCost')>0,'dry pond: the mill buys cove logs with its own cash and keeps sawing');
 E(`S.camps.sawmill.buyCove=false; window.__s=S.camps.sawmill.sawn; millTick(10)`); ok(E('S.camps.sawmill.sawn')===E('window.__s'),'cove buying off: a dry pond stops the saws'); E('S.camps.sawmill.buyCove=true');
 E(`S.bulk.logs=1000; window.__c=S.camps.sawmill.cash; millTick(10)`); ok(E('S.bulk.logs')<1000 && E('S.camps.sawmill.cash')>E('window.__c'),'with logs in the pond it saws them first (no cove cost) and sells lumber');
 void mc;
 // ---------- 6. slider and the log pond
 $('tabLog').click(); ok(!$('millSl').hidden && E('S.millShare')===.1 && $('millShare').value==='10','log slider on the logging board, default 10%');
 E(`S.landing={bf:1000,val:200}; S.contracts=[]; S.owed=0; S.bulk.logs=0; S.camps.sawmill.cash=1e4`); const cashA=E('S.cash'), mc6=E('S.camps.sawmill.cash'); const rev=E('deliver(1000)');
 const paid6=mc6-E('S.camps.sawmill.cash');
 E(`S.millShare=0; S.landing={bf:1000,val:200}`); const rev0=E('deliver(1000)');
 ok(E('S.bulk.logs')===100 && Math.abs(rev/rev0-.95)<1e-9 && Math.abs(paid6-rev0*.05)<1e-9,'empty pond: the 10% cap of a delivery floats to the pond; the mill pays half the cove price for it from mill cash');
 const inp=$('millShare'); inp.value='50'; inp.dispatchEvent(new w.Event('input',{bubbles:true})); ok(E('S.millShare')===.5 && /50%/.test($('millShareV').textContent),'slider goes up to 50%');
 inp.value='0'; inp.dispatchEvent(new w.Event('input',{bubbles:true})); ok(E('S.millShare')===0,'and down to 0%'); E('S.millShare=.1'); void cashA;
 // ---------- 7. plank bundles and the bunkhouse
 ok(!$('bunkGroup').hidden,'bunkhouse shows at the logging camp');
 E(`S.camps.sawmill.comAcc=0; window.__b=bankN(BUNDLE); sawLumber({common:2000})`); ok(E('bankN(BUNDLE)')-E('window.__b')===4,'Common lumber makes plank bundles (1 per 500 bd ft)');
 const up0=E('fullUpkeep()'), cost0=E(`eqCost(EQ.find(e=>e.id==='axeman'))`); E(`S.own={axeman:3,bucker:2}`); const upA=E('fullUpkeep()');
 E('render(true)'); $('bunkBuy').click();
 ok(E('S.structures["logging.bunkhouse"]')===1 && Math.abs(E('fullUpkeep()')/upA-.95)<1e-9,'bunkhouse level 1: crew upkeep ×0.95');
 E(`S.bank[BUNDLE]=24; render(true)`); $('bunkBuy').click(); E('render(true)'); $('bunkBuy').click();
 ok(E('S.structures["logging.bunkhouse"]')===3 && Math.abs(E('bunkF()')-Math.pow(.95,3))<1e-12 && !d.getElementById('bunkBuy'),'bunkhouse levels 2 and 3 (8 and 16 bundles); finished at 3');
 ok(E(`eqCost(EQ.find(e=>e.id==='axeman'))`)<E(`Core.equipmentCost(40, S.own.axeman)`),'hiring is cheaper with the bunkhouse');
 E(`S.camps.sawmill.comAcc=0; window.__b=bankN(BUNDLE); sawLumber({common:2000})`); ok(E('bankN(BUNDLE)')===E('window.__b'),'once the bunkhouse is done, Common is sold instead of bundled');
 void up0; void cost0;
 // ---------- 8. Saw for grade, mouse only
 $('tabMill').click(); E(`S.bulk.logs=1e6; S.camps.sawmill.cash=1000; S.ui.sawIntro=false`);
 const cv=$('mgCanvas'); const pe=(type,x,y,button=0)=>cv.dispatchEvent(new w.MouseEvent(type,{bubbles:true,cancelable:true,clientX:x,clientY:y,button,buttons:type==='pointerup'?0:1}));
 const tap=(x,y,b=0)=>{ pe('pointerdown',x,y,b); pe('pointerup',x,y,b); };
 $('mSawBtn').click(); E('cancelAnimationFrame(MG.raf)');
 ok(E('MG.kind')==='saw' && E('W.phase')==='pick' && !$('mgGuide').hidden && /How to saw boards/.test($('mgGuideT').textContent) && d.querySelectorAll('#mgGuide li').length===3,'Saw boards opens on the log deck with its 3-step guide');
 $('mgGuideOk').click(); ok(E('S.ui.sawIntro')===true,'guide dismissed and remembered');
 const pos=E('deckPos(W.deck.length)'); tap(pos[0].x,pos[0].y);
 ok(E('W.phase')==='saw' && E('W.par')>0,'clicking a log on the deck rolls it onto the carriage; par is set from that log');
 const yard0=E('S.camps.sawmill.sawn'), g0=E('S.camps.sawmill.games');
 // play by the sawyer's mark, with pointer clicks on the on-canvas SAW and TURN buttons
 const B=E('SAW_BTN'); let acts=0;
 while(E('W.phase')==='saw' && acts<200){ const a=E('Core.sawAdvice(W.log, W.cut, sawEye())'); const r=a==='turn'?B.turn:B.saw; tap(r.x+10,r.y+10); E('sawStep(W.busy+.05)'); acts++; }
 const st1=$('mgStatus').textContent;
 ok(E('W.phase')==='done' && /% of target/.test(st1),'a mouse-only run finishes: '+st1.slice(0,100));
 ok(E('S.camps.sawmill.sawn')>yard0 && E('S.camps.sawmill.games')===g0+1 && E('W.res.score')>=.95,`boards go to the yard; following the mark scores ${Math.round(E('W.res.score')*100)}% of par`);
 // right-click turns
 [...d.querySelectorAll('#mgBtns button')].find(b=>/Saw another/.test(b.textContent)).click(); E('cancelAnimationFrame(MG.raf)');
 const p2=E('deckPos(W.deck.length)'); tap(p2[0].x,p2[0].y); const f0=E('W.cut.face'); tap(320,175,2); ok(E('W.cut.face')===(f0+1)%4,'right-click turns the log');
 E('sawStep(25)'); ok(E('W.phase')==='done' && /time ran out/.test($('mgStatus').textContent),'time running out saws the rest as Common (no zero runs)');
 // a great run on a Prime log makes Quarter-sawn boards
 E(`(()=>{ for(let i=0;i<200;i++){ const l=Core.genSawLog(sawRng,{prime:true}); if(Core.sawBest(l)/Core.sawPar(l)>=1.25){ window.__pl=l; return; } } })()`);
 ok(E('!!window.__pl'),'found a Prime log with room to beat par');
 E(`S.bank[SPAR]=5; W=null; sawInit(0); W.deck=[{log:window.__pl, src:'prime'}]; cancelAnimationFrame(MG.raf)`);
 tap(320,185); ok(E('W.phase')==='saw' && E('bankN(SPAR)')===4,'a Prime log uses a Prime spar from the warehouse');
 // best play by pointer: turn to the face the full-knowledge plan wants, then saw
 for(let k=0;k<200 && E('W.phase')==='saw';k++){
   const f=E(`(()=>{ let bf=0, bv=-1; for(let f=0;f<4;f++){ const c={...W.cut, opened:[...W.cut.opened], boards:[], face:f}; const b=Core.sawBoard(W.log,c); const v=Core.boardValue(W.log,b)+Core.sawBest(W.log,c)-0; if(v>bv+1e-9){bv=v;bf=f;} } return bf; })()`);
   if(E('W.cut.face')!==f){ tap(B.turn.x+5,B.turn.y+5); } else { tap(B.saw.x+5,B.saw.y+5); } E('sawStep(W.busy+.01)');
 }
 ok(E('W.phase')==='done' && E('W.res.q')>=.97 && E(`bankN('sawmill.quarter_sawn')`)>=1,`a great run on a Prime log (${Math.round(E('W.res.score')*100)}% of par) makes ${E(`bankN('sawmill.quarter_sawn')`)} Quarter-sawn board(s)`);
 E('closeMG()');
 // drafts from the mill use the existing draft system with Sawmill perks
 E(`S.camps.sawmill.dq=[.9]; S.camps.sawmill.offer=null; render(true)`); $('mDraftBtn').click();
 const cards=[...d.querySelectorAll('#dCards .pcard')].map(b=>b.dataset.p);
 ok(!$('draft').hidden && cards.length>=2 && cards.every(id=>E(`Core.SAW_PERKS.some(p=>p.id==='${id}')`)) && /Sawmill/.test($('dTitle').textContent),'Sawmill draft offers Sawmill perks: '+cards.join(','));
 d.querySelector('#dCards .pcard').click(); ok(E('S.camps.sawmill.perks.length')===1 && E('S.run.perks.includes(window.__x)')===false,'picked perk goes to the mill, not Logging');
 ok(E('Core.SAW_PERKS.length')===5,'5 Sawmill perks');
 // ---------- 9. per-skill close camp
 const logN=E('S.run.n'), logCash=E('S.cash'), struct=E('JSON.stringify(S.structures)');
 E(`S.camps.sawmill.sawn=Core.MILL_CLOSE_BF; render(true)`); $('mCloseArm').click(); $('mCloseYes').click();
 ok(E('S.camps.sawmill.n')===2 && E('S.shares.sawmill.legacy')>0 && E('S.camps.sawmill.sawn')===0 && E('S.camps.sawmill.perks.length')===0,'closing the mill banks Sawmill Charter Shares and resets the mill');
 ok(E('S.run.n')===logN && E('S.cash')===logCash && E('JSON.stringify(S.structures)')===struct,'closing the mill never resets Logging, and structures stay built');
 const mN=E('S.camps.sawmill.n'), mCash=E('S.camps.sawmill.cash'); E(`S.run.deliv=Core.CLOSE_VOL+1; closeCamp()`);
 ok(E('S.camps.sawmill.n')===mN && E('S.camps.sawmill.cash')===mCash && E('JSON.stringify(S.structures)')===struct && E('S.run.n')===logN+1,'closing Logging never resets the mill; structures stay');
 E(`S.run.setup=false; postOrders()`); ok(E('S.run.n')===3 && E(`S.orders.open.some(o=>o.id==='admiralty_spar')`),'the missed order writes again two outposts later');
 w.dispatchEvent(new w.Event('pagehide')); const saved=JSON.parse(w.localStorage.getItem('timberline-v2'));
 ok(saved.camps.sawmill && saved.structures['sawmill.pond']===1 && saved.bank && saved.shares.sawmill.legacy>0,'Sawmill, structures, warehouse and Sawmill shares are saved');
 dom.window.close();
 // ---------- 10. old saves
 const old=JSON.parse(JSON.stringify(base)); ['bank','found','locks','orders','structures','camps','shares','story','millShare','bulk','rng','dropT','mruns','newCount'].forEach(k=>delete old[k]); old.ui={buyN:1};
 dom=mk({'timberline-v2':JSON.stringify(old)}); await sleep(300); w=dom.window; let E2=s=>w.__eval(s);
 ok(E2('bankTotal()')===0 && E2('S.orders.autoFill')===true && !E2('S.camps.sawmill') && E2('S.millShare')===.1 && E2('S.ui.camp')==='logging','an old save without playtest-2 fields loads with defaults');
 dom.window.close();
 const keep=JSON.parse(JSON.stringify(base)); keep.millShare=.2;
 dom=mk({'timberline-v2':JSON.stringify(keep)}); await sleep(300); w=dom.window; E2=s=>w.__eval(s);
 ok(E2('S.millShare')===.2,'a save with a slider value (even the old 20% default) keeps it');
 dom.window.close();
 const vet=JSON.parse(JSON.stringify(old)); vet.runs=[{n:1,min:30,deliv:3e5,earned:1e4,legacy:4,era:0,mods:[],perks:3,eraT:[]}]; vet.run.n=2; vet.run.init=true;
 dom=mk({'timberline-v2':JSON.stringify(vet)}); await sleep(300); w=dom.window; E2=s=>w.__eval(s);
 ok(E2('!!S.camps.sawmill') && E2('bankN(SPAR)')===6 && E2('S.bulk.logs')>19000 && !w.document.getElementById('tabMill').hidden && !w.document.getElementById('story').hidden,'an old save past its first close camp receives the Sawmill, the crate and the story card');
 dom.window.close();

 await sleep(100);
 ok(errs.length===0,'no console errors'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
 console.log(fails?`${fails} FAILED`:'ALL PASS'); process.exit(fails?1:0);
})();
