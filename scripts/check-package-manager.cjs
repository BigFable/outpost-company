// Runs before install. This repo is a pnpm workspace; `npm install` would
// half-install it, so stop early with a clear message instead.
const ua = process.env.npm_config_user_agent || '';
if (!ua.startsWith('pnpm/')) {
  console.error('\nThis project installs with pnpm, not npm.\n  Run:  corepack enable   (once)\n  then: pnpm install\nAfter that, `npm test`, `npm run sim` and the other npm run commands work as before.\n');
  process.exit(1);
}
