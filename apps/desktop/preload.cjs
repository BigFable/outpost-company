// Narrow, context-isolated bridge between the game page and the main process.
// It never exposes ipcRenderer itself. Jobs:
//  1. Before the game reads its save, ask the main process whether the Steam
//     Cloud save is newer and, if so, put it in localStorage (start rule in
//     packages/platform/src/save-sync.ts).
//  2. Each time the game saves (it writes "Saved." into #saved), forward the
//     save blob so the main process can write Steam Cloud (throttled) and
//     mirror newly earned achievements to Steam.
//  3. In the spike build (Valve test app 480) show a small Steam test panel.
// The prototype is not modified; everything here reads the page from outside.
'use strict';
const { contextBridge, ipcRenderer } = require('electron');

const SAVE_KEY = 'timberline-v2';
const readLocal = () => { try { return localStorage.getItem(SAVE_KEY); } catch { return null; } };

// 1. Start rule. Synchronous on purpose: the page's scripts have not run yet.
try {
  const choice = ipcRenderer.sendSync('outpost:start-save', readLocal());
  if (choice && choice.use === 'cloud' && typeof choice.blob === 'string') localStorage.setItem(SAVE_KEY, choice.blob);
} catch { /* no cloud, keep local */ }

// 2. Save forwarding.
let lastSent = null;
function forwardSave() {
  const blob = readLocal();
  if (!blob || blob === lastSent) return;
  lastSent = blob;
  ipcRenderer.send('outpost:saved', blob);
}

contextBridge.exposeInMainWorld('outpostDesktop', {
  platform: 'electron',
  version: 2,
  /** Status and spike diagnostics (also used by the headless smoke test). */
  status: () => ipcRenderer.invoke('outpost:status'),
  /** For a future core achievement event: mirror one game achievement id now. */
  achievementUnlocked: (gameId) => { if (typeof gameId === 'string') ipcRenderer.send('outpost:achievement', gameId); },
});

window.addEventListener('DOMContentLoaded', () => {
  const saved = document.getElementById('saved');
  if (saved) new MutationObserver(forwardSave).observe(saved, { childList: true, characterData: true, subtree: true });
  setInterval(forwardSave, 30000);
  document.addEventListener('visibilitychange', () => { if (document.hidden) setTimeout(forwardSave, 0); });
  window.addEventListener('pagehide', forwardSave);
  ipcRenderer.invoke('outpost:status').then((r) => { if (r && r.spike) mountPanel(r); }, () => {});
});

// 3. Spike test panel. Built with DOM calls (no innerHTML), styled with the
// prototype's CSS tokens so it follows the light and dark themes.
function el(tag, attrs, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'style') n.style.cssText = v; else if (k.startsWith('on')) n.addEventListener(k.slice(2), v); else n.setAttribute(k, v);
  }
  for (const k of kids) n.append(k);
  return n;
}

function mountPanel(first) {
  if (document.getElementById('outpost-steam-panel')) return;
  const css = el('style', {}, `
#outpost-steam-panel{position:fixed;right:16px;bottom:16px;z-index:99999;max-width:min(360px,calc(100vw - 32px));
  font:13px/1.4 var(--f-body,system-ui,sans-serif);color:var(--ink,#1B241E);background:var(--panel,#F3F5F0);
  border:1px solid var(--line,#C3CCC1);border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.25)}
#outpost-steam-panel summary{cursor:pointer;padding:8px 12px;font-weight:600;list-style:none}
#outpost-steam-panel summary::-webkit-details-marker{display:none}
#outpost-steam-panel .osp-body{padding:0 12px 12px;max-height:60vh;overflow:auto}
#outpost-steam-panel .osp-row{margin:4px 0}
#outpost-steam-panel .osp-ok{color:var(--good,#2F7A45)} #outpost-steam-panel .osp-no{color:var(--bad,#B3261E)}
#outpost-steam-panel .osp-muted{color:var(--muted,#5A685E)}
#outpost-steam-panel .osp-btns{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
#outpost-steam-panel button{font:inherit;padding:6px 10px;border-radius:6px;border:1px solid var(--line,#C3CCC1);
  background:var(--bg,#E3E8DF);color:var(--ink,#1B241E);cursor:pointer;min-height:32px}
#outpost-steam-panel button.armed{background:var(--accent,#E0560B);color:var(--accent-ink,#fff);border-color:var(--accent,#E0560B)}
#outpost-steam-panel ul{margin:4px 0;padding-left:18px}`);
  const dot = el('span');
  const body = el('div', { class: 'osp-body' });
  const msg = el('div', { class: 'osp-row osp-muted', role: 'status' });
  const panel = el('details', { id: 'outpost-steam-panel' }, el('summary', {}, 'Steam test ', dot), body);
  document.head.append(css);
  document.body.append(panel);

  const yesNo = (v, yes, no) => el('span', { class: v ? 'osp-ok' : 'osp-no' }, v ? yes : no);
  function render(r) {
    const s = r.status;
    dot.textContent = s.backend === 'steam' ? '(connected)' : '(no Steam)';
    dot.className = s.backend === 'steam' ? 'osp-ok' : 'osp-no';
    body.replaceChildren(
      el('div', { class: 'osp-row' }, 'Steam: ', yesNo(s.backend === 'steam', `connected, app ${s.appId}`, 'not connected')),
      s.reason ? el('div', { class: 'osp-row osp-muted' }, s.reason) : '',
      el('div', { class: 'osp-row' }, 'Overlay: ', yesNo(s.overlayAvailable, 'available (Shift+Tab)', 'not detected'), r.overlayMode ? ' · overlay mode on' : ''),
      el('div', { class: 'osp-row' }, 'Cloud: ', yesNo(s.cloudAvailable, 'on', 'off'),
        ` · ${r.cloudWrites} save upload${r.cloudWrites === 1 ? '' : 's'}`, r.lastCloudWrite ? ` (last ${r.lastCloudWrite.slice(11, 19)} UTC)` : ''),
      r.startSave ? el('div', { class: 'osp-row osp-muted' }, `Started from: ${r.startSave.use}. ${r.startSave.reason}`) : '',
      el('div', { class: 'osp-row' }, 'Achievements sent to Steam:'),
      el('ul', {}, ...r.achievements.map((a) => el('li', {}, `${a.gameId} → ${a.steam}: `,
        a.unlockedOnSteam === null ? el('span', { class: 'osp-muted' }, 'unknown') : yesNo(a.unlockedOnSteam, 'unlocked', 'locked')))),
      el('div', { class: 'osp-btns' },
        btn('Unlock test achievement', 'unlock-test'),
        armedBtn('Clear test achievements', 'clear-mapped'),
        btn('Test cloud save', 'cloud-test'),
        btn('Open overlay', 'overlay'),
        armedBtn(r.overlayMode ? 'Turn overlay mode off (restarts)' : 'Try overlay mode (restarts)', 'overlay-mode'),
        btn('Copy report', 'copy-report')),
      msg);
  }
  async function run(action) {
    msg.textContent = 'Working...';
    try {
      const res = await ipcRenderer.invoke('outpost:test', action);
      msg.textContent = res.message;
      msg.className = `osp-row ${res.ok ? 'osp-ok' : 'osp-no'}`;
    } catch (e) { msg.textContent = String(e && e.message || e); }
    refresh();
  }
  const btn = (label, action) => el('button', { type: 'button', onclick: () => run(action) }, label);
  // Destructive or restarting actions need a second click (no confirm dialogs).
  function armedBtn(label, action) {
    let timer = null;
    const b = el('button', { type: 'button', onclick: () => {
      if (!timer) { b.textContent = 'Click again to confirm'; b.classList.add('armed'); timer = setTimeout(() => { timer = null; b.textContent = label; b.classList.remove('armed'); }, 3000); return; }
      clearTimeout(timer); timer = null; run(action);
    } }, label);
    return b;
  }
  // `msg` is the same node on every render, so its text survives a refresh.
  async function refresh() {
    try { render(await ipcRenderer.invoke('outpost:status')); } catch { /* main process busy */ }
  }
  render(first);
  setInterval(() => { if (panel.open) refresh(); }, 5000);
}
