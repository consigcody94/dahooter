/**
 * rimworld_wait: the "end turn" primitive. Unpause at a speed, watch the event ledger for
 * wake-up kinds, stop when the requested in-game time has elapsed (or a wake event, a stall,
 * a state change, or the real-time timeout), pause again, and report what happened.
 */

import type { Bridge, BridgeEvent, GameStatus } from "./bridge.js";
import { BridgeError } from "./bridge.js";

export const TICKS_PER_HOUR = 2500;
export const TICKS_PER_DAY = 60000;

export const DEFAULT_WAKE_ON = [
  "hostile_group", "manhunter", "danger", "colonist_downed", "colonist_died", "mental_break",
  "letter", "incident", "dialog", "quest", "building_lost", "construction_failed",
];

export interface WaitOptions {
  hours?: number;
  ticks?: number;
  speed?: number;
  wake_on?: string[];
  pause_after?: boolean;
  timeout_seconds?: number;
  /** Test hooks. */
  pollMs?: number;
  stallMs?: number;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
}

export interface WaitResult {
  reason: string;
  waited_ticks: number;
  waited_hours: number;
  start_tick: number;
  end_tick: number;
  status: GameStatus;
  events: BridgeEvent[];
  events_total: number;
  last_seq: number;
  dialogs?: unknown;
  note?: string;
}

export interface SessionState {
  lastSeq: number;
}

const defaultSleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

export async function waitTurn(bridge: Bridge, session: SessionState, opts: WaitOptions): Promise<WaitResult> {
  const sleep = opts.sleep ?? defaultSleep;
  const now = opts.now ?? Date.now;
  const pollMs = opts.pollMs ?? 250;
  const stallMs = opts.stallMs ?? 5000;
  const speed = Math.min(4, Math.max(1, Math.round(opts.speed ?? 3)));
  const wake = new Set(opts.wake_on ?? DEFAULT_WAKE_ON);
  const pauseAfter = opts.pause_after ?? true;
  const timeoutMs = Math.max(5, opts.timeout_seconds ?? 300) * 1000;

  const start = await bridge.status();
  if (start.state !== "playing" || start.tick === undefined) {
    throw new BridgeError(`no game is running (state=${start.state}); load or start one first`);
  }
  const ticksToWait = opts.ticks ?? Math.round((opts.hours ?? 1) * TICKS_PER_HOUR);
  if (!(ticksToWait > 0)) throw new BridgeError("hours or ticks must be positive");
  const target = start.tick + ticksToWait;

  let since = Math.max(session.lastSeq, start.seq ?? 0);
  const collected: BridgeEvent[] = [];
  let reason = "timeout";
  let dialogs: unknown;
  let note: string | undefined;

  await bridge.call("game.speed", { speed });

  const deadline = now() + timeoutMs;
  let lastTick = start.tick;
  let lastProgress = now();
  let status: GameStatus = start;

  while (now() < deadline) {
    await sleep(pollMs);
    const ev = await bridge.events(since, 200);
    if (ev.events.length > 0) {
      since = ev.last_seq;
      collected.push(...ev.events);
      const woke = ev.events.find((e) => wake.has(e.kind));
      if (woke) {
        reason = `event:${woke.kind}`;
        break;
      }
    }
    status = await bridge.status();
    if (status.state !== "playing" || status.tick === undefined) {
      reason = `state:${status.state}`;
      break;
    }
    if (status.tick >= target) {
      reason = "elapsed";
      break;
    }
    if (status.tick !== lastTick) {
      lastTick = status.tick;
      lastProgress = now();
    } else if (now() - lastProgress > stallMs) {
      reason = "stalled";
      note = "The game clock stopped advancing. A modal window, letter or the player may have paused it; check dialogs and rimworld_state_letters.";
      try {
        dialogs = await bridge.call("state.dialogs");
      } catch {
        /* ignore */
      }
      break;
    }
  }

  if (pauseAfter) {
    try {
      await bridge.call("game.pause", { paused: true });
    } catch {
      /* the game may already be gone */
    }
  }
  try {
    status = await bridge.status();
  } catch {
    /* keep last */
  }
  // Drain anything that arrived while pausing.
  try {
    const tail = await bridge.events(since, 200);
    if (tail.events.length > 0) {
      since = tail.last_seq;
      collected.push(...tail.events);
    }
  } catch {
    /* ignore */
  }
  session.lastSeq = since;

  const endTick = status.tick ?? lastTick;
  const waited = Math.max(0, endTick - start.tick);
  const MAX_EVENTS = 100;
  const result: WaitResult = {
    reason,
    waited_ticks: waited,
    waited_hours: Math.round((waited / TICKS_PER_HOUR) * 100) / 100,
    start_tick: start.tick,
    end_tick: endTick,
    status,
    events: collected.slice(-MAX_EVENTS),
    events_total: collected.length,
    last_seq: since,
  };
  if (dialogs !== undefined) result.dialogs = dialogs;
  if (note) result.note = note;
  return result;
}
