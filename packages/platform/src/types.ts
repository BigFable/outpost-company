/**
 * The platform interface (tech plan 2.1): everything the game needs from a
 * store or OS, behind one shape. The desktop shell implements it with Steam
 * (steamworks-ffi-node, main process only); when Steam is absent the "none"
 * implementation answers every call safely so the game runs normally.
 */

export type PlatformBackend = 'steam' | 'none';

export interface PlatformStatus {
  readonly backend: PlatformBackend;
  /** Steam API initialised for `appId`. */
  readonly initialized: boolean;
  /** The Steam client reports itself running. */
  readonly steamRunning: boolean;
  readonly appId: number | null;
  /** Steam says its overlay is injected into this process (Shift+Tab works). */
  readonly overlayAvailable: boolean;
  readonly cloudAvailable: boolean;
  readonly onSteamDeck: boolean;
  /** Plain-language reason when backend is "none" or something is degraded. */
  readonly reason: string | null;
}

export interface AchievementState {
  readonly apiName: string;
  readonly displayName: string;
  readonly unlocked: boolean;
}

export interface PlatformAchievements {
  /** Idempotent: unlocking an unlocked achievement is a no-op that resolves true. */
  unlock(apiName: string): Promise<boolean>;
  clear(apiName: string): Promise<boolean>;
  list(): Promise<readonly AchievementState[]>;
}

export interface PlatformCloud {
  write(name: string, data: string): Promise<boolean>;
  /** Resolves null when the file is missing or the cloud is unavailable. */
  read(name: string): Promise<string | null>;
}

export interface PlatformOverlay {
  /** Opens a Steam overlay dialog ("Achievements", "Friends", ...). False when unavailable. */
  open(dialog: string): boolean;
}

export interface Platform {
  status(): PlatformStatus;
  readonly achievements: PlatformAchievements;
  readonly cloud: PlatformCloud;
  readonly overlay: PlatformOverlay;
  /** Pump platform callbacks; the shell calls this about once a second. */
  tick(): void;
  shutdown(): void;
}
