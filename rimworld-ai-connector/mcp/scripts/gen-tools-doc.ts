/** Generates docs/TOOLS.md from the catalog and meta tool definitions. */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";
import { CATALOG, toolName } from "../src/catalog.js";

const out: string[] = [];
out.push("# Tool reference", "", "Generated from `mcp/src/catalog.ts` by `npm run tools-doc` (in `mcp/`). Do not edit by hand.", "");
out.push("Every RimBridge RPC `group.name` is the tool `rimworld_group_name`. Groups `dev` and `engine` are hidden unless enabled (see SETUP.md).", "");
out.push("## Meta tools (not bridge RPCs)", "");
out.push("| Tool | Purpose |", "|------|---------|");
out.push("| `rimworld_bridge_status` | Health, game status, method count, group flags; discovers add-on methods as tools |");
out.push("| `rimworld_events` | Read the event ledger since a sequence number (default: since last seen) |");
out.push("| `rimworld_screenshot` | PNG of the map around [x,z] as an image content block |");
out.push("| `rimworld_wait` | End turn: unpause at a speed, wait N in-game hours or until a wake-up event, pause, return events |");
out.push("| `rimworld_rpc` | Call any bridge method by name (escape hatch) |", "");

interface JsonProp { type?: string | string[]; description?: string; enum?: unknown[]; anyOf?: JsonProp[] }
const typeOf = (v: JsonProp): string => {
  if (v.enum) return v.enum.map(String).join("\\|");
  if (v.anyOf) return v.anyOf.map(typeOf).join(" or ");
  if (Array.isArray(v.type)) return v.type.join("\\|");
  return v.type ?? "any";
};

let group = "";
for (const spec of CATALOG) {
  if (spec.group !== group) {
    group = spec.group;
    out.push(`## ${group}`, "");
  }
  const schema = z.toJSONSchema(z.object(spec.input)) as { properties?: Record<string, JsonProp>; required?: string[] };
  const req = new Set(schema.required ?? []);
  const params = Object.entries(schema.properties ?? {}).map(([k, v]) => `\`${k}\`${req.has(k) ? "*" : ""} (${typeOf(v)})${v.description ? ": " + v.description : ""}`);
  const flags = [spec.annotations.readOnlyHint ? "read-only" : "", spec.annotations.destructiveHint ? "destructive" : ""].filter(Boolean).join(", ");
  out.push(`### \`${toolName(spec.method)}\` (\`${spec.method}\`)${flags ? ` [${flags}]` : ""}`, "");
  out.push(spec.description, "");
  out.push(params.length ? "Parameters (* = required): " + params.join("; ") : "No parameters.", "");
}
const target = resolve(import.meta.dirname, "..", "..", "docs", "TOOLS.md");
writeFileSync(target, out.join("\n") + "\n");
console.log(`wrote ${target} (${CATALOG.length} tools)`);
