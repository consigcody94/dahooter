/**
 * Curated tool catalog: one MCP tool per RimBridge RPC, with a typed schema derived from the
 * RPC's own parameter doc (see `[Rpc(name, doc)]` in the mod source). Tool name = rimworld_<group>_<name>.
 *
 * Groups "dev" (cheats, mark the game "assisted") and "engine" (reflection into live objects)
 * are only registered when enabled by the operator.
 */

import { z } from "zod";

export type Group = "game" | "state" | "map" | "ui" | "defs" | "anchor" | "engine" | "dev" | "bridge";

export interface Annotations {
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
}

export interface ToolSpec {
  method: string;
  group: Group;
  title: string;
  description: string;
  input: z.ZodRawShape;
  annotations: Annotations;
}

// ---- shared param shapes -------------------------------------------------------------------

const int = z.number().int();
export const cell = z.tuple([int, int]).describe("[x, z] cell; x grows right, z grows up");
export const rect = z.tuple([int, int, int, int]).describe("[minX, minZ, w, h]");
/** Many params accept a cell, a thing id ("Steel2851"), a pawn name, or an anchor grammar string ("bedroom2:NW"). */
export const location = z.union([cell, z.string()]).describe("[x,z], a thing id, a pawn name, or an anchor name like 'bedroom2' / 'bedroom2:NW' / 'Campfire39256 +E2'");
export const locationRect = z.union([rect, z.string()]).describe("[minX,minZ,w,h] or an anchor/room name");
const cells = z.array(cell).describe("list of [x,z] cells");
const ids = z.array(z.string()).describe("thing ids like 'Steel2851' or 'Human102'");
const pawn = z.string().describe("pawn name or id, e.g. 'Sparky' or 'Human102'");
const thing = z.string().describe("thing id, e.g. 'Campfire2977'");
const rot = z.enum(["N", "E", "S", "W"]).describe("rotation for beds, tables, doors");

const RO: Annotations = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
const WRITE: Annotations = { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false };
const WRITE_IDEMP: Annotations = { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false };
const DESTRUCTIVE: Annotations = { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false };

function t(method: string, title: string, description: string, input: z.ZodRawShape, annotations: Annotations): ToolSpec {
  return { method, group: method.split(".")[0] as Group, title, description, input, annotations };
}

// ---- game --------------------------------------------------------------------------------

const game: ToolSpec[] = [
  t("game.status", "Game status",
    "Whether a game is running and the clock. Returns {state: menu|playing|loading, tick, day, hour, date, season, speed, paused, map_size, colonists, storyteller, difficulty, seed, assisted, dev_mode, god_mode, seq}. seq is the event-ledger head; pass it to rimworld_events later. Call this first in every session.",
    {}, RO),
  t("game.speed", "Set game speed",
    "Set time speed: 0 pause, 1 normal, 2 fast, 3 superfast, 4 ultrafast (dev). Prefer rimworld_wait to advance time by a known amount and come back paused.",
    { speed: int.min(0).max(4).describe("0 pause, 1 normal, 2 fast, 3 superfast, 4 ultrafast") }, WRITE_IDEMP),
  t("game.pause", "Pause or unpause",
    "Pause (true) or resume (false) the game.",
    { paused: z.boolean().default(true) }, WRITE_IDEMP),
  t("game.save", "Save game", "Save the current game under a name.", { name: z.string().min(1) }, WRITE),
  t("game.list_saves", "List saves", "List saved games: [{name, modified}].", {}, RO),
  t("game.load", "Load save",
    "Load a saved game (asynchronous). Poll rimworld_game_status until state is 'playing'.",
    { name: z.string().min(1) }, DESTRUCTIVE),
  t("game.new_game", "New game",
    "Start a fresh colony (asynchronous; poll rimworld_game_status until 'playing'). Defaults: Crashlanded, Cassandra, Rough, 250x250 map.",
    {
      scenario: z.string().optional().describe("ScenarioDef, e.g. Crashlanded, TribalStart, RichExplorer"),
      storyteller: z.string().optional().describe("StorytellerDef, e.g. Cassandra, Phoebe, Randy"),
      difficulty: z.string().optional().describe("DifficultyDef, e.g. Peaceful, Easy, Medium, Rough, Hard, Losing, Custom"),
      seed: z.string().optional(),
      map_size: int.min(200).max(300).optional(),
      permadeath: z.boolean().optional(),
    }, DESTRUCTIVE),
  t("game.quit_to_menu", "Quit to menu", "Leave the current game and return to the main menu (unsaved progress is lost).", {}, DESTRUCTIVE),
  t("game.dev_mode", "Dev mode", "Toggle RimWorld development mode and optionally god mode.",
    { enabled: z.boolean().default(true), god: z.boolean().optional() }, WRITE_IDEMP),
  t("game.log_tail", "Tail Player.log", "Last lines of Player.log (macOS path in the current mod build).",
    { lines: int.min(1).max(2000).optional(), filter: z.string().optional() }, RO),
  t("bridge.methods", "List bridge methods", "List every RPC the running RimBridge exposes, with docs. Use with rimworld_rpc for methods that have no dedicated tool.", {}, RO),
];

// ---- state -------------------------------------------------------------------------------

const state: ToolSpec[] = [
  t("state.summary", "Colony summary",
    "START HERE each turn. Colony overview: date, colonists (id, name, pos, mood, job, top skills, drafted, health), wealth, food_days, mood_avg, threats, alerts, pending_letters, research, zones, blueprints, designations, power, key_stocks, home_center, biome, season, growing_now; plus one block per loaded add-on.",
    {}, RO),
  t("state.alerts", "Alerts", "Active alert-bar entries with explanations.", {}, RO),
  t("state.areas", "Areas", "Allowed areas (Home, animal pens, custom).", {}, RO),
  t("state.base", "Base as objects",
    "The base as rooms (role, size, free floor, doors and where they lead, contents with ids and interaction cells, problems: unroofed/no door/dark/cold), structures outside rooms, anchors, trapped colonists. Use this instead of grids to reason about the base.",
    { verbose: z.boolean().optional() }, RO),
  t("state.bills", "Bills on a work table", "Bills on a work table.", { thing }, RO),
  t("state.designations", "Designations", "Designations on the map grouped by def with counts and sample cells.",
    { def: z.string().optional().describe("Mine|CutPlant|HarvestPlant|Hunt|Haul|Deconstruct|...") }, RO),
  t("state.dialogs", "Open dialogs", "Open modal windows with their text and choices. These pause the game until answered with rimworld_ui_dialog.", {}, RO),
  t("state.factions", "Factions", "All factions with relations.", {}, RO),
  t("state.letters", "Letters", "Letters waiting on screen, with id and choices where applicable. Answer with rimworld_ui_letter.", {}, RO),
  t("state.pawn", "Pawn detail",
    "Full pawn detail: skills, traits, health, needs, mood thoughts, gear, work priorities, schedule, policies, relations.",
    { pawn }, RO),
  t("state.pawns", "List pawns", "List pawns (brief).",
    { filter: z.enum(["colonists", "prisoners", "animals", "hostiles", "wild", "all"]).optional().describe("default colonists") }, RO),
  t("state.policies", "Policies", "Apparel/food/drug/reading policies available.", {}, RO),
  t("state.power", "Power nets",
    "Power nets with generation, consumption, storage and members, plus every UNPOWERED consumer with the nearest conduit or transmitter cell. Read this when anything electrical is not working.",
    {}, RO),
  t("state.quests", "Quests", "Active and available quests.", {}, RO),
  t("state.research", "Research", "Current project, available projects (with prerequisites met), finished count.", {}, RO),
  t("state.rooms", "Rooms", "Rooms with role, cells, stats (impressiveness, beauty, cleanliness, temperature).", {}, RO),
  t("state.stocks", "Stocks",
    "Counted resources on the map (stored + loose, unforbidden), grouped by defName. Loose items in the wild that are forbidden are NOT counted; use rimworld_map_find for those.",
    { category: z.string().optional().describe("Foods|Manufactured|ResourcesRaw|Medicine|Weapons|Apparel|..."), min: int.optional().describe("minimum count to include") }, RO),
  t("state.storage", "Storage", "All stockpiles and shelves with priority and allowed-categories summary.", {}, RO),
  t("state.threats", "Threats", "Hostile pawns/things on the map with positions, weapons and distance to home, plus storyteller threat points.", {}, RO),
  t("state.work_matrix", "Work matrix",
    "Every colonist x every work type: current priority, relevant skill level and passion, disabled flags. The raw material for a priority plan.",
    {}, RO),
];

// ---- map ---------------------------------------------------------------------------------

const map: ToolSpec[] = [
  t("map.cell", "Inspect cell", "Everything at a cell: terrain, fertility, roof, zone, room, things, fogged, walkable.", { cell }, RO),
  t("map.detail", "Building camera (ASCII)",
    "Zoomed ASCII view where every column is numbered and each building type gets its own letter (UPPER = built, lower = blueprint/frame); '*' interaction spots that must stay clear, '+' doors, '_' stockpile, ',' growing zone, 'i' items, '@' colonists, '!' hostiles, '^' rock, '~' water, '.' open ground. Returns legend + things in view with id/rot/size. Use before and after placing anything.",
    { x: int.optional(), z: int.optional(), around: location.optional().describe("centre on a thing id, pawn, anchor or Room:N"), w: int.min(4).max(60).optional().describe("default 24"), h: int.min(4).max(60).optional().describe("default 24"), roof: z.boolean().optional(), mark: cells.optional().describe("cells to highlight with X in the view") }, RO),
  t("map.find", "Find things",
    "Find things on the map, sorted by distance from 'near' (default home). Use kind for common searches (item, tree, resource_rock, animal, corpse, chunk, building, blueprint, harvestable), def for a specific ThingDef, forbidden=true to list crash-pod loot nobody will haul.",
    {
      def: z.string().optional(), category: z.string().optional().describe("ThingCategoryDef"), group: z.string().optional().describe("ThingRequestGroup"),
      kind: z.enum(["resource_rock", "tree", "harvestable", "corpse", "chunk", "animal", "item", "building", "blueprint"]).optional(),
      near: location.optional(), radius: int.positive().optional(), reachable_from: pawn.optional(), forbidden: z.boolean().optional(),
      faction: z.enum(["player", "hostile", "none", "any"]).optional(), limit: int.min(1).max(500).optional().describe("default 50"),
    }, RO),
  t("map.open_rects", "Find open rectangles",
    "Free rectangles of buildable standable ground with no buildings or blueprints; returns min corners sorted by distance from 'near'. Use to site stockpiles, rooms and fields.",
    { w: int.positive(), h: int.positive(), near: location.optional(), radius: int.positive().optional().describe("default 40"), limit: int.min(1).max(50).optional().describe("default 8"), allow_trees: z.boolean().optional() }, RO),
  t("map.overview", "Whole-map overview", "Coarse whole-map picture, one char per block (majority feature).", { blocks: int.min(10).max(200).optional().describe("default 50") }, RO),
  t("map.path", "Path cost", "Path cost/length between two points, optionally for a specific pawn.",
    { from: location, to: location, pawn: pawn.optional() }, RO),
  t("map.power", "Electrical camera (ASCII)",
    "'=' conduit, G generator, B battery, C powered consumer, X UNPOWERED consumer, digits = net id under a transmitter, '+' door, '#' wall. Use before and after wiring.",
    { x: int.optional(), z: int.optional(), around: location.optional(), w: int.min(4).max(100).optional().describe("default 30"), h: int.min(4).max(100).optional().describe("default 30") }, RO),
  t("map.reachable", "Reachability", "Can the pawn reach the target?",
    { pawn, target: location, danger: z.enum(["Some", "Deadly", "None"]).optional() }, RO),
  t("map.survey", "Token-efficient survey",
    "Whole-map (or region) survey scaled to a character budget: grid plus lists of buildings, blueprints, zones, roof, pawns, items, designations, home. Good first look at an unfamiliar map.",
    {
      rect: locationRect.optional(), x: int.optional(), z: int.optional(), w: int.optional(), h: int.optional(), center: z.boolean().optional(),
      around: location.optional(), scale: int.min(1).max(20).optional().describe("cells per glyph; auto fits ~64 columns"),
      budget: int.min(500).max(20000).optional().describe("default 6000 chars"), format: z.enum(["auto", "rle", "rows"]).optional(),
      only: z.array(z.enum(["grid", "buildings", "blueprints", "zones", "roof", "pawns", "items", "designations", "home"])).optional(),
      trees: z.boolean().optional(), power: z.boolean().optional(), xray: z.boolean().optional().describe("see through fog; marks the game assisted"),
    }, RO),
  t("map.terrain_stats", "Terrain stats", "Counts of fertile soil, water, rock, ore (by type), trees, geysers etc. within a radius of a point (default: home, radius 50).",
    { near: location.optional(), radius: int.min(1).max(250).optional().describe("default 50") }, RO),
  t("map.view", "ASCII map view",
    "One char per cell. x,z = min corner unless center=true (default: centred on home, 60x40, max 150x150). Legend: ? fog | @ colonist | ! hostile | a colony animal | w wild animal | n other pawn | # wall | + door | ^ rock | o ore | b bed | t work table | s stove/campfire | r research | g power | % turret | x other building | p blueprint/frame | S stockpile | G growing zone | ~ water | T tree | , plant/crop | i item | * fire | f fertile soil | : sand/gravel | - floor/road | . ground. layer=roof: R thick rock, r thin, c constructed. Top row is max z.",
    { x: int.optional(), z: int.optional(), w: int.min(4).max(150).optional(), h: int.min(4).max(150).optional(), layer: z.enum(["all", "terrain", "buildings", "zones", "pawns", "items", "roof", "fog", "home"]).optional(), center: z.boolean().optional() }, RO),
];

// ---- ui ----------------------------------------------------------------------------------

const ui: ToolSpec[] = [
  t("ui.add_bill", "Add bill",
    "Add a crafting/cooking bill to a work table (campfire, stove, bench). Get recipe defNames from rimworld_defs_get(def=<table def>).",
    { thing: thing.describe("work table id, e.g. 'Campfire2977'"), recipe: z.string().describe("RecipeDef, e.g. CookMealSimple"), mode: z.enum(["RepeatCount", "TargetCount", "Forever"]).optional(), count: int.min(1).optional(), radius: int.optional(), suspended: z.boolean().optional(), first: z.boolean().optional() }, WRITE),
  t("ui.animal", "Animal training/master", "Set animal training and master.",
    { pawn, train: z.record(z.string(), z.boolean()).optional().describe("{TrainableDef: bool}"), master: z.string().optional().describe("colonist or 'none'"), follow_field: z.boolean().optional(), follow_draft: z.boolean().optional() }, WRITE),
  t("ui.area", "Edit areas", "Edit the home area or allowed areas.",
    { action: z.enum(["home_add", "home_remove", "create", "delete", "add", "remove"]), label: z.string().optional(), cell: cell.optional(), cells: cells.optional(), rect: locationRect.optional() }, WRITE),
  t("ui.attack", "Attack order", "Drafted attack order on a target (drafts the pawn if needed).",
    { pawn, target: thing.describe("hostile thing/pawn id"), melee: z.boolean().optional() }, WRITE),
  t("ui.bill", "Modify bill", "Modify a bill on a work table: delete, suspend, resume, move to top, or set count/mode/radius.",
    { thing, id: z.string().optional(), index: int.optional(), action: z.enum(["delete", "suspend", "resume", "top", "set"]), count: int.optional(), mode: z.enum(["RepeatCount", "TargetCount", "Forever"]).optional(), radius: int.optional() }, DESTRUCTIVE),
  t("ui.build", "Place blueprints",
    "Place blueprints for a buildable ThingDef or TerrainDef at a cell, along a line, or over a rect (outline by default, fill=true for floors/areas). stuff is REQUIRED for anything made of a material (Wall, Door, Bed...): omit it once to get the options with on-map quantities. dry_run=true returns placed/failed/cost/work without placing. Returns placed and failed cells with reasons.",
    { def: z.string().describe("buildable defName, e.g. Wall, Door, Bed, Campfire, WoodPlankFloor"), at: location.optional(), rot: rot.optional(), stuff: z.string().optional().describe("material ThingDef, e.g. WoodLog, BlocksGranite, Steel"), line: z.tuple([cell, cell]).optional(), rect: locationRect.optional(), fill: z.boolean().optional(), dry_run: z.boolean().optional() }, WRITE),
  t("ui.build_many", "Place a layout", "Place a whole layout in one call: ops is a list of rimworld_ui_build parameter objects. Returns one result per op.",
    { ops: z.array(z.record(z.string(), z.unknown())).min(1), stop_on_error: z.boolean().optional() }, WRITE),
  t("ui.cancel_job", "Cancel job", "Interrupt the pawn's current job.", { pawn }, WRITE),
  t("ui.designate", "Designate work",
    "Apply an orders/architect designator to cells, a rect, or things: mine, cut, harvest, harvestwood, hunt, haul, deconstruct, cancel, uninstall, tame, slaughter, strip, open, smooth, removefloor, claim, forbid, unforbid, plan, unplan (or any Designator_ClassName). This queues work for the whole colony.",
    { designator: z.string(), cell: cell.optional(), cells: cells.optional(), rect: locationRect.optional(), things: ids.optional() }, DESTRUCTIVE),
  t("ui.dialog", "Answer dialog", "Answer any open window listed by rimworld_state_dialogs: choose a button, name things, assign ritual roles, trade, or close.",
    { i: int.optional().describe("window index, default topmost"), choice: z.union([z.string(), int]).optional(), name: z.string().optional(), second_name: z.string().optional(), assign: z.record(z.string(), z.string()).optional().describe("{role: pawn} for rituals"), trade: z.record(z.string(), int).optional().describe("{def or i: +buy/-sell}"), method: z.string().optional(), action: z.string().optional(), set: z.record(z.string(), z.unknown()).optional(), close: z.boolean().optional() }, WRITE),
  t("ui.draft", "Draft/undraft", "Draft (true) or undraft (false) a colonist. Drafted pawns do not eat, sleep or work.", { pawn, drafted: z.boolean() }, WRITE_IDEMP),
  t("ui.gizmos", "List gizmos", "Buttons shown for a selected thing/pawn: [{i, label, desc, type, disabled, reason, active?}]. Press one with rimworld_ui_press.", { thing }, RO),
  t("ui.goto", "Move pawn", "Move a pawn to a cell (drafts first unless draft=false).", { pawn, cell: location, draft: z.boolean().optional() }, WRITE),
  t("ui.job", "Give job directly", "Last resort: give a pawn a JobDef directly (Ingest, Equip, Wear, TakeInventory, HaulToCell, Rescue, TendPatient, LayDown, Research...). Bypasses the game's checks; prefer rimworld_ui_order.",
    { pawn, job: z.string(), target: location.optional(), target_b: location.optional(), target_c: location.optional(), count: int.optional(), queue: z.boolean().optional() }, WRITE),
  t("ui.letter", "Answer letter", "Respond to a letter (quest offers, events with choices): choose an option or dismiss.",
    { id: z.string(), action: z.enum(["choose", "dismiss"]), choice: z.union([z.string(), int]).optional() }, WRITE),
  t("ui.order", "Right-click order", "Execute one of the right-click orders a pawn gets at a cell or thing (label substring match, or i by index). Check rimworld_ui_orders_at first.",
    { pawn, at: location, label: z.string().optional(), i: int.optional() }, WRITE),
  t("ui.orders_at", "List right-click orders", "The right-click orders this pawn would get at that cell/thing: [{label, disabled, priority}]. A disabled entry tells you why.", { pawn, at: location }, RO),
  t("ui.press", "Press gizmo", "Press a gizmo by label (substring, case-insensitive) or index; targeted gizmos need target.",
    { thing, label: z.string().optional(), i: int.optional(), target: location.optional() }, WRITE),
  t("ui.prisoner", "Prisoner interaction", "Set prisoner interaction mode and medical care.",
    { pawn, mode: z.string().optional().describe("NoInteraction|MaintainOnly|ReduceResistance|AttemptRecruit|Release|Execution|Enslave|Convert|...") }, WRITE),
  t("ui.select", "Select in UI", "Select a thing in the game UI and jump the player's camera there (for the human watching).", { thing: thing.optional(), cell: cell.optional() }, WRITE_IDEMP),
  t("ui.set_policies", "Set pawn policies", "Set apparel/food/drug/reading policy, allowed area, medical care, hostility response and self-tend for a pawn.",
    { pawn, apparel: z.string().optional(), food: z.string().optional(), drug: z.string().optional(), reading: z.string().optional(), area: z.string().optional().describe("area label or Unrestricted"), medical: z.enum(["NoCare", "NoMeds", "HerbalOrWorse", "NormalOrWorse", "Best"]).optional(), hostility: z.enum(["Flee", "Attack", "Ignore"]).optional(), self_tend: z.boolean().optional() }, WRITE_IDEMP),
  t("ui.set_research", "Set research", "Set the current research project by defName (see rimworld_state_research).", { def: z.string() }, WRITE_IDEMP),
  t("ui.set_schedule", "Set schedule", "Set a pawn's 24-hour schedule: string of 24 chars, hour 0 first, A=Anything S=Sleep W=Work J=Joy M=Meditate.",
    { pawn, hours: z.string().length(24).regex(/^[ASWJM]{24}$/) }, WRITE_IDEMP),
  t("ui.set_work", "Set work priorities", "Set work priorities for one pawn: {WorkTypeDef: 0-4}, 1 highest, 4 lowest, 0 disabled. Enables manual priorities. Work type names from rimworld_defs_work_types.",
    { pawn, priorities: z.record(z.string(), int.min(0).max(4)) }, WRITE_IDEMP),
  t("ui.set_work_many", "Set many work priorities", "Set priorities for several colonists in one call: {pawn: {WorkType: 0-4}}.",
    { matrix: z.record(z.string(), z.record(z.string(), int.min(0).max(4))) }, WRITE_IDEMP),
  t("ui.storage", "Storage settings", "Edit a stockpile's or shelf's priority and allowed things/categories.",
    { zone: z.string().optional(), thing: thing.optional(), priority: z.enum(["Low", "Normal", "Preferred", "Important", "Critical"]).optional(), allow_all: z.boolean().optional(), disallow_all: z.boolean().optional(), allow: z.array(z.string()).optional(), disallow: z.array(z.string()).optional() }, WRITE_IDEMP),
  t("ui.wire", "Lay conduit", "Lay power-conduit blueprints along a walkable path between two points (conduits go under walls/doors). Returns the path and cells that could not take a conduit.",
    { from: location, to: location, dry_run: z.boolean().optional() }, WRITE),
  t("ui.zone", "Create/edit zone", "Create or edit stockpile and growing zones.",
    { action: z.enum(["create_stockpile", "create_growing", "delete", "add_cells", "remove_cells", "set_plant", "rename", "set_priority"]), label: z.string().optional().describe("zone to act on (existing zones) or the name for a new zone"), new_label: z.string().optional().describe("for action=rename"), cell: cell.optional(), cells: cells.optional(), rect: locationRect.optional(), plant: z.string().optional().describe("ThingDef, e.g. Plant_Rice"), priority: z.enum(["Low", "Normal", "Preferred", "Important", "Critical"]).optional(), preset: z.enum(["DefaultStockpile", "DumpingStockpile"]).optional() }, DESTRUCTIVE),
];

// ---- defs / anchor -------------------------------------------------------------------------

const defs: ToolSpec[] = [
  t("defs.buildable", "Buildable now", "Everything the player can build right now (research done) with costs, by category.",
    { category: z.string().optional().describe("Structure|Production|Furniture|Power|Security|Misc|Floors|...") }, RO),
  t("defs.get", "Def info", "Rich def info: costs, stats, recipes, research, what it unlocks. Type is auto-detected when omitted.",
    { def: z.string(), type: z.string().optional().describe("ThingDef|RecipeDef|ResearchProjectDef|..."), depth: int.min(0).max(4).optional() }, RO),
  t("defs.search", "Search defs", "Search defs by defName/label substring.",
    { query: z.string().min(1), type: z.string().optional(), limit: int.min(1).max(200).optional() }, RO),
  t("defs.work_types", "Work types", "All work types in priority order with what they cover.", {}, RO),
];

const anchor: ToolSpec[] = [
  t("anchor.set", "Name a place", "Name a cell, rect or thing; every location parameter then accepts the name ('bedroom2', 'bedroom2:NW', 'bedroom2:extend:E:4', 'bedroom2 +N2'). Saved with the game.",
    { name: z.string().min(1), cell: location.optional(), rect: locationRect.optional(), thing: thing.optional() }, WRITE_IDEMP),
  t("anchor.list", "List anchors", "Named anchors with rects, sizes and distance/direction from home.", {}, RO),
  t("anchor.delete", "Delete anchor", "Delete a named anchor.", { name: z.string() }, DESTRUCTIVE),
];

// ---- engine (reflection, gated) -------------------------------------------------------------

const engine: ToolSpec[] = [
  t("engine.get", "Engine read", "Read any live engine value by path. Roots: Find, Current, Map, World, Game, Player, Thing:<id>, Pawn:<name|id>, Def:<DefType>:<defName>, Type:<Full.Name>, Zone:<label>, Area:<label>, Faction:<name>, Room:<id>. Segments: .member, .method(), [index|key|defName].",
    { path: z.string(), depth: int.min(0).max(5).optional() }, RO),
  t("engine.set", "Engine write", "Assign a field/property (value coerced to the member type). Can put the game in states the UI never would; prefer ui tools.", { path: z.string(), value: z.unknown() }, DESTRUCTIVE),
  t("engine.call", "Engine call", "Invoke a method; args are coerced (cells as [x,z], things by id, defs by defName, enums by name).",
    { path: z.string(), args: z.array(z.unknown()).optional(), depth: int.min(0).max(5).optional() }, DESTRUCTIVE),
  t("engine.members", "Engine members", "List fields, properties and method signatures of an object or type.", { path: z.string().optional(), type: z.string().optional() }, RO),
  t("engine.new", "Engine construct", "Construct an object with args, or with fields to fill.", { type: z.string(), args: z.array(z.unknown()).optional(), fields: z.record(z.string(), z.unknown()).optional() }, DESTRUCTIVE),
  t("engine.types", "Engine types", "Search type names in the game assembly.", { query: z.string().min(1), limit: int.min(1).max(200).optional() }, RO),
];

// ---- dev (cheats, gated) --------------------------------------------------------------------

const DEV = " CHEAT: marks the current game 'assisted' for the rest of the game.";
const dev: ToolSpec[] = [
  t("dev.damage", "Dev: damage", "Apply damage to a pawn or thing." + DEV, { pawn: pawn.optional(), thing: thing.optional(), amount: z.number().positive(), def: z.string().optional().describe("Cut|Blunt|Gunshot|Burn") }, DESTRUCTIVE),
  t("dev.destroy", "Dev: destroy", "Destroy a thing." + DEV, { thing }, DESTRUCTIVE),
  t("dev.finish_research", "Dev: finish research", "Complete a research project instantly." + DEV, { def: z.string() }, DESTRUCTIVE),
  t("dev.god_mode", "Dev: god mode", "Instant build, free everything." + DEV, { enabled: z.boolean() }, DESTRUCTIVE),
  t("dev.heal", "Dev: heal", "Remove all injuries and diseases from a pawn." + DEV, { pawn }, DESTRUCTIVE),
  t("dev.incident", "Dev: fire incident", "Fire an incident now (RaidEnemy, ColdSnap, Flashstorm, TraderCaravanArrival...)." + DEV, { def: z.string(), points: z.number().optional(), faction: z.string().optional() }, DESTRUCTIVE),
  t("dev.kill_hostiles", "Dev: kill hostiles", "Kill every hostile pawn on the map." + DEV, {}, DESTRUCTIVE),
  t("dev.reveal_map", "Dev: reveal map", "Remove fog of war." + DEV, {}, DESTRUCTIVE),
  t("dev.set_need", "Dev: set need", "Set a pawn need level 0..1 (Food, Rest, Joy, Mood...)." + DEV, { pawn, need: z.string(), level: z.number().min(0).max(1) }, DESTRUCTIVE),
  t("dev.spawn", "Dev: spawn things", "Spawn items or buildings." + DEV, { def: z.string(), cell, count: int.min(1).optional(), stuff: z.string().optional(), quality: z.string().optional().describe("Awful..Legendary") }, DESTRUCTIVE),
  t("dev.spawn_pawn", "Dev: spawn pawns", "Spawn pawns of a PawnKindDef." + DEV, { kind: z.string(), cell, faction: z.string().optional().describe("Player|<name>|none"), count: int.min(1).optional() }, DESTRUCTIVE),
  t("dev.unlock_all_research", "Dev: unlock research", "Finish every research project." + DEV, {}, DESTRUCTIVE),
  t("dev.weather", "Dev: weather", "Force weather." + DEV, { def: z.string() }, DESTRUCTIVE),
];

export const CATALOG: ToolSpec[] = [...game, ...state, ...map, ...ui, ...defs, ...anchor, ...engine, ...dev];

/** map.screenshot_bytes is covered by the rimworld_screenshot meta tool (returns an image, not base64 text). */
export const METHODS_WITHOUT_TOOLS = new Set(["map.screenshot_bytes"]);

export function toolName(method: string): string {
  return "rimworld_" + method.replace(/\./g, "_");
}

export function groupOf(method: string): string {
  return method.split(".")[0] ?? method;
}
