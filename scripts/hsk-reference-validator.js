'use strict';

const fs = require('node:fs');
const path = require('node:path');
const loader = require('./hsk-repository-loader');
const { CONTENT_STATUSES, TRANSLATION_REVIEW_STATUSES, relativePath, makeIssue, normalizeAnswer, loadRepository, basicManifestIssues, sourceRegistryIssues, schemaValidationIssues } = loader;

function visitStrings(value, callback, pointer = '$') {
  if (typeof value === 'string') {
    callback(value, pointer);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => visitStrings(item, callback, `${pointer}[${index}]`));
    return;
  }
  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, item]) => visitStrings(item, callback, `${pointer}.${key}`));
  }
}

function normalizePinyin(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/u[\u0304\u0301\u030C\u0300]?\u0308/gu, 'v')
    .replace(/\p{M}/gu, '')
    .replace(/ü/gu, 'v')
    .replace(/[^a-zv]/giu, '')
    .toLowerCase();
}

function recordRuleIssues(repository) {
  const issues = [];
  const validPinyinTone = /^[\p{L}\p{M}\s'-]+$/u;
  const validPinyinNumber = /^[a-züv]+[0-5](?:\s+[a-züv]+[0-5])*$/i;
  const typeFor = (id) => repository.recordsById.get(id) && repository.recordsById.get(id).record.recordType;

  for (const duplicate of repository.duplicateIds) issues.push(makeIssue(relativePath(repository.root, duplicate.duplicate.file), duplicate.id, 'id-unique', `Duplicate ID also found in ${relativePath(repository.root, duplicate.first.file)}`));

  for (const { record, file } of repository.records) {
    const rel = relativePath(repository.root, file);
    if (!record || !record.id) continue;
    if (record.contentStatus && !CONTENT_STATUSES.has(record.contentStatus)) issues.push(makeIssue(rel, record.id, 'status', `Invalid contentStatus ${record.contentStatus}`));
    if (record.translationReviewStatus && !TRANSLATION_REVIEW_STATUSES.has(record.translationReviewStatus)) issues.push(makeIssue(rel, record.id, 'translation-status', `Invalid translationReviewStatus ${record.translationReviewStatus}`));
    if (!Number.isInteger(record.contentVersion) || record.contentVersion < 1) issues.push(makeIssue(rel, record.id, 'content-version', 'contentVersion must be an integer >= 1'));
    if (Array.isArray(record.sourceIds)) record.sourceIds.forEach((sourceId) => { if (!repository.sourcesById.has(sourceId)) issues.push(makeIssue(rel, record.id, 'source-reference', `Missing source ${sourceId}`)); });
    if (Array.isArray(record.sourceRefs)) {
      record.sourceRefs.forEach((sourceRef) => {
        if (!sourceRef || !repository.sourcesById.has(sourceRef.sourceId)) issues.push(makeIssue(rel, record.id, 'source-reference', `Missing source ${sourceRef && sourceRef.sourceId}`));
        if (sourceRef && Array.isArray(record.sourceIds) && !record.sourceIds.includes(sourceRef.sourceId)) issues.push(makeIssue(rel, record.id, 'source-reference-consistency', `sourceRefs uses ${sourceRef.sourceId} but sourceIds does not`));
      });
    }
    visitStrings(record, (value, pointer) => {
      if (value !== value.normalize('NFC')) issues.push(makeIssue(rel, record.id, 'unicode-nfc', `${pointer} is not NFC normalized`));
      if (/[\u200B-\u200D\u2060\uFEFF]/u.test(value)) issues.push(makeIssue(rel, record.id, 'unicode-hidden-character', `${pointer} contains a forbidden zero-width character`));
    });
    if (record.contentStatus === 'production-ready') {
      if (record.translationReviewStatus && record.translationReviewStatus !== 'human-reviewed') issues.push(makeIssue(rel, record.id, 'production-translation-gate', 'Production-ready records require human-reviewed Vietnamese'));
      for (const sourceId of record.sourceIds || []) {
        const source = repository.sourcesById.get(sourceId);
        if (source && source.licenseStatus === 'review-required') issues.push(makeIssue(rel, record.id, 'production-license-gate', `Source ${sourceId} requires license review`));
      }
    }

    if (record.recordType === 'vocabulary') {
      if (!validPinyinTone.test(record.pinyinTone || '')) issues.push(makeIssue(rel, record.id, 'pinyin-tone', `Invalid pinyinTone ${record.pinyinTone}`));
      if (!validPinyinNumber.test(record.pinyinNumber || '')) issues.push(makeIssue(rel, record.id, 'pinyin-number', `Invalid pinyinNumber ${record.pinyinNumber}`));
      if (!String(record.meaningVi || '').trim()) issues.push(makeIssue(rel, record.id, 'vietnamese-required', 'meaningVi is empty'));
      if (/^hsk1-v-\d{4}$/.test(record.id)) {
        if (record.level !== 1 || record.hskLevel !== 1) issues.push(makeIssue(rel, record.id, 'hsk1-level', 'Canonical HSK 1 vocabulary must use level=1 and hskLevel=1'));
        for (const field of ['pinyin', 'pinyinNormalized', 'sourceRefs', 'tags', 'sentenceIds']) {
          if (!Object.prototype.hasOwnProperty.call(record, field)) issues.push(makeIssue(rel, record.id, 'hsk1-required', `Missing ${field}`));
        }
        if (record.pinyin !== record.pinyinTone) issues.push(makeIssue(rel, record.id, 'pinyin-consistency', 'pinyin must equal pinyinTone'));
        if (record.pinyinNormalized !== normalizePinyin(record.pinyinTone)) issues.push(makeIssue(rel, record.id, 'pinyin-normalized', 'pinyinNormalized does not match pinyinTone'));
        if (!Array.isArray(record.sentenceIds) || record.sentenceIds.length !== 3) issues.push(makeIssue(rel, record.id, 'sentence-coverage', 'Canonical HSK 1 vocabulary must reference exactly 3 sentences'));
        for (const sentenceId of record.sentenceIds || []) {
          const sentence = repository.recordsById.get(sentenceId);
          if (!sentence || sentence.record.recordType !== 'sentence') issues.push(makeIssue(rel, record.id, 'sentence-reference', `Missing sentence ${sentenceId}`));
          else if (!Array.isArray(sentence.record.vocabularyIds) || !sentence.record.vocabularyIds.includes(record.id)) issues.push(makeIssue(rel, record.id, 'sentence-backlink', `${sentenceId} does not link back to ${record.id}`));
        }
      }
    }

    if (record.recordType === 'sentence') {
      if (!validPinyinTone.test(record.pinyinTone || '')) issues.push(makeIssue(rel, record.id, 'pinyin-tone', `Invalid pinyinTone ${record.pinyinTone}`));
      if (!validPinyinNumber.test(record.pinyinNumber || '')) issues.push(makeIssue(rel, record.id, 'pinyin-number', `Invalid pinyinNumber ${record.pinyinNumber}`));
      if (record.pinyin !== record.pinyinTone) issues.push(makeIssue(rel, record.id, 'pinyin-consistency', 'pinyin must equal pinyinTone'));
      if (record.pinyinNormalized !== normalizePinyin(record.pinyinTone)) issues.push(makeIssue(rel, record.id, 'pinyin-normalized', 'pinyinNormalized does not match pinyinTone'));
      if (!Array.isArray(record.vocabularyIds) || !record.vocabularyIds.includes(record.primaryVocabularyId)) issues.push(makeIssue(rel, record.id, 'primary-vocabulary', 'primaryVocabularyId must be present in vocabularyIds'));
      for (const vocabularyId of record.vocabularyIds || []) {
        const vocabulary = repository.recordsById.get(vocabularyId);
        if (!vocabulary || vocabulary.record.recordType !== 'vocabulary') issues.push(makeIssue(rel, record.id, 'vocabulary-reference', `Missing vocabulary ${vocabularyId}`));
        else {
          if (!Array.isArray(vocabulary.record.sentenceIds) || !vocabulary.record.sentenceIds.includes(record.id)) issues.push(makeIssue(rel, record.id, 'vocabulary-backlink', `${vocabularyId} does not link back to ${record.id}`));
          if (vocabularyId === record.primaryVocabularyId && !String(record.chinese || '').includes(vocabulary.record.simplified)) issues.push(makeIssue(rel, record.id, 'target-surface-form', `Sentence does not contain ${vocabulary.record.simplified}`));
        }
      }
      if (!String(record.vietnamese || '').trim()) issues.push(makeIssue(rel, record.id, 'vietnamese-required', 'vietnamese is empty'));
    }

    if (record.recordType === 'exercise') {
      const options = Array.isArray(record.options) ? record.options : [];
      const normalizedOptions = options.map(normalizeAnswer);
      if (new Set(normalizedOptions).size !== normalizedOptions.length) issues.push(makeIssue(rel, record.id, 'options-unique', 'Exercise options contain duplicates'));
      const answerValues = Array.isArray(record.answer) ? record.answer : [record.answer];
      if (options.length && !answerValues.some((answer) => normalizedOptions.includes(normalizeAnswer(answer)))) issues.push(makeIssue(rel, record.id, 'answer-in-options', 'No answer is present in options'));
      if (!Array.isArray(record.acceptedAnswers)) issues.push(makeIssue(rel, record.id, 'accepted-answers', 'acceptedAnswers must be an array'));
      else if (!record.acceptedAnswers.length && !options.length) issues.push(makeIssue(rel, record.id, 'accepted-answers', 'Open response requires at least one accepted answer'));
      for (const id of record.grammarFocus || []) if (typeFor(id) !== 'grammar') issues.push(makeIssue(rel, record.id, 'grammar-reference', `Missing grammar ${id}`));
      for (const id of record.vocabularyFocus || []) if (typeFor(id) !== 'vocabulary') issues.push(makeIssue(rel, record.id, 'vocabulary-reference', `Missing vocabulary ${id}`));
    }

    if (record.recordType === 'lesson') {
      for (const id of record.prerequisiteIds || []) if (typeFor(id) !== 'lesson') issues.push(makeIssue(rel, record.id, 'lesson-prerequisite', `Missing prerequisite lesson ${id}`));
      for (const id of record.vocabularyRefs || []) if (typeFor(id) !== 'vocabulary') issues.push(makeIssue(rel, record.id, 'vocabulary-reference', `Missing vocabulary ${id}`));
      for (const id of record.grammarRefs || []) if (typeFor(id) !== 'grammar') issues.push(makeIssue(rel, record.id, 'grammar-reference', `Missing grammar ${id}`));
      for (const id of record.characterRefs || []) if (typeFor(id) !== 'character') issues.push(makeIssue(rel, record.id, 'character-reference', `Missing character ${id}`));
      for (const id of [...(record.practiceRefs || []), ...(record.reviewRefs || [])]) if (typeFor(id) !== 'exercise') issues.push(makeIssue(rel, record.id, 'exercise-reference', `Missing exercise ${id}`));
    }

    if (record.recordType === 'character') {
      for (const id of record.wordRefs || []) if (typeFor(id) !== 'vocabulary') issues.push(makeIssue(rel, record.id, 'character-word-reference', `Missing vocabulary ${id}`));
      if (record.strokeOrderAsset) {
        const asset = path.resolve(repository.root, record.strokeOrderAsset);
        if (!fs.existsSync(asset)) issues.push(makeIssue(rel, record.id, 'asset-reference', `Missing stroke-order asset ${record.strokeOrderAsset}`));
      }
    }

    if (record.recordType === 'assessment') {
      for (const id of record.exerciseRefs || []) if (typeFor(id) !== 'exercise') issues.push(makeIssue(rel, record.id, 'assessment-exercise-reference', `Missing exercise ${id}`));
      for (const id of record.targetGrammar || []) if (typeFor(id) !== 'grammar') issues.push(makeIssue(rel, record.id, 'assessment-grammar-reference', `Missing grammar ${id}`));
      for (const id of record.targetVocabulary || []) if (typeFor(id) !== 'vocabulary') issues.push(makeIssue(rel, record.id, 'assessment-vocabulary-reference', `Missing vocabulary ${id}`));
    }

    if (record.recordType === 'level') {
      for (const ref of [...(record.unitRefs || []), ...(record.lessonIndex || []), ...(record.assessmentRefs || [])]) {
        if (!ref.path) continue;
        const target = path.resolve(path.dirname(file), ref.path);
        if (!fs.existsSync(target)) issues.push(makeIssue(rel, record.id, 'file-reference', `Missing referenced file ${ref.path}`));
      }
      for (const ref of record.unitRefs || []) {
        const target = repository.recordsById.get(ref.id);
        if (!target || target.record.recordType !== 'unit') issues.push(makeIssue(rel, record.id, 'level-unit-reference', `Missing unit ${ref.id}`));
        else if (target.record.level !== record.level) issues.push(makeIssue(rel, record.id, 'cross-level-reference', `Unit ${ref.id} belongs to HSK ${target.record.level}`));
      }
      for (const ref of record.lessonIndex || []) {
        const target = repository.recordsById.get(ref.id);
        if (!target || target.record.recordType !== 'lesson') issues.push(makeIssue(rel, record.id, 'level-lesson-reference', `Missing lesson ${ref.id}`));
        else if (target.record.level !== record.level || target.record.unitId !== ref.unitId) issues.push(makeIssue(rel, record.id, 'cross-level-reference', `Lesson ${ref.id} does not match HSK ${record.level}/${ref.unitId}`));
      }
      for (const ref of record.assessmentRefs || []) {
        const target = repository.recordsById.get(ref.id);
        if (!target || target.record.recordType !== 'assessment') issues.push(makeIssue(rel, record.id, 'level-assessment-reference', `Missing assessment ${ref.id}`));
        else if (target.record.level !== record.level) issues.push(makeIssue(rel, record.id, 'cross-level-reference', `Assessment ${ref.id} belongs to HSK ${target.record.level}`));
      }
      if (record.productionReady === true || record.contentStatus === 'production-ready') {
        if (!record.finalAssessmentId) issues.push(makeIssue(rel, record.id, 'final-assessment-required', 'Production-ready level requires finalAssessmentId'));
        else {
          const finalAssessment = repository.recordsById.get(record.finalAssessmentId);
          if (!finalAssessment || finalAssessment.record.recordType !== 'assessment' || finalAssessment.record.assessmentType !== 'final') issues.push(makeIssue(rel, record.id, 'final-assessment-reference', `Invalid final assessment ${record.finalAssessmentId}`));
        }
      }
    }

    if (record.recordType === 'unit') {
      for (const ref of [...(record.lessonRefs || []), ...(record.checkpointRef ? [record.checkpointRef] : [])]) {
        if (!ref.path) continue;
        const target = path.resolve(path.dirname(file), ref.path);
        if (!fs.existsSync(target)) issues.push(makeIssue(rel, record.id, 'file-reference', `Missing referenced file ${ref.path}`));
      }
      for (const prerequisiteId of record.prerequisiteUnitIds || []) {
        const prerequisite = repository.recordsById.get(prerequisiteId);
        if (!prerequisite || prerequisite.record.recordType !== 'unit') issues.push(makeIssue(rel, record.id, 'unit-prerequisite-reference', `Missing prerequisite unit ${prerequisiteId}`));
        else if (prerequisite.record.level !== record.level) issues.push(makeIssue(rel, record.id, 'cross-level-reference', `Prerequisite unit ${prerequisiteId} belongs to HSK ${prerequisite.record.level}`));
      }
      for (const ref of record.lessonRefs || []) {
        const lessonEntry = repository.recordsById.get(ref.id);
        if (!lessonEntry || lessonEntry.record.recordType !== 'lesson') issues.push(makeIssue(rel, record.id, 'unit-lesson-reference', `Missing lesson ${ref.id}`));
        else if (lessonEntry.record.level !== record.level || lessonEntry.record.unitId !== record.id) issues.push(makeIssue(rel, record.id, 'cross-level-reference', `Lesson ${ref.id} does not belong to this level/unit`));
      }
      if (record.checkpointRef && typeFor(record.checkpointRef.id) !== 'assessment') issues.push(makeIssue(rel, record.id, 'checkpoint-reference', `Missing checkpoint ${record.checkpointRef.id}`));
    }

    if (record.recordType === 'vocabulary' && record.audioRef) {
      const audio = path.resolve(repository.root, record.audioRef);
      if (!fs.existsSync(audio)) issues.push(makeIssue(rel, record.id, 'audio-reference', `Missing audio ${record.audioRef}`));
    }
    if (record.recordType === 'exercise' && record.stimulus && typeof record.stimulus === 'object' && record.stimulus.audioRef) {
      const audio = path.resolve(repository.root, record.stimulus.audioRef);
      if (!fs.existsSync(audio)) issues.push(makeIssue(rel, record.id, 'audio-reference', `Missing audio ${record.stimulus.audioRef}`));
    }
  }
  return issues;
}

function detectCycles(repository, recordType, edgeField) {
  const issues = [];
  const records = repository.records.filter((entry) => entry.record.recordType === recordType);
  const graph = new Map(records.map((entry) => [entry.record.id, entry.record[edgeField] || []]));
  const visiting = new Set();
  const visited = new Set();
  function visit(id, stack) {
    if (visiting.has(id)) {
      const cycleStart = stack.indexOf(id);
      const cycle = stack.slice(cycleStart).concat(id);
      const entry = repository.recordsById.get(id);
      issues.push(makeIssue(entry ? relativePath(repository.root, entry.file) : '', id, 'prerequisite-cycle', cycle.join(' -> ')));
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const next of graph.get(id) || []) if (graph.has(next)) visit(next, stack.concat(id));
    visiting.delete(id);
    visited.add(id);
  }
  for (const id of graph.keys()) visit(id, []);
  return issues;
}

function orderingIssues(repository) {
  const issues = [];
  const lessonsByUnit = new Map();
  const unitsByLevel = new Map();
  for (const entry of repository.records) {
    const record = entry.record;
    if (record.recordType === 'lesson') {
      if (!lessonsByUnit.has(record.unitId)) lessonsByUnit.set(record.unitId, []);
      lessonsByUnit.get(record.unitId).push(entry);
    }
    if (record.recordType === 'unit') {
      if (!unitsByLevel.has(record.level)) unitsByLevel.set(record.level, []);
      unitsByLevel.get(record.level).push(entry);
    }
  }
  for (const [unitId, entries] of lessonsByUnit) {
    const orders = entries.map((entry) => entry.record.order).sort((a, b) => a - b);
    if (new Set(orders).size !== orders.length) issues.push(makeIssue(relativePath(repository.root, entries[0].file), unitId, 'lesson-order-unique', `Duplicate lesson order in ${unitId}`));
    const expected = orders.map((_, index) => index + 1);
    if (orders.some((value, index) => value !== expected[index])) issues.push(makeIssue(relativePath(repository.root, entries[0].file), unitId, 'lesson-order-sequential', `Expected ${expected.join(',')} but got ${orders.join(',')}`));
  }
  for (const [level, entries] of unitsByLevel) {
    const orders = entries.map((entry) => entry.record.order).sort((a, b) => a - b);
    if (new Set(orders).size !== orders.length) issues.push(makeIssue(relativePath(repository.root, entries[0].file), `hsk${level}`, 'unit-order-unique', `Duplicate unit order in HSK ${level}`));
  }
  return issues;
}

function validateRepository(rootDirectory, options = {}) {
  const repository = loadRepository(rootDirectory, options);
  const errors = [
    ...repository.issues.map((issue) => ({ ...issue, file: relativePath(repository.root, issue.file) })),
    ...basicManifestIssues(repository), ...sourceRegistryIssues(repository), ...schemaValidationIssues(repository),
    ...recordRuleIssues(repository), ...orderingIssues(repository),
    ...detectCycles(repository, 'lesson', 'prerequisiteIds'), ...detectCycles(repository, 'unit', 'prerequisiteUnitIds')
  ];
  errors.sort((a, b) => `${a.file}|${a.id}|${a.rule}|${a.message}`.localeCompare(`${b.file}|${b.id}|${b.rule}|${b.message}`));
  return {
    ok: errors.filter((issue) => issue.severity === 'error').length === 0,
    errors, repository,
    summary: {
      records: repository.records.length, sources: repository.sourcesById.size,
      schemas: Object.values(repository.schemas).filter(Boolean).length,
      errors: errors.filter((issue) => issue.severity === 'error').length,
      warnings: errors.filter((issue) => issue.severity !== 'error').length
    }
  };
}

module.exports = { ...loader, visitStrings, normalizePinyin, recordRuleIssues, detectCycles, orderingIssues, validateRepository };
