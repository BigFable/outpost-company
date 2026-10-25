import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS } from '../../core/src/index';
import {
  AchievementMirror, CLOUD_FILE, CloudSaveWriter, STEAM_ACHIEVEMENTS, chooseStartSave, connectSteam,
  nonePlatform, readSave, steamAchievementName, type SteamworksLike, type TextCodec,
} from './index';

const codec: TextCodec = {
  encode: (s) => Uint8Array.from([...s].map((c) => c.charCodeAt(0))),
  decode: (b) => String.fromCharCode(...b),
};

/** A fake Steam client: Spacewar's five achievements and an in-memory cloud. */
function fakeSteam(opts: { init?: boolean; throwOnInit?: boolean; cloud?: boolean; overlay?: boolean } = {}) {
  const ach = new Map(['ACH_WIN_ONE_GAME', 'ACH_WIN_100_GAMES', 'ACH_HEAVY_FIRE', 'ACH_TRAVEL_FAR_ACCUM', 'ACH_TRAVEL_FAR_SINGLE'].map((n) => [n, false]));
  const files = new Map<string, Uint8Array>();
  const calls: string[] = [];
  const sdk: SteamworksLike = {
    setSdkPath: (p) => { calls.push(`sdk:${p}`); },
    init: ({ appId }) => { calls.push(`init:${appId}`); if (opts.throwOnInit) throw new Error('libsteam_api missing'); return opts.init ?? true; },
    isSteamRunning: () => true,
    runCallbacks: () => { calls.push('tick'); },
    shutdown: () => { calls.push('shutdown'); },
    achievements: {
      unlockAchievement: async (n) => { calls.push(`unlock:${n}`); if (!ach.has(n)) return false; ach.set(n, true); return true; },
      clearAchievement: async (n) => { if (!ach.has(n)) return false; ach.set(n, false); return true; },
      isAchievementUnlocked: async (n) => ach.get(n) === true,
      getAllAchievements: async () => [...ach].map(([apiName, unlocked]) => ({ apiName, displayName: apiName, unlocked })),
    },
    cloud: {
      fileWrite: (n, d) => { files.set(n, d); return true; },
      fileRead: (n) => ({ success: files.has(n), data: files.get(n) ?? null }),
      fileExists: (n) => files.has(n),
      isCloudEnabledForAccount: () => opts.cloud ?? true,
      isCloudEnabledForApp: () => true,
    },
    overlay: { activateGameOverlay: (d) => { calls.push(`overlay:${d}`); } },
    utils: { isOverlayEnabled: () => opts.overlay ?? false, isSteamRunningOnSteamDeck: () => false },
  };
  return { sdk, ach, files, calls };
}

const save = (last: number, ach: string[] = []) => JSON.stringify({ v: 2, last, ach, cash: 1 });

describe('connectSteam', () => {
  it('falls back to "none" when the library cannot load', async () => {
    const p = connectSteam(() => { throw new Error('Cannot find module'); }, { appId: 480, codec });
    expect(p.status().backend).toBe('none');
    expect(p.status().reason).toMatch(/could not be loaded/);
    expect(await p.achievements.unlock('ACH_WIN_ONE_GAME')).toBe(false);
    expect(await p.cloud.read(CLOUD_FILE)).toBeNull();
    expect(p.overlay.open('Achievements')).toBe(false);
    p.tick(); p.shutdown();
  });

  it('falls back when Steam is not running (init false) or init throws', () => {
    expect(connectSteam(() => fakeSteam({ init: false }).sdk, { appId: 480, codec }).status().reason).toMatch(/Steam client running/);
    expect(connectSteam(() => fakeSteam({ throwOnInit: true }).sdk, { appId: 480, codec }).status().reason).toMatch(/libsteam_api missing/);
  });

  it('initialises with the app id and SDK path, and reports status', () => {
    const f = fakeSteam({ overlay: true });
    const p = connectSteam(() => f.sdk, { appId: 480, sdkPath: '/sdk', codec });
    expect(f.calls.slice(0, 2)).toEqual(['sdk:/sdk', 'init:480']);
    expect(p.status()).toMatchObject({ backend: 'steam', initialized: true, steamRunning: true, appId: 480, overlayAvailable: true, cloudAvailable: true, reason: null });
  });

  it('unlocks, lists and clears achievements; unlock is idempotent', async () => {
    const f = fakeSteam();
    const p = connectSteam(() => f.sdk, { appId: 480, codec });
    expect(await p.achievements.unlock('ACH_WIN_ONE_GAME')).toBe(true);
    expect(await p.achievements.unlock('ACH_WIN_ONE_GAME')).toBe(true);
    expect(f.calls.filter((c) => c === 'unlock:ACH_WIN_ONE_GAME')).toHaveLength(1);
    expect((await p.achievements.list()).find((a) => a.apiName === 'ACH_WIN_ONE_GAME')?.unlocked).toBe(true);
    expect(await p.achievements.clear('ACH_WIN_ONE_GAME')).toBe(true);
    expect(f.ach.get('ACH_WIN_ONE_GAME')).toBe(false);
    expect(await p.achievements.unlock('NOT_A_REAL_ONE')).toBe(false);
  });

  it('round-trips a cloud save, and refuses when cloud is off', async () => {
    const f = fakeSteam();
    const p = connectSteam(() => f.sdk, { appId: 480, codec });
    expect(await p.cloud.read(CLOUD_FILE)).toBeNull();
    expect(await p.cloud.write(CLOUD_FILE, save(5))).toBe(true);
    expect(await p.cloud.read(CLOUD_FILE)).toBe(save(5));
    const off = connectSteam(() => fakeSteam({ cloud: false }).sdk, { appId: 480, codec });
    expect(await off.cloud.write(CLOUD_FILE, save(5))).toBe(false);
    expect(off.status().reason).toMatch(/Cloud is off/);
  });

  it('never throws when a Steam call throws, and goes quiet after shutdown', async () => {
    const f = fakeSteam({ overlay: true });
    const logs: string[] = [];
    f.sdk.achievements.unlockAchievement = () => Promise.reject(new Error('boom'));
    f.sdk.runCallbacks = () => { throw new Error('boom'); };
    const p = connectSteam(() => f.sdk, { appId: 480, codec, log: (m) => logs.push(m) });
    expect(await p.achievements.unlock('ACH_HEAVY_FIRE')).toBe(false);
    expect(() => p.tick()).not.toThrow();
    expect(logs.length).toBe(2);
    expect(p.overlay.open('Achievements')).toBe(true);
    p.shutdown(); p.shutdown();
    expect(f.calls.filter((c) => c === 'shutdown')).toHaveLength(1);
    expect(p.overlay.open('Achievements')).toBe(false);
    expect(p.status().initialized).toBe(false);
  });

  it('nonePlatform is inert', () => {
    expect(nonePlatform('web').status()).toMatchObject({ backend: 'none', reason: 'web', appId: null });
  });
});

describe('achievement map', () => {
  it('maps 3-5 real game achievements to distinct Spacewar and release names', () => {
    const ids = new Set(ACHIEVEMENTS.map((a) => a.id));
    expect(STEAM_ACHIEVEMENTS.length).toBeGreaterThanOrEqual(3);
    expect(STEAM_ACHIEVEMENTS.length).toBeLessThanOrEqual(5);
    for (const m of STEAM_ACHIEVEMENTS) {
      expect(ids.has(m.gameId)).toBe(true);
      expect(m.release).toMatch(/^ACH_[A-Z0-9_]+$/);
    }
    expect(new Set(STEAM_ACHIEVEMENTS.map((m) => m.spike)).size).toBe(STEAM_ACHIEVEMENTS.length);
    expect(new Set(STEAM_ACHIEVEMENTS.map((m) => m.release)).size).toBe(STEAM_ACHIEVEMENTS.length);
    expect(steamAchievementName('first_tree', 480)).toBe('ACH_WIN_ONE_GAME');
    expect(steamAchievementName('first_tree', 123456)).toBe('ACH_FIRST_TREE');
    expect(steamAchievementName('t100', 480)).toBeNull();
  });
});

describe('save sync', () => {
  it('reads only version-2 saves', () => {
    expect(readSave(save(7, ['first_tree']))).toEqual({ last: 7, ach: ['first_tree'] });
    expect(readSave('{"v":1}')).toBeNull();
    expect(readSave('not json')).toBeNull();
    expect(readSave(null)).toBeNull();
    expect(readSave('{"v":2}')).toEqual({ last: 0, ach: [] });
  });

  it('start rule: valid beats invalid, newer wins, ties keep local', () => {
    expect(chooseStartSave(null, null).use).toBe('none');
    expect(chooseStartSave(save(1), null).use).toBe('local');
    expect(chooseStartSave(save(1), 'garbage').use).toBe('local');
    expect(chooseStartSave(null, save(1))).toMatchObject({ use: 'cloud', blob: save(1) });
    expect(chooseStartSave('garbage', save(1)).use).toBe('cloud');
    expect(chooseStartSave(save(1), save(2)).use).toBe('cloud');
    expect(chooseStartSave(save(2), save(1)).use).toBe('local');
    expect(chooseStartSave(save(2), save(2)).use).toBe('local');
  });

  it('cloud writer throttles, flushes the newest pending save, and retries a failed write', async () => {
    let t = 0;
    const written: string[] = [];
    let ok = true;
    const w = new CloudSaveWriter(async (b) => { if (ok) written.push(b); return ok; }, () => t, 60_000);
    expect(await w.offer(save(1))).toBe(true);
    t = 5_000; expect(await w.offer(save(2))).toBe(false);
    t = 10_000; expect(await w.offer(save(3))).toBe(false);
    expect(await w.offer('junk')).toBe(false);
    expect(await w.flush()).toBe(true);
    expect(written).toEqual([save(1), save(3)]);
    expect(await w.flush()).toBe(false);
    ok = false; t = 100_000;
    expect(await w.offer(save(4))).toBe(false);
    ok = true; expect(await w.flush()).toBe(true);
    expect(written.at(-1)).toBe(save(4));
  });

  it('achievement mirror unlocks mapped ids once and skips unmapped ones', async () => {
    const f = fakeSteam();
    const p = connectSteam(() => f.sdk, { appId: 480, codec });
    const m = new AchievementMirror((n) => p.achievements.unlock(n), 480);
    expect(await m.sync(save(1, ['first_tree', 't100']))).toEqual(['ACH_WIN_ONE_GAME']);
    expect(await m.sync(save(2, ['first_tree', 'first_sale']))).toEqual(['ACH_TRAVEL_FAR_ACCUM']);
    expect(await m.sync(save(3, ['first_tree', 'first_sale']))).toEqual([]);
    expect(f.calls.filter((c) => c.startsWith('unlock:'))).toEqual(['unlock:ACH_WIN_ONE_GAME', 'unlock:ACH_TRAVEL_FAR_ACCUM']);
    expect(await m.sync('junk')).toEqual([]);
  });

  it('achievement mirror retries an unlock that Steam did not confirm', async () => {
    let accept = false;
    const m = new AchievementMirror(async () => accept, 480);
    expect(await m.mirror(['first_crew'])).toEqual([]);
    accept = true;
    expect(await m.mirror(['first_crew'])).toEqual(['ACH_TRAVEL_FAR_SINGLE']);
  });
});
