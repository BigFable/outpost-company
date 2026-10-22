# Technical Plan: Idle Roguelite RuneScape-like ("working title")

*Author: senior game engineering review. Date: 2026-10-22. Status: proposal, not yet started.*

---

## 0. TL;DR

- **Stack:** TypeScript (strict) + Vite. DOM for the UI-heavy shell, a small Canvas2D or PixiJS layer for the mini-games, and a pure-TS **simulation core with no DOM dependencies**. Ship to Steam with **Electron** using **steamworks-ffi-node**. Use the same web build for a browser demo, and wrap it with **Capacitor** later for mobile.
- **Why:** The prototype is already vanilla JS on canvas, and the bot harness is Node-based. AI assistants write TypeScript and web UI more reliably than anything else. Idle/incremental games are mostly UI and arithmetic, which a game engine adds little to. Melvor Idle is widely understood to ship as a web-tech game on Steam, which suggests the genre suits this approach (I did not verify this against a primary source).
- **Rejected alternatives:**
  - **Tauri:** Its Linux WebView (WebKitGTK) is risky on Steam Deck, and it has no mature Steam binding.
  - **Godot 4:** A strong second choice, but it would mean rewriting everything, the bot harness would have to move to headless Godot, and C# still can't export to web.
  - **Unity:** Overkill for this game, and it brings license and splash friction for little benefit.
- **First milestone:** a vertical slice (core + Logging + Firemaking as the consumer skill + roguelite layer + Steam build on a private branch) in about 10 weeks. A public Steam demo follows at about 18 weeks.

---

## 1. Engine / Stack Recommendation

### 1.1 Facts verified (October 2026)

| Item | Current state | Source |
|---|---|---|
| Godot | 4.7 released 18 Jun 2026; 4.7.2 maintenance released 18 Aug 2026 | [godotengine.org/news/release](https://godotengine.org/news/release) |
| Godot C# → Web | Still not supported; as of Apr 2026, "may not make it into 4.7"; GDScript recommended for web | [Godot forum thread](https://forum.godotengine.org/t/is-there-an-update-on-exporting-c-projects-to-web/128821?page=2) |
| GodotSteam | Godot 4.x support; the GitHub repo is archived and development moved to Codeberg | [github.com/GodotSteam/GodotSteam](https://github.com/GodotSteam/GodotSteam) |
| Unity | Runtime Fee cancelled; Personal is free up to $200k revenue/funding; Pro is $2,200/seat/yr; splash screen optional on Unity 6 Personal | [Unity blog](https://unity.com/blog/unity-is-canceling-the-runtime-fee) |
| Electron | Supported majors are 43, 44 and 45 (45.0.0 released 20 Oct 2026); new major about every 8 weeks; only the last 3 majors are supported | [endoflife.date/electron](https://endoflife.date/electron) |
| steamworks.js | Last npm publish v0.4.0 (Aug 2024), so effectively stale. Electron overlay works via `electronEnableSteamOverlay()`; needs `contextIsolation:false` | [npm](https://www.npmjs.com/package/steamworks.js), [GitHub](https://github.com/ceifa/steamworks.js), `npm view` |
| steamworks-ffi-node | MIT; v0.11.3 (Sep 2026); Koffi FFI, no C++ build; SDK 1.64; achievements, stats, leaderboards, cloud, overlay API; Electron overlay marked **experimental**; must be ASAR-unpacked; initialise in the main process | [GitHub README](https://github.com/ArtyProf/steamworks-ffi-node), `npm view` |
| Tauri + Steam | No Tauri equivalent of steamworks.js; you would need a Rust/FFI plugin you write yourself. One developer switched to Electron because of this | [GDevelop forum](https://forum.gdevelop.io/t/implementing-steam-achievements-with-tauri/73202) |
| WebKitGTK on Steam Deck Game Mode | WebKitGTK apps reported unresponsive or hanging under gamescope; Chromium-based apps mostly work | [GNOME GTK #6180](https://gitlab.gnome.org/GNOME/gtk/-/issues/6180) |
| Wrapper perf | Electron and Chrome within 1% per frame; Electron memory baseline about 100–300 MB vs Tauri about 30–50 MB; Electron is the most consistent on Linux because it bundles Chromium | [abratabia wrapper perf](https://abratabia.com/native-wrappers/wrapper-performance.php) |
| Steam overlay | Needs a GPU-rendered game; browser-based games are called out as problematic | [Steamworks Overlay docs](https://partner.steamgames.com/doc/features/overlay) |
| Steam Cloud | Auto-Cloud needs no code (paths and patterns set in the Steamworks UI, synced at launch/exit); the API (`ISteamRemoteStorage`) gives finer control; Dynamic Cloud Sync for a suspended Deck | [Steam Cloud docs](https://partner.steamgames.com/doc/features/cloud) |
| Steam Deck Verified | Full controller navigation, correct glyphs, min font 9 px (12 px recommended) at 1280×800, on-screen keyboard for text entry | [Deck compat docs](https://partner.steamgames.com/doc/steamdeck/compat) |
| Renderers | PixiJS v8.19.0 (Jun 2026); Phaser v4.2.1 (Jul 2026) | [PixiJS blog](https://pixijs.com/blog/june-2026), [Phaser](https://phaser.io/download/stable) |
| Mobile wrapper | Capacitor 8.5.3 stable (Oct 2026), 9.0 in alpha | [releasealert](https://releasealert.dev/github/ionic-team/capacitor) |
| Steam Direct fee | $100 per app; recouped after $1,000 AGR | [Steamworks app fee](https://partner.steamgames.com/doc/gettingstarted/appfee) |

### 1.2 Comparison

Scores run from 1 (poor) to 5 (excellent) for this specific game.

| Criterion | (a) TS + web + Electron | (a′) TS + web + Tauri | (b) Godot 4 (GDScript) | (c) Unity 6 |
|---|---|---|---|---|
| Idle + UI-heavy fit | **5**: HTML/CSS is the best UI toolkit available; tables, tooltips and tabs are cheap | 5 | 3: Control nodes are capable but verbose for spreadsheet-like UIs | 3: UI Toolkit/uGUI are workable but heavy |
| Small 2D mini-games | 4: Canvas2D/Pixi is plenty for aiming, steering and cutting | 4 | **5** | 4 |
| Offline progress | 5: pure code, no engine dependency | 5 | 5 | 5 |
| AI-assisted dev efficiency | **5**: TS and the DOM are the most-represented in training data, with fast type-checked feedback loops | 5 | 3: GDScript 4 syntax often gets confused with Godot 3; scenes are `.tscn` text that AI edits poorly | 3: C# is good, but a lot of the work lives in the editor, prefabs and inspector |
| Headless sim / bot harness | **5**: the existing Node harness carries over; it runs on plain Node, no jsdom needed once the core is DOM-free | 5 | 3: `--headless` works, but the harness would have to be rewritten and runs slower in CI | 2: batchmode is possible but slow and clunky |
| Steam integration | 4: steamworks-ffi-node is complete; the overlay is experimental | **2**: you would maintain your own Rust FFI | 4: GodotSteam is mature | 5: Steamworks.NET / Facepunch |
| Steam Deck | 4: Chromium works in gamescope; needs controller-nav work | **2**: WebKitGTK risk in Game Mode (or use a Proton Windows build) | 5 | 5 |
| Mobile port | 4: Capacitor wraps the same build | 4 | 4 | 5 |
| Web demo | **5**: it is the native target | 5 | 3: GDScript only, about 30–40 MB wasm, SharedArrayBuffer headers needed | 2: heavy WebGL builds |
| Performance | 4: plenty for 2D; memory 100–300 MB | 4 | 5 | 4 |
| Licensing / cost | Free (MIT) | Free | Free (MIT) | Free up to $200k, then $2,200/seat/yr |
| Build size (rough estimates, unverified) | About 90–120 MB (Chromium) | About 5–15 MB | About 40–80 MB | About 50–100 MB |
| Migration cost from prototype | **Low** (incremental) | Low | High (full rewrite) | High (full rewrite) |

### 1.3 Recommendation: (a) TypeScript + web stack in Electron

**Why it wins.** The deciding factors are migration cost, AI efficiency and the bot harness.
- Every line of the prototype carries over.
- The harness becomes *faster*, because it can drop jsdom.
- The UI is mostly text, numbers, progress bars and grids, which is exactly what the DOM is best at.

**Rendering.** Keep the mini-games on raw Canvas2D, where they already are. Reach for PixiJS only if one mini-game needs sprites in batches, particles or filters. Phaser is not justified: its scene and physics model would compete with the core's own clock.

**UI framework.** Use **Preact + Signals** (tiny, works well with AI, reactive bindings to state), or Solid if you prefer. Avoid heavy component libraries.

**Honest tradeoffs:**
- **Size and memory.** Electron makes the download about 100 MB and RAM about 150–300 MB. For an idle game left running in the background, that is noticeable but accepted by the genre.
  - **Mitigation:** throttle rendering when hidden (`backgroundThrottling` stays on for the UI; the sim runs on wall-clock deltas, not rAF).
- **Steam overlay in Electron is fragile.** The Steamworks docs warn that browser-style rendering doesn't fit the overlay model. steamworks-ffi-node marks its overlay experimental, and steamworks.js uses a GPU-flag workaround.
  - **Plan for this:** achievements, stats and cloud do *not* need the overlay. Treat the overlay as nice-to-have and test it early (week 2) on Windows, macOS and Deck.
- **Security posture.** The Steam bindings must run in the **main process**, exposed to the renderer over a narrow `contextBridge` IPC API (`unlockAchievement(id)`, `cloudWrite(...)`). Don't adopt steamworks.js's `contextIsolation:false` recommendation.
- **Upgrade cadence.** Electron majors come every 8 weeks and only 3 are supported. Pin one major per release, and bump on a quarterly cadence.
- **Steam Deck.**
  - Build two targets: a native Linux Electron build (Chromium works in gamescope) and the Windows build under Proton as a fallback. Steam lets you choose per-depot.
  - Controller navigation is real work: a spatial focus manager, glyphs, fonts of 12 px or more at 1280×800.
  - Budget for it in the demo phase. "Playable" is an acceptable first target; aim for Verified later.
- **Why not Tauri.** The size win is real. But WebKitGTK under gamescope is a known failure mode, macOS/Windows/Linux WebViews differ in canvas and audio behaviour, and the Steam binding would be yours to maintain. It's not worth it for a solo dev.
- **When Godot would be right.** If mini-games became the main attraction (physics-heavy, juicy, many of them), Godot's 2D tooling would pay off. Revisit only if mini-game scope grows past about 10 substantial games.

**Steam Direct cost:** $100 per app, recoupable. A separate demo app is created through Steamworks and attached to the base app.

---

## 2. Architecture

### 2.1 Principles

1. **The sim is a pure function of (state, input, dt, rng).** It has no DOM, no `Date.now()`, no `Math.random()`, and no `localStorage` inside `core/` or `skills/*/sim`. An ESLint rule (`no-restricted-globals` plus import boundaries) enforces this.
2. **Fixed tick.** Game logic advances in fixed ticks (e.g., 100 ms). The renderer interpolates and never mutates state; it dispatches **commands**.
3. **Everything content-shaped is data** (items, actions, perks, achievements, meta nodes). Behaviour that data cannot express goes through **named effect hooks** registered by code.
4. **Skills are plugins.** The core knows nothing about Logging. A skill registers its actions, mini-games, perks and UI panels through a `SkillModule`.

### 2.2 Folder structure

```
/apps
  /desktop        Electron main + preload (Steam bridge, file saves, crash reporter)
  /web            Vite entry for browser demo / dev
  /mobile         Capacitor shell (later)
/packages
  /core           clock, tick, rng, bus, bank, xp, unlocks, modifiers, perks, prestige,
                  achievements, save+migrations, offline catch-up. ZERO DOM.
  /content        JSON/TS data: items, skills, perks, achievements, meta tree (+ zod schemas)
  /skills
    /logging      sim.ts, perks.ts, minigames/, ui/, content.json
    /firemaking
  /minigames-kit  shared canvas loop, input abstraction (mouse/touch/gamepad), scoring
  /ui             Preact shell, panels, tooltip system, focus/gamepad nav
  /platform       interface + impls: steam (IPC), web (localStorage), capacitor
  /sim            headless harness: bots, scenarios, balance reports (Node CLI)
/tests
  /unit           vitest
  /balance        scenario specs with target bands (run in CI)
/tools            content validator, save inspector, build/upload scripts
```

Use a single repo with pnpm workspaces. `core`, `content` and `skills/*/sim` must build and run under plain Node.

### 2.3 Core systems

| System | Responsibility | Notes |
|---|---|---|
| **Clock / Tick** | Converts wall time into N fixed ticks; owns `simTime` | The renderer reads `alpha` for interpolation |
| **Offline catch-up** | On load, `elapsed = now - lastSaved` (clamped to 0..cap) | Uses **analytic fast-forward** where a skill supports it, otherwise **batched ticks** (see 2.8) |
| **RNG** | Seeded PRNG (sfc32/xoshiro128**) with *named streams* (`rng.stream('logging.drops')`) | Streams are stored in the save, so adding a new random call in one skill does not shift other skills' outcomes (keeps balance tests stable) |
| **Event bus** | Typed `emit/on` (`'item.gained'`, `'level.up'`, `'run.ended'`) | Synchronous within a tick; achievements and telemetry subscribe |
| **Bank / Inventory** | Shared item store, stack counts, capacity, locks | Transactional `tryConsume(cost)` and `add(items)` |
| **XP / Levels / Mastery** | XP curve (RS-style table), per-action mastery, pooled mastery | Formulas live in one file and are unit-tested |
| **Unlocks** | Predicate registry (`level>=15`, `meta.has('axe2')`, `achievement:x`) | Data-driven, evaluated lazily |
| **Modifiers pipeline** | Every tunable number is read via `mods.get(key, base, ctx)` | This is what keeps perks from turning into spaghetti (2.5) |
| **Perks / Drafts** | Run-scoped perk pool, rarity weights, draft offers, rerolls | Perks are data plus hooks |
| **Prestige / Meta** | "Close camp" converts run results into permanent currency; spent in a meta tree whose nodes are modifiers too | Per-skill and global currencies |
| **Achievements** | Data-defined conditions on bus events and stats | Mirrored to Steam via the platform layer, idempotently |
| **Save** | Versioned JSON, migrations, checksums, rotating backups | See 2.7 |
| **Platform** | `storage`, `achievements`, `cloud`, `telemetry`, `time` | Interface implemented per target, so the sim gets a null implementation |
| **UI layer** | Reads state via selectors/signals, sends `Command`s | Never mutates state directly |

### 2.4 Key interfaces

```ts
// ---------- core/types.ts ----------
export type ItemId = string; export type SkillId = string; export type PerkId = string;
export interface ItemStack { id: ItemId; qty: number }

export interface SimContext {
  readonly state: GameState;          // mutable only inside the sim tick
  readonly rng: RngStreams;
  readonly bus: EventBus<GameEvents>;
  readonly bank: Bank;
  readonly mods: ModifierPipeline;
  readonly content: ContentDB;
  readonly tick: number;              // current tick index
}

// ---------- Skill module ----------
export interface SkillModule<S = unknown> {
  id: SkillId;
  version: number;                                // for per-skill save migrations
  content: SkillContent;                          // actions, items, perks, achievements (data)
  initialState(): S;
  /** Advance one fixed tick. Pure w.r.t. ctx; no wall clock, no DOM. */
  tick(ctx: SimContext, s: S): void;
  /** Optional closed-form fast-forward for offline; return ticks consumed. */
  fastForward?(ctx: SimContext, s: S, ticks: number): number;
  handleCommand?(ctx: SimContext, s: S, cmd: SkillCommand): CommandResult;
  hooks?: Partial<HookHandlers>;                  // skill-specific effect hooks it provides
  miniGames?: MiniGameDef[];
  migrations?: Record<number, (old: any) => any>; // per-skill save migrations
  ui?: () => Promise<SkillUiModule>;              // lazy-loaded; never imported by sim
}

export interface SkillContent {
  actions: ActionDef[];            // e.g. chop oak: baseTicks, xp, drops, levelReq, inputs
  perks: PerkDef[];
  achievements: AchievementDef[];
  metaNodes: MetaNodeDef[];
}

// ---------- Perk definition ----------
export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export interface PerkDef {
  id: PerkId;
  skill: SkillId | 'global';
  rarity: Rarity;
  maxStacks: number;
  tags: string[];                         // for synergy/draft weighting: ['speed','fire']
  requires?: UnlockExpr;                  // e.g. "perk:sharp_axe && level>=10"
  excludes?: PerkId[];
  /** Declarative numeric changes: covers ~80% of perks with zero code. */
  modifiers?: ModifierSpec[];
  /** Rule-changing behaviour: references named hooks registered in code. */
  effects?: EffectSpec[];
  text: (stacks: number) => string;       // or i18n key + params
}

export interface ModifierSpec {
  key: ModKey;                            // 'logging.actionTicks' | 'global.xpMult' | ...
  op: 'add' | 'mul' | 'override' | 'min' | 'max';
  value: number | ((stacks: number) => number);
  when?: Predicate;                       // optional condition, e.g. tree tier
  priority?: number;                      // within-op ordering; default 0
}

export interface EffectSpec {
  hook: HookName;                         // 'onActionComplete' | 'onDrop' | 'onMiniGameScore' | 'onRunStart' ...
  handler: string;                        // registry key, e.g. 'logging.chainChop'
  params?: Record<string, number | string>;
}

export interface HookHandlers {
  onRunStart(ctx: SimContext): void;
  onActionComplete(ctx: SimContext, e: { action: ActionDef; drops: ItemStack[] }): void;
  onDrop(ctx: SimContext, e: { drops: ItemStack[] }): void;  // may mutate drops
  onMiniGameScore(ctx: SimContext, e: { gameId: string; score: number; grade: Grade }): void;
  onLevelUp(ctx: SimContext, e: { skill: SkillId; level: number }): void;
  onRunEnd(ctx: SimContext, e: { summary: RunSummary }): void;
}

// ---------- MiniGame ----------
export interface MiniGameDef {
  id: string;
  skill: SkillId;
  /** Deterministic setup from seed so bots and replays can reproduce layouts. */
  create(seed: number, params: MiniGameParams): MiniGameInstance;
  /** Headless policy for the bot harness: returns a score distribution
   *  for a given simulated skill level (0..1), without rendering. */
  simulate(seed: number, params: MiniGameParams, botSkill: number): MiniGameResult;
}
export interface MiniGameInstance {
  update(dtMs: number, input: InputSnapshot): void;   // logic only
  render(g: CanvasRenderingContext2D, alpha: number): void;
  readonly done: boolean;
  result(): MiniGameResult;                           // { score, grade, durationMs }
}
```

The `simulate()` method on `MiniGameDef` is what keeps the harness valuable. Bots never render; they sample a calibrated score model. Calibrate it once from real playtest telemetry, so a bot with `botSkill=0.6` produces a realistic distribution of score grades.

### 2.5 Rule-changing perks without spaghetti

There are three layers, applied in order of preference.

1. **Modifiers, numeric (most perks).** Every tunable read goes through `mods.get('logging.actionTicks', base, ctx)`.
   - The pipeline collects active `ModifierSpec`s from perks, meta nodes, items and achievements, filters them by `when`, and applies them in a fixed order: `override → add → mul → min/max`.
   - Results are cached per key and invalidated when the active set changes.
   - Nobody writes `if (hasPerk('sharp_axe'))` anywhere.

2. **Effect hooks (rule changes).** Examples:
   - "Every 5th chop also burns a log for Firemaking XP."
   - "Perfect mini-game grade doubles the next drop."

   Each is a small pure function registered in a `HookRegistry` under a string key, and the perk's data refers to that key. The core fires hooks at well-defined points with a typed event. Handlers may (a) emit events, (b) mutate the event payload (e.g., `drops`), or (c) set per-run counters in `state.run.perkState[perkId]`. They may **not** reach into other systems directly.

3. **Flags (structural toggles).** Rarely, a perk changes control flow, e.g., "actions consume no input logs." Express it as a boolean modifier key (`firemaking.consumeInputs`, using `op:'override'`), which the skill reads like any other modifier.

**Guard-rails:**
- Hook handlers run in deterministic order (perk priority, then id).
- Recursive emission is capped per tick.
- A dev "modifier inspector" overlay shows every contribution to any key, so you can answer "why is my chop 0.3 s?"
- Each hook gets a unit test against a fixture state.

### 2.6 Roguelite run & prestige flow

```
RunState { skill, seed, depth/floor, draftHistory, perks: Record<PerkId, stacks>, perkState, stats }
startRun(skill) → seed from meta rng → onRunStart hooks
at milestones (level thresholds / mini-game clears) → draft: offer 3 weighted perks (tags, rarity, excludes)
closeCamp(skill) → compute currency = f(run stats) → meta.currency[skill] += …; run cleared; levels reset per design
meta tree nodes = ModifierSpec[] + unlocks, applied permanently
```

### 2.7 Save schema

```ts
export interface SaveFileV1 {
  format: 'irs-save';
  schema: number;               // global schema version (migrations chain 1→2→…)
  gameVersion: string;          // semver of the build that wrote it
  savedAt: number;              // wall-clock ms (only place Date.now() matters)
  simTick: number;
  rng: Record<string, [number, number, number, number]>; // per-stream state
  bank: Record<ItemId, number>;
  skills: Record<SkillId, { v: number; xp: number; mastery: Record<string, number>; state: unknown }>;
  run: Record<SkillId, RunState | null>;
  meta: { currency: Record<string, number>; nodes: string[] };
  achievements: Record<string, number>; // id → unlockedAt
  settings: Settings;
  checksum: string;             // hash of canonical JSON (corruption detection, not anti-cheat)
}
```

- **Migrations:** a global chain `migrations[n](save) → save(n+1)`, plus per-skill chains keyed by `skills[id].v`. Every migration gets a fixture test: a real old save goes in, the expected new save comes out.
- **Writes:** serialise to a temp file, fsync, rename, and keep the last 5 rotating backups plus a daily snapshot. In the browser, use IndexedDB with two slots, alternating.
- **Steam Cloud:** start with **Auto-Cloud** on the save directory. It needs no code and syncs at launch/exit. Move to the Cloud API only if you need in-game conflict UI.
  - Detect conflicts yourself: compare `simTick`/`savedAt` between local and cloud, and offer a choice in the UI.

### 2.8 Offline catch-up

- **Cap:** clamp `elapsed` to the offline cap (e.g., 12 h base, upgradeable via meta). Ignore negative deltas from clock rollback.
- **Fast path:** a skill with a steady-state loop (chop N logs at a fixed rate) implements `fastForward()` in closed form. It computes counts, expected XP and level-ups piecewise between level thresholds, and samples drops with binomial/multinomial draws from the seeded stream.
- **Fallback:** batched real ticks inside a `requestIdleCallback`/worker loop with a progress modal, a budget of about 200 ms per frame, and a hard wall-time cap.
- **Running perks offline:** perks with hooks run offline via an "offline-safe" flag. Hooks that aren't offline-safe are skipped offline, and their tooltip says so.
- **Determinism test:** for a short period, `fastForward(t)` must match `tick×N` within statistical tolerance. CI runs this property test.

---

## 3. Migration Plan from the Prototype

The rule: **the game stays playable, and `npm run sim` stays green, at every commit.**

| Stage | Work | Exit check |
|---|---|---|
| **M0 Freeze & baseline** (2–3 d) | Commit the prototype as-is. Record a **golden balance report** from the current harness (e.g., time-to-level-30, run-1 vs run-2 time). | Report checked in at `tests/balance/baseline.json` |
| **M1 Scaffold** (3–4 d) | pnpm monorepo, Vite, TS strict, vitest, ESLint boundaries. Load the old HTML file *inside* the Vite app unchanged (a `legacy/` entry). | Plays from `vite dev` |
| **M2 Extract pure logic** (1 wk) | Move formulas (XP curve, drop tables, timings) into `packages/core` as TS. The legacy file imports them via a shim (`window.Core = …`). Add unit tests. | Harness output identical to baseline (same seed) |
| **M3 State & tick** (1 wk) | Introduce `GameState`, a fixed tick, seeded RNG, and the command pattern. The legacy UI reads from the new state. Replace jsdom in the harness with a direct import of core. | Harness runs on plain Node, at least 10× faster |
| **M4 Logging as module** (1 wk) | Port Logging into `skills/logging` (sim + content JSON + mini-games behind `MiniGameDef`). Delete the legacy Logging code. | Balance within ±5% of baseline |
| **M5 New UI shell** (1 wk) | Preact shell, bank panel, skill panel, tooltip system. Remove the legacy HTML. | Full Logging loop playable |
| **M6 Save v1 + migration from localStorage** | Importer converts prototype saves into `SaveFileV1` (migration 0→1). | Old saves load |

---

## 4. Vertical Slice Definition (Milestone 1)

- **Core:** clock, offline catch-up (with the fast path for Logging), bank, XP/mastery, modifiers, hooks, event bus, saves with migrations and backups.
- **Logging (ported):** idle loop, 2 mini-games (aiming/timing chop, cutting puzzle), about 12 perks, meta tree branch.
- **Consumer skill: Firemaking** (consumes logs and produces XP, ash and a buff). Proves cross-skill item flow, plus 1 mini-game (steering/fanning) and about 8 perks.
- **Roguelite layer:** runs, drafts, close camp, meta currency, 10–15 meta nodes.
- **Achievements:** about 15, mirrored to Steam.
- **Steam-ready build:** Electron on Win/macOS/Linux, steamworks-ffi-node in the main process, achievements firing, Auto-Cloud configured, uploaded to a private beta branch via SteamPipe, launched from the Steam client on desktop and on Deck.
- **Tooling:** balance CI green, crash reporting live, opt-in telemetry stub.

---

## 5. Tooling

**Repo**
- pnpm workspaces, TypeScript strict, ESLint plus `eslint-plugin-boundaries` (core can't import ui/platform), Prettier.
- Use `CLAUDE.md`/`AGENTS.md` files describing the architecture rules. This lets AI assistants respect boundaries, and it is a high-leverage document for a solo dev working with AI.

**Testing pyramid**
1. **Unit (vitest):** formulas, modifier ordering, each hook handler, migration fixtures, RNG stream isolation.
2. **Property tests (fast-check):** bank never negative; save → load → save is byte-identical; fastForward ≈ ticks.
3. **Simulation balance tests (CI):** scenario files run N seeded bots and assert target bands.
   - Fail the build when a metric leaves its band.
   - Print a diff table against the last main build; store reports as CI artifacts for trend graphs.
   ```ts
   scenario('logging run2 speedup', {
     bot: 'greedy-drafter', botSkill: 0.6, seeds: 200,
     script: [runToCamp('logging'), runToCamp('logging')],
     expect: { 'run2.timeToCamp / run1.timeToCamp': band(0.60, 0.75) } // i.e. 25–40% faster
   });
   ```
   Other bands: time-to-first-draft 3–6 min; offline 8 h yields 70–90% of the active rate; no single perk appears in more than 40% of the top-decile bot builds (a dominance check).
4. **Smoke E2E (Playwright, few):** the app boots, a save loads, one mini-game completes. Playwright can drive Electron too.

**Content pipeline**
- `packages/content/*.json` (or `.ts` for typed literals), validated by **zod** schemas at build time.
- `tools/validate-content` checks dangling item refs, unreachable unlocks, perks without text, and duplicate ids.
- A generated `content.d.ts` gives ID unions for autocomplete.
- Optional CSV import for bulk tables (drop rates) edited in a spreadsheet.

**Telemetry (privacy-safe)**
- Opt-in on first launch; off by default in the EU-safe sense.
- Send only aggregated gameplay events (run length, perk picks, mini-game grades, session length buckets).
- Use a random install UUID, never SteamID; no PII and no IP storage.
- Batch every 5 min.
- Backend: a self-hosted PostHog, or a tiny endpoint writing to a database.
- These events also calibrate the bots' `MiniGameDef.simulate` score models.

**Crash reporting**
- `@sentry/electron` for main- and renderer-process errors, plus the generic `window.onerror` for the web demo.
- Scrub file paths and usernames.
- Attach the save `schema`/`gameVersion`; also attach the save itself only with the player's consent.

**Versioning**
- SemVer `0.MINOR.PATCH` until 1.0. `gameVersion` is embedded in the build and the save.
- Generate the changelog from conventional commits.

**Build / release**
- GitHub Actions matrix (windows, macos, ubuntu) running `electron-builder`, with the Steam redistributables and the FFI native bits **ASAR-unpacked**.
- macOS needs signing and notarization (needs an Apple Developer account at $99/yr). Windows signing is optional on Steam.
- Release flow, using the SteamPipe workflow described in the [SteamPipe docs](https://partner.steamgames.com/doc/sdk/uploading):
  - `steamcmd +login builder +run_app_build app_build.vdf`, one depot per OS.
  - `SetLive` targets the `beta` branch automatically. Promote to default manually, since Steam requires 2FA confirmation for that.
  - Use a dedicated builder account and cache `config.vdf` as a CI secret.
  - Use `Preview` mode for PR dry-runs.
- The web demo goes from the same CI to itch.io via `butler`, or to static hosting.

---

## 6. Risks & Mitigations

| Risk | Likelihood / Impact | Mitigation |
|---|---|---|
| **Save corruption** (crash mid-write, cloud conflict) | Med / Critical | Atomic temp+rename writes, checksums, 5 rotating backups plus daily snapshots, fixture-tested migrations, a "restore backup" UI, and a conflict prompt comparing `simTick` |
| **Offline-progress exploits** (clock forward) | High / Low | Cap offline time, ignore negative deltas, optionally cross-check against Steam server time. It's single-player, so don't fight hard; just stop accidental 10-year jumps |
| **Cheating** | High / Negligible | Don't obfuscate. Keep the checksum for corruption detection only. Disable achievements only if a dev console is used (flag in the save) |
| **Balance drift** as perks and skills multiply | High / High | Balance bands in CI, a perk-dominance check, a golden baseline report diffed on every PR, and the modifier inspector |
| **Scope creep** (skills × mini-games × perks grows multiplicatively) | Very high / High | Content budget per skill: 1 idle loop, at most 2 mini-games, 10–15 perks, 1 meta branch. Every new skill must reuse `minigames-kit`. Hard freeze at the slice and the demo |
| **Long offline catch-up is slow** | Med / Med | Closed-form `fastForward` per skill; batched-tick fallback with a progress UI and time budget; a perf test in CI (`12h offline < 300 ms`) |
| **Steam overlay doesn't render in Electron** | Med / Low | Not required for achievements or cloud. Test it in week 2. Fall back to an in-game achievement toast. Try steamworks.js's GPU-flag approach as an alternative |
| **Steam Deck Game Mode problems** | Med / Med | Electron (Chromium) over Tauri; ship a native Linux build plus the Windows build under Proton as a fallback; controller nav built in from the slice onward |
| **Electron churn / security** | Med / Low | Pin a major per release, use contextIsolation with a narrow preload API, and bump quarterly |
| **steamworks-ffi-node is a single-maintainer project** | Med / Med | Wrap it behind the `platform.steam` interface. steamworks.js is a drop-in fallback, as is a small custom N-API addon if needed |
| **AI-generated code erodes the architecture** | Med / High | Lint-enforced boundaries, architecture docs for agents, a small PR scope, and the harness as an always-on regression oracle |

---

## 7. Phased Roadmap (solo dev with AI help)

| Weeks | Phase | Deliverables |
|---|---|---|
| 1 | **Foundation** | M0–M1: monorepo, Vite, TS, lint boundaries, CI running the legacy harness, golden baseline |
| 2 | **Steam spike** (de-risk early) | Bare Electron app with steamworks-ffi-node: one achievement, Auto-Cloud file, overlay test on Win/macOS/Deck, steamcmd upload to a private branch. Go/no-go on Electron here |
| 3–4 | **Core extraction** | M2–M3: core formulas, state, tick, RNG streams, bus, bank, modifiers, hooks; harness on plain Node; unit tests |
| 5 | **Logging port** | M4: Logging module plus both mini-games on `MiniGameDef` with `simulate()`; balance ±5% of baseline |
| 6 | **UI shell + saves** | M5–M6: Preact shell, tooltips, save v1, backups, prototype-save importer, offline catch-up with the fast path |
| 7–8 | **Roguelite layer + Firemaking** | Runs, drafts, close camp, meta tree; Firemaking consumes logs; cross-skill flow; perks and hooks; balance bands in CI |
| 9 | **Achievements + platform** | Achievement system to Steam mirroring, settings, Sentry, telemetry stub |
| 10 | **Vertical slice hardening** | Perf tests, migration fixtures, Deck test pass, private Steam beta build. **Milestone 1 complete** |
| 11–12 | **Playtest loop** | 5–15 external testers via Steam keys; telemetry calibrates the bot score models; rebalance via CI bands |
| 13–15 | **Demo content** | One more skill pair (e.g., Mining → Smithing) if the slice validates the loop; audio; juice; onboarding/tutorial |
| 16–17 | **Deck & polish** | Gamepad focus navigation, glyphs, 12 px font audit at 1280×800, store-page capsule art, web-demo build |
| 18 | **Steam demo** | Demo app configured, store page live, demo on the default branch; web demo on itch.io. Prepare for a Next Fest slot |

Buffer: add about 25% (realistically 22–23 weeks to the demo). The week-2 Steam spike is the main early go/no-go gate. If the Electron + Steam combination misbehaves badly on Deck, the fallback is to keep the same TS core and harness and swap the shell. The architecture deliberately isolates `platform/` and `ui/` so that remains cheap.

---

## Sources opened

- Godot releases: https://godotengine.org/news/release
- Godot C# web export status: https://forum.godotengine.org/t/is-there-an-update-on-exporting-c-projects-to-web/128821?page=2
- GodotSteam (archived, moved to Codeberg): https://github.com/GodotSteam/GodotSteam
- Unity Runtime Fee cancellation and pricing: https://unity.com/blog/unity-is-canceling-the-runtime-fee
- Electron support matrix: https://endoflife.date/electron
- steamworks.js: https://www.npmjs.com/package/steamworks.js and https://github.com/ceifa/steamworks.js
- steamworks-ffi-node: https://github.com/ArtyProf/steamworks-ffi-node and https://www.steamgifts.com/discussion/u3wHw/steamworks-ffi-node-a-typescriptjavascript-wrapper-for-the-steamworks-sdk
- Tauri + Steam achievements discussion: https://forum.gdevelop.io/t/implementing-steam-achievements-with-tauri/73202
- WebKitGTK under gamescope on Steam Deck: https://gitlab.gnome.org/GNOME/gtk/-/issues/6180
- Wrapper performance comparison: https://abratabia.com/native-wrappers/wrapper-performance.php
- Electron on Steam Deck (controller nav): https://brainhub.eu/library/making-electron-apps-steam-deck-compatible
- Steamworks Overlay: https://partner.steamgames.com/doc/features/overlay
- Steamworks Cloud: https://partner.steamgames.com/doc/features/cloud
- Steam Deck compatibility review: https://partner.steamgames.com/doc/steamdeck/compat
- SteamPipe uploading: https://partner.steamgames.com/doc/sdk/uploading
- Steam Direct fee: https://partner.steamgames.com/doc/gettingstarted/appfee
- PixiJS June 2026 update: https://pixijs.com/blog/june-2026
- Phaser stable download: https://phaser.io/download/stable
- Capacitor releases: https://releasealert.dev/github/ionic-team/capacitor
- Sentry Electron SDK: https://docs.sentry.io/platforms/javascript/guides/electron/
