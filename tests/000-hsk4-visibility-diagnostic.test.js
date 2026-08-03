"use strict";
const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const { spawnSync } = require("node:child_process");

test("temporary HSK4 visibility diagnostic", { timeout: 90000 }, () => {
  const script = path.join(__dirname, "000-hsk4-visibility-diagnostic.py");
  const result = spawnSync(process.env.PYTHON || "python", [script], {
    encoding: "utf8",
    timeout: 80000,
    env: { ...process.env, PYTHONUNBUFFERED: "1" }
  });
  assert.fail(`HSK4 visibility diagnostic\n${result.stdout}\n${result.stderr}`);
});
