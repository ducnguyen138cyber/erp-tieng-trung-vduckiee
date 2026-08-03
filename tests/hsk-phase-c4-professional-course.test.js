"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { validate } = require("../scripts/hsk3-quality-engine");
const editorialVocabulary = require("../scripts/hsk3-c4-vocabulary-editorial");
const runtime = require("../assets/hsk-content/hsk-professional-runtime.js");

const ROOT = path.resolve(__dirname, "..");
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));

function loadHsk3() {
  const base = "data/hsk/hsk3/";
  const index = readJson(`${base}vocabulary/index.json`);
  return {
    manifest: readJson(`${base}course-manifest.json`),
    units: readJson(`${base}units.json`).records,
    lessons: readJson(`${base}lessons.json`).records,
    grammar: readJson(`${base}grammar.json`).records,
    characters: readJson(`${base}characters.json`).records,
    exercises: readJson(`${base}exercises.json`).records,
    assessments: readJson(`${base}assessments.json`).records,
    enrichment: readJson(`${base}vocabulary-enrichment.json`).entries,
    vocabulary: index.shards.flatMap((shard) => readJson(`${base}vocabulary/${shard.file}`).records),
    officialFacts: readJson(`${base}provenance/official-vocabulary.json`).facts
  };
}

test("HSK3 C4 professional curriculum passes schema, provenance, coverage, diversity and duplicate gates", () => {
  const result = validate(ROOT);
  assert.equal(result.ok, true, JSON.stringify(result.errors, null, 2));
  assert.deepEqual({
    units: result.summary.units,
    lessons: result.summary.lessons,
    vocabulary: result.summary.vocabulary,
    grammar: result.summary.grammar,
    characters: result.summary.characters,
    exercises: result.summary.exercises,
    assessments: result.summary.assessments
  }, { units: 12, lessons: 36, vocabulary: 500, grammar: 42, characters: 100, exercises: 252, assessments: 15 });
  assert.equal(result.summary.officialRows, "501-1000");
  assert.equal(result.summary.cumulativeVocabulary, 1000);
  assert.ok(result.summary.exerciseFormats >= 35);
  assert.ok(result.summary.lexicalRelationCoverage >= 80);
  assert.equal(result.summary.exactDuplicates, 0);
  assert.equal(result.summary.nearDuplicates, 0);
  assert.equal(result.summary.repeatedExampleSkeletons, 0);
});

test("all 500 official HSK3 rows have row-specific Vietnamese editorial and original examples", () => {
  const data = loadHsk3();
  assert.equal(editorialVocabulary.length, 500);
  assert.equal(data.officialFacts.length, 500);
  assert.equal(data.vocabulary.length, 500);
  const examples = new Set();
  data.vocabulary.forEach((word, index) => {
    const editorial = editorialVocabulary[index];
    const fact = data.officialFacts[index];
    assert.equal(word.officialRow, 501 + index);
    assert.equal(fact.row, word.officialRow);
    assert.equal(editorial[0], word.officialRow);
    assert.equal(editorial[1], word.simplified);
    assert.equal(editorial[2], word.meaningVi);
    assert.equal(editorial[3], word.examples[0].zh);
    assert.equal(editorial[4], word.examples[0].vi);
    assert.ok(word.examples[0].zh.includes(word.simplified), `${word.id} example must contain ${word.simplified}`);
    assert.ok(!examples.has(word.examples[0].zh), `${word.id} repeats a vocabulary example`);
    examples.add(word.examples[0].zh);
  });
});

test("HSK3 lessons expose distinct real-life skill content, culture notes and spaced review", () => {
  const data = loadHsk3();
  const required = ["situation", "vocabulary", "character", "grammar", "dialogue", "reading", "listening", "pronunciation", "culture-note", "guided-practice", "independent-practice", "summary", "review"];
  const dialogueTexts = new Set(); const readingTexts = new Set(); const listeningTexts = new Set(); const cultureNotes = new Set();
  data.lessons.forEach((lesson) => {
    const byType = Object.fromEntries(lesson.sections.map((section) => [section.type, section.content]));
    required.forEach((type) => assert.ok(byType[type], `${lesson.id} missing ${type}`));
    assert.equal(byType.listening.audioStatus, "script-ready-audio-pending");
    assert.deepEqual(byType.review.spacingDays, [1, 3, 7, 14, 30]);
    assert.ok(byType["independent-practice"].speakingVi && byType["independent-practice"].writingVi && byType["independent-practice"].realWorldTaskVi);
    assert.ok(!dialogueTexts.has(byType.dialogue.scriptZh)); dialogueTexts.add(byType.dialogue.scriptZh);
    assert.ok(!readingTexts.has(byType.reading.textZh)); readingTexts.add(byType.reading.textZh);
    assert.ok(!listeningTexts.has(byType.listening.scriptZh)); listeningTexts.add(byType.listening.scriptZh);
    assert.ok(!cultureNotes.has(byType["culture-note"].noteVi)); cultureNotes.add(byType["culture-note"].noteVi);
  });
});

test("HSK3 collections satisfy the existing multi-level learner runtime contract", () => {
  const data = loadHsk3();
  runtime.verifyCourse(data.manifest, data.units, data.lessons, data.grammar, data.characters, data.exercises, data.assessments, data.enrichment, data.vocabulary, 3);
  assert.deepEqual([data.units.length, data.lessons.length, data.grammar.length, data.characters.length, data.exercises.length, data.assessments.length, data.vocabulary.length], [12, 36, 42, 100, 252, 15, 500]);
  assert.equal(data.manifest.productionEnabled, false);
  assert.equal(data.manifest.writesProgress, false);
  assert.equal(data.manifest.readOnly, true);
  const runtimeSource = fs.readFileSync(path.join(ROOT, "assets/hsk-content/hsk-professional-runtime.js"), "utf8");
  assert.match(runtimeSource, /data\/hsk\/hsk3/);
  assert.match(runtimeSource, /phase:\s*'C4'/);
  assert.doesNotMatch(runtimeSource, /localStorage\.setItem|sessionStorage\.setItem|method\s*:\s*['"](?:POST|PUT|PATCH|DELETE)/i);
});

test("HSK3 keeps human/audio/stroke signoff honest", () => {
  const result = validate(ROOT);
  assert.equal(result.summary.repositoryErrors, 0);
  assert.ok(result.warnings.some((warning) => warning.rule === "human-signoff"));
  assert.ok(result.warnings.some((warning) => warning.rule === "audio-pending"));
  assert.ok(result.warnings.some((warning) => warning.rule === "stroke-pending"));
});
