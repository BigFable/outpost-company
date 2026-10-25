// BUG QA-05 (minor): fmt() rounds after choosing the suffix, so values just under a boundary print as "1000", "1000K", "1000Qa".
// Expected: 999.6 -> "1.00K", 999999 -> "1.00M", 1e18 -> something that fits (e.g. "1.00Sx" or "1000Qa" is acceptable only if a larger suffix is missing).
const {mk,ok,fails}=require('./_h');
(async()=>{
 const g=await mk(); const {E}=g;
 const f=n=>E(`fmt(${n})`);
 ok(f(999.6)!=='1000','fmt(999.6) = '+f(999.6));
 ok(f(999999)!=='1000K','fmt(999999) = '+f(999999));
 ok(f(999999999)!=='1000M','fmt(999999999) = '+f(999999999));
 ok(!/^\d{4,}/.test(f(1e21)),'fmt(1e21) = '+f(1e21)+' (no suffix past Qa)');
 process.exit(fails()?1:0);
})();
