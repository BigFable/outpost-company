# Outpost Company

**Every skill is a run. Every run is different.**

An idle roguelite skilling game: skills keep working while you're away, each skill's prestige is a roguelite run with drafted perks that change the rules, and short mini-games reward active play. Setting: 1890, a chartered company lands on a fog-covered new continent.

## Status
- Playable prototype of the first skill (Logging, codename Timberline) with four mini-games, achievements, run-earned improvements and the roguelite layer (perk drafts, close camp, Legacy meta tree). Live preview: https://claude.ai/artifact/F6ezeci8UHxBq25ZRryWxS
- Design doc: https://claude.ai/artifact/Wst4N1K2FFtmfFqVgNrKLL

## How to run
You need [Node.js 22](https://nodejs.org) (LTS) and Python 3. Open a terminal in this folder.

**One-time setup** (installs everything, about a minute):
```
corepack enable
pnpm install
```

**Play the game in your browser:**
```
npm run dev
```
A browser tab opens on the Timberline prototype at http://localhost:5173/legacy/. It plays exactly like `prototype/timberline.html`. Press Ctrl+C in the terminal to stop.

**Play it as a desktop app (Electron):**
```
npm run desktop
```
A window titled "Outpost Company" opens with the same game. The first run downloads Electron (about 100 MB). No Steam features yet.

**Check that nothing is broken** (what CI runs on every push):
```
npm run check
```
Each step prints PASS/FAIL. You should see `ALL PASS` and `BALANCE CHECK PASSED` at the end.

### All commands
| Command | What it does |
| --- | --- |
| `npm run dev` | Browser dev server with the prototype |
| `npm run desktop` | Builds, then opens the desktop window |
| `npm test` | Smoke tests: the prototype boots and its mini-games and perks work (jsdom) |
| `npm run test:unit` | Unit tests for the new TypeScript packages (vitest) |
| `npm run test:web` | The dev server and the build serve the prototype unchanged, no console errors |
| `npm run typecheck` | TypeScript strict check |
| `npm run lint` | ESLint, including the architecture rule that `packages/core` never imports UI or platform code |
| `npm run sim` | The bot plays 3 consecutive runs per profile and prints pacing |
| `npm run balance:check` | Re-runs the bot and compares it with the golden baseline (`tests/balance/baseline.json`), PASS/FAIL per metric |
| `npm run balance:record` | Re-records the baseline. Only after the owner accepts a balance change |
| `npm run desktop:smoke` | Launches the desktop app hidden and checks it loads |
| `npm run check` | Everything above that CI runs |

This is a pnpm workspace: install with `pnpm install` (plain `npm install` stops with a message saying so). Every other command works with either `npm run` or `pnpm run`.

## Working on it
Open a Claude Code session on this repo and talk to the **master dev** (`CLAUDE.md`). It delegates to the specialist agents in `.claude/agents/`.

## Layout
| Path | What |
| --- | --- |
| `prototype/` | The single-file browser prototype (served unchanged as the `legacy` entry) |
| `apps/web/` | Vite app for the browser |
| `apps/desktop/` | Electron shell (Steam integration comes in week 2) |
| `packages/core`, `skills`, `ui`, `platform` | New TypeScript packages, empty until the logic moves out of the prototype (tech plan M2+) |
| `sim/` | Headless balance simulation |
| `tests/` | Smoke tests, `tests/web` (legacy entry), `tests/balance` (golden baseline and check) |
| `docs/research/` | Market, setting and skills, tech plan, simulation results |
| `reports/` | Weekly producer briefs and market watch |
| `ROADMAP.md`, `DECISIONS.md` | Plan and owner decisions |
