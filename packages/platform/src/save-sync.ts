/**
 * Save-blob helpers shared by the desktop shell: which save to start from
 * (local vs Steam Cloud), throttled cloud writes, and mirroring the game's
 * earned achievements to the platform.
 *
 * The blob is the prototype's localStorage save (key `timberline-v2`): JSON
 * with `v: 2`, `last` (wall-clock ms when it was saved) and `ach` (ids of
 * earned achievements). Nothing here changes the save's shape.
 */
import { steamAchievementName } from './achievement-map';

export const SAVE_KEY = 'timberline-v2';
export const CLOUD_FILE = 'timberline-v2.json';

export interface SaveSummary {
  /** Wall-clock ms of the save; 0 when the save has none. */
  readonly last: number;
  readonly ach: readonly string[];
}

/** Null for anything that is not a version-2 save the prototype would load. */
export function readSave(blob: string | null | undefined): SaveSummary | null {
  if (typeof blob !== 'string' || blob.length === 0) return null;
  let d: unknown;
  try { d = JSON.parse(blob); } catch { return null; }
  if (!d || typeof d !== 'object') return null;
  const o = d as { v?: unknown; last?: unknown; ach?: unknown };
  if (o.v !== 2) return null;
  const last = typeof o.last === 'number' && Number.isFinite(o.last) ? o.last : 0;
  const ach = Array.isArray(o.ach) ? o.ach.filter((x): x is string => typeof x === 'string') : [];
  return { last, ach };
}

export type StartChoice =
  | { readonly use: 'local'; readonly reason: string }
  | { readonly use: 'cloud'; readonly blob: string; readonly reason: string }
  | { readonly use: 'none'; readonly reason: string };

/**
 * The start rule, in plain words:
 * 1. If only one of the two is a valid save, use that one.
 * 2. If both are valid, use the one saved more recently (its `last` time).
 * 3. On a tie, or if neither has a time, keep the save already on this device.
 * The losing save is never deleted: the shell keeps a backup of a replaced local save.
 */
export function chooseStartSave(local: string | null, cloud: string | null): StartChoice {
  const l = readSave(local);
  const c = readSave(cloud);
  if (!l && !c) return { use: 'none', reason: 'No save on this device or in Steam Cloud.' };
  if (!c) return { use: 'local', reason: cloud == null ? 'No Steam Cloud save; using this device.' : 'Steam Cloud save is unreadable; using this device.' };
  if (!l) return { use: 'cloud', blob: cloud as string, reason: 'No save on this device; using Steam Cloud.' };
  if (c.last > l.last) return { use: 'cloud', blob: cloud as string, reason: 'Steam Cloud save is newer than this device.' };
  return { use: 'local', reason: c.last === l.last ? 'Both saves are the same age; keeping this device.' : 'This device is newer than Steam Cloud.' };
}

/**
 * Writes the newest save to the cloud at most once per `minGapMs`; `flush()`
 * writes any pending save at once (on quit). Steam asks games not to write
 * cloud files every few seconds, and the prototype saves every 5 s.
 */
export class CloudSaveWriter {
  private pending: string | null = null;
  private lastWrite = Number.NEGATIVE_INFINITY;
  private lastWritten: string | null = null;

  constructor(
    private readonly write: (blob: string) => Promise<boolean>,
    private readonly now: () => number,
    private readonly minGapMs = 60_000,
  ) {}

  /** Call on every local save. Resolves true when this call wrote to the cloud. */
  async offer(blob: string): Promise<boolean> {
    if (!readSave(blob)) return false;
    this.pending = blob;
    if (this.now() - this.lastWrite < this.minGapMs) return false;
    return this.flush();
  }

  async flush(): Promise<boolean> {
    const blob = this.pending;
    if (blob == null || blob === this.lastWritten) return false;
    this.pending = null;
    this.lastWrite = this.now();
    const ok = await this.write(blob);
    if (ok) this.lastWritten = blob; else this.pending ??= blob;
    return ok;
  }
}

/**
 * Mirrors earned achievements from save blobs to the platform. Idempotent:
 * each mapped id is sent until the platform confirms it, then never again.
 * Unlocks only; it never clears a platform achievement.
 */
export class AchievementMirror {
  private readonly confirmed = new Set<string>();
  private readonly inFlight = new Set<string>();

  constructor(
    private readonly unlock: (apiName: string) => Promise<boolean>,
    private readonly appId: number,
  ) {}

  /** Resolves the Steam API names newly confirmed by this call. */
  async sync(blob: string): Promise<string[]> {
    const save = readSave(blob);
    if (!save) return [];
    return this.mirror(save.ach);
  }

  async mirror(gameIds: readonly string[]): Promise<string[]> {
    const jobs: Promise<string | null>[] = [];
    for (const id of gameIds) {
      const api = steamAchievementName(id, this.appId);
      if (!api || this.confirmed.has(api) || this.inFlight.has(api)) continue;
      this.inFlight.add(api);
      jobs.push(this.unlock(api).then(
        (ok) => { this.inFlight.delete(api); if (ok) { this.confirmed.add(api); return api; } return null; },
        () => { this.inFlight.delete(api); return null; }));
    }
    return (await Promise.all(jobs)).filter((x): x is string => x !== null);
  }

  /** Forget confirmations (after the test panel clears Steam achievements). */
  reset(): void { this.confirmed.clear(); }
}
