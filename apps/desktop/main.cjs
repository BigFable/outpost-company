// Outpost Company desktop shell. Opens the Vite build of the legacy prototype
// in a window and hosts the Steam bridge (steam-host.cjs) in the main process.
// The renderer stays context-isolated and sandboxed; it reaches Steam only
// through the narrow preload API.
'use strict';
const { app, BrowserWindow, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { startSteamHost } = require('./steam-host.cjs');

// Packaged builds carry the web build inside the app (see electron-builder.yml);
// a dev checkout reads it straight from apps/web/dist.
const ENTRY = app.isPackaged
  ? path.join(__dirname, 'dist', 'web', 'legacy', 'index.html')
  : path.resolve(__dirname, '..', 'web', 'dist', 'legacy', 'index.html');
const SMOKE = process.env.OUTPOST_SMOKE === '1';

function createWindow(host) {
  if (!fs.existsSync(ENTRY)) {
    console.error('Missing the web build. Run "pnpm run build" first (pnpm run desktop does this for you).');
    app.exit(1);
    return;
  }
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 360,
    title: 'Outpost Company',
    backgroundColor: '#1d1c19',
    show: !SMOKE,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.cjs'),
      // Experimental Steam overlay mode only (toggled from the spike test panel).
      ...(host.overlayMode ? { offscreen: true } : {}),
    },
  });
  win.removeMenu();
  if (host.overlayMode) host.attachOverlay(win);
  // Links leave the game window and open in the system browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (SMOKE) {
    const errors = [];
    win.webContents.on('console-message', (e) => {
      const level = e.level ?? e.params?.level;
      const message = e.message ?? e.params?.message;
      if (level === 'error' || level === 3) errors.push(message);
    });
    win.webContents.on('did-fail-load', (_e, code, desc) => errors.push(`load failed ${code} ${desc}`));
    win.webContents.on('preload-error', (_e, _p, err) => errors.push(`preload error ${err.message}`));
    win.webContents.on('did-finish-load', async () => {
      await new Promise((r) => setTimeout(r, Number(process.env.OUTPOST_SMOKE_WAIT_MS) || 1500));
      const title = await win.webContents.executeJavaScript('document.title');
      const buttons = await win.webContents.executeJavaScript('document.querySelectorAll("button").length');
      const bridge = await win.webContents.executeJavaScript(
        `window.outpostDesktop ? window.outpostDesktop.status().then((s) => ({ version: window.outpostDesktop.version,
          backend: s.status.backend, reason: s.status.reason, panel: !!document.getElementById("outpost-steam-panel"),
          startSave: s.startSave && s.startSave.use, cloudWrites: s.cloudWrites, mirrored: s.mirrored,
          localAch: (JSON.parse(localStorage.getItem("timberline-v2") || "{}").ach || []) })) : null`);
      // Fonts come from Google Fonts; offline CI cannot reach them, which is not a game error.
      const real = errors.filter((m) => !/fonts\.(googleapis|gstatic)\.com/.test(String(m)));
      // The bridge must answer, whether or not Steam is present.
      const ok = real.length === 0 && buttons > 0 && !!bridge && !!bridge.backend;
      console.log(JSON.stringify({ title, buttons, bridge, errors: real }));
      app.exit(ok ? 0 : 1);
    });
  }
  win.loadFile(ENTRY);
}

app.whenReady().then(() => createWindow(startSteamHost()));
app.on('window-all-closed', () => app.quit());
