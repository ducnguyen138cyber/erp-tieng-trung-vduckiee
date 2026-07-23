'use strict';

const path = require('node:path');
const duplicate = require('./hsk-duplicate-engine');
const { RECORD_TYPES, SKILLS, stableSort, writeJsonDeterministic, validateRepository, checkDuplicates } = duplicate;

function summarizeRecords(records) {
  const byType = Object.fromEntries([...RECORD_TYPES].map((type) => [type, records.filter((entry) => entry.record.recordType === type)]));
  const exerciseRecords = byType.exercise.map((entry) => entry.record);
  const skillCounts = Object.fromEntries(SKILLS.map((skill) => [skill, exerciseRecords.filter((record) => record.skill === skill).length]));
  const topicDistribution = {}, difficultyDistribution = {};
  for (const exercise of exerciseRecords) {
    topicDistribution[exercise.topic] = (topicDistribution[exercise.topic] || 0) + 1;
    difficultyDistribution[String(exercise.difficulty)] = (difficultyDistribution[String(exercise.difficulty)] || 0) + 1;
  }
  const practicedVocabulary = new Set(exerciseRecords.flatMap((record) => record.vocabularyFocus || []));
  const practicedGrammar = new Set(exerciseRecords.flatMap((record) => record.grammarFocus || []));
  const introducedVocabulary = new Set(byType.lesson.flatMap((entry) => entry.record.vocabularyRefs || []));
  const introducedGrammar = new Set(byType.lesson.flatMap((entry) => entry.record.grammarRefs || []));
  const sourced = records.filter((entry) => Array.isArray(entry.record.sourceIds) && entry.record.sourceIds.length > 0).length;
  const unreviewed = records.filter((entry) => ['unreviewed', 'draft', 'machine-assisted'].includes(entry.record.reviewStatus) || ['draft', 'machine-assisted'].includes(entry.record.translationReviewStatus)).length;
  return {
    units: byType.unit.length, lessons: byType.lesson.length, vocabulary: byType.vocabulary.length,
    grammar: byType.grammar.length, characters: byType.character.length, exercises: exerciseRecords.length,
    exercisesBySkill: skillCounts, assessments: byType.assessment.length,
    checkpoints: byType.assessment.filter((entry) => entry.record.assessmentType === 'mini-checkpoint').length,
    sourcedRecords: sourced, sourceCoverage: records.length ? Number((sourced / records.length).toFixed(4)) : 0,
    unreviewedRecords: unreviewed,
    vocabularyIntroducedButNotPracticed: [...introducedVocabulary].filter((id) => !practicedVocabulary.has(id)).sort(),
    grammarWithoutExercise: [...introducedGrammar].filter((id) => !practicedGrammar.has(id)).sort(),
    topicDistribution: stableSort(topicDistribution), difficultyDistribution: stableSort(difficultyDistribution)
  };
}
function checkCoverage(rootDirectory, options = {}) {
  const validation = validateRepository(rootDirectory, options);
  const repository = validation.repository;
  const levels = [];
  for (const manifestLevel of (repository.manifest && repository.manifest.levels) || []) {
    const records = repository.records.filter((entry) => entry.record.contentStatus !== 'fixture' && (entry.record.level === manifestLevel.level || entry.record.hskLevel === manifestLevel.level));
    const summary = summarizeRecords(records);
    const requiredSkills = manifestLevel.stage === 'advanced' ? SKILLS : manifestLevel.level >= 5 ? SKILLS : ['vocabulary', 'grammar', 'listening', 'speaking', 'reading', 'writing'];
    levels.push({ level: manifestLevel.level, stage: manifestLevel.stage, status: manifestLevel.status, productionReady: false, complete: false, completionReason: manifestLevel.status === 'planned' ? 'planned-level-has-no-approved-content' : 'quality-gate-locked', ...summary, missingSkills: requiredSkills.filter((skill) => summary.exercisesBySkill[skill] === 0) });
  }
  const fixtureRecords = repository.records.filter((entry) => entry.record.contentStatus === 'fixture');
  const fixtureSummary = summarizeRecords(fixtureRecords);
  const fixtureRequiredSkills = ['vocabulary', 'grammar', 'listening', 'speaking', 'reading', 'writing'];
  const fixtures = [{ id: 'phase1-hsk1-foundation', level: 1, status: 'fixture', productionReady: false, complete: false, completionReason: 'fixture-only-not-curriculum', ...fixtureSummary, missingSkills: fixtureRequiredSkills.filter((skill) => fixtureSummary.exercisesBySkill[skill] === 0) }];
  return { schemaVersion: '1.0.0', qualityGate: 'locked', levels, fixtures, totals: { plannedLevels: levels.filter((level) => level.status === 'planned').length, productionReadyLevels: 0, fixtureRecords: fixtureRecords.length, validationErrors: validation.summary.errors } };
}
function generateSourceReport(repository) {
  const sources = (repository.sourceRegistry && repository.sourceRegistry.sources) || [];
  const usage = new Map(sources.map((source) => [source.sourceId, 0]));
  repository.records.forEach((entry) => (entry.record.sourceIds || []).forEach((sourceId) => usage.set(sourceId, (usage.get(sourceId) || 0) + 1)));
  const byLicenseStatus = {};
  sources.forEach((source) => { byLicenseStatus[source.licenseStatus] = (byLicenseStatus[source.licenseStatus] || 0) + 1; });
  const reviewRequiredSources = sources.filter((source) => source.licenseStatus === 'review-required').map((source) => source.sourceId).sort();
  const usedReviewRequiredSources = reviewRequiredSources.filter((sourceId) => (usage.get(sourceId) || 0) > 0);
  return { schemaVersion: '1.0.0', sourceCount: sources.length, byLicenseStatus: stableSort(byLicenseStatus), reviewRequiredSources, usedReviewRequiredSources, automaticProductionGate: usedReviewRequiredSources.length === 0 ? 'no-fixture-record-uses-review-required-source' : 'blocked', usage: sources.map((source) => ({ sourceId: source.sourceId, licenseStatus: source.licenseStatus, recordCount: usage.get(source.sourceId) || 0 })).sort((a, b) => a.sourceId.localeCompare(b.sourceId)) };
}
function generateReports(rootDirectory) {
  const root = path.resolve(rootDirectory || process.cwd());
  const validation = validateRepository(root), duplication = checkDuplicates(root), coverage = checkCoverage(root);
  const source = generateSourceReport(validation.repository);
  const quality = { schemaVersion: '1.0.0', qualityGate: 'locked', productionEnabled: false, phase: 1, validation: validation.summary, duplicateBlockers: duplication.summary.blockers, plannedLevels: coverage.totals.plannedLevels, productionReadyLevels: 0, manualReviewRequired: ['derived-dataset-license', 'vietnamese-human-review', 'official-level-item-extraction', 'legacy-progress-semantic-mapping'], phase2Allowed: validation.ok && duplication.summary.blockers === 0, productionCurriculumAllowed: false };
  const reports = { 'hsk-quality-report.json': quality, 'hsk-coverage-report.json': coverage, 'hsk-duplication-report.json': duplication, 'hsk-source-report.json': source };
  for (const [name, report] of Object.entries(reports)) writeJsonDeterministic(path.join(root, 'reports', name), report);
  return { validation, duplication, coverage, source, quality, reports };
}

module.exports = { ...duplicate, summarizeRecords, checkCoverage, generateSourceReport, generateReports };
