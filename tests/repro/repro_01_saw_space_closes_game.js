// BUG QA-01 (major): in Saw for grade the button reads "Saw a board (Space)", but after the log is picked with the keyboard (or by
// any route that leaves focus on the top-right close button) Space is not handled (sawKey ignores Space when the event target is a button),
// so the browser presses the focused close button and the game shuts mid-saw, losing the log (and a Prime spar).
// Expected: Space saws a board. jsdom cannot press buttons for us, so we check what the page does with the keydown.
const {mk,ok,fails}=require('./_h');
(async()=>{
 const g=await mk(); const {E,w,d}=g;
 E('S.run.deliv=Core.CLOSE_VOL+1; closeCamp(); S.run.setup&&startRun([]); S.bulk.logs=50000; S.story.card=false;');
 E('openMG("saw"); cancelAnimationFrame(MG.raf)');
 const key=(code,target)=>{ const ev=new w.KeyboardEvent('keydown',{code,key:code==='Space'?' ':code,bubbles:true,cancelable:true}); (target||d.activeElement).dispatchEvent(ev); return ev; };
 ok(d.activeElement.id==='mgClose','focus sits on the close button when the game opens (openMG focuses #mgClose): '+d.activeElement.id);
 key('Digit1'); ok(E('W.phase')==='saw','Digit1 picks the first log');
 ok(d.activeElement.id==='mgClose','focus is still on the close button after picking (sawButtons does not move it)');
 const ev=key('Space');
 ok(E('W.cut.boards.length')===1 || ev.defaultPrevented,'Space saws a board (or at least cancels the browser default so the focused close button is not pressed): boards='+E('W.cut.boards.length')+' defaultPrevented='+ev.defaultPrevented);
 process.exit(fails()?1:0);
})();
