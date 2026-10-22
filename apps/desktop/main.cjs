// Outpost Company desktop shell (tech plan week 1). Opens the Vite build of
// the legacy prototype in a window. No Steam integration yet (week 2).
'use strict';
const { app, BrowserWindow, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

const ENTRY = path.resolve(__dirname, '..', 'web', 'dist', 'legacy', 'index.html');
const SMOKE = process.env.OUTPOST_SMOKE === '1';

function createWindow() {
  if (!fs.existsSync(ENTRY)) {
    console.error(`Missing ${ENTRY}. Run "npm run build" first (npm run desktop does this for you).`);
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
    },
  });
  win.removeMenu();
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
    win.webContents.on('did-finish-load', async () => {
      await new Promise((r) => setTimeout(r, 1500));
      const title = await win.webContents.executeJavaScript('document.title');
      const buttons = await win.webContents.executeJavaScript('document.querySelectorAll("button").length');
      // Fonts come from Google Fonts; offline CI cannot reach them, which is not a game error.
      const real = errors.filter((m) => !/fonts\.(googleapis|gstatic)\.com/.test(String(m)));
      console.log(JSON.stringify({ title, buttons, errors: real }));
      app.exit(real.length === 0 && buttons > 0 ? 0 : 1);
    });
  }
  win.loadFile(ENTRY);
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
