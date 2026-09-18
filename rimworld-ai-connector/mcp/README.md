# rimworld-mcp-server

MCP server (stdio) that lets Claude Desktop, Claude Code, or any MCP client observe and play
a running RimWorld 1.6 colony through the [RimBridge](https://github.com/zorrobyte/rimbridge)
mod. One typed tool per bridge RPC (`rimworld_state_summary`, `rimworld_ui_build`, ...), plus
`rimworld_wait` (advance time, come back paused with the events), `rimworld_events`,
`rimworld_screenshot` (image), `rimworld_rpc` (escape hatch), a `rimworld_play` prompt and
`rimworld://playbook` resource.

```bash
npm ci && npm run build && npm test
node dist/index.js --help
```

Configuration is by environment variable; see `../docs/SETUP.md`. Tool reference:
`../docs/TOOLS.md`. Playbook served to the model: `../docs/PLAYBOOK.md`.
