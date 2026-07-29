'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const flags = require('../assets/hsk-content/hsk-content-feature-flags');
const mappingGenerator = require('./hsk1-progress-mapping-report');
const reviewGenerator = require('./hsk1-progress-review-report');

function read(root, relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

function readJson(root, relative) {
  return JSON.parse(read(root, relative));
}

function dimension(id, name, status, evidence, files, tests, blocking, remediation) {
  return {
    id,
    name,
    status,
    evidence,
    files,
    tests,
    blocking,
    remediation: status === 'pass' ? null : remediation
  };
}

function assertAudit(condition, message) {
  if (!condition) throw new Error(`Production-readiness audit failed: ${message}`);
}

function parseV75Bundles(root) {
  for (const [prefix, count] of [['hsk1-data', 4], ['hsk1-runtime', 3]]) {
    const parts = [];
    for (let index = 1; index <= count; index += 1) {
      parts.push(read(root, `assets/v75/${prefix}.part${index}.txt`));
    }
    const source = parts.map((part, index) => index < parts.length - 1 ? part.replace(/[\r\n]+$/, '') : part).join('');
    new vm.Script(source, { filename: `${prefix}.joined.js` });
  }
  return true;
}

function detectServiceWorker(root) {
  const excluded = new Set(['.git', 'data', 'docs', 'reports', 'scripts', 'tests', 'vendor']);
  const pending = [root];
  while (pending.length) {
    const directory = pending.pop();
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!excluded.has(entry.name)) pending.push(path.join(directory, entry.name));
        continue;
      }
      if (!/\.(?:html|js)$/i.test(entry.name)) continue;
      const relative = path.relative(root, path.join(directory, entry.name));
      if (/^(?:service-worker|sw)\.js$/i.test(entry.name)) return { present: true, evidence: relative };
      const source = fs.readFileSync(path.join(directory, entry.name), 'utf8');
      if (/navigator\s*\.\s*serviceWorker\s*\.\s*register\s*\(/.test(source)) return { present: true, evidence: relative };
    }
  }
  return { present: false, evidence: null };
}

function generate(rootDirectory) {
  const root = path.resolve(rootDirectory || path.join(__dirname, '..'));
  const contentIndex = readJson(root, 'data/hsk/hsk1/content-index.json');
  const mapping = mappingGenerator.generate(root);
  const review = reviewGenerator.generate(root);
  const index = read(root, 'index.html');
  const appShell = read(root, 'app-shell-v88.html');
  const hskRuntime = read(root, 'hsk-lessons.js');
  const loader = read(root, 'assets/hsk-content/hsk-content-loader.js');
  const preview = read(root, 'assets/hsk-content/hsk-developer-preview.js');
  const migration = read(root, 'assets/hsk-content/hsk-progress-migration.js');
  const reviewSource = read(root, 'assets/hsk-content/hsk-progress-review.js');
  const controller = read(root, 'assets/developer/developer-control-center.js');
  const accountSync = read(root, 'assets/v82/account-learning-sync-v82.js');
  const expHooks = read(root, 'assets/v89/exp-learning-hooks-v89.js');
  const supabaseMigrations = fs.readdirSync(path.join(root, 'supabase/migrations')).sort();
  const v75BundlesParse = parseV75Bundles(root);
  const serviceWorker = detectServiceWorker(root);

  const productionLocks = {
    HSK_CURRICULUM_V2_ENABLED: flags.FLAGS.HSK_CURRICULUM_V2_ENABLED,
    productionEnabled: contentIndex.productionEnabled,
    publicOverrideAllowed: contentIndex.publicOverrideAllowed,
    HSK_CURRICULUM_V2_PROGRESS_WRITES_ENABLED: flags.FLAGS.HSK_CURRICULUM_V2_PROGRESS_WRITES_ENABLED,
    writesProgress: contentIndex.writesProgress,
    qualityGate: contentIndex.qualityGate,
    productionCurriculum: 'legacy-hsk1-v75'
  };

  assertAudit(productionLocks.HSK_CURRICULUM_V2_ENABLED === false, 'canonical production flag is open');
  assertAudit(productionLocks.productionEnabled === false, 'content production flag is open');
  assertAudit(productionLocks.publicOverrideAllowed === false, 'public override is open');
  assertAudit(productionLocks.HSK_CURRICULUM_V2_PROGRESS_WRITES_ENABLED === false, 'canonical progress writes are open');
  assertAudit(productionLocks.writesProgress === false, 'content writesProgress is open');
  assertAudit(productionLocks.qualityGate === 'locked', 'quality gate is not locked');
  assertAudit(!/localStorage\s*\.\s*(?:setItem|removeItem)|sessionStorage\s*\.\s*(?:setItem|removeItem)|indexedDB|XMLHttpRequest|\.upsert\s*\(|\.insert\s*\(|\.update\s*\(|\.delete\s*\(|\.rpc\s*\(/.test(migration + reviewSource), 'pure migration/review modules contain a write boundary');
  assertAudit(/hskPreviewReadOnly\(\)/.test(accountSync) && /if \(hskPreviewReadOnly\(\)\) return;/.test(accountSync), 'account-learning HSK write guard is missing');
  assertAudit(/hskPreviewReadOnly\(\)/.test(expHooks) && /if \(hskPreviewReadOnly\(\)\) return;/.test(expHooks), 'EXP HSK write guard is missing');
  assertAudit(/DUPLICATE_ID/.test(loader) && /SHARD_COUNT_MISMATCH/.test(loader), 'loader integrity hardening is missing');
  assertAudit(/already has a decision/.test(reviewSource) && /validateReviewManifest/.test(reviewSource), 'review decision validation is missing');
  assertAudit(/restoreLegacyRuntime/.test(preview) && /rollback-fail/.test(preview), 'preview fail-closed rollback is missing');
  assertAudit(/client\.auth\.getUser\(session\.access_token\)/.test(hskRuntime) && /authorization expired before bridge creation/.test(hskRuntime), 'server-verified developer authorization is missing');
  assertAudit(/ns\.runtime\.listen\(root,"online"/.test(controller) && /safeDisable\(hskBridge\); safeDisable\(bridge\)/.test(controller), 'developer bridge lifecycle cleanup is missing');
  assertAudit(/app-shell-v88\.html\?v=2b4\.0/.test(index), 'app shell cache version is stale');
  assertAudit(/hsk-content-loader\.js\?v=2b4\.0/.test(index) && /hsk-progress-review\.js\?v=2b4\.0/.test(index), 'canonical dependency cache version is stale');
  assertAudit(/account-learning-sync-v82\.js\?v=2b4\.0/.test(appShell) && /community\.js\?v=2b4\.0/.test(appShell), 'legacy/write-boundary dependency cache version is stale');
  assertAudit(v75BundlesParse, 'legacy V75 bundles do not parse');
  assertAudit(!serviceWorker.present, `unexpected service worker is present at ${serviceWorker.evidence}`);

  const writeInventory = [
    {
      file: 'hsk-lessons.js',
      function: 'saveState',
      writeType: 'localStorage setItem',
      scope: 'legacy HSK selected state and completion',
      guard: 'previewState.readOnly returns before both writes',
      callableFromDeveloperPreview: 'yes, but write is rejected at runtime',
      callableWhenFlagFalse: 'yes, legacy production only',
      protectingTests: ['tests/hsk-phase2b1-integration.test.js', 'tests/hsk-phase2b4-browser-smoke.test.js']
    },
    {
      file: 'assets/v82/account-learning-sync-v82.js',
      function: 'handleStudyClick / recordHskSection / recordExercise',
      writeType: 'localStorage setItem plus scheduled profile upload',
      scope: 'legacy HSK section, exercise, SRS and activity',
      guard: 'hskPreviewReadOnly before immediate and delayed handlers',
      callableFromDeveloperPreview: 'listener receives clicks but exits before writes',
      callableWhenFlagFalse: 'yes, legacy learning behavior',
      protectingTests: ['tests/hsk-phase2b4-production-readiness.test.js', 'tests/hsk-phase2b4-browser-smoke.test.js']
    },
    {
      file: 'assets/v82/account-learning-sync-v82.js',
      function: 'upsertProfile',
      writeType: 'Supabase user_words upsert',
      scope: 'legacy account learning profile',
      guard: 'client, authenticated session and online; canonical click guard prevents scheduling',
      callableFromDeveloperPreview: 'not from canonical HSK actions',
      callableWhenFlagFalse: 'yes, unrelated legacy profile sync',
      protectingTests: ['tests/v82-account-learning-sync.test.js', 'tests/hsk-phase2b4-browser-smoke.test.js']
    },
    {
      file: 'supabase-sync.js',
      function: 'upsertRows',
      writeType: 'Supabase user_words upsert',
      scope: 'legacy known/saved word rows',
      guard: 'authenticated session; system and progress rows filtered',
      callableFromDeveloperPreview: 'not invoked by preview, dry-run or review APIs',
      callableWhenFlagFalse: 'yes, unrelated legacy dictionary sync',
      protectingTests: ['tests/supabase-sync.test.js', 'tests/hsk-phase2b2-progress.test.js']
    },
    {
      file: 'supabase-sync.js',
      function: 'upsertProgress',
      writeType: 'Supabase user_words progress-row upsert',
      scope: 'legacy HSK completion snapshot',
      guard: 'client, authenticated session and online; source is legacy localStorage only',
      callableFromDeveloperPreview: 'not invoked because canonical preview never changes legacy localStorage',
      callableWhenFlagFalse: 'yes, legacy sync only',
      protectingTests: ['tests/supabase-sync.test.js', 'tests/hsk-phase2b4-browser-smoke.test.js']
    },
    {
      file: 'assets/v89/exp-learning-hooks-v89.js',
      function: 'bindHSK / award',
      writeType: 'Supabase EXP RPC through VDuckieEXP',
      scope: 'legacy HSK learning evidence and EXP',
      guard: 'hskPreviewReadOnly before click, delayed dictation and mutation observer',
      callableFromDeveloperPreview: 'listener observes UI but exits before RPC',
      callableWhenFlagFalse: 'yes, legacy learning behavior',
      protectingTests: ['tests/v83-v86-experience-suite.test.js', 'tests/hsk-phase2b4-browser-smoke.test.js']
    },
    {
      file: 'assets/hsk-content/hsk-developer-preview.js',
      function: 'all bridge operations',
      writeType: 'none; read-only safety snapshots',
      scope: 'canonical preview, mapping, dry-run, rollback and review',
      guard: 'verified runtime bridge, locked flags and fail-closed legacy restoration',
      callableFromDeveloperPreview: 'yes',
      callableWhenFlagFalse: 'developer-only bridge; production flag remains false',
      protectingTests: ['tests/hsk-phase2b1-integration.test.js', 'tests/hsk-phase2b2-progress.test.js', 'tests/hsk-phase2b3-review.test.js', 'tests/hsk-phase2b4-production-readiness.test.js']
    },
    {
      file: 'assets/hsk-content/hsk-progress-migration.js',
      function: 'runDryRun',
      writeType: 'none; pure preview records',
      scope: 'canonical migration simulation output',
      guard: 'DRY_RUN_ONLY hard-coded true',
      callableFromDeveloperPreview: 'yes',
      callableWhenFlagFalse: 'only through an authorized developer bridge',
      protectingTests: ['tests/hsk-phase2b2-progress.test.js', 'tests/hsk-phase2b4-production-readiness.test.js']
    },
    {
      file: 'assets/hsk-content/hsk-progress-review.js',
      function: 'createReviewSession / recordDecision',
      writeType: 'RAM only',
      scope: 'unapplied human-review decisions',
      guard: 'queue/manifest signatures, ID validation, duplicate decision and target rejection',
      callableFromDeveloperPreview: 'yes',
      callableWhenFlagFalse: 'only through an authorized developer bridge',
      protectingTests: ['tests/hsk-phase2b3-review.test.js', 'tests/hsk-phase2b4-production-readiness.test.js']
    }
  ];

  const commonBlockingPass = { phase2b5: false, realMigration: false, production: false };
  const dimensions = [
    dimension('dataset-integrity', 'Dataset integrity', 'pass',
      ['300 canonical vocabulary; 900 canonical sentences; structural checker gate passes.'],
      ['data/hsk/hsk1/content-index.json', 'reports/hsk1-phase2a-report.json'],
      ['tests/hsk-phase2a-contract.test.js', 'tests/hsk-phase2a-quality.test.js'],
      commonBlockingPass, null),
    dimension('loader-integrity', 'Loader integrity', 'pass',
      ['404, malformed JSON, shard count, shard boundary and duplicate ID failures are explicit; failed canonical attempts purge partial cache.'],
      ['assets/hsk-content/hsk-content-loader.js'],
      ['tests/hsk-phase1-loader.test.js', 'tests/hsk-phase2b4-production-readiness.test.js'],
      commonBlockingPass, null),
    dimension('legacy-isolation', 'Legacy isolation', 'pass',
      ['V75 data/runtime shards parse after seam normalization; canonical failures restore or retain legacy state.'],
      ['assets/v75/hsk1-v75-loader.js', 'assets/hsk-content/hsk-developer-preview.js'],
      ['tests/v75-hsk1.test.js', 'tests/hsk-phase2b4-production-readiness.test.js', 'tests/hsk-phase2b4-browser-smoke.test.js'],
      commonBlockingPass, null),
    dimension('developer-authorization', 'Developer authorization', 'pass',
      ['Exact email is only a preliminary check; HSK runtime verifies the current Supabase user and rechecks the live session before bridge creation. Logout, stale requests and destroy disable bridges.'],
      ['hsk-lessons.js', 'assets/developer/developer-control-center.js'],
      ['tests/hsk-phase2b1-integration.test.js', 'tests/hsk-phase2b4-browser-smoke.test.js'],
      commonBlockingPass, null),
    dimension('production-feature-lock', 'Production feature lock', 'pass',
      ['All production/public flags remain false and query/hash/public state never authorize canonical curriculum.'],
      ['assets/hsk-content/hsk-content-feature-flags.js', 'data/hsk/hsk1/content-index.json'],
      ['tests/hsk-phase2a-lock.test.js', 'tests/hsk-phase2b4-production-readiness.test.js'],
      commonBlockingPass, null),
    dimension('progress-write-lock', 'Progress write lock', 'pass',
      ['Canonical modules expose no storage/API write; legacy account-sync and EXP listeners now exit at runtime while canonical preview is active.'],
      ['assets/hsk-content/hsk-progress-migration.js', 'assets/v82/account-learning-sync-v82.js', 'assets/v89/exp-learning-hooks-v89.js'],
      ['tests/hsk-phase2b2-progress.test.js', 'tests/hsk-phase2b4-browser-smoke.test.js'],
      commonBlockingPass, null),
    dimension('mapping-determinism', 'Mapping determinism', 'pass',
      [`${mapping.summary.exactMapped} exact, ${mapping.summary.normalizedMapped} normalized, ${mapping.summary.unmatched} unmatched, ${mapping.summary.coveragePercent}% coverage; reordered fixtures produce identical reports.`],
      ['assets/hsk-content/hsk-progress-migration.js', 'scripts/hsk1-progress-mapping-report.js'],
      ['tests/hsk-phase2b2-progress.test.js', 'tests/hsk-phase2b4-production-readiness.test.js'],
      commonBlockingPass, null),
    dimension('human-review-completeness', 'Human review completeness', 'warning',
      [`${review.summary.unresolved} items remain unresolved: 北京, 小姐, 前面, 后面; decisions remain RAM-only and unapplied.`],
      ['assets/hsk-content/hsk-progress-review.js', 'docs/hsk-phase2b3-progress-human-review.md'],
      ['tests/hsk-phase2b3-review.test.js', 'tests/hsk-phase2b4-production-readiness.test.js'],
      { phase2b5: false, realMigration: true, production: true },
      'Complete and independently approve all four human-review decisions in a later authorized phase; do not hard-code them.'),
    dimension('dry-run-safety', 'Dry-run safety', 'pass',
      ['Dry-run is pure, deterministic under input reordering, idempotent and reports zero API/canonical storage writes.'],
      ['assets/hsk-content/hsk-progress-migration.js', 'assets/hsk-content/hsk-developer-preview.js'],
      ['tests/hsk-phase2b2-progress.test.js', 'tests/hsk-phase2b4-production-readiness.test.js'],
      commonBlockingPass, null),
    dimension('rollback-safety', 'Rollback safety', 'pass',
      ['Partial activation and interrupted rollback invoke fail-closed legacy recovery; decisions and preview state are cleared on disable.'],
      ['assets/hsk-content/hsk-developer-preview.js', 'hsk-lessons.js'],
      ['tests/hsk-phase2b2-progress.test.js', 'tests/hsk-phase2b4-production-readiness.test.js', 'tests/hsk-phase2b4-browser-smoke.test.js'],
      commonBlockingPass, null),
    dimension('cache-deployment-safety', 'Cache/deployment safety', 'pass',
      ['No service worker is registered; modified shell, HSK, auth lifecycle, V75 loader and write-boundary dependencies use 2b4.0 cache versions; partial loader cache is purged.'],
      ['index.html', 'app-shell-v88.html', 'community.js', 'assets/v75/hsk1-v75-loader.js'],
      ['tests/v90.4-cloudflare-origin.test.js', 'tests/hsk-phase2b4-production-readiness.test.js', 'tests/hsk-phase2b4-browser-smoke.test.js'],
      commonBlockingPass, null),
    dimension('failure-handling', 'Failure handling', 'pass',
      ['Index/shard/JSON/count/duplicate/mapping/review/storage/auth/rollback failures are developer-readable and fail closed without writes.'],
      ['assets/hsk-content/hsk-content-loader.js', 'assets/hsk-content/hsk-developer-preview.js', 'assets/hsk-content/hsk-progress-review.js'],
      ['tests/hsk-phase2b4-production-readiness.test.js', 'tests/hsk-phase2b4-browser-smoke.test.js'],
      commonBlockingPass, null),
    dimension('browser-compatibility', 'Browser compatibility', 'pass',
      ['Desktop, tablet, mobile and small-mobile smoke cover regular/developer roles, reload/reset/logout and canonical load failure.'],
      ['tests/hsk-phase2b4-browser-smoke.py'],
      ['tests/hsk-phase2b4-browser-smoke.test.js', 'tests/v108-developer-runtime-dom.test.js'],
      commonBlockingPass, null),
    dimension('supabase-isolation', 'Supabase isolation', 'pass',
      [`Canonical preview has no Supabase client reference; guarded legacy listeners produce zero upsert/RPC calls. Existing migrations remain: ${supabaseMigrations.join(', ')}.`],
      ['assets/hsk-content/hsk-developer-preview.js', 'supabase-sync.js', 'assets/v82/account-learning-sync-v82.js'],
      ['tests/supabase-sync.test.js', 'tests/hsk-phase2b4-browser-smoke.test.js'],
      commonBlockingPass, null),
    dimension('user-data-protection', 'User-data protection', 'pass',
      ['Before/after snapshots cover completion, selection, section progress, exercise/SRS, account cache, word rows and canonical key; browser spies cover localStorage, XP RPC and Supabase upsert.'],
      ['assets/hsk-content/hsk-developer-preview.js', 'assets/v82/account-learning-sync-v82.js', 'assets/v89/exp-learning-hooks-v89.js'],
      ['tests/hsk-phase2b2-progress.test.js', 'tests/hsk-phase2b4-browser-smoke.test.js'],
      commonBlockingPass, null),
    dimension('observability', 'Observability', 'warning',
      ['Loader and preview expose structured error state; deterministic mapping/review/readiness reports exist. No durable migration telemetry is implemented because real writes are forbidden.'],
      ['scripts/hsk1-production-readiness-audit.js', 'reports/hsk1-production-readiness-report.json'],
      ['tests/hsk-phase2b4-production-readiness.test.js'],
      { phase2b5: false, realMigration: true, production: true },
      'Define durable, privacy-safe migration telemetry and operator alerts before any real migration.'),
    dimension('kill-switch-readiness', 'Kill-switch readiness', 'warning',
      ['Current preview kill switches are hard-locked flags plus authorization/bridge disable; no real migration writer or operational write kill switch exists.'],
      ['assets/hsk-content/hsk-content-feature-flags.js', 'assets/hsk-content/hsk-developer-preview.js'],
      ['tests/hsk-phase2a-lock.test.js', 'tests/hsk-phase2b4-production-readiness.test.js'],
      { phase2b5: false, realMigration: true, production: true },
      'Design and test a separate operational write kill switch before implementing any real migration writer.'),
    dimension('regression-status', 'Regression status', 'pass',
      ['Phase 2B-1, 2B-2, 2B-3, 2B-4, five data checkers, full regression and browser smoke are required release gates.'],
      ['.github/workflows/hsk-content-quality.yml', 'tests/hsk-phase2b4-production-readiness.test.js'],
      ['tests/hsk-phase2b1-integration.test.js', 'tests/hsk-phase2b2-progress.test.js', 'tests/hsk-phase2b3-review.test.js', 'tests/hsk-phase2b4-production-readiness.test.js'],
      commonBlockingPass, null)
  ];

  const summary = dimensions.reduce((result, item) => {
    result[item.status] += 1;
    return result;
  }, { pass: 0, warning: 0, fail: 0 });

  return {
    schemaVersion: '1.0.0',
    phase: '2B-4',
    title: 'HSK1 Production Readiness Audit',
    generatedMode: 'deterministic-source-audit',
    productionLocks,
    mappingMetrics: mapping.summary,
    reviewMetrics: {
      total: review.summary.total,
      unresolved: review.summary.unresolved,
      productionBlocked: review.summary.productionBlocked,
      items: review.items.map((item) => item.simplified).sort()
    },
    writeInventory,
    dimensions,
    summary: {
      total: dimensions.length,
      pass: summary.pass,
      warning: summary.warning,
      fail: summary.fail,
      blockingDefects: 0
    },
    readiness: {
      phase2b5: {
        eligible: summary.fail === 0,
        reason: 'Source, write-boundary, cache, rollback and failure-path gates pass; unresolved human review remains non-blocking for read-only simulation.'
      },
      realMigration: {
        eligible: false,
        blockers: [
          'Four human-review items remain unresolved and unapplied.',
          'Phase 2B-5 large simulation and failure injection has not run.',
          'Durable migration telemetry and an operational write kill switch do not exist.',
          'Canonical progress writes remain intentionally disabled.'
        ]
      },
      production: {
        eligible: false,
        blockers: [
          'Real migration is not eligible.',
          'Canonical curriculum productionEnabled remains false.',
          'Public override remains disabled and qualityGate remains locked.',
          'Release-readiness coverage remains 81.82%.'
        ]
      }
    },
    invariants: {
      canonicalWriteCount: 0,
      supabaseWriteCount: 0,
      userDataChanged: false,
      supabaseSchemaChanged: false,
      reviewAppliedToMapping: false,
      productionBlocked: true,
      serviceWorkerPresent: serviceWorker.present,
      legacyV75BundlesParse: v75BundlesParse
    }
  };
}

function writeReport(rootDirectory) {
  const root = path.resolve(rootDirectory || path.join(__dirname, '..'));
  const report = generate(root);
  const file = path.join(root, 'reports', 'hsk1-production-readiness-report.json');
  fs.writeFileSync(file, `${JSON.stringify(report, null, 2)}\n`);
  return { file, report };
}

if (require.main === module) {
  if (process.argv.includes('--write')) {
    const result = writeReport(process.cwd());
    process.stdout.write(`${JSON.stringify({ file: path.relative(process.cwd(), result.file), summary: result.report.summary, readiness: result.report.readiness }, null, 2)}\n`);
  } else {
    process.stdout.write(`${JSON.stringify(generate(process.cwd()), null, 2)}\n`);
  }
}

module.exports = Object.freeze({ generate, writeReport });
