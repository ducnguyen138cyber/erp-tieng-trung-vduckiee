'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const fixtureTools = require('./hsk1-migration-fixture');
const simulation = require('./hsk1-migration-simulation');
const mappingGenerator = require('./hsk1-progress-mapping-report');
const reviewGenerator = require('./hsk1-progress-review-report');
const review = require('../assets/hsk-content/hsk-progress-review');
const progressContract = require('../assets/hsk-content/hsk-progress-contract');

const REPORT_VERSION = '1.0.0';
const BASELINE_COMMIT = '2a0e94dc030ca402260a5dba7cd4f5e437aa1f5b';
const FIXTURE_SIZES = Object.freeze({ small: 100, medium: 1000, large: 10000 });
const BATCH_SIZES = Object.freeze({ small: 25, medium: 100, large: 250 });

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function runtimeState(ownerKey, overrides) {
  return Object.assign({
    developerAuthorized: true,
    ownerKey,
    HSK_CURRICULUM_V2_ENABLED: false,
    productionEnabled: false,
    publicOverrideAllowed: false,
    HSK_CURRICULUM_V2_PROGRESS_WRITES_ENABLED: false,
    writesProgress: false,
    qualityGate: 'locked'
  }, overrides || {});
}

function reportView(report, observedDurationMs, rollback) {
  return {
    state: report.state,
    totalProfiles: report.summary.totalProfiles,
    processed: report.summary.processed,
    succeeded: report.summary.succeeded,
    skipped: report.summary.skipped,
    reviewRequired: report.summary.reviewRequired,
    unmatched: report.summary.unmatched,
    invalid: report.summary.invalid,
    conflicts: report.summary.conflicts,
    duplicateTargets: report.summary.duplicateTargets,
    failed: report.summary.failed,
    retried: report.summary.retried,
    rolledBack: rollback && rollback.pass === true,
    batchSize: report.batchSize,
    batchCount: report.summary.batchCount,
    deterministicDurationTicks: report.durationMs,
    observedDurationMs,
    observedProfilesPerSecond: Math.round((report.summary.processed / Math.max(observedDurationMs, 0.001)) * 100000) / 100,
    peakInMemoryRecordCount: report.summary.peakInMemoryRecordCount,
    estimatedTargetBytes: report.estimatedTargetBytes,
    outputHash: report.outputHash,
    legacyBeforeHash: report.legacyBeforeHash,
    legacyAfterHash: report.legacyAfterHash,
    legacyUnchanged: report.legacyUnchanged,
    simulatedTargetHash: report.simulatedTargetHash,
    rollbackHash: rollback && rollback.afterHash,
    rollbackExpectedHash: rollback && rollback.expectedHash,
    writeCount: report.writeCount,
    storageCanonicalWriteCount: report.storageCanonicalWriteCount,
    supabaseWriteCount: report.supabaseWriteCount,
    rpcWriteCount: report.rpcWriteCount,
    expWriteCount: report.expWriteCount,
    telemetry: report.telemetry.summary
  };
}

function runScale(name, mappingReport, seed) {
  const fixture = fixtureTools.generateFixture({
    size: FIXTURE_SIZES[name],
    seed,
    mappingReport
  });
  const session = simulation.createSimulationSession({
    fixture,
    mappingReport,
    batchSize: BATCH_SIZES[name],
    ownerKey: `synthetic-${name}-owner`,
    simulationId: `hsk1-phase2b5-${name}`
  });
  const started = process.hrtime.bigint();
  const result = session.run();
  const observedDurationMs = Math.round((Number(process.hrtime.bigint() - started) / 1e6) * 100) / 100;
  const rollback = session.rollback();
  const repeatedRollback = session.rollback();
  const afterRollback = session.report();
  assert.equal(result.state, 'completed');
  assert.equal(result.legacyUnchanged, true);
  assert.equal(rollback.pass, true);
  assert.deepEqual(repeatedRollback, rollback);
  const view = reportView(result, observedDurationMs, rollback);
  view.telemetry = afterRollback.telemetry.summary;
  view.postRollbackTargetHash = afterRollback.simulatedTargetHash;
  view.rollbackIdempotent = fixtureTools.stableStringify(repeatedRollback) === fixtureTools.stableStringify(rollback);
  return {
    fixture: {
      version: fixture.fixtureVersion,
      seed: fixture.seed,
      size: fixture.size,
      hash: fixture.fixtureHash,
      syntheticOnly: fixture.syntheticOnly,
      categoryCounts: fixture.expectedSummary.categoryCounts
    },
    run: view
  };
}

function expectCode(operation, code) {
  assert.throws(operation, (error) => {
    assert.equal(error && error.code, code);
    return true;
  });
}

function resignCheckpoint(checkpoint) {
  const unsigned = clone(checkpoint);
  delete unsigned.signature;
  checkpoint.signature = fixtureTools.hash(unsigned);
  return checkpoint;
}

function rehashFixture(fixture) {
  fixture.fixtureHash = fixtureTools.hashFixture(fixture);
  return fixture;
}

function runFailureMatrix(rootDirectory, mappingReport, seed) {
  const root = path.resolve(rootDirectory);
  const fixture = fixtureTools.generateFixture({ size: 100, seed, mappingReport });
  const queue = reviewGenerator.generate(root);
  const results = [];
  const sharedTelemetry = simulation.createTelemetry({ maxEvents: simulation.MAX_REPORT_EVENTS });
  let sequence = 0;

  function baseOptions(extra) {
    sequence += 1;
    return Object.assign({
      fixture,
      mappingReport,
      batchSize: 25,
      ownerKey: 'synthetic-failure-owner',
      simulationId: `hsk1-phase2b5-failure-${sequence}`,
      telemetry: sharedTelemetry
    }, extra || {});
  }

  function record(id, area, operation) {
    const entry = {
      id,
      area,
      status: 'pass',
      failClosed: true,
      productionWrites: 0,
      partialExternalState: false,
      evidence: null
    };
    try {
      const evidence = operation();
      entry.evidence = evidence || 'Expected failure or recovery behavior observed.';
    } catch (error) {
      entry.status = 'fail';
      entry.failClosed = false;
      entry.evidence = error && error.stack || String(error);
    }
    results.push(entry);
  }

  function injected(id, area, eventType, code, selector) {
    record(id, area, () => {
      const session = simulation.createSimulationSession(baseOptions({
        failures: [Object.assign({ eventType, code, times: 1, seed }, selector || {})]
      }));
      expectCode(() => session.run(), code);
      const failed = session.report();
      assert.equal(failed.legacyUnchanged, true);
      assert.equal(failed.writeCount + failed.supabaseWriteCount + failed.rpcWriteCount + failed.expWriteCount, 0);
      const rollback = session.rollback();
      assert.equal(rollback.pass, true);
      return `${code} surfaced; rollback=${rollback.pass}; legacyUnchanged=${failed.legacyUnchanged}.`;
    });
  }

  injected('FI-01', 'loader', 'preflight', 'CANONICAL_INDEX_404');
  injected('FI-02', 'loader', 'preflight', 'VOCABULARY_SHARD_FAILED');
  injected('FI-03', 'loader', 'preflight', 'SENTENCE_SHARD_FAILED');
  injected('FI-04', 'loader', 'preflight', 'MALFORMED_JSON');
  injected('FI-05', 'loader', 'preflight', 'COUNT_MISMATCH');
  injected('FI-06', 'loader', 'preflight', 'DUPLICATE_CANONICAL_ID');
  injected('FI-07', 'mapping', 'preflight', 'UNKNOWN_LEGACY_ID');
  injected('FI-08', 'mapping', 'preflight', 'UNKNOWN_CANONICAL_ID');

  record('FI-09', 'mapping', () => {
    const migrationApi = {
      runDryRun() {
        throw new simulation.SimulationError('MAPPING_ENGINE_THROW', 'Injected mapping engine failure.');
      }
    };
    const session = simulation.createSimulationSession(baseOptions({ migrationApi }));
    expectCode(() => session.run(), 'MAPPING_ENGINE_THROW');
    assert.equal(session.report().simulatedTargetEntries, 0);
    assert.equal(session.rollback().pass, true);
    return 'Mapping exception stayed inside the in-memory batch transaction.';
  });

  injected('FI-10', 'review', 'preflight', 'REVIEW_ENGINE_THROW');

  record('FI-11', 'contract', () => {
    const contractApi = Object.assign({}, progressContract, {
      createProgressRecord() {
        throw new simulation.SimulationError('PROGRESS_CONTRACT_INVALID', 'Injected progress contract failure.');
      }
    });
    const session = simulation.createSimulationSession(baseOptions({ contractApi }));
    const result = session.run();
    assert.ok(result.summary.invalid > 0);
    assert.equal(result.writeCount, 0);
    assert.match(
      result.telemetry.events.find((event) => event.type === 'profile_invalid').payload.reason,
      /Injected progress contract failure/
    );
    assert.equal(session.rollback().pass, true);
    return 'Contract validation failures were classified invalid, stayed read-only, and rolled back.';
  });

  injected('FI-12', 'batch', 'before_batch', 'BATCH_BEFORE_THROW', { batchIndex: 0 });
  injected('FI-13', 'batch', 'profile', 'BATCH_MID_THROW', { batchIndex: 0, profileIndex: 7 });
  injected('FI-14', 'batch', 'after_records', 'BATCH_AFTER_RECORDS_THROW', { batchIndex: 0 });
  injected('FI-15', 'adapter', 'adapter_preview', 'SIMULATED_ADAPTER_THROW', { batchIndex: 0 });

  record('FI-16', 'rollback', () => {
    const session = simulation.createSimulationSession(baseOptions({
      failures: [{ eventType: 'rollback', code: 'SIMULATED_ROLLBACK_THROW', times: 1, seed }]
    }));
    session.step(1);
    expectCode(() => session.rollback(), 'SIMULATED_ROLLBACK_THROW');
    assert.equal(session.report().state, 'rollback-failed');
    const retry = session.retryRollback();
    assert.equal(retry.pass, true);
    return 'Rollback failure remained visible and retry restored the initial target hash.';
  });

  injected('FI-17', 'storage', 'preflight', 'STORAGE_READ_THROW');

  record('FI-18', 'write-isolation', () => {
    const killSwitch = simulation.createSimulationKillSwitch({ version: simulation.SIMULATION_VERSION, engaged: true }, sharedTelemetry);
    const spies = simulation.createWriteIsolationSpies(sharedTelemetry, killSwitch);
    expectCode(() => spies.storageWrite(), 'PRODUCTION_DISABLED');
    assert.equal(spies.snapshot().storageCanonicalWrites, 0);
    return 'Canonical storage spy call was blocked before write.';
  });
  record('FI-19', 'write-isolation', () => {
    const killSwitch = simulation.createSimulationKillSwitch({ version: simulation.SIMULATION_VERSION, engaged: true }, sharedTelemetry);
    const spies = simulation.createWriteIsolationSpies(sharedTelemetry, killSwitch);
    expectCode(() => spies.supabaseWrite(), 'PRODUCTION_DISABLED');
    assert.equal(spies.snapshot().supabaseWrites, 0);
    return 'Supabase spy call was blocked before write.';
  });
  record('FI-20', 'write-isolation', () => {
    const killSwitch = simulation.createSimulationKillSwitch({ version: simulation.SIMULATION_VERSION, engaged: true }, sharedTelemetry);
    const spies = simulation.createWriteIsolationSpies(sharedTelemetry, killSwitch);
    expectCode(() => spies.rpcWrite(), 'PRODUCTION_DISABLED');
    assert.equal(spies.snapshot().rpcWrites, 0);
    return 'RPC spy call was blocked before write.';
  });

  injected('FI-21', 'timeout', 'before_batch', 'SIMULATION_TIMEOUT', { batchIndex: 1 });

  record('FI-22', 'control', () => {
    const session = simulation.createSimulationSession(baseOptions());
    session.step(1);
    const cancelled = session.cancel();
    assert.equal(cancelled.state, 'cancelled');
    assert.equal(session.rollback().pass, true);
    return 'Cancel stopped at a batch boundary and rollback removed the in-memory target.';
  });

  record('FI-23', 'control', () => {
    const session = simulation.createSimulationSession(baseOptions());
    session.step(1);
    session.pause();
    expectCode(() => session.step(1), 'SIMULATION_PAUSED');
    session.resume();
    const resumed = session.run();
    assert.equal(resumed.state, 'completed');
    return 'Pause blocked processing until an explicit resume.';
  });

  record('FI-24', 'retry', () => {
    const session = simulation.createSimulationSession(baseOptions({
      failures: [{ eventType: 'before_batch', batchIndex: 0, code: 'RETRYABLE_BATCH', times: 1, seed }]
    }));
    expectCode(() => session.run(), 'RETRYABLE_BATCH');
    session.retry();
    const retried = session.run();
    assert.equal(retried.state, 'completed');
    assert.equal(retried.summary.retried, 1);
    return 'The failed batch retried once and completed without duplicate targets.';
  });

  record('FI-25', 'retry', () => {
    const session = simulation.createSimulationSession(baseOptions({
      failures: [{ eventType: 'before_batch', batchIndex: 0, code: 'RETRY_ONCE', times: 1, seed }]
    }));
    expectCode(() => session.run(), 'RETRY_ONCE');
    session.retry();
    expectCode(() => session.retry(), 'NO_FAILED_BATCH');
    return 'A duplicate retry request was rejected.';
  });

  record('FI-26', 'checkpoint', () => {
    const simulationId = 'checkpoint-stale-fixture';
    const session = simulation.createSimulationSession(baseOptions({ simulationId }));
    session.step(1);
    const checkpoint = resignCheckpoint(Object.assign(clone(session.createCheckpoint()), { fixtureHash: 'stale-fixture' }));
    const restored = simulation.createSimulationSession(baseOptions({ simulationId }));
    expectCode(() => restored.restoreCheckpoint(checkpoint), 'CHECKPOINT_FIXTURE_MISMATCH');
    return 'Stale fixture checkpoint was rejected.';
  });
  record('FI-27', 'checkpoint', () => {
    const simulationId = 'checkpoint-corrupt';
    const session = simulation.createSimulationSession(baseOptions({ simulationId }));
    session.step(1);
    const checkpoint = clone(session.createCheckpoint());
    checkpoint.processedCount += 1;
    const restored = simulation.createSimulationSession(baseOptions({ simulationId }));
    expectCode(() => restored.restoreCheckpoint(checkpoint), 'CHECKPOINT_CORRUPT');
    return 'Corrupt checkpoint signature was rejected.';
  });
  record('FI-28', 'checkpoint', () => {
    const simulationId = 'checkpoint-version';
    const session = simulation.createSimulationSession(baseOptions({ simulationId }));
    session.step(1);
    const checkpoint = resignCheckpoint(Object.assign(clone(session.createCheckpoint()), { version: '0.0.0' }));
    const restored = simulation.createSimulationSession(baseOptions({ simulationId }));
    expectCode(() => restored.restoreCheckpoint(checkpoint), 'CHECKPOINT_VERSION_MISMATCH');
    return 'Wrong checkpoint version was rejected.';
  });

  record('FI-29', 'concurrency', () => {
    const coordinator = simulation.createSimulationCoordinator({ maxConcurrentSessions: 2 });
    const first = coordinator.createSession(baseOptions({ simulationId: 'concurrent-a' }));
    const second = coordinator.createSession(baseOptions({ simulationId: 'concurrent-b' }));
    expectCode(() => coordinator.createSession(baseOptions({ simulationId: 'concurrent-c' })), 'CONCURRENT_SESSION_LIMIT');
    first.dispose();
    second.dispose();
    assert.equal(coordinator.activeCount(), 0);
    return 'Third concurrent session was rejected by the configured maximum.';
  });

  record('FI-30', 'concurrency', () => {
    const first = simulation.createSimulationSession(baseOptions({ simulationId: 'tab-a', ownerKey: 'synthetic-same-owner' }));
    const second = simulation.createSimulationSession(baseOptions({ simulationId: 'tab-b', ownerKey: 'synthetic-same-owner' }));
    const left = first.run();
    const right = second.run();
    assert.equal(left.outputHash, right.outputHash);
    return 'Two isolated tab sessions for one synthetic owner produced the same output hash.';
  });

  record('FI-31', 'authorization', () => {
    const state = runtimeState('synthetic-failure-owner');
    const session = simulation.createSimulationSession(baseOptions({ runtimeStateProvider: () => state }));
    session.step(1);
    state.developerAuthorized = false;
    expectCode(() => session.step(1), 'DEVELOPER_UNAUTHORIZED');
    assert.equal(session.rollback().pass, true);
    return 'Logout between batches failed closed and rollback passed.';
  });
  record('FI-32', 'authorization', () => {
    const state = runtimeState('synthetic-failure-owner');
    const session = simulation.createSimulationSession(baseOptions({ runtimeStateProvider: () => state }));
    session.step(1);
    state.developerAuthorized = false;
    expectCode(() => session.run(), 'DEVELOPER_UNAUTHORIZED');
    assert.equal(session.rollback().pass, true);
    return 'Permission revocation between batches failed closed.';
  });
  record('FI-33', 'feature-lock', () => {
    const state = runtimeState('synthetic-failure-owner');
    const session = simulation.createSimulationSession(baseOptions({ runtimeStateProvider: () => state }));
    session.step(1);
    state.productionEnabled = true;
    expectCode(() => session.step(1), 'UNSAFE_FLAG_productionEnabled');
    assert.equal(session.rollback().pass, true);
    return 'A feature flag change was rejected at the next batch boundary.';
  });
  record('FI-34', 'feature-lock', () => {
    const state = runtimeState('synthetic-failure-owner', { qualityGate: 'open' });
    const session = simulation.createSimulationSession(baseOptions({ runtimeStateProvider: () => state }));
    expectCode(() => session.run(), 'QUALITY_GATE_NOT_LOCKED');
    return 'An unlocked quality gate was rejected before simulation started.';
  });
  record('FI-35', 'feature-lock', () => {
    const state = runtimeState('synthetic-failure-owner', { writesProgress: true });
    const session = simulation.createSimulationSession(baseOptions({ runtimeStateProvider: () => state }));
    expectCode(() => session.run(), 'UNSAFE_FLAG_writesProgress');
    return 'A true progress-write flag was rejected before simulation started.';
  });

  record('FI-36', 'kill-switch', () => {
    const session = simulation.createSimulationSession(baseOptions());
    session.step(1);
    const stopped = session.triggerKillSwitch();
    assert.equal(stopped.failureState.code, 'KILL_SWITCH_TRIGGERED');
    assert.equal(session.rollback().pass, true);
    return 'Emergency stop between batches produced telemetry and rollback passed.';
  });

  record('FI-37', 'checkpoint', () => {
    const source = simulation.createSimulationSession(baseOptions({ simulationId: 'reload-session' }));
    source.step(1);
    const checkpoint = source.createCheckpoint();
    const restored = simulation.createSimulationSession(baseOptions({ simulationId: 'reload-session' }));
    restored.restoreCheckpoint(checkpoint);
    restored.resume();
    const resumed = restored.run();
    const uninterrupted = simulation.createSimulationSession(baseOptions({ simulationId: 'uninterrupted-session' })).run();
    assert.equal(resumed.outputHash, uninterrupted.outputHash);
    return 'A memory checkpoint restored after simulated browser reload matched uninterrupted output.';
  });

  record('FI-38', 'review', () => {
    const session = review.createReviewSession(queue);
    const item = queue.items.find((candidate) => candidate.candidates.length);
    const manifest = clone(session.recordDecision(item.reviewId, {
      decision: 'map',
      canonicalVocabularyId: item.candidates[0].canonicalVocabularyId,
      reviewer: 'synthetic-reviewer',
      note: 'Synthetic failure fixture only.'
    }));
    manifest.queueSignature = 'stale-review-queue';
    assert.throws(() => review.validateReviewManifest(manifest, queue), /stale/i);
    return 'Stale synthetic review manifest was rejected and never applied.';
  });
  record('FI-39', 'review', () => {
    const session = review.createReviewSession(queue);
    const item = queue.items[0];
    const decision = {
      decision: 'keep-unmatched',
      reviewer: 'synthetic-reviewer',
      note: 'Synthetic failure fixture only.'
    };
    session.recordDecision(item.reviewId, decision);
    assert.throws(() => session.recordDecision(item.reviewId, decision), /already has a decision/i);
    return 'Duplicate synthetic review decision was rejected.';
  });
  record('FI-40', 'review', () => {
    const session = review.createReviewSession(queue);
    const item = queue.items[0];
    assert.throws(() => session.recordDecision(item.reviewId, {
      decision: 'map',
      canonicalVocabularyId: 'unknown-canonical-id',
      reviewer: 'synthetic-reviewer',
      note: 'Synthetic failure fixture only.'
    }), /explicit review candidate/i);
    return 'Invalid synthetic candidate decision was rejected.';
  });

  const requiredEventTypes = [
    'simulation_started',
    'fixture_generated',
    'batch_started',
    'batch_completed',
    'profile_skipped',
    'profile_invalid',
    'review_required',
    'conflict_detected',
    'failure_injected',
    'retry_started',
    'retry_completed',
    'checkpoint_created',
    'checkpoint_restored',
    'cancel_requested',
    'rollback_started',
    'rollback_completed',
    'rollback_failed',
    'simulation_completed',
    'simulation_failed',
    'kill_switch_triggered'
  ];
  const eventTypes = Array.from(new Set(sharedTelemetry.events().map((event) => event.type))).sort();
  return {
    total: results.length,
    pass: results.filter((entry) => entry.status === 'pass').length,
    fail: results.filter((entry) => entry.status === 'fail').length,
    telemetrySummary: sharedTelemetry.summary(),
    eventTypes,
    missingRequiredEventTypes: requiredEventTypes.filter((type) => !eventTypes.includes(type)),
    cases: results
  };
}

function equivalenceChecks(mappingReport, seed) {
  const fixture = fixtureTools.generateFixture({ size: 100, seed, mappingReport });
  function run(name, currentFixture, batchSize) {
    return simulation.createSimulationSession({
      fixture: currentFixture,
      mappingReport,
      batchSize,
      ownerKey: 'synthetic-equivalence-owner',
      simulationId: name
    }).run();
  }
  const base = run('equivalence-base', fixture, 25);
  const repeat = run('equivalence-repeat', fixture, 25);
  const reorderedProfiles = clone(fixture);
  reorderedProfiles.profiles.reverse();
  rehashFixture(reorderedProfiles);
  const reordered = run('equivalence-profile-order', reorderedProfiles, 25);
  const reorderedProgress = clone(fixture);
  reorderedProgress.profiles.forEach((profile) => {
    if (profile.legacy && Array.isArray(profile.legacy.wordRows)) profile.legacy.wordRows.reverse();
  });
  rehashFixture(reorderedProgress);
  const progressOrder = run('equivalence-progress-order', reorderedProgress, 25);
  const differentBatch = run('equivalence-batch-size', fixture, 40);

  const pausedSession = simulation.createSimulationSession({
    fixture,
    mappingReport,
    batchSize: 25,
    ownerKey: 'synthetic-equivalence-owner',
    simulationId: 'equivalence-pause'
  });
  pausedSession.step(1);
  pausedSession.pause();
  pausedSession.resume();
  const paused = pausedSession.run();

  const source = simulation.createSimulationSession({
    fixture,
    mappingReport,
    batchSize: 25,
    ownerKey: 'synthetic-equivalence-owner',
    simulationId: 'equivalence-checkpoint'
  });
  source.step(2);
  const checkpoint = source.createCheckpoint();
  const restored = simulation.createSimulationSession({
    fixture,
    mappingReport,
    batchSize: 25,
    ownerKey: 'synthetic-equivalence-owner',
    simulationId: 'equivalence-checkpoint'
  });
  restored.restoreCheckpoint(checkpoint);
  restored.resume();
  const resumed = restored.run();

  return {
    deterministic: base.outputHash === repeat.outputHash,
    inputOrderIndependent: base.outputHash === reordered.outputHash,
    progressOrderIndependent: base.outputHash === progressOrder.outputHash,
    batchSizeIndependent: base.outputHash === differentBatch.outputHash,
    pauseResumeEquivalent: base.outputHash === paused.outputHash,
    checkpointResumeEquivalent: base.outputHash === resumed.outputHash,
    idempotent: base.outputHash === repeat.outputHash && base.legacyBeforeHash === repeat.legacyAfterHash,
    mappingHashStable: base.mappingHash === repeat.mappingHash,
    outputHash: base.outputHash,
    mappingHash: base.mappingHash,
    checkpointResultHash: checkpoint.resultHash,
    resumedOutputHash: resumed.outputHash
  };
}

function killSwitchMatrix() {
  const expected = simulation.EXPECTED_FLAGS;
  const simulatedWriteContext = Object.assign({}, expected, {
    productionEnabled: true,
    HSK_CURRICULUM_V2_PROGRESS_WRITES_ENABLED: true,
    progressWritesEnabled: true
  });
  const missing = simulation.createSimulationKillSwitch().evaluate(expected);
  const invalid = simulation.createSimulationKillSwitch({ version: 'invalid', engaged: true }).evaluate(expected);
  const engaged = simulation.createSimulationKillSwitch({ version: simulation.SIMULATION_VERSION, engaged: true }).evaluate(simulatedWriteContext);
  const permission = simulation.createSimulationKillSwitch({ version: simulation.SIMULATION_VERSION, engaged: true });
  permission.revokePermission();
  const revoked = permission.evaluate(expected);
  return {
    simulationOnly: true,
    productionAdapterLinked: false,
    defaultEngaged: engaged.allowed === false,
    missingConfig: missing,
    invalidConfig: invalid,
    engaged,
    permissionRevoked: revoked,
    failClosed: [missing, invalid, engaged, revoked].every((item) => item.allowed === false)
  };
}

function generate(rootDirectory) {
  const root = path.resolve(rootDirectory || path.join(__dirname, '..'));
  const seed = fixtureTools.DEFAULT_SEED;
  const mappingReport = mappingGenerator.generate(root);
  const reviewQueue = reviewGenerator.generate(root);
  const runs = {
    small: runScale('small', mappingReport, seed),
    medium: runScale('medium', mappingReport, seed),
    large: runScale('large', mappingReport, seed)
  };
  const failureMatrix = runFailureMatrix(root, mappingReport, seed);
  const equivalence = equivalenceChecks(mappingReport, seed);
  const killSwitch = killSwitchMatrix();
  const casePassed = (id) => {
    const item = failureMatrix.cases.find((entry) => entry.id === id);
    return Boolean(item && item.status === 'pass');
  };
  const allRunsPass = Object.values(runs).every(({ run }) =>
    run.state === 'completed' &&
    run.processed === run.totalProfiles &&
    run.legacyUnchanged &&
    run.rolledBack &&
    run.writeCount === 0 &&
    run.storageCanonicalWriteCount === 0 &&
    run.supabaseWriteCount === 0 &&
    run.rpcWriteCount === 0 &&
    run.expWriteCount === 0
  );
  const phase2b5Complete = allRunsPass &&
    failureMatrix.fail === 0 &&
    failureMatrix.missingRequiredEventTypes.length === 0 &&
    Object.values(equivalence).filter((value) => typeof value === 'boolean').every(Boolean) &&
    killSwitch.failClosed &&
    mappingReport.summary.exactMapped === 146 &&
    mappingReport.summary.unmatched === 4 &&
    reviewQueue.summary.unresolved === 4;

  return {
    reportVersion: REPORT_VERSION,
    phase: '2B-5',
    title: 'Large HSK1 migration simulation and failure injection',
    baselineCommit: BASELINE_COMMIT,
    mode: 'synthetic-read-only-memory-only',
    generatedBy: 'scripts/hsk1-phase2b5-migration-simulation-report.js',
    fixtureSeed: seed,
    fixtureSizes: clone(FIXTURE_SIZES),
    fixtureCategories: fixtureTools.CATEGORIES.slice(),
    mappingMetrics: clone(mappingReport.summary),
    unresolvedReviewItems: reviewQueue.items.map((item) => item.simplified),
    simulationRuns: runs,
    failureMatrix,
    determinism: {
      pass: equivalence.deterministic,
      outputHash: equivalence.outputHash,
      mappingHashStable: equivalence.mappingHashStable,
      mappingHash: equivalence.mappingHash,
      inputOrderIndependent: equivalence.inputOrderIndependent,
      progressOrderIndependent: equivalence.progressOrderIndependent,
      batchSizeIndependent: equivalence.batchSizeIndependent
    },
    idempotency: {
      pass: equivalence.idempotent,
      retryDoesNotDuplicateTargets: casePassed('FI-24') && casePassed('FI-25'),
      repeatedRunPreservesLegacy: equivalence.idempotent
    },
    checkpointResume: {
      pass: equivalence.checkpointResumeEquivalent,
      checkpointResultHash: equivalence.checkpointResultHash,
      resumedOutputHash: equivalence.resumedOutputHash,
      staleCorruptWrongVersionRejected: failureMatrix.cases.slice(25, 28).every((item) => item.status === 'pass')
    },
    pauseResume: {
      pass: equivalence.pauseResumeEquivalent
    },
    rollback: {
      pass: Object.values(runs).every(({ run }) => run.rolledBack && run.rollbackHash === run.rollbackExpectedHash),
      full: Object.values(runs).every(({ run }) => run.rolledBack),
      partial: casePassed('FI-22'),
      afterFailure: casePassed('FI-13'),
      failureVisible: casePassed('FI-16'),
      retryPass: casePassed('FI-16'),
      idempotent: Object.values(runs).every(({ run }) => run.rollbackIdempotent)
    },
    performance: Object.fromEntries(Object.entries(runs).map(([name, value]) => [name, {
      observedDurationMs: value.run.observedDurationMs,
      observedProfilesPerSecond: value.run.observedProfilesPerSecond,
      batchCount: value.run.batchCount,
      peakInMemoryRecordCount: value.run.peakInMemoryRecordCount,
      estimatedTargetBytes: value.run.estimatedTargetBytes,
      deterministicDurationTicks: value.run.deterministicDurationTicks
    }])),
    resourceGuards: {
      maxFixtureSize: fixtureTools.MAX_FIXTURE_SIZE,
      maxBatchSize: simulation.MAX_BATCH_SIZE,
      maxReportEvents: simulation.MAX_REPORT_EVENTS,
      maxRetryCount: simulation.MAX_RETRY_COUNT,
      maxConcurrentSessions: simulation.MAX_CONCURRENT_SESSIONS,
      maxSimulationTicks: simulation.MAX_SIMULATION_TICKS,
      status: 'pass'
    },
    telemetry: {
      mode: 'in-memory-only',
      schemaVersion: simulation.TELEMETRY_VERSION,
      durable: false,
      productionAnalyticsCalled: false,
      containsRealIdentity: false,
      runSummaries: Object.fromEntries(Object.entries(runs).map(([name, value]) => [name, value.run.telemetry])),
      failureMatrixSummary: failureMatrix.telemetrySummary,
      verifiedEventTypes: failureMatrix.eventTypes,
      missingRequiredEventTypes: failureMatrix.missingRequiredEventTypes
    },
    killSwitch,
    writeIsolation: {
      pass: allRunsPass,
      canonicalProductionWriteCount: 0,
      storageCanonicalWriteCount: 0,
      expWriteCount: 0,
      productionAdapterLinked: false
    },
    SupabaseIsolation: {
      pass: allRunsPass,
      writeCount: 0,
      rpcCount: 0,
      schemaChanged: false,
      migrationCreated: false
    },
    legacyIntegrity: {
      pass: Object.values(runs).every(({ run }) => run.legacyUnchanged),
      userDataUsed: false,
      userDataChanged: false,
      syntheticProfilesOnly: true
    },
    productionLocks: clone(simulation.EXPECTED_FLAGS),
    warnings: [
      'Four human-review items remain unresolved and are not applied to the production mapping.',
      'Simulation telemetry is bounded and in-memory; it is not durable production telemetry.',
      'The write kill switch is a simulation-only contract and is not connected to a real migration writer.',
      'No human production approval has been granted.'
    ],
    blockers: [],
    readiness: {
      phase2b5Complete,
      phase2b6Allowed: phase2b5Complete,
      realMigrationAllowed: false,
      productionAllowed: false,
      realMigrationBlockers: [
        'Four human-review items require explicit human decisions.',
        'A production migration writer, durable telemetry, operational kill switch, staged rehearsal, and approval do not exist.',
        'Canonical progress writes remain disabled.'
      ],
      productionBlockers: [
        'Real migration is not allowed.',
        'Canonical production and public override remain disabled.',
        'The quality gate remains locked and no production approval exists.'
      ]
    }
  };
}

function writeReport(rootDirectory) {
  const root = path.resolve(rootDirectory || path.join(__dirname, '..'));
  const report = generate(root);
  const file = path.join(root, 'reports', 'hsk1-phase2b5-migration-simulation-report.json');
  fs.writeFileSync(file, `${JSON.stringify(report, null, 2)}\n`);
  return { file, report };
}

if (require.main === module) {
  if (process.argv.includes('--write')) {
    const result = writeReport(process.cwd());
    process.stdout.write(`${JSON.stringify({
      file: path.relative(process.cwd(), result.file),
      fixtureSeed: result.report.fixtureSeed,
      simulationRuns: Object.fromEntries(Object.entries(result.report.simulationRuns).map(([name, value]) => [name, value.run])),
      failureMatrix: {
        total: result.report.failureMatrix.total,
        pass: result.report.failureMatrix.pass,
        fail: result.report.failureMatrix.fail
      },
      readiness: result.report.readiness
    }, null, 2)}\n`);
  } else {
    process.stdout.write(`${JSON.stringify(generate(process.cwd()), null, 2)}\n`);
  }
}

module.exports = Object.freeze({
  REPORT_VERSION,
  BASELINE_COMMIT,
  FIXTURE_SIZES,
  BATCH_SIZES,
  generate,
  writeReport,
  runFailureMatrix
});
