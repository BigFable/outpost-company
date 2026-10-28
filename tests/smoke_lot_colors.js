// Lot stat chips (owner request 2026-10-26): land-office listings, cutting-queue Lots rows and Trees cards show their key
// numbers as chips colored against the era's average lot (green ▲ better, red ▼ worse, plain about average), the averages
// on tap, the camp note behind a small "i", and the "Best for" order badge kept.
const {JSDOM, VirtualConsole}=require('jsdom');const fs=require('fs');
const errs=[]; const vc=new VirtualConsole(); vc.on('error',e=>errs.push(String(e&&e.stack||e))); vc.on('jsdomError',e=>errs.push('jsdom:'+e.message));
const START="window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});";
const src=fs.readFileSync(__dirname+'/../prototype/timberline.html','utf8');
if(!src.includes(START)) throw new Error('start line not found');
const html=src.replace(START,'window.__eval = s => eval(s); '+START);
const mk=()=>new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,url:'https://x.test/',beforeParse(w){
  let x=7; w.Math.random=()=>{ x=(x*9301+49297)%233280; return x/233280; };
  w.HTMLCanvasElement.prototype.getContext=function(){return new Proxy({},{get:(t,p)=>p==='measureText'?()=>({width:10}):p in t?t[p]:()=>{},set:(t,p,v)=>(t[p]=v,true)});};
  w.addEventListener('error',e=>errs.push('win:'+e.message));}});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let fails=0; const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m); if(!c) fails++;};
(async()=>{
 // the file declares UTF-8 within its first 1024 bytes (opened as file:// the ▲▼·×— marks must not turn into "Â")
 const head=fs.readFileSync(__dirname+'/../prototype/timberline.html').subarray(0,1024).toString('latin1');
 ok(/<meta\s+charset=["']?utf-8["']?\s*\/?>/i.test(head) && /^\s*<meta\s+charset/i.test(head),'prototype declares <meta charset="utf-8"> first, within 1024 bytes');
 const dom=mk(); await sleep(300); const w=dom.window, d=w.document, E=s=>w.__eval(s);
 E(`S.season=2; S.weather.cur=null; S.cash=1e6; S.own={axeman:2, bucker:20, oxen:4, sled:6}; S.upg=[]; S.run.perks=[]; S.era=0;
   S.tracts=[Object.assign(Core.makeTract('Home lot',[['pine',100]],30,1,'flat'),{seq:0})]; S.tractSeq=1; setSite(); newTree();
   S.forSale=[Core.makeTract('Spruce head, Lot 7',[['spruce',90],['pine',10]],60,2,'flat','headland'), Core.makeTract('Hemlock bog, Lot 9',[['hemlock',90],['spruce',10]],60,12,'steep','swamp')];
   S.forSale[0].price=300; S.forSale[1].price=2000;
   S.contracts=[{mill:'the Admiralty spar yard', sp:'spruce', vol:3000, done:0, dur:400, end:S.t+400, prem:.4, penalty:0}]; S.orders.open=[]; S.bank={}; render(true);`);
 const cards=[...d.querySelectorAll('#sales .row.lot')];
 const chips=c=>[...c.querySelectorAll('.stat')].map(s=>s.dataset.stat);
 const v=(c,id)=>c.querySelector(`.stat[data-stat="${id}"]`);
 // 1. chips present, in the same order on every listing
 const order=E('Core.LOT_STATS.join()');
 ok(cards.length===2 && cards.every(c=>chips(c).join()===order),'every listing shows the 7 chips in one order: '+chips(cards[0]).join());
 // 2. colors and arrows for a known lot: the spruce head (light, few chops, 2 mi, flat, $5 a tree) and the hemlock bog
 const s=cards[0], h=cards[1];
 ok(['chops','weight','haul','slope','price'].every(id=>v(s,id).dataset.v==='good' && v(s,id).classList.contains('good') && /▲/.test(v(s,id).textContent)),'spruce head: chops, weight, haul, slope and price are green with ▲');
 ok(v(s,'value').dataset.v==='bad' && /▼/.test(v(s,'value').textContent),'spruce is cheap wood: value red with ▼');
 ok(v(s,'prime').dataset.v==='even' && !/[▲▼]/.test(v(s,'prime').textContent),'idle Prime is the same on every Cove lot: plain, no arrow');
 ok(['weight','haul','slope'].every(id=>v(h,id).dataset.v==='bad' && /▼/.test(v(h,id).textContent)),'hemlock bog, 12 mi, steep: weight, haul and slope red with ▼');
 ok(/Chops\s*15/.test(v(s,'chops').textContent) && /Haul\s*2 mi/.test(v(s,'haul').textContent) && /Slope\s*flat/.test(v(s,'slope').textContent) && /Price \$5 /.test(v(s,'price').textContent),'chip text: '+[...s.querySelectorAll('.stat')].map(x=>x.textContent).join(' | '));
 // 3. the average on hover (title) and on tap
 const avgChops=E('Core.eraLotAverages(0).chops');
 ok(new RegExp('avg '+E(`fmt(${avgChops})`)).test(v(s,'chops').title) && /better than average/.test(v(s,'chops').title),'hover: '+v(s,'chops').title);
 const btn=s.querySelector('button.stats');
 ok(btn && btn.getAttribute('aria-pressed')==='false' && !d.documentElement.classList.contains('stat-avg'),'averages hidden at first');
 btn.click();
 ok(d.documentElement.classList.contains('stat-avg') && [...d.querySelectorAll('button.stats')].every(b=>b.getAttribute('aria-pressed')==='true'),'tap the chips: averages show on every row');
 ok(/avg \$?[\d.]+/.test(v(s,'value').querySelector('.avg').textContent),'each chip carries its average: '+v(s,'value').querySelector('.avg').textContent);
 d.querySelector('#sales button.stats').click();
 ok(!d.documentElement.classList.contains('stat-avg'),'tap again hides them');
 // 4. the camp note sits behind the "i", the order badge stays
 const note=s.querySelector('details.notei');
 ok(note && !note.open && note.querySelector('summary .ib').textContent==='i' && note.querySelector('.fit') && /On this lot: felling/.test(note.textContent),'camp note behind a closed "i"');
 ok(!s.querySelector('.info > p.fit') && !/chops a tree ·/.test(s.textContent),'no camp-note sentence or old stat sentence on the card face');
 ok(/Best for the spruce order/.test(s.querySelector('[data-best="contract"]').textContent),'the order-fit badge is kept');
 // 5. Priority cards (the per-lot queue rows became the Stock tab, 2026-10-28: no chips there)
 E(`S.tracts.push(Object.assign(Core.makeTract('Bog',[['hemlock',100]],20,10,'steep','swamp'),{seq:S.tractSeq++})); S.ui.qView='stock'; render(true);`);
 ok(d.querySelectorAll('#stock .stk[data-sp]').length>=1 && !d.querySelector('#stock .stat'),'Stock rows: kind and count only, no stat chips');
 E(`S.ui.qView='priority'; render(true);`);
 const sc=d.querySelector('#stash .scard[data-sp="hemlock"]');
 ok(sc && chips(sc).join()==='chops,value,weight,prime' && v(sc,'weight').dataset.v==='bad','Trees card: hemlock chips, heavy in red');
 ok(errs.length===0,'no errors'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
 console.log(fails?`${fails} FAILED`:'ALL PASS'); process.exit(fails?1:0);
})();
