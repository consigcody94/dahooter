/** In-process fake of the RimBridge HTTP API for tests: same endpoints, same envelopes. */

import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { CATALOG } from "../src/catalog.js";

export interface MockEvent {
  seq: number;
  kind: string;
  text: string;
  tick: number;
  day: number;
  hour: number;
}

export interface MockOptions {
  /** ticks advanced per game.status call while unpaused (simulates time passing) */
  ticksPerStatus?: number;
  /** emit an event when the tick first reaches this value */
  emitAtTick?: { tick: number; kind: string; text: string };
  /** pad state.summary with a filler string of this length (for truncation tests) */
  summaryPadding?: number;
  /** start in the main menu instead of playing */
  startInMenu?: boolean;
  /** never advance time (simulate a modal pause) */
  frozen?: boolean;
}

export interface MockBridge {
  url: string;
  calls: { method: string; params: Record<string, unknown> }[];
  state: { tick: number; speed: number; paused: boolean; playing: boolean; seq: number };
  events: MockEvent[];
  emit(kind: string, text: string): void;
  close(): Promise<void>;
}

// 1x1 transparent PNG
export const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64"
);

export async function startMockBridge(opts: MockOptions = {}): Promise<MockBridge> {
  const ticksPerStatus = opts.ticksPerStatus ?? 1000;
  const state = { tick: 5000, speed: 0, paused: true, playing: !opts.startInMenu, seq: 0 };
  const events: MockEvent[] = [];
  const calls: MockBridge["calls"] = [];
  let emitted = false;

  const emit = (kind: string, text: string): void => {
    state.seq += 1;
    events.push({ seq: state.seq, kind, text, tick: state.tick, day: Math.floor(state.tick / 60000), hour: Math.floor((state.tick % 60000) / 2500) });
  };
  emit("game", "new game started");

  const status = (): Record<string, unknown> => {
    if (!state.playing) return { state: "menu", seq: state.seq, job: "idle", dev_mode: true, god_mode: false };
    if (!state.paused && state.speed > 0 && !opts.frozen) state.tick += ticksPerStatus;
    if (opts.emitAtTick && !emitted && state.tick >= opts.emitAtTick.tick) {
      emitted = true;
      emit(opts.emitAtTick.kind, opts.emitAtTick.text);
    }
    return {
      state: "playing", seq: state.seq, tick: state.tick, day: Math.floor(state.tick / 60000), hour: Math.floor((state.tick % 60000) / 2500),
      date: "5th of Aprimay, 5500", season: "Spring", speed: state.speed, paused: state.paused, map_size: [250, 250], colonists: 3,
      storyteller: "Cassandra", difficulty: "Rough", seed: "mock", assisted: false, dev_mode: true, god_mode: false,
    };
  };

  const methods = (): unknown[] => [
    ...CATALOG.map((s) => ({ method: s.method, doc: s.description.slice(0, 80) })),
    { method: "map.screenshot_bytes", doc: "{x?, z?, w?} png base64" },
    { method: "steward.status", doc: "status of the optional steward add-on" },
  ];

  const rpc = (method: string, params: Record<string, unknown>): { ok: boolean; result?: unknown; error?: string } => {
    calls.push({ method, params });
    switch (method) {
      case "game.status":
        return { ok: true, result: status() };
      case "game.speed": {
        const s = Number(params.speed);
        state.speed = s;
        state.paused = s === 0;
        return { ok: true, result: { speed: s, paused: state.paused } };
      }
      case "game.pause":
        state.paused = params.paused !== false;
        return { ok: true, result: { paused: state.paused, speed: state.speed } };
      case "state.summary":
        return { ok: true, result: { date: "5th of Aprimay", colonists: 3, food_days: 4.2, wealth: 12000, alerts: [], padding: "x".repeat(opts.summaryPadding ?? 0) } };
      case "state.dialogs":
        return { ok: true, result: [{ i: 0, title: "Mock dialog", choices: ["OK"] }] };
      case "ui.build":
        return { ok: true, result: { placed: [[60, 60]], failed: [], echo: params } };
      case "ui.set_work":
        return { ok: true, result: { pawn: params.pawn, applied: params.priorities } };
      case "steward.status":
        return { ok: true, result: { scorer: true, echo: params } };
      case "bridge.methods":
        return { ok: true, result: methods() };
      case "dev.heal":
        return { ok: true, result: { healed: params.pawn } };
      case "engine.get":
        return { ok: true, result: 0.79 };
      default:
        return { ok: false, error: `unknown method '${method}'` };
    }
  };

  const server: Server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    const json = (code: number, body: unknown): void => {
      res.writeHead(code, { "content-type": "application/json" });
      res.end(JSON.stringify(body));
    };
    if (url.pathname === "/health") return json(200, { ok: true, mainThreadAlive: true, frames: 1234, version: "0.1.0" });
    if (url.pathname === "/methods") return json(200, { ok: true, result: methods() });
    if (url.pathname === "/events") {
      const since = Number(url.searchParams.get("since") ?? 0);
      const limit = Number(url.searchParams.get("limit") ?? 500);
      const evs = events.filter((e) => e.seq > since).slice(0, limit);
      return json(200, { ok: true, result: { events: evs, last_seq: evs.length ? evs[evs.length - 1].seq : since, head_seq: state.seq, assisted: false } });
    }
    if (url.pathname === "/screenshot") {
      calls.push({ method: "GET /screenshot", params: Object.fromEntries(url.searchParams.entries()) });
      if (!state.playing) return json(500, { ok: false, error: "no game is running" });
      res.writeHead(200, { "content-type": "image/png", "content-length": TINY_PNG.length });
      return res.end(TINY_PNG);
    }
    if (url.pathname === "/rpc" && req.method === "POST") {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        let call: { method?: string; params?: Record<string, unknown> };
        try {
          call = JSON.parse(body);
        } catch (e) {
          return json(400, { ok: false, error: "bad json: " + (e as Error).message });
        }
        json(200, rpc(call.method ?? "", call.params ?? {}));
      });
      return;
    }
    json(404, { ok: false, error: "not found" });
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = (server.address() as AddressInfo).port;
  return {
    url: `http://127.0.0.1:${port}`,
    calls,
    state,
    events,
    emit,
    close: () => new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve()))),
  };
}
