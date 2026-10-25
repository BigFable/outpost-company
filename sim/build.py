import sys
src=sys.argv[1]; s=open(src).read()
old="window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});"
assert old in s
s=s.replace(old,"""window.__G = {get S(){return S}, get W(){return typeof W!=="undefined" ? W : null}, fresh, tick, eqCost, EQ, UPG, ERAS, SP, rate, baseRate, fellBf, upkeep, buyTract, acceptHire, accept,
 tract, cheapestSale, atRisk, hireActive, market, refreshSales, refreshOffers, genHire, setSite, newTree, deliver, move, damage, handAmt, umult, slopeF, distF, grantBoost, fellK, finishTract, haulPay,
 checkAch: typeof checkAch==='function' ? checkAch : ()=>{},
 ...(typeof cutNow!=='undefined' ? {cutNow, cutNext, moveTract} : {}),
 ...(typeof PERKS!=='undefined' ? {PERKS, ACH, META, MODS, queueDraft, currentOffer, pickPerk, reroll, closeCamp, startRun, buyMeta, legacyNow, canClose, eraCost, perk, runDone, normalize, PMAP} : {}),
 ...(typeof openSawmill!=='undefined' ? {drng, bankN, addItem, fellPrime, gameFind, sellSurplus, reserveFor, canMarker, markerReroll, canBuild, buildStructure, hireSawyer,
   millSawyers, millRateNow, canCloseMill, millLegacyNow, closeMill, buyMillMeta, sawBlock, sawInit, sawPick, sawSaw, sawTurn, sawStep, sawEye, deckOk, mperk} : {}),
 ...(typeof evNow!=='undefined' ? {evNow, effSeason, haulRulesNow, seasonF, setWxMute: v => { wxMute = v; }} : {})};""")
s=s.replace("function render(force){","function render(force){ if (window.__SIM) return;",1)
s=s.replace("function renderLedger(){","function renderLedger(){ if (window.__SIM) return;",1)
open(sys.argv[2],'w').write(s)
