const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8") + "\n" + fs.readFileSync(path.join(root, "app-shell-v88.html"), "utf8");
const dialogue = fs.readFileSync(path.join(root, "dialogue.js"), "utf8");
const context = { window: {} };

vm.runInNewContext(fs.readFileSync(path.join(root, "lite-terms.js"), "utf8"), context);
vm.runInNewContext(fs.readFileSync(path.join(root, "erp-content-v74.js"), "utf8"), context);

const terms = context.window.ERP_TERMS;
const content = context.window.ERPContentV74;
const extraScenarios = context.window.ERPScenariosV74;

assert.equal(terms.length, 154);
assert.equal(terms.filter((term) => term[6] && term[7]).length, 154, "Every ERP term needs a bilingual example");
assert.equal(content.version, "74.0");
assert.equal(content.lessons.length, 8);
assert.equal(content.lessons.reduce((total, lesson) => total + lesson.words.length, 0), 80);
assert.equal(extraScenarios.length, 12);

const knownWords = new Set(terms.map((term) => term[0]));
for (const lesson of content.lessons) {
  assert.equal(lesson.words.length, 10, `${lesson.title} should contain 10 focus words`);
  assert.equal(lesson.workflow.length, 4, `${lesson.title} should contain four workflow steps`);
  for (const word of lesson.words) assert.ok(knownWords.has(word), `Unknown lesson word: ${word}`);
}

assert.match(html, /id="lessons" class="panel hidden"/);
assert.match(html, /id="erpLessonApp"/);
assert.match(html, /data-view="lessons"/);
assert.match(html, /erp-content-v74\.js\?v=74\.0/);
assert.match(html, /erp-lessons-v74\.js\?v=74\.0/);
assert.match(html, /views=\["lessons","cards","dialogue","quiz","glossary","personal","community"\]/);
assert.match(dialogue, /scenarios = scenarios\.concat\(root\.ERPScenariosV74\)/);

console.log("v74 ERP content tests passed");
