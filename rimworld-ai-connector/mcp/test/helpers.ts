import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { Bridge } from "../src/bridge.js";
import { createServer, type RimworldServer, type ServerOptions } from "../src/server.js";

export interface Harness {
  client: Client;
  rw: RimworldServer;
  close(): Promise<void>;
}

export async function connect(url: string, extra: Partial<ServerOptions> = {}): Promise<Harness> {
  const bridge = new Bridge({ url, timeoutMs: 5000 });
  const rw = createServer({
    bridge,
    playbook: "# test playbook\nStart with rimworld_state_summary.",
    waitHooks: { pollMs: 1, stallMs: 50, sleep: async () => {} },
    ...extra,
  });
  const [clientT, serverT] = InMemoryTransport.createLinkedPair();
  await rw.server.connect(serverT);
  const client = new Client({ name: "test-client", version: "0.0.0" });
  await client.connect(clientT);
  return {
    client,
    rw,
    close: async () => {
      await client.close();
      await rw.server.close();
    },
  };
}

export async function call(h: Harness, name: string, args: Record<string, unknown> = {}): Promise<CallToolResult> {
  return (await h.client.callTool({ name, arguments: args })) as CallToolResult;
}

export function text(r: CallToolResult): string {
  const block = r.content.find((c) => c.type === "text");
  return block && block.type === "text" ? block.text : "";
}

export function json<T = unknown>(r: CallToolResult): T {
  return JSON.parse(text(r)) as T;
}
