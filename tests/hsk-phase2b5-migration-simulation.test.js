'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const fixtureTools = require('../scripts/hsk1-migration-fixture');
const simulation = require('../scripts/hsk1-migration-simulation');
const reportGenerator = require('../scripts/hsk1-phase2b5-migration-simulation-report');
const mappingGenerator = require('../scripts/hsk1-progress-mapping-report');
const reviewGenerator = require('../scripts/hsk1-progress-review-report');

const rootDirectory = path.resolve(__dirname, '..');
const mappingReport = mappingGenerator.generate(rootDirectory);
const seed = fixtureTools.DEFAULT_SEED;
let sessionSequence = 0;

function fixture(size = 100) {
  return fixtureTools.generateFixture({ size, seed, mappingReport });
}

function createSession(options = {}) {
  sessionSequence += 1;
  return simulation.createSimulationSession(Object.assign({
    fixture: fixture(),
    mappingReport,
    batchSize: 25,
    ownerKey: 'synthetic-test-owner',
    simulationId: `phase2b5-test-${sessionSequence}`
  }, options));
}

function expectCode(operation, code) {
  assert.throws(operation, (error) => {
    assert.equal(error && error.code, code);
    return true;
  });
}

function resign(checkpoint) {
  const unsigned = JSON.parse(JSON.stringify(checkpoint));
  delete unsigned.signature;
  checkpoint.signature = fixtureTools.hash(unsigned);
  return checkpoint;
}

test('large fixture generator is deterministic, bounded and covers every required category', () => {
  const first = fixture(100);
  const second = fixture(100);
  assert.deepEqual(first, second);
  assert.equal(first.fixtureHash, second.fixtureHash);
  assert.equal(first.syntheticOnly, true);
  assert.equal(Object.keys(first.expectedSummary.categoryCounts).length, 25);
  assert.ok(Object.values(first.expectedSummary.categoryCounts).every((count) => count > 0));
  assert.equal(fixture(1000).size, 1000);
  assert.equal(fixture(10000).size, 10000);
  assert.throws(() => fixtureTools.generateFixture({ size: 10001, seed, mappingReport }), /MAX_FIXTURE_SIZE/);
});

test('small simulation processes deterministic batches and preserves every write boundary', () => {
  const result = createSession().run();
  assert.equal(result.state, 'completed');
  assert.equal(result.summary.processed, 100);
  assert.equal(result.summary.batchCount, 4);
  assert.equal(result.legacyUnchanged, true);
  assert.equal(result.writeCount, 0);
  assert.equal(result.storageCanonicalWriteCount, 0);
  assert.equal(result.supabaseWriteCount, 0);
  assert.equal(result.rpcWriteCount, 0);
  assert.equal(result.expWriteCount, 0);
});

test('output is independent of batch size and repeated runs are idempotent', () => {
  const source = fixture();
  const first = createSession({ fixture: source, batchSize: 20, simulationId: 'batch-20' }).run();
  const second = createSession({ fixture: source, batchSize: 40, simulationId: 'batch-40' }).run();
  const repeat = createSession({ fixture: source, batchSize: 20, simulationId: 'batch-repeat' }).run();
  assert.equal(first.outputHash, second.outputHash);
  assert.equal(first.outputHash, repeat.outputHash);
  assert.equal(first.legacyBeforeHash, repeat.legacyAfterHash);
});

test('profile order and progress-record order do not affect output', () => {
  const source = fixture();
  const profilesReversed = JSON.parse(JSON.stringify(source));
  profilesReversed.profiles.reverse();
  profilesReversed.fixtureHash = fixtureTools.hashFixture(profilesReversed);
  const progressReversed = JSON.parse(JSON.stringify(source));
  progressReversed.profiles.forEach((profile) => {
    if (profile.legacy && Array.isArray(profile.legacy.wordRows)) profile.legacy.wordRows.reverse();
  });
  progressReversed.fixtureHash = fixtureTools.hashFixture(progressReversed);
  const base = createSession({ fixture: source, simulationId: 'order-base' }).run();
  assert.equal(createSession({ fixture: profilesReversed, simulationId: 'order-profiles' }).run().outputHash, base.outputHash);
  assert.equal(createSession({ fixture: progressReversed, simulationId: 'order-progress' }).run().outputHash, base.outputHash);
});

test('pause and resume match an uninterrupted run', () => {
  const source = fixture();
  const uninterrupted = createSession({ fixture: source, simulationId: 'pause-reference' }).run();
  const paused = createSession({ fixture: source, simulationId: 'pause-session' });
  paused.step(1);
  paused.pause();
  expectCode(() => paused.step(1), 'SIMULATION_PAUSED');
  paused.resume();
  assert.equal(paused.run().outputHash, uninterrupted.outputHash);
});

test('cancel is safe and partial in-memory target rolls back completely', () => {
  const session = createSession({ simulationId: 'cancel-session' });
  session.step(2);
  assert.ok(session.report().simulatedTargetEntries > 0);
  assert.equal(session.cancel().state, 'cancelled');
  const rollback = session.rollback();
  assert.equal(rollback.pass, true);
  assert.equal(session.report().simulatedTargetEntries, 0);
  assert.equal(session.report().legacyUnchanged, true);
});

test('retry is idempotent, rejects duplicate retry and enforces retry cap', () => {
  const session = createSession({
    simulationId: 'retry-session',
    failures: [{ eventType: 'before_batch', batchIndex: 0, code: 'RETRY_ONCE', times: 1, seed }]
  });
  expectCode(() => session.run(), 'RETRY_ONCE');
  session.retry();
  const result = session.run();
  assert.equal(result.state, 'completed');
  assert.equal(result.summary.retried, 1);
  expectCode(() => session.retry(), 'NO_FAILED_BATCH');

  const capped = createSession({
    simulationId: 'retry-cap',
    maxRetries: 1,
    failures: [{ eventType: 'before_batch', batchIndex: 0, code: 'RETRY_ALWAYS', times: 3, seed }]
  });
  expectCode(() => capped.run(), 'RETRY_ALWAYS');
  expectCode(() => capped.retry(), 'RETRY_ALWAYS');
  expectCode(() => capped.retry(), 'RETRY_CAP_EXCEEDED');
});

test('checkpoint resume matches uninterrupted output without reprocessing a completed batch', () => {
  const sourceFixture = fixture();
  const source = createSession({ fixture: sourceFixture, simulationId: 'checkpoint-resume' });
  source.step(2);
  const checkpoint = source.createCheckpoint();
  assert.equal(checkpoint.processedCount, 50);
  const restored = createSession({ fixture: sourceFixture, simulationId: 'checkpoint-resume' });
  restored.restoreCheckpoint(checkpoint);
  restored.resume();
  const resumed = restored.run();
  const reference = createSession({ fixture: sourceFixture, simulationId: 'checkpoint-reference' }).run();
  assert.equal(resumed.outputHash, reference.outputHash);
  assert.equal(resumed.summary.processed, 100);
  assert.equal(resumed.writeIsolation.simulatedPreviewCaptures, 50);
});

test('stale, corrupt, wrong-version and wrong-owner checkpoints are rejected', () => {
  const simulationId = 'checkpoint-validation';
  const source = createSession({ simulationId });
  source.step(1);
  const original = source.createCheckpoint();

  const stale = JSON.parse(JSON.stringify(original));
  stale.fixtureHash = 'stale';
  resign(stale);
  expectCode(() => createSession({ simulationId }).restoreCheckpoint(stale), 'CHECKPOINT_FIXTURE_MISMATCH');

  const corrupt = JSON.parse(JSON.stringify(original));
  corrupt.processedCount += 1;
  expectCode(() => createSession({ simulationId }).restoreCheckpoint(corrupt), 'CHECKPOINT_CORRUPT');

  const wrongVersion = JSON.parse(JSON.stringify(original));
  wrongVersion.version = '0.0.0';
  resign(wrongVersion);
  expectCode(() => createSession({ simulationId }).restoreCheckpoint(wrongVersion), 'CHECKPOINT_VERSION_MISMATCH');

  expectCode(
    () => createSession({ simulationId, ownerKey: 'different-owner' }).restoreCheckpoint(original),
    'CHECKPOINT_OWNER_MISMATCH'
  );
});

test('rollback is full, partial, idempotent and retryable after injected failure', () => {
  const full = createSession({ simulationId: 'rollback-full' });
  full.run();
  const first = full.rollback();
  const second = full.rollback();
  assert.deepEqual(second, first);

  const partial = createSession({ simulationId: 'rollback-partial' });
  partial.step(1);
  assert.equal(partial.rollback().pass, true);

  const failing = createSession({
    simulationId: 'rollback-retry',
    failures: [{ eventType: 'rollback', code: 'ROLLBACK_ONCE', times: 1, seed }]
  });
  failing.step(1);
  expectCode(() => failing.rollback(), 'ROLLBACK_ONCE');
  assert.equal(failing.retryRollback().pass, true);
});

test('seeded failure injection leaves no committed batch and rolls back', () => {
  const session = createSession({
    simulationId: 'seeded-failure',
    failures: [{ eventType: 'profile', batchIndex: 0, profileIndex: 7, code: 'MID_BATCH', times: 1, seed }]
  });
  expectCode(() => session.run(), 'MID_BATCH');
  assert.equal(session.report().simulatedTargetEntries, 0);
  assert.equal(session.report().failureState.code, 'MID_BATCH');
  assert.equal(session.rollback().pass, true);
});

test('write, storage, Supabase, RPC and EXP spies are blocked before actual writes', () => {
  const telemetry = simulation.createTelemetry();
  const killSwitch = simulation.createSimulationKillSwitch({
    version: simulation.SIMULATION_VERSION,
    engaged: true
  }, telemetry);
  const spies = simulation.createWriteIsolationSpies(telemetry, killSwitch);
  ['canonicalWrite', 'storageWrite', 'supabaseWrite', 'rpcWrite', 'expWrite'].forEach((method) => {
    expectCode(() => spies[method](), 'PRODUCTION_DISABLED');
  });
  const counts = spies.snapshot();
  assert.equal(counts.canonicalProductionWrites, 0);
  assert.equal(counts.storageCanonicalWrites, 0);
  assert.equal(counts.supabaseWrites, 0);
  assert.equal(counts.rpcWrites, 0);
  assert.equal(counts.expWrites, 0);
  assert.equal(counts.blockedAttempts, 5);
});

test('simulation kill switch defaults engaged and fails closed for missing or invalid config', () => {
  assert.equal(simulation.createSimulationKillSwitch().evaluate(simulation.EXPECTED_FLAGS).allowed, false);
  assert.equal(
    simulation.createSimulationKillSwitch({ version: 'wrong', engaged: false }).evaluate(simulation.EXPECTED_FLAGS).reasonCode,
    'KILL_SWITCH_CONFIG_INVALID'
  );
  const engaged = simulation.createSimulationKillSwitch({ version: simulation.SIMULATION_VERSION, engaged: true });
  assert.equal(engaged.isEngaged(), true);
  assert.equal(engaged.evaluate(simulation.EXPECTED_FLAGS).allowed, false);
});

test('authorization, owner and production locks are rechecked at every batch', () => {
  const state = Object.assign({
    developerAuthorized: true,
    ownerKey: 'synthetic-test-owner'
  }, simulation.EXPECTED_FLAGS);
  const session = createSession({ simulationId: 'auth-session', runtimeStateProvider: () => state });
  session.step(1);
  state.developerAuthorized = false;
  expectCode(() => session.step(1), 'DEVELOPER_UNAUTHORIZED');
  assert.equal(session.rollback().pass, true);

  const unsafe = Object.assign({}, state, { developerAuthorized: true, productionEnabled: true });
  expectCode(
    () => createSession({ simulationId: 'unsafe-flags', runtimeStateProvider: () => unsafe }).run(),
    'UNSAFE_FLAG_productionEnabled'
  );
});

test('concurrent-session, event-log and batch-size resource guards fail closed', () => {
  const coordinator = simulation.createSimulationCoordinator({ maxConcurrentSessions: 2 });
  const left = coordinator.createSession({
    fixture: fixture(),
    mappingReport,
    simulationId: 'guard-left',
    ownerKey: 'synthetic-test-owner'
  });
  const right = coordinator.createSession({
    fixture: fixture(),
    mappingReport,
    simulationId: 'guard-right',
    ownerKey: 'synthetic-test-owner'
  });
  expectCode(() => coordinator.createSession({
    fixture: fixture(),
    mappingReport,
    simulationId: 'guard-third',
    ownerKey: 'synthetic-test-owner'
  }), 'CONCURRENT_SESSION_LIMIT');
  left.dispose();
  right.dispose();

  const capped = createSession({ simulationId: 'event-cap', maxEvents: 5 }).run();
  assert.equal(capped.telemetry.summary.stored, 5);
  assert.ok(capped.telemetry.summary.dropped > 0);
  expectCode(
    () => createSession({ simulationId: 'batch-too-large', batchSize: simulation.MAX_BATCH_SIZE + 1 }),
    'INVALID_BATCH_SIZE'
  );
});

test('malformed fixtures and invalid progress records are visible and read-only', () => {
  expectCode(
    () => simulation.createSimulationSession({ fixture: {}, mappingReport }),
    'MALFORMED_FIXTURE'
  );
  const corrupt = fixture();
  corrupt.profiles[0].category = 'tampered';
  expectCode(
    () => simulation.createSimulationSession({ fixture: corrupt, mappingReport }),
    'FIXTURE_HASH_MISMATCH'
  );
  const result = createSession({ simulationId: 'invalid-records' }).run();
  assert.ok(result.summary.invalid > 0);
  assert.ok(result.telemetry.events.some((event) => event.type === 'profile_invalid'));
  assert.equal(result.writeCount, 0);
});

test('large 10,000-profile run completes within guards and cleans simulated target', () => {
  const largeFixture = fixture(10000);
  const session = createSession({
    fixture: largeFixture,
    batchSize: 250,
    simulationId: 'large-fixture-test',
    maxEvents: simulation.MAX_REPORT_EVENTS
  });
  const result = session.run();
  assert.equal(result.summary.processed, 10000);
  assert.equal(result.summary.batchCount, 40);
  assert.ok(result.summary.peakInMemoryRecordCount > 0);
  assert.equal(result.legacyUnchanged, true);
  assert.equal(session.rollback().pass, true);
  assert.equal(session.report().simulatedTargetEntries, 0);
});

test('real mapping metrics and four human-review items remain unresolved and unapplied', () => {
  const queue = reviewGenerator.generate(rootDirectory);
  assert.deepEqual(mappingReport.summary, {
    totalLegacyItems: 150,
    exactMapped: 146,
    normalizedMapped: 0,
    ambiguous: 0,
    unmatched: 4,
    duplicateTargets: 0,
    mapped: 146,
    coveragePercent: 97.33
  });
  assert.deepEqual(
    queue.items.map((item) => item.simplified).sort(),
    ['北京', '小姐', '前面', '后面'].sort()
  );
  assert.equal(queue.summary.unresolved, 4);
  assert.equal(queue.summary.productionBlocked, true);
});

test('all 40 failure cases pass and the machine-readable report keeps later gates blocked', () => {
  const report = reportGenerator.generate(rootDirectory);
  assert.equal(report.failureMatrix.total, 40);
  assert.equal(report.failureMatrix.pass, 40);
  assert.equal(report.failureMatrix.fail, 0);
  assert.equal(report.readiness.phase2b5Complete, true);
  assert.equal(report.readiness.phase2b6Allowed, true);
  assert.equal(report.readiness.realMigrationAllowed, false);
  assert.equal(report.readiness.productionAllowed, false);
  assert.equal(report.productionLocks.HSK_CURRICULUM_V2_ENABLED, false);
  assert.equal(report.productionLocks.HSK_CURRICULUM_V2_PROGRESS_WRITES_ENABLED, false);
  assert.equal(report.productionLocks.qualityGate, 'locked');
});

test('tracked report contains complete simulation, rollback, isolation and warning evidence', () => {
  const tracked = JSON.parse(fs.readFileSync(
    path.join(rootDirectory, 'reports', 'hsk1-phase2b5-migration-simulation-report.json'),
    'utf8'
  ));
  assert.equal(tracked.reportVersion, reportGenerator.REPORT_VERSION);
  assert.equal(tracked.baselineCommit, reportGenerator.BASELINE_COMMIT);
  assert.equal(tracked.simulationRuns.large.run.processed, 10000);
  assert.equal(tracked.simulationRuns.large.run.rolledBack, true);
  assert.equal(tracked.writeIsolation.canonicalProductionWriteCount, 0);
  assert.equal(tracked.SupabaseIsolation.writeCount, 0);
  assert.equal(tracked.SupabaseIsolation.rpcCount, 0);
  assert.equal(tracked.legacyIntegrity.userDataChanged, false);
  assert.equal(tracked.warnings.length, 4);
  assert.deepEqual(tracked.blockers, []);
});
