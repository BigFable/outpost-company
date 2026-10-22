// Bundles packages/core into an IIFE that defines `window.Core` and writes it
// into the marked region of prototype/timberline.html, so the prototype stays
// one self-contained HTML file while core stays the one source of truth.
//
//   pnpm run core:inline   rebuild and rewrite the region
//   pnpm run core:check    fail if the region is out of date (CI)
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PROTO = `${ROOT}prototype/timberline.html`;
const ENTRY = `${ROOT}packages/core/src/index.ts`;
const BEGIN = '<script id="outpost-core">';
const END = '</script><!-- /outpost-core -->';
const check = process.argv.includes('--check');

const out = await build({
  configFile: false,
  logLevel: 'silent',
  build: {
    write: false,
    minify: false,
    emptyOutDir: false,
    lib: { entry: ENTRY, name: 'Core', formats: ['iife'], fileName: () => 'core.js' },
  },
});
const chunk = [out].flat()[0].output.find((o) => o.type === 'chunk');
const code = chunk.code.trim();
if (code.includes('</script')) throw new Error('core bundle contains </script; cannot inline');

const region = `${BEGIN}
// GENERATED from packages/core by \`pnpm run core:inline\`. Do not edit here: edit packages/core and re-run.
${code}
${END}`;

const html = readFileSync(PROTO, 'utf8');
const a = html.indexOf(BEGIN), b = html.indexOf(END);
if (a < 0 || b < a) throw new Error(`prototype is missing the ${BEGIN} ... ${END} region`);
const next = html.slice(0, a) + region + html.slice(b + END.length);

if (check) {
  if (next !== html) {
    console.error('FAIL prototype/timberline.html core region is stale. Run: pnpm run core:inline');
    process.exit(1);
  }
  console.log('PASS prototype core region matches packages/core');
} else {
  writeFileSync(PROTO, next);
  console.log(`${next === html ? 'unchanged' : 'updated'} prototype/timberline.html core region (${code.length} chars)`);
}
