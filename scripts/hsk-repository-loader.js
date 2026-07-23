'use strict';

const fs = require('node:fs');
const path = require('node:path');
const core = require('./hsk-schema-engine');
const { CONTENT_STATUSES, TRANSLATION_REVIEW_STATUSES, SOURCE_LICENSE_STATUSES, RECORD_TYPES, SKILLS, relativePath, makeIssue, readJson, walkJsonFiles, validateSchema } = core;

function loadRepository(rootDirectory, options = {}) {
  const root = path.resolve(rootDirectory || process.cwd());
  const dataRoot = path.join(root, 'data', 'hsk');
  const issues = [];
  const manifestFile = path.join(dataRoot, 'manifest.json');
  const sourcesFile = path.join(dataRoot, 'sources.json');
  const legacyMappingFile = path.join(dataRoot, 'legacy-mapping.json');
  const manifest = readJson(manifestFile, issues);
  const sourceRegistry = readJson(sourcesFile, issues);
  const legacyMapping = readJson(legacyMappingFile, issues);
  const schemaDirectory = path.join(dataRoot, 'schemas');
  const schemas = {};
  for (const recordType of RECORD_TYPES) {
    const schemaFile = path.join(schemaDirectory, `${recordType}.schema.json`);
    schemas[recordType] = readJson(schemaFile, issues);
  }

  const records = [];
  const contentFiles = walkJsonFiles(dataRoot).filter((file) => {
    const rel = relativePath(dataRoot, file);
    if (rel.startsWith('schemas/')) return false;
    return !['manifest.json', 'sources.json', 'legacy-mapping.json', 'fixtures/manifest.json'].includes(rel);
  });
  for (const file of contentFiles) {
    const document = readJson(file, issues);
    if (!document) continue;
    if (document.recordType) records.push({ record: document, file });
    if (Array.isArray(document.records)) document.records.forEach((record, index) => records.push({ record, file, collectionIndex: index }));
  }

  const recordsById = new Map();
  const duplicateIds = [];
  for (const entry of records) {
    const id = entry.record && entry.record.id;
    if (!id) continue;
    if (recordsById.has(id)) duplicateIds.push({ id, first: recordsById.get(id), duplicate: entry });
    else recordsById.set(id, entry);
  }
  const sourcesById = new Map();
  if (sourceRegistry && Array.isArray(sourceRegistry.sources)) sourceRegistry.sources.forEach((source) => { if (source && source.sourceId) sourcesById.set(source.sourceId, source); });
  return { root, dataRoot, manifest, manifestFile, sourceRegistry, sourcesFile, sourcesById, legacyMapping, legacyMappingFile, schemas, records, recordsById, duplicateIds, issues, options };
}

function schemaValidationIssues(repository) {
  const issues = [];
  for (const { record, file } of repository.records) {
    if (!record || !RECORD_TYPES.has(record.recordType)) {
      issues.push(makeIssue(relativePath(repository.root, file), record && record.id, 'record-type', `Unknown recordType ${record && record.recordType}`));
      continue;
    }
    const schema = repository.schemas[record.recordType];
    if (!schema) {
      issues.push(makeIssue(relativePath(repository.root, file), record.id, 'schema-exists', `Missing schema for ${record.recordType}`));
      continue;
    }
    for (const message of validateSchema(record, schema)) issues.push(makeIssue(relativePath(repository.root, file), record.id, 'schema', message));
  }
  return issues;
}

function basicManifestIssues(repository) {
  const issues = [];
  const { manifest } = repository;
  if (!manifest || typeof manifest !== 'object') return issues;
  const required = ['schemaVersion', 'curriculumId', 'syllabusVersion', 'qualityGate', 'productionEnabled', 'publicOverrideAllowed', 'sourceRegistryPath', 'schemas', 'levels'];
  required.forEach((field) => { if (!Object.prototype.hasOwnProperty.call(manifest, field)) issues.push(makeIssue('data/hsk/manifest.json', null, 'manifest-required', `Missing ${field}`)); });
  if (manifest.productionEnabled !== false) issues.push(makeIssue('data/hsk/manifest.json', null, 'production-feature-flag', 'Phase 1 requires productionEnabled=false'));
  if (manifest.publicOverrideAllowed !== false) issues.push(makeIssue('data/hsk/manifest.json', null, 'public-override', 'Public query or URL override must remain disabled'));
  if (manifest.qualityGate !== 'locked') issues.push(makeIssue('data/hsk/manifest.json', null, 'quality-gate', 'Phase 1 quality gate must remain locked'));
  const levels = Array.isArray(manifest.levels) ? manifest.levels : [];
  const levelNumbers = levels.map((item) => item.level);
  for (let level = 1; level <= 9; level += 1) if (!levelNumbers.includes(level)) issues.push(makeIssue('data/hsk/manifest.json', null, 'manifest-levels', `Missing level ${level}`));
  for (const item of levels) {
    if (item.productionReady !== false) issues.push(makeIssue('data/hsk/manifest.json', `hsk${item.level}`, 'production-ready', 'Planned Phase 1 levels must not be production-ready'));
    if (!CONTENT_STATUSES.has(item.status)) issues.push(makeIssue('data/hsk/manifest.json', `hsk${item.level}`, 'status', `Invalid status ${item.status}`));
    if (item.path) {
      const target = path.resolve(repository.dataRoot, item.path);
      if (!fs.existsSync(target)) issues.push(makeIssue('data/hsk/manifest.json', `hsk${item.level}`, 'manifest-path', `Missing ${item.path}`));
    }
  }
  return issues;
}

function sourceRegistryIssues(repository) {
  const issues = [];
  const registry = repository.sourceRegistry;
  if (!registry || !Array.isArray(registry.sources)) return issues;
  const seen = new Set();
  for (const source of registry.sources) {
    const file = 'data/hsk/sources.json';
    const id = source && source.sourceId;
    if (!id) issues.push(makeIssue(file, null, 'source-id', 'Source is missing sourceId'));
    else if (seen.has(id)) issues.push(makeIssue(file, id, 'source-id-unique', 'Duplicate sourceId'));
    else seen.add(id);
    const required = ['title', 'publisher', 'sourceType', 'url', 'accessDate', 'syllabusVersion', 'levels', 'scope', 'confidence', 'licenseStatus', 'licenseNote', 'derivedDataNote'];
    required.forEach((field) => { if (!source || !Object.prototype.hasOwnProperty.call(source, field) || source[field] === '') issues.push(makeIssue(file, id, 'source-required', `Missing ${field}`)); });
    if (source && !SOURCE_LICENSE_STATUSES.has(source.licenseStatus)) issues.push(makeIssue(file, id, 'license-status', `Invalid licenseStatus ${source.licenseStatus}`));
  }
  return issues;
}

function normalizeAnswer(value) {
  return String(value == null ? '' : value).trim().toLocaleLowerCase('vi').replace(/[\s，。！？、,.!?；;：:（）()【】\[\]"“”'‘’]/gu, '');
}

module.exports = { ...core, loadRepository, schemaValidationIssues, basicManifestIssues, sourceRegistryIssues, normalizeAnswer };
