"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const source = read("assets/daily-learning-v2.js");
const content = read("assets/msutong-hsk1-v2.js");
const css = read("assets/daily-learning-v2.css");
const shell = read("app-shell-v88.html");
const sync = read("supabase-sync.js");

test("Home is compact and every primary function opens a dedicated screen", () => {
  assert.match(source, /Chỉ ba việc cần tập trung hôm nay/);
  assert.match(css, /\.app-screen\{height:calc\(100svh/);
  assert.match(source, /showPanel\(kind\)/);
  assert.match(source, /renderRoadmap\(\)/);
  assert.match(source, /startDaily\(kind === "review"\)/);
  assert.match(source, /renderProfile\(\)/);
  assert.match(source, /renderDictionary\(\)/);
  assert.match(source, /event\.target\.closest/);
  assert.match(source, /event\.stopImmediatePropagation\(\)/);
});

test("hamburger drawer groups daily, lookup, ERP and profile navigation", () => {
  assert.match(shell, /id="mobileMenu"[^>]*aria-label="Mở menu"/);
  for (const group of ["HỌC HÔM NAY", "TRA CỨU", "ERP CÔNG VIỆC", "KHÁC"]) assert.ok(shell.includes(group), group);
  for (const label of ["Hôm nay", "MSUTONG", "Daily ERP +5", "Ôn tập", "Từ điển", "Bài học ERP", "Hội thoại ERP", "Sổ từ cá nhân"]) assert.ok(shell.includes(label), label);
  assert.match(css, /body\.sidebar-open \.study-sidebar/);
});

test("Daily ERP teaches, interleaves, contextualizes and tests five stable words", () => {
  assert.match(source, /selected\.length < 5/);
  assert.match(source, /hash\(key\)/);
  assert.doesNotMatch(source, /Math\.random/);
  for (const step of ["intro", "writing", "quiz", "phrase", "sentence", "result"]) assert.ok(source.includes(`type: "${step}"`), step);
  assert.match(source, /if \(index > 0\) plan\.push/);
  assert.match(source, /HanziWriter\.create/);
  assert.match(source, /Từ yếu đã được hẹn quay lại sớm hơn/);
});

test("review records weakness by meaning, pinyin, writing and sentence", () => {
  for (const mode of ["meaning", "pinyin", "write", "sentence"]) assert.ok(source.includes(`"${mode}"`), mode);
  assert.match(source, /item\.skills\[skill\]\.wrong\+\+/);
  assert.match(source, /item\.skills\[skill\]\.correct\+\+/);
  assert.match(source, /weakestSkill/);
  assert.match(source, /10 \* 60000/);
  assert.match(source, /\[0, 3, 6, 9, 12\]/);
});

test("MSUTONG Beginner 1 has ten learnable original companion lessons", () => {
  assert.equal((content.match(/id: "b1-u(?:10|[1-9])"/g) || []).length, 10);
  assert.equal((content.match(/words: \[/g) || []).length, 10);
  assert.equal((content.match(/grammar: \[/g) || []).length, 10);
  assert.equal((content.match(/dialogue: \[/g) || []).length, 10);
  for (const title of ["Xin chào", "Bạn tên là gì?", "Bạn đi đâu?", "Bạn muốn ăn gì?", "Nhà bạn có mấy người?"]) assert.ok(content.includes(title), title);
  assert.match(source, /msutongPlan/);
  assert.match(source, /type: "word"/);
  assert.match(source, /type: "grammar"/);
  assert.match(source, /type: "dialogue"/);
  assert.match(source, /type: "msuQuiz"/);
  assert.match(source, /state\.msutong\.completed\[lesson\.id\]/);
});

test("dictionary is a separate unified page and VDuckie uses the signature asset", () => {
  assert.match(shell, /assets\/v79\/unified-dictionary-v79\.js/);
  assert.match(shell, /data-daily-nav="dictionary"/);
  assert.match(source, /signature-dock/);
  assert.match(source, /assets\/vduckie-logo\.png/);
  assert.match(source, /function renderDictionary/);
  assert.match(source, /searchCompact/);
  assert.match(source, /compactNeedle/);
  assert.match(source, /erp-lite-personal/);
  assert.match(source, /vduckie:learning-change/);
  assert.doesNotMatch(source, /🦆/);
});

test("daily progress still reuses the existing Supabase user_words system row", () => {
  assert.match(sync, /__vduckie_daily_learning_v1__/);
  assert.match(sync, /client\.from\("user_words"\)\.upsert/);
  assert.match(sync, /client\.from\("user_words"\)\.select/);
  assert.match(source, /VDuckieCloud\.saveDailyLearning/);
  assert.match(source, /VDuckieCloud\.loadDailyLearning/);
});

test("mobile dock stays daily-only and respects the safe area", () => {
  for (const label of ["Hôm nay", "MSUTONG", "+5", "Ôn tập", "VDuckie"]) assert.ok(source.includes(label), label);
  assert.match(css, /body \.study-sidebar\{position:fixed!important/);
  assert.match(css, /grid-template-columns:repeat\(5,1fr\)/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(shell, /assets\/daily-learning-v2\.js\?v=2\.5/);
  assert.match(shell, /assets\/daily-learning-v2\.css\?v=2\.5/);
});
