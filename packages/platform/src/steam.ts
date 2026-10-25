/**
 * Steam implementation of the platform interface, written against the small
 * slice of steamworks-ffi-node (0.11.x) we use. The shape is structural so
 * unit tests drive it with a fake, and so a different binding (steamworks.js,
 * a custom addon) can be dropped in later without touching the game.
 *
 * Runs in the Electron main process only. Any failure (library missing, Steam
 * not running, a call throwing) degrades to "none" or to a false/null answer:
 * the game never crashes because of Steam.
 */
import { nonePlatform } from './none';
import type { AchievementState, Platform, PlatformStatus } from './types';

/** The subset of steamworks-ffi-node's SteamworksSDK this adapter calls. */
export interface SteamworksLike {
  setSdkPath?(path: string): void;
  init(options: { appId: number }): boolean;
  isSteamRunning(): boolean;
  runCallbacks(): void;
  shutdown(): void;
  readonly achievements: {
    unlockAchievement(apiName: string): Promise<boolean>;
    clearAchievement(apiName: string): Promise<boolean>;
    isAchievementUnlocked(apiName: string): Promise<boolean>;
    getAllAchievements(): Promise<ReadonlyArray<{ apiName: string; displayName: string; unlocked: boolean }>>;
  };
  readonly cloud: {
    fileWrite(name: string, data: Uint8Array): boolean;
    fileRead(name: string): { success: boolean; data: Uint8Array | null };
    fileExists(name: string): boolean;
    isCloudEnabledForAccount(): boolean;
    isCloudEnabledForApp(): boolean;
  };
  readonly overlay: { activateGameOverlay(dialog: string): void };
  readonly utils: { isOverlayEnabled(): boolean; isSteamRunningOnSteamDeck(): boolean };
}

/** Text <-> bytes. The shell passes a Buffer-based codec; tests pass a trivial one. */
export interface TextCodec {
  encode(text: string): Uint8Array;
  decode(bytes: Uint8Array): string;
}

export interface SteamOptions {
  readonly appId: number;
  /** Folder that contains `redistributable_bin/` (the Steamworks SDK redistributables). */
  readonly sdkPath?: string | undefined;
  readonly codec: TextCodec;
  readonly log?: ((message: string) => void) | undefined;
}

const errText = (e: unknown): string => (e instanceof Error ? e.message : String(e));

/**
 * Loads the binding and initialises Steam. `load` may throw (package or native
 * library missing); that and every other failure returns the "none" platform
 * with a plain-language reason.
 */
export function connectSteam(load: () => SteamworksLike, options: SteamOptions): Platform {
  const log = options.log ?? (() => {});
  let sdk: SteamworksLike;
  try {
    sdk = load();
  } catch (e) {
    return nonePlatform(`Steam library could not be loaded: ${errText(e)}`);
  }
  try {
    if (options.sdkPath && sdk.setSdkPath) sdk.setSdkPath(options.sdkPath);
    if (!sdk.init({ appId: options.appId })) {
      return nonePlatform('Steam did not start for this game. Is the Steam client running and logged in?');
    }
  } catch (e) {
    return nonePlatform(`Steam could not start: ${errText(e)}`);
  }
  return steamPlatform(sdk, options, log);
}

function steamPlatform(sdk: SteamworksLike, options: SteamOptions, log: (m: string) => void): Platform {
  let alive = true;
  const safe = <T>(what: string, fallback: T, fn: () => T): T => {
    if (!alive) return fallback;
    try { return fn(); } catch (e) { log(`steam ${what} failed: ${errText(e)}`); return fallback; }
  };
  const safeAsync = async <T>(what: string, fallback: T, fn: () => Promise<T>): Promise<T> => {
    if (!alive) return fallback;
    try { return await fn(); } catch (e) { log(`steam ${what} failed: ${errText(e)}`); return fallback; }
  };
  const cloudOn = (): boolean => safe('cloud check', false,
    () => sdk.cloud.isCloudEnabledForAccount() && sdk.cloud.isCloudEnabledForApp());

  return {
    status(): PlatformStatus {
      const steamRunning = safe('isSteamRunning', false, () => sdk.isSteamRunning());
      const overlayAvailable = safe('isOverlayEnabled', false, () => sdk.utils.isOverlayEnabled());
      const cloudAvailable = cloudOn();
      return {
        backend: 'steam', initialized: alive, steamRunning, appId: options.appId,
        overlayAvailable, cloudAvailable,
        onSteamDeck: safe('isSteamRunningOnSteamDeck', false, () => sdk.utils.isSteamRunningOnSteamDeck()),
        reason: !alive ? 'Steam was shut down.'
          : !steamRunning ? 'The Steam client stopped responding.'
          : !cloudAvailable ? 'Steam Cloud is off for this account or this app.'
          : null,
      };
    },
    achievements: {
      unlock: (apiName) => safeAsync('unlock', false, async () => {
        if (await sdk.achievements.isAchievementUnlocked(apiName)) return true;
        return sdk.achievements.unlockAchievement(apiName);
      }),
      clear: (apiName) => safeAsync('clear', false, () => sdk.achievements.clearAchievement(apiName)),
      list: () => safeAsync<readonly AchievementState[]>('list', [], async () =>
        (await sdk.achievements.getAllAchievements()).map((a) => ({ apiName: a.apiName, displayName: a.displayName, unlocked: a.unlocked }))),
    },
    cloud: {
      write: (name, data) => Promise.resolve(safe('cloud write', false,
        () => cloudOn() && sdk.cloud.fileWrite(name, options.codec.encode(data)))),
      read: (name) => Promise.resolve(safe<string | null>('cloud read', null, () => {
        if (!cloudOn() || !sdk.cloud.fileExists(name)) return null;
        const r = sdk.cloud.fileRead(name);
        return r.success && r.data ? options.codec.decode(r.data) : null;
      })),
    },
    overlay: {
      open: (dialog) => safe('overlay', false, () => {
        if (!sdk.utils.isOverlayEnabled()) return false;
        sdk.overlay.activateGameOverlay(dialog);
        return true;
      }),
    },
    tick: () => safe('runCallbacks', undefined, () => sdk.runCallbacks()),
    shutdown: () => {
      if (!alive) return;
      safe('shutdown', undefined, () => sdk.shutdown());
      alive = false;
    },
  };
}
