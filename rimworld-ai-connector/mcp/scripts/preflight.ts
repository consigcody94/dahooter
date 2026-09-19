/**
 * Preflight: run this on the game machine before the first Claude session.
 *   npm run preflight            (uses RIMBRIDGE_URL, default http://127.0.0.1:8765)
 * Checks Node, the bridge, the method list against this server's catalog, the game state,
 * a summary read and a screenshot. Exit code 1 on any FAIL.
 */
import { Bridge, bridgeFromEnv, BridgeUnreachable } from "../src/bridge.js";
import { CATALOG, METHODS_WITHOUT_TOOLS } from "../src/catalog.js";

type Level = "PASS" | "WARN" | "FAIL";
export interface Row { level: Level; check: string; detail: string }

export async function preflight(bridge: Bridge): Promise<{ rows: Row[]; failed: boolean }> {
  const rows: Row[] = [];
  const add = (level: Level, check: string, detail = ""): void => { rows.push({ level, check, detail }); };
  const major = Number(process.versions.node.split(".")[0]);
  add(major >= 20 ? "PASS" : "FAIL", "Node.js", `${process.versions.node}${major >= 20 ? "" : " (need 20+)"}`);

  let reachable = false;
  try {
    const h = await bridge.health();
    reachable = h.ok === true;
    add(h.ok ? "PASS" : "FAIL", "Bridge /health", `${bridge.config.url} version ${h.version}, mainThreadAlive=${h.mainThreadAlive}, frames=${h.frames}`);
    if (h.ok && !h.mainThreadAlive) add("WARN", "Main thread", "no frames drained yet; the game may still be loading");
  } catch (e) {
    add("FAIL", "Bridge /health", e instanceof BridgeUnreachable ? e.message : String(e));
  }
  if (!reachable) return { rows, failed: true };

  try {
    const methods = await bridge.methods();
    const live = new Set(methods.map((m) => m.method));
    const missing = CATALOG.map((s) => s.method).filter((m) => !live.has(m));
    const known = new Set([...CATALOG.map((s) => s.method), ...METHODS_WITHOUT_TOOLS]);
    const extra = methods.map((m) => m.method).filter((m) => !known.has(m));
    add(missing.length ? "WARN" : "PASS", "Method catalog", `${methods.length} methods on the bridge; ${missing.length} expected by this server are missing${missing.length ? ": " + missing.join(", ") : ""}`);
    if (extra.length) add("PASS", "Add-on methods", `${extra.length} will be exposed as dynamic tools: ${extra.slice(0, 12).join(", ")}${extra.length > 12 ? ", ..." : ""}`);
  } catch (e) {
    add("FAIL", "Method catalog", String(e));
  }

  let playing = false;
  try {
    const st = await bridge.status();
    playing = st.state === "playing";
    add("PASS", "Game state", st.state === "playing"
      ? `playing: day ${st.day}, ${st.season}, ${st.colonists} colonists, speed ${st.speed}${st.paused ? " (paused)" : ""}, ${st.storyteller}/${st.difficulty}${st.assisted ? ", ASSISTED" : ""}`
      : `${st.state} (load a save or start a new game; Claude can do it with rimworld_game_load / rimworld_game_new_game)`);
    if (st.dev_mode) add("WARN", "Dev mode", "RimBridge enables dev mode at start (mod setting 'Enable dev mode on start'); harmless, but visible in the UI");
  } catch (e) {
    add("FAIL", "Game state", String(e));
  }

  if (playing) {
    try {
      const t0 = Date.now();
      const summary = await bridge.call("state.summary");
      const chars = JSON.stringify(summary).length;
      add(chars > 12000 ? "WARN" : "PASS", "state.summary", `${chars} chars in ${Date.now() - t0} ms${chars > 12000 ? " (over the 12000 default RIMWORLD_MCP_MAX_CHARS; consider raising it)" : ""}`);
    } catch (e) {
      add("FAIL", "state.summary", String(e));
    }
    try {
      const t0 = Date.now();
      const png = await bridge.screenshot({ w: 40, width_px: 512, height_px: 384 });
      add(png.length > 0 ? "PASS" : "WARN", "Screenshot", `${png.length} bytes in ${Date.now() - t0} ms`);
    } catch (e) {
      add("WARN", "Screenshot", String(e));
    }
  }
  return { rows, failed: rows.some((r) => r.level === "FAIL") };
}

const isMain = process.argv[1] && /preflight\.(ts|js)$/.test(process.argv[1]);
if (isMain) {
  const bridge = bridgeFromEnv();
  const r = await preflight(bridge);
  for (const row of r.rows) console.log(`${row.level.padEnd(4)}  ${row.check.padEnd(16)} ${row.detail}`);
  console.log(r.failed ? "\nPreflight FAILED. Fix the FAIL rows (docs/TROUBLESHOOTING.md), then run again." : "\nPreflight passed. Add the server to your Claude client (docs/SETUP.md, step 4) and run the rimworld_play prompt.");
  process.exit(r.failed ? 1 : 0);
}
