/**
 * HTTP client for the RimBridge mod (https://github.com/zorrobyte/rimbridge).
 *
 * Endpoints: POST /rpc {method, params, timeout_ms} -> {ok, result} | {ok:false, error, trace?}
 *            GET /health, GET /methods, GET /events?since=&limit=, GET /screenshot?x=&z=&w=
 */

export interface BridgeConfig {
  url: string;
  timeoutMs: number;
}

export interface BridgeMethod {
  method: string;
  doc: string;
}

export interface BridgeEvent {
  seq: number;
  kind: string;
  text: string;
  tick?: number;
  day?: number;
  hour?: number;
  cell?: [number, number];
  thing?: string;
  data?: unknown;
}

export interface BridgeEvents {
  events: BridgeEvent[];
  last_seq: number;
  head_seq: number;
  assisted: boolean;
}

export interface BridgeHealth {
  ok: boolean;
  mainThreadAlive: boolean;
  frames: number;
  version: string;
}

export interface GameStatus {
  state: "menu" | "playing" | "loading";
  seq: number;
  job?: string;
  tick?: number;
  day?: number;
  hour?: number;
  date?: string;
  season?: string;
  speed?: number;
  paused?: boolean;
  map_size?: [number, number];
  colonists?: number;
  storyteller?: string;
  difficulty?: string;
  seed?: string;
  assisted?: boolean;
  dev_mode?: boolean;
  god_mode?: boolean;
}

/** An error reported by the bridge itself (bad params, no game running, ...). */
export class BridgeError extends Error {
  constructor(
    message: string,
    public readonly trace?: string
  ) {
    super(message);
    this.name = "BridgeError";
  }
}

/** The bridge could not be reached (game not running, mod disabled, wrong port). */
export class BridgeUnreachable extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BridgeUnreachable";
  }
}

interface Envelope {
  ok: boolean;
  result?: unknown;
  error?: string;
  trace?: string;
}

export class Bridge {
  constructor(readonly config: BridgeConfig) {}

  private async fetchJson(path: string, init: RequestInit & { timeoutMs?: number } = {}): Promise<Envelope> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), init.timeoutMs ?? this.config.timeoutMs + 5000);
    let res: Response;
    try {
      res = await fetch(this.config.url + path, { ...init, signal: ctrl.signal });
    } catch (e) {
      throw new BridgeUnreachable(
        `RimBridge unreachable at ${this.config.url} (${(e as Error).message}). Is RimWorld running with the RimBridge mod enabled, and is RIMBRIDGE_URL right?`
      );
    } finally {
      clearTimeout(timer);
    }
    let text: string;
    try {
      text = await res.text();
    } catch (e) {
      throw new BridgeUnreachable(`RimBridge response could not be read: ${(e as Error).message}`);
    }
    try {
      return JSON.parse(text) as Envelope;
    } catch {
      throw new BridgeError(`RimBridge returned non-JSON (HTTP ${res.status}): ${text.slice(0, 200)}`);
    }
  }

  /** Call an RPC method; throws BridgeError on {ok:false}. */
  async call<T = unknown>(method: string, params: Record<string, unknown> = {}, timeoutMs?: number): Promise<T> {
    const body = JSON.stringify({ method, params, timeout_ms: timeoutMs ?? this.config.timeoutMs });
    const env = await this.fetchJson("/rpc", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      timeoutMs: (timeoutMs ?? this.config.timeoutMs) + 5000,
    });
    if (!env.ok) throw new BridgeError(env.error ?? "unknown bridge error", env.trace);
    return env.result as T;
  }

  async health(): Promise<BridgeHealth> {
    const env = await this.fetchJson("/health", { timeoutMs: 3000 });
    return env as unknown as BridgeHealth;
  }

  async methods(): Promise<BridgeMethod[]> {
    const env = await this.fetchJson("/methods", { timeoutMs: 10000 });
    if (!env.ok) throw new BridgeError(env.error ?? "could not list methods");
    return env.result as BridgeMethod[];
  }

  async events(since: number, limit = 500): Promise<BridgeEvents> {
    const env = await this.fetchJson(`/events?since=${since}&limit=${limit}`, { timeoutMs: 10000 });
    if (!env.ok) throw new BridgeError(env.error ?? "could not read events");
    return env.result as BridgeEvents;
  }

  async status(): Promise<GameStatus> {
    return this.call<GameStatus>("game.status");
  }

  /** PNG bytes of the map around [x,z]; does not move the player's camera. */
  async screenshot(opts: { x?: number; z?: number; w?: number; width_px?: number; height_px?: number }): Promise<Uint8Array> {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(opts)) if (v !== undefined) q.set(k, String(v));
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 40000);
    let res: Response;
    try {
      res = await fetch(`${this.config.url}/screenshot?${q.toString()}`, { signal: ctrl.signal });
    } catch (e) {
      throw new BridgeUnreachable(`RimBridge unreachable at ${this.config.url} (${(e as Error).message})`);
    } finally {
      clearTimeout(timer);
    }
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.startsWith("image/")) {
      const text = await res.text();
      let msg = text.slice(0, 300);
      try {
        const env = JSON.parse(text) as Envelope;
        if (env.error) msg = env.error;
      } catch {
        /* keep raw text */
      }
      throw new BridgeError(`screenshot failed: ${msg}`);
    }
    return new Uint8Array(await res.arrayBuffer());
  }
}

export function bridgeFromEnv(env: NodeJS.ProcessEnv = process.env): Bridge {
  const url = (env.RIMBRIDGE_URL ?? "http://127.0.0.1:8765").replace(/\/+$/, "");
  const timeoutMs = Number.parseInt(env.RIMWORLD_MCP_TIMEOUT_MS ?? "60000", 10);
  return new Bridge({ url, timeoutMs: Number.isFinite(timeoutMs) ? timeoutMs : 60000 });
}
