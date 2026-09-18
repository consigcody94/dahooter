# Setup: let Claude play your RimWorld colony

Everything runs on the machine that runs RimWorld. Three pieces: the Harmony mod, the
RimBridge mod (built by this repo), and the MCP server (this repo) that Claude talks to.

## 1. Requirements

- RimWorld 1.6 (Steam or DRM-free), any DLC.
- Harmony mod: Steam Workshop 2009463077, or https://github.com/pardeike/HarmonyRimWorld/releases.
- Node.js 20 or newer (for the MCP server).
- Claude Desktop, Claude Code, or any MCP client, on the same machine.
- To build the mod yourself: .NET SDK 10. Otherwise download `RimBridge-<sha>.zip` from the
  repo's GitHub Actions run ("RimWorld AI connector" workflow, artifact `RimBridge-mod`).

## 2. Install the mod

1. Get the mod folder: `mod/scripts/build-mod.sh` produces `mod/dist/RimBridge`, or unzip the
   CI artifact. You should end up with `RimBridge/About/About.xml` and
   `RimBridge/1.6/Assemblies/RimBridge.dll`.
2. Copy `RimBridge` into RimWorld's `Mods` folder:
   - Windows: `C:\Program Files (x86)\Steam\steamapps\common\RimWorld\Mods`
   - macOS: `~/Library/Application Support/Steam/steamapps/common/RimWorld/RimWorldMac.app/Mods`
   - Linux: `~/.steam/steam/steamapps/common/RimWorld/Mods`
3. Start RimWorld. In Mods, enable **Harmony** then **RimBridge** (RimBridge after Harmony).
   Restart when asked.
4. Check it is alive: the log shows `[RimBridge] loaded; 97 rpc methods; listening on
   127.0.0.1:8765`, and in a browser http://127.0.0.1:8765/health returns `{"ok":true,...}`.
   Mod settings (Options, Mod settings, RimBridge) let you change the port or turn off
   "Enable dev mode on start".

RimBridge only listens on loopback and has no password. Do not expose the port.

## 3. Build the MCP server

```bash
cd rimworld-ai-connector/mcp
npm ci
npm run build          # -> dist/index.js
npm test               # optional: runs against a mock bridge, no game needed
```

## 4. Connect Claude

**Claude Desktop** (Settings, Developer, Edit Config), merge `examples/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "rimworld": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/rimworld-ai-connector/mcp/dist/index.js"],
      "env": { "RIMBRIDGE_URL": "http://127.0.0.1:8765" }
    }
  }
}
```

**Claude Code**: copy `examples/mcp.json` to `.mcp.json` in the folder you run Claude Code
from, or run:

```bash
claude mcp add rimworld -- node /ABSOLUTE/PATH/rimworld-ai-connector/mcp/dist/index.js
```

Restart the client. You should see tools named `rimworld_*` (about 80 by default).

## 5. First session

1. Start RimWorld, load a colony or stay on the main menu (Claude can start a new game with
   `rimworld_game_new_game`).
2. In Claude, run the `rimworld_play` prompt (Claude Desktop: the prompts/"+" menu; Claude
   Code: `/rimworld:rimworld_play`), or just say "check the RimWorld bridge and describe
   my colony".
3. Claude reads `rimworld_game_status`, then `rimworld_state_summary`, and acts. Time only
   advances when Claude calls `rimworld_wait` (or sets a speed itself), so you can watch
   each turn.

## Environment variables

| Variable | Default | Meaning |
|----------|---------|---------|
| `RIMBRIDGE_URL` | `http://127.0.0.1:8765` | Where the mod listens |
| `RIMWORLD_MCP_ENABLE_DEV` | unset | `1` exposes the `rimworld_dev_*` cheat tools (mark the game "assisted") |
| `RIMWORLD_MCP_ENABLE_ENGINE` | unset | `1` exposes `rimworld_engine_*` reflection tools (read/write any live object) |
| `RIMWORLD_MCP_MAX_CHARS` | `12000` | Truncation limit for tool results |
| `RIMWORLD_MCP_TIMEOUT_MS` | `60000` | Per-RPC timeout handed to the bridge |

## Remote game machine

If Claude runs on a laptop and the game on a desktop, tunnel the port instead of opening it:
`ssh -L 8765:127.0.0.1:8765 user@gaming-pc`, then keep `RIMBRIDGE_URL` at the default.
