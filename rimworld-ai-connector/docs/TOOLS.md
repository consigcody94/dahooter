# Tool reference

Generated from `mcp/src/catalog.ts` by `npm run tools-doc` (in `mcp/`). Do not edit by hand.

Every RimBridge RPC `group.name` is the tool `rimworld_group_name`. Groups `dev` and `engine` are hidden unless enabled (see SETUP.md).

## Meta tools (not bridge RPCs)

| Tool | Purpose |
|------|---------|
| `rimworld_bridge_status` | Health, game status, method count, group flags; discovers add-on methods as tools |
| `rimworld_events` | Read the event ledger since a sequence number (default: since last seen) |
| `rimworld_screenshot` | PNG of the map around [x,z] as an image content block |
| `rimworld_wait` | End turn: unpause at a speed, wait N in-game hours or until a wake-up event, pause, return events |
| `rimworld_rpc` | Call any bridge method by name (escape hatch) |

## game

### `rimworld_game_status` (`game.status`) [read-only]

Whether a game is running and the clock. Returns {state: menu|playing|loading, tick, day, hour, date, season, speed, paused, map_size, colonists, storyteller, difficulty, seed, assisted, dev_mode, god_mode, seq}. seq is the event-ledger head; pass it to rimworld_events later. Call this first in every session.

No parameters.

### `rimworld_game_speed` (`game.speed`)

Set time speed: 0 pause, 1 normal, 2 fast, 3 superfast, 4 ultrafast (dev). Prefer rimworld_wait to advance time by a known amount and come back paused.

Parameters (* = required): `speed`* (integer): 0 pause, 1 normal, 2 fast, 3 superfast, 4 ultrafast

### `rimworld_game_pause` (`game.pause`)

Pause (true) or resume (false) the game.

Parameters (* = required): `paused`* (boolean)

### `rimworld_game_save` (`game.save`)

Save the current game under a name.

Parameters (* = required): `name`* (string)

### `rimworld_game_list_saves` (`game.list_saves`) [read-only]

List saved games: [{name, modified}].

No parameters.

### `rimworld_game_load` (`game.load`) [destructive]

Load a saved game (asynchronous). Poll rimworld_game_status until state is 'playing'.

Parameters (* = required): `name`* (string)

### `rimworld_game_new_game` (`game.new_game`) [destructive]

Start a fresh colony (asynchronous; poll rimworld_game_status until 'playing'). Defaults: Crashlanded, Cassandra, Rough, 250x250 map.

Parameters (* = required): `scenario` (string): ScenarioDef, e.g. Crashlanded, TribalStart, RichExplorer; `storyteller` (string): StorytellerDef, e.g. Cassandra, Phoebe, Randy; `difficulty` (string): DifficultyDef, e.g. Peaceful, Easy, Medium, Rough, Hard, Losing, Custom; `seed` (string); `map_size` (integer); `permadeath` (boolean)

### `rimworld_game_quit_to_menu` (`game.quit_to_menu`) [destructive]

Leave the current game and return to the main menu (unsaved progress is lost).

No parameters.

### `rimworld_game_dev_mode` (`game.dev_mode`)

Toggle RimWorld development mode and optionally god mode.

Parameters (* = required): `enabled`* (boolean); `god` (boolean)

### `rimworld_game_log_tail` (`game.log_tail`) [read-only]

Last lines of Player.log (macOS path in the current mod build).

Parameters (* = required): `lines` (integer); `filter` (string)

## bridge

### `rimworld_bridge_methods` (`bridge.methods`) [read-only]

List every RPC the running RimBridge exposes, with docs. Use with rimworld_rpc for methods that have no dedicated tool.

No parameters.

## state

### `rimworld_state_summary` (`state.summary`) [read-only]

START HERE each turn. Colony overview: date, colonists (id, name, pos, mood, job, top skills, drafted, health), wealth, food_days, mood_avg, threats, alerts, pending_letters, research, zones, blueprints, designations, power, key_stocks, home_center, biome, season, growing_now; plus one block per loaded add-on.

No parameters.

### `rimworld_state_alerts` (`state.alerts`) [read-only]

Active alert-bar entries with explanations.

No parameters.

### `rimworld_state_areas` (`state.areas`) [read-only]

Allowed areas (Home, animal pens, custom).

No parameters.

### `rimworld_state_base` (`state.base`) [read-only]

The base as rooms (role, size, free floor, doors and where they lead, contents with ids and interaction cells, problems: unroofed/no door/dark/cold), structures outside rooms, anchors, trapped colonists. Use this instead of grids to reason about the base.

Parameters (* = required): `verbose` (boolean)

### `rimworld_state_bills` (`state.bills`) [read-only]

Bills on a work table.

Parameters (* = required): `thing`* (string): thing id, e.g. 'Campfire2977'

### `rimworld_state_designations` (`state.designations`) [read-only]

Designations on the map grouped by def with counts and sample cells.

Parameters (* = required): `def` (string): Mine|CutPlant|HarvestPlant|Hunt|Haul|Deconstruct|...

### `rimworld_state_dialogs` (`state.dialogs`) [read-only]

Open modal windows with their text and choices. These pause the game until answered with rimworld_ui_dialog.

No parameters.

### `rimworld_state_factions` (`state.factions`) [read-only]

All factions with relations.

No parameters.

### `rimworld_state_letters` (`state.letters`) [read-only]

Letters waiting on screen, with id and choices where applicable. Answer with rimworld_ui_letter.

No parameters.

### `rimworld_state_pawn` (`state.pawn`) [read-only]

Full pawn detail: skills, traits, health, needs, mood thoughts, gear, work priorities, schedule, policies, relations.

Parameters (* = required): `pawn`* (string): pawn name or id, e.g. 'Sparky' or 'Human102'

### `rimworld_state_pawns` (`state.pawns`) [read-only]

List pawns (brief).

Parameters (* = required): `filter` (colonists\|prisoners\|animals\|hostiles\|wild\|all): default colonists

### `rimworld_state_policies` (`state.policies`) [read-only]

Apparel/food/drug/reading policies available.

No parameters.

### `rimworld_state_power` (`state.power`) [read-only]

Power nets with generation, consumption, storage and members, plus every UNPOWERED consumer with the nearest conduit or transmitter cell. Read this when anything electrical is not working.

No parameters.

### `rimworld_state_quests` (`state.quests`) [read-only]

Active and available quests.

No parameters.

### `rimworld_state_research` (`state.research`) [read-only]

Current project, available projects (with prerequisites met), finished count.

No parameters.

### `rimworld_state_rooms` (`state.rooms`) [read-only]

Rooms with role, cells, stats (impressiveness, beauty, cleanliness, temperature).

No parameters.

### `rimworld_state_stocks` (`state.stocks`) [read-only]

Counted resources on the map (stored + loose, unforbidden), grouped by defName. Loose items in the wild that are forbidden are NOT counted; use rimworld_map_find for those.

Parameters (* = required): `category` (string): Foods|Manufactured|ResourcesRaw|Medicine|Weapons|Apparel|...; `min` (integer): minimum count to include

### `rimworld_state_storage` (`state.storage`) [read-only]

All stockpiles and shelves with priority and allowed-categories summary.

No parameters.

### `rimworld_state_threats` (`state.threats`) [read-only]

Hostile pawns/things on the map with positions, weapons and distance to home, plus storyteller threat points.

No parameters.

### `rimworld_state_work_matrix` (`state.work_matrix`) [read-only]

Every colonist x every work type: current priority, relevant skill level and passion, disabled flags. The raw material for a priority plan.

No parameters.

## map

### `rimworld_map_cell` (`map.cell`) [read-only]

Everything at a cell: terrain, fertility, roof, zone, room, things, fogged, walkable.

Parameters (* = required): `cell`* (array): [x, z] cell; x grows right, z grows up

### `rimworld_map_detail` (`map.detail`) [read-only]

Zoomed ASCII view where every column is numbered and each building type gets its own letter (UPPER = built, lower = blueprint/frame); '*' interaction spots that must stay clear, '+' doors, '_' stockpile, ',' growing zone, 'i' items, '@' colonists, '!' hostiles, '^' rock, '~' water, '.' open ground. Returns legend + things in view with id/rot/size. Use before and after placing anything.

Parameters (* = required): `x` (integer); `z` (integer); `around` (array or string): centre on a thing id, pawn, anchor or Room:N; `w` (integer): default 24; `h` (integer): default 24; `roof` (boolean); `mark` (array): cells to highlight with X in the view

### `rimworld_map_find` (`map.find`) [read-only]

Find things on the map, sorted by distance from 'near' (default home). Use kind for common searches (item, tree, resource_rock, animal, corpse, chunk, building, blueprint, harvestable), def for a specific ThingDef, forbidden=true to list crash-pod loot nobody will haul.

Parameters (* = required): `def` (string); `category` (string): ThingCategoryDef; `group` (string): ThingRequestGroup; `kind` (resource_rock\|tree\|harvestable\|corpse\|chunk\|animal\|item\|building\|blueprint); `near` (array or string): [x,z], a thing id, a pawn name, or an anchor name like 'bedroom2' / 'bedroom2:NW' / 'Campfire39256 +E2'; `radius` (integer); `reachable_from` (string): pawn name or id, e.g. 'Sparky' or 'Human102'; `forbidden` (boolean); `faction` (player\|hostile\|none\|any); `limit` (integer): default 50

### `rimworld_map_open_rects` (`map.open_rects`) [read-only]

Free rectangles of buildable standable ground with no buildings or blueprints; returns min corners sorted by distance from 'near'. Use to site stockpiles, rooms and fields.

Parameters (* = required): `w`* (integer); `h`* (integer); `near` (array or string): [x,z], a thing id, a pawn name, or an anchor name like 'bedroom2' / 'bedroom2:NW' / 'Campfire39256 +E2'; `radius` (integer): default 40; `limit` (integer): default 8; `allow_trees` (boolean)

### `rimworld_map_overview` (`map.overview`) [read-only]

Coarse whole-map picture, one char per block (majority feature).

Parameters (* = required): `blocks` (integer): default 50

### `rimworld_map_path` (`map.path`) [read-only]

Path cost/length between two points, optionally for a specific pawn.

Parameters (* = required): `from`* (array or string): [x,z], a thing id, a pawn name, or an anchor name like 'bedroom2' / 'bedroom2:NW' / 'Campfire39256 +E2'; `to`* (array or string): [x,z], a thing id, a pawn name, or an anchor name like 'bedroom2' / 'bedroom2:NW' / 'Campfire39256 +E2'; `pawn` (string): pawn name or id, e.g. 'Sparky' or 'Human102'

### `rimworld_map_power` (`map.power`) [read-only]

'=' conduit, G generator, B battery, C powered consumer, X UNPOWERED consumer, digits = net id under a transmitter, '+' door, '#' wall. Use before and after wiring.

Parameters (* = required): `x` (integer); `z` (integer); `around` (array or string): [x,z], a thing id, a pawn name, or an anchor name like 'bedroom2' / 'bedroom2:NW' / 'Campfire39256 +E2'; `w` (integer): default 30; `h` (integer): default 30

### `rimworld_map_reachable` (`map.reachable`) [read-only]

Can the pawn reach the target?

Parameters (* = required): `pawn`* (string): pawn name or id, e.g. 'Sparky' or 'Human102'; `target`* (array or string): [x,z], a thing id, a pawn name, or an anchor name like 'bedroom2' / 'bedroom2:NW' / 'Campfire39256 +E2'; `danger` (Some\|Deadly\|None)

### `rimworld_map_survey` (`map.survey`) [read-only]

Whole-map (or region) survey scaled to a character budget: grid plus lists of buildings, blueprints, zones, roof, pawns, items, designations, home. Good first look at an unfamiliar map.

Parameters (* = required): `rect` (array or string): [minX,minZ,w,h] or an anchor/room name; `x` (integer); `z` (integer); `w` (integer); `h` (integer); `center` (boolean); `around` (array or string): [x,z], a thing id, a pawn name, or an anchor name like 'bedroom2' / 'bedroom2:NW' / 'Campfire39256 +E2'; `scale` (integer): cells per glyph; auto fits ~64 columns; `budget` (integer): default 6000 chars; `format` (auto\|rle\|rows); `only` (array); `trees` (boolean); `power` (boolean); `xray` (boolean): see through fog; marks the game assisted

### `rimworld_map_terrain_stats` (`map.terrain_stats`) [read-only]

Counts of fertile soil, water, rock, ore (by type), trees, geysers etc. within a radius of a point (default: home, radius 50).

Parameters (* = required): `near` (array or string): [x,z], a thing id, a pawn name, or an anchor name like 'bedroom2' / 'bedroom2:NW' / 'Campfire39256 +E2'; `radius` (integer): default 50

### `rimworld_map_view` (`map.view`) [read-only]

One char per cell. x,z = min corner unless center=true (default: centred on home, 60x40, max 150x150). Legend: ? fog | @ colonist | ! hostile | a colony animal | w wild animal | n other pawn | # wall | + door | ^ rock | o ore | b bed | t work table | s stove/campfire | r research | g power | % turret | x other building | p blueprint/frame | S stockpile | G growing zone | ~ water | T tree | , plant/crop | i item | * fire | f fertile soil | : sand/gravel | - floor/road | . ground. layer=roof: R thick rock, r thin, c constructed. Top row is max z.

Parameters (* = required): `x` (integer); `z` (integer); `w` (integer); `h` (integer); `layer` (all\|terrain\|buildings\|zones\|pawns\|items\|roof\|fog\|home); `center` (boolean)

## ui

### `rimworld_ui_add_bill` (`ui.add_bill`)

Add a crafting/cooking bill to a work table (campfire, stove, bench). Get recipe defNames from rimworld_defs_get(def=<table def>).

Parameters (* = required): `thing`* (string): work table id, e.g. 'Campfire2977'; `recipe`* (string): RecipeDef, e.g. CookMealSimple; `mode` (RepeatCount\|TargetCount\|Forever); `count` (integer); `radius` (integer); `suspended` (boolean); `first` (boolean)

### `rimworld_ui_animal` (`ui.animal`)

Set animal training and master.

Parameters (* = required): `pawn`* (string): pawn name or id, e.g. 'Sparky' or 'Human102'; `train` (object): {TrainableDef: bool}; `master` (string): colonist or 'none'; `follow_field` (boolean); `follow_draft` (boolean)

### `rimworld_ui_area` (`ui.area`)

Edit the home area or allowed areas.

Parameters (* = required): `action`* (home_add\|home_remove\|create\|delete\|add\|remove); `label` (string); `cell` (array): [x, z] cell; x grows right, z grows up; `cells` (array): list of [x,z] cells; `rect` (array or string): [minX,minZ,w,h] or an anchor/room name

### `rimworld_ui_attack` (`ui.attack`)

Drafted attack order on a target (drafts the pawn if needed).

Parameters (* = required): `pawn`* (string): pawn name or id, e.g. 'Sparky' or 'Human102'; `target`* (string): hostile thing/pawn id; `melee` (boolean)

### `rimworld_ui_bill` (`ui.bill`) [destructive]

Modify a bill on a work table: delete, suspend, resume, move to top, or set count/mode/radius.

Parameters (* = required): `thing`* (string): thing id, e.g. 'Campfire2977'; `id` (string); `index` (integer); `action`* (delete\|suspend\|resume\|top\|set); `count` (integer); `mode` (RepeatCount\|TargetCount\|Forever); `radius` (integer)

### `rimworld_ui_build` (`ui.build`)

Place blueprints for a buildable ThingDef or TerrainDef at a cell, along a line, or over a rect (outline by default, fill=true for floors/areas). stuff is REQUIRED for anything made of a material (Wall, Door, Bed...): omit it once to get the options with on-map quantities. dry_run=true returns placed/failed/cost/work without placing. Returns placed and failed cells with reasons.

Parameters (* = required): `def`* (string): buildable defName, e.g. Wall, Door, Bed, Campfire, WoodPlankFloor; `at` (array or string): [x,z], a thing id, a pawn name, or an anchor name like 'bedroom2' / 'bedroom2:NW' / 'Campfire39256 +E2'; `rot` (N\|E\|S\|W): rotation for beds, tables, doors; `stuff` (string): material ThingDef, e.g. WoodLog, BlocksGranite, Steel; `line` (array); `rect` (array or string): [minX,minZ,w,h] or an anchor/room name; `fill` (boolean); `dry_run` (boolean)

### `rimworld_ui_build_many` (`ui.build_many`)

Place a whole layout in one call: ops is a list of rimworld_ui_build parameter objects. Returns one result per op.

Parameters (* = required): `ops`* (array); `stop_on_error` (boolean)

### `rimworld_ui_cancel_job` (`ui.cancel_job`)

Interrupt the pawn's current job.

Parameters (* = required): `pawn`* (string): pawn name or id, e.g. 'Sparky' or 'Human102'

### `rimworld_ui_designate` (`ui.designate`) [destructive]

Apply an orders/architect designator to cells, a rect, or things: mine, cut, harvest, harvestwood, hunt, haul, deconstruct, cancel, uninstall, tame, slaughter, strip, open, smooth, removefloor, claim, forbid, unforbid, plan, unplan (or any Designator_ClassName). This queues work for the whole colony.

Parameters (* = required): `designator`* (string); `cell` (array): [x, z] cell; x grows right, z grows up; `cells` (array): list of [x,z] cells; `rect` (array or string): [minX,minZ,w,h] or an anchor/room name; `things` (array): thing ids like 'Steel2851' or 'Human102'

### `rimworld_ui_dialog` (`ui.dialog`)

Answer any open window listed by rimworld_state_dialogs: choose a button, name things, assign ritual roles, trade, or close.

Parameters (* = required): `i` (integer): window index, default topmost; `choice` (string or integer); `name` (string); `second_name` (string); `assign` (object): {role: pawn} for rituals; `trade` (object): {def or i: +buy/-sell}; `method` (string); `action` (string); `set` (object); `close` (boolean)

### `rimworld_ui_draft` (`ui.draft`)

Draft (true) or undraft (false) a colonist. Drafted pawns do not eat, sleep or work.

Parameters (* = required): `pawn`* (string): pawn name or id, e.g. 'Sparky' or 'Human102'; `drafted`* (boolean)

### `rimworld_ui_gizmos` (`ui.gizmos`) [read-only]

Buttons shown for a selected thing/pawn: [{i, label, desc, type, disabled, reason, active?}]. Press one with rimworld_ui_press.

Parameters (* = required): `thing`* (string): thing id, e.g. 'Campfire2977'

### `rimworld_ui_goto` (`ui.goto`)

Move a pawn to a cell (drafts first unless draft=false).

Parameters (* = required): `pawn`* (string): pawn name or id, e.g. 'Sparky' or 'Human102'; `cell`* (array or string): [x,z], a thing id, a pawn name, or an anchor name like 'bedroom2' / 'bedroom2:NW' / 'Campfire39256 +E2'; `draft` (boolean)

### `rimworld_ui_job` (`ui.job`)

Last resort: give a pawn a JobDef directly (Ingest, Equip, Wear, TakeInventory, HaulToCell, Rescue, TendPatient, LayDown, Research...). Bypasses the game's checks; prefer rimworld_ui_order.

Parameters (* = required): `pawn`* (string): pawn name or id, e.g. 'Sparky' or 'Human102'; `job`* (string); `target` (array or string): [x,z], a thing id, a pawn name, or an anchor name like 'bedroom2' / 'bedroom2:NW' / 'Campfire39256 +E2'; `target_b` (array or string): [x,z], a thing id, a pawn name, or an anchor name like 'bedroom2' / 'bedroom2:NW' / 'Campfire39256 +E2'; `target_c` (array or string): [x,z], a thing id, a pawn name, or an anchor name like 'bedroom2' / 'bedroom2:NW' / 'Campfire39256 +E2'; `count` (integer); `queue` (boolean)

### `rimworld_ui_letter` (`ui.letter`)

Respond to a letter (quest offers, events with choices): choose an option or dismiss.

Parameters (* = required): `id`* (string); `action`* (choose\|dismiss); `choice` (string or integer)

### `rimworld_ui_order` (`ui.order`)

Execute one of the right-click orders a pawn gets at a cell or thing (label substring match, or i by index). Check rimworld_ui_orders_at first.

Parameters (* = required): `pawn`* (string): pawn name or id, e.g. 'Sparky' or 'Human102'; `at`* (array or string): [x,z], a thing id, a pawn name, or an anchor name like 'bedroom2' / 'bedroom2:NW' / 'Campfire39256 +E2'; `label` (string); `i` (integer)

### `rimworld_ui_orders_at` (`ui.orders_at`) [read-only]

The right-click orders this pawn would get at that cell/thing: [{label, disabled, priority}]. A disabled entry tells you why.

Parameters (* = required): `pawn`* (string): pawn name or id, e.g. 'Sparky' or 'Human102'; `at`* (array or string): [x,z], a thing id, a pawn name, or an anchor name like 'bedroom2' / 'bedroom2:NW' / 'Campfire39256 +E2'

### `rimworld_ui_press` (`ui.press`)

Press a gizmo by label (substring, case-insensitive) or index; targeted gizmos need target.

Parameters (* = required): `thing`* (string): thing id, e.g. 'Campfire2977'; `label` (string); `i` (integer); `target` (array or string): [x,z], a thing id, a pawn name, or an anchor name like 'bedroom2' / 'bedroom2:NW' / 'Campfire39256 +E2'

### `rimworld_ui_prisoner` (`ui.prisoner`)

Set prisoner interaction mode and medical care.

Parameters (* = required): `pawn`* (string): pawn name or id, e.g. 'Sparky' or 'Human102'; `mode` (string): NoInteraction|MaintainOnly|ReduceResistance|AttemptRecruit|Release|Execution|Enslave|Convert|...

### `rimworld_ui_select` (`ui.select`)

Select a thing in the game UI and jump the player's camera there (for the human watching).

Parameters (* = required): `thing` (string): thing id, e.g. 'Campfire2977'; `cell` (array): [x, z] cell; x grows right, z grows up

### `rimworld_ui_set_policies` (`ui.set_policies`)

Set apparel/food/drug/reading policy, allowed area, medical care, hostility response and self-tend for a pawn.

Parameters (* = required): `pawn`* (string): pawn name or id, e.g. 'Sparky' or 'Human102'; `apparel` (string); `food` (string); `drug` (string); `reading` (string); `area` (string): area label or Unrestricted; `medical` (NoCare\|NoMeds\|HerbalOrWorse\|NormalOrWorse\|Best); `hostility` (Flee\|Attack\|Ignore); `self_tend` (boolean)

### `rimworld_ui_set_research` (`ui.set_research`)

Set the current research project by defName (see rimworld_state_research).

Parameters (* = required): `def`* (string)

### `rimworld_ui_set_schedule` (`ui.set_schedule`)

Set a pawn's 24-hour schedule: string of 24 chars, hour 0 first, A=Anything S=Sleep W=Work J=Joy M=Meditate.

Parameters (* = required): `pawn`* (string): pawn name or id, e.g. 'Sparky' or 'Human102'; `hours`* (string)

### `rimworld_ui_set_work` (`ui.set_work`)

Set work priorities for one pawn: {WorkTypeDef: 0-4}, 1 highest, 4 lowest, 0 disabled. Enables manual priorities. Work type names from rimworld_defs_work_types.

Parameters (* = required): `pawn`* (string): pawn name or id, e.g. 'Sparky' or 'Human102'; `priorities`* (object)

### `rimworld_ui_set_work_many` (`ui.set_work_many`)

Set priorities for several colonists in one call: {pawn: {WorkType: 0-4}}.

Parameters (* = required): `matrix`* (object)

### `rimworld_ui_storage` (`ui.storage`)

Edit a stockpile's or shelf's priority and allowed things/categories.

Parameters (* = required): `zone` (string); `thing` (string): thing id, e.g. 'Campfire2977'; `priority` (Low\|Normal\|Preferred\|Important\|Critical); `allow_all` (boolean); `disallow_all` (boolean); `allow` (array); `disallow` (array)

### `rimworld_ui_wire` (`ui.wire`)

Lay power-conduit blueprints along a walkable path between two points (conduits go under walls/doors). Returns the path and cells that could not take a conduit.

Parameters (* = required): `from`* (array or string): [x,z], a thing id, a pawn name, or an anchor name like 'bedroom2' / 'bedroom2:NW' / 'Campfire39256 +E2'; `to`* (array or string): [x,z], a thing id, a pawn name, or an anchor name like 'bedroom2' / 'bedroom2:NW' / 'Campfire39256 +E2'; `dry_run` (boolean)

### `rimworld_ui_zone` (`ui.zone`) [destructive]

Create or edit stockpile and growing zones.

Parameters (* = required): `action`* (create_stockpile\|create_growing\|delete\|add_cells\|remove_cells\|set_plant\|rename\|set_priority); `label` (string): zone to act on (existing zones) or the name for a new zone; `new_label` (string): for action=rename; `cell` (array): [x, z] cell; x grows right, z grows up; `cells` (array): list of [x,z] cells; `rect` (array or string): [minX,minZ,w,h] or an anchor/room name; `plant` (string): ThingDef, e.g. Plant_Rice; `priority` (Low\|Normal\|Preferred\|Important\|Critical); `preset` (DefaultStockpile\|DumpingStockpile)

## defs

### `rimworld_defs_buildable` (`defs.buildable`) [read-only]

Everything the player can build right now (research done) with costs, by category.

Parameters (* = required): `category` (string): Structure|Production|Furniture|Power|Security|Misc|Floors|...

### `rimworld_defs_get` (`defs.get`) [read-only]

Rich def info: costs, stats, recipes, research, what it unlocks. Type is auto-detected when omitted.

Parameters (* = required): `def`* (string); `type` (string): ThingDef|RecipeDef|ResearchProjectDef|...; `depth` (integer)

### `rimworld_defs_search` (`defs.search`) [read-only]

Search defs by defName/label substring.

Parameters (* = required): `query`* (string); `type` (string); `limit` (integer)

### `rimworld_defs_work_types` (`defs.work_types`) [read-only]

All work types in priority order with what they cover.

No parameters.

## anchor

### `rimworld_anchor_set` (`anchor.set`)

Name a cell, rect or thing; every location parameter then accepts the name ('bedroom2', 'bedroom2:NW', 'bedroom2:extend:E:4', 'bedroom2 +N2'). Saved with the game.

Parameters (* = required): `name`* (string); `cell` (array or string): [x,z], a thing id, a pawn name, or an anchor name like 'bedroom2' / 'bedroom2:NW' / 'Campfire39256 +E2'; `rect` (array or string): [minX,minZ,w,h] or an anchor/room name; `thing` (string): thing id, e.g. 'Campfire2977'

### `rimworld_anchor_list` (`anchor.list`) [read-only]

Named anchors with rects, sizes and distance/direction from home.

No parameters.

### `rimworld_anchor_delete` (`anchor.delete`) [destructive]

Delete a named anchor.

Parameters (* = required): `name`* (string)

## engine

### `rimworld_engine_get` (`engine.get`) [read-only]

Read any live engine value by path. Roots: Find, Current, Map, World, Game, Player, Thing:<id>, Pawn:<name|id>, Def:<DefType>:<defName>, Type:<Full.Name>, Zone:<label>, Area:<label>, Faction:<name>, Room:<id>. Segments: .member, .method(), [index|key|defName].

Parameters (* = required): `path`* (string); `depth` (integer)

### `rimworld_engine_set` (`engine.set`) [destructive]

Assign a field/property (value coerced to the member type). Can put the game in states the UI never would; prefer ui tools.

Parameters (* = required): `path`* (string); `value`* (any)

### `rimworld_engine_call` (`engine.call`) [destructive]

Invoke a method; args are coerced (cells as [x,z], things by id, defs by defName, enums by name).

Parameters (* = required): `path`* (string); `args` (array); `depth` (integer)

### `rimworld_engine_members` (`engine.members`) [read-only]

List fields, properties and method signatures of an object or type.

Parameters (* = required): `path` (string); `type` (string)

### `rimworld_engine_new` (`engine.new`) [destructive]

Construct an object with args, or with fields to fill.

Parameters (* = required): `type`* (string); `args` (array); `fields` (object)

### `rimworld_engine_types` (`engine.types`) [read-only]

Search type names in the game assembly.

Parameters (* = required): `query`* (string); `limit` (integer)

## dev

### `rimworld_dev_damage` (`dev.damage`) [destructive]

Apply damage to a pawn or thing. CHEAT: marks the current game 'assisted' for the rest of the game.

Parameters (* = required): `pawn` (string): pawn name or id, e.g. 'Sparky' or 'Human102'; `thing` (string): thing id, e.g. 'Campfire2977'; `amount`* (number); `def` (string): Cut|Blunt|Gunshot|Burn

### `rimworld_dev_destroy` (`dev.destroy`) [destructive]

Destroy a thing. CHEAT: marks the current game 'assisted' for the rest of the game.

Parameters (* = required): `thing`* (string): thing id, e.g. 'Campfire2977'

### `rimworld_dev_finish_research` (`dev.finish_research`) [destructive]

Complete a research project instantly. CHEAT: marks the current game 'assisted' for the rest of the game.

Parameters (* = required): `def`* (string)

### `rimworld_dev_god_mode` (`dev.god_mode`) [destructive]

Instant build, free everything. CHEAT: marks the current game 'assisted' for the rest of the game.

Parameters (* = required): `enabled`* (boolean)

### `rimworld_dev_heal` (`dev.heal`) [destructive]

Remove all injuries and diseases from a pawn. CHEAT: marks the current game 'assisted' for the rest of the game.

Parameters (* = required): `pawn`* (string): pawn name or id, e.g. 'Sparky' or 'Human102'

### `rimworld_dev_incident` (`dev.incident`) [destructive]

Fire an incident now (RaidEnemy, ColdSnap, Flashstorm, TraderCaravanArrival...). CHEAT: marks the current game 'assisted' for the rest of the game.

Parameters (* = required): `def`* (string); `points` (number); `faction` (string)

### `rimworld_dev_kill_hostiles` (`dev.kill_hostiles`) [destructive]

Kill every hostile pawn on the map. CHEAT: marks the current game 'assisted' for the rest of the game.

No parameters.

### `rimworld_dev_reveal_map` (`dev.reveal_map`) [destructive]

Remove fog of war. CHEAT: marks the current game 'assisted' for the rest of the game.

No parameters.

### `rimworld_dev_set_need` (`dev.set_need`) [destructive]

Set a pawn need level 0..1 (Food, Rest, Joy, Mood...). CHEAT: marks the current game 'assisted' for the rest of the game.

Parameters (* = required): `pawn`* (string): pawn name or id, e.g. 'Sparky' or 'Human102'; `need`* (string); `level`* (number)

### `rimworld_dev_spawn` (`dev.spawn`) [destructive]

Spawn items or buildings. CHEAT: marks the current game 'assisted' for the rest of the game.

Parameters (* = required): `def`* (string); `cell`* (array): [x, z] cell; x grows right, z grows up; `count` (integer); `stuff` (string); `quality` (string): Awful..Legendary

### `rimworld_dev_spawn_pawn` (`dev.spawn_pawn`) [destructive]

Spawn pawns of a PawnKindDef. CHEAT: marks the current game 'assisted' for the rest of the game.

Parameters (* = required): `kind`* (string); `cell`* (array): [x, z] cell; x grows right, z grows up; `faction` (string): Player|<name>|none; `count` (integer)

### `rimworld_dev_unlock_all_research` (`dev.unlock_all_research`) [destructive]

Finish every research project. CHEAT: marks the current game 'assisted' for the rest of the game.

No parameters.

### `rimworld_dev_weather` (`dev.weather`) [destructive]

Force weather. CHEAT: marks the current game 'assisted' for the rest of the game.

Parameters (* = required): `def`* (string)

