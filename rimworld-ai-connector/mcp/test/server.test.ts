import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { startMockBridge, type MockBridge } from "./mock-bridge.js";
import { call, connect, json, text, type Harness } from "./helpers.js";

describe("rimworld-mcp-server against a mock bridge", () => {
  let mock: MockBridge;
  let h: Harness;

  before(async () => {
    mock = await startMockBridge();
    h = await connect(mock.url);
  });
  after(async () => {
    await h.close();
    await mock.close();
  });

  it("registers catalog + meta tools and hides dev/engine by default", async () => {
    const { tools } = await h.client.listTools();
    const names = tools.map((t) => t.name);
    for (const n of ["rimworld_game_status", "rimworld_state_summary", "rimworld_ui_build", "rimworld_wait", "rimworld_events", "rimworld_screenshot", "rimworld_rpc", "rimworld_bridge_status"])
      assert.ok(names.includes(n), `missing ${n}`);
    assert.ok(!names.includes("rimworld_dev_heal"), "dev tools must be hidden by default");
    assert.ok(!names.includes("rimworld_engine_get"), "engine tools must be hidden by default");
    assert.ok(!names.includes("rimworld_map_screenshot_bytes"), "screenshot_bytes has no text tool");
    const build = tools.find((t) => t.name === "rimworld_ui_build")!;
    assert.equal(build.annotations?.readOnlyHint, false);
    const summary = tools.find((t) => t.name === "rimworld_state_summary")!;
    assert.equal(summary.annotations?.readOnlyHint, true);
    const schema = build.inputSchema as { properties: Record<string, unknown>; required?: string[] };
    assert.ok("def" in schema.properties && "rect" in schema.properties && "stuff" in schema.properties);
    assert.deepEqual(schema.required, ["def"]);
  });

  it("calls a catalog tool and returns the bridge result as JSON text", async () => {
    const r = await call(h, "rimworld_game_status");
    assert.equal(r.isError, undefined);
    const s = json<{ state: string; tick: number }>(r);
    assert.equal(s.state, "playing");
    assert.equal(typeof s.tick, "number");
  });

  it("forwards validated params at the top level", async () => {
    const r = await call(h, "rimworld_ui_build", { def: "Wall", stuff: "WoodLog", rect: [60, 60, 5, 4], dry_run: true });
    assert.equal(r.isError, undefined);
    const last = mock.calls.filter((c) => c.method === "ui.build").pop()!;
    assert.deepEqual(last.params, { def: "Wall", stuff: "WoodLog", rect: [60, 60, 5, 4], dry_run: true });
    assert.deepEqual(json<{ placed: number[][] }>(r).placed, [[60, 60]]);
  });

  it("rejects invalid params before touching the bridge", async () => {
    const before = mock.calls.length;
    const r = await call(h, "rimworld_ui_set_work", { pawn: "Sparky", priorities: { Cooking: 9 } });
    assert.equal(r.isError, true);
    assert.equal(mock.calls.length, before, "bridge must not be called on validation failure");
  });

  it("surfaces bridge errors as isError text", async () => {
    const r = await call(h, "rimworld_rpc", { method: "nope.nothing" });
    assert.equal(r.isError, true);
    assert.match(text(r), /unknown method 'nope.nothing'/);
  });

  it("rimworld_rpc refuses disabled groups", async () => {
    const r = await call(h, "rimworld_rpc", { method: "dev.heal", params: { pawn: "Sparky" } });
    assert.equal(r.isError, true);
    assert.match(text(r), /RIMWORLD_MCP_ENABLE_DEV/);
  });

  it("discovers add-on methods as dynamic tools", async () => {
    const r = await call(h, "rimworld_bridge_status");
    assert.equal(r.isError, undefined);
    const s = json<{ dynamic_tools_added: string[]; methods: number; health: { ok: boolean } }>(r);
    assert.ok(s.health.ok);
    assert.ok(s.dynamic_tools_added.includes("rimworld_steward_status"));
    const { tools } = await h.client.listTools();
    assert.ok(tools.some((t) => t.name === "rimworld_steward_status"));
    const r2 = await call(h, "rimworld_steward_status", { verbose: true });
    assert.equal(r2.isError, undefined);
    assert.deepEqual(json<{ echo: unknown }>(r2).echo, { verbose: true });
  });

  it("reads events and remembers the last sequence", async () => {
    mock.emit("letter", "A wanderer joins");
    const r = await call(h, "rimworld_events", { since: 0 });
    const ev = json<{ events: { kind: string }[]; last_seq: number }>(r);
    assert.ok(ev.events.some((e) => e.kind === "letter"));
    assert.equal(h.rw.session.lastSeq, ev.last_seq);
    const r2 = await call(h, "rimworld_events", { kinds: ["letter"] });
    assert.equal(json<{ events: unknown[] }>(r2).events.length, 0, "nothing new since last read");
  });

  it("returns a screenshot as image content", async () => {
    const r = await call(h, "rimworld_screenshot", { x: 100, z: 120, w: 40 });
    assert.equal(r.isError, undefined);
    const img = r.content.find((c) => c.type === "image");
    assert.ok(img && img.type === "image");
    assert.equal(img.mimeType, "image/png");
    assert.ok(img.data.length > 10);
    const q = mock.calls.filter((c) => c.method === "GET /screenshot").pop()!;
    assert.deepEqual(q.params, { x: "100", z: "120", w: "40" });
  });

  it("rimworld_wait advances the clock, pauses, and reports elapsed", async () => {
    const startTick = mock.state.tick;
    const r = await call(h, "rimworld_wait", { hours: 1 });
    assert.equal(r.isError, undefined, text(r));
    const w = json<{ reason: string; waited_ticks: number; status: { paused: boolean; speed: number } }>(r);
    assert.equal(w.reason, "elapsed");
    assert.ok(w.waited_ticks >= 2500, `waited ${w.waited_ticks}`);
    assert.equal(w.status.paused, true);
    assert.ok(mock.state.tick > startTick);
    const speedCall = mock.calls.find((c) => c.method === "game.speed")!;
    assert.equal(speedCall.params.speed, 3);
  });

  it("serves the playbook prompt and resources", async () => {
    const p = await h.client.getPrompt({ name: "rimworld_play" });
    const msg = p.messages[0];
    assert.ok(msg.content.type === "text" && msg.content.text.includes("rimworld_state_summary") && msg.content.text.includes("Goal: keep the colony"));
    const pg = await h.client.getPrompt({ name: "rimworld_play_with_goal", arguments: { goal: "survive" } });
    assert.ok(pg.messages[0].content.type === "text" && pg.messages[0].content.text.includes("Goal: survive"));
    const { prompts } = await h.client.listPrompts();
    assert.deepEqual(prompts.map((x) => x.name).sort(), ["rimworld_play", "rimworld_play_with_goal"]);
    const res = await h.client.readResource({ uri: "rimworld://playbook" });
    assert.ok(res.contents[0] && "text" in res.contents[0] && String(res.contents[0].text).includes("test playbook"));
    const st = await h.client.readResource({ uri: "rimworld://status" });
    assert.match(String((st.contents[0] as { text: string }).text), /"state":"playing"/);
  });
});

describe("wait: wake-up events and stalls", () => {
  it("stops early on a wake_on event", async () => {
    const mock = await startMockBridge({ emitAtTick: { tick: 6000, kind: "hostile_group", text: "Raid!" }, ticksPerStatus: 500 });
    const h = await connect(mock.url);
    try {
      const r = await call(h, "rimworld_wait", { hours: 10 });
      const w = json<{ reason: string; events: { kind: string }[]; waited_ticks: number }>(r);
      assert.equal(w.reason, "event:hostile_group");
      assert.ok(w.events.some((e) => e.kind === "hostile_group"));
      assert.ok(w.waited_ticks < 25000);
    } finally {
      await h.close();
      await mock.close();
    }
  });

  it("detects a frozen clock and reports dialogs", async () => {
    const mock = await startMockBridge({ frozen: true });
    let t = 0;
    const h = await connect(mock.url, { waitHooks: { pollMs: 1, stallMs: 50, sleep: async () => {}, now: () => (t += 20) } });
    try {
      const r = await call(h, "rimworld_wait", { hours: 1, timeout_seconds: 60 });
      const w = json<{ reason: string; dialogs: unknown[]; note?: string }>(r);
      assert.equal(w.reason, "stalled");
      assert.ok(Array.isArray(w.dialogs) && w.dialogs.length === 1);
      assert.ok(w.note);
    } finally {
      await h.close();
      await mock.close();
    }
  });

  it("refuses to wait when no game is running", async () => {
    const mock = await startMockBridge({ startInMenu: true });
    const h = await connect(mock.url);
    try {
      const r = await call(h, "rimworld_wait", { hours: 1 });
      assert.equal(r.isError, true);
      assert.match(text(r), /no game is running/);
    } finally {
      await h.close();
      await mock.close();
    }
  });
});

describe("configuration", () => {
  it("exposes dev and engine tools when enabled", async () => {
    const mock = await startMockBridge();
    const h = await connect(mock.url, { enableDev: true, enableEngine: true });
    try {
      const { tools } = await h.client.listTools();
      const names = tools.map((t) => t.name);
      assert.ok(names.includes("rimworld_dev_heal") && names.includes("rimworld_engine_get"));
      const r = await call(h, "rimworld_dev_heal", { pawn: "Sparky" });
      assert.deepEqual(json(r), { healed: "Sparky" });
      const r2 = await call(h, "rimworld_rpc", { method: "engine.get", params: { path: "Pawn:Sparky.needs.food.CurLevel" } });
      assert.equal(json(r2), 0.79);
    } finally {
      await h.close();
      await mock.close();
    }
  });

  it("truncates long results with a hint", async () => {
    const mock = await startMockBridge({ summaryPadding: 5000 });
    const h = await connect(mock.url, { maxChars: 1000 });
    try {
      const r = await call(h, "rimworld_state_summary");
      const t = text(r);
      assert.ok(t.length < 1300, `got ${t.length}`);
      assert.match(t, /\[truncated \d+ of \d+ chars/);
    } finally {
      await h.close();
      await mock.close();
    }
  });

  it("reports an unreachable bridge clearly", async () => {
    const h = await connect("http://127.0.0.1:1");
    try {
      const r = await call(h, "rimworld_game_status");
      assert.equal(r.isError, true);
      assert.match(text(r), /unreachable/);
    } finally {
      await h.close();
    }
  });
});
