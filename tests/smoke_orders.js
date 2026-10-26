// More charter orders at once (2026-10-26): capacity from board nodes and perks, signing up to capacity, the active list
// (progress, deadline, "2 of 3 active"), the delivery split (tree orders first, then soonest deadline), Rush clerk,
// Overbooked fines, Charter office needing Second clerk, and an old save's single contract converting into the list.
const {JSDOM, VirtualConsole}=require('jsdom');const fs=require('fs');
const errs=[]; const vc=new VirtualConsole(); vc.on('error',e=>errs.push(String(e&&e.stack||e))); vc.on('jsdomError',e=>errs.push('jsdom:'+e.message));
const START="window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});";
const src=fs.readFileSync(__dirname+'/../prototype/timberline.html','utf8');
if(!src.includes(START)) throw new Error('start line not found');
const html=src.replace(START,'window.__eval = s => eval(s); '+START);
const mk=(store,seed)=>new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,url:'https://x.test/',beforeParse(w){
  if(store) for(const k in store) w.localStorage.setItem(k,store[k]);
  let x=seed||7; w.Math.random=()=>{ x=(x*9301+49297)%233280; return x/233280; };
  w.HTMLCanvasElement.prototype.getContext=function(){return new Proxy({},{get:(t,p)=>p==='measureText'?()=>({width:10}):p in t?t[p]:()=>{},set:(t,p,v)=>(t[p]=v,true)});};
  w.HTMLCanvasElement.prototype.getBoundingClientRect=function(){return {left:0,top:0,right:640,bottom:400,width:640,height:400,x:0,y:0};};
  w.addEventListener('error',e=>errs.push('win:'+e.message));}});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let fails=0; const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m); if(!c) fails++;};
const near=(a,b)=>Math.abs(a-b)<1e-6;
(async()=>{
 let dom=mk(); await sleep(300); let w=dom.window, d=w.document, E=s=>w.__eval(s);
 const $=id=>d.getElementById(id);
 E(`S.weather.cur=null; S.weather.off=true; S.run.perks=[]; S.meta.nodes=[]; S.contracts=[]; S.owed=0; S.rep=0; S.camps={};
   S.tracts=[Object.assign(Core.makeTract('Mix',[['spruce',60],['pine',40]],500,1,'flat','headland'),{seq:0})]; setSite();
   S.offers=[{mill:'A yard', vol:5000, dur:300, prem:.2, penalty:100}, {mill:'B yard', vol:5000, dur:200, prem:.3, penalty:100},
     {mill:'the Admiralty spar yard', vol:5000, dur:400, prem:.4, penalty:0, sp:'spruce'}, {mill:'D yard', vol:5000, dur:250, prem:.2, penalty:100}]; render(true);`);

 // ---------- 1. base capacity is 1 (today's behavior)
 ok(E('ordCap()')===1,'base capacity is one active order');
 E('accept(0); accept(0); render(true)');
 ok(E('S.contracts.length')===1,'with capacity 1 the second Sign does nothing');
 ok(/Board full/.test($('contracts').textContent) && !$('contracts').querySelector('button[data-o]'),'a full board hides the Sign buttons and says so');

 // ---------- 2. board nodes: Second clerk, then Charter office (needs Second clerk)
 E(`S.meta.legacy=100; render(true);`);
 ok(E(`buyMeta('office')`)===false,'Charter office needs Second clerk first');
 ok(/Needs Second clerk/.test($('metaList').textContent),'the board list says Charter office needs Second clerk');
 ok(E(`buyMeta('clerks')`)===true && E('ordCap()')===2,'Second clerk: 2 active orders');
 ok(E(`buyMeta('office')`)===true && E('ordCap()')===3,'Charter office: 3 active orders');
 E('render(true)');
 ok(/1 of 3 active/.test($('contracts').textContent) && $('contracts').querySelectorAll('button[data-o]').length===3,'the list shows "1 of 3 active" and the board offers more');

 // ---------- 3. sign up to capacity through the Sign buttons
 $('contracts').querySelector('button[data-o]').click(); E('render(true)');
 [...$('contracts').querySelectorAll('.row')].find(r=>/Admiralty/.test(r.textContent)).querySelector('button[data-o]').click(); E('render(true)');
 ok(E('S.contracts.length')===3,'signed up to capacity');
 E('accept(0)'); ok(E('S.contracts.length')===3,'no fourth order past capacity');
 const txt=$('contracts').textContent;
 ok(/3 of 3 active/.test(txt) && /tree orders first, then the order due soonest/.test(txt),'"3 of 3 active" and the split rule in plain words');
 ok($('contracts').querySelectorAll('.contract[data-ci]').length===3 && $('contracts').querySelectorAll('[data-cbar]').length===3,'each active order has its own card and progress bar');
 ok(/left · (on time|behind)/.test($('contracts').querySelector('[data-cleft="0"]').textContent),'each card shows its deadline');

 // ---------- 4. the split: tree order takes its species' share, the rest goes to the soonest regular order
 const cs=E(`JSON.stringify(S.contracts.map(c=>({m:c.mill, sp:c.sp||null, end:c.end})))`); const L=JSON.parse(cs);
 const iSp=L.findIndex(c=>c.sp), regs=L.map((c,i)=>({...c,i})).filter(c=>!c.sp).sort((a,b)=>a.end-b.end);
 E(`S.landing={bf:1000,val:200}; deliver(1000);`);
 const done=JSON.parse(E('JSON.stringify(S.contracts.map(c=>c.done))'));
 ok(iSp>=0 && near(done[iSp],600),'the spruce order takes the spruce share (60%) first: '+done[iSp]);
 ok(near(done[regs[0].i],400) && near(done[regs[1].i],0),'the rest fills the regular order due soonest');
 const bar=$('contracts').querySelector(`[data-cbar="${iSp}"]`); E('render(true)');
 ok(/600 bd ft of 5(\.00)?K bd ft/.test($('contracts').querySelector(`[data-cdone="${iSp}"]`).textContent),'progress text updates: '+$('contracts').querySelector(`[data-cdone="${iSp}"]`).textContent);
 ok(bar && parseFloat($('contracts').querySelector(`[data-cbar="${iSp}"]`).style.width)>11,'the progress bar moves');

 // ---------- 5. Rush clerk: two regular orders fill from the same logs, one bonus per log
 E(`S.run.perks.push('rush'); S.landing={bf:1000,val:200}; S.cash=0;`);
 const d0=JSON.parse(E('JSON.stringify(S.contracts.map(c=>c.done))')); E('deliver(1000)');
 const d1=JSON.parse(E('JSON.stringify(S.contracts.map(c=>c.done))'));
 ok(near(d1[regs[0].i]-d0[regs[0].i],400) && near(d1[regs[1].i]-d0[regs[1].i],400),'Rush clerk: both regular orders count the same 400 bd ft');
 ok(/same trees fill from the same logs/.test((E('render(true)'), $('contracts').textContent)),'the list says the Rush clerk rule');
 E(`S.run.perks=[]`);

 // ---------- 6. filling one frees a slot; missed tree orders are free unless Overbooked
 E(`S.contracts[${regs[0].i}].done=S.contracts[${regs[0].i}].vol-1; S.landing={bf:500,val:100}; deliver(500);`);
 ok(E('S.contracts.length')===2 && E('ordFull()')===false,'a filled order leaves the list and frees a slot');
 E(`S.cash=1000; S.contracts.forEach(c=>{ if(c.sp) c.end=S.t; }); tick(.01);`);
 ok(E('S.cash')>=999.9 && /Tree orders have no fine/.test(E('S.log[0].text')),'a missed tree order is still free');
 E(`S.run.perks=['overbook']; S.contracts=[{mill:'the Admiralty spar yard', vol:3000, done:1000, dur:10, end:S.t, prem:.4, penalty:0, sp:'spruce'}]; S.cash=1000; tick(.01);`);
 ok(E('ordCap()')===5,'Overbooked: +2 active orders (5 with both board nodes)');
 ok(near(E('S.cash'),1000-Math.round(2000*E('Core.OVERBOOK_FINE_PER_BF'))) && /fine/.test(E('S.log[0].text')),'Overbooked: a missed tree order costs a small fine');
 E(`S.run.perks=['clerk']`); ok(E('ordCap()')===4,'Extra clerk perk: +1 active order for the run');

 // ---------- 7. perks join the draft: Rush clerk only with room for two orders
 E(`S.meta.nodes=[]; S.run.perks=[];`);
 ok(!E(`perkPool().some(p=>p.id==='rush')`) && E(`perkPool().some(p=>p.id==='clerk')`) && E(`perkPool().some(p=>p.id==='overbook')`),'capacity 1: Extra clerk and Overbooked can show up, Rush clerk cannot');
 E(`S.run.perks=['clerk']`); ok(E(`perkPool().some(p=>p.id==='rush')`),'with 2 active orders Rush clerk can show up');

 // ---------- 8. old save: the single contract becomes the list
 E(`S.run.perks=[]; S.meta.nodes=[]; S.contracts=[]; save();`);
 const old=JSON.parse(w.localStorage.getItem('timberline-v2'));
 delete old.contracts; old.contract={mill:'Landfall Pier Works', vol:2000, done:500, dur:300, end:old.t+250, prem:.3, penalty:40}; old.last=Date.now();
 dom.window.close(); dom=mk({'timberline-v2':JSON.stringify(old)}); await sleep(300); w=dom.window; d=w.document; E=s=>w.__eval(s);
 ok(E('Array.isArray(S.contracts) && S.contracts.length')===1 && E('S.contracts[0].done')>=500 && E('S.contracts[0].mill')==='Landfall Pier Works' && E(`'contract' in S`)===false,'an old save\'s contract converts into the list');
 ok(E('ordCap()')===1 && /1 of 1 active/.test(d.getElementById('contracts').textContent),'and shows as "1 of 1 active"');
 const old2=JSON.parse(JSON.stringify(old)); delete old2.contracts; old2.contract=null; old2.last=Date.now();
 dom.window.close(); dom=mk({'timberline-v2':JSON.stringify(old2)}); await sleep(300); w=dom.window; E=s=>w.__eval(s);
 ok(E('S.contracts.length')===0 && E('S.offers.length')>0,'an old save with no contract loads an empty list and a board');
 E('tick(1); render(true)');

 await sleep(100);
 ok(errs.length===0,'no console errors'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
 console.log(fails?`${fails} FAILED`:'ALL PASS'); process.exit(fails?1:0);
})();
