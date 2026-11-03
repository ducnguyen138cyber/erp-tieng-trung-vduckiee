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
    if (record.recordType === 'sentence' && record.chinese) candidates.push({ ...base, kind: 'sentence', text: record.chinese, id: record.id });
    if (record.recordType === 'vocabulary') {
      const kind = /^hsk1-v-\d{4}$/.test(record.id) ? 'canonical-vocabulary-example' : 'example';
      (record.examples || []).forEach((example, index) => candidates.push({ ...base, kind, text: example.zh, id: `${record.id}#example${index + 1}` }));
    }
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
    const scope = candidate.record.contentStatus === 'fixture' ? 'fixture' : 'canonical';
    const key = `${scope}|${candidate.kind}`;
    if (!byKind.has(key)) byKind.set(key, []);
    byKind.get(key).push(candidate);
  }
  for (const [, items] of byKind) {
    const kind = items[0].kind;
    const threshold = kind === 'sentence' ? (options.sentenceNearThreshold || 0.92) : (options.nearThreshold || 0.82);
    const metadata = items.map((item) => {
      const normalized = normalizeText(item.text);
      return { raw: String(item.text).trim(), normalized, skeleton: skeletonText(item.text), grams: ngrams(item.text) };
    });
    const pairKeys = new Set();
    const addPair = (leftIndex, rightIndex) => {
      if (leftIndex === rightIndex) return;
      const a = Math.min(leftIndex, rightIndex), b = Math.max(leftIndex, rightIndex);
      pairKeys.add(`${a}|${b}`);
    };
    const addEqualGroups = (selector) => {
      const groups = new Map();
      metadata.forEach((meta, index) => {
        const key = selector(meta);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(index);
      });
      for (const indexes of groups.values()) {
        for (let left = 0; left < indexes.length; left += 1) {
          for (let right = left + 1; right < indexes.length; right += 1) addPair(indexes[left], indexes[right]);
        }
      }
    };
    addEqualGroups((meta) => meta.raw);
    addEqualGroups((meta) => meta.normalized);
    addEqualGroups((meta) => meta.skeleton);

    // Exact Jaccard prefix filtering: any pair at or above the threshold must
    // share at least one globally ordered token in these prefixes. This keeps
    // the duplicate contract identical while avoiding an all-pairs scan.
    const frequency = new Map();
    metadata.forEach((meta) => meta.grams.forEach((gram) => frequency.set(gram, (frequency.get(gram) || 0) + 1)));
    const posting = new Map();
    metadata.forEach((meta, index) => {
      const ordered = [...meta.grams].sort((left, right) => (frequency.get(left) - frequency.get(right)) || left.localeCompare(right));
      const prefixLength = Math.max(0, ordered.length - Math.ceil(threshold * ordered.length) + 1);
      const prefix = ordered.slice(0, prefixLength);
      const candidates = new Set();
      prefix.forEach((gram) => (posting.get(gram) || []).forEach((prior) => candidates.add(prior)));
      candidates.forEach((prior) => addPair(prior, index));
      prefix.forEach((gram) => {
        if (!posting.has(gram)) posting.set(gram, []);
        posting.get(gram).push(index);
      });
    });

    for (const key of pairKeys) {
      const [leftIndex, rightIndex] = key.split('|').map(Number);
      const left = items[leftIndex], right = items[rightIndex];
      if (left.id === right.id) continue;
      const leftMeta = metadata[leftIndex], rightMeta = metadata[rightIndex];
      const intentional = left.record.recordType === 'exercise' && right.record.recordType === 'exercise' && isIntentionalReview(left, right);
      const exact = leftMeta.raw === rightMeta.raw;
      const normalizedEqual = leftMeta.normalized === rightMeta.normalized;
      const skeletonEqual = leftMeta.skeleton === rightMeta.skeleton;
      const maxSize = Math.max(leftMeta.grams.size, rightMeta.grams.size);
      const minSize = Math.min(leftMeta.grams.size, rightMeta.grams.size);
      const canMeetThreshold = maxSize === 0 || (minSize / maxSize) >= threshold;
      const similarity = (exact || normalizedEqual || skeletonEqual || canMeetThreshold) ? jaccard(leftMeta.grams, rightMeta.grams) : 0;
      let rule = null, severity = null;
      if (exact) { rule = 'exact-duplicate'; severity = intentional ? 'info' : 'critical'; }
      else if (normalizedEqual) { rule = 'normalized-duplicate'; severity = intentional ? 'info' : 'serious'; }
      else if (skeletonEqual) { rule = 'name-or-number-mutation'; severity = intentional ? 'info' : 'review'; }
      else if (canMeetThreshold && similarity >= threshold) { rule = 'near-duplicate'; severity = intentional ? 'info' : 'review'; }
      if (rule) findings.push({ rule, severity, kind, leftId: left.id, rightId: right.id, leftFile: left.file, rightFile: right.file, similarity: Number(similarity.toFixed(4)), intentionalReview: intentional, reviewReason: intentional ? ((left.record.reviewMetadata || right.record.reviewMetadata).reviewReason) : null });
    }
  }
  const vocabularyByKey = new Map();
  for (const { record, file } of repository.records.filter((entry) => entry.record.recordType === 'vocabulary' && /^hsk1-v-\d{4}$/.test(entry.record.id))) {
    const key = `${normalizeText(record.simplified)}|${record.pinyinNormalized}|${normalizeText(String(record.meaningVi || '').split(';')[0])}`;
    if (vocabularyByKey.has(key)) {
      const prior = vocabularyByKey.get(key);
      findings.push({ rule: 'vocabulary-blocking-duplicate', severity: 'critical', kind: 'vocabulary', leftId: prior.record.id, rightId: record.id, leftFile: relativePath(repository.root, prior.file), rightFile: relativePath(repository.root, file), similarity: 1, intentionalReview: false, reviewReason: null });
    } else {
      vocabularyByKey.set(key, { record, file });
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
