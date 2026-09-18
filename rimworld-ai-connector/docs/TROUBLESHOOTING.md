# Troubleshooting

**Tools return "RimBridge unreachable at http://127.0.0.1:8765"**
RimWorld is not running, the mod is disabled, the port was changed in mod settings, or the
MCP server runs on another machine. Check http://127.0.0.1:8765/health in a browser on the
game machine. For a remote game, tunnel: `ssh -L 8765:127.0.0.1:8765 user@gaming-pc`.

**`[RimBridge] cannot listen on port 8765`** in Player.log
Another program owns the port. Change it in Options, Mod settings, RimBridge, restart the
game, and set `RIMBRIDGE_URL` accordingly.

**"no game is running (state=Entry)"**
You are on the main menu. `rimworld_game_list_saves` + `rimworld_game_load`, or
`rimworld_game_new_game`, then poll `rimworld_game_status` until `playing`.

**`rimworld_wait` returns reason `stalled`**
The clock is not moving: a modal window (event with choices, trade, naming) is forcing a
pause. `rimworld_state_dialogs` then `rimworld_ui_dialog`, or `rimworld_state_letters` then
`rimworld_ui_letter`. The mod setting "Never pause" removes forced pauses if you prefer.

**`rimworld_wait` returns reason `timeout`**
Real-time cap hit (default 300 s). Large colonies tick slowly; ask for fewer hours, a higher
`timeout_seconds`, or speed 3.

**"main thread did not run the job within 30000 ms"**
The game is frozen or loading (world generation, a long event). Wait and retry. If it
persists, the game itself hung; check Player.log.

**Results end with `[truncated ... chars ...]`**
Ask narrower: `limit`, `category`, `filter`, smaller `w`/`h`, a `layer`, or
`rimworld_map_survey` with a `budget`. Raise `RIMWORLD_MCP_MAX_CHARS` only if your client
copes with big tool results.

**`rimworld_ui_build` fails with "stuff required"**
Walls, doors, beds and most furniture need a material. Call once without `stuff` to get the
options with on-map quantities, then pass `stuff="WoodLog"` (or BlocksGranite, Steel...).

**Blueprints never get built**
Missing materials (check `failed` reasons and `rimworld_state_stocks`), nobody has
Construction enabled (`rimworld_state_work_matrix`), items forbidden, or no path. Loose
resources in the wild are not counted until hauled to a stockpile.

**Dev tools are missing**
By design. Start the server with `RIMWORLD_MCP_ENABLE_DEV=1` (cheats mark the game
"assisted") and `RIMWORLD_MCP_ENABLE_ENGINE=1` for reflection tools.

**The mod does not appear in the mod list**
The folder must be `Mods/RimBridge` with `About/About.xml` directly inside (not
`Mods/RimBridge/RimBridge/...`). Harmony must be installed and enabled above it.

**Game log to look at**
- Windows: `%USERPROFILE%\AppData\LocalLow\Ludeon Studios\RimWorld by Ludeon Studios\Player.log`
- macOS: `~/Library/Logs/Ludeon Studios/RimWorld by Ludeon Studios/Player.log`
- Linux: `~/.config/unity3d/Ludeon Studios/RimWorld by Ludeon Studios/Player.log`
Lines start with `[RimBridge]`. The MCP server logs to stderr (Claude Desktop: its MCP log files).
