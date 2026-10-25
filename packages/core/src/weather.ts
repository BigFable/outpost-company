/**
 * Seasonal events, slice 1 (docs/design/seasonal-events.md): one weather card per
 * season change, company-wide (both camps share the roll), drawn from its own
 * seeded stream (`rng.events`), so the logging sim's Math.random draws are untouched.
 *
 * Effects are data. The prototype reads them through small hooks:
 * - `eventStageFactor` multiplies a stage on top of `seasonFactor()`, and
 *   `composeSeason` applies the 0.4-1.6 clamp. Species seasonal traits (species
 *   overhaul) compose by multiplying into the same `base` before the clamp.
 * - `eventMult` reads price/upkeep/hire/tract/finds multipliers.
 * - `eventGameRules` lists the mini-game hazards for one game.
 * With no event the factors are exactly 1 and `composeSeason` returns `base`
 * untouched, so a quiet season is byte-identical to the pre-events game.
 */
import { deepFreeze } from './freeze';
import type { Season, Stage } from './content';
import type { ItemId } from './items';
import type { Rng } from './rng';

export type EventTone = 'good' | 'neutral' | 'bad' | 'none';
export type GameKind = 'fell' | 'buck' | 'skid' | 'haul' | 'saw' | 'all';
export type EventEffect =
  /** Crew speed on a stage ('all' = every stage). `half` 1 = first 75 s only, 2 = last 75 s only. `mud`: counts as spring mud (Corduroy halves it, Swamp boots ignores it, Greased runners make it ×1.1). `sprinkler`: the Road sprinkler sled cancels it on hauling. */
  | { readonly kind: 'stage'; readonly stage: Stage | 'all'; readonly mult: number; readonly half?: 1 | 2; readonly mud?: boolean; readonly sprinkler?: boolean }
  | { readonly kind: 'price' | 'upkeep' | 'hire' | 'tractPrice'; readonly mult: number }
  /** Idle finds chance ×mult; `item` gets an extra weight ×itemMult in the idle find table. */
  | { readonly kind: 'finds'; readonly mult: number; readonly item?: ItemId; readonly itemMult?: number }
  | { readonly kind: 'item'; readonly item: ItemId; readonly qty: number }
  /** At the start: this share of the landing floats down to the cove and sells at once. */
  | { readonly kind: 'drift'; readonly share: number }
  /** A slash fire can burn `share` of the stems on the ground (once) while they exceed `minStemsMin` minutes of bucking. */
  | { readonly kind: 'fire'; readonly share: number; readonly minStemsMin: number }
  /** Counts as this season for every seasonal rule (Early freeze = Winter). */
  | { readonly kind: 'seasonAs'; readonly season: Season }
  | { readonly kind: 'game'; readonly game: GameKind; readonly rule: GameRule; readonly value?: number };

export type GameRule =
  | 'mudPlus' | 'noMud' | 'limit' | 'parBonus' | 'viewYd' | 'viewFrac' | 'dashedEdges' | 'summerBrakes' | 'fullRoad'
  | 'wind' | 'trueLine' | 'boostSec' | 'galePrime';

export interface SeasonEventDef {
  readonly id: string;
  readonly season: Season;
  readonly tone: EventTone;
  readonly weight: number;
  readonly name: string;
  /** Two lines of story in the company's voice. */
  readonly card: string;
  /** One line of effects, as shown on the card. */
  readonly fx: string;
  /** Clear the road text (bad events). */
  readonly counter?: string;
  readonly silver?: string;
  readonly lasts: 'none' | 'season' | 'half' | 'instant';
  readonly effects: readonly EventEffect[];
  /** Stage whose good mini-game run clears this event (Clear the road). Defaults to the stages it slows. */
  readonly clearBy?: readonly Stage[];
}

/** After the season factor and the event, a stage's factor stays inside this range (unless the season alone is already outside it). */
export const EVENT_CLAMP = deepFreeze([0.4, 1.6] as const);
/** A mini-game run at this quality or better clears the road (halves the stage's remaining penalty). */
export const CLEAR_ROAD_Q = 0.55;
/** Gentle start: a brand-new company's first season changes deal only good or nothing. */
export const GENTLE_CHANGES = 4;
/** Payroll guard: harmful event effects pause while cash is under this many minutes of upkeep. */
export const PAYROLL_GUARD_MIN = 2;
/** Storm season curse: Charter Shares bonus per bad event that runs its full course, and its cap (outside the special-order cap). */
export const STORM_SEASON_STEP = 0.02;
export const STORM_SEASON_CAP = 0.3;
/** Storm signals (board node): bad-event weights ×0.7, the freed weight goes to "nothing". */
export const STORM_SIGNALS_MULT = 0.7;
/** Storm season curse: bad-event weights ×2. */
export const STORM_SEASON_MULT = 2;
/** Dry summer clause: Dry spell's weight ×3 (its separate random fire is gone). */
export const DRY_SUMMER_MULT = 3;
/** Slash fire chance per second while the stems pile is over the line (events stream). */
export const FIRE_PER_SEC = 0.01;
/** The land office discounts one listing on burnt-over ground by this much. */
export const BURNT_DISCOUNT = 0.8;
/** Felling wind multiplier product cap (events × species), so a gale stays playable. */
export const WIND_CAP = 2;

const W = 'logging.ships_fitting', FOG = 'logging.fog_glass';

export const SEASON_EVENTS: readonly SeasonEventDef[] = deepFreeze([
  // ---- Spring (base: mud, skid and haul ×0.5)
  {id:'grey_spring', season:'Spring', tone:'none', weight:34, name:'Grey spring', lasts:'none', effects:[],
    card:'Rain and deep mud. The usual.', fx:'No change: spring mud as always'},
  {id:'thaw_flood', season:'Spring', tone:'bad', weight:14, name:'Spring flood', lasts:'season',
    card:'The snow melted overnight. Charter Creek is flooding the skid trails.',
    fx:'Skidding ×0.8 (counts as mud) · 15% of the landing floats to the cove and sells',
    counter:'Make a clean skid to clear the trails', silver:'Logs float to the cove for free',
    effects:[{kind:'stage', stage:'skid', mult:0.8, mud:true}, {kind:'drift', share:0.15},
      {kind:'game', game:'skid', rule:'mudPlus', value:3}, {kind:'game', game:'haul', rule:'limit', value:-1}]},
  {id:'supply_ship', season:'Spring', tone:'good', weight:12, name:'Supply ship', lasts:'instant',
    card:'The Perseverance is in early with hands, hay and parts.',
    fx:'Crews, machines and lots 15% cheaper this season · +1 ship’s fitting',
    effects:[{kind:'hire', mult:0.85}, {kind:'tractPrice', mult:0.85}, {kind:'item', item:W, qty:1}]},
  {id:'fog_bank', season:'Spring', tone:'neutral', weight:12, name:'Fog bank', lasts:'season',
    card:'Thick fog on the cove road. Drivers go by the sound of the surf.',
    fx:'Hauling ×0.9 · idle crews find things twice as often', silver:'Things wash up in the fog',
    effects:[{kind:'stage', stage:'haul', mult:0.9}, {kind:'finds', mult:2, item:FOG, itemMult:2},
      {kind:'game', game:'haul', rule:'viewYd', value:120}]},
  // ---- Summer (base: normal)
  {id:'long_light', season:'Summer', tone:'none', weight:30, name:'Long light', lasts:'none', effects:[],
    card:'Warm days and thin fog.', fx:'No change: normal summer work'},
  {id:'long_days', season:'Summer', tone:'good', weight:18, name:'Long days', lasts:'season',
    card:'The sun barely sets. Crews work late and sing on the way home.',
    fx:'Every stage ×1.1 · mini-game speed boosts +10 s',
    effects:[{kind:'stage', stage:'all', mult:1.1}, {kind:'game', game:'all', rule:'boostSec', value:10}]},
  {id:'dry_spell', season:'Summer', tone:'bad', weight:12, name:'Dry spell', lasts:'season',
    card:'No rain in five weeks. The brush is dry as tinder.',
    fx:'If felled trees pile up past 2 minutes of bucking, a fire can burn 15% of them (once)',
    counter:'Cut a trunk well to clear the brush (halves the burn)', silver:'After a fire, the next lot costs 20% less',
    clearBy:['buck'],
    effects:[{kind:'fire', share:0.15, minStemsMin:2}]},
  {id:'fish_run', season:'Summer', tone:'neutral', weight:12, name:'Fish run', lasts:'season',
    card:'The salmon are in. Half the crew is down at the cannery.',
    fx:'Every stage ×0.92 · wages ×0.75',
    effects:[{kind:'stage', stage:'all', mult:0.92}, {kind:'upkeep', mult:0.75}]},
  // ---- Fall (base: normal)
  {id:'fog_water', season:'Fall', tone:'none', weight:30, name:'Fog on the water', lasts:'none', effects:[],
    card:'Grey mornings and still water.', fx:'No change: normal fall work'},
  {id:'equinox_gale', season:'Fall', tone:'bad', weight:14, name:'Fall gale', lasts:'season',
    card:'A fall storm blew trees down across the haul road.',
    fx:'Hauling ×0.85 · felling ×1.1 (the wind knocks trees down) · felling-game wind ×1.5',
    counter:'Drive a clean load to clear the road', silver:'Idle haulers find ship’s fittings twice as often; a perfect fall gives +1 Prime',
    effects:[{kind:'stage', stage:'haul', mult:0.85}, {kind:'stage', stage:'fell', mult:1.1}, {kind:'finds', mult:1, item:W, itemMult:2},
      {kind:'game', game:'fell', rule:'wind', value:1.5}, {kind:'game', game:'fell', rule:'galePrime', value:1}]},
  {id:'second_summer', season:'Fall', tone:'good', weight:14, name:'Second summer', lasts:'season',
    card:'A warm fall: dry trails, blue sky and no mud for weeks.',
    fx:'Skidding ×1.15 · hauling ×1.1 · no mud in the skid game',
    effects:[{kind:'stage', stage:'skid', mult:1.15}, {kind:'stage', stage:'haul', mult:1.1}, {kind:'game', game:'skid', rule:'noMud'}]},
  {id:'early_freeze', season:'Fall', tone:'neutral', weight:12, name:'Early freeze', lasts:'season',
    card:'Ice on the pond in October. Hard ground, fast roads.',
    fx:'Counts as Winter: felling ×0.85, skidding and hauling ×1.25, and all winter rules',
    effects:[{kind:'seasonAs', season:'Winter'}]},
  // ---- Winter (base: felling ×0.85, skid and haul ×1.25)
  {id:'hard_frost', season:'Winter', tone:'none', weight:30, name:'Hard frost', lasts:'none', effects:[],
    card:'Frozen ground. Good going.', fx:'No change: winter roads as always'},
  {id:'blizzard', season:'Winter', tone:'bad', weight:12, name:'Blizzard', lasts:'half',
    card:'Three days of heavy snow. Nobody can see a thing.',
    fx:'First half: every stage ×0.6 (the ice road sled keeps hauling going) · second half: packed snow, hauling ×1.2',
    counter:'A good mini-game run clears that job’s snow', silver:'Packed road after the storm',
    effects:[{kind:'stage', stage:'all', mult:0.6, half:1, sprinkler:true}, {kind:'stage', stage:'haul', mult:1.2, half:2},
      {kind:'game', game:'haul', rule:'viewFrac', value:0.6}, {kind:'game', game:'haul', rule:'dashedEdges'}]},
  {id:'ice_bridge', season:'Winter', tone:'good', weight:14, name:'Ice bridge', lasts:'season',
    card:'The inlet froze over. Sleds take the short way across the ice.',
    fx:'Hauling ×1.3 · skidding ×1.1 · haul game: load limit +2, summer brakes',
    effects:[{kind:'stage', stage:'haul', mult:1.3}, {kind:'stage', stage:'skid', mult:1.1},
      {kind:'game', game:'haul', rule:'limit', value:2}, {kind:'game', game:'haul', rule:'summerBrakes'}]},
  {id:'clear_cold', season:'Winter', tone:'good', weight:12, name:'Clear cold', lasts:'season',
    card:'The fog is gone. You can see the far shore.',
    fx:'Idle finds ×1.5 · haul game shows the whole road · felling game shows the true fall line',
    effects:[{kind:'finds', mult:1.5, item:FOG, itemMult:3}, {kind:'game', game:'haul', rule:'fullRoad'}, {kind:'game', game:'fell', rule:'trueLine'}]},
]);

const BY_ID: ReadonlyMap<string, SeasonEventDef> = new Map(SEASON_EVENTS.map((e) => [e.id, e]));
export function eventDef(id: string | null | undefined): SeasonEventDef | undefined { return id ? BY_ID.get(id) : undefined; }
/** The friendly first card of a brand-new company, per season (the season's good headline event). */
export const FIRST_CARD: Readonly<Record<Season, string>> = deepFreeze({Spring:'supply_ship', Summer:'long_days', Fall:'second_summer', Winter:'ice_bridge'});

export interface WeightOpts {
  /** Storm signals board node. */
  readonly signals?: boolean;
  /** Storm season curse perk. */
  readonly stormSeason?: boolean;
  /** Dry summer charter clause. */
  readonly drySummer?: boolean;
}

/** One season's table with weights after board nodes, curses and clauses. Freed bad weight (Storm signals) goes to "nothing". */
export function eventWeights(season: Season, o: WeightOpts = {}): { def: SeasonEventDef; w: number }[] {
  const rows = SEASON_EVENTS.filter((e) => e.season === season).map((def) => {
    let w = def.weight;
    if (def.id === 'dry_spell' && o.drySummer) w *= DRY_SUMMER_MULT;
    if (def.tone === 'bad' && o.stormSeason) w *= STORM_SEASON_MULT;
    return { def, w };
  });
  if (o.signals) {
    let freed = 0;
    for (const r of rows) if (r.def.tone === 'bad') { const nw = r.w * STORM_SIGNALS_MULT; freed += r.w - nw; r.w = nw; }
    const none = rows.find((r) => r.def.tone === 'none');
    if (none) none.w += freed;
  }
  return rows;
}

export interface RollCtx {
  /** Bad events in a row just before this roll. */
  readonly badStreak: number;
  /** Most bad events allowed in a row: 1 normally, 2 with Storm season (or Storm coast). */
  readonly maxBad: number;
  /** Season changes already rolled for this company (gentle start uses the first GENTLE_CHANGES). */
  readonly changes: number;
}

/**
 * Roll one event for `season`. Exactly one draw from `rng`. A brand-new company's first
 * card is the season's good headline; the next gentle-start rolls turn anything but good
 * into nothing; a bad roll past `maxBad` in a row becomes nothing.
 */
export function rollEvent(season: Season, ctx: RollCtx, rows: readonly { def: SeasonEventDef; w: number }[], rng: Rng): SeasonEventDef {
  const x = rng();
  const none = (rows.find((r) => r.def.tone === 'none') ?? rows[0])?.def;
  if (!none) throw new RangeError(`rollEvent: no events for ${season}`);
  if (ctx.changes === 0) return eventDef(FIRST_CARD[season]) ?? none;
  const tot = rows.reduce((a, r) => a + r.w, 0);
  let y = x * tot, pick = rows[rows.length - 1]?.def ?? none;
  for (const r of rows) { y -= r.w; if (y < 0) { pick = r.def; break; } }
  if (ctx.changes < GENTLE_CHANGES && pick.tone !== 'good') return none;
  if (pick.tone === 'bad' && ctx.badStreak >= ctx.maxBad) return none;
  return pick;
}

/** Seconds of the season after which a 'half' effect switches to its second half. */
export const HALF_SEC = 75;

export interface StageFactorOpts {
  readonly corduroy?: boolean;
  readonly swampBoots?: boolean;
  readonly greased?: boolean;
  /** Road sprinkler sled. */
  readonly iceRoad?: boolean;
  /** Ill wind legendary: a bad event's crew penalties become bonuses of the same size. */
  readonly illWind?: boolean;
  /** Clear the road: this stage's remaining penalty is halved. */
  readonly cleared?: boolean;
  /** Payroll guard on: harmful effects pause. */
  readonly guard?: boolean;
}

/** One stage's event multiplier at `tIn` seconds into the season (1 with no event). */
export function eventStageFactor(ev: SeasonEventDef | undefined, stage: Stage, tIn: number, o: StageFactorOpts = {}): number {
  if (!ev) return 1;
  let f = 1;
  for (const e of ev.effects) {
    if (e.kind !== 'stage' || (e.stage !== 'all' && e.stage !== stage)) continue;
    if (e.half === 1 && tIn >= HALF_SEC) continue;
    if (e.half === 2 && tIn < HALF_SEC) continue;
    let m = e.mult;
    if (e.mud && stage === 'skid') m = o.greased ? 1.1 : o.swampBoots ? 1 : o.corduroy ? 1 - (1 - m) / 2 : m;
    if (e.sprinkler && stage === 'haul' && o.iceRoad) m = 1;
    if (m < 1 && ev.tone === 'bad') {
      if (o.illWind) m = 1 + (1 - m);
      else if (o.guard) m = 1;
      else if (o.cleared) m = 1 - (1 - m) / 2;
    } else if (m < 1 && o.guard) m = 1;
    f *= m;
  }
  return f;
}

/** True when an event slows this stage at `tIn` (the stages Clear the road can clear). */
export function eventSlows(ev: SeasonEventDef | undefined, stage: Stage, tIn: number): boolean {
  if (!ev || ev.tone !== 'bad') return false;
  if (ev.clearBy) return ev.clearBy.includes(stage);
  return eventStageFactor(ev, stage, tIn) < 1;
}

/**
 * The season factor after an event: base × event, kept inside EVENT_CLAMP. A season factor
 * already outside the range on its own (winter hauling with the sprinkler sled) is never
 * made worse by a good event or better by a bad one. With ev = 1 this returns `base` exactly.
 */
export function composeSeason(base: number, ev: number): number {
  if (ev === 1) return base;
  const lo = Math.min(EVENT_CLAMP[0], base), hi = Math.max(EVENT_CLAMP[1], base);
  return Math.min(hi, Math.max(lo, base * ev));
}

/** Product of an event's multipliers of one kind (price, upkeep, hire, tractPrice, finds). Harmful ones pause under the payroll guard. */
export function eventMult(ev: SeasonEventDef | undefined, kind: 'price' | 'upkeep' | 'hire' | 'tractPrice' | 'finds', guard = false): number {
  if (!ev) return 1;
  let m = 1;
  for (const e of ev.effects) {
    if (e.kind !== kind) continue;
    const harmful = kind === 'upkeep' || kind === 'hire' || kind === 'tractPrice' ? e.mult > 1 : e.mult < 1;
    if (harmful && guard) continue;
    m *= e.mult;
  }
  return m;
}

/** Extra idle-find weights an event puts on single items. */
export function eventFindWeights(ev: SeasonEventDef | undefined): Record<string, number> {
  const out: Record<string, number> = {};
  if (!ev) return out;
  for (const e of ev.effects) if (e.kind === 'finds' && e.item && e.itemMult) out[e.item] = (out[e.item] ?? 1) * e.itemMult;
  return out;
}

/** The season every seasonal rule should use (Early freeze counts as Winter). */
export function effectiveSeason(season: Season, ev: SeasonEventDef | undefined): Season {
  const e = ev?.effects.find((x) => x.kind === 'seasonAs');
  return e && e.kind === 'seasonAs' ? e.season : season;
}

export interface GameRuleRow { readonly rule: GameRule; readonly value?: number }
/** Mini-game rule changes an event makes in one game (rows for 'all' included). */
export function eventGameRules(ev: SeasonEventDef | undefined, game: Exclude<GameKind, 'all'>): GameRuleRow[] {
  if (!ev) return [];
  const out: GameRuleRow[] = [];
  for (const e of ev.effects) if (e.kind === 'game' && (e.game === game || e.game === 'all')) out.push(e.value === undefined ? { rule: e.rule } : { rule: e.rule, value: e.value });
  return out;
}
/** Value of one game rule (`dflt` when the event lacks it). */
export function gameRule(ev: SeasonEventDef | undefined, game: Exclude<GameKind, 'all'>, rule: GameRule, dflt = 0): number {
  const r = eventGameRules(ev, game).find((x) => x.rule === rule);
  return r ? (r.value ?? 1) : dflt;
}

/** Felling wind multiplier with the cap (events × species). */
export function windMult(...mults: readonly number[]): number {
  return Math.min(WIND_CAP, mults.reduce((a, m) => a * m, 1));
}

/** Payroll guard: harmful effects pause while cash is under PAYROLL_GUARD_MIN minutes of upkeep. */
export function payrollGuard(cash: number, upkeepPerMin: number): boolean {
  return upkeepPerMin > 0 && cash < PAYROLL_GUARD_MIN * upkeepPerMin;
}

/** Storm season curse: Charter Shares multiplier for `n` bad events weathered in full (outside the special-order cap). */
export function stormSeasonMult(n: number): number {
  return 1 + Math.min(STORM_SEASON_CAP, STORM_SEASON_STEP * Math.max(0, n));
}

/** One season of weather while the player was away. */
export interface AwayEntry { readonly id: string; readonly when: string; readonly detail?: string }

/**
 * The return summary: quiet seasons grouped, each event on its own line (up to `max` lines in all,
 * the rest folded into a count).
 */
export function awaySummary(entries: readonly AwayEntry[], max = 6): string[] {
  const quiet = entries.filter((e) => eventDef(e.id)?.tone === 'none').length;
  const evs = entries.filter((e) => { const d = eventDef(e.id); return d && d.tone !== 'none'; });
  const lines: string[] = [];
  if (quiet) lines.push(`${quiet} calm ${quiet === 1 ? 'season' : 'seasons'}`);
  const room = Math.max(0, max - lines.length);
  const shown = evs.length > room ? evs.slice(evs.length - (room - 1)) : evs;
  if (evs.length > room) lines.push(`${evs.length - shown.length} earlier events`);
  for (const e of shown) { const d = eventDef(e.id) as SeasonEventDef; lines.push(`${d.name}, ${e.when}${e.detail ? `: ${e.detail}` : ''}`); }
  return lines;
}
