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
export type SpeciesId = 'pine' | 'spruce' | 'hemlock' | 'maple' | 'oak' | 'walnut';
export type Rarity = 'common' | 'rare' | 'legendary' | 'curse';
/** Keys a perk or improvement can multiply (read by the prototype's umult/pmult). */
export type MultKey = Stage | 'all' | 'value' | 'click' | 'hand' | 'upkeep' | 'scale' | 'price' | 'stump';

export interface SpeciesDef { readonly name: string; readonly hp: number; readonly bf: number; readonly saw: number; readonly sawP: number; readonly pulpP: number; readonly shape: 'con' | 'dec' }
export interface EraDef { readonly name: string; readonly year: number; readonly cost: number; readonly blurb?: string }
export interface StageDef { readonly id: Stage; readonly name: string; readonly verb: string; readonly unit: string }
export interface PileDef { readonly id: 'stems' | 'cut' | 'landing'; readonly label: string }
export interface EquipmentDef { readonly id: string; readonly stage: Stage; readonly era: number; readonly name: string; readonly desc: string; readonly rate: number; readonly cost: number; readonly up: number }
export interface ImprovementDef { readonly id: string; readonly era: number; readonly name: string; readonly desc: string; readonly cost: number; readonly mult: Readonly<Partial<Record<MultKey, number>>>; readonly game?: string }
/** An improvement unlocks when the sum of these run stats reaches the target. */
export interface StatRequirement { readonly text: string; readonly stats: readonly string[]; readonly target: number }
export interface SlopeDef { readonly label: string; readonly skid: number; readonly disc: number }
export interface PerkDef { readonly id: string; readonly r: Rarity; readonly name: string; readonly desc: string; readonly m?: Readonly<Partial<Record<MultKey, number>>>; readonly set?: number }
export interface RarityDef { readonly w: number; readonly label: string }
export interface MetaNodeDef { readonly id: string; readonly cost: number; readonly name: string; readonly desc: string }
export interface RunModDef { readonly id: string; readonly name: string; readonly desc: string; readonly x: number }

export const SPECIES: Readonly<Record<SpeciesId, SpeciesDef>> = deepFreeze({
  pine:    {name:'Fogbound pine',      hp:20, bf:200, saw:.75, sawP:.25, pulpP:.06, shape:'con'},
  spruce:  {name:'Shore spruce',       hp:16, bf:160, saw:.60, sawP:.23, pulpP:.07, shape:'con'},
  hemlock: {name:'Mist hemlock',       hp:22, bf:220, saw:.50, sawP:.18, pulpP:.06, shape:'con'},
  maple:   {name:'Glacier maple',      hp:28, bf:260, saw:.55, sawP:.42, pulpP:.05, shape:'dec'},
  oak:     {name:'Hot-spring oak',     hp:32, bf:300, saw:.60, sawP:.52, pulpP:.05, shape:'dec'},
  walnut:  {name:'Giant cloudwood',    hp:30, bf:280, saw:.70, sawP:1.40, pulpP:.04, shape:'dec'},
});

export const ERAS: readonly EraDef[] = deepFreeze([
  {name:'Cove Landing', year:1890, cost:0},
  {name:'Steam Camp', year:1905, cost:15000, blurb:'Steam donkeys, drag saws and a logging railroad up from the cove.'},
  {name:'Diesel Road', year:1950, cost:1000000, blurb:'Chainsaws, crawler tractors and log trucks on roads pushed into the fog.'},
  {name:'Into the Interior', year:1990, cost:10000000, blurb:'Feller bunchers, processors and forwarders working the deep Interior.'},
]);
/** Species that can appear in a generated tract, per era. */
export const ERA_SPECIES: readonly (readonly SpeciesId[])[] = deepFreeze([['pine','spruce','hemlock'],['pine','spruce','hemlock','maple'],['pine','spruce','hemlock','maple','oak'],['pine','spruce','hemlock','maple','oak','walnut']]);
/** Typical tree count of a tract, per era tier. */
export const TRACT_BASE: readonly number[] = deepFreeze([60, 1500, 15000, 120000]);

export const STAGES: readonly StageDef[] = deepFreeze([
  {id:'fell', name:'Fell',  verb:'Felling',  unit:'chops/s'},
  {id:'buck', name:'Buck',  verb:'Bucking',  unit:'bd ft/s'},
  {id:'skid', name:'Skid',  verb:'Skidding', unit:'bd ft/s'},
  {id:'haul', name:'Haul',  verb:'Hauling',  unit:'bd ft/s'},
]);
export const PILES: readonly PileDef[] = deepFreeze([
  {id:'stems', label:'stems on the ground'},
  {id:'cut', label:'logs at the stump'},
  {id:'landing', label:'logs at the landing'},
]);

export const EQUIPMENT: readonly EquipmentDef[] = deepFreeze([
  {id:'axeman',    stage:'fell', era:0, name:'Axeman',                desc:'Double-bit axe, company issue, and a long day.', rate:1, cost:40, up:3},
  {id:'crosscut',  stage:'fell', era:0, name:'Crosscut sawyers',      desc:'Two men on a six-foot felling saw, shipped out in oiled canvas.', rate:4, cost:220, up:10},
  {id:'bucker',    stage:'buck', era:0, name:'Bucker',                desc:'Limbs stems and saws them to log lengths in the fog.', rate:12, cost:60, up:3},
  {id:'oxen',      stage:'skid', era:0, name:'Ox team',               desc:'Landed off the first ship. Slow and steady to the landing.', rate:10, cost:90, up:5},
  {id:'horses',    stage:'skid', era:0, name:'Horse team',            desc:'Faster than oxen. Eats more of the ship’s hay.', rate:22, cost:300, up:11},
  {id:'sled',      stage:'haul', era:0, name:'Logging sled',          desc:'Landing to the cove mill. Best on frozen roads.', rate:15, cost:70, up:4},
  {id:'wagon',     stage:'haul', era:0, name:'Log wagon and teamster',desc:'Big wheels for the beach road.', rate:35, cost:600, up:12},
  {id:'springboard',stage:'fell',era:1, name:'Springboard fallers',   desc:'Cut above the butt swell of the big coast trees from notched planks.', rate:15, cost:2500, up:45},
  {id:'dragsaw',   stage:'buck', era:1, name:'Steam drag saw',        desc:'A reciprocating saw driven by steam.', rate:120, cost:2800, up:40},
  {id:'donkey',    stage:'skid', era:1, name:'Steam donkey',          desc:'Winch engine that yards logs on cable.', rate:180, cost:7000, up:110},
  {id:'shay',      stage:'haul', era:1, name:'Shay locomotive',       desc:'Geared engine on the company railroad down to the cove.', rate:300, cost:15000, up:170},
  {id:'chainsaw',  stage:'fell', era:2, name:'Chainsaw faller',       desc:'One faller, one saw, a lot of trees.', rate:90, cost:30000, up:350},
  {id:'slasher',   stage:'buck', era:2, name:'Slasher saw deck',      desc:'Bucks whole stems at the landing.', rate:800, cost:36000, up:320},
  {id:'crawler',   stage:'skid', era:2, name:'Crawler tractor',       desc:'Tracks and an arch for dragging logs.', rate:1100, cost:85000, up:650},
  {id:'cableskid', stage:'skid', era:2, name:'Cable skidder',         desc:'Rubber-tired and quick between turns.', rate:1600, cost:140000, up:900},
  {id:'logtruck',  stage:'haul', era:2, name:'Log truck',             desc:'Hauls down company roads from deep in the fog.', rate:2000, cost:130000, up:950},
  {id:'buncher',   stage:'fell', era:3, name:'Feller buncher',        desc:'Cuts and stacks several stems at a time.', rate:700, cost:600000, up:4000},
  {id:'processor', stage:'buck', era:3, name:'Processor',             desc:'Delimbs and bucks a stem in seconds.', rate:7000, cost:500000, up:3200},
  {id:'grapple',   stage:'skid', era:3, name:'Grapple skidder',       desc:'Grabs a bunched turn and goes.', rate:9000, cost:750000, up:4200},
  {id:'forwarder', stage:'skid', era:3, name:'Forwarder',             desc:'Carries logs clear of the ground. Easy on soil.', rate:14000, cost:1300000, up:6500},
  {id:'selfloader',stage:'haul', era:3, name:'Self-loading truck',    desc:'Loads itself at the landing.', rate:15000, cost:1200000, up:6000},
]);

export const IMPROVEMENTS: readonly ImprovementDef[] = deepFreeze([
  {id:'file',     era:0, name:'Mill file',               desc:'Keep an edge on the axe. Your chop ×2. Felling game: wider green hinge zone.', cost:40, mult:{click:2}, game:'fell'},
  {id:'peavey',   era:0, name:'Peaveys and cant hooks',  desc:'Your own bucking, skidding and hauling ×2. Skid game: hang-ups free up in half the time.', cost:120, mult:{hand:2}, game:'skid'},
  {id:'gunstick', era:0, name:'Gunning stick',           desc:'Felling game: shows where the tree will really fall, wind included.', cost:350, mult:{}, game:'fell'},
  {id:'scalestick',era:0,name:'Scaler’s stick',          desc:'Bucking game: see what each log is worth as you plan the cuts, and the length marks show the grade each cut would make.', cost:450, mult:{}, game:'buck'},
  {id:'swamper',  era:0, name:'Swamping crew',           desc:'Clears brush and stumps from skid trails. Skidding ×1.15. Skid game: half the stumps are gone.', cost:600, mult:{skid:1.15}, game:'skid'},
  {id:'hay',      era:0, name:'Hay on the hills',        desc:'Sled tenders spread ship’s hay on downgrades. Hauling ×1.1. Haul game: brakes ×1.6 going downhill.', cost:700, mult:{haul:1.1}, game:'haul'},
  {id:'wedges',   era:0, name:'Felling wedges',          desc:'Drive the tree over the hinge. Felling ×1.15. Felling game: a thick hinge no longer sits back, and falls are steadier.', cost:900, mult:{fell:1.15}, game:'fell'},
  {id:'bunks',    era:0, name:'Bigger bunks',            desc:'Longer, wider log bunks. Hauling ×1.15. Haul game: road limit +4 logs.', cost:1200, mult:{haul:1.15}, game:'haul'},
  {id:'cook',     era:0, name:'Camp cookhouse',          desc:'Fed crews work harder. Felling and bucking ×1.25.', cost:1500, mult:{fell:1.25, buck:1.25}},
  {id:'grade',    era:0, name:'Bucking for grade',       desc:'Cut lengths to the mill’s grade rules. Log value ×1.12. Bucking game: Suggest a cut costs half as much.', cost:2500, mult:{value:1.12}, game:'buck'},
  {id:'corduroy', era:0, name:'Corduroy roads',          desc:'Log-paved roads. Spring mud costs you half as much. Skid game: mud barely slows you. Haul game: spring road limit +2 logs.', cost:4000, mult:{}, game:'skid haul'},
  {id:'icerd',    era:0, name:'Road sprinkler sled',     desc:'Ice the haul road at night. Winter hauling ×1.5. Haul game: faster, surer winter runs.', cost:6000, mult:{}, game:'haul'},
  {id:'hillhitch',era:0, name:'Hill hitch',              desc:'A spare team waits at the foot of every climb (later rigs get low gearing). Haul game: climbs pull 1.5× harder and the rig never crawls below 7 mph.', cost:800, mult:{}, game:'haul'},
  {id:'roughlock',era:0, name:'Rough-lock chains',       desc:'Chains under the runners drag on downgrades (later rigs get engine brakes). Haul game: off the gas on a downgrade, the rig holds itself back.', cost:1000, mult:{}, game:'haul'},
  {id:'lookout',  era:0, name:'Road lookout',            desc:'A lookout on the ridge flags the road ahead. Haul game: shows the grade coming up and marks where to brake.', cost:1400, mult:{}, game:'haul'},
  {id:'binders',  era:0, name:'Load binders',            desc:'Chains and binders cinch the load down. Haul game: road limit +2 logs, and a runaway spills half as many.', cost:3000, mult:{}, game:'haul'},
  {id:'smith',    era:1, name:'Camp blacksmith',         desc:'Repairs done in camp. Upkeep ×0.85.', cost:20000, mult:{upkeep:.85}},
  {id:'scribner', era:1, name:'Scribner log rule',       desc:'A fairer scale at the mill. Sale price ×1.1.', cost:35000, mult:{scale:1.1}},
  {id:'skyline',  era:1, name:'Skyline yarding',         desc:'Overhead cable reaches steep ground. Slope barely slows skidding. Skid game: logs ride above stumps, so hits no longer scar them.', cost:60000, mult:{}, game:'skid'},
  {id:'radios',   era:2, name:'Two-way radios',          desc:'Crews coordinate across the site. Every stage ×1.2. All games: pace boosts last 45 s instead of 30.', cost:500000, mult:{all:1.2}, game:'fell buck skid haul'},
  {id:'airbrakes',era:2, name:'Air brakes',              desc:'Hauling ×1.2. Haul game: brakes ×2, and the load holds to a higher speed before it runs away.', cost:350000, mult:{haul:1.2}, game:'haul'},
  {id:'shop',     era:2, name:'Diesel shop',             desc:'Rebuild engines in-house. Upkeep ×0.85.', cost:900000, mult:{upkeep:.85}},
  {id:'optimize', era:3, name:'Cut-to-length optimizer', desc:'Computer bucking for value. Log value ×1.15. Bucking game: one button places the best cuts.', cost:5e6, mult:{value:1.15}, game:'buck'},
  {id:'gps',      era:3, name:'Survey-grid harvest plan', desc:'Charted skid trails and haul routes. Every stage ×1.25. Skid game: shows the ideal line.', cost:9e6, mult:{all:1.25}, game:'skid'},
  {id:'telematics',era:3,name:'Fleet telematics',        desc:'Catch breakdowns early. Upkeep ×0.8.', cost:14e6, mult:{upkeep:.8}},
  {id:'chokers',  era:0, name:'Choker chains',           desc:'Wire chokers hook more logs to one turn. Skidding ×1.1. Skid game: turns of up to 5 logs.', cost:1800, mult:{skid:1.1}, game:'skid'},
  {id:'arch',     era:1, name:'Logging arch',            desc:'A wheeled arch lifts the log ends clear of the ground. Skidding ×1.1. Skid game: turns of up to 8 logs.', cost:45000, mult:{skid:1.1}, game:'skid'},
  {id:'bundle',   era:2, name:'Bundle yarding',          desc:'Whole bundles go out on one line. Skidding ×1.1. Skid game: log trains of up to 12 logs.', cost:700000, mult:{skid:1.1}, game:'skid'},
]);
/** Largest skid-game turn each improvement allows (3 logs without any). */
export const SKID_TURN_RUNGS: Readonly<Record<string, number>> = deepFreeze({chokers:5, arch:8, bundle:12});

const RUNS_ANY = ['run_fell','run_buck','run_skid','run_haul'];
export const IMPROVEMENT_REQS: Readonly<Record<string, StatRequirement>> = deepFreeze({
  file: {text:'Finish 1 felling run', stats:['run_fell'], target:1},
  gunstick: {text:'Finish 3 felling runs', stats:['run_fell'], target:3},
  wedges: {text:'Land 3 falls in the opening', stats:['goodFell'], target:3},
  cook: {text:'Finish 10 felling or bucking runs', stats:['run_fell','run_buck'], target:10},
  scalestick: {text:'Finish 1 bucking run', stats:['run_buck'], target:1},
  grade: {text:'Buck 3 stems at 85% of best value or better', stats:['buck85'], target:3},
  scribner: {text:'Buck 10 stems at 90% of best value or better', stats:['buck90'], target:10},
  optimize: {text:'Buck 5 stems for full value', stats:['perfBuck'], target:5},
  peavey: {text:'Finish 1 skidding run', stats:['run_skid'], target:1},
  swamper: {text:'Finish 3 skidding runs', stats:['run_skid'], target:3},
  corduroy: {text:'Finish 2 skidding or hauling runs in spring mud', stats:['mudRuns'], target:2},
  skyline: {text:'Skid 5 clean turns', stats:['cleanSkid'], target:5},
  gps: {text:'Skid 12 clean turns', stats:['cleanSkid'], target:12},
  hay: {text:'Finish 1 hauling run', stats:['run_haul'], target:1},
  bunks: {text:'Deliver 3 full loads without losing a log', stats:['fullLoads'], target:3},
  icerd: {text:'Finish 2 hauling runs in winter', stats:['winterHauls'], target:2},
  airbrakes: {text:'Make 5 clean hauls', stats:['cleanHaul'], target:5},
  hillhitch: {text:'Finish 4 hauling runs', stats:['run_haul'], target:4},
  roughlock: {text:'Beat par on 2 hauls', stats:['parHaul'], target:2},
  lookout: {text:'Make 3 clean hauls', stats:['cleanHaul'], target:3},
  binders: {text:'Deliver 6 full loads without losing a log', stats:['fullLoads'], target:6},
  smith: {text:'Finish 25 runs of any job', stats:RUNS_ANY, target:25},
  radios: {text:'Finish 40 runs of any job', stats:RUNS_ANY, target:40},
  shop: {text:'Finish 60 runs of any job', stats:RUNS_ANY, target:60},
  telematics: {text:'Finish 100 runs of any job', stats:RUNS_ANY, target:100},
  chokers: {text:'Skid 12 logs in skid-game turns', stats:['skidLogs'], target:12},
  arch: {text:'Skid 60 logs in skid-game turns', stats:['skidLogs'], target:60},
  bundle: {text:'Skid 250 logs in skid-game turns', stats:['skidLogs'], target:250},
});

/**
 * The crews' route: a slower idle path to the same improvements, from milestones
 * the company reaches without mini-games. The mini-game route stays faster;
 * most improvements whose only effect is inside a mini-game have no crews'
 * route; the haul-game ones all do (playtest 1).
 * `achievements` is a derived stat: the number of achievements earned.
 */
export const IMPROVEMENT_ALT_REQS: Readonly<Record<string, StatRequirement>> = deepFreeze({
  swamper: {text:'Fill 6 charter orders', stats:['contracts'], target:6},
  hay: {text:'Work through 3 winters', stats:['winters'], target:3},
  wedges: {text:'Finish 20 tracts', stats:['tracts'], target:20},
  cook: {text:'Fill 30 charter orders', stats:['contracts'], target:30},
  grade: {text:'Earn 36 achievements', stats:['achievements'], target:36},
  bunks: {text:'Finish 60 tracts', stats:['tracts'], target:60},
  corduroy: {text:'Work through 15 winters', stats:['winters'], target:15},
  icerd: {text:'Work through 22 winters', stats:['winters'], target:22},
  hillhitch: {text:'Work through 6 winters', stats:['winters'], target:6},
  roughlock: {text:'Fill 12 charter orders', stats:['contracts'], target:12},
  lookout: {text:'Earn 24 achievements', stats:['achievements'], target:24},
  binders: {text:'Finish 40 tracts', stats:['tracts'], target:40},
  smith: {text:'Deliver 8 million bd ft in all', stats:['deliv'], target:8e6},
  scribner: {text:'Fill 60 charter orders', stats:['contracts'], target:60},
  skyline: {text:'Finish 120 tracts', stats:['tracts'], target:120},
  airbrakes: {text:'Deliver 75 million bd ft in all', stats:['deliv'], target:7.5e7},
  radios: {text:'Earn 46 achievements', stats:['achievements'], target:46},
  shop: {text:'Fill 100 charter orders', stats:['contracts'], target:100},
  optimize: {text:'Deliver 500 million bd ft in all', stats:['deliv'], target:5e8},
  gps: {text:'Finish 400 tracts', stats:['tracts'], target:400},
  telematics: {text:'Fill 250 charter orders', stats:['contracts'], target:250},
  chokers: {text:'Finish 40 tracts', stats:['tracts'], target:40},
  arch: {text:'Deliver 25 million bd ft in all', stats:['deliv'], target:2.5e7},
  bundle: {text:'Fill 150 charter orders', stats:['contracts'], target:150},
});

export const SEASONS: readonly Season[] = deepFreeze(['Spring','Summer','Fall','Winter']);
/** Seconds per season. */
export const SEASON_LEN = 150;
export const SLOPES: Readonly<Record<SlopeId, SlopeDef>> = deepFreeze({flat:{label:'flat', skid:1, disc:1}, rolling:{label:'rolling', skid:.8, disc:.85}, steep:{label:'steep', skid:.55, disc:.65}});
export const PLACES: readonly string[] = deepFreeze(['Landfall Cove','Foghorn Point','Grey Wash','Charter Creek','Lantern Bluff','Drowned Inlet','Seal Rock Flats','Mistfall Ridge','Hollow Sound','Cairn Hill','Long Fog Meadow','Spar Gulch','Otter Slough','Surveyor’s Run','Whistle Pond','Glass Creek']);
export const MILLS: readonly string[] = deepFreeze(['the Cove Sawmill','the charter ship Perseverance','Landfall Pier Works','the Admiralty spar yard','Fogline Box & Crate','the Company shipwrights','Harbor Planing Mill','the Survey Office stores']);

// common = number tweaks (stack); rare/legendary = rule changes; curse = drawback with a bigger upside. set 2 needs the Old Reach hands node.
export const PERKS: readonly PerkDef[] = deepFreeze([
  {id:'sharp',    r:'common', name:'Sharp crews',        desc:'Felling ×1.25.', m:{fell:1.25}},
  {id:'buckers',  r:'common', name:'Quick buckers',      desc:'Bucking ×1.25.', m:{buck:1.25}},
  {id:'teams',    r:'common', name:'Good teamsters',     desc:'Skidding ×1.25.', m:{skid:1.25}},
  {id:'roadcrew', r:'common', name:'Road crew',          desc:'Hauling ×1.25.', m:{haul:1.25}},
  {id:'frugal',   r:'common', name:'Frugal cook',        desc:'Ship’s biscuit stretches further. Upkeep ×0.85.', m:{upkeep:.85}},
  {id:'grader',   r:'common', name:'Sharp-eyed grader',  desc:'Log value ×1.08.', m:{value:1.08}},
  {id:'strong',   r:'common', name:'Strong back',        desc:'Your chops and hand work ×3.', m:{click:3, hand:3}},
  {id:'bargain',  r:'common', name:'Friendly land agent', desc:'Cutting rights at the land office cost 15% less.', m:{stump:.85}},
  {id:'pacer',    r:'common', name:'Pace-setter',        desc:'Pace boosts last 15 s longer.'},
  {id:'widow',    r:'rare',   name:'Widowmaker’s luck',  desc:'Felling game: a barber chair has a 50% chance to swing true and count as a perfect fall.'},
  {id:'iceking',  r:'rare',   name:'Ice road king',      desc:'Winter on the Reach: haul-game loads count double and crews haul ×1.4. Spring: runaways lose twice the logs.'},
  {id:'hotsaw',   r:'rare',   name:'Hot saw',            desc:'Felling game: the back cut saws twice as fast (same green zone), and your fallers drop twice the trees behind you.'},
  {id:'scaler',   r:'rare',   name:'Scaler’s friend',    desc:'Bucking game: any score of 90% or better is scaled as 100%.'},
  {id:'four',     r:'rare',   name:'Four-log turns',     desc:'Skid game: one more log on your biggest turn (4 logs without chokers). Slow and wide, but it moves the most wood.'},
  {id:'daredevil',r:'rare',   name:'Downhill daredevil', desc:'Haul game: runaway speed +40, but a runaway spills twice the logs.'},
  {id:'overload', r:'rare',   name:'Overload artist',    desc:'Haul game: load 4 more logs over the road limit, an overweight rig handles like a legal one, and each extra log pays +8% instead of +5%.'},
  {id:'highball', r:'rare',   name:'Highballer',         desc:'Haul game: par is 10% tighter, but a haul under par counts as two runs toward your next draft.'},
  {id:'swamp',    r:'rare',   name:'Swamp boots',        desc:'Mud never slows the skid game, and idle skidding ignores spring mud.'},
  {id:'neck',     r:'rare',   name:'Bottleneck boss',    desc:'Idle: whichever stage is the bottleneck runs ×1.35.'},
  {id:'handshake',r:'rare',   name:'Handshake deals',    desc:'Missed charter orders carry no penalty.'},
  {id:'store',    r:'rare',   name:'Company store',      desc:'Crews with nothing to do draw no pay at all (instead of ¼).', set:2},
  {id:'cruiser',  r:'rare',   name:'Timber cruiser',     desc:'Land office listings carry 25% more trees for the same price.', set:2},
  {id:'domino',   r:'legendary', name:'Domino fall',     desc:'Felling game: a perfect fall also fells as many trees again, and has a 50% chance to chain again (up to 6).'},
  {id:'greased',  r:'legendary', name:'Greased runners',  desc:'Skid game: mud speeds the team up instead of slowing it, and logs slide through it. Idle: spring mud speeds skidding ×1.2 instead of slowing it.'},
  {id:'gravity',  r:'legendary', name:'Gravity road',    desc:'Haul game: speed you brake off on downgrades is stored and pushes you up the next climb. A full store rides out a runaway instead of spilling logs.'},
  {id:'bull',     r:'legendary', name:'Bull of the woods', desc:'Pace boosts are ×2 instead of ×1.5.'},
  {id:'golden',   r:'legendary', name:'Fog lifts',       desc:'Any pace boost from a mini-game boosts every stage at once.', set:2},
  {id:'snowball', r:'legendary', name:'Snowball camp',   desc:'Idle: every filled charter order speeds all crews +4% for the rest of the outpost.', set:2},
  {id:'strict',   r:'curse',  name:'Strict scaler',      desc:'Log value −15%, but charter order premiums +40 points.', m:{value:.85}},
  {id:'scrip',    r:'curse',  name:'Company scrip',      desc:'No cut-for-hire jobs unless you are out of timber and cash, but every sale pays ×1.15.', m:{price:1.15}},
  {id:'absentee', r:'curse',  name:'Absentee directors', desc:'The board runs things from home. Mini-games never grant pace boosts, but every crew works ×1.2.', m:{all:1.2}},
]);
export const RARITY: Readonly<Record<Rarity, RarityDef>> = deepFreeze({common:{w:60, label:'Common'}, rare:{w:26, label:'Rare'}, legendary:{w:5, label:'Legendary'}, curse:{w:9, label:'Curse'}});

export const META: readonly MetaNodeDef[] = deepFreeze([
  {id:'cash',    cost:4,  name:'Board advance',     desc:'Start each outpost with $750.'},
  {id:'sled',    cost:5,  name:'Crew on the first boat', desc:'Start each outpost with an axeman, a bucker, an ox team and a logging sled.'},
  {id:'pace',    cost:6,  name:'Camp fiddler',      desc:'Pace boosts last 10 s longer.'},
  {id:'reroll',  cost:8,  name:'Lucky compass',     desc:'+1 draft reroll each outpost.'},
  {id:'foremen', cost:8,  name:'Seasoned foremen',  desc:'Every crew and machine works ×1.2.'},
  {id:'steam',   cost:8,  name:'Steam surveyor',    desc:'Reaching Steam Camp costs 20% less.'},
  {id:'starter', cost:10,  name:'Camp stories',      desc:'Start each outpost with a random common perk.'},
  {id:'nest',    cost:12,  name:'Nest egg',          desc:'Keep 10% of your cash when you close camp.'},
  {id:'legacy',  cost:14, name:'Company chronicler', desc:'Charter Shares from closing camp +15%.'},
  {id:'lore',    cost:14, name:'Old Reach hands',   desc:'Four more rare and legendary perks join the draft pool.'},
  {id:'gas',     cost:12, name:'Diesel dealer',     desc:'Reaching Diesel Road costs 25% less.'},
  {id:'four',    cost:20, name:'Wider choice',      desc:'Drafts show 4 perks instead of 3.'},
]);

/** Charter clauses: optional hard modifiers that multiply Charter Shares. */
export const MODS: readonly RunModDef[] = deepFreeze([
  {id:'drought', name:'Dry summer', desc:'Felling −10%, and summer slash fires can burn stems on the ground.', x:1.25},
  {id:'market',  name:'Dividends due', desc:'Investors back home take their cut. Every sale pays 15% less.', x:1.3},
  {id:'beetle',  name:'Thin survey',  desc:'Land office listings carry 20% fewer trees.', x:1.2},
]);
/** Board feet an outpost must deliver before it can close camp without reaching Steam Camp. */
export const CLOSE_VOL = 250000;
