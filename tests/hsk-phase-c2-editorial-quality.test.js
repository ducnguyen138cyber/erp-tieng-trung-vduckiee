"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const cp = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));
const records = (name) => readJson(`data/hsk/hsk1/${name}.json`).records;
const lessons = records("lessons");
const grammar = records("grammar");
const exercises = records("exercises");
const assessments = records("assessments");
const course = readJson("data/hsk/hsk1/course-manifest.json");
const level = readJson("data/hsk/hsk1/level.json");
const manifest = readJson("data/hsk/manifest.json");
const editorial = readJson("data/hsk/hsk1/editorial-c2.json");

const section = (lesson, type) => lesson.sections.find((item) => item.type === type);
const normalized = (value) => JSON.stringify(value).normalize("NFKC");

const forbiddenFragments = [
  "先 nghe", "sau đó", " là các chữ", " gặp ", "是“học”",
  "đang tranh luận về một chủ đề trừu tượng", "chỉ đọc một danh sách không có mục đích giao tiếp"
];
const forbiddenOutOfLevelFocus = new Set([
  "碗", "旁边", "前面", "后面", "左边", "右边", "晴", "阴", "身体", "眼睛", "疼", "舒服", "吃药", "周末", "一起", "公园", "每天", "意思", "英语", "生日", "走路", "旧"
]);
const newGrammarIds = [
  "hsk1-grammar-measure-words",
  "hsk1-grammar-separable-verbs",
  "hsk1-grammar-serial-verbs",
  "hsk1-grammar-double-object"
];

test("C2 editorial transform is deterministic and current", () => {
  const result = cp.spawnSync(process.execPath, ["scripts/polish-hsk1-c2.js"], {
    cwd: ROOT,
    encoding: "utf8"
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Validated HSK1 C2/);
});

test("C2 preserves the HSK1 architecture while deepening grammar coverage", () => {
  assert.equal(lessons.length, 24);
  assert.equal(grammar.length, 21);
  assert.equal(exercises.length, 120);
  assert.equal(assessments.length, 13);
  assert.equal(editorial.phase, "C2");
  const ids = new Set(grammar.map((item) => item.id));
  for (const id of newGrammarIds) assert.ok(ids.has(id), id);
  for (const id of newGrammarIds) {
    assert.ok(lessons.some((lesson) => lesson.grammarRefs.includes(id)), `${id} is not taught in any lesson`);
  }
});

test("all 24 lessons have lesson-specific reading, listening, practice and review", () => {
  const readingQuestions = [];
  const listeningQuestions = [];
  const guidedFlows = [];
  const summaries = [];

  for (const lesson of lessons) {
    const reading = section(lesson, "reading").content;
    const listening = section(lesson, "listening").content;
    const guided = section(lesson, "guided-practice").content;
    const summary = section(lesson, "summary").content;
    const review = section(lesson, "review").content;

    assert.ok(reading.textZh.length >= 8, lesson.id);
    assert.equal(reading.questionsVi.length, 2, `${lesson.id}:reading questions`);
    assert.ok(listening.scriptZh.length >= 8, `${lesson.id}:listening transcript`);
    assert.equal(listening.audioStatus, "script-ready-audio-pending", lesson.id);
    assert.equal(listening.questionsVi.length, 2, `${lesson.id}:listening questions`);
    assert.equal(listening.answerKey.length, 2, `${lesson.id}:listening answers`);
    assert.ok(guided.steps.length >= 3, `${lesson.id}:guided practice`);
    assert.ok(summary.checklist.length >= 3, `${lesson.id}:summary`);
    assert.deepEqual(review.spacingDays, [1, 3, 7, 14, 30], `${lesson.id}:spacing`);
    assert.ok(review.realWorldTaskVi.length > 10, `${lesson.id}:real-world task`);

    readingQuestions.push(normalized(reading.questionsVi));
    listeningQuestions.push(normalized(listening.questionsVi));
    guidedFlows.push(normalized(guided.steps));
    summaries.push(normalized(summary.checklist));
  }

  assert.equal(new Set(readingQuestions).size, 24, "reading question sets must be lesson-specific");
  assert.equal(new Set(listeningQuestions).size, 24, "listening question sets must be lesson-specific");
  assert.equal(new Set(guidedFlows).size, 24, "guided practice must be lesson-specific");
  assert.equal(new Set(summaries).size, 24, "summary checklists must be lesson-specific");
});

test("learner-facing Chinese is no longer mixed-language or padded with out-of-level focus", () => {
  for (const lesson of lessons) {
    const chineseInputs = [
      section(lesson, "dialogue").content.scriptZh,
      section(lesson, "reading").content.textZh,
      section(lesson, "listening").content.scriptZh
    ];
    const combined = chineseInputs.join("\n");
    for (const fragment of forbiddenFragments) assert.ok(!combined.includes(fragment), `${lesson.id}:${fragment}`);

    const focusWords = section(lesson, "vocabulary").content.focusWords;
    for (const word of focusWords) {
      assert.ok(!forbiddenOutOfLevelFocus.has(word.simplified), `${lesson.id}:out-of-level focus ${word.simplified}`);
    }
  }
});

test("derived support vocabulary is small, explicit and never disguised as canonical", () => {
  const derived = new Map();
  for (const lesson of lessons) {
    for (const word of section(lesson, "vocabulary").content.focusWords) {
      if (word.lexicalStatus !== "derived-phrase") continue;
      assert.equal(word.canonicalLookup, null, `${lesson.id}:${word.simplified}`);
      assert.equal(word.supportOnly, true, `${lesson.id}:${word.simplified}`);
      assert.ok(word.supportReason && word.supportReason.length > 5, `${lesson.id}:${word.simplified}:supportReason`);
      derived.set(word.simplified, word.supportReason);
    }
  }
  assert.equal(derived.size, 8);
  assert.deepEqual([...derived.keys()].sort(), ["不喜欢", "不能", "吃饭", "回家", "杯", "看电影", "越南", "面条"].sort());
});

test("exercise bank is skill-balanced, prompt-unique and materially more diverse", () => {
  const skills = {};
  const prompts = [];
  const formats = new Set();
  for (const exercise of exercises) {
    skills[exercise.skill] = (skills[exercise.skill] || 0) + 1;
    prompts.push(exercise.prompt.normalize("NFKC"));
    formats.add(exercise.format);
    assert.ok(!exercise.prompt.includes("hsk1-grammar-"), `${exercise.id}:raw grammar id leaked`);
    for (const fragment of forbiddenFragments.slice(-2)) {
      assert.ok(!normalized(exercise).includes(fragment), `${exercise.id}:${fragment}`);
    }
    if (exercise.skill === "listening") {
      assert.equal(exercise.stimulus.audioStatus, "script-ready-audio-pending", exercise.id);
      assert.ok(exercise.stimulus.scriptZh.length >= 8, exercise.id);
    }
  }
  assert.deepEqual(skills, { listening: 24, grammar: 24, reading: 24, speaking: 24, writing: 24 });
  assert.equal(new Set(prompts).size, 120);
  assert.ok(formats.size >= 50, `expected >=50 exercise formats, got ${formats.size}`);
});

test("assessment gates now sample all five skills and keep productive evidence mandatory", () => {
  const midpoint = assessments.find((item) => item.id === "hsk1-assessment-midpoint");
  const final = assessments.find((item) => item.id === "hsk1-assessment-final");
  const mastery = assessments.find((item) => item.id === "hsk1-assessment-mastery");

  for (const assessment of assessments.filter((item) => item.id.includes("unit-"))) {
    const unitNumber = Number(assessment.id.split("-").at(-1));
    const unitId = `hsk1-unit-${String(unitNumber).padStart(2, "0")}`;
    const lessonCount = lessons.filter((lesson) => lesson.unitId === unitId).length;
    assert.ok(lessonCount >= 2, `${assessment.id}:unit lesson count`);
    assert.equal(assessment.exerciseRefs.length, lessonCount * 5, assessment.id);
    assert.deepEqual(Object.keys(assessment.skillWeights).sort(), ["grammar", "listening", "reading", "speaking", "writing"].sort());
  }
  assert.equal(midpoint.exerciseRefs.length, 60);
  assert.equal(final.exerciseRefs.length, 60);
  assert.deepEqual(midpoint.skillWeights, { listening: 20, grammar: 20, reading: 20, speaking: 20, writing: 20 });
  assert.deepEqual(final.skillWeights, { listening: 20, grammar: 20, reading: 20, speaking: 20, writing: 20 });
  assert.equal(final.rubric.noProductionPromotion, true);
  assert.equal(mastery.exerciseRefs.length, 36);
  assert.ok(mastery.skillWeights.grammar > 0);
  assert.ok(mastery.skillWeights.speaking > 0);
  assert.ok(mastery.skillWeights.writing > 0);
});

test("C2 remains explicitly machine-assisted and production locked", () => {
  assert.equal(course.phase, "C2");
  assert.equal(course.productionEnabled, false);
  assert.equal(course.publicOverrideAllowed, false);
  assert.equal(course.writesProgress, false);
  assert.equal(course.reviewGate.productionReleaseAllowed, false);
  assert.equal(level.productionReady, false);
  assert.equal(manifest.qualityGate, "locked");
  assert.equal(manifest.productionEnabled, false);
  assert.equal(manifest.publicOverrideAllowed, false);
  assert.equal(manifest.levels[0].productionReady, false);
  for (const item of [...lessons, ...grammar, ...exercises, ...assessments]) {
    assert.equal(item.contentStatus, "machine-assisted", item.id);
    assert.notEqual(item.translationReviewStatus, "human-reviewed", item.id);
  }
});
