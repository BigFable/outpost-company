// Species overhaul slice 1 (docs/design/species-overhaul.md): the Cove trio made distinct. Land office grounds and the
// camp-fit listing card, species felling and bucking rules shown in play (mouse only), the Prime spar split 1/3/1,
// species charter orders (share counting, free to miss), weight slowing idle skid and haul, hemlock tanbark, and old
// saves converting (walnut -> cloudwood, grounds and weights added, the pond kept).
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
(async()=>{
 let dom=mk(); await sleep(300); let w=dom.window, d=w.document, E=s=>w.__eval(s);
 const $=id=>d.getElementById(id), st=()=>$('mgStatus').textContent;
 const cv=$('mgCanvas'), pe=(type,x,y)=>cv.dispatchEvent(new w.MouseEvent(type,{bubbles:true,cancelable:true,clientX:x,clientY:y,button:0,buttons:type==='pointerup'?0:1}));

 // ---------- 1. land office: Cove grounds and the camp-fit card
 ok(E(`S.tracts[0].ground`)==='coast' && Math.abs(E(`S.tracts[0].wt`)-1.04)<1e-9,'the starting woodlot is coast bottoms, weight 1.04');
 const grounds=new Set(); for(let i=0;i<30;i++){ E('refreshSales()'); E('S.forSale').forEach(t=>grounds.add(t.ground)); }
 ok([...grounds].sort().join()==='coast,headland,swamp','Cove listings come from the three Cove grounds: '+[...grounds].join());
 ok(E(`S.forSale.every(t=>t.ground!=='swamp' || t.slope!=='steep')`),'hemlock swamps are never steep');
 E(`S.forSale=[Core.makeTract('Test spruce, Lot 1',[['spruce',80],['pine',20]],50,2,'flat','headland'), Core.makeTract('Test swamp, Lot 2',[['hemlock',80],['spruce',20]],50,2,'flat','swamp'), Core.makeTract('Test coast, Lot 3',[['pine',70],['hemlock',30]],50,2,'flat','coast')];
   S.forSale.forEach(t=>t.price=100); S.own={}; render(true);`);
 const cards=[...d.querySelectorAll('#sales .row.lot')];
 ok(cards.length===3,'three listing cards');
 const c0=cards[0].textContent, c1=cards[1].textContent;
 ok(/Spruce headland/.test(c0) && /Hemlock swamp/.test(c1) && /Coast bottoms/.test(cards[2].textContent),'each card names its ground');
 ok(cards.every(c=>c.querySelectorAll('.spbar i').length===2),'each card has a species bar');
 ok(/a tree/.test(c0) && /chops a tree/.test(c0),'value and chops per tree shown');
 ok(/Light: skid and haul ×1\.19/.test(c0) && /Heavy: skid and haul ×0\.96/.test(c1) && /Average weight/.test(cards[2].textContent),'weight tags: light spruce, heavy hemlock, average coast');
 ok(/Best for: Prime spars/.test(c0) && /Best for: tanbark/.test(c1) && /Best for: boards and amber pitch/.test(cards[2].textContent),'best-for line by main species');
 ok(/Windy: felling-game wind ×1\.2/.test(c0) && /land ×0\.9/.test(c1),'ground twists shown');
 ok(cards.every(c=>c.querySelector('.fit').dataset.fit==='none'),'no crews: camp fit asks you to hire');
 // lots of fallers, few teams: the heavy lot is "teams short", the light one fits better
 E(`S.own={crosscut:4, bucker:20, oxen:1, sled:3}; render(true);`);
 const fits=[...d.querySelectorAll('#sales .fit')].map(p=>p.dataset.fit), ratio=i=>E(`Core.campFit(campCaps(), S.forSale[${i}]).ratio`);
 ok(fits[1]==='teams' && /fallers are ahead/.test(d.querySelectorAll('#sales .fit')[1].textContent),'fallers ahead of teams: the hemlock swamp warns the wood will pile up: '+fits.join());
 ok(ratio(0)<ratio(1),'the light spruce lot fits a team-short camp better than the heavy swamp');
 E(`S.own={axeman:1, bucker:20, horses:6, wagon:4}; render(true);`);
 ok(d.querySelectorAll('#sales .fit')[0].dataset.fit==='fallers','teams ahead of fallers: the card says so');

 // ---------- 2. weight: idle skid and haul move bd ft / weight; felling unchanged
 E(`S.own={oxen:2, sled:2, axeman:1}; S.tracts=[Core.makeTract('W',[['pine',1]],50,1,'flat')]; setSite();`);
 const skP=E(`rate('skid')`), haP=E(`rate('haul')`), feP=E(`rate('fell')`);
 E(`S.tracts=[Core.makeTract('W',[['hemlock',1]],50,1,'flat')]; setSite();`);
 ok(Math.abs(E(`rate('skid')`)-skP/1.1)<1e-9 && Math.abs(E(`rate('haul')`)-haP/1.1)<1e-9 && E(`rate('fell')`)===feP,'hemlock (weight 1.1): idle skid and haul ÷1.1, felling unchanged');
 E(`S.tracts=[Core.makeTract('W',[['spruce',1]],50,1,'flat')]; setSite();`);
 ok(Math.abs(E(`rate('skid')`)-skP/0.8)<1e-9,'spruce (weight 0.8): idle skid ×1.25');
 E(`S.landing={bf:0,val:0}; S.cut={bf:1000,val:200}; S.stems={bf:0,val:0}; S.tracts=[Core.makeTract('W',[['hemlock',1]],50,1,'flat')]; S.boost={}; S.owed=0; S.cash=1e6; tick(1);`);
 ok(Math.abs(E(`S.landing.bf`)-skP/1.1)<1e-6,'a tick on hemlock skids rate ÷ weight: '+E(`S.landing.bf`).toFixed(3));

 // ---------- 3. hemlock tanbark in Spring and Summer (calendar season), via the core hook
 E(`S.stems={bf:0,val:0}; S.season=1; const t=Core.makeTract('T',[['hemlock',1]],50,1,'flat'); fellK(t,1);`);
 ok(Math.abs(E(`S.stems.val`)-(32.16+14))<1e-9,'a hemlock felled in Summer carries $14 of tanbark: $'+E(`S.stems.val`).toFixed(2));
 E(`S.stems={bf:0,val:0}; S.season=2; fellK(Core.makeTract('T',[['hemlock',1]],50,1,'flat'),1);`);
 ok(Math.abs(E(`S.stems.val`)-32.16)<1e-9,'no tanbark in Fall');

 // ---------- 4. felling rules shown in play, mouse only
 E(`closeMG(); S.season=2; S.own={}; S.upg=[]; S.run.perks=[]; S.tracts=[Core.makeTract('Head',[['spruce',100]],50,1,'flat','headland')]; setSite(); S.vis='spruce'; openMG('fell'); cancelAnimationFrame(MG.raf);`);
 ok(/^Shore spruce: tall and shallow-rooted/.test(st()) && /Shore spruce/.test($('mgHelp').textContent),'spruce tag in the status line and help');
 ok(Math.abs(E('F.wind.mult')-1.8)<1e-9 && E('F.R.cut')===1.25 && E('F.R.fallS')===0.8,'spruce on a headland: wind ×1.5 × 1.2, back cut ×1.25, 0.8 s fall');
 // play it with the mouse: press to set the notch, press and hold, release in the green
 E(`F.aim=F.gap; F.sweep=0;`); pe('pointerdown',320,200); pe('pointerup',320,200);
 ok(E('F.phase')==='cut','mouse press sets the face notch');
 pe('pointerdown',320,200); ok(E('F.holding'),'mouse hold saws the back cut');
 E(`for(let i=0;i<400 && F.hinge>.14;i++) fellStep(1/60);`); const h=E('F.hinge');
 ok(Math.abs((1-h)/E('F.R.cut') - (1-h))>0 && h<=.14,'the spruce back cut runs (hinge '+h.toFixed(3)+')');
 E(`F.wind.str=0; F.aim=F.gap;`); pe('pointerup',320,200);
 ok(E('F.phase')==='fall','mouse release drops the tree');
 E(`for(let i=0;i<120 && F.phase!=='done';i++) fellStep(1/60);`);
 ok(E('F.phase')==='done' && /Perfect lay/.test(st()) && /\+3 Prime spars/.test(st()),'a perfect spruce lay stamps 3 Prime spars: '+st().slice(0,160));
 // hemlock: brittle
 E(`closeMG(); S.tracts=[Core.makeTract('Sw',[['hemlock',100]],50,1,'flat','swamp')]; setSite(); S.vis='hemlock'; openMG('fell'); cancelAnimationFrame(MG.raf);`);
 ok(/^Mist hemlock: brittle/.test(st()) && E('hingeZone().join()')==='0.1,0.2','hemlock tag; green hinge zone 10–20%');
 E(`F.phase='cut'; F.hinge=.04; F.R.chairBelow>0 && fellResolve();`);
 ok(E('F.out.k')==='chair' && /Brittle hemlock/.test(E('F.out.text')),'a 4% hinge barber-chairs a hemlock');
 E(`F.phase='cut'; F.hinge=.15; F.wind.str=0; F.aim=F.rocks[0]-F.gap+F.gap; F.gap=F.rocks[0]+80; const r0=Math.random; Math.random=()=>.5; fellResolve(); Math.random=r0;`);
 ok(E('F.out.k')==='broke' && E('F.out.m')===0.4 && /−60%/.test(E('F.out.text')),'a hemlock on a rock loses 60%: '+E('F.out.text'));
 E(`closeMG(); S.vis='pine'; S.tracts=[Core.makeTract('P',[['pine',100]],50,1,'flat')]; setSite(); openMG('fell'); cancelAnimationFrame(MG.raf);`);
 ok(E('F.wind.mult')===1 && E('hingeZone().join()')==='0.08,0.2' && E(`F.phase='cut', F.hinge=.15, F.wind.str=0, F.aim=F.rocks[0], F.gap=F.rocks[0]+80, fellResolve(), F.out.m`)===0.6,'pine keeps the standard rules (rock −40%)');

 // ---------- 5. bucking rules shown in play, mouse only
 E(`closeMG(); S.ui.buckIntro=true; S.stems={bf:5000,val:1000}; buckKeep=null; S.tracts=[Core.makeTract('Sp',[['spruce',100]],50,1,'flat')]; setSite(); openMG('buck'); cancelAnimationFrame(MG.raf);`);
 ok(/^Shore spruce: clear butt logs/.test(st()) && E('B.sp')==='spruce','spruce stem: tag in the status line');
 ok(E('B.L')>=44 && E('B.L')<=66 && E('B.def.knots.every(k=>k>=B.L*.5)'),'spruce stem 44–66 ft with knots only in the top half: '+E('B.L'));
 ok(E(`(B.def={knots:[],rot:null,sweep:null,shake:null}, B.d0=24, seg(0,16).val/seg(0,14).val)`)>E(`(()=>{const R=B.R; B.R=Core.buckRules('pine'); const r=seg(0,16).val/seg(0,14).val; B.R=R; return r;})()`),'16 ft spruce spar lengths pay more than on pine');
 ok(/Shore spruce/.test($('mgGuideL').textContent) && /Mist hemlock/.test($('mgGuideL').textContent),'the bucking guide lists the species rules');
 // mouse-only cut: click at 16 ft, then the send button
 E('B.cuts=[]'); const x16=40+16*560/E('B.L'); pe('pointerdown',x16,120); pe('pointerup',x16,120);
 ok(E('B.cuts.join()')==='16','a mouse click places a cut at 16 ft');
 E(`closeMG(); buckKeep=null; S.tracts=[Core.makeTract('He',[['hemlock',100]],50,1,'flat')]; setSite(); let n=0; do { buckKeep=null; buckInit(); n++; } while(!B.def.shake && n<40);`);
 ok(E('B.sp')==='hemlock' && /^Mist hemlock/.test(st()) && E('!!B.def.shake'),'hemlock stems can carry ring shake');
 const sh=E('B.def.shake'); E(`B.def.sweep=null; B.def.rot=null; B.def.knots=[];`);
 const a=Math.max(0,sh[0]-2), g=E(`seg(${a}, ${a+10}).g`), why=E(`seg(${a}, ${a+10}).why`);
 ok(g===3 && why==='ring shake','a sawlog across the ring shake is grade 3 (ring shake)');
 ok(E(`B.R.lenP[16]===1 && B.R.lenP[8]===1`),'hemlock: every length pays the same');

 // ---------- 6. species charter orders: share counting, premium, free to miss
 E(`closeMG(); S.tracts=[Core.makeTract('Mix',[['spruce',70],['pine',30]],500,1,'flat','headland')]; setSite(); S.contract=null;`);
 let found=null; for(let i=0;i<60 && !found;i++){ E('refreshOffers()'); found=E(`S.offers.find(o=>o.sp)||null`); }
 ok(!!found && found.prem>=.3 && found.prem<=.55 && found.penalty===0,'species orders turn up, +30–55%, no penalty: '+(found&&found.mill));
 E(`S.offers=[{mill:'the Admiralty spar yard', vol:1000, dur:300, prem:.4, penalty:0, sp:'spruce'}]; render(true);`);
 const ctxt=$('contracts').textContent;
 ok(/Species order/.test(ctxt) && /Shore spruce only/.test(ctxt) && /long straight spruce/.test(ctxt) && /Free to miss/.test(ctxt) && /70%/.test(ctxt),'the order card names the species, client line, share and no penalty');
 E(`accept(0); S.landing={bf:500,val:100}; S.cash=0; S.owed=0; S.rep=0; S.camps={};`); E(`deliver(100)`);
 ok(Math.abs(E('S.contract.done')-70)<1e-9,'only the spruce share (70%) of a delivery counts toward it');
 E(`S.cash=500; S.contract.end=S.t; tick(.01);`);
 ok(E('S.contract')===null && E('S.cash')>=499 && /free to miss/.test(E('S.log[0].text')),'a missed species order costs nothing: '+E('S.log[0].text'));

 // ---------- 7. old save converts: walnut -> cloudwood, grounds and weights, pond kept
 w.dispatchEvent(new w.Event('pagehide'));
 const old=JSON.parse(w.localStorage.getItem('timberline-v2'));
 const walnutTract={name:'Old grove, Lot 9', mix:[['walnut',6],['oak',4]], trees:900, left:800, miles:3, slope:'flat', hp:30.8, bf:288, val:200, road:false};
 old.tracts=[walnutTract]; old.forSale=[{...walnutTract, price:5000}, {name:'Old cove, Lot 2', mix:[['pine',6],['hemlock',4]], trees:40, left:40, miles:1, slope:'flat', hp:20.8, bf:208, val:36, road:false, price:600}];
 old.hireOffer={...walnutTract, hire:{mill:'Fogline Box & Crate', rate:.45}}; old.vis='walnut'; old.bulk={logs:12345}; old.contract=null; old.offers=[{mill:'the Cove timber merchant', vol:2000, dur:300, prem:.2, penalty:10}]; old.offerT=999; old.saleT=999;
 old.last=Date.now(); dom.window.close();
 dom=mk({'timberline-v2':JSON.stringify(old)}); await sleep(300); w=dom.window; d=w.document; E=s=>w.__eval(s);
 ok(E(`S.tracts[0].mix[0][0]`)==='cloudwood' && E(`S.forSale[0].mix[0][0]`)==='cloudwood' && E(`S.hireOffer.mix[0][0]`)==='cloudwood' && E('S.vis')==='cloudwood','walnut becomes cloudwood in the tract, listings, hire offer and the tree on view');
 ok(E(`S.tracts[0].ground`)==='coast' && E(`S.forSale[1].ground`)==='coast' && E(`S.hireOffer.ground`)==='mixed','old tracts get a ground (coast; hires mixed)');
 ok(Math.abs(E(`S.forSale[1].wt`)-1.04)<1e-9 && E(`S.tracts[0].wt`)===1,'weights recomputed from the mix');
 ok(E(`S.tracts[0].left`)===800 && E(`S.tracts[0].val`)===200,'the old tract keeps its progress and value');
 ok(E('S.bulk.logs')===12345,'the mill pond is kept');
 ok(!!d.querySelector('#sales .row.lot') && /Coast bottoms/.test($('sales').textContent),'converted listings render as cards');
 E('tick(1); render(true)');

 await sleep(100);
 ok(errs.length===0,'no console errors'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
 console.log(fails?`${fails} FAILED`:'ALL PASS'); process.exit(fails?1:0);
})();
