# @outpost/desktop
Electron shell that opens the Vite build of the web app in a window (`pnpm run desktop`). The Steam bridge lives here: `steam-host.cjs` runs steamworks-ffi-node in the main process behind `@outpost/platform`, and `preload.cjs` is the narrow, context-isolated bridge. Context isolation and the sandbox stay on.

- `pnpm run desktop:smoke` (repo root): headless smoke with Steam absent, plus a fake-Steam run that checks the cloud start rule, cloud upload and achievement mirroring.
- `pnpm --filter @outpost/desktop dist:linux | dist:win | dist:mac` (after `pnpm run build`): packaged builds in `dist/release/`. CI: `.github/workflows/desktop-build.yml`, manual dispatch.
- `steamworks_sdk/redistributable_bin/` holds Valve's redistributables. It is git-ignored and must never be committed. Without it, the app runs and reports "no Steam".
- Owner test plan and go/no-go: `docs/steam/spike-test-plan.md`.
