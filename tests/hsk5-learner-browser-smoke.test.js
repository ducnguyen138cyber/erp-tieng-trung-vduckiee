"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { spawnSync } = require("node:child_process");

test("HSK5 learner browser smoke passes at all required viewports", { timeout: 360000 }, () => {
  const script = path.join(__dirname, "hsk5-learner-browser-smoke.py");
  const favicon = path.join(__dirname, "..", "favicon.ico");
  const existed = fs.existsSync(favicon);
  try {
    if (!existed) fs.writeFileSync(favicon, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect width="1" height="1"/></svg>', "utf8");
    const result = spawnSync(process.env.PYTHON || "python", [script], {
      encoding: "utf8", timeout: 350000, env: { ...process.env, PYTHONUNBUFFERED: "1" }
    });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    const payload = JSON.parse(result.stdout.trim());
    assert.deepEqual(Object.keys(payload.viewports).sort(), ["desktop-1024","desktop-1440","mobile-320","mobile-390"]);
    for (const viewport of Object.values(payload.viewports)) {
      assert.equal(viewport.state.selectedLevel, 5);
      assert.equal(viewport.state.readOnly, true);
      assert.equal(viewport.state.progressWritesEnabled, false);
      assert.ok(viewport.metrics.overflow <= 2);
      assert.ok(viewport.metrics.levelRailOverflow <= 2);
    }
    for (const [flow,status] of Object.entries(payload.flows)) assert.equal(status, "pass", flow);
    const errors=[...payload.requestFailures,...payload.httpErrors].filter((x)=>/\/data\/hsk\/|\/assets\/hsk-content\//i.test(x));
    assert.deepEqual(errors,[]);
  } finally {
    if (!existed && fs.existsSync(favicon)) fs.unlinkSync(favicon);
  }
});
