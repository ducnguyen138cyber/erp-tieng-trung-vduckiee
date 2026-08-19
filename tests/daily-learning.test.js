"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "assets/daily-learning-v1.js"), "utf8");
const css = fs.readFileSync(path.join(root, "assets/daily-learning-v1.css"), "utf8");
const shell = fs.readFileSync(path.join(root, "app-shell-v88.html"), "utf8");
const sync = fs.readFileSync(path.join(root, "supabase-sync.js"), "utf8");

test("MSUTONG is a data-driven 12-book roadmap with honest content status", () => {
  assert.equal((source.match(/id: "(?:beginner|intermediate|advanced)-[1-4]"/g) || []).length, 12);
  for (const title of ["Xin chào", "Bạn tên là gì?", "Bạn đi đâu?", "Bạn muốn ăn gì?", "Nhà bạn có mấy người?"]) assert.ok(source.includes(title), title);
  assert.match(source, /status: "partial"/);
  assert.match(source, /status: "mapped"/);
  assert.match(source, /không phải bản sao giáo trình/);
});

test("Daily 5 assignment is date-stable and selects five unseen ERP terms", () => {
  assert.match(source, /state\.assignments\[key\]/);
  assert.match(source, /selected\.length < 5/);
  assert.match(source, /var unseen = terms\.filter/);
  assert.match(source, /hash\(key\)/);
  assert.doesNotMatch(source, /Math\.random/);
});

test("review requires repeated recall and tracks weaknesses", () => {
  assert.match(source, /\["meaning", "pinyin", "write"\]/);
  assert.match(source, /skills: \{\}/);
  assert.match(source, /m\.skills\[mode\]\.correct\+\+/);
  assert.match(source, /m\.skills\[mode\]\.wrong\+\+/);
  assert.match(source, /\[0, 3, 6, 9, 12\]/);
  assert.match(source, /10 \* 60000/);
  assert.match(source, /INTERVALS\[Math\.max\(1, m\.stage\)\] \* DAY/);
});

test("Daily learning reuses user_words cloud sync and never reports offline sync", () => {
  assert.match(sync, /__vduckie_daily_learning_v1__/);
  assert.match(sync, /client\.from\("user_words"\)\.upsert/);
  assert.match(sync, /client\.from\("user_words"\)\.select/);
  assert.match(sync, /setStatus\("Chờ có mạng", "waiting"\)/);
  assert.match(source, /Đang ngoại tuyến · tiến độ chưa đồng bộ cloud/);
});

test("mobile dock has five actions and safe-area spacing", () => {
  for (const label of ["Hôm nay", "MSUTONG", "+5", "Ôn tập", "VDuckie"]) assert.ok(source.includes(label), label);
  assert.match(css, /grid-template-columns:repeat\(5,1fr\)/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /padding-bottom:calc\(76px/);
  assert.match(shell, /assets\/daily-learning-v1\.js\?v=1\.0/);
  assert.match(shell, /assets\/daily-learning-v1\.css\?v=1\.0/);
});
