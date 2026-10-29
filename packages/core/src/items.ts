/**
 * The company warehouse: item definitions, Prime timber, finds (drop tables),
 * special charter orders and their bonus cap, as data plus pure helpers.
 * Spec: docs/design/prime-timber-drops-inventory.md (smallest playtest version)
 * and docs/design/sawmill-camp.md (mill goods).
 *
 * Owner ruling: the only currencies are cash and Charter Shares. Everything
 * else the player collects is an item here.
 *
 * Randomness: every roll takes an injected Rng. The prototype feeds these from
 * a separate seeded stream (`streamRng(S.rng, 'drops')`), never Math.random,
 * so the logging sim's existing draws stay byte-exact.
 */
import { deepFreeze } from './freeze';
import { TRACT_BASE, type PerkDef, type SpeciesId } from './content';
import type { Rng } from './rng';
import type { IconSpec } from './icons';

export type SkillId = 'logging' | 'sawmill';
/** Namespaced by skill: 'logging.prime_spar'. */
export type ItemId = string;
export type CurrencyId = 'cash' | 'shares.logging' | 'shares.sawmill';
export type ItemRarity = 'made' | 'common' | 'uncommon' | 'rare';
export type ItemCategory = 'prime' | 'find' | 'mill';
export type ItemUse = 'order' | 'reroll' | 'sell' | 'collection' | 'structure' | `future:${string}`;
export type GameId = 'fell' | 'buck' | 'skid' | 'haul';
/**
 * The one quality ladder for logs, boards and items (docs/design/resource-names.md §1), shown as a frame
 * color plus 0-4 diamonds: Common grey 0, Good green 1, Fine blue 2, Prime yellow 3, Rare orange 4.
 * Scrap (firewood) sits below the ladder: dashed outline, no diamonds. Display only; drop tables read `rarity`.
 */
export type Tier = 'scrap' | 'common' | 'good' | 'fine' | 'prime' | 'rare';
export const TIERS: readonly Tier[] = deepFreeze(['scrap', 'common', 'good', 'fine', 'prime', 'rare'] as Tier[]);
export const TIER_LABEL: Readonly<Record<Tier, string>> = deepFreeze({scrap:'Firewood', common:'Common', good:'Good', fine:'Fine', prime:'Prime', rare:'Rare'});
export const TIER_DIAMONDS: Readonly<Record<Tier, number>> = deepFreeze({scrap:0, common:0, good:1, fine:2, prime:3, rare:4});
/** Board grades and log grades on the ladder (ids unchanged: clear/select/common, 1/2/3/'P' where 'P' is pulp, now firewood). */
export const BOARD_TIER: Readonly<Record<'clear' | 'select' | 'common', Tier>> = deepFreeze({clear:'fine', select:'good', common:'common'} as const);
export const LOG_TIER: Readonly<Record<'1' | '2' | '3' | 'P', Tier>> = deepFreeze({'1':'fine', '2':'good', '3':'common', P:'scrap'} as const);
/** Board grade names for players (the ids stay clear/select/common): Fine, Good, Common. */
export const BOARD_LABEL: Readonly<Record<'clear' | 'select' | 'common', string>> = deepFreeze({clear:'Fine', select:'Good', common:'Common'});
/** A log grade for players: 1 Fine, 2 Good, 3 Common, 'P' firewood. */
export function logTierName(g: number | string): string { const t = LOG_TIER[String(g) as '1' | '2' | '3' | 'P']; return t ? TIER_LABEL[t] : TIER_LABEL.common; }

export interface ItemDef {
  readonly id: ItemId; readonly name: string; readonly plural: string; readonly desc: string;
  readonly skill: SkillId | 'company'; readonly category: ItemCategory; readonly rarity: ItemRarity;
  /** Cove Landing dollars; × era scale (√(TRACT_BASE[era] ÷ 60)) when sold. */
  readonly sell: number;
  readonly uses: readonly ItemUse[];
  /** Where it comes from, for the collection log. */
  readonly from: string;
  /** Display tier on the quality ladder (frame and diamonds). */
  readonly tier: Tier;
  /** Placeholder icon (packages/core/src/icons.ts); its key is the item id. */
  readonly icon: IconSpec;
}
export interface ItemStack { readonly item: ItemId; readonly qty: number }
export interface CurrencyDef { readonly id: CurrencyId; readonly name: string; readonly scope: 'outpost' | 'skill' | 'company'; readonly skill?: SkillId }

export const ITEMS: readonly ItemDef[] = deepFreeze([
  {id:'logging.prime_spar', name:'Prime log', plural:'Prime logs', skill:'logging', category:'prime', rarity:'made', sell:40,
    desc:'A perfect log, stamped Prime. Builds the mill and fills big orders.', uses:['order','structure','sell'], from:'Perfect falls (3 from a spruce) and Fine logs of 12 ft or more (14 ft on spruce); idle crews about 1 tree in 50', tier:'prime', icon:{glyph:'spar', tint:'spruce', badge:'prime'}},
  {id:'logging.burl', name:'Swirl knot', plural:'Swirl knots', skill:'logging', category:'find', rarity:'common', sell:30,
    desc:'A swirly lump of wood. Buyers pay well for it.', uses:['sell','collection','future:sawmill'], from:'Felling and bucking', tier:'common', icon:{glyph:'burl', tint:'bark'}},
  {id:'logging.amber_pitch', name:'Amber sap', plural:'Amber sap', skill:'logging', category:'find', rarity:'common', sell:12,
    desc:'Hard tree sap. Seals ship hulls and the water wheel’s dam.', uses:['order','structure','sell','future:smelting'], from:'Bucking (pine has the most)', tier:'common', icon:{glyph:'drop', tint:'amber'}},
  {id:'logging.survey_marker', name:'Restock token', plural:'Restock tokens', skill:'logging', category:'find', rarity:'uncommon', sell:18,
    desc:'A brass company token. Use one to reroll your perk cards (2 per outpost).', uses:['reroll','sell','future:surveying'], from:'Skidding', tier:'good', icon:{glyph:'marker', tint:'brass'}},
  {id:'logging.ships_fitting', name:'Shipwreck bronze', plural:'Shipwreck bronze', skill:'logging', category:'find', rarity:'uncommon', sell:22,
    desc:'Bronze parts washed ashore from a wreck. Builds the circular saw.', uses:['order','structure','sell','future:raising'], from:'Hauling (washed up by the cove road)', tier:'good', icon:{glyph:'deadeye', tint:'bronze'}},
  {id:'logging.fog_glass', name:'Fog lens', plural:'Fog lenses', skill:'logging', category:'find', rarity:'rare', sell:90,
    desc:'A smoky, sea-worn lens. Nobody knows who made it.', uses:['sell','collection','future:surveying'], from:'Top results in felling, skidding and hauling', tier:'rare', icon:{glyph:'lens', tint:'fog'}},
  {id:'sawmill.quarter_sawn', name:'Prime board', plural:'Prime boards', skill:'sawmill', category:'mill', rarity:'made', sell:25,
    desc:'The best board, from a great run on a Prime log. The Admiralty wants it for decks.', uses:['sell','future:raising'], from:'A great Saw boards run on a Prime log', tier:'prime', icon:{glyph:'board', tint:'oak', figure:'quarter', badge:'prime'}},
  {id:'sawmill.plank_bundle', name:'Plank bundle', plural:'Plank bundles', skill:'sawmill', category:'mill', rarity:'made', sell:10,
    desc:'500 wood of Common boards. Builds the bunkhouse.', uses:['structure','sell'], from:'Common boards at the Sawmill', tier:'common', icon:{glyph:'bundle', tint:'pine'}},
]);
/** Bulk stocks: counted in wood, shown in the Warehouse but not sold there. */
export interface BulkDef { readonly id: string; readonly name: string; readonly tab: 'logs' | 'boards'; readonly scope: 'company' | 'camp'; readonly tier: Tier; readonly icon: IconSpec; readonly desc: string }
export const BULK: readonly BulkDef[] = deepFreeze([
  {id:'company.logs', name:'Log pond', tab:'logs', scope:'company', tier:'common', icon:{glyph:'pile', tint:'pine'}, desc:'Logs waiting for the Sawmill. Logging fills it; the mill saws it.'},
  {id:'sawmill.lumber.clear', name:'Fine boards', tab:'boards', scope:'camp', tier:'fine', icon:{glyph:'bundle', tint:'pine', straps:false, knots:0}, desc:'No knots. Sell for 3× the log price.'},
  {id:'sawmill.lumber.select', name:'Good boards', tab:'boards', scope:'camp', tier:'good', icon:{glyph:'bundle', tint:'pine', straps:false, knots:1}, desc:'A few small knots. Sell for 2×.'},
  {id:'sawmill.lumber.common', name:'Common boards', tab:'boards', scope:'camp', tier:'common', icon:{glyph:'bundle', tint:'pine', straps:false, knots:4}, desc:'Knotty. Sell for 1×, or make plank bundles.'},
] as BulkDef[]);

const ITEM_BY_ID: ReadonlyMap<ItemId, ItemDef> = new Map(ITEMS.map((i) => [i.id, i]));
export function itemDef(id: ItemId): ItemDef | undefined { return ITEM_BY_ID.get(id); }

export const CURRENCIES: readonly CurrencyDef[] = deepFreeze([
  {id:'cash', name:'Cash', scope:'outpost'},
  {id:'shares.logging', name:'Charter Shares', scope:'skill', skill:'logging'},
  {id:'shares.sawmill', name:'Charter Shares', scope:'skill', skill:'sawmill'},
]);

/**
 * Sale price of one item at an era: base × √(TRACT_BASE[era] ÷ 60).
 * The spec's linear scale (× TRACT_BASE ÷ 60) made warehouse sales 9-45% of an
 * outpost's earnings in the sim (most sales land at Diesel Road, ×250); the
 * square root keeps them near the 5% guardrail. Balance agent to confirm.
 */
export function itemSellPrice(id: ItemId, era: number): number {
  const d = ITEM_BY_ID.get(id);
  return d ? Math.round(d.sell * Math.sqrt((TRACT_BASE[era] ?? 60) / 60)) : 0;
}

// ---------- Prime timber

/** The Prime item a species makes, how many a perfect fall stamps, and the shortest grade 1 log bucking stamps. Hardwoods come later (slice 3). */
export interface PrimeRule { readonly species: SpeciesId; readonly item: ItemId; readonly perfectFall: number; readonly buckMinLen: number }
// species overhaul slice 1: the Prime spar split 1/3/1 (spruce is the spar tree); the Cove average per perfect fall stays 1.67
export const PRIME_RULES: readonly PrimeRule[] = deepFreeze([
  {species:'pine', item:'logging.prime_spar', perfectFall:1, buckMinLen:12},
  {species:'spruce', item:'logging.prime_spar', perfectFall:3, buckMinLen:14},
  {species:'hemlock', item:'logging.prime_spar', perfectFall:1, buckMinLen:12},
]);
const PRIME_BY_SP: ReadonlyMap<SpeciesId, PrimeRule> = new Map(PRIME_RULES.map((p) => [p.species, p]));

/** Prime made by a perfect fall of this species (null when it makes none yet). */
export function primeFromFall(species: SpeciesId): ItemStack | null {
  const r = PRIME_BY_SP.get(species);
  return r ? { item: r.item, qty: r.perfectFall } : null;
}

/** Bucking score needed before grade 1 cuts are stamped Prime. */
export const BUCK_PRIME_SCORE = 0.9;
/** Shortest grade 1 sawlog that can be stamped Prime by default (spruce needs 14 ft), and the most Prime one stem gives. */
export const BUCK_PRIME_MIN_LEN = 12;
export const BUCK_PRIME_MAX = 2;

/** Prime from one bucked stem: 1 per grade 1 sawlog of the species' Prime length (12 ft; spruce 14 ft) when the score is ≥ 90%, at most 2. */
export function primeFromBuck(species: SpeciesId, segments: readonly { readonly len: number; readonly g: number | string }[], score: number): ItemStack | null {
  const r = PRIME_BY_SP.get(species);
  if (!r || score < BUCK_PRIME_SCORE) return null;
  const n = Math.min(BUCK_PRIME_MAX, segments.filter((s) => s.g === 1 && s.len >= r.buckMinLen).length);
  return n > 0 ? { item: r.item, qty: n } : null;
}

/** Chance a crew-felled tree is Prime: 2% at Cove Landing, scaled down as tracts grow so Prime per tract stays near 1.2. */
export function idlePrimeChance(era: number): number {
  return 0.02 * (TRACT_BASE[0] as number) / (TRACT_BASE[era] ?? (TRACT_BASE[0] as number));
}

/**
 * How many of `n` independent events with chance `p` happen, cheaply: exact
 * Bernoulli draws for small n, otherwise the expected count with the
 * fractional part drawn. Draws: min(n, 8) for small n, else one.
 */
export function countEvents(rng: Rng, n: number, p: number): number {
  if (n <= 0 || p <= 0) return 0;
  if (n <= 8 && Number.isInteger(n)) { let k = 0; for (let i = 0; i < n; i++) if (rng() < p) k++; return k; }
  const e = n * p, whole = Math.floor(e);
  return whole + (rng() < e - whole ? 1 : 0);
}

// ---------- finds (drop tables)

/** 0 low, 1 mid, 2 top. */
export type DropTier = 0 | 1 | 2;
export interface DropEntry { readonly item: ItemId; readonly qty: readonly [number, number]; readonly weight: number; readonly minTier: DropTier; readonly rare?: boolean }
export interface DropTable {
  readonly id: string; readonly skill: SkillId; readonly game: GameId;
  readonly baseChance: number;
  /** Drop chance multiplier by tier: low, mid, top. */
  readonly tierMult: readonly [number, number, number];
  /** Idle chance per 60 s of stage work. */
  readonly idlePerMin: number;
  /** Rare entries' weight multiplier on idle rolls. */
  readonly idleRareMult: number;
  readonly entries: readonly DropEntry[];
}
const TIER_MULT = [0.1, 0.4, 1] as const;
export const DROP_TABLES: Readonly<Record<GameId, DropTable>> = deepFreeze({
  fell: {id:'logging.fell', skill:'logging', game:'fell', baseChance:0.25, tierMult:TIER_MULT, idlePerMin:0.02, idleRareMult:0.1, entries:[
    {item:'logging.burl', qty:[1, 1], weight:50, minTier:0},
    {item:'logging.fog_glass', qty:[1, 1], weight:10, minTier:2, rare:true},
  ]},
  buck: {id:'logging.buck', skill:'logging', game:'buck', baseChance:0.35, tierMult:TIER_MULT, idlePerMin:0.06, idleRareMult:0.1, entries:[
    {item:'logging.amber_pitch', qty:[1, 1], weight:70, minTier:0},
    {item:'logging.burl', qty:[1, 1], weight:20, minTier:0},
  ]},
  skid: {id:'logging.skid', skill:'logging', game:'skid', baseChance:0.2, tierMult:TIER_MULT, idlePerMin:0.02, idleRareMult:0.1, entries:[
    {item:'logging.survey_marker', qty:[1, 1], weight:50, minTier:1},
    {item:'logging.fog_glass', qty:[1, 1], weight:10, minTier:2, rare:true},
  ]},
  haul: {id:'logging.haul', skill:'logging', game:'haul', baseChance:0.25, tierMult:TIER_MULT, idlePerMin:0.02, idleRareMult:0.1, entries:[
    {item:'logging.ships_fitting', qty:[1, 1], weight:60, minTier:1},
    {item:'logging.ships_fitting', qty:[2, 2], weight:30, minTier:2},
    {item:'logging.fog_glass', qty:[1, 1], weight:10, minTier:2, rare:true},
  ]},
});

/** Tier from a mini-game's quality q: top ≥ 0.97, mid ≥ 0.55, else low. */
export function dropTier(q: number): DropTier {
  return q >= 0.97 ? 2 : q >= 0.55 ? 1 : 0;
}

/** Weighted pick among entries; one draw. */
function pickEntry(rng: Rng, entries: readonly DropEntry[], weight: (e: DropEntry) => number): DropEntry | null {
  const tot = entries.reduce((a, e) => a + weight(e), 0);
  if (tot <= 0) return null;
  let x = rng() * tot;
  for (const e of entries) { x -= weight(e); if (x <= 0) return e; }
  return entries[entries.length - 1] ?? null;
}

/**
 * A mini-game's drop roll. Draws: the chance roll; on a hit, the entry pick.
 * Low tier rolls on entries with minTier 0 ("common"), mid on minTier ≤ 1, top on all.
 * `weightMult` favours an item (pine's pitch pockets: amber pitch ×2 in bucking).
 */
export function rollDrop(table: DropTable, tier: DropTier, rng: Rng, chanceMult = 1, weightMult: Readonly<Record<ItemId, number>> = {}): ItemStack | null {
  if (rng() >= table.baseChance * table.tierMult[tier] * chanceMult) return null;
  const e = pickEntry(rng, table.entries.filter((x) => x.minTier <= tier), (x) => x.weight * (weightMult[x.item] ?? 1));
  return e ? { item: e.item, qty: e.qty[0] } : null;
}

/**
 * An idle crew's drop roll (one per 60 s of work at half capacity or more).
 * Rolls on common and uncommon entries (minTier ≤ 1), rares at idleRareMult of
 * their weight. `weightMult` lets a perk favour one item (Pitch boiler).
 * Draws: the chance roll; on a hit, the entry pick.
 */
export function rollIdleDrop(table: DropTable, rng: Rng, chanceMult = 1, weightMult: Readonly<Record<ItemId, number>> = {}): ItemStack | null {
  if (rng() >= table.idlePerMin * chanceMult) return null;
  const pool = table.entries.filter((x) => x.minTier <= 1 || x.rare);
  const e = pickEntry(rng, pool, (x) => x.weight * (x.rare ? table.idleRareMult : 1) * (weightMult[x.item] ?? 1));
  return e ? { item: e.item, qty: e.qty[0] } : null;
}

/**
 * Seconds of stage work per idle roll. Work is time × utilisation: a stage
 * running flat out rolls every 60 s, one starved to 30% every 200 s. (The spec's
 * "at least half capacity" gate left only the bottleneck stage rolling, so
 * bucking, the only pitch source, almost never rolled; see the sim notes.)
 */
export const IDLE_DROP_SECONDS = 60;

// ---------- special charter orders

export interface SpecialOrderDef {
  readonly id: string; readonly skill: SkillId | 'company'; readonly client: string; readonly name: string; readonly short: string; readonly text: string;
  readonly needs: readonly ItemStack[];
  /** Share of this outpost's Charter Shares added at close camp (summed, capped at ORDER_BONUS_CAP). */
  readonly bonusPct: number;
  readonly rewardItems?: readonly ItemStack[];
  /** Order perk unlocked once, then offered in drafts. */
  readonly unlockPerk?: string;
  /** Items that must have been found before the order is posted. */
  readonly trigger: readonly ItemId[];
  /** Outposts it stays open, counting the one it is posted in. */
  readonly dueOutposts: number;
}
export const SPECIAL_ORDERS: readonly SpecialOrderDef[] = deepFreeze([
  {id:'admiralty_spar', skill:'logging', client:'The Admiralty', name:'Admiralty mast order', short:'Admiralty',
    text:'The Admiralty wants Prime logs for ship masts, and amber sap to seal them.',
    needs:[{item:'logging.prime_spar', qty:16}, {item:'logging.amber_pitch', qty:2}], bonusPct:0.15, unlockPerk:'sparman',
    trigger:['logging.prime_spar'], dueOutposts:2},
  {id:'caulk_perseverance', skill:'logging', client:'the captain of the Perseverance', name:'Patch the Perseverance', short:'Perseverance',
    text:'The company ship is leaking. Her captain needs amber sap and shipwreck bronze before she sails.',
    needs:[{item:'logging.amber_pitch', qty:6}, {item:'logging.ships_fitting', qty:3}], bonusPct:0.08,
    rewardItems:[{item:'logging.burl', qty:2}], unlockPerk:'pitchboiler',
    trigger:['logging.amber_pitch', 'logging.ships_fitting'], dueOutposts:2},
]);
/** Most special orders open at once. */
export const ORDER_OPEN_MAX = 2;
/** Special-order bonus cap per outpost (owner rule: the balance agent may raise it to 0.35 only if active < 1.5× casual). */
export const ORDER_BONUS_CAP = 0.25;
/** A missed order is withdrawn and posted again this many outposts after it closed. */
export const ORDER_RETURN_OUTPOSTS = 2;

/** Charter Shares multiplier from the special-order bonus filled this outpost: 1 + min(cap, sum). */
export function orderBonus(filledPct: number): number {
  return 1 + Math.min(ORDER_BONUS_CAP, Math.max(0, filledPct));
}

/** Items still needed to fill an order, given what has been handed in. */
export function orderRemaining(def: SpecialOrderDef, given: Readonly<Record<ItemId, number>>): ItemStack[] {
  return def.needs.map((n) => ({ item: n.item, qty: Math.max(0, n.qty - (given[n.item] ?? 0)) })).filter((n) => n.qty > 0);
}

/** Order perks: rare, rule-changing, offered in Logging drafts once their order is filled. */
export const ORDER_PERKS: readonly PerkDef[] = deepFreeze([
  {id:'sparman', r:'rare', name:'Prime hunter', desc:'Felling game: a good fall on pine, spruce or hemlock also gives 1 Prime log, but perfect falls give no speed boost.'},
  {id:'pitchboiler', r:'rare', name:'Sap boiler', desc:'Bucking game: each firewood piece becomes amber sap (2 at most) instead of firewood value. Idle buckers find sap 3× as often.'},
]);

// ---------- resource renames (docs/design/resource-names.md, owner 2026-10-28)

/**
 * Old player-facing names and their new ones, longest first. Ids and save keys never change; this only rewrites text a
 * save already holds (the camp log). Each rule is idempotent: new names never match an old pattern.
 */
const RENAMES: readonly (readonly [RegExp, string])[] = [
  [/Admiralty spar order/g, 'Admiralty mast order'],
  [/Prime spars/g, 'Prime logs'], [/Prime spar/g, 'Prime log'],
  [/Quarter-sawn boards/g, 'Prime boards'], [/Quarter-sawn board/g, 'Prime board'],
  [/(Ship|ship)[’']s fittings/g, 'shipwreck bronze'],
  [/Ship[’']s fitting/g, 'Shipwreck bronze'], [/ship[’']s fitting/g, 'shipwreck bronze'],
  [/Survey markers/g, 'Restock tokens'], [/Survey marker/g, 'Restock token'], [/survey markers/g, 'restock tokens'], [/survey marker/g, 'restock token'],
  [/Fog-glass/g, 'Fog lens'], [/fog-glass/g, 'fog lens'],
  [/Amber pitch/g, 'Amber sap'], [/amber pitch/g, 'amber sap'],
  [/\bBurls\b/g, 'Swirl knots'], [/\bBurl\b/g, 'Swirl knot'], [/\bburls\b/g, 'swirl knots'], [/\bburl\b/g, 'swirl knot'],
  [/Spar man/g, 'Prime hunter'], [/Pitch boiler/g, 'Sap boiler'],
  [/Mill pond & wheel/g, 'Water wheel'],
  [/\b(\d+) MBF\b/g, '$1K wood'],
  [/board feet/g, 'wood'], [/bd ft/g, 'wood'],
];
/** Old item names and "bd ft" in a line of saved text, rewritten in the new words. */
export function renameOldText(text: string): string {
  return RENAMES.reduce((t, [re, to]) => t.replace(re, to), text);
}
