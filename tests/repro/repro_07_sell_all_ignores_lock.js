// BUG QA-07 (minor): the warehouse "Lock" only protects an item from Sell surplus. "Sell 1" and "Sell all" stay enabled on a locked item and sell it,
// so a locked Prime spar (reserved for the Admiralty order or the mill) can be dumped with one stray click. Expected: locked items cannot be sold by the row buttons.
const {mk,ok,fails}=require('./_h');
(async()=>{
 const g=await mk(); const {E,d}=g;
 E(`S.orders.autoFill=false; S.locks.push('logging.prime_spar'); addItem('logging.prime_spar',4,true); openWh('stock','logging.prime_spar')`);
 const b=d.querySelector('[data-sa="logging.prime_spar"]');
 ok(b.disabled || (b.click(), E(`bankN('logging.prime_spar')`)===4),'Sell all on a locked item: stock now '+E(`bankN('logging.prime_spar')`)+' of 4');
 process.exit(fails()?1:0);
})();
