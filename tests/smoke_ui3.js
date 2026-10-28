// UI rework slice 3a (docs/design/ui-rework.md §3.3, docs/design/inventory-revamp.md, docs/design/resource-names.md):
// the Warehouse icon grid and item panel (sell and lock from the panel, the sell-all confirm, filters, sort, the collection),
// and old saves loading with the new fields. Layout (bottom sheet, tap targets) is checked in a real browser by tests/phone.
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
 const tile=id=>d.querySelector(`#whGrid [data-it="${id}"]`);
 // ---------- 1. the Warehouse grid
 E(`S.orders.autoFill=false; addItem('logging.burl',5,true); addItem('logging.amber_pitch',3,true); addItem('logging.fog_glass',1,true); addItem('logging.prime_spar',6,true); S.orders.open=[]; go('warehouse')`);
 ok(!$('wh').hidden && d.querySelectorAll('#whGrid button.itile').length===4,'the Warehouse shows one tile per item held');
 ok(tile('logging.prime_spar').classList.contains('t-prime') && tile('logging.prime_spar').querySelectorAll('.idia i').length===3 && tile('logging.fog_glass').querySelectorAll('.idia i').length===4 && !tile('logging.burl').querySelector('.idia'),'tiles carry the tier ladder: Prime 3 diamonds, Rare 4, Common none');
 ok(/Prime tier, 6 held/.test(tile('logging.prime_spar').getAttribute('aria-label')) && tile('logging.burl').querySelector('.icnt').textContent==='5' && !!tile('logging.burl').querySelector('svg'),'each tile has a picture, a count and a label that names the tier');
 ok(!!tile('logging.burl').querySelector('.inew') && /4 new/.test($('whSub').textContent),'new items have a dot and the header counts them');
 ok([...$('whTabs').querySelectorAll('[role=tab]')].map(b=>b.dataset.t).join()==='all,prime,find,mill,logs,collection,ledger' && /Boards/.test($('whTabs').textContent),'tabs: All, Prime, Finds, Boards, Logs, Collection (Ledger until it moves)');
 ok(/Pick an item|Tap an item/.test($('whDetail').textContent) && $('whDetail').classList.contains('none'),'no item picked: the panel shows a hint (and the phone sheet stays closed)');
 tile('logging.burl').click();
 ok(!$('whDetail').classList.contains('none') && /Swirl knot/.test($('whDetail').textContent) && /Comes from/.test($('whDetail').textContent) && !E(`S.unseen['logging.burl']`) && !tile('logging.burl').querySelector('.inew') && tile('logging.burl').getAttribute('aria-current')==='true','tapping a tile opens its panel, marks it current and clears its new dot');
 const c0=E('S.cash'); d.querySelector('#whDetail [data-s1="logging.burl"]').click();
 ok(E(`bankN('logging.burl')`)===4 && E('S.cash')-c0===E(`sellPrice('logging.burl')`) && tile('logging.burl').querySelector('.icnt').textContent==='4','Sell 1 from the panel sells one and pays Logging');
 d.querySelector('#whDetail [data-lk="logging.burl"]').click();
 ok(E(`S.locks.includes('logging.burl')`) && d.querySelector('#whDetail [data-s1="logging.burl"]').disabled && d.querySelector('#whDetail [data-sa="logging.burl"]').disabled && !!tile('logging.burl').querySelector('.ilock') && /Locked: never sold/.test($('whDetail').textContent),'Lock from the panel: the sell buttons turn off and the tile shows a padlock');
 $('whSurplus').click(); ok(E(`bankN('logging.burl')`)===4 && E(`bankN('logging.amber_pitch')`)===0,'Sell spares skips the locked item: '+E('JSON.stringify(S.bank)'));
 d.querySelector('#whDetail [data-lk="logging.burl"]').click(); ok(!E(`S.locks.includes('logging.burl')`) && !d.querySelector('#whDetail [data-sa="logging.burl"]').disabled,'unlock turns selling back on');
 // Sell all asks again when an order or a building needs the item
 E(`addItem('logging.prime_spar',6,true); S.orders.open=[{id:'admiralty_spar', posted:1, due:2, given:{}}]; render(true)`);
 ok(!!tile('logging.prime_spar').querySelector('.ineed'),'an item an order needs is flagged on its tile');
 tile('logging.prime_spar').click();
 ok(/Admiralty/.test(d.querySelector('#whDetail .dsec').textContent) && /Needed for/.test($('whDetail').textContent),'the panel lists what needs the item');
 d.querySelector('#whDetail [data-sa="logging.prime_spar"]').click();
 ok(E(`bankN('logging.prime_spar')`)===6 && /Tap again to sell all 6/.test($('whDetail').textContent) && d.querySelector('#whDetail [data-sa]').classList.contains('danger'),'Sell all on a needed item asks again on the page');
 d.querySelector('#whDetail [data-sa="logging.prime_spar"]').click(); ok(E(`bankN('logging.prime_spar')`)===0,'a second tap sells them all');
 E(`S.orders.open=[]; render(true)`);
 // filters and sort
 [...$('whTools').querySelectorAll('[data-f]')].find(b=>b.dataset.f==='locked').click();
 ok(E('S.ui.whFilter')==='locked' && /Nothing matches/.test($('whGrid').textContent),'filter chips narrow the grid (Locked: none)');
 [...$('whTools').querySelectorAll('[data-f]')].find(b=>b.dataset.f==='locked').click(); E(`addItem('logging.amber_pitch',2,true); S.orders.open=[]; render(true)`); ok(E('S.ui.whFilter')===null && d.querySelectorAll('#whGrid button.itile').length===2,'tapping the chip again clears it');
 const sel=$('whSort'); sel.value='name'; sel.dispatchEvent(new w.Event('change',{bubbles:true}));
 ok(E('S.ui.whSort')==='name' && [...d.querySelectorAll('#whGrid button.itile')].map(b=>b.dataset.it).join()===E(`whItems('all').map(i=>i.id).join()`) && !d.querySelector('#whGrid .igh'),'sort by name drops the group headings');
 // tabs: Logs shows the log pond and says hemlock bark is cash; Collection shows silhouettes
 [...$('whTabs').querySelectorAll('[data-t]')].find(b=>b.dataset.t==='logs').click();
 ok(!!d.querySelector('#whGrid .bcard[data-it="company.logs"]') && /Hemlock bark is paid as cash/.test($('whGrid').textContent) && $('whTools').hidden,'Logs tab: the log pond card; hemlock bark is cash, not an item');
 d.querySelector('#whGrid .bcard').click(); ok(/Log pond/.test($('whDetail').textContent) && /Stays at close camp/.test($('whDetail').textContent),'the log pond has its own panel');
 const key=(el,k)=>el.dispatchEvent(new w.KeyboardEvent('keydown',{key:k,bubbles:true}));
 key(d.querySelector('#whTabs [data-t="logs"]'),'ArrowRight'); ok(E('S.ui.whTab')==='collection' && d.activeElement===d.querySelector('#whTabs [data-t="collection"]'),'arrow keys move along the warehouse tabs');
 ok(d.querySelectorAll('#whGrid .itile.unknown').length===E(`Core.ITEMS.filter(i=>!S.found[i.id]).length`) && d.querySelectorAll('#whGrid .iprog').length>=2,'Collection: silhouettes for unfound items and a bar per group');
 d.querySelector('#whGrid .itile.unknown').click(); ok(/Turns up in/.test($('whDetail').textContent) && !d.querySelector('#whDetail [data-s1]'),'a silhouette says where it turns up; no sell buttons in the collection');
 // order cards and building costs carry the item pictures
 E(`S.orders.open=[{id:'caulk_perseverance', posted:1, due:2, given:{}}]; go('orders')`);
 ok(d.querySelectorAll('#specials .itile.sm').length===2,'order cards show a small picture for each item they need');
 E(`S.orders.open=[]; go('logging')`);
 // ---------- 3. the tier ladder everywhere quality shows: logs, boards, the lumber yard
 ok(E(`[1,2,3,'P'].map(g => Core.logTierName(g)).join()`)==='Fine,Good,Common,Firewood' && E(`[0,1,2].map(boardTier).join()`)==='fine,good,common','log grades and board grades sit on the ladder (Fine, Good, Common; firewood below)');
 ok(E(`gradeCol(1) === tierCol('fine') && gradeCol(2) === tierCol('good') && gradeCol(3) === tierCol('common') && gradeCol('P') === C.bark`) && E(`boardCol(0) === tierCol('fine') && boardCol(2) === tierCol('common')`),'bucking and saw colors come from the tier tokens');
 ok(E(`readColors(), Core.TIERS.every(t => 't-' + t in C)`),'the canvas reads every tier color');
 E(`openSawmill(true); S.story.card = false; $('story').hidden = true; go('sawmill', null, 'mill')`);
 const yard=[...d.querySelectorAll('#mYard>div')];
 ok(yard.map(x=>x.className).join()==='t-fine,t-good,t-common' && yard.map(x=>x.querySelectorAll('.dd i').length).join()==='2,1,0' && /Fine/.test(yard[0].textContent) && /Good/.test(yard[1].textContent),'lumber yard: Fine (2 diamonds), Good (1), Common (0)');
 E(`go('warehouse'); openWh('mill')`);
 ok(d.querySelectorAll('#whGrid .bcard').length===3 && /Fine boards/.test($('whGrid').textContent) && d.querySelector('#whGrid .bcard .itile.t-fine .idia').children.length===2,'Boards tab: the lumber yard by tier with diamonds');
 E(`go('logging')`);
 ok(!errs.length,'no console errors: '+errs.slice(0,3).join(' | '));
 // ---------- 2. an old save: the old warehouse tab and the old new-count carry over
 E('save()'); const st=w.localStorage.getItem('timberline-v2'); dom.window.close();
 const old=JSON.parse(st); delete old.unseen; old.newCount=3; old.ui.whTab='stock'; delete old.ui.whSort; delete old.ui.whFilter; old.bank={'logging.burl':2,'logging.fog_glass':1};
 old.log=[{at:'Fal 1890', text:'New find: Burl.'}, {at:'Fal 1890', text:'Special order from The Admiralty: Admiralty spar order. 16 Prime spars and 2 Amber pitch by the end of next outpost.'}, {at:'Win 1890', text:'Closed mill run 1: 30.0K bd ft sawn. Used a survey marker; got a Ship’s fitting and Fog-glass.'}];
 dom=mk(JSON.stringify(old)); await sleep(300); w=dom.window; d=w.document; E=s=>w.__eval(s);
 ok(E('S.ui.whTab')==='all' && E('S.ui.whSort')==='default' && E('S.ui.whFilter')===null,'old save: Stock becomes All; sort and filter take their defaults');
 ok(E(`S.unseen['logging.burl']`)===1 && E(`S.unseen['logging.fog_glass']`)===1,'old save with new items: every held item gets its new dot once');
 E(`go('warehouse')`); ok(d.querySelectorAll('#whGrid .inew').length===2,'and the grid shows them');
 // resource renames: the camp log a save holds reads in the new names; ids and save keys do not change
 const logT=E(`S.log.map(e=>e.text).join(' | ')`);
 ok(/New find: Swirl knot\./.test(logT) && /Admiralty mast order\. 16 Prime logs and 2 Amber sap/.test(logT) && /30\.0K wood sawn\. Used a restock token; got a Shipwreck bronze and Fog lens/.test(logT) && !/Burl|spar|bd ft|pitch|marker|fitting|Fog-glass/.test(logT),'old save: the camp log is rewritten in the new names: '+logT);
 ok(E(`bankN('logging.burl')`)===2 && E(`Object.keys(S.bank).join()`)==='logging.burl,logging.fog_glass','item ids and counts are untouched');
 ok(d.querySelector('#whGrid [data-it="logging.burl"]').getAttribute('aria-label').startsWith('Swirl knot, Common tier') && d.querySelector('#whGrid [data-it="logging.fog_glass"]').getAttribute('aria-label').startsWith('Fog lens, Rare tier'),'the grid shows the new names');
 E(`render(true)`); ok(/Swirl knot/.test(d.getElementById('ledger').textContent) && !/Burl/.test(d.getElementById('ledger').textContent),'the camp log on screen uses the new names');
 dom.window.close();
 const old2=JSON.parse(st); old2.ui.whTab='log'; old2.unseen='junk';
 dom=mk(JSON.stringify(old2)); await sleep(300); w=dom.window; E=s=>w.__eval(s);
 ok(E('S.ui.whTab')==='collection' && typeof E('S.unseen')==='object','old save: Collection keeps its tab; a damaged new-dot map resets');
 dom.window.close();
 ok(!errs.length,'no console errors: '+errs.slice(0,3).join(' | '));
 process.exit(fails?1:0);
})();
