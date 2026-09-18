# HANDOFF: RimWorld AI connector

Living handoff for the "AI plays RimWorld" connector. The multiplayer effort has its own
`../rimworld-multiplayer/HANDOFF.md`; the root `RIMWORLD-HANDOFF.md` ties both together.

## Current state (2026-09-18)

- Base chosen: **RimBridge** (github.com/zorrobyte/rimbridge, MIT, RimWorld 1.6, needs the
  Harmony mod). Pinned at `3c1e4c7` (2026-09-16). Builds in this sandbox from
  `Krafs.Rimworld.Ref` with .NET SDK 10 in about 3 s; its 26 unit tests pass.
- Alternatives evaluated and parked: RimBridgeServer (pardeike, MIT, 100+ tools but a mod-
  testing/UI-driving surface behind the GABP protocol and the GABS orchestrator, not plain
  HTTP), RIMAPI (GPLv3 REST + SSE, monitoring-oriented). rimagent's own Python agent is
  not used; we only take its mod and its playbook ideas.
- `mod/scripts/build-mod.sh` fetches, patches, builds, tests and packages the mod.
- MCP server `rimworld-mcp-server` in `mcp/`: 96 catalog tools (one per RPC, typed zod
  schemas, annotations), meta tools `rimworld_wait` / `rimworld_events` /
  `rimworld_screenshot` / `rimworld_bridge_status` / `rimworld_rpc`, dynamic tools for
  add-on methods, `rimworld_play` + `rimworld_play_with_goal` prompts, `rimworld://playbook|status|methods|events/recent`
  resources. `npm test` = 18 tests against a mock bridge, including spawning the built
  server over stdio. Built with @modelcontextprotocol/sdk 1.30 and zod 4.
- Docs: SETUP, PLAYBOOK (served to the model), TOOLS (generated), ARCHITECTURE,
  TROUBLESHOOTING; Claude Desktop and Claude Code config examples.
- CI: `.github/workflows/rimworld-ai-connector.yml` (mod build + upstream tests + artifact,
  MCP build + tests + tool-doc drift check).

**Not verified here**

- Anything that needs the real game: the bridge's own RPC behaviour, the screenshot
  camera, blueprint placement, the first-day flow. The mock bridge only proves the MCP
  side. See "Next steps".

## Key facts

| Fact | Value |
|------|-------|
| Bridge endpoint | `http://127.0.0.1:8765` (port in RimBridge mod settings) |
| Endpoints | `POST /rpc {method, params, timeout_ms}`, `GET /health`, `GET /methods`, `GET /events?since=&limit=`, `GET /screenshot?x=&z=&w=` |
| Envelope | `{ok: true, result}` or `{ok: false, error, trace?}` (HTTP 200 either way) |
| RPC groups | game (11), state (21), map (13), ui (30), defs (4), anchor (3), engine (6), dev (13), bridge (1) |
| Coordinates | `[x, z]`, x right, z up; rects `[minX, minZ, w, h]` |
| Ticks | 2500 per in-game hour, 60000 per day; speeds 0 pause, 1 normal, 2 fast, 3 superfast, 4 ultra (dev) |
| Ledger event kinds | letter, message, incident, hostile_group, hostile_group_gone, colonist_downed, colonist_joined, colonist_left, mental_break, research_finished, built, building_lost, construction_failed, quest, day, game, dialog, dialog_answered, danger, health, manhunter, relation, social, tale, trade, dev, assisted |
| Mod settings | port, enabled, neverPause, devModeOnStart (default true) |

## Gotchas

- RimBridge turns on RimWorld dev mode at start by default (`devModeOnStart`). Harmless, but
  visible in the UI; switch it off in the mod settings if it bothers you.
- `game.log_tail` looks for Player.log at the macOS path only. Not needed by the connector.
- RimBridge is incompatible with `zorrobyte.autopilot` and `mcocdaa.RimMindCore`.
- The bridge has no authentication. Keep it on loopback.
- Any `dev.*` call marks the game `assisted` in the ledger for the rest of that game.

## How to resume

```bash
cd rimworld-ai-connector
mod/scripts/build-mod.sh              # mod/dist/RimBridge + zip (needs .NET SDK 10)
cd mcp && npm ci && npm run build && npm test
```

Then follow `docs/SETUP.md` on the machine that runs RimWorld.

## Next steps

1. Finish A3/A4/A5 (see PLAN.md), push, CI green.
2. On a machine with RimWorld 1.6: install Harmony + the built RimBridge, launch the game,
   point Claude Desktop or Claude Code at `mcp/dist/index.js`, run the `rimworld_play`
   prompt, do a first day. Record what worked and what did not here.
3. Consider a local web dashboard (the "website" idea): a small page served by the MCP
   server or a separate process showing the ledger, summary and screenshots while Claude
   plays. Not started.

## Log

- **2026-09-18, session 1.** Pivot from multiplayer to the AI connector at the user's
  request. Researched prior art, cloned and built RimBridge, decided on RimBridge + our MCP
  server, wrote the build script, the MCP server with tests, docs, CI, and this handoff.
  Pushed to PR #1 alongside the multiplayer kit.
