'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'data/hsk/manifest.json'), 'utf8'));
const phase2a = JSON.parse(fs.readFileSync(path.join(root, 'data/hsk/hsk1/content-index.json'), 'utf8'));
const flags = require('../assets/hsk-content/hsk-content-feature-flags');

test('root canonical curriculum remains production locked', () => {
  assert.equal(manifest.productionEnabled, false);
  assert.equal(manifest.publicOverrideAllowed, false);
  assert.equal(manifest.qualityGate, 'locked');
  assert.ok(manifest.levels.every((level) => level.productionReady === false));
});

test('Phase 2A package is developer-only, read-only and cannot write progress', () => {
  assert.equal(phase2a.productionEnabled, false);
  assert.equal(phase2a.publicOverrideAllowed, false);
  assert.equal(phase2a.writesProgress, false);
  assert.equal(phase2a.developerOnly, true);
  assert.equal(phase2a.readOnly, true);
  assert.equal(phase2a.qualityGate, 'locked');
});

test('runtime feature flags remain disabled for production and progress writes', () => {
  assert.equal(flags.FLAGS.HSK_CURRICULUM_V2_ENABLED, false);
  assert.equal(flags.FLAGS.HSK_CURRICULUM_V2_PUBLIC_OVERRIDE_ALLOWED, false);
  assert.equal(flags.FLAGS.HSK_CURRICULUM_V2_PROGRESS_WRITES_ENABLED, false);
  assert.equal(flags.FLAGS.HSK_CURRICULUM_V2_QUALITY_GATE, 'locked');
});
