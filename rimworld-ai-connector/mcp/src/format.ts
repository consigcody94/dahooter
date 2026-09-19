/** Result formatting shared by every tool: compact JSON with a hard character cap. */

import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { BridgeError, BridgeUnreachable } from "./bridge.js";

export const DEFAULT_MAX_CHARS = 12000;

export function maxCharsFromEnv(env: NodeJS.ProcessEnv = process.env): number {
  const n = Number.parseInt(env.RIMWORLD_MCP_MAX_CHARS ?? "", 10);
  return Number.isFinite(n) && n >= 1000 ? n : DEFAULT_MAX_CHARS;
}

export function toText(result: unknown): string {
  if (result === null || result === undefined) return "null";
  if (typeof result === "string") return result;
  return JSON.stringify(result);
}

export function truncate(text: string, maxChars: number): { text: string; truncated: boolean } {
  if (text.length <= maxChars) return { text, truncated: false };
  const head = text.slice(0, maxChars);
  return {
    text: `${head}\n... [truncated ${text.length - maxChars} of ${text.length} chars. Ask narrower: use limit, category, filter, a smaller w/h window or a layer.]`,
    truncated: true,
  };
}

export function okResult(result: unknown, maxChars: number, structured?: Record<string, unknown>): CallToolResult {
  const { text } = truncate(toText(result), maxChars);
  const out: CallToolResult = { content: [{ type: "text", text }] };
  if (structured) out.structuredContent = structured;
  return out;
}

export function errorResult(err: unknown): CallToolResult {
  let text: string;
  if (err instanceof BridgeUnreachable) text = `Error: ${err.message}`;
  else if (err instanceof BridgeError) text = `Error from RimBridge: ${err.message}`;
  else if (err instanceof Error) text = `Error: ${err.message}`;
  else text = `Error: ${String(err)}`;
  return { content: [{ type: "text", text }], isError: true };
}
