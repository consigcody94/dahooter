# RimWorld AI connector

Lets Claude (or any MCP client) watch and play a RimWorld 1.6 colony.

- `mod/`: pinned build of the [RimBridge](https://github.com/zorrobyte/rimbridge) mod (MIT),
  which exposes the game over local HTTP. `mod/scripts/build-mod.sh` makes an installable folder.
- `mcp/`: `rimworld-mcp-server`, the MCP server Claude talks to. One typed tool per bridge
  RPC plus turn/wait, events, screenshot, prompt and resources.
- `docs/`: `SETUP.md` (install and connect), `PLAYBOOK.md` (how the AI should play),
  `TOOLS.md` (generated reference), `ARCHITECTURE.md`, `TROUBLESHOOTING.md`.
- `examples/`: Claude Desktop and Claude Code config snippets.
- `PLAN.md`, `HANDOFF.md`: plan and living handoff.

Quick start on the game machine: build or download the mod, enable Harmony + RimBridge,
`cd mcp && npm ci && npm run build`, add the server to your Claude client, run the
`rimworld_play` prompt.
