// Gets apps/desktop ready for electron-builder: bundles packages/platform and
// copies the web build (apps/web/dist) into apps/desktop/dist/web so it ships
// inside the app. Run "pnpm run build" at the repo root first.
import { cpSync, existsSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const DESKTOP = fileURLToPath(new URL('..', import.meta.url));
const WEB_DIST = fileURLToPath(new URL('../../web/dist', import.meta.url));

await import('./bundle-platform.mjs');
if (!existsSync(`${WEB_DIST}/legacy/index.html`)) {
  console.error('Missing apps/web/dist/legacy/index.html. Run "pnpm run build" at the repo root first.');
  process.exit(1);
}
rmSync(`${DESKTOP}dist/web`, { recursive: true, force: true });
cpSync(WEB_DIST, `${DESKTOP}dist/web`, { recursive: true });
const sdk = existsSync(`${DESKTOP}steamworks_sdk/redistributable_bin`);
console.log(`copied apps/web/dist -> apps/desktop/dist/web; Steamworks redistributables ${sdk ? 'found (Steam enabled)' : 'NOT found (build runs without Steam)'}`);
