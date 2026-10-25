// Main-process side of the Steam bridge (tech plan week-2 spike).
// Owns the platform object (Steam via steamworks-ffi-node, or "none"), the
// cloud-save writer and the achievement mirror, and answers the preload's IPC.
// Every Steam failure degrades to "none": the game always runs.
'use strict';
const { app, clipboard, ipcMain } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const P = require('./dist/platform.cjs');

const SETTINGS_FILE = () => path.join(app.getPath('userData'), 'spike-settings.json');
const REPORT_FILE = () => path.join(app.getPath('userData'), 'steam-spike-report.txt');
const TEST_FILE = 'outpost-spike-test.txt';

const logLines = [];
function log(message) {
  const line = `${new Date().toISOString()} ${message}`;
  logLines.push(line);
  if (logLines.length > 60) logLines.shift();
  console.log(`[steam] ${message}`);
}

function readSettings() {
  try { return { overlayMode: false, ...JSON.parse(fs.readFileSync(SETTINGS_FILE(), 'utf8')) }; } catch { return { overlayMode: false }; }
}
function writeSettings(s) {
  try { fs.mkdirSync(path.dirname(SETTINGS_FILE()), { recursive: true }); fs.writeFileSync(SETTINGS_FILE(), JSON.stringify(s)); } catch (e) { log(`settings write failed: ${e.message}`); }
}

/** App id: OUTPOST_STEAM_APP_ID, else steam_appid.txt beside the game, else Valve's test app 480. */
function resolveAppId() {
  const env = Number(process.env.OUTPOST_STEAM_APP_ID);
  if (Number.isInteger(env) && env > 0) return env;
  for (const dir of [path.dirname(app.getPath('exe')), __dirname]) {
    try {
      const n = Number(fs.readFileSync(path.join(dir, 'steam_appid.txt'), 'utf8').trim());
      if (Number.isInteger(n) && n > 0) return n;
    } catch { /* not there */ }
  }
  return P.SPIKE_APP_ID;
}

/** A folder holding `redistributable_bin/`, searched in order. Null when none is found. */
function resolveSdkPath() {
  const candidates = [
    process.env.OUTPOST_STEAMWORKS_SDK,
    process.resourcesPath && path.join(process.resourcesPath, 'steamworks_sdk'),
    path.join(path.dirname(app.getPath('exe')), 'steamworks_sdk'),
    path.join(__dirname, 'steamworks_sdk'),
  ].filter(Boolean);
  return candidates.find((d) => fs.existsSync(path.join(d, 'redistributable_bin'))) ?? null;
}

function createPlatform(appId) {
  if (process.env.OUTPOST_STEAM === '0') return P.nonePlatform('Steam turned off for this launch (OUTPOST_STEAM=0).');
  const codec = { encode: (s) => Buffer.from(s, 'utf8'), decode: (b) => Buffer.from(b).toString('utf8') };
  if (process.env.OUTPOST_FAKE_STEAM === '1') {
    // Smoke test only: the whole bridge against an in-memory Steam.
    const seed = process.env.OUTPOST_FAKE_CLOUD_SAVE ? { [P.CLOUD_FILE]: process.env.OUTPOST_FAKE_CLOUD_SAVE } : {};
    return P.connectSteam(() => require('./fake-steam.cjs').createFakeSteam(seed), { appId, codec, log });
  }
  const sdkPath = resolveSdkPath();
  if (!sdkPath) return P.nonePlatform('Steamworks SDK files are not in this build (steamworks_sdk/redistributable_bin missing). See docs/steam/spike-test-plan.md.');
  return P.connectSteam(() => require('steamworks-ffi-node').SteamworksSDK.getInstance(), {
    appId,
    sdkPath,
    codec,
    log,
  });
}

function startSteamHost() {
  const appId = resolveAppId();
  const settings = readSettings();
  const platform = createPlatform(appId);
  const st0 = platform.status();
  log(`backend=${st0.backend} appId=${appId}${st0.reason ? ` reason="${st0.reason}"` : ''}`);
  const timer = setInterval(() => platform.tick(), 1000);
  timer.unref?.();

  const state = { start: null, cloudWrites: 0, lastCloudWrite: null, mirrored: [], cloudTest: null };
  const writer = new P.CloudSaveWriter(async (blob) => {
    const ok = await platform.cloud.write(P.CLOUD_FILE, blob);
    if (ok) { state.cloudWrites++; state.lastCloudWrite = new Date().toISOString(); }
    return ok;
  }, () => Date.now(), 60_000);
  const mirror = new P.AchievementMirror((name) => platform.achievements.unlock(name), appId);

  // Start rule: called synchronously by the preload before the game reads its save.
  ipcMain.on('outpost:start-save', async (event, local) => {
    try {
      const cloud = await platform.cloud.read(P.CLOUD_FILE);
      const choice = P.chooseStartSave(typeof local === 'string' ? local : null, cloud);
      state.start = { use: choice.use, reason: choice.reason, at: new Date().toISOString() };
      log(`start save: ${choice.use} (${choice.reason})`);
      if (choice.use === 'cloud' && typeof local === 'string' && local) {
        // Keep the device's save we are about to replace, just in case.
        const dir = path.join(app.getPath('userData'), 'save-backups');
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, `local-${Date.now()}.json`), local);
      }
      event.returnValue = choice.use === 'cloud' ? { use: 'cloud', blob: choice.blob } : { use: choice.use };
    } catch (e) {
      log(`start save failed: ${e.message}`);
      event.returnValue = { use: 'local' };
    }
  });

  ipcMain.on('outpost:saved', async (_event, blob) => {
    if (typeof blob !== 'string') return;
    try {
      await writer.offer(blob);
      const got = await mirror.sync(blob);
      if (got.length) { state.mirrored.push(...got); log(`mirrored to Steam: ${got.join(', ')}`); }
    } catch (e) { log(`save sync failed: ${e.message}`); }
  });

  ipcMain.on('outpost:achievement', async (_event, gameId) => {
    if (typeof gameId !== 'string') return;
    const got = await mirror.mirror([gameId]);
    if (got.length) { state.mirrored.push(...got); log(`mirrored to Steam: ${got.join(', ')}`); }
  });

  async function report() {
    const status = platform.status();
    const steamList = await platform.achievements.list();
    return {
      app: `Outpost Company ${app.getVersion()}`,
      spike: appId === P.SPIKE_APP_ID,
      os: `${process.platform} ${os.release()} ${process.arch}`,
      electron: process.versions.electron,
      when: new Date().toISOString(),
      status,
      overlayMode: settings.overlayMode,
      startSave: state.start,
      cloudWrites: state.cloudWrites,
      lastCloudWrite: state.lastCloudWrite,
      cloudTest: state.cloudTest,
      mirrored: state.mirrored,
      achievements: P.STEAM_ACHIEVEMENTS.map((m) => {
        const api = P.steamAchievementName(m.gameId, appId);
        return { gameId: m.gameId, steam: api, unlockedOnSteam: steamList.find((a) => a.apiName === api)?.unlocked ?? null };
      }),
      log: logLines.slice(-30),
    };
  }

  ipcMain.handle('outpost:status', () => report());

  ipcMain.handle('outpost:test', async (_event, action) => {
    switch (action) {
      case 'unlock-test': {
        const api = P.steamAchievementNames(appId)[0];
        const ok = await platform.achievements.unlock(api);
        log(`test unlock ${api}: ${ok}`);
        return { ok, message: ok ? `Unlocked ${api} on Steam.` : `Could not unlock ${api}.` };
      }
      case 'clear-mapped': {
        const names = P.steamAchievementNames(appId);
        const results = await Promise.all(names.map((n) => platform.achievements.clear(n)));
        mirror.reset();
        const ok = results.every(Boolean);
        log(`clear mapped: ${results.join(',')}`);
        return { ok, message: ok ? 'Cleared the test achievements on Steam.' : 'Could not clear the test achievements.' };
      }
      case 'cloud-test': {
        const stamp = `outpost cloud test ${new Date().toISOString()}`;
        const wrote = await platform.cloud.write(TEST_FILE, stamp);
        const back = await platform.cloud.read(TEST_FILE);
        const flushed = await writer.flush();
        state.cloudTest = { wrote, readBack: back === stamp, saveFlushed: flushed, at: new Date().toISOString() };
        log(`cloud test: ${JSON.stringify(state.cloudTest)}`);
        const ok = wrote && back === stamp;
        return { ok, message: ok ? 'Wrote and read back a Steam Cloud file.' : 'Steam Cloud write or read failed.' };
      }
      case 'overlay': {
        const ok = platform.overlay.open('Achievements');
        return { ok, message: ok ? 'Asked Steam to open the overlay.' : 'Steam overlay is not available in this window.' };
      }
      case 'overlay-mode': {
        writeSettings({ ...settings, overlayMode: !settings.overlayMode });
        log(`overlay mode -> ${!settings.overlayMode}; restarting`);
        setTimeout(() => { app.relaunch(); app.exit(0); }, 300);
        return { ok: true, message: 'Restarting...' };
      }
      case 'copy-report': {
        const text = JSON.stringify(await report(), null, 2);
        clipboard.writeText(text);
        try { fs.writeFileSync(REPORT_FILE(), text); } catch { /* clipboard is enough */ }
        return { ok: true, message: `Report copied. Also saved to ${REPORT_FILE()}` };
      }
      default:
        return { ok: false, message: 'Unknown action.' };
    }
  });

  let flushed = false;
  app.on('before-quit', (e) => {
    if (flushed) return;
    e.preventDefault();
    flushed = true;
    const done = () => { clearInterval(timer); platform.shutdown(); app.quit(); };
    Promise.race([writer.flush(), new Promise((r) => setTimeout(r, 1500))]).then(done, done);
  });

  return {
    appId,
    spike: appId === P.SPIKE_APP_ID,
    overlayMode: settings.overlayMode && platform.status().backend === 'steam',
    /** Steam overlay for Electron (experimental in steamworks-ffi-node): needs an offscreen window. */
    attachOverlay(win) {
      try {
        const ok = require('steamworks-ffi-node').SteamworksSDK.getInstance().addElectronSteamOverlay(win, { title: 'Outpost Company' });
        log(`electron overlay attach: ${ok}`);
      } catch (e) { log(`electron overlay attach failed: ${e.message}`); }
    },
  };
}

module.exports = { startSteamHost };
