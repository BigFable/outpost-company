// Lot stat chips (owner request 2026-10-26; trimmed 2026-10-28): land-office listings show chops against the era's average lot
// and one haul chip (Easy / OK / Hard), Priority cards keep their chips (green ▲ better, red ▼ worse, plain about average),
// with the averages on tap. Stock rows carry no chips.
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
 // 1. the land office listing (owner 2026-10-28): two chips only, chops against the average and one haul chip
 ok(cards.length===2 && cards.every(c=>chips(c).join()==='chops,haul'),'every listing shows chops then haul: '+chips(cards[0]).join());
 // 2. colours and arrows: the spruce head (few chops, 2 mi, flat) and the hemlock bog (12 mi, steep)
 const s=cards[0], h=cards[1];
 ok(v(s,'chops').dataset.v==='good' && v(s,'chops').classList.contains('good') && /▲/.test(v(s,'chops').textContent),'spruce head: chops green with ▲');
 ok(v(s,'haul').dataset.haul==='easy' && v(s,'haul').classList.contains('good') && /Haul\s*Easy/.test(v(s,'haul').textContent),'spruce head, 2 mi flat: Haul Easy in green');
 ok(v(h,'haul').dataset.haul==='hard' && v(h,'haul').classList.contains('bad') && /▼/.test(v(h,'haul').textContent),'hemlock bog, 12 mi steep: Haul Hard in red with ▼');
 ok(/Chops\s*15/.test(v(s,'chops').textContent),'chip text: '+[...s.querySelectorAll('.stat')].map(x=>x.textContent).join(' | '));
 ok(!/bd ft|Value|Weight|Prime|Price|Best for|Logged|ground/i.test([...cards].map(c=>c.querySelector('.info').textContent).join(' ')),'no value, weight, Prime, price chip, bd ft, ground or best-for text on a listing');
 ok(/60 trees · Spruce 90% · Pine 10%/.test(s.textContent) && s.querySelector('.spbar') && /\$300/.test(s.querySelector('button.buy').textContent),'tree count, mix, mix bar and the price on the buy button');
 // 3. the average on hover (title) and on tap; the haul chip's tap shows miles and ground
 const avgChops=E('Core.eraLotAverages(0).chops');
 ok(new RegExp('avg '+E(`fmt(${avgChops})`)).test(v(s,'chops').title) && /better than average/.test(v(s,'chops').title),'hover: '+v(s,'chops').title);
 const btn=s.querySelector('button.stats');
 ok(btn && btn.getAttribute('aria-pressed')==='false' && !d.documentElement.classList.contains('stat-avg'),'averages hidden at first');
 btn.click();
 ok(d.documentElement.classList.contains('stat-avg') && [...d.querySelectorAll('button.stats')].every(b=>b.getAttribute('aria-pressed')==='true'),'tap the chips: averages show on every row');
 ok(/avg [\d.]+/.test(v(s,'chops').querySelector('.avg').textContent) && /^12 mi, steep$/.test(v(h,'haul').querySelector('.avg').textContent),'chops carries its average, haul its miles and ground: '+v(h,'haul').querySelector('.avg').textContent);
 d.querySelector('#sales button.stats').click();
 ok(!d.documentElement.classList.contains('stat-avg'),'tap again hides them');
 // 5. Priority cards (the per-lot queue rows became the Stock tab, 2026-10-28: no chips there)
 E(`S.tracts.push(Object.assign(Core.makeTract('Bog',[['hemlock',100]],20,10,'steep','swamp'),{seq:S.tractSeq++})); S.ui.qView='stock'; render(true);`);
 ok(d.querySelectorAll('#stock .stk[data-sp]').length>=1 && !d.querySelector('#stock .stat'),'Stock rows: kind and count only, no stat chips');
 E(`S.ui.qView='priority'; render(true);`);
 const sc=d.querySelector('#stash .scard[data-sp="hemlock"]');
 ok(sc && chips(sc).join()==='chops,value,weight,prime' && v(sc,'weight').dataset.v==='bad','Trees card: hemlock chips, heavy in red');
 ok(errs.length===0,'no errors'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
 console.log(fails?`${fails} FAILED`:'ALL PASS'); process.exit(fails?1:0);
})();
