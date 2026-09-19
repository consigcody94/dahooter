#!/usr/bin/env node
/**
 * rimworld-mcp-server: lets Claude (or any MCP client) observe and play RimWorld through the
 * RimBridge mod. stdio transport; configuration through environment variables (see README).
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { bridgeFromEnv } from "./bridge.js";
import { maxCharsFromEnv } from "./format.js";
import { createServer, SERVER_NAME, SERVER_VERSION, tryDiscover } from "./server.js";

const flag = (v: string | undefined): boolean => v === "1" || v === "true" || v === "yes";

function usage(): void {
  console.log(`${SERVER_NAME} ${SERVER_VERSION}
MCP server (stdio) for RimWorld via the RimBridge mod.

Environment:
  RIMBRIDGE_URL                 bridge base URL (default http://127.0.0.1:8765)
  RIMWORLD_MCP_ENABLE_DEV=1     expose rimworld_dev_* cheat tools
  RIMWORLD_MCP_ENABLE_ENGINE=1  expose rimworld_engine_* reflection tools
  RIMWORLD_MCP_MAX_CHARS        truncation limit for results (default 12000)
  RIMWORLD_MCP_TIMEOUT_MS       per-RPC timeout (default 60000)

Claude Desktop config:
  {"mcpServers":{"rimworld":{"command":"node","args":["<path>/dist/index.js"]}}}`);
}

async function main(): Promise<void> {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    usage();
    return;
  }
  if (process.argv.includes("--version")) {
    console.log(SERVER_VERSION);
    return;
  }
  const bridge = bridgeFromEnv();
  const rw = createServer({
    bridge,
    enableDev: flag(process.env.RIMWORLD_MCP_ENABLE_DEV),
    enableEngine: flag(process.env.RIMWORLD_MCP_ENABLE_ENGINE),
    maxChars: maxCharsFromEnv(),
  });
  const log = (msg: string): void => console.error(`[${SERVER_NAME}] ${msg}`);
  const transport = new StdioServerTransport();
  await rw.server.connect(transport);
  log(`ready: ${rw.registeredTools().length} tools, bridge ${bridge.config.url}`);
  await tryDiscover(rw, log);
}

main().catch((e) => {
  console.error(`[${SERVER_NAME}] fatal: ${(e as Error).stack ?? e}`);
  process.exit(1);
});
