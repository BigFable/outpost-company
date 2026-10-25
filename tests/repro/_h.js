// Shared jsdom harness for the repro tests: loads prototype/timberline.html with a controllable clock and exposes the page's closure through __eval.
const {JSDOM, VirtualConsole}=require('jsdom');const fs=require('fs');const path=require('path');
const START="window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});";
const SRC=fs.readFileSync(process.env.TIMBERLINE||path.join(__dirname,'../../prototype/timberline.html'),'utf8');
if(!SRC.includes(START)) throw new Error('start line not found');
const HTML=SRC.replace(START,'window.__eval = s => eval(s); '+START);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function mk(store, opts={}){
  const errs=[]; const vc=new VirtualConsole(); vc.on('error',e=>errs.push(String(e&&e.stack||e))); vc.on('jsdomError',e=>errs.push('jsdom:'+(e.stack||e.message)));
  const clock={now:opts.now||Date.now()};
  const dom=new JSDOM(HTML,{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,url:'https://x.test/',beforeParse(w){
    if(store) for(const k in store) w.localStorage.setItem(k,store[k]);
    w.Date.now=()=>clock.now;
    if(opts.pre) opts.pre(w,clock);
    w.HTMLCanvasElement.prototype.getContext=function(){return new Proxy({},{get:(t,p)=>p==='measureText'?()=>({width:10}):p in t?t[p]:()=>{},set:(t,p,v)=>(t[p]=v,true)});};
    w.addEventListener('error',e=>errs.push('win:'+e.message+' @'+(e.error&&e.error.stack||'').split('\n').slice(0,6).join(' | ')));
    w.addEventListener('unhandledrejection',e=>errs.push('rej:'+e.reason));}});
  await sleep(opts.wait||300);
  const w=dom.window; const E=s=>w.__eval(s);
  if(!opts.live) try{E('clearInterval(loop)');}catch(e){}
  return {dom,w,d:w.document,E,errs,clock};
}
let fails=0; const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m); if(!c) fails++;};
module.exports={mk,sleep,ok,fails:()=>fails};
