/**
 * Builds the MCP server: catalog tools, meta tools (status, events, screenshot, wait, rpc),
 * dynamic tools discovered from the running bridge, the playbook prompt and resources.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { type Bridge, BridgeUnreachable } from "./bridge.js";
import { CATALOG, METHODS_WITHOUT_TOOLS, groupOf, toolName, type ToolSpec } from "./catalog.js";
import { DEFAULT_MAX_CHARS, errorResult, okResult, toText, truncate } from "./format.js";
import { loadPlaybook } from "./playbook.js";
import { DEFAULT_WAKE_ON, type SessionState, waitTurn, type WaitOptions } from "./wait.js";

export const SERVER_NAME = "rimworld-mcp-server";
export const SERVER_VERSION = "0.1.0";

export interface ServerOptions {
  bridge: Bridge;
  enableDev?: boolean;
  enableEngine?: boolean;
  maxChars?: number;
  playbook?: string;
  /** Test hooks forwarded to waitTurn. */
  waitHooks?: Pick<WaitOptions, "pollMs" | "stallMs" | "sleep" | "now">;
}

export interface RimworldServer {
  server: McpServer;
  session: SessionState;
  /** Ask the running bridge for its method list and register tools for methods we do not know. */
  refreshDynamicTools(): Promise<{ added: string[]; total: number; missing: string[] }>;
  registeredTools(): string[];
}

export function createServer(opts: ServerOptions): RimworldServer {
  const { bridge } = opts;
  const maxChars = opts.maxChars ?? DEFAULT_MAX_CHARS;
  const playbook = opts.playbook ?? loadPlaybook();
  const session: SessionState = { lastSeq: 0 };
  const registered = new Set<string>();

  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { instructions: INSTRUCTIONS }
  );

  const groupEnabled = (group: string): boolean =>
    group === "dev" ? opts.enableDev === true : group === "engine" ? opts.enableEngine === true : true;

  // ---- catalog tools ------------------------------------------------------------------------
  for (const spec of CATALOG) {
    if (!groupEnabled(spec.group)) continue;
    registerCatalogTool(spec);
  }

  function registerCatalogTool(spec: ToolSpec): void {
    const name = toolName(spec.method);
    registered.add(name);
    server.registerTool(
      name,
      { title: spec.title, description: spec.description, inputSchema: spec.input, annotations: spec.annotations },
      async (args): Promise<CallToolResult> => {
        try {
          const result = await bridge.call(spec.method, (args ?? {}) as Record<string, unknown>);
          return okResult(result, maxChars);
        } catch (e) {
          return errorResult(e);
        }
      }
    );
  }

  // ---- meta tools ---------------------------------------------------------------------------
  registered.add("rimworld_bridge_status");
  server.registerTool(
    "rimworld_bridge_status",
    {
      title: "Bridge status",
      description:
        "Check the connection to the RimBridge mod: health, game status, number of RPC methods, and which tool groups are enabled. Also discovers any bridge methods that have no dedicated tool yet and registers them. Use when tools fail with 'unreachable'.",
      inputSchema: {},
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async (): Promise<CallToolResult> => {
      try {
        const health = await bridge.health();
        let status: unknown = null;
        try {
          status = await bridge.status();
        } catch (e) {
          status = { error: (e as Error).message };
        }
        const dyn = await refreshDynamicTools();
        const out = {
          bridge_url: bridge.config.url,
          health,
          game: status,
          methods: dyn.total,
          tools_registered: registered.size,
          dynamic_tools_added: dyn.added,
          catalog_methods_missing_on_bridge: dyn.missing,
          groups: { dev: opts.enableDev === true, engine: opts.enableEngine === true },
          hint: opts.enableDev ? undefined : "dev cheats hidden (RIMWORLD_MCP_ENABLE_DEV=1 to enable); engine reflection hidden (RIMWORLD_MCP_ENABLE_ENGINE=1)",
        };
        return okResult(out, maxChars, out as unknown as Record<string, unknown>);
      } catch (e) {
        return errorResult(e);
      }
    }
  );

  registered.add("rimworld_events");
  server.registerTool(
    "rimworld_events",
    {
      title: "Event ledger",
      description:
        "Read the game's append-only event ledger (letters, incidents, hostile groups, downed/dead colonists, mental breaks, research finished, built/lost buildings, quests, day rollovers...). Omit 'since' to get everything after the last event this server already handed you; pass since=0 for the whole buffer. Returns {events:[{seq, kind, text, tick, day, hour, cell?, thing?, data?}], last_seq, head_seq, assisted}.",
      inputSchema: {
        since: z.number().int().min(0).optional().describe("ledger sequence number; default = last seen by this server"),
        limit: z.number().int().min(1).max(500).optional().describe("default 100"),
        kinds: z.array(z.string()).optional().describe("only these event kinds, e.g. ['letter','hostile_group']"),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ since, limit, kinds }): Promise<CallToolResult> => {
      try {
        const from = since ?? session.lastSeq;
        const ev = await bridge.events(from, limit ?? 100);
        const filtered = kinds && kinds.length > 0 ? ev.events.filter((e) => kinds.includes(e.kind)) : ev.events;
        if (ev.last_seq > session.lastSeq) session.lastSeq = ev.last_seq;
        const out = { ...ev, events: filtered, since: from };
        return okResult(out, maxChars);
      } catch (e) {
        return errorResult(e);
      }
    }
  );

  registered.add("rimworld_screenshot");
  server.registerTool(
    "rimworld_screenshot",
    {
      title: "Map screenshot",
      description:
        "Render the real map around [x,z] (default: home centre) as a PNG image, w cells wide. Does not move the player's camera. Use for a sanity check of a layout; use rimworld_map_view / rimworld_map_detail for exact coordinates.",
      inputSchema: {
        x: z.number().int().optional(),
        z: z.number().int().optional(),
        w: z.number().min(10).max(250).optional().describe("cells wide, default 60"),
        width_px: z.number().int().min(128).max(2048).optional().describe("default 1024"),
        height_px: z.number().int().min(128).max(2048).optional().describe("default 768"),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async (args): Promise<CallToolResult> => {
      try {
        const png = await bridge.screenshot(args);
        const b64 = Buffer.from(png).toString("base64");
        const where = args.x !== undefined && args.z !== undefined ? `[${args.x},${args.z}]` : "home";
        return {
          content: [
            { type: "text", text: `Screenshot around ${where}, ${args.w ?? 60} cells wide (${png.length} bytes).` },
            { type: "image", data: b64, mimeType: "image/png" },
          ],
        };
      } catch (e) {
        return errorResult(e);
      }
    }
  );

  registered.add("rimworld_wait");
  server.registerTool(
    "rimworld_wait",
    {
      title: "Advance time (end turn)",
      description:
        `END YOUR TURN with this. Unpauses the game at the given speed, lets in-game time pass, watches the event ledger, and pauses again when the requested hours elapsed OR a wake-up event happened OR the clock stalls (a modal dialog). Returns {reason: elapsed|event:<kind>|stalled|state:<state>|timeout, waited_ticks, waited_hours, status, events, dialogs?}. Use 1-2 hours during a raid or fire, 4-6 normally, 8-12 when everything is calm and work is queued. Default wake_on: ${DEFAULT_WAKE_ON.join(", ")}.`,
      inputSchema: {
        hours: z.number().positive().max(72).optional().describe("in-game hours to wait (default 1); 24 = one day"),
        ticks: z.number().int().positive().optional().describe("alternative to hours; 2500 ticks = 1 hour"),
        speed: z.number().int().min(1).max(4).optional().describe("1 normal, 2 fast, 3 superfast (default), 4 ultra (dev only)"),
        wake_on: z.array(z.string()).optional().describe("event kinds that end the wait early"),
        pause_after: z.boolean().optional().describe("pause when done (default true)"),
        timeout_seconds: z.number().int().min(5).max(3600).optional().describe("real-time cap (default 300)"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async (args): Promise<CallToolResult> => {
      try {
        const result = await waitTurn(bridge, session, { ...args, ...(opts.waitHooks ?? {}) });
        return okResult(result, maxChars);
      } catch (e) {
        return errorResult(e);
      }
    }
  );

  registered.add("rimworld_rpc");
  server.registerTool(
    "rimworld_rpc",
    {
      title: "Raw bridge RPC",
      description:
        "Escape hatch: call any RimBridge method by name with a params object (see rimworld_bridge_methods for the list and each method's parameter doc). Prefer the dedicated rimworld_* tools; use this for add-on methods (e.g. steward.*) or new upstream methods.",
      inputSchema: {
        method: z.string().min(1).describe("e.g. 'state.summary' or 'ui.build'"),
        params: z.record(z.string(), z.unknown()).optional(),
        timeout_ms: z.number().int().min(1000).max(600000).optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
    },
    async ({ method, params, timeout_ms }): Promise<CallToolResult> => {
      const group = groupOf(method);
      if (!groupEnabled(group)) {
        return {
          content: [{ type: "text", text: `Error: the '${group}' group is disabled on this server (set RIMWORLD_MCP_ENABLE_${group.toUpperCase()}=1 to enable it).` }],
          isError: true,
        };
      }
      try {
        const result = await bridge.call(method, params ?? {}, timeout_ms);
        return okResult(result, maxChars);
      } catch (e) {
        return errorResult(e);
      }
    }
  );

  // ---- dynamic tools ------------------------------------------------------------------------
  const dynamicSchema = z.looseObject({});
  async function refreshDynamicTools(): Promise<{ added: string[]; total: number; missing: string[] }> {
    const methods = await bridge.methods();
    const added: string[] = [];
    const live = new Set(methods.map((m) => m.method));
    const missing = CATALOG.filter((s) => groupEnabled(s.group) && !live.has(s.method)).map((s) => s.method);
    for (const m of methods) {
      if (METHODS_WITHOUT_TOOLS.has(m.method)) continue;
      const name = toolName(m.method);
      if (registered.has(name)) continue;
      if (!groupEnabled(groupOf(m.method))) continue;
      registered.add(name);
      added.push(name);
      server.registerTool(
        name,
        {
          title: m.method,
          description: `[RimBridge ${m.method}] ${m.doc || "(no doc)"} Parameters go at the top level of the call, as described.`,
          inputSchema: dynamicSchema,
          annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
        },
        async (args): Promise<CallToolResult> => {
          try {
            const result = await bridge.call(m.method, (args ?? {}) as Record<string, unknown>);
            return okResult(result, maxChars);
          } catch (e) {
            return errorResult(e);
          }
        }
      );
    }
    return { added, total: methods.length, missing };
  }

  // ---- prompt + resources -------------------------------------------------------------------
  const kickoff = (goal?: string): string =>
    `${playbook}\n\n---\n\nYou are now playing. Goal: ${goal && goal.trim() ? goal.trim() : "keep the colony alive and growing"}.\n` +
    "Start with rimworld_game_status. If no game is running, ask me whether to load a save or start a new colony. Then read rimworld_state_summary, explain the situation in a few lines, act, and end each turn with rimworld_wait. Tell me what you did and what you are watching for before each wait.";
  const promptMessages = (goal?: string) => ({
    messages: [{ role: "user" as const, content: { type: "text" as const, text: kickoff(goal) } }],
  });
  // Two prompts: a zero-argument one (works from every client, some send no `arguments`
  // object at all) and one that takes a goal.
  server.registerPrompt(
    "rimworld_play",
    { title: "Play RimWorld", description: "Operator playbook for playing the colony through the rimworld_* tools, plus a kickoff instruction." },
    () => promptMessages()
  );
  server.registerPrompt(
    "rimworld_play_with_goal",
    {
      title: "Play RimWorld with a goal",
      description: "Same playbook and kickoff as rimworld_play, focused on a goal you give (e.g. 'survive the first ten days').",
      argsSchema: { goal: z.string().describe("what to focus on this session") },
    },
    ({ goal }) => promptMessages(goal)
  );

  server.registerResource(
    "playbook",
    "rimworld://playbook",
    { title: "RimWorld playbook", description: "Operator manual for the rimworld_* tools", mimeType: "text/markdown" },
    async (uri) => ({ contents: [{ uri: uri.href, mimeType: "text/markdown", text: playbook }] })
  );
  server.registerResource(
    "status",
    "rimworld://status",
    { title: "Game status", description: "Live rimworld game.status", mimeType: "application/json" },
    async (uri) => {
      const status = await bridge.status();
      return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(status) }] };
    }
  );
  server.registerResource(
    "methods",
    "rimworld://methods",
    { title: "Bridge methods", description: "Every RPC the running bridge exposes, with docs", mimeType: "application/json" },
    async (uri) => {
      const methods = await bridge.methods();
      return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(methods) }] };
    }
  );
  server.registerResource(
    "recent-events",
    "rimworld://events/recent",
    { title: "Recent events", description: "Last 100 ledger events", mimeType: "application/json" },
    async (uri) => {
      const status = await bridge.status();
      const head = status.seq ?? 0;
      const ev = await bridge.events(Math.max(0, head - 100), 100);
      const { text } = truncate(toText(ev), maxChars);
      return { contents: [{ uri: uri.href, mimeType: "application/json", text }] };
    }
  );

  return {
    server,
    session,
    refreshDynamicTools,
    registeredTools: () => [...registered].sort(),
  };
}

export async function tryDiscover(rw: RimworldServer, log: (msg: string) => void): Promise<void> {
  try {
    const r = await rw.refreshDynamicTools();
    log(`bridge reachable: ${r.total} methods, ${r.added.length} dynamic tools added`);
    if (r.missing.length > 0)
      log(`WARNING: the running RimBridge lacks ${r.missing.length} method(s) this server has tools for (different mod version?): ${r.missing.join(", ")}`);
  } catch (e) {
    if (e instanceof BridgeUnreachable) log("bridge not reachable yet (start RimWorld with RimBridge); catalog tools registered anyway");
    else log(`discovery failed: ${(e as Error).message}`);
  }
}

const INSTRUCTIONS = `RimWorld connector. The rimworld_* tools observe and control a running RimWorld 1.6 game through the RimBridge mod.
Start with rimworld_game_status, then rimworld_state_summary. Act with the lowest control altitude that works (right-click orders, gizmos, designators, blueprints, zones, work priorities). Verify results. End every turn with rimworld_wait so in-game time passes and you get the events back. Read the rimworld_play prompt or the rimworld://playbook resource for the full manual. Coordinates are [x,z] with x right and z up; rects are [minX,minZ,w,h].`;
