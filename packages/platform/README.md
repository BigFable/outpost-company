# @outpost/platform
Platform services (achievements, cloud saves, overlay, Steam status) behind one interface (`src/types.ts`). It may import `core` only.

- `connectSteam(load, options)`: the Steam implementation over a structural slice of steamworks-ffi-node. Every failure falls back to `nonePlatform(reason)`, so the game never crashes because of Steam.
- `STEAM_ACHIEVEMENTS`: maps game achievement ids to Spacewar (app 480) test names and our planned release names.
- `chooseStartSave`, `CloudSaveWriter`, `AchievementMirror`: the local-vs-cloud start rule, throttled cloud upload and idempotent achievement mirroring.

The desktop shell bundles this package into `apps/desktop/dist/platform.cjs`. Tests: `src/platform.test.ts` (fake Steam).
