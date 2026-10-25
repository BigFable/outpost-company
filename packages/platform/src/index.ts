// @outpost/platform — store/OS services behind one interface (tech plan 2.1).
// Steam lives in the Electron main process; the game reaches it through the
// desktop preload bridge. See README.md.
export type * from './types';
export { nonePlatform } from './none';
export { connectSteam, type SteamworksLike, type SteamOptions, type TextCodec } from './steam';
export { SPIKE_APP_ID, STEAM_ACHIEVEMENTS, steamAchievementName, steamAchievementNames, type SteamAchievementMapping } from './achievement-map';
export { SAVE_KEY, CLOUD_FILE, readSave, chooseStartSave, CloudSaveWriter, AchievementMirror, type SaveSummary, type StartChoice } from './save-sync';
