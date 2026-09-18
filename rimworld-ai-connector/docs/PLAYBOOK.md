# Playbook: how to play RimWorld through the connector

This is the operator manual Claude gets through the `rimworld_play` prompt and the
`rimworld://playbook` resource. It is adapted from rimagent's bridge manual and doctrine
(MIT) to the tool names of this MCP server.

## Tool naming

Every bridge RPC `a.b` is the tool `rimworld_a_b`. Its parameters go at the top level of the
call, e.g. `rimworld_ui_build(def="Wall", stuff="WoodLog", rect=[60,60,5,4])`. Results are
JSON, cut at about 12k characters; ask narrowly (filters, `limit`, small windows). Errors
come back as text starting with `Error:` and name the missing parameter or the reason a
cell failed. Read them.

Extra tools that are not bridge RPCs: `rimworld_wait` (advance time and come back with what
happened), `rimworld_events` (ledger since a sequence number), `rimworld_screenshot` (a real
picture of the map), `rimworld_bridge_status`, `rimworld_rpc` (call any method by name).

## Coordinates

x grows right, z grows up; the top printed row of an ASCII view is max z. Cells are
`[x, z]`. Rects are `[minX, minZ, w, h]`, so `[60,60,5,4]` covers x 60..64 and z 60..63.
Thing ids look like `Steel2851`, `Human102`; pawns are accepted by name or id.

## The loop

1. `rimworld_game_status`. If `state` is `menu`, load a save (`rimworld_game_list_saves`,
   `rimworld_game_load`) or start one (`rimworld_game_new_game`), then poll status until
   `playing`.
2. Read: `rimworld_state_summary` (date, colonists, wealth, food_days, threats, alerts,
   pending_letters, zones, blueprints, power, key_stocks). If alerts or letters are
   pending, `rimworld_state_alerts`, `rimworld_state_letters`, `rimworld_state_dialogs`.
3. Triage by priority (below). One or two problems per turn, done properly.
4. Act with the lowest control altitude that works (below). Verify: `failed` lists,
   `disabled` orders, `rimworld_state_designations`, blueprint counts.
5. `rimworld_wait(hours=..., wake_on=[...])`. 1-2 hours in a fight or fire, 4-6 normally,
   8-12 when everything is fine and work is queued. It pauses the game again when it
   returns, with the events that happened. Never leave the game paused on purpose and
   never spin on `rimworld_game_status`.

## Priorities, in order, always

1. **Food.** `food_days` under 3 is an emergency, under 6 the top task.
2. **Shelter.** A walled, doored, roofed room, a bed per colonist, heat before the first cold night.
3. **Defense.** The first raid comes within about ten days on Rough. Weapons equipped, one
   entrance to hold, everyone capable of violence drafted at the door on `hostile_group`.
4. **Mood.** Under 35% a colonist can break. Table, bedrooms, cooked meals, light, recreation.
5. **Wealth and research.** Last. Wealth raises raid size; only build wealth that defends itself.

## Three senses

- **Facts:** `rimworld_state_*` (summary, pawns, pawn, threats, stocks, storage, research,
  rooms, base, power, work_matrix, bills, quests, designations) and
  `rimworld_map_find(kind=item|tree|resource_rock|animal|corpse|chunk|building|blueprint, def=, near=, radius=, forbidden=, limit=)`,
  `rimworld_map_cell`, `rimworld_map_open_rects(w, h, near)`, `rimworld_map_terrain_stats`,
  `rimworld_defs_buildable(category=)`, `rimworld_defs_get(def=)`, `rimworld_defs_search(query=)`.
- **Layout:** `rimworld_map_view(x, z, w, h, layer=)` is one char per cell (legend in the
  result), `rimworld_map_detail(around=, w=, h=)` is the building camera with numbered
  columns and per-type letters, `rimworld_map_survey` is a token-efficient whole-map view,
  `rimworld_map_power` shows wiring, `rimworld_state_base` describes rooms as objects.
- **Picture:** `rimworld_screenshot(x, z, w)` renders the real map. Use it for a sanity
  check; use the ASCII views for exact coordinates.

## Control altitudes (lowest that works)

1. Right-click orders: `rimworld_ui_orders_at(pawn, at)` lists them with `disabled`
   reasons; `rimworld_ui_order(pawn, at, label)` runs one (pick up, equip, eat, rescue,
   tend, prioritize, attack, capture).
2. Gizmos: `rimworld_ui_gizmos(thing)` then `rimworld_ui_press(thing, label)` (draft, fire
   at will, rest until healed, toggle power, copy bills).
3. Designators: `rimworld_ui_designate(designator=mine|cut|harvest|harvestwood|hunt|haul|deconstruct|cancel|tame|slaughter|forbid|unforbid|..., cells|rect|things)`
   queues work for the whole colony.
4. Blueprints: `rimworld_ui_build(def, stuff, at|line|rect, rot, fill, dry_run)`;
   `stuff` is required for anything made of a material (Wall, Door, Bed); omit it once to
   see the options with on-map quantities. `dry_run=true` first for big placements.
   `rimworld_ui_build_many` places a whole layout; `rimworld_ui_wire` lays conduit.
5. Zones and storage: `rimworld_ui_zone(action=create_stockpile|create_growing|..., rect, label, plant, priority)`,
   `rimworld_ui_storage`, `rimworld_ui_area`.
6. Colony management: `rimworld_ui_set_work(pawn, priorities={"Cooking":1,...})` (1 highest,
   4 lowest, 0 off), `rimworld_ui_set_work_many`, `rimworld_ui_set_schedule`,
   `rimworld_ui_set_policies`, `rimworld_ui_set_research(def)`,
   `rimworld_ui_add_bill(thing, recipe, mode, count)`, `rimworld_ui_bill`, `rimworld_ui_prisoner`, `rimworld_ui_animal`.
7. Combat: `rimworld_ui_draft`, `rimworld_ui_goto` (drafts automatically), `rimworld_ui_attack`.
   Drafted pawns do not eat, sleep or work: undraft when the fight ends.
8. Letters, quests, dialogs: `rimworld_state_letters` gives ids and choices;
   `rimworld_ui_letter(id, action=choose|dismiss, choice)`. Modal windows pause the game:
   `rimworld_state_dialogs` then `rimworld_ui_dialog`.
9. Direct jobs, last resort: `rimworld_ui_job(pawn, job, target)` bypasses the game's checks.

## First-day checklist

1. `rimworld_state_summary`: colonist ids, top skills, `home_center`, biome, season.
2. Unforbid the drop-pod loot: `rimworld_map_find(kind="item", forbidden=true)` then
   `rimworld_ui_designate(designator="unforbid", things=[...])`.
3. Stockpile: `rimworld_map_open_rects(w=8, h=6)` then
   `rimworld_ui_zone(action="create_stockpile", rect=..., label="main", priority="Important")`.
4. Growing zone with rice on fertile soil (`f` in the terrain layer), 36-50 cells for three colonists.
5. Wood: `harvestwood` on 20-30 nearby trees.
6. Shelter: wall outline about 8x6, a door, one bed each, campfire inside if cold.
7. Work priorities for everyone by top skills; Firefighter, Patient, BedRest at 1 for all.
8. Research bench and a project (`rimworld_state_research`, `rimworld_ui_set_research`).
9. Equip the starting weapons; decide who fights and where the one doorway is.
10. Then `rimworld_wait(hours=6)`.

## Pitfalls

- Crash-landed items start forbidden. Nobody hauls forbidden things.
- Hauling needs a stockpile. Walls need a door. Roofs need walls (a roof forms over an
  enclosed room; unsupported roof collapses more than 6 cells from a wall).
- Growing zones only accept fertile terrain; clear trees first.
- Blueprints that never turn into buildings mean missing materials, no builder with
  Construction enabled, forbidden stuff, or no path. Check `failed` reasons and stocks.
- `rimworld_state_stocks` counts unforbidden things on the map; loose logs in the forest
  do not count until hauled. Use `rimworld_map_find(def="WoodLog")`.
- A result that got truncated is a wasted call; ask with `limit`, `category`, `filter`, a
  smaller window or a `layer`.
- The `rimworld_dev_*` tools are cheats and mark the game "assisted". They are hidden unless
  the server was started with `RIMWORLD_MCP_ENABLE_DEV=1`.
