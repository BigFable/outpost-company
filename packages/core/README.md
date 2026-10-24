# @outpost/core
Pure game rules: no DOM, no wall clock, no `Math.random`, and no imports from `ui`, `platform` or `skills` (lint enforced).

## What lives here (stage M2)
| File | Contents |
| --- | --- |
| `src/content.ts` | Logging content as frozen data: species, eras, stages, equipment, improvements and their unlock requirements, seasons, slopes, place and mill names, perks, rarities, meta nodes, charter clauses |
| `src/achievements.ts` | Achievements as data (`when` conditions on named metrics) plus `achievementMet`, `achievementProgress`, `bountyMetric`, `requirementProgress` |
| `src/formulas.ts` | Equipment cost curve, crew rates and upkeep (idle crews at a share of pay), improvement and perk multipliers, season/slope/distance factors, stage rate, hand work, pace boosts, market price over time, mobilization, missed-order penalty, era cost, Charter Shares (close camp) |
| `src/generators.ts` | RNG-injected generation: land-office tracts and prices, full boards (`genListings`, with the after-a-push guarantee of a tract at or under half the push price; no extra draws), hire jobs, charter orders, tree pick from a mix, perk draft pool/weights/roll |
| `src/rng.ts` | The `Rng` type and `rngRange`/`rngPick` |

Logging-specific content moves to `packages/skills/logging` in M4; it sits in core for now because the prototype is the only consumer.

## Rules for changing core
- **Exactness.** The balance baseline is compared byte for byte against the sim, so keep floating-point order of operations (multiply chains left to right) and the documented order of `rng()` draws. Changing either is a balance change: say so and run the balance check.
- **Randomness is injected.** Functions take an `Rng` (`() => number` in [0, 1)). The prototype passes `Math.random`, which the sim harness seeds.
- **Tests.** Every exported function has vitest coverage in `src/*.test.ts`. `src/__fixtures__/prototype-golden.ts` holds values captured from the pre-M2 prototype; generators must keep reproducing them.

## How the prototype uses core (single-file build)
`prototype/timberline.html` must stay one self-contained HTML file (it is published as a playable artifact). It contains a generated region:

```html
<script id="outpost-core">
// GENERATED from packages/core ... var Core = (function(exports){ ... })({});
</script><!-- /outpost-core -->
```

`pnpm run core:inline` (`scripts/inline-core.mjs`) bundles `src/index.ts` with Vite library mode as an IIFE named `Core` and rewrites that region in place. The prototype's main script reads `window.Core` (`const Core = window.Core; const EQ = Core.EQUIPMENT; ...`).

- After editing anything in `packages/core/src`, run `pnpm run core:inline` and commit the regenerated prototype with the change.
- `pnpm run core:check` fails when the region is stale; it runs in `pnpm run check` and CI.
- Never edit the generated region by hand.
