import type { Platform, PlatformStatus } from './types';

/** The fallback platform: no Steam. Every call is safe and does nothing. */
export function nonePlatform(reason: string): Platform {
  const status: PlatformStatus = {
    backend: 'none', initialized: false, steamRunning: false, appId: null,
    overlayAvailable: false, cloudAvailable: false, onSteamDeck: false, reason,
  };
  return {
    status: () => status,
    achievements: {
      unlock: () => Promise.resolve(false),
      clear: () => Promise.resolve(false),
      list: () => Promise.resolve([]),
    },
    cloud: {
      write: () => Promise.resolve(false),
      read: () => Promise.resolve(null),
    },
    overlay: { open: () => false },
    tick: () => {},
    shutdown: () => {},
  };
}
