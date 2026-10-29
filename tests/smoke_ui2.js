// UI rework slice 2 (docs/design/ui-rework.md): camp tabs (remembered in S.ui.logTab / S.ui.millTab), the camp header,
// stage cards, bell items that route to a tab and dot it, and the slice-1 leftovers: the icon rail toggle (mid width),
// the Almanac as its own screen, the phone camp picker, and desktop toasts inside the top bar. Old saves keep loading.
// Layout (rail width, toast position, tap targets) is checked in a real browser by tests/phone.
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
 const pane=(c)=>[...d.querySelectorAll(`.tpane[data-pane^="${c}:"]`)].filter(p=>!p.hidden).map(p=>p.dataset.pane);
 const key=(el,k)=>el.dispatchEvent(new w.KeyboardEvent('keydown',{key:k,bubbles:true}));
 // ---------- 1. Logging tabs
 ok(E('S.ui.logTab')==='work' && JSON.stringify(pane('logging'))==='["logging:work"]' && $('ltWork').getAttribute('aria-selected')==='true','a new company opens Logging on the Work tab, one pane shown');
 ok(!!$('lpWork').querySelector('#chain') && !!$('lpLots').querySelector('#sales') && !!$('lpLots').querySelector('#queuePanel') && !!$('lpCrews').querySelector('#eq') && !!$('lpCamp').querySelector('#eras') && !!$('lpLog').querySelector('#closeBox') && !!$('lpLog').querySelector('#ledger'),'every Logging panel sits in its tab (Work, Lots, Crews, Camp, Log)');
 for (const [id,t] of [['ltLots','lots'],['ltCrews','crews'],['ltCamp','camp'],['ltLog','log'],['ltWork','work']]){
   $(id).click(); ok(E('S.ui.logTab')===t && JSON.stringify(pane('logging'))===`["logging:${t}"]` && $(id).getAttribute('aria-selected')==='true' && $(id).tabIndex===0,`tab ${t} opens its pane`);
 }
 key($('ltWork'),'ArrowRight'); ok(E('S.ui.logTab')==='lots' && d.activeElement===$('ltLots'),'arrow keys move along the tabs');
 key($('ltLots'),'End'); ok(E('S.ui.logTab')==='log','End jumps to the last tab');
 E(`go('orders')`); E(`go('logging')`); ok(E('S.ui.logTab')==='log' && !$('lpLog').hidden,'the last tab is remembered when you come back');
 // ---------- 2. camp header
 E(`setTab('logging','work'); render(true)`);
 ok($('rbRun').textContent==='Outpost 1' && $('rbEra').textContent===E('ERAS[S.era].name') && $('chLot').textContent===E('tract().name'),'camp header: outpost, era and the lot');
 ok($('chClose').disabled && /Close camp at/.test($('chGoal').textContent),'Close camp is off until the camp can close; the goal line says how');
 E(`S.run.perks.push('greased','greased'); render(true)`); ok($('chPerks').querySelectorAll('.chipl').length===1 && /×2/.test($('chPerks').textContent) && !!$('chPerks').querySelector('[title]'),'perk chips in the header, stacked, with their text on hover');
 E(`S.run.deliv = CLOSE_VOL; render(true)`); ok(!$('chClose').disabled && /Ready to close/.test($('chGoal').textContent) && $('chBar').parentNode.classList.contains('ready'),'Close camp turns on when the camp can close');
 $('chClose').click(); ok(E('S.ui.logTab')==='log' && !!$('closeYes') && E('closeArmed')===true,'Close camp opens the Log tab with the in-page confirm');
 $('closeNo').click(); E(`S.run.deliv = 0; render(true)`);
 // ---------- 3. stage cards
 E(`setTab('logging','work')`);
 const cards=[...d.querySelectorAll('#chain .stc')];
 ok(cards.length===4 && cards.every(c=>c.querySelector('.act.game') && c.querySelector('.act.quick') && c.querySelector('.spile b')) && d.querySelectorAll('#chain .act.game').length===4,'four stage cards, each with Play, the hand button and the wood waiting');
 ok(cards.filter(c=>c.classList.contains('neck')).length===1 && !!d.querySelector('#chain .stc.neck .neckchip'),'one card is marked Slowest');
 E(`S.run.perks = []; S.season = SEASONS.indexOf('Spring'); S.weather.cur = null; render(true)`);
 const wx=d.querySelector('#chain .stc[data-stage=skid] .wx'); ok(!wx.hidden && /Weather ×0\./.test(wx.textContent) && wx.classList.contains('bad'),'Spring mud shows a weather chip on Skid: '+wx.textContent);
 E(`S.season = SEASONS.indexOf('Fall'); render(true)`); ok(d.querySelector('#chain .stc[data-stage=fell] .wx').hidden,'no weather chip when the season changes nothing');
 E(`S.stems.bf = 5000; render(true)`); ok(/5(\.00)?K wood/.test(d.querySelector('#chain .stc[data-stage=fell] .spile b').textContent),'Fell shows the felled trees waiting');
 // ---------- 4. bell items route to a tab and dot it
 E(`S.short = true; S.owed = 300; setTab('logging','work'); render(true)`);
 ok(!d.querySelector('#ltCrews .dot').hidden && d.querySelector('#ltWork .dot').hidden,'wages owed puts a dot on the Crews tab');
 $('bellBtn').click(); const owedB=[...$('bellList').querySelectorAll('button')].find(b=>b.textContent==='Crews'); ok(!!owedB,'the bell offers Crews for wages owed');
 owedB.click(); ok(E('S.ui.screen')==='logging' && E('S.ui.logTab')==='crews' && $('bellTray').hidden,'Crews in the bell opens the Crews tab');
 E(`S.short = false; S.owed = 0; S.contracts.push({mill:'Test Mill', vol:1000, done:250, end:S.t + 30, dur:300, prem:.2, penalty:10}); render(true)`);
 ok(E('bellItems().some(i => i.k === "ends" && /Test Mill/.test(i.s) && /25%/.test(i.s))'),'a charter order that ends this season is a bell item');
 E(`S.contracts.pop(); render(true)`);
 E(`S.stems.bf = 5000; S.stems.val = 5000; S.ui.buckIntro = true; openMG('buck'); cancelAnimationFrame(MG.raf); dispQ.push({kind:'event', id:Core.SEASON_EVENTS[0].id}); render(true)`);
 ok(E('bellItems().some(i => i.k === "news")'),'season news waiting behind a mini-game is a bell item');
 E(`bellItems().find(i => i.k === "news").fn()`); ok($('mg').hidden && !E('bellItems().some(i => i.k === "news")'),'Read closes the game so the card can show');
 // ---------- 5. Sawmill tabs and header
 E(`openSawmill(true); S.story.card = false; $('story').hidden = true; go('sawmill')`);
 ok(JSON.stringify(pane('sawmill'))==='["sawmill:mill"]' && !!$('mpMill').querySelector('#mSawBtn') && !!$('mpStructs').querySelector('#mStructs') && !!$('mpSawyers').querySelector('#mCrew') && !!$('mpRun').querySelector('#mClose'),'Sawmill opens on the Mill tab; Structures, Sawyers and Run hold their panels');
 ok($('mhRun').textContent==='Mill run 1' && $('mhName').textContent===$('mName').textContent && $('mhClose').disabled && $('mHead').contains($('mDraftBtn')),'mill header: run, name, Close mill off, Pick perk in the header');
 $('mtRun').click(); ok(E('S.ui.millTab')==='run' && !$('mpRun').hidden && $('mpMill').hidden,'Run tab opens');
 E(`S.camps.sawmill.sawn = Core.MILL_CLOSE_BF; render(true)`); ok(!$('mhClose').disabled,'Close mill turns on when the mill can close');
 $('mtMill').click(); $('mhClose').click(); ok(E('S.ui.millTab')==='run' && !!$('mCloseYes'),'Close mill opens the Run tab with the confirm');
 $('mCloseNo').click(); E(`S.camps.sawmill.sawn = 0; render(true)`);
 // ---------- 6. the Almanac is its own screen
 $('navAlm').click(); ok(E('S.ui.screen')==='almanac' && !$('scrAlm').hidden && $('wh').hidden && /cards seen/.test($('almBody').textContent),'Almanac opens its own screen, not the Warehouse');
 ok(![...$('whTabs').querySelectorAll('button')].some(b=>b.dataset.t==='almanac'),'the Warehouse has no Almanac tab');
 E(`openWh('almanac')`); ok(E('S.ui.screen')==='almanac','openWh("almanac") still lands on the Almanac screen');
 // ---------- 7. phone camp picker (the bottom tabs show on phones; the buttons work everywhere)
 E(`go('logging')`); $('btCamp').click();
 ok(!$('campPick').hidden && $('cpList').querySelectorAll('[data-pick]').length===2 && /In the fog/.test($('cpList').textContent) && !$('cpList').querySelector('.locked button') && $('cpList').querySelector('[aria-current="page"]').dataset.pick==='logging','a second Camp tap opens the picker: Logging (current), Sawmill, Fishing greyed');
 key(d.body,'Escape'); ok($('campPick').hidden && E('S.ui.screen')==='logging','Escape closes the picker');
 $('btCamp').click(); d.body.click(); ok($('campPick').hidden,'a tap outside closes the picker');
 E(`go('shop')`); $('btCamp').click(); ok($('campPick').hidden && E('S.ui.screen')==='logging','from another screen the Camp tab goes straight to the camp');
 // ---------- 8. icon rail toggle (mid width shows it; the toggle works everywhere)
 $('railBtn').click(); ok($('app').classList.contains('drawer') && $('railBtn').getAttribute('aria-expanded')==='true' && $('railBtn').getAttribute('aria-label')==='Hide names','the rail button shows the sidebar with names');
 $('railBtn').click(); ok(!$('app').classList.contains('drawer') && $('railBtn').getAttribute('aria-expanded')==='false','and hides them again');
 ok([...d.querySelectorAll('.nav [data-go]')].every(b=>b.title),'every sidebar row has a name for the icon rail');
 // ---------- 9. desktop toasts sit inside the top bar, one at a time
 E(`$('toasts').innerHTML = ''; toast({name:'One', line:'a'}); toast({name:'Two', line:'b'})`);
 const ts=$('toasts'); ok($('topbar').contains(ts) && ts.childElementCount===2 && ts.firstElementChild.dataset.on==='1' && !ts.lastElementChild.dataset.on,'toasts live in the top bar; the first is showing, the next waits its turn');
 await sleep(5000); ok(ts.childElementCount===1 && /Two/.test(ts.textContent) && ts.firstElementChild.dataset.on==='1','after 4.5 s the next toast takes its place');
 // ---------- 10. saves: tabs come back; an old save (Almanac warehouse tab, no tab fields) still loads
 E(`setTab('logging','crews'); S.ui.millTab = 'structs'`); w.dispatchEvent(new w.Event('pagehide')); const st=w.localStorage.getItem('timberline-v2'); dom.window.close();
 dom=mk(st); await sleep(300); w=dom.window; d=w.document; E=s=>w.__eval(s);
 ok(E('S.ui.logTab')==='crews' && !d.getElementById('lpCrews').hidden && E('S.ui.millTab')==='structs','camp tabs come back after a reload');
 const old=JSON.parse(st); delete old.ui.logTab; delete old.ui.millTab; old.ui.whTab='almanac'; old.ui.screen='almanac'; dom.window.close();
 dom=mk(JSON.stringify(old)); await sleep(300); w=dom.window; d=w.document; E=s=>w.__eval(s);
 ok(E('S.ui.logTab')==='work' && E('S.ui.millTab')==='mill' && E('S.ui.whTab')==='all' && E('S.ui.screen')==='almanac' && !d.getElementById('scrAlm').hidden,'an old save without tab fields loads: Work and Mill tabs, the warehouse back on All');
 const old2=JSON.parse(st); old2.ui.logTab='bogus'; old2.ui.millTab=7; dom.window.close();
 dom=mk(JSON.stringify(old2)); await sleep(300); w=dom.window; E=s=>w.__eval(s);
 ok(E('S.ui.logTab')==='work' && E('S.ui.millTab')==='mill','bad tab values fall back to the first tab');
 dom.window.close();
 ok(errs.length===0,'no console errors'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
 console.log(fails?`${fails} FAILED`:'ALL PASS'); process.exit(fails?1:0);
})();
