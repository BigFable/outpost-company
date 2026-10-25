/**
 * Which in-game achievements mirror to Steam, and under which Steam API name.
 *
 * - `spike`: a real achievement of Valve's public test app 480 (Spacewar), so
 *   the go/no-go test can see an unlock in the Steam client without our own
 *   app ID. The pairing is arbitrary; only the plumbing is under test.
 * - `release`: the API name we plan to create in our own Steamworks app once
 *   it exists (owner decision: Steam Direct fee). Names are UPPER_SNAKE and
 *   stable forever once published, so choose them carefully before then.
 *
 * Only these few are mapped during the spike. The full list (about 15 for the
 * vertical slice, tech plan section 4) is added when the real app exists.
 */

export interface SteamAchievementMapping {
  /** Achievement id in packages/core ACHIEVEMENTS. */
  readonly gameId: string;
  readonly spike: string;
  readonly release: string;
}

export const SPIKE_APP_ID = 480;

export const STEAM_ACHIEVEMENTS: readonly SteamAchievementMapping[] = Object.freeze([
  { gameId: 'first_tree', spike: 'ACH_WIN_ONE_GAME', release: 'ACH_FIRST_TREE' },
  { gameId: 'first_sale', spike: 'ACH_TRAVEL_FAR_ACCUM', release: 'ACH_FIRST_SALE' },
  { gameId: 'first_crew', spike: 'ACH_TRAVEL_FAR_SINGLE', release: 'ACH_FIRST_CREW' },
  { gameId: 'full_chain', spike: 'ACH_HEAVY_FIRE', release: 'ACH_STUMP_TO_MILL' },
  { gameId: 'd1m', spike: 'ACH_WIN_100_GAMES', release: 'ACH_MILLION_BOARD_FEET' },
].map((m) => Object.freeze(m)));

/** The Steam API name for a game achievement, or null when it is not mirrored. */
export function steamAchievementName(gameId: string, appId: number): string | null {
  const m = STEAM_ACHIEVEMENTS.find((x) => x.gameId === gameId);
  if (!m) return null;
  return appId === SPIKE_APP_ID ? m.spike : m.release;
}

/** Every Steam API name mirrored for this app id (used by the test panel's "clear"). */
export function steamAchievementNames(appId: number): string[] {
  return STEAM_ACHIEVEMENTS.map((m) => (appId === SPIKE_APP_ID ? m.spike : m.release));
}
