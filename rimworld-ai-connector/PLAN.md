# RimWorld AI connector: plan

Goal: let an AI (Claude first, any MCP client in general) see a running RimWorld colony and
play it: read state, look at the map, give orders, build, manage work, advance time, react to
events. This comes before the multiplayer work in `../rimworld-multiplayer/`.

## Shape

```
 Claude Desktop / Claude Code / any MCP client
        |  MCP (stdio)
        v
 rimworld-mcp-server (TypeScript, this folder: mcp/)
        |  HTTP JSON-RPC on 127.0.0.1:8765  (/rpc, /events, /screenshot, /health, /methods)
        v
 RimBridge mod inside RimWorld 1.6 (zorrobyte/rimbridge, MIT, pinned; this folder: mod/)
        |  main-thread queue, Harmony patches, event ledger
        v
 the game
```

Two halves, deliberately:

- **In-game half = RimBridge, not our own mod.** It already exposes 97 documented RPCs
  (state.*, map.*, ui.*, defs.*, anchor.*, game.*, engine.*, dev.*), an append-only event
  ledger, off-screen screenshots, and a main-thread dispatcher. It is purpose-built for an
  LLM playing the game (the rimagent project runs whole colonies on it), builds from the
  public reference assemblies with no game install, and is MIT. Writing our own would mean
  re-deriving thousands of lines of Verse plumbing blind.
- **Claude half = our MCP server.** RimBridge has no MCP; rimagent drives it from a Python
  loop with a local model. The MCP server maps every RPC to a typed tool, adds the
  "turn" primitives Claude needs (wait/advance time with wake-up events, screenshot as an
  image, event polling), ships the operator playbook as a prompt and resource, and hides
  the cheat/reflection tool groups unless enabled.

## Phases

| # | Phase | Deliverable | Status |
|---|-------|-------------|--------|
| A1 | Prior art | Evaluate RimBridge, RimBridgeServer, RIMAPI; pick base | done: RimBridge |
| A2 | Mod packaging | Pinned build script, patches dir, tests run, zip artifact | done (builds + 26 tests pass here) |
| A3 | MCP server | Typed tools for all RPCs, meta tools (wait, events, screenshot), prompt + resources, tests against a mock bridge | done: 96 catalog tools + 5 meta, 18 tests incl. stdio e2e |
| A4 | Docs | SETUP, PLAYBOOK, TOOLS reference, ARCHITECTURE, TROUBLESHOOTING, client config examples | done (TOOLS.md generated) |
| A5 | CI + PR | Workflow builds mod + MCP, runs both test suites, uploads mod zip | done, green |
| A6 | Live validation | Real game: launch, connect Claude, run the first-day checklist | needs a machine with RimWorld |
| B | Multiplayer | See `../rimworld-multiplayer/PLAN.md` | parked until A is validated |

## Decisions

1. Pin RimBridge by commit (`3c1e4c7`, 2026-09-16) and build from source, same pattern as
   the multiplayer server. Patches (if ever needed) live in `mod/patches/` and apply at build.
2. One MCP tool per RPC, named `rimworld_<group>_<name>` (e.g. `rimworld_ui_build`), with a
   hand-written zod schema derived from the RPC's own parameter doc. Anything the bridge
   reports in `/methods` that we do not know gets a generic tool at runtime, and
   `rimworld_rpc` is the escape hatch.
3. `dev.*` (cheats; mark the game "assisted") and `engine.*` (reflection into the live
   object graph) are off by default: `RIMWORLD_MCP_ENABLE_DEV=1`, `RIMWORLD_MCP_ENABLE_ENGINE=1`.
4. Time is turn-based from Claude's point of view: `rimworld_wait` unpauses at a chosen
   speed, watches the ledger for wake-up event kinds, pauses again, and returns what
   happened. Claude never has to poll.
5. Everything runs on the machine with the game: RimBridge listens on 127.0.0.1 only and
   has no auth. Remote use goes through an SSH tunnel; documented, not built.
6. Results are compact JSON with a hard character cap (`RIMWORLD_MCP_MAX_CHARS`, 12000) and a
   "narrow the query" hint, because the bridge's own docs say a truncated answer is a wasted
   call.

## Acceptance

1. `mod/scripts/build-mod.sh` produces an installable `RimBridge` folder; upstream tests pass.
2. `npm test` in `mcp/` passes: tools list, calls, error mapping, wait loop, screenshot image,
   dev/engine gating, truncation, all against a mock bridge.
3. CI green on the PR.
4. Live: with the game running, `rimworld_game_status` returns `playing`, `rimworld_state_summary`
   describes the colony, `rimworld_ui_build` places a blueprint, `rimworld_wait` advances one
   in-game hour and pauses. Recorded in HANDOFF.md when done.
