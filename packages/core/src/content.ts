/**
 * Logging content as data, moved verbatim from prototype/timberline.html (tech plan M2).
 * The prototype reads these through window.Core; edit them here, then run
 * `pnpm run core:inline` to regenerate the bundled region in the prototype.
 * (Logging content moves on to packages/skills/logging in M4.)
 */
import { deepFreeze } from './freeze';

export type Stage = 'fell' | 'buck' | 'skid' | 'haul';
export type Season = 'Spring' | 'Summer' | 'Fall' | 'Winter';
export type SlopeId = 'flat' | 'rolling' | 'steep';
export type SpeciesId = 'pine' | 'spruce' | 'hemlock' | 'maple' | 'oak' | 'cloudwood';
export type Rarity = 'common' | 'rare' | 'legendary' | 'curse';
/** Keys a perk or improvement can multiply (read by the prototype's umult/pmult). */
export type MultKey = Stage | 'all' | 'value' | 'click' | 'hand' | 'upkeep' | 'scale' | 'price' | 'stump';

/**
 * A tree species. `wt` is the skid and haul weight (idle skidding and hauling
 * move bd ft ÷ weight; pine = 1). Species rules for the mini-games, grounds and
 * seasonal traits live in species.ts (docs/design/species-overhaul.md).
 */
export interface SpeciesDef { readonly name: string; readonly hp: number; readonly bf: number; readonly saw: number; readonly sawP: number; readonly pulpP: number; readonly shape: 'con' | 'dec'; readonly wt: number }
export interface EraDef { readonly name: string; readonly year: number; readonly cost: number; readonly blurb?: string }
export interface StageDef { readonly id: Stage; readonly name: string; readonly verb: string; readonly unit: string }
export interface PileDef { readonly id: 'stems' | 'cut' | 'landing'; readonly label: string }
export interface EquipmentDef { readonly id: string; readonly stage: Stage; readonly era: number; readonly name: string; readonly desc: string; readonly rate: number; readonly cost: number; readonly up: number }
export interface ImprovementDef { readonly id: string; readonly era: number; readonly name: string; readonly desc: string; readonly cost: number; readonly mult: Readonly<Partial<Record<MultKey, number>>>; readonly game?: string }
/** An improvement unlocks when the sum of these run stats reaches the target. */
export interface StatRequirement { readonly text: string; readonly stats: readonly string[]; readonly target: number }
export interface SlopeDef { readonly label: string; readonly skid: number; readonly disc: number }
export interface PerkDef { readonly id: string; readonly r: Rarity; readonly name: string; readonly desc: string; readonly m?: Readonly<Partial<Record<MultKey, number>>>; readonly set?: number;
  /** Offered only when the run allows at least this many active charter orders. */
  readonly cap?: number }
export interface RarityDef { readonly w: number; readonly label: string }
export interface MetaNodeDef { readonly id: string; readonly cost: number; readonly name: string; readonly desc: string;
  /** A board node that must be owned first (the next tier of a branch). */
  readonly req?: string }
export interface RunModDef { readonly id: string; readonly name: string; readonly desc: string; readonly x: number }

// Species overhaul slice 1: the Cove trio made distinct (spruce and hemlock restatted, weights added).
// Maple, oak and cloudwood keep their old stats, and weight 1, until slice 3 (spec weights 1.35, 1.6, 1.4 arrive with
// their other trade-offs); cloudwood stays near 4.8× pine (owner, 2026-10-25).
export const SPECIES: Readonly<Record<SpeciesId, SpeciesDef>> = deepFreeze({
  pine:      {name:'Pine',      hp:20, bf:200, saw:.75, sawP:.25, pulpP:.06, shape:'con', wt:1},
  spruce:    {name:'Spruce',      hp:14, bf:180, saw:.45, sawP:.24, pulpP:.09, shape:'con', wt:.8},
  hemlock:   {name:'Hemlock',      hp:16, bf:240, saw:.45, sawP:.20, pulpP:.08, shape:'con', wt:1.1},
  maple:     {name:'Maple',      hp:28, bf:260, saw:.55, sawP:.42, pulpP:.05, shape:'dec', wt:1},
  oak:       {name:'Oak',     hp:32, bf:300, saw:.60, sawP:.52, pulpP:.05, shape:'dec', wt:1},
  cloudwood: {name:'Redwood',    hp:30, bf:280, saw:.70, sawP:1.40, pulpP:.04, shape:'dec', wt:1},
});

export const ERAS: readonly EraDef[] = deepFreeze([
  {name:'Cove Landing', year:1890, cost:0},
  {name:'Steam Camp', year:1905, cost:15000, blurb:'Steam winches, steam saws and a railroad to the cove.'},
  {name:'Diesel Road', year:1950, cost:1000000, blurb:'Chainsaws, tractors and log trucks on new roads.'},
  {name:'Into the Interior', year:1990, cost:10000000, blurb:'Big machines working deep inland.'},
]);
/** Species that can appear in a generated tract, per era. */
export const ERA_SPECIES: readonly (readonly SpeciesId[])[] = deepFreeze([['pine','spruce','hemlock'],['pine','spruce','hemlock','maple'],['pine','spruce','hemlock','maple','oak'],['pine','spruce','hemlock','maple','oak','cloudwood']]);
/** Typical tree count of a tract, per era tier. */
export const TRACT_BASE: readonly number[] = deepFreeze([60, 1500, 15000, 120000]);

export const STAGES: readonly StageDef[] = deepFreeze([
  {id:'fell', name:'Fell',  verb:'Felling',  unit:'chops/s'},
  {id:'buck', name:'Buck',  verb:'Bucking',  unit:'bd ft/s'},
  {id:'skid', name:'Skid',  verb:'Skidding', unit:'bd ft/s'},
  {id:'haul', name:'Haul',  verb:'Hauling',  unit:'bd ft/s'},
]);
export const PILES: readonly PileDef[] = deepFreeze([
  {id:'stems', label:'felled trees'},
  {id:'cut', label:'logs in the woods'},
  {id:'landing', label:'logs at the landing'},
]);

export const EQUIPMENT: readonly EquipmentDef[] = deepFreeze([
  {id:'axeman',    stage:'fell', era:0, name:'Axeman',                desc:'An axe, a long day and company pay.', rate:1, cost:40, up:3},
  {id:'crosscut',  stage:'fell', era:0, name:'Saw team',              desc:'Two men on a six-foot saw.', rate:4, cost:220, up:10},
  {id:'bucker',    stage:'buck', era:0, name:'Bucker',                desc:'Cuts felled trees into logs.', rate:12, cost:60, up:3},
  {id:'oxen',      stage:'skid', era:0, name:'Ox team',               desc:'Slow and steady. Drags logs to the landing.', rate:10, cost:90, up:5},
  {id:'horses',    stage:'skid', era:0, name:'Horse team',            desc:'Faster than oxen. Eats more hay.', rate:22, cost:300, up:11},
  {id:'sled',      stage:'haul', era:0, name:'Log sled',              desc:'Hauls logs to the cove. Best on frozen roads.', rate:15, cost:70, up:4},
  {id:'wagon',     stage:'haul', era:0, name:'Log wagon',             desc:'Big wheels for the beach road.', rate:35, cost:600, up:12},
  {id:'springboard',stage:'fell',era:1, name:'Springboard fallers',   desc:'Stand on planks to cut above the thick base.', rate:15, cost:2500, up:45},
  {id:'dragsaw',   stage:'buck', era:1, name:'Steam saw',             desc:'A steam-driven saw that cuts logs.', rate:120, cost:2800, up:40},
  {id:'donkey',    stage:'skid', era:1, name:'Steam winch',           desc:'A steam engine that pulls logs in on cable.', rate:180, cost:7000, up:110},
  {id:'shay',      stage:'haul', era:1, name:'Logging train',         desc:'A small engine on the railroad to the cove.', rate:300, cost:15000, up:170},
  {id:'chainsaw',  stage:'fell', era:2, name:'Chainsaw faller',       desc:'One faller, one saw, a lot of trees.', rate:90, cost:30000, up:350},
  {id:'slasher',   stage:'buck', era:2, name:'Landing saw',           desc:'Cuts whole trunks into logs at the landing.', rate:800, cost:36000, up:320},
  {id:'crawler',   stage:'skid', era:2, name:'Crawler tractor',       desc:'Tracks and a lift for dragging logs.', rate:1100, cost:85000, up:650},
  {id:'cableskid', stage:'skid', era:2, name:'Cable skidder',         desc:'Rubber tires, quick between loads.', rate:1600, cost:140000, up:900},
  {id:'logtruck',  stage:'haul', era:2, name:'Log truck',             desc:'Hauls on company roads from deep in the fog.', rate:2000, cost:130000, up:950},
  {id:'buncher',   stage:'fell', era:3, name:'Feller buncher',        desc:'Cuts and stacks several trees at once.', rate:700, cost:600000, up:4000},
  {id:'processor', stage:'buck', era:3, name:'Processor',             desc:'Strips and cuts a trunk in seconds.', rate:7000, cost:500000, up:3200},
  {id:'grapple',   stage:'skid', era:3, name:'Grapple skidder',       desc:'Grabs a bundle of logs and goes.', rate:9000, cost:750000, up:4200},
  {id:'forwarder', stage:'skid', era:3, name:'Forwarder',             desc:'Carries logs off the ground. Easy on soil.', rate:14000, cost:1300000, up:6500},
  {id:'selfloader',stage:'haul', era:3, name:'Self-loading truck',    desc:'Loads itself at the landing.', rate:15000, cost:1200000, up:6000},
]);

export const IMPROVEMENTS: readonly ImprovementDef[] = deepFreeze([
  {id:'file',     era:0, name:'Saw file',                desc:'Your chops ×2. Felling game: wider green hinge zone.', cost:40, mult:{click:2}, game:'fell'},
  {id:'peavey',   era:0, name:'Log hooks',               desc:'Your own bucking, skidding and hauling ×2. Skid game: snags clear twice as fast.', cost:120, mult:{hand:2}, game:'skid'},
  {id:'gunstick', era:0, name:'Aiming stick',            desc:'Felling game: shows where the tree will really fall, wind included.', cost:350, mult:{}, game:'fell'},
  {id:'scalestick',era:0,name:'Measuring stick',         desc:'Bucking game: shows what each log is worth, and the marks show each cut’s grade.', cost:450, mult:{}, game:'buck'},
  {id:'swamper',  era:0, name:'Brush crew',              desc:'Skidding ×1.15. Skid game: half the stumps are gone.', cost:600, mult:{skid:1.15}, game:'skid'},
  {id:'hay',      era:0, name:'Hay on the hills',        desc:'Hauling ×1.1. Haul game: brakes ×1.6 going downhill.', cost:700, mult:{haul:1.1}, game:'haul'},
  {id:'wedges',   era:0, name:'Felling wedges',          desc:'Felling ×1.15. Felling game: a thick hinge still steers, and falls are steadier.', cost:900, mult:{fell:1.15}, game:'fell'},
  {id:'bunks',    era:0, name:'Bigger racks',            desc:'Hauling ×1.15. Haul game: load limit +4 logs.', cost:1200, mult:{haul:1.15}, game:'haul'},
  {id:'cook',     era:0, name:'Cookhouse',               desc:'Fed crews work harder. Felling and bucking ×1.25.', cost:1500, mult:{fell:1.25, buck:1.25}},
  {id:'grade',    era:0, name:'Grade rules',             desc:'Log value ×1.12. Bucking game: hints cost half as much.', cost:2500, mult:{value:1.12}, game:'buck'},
  {id:'corduroy', era:0, name:'Log roads',               desc:'Spring mud slows you half as much. Skid game: mud barely slows you. Haul game: spring limit +2 logs.', cost:4000, mult:{}, game:'skid haul'},
  {id:'icerd',    era:0, name:'Ice road sled',           desc:'Ices the road at night. Winter hauling ×1.5. Haul game: faster, surer winter runs.', cost:6000, mult:{}, game:'haul'},
  {id:'hillhitch',era:0, name:'Hill hitch',              desc:'Extra pull on climbs. Haul game: climbs pull 1.5× harder and you never drop below 7 mph.', cost:800, mult:{}, game:'haul'},
  {id:'roughlock',era:0, name:'Drag chains',             desc:'Haul game: off the gas going downhill, the rig holds itself back.', cost:1000, mult:{}, game:'haul'},
  {id:'lookout',  era:0, name:'Road lookout',            desc:'Haul game: shows the road ahead and marks where to brake.', cost:1400, mult:{}, game:'haul'},
  {id:'binders',  era:0, name:'Load chains',             desc:'Haul game: load limit +2 logs, and a runaway spills half as many.', cost:3000, mult:{}, game:'haul'},
  {id:'smith',    era:1, name:'Blacksmith',              desc:'Repairs in camp. Wages ×0.85.', cost:20000, mult:{upkeep:.85}},
  {id:'scribner', era:1, name:'Fair log scale',          desc:'A fairer count at the mill. Sale price ×1.1.', cost:35000, mult:{scale:1.1}},
  {id:'skyline',  era:1, name:'Skyline cable',           desc:'Slopes barely slow skidding. Skid game: stump hits no longer scar logs.', cost:60000, mult:{}, game:'skid'},
  {id:'radios',   era:2, name:'Two-way radios',          desc:'Every stage ×1.2. All games: speed boosts last 45 s, not 30.', cost:500000, mult:{all:1.2}, game:'fell buck skid haul'},
  {id:'airbrakes',era:2, name:'Air brakes',              desc:'Hauling ×1.2. Haul game: brakes ×2, and runaways start at a higher speed.', cost:350000, mult:{haul:1.2}, game:'haul'},
  {id:'shop',     era:2, name:'Diesel shop',             desc:'Fix engines in camp. Wages ×0.85.', cost:900000, mult:{upkeep:.85}},
  {id:'optimize', era:3, name:'Cutting computer',        desc:'Log value ×1.15. Bucking game: one button places the best cuts.', cost:5e6, mult:{value:1.15}, game:'buck'},
  {id:'gps',      era:3, name:'Harvest map',             desc:'Every stage ×1.25. Skid game: shows the best line.', cost:9e6, mult:{all:1.25}, game:'skid'},
  {id:'telematics',era:3,name:'Fleet tracking',          desc:'Catch breakdowns early. Wages ×0.8.', cost:14e6, mult:{upkeep:.8}},
  {id:'chokers',  era:0, name:'Choker chains',           desc:'Skidding ×1.1. Skid game: drag up to 5 logs.', cost:1800, mult:{skid:1.1}, game:'skid'},
  {id:'arch',     era:1, name:'Logging arch',            desc:'Skidding ×1.1. Skid game: drag up to 8 logs.', cost:45000, mult:{skid:1.1}, game:'skid'},
  {id:'bundle',   era:2, name:'Bundle lines',            desc:'Skidding ×1.1. Skid game: drag up to 12 logs.', cost:700000, mult:{skid:1.1}, game:'skid'},
]);
/** Largest skid-game turn each improvement allows (3 logs without any). */
export const SKID_TURN_RUNGS: Readonly<Record<string, number>> = deepFreeze({chokers:5, arch:8, bundle:12});

const RUNS_ANY = ['run_fell','run_buck','run_skid','run_haul'];
export const IMPROVEMENT_REQS: Readonly<Record<string, StatRequirement>> = deepFreeze({
  file: {text:'Play 1 felling game', stats:['run_fell'], target:1},
  gunstick: {text:'Play 3 felling games', stats:['run_fell'], target:3},
  wedges: {text:'Land 3 good falls', stats:['goodFell'], target:3},
  cook: {text:'Play 10 felling or bucking games', stats:['run_fell','run_buck'], target:10},
  scalestick: {text:'Play 1 bucking game', stats:['run_buck'], target:1},
  grade: {text:'Cut 3 trunks at 85% or better', stats:['buck85'], target:3},
  scribner: {text:'Cut 10 trunks at 90% or better', stats:['buck90'], target:10},
  optimize: {text:'Cut 5 trunks for full value', stats:['perfBuck'], target:5},
  peavey: {text:'Play 1 skid game', stats:['run_skid'], target:1},
  swamper: {text:'Play 3 skid games', stats:['run_skid'], target:3},
  corduroy: {text:'Play 2 skid or haul games in spring', stats:['mudRuns'], target:2},
  skyline: {text:'Make 5 clean skids', stats:['cleanSkid'], target:5},
  gps: {text:'Make 12 clean skids', stats:['cleanSkid'], target:12},
  hay: {text:'Play 1 haul game', stats:['run_haul'], target:1},
  bunks: {text:'Deliver 3 full loads, nothing lost', stats:['fullLoads'], target:3},
  icerd: {text:'Play 2 haul games in winter', stats:['winterHauls'], target:2},
  airbrakes: {text:'Make 5 clean hauls', stats:['cleanHaul'], target:5},
  hillhitch: {text:'Play 4 haul games', stats:['run_haul'], target:4},
  roughlock: {text:'Beat the target time on 2 hauls', stats:['parHaul'], target:2},
  lookout: {text:'Make 3 clean hauls', stats:['cleanHaul'], target:3},
  binders: {text:'Deliver 6 full loads, nothing lost', stats:['fullLoads'], target:6},
  smith: {text:'Play 25 mini-games', stats:RUNS_ANY, target:25},
  radios: {text:'Play 40 mini-games', stats:RUNS_ANY, target:40},
  shop: {text:'Play 60 mini-games', stats:RUNS_ANY, target:60},
  telematics: {text:'Play 100 mini-games', stats:RUNS_ANY, target:100},
  chokers: {text:'Skid 12 logs in the skid game', stats:['skidLogs'], target:12},
  arch: {text:'Skid 60 logs in the skid game', stats:['skidLogs'], target:60},
  bundle: {text:'Skid 250 logs in the skid game', stats:['skidLogs'], target:250},
});

/**
 * The crews' route: a slower idle path to the same improvements, from milestones
 * the company reaches without mini-games. The mini-game route stays faster;
 * most improvements whose only effect is inside a mini-game have no crews'
 * route; the haul-game ones all do (playtest 1).
 * `achievements` is a derived stat: the number of achievements earned. Targets rescaled for the
 * achievements rework (2026-10-28: 23 first-outpost achievements of 63), so each unlocks about when it did before.
 */
export const IMPROVEMENT_ALT_REQS: Readonly<Record<string, StatRequirement>> = deepFreeze({
  swamper: {text:'Fill 6 orders', stats:['contracts'], target:6},
  hay: {text:'Work through 3 winters', stats:['winters'], target:3},
  wedges: {text:'Finish 20 lots', stats:['tracts'], target:20},
  cook: {text:'Fill 30 orders', stats:['contracts'], target:30},
  grade: {text:'Earn 28 achievements', stats:['achievements'], target:28},
  bunks: {text:'Finish 60 lots', stats:['tracts'], target:60},
  corduroy: {text:'Work through 15 winters', stats:['winters'], target:15},
  icerd: {text:'Work through 22 winters', stats:['winters'], target:22},
  hillhitch: {text:'Work through 6 winters', stats:['winters'], target:6},
  roughlock: {text:'Fill 12 orders', stats:['contracts'], target:12},
  lookout: {text:'Earn 16 achievements', stats:['achievements'], target:16},
  binders: {text:'Finish 40 lots', stats:['tracts'], target:40},
  smith: {text:'Deliver 8 million bd ft in all', stats:['deliv'], target:8e6},
  scribner: {text:'Fill 60 orders', stats:['contracts'], target:60},
  skyline: {text:'Finish 120 lots', stats:['tracts'], target:120},
  airbrakes: {text:'Deliver 75 million bd ft in all', stats:['deliv'], target:7.5e7},
  radios: {text:'Earn 42 achievements', stats:['achievements'], target:42},
  shop: {text:'Fill 100 orders', stats:['contracts'], target:100},
  optimize: {text:'Deliver 500 million bd ft in all', stats:['deliv'], target:5e8},
  gps: {text:'Finish 400 lots', stats:['tracts'], target:400},
  telematics: {text:'Fill 250 orders', stats:['contracts'], target:250},
  chokers: {text:'Finish 40 lots', stats:['tracts'], target:40},
  arch: {text:'Deliver 25 million bd ft in all', stats:['deliv'], target:2.5e7},
  bundle: {text:'Fill 150 orders', stats:['contracts'], target:150},
});

export const SEASONS: readonly Season[] = deepFreeze(['Spring','Summer','Fall','Winter']);
/** Seconds per season. */
export const SEASON_LEN = 150;
export const SLOPES: Readonly<Record<SlopeId, SlopeDef>> = deepFreeze({flat:{label:'flat', skid:1, disc:1}, rolling:{label:'hilly', skid:.8, disc:.85}, steep:{label:'steep', skid:.55, disc:.65}});
export const PLACES: readonly string[] = deepFreeze(['Landfall Cove','Foghorn Point','Grey Wash','Charter Creek','Lantern Bluff','Drowned Inlet','Seal Rock Flats','Mistfall Ridge','Hollow Sound','Cairn Hill','Long Fog Meadow','Spar Gulch','Otter Slough','Surveyor’s Run','Whistle Pond','Glass Creek']);
export const MILLS: readonly string[] = deepFreeze(['the Cove timber merchant','the charter ship Perseverance','Landfall Pier Works','the Admiralty spar yard','Fogline Box & Crate','the Company shipwrights','Harbor Planing Mill','the Survey Office stores']);

// common = number tweaks (stack); rare/legendary = rule changes; curse = drawback with a bigger upside. set 2 needs the Old Reach hands node.
export const PERKS: readonly PerkDef[] = deepFreeze([
  {id:'sharp',    r:'common', name:'Sharp crews',        desc:'Felling ×1.25.', m:{fell:1.25}},
  {id:'buckers',  r:'common', name:'Quick buckers',      desc:'Bucking ×1.25.', m:{buck:1.25}},
  {id:'teams',    r:'common', name:'Good teams',         desc:'Skidding ×1.25.', m:{skid:1.25}},
  {id:'roadcrew', r:'common', name:'Road crew',          desc:'Hauling ×1.25.', m:{haul:1.25}},
  {id:'frugal',   r:'common', name:'Frugal cook',        desc:'Cheap meals. Wages ×0.85.', m:{upkeep:.85}},
  {id:'grader',   r:'common', name:'Sharp grader',       desc:'Log value ×1.08.', m:{value:1.08}},
  {id:'strong',   r:'common', name:'Strong back',        desc:'Your chops and hand work ×3.', m:{click:3, hand:3}},
  {id:'bargain',  r:'common', name:'Land agent',         desc:'Lots cost 15% less.', m:{stump:.85}},
  {id:'pacer',    r:'common', name:'Pace-setter',        desc:'Speed boosts last 15 s longer.'},
  {id:'widow',    r:'rare',   name:'Lucky faller',       desc:'Felling game: a split trunk has a 50% chance to fall true as a perfect fall.'},
  {id:'iceking',  r:'rare',   name:'Ice road king',      desc:'Winter roads (Winter or Early freeze): haul-game loads count double and crews haul ×1.4. Spring: runaways lose twice the logs.'},
  {id:'hotsaw',   r:'rare',   name:'Hot saw',            desc:'Felling game: you cut twice as fast (same green zone), and your fallers drop twice the trees.'},
  {id:'scaler',   r:'rare',   name:'Friendly grader',    desc:'Bucking game: 90% or better counts as 100%.'},
  {id:'four',     r:'rare',   name:'Four-log loads',     desc:'Skid game: one more log on your biggest load (4 without chokers). Slow and wide, but moves the most wood.'},
  {id:'daredevil',r:'rare',   name:'Downhill daredevil', desc:'Haul game: runaway speed +40, but a runaway spills twice the logs.'},
  {id:'overload', r:'rare',   name:'Overload artist',    desc:'Haul game: up to 4 more logs over the limit, no handling penalty, and each extra log pays +8% (not +5%).'},
  {id:'highball', r:'rare',   name:'Highballer',         desc:'Haul game: target time 10% tighter, but beating it counts twice toward your next perk.'},
  {id:'swamp',    r:'rare',   name:'Swamp boots',        desc:'Mud never slows the skid game, and idle skidding ignores spring mud and floods.'},
  {id:'neck',     r:'rare',   name:'Slow-stage boss',    desc:'Idle: your slowest stage runs ×1.35.'},
  {id:'handshake',r:'rare',   name:'Handshake deals',    desc:'Missed orders have no fine.'},
  {id:'store',    r:'rare',   name:'Company store',      desc:'Idle crews draw no pay (instead of ¼).', set:2},
  {id:'cruiser',  r:'rare',   name:'Timber cruiser',     desc:'Lots for sale have 25% more trees for the same price.', set:2},
  {id:'domino',   r:'legendary', name:'Domino fall',     desc:'Felling game: a perfect fall fells as many trees again, with a 50% chance to repeat (up to 6).'},
  {id:'greased',  r:'legendary', name:'Greased runners',  desc:'Skid game: mud speeds you up and logs slide through it. Idle: spring mud speeds skidding ×1.2.'},
  {id:'gravity',  r:'legendary', name:'Gravity road',    desc:'Haul game: braking downhill stores speed for the next climb. A full store saves a runaway load.'},
  {id:'bull',     r:'legendary', name:'Bull of the woods', desc:'Speed boosts are ×2 instead of ×1.5.'},
  {id:'golden',   r:'legendary', name:'Fog lifts',       desc:'A mini-game speed boost speeds every stage at once.', set:2},
  {id:'snowball', r:'legendary', name:'Snowball camp',   desc:'Idle: each filled order speeds all crews +4% for the rest of the outpost.', set:2},
  {id:'strict',   r:'curse',  name:'Strict grader',      desc:'Log value −15%, but order bonuses +40 points.', m:{value:.85}},
  {id:'scrip',    r:'curse',  name:'Company scrip',      desc:'No hire jobs unless you are out of timber and cash, but every sale pays ×1.15.', m:{price:1.15}},
  {id:'illwind',  r:'legendary', name:'Ill wind',        desc:'Bad weather speeds crews up as much as it would slow them (×0.85 becomes ×1.15). Mini-game hazards and upsides stay.'},
  {id:'stormseason', r:'curse', name:'Storm season',     desc:'Bad weather comes twice as often, even twice in a row. Each bad season you ride out adds +2% shares (up to +30%, on top of special orders).'},
  {id:'absentee', r:'curse',  name:'Absent board',       desc:'Mini-games give no speed boosts, but every crew works ×1.2.', m:{all:1.2}},
  // more charter orders at once (2026-10-26): see charter.ts for the delivery split
  {id:'clerk',    r:'rare',   name:'Extra clerk',        desc:'+1 active order this outpost.', cap:2},
  {id:'rush',     r:'rare',   name:'Rush clerk',         desc:'Orders for the same trees fill from the same logs. Each log pays one bonus.', cap:2},
  {id:'overbook', r:'curse',  name:'Overbooked',         desc:'+2 active orders, but missed tree orders cost a fine too.'},
]);
export const RARITY: Readonly<Record<Rarity, RarityDef>> = deepFreeze({common:{w:60, label:'Common'}, rare:{w:26, label:'Rare'}, legendary:{w:5, label:'Legendary'}, curse:{w:9, label:'Curse'}});

export const META: readonly MetaNodeDef[] = deepFreeze([
  {id:'cash',    cost:4,  name:'Starting cash',     desc:'Start each outpost with $750.'},
  {id:'sled',    cost:5,  name:'First crew',        desc:'Start each outpost with an axeman, a bucker, an ox team and a log sled.'},
  {id:'pace',    cost:6,  name:'Camp fiddler',      desc:'Speed boosts last 10 s longer.'},
  {id:'reroll',  cost:8,  name:'Lucky compass',     desc:'+1 reroll each outpost.'},
  {id:'foremen', cost:8,  name:'Good foremen',      desc:'Every crew and machine works ×1.2.'},
  {id:'steam',   cost:8,  name:'Steam surveyor',    desc:'Steam Camp costs 20% less.'},
  {id:'starter', cost:10,  name:'Camp stories',      desc:'Start each outpost with a random common perk.'},
  {id:'nest',    cost:12,  name:'Nest egg',          desc:'Keep 10% of your cash when you close camp.'},
  {id:'legacy',  cost:14, name:'Chronicler',        desc:'Shares from closing camp +15%.'},
  {id:'lore',    cost:14, name:'Old hands',         desc:'Four more rare and legendary perks can show up.'},
  {id:'gas',     cost:12, name:'Diesel dealer',     desc:'Diesel Road costs 25% less.'},
  {id:'four',    cost:20, name:'Wider choice',      desc:'Perk picks show 4 cards instead of 3.'},
  {id:'almanac', cost:8,  name:'Weather almanac',   desc:'See next season’s weather a season early.'},
  {id:'signals', cost:12, name:'Storm signals',     desc:'A mast on Foghorn Point: bad weather comes 30% less often (calm seasons instead).'},
  {id:'clerks',  cost:10, name:'Second clerk',      desc:'+1 active order.'},
  {id:'office',  cost:18, name:'Charter office',    desc:'+1 more active order.', req:'clerks'},
]);

/** Charter clauses: optional hard modifiers that multiply Charter Shares. */
export const MODS: readonly RunModDef[] = deepFreeze([
  {id:'drought', name:'Dry summer', desc:'Felling −10%, and dry spells are 3× as likely each summer.', x:1.25},
  {id:'market',  name:'Dividends due', desc:'Investors take a cut: every sale pays 15% less.', x:1.3},
  {id:'beetle',  name:'Thin survey',  desc:'Lots for sale have 20% fewer trees.', x:1.2},
]);
/** Board feet an outpost must deliver before it can close camp without reaching Steam Camp. */
export const CLOSE_VOL = 250000;
