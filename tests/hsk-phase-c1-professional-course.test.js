"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const cp = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const HSK1 = path.join(ROOT, "data/hsk/hsk1");
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));
const collection = (name) => { const document = readJson(`data/hsk/hsk1/${name}.json`); return document.records || document.entries; };
const normalize = (value) => value.normalize("NFKC").toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, "");
const unique = (values, label) => assert.equal(new Set(values).size, values.length, `${label} must be unique`);

const manifest = readJson("data/hsk/manifest.json");
const course = readJson("data/hsk/hsk1/course-manifest.json");
const level = readJson("data/hsk/hsk1/level.json");
const units = collection("units");
const lessons = collection("lessons");
const grammar = collection("grammar");
const characters = collection("characters");
const exercises = collection("exercises");
const assessments = collection("assessments");
const enrichment = collection("vocabulary-enrichment");

const unitIds = new Set(units.map((record) => record.id));
const lessonIds = new Set(lessons.map((record) => record.id));
const grammarIds = new Set(grammar.map((record) => record.id));
const characterIds = new Set(characters.map((record) => record.id));
const exerciseIds = new Set(exercises.map((record) => record.id));
const assessmentIds = new Set(assessments.map((record) => record.id));
const sourceAllowlist = new Set(course.sourceIds);

function allRecords() {
  return [level, ...units, ...lessons, ...grammar, ...characters, ...exercises, ...assessments, ...enrichment];
}

function chineseCharacterCount(value) {
  return [...value].filter((character) => /\p{Script=Han}/u.test(character)).length;
}

test("C1 builder output is deterministic and current", () => {
  const result = cp.spawnSync(process.execPath, ["scripts/build-hsk-curriculum-c1.js"], {
    cwd: ROOT,
    encoding: "utf8"
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Validated HSK1 C1/);
});

test("course implements the approved 10-unit, 24-lesson architecture", () => {
  assert.equal(units.length, 10);
  assert.equal(lessons.length, 24);
  assert.equal(grammar.length, 17);
  assert.equal(characters.length, 50);
  assert.equal(exercises.length, 120);
  assert.equal(assessments.length, 13);
  assert.equal(enrichment.length, 133);
  assert.equal(level.unitRefs.length, 10);
  assert.equal(level.lessonIndex.length, 24);
  assert.equal(level.assessmentRefs.length, 13);
  assert.equal(level.finalAssessmentId, "hsk1-assessment-final");
});

test("all IDs and learner-facing titles are unique", () => {
  unique(allRecords().map((record) => record.id), "all record IDs");
  unique(units.map((record) => normalize(record.titleVi)), "unit titles");
  unique(lessons.map((record) => normalize(record.titleVi)), "lesson titles");
  unique(exercises.map((record) => normalize(record.prompt)), "exercise prompts");
  unique(enrichment.map((record) => record.simplified), "vocabulary enrichment lookups");
});

test("lesson references resolve and prerequisites are sequential", () => {
  for (const unit of units) {
    assert.ok(unit.lessonRefs.length >= 2, unit.id);
    assert.ok(assessmentIds.has(unit.checkpointRef.id), unit.checkpointRef.id);
    for (const ref of unit.lessonRefs) assert.ok(lessonIds.has(ref.id), ref.id);
    for (const id of unit.prerequisiteUnitIds) assert.ok(unitIds.has(id), id);
  }
  for (const unit of units) {
    const unitLessons = lessons.filter((lesson) => lesson.unitId === unit.id);
    assert.deepEqual(unitLessons.map((lesson) => lesson.order), unitLessons.map((_, index) => index + 1), `${unit.id} local order`);
  }
  lessons.forEach((lesson, index) => {
    assert.ok(unitIds.has(lesson.unitId), lesson.unitId);
    for (const id of lesson.prerequisiteIds) assert.ok(lessonIds.has(id), id);
    for (const id of lesson.grammarRefs) assert.ok(grammarIds.has(id), id);
    for (const id of lesson.characterRefs) assert.ok(characterIds.has(id), id);
    for (const id of lesson.practiceRefs) assert.ok(exerciseIds.has(id), id);
    const expectedReview = index === 0 ? [] : [`${lessons[index - 1].id}-exercise-2`];
    assert.deepEqual(lesson.reviewRefs, expectedReview);
  });
  for (const assessment of assessments) {
    for (const id of assessment.exerciseRefs) assert.ok(exerciseIds.has(id), `${assessment.id}:${id}`);
    for (const id of assessment.targetGrammar) assert.ok(grammarIds.has(id), `${assessment.id}:${id}`);
  }
});

test("every lesson supplies integrated input, output, feedback and spaced review", () => {
  const requiredTypes = [
    "situation", "vocabulary", "character", "grammar", "dialogue", "reading",
    "listening", "pronunciation", "guided-practice", "independent-practice", "summary", "review"
  ];
  for (const lesson of lessons) {
    const byType = new Map(lesson.sections.map((section) => [section.type, section]));
    for (const type of requiredTypes) assert.ok(byType.has(type), `${lesson.id}:${type}`);
    assert.equal(lesson.sections.length, 12);
    assert.ok(byType.get("dialogue").content.scriptZh.split("\n").length >= 2, lesson.id);
    assert.equal(byType.get("listening").content.audioStatus, "script-ready-audio-pending");
    assert.equal(byType.get("listening").content.passes.length, 4);
    assert.ok(byType.get("independent-practice").content.speakingVi.length > 10);
    assert.ok(byType.get("independent-practice").content.writingVi.length > 10);
    assert.deepEqual(byType.get("review").content.spacingDays, [1, 3, 7, 14, 30]);
    assert.ok(byType.get("review").content.realWorldTaskVi.length > 10);
    const readingZh = byType.get("reading").content.textZh;
    assert.ok(chineseCharacterCount(readingZh) >= 5, lesson.id);
    assert.ok(chineseCharacterCount(readingZh) <= 80, `${lesson.id} exceeds HSK1 reading envelope`);
  }
});

test("vocabulary is taught through canonical lookups, collocations and Vietnamese learner errors", () => {
  for (const record of enrichment) {
    assert.deepEqual(record.canonicalLookup, { field: "simplified", value: record.simplified });
    assert.ok(record.collocations.length >= 2, record.simplified);
    assert.ok(record.commonErrorsVi.length >= 1, record.simplified);
    assert.ok(record.learnerNoteVi.includes(record.simplified));
  }
  const derivedPhrases = new Set();
  for (const lesson of lessons) {
    const focusWords = lesson.sections.find((section) => section.type === "vocabulary").content.focusWords;
    assert.ok(focusWords.length >= 4, lesson.id);
    unique(focusWords.map((item) => item.simplified), `${lesson.id} vocabulary`);
    for (const item of focusWords) {
      if (item.lexicalStatus === "derived-phrase") {
        derivedPhrases.add(item.simplified);
        assert.equal(item.canonicalLookup, null, `${lesson.id}:${item.simplified}`);
      } else {
        assert.equal(item.lexicalStatus, "canonical", `${lesson.id}:${item.simplified}`);
        assert.deepEqual(item.canonicalLookup, { field: "simplified", value: item.simplified });
      }
    }
  }
  assert.equal(derivedPhrases.size, 31);
});

test("grammar records explain form, meaning, position, correct use and Vietnamese learner errors", () => {
  for (const record of grammar) {
    assert.ok(record.formula.length > 2, record.id);
    assert.ok(record.usageVi.length >= 2, record.id);
    assert.ok(record.correctExamples.length >= 2, record.id);
    assert.ok(record.incorrectExamples.length >= 1, record.id);
    assert.ok(record.commonErrorsVi.length >= 1, record.id);
    assert.equal(record.reviewStatus, "linguistic-reviewed");
  }
});

test("character strand remains honest about pending stroke-order verification", () => {
  for (const record of characters) {
    assert.equal(record.recognitionRequired, true);
    assert.ok(record.readings.length >= 1, record.id);
    assert.equal(record.strokeOrderStatus, "static-fallback");
    assert.equal(record.strokeOrderAsset, null);
    assert.equal(record.reviewStatus, "unreviewed");
  }
});

test("exercise set is balanced, non-duplicated and gives answer evidence", () => {
  const skills = new Map();
  for (const exercise of exercises) {
    skills.set(exercise.skill, (skills.get(exercise.skill) || 0) + 1);
    assert.ok(exercise.prompt.length > 10, exercise.id);
    assert.ok(exercise.explanationVi.length > 10, exercise.id);
    assert.ok(exercise.answer !== null && exercise.answer !== undefined, exercise.id);
    if (!exercise.options.length) assert.ok(exercise.acceptedAnswers.length >= 1, exercise.id);
    assert.equal(exercise.contentStatus, "machine-assisted");
  }
  assert.deepEqual(Object.fromEntries([...skills].sort()), {
    grammar: 24,
    listening: 24,
    reading: 24,
    speaking: 24,
    writing: 24
  });
});

test("assessment and mastery gates require productive skills", () => {
  for (const assessment of assessments) {
    const weightTotal = Object.values(assessment.skillWeights).reduce((sum, value) => sum + value, 0);
    assert.equal(weightTotal, 100, assessment.id);
    assert.ok(assessment.exerciseRefs.length >= 4, assessment.id);
    assert.notEqual(assessment.contentStatus, "production-ready");
  }
  assert.deepEqual(course.learnerJourney.mastery, {
    knowledge: 80,
    receptive: 75,
    productive: 70,
    mandatory: ["pronunciation-foundation", "final-assessment", "speaking-task"],
    spacingDays: [1, 3, 7, 14, 30]
  });
  assert.equal(assessments.find((item) => item.id === "hsk1-assessment-final").rubric.noProductionPromotion, true);
});

test("source IDs are allowlisted and production safety remains locked", () => {
  for (const record of allRecords()) {
    assert.ok(Array.isArray(record.sourceIds) && record.sourceIds.length > 0, record.id);
    for (const id of record.sourceIds) assert.ok(sourceAllowlist.has(id), `${record.id}:${id}`);
  }
  assert.equal(manifest.qualityGate, "locked");
  assert.equal(manifest.productionEnabled, false);
  assert.equal(manifest.publicOverrideAllowed, false);
  assert.equal(manifest.levels[0].productionReady, false);
  assert.equal(course.productionEnabled, false);
  assert.equal(course.publicOverrideAllowed, false);
  assert.equal(course.writesProgress, false);
  assert.equal(course.reviewGate.productionReleaseAllowed, false);
  assert.equal(level.productionReady, false);
  assert.ok(allRecords().every((record) => record.contentStatus !== "production-ready"));
});

test("full repository canonical inventory resolves lesson and enrichment lookups when available", (t) => {
  const vocabularyDirectory = path.join(HSK1, "vocabulary");
  if (!fs.existsSync(vocabularyDirectory)) return t.skip("canonical shards are not present in this isolated validation checkout");
  const files = fs.readdirSync(vocabularyDirectory).filter((file) => /^hsk1-v-\d{4}-\d{4}\.json$/.test(file));
  assert.equal(files.length, 6);
  const canonical = new Set(files.flatMap((file) => JSON.parse(fs.readFileSync(path.join(vocabularyDirectory, file), "utf8")).records.map((record) => record.simplified)));
  const lookups = new Set([
    ...enrichment.map((record) => record.simplified),
    ...lessons.flatMap((lesson) => lesson.sections.find((section) => section.type === "vocabulary").content.focusWords.filter((item) => item.canonicalLookup).map((item) => item.canonicalLookup.value))
  ]);
  const missing = [...lookups].filter((word) => !canonical.has(word));
  assert.deepEqual(missing, [], `unresolved canonical lookups: ${missing.join("、")}`);
});
