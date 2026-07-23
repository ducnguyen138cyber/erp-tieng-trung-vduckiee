const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

test("real Chromium DOM workflow passes at required viewports", { timeout: 120000 }, () => {
  const script = path.join(__dirname, "v108-developer-runtime-dom.py");
  const result = spawnSync(process.env.PYTHON || "python", [script], { encoding: "utf8", timeout: 110000 });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const payload = JSON.parse(result.stdout.trim());
  assert.equal(payload.length, 4);
  payload.forEach(entry => {
    assert.equal(entry.rootCount, 1);
    assert.equal(entry.legacy, 0);
    assert.equal(entry.tabs, 8);
    assert.equal(entry.visiblePanels, 1);
    assert.equal(entry.horizontalOverflow, false);
  });
});
