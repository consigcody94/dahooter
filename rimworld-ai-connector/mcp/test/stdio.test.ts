/** End-to-end: spawn the built dist/index.js over stdio, as Claude Desktop / Claude Code would. */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { startMockBridge } from "./mock-bridge.js";

const DIST = resolve(import.meta.dirname, "..", "dist", "index.js");

describe("stdio transport (built server)", { skip: !existsSync(DIST) && "run npm run build first" }, () => {
  it("initializes, lists tools, calls the bridge, serves the repo playbook", async () => {
    const mock = await startMockBridge();
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [DIST],
      env: { ...process.env, RIMBRIDGE_URL: mock.url, RIMWORLD_MCP_ENABLE_DEV: "1" },
      stderr: "pipe",
    });
    const client = new Client({ name: "stdio-test", version: "0.0.0" });
    try {
      await client.connect(transport);
      const { tools } = await client.listTools();
      assert.ok(tools.length >= 90, `only ${tools.length} tools`);
      assert.ok(tools.some((t) => t.name === "rimworld_dev_heal"));
      const r = (await client.callTool({ name: "rimworld_game_status", arguments: {} })) as { content: { type: string; text?: string }[] };
      assert.match(r.content[0].text ?? "", /"state":"playing"/);
      const p = await client.getPrompt({ name: "rimworld_play" });
      const txt = (p.messages[0].content as { text: string }).text;
      assert.match(txt, /First-day checklist/, "the real docs/PLAYBOOK.md should be served");
    } finally {
      await client.close();
      await mock.close();
    }
  });
});
