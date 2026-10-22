# Outpost Company

**Every skill is a run. Every run is different.**

An idle roguelite skilling game: skills keep working while you're away, each skill's prestige is a roguelite run with drafted perks that change the rules, and short mini-games reward active play. Setting: 1890, a chartered company lands on a fog-covered new continent.

## Status
- Playable prototype of the first skill (Logging, codename Timberline) with four mini-games, achievements, run-earned improvements and the roguelite layer (perk drafts, close camp, Legacy meta tree). Live preview: https://claude.ai/artifact/F6ezeci8UHxBq25ZRryWxS
- Design doc: https://claude.ai/artifact/Wst4N1K2FFtmfFqVgNrKLL

## Working on it
Open a Claude Code session on this repo and talk to the **master dev** (`CLAUDE.md`). It delegates to the specialist agents in `.claude/agents/`.

```
npm install        # jsdom for tests and the simulation bot
npm test           # smoke tests
npm run sim        # bot plays 3 consecutive runs per profile and reports pacing
```

## Layout
| Path | What |
| --- | --- |
| `prototype/` | The single-file browser prototype |
| `sim/` | Headless balance simulation |
| `tests/` | Smoke tests |
| `docs/research/` | Market, setting and skills, tech plan, simulation results |
| `reports/` | Weekly producer briefs and market watch |
| `ROADMAP.md`, `DECISIONS.md` | Plan and owner decisions |
