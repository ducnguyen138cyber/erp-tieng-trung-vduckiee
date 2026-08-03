"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const { spawnSync } = require("node:child_process");

test("HSK3 learner browser smoke passes at all required viewports", { timeout: 240000 }, () => {
  const script = path.join(__dirname, "hsk3-learner-browser-smoke.py");
  const result = spawnSync(process.env.PYTHON || "python", [script], {
    encoding: "utf8",
    timeout: 230000,
    env: { ...process.env, PYTHONUNBUFFERED: "1" }
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const payload = JSON.parse(result.stdout.trim());
  assert.deepEqual(Object.keys(payload.viewports).sort(), ["desktop-1024", "desktop-1440", "mobile-320", "mobile-390"]);
  for (const viewport of Object.values(payload.viewports)) {
    assert.equal(viewport.state.selectedLevel, 3);
    assert.equal(viewport.state.readOnly, true);
    assert.equal(viewport.state.progressWritesEnabled, false);
    assert.ok(viewport.metrics.overflow <= 2);
    assert.ok(viewport.metrics.levelRailOverflow <= 2);
  }
  for (const [flow, status] of Object.entries(payload.flows)) assert.equal(status, "pass", flow);
});
