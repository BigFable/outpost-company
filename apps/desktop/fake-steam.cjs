// In-memory stand-in for steamworks-ffi-node, used only by the headless smoke
// test (OUTPOST_FAKE_STEAM=1) to exercise the whole bridge without a Steam
// client: start rule, cloud upload and achievement mirroring. Not shipped.
'use strict';

function createFakeSteam(seedCloud) {
  const ach = new Map(['ACH_WIN_ONE_GAME', 'ACH_WIN_100_GAMES', 'ACH_HEAVY_FIRE', 'ACH_TRAVEL_FAR_ACCUM', 'ACH_TRAVEL_FAR_SINGLE'].map((n) => [n, false]));
  const files = new Map(Object.entries(seedCloud || {}).map(([k, v]) => [k, Buffer.from(v, 'utf8')]));
  return {
    init: () => true,
    isSteamRunning: () => true,
    runCallbacks: () => {},
    shutdown: () => {},
    achievements: {
      unlockAchievement: async (n) => { if (!ach.has(n)) return false; ach.set(n, true); return true; },
      clearAchievement: async (n) => { if (!ach.has(n)) return false; ach.set(n, false); return true; },
      isAchievementUnlocked: async (n) => ach.get(n) === true,
      getAllAchievements: async () => [...ach].map(([apiName, unlocked]) => ({ apiName, displayName: apiName, unlocked })),
    },
    cloud: {
      fileWrite: (n, d) => { files.set(n, Buffer.from(d)); return true; },
      fileRead: (n) => ({ success: files.has(n), data: files.get(n) ?? null }),
      fileExists: (n) => files.has(n),
      isCloudEnabledForAccount: () => true,
      isCloudEnabledForApp: () => true,
    },
    overlay: { activateGameOverlay: () => {} },
    utils: { isOverlayEnabled: () => false, isSteamRunningOnSteamDeck: () => false },
  };
}

module.exports = { createFakeSteam };
