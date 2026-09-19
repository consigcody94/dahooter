# Architecture

```
+---------------------------+        stdio (JSON-RPC)        +------------------------------+
| Claude Desktop / Code     | <----------------------------> | rimworld-mcp-server (Node)   |
| any MCP client            |   tools, prompt, resources     | mcp/src/*.ts                 |
+---------------------------+                                +--------------+---------------+
                                                                            | HTTP 127.0.0.1:8765
                                                                            | POST /rpc, GET /events,
                                                                            | /screenshot, /health, /methods
                                                             +--------------v---------------+
                                                             | RimBridge mod (C#, Harmony)  |
                                                             | HttpListener -> MainThreadQueue
                                                             | drained in Root.Update       |
                                                             | [Rpc] handlers: game/state/  |
                                                             | map/ui/defs/anchor/engine/dev|
                                                             | EventLedger (Harmony patches)|
                                                             +--------------+---------------+
                                                                            | Verse / RimWorld API
                                                             +--------------v---------------+
                                                             | RimWorld 1.6 (Unity, Mono)   |
                                                             +------------------------------+
```

## Threading and time

- Every RPC that touches game state runs on Unity's main thread. RimBridge queues the
  work from the HTTP thread and a Harmony postfix on `Root.Update` drains the queue every
  frame, paused or not, in the menu or in play. Requests block until the job ran or a
  timeout (`timeout_ms`, default 30 s upstream; the MCP server passes 60 s) fires.
- The game clock only moves when the game is unpaused. The MCP server treats play as
  turn-based: Claude reads and acts while paused, then calls `rimworld_wait`, which sets a
  speed, polls `/events` and `game.status`, and pauses again when the requested in-game time
  passed, a wake-up event kind arrived, the clock stalled (modal window) or a real-time
  timeout hit.
- The ledger is an append-only ring buffer (20k events) with a monotonic `seq`. The MCP
  server remembers the last `seq` it handed out so `rimworld_events` without `since` is
  "what is new".

## Tool surface

- `mcp/src/catalog.ts`: one entry per upstream RPC with a zod schema written from the RPC's
  own doc string. Names are `rimworld_<group>_<name>`. Annotations mark read-only and
  destructive tools so clients can ask for confirmation sensibly.
- Dynamic tools: at startup and on `rimworld_bridge_status` the server reads `/methods` and
  registers a loose-schema tool for every method it does not know (add-ons such as the
  optional Steward mod register `steward.*`). `rimworld_rpc` covers anything else.
- Gating: `dev.*` (cheats, mark the game "assisted") and `engine.*` (reflection into live
  objects) are registered only with `RIMWORLD_MCP_ENABLE_DEV=1` / `RIMWORLD_MCP_ENABLE_ENGINE=1`,
  and `rimworld_rpc` refuses those groups when disabled.
- Results: compact JSON text, truncated at `RIMWORLD_MCP_MAX_CHARS` with a hint to narrow
  the query. Screenshots are returned as an image content block.

## Why not our own mod

RimBridge already solves the hard parts (main-thread marshalling, a designator/blueprint/zone
layer with validation and dry runs, location grammar, event capture through Harmony, an
off-screen screenshot camera) and is exercised daily by the rimagent project. We pin it by
commit, build it from the public reference assemblies, and keep a `patches/` directory in
case we need to carry a fix before it is upstream. If the project ever needs behaviour
RimBridge will not take, the add-on route exists: a second mod that references
`RimBridge.dll` and calls `Rpc.RegisterAssembly` gets its own `[Rpc]` methods served by the
same HTTP server, and the MCP server picks them up as dynamic tools without a code change.

## Testing without a game

`mcp/test/mock-bridge.ts` is an HTTP fake of the bridge (same endpoints and envelopes) with
a fake clock that advances on `game.status` while unpaused, an event emitter, and canned
answers for the RPCs the tests use. The suite connects a real MCP `Client` to the real
server over an in-memory transport, and one test spawns the built `dist/index.js` over stdio.
The mod is built and its own unit tests run in CI, but nothing here exercises Verse; the
live checklist in `HANDOFF.md` covers that.
