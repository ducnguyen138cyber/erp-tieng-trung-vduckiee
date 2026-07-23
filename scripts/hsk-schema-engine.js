'use strict';

const fs = require('node:fs');
const path = require('node:path');

const CONTENT_STATUSES = new Set(['planned', 'draft', 'machine-assisted', 'human-reviewed', 'production-ready', 'fixture']);
const TRANSLATION_REVIEW_STATUSES = new Set(['draft', 'machine-assisted', 'human-reviewed']);
const SOURCE_LICENSE_STATUSES = new Set(['verified', 'reuse-limited', 'review-required']);
const RECORD_TYPES = new Set(['level', 'unit', 'lesson', 'vocabulary', 'grammar', 'character', 'exercise', 'assessment']);
const SKILLS = ['vocabulary', 'grammar', 'listening', 'speaking', 'reading', 'writing', 'translation', 'integrated'];

function toPosix(value) {
  return String(value).split(path.sep).join('/');
}

function relativePath(root, file) {
  return toPosix(path.relative(root, file));
}

function stableSort(value) {
  if (Array.isArray(value)) return value.map(stableSort);
  if (!value || typeof value !== 'object') return value;
  return Object.keys(value).sort().reduce((output, key) => {
    output[key] = stableSort(value[key]);
    return output;
  }, {});
}

function stableStringify(value) {
  return `${JSON.stringify(stableSort(value), null, 2)}\n`;
}

function ensureDirectory(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
}

function writeJsonDeterministic(file, value) {
  ensureDirectory(file);
  fs.writeFileSync(file, stableStringify(value), 'utf8');
}

function makeIssue(file, id, rule, message, severity = 'error') {
  return { file: toPosix(file || ''), id: id || null, rule, message, severity };
}

function readJson(file, issues) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    if (issues) issues.push(makeIssue(file, null, 'json-valid', error.message));
    return null;
  }
}

function walkJsonFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walkJsonFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.json')) files.push(full);
  }
  return files.sort((a, b) => toPosix(a).localeCompare(toPosix(b)));
}

function resolveLocalRef(schemaRoot, ref) {
  if (!String(ref).startsWith('#/')) return null;
  return String(ref).slice(2).split('/').reduce((current, key) => current && current[key], schemaRoot);
}

function typeMatches(value, type) {
  if (type === 'null') return value === null;
  if (type === 'array') return Array.isArray(value);
  if (type === 'object') return value !== null && typeof value === 'object' && !Array.isArray(value);
  if (type === 'integer') return Number.isInteger(value);
  if (type === 'number') return typeof value === 'number' && Number.isFinite(value);
  return typeof value === type;
}

function validateSchema(value, schema, options = {}) {
  const rootSchema = options.rootSchema || schema;
  const pointer = options.pointer || '$';
  const errors = [];

  function visit(current, currentSchema, currentPointer) {
    if (!currentSchema || typeof currentSchema !== 'object') return;
    if (currentSchema.$ref) {
      const target = resolveLocalRef(rootSchema, currentSchema.$ref);
      if (!target) errors.push(`${currentPointer}: unresolved schema ref ${currentSchema.$ref}`);
      else visit(current, target, currentPointer);
      return;
    }
    if (Array.isArray(currentSchema.allOf)) currentSchema.allOf.forEach((part) => visit(current, part, currentPointer));
    if (Array.isArray(currentSchema.oneOf)) {
      const matches = currentSchema.oneOf.filter((part) => validateSchema(current, part, { rootSchema, pointer: currentPointer }).length === 0);
      if (matches.length !== 1) errors.push(`${currentPointer}: expected exactly one oneOf schema match, got ${matches.length}`);
      return;
    }
    if (Object.prototype.hasOwnProperty.call(currentSchema, 'const') && current !== currentSchema.const) errors.push(`${currentPointer}: expected constant ${JSON.stringify(currentSchema.const)}`);
    if (Array.isArray(currentSchema.enum) && !currentSchema.enum.some((candidate) => JSON.stringify(candidate) === JSON.stringify(current))) errors.push(`${currentPointer}: value is not in enum`);
    if (currentSchema.type) {
      const types = Array.isArray(currentSchema.type) ? currentSchema.type : [currentSchema.type];
      if (!types.some((type) => typeMatches(current, type))) {
        errors.push(`${currentPointer}: expected type ${types.join('|')}`);
        return;
      }
    }
    if (typeof current === 'string') {
      if (Number.isInteger(currentSchema.minLength) && current.length < currentSchema.minLength) errors.push(`${currentPointer}: shorter than minLength ${currentSchema.minLength}`);
      if (Number.isInteger(currentSchema.maxLength) && current.length > currentSchema.maxLength) errors.push(`${currentPointer}: longer than maxLength ${currentSchema.maxLength}`);
      if (currentSchema.pattern && !(new RegExp(currentSchema.pattern).test(current))) errors.push(`${currentPointer}: does not match pattern ${currentSchema.pattern}`);
    }
    if (typeof current === 'number') {
      if (typeof currentSchema.minimum === 'number' && current < currentSchema.minimum) errors.push(`${currentPointer}: below minimum ${currentSchema.minimum}`);
      if (typeof currentSchema.maximum === 'number' && current > currentSchema.maximum) errors.push(`${currentPointer}: above maximum ${currentSchema.maximum}`);
    }
    if (Array.isArray(current)) {
      if (Number.isInteger(currentSchema.minItems) && current.length < currentSchema.minItems) errors.push(`${currentPointer}: fewer than minItems ${currentSchema.minItems}`);
      if (currentSchema.uniqueItems) {
        const serialized = current.map((item) => JSON.stringify(item));
        if (new Set(serialized).size !== serialized.length) errors.push(`${currentPointer}: array items are not unique`);
      }
      if (currentSchema.items) current.forEach((item, index) => visit(item, currentSchema.items, `${currentPointer}[${index}]`));
    }
    if (current && typeof current === 'object' && !Array.isArray(current)) {
      if (Number.isInteger(currentSchema.minProperties) && Object.keys(current).length < currentSchema.minProperties) errors.push(`${currentPointer}: fewer than minProperties ${currentSchema.minProperties}`);
      if (Array.isArray(currentSchema.required)) {
        for (const key of currentSchema.required) if (!Object.prototype.hasOwnProperty.call(current, key)) errors.push(`${currentPointer}.${key}: required property missing`);
      }
      const properties = currentSchema.properties || {};
      for (const [key, item] of Object.entries(current)) {
        if (properties[key]) visit(item, properties[key], `${currentPointer}.${key}`);
        else if (currentSchema.additionalProperties === false) errors.push(`${currentPointer}.${key}: additional property is not allowed`);
        else if (currentSchema.additionalProperties && typeof currentSchema.additionalProperties === 'object') visit(item, currentSchema.additionalProperties, `${currentPointer}.${key}`);
      }
    }
  }

  visit(value, schema, pointer);
  return errors;
}

module.exports = { CONTENT_STATUSES, TRANSLATION_REVIEW_STATUSES, SOURCE_LICENSE_STATUSES, RECORD_TYPES, SKILLS, toPosix, relativePath, stableSort, stableStringify, writeJsonDeterministic, makeIssue, readJson, walkJsonFiles, validateSchema };
