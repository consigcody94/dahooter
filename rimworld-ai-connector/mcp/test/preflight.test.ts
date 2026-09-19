import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Bridge } from "../src/bridge.js";
import { preflight } from "../scripts/preflight.js";
import { startMockBridge } from "./mock-bridge.js";

describe("preflight", () => {
  it("passes against a playing mock bridge and reports add-on methods", async () => {
    const mock = await startMockBridge();
    try {
      const r = await preflight(new Bridge({ url: mock.url, timeoutMs: 5000 }));
      assert.equal(r.failed, false, JSON.stringify(r.rows));
      const checks = Object.fromEntries(r.rows.map((x) => [x.check, x]));
      assert.equal(checks["Bridge /health"].level, "PASS");
      assert.equal(checks["Method catalog"].level, "PASS");
      assert.match(checks["Add-on methods"].detail, /steward\.status/);
      assert.match(checks["Game state"].detail, /playing/);
      assert.equal(checks["Screenshot"].level, "PASS");
    } finally {
      await mock.close();
    }
  });
  it("fails clearly when the bridge is down", async () => {
    const r = await preflight(new Bridge({ url: "http://127.0.0.1:1", timeoutMs: 1000 }));
    assert.equal(r.failed, true);
    assert.match(r.rows.find((x) => x.check === "Bridge /health")!.detail, /unreachable/);
  });
});
