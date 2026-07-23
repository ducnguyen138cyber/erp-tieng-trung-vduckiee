'use strict';

const path = require('node:path');
const validator = require('./hsk-repository-validator');
const { RECORD_TYPES, SKILLS, stableSort, writeJsonDeterministic, validateRepository, relativePath, normalizeAnswer } = validator;

function normalizeText(value) {
  return String(value || '').normalize('NFKC').toLocaleLowerCase('vi').replace(/[\s，。！？、,.!?；;：:（）()【】\[\]"“”'‘’]/gu, '');
}
function skeletonText(value) {
  return normalizeText(value).replace(/[0-9零一二三四五六七八九十百千万两]+/gu, '#').replace(/(小明|小王|小李|小林|小安|王老师|李老师|安|林|明|德)/gu, '@');
}
function ngrams(value, size = 3) {
  const text = normalizeText(value);
  if (!text) return new Set();
  if (text.length <= size) return new Set([text]);
  const output = new Set();
  for (let index = 0; index <= text.length - size; index += 1) output.add(text.slice(index, index + size));
  return output;
}
function jaccard(left, right) {
  const union = new Set([...left, ...right]);
  if (!union.size) return 1;
  let intersection = 0;
  for (const item of left) if (right.has(item)) intersection += 1;
  return intersection / union.size;
}
function isIntentionalReview(left, right) {
  return [[left, right], [right, left]].some(([candidate, prior]) => {
    const metadata = candidate.record.reviewMetadata;
    return metadata && metadata.reviewReason && metadata.previousExerciseId === prior.record.id;
  });
}
function collectDuplicateCandidates(repository) {
  const candidates = [];
  for (const entry of repository.records) {
    const { record, file } = entry;
    const base = { record, file: relativePath(repository.root, file), level: record.level || record.hskLevel || null };
    if (record.recordType === 'exercise' && record.prompt) candidates.push({ ...base, kind: 'exercise-prompt', text: record.prompt, id: record.id });
    if (record.recordType === 'vocabulary') (record.examples || []).forEach((example, index) => candidates.push({ ...base, kind: 'example', text: example.zh, id: `${record.id}#example${index + 1}` }));
    if (record.recordType === 'grammar') {
      (record.correctExamples || []).forEach((example, index) => candidates.push({ ...base, kind: 'example', text: example.zh, id: `${record.id}#correct${index + 1}` }));
      (record.incorrectExamples || []).forEach((example, index) => candidates.push({ ...base, kind: 'example', text: example.zh, id: `${record.id}#incorrect${index + 1}` }));
    }
    if (record.recordType === 'lesson') {
      for (const section of record.sections || []) {
        if (section.type === 'dialogue' && Array.isArray(section.content)) {
          const text = section.content.map((line) => line.zh || '').join(' ');
          if (text) candidates.push({ ...base, kind: 'dialogue', text, id: `${record.id}#${section.id}` });
        }
        if (section.type === 'reading' && section.content) {
          const text = typeof section.content === 'string' ? section.content : section.content.zh;
          if (text) candidates.push({ ...base, kind: 'reading', text, id: `${record.id}#${section.id}` });
        }
      }
    }
  }
  return candidates;
}
function checkDuplicates(rootDirectory, options = {}) {
  const validation = validateRepository(rootDirectory, options);
  const repository = validation.repository;
  const findings = [];
  const candidates = collectDuplicateCandidates(repository);
  const byKind = new Map();
  for (const candidate of candidates) {
    if (!byKind.has(candidate.kind)) byKind.set(candidate.kind, []);
    byKind.get(candidate.kind).push(candidate);
  }
  for (const [kind, items] of byKind) {
    for (let leftIndex = 0; leftIndex < items.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < items.length; rightIndex += 1) {
        const left = items[leftIndex], right = items[rightIndex];
        if (left.id === right.id) continue;
        const intentional = left.record.recordType === 'exercise' && right.record.recordType === 'exercise' && isIntentionalReview(left, right);
        const exact = String(left.text).trim() === String(right.text).trim();
        const normalizedEqual = normalizeText(left.text) === normalizeText(right.text);
        const skeletonEqual = skeletonText(left.text) === skeletonText(right.text);
        const similarity = jaccard(ngrams(left.text), ngrams(right.text));
        let rule = null, severity = null;
        if (exact) { rule = 'exact-duplicate'; severity = intentional ? 'info' : 'critical'; }
        else if (normalizedEqual) { rule = 'normalized-duplicate'; severity = intentional ? 'info' : 'serious'; }
        else if (skeletonEqual && normalizeText(left.text) !== normalizeText(right.text)) { rule = 'name-or-number-mutation'; severity = intentional ? 'info' : 'review'; }
        else if (similarity >= (options.nearThreshold || 0.82)) { rule = 'near-duplicate'; severity = intentional ? 'info' : 'review'; }
        if (rule) findings.push({ rule, severity, kind, leftId: left.id, rightId: right.id, leftFile: left.file, rightFile: right.file, similarity: Number(similarity.toFixed(4)), intentionalReview: intentional, reviewReason: intentional ? ((left.record.reviewMetadata || right.record.reviewMetadata).reviewReason) : null });
      }
    }
  }
  for (const { record, file } of repository.records.filter((entry) => entry.record.recordType === 'exercise')) {
    const normalized = (record.options || []).map(normalizeAnswer);
    if (new Set(normalized).size !== normalized.length) findings.push({ rule: 'option-duplicate', severity: 'critical', kind: 'exercise-options', leftId: record.id, rightId: record.id, leftFile: relativePath(repository.root, file), rightFile: relativePath(repository.root, file), similarity: 1, intentionalReview: false, reviewReason: null });
  }
  const exercises = repository.records.filter((entry) => entry.record.recordType === 'exercise').map((entry) => entry.record);
  const distractorUsage = new Map();
  exercises.forEach((exercise) => {
    const answers = new Set([...(Array.isArray(exercise.answer) ? exercise.answer : [exercise.answer]), ...(exercise.acceptedAnswers || [])].map(normalizeAnswer));
    (exercise.options || []).forEach((option) => {
      const normalized = normalizeAnswer(option);
      if (!normalized || answers.has(normalized)) return;
      if (!distractorUsage.has(normalized)) distractorUsage.set(normalized, { display: option, exerciseIds: [] });
      distractorUsage.get(normalized).exerciseIds.push(exercise.id);
    });
  });
  for (const usage of distractorUsage.values()) {
    const uniqueExercises = [...new Set(usage.exerciseIds)];
    if (uniqueExercises.length >= 4) findings.push({ rule: 'distractor-overuse', severity: 'review', kind: 'exercise-options', leftId: uniqueExercises[0], rightId: uniqueExercises[uniqueExercises.length - 1], leftFile: null, rightFile: null, similarity: uniqueExercises.length, intentionalReview: false, reviewReason: null, distractor: usage.display, exerciseIds: uniqueExercises.sort() });
  }
  const familyCounts = new Map();
  exercises.forEach((exercise) => { const key = `${exercise.hskLevel}|${exercise.templateFamily}`; familyCounts.set(key, (familyCounts.get(key) || 0) + 1); });
  for (const [key, count] of familyCounts) {
    const [level, family] = key.split('|');
    const totalAtLevel = exercises.filter((exercise) => String(exercise.hskLevel) === level).length;
    const threshold = Math.max(4, Math.ceil(totalAtLevel * 0.35));
    if (count > threshold) findings.push({ rule: 'template-family-density', severity: 'review', kind: 'template-family', leftId: family, rightId: null, leftFile: null, rightFile: null, similarity: Number((count / totalAtLevel).toFixed(4)), intentionalReview: false, reviewReason: null });
  }
  findings.sort((a, b) => `${a.severity}|${a.rule}|${a.leftId}|${a.rightId}`.localeCompare(`${b.severity}|${b.rule}|${b.leftId}|${b.rightId}`));
  const blockers = findings.filter((finding) => ['critical', 'serious'].includes(finding.severity) && !finding.intentionalReview);
  return { schemaVersion: '1.0.0', qualityGate: blockers.length ? 'blocked' : 'pass-for-phase1-fixture', summary: { candidates: candidates.length, findings: findings.length, blockers: blockers.length, exact: findings.filter((item) => item.rule === 'exact-duplicate').length, normalized: findings.filter((item) => item.rule === 'normalized-duplicate').length, nearReview: findings.filter((item) => ['near-duplicate', 'name-or-number-mutation'].includes(item.rule)).length, intentionalReviews: findings.filter((item) => item.intentionalReview).length }, findings };
}

module.exports = { ...validator, normalizeText, skeletonText, ngrams, jaccard, isIntentionalReview, collectDuplicateCandidates, checkDuplicates };
