// ESLint flat config. The important part is the architecture boundaries
// from tech plan 2.1: packages/core is pure rules and must never import UI,
// platform, DOM or wall-clock code. Each rule below is there to keep it that way.
import js from '@eslint/js';
import boundaries from 'eslint-plugin-boundaries';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const ELEMENTS = [
  { type: 'core', pattern: 'packages/core' },
  { type: 'skills', pattern: 'packages/skills' },
  { type: 'ui', pattern: 'packages/ui' },
  { type: 'platform', pattern: 'packages/platform' },
  { type: 'app', pattern: 'apps/*', capture: ['app'] },
];

// Who may import whom. Anything not listed is an error.
const ALLOWED = {
  core: ['core'],
  skills: ['core', 'skills'],
  platform: ['core', 'platform'],
  ui: ['core', 'skills', 'ui'],
  app: ['core', 'skills', 'ui', 'platform', 'app'],
};

// Belt and braces: the same rules by package name, which needs no resolver.
const banPackages = (names) => ({
  patterns: [{ group: names.flatMap((n) => [`@outpost/${n}`, `@outpost/${n}/*`]), message: 'Architecture boundary: see eslint.config.mjs and docs/research/tech_plan.md section 2.' }],
});

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**', '**/dist/**', 'sim/game*.html',
      // Legacy single-file prototype and its jsdom harness stay untouched until stage M2+.
      'prototype/**', 'sim/**', 'tests/smoke_rogue*.js', '.claude/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,cjs,mjs}'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ['**/*.cjs', 'tests/*.js'],
    languageOptions: { sourceType: 'commonjs' },
  },
  {
    files: ['apps/desktop/**/*.cjs'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
  ...tseslint.configs.strict.map((c) => ({ ...c, files: ['**/*.ts'] })),
  {
    files: ['packages/**/*.ts', 'apps/**/*.ts'],
    plugins: { boundaries },
    settings: {
      'boundaries/elements': ELEMENTS,
      'boundaries/include': ['packages/**/*', 'apps/**/*'],
      'import/resolver': { node: { extensions: ['.ts', '.js', '.cjs'] } },
    },
    rules: {
      'boundaries/dependencies': [2, {
        default: 'disallow',
        policies: Object.entries(ALLOWED).map(([from, to]) => ({
          from: { element: { type: from } },
          allow: { to: { element: { types: { anyOf: to } } } },
        })).concat([
          // npm packages and Node built-ins are not architecture elements.
          { allow: { to: { module: { origin: 'external' } } } },
          { allow: { to: { module: { origin: 'core' } } } },
        ]),
      }],
    },
  },
  {
    files: ['packages/core/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', banPackages(['ui', 'platform', 'skills'])],
      // Core stays deterministic and headless (tech plan 2.1 principle 1).
      'no-restricted-globals': ['error',
        { name: 'window', message: 'core has no DOM.' },
        { name: 'document', message: 'core has no DOM.' },
        { name: 'localStorage', message: 'Saves go through @outpost/platform.' },
        { name: 'performance', message: 'Use the sim clock, not wall time.' }],
      'no-restricted-properties': ['error',
        { object: 'Math', property: 'random', message: 'Use the seeded RNG streams.' },
        { object: 'Date', property: 'now', message: 'Use the sim clock, not wall time.' }],
    },
  },
  {
    files: ['packages/skills/**/*.ts', 'packages/platform/**/*.ts'],
    rules: { 'no-restricted-imports': ['error', banPackages(['ui'])] },
  },
  {
    files: ['packages/ui/**/*.ts'],
    rules: { 'no-restricted-imports': ['error', banPackages(['platform'])] },
  },
);
