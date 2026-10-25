// BUG QA-08 (minor): a save that fails JSON.parse (truncated write, manual edit) silently starts a new company, and the autosave overwrites the broken
// text 5 s later, so it cannot be recovered. Also, a save whose v is not 2 is dropped the same way. Expected: the old text is kept under a backup key.
const {mk,ok,fails}=require('./_h');
(async()=>{
 const g=await mk({'timberline-v2':'{"v":2,"cash":123,"own":{"axeman":3'},{live:true,wait:400});
 g.E('save()');
 const keys=[...Array(g.w.localStorage.length).keys()].map(i=>g.w.localStorage.key(i));
 const kept=keys.some(k=>k!=='timberline-v2' && /"cash":123/.test(g.w.localStorage.getItem(k)));
 ok(kept,'corrupt save text preserved under another key: keys='+JSON.stringify(keys));
 process.exit(fails()?1:0);
})();
