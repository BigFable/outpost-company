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
 ok(d.activeElement.id==='sSaw','picking a log moves focus to the Saw button: '+d.activeElement.id);
 const ev=key('Space');
 ok(E('W.cut.boards.length')===1 || ev.defaultPrevented,'Space saws a board (or at least cancels the browser default so the focused close button is not pressed): boards='+E('W.cut.boards.length')+' defaultPrevented='+ev.defaultPrevented);
 // the route the bug hunt found with the mouse: focus left on the close button, then Space
 E('W.busy=0'); d.getElementById('mgClose').focus(); const ev2=key('Space');
 ok(E('MG.kind')==='saw' && E('W.cut.boards.length')===2 && ev2.defaultPrevented,'Space with focus on the close button saws, and the game stays open: boards='+E('W.cut.boards.length'));
 process.exit(fails()?1:0);
})();
