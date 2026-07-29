"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const cp = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const json = (relativePath) => JSON.parse(read(relativePath));
const architecture = json("data/hsk/curriculum/architecture.json");
const audit = json("reports/hsk-c0-content-audit.json");

test("C0 generated architecture and audit are deterministic", () => {
  const output = cp.execFileSync(process.execPath, [path.join(root, "scripts/build-hsk-curriculum-c0.js")], {
    cwd: root,
    encoding: "utf8"
  });
  assert.match(output, /"ok": true/);
  assert.match(output, /"phaseC1Allowed": true/);
  assert.match(output, /"productionAllowed": false/);
});

test("nine levels are complete architectural records across three stages", () => {
  assert.deepEqual(architecture.levels.map((level) => level.level), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.deepEqual(architecture.stages.map((stage) => stage.levels), [[1, 2, 3], [4, 5, 6], [7, 8, 9]]);
  for (const level of architecture.levels) {
    assert.ok(level.outputObjectivesVi.length >= 3, `HSK${level.level} output`);
    assert.ok(level.units.length >= 10, `HSK${level.level} units`);
    assert.equal(level.units.length, level.levelStructure.unitCount);
    assert.equal(new Set(level.units.map((unit) => unit.id)).size, level.units.length);
    assert.ok(level.levelStructure.orientation);
    assert.ok(level.levelStructure.midLevelAssessment);
    assert.ok(level.levelStructure.finalAssessment);
    assert.ok(level.levelStructure.remedialPractice);
    assert.ok(level.levelStructure.masteryReview);
    assert.equal(level.productionReady, false);
  }
});

test("every level specifies five skills, language scope, exercises and progression gate", () => {
  for (const level of architecture.levels) {
    for (const skill of ["listeningVi", "speakingVi", "readingVi", "writingVi", "translationVi"]) {
      assert.ok(level.skills[skill].length > 20, `HSK${level.level} ${skill}`);
    }
    assert.ok(level.languageSystem.vocabulary.scopeVi);
    assert.ok(level.languageSystem.characters.scopeVi);
    assert.ok(level.languageSystem.grammar.focusVi.length >= 7);
    assert.ok(level.exerciseFamilies.length >= 8);
    assert.ok(level.assessments.masteryCriteria.knowledge >= 80);
    assert.ok(level.assessments.masteryCriteria.productive >= 70);
  }
});

test("standard framework, new exam blueprint and transition status stay distinct", () => {
  assert.equal(architecture.normativeModel.framework.version, "GF0025-2021");
  assert.equal(architecture.normativeModel.examTrack.version, "CTI-HSK3.0-2026");
  assert.equal(architecture.normativeModel.examTrack.rolloutStatus, "transition");
  assert.equal(architecture.normativeModel.examTrack.reverifyBeforeRelease, true);
  assert.match(architecture.normativeModel.nonEquivalenceRule, /Không dùng quota/);
  assert.deepEqual(architecture.normativeModel.examVocabularyCumulative, {
    1: 300,
    2: 500,
    3: 1000,
    4: 2000,
    5: 3600,
    6: 5400,
    "7-9": 11000
  });
});

test("HSK 7-9 never claims an invented official three-way word split", () => {
  for (const level of architecture.levels.filter((entry) => entry.level >= 7)) {
    assert.equal(level.officialAlignment.examVocabularyBand, "7-9");
    assert.equal(level.languageSystem.vocabulary.officialSplit, false);
    assert.match(level.officialAlignment.advancedBandSplitPolicy, /Combined official 7-9/);
    assert.match(level.languageSystem.characters.scopeVi, /7–9|7-9/);
  }
});

test("lesson, spaced review, assessment and human-review contracts are explicit", () => {
  const sectionIds = architecture.lessonContract.sections.map((section) => section.id);
  for (const id of ["objectives", "warm-up", "vocabulary", "characters", "grammar", "input", "listening", "speaking", "reading", "writing", "integrated-practice", "spaced-review", "real-world-task"]) {
    assert.ok(sectionIds.includes(id), id);
  }
  assert.deepEqual(architecture.knowledgeLifecycle.spacingDays, [1, 3, 7, 14, 30]);
  assert.ok(architecture.reviewPolicy.humanSamplingPerLevel.vocabulary >= 30);
  assert.ok(architecture.reviewPolicy.humanSamplingPerLevel.exercises >= 40);
  assert.match(architecture.reviewPolicy.productionRule, /Không level nào production-ready/);
});

test("content audit records real strengths and release blockers", () => {
  assert.equal(audit.inventory.production.hsk1Lessons, 15);
  assert.equal(audit.inventory.production.hsk1Vocabulary, 150);
  assert.equal(audit.inventory.canonical.hsk1Vocabulary, 300);
  assert.equal(audit.inventory.canonical.hsk1Sentences, 900);
  assert.equal(audit.inventory.canonical.units, 0);
  assert.equal(audit.canonicalHsk1Quality.collocationCoverage, 0);
  assert.equal(audit.canonicalHsk1Quality.machineAssistedTranslations, 300);
  assert.equal(audit.canonicalHsk1Quality.humanReviewedTranslations, 0);
  assert.ok(audit.gaps.some((gap) => gap.id === "C0-GAP-001" && gap.severity === "blocking-for-c1-release"));
  assert.equal(audit.reviewSampling.status, "human-review-not-completed");
  assert.equal(audit.decision.phaseC1Allowed, true);
  assert.equal(audit.decision.phaseC1ProductionReleaseAllowed, false);
});

test("source claims are traceable to current official and institutional records", () => {
  const registry = json("data/hsk/sources.json");
  const ids = new Set(registry.sources.map((source) => source.sourceId));
  for (const id of audit.sourceAudit.requiredC0SourceIds) assert.ok(ids.has(id), id);
  for (const claim of architecture.sourceClaims) {
    assert.ok(claim.contentUse);
    assert.ok(claim.sourceIds.length);
    for (const id of claim.sourceIds) assert.ok(ids.has(id), `${claim.claimId}:${id}`);
  }
});

test("C0 keeps canonical production, public override and user-data changes blocked", () => {
  const manifest = json("data/hsk/manifest.json");
  assert.equal(manifest.productionEnabled, false);
  assert.equal(manifest.publicOverrideAllowed, false);
  assert.equal(manifest.qualityGate, "locked");
  assert.equal(architecture.productionSafety.curriculumEnabled, false);
  assert.equal(architecture.productionSafety.userDataMigration, false);
  assert.equal(architecture.productionSafety.supabaseMigration, false);
  assert.equal(audit.productionSafety.productionCurriculum, "legacy-hsk1-v75");
  assert.equal(audit.productionSafety.supabaseChanged, false);
  assert.equal(audit.productionSafety.userDataChanged, false);
});
