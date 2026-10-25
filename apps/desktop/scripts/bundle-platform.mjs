// Bundles packages/platform (TypeScript) into dist/platform.cjs so the
// Electron main process can require it without a TS loader. The Steam binding
// stays external: it is a real dependency, unpacked from the ASAR at package time.
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const DESKTOP = fileURLToPath(new URL('..', import.meta.url));
const ENTRY = fileURLToPath(new URL('../../../packages/platform/src/index.ts', import.meta.url));

const out = await build({
  configFile: false,
  logLevel: 'silent',
  build: {
    write: false,
    minify: false,
    emptyOutDir: false,
    target: 'node22',
    lib: { entry: ENTRY, formats: ['cjs'], fileName: () => 'platform.cjs' },
    rollupOptions: { external: [/^node:/, 'electron', 'steamworks-ffi-node'] },
  },
});
const chunk = [out].flat()[0].output.find((o) => o.type === 'chunk');
mkdirSync(`${DESKTOP}dist`, { recursive: true });
writeFileSync(`${DESKTOP}dist/platform.cjs`, `// GENERATED from packages/platform by scripts/bundle-platform.mjs. Do not edit.\n${chunk.code}`);
console.log('bundled packages/platform -> apps/desktop/dist/platform.cjs');
