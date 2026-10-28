// UI rework slice 1 (docs/design/ui-rework.md): the frame. Sidebar rows route to one screen at a time, the top bar holds the
// only cash display, the bell lists actionable items and routes to them, the phone bottom tabs and More drawer work, screens
// are remembered in S.ui.screen, and an old save without it still loads. Layout and touch are checked in tests/phone.
const {JSDOM, VirtualConsole}=require('jsdom');const fs=require('fs');
const errs=[]; const vc=new VirtualConsole(); vc.on('error',e=>errs.push(String(e&&e.stack||e))); vc.on('jsdomError',e=>errs.push('jsdom:'+e.message));
const START="window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});";
const src=fs.readFileSync(__dirname+'/../prototype/timberline.html','utf8');
if(!src.includes(START)) throw new Error('start line not found');
const html=src.replace(START,'window.__eval = s => eval(s); '+START);
const mk=(save)=>new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,url:'https://x.test/',beforeParse(w){
  if(save) w.localStorage.setItem('timberline-v2',save);
  w.HTMLCanvasElement.prototype.getContext=function(){return new Proxy({},{get:(t,p)=>p==='measureText'?()=>({width:10}):p in t?t[p]:()=>{},set:(t,p,v)=>(t[p]=v,true)});};
  w.addEventListener('error',e=>errs.push('win:'+e.message));}});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let fails=0; const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m); if(!c) fails++;};
(async()=>{
 let dom=mk(); await sleep(300); let w=dom.window, d=w.document, E=s=>w.__eval(s), $=id=>d.getElementById(id);
 const shown=()=>[...d.querySelectorAll('.screen[data-screen]')].filter(s=>!s.hidden).map(s=>s.dataset.screen);
 // ---------- 1. sidebar
 ok(E('S.ui.screen')==='logging' && JSON.stringify(shown())==='["logging"]','a new company opens on the Logging screen, one screen shown');
 ok($('tabLog').getAttribute('aria-current')==='page' && $('tabMill').hidden && /Outpost 1/.test($('navLogSub').textContent),'sidebar: Logging is current with its outpost number; Sawmill row hidden until it opens');
 ok(/Fishing/.test($('navFog').textContent) && /In the fog/.test($('navFog').textContent) && !$('navFog').matches('button'),'Fishing shows greyed "in the fog" and is not a button');
 ok(!!$('tabLog').querySelector('.pb i'),'Logging row has a close-camp bar');
 for (const [id,sc] of [['lsWh','warehouse'],['navShop','shop'],['lsOrd','orders'],['navBoard','board'],['navAlm','almanac'],['navSet','settings'],['tabLog','logging']]){
   $(id).click(); ok(E('S.ui.screen')===sc && JSON.stringify(shown())===`["${sc}"]` && $(id).getAttribute('aria-current')==='page',`sidebar ${id} opens the ${sc} screen`);
 }
 ok(!!$('scrOrders').querySelector('#spGroup') && !!$('scrBoard').querySelector('#legacyPanel') && !!$('scrSet').querySelector('#reset') && !!$('scrShop').querySelector('#shopBody') && !!$('whGrid'),'panels moved whole: orders on the Charter board, the board on the Company board, New company in Settings, shop and grid containers exist');
 ok(!!$('logView').querySelector('#chain') && !!$('logView').querySelector('#sales') && !!$('logView').querySelector('#eq'),'the Logging screen keeps the work chain, land office and crews');
 // ---------- 2. top bar: the only cash display
 E('S.cash=1234; render(true)');
 ok(d.querySelectorAll('#tCash,#lstrip,#logTally,#campTabs').length===0 && $('lsCashV').textContent===E('money(S.cash)') && $('topbar').contains($('tSeason')) && $('topbar').contains($('tMkt')) && $('topbar').contains($('bellBtn')),'top bar: camp cash, shares, season, log price and the bell; the old tally and ledger strip are gone');
 E(`openSawmill(true); S.story.card=false; $('story').hidden=true; render(true)`);
 ok(!$('tabMill').hidden && !$('millNew').hidden,'Sawmill row appears with New once the mill opens');
 $('tabMill').click(); ok(E('S.ui.screen')==='sawmill' && !$('millView').hidden && $('logView').hidden && $('lsCashL').textContent==='Cash · Sawmill' && /Logging/.test($('lsCashO').textContent) && $('millNew').hidden,'Sawmill screen: top bar shows the mill cash and Logging cash small; New clears');
 E(`S.weather.next=null; render(true)`); ok($('tSeason').textContent===E('`${season()} ${S.year}`'),'season shows on the Sawmill screen too');
 $('navBoard').click(); ok(!$('millBoard').hidden && $('mMetaList').childElementCount>0,'Company board shows both camps’ boards');
 $('lsShares').click(); ok(E('S.ui.screen')==='board','tapping shares opens the Company board');
 // ---------- 3. bell
 E(`S.ui.camp='logging'; go('logging'); S.run.dq=[]; S.camps.sawmill.dq=[]; S.short=false; render(true)`);
 const base=E('bellItems().length');
 E(`queueDraft(1); render(true)`);
 ok(E('bellItems().length')===base+1 && !$('bellN').hidden && +$('bellN').textContent===base+1 && !$('navLogDot').hidden && !$('navShopDot').hidden,'a perk to pick puts an item in the bell and dots on Logging and Shop');
 $('bellBtn').click(); ok(!$('bellTray').hidden && $('bellBtn').getAttribute('aria-expanded')==='true' && /Perk ready/.test($('bellList').textContent),'the bell opens its list');
 [...$('bellList').querySelectorAll('button')].find(b=>b.textContent==='Pick').click();
 ok($('bellTray').hidden && !$('draft').hidden,'Pick in the bell opens the perk sheet and closes the list');
 E('closeDraft()');
 E(`S.short=true; S.owed=500; render(true)`); ok(/Wages owed/.test(E('bellItems().map(i=>i.t).join()')),'wages owed is a bell item');
 E(`S.short=false; S.owed=0; S.camps.sawmill.buyCove=false; S.camps.sawmill.dry=true; S.bulk.logs=0; render(true)`);
 const pond=E('bellItems().findIndex(i=>i.k==="pond")'); ok(pond>=0,'mill pond empty with buying off is a bell item');
 $('bellBtn').click(); $('bellList').querySelectorAll('button')[pond].click(); ok(E('S.camps.sawmill.buyCove')===true,'Turn on in the bell turns log buying back on');
 E(`go('shop')`); $('bellBtn').click(); w.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true})); ok($('bellTray').hidden && E('S.ui.screen')==='shop','Escape closes the bell and stays on the screen');
 // ---------- 4. shop placeholder keeps the perk picks reachable
 E(`queueDraft(1); render(true)`); ok(!$('shopLog').disabled && /to pick/.test($('shopLogP').textContent),'Shop: Pick perk is live while a perk waits');
 $('shopLog').click(); ok(!$('draft').hidden,'Shop: Pick perk opens the perk sheet'); E('closeDraft()');
 // ---------- 5. bottom tabs and the More drawer (shown on phones by CSS; the buttons work everywhere)
 $('btOrders').click(); ok(E('S.ui.screen')==='orders' && $('btOrders').getAttribute('aria-current')==='page','bottom tab Orders opens the Charter board');
 $('btWh').click(); ok(E('S.ui.screen')==='warehouse' && $('btWh').getAttribute('aria-current')==='page','bottom tab Warehouse');
 $('btShop').click(); ok(E('S.ui.screen')==='shop','bottom tab Shop');
 $('btCamp').click(); ok(E('S.ui.screen')==='logging' && $('btCampL').textContent==='Logging','bottom tab Camp goes back to the last camp');
 $('btCamp').click(); ok(E('S.ui.screen')==='logging' && !$('campPick').hidden && $('btCamp').getAttribute('aria-expanded')==='true','tapping Camp again opens the camp picker (slice 2)');
 [...$('cpList').querySelectorAll('[data-pick]')].find(b=>b.dataset.pick==='sawmill').click(); ok(E('S.ui.screen')==='sawmill' && $('btCampL').textContent==='Sawmill' && $('campPick').hidden,'picking Sawmill switches camps');
 $('btMore').click(); ok($('app').classList.contains('drawer') && !$('drawerBg').hidden && $('btMore').getAttribute('aria-expanded')==='true','More opens the sidebar drawer');
 $('navAlm').click(); ok(!$('app').classList.contains('drawer') && E('S.ui.screen')==='almanac','picking a row closes the drawer');
 $('btMore').click(); $('drawerBg').click(); ok(!$('app').classList.contains('drawer'),'tapping the shade closes the drawer');
 // ---------- 6. mini-games: the sidebar dims while one is open
 E(`go('logging'); S.stems.bf=5000; S.stems.val=5000; S.ui.buckIntro=true; openMG('buck'); cancelAnimationFrame(MG.raf)`);
 ok($('app').classList.contains('mgopen') && $('side').inert===true,'a mini-game dims the sidebar and takes it out of the tab order'); E('closeMG()');
 ok(!$('app').classList.contains('mgopen') && !$('side').inert,'closing it brings the sidebar back');
 // ---------- 7. the screen is saved; an old save without it loads
 E(`go('orders')`); w.dispatchEvent(new w.Event('pagehide')); const st=w.localStorage.getItem('timberline-v2'); dom.window.close();
 dom=mk(st); await sleep(300); w=dom.window; d=w.document; E=s=>w.__eval(s);
 ok(E('S.ui.screen')==='orders' && !d.getElementById('scrOrders').hidden,'the last screen comes back after a reload');
 const old=JSON.parse(st); delete old.ui.screen; old.ui.camp='sawmill'; dom.window.close();
 dom=mk(JSON.stringify(old)); await sleep(300); w=dom.window; d=w.document; E=s=>w.__eval(s);
 ok(E('S.ui.screen')==='sawmill' && !d.getElementById('millView').hidden,'an old save (no S.ui.screen) opens on its last camp');
 const old2=JSON.parse(st); old2.ui.screen='bogus'; delete old2.camps.sawmill; old2.ui.camp='sawmill'; dom.window.close();
 dom=mk(JSON.stringify(old2)); await sleep(300); w=dom.window; E=s=>w.__eval(s);
 ok(E('S.ui.screen')==='logging','a bad screen value falls back to Logging');
 dom.window.close();
 ok(errs.length===0,'no console errors'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
 console.log(fails?`${fails} FAILED`:'ALL PASS'); process.exit(fails?1:0);
})();
