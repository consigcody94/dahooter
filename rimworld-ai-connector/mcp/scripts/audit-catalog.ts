/**
 * Audit the tool catalog against the RimBridge C# source: for every [Rpc] handler, collect the
 * parameter keys the code actually reads (directly and through helpers that take the JObject p)
 * and compare them with the zod schema keys in src/catalog.ts.
 *
 *   tsx scripts/audit-catalog.ts ../mod/.work/rimbridge/Source
 * Exit code 1 if any handler reads a key the schema does not declare (a call Claude could never make).
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { CATALOG, METHODS_WITHOUT_TOOLS } from "../src/catalog.js";

const root = process.argv[2] ?? join(import.meta.dirname, "..", "..", "mod", ".work", "rimbridge", "Source");

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) { if (!/obj|bin/.test(n)) out.push(...walk(p)); }
    else if (p.endsWith(".cs")) out.push(p);
  }
  return out;
}
const files = walk(root).map((f) => ({ f, src: readFileSync(f, "utf8") }));

// --- helper functions that take the params JObject (any parameter named p of type JObject) ---
// map "Name" -> body text; we key by simple method name (collisions are unioned, conservative)
const helperBodies = new Map<string, string[]>();
const methodRe = /(?:static|public|private|internal|protected)[^;{}=]*?\b(\w+)\s*\(([^)]*)\)\s*(?:=>\s*([^;]*);|\{)/g;
function bodyFrom(src: string, openIdx: number): string {
  // openIdx points at '{'; return balanced body
  let depth = 0;
  for (let i = openIdx; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") { depth--; if (depth === 0) return src.slice(openIdx, i + 1); }
  }
  return src.slice(openIdx);
}
for (const { src } of files) {
  let m: RegExpExecArray | null;
  methodRe.lastIndex = 0;
  while ((m = methodRe.exec(src))) {
    const [, name, params, exprBody] = m;
    if (!/JObject\s+p\b/.test(params)) continue;
    let body: string;
    if (exprBody !== undefined) body = exprBody;
    else { const open = src.indexOf("{", m.index + m[0].length - 1); body = bodyFrom(src, open); }
    if (!helperBodies.has(name)) helperBodies.set(name, []);
    helperBodies.get(name)!.push(body);
  }
}

const keyPatterns = [
  /\bP\.\w+\(\s*p\s*,\s*"(\w+)"/g,            // P.Str(p, "key")
  /\bp\[\s*"(\w+)"\s*\]/g,                    // p["key"]
  /\(\s*p\s*,\s*"(\w+)"/g,                    // Helper(p, "key")
  /\bp\.(?:ContainsKey|TryGetValue|Remove)\(\s*"(\w+)"/g,
];
function directKeys(body: string): Set<string> {
  const keys = new Set<string>();
  for (const re of keyPatterns) { re.lastIndex = 0; let m: RegExpExecArray | null; while ((m = re.exec(body))) keys.add(m[1]); }
  return keys;
}
function calledHelpers(body: string): string[] {
  const names = new Set<string>();
  const re = /\b(\w+)\(\s*p\s*[,)]/g; let m: RegExpExecArray | null;
  while ((m = re.exec(body))) names.add(m[1]);
  return [...names];
}
function keysOf(body: string, seen = new Set<string>()): Set<string> {
  const keys = directKeys(body);
  for (const h of calledHelpers(body)) {
    if (seen.has(h) || !helperBodies.has(h)) continue;
    seen.add(h);
    for (const hb of helperBodies.get(h)!) for (const k of keysOf(hb, seen)) keys.add(k);
  }
  return keys;
}

// --- RPC handlers ---
const rpcRe = /\[Rpc\("([\w.]+)"\s*,\s*"((?:[^"\\]|\\.)*)"[^\]]*\]\s*(?:public|internal|private)?\s*static\s+\w+\s+\w+\s*\(\s*JObject\s+p\s*\)\s*(=>\s*[^;]*;|\{)/g;
const codeKeys = new Map<string, Set<string>>();
for (const { src } of files) {
  let m: RegExpExecArray | null; rpcRe.lastIndex = 0;
  while ((m = rpcRe.exec(src))) {
    const [, method, , tail] = m;
    let body: string;
    if (tail.startsWith("=>")) body = tail;
    else body = bodyFrom(src, m.index + m[0].length - 1);
    codeKeys.set(method, keysOf(body));
  }
}

// --- compare ---
// keys the code accepts as aliases of a documented parameter; not worth a schema entry
const ALIASES: Record<string, string[]> = { "ui.add_bill": ["station", "table", "bench"] };
let problems = 0;
const schemaFor = new Map(CATALOG.map((s) => [s.method, new Set(Object.keys(s.input))]));
for (const [method, keys] of [...codeKeys.entries()].sort()) {
  if (METHODS_WITHOUT_TOOLS.has(method)) continue;
  const schema = schemaFor.get(method);
  if (!schema) { console.log(`MISSING TOOL  ${method}  (code reads: ${[...keys].join(", ") || "-"})`); problems++; continue; }
  const missing = [...keys].filter((k) => !schema.has(k) && !(ALIASES[method] ?? []).includes(k));
  const extra = [...schema].filter((k) => !keys.has(k));
  if (missing.length) { console.log(`MISSING PARAM ${method}: ${missing.join(", ")}`); problems++; }
  if (extra.length) console.log(`unused-in-code ${method}: ${extra.join(", ")}  (schema declares, code never reads; check aliases)`);
}
for (const s of CATALOG) if (!codeKeys.has(s.method)) { console.log(`NOT IN CODE   ${s.method}`); problems++; }
console.log(`\n${codeKeys.size} handlers in code, ${CATALOG.length} in catalog, ${problems} problem(s)`);
process.exit(problems ? 1 : 0);
