'use strict';

const fixtureTools = require('./hsk1-migration-fixture');
const migration = require('../assets/hsk-content/hsk-progress-migration');
const contract = require('../assets/hsk-content/hsk-progress-contract');

const SIMULATION_VERSION = '1.0.0';
const CHECKPOINT_VERSION = '1.0.0';
const TELEMETRY_VERSION = '1.0.0';
const DEFAULT_BATCH_SIZE = 100;
const MAX_BATCH_SIZE = 1000;
const MAX_REPORT_EVENTS = 2048;
const MAX_RETRY_COUNT = 3;
const MAX_CONCURRENT_SESSIONS = 2;
const MAX_SIMULATION_TICKS = 200000;
const SYNTHETIC_CLOCK_START = fixtureTools.BASE_TIME;

const EXPECTED_FLAGS = Object.freeze({
  HSK_CURRICULUM_V2_ENABLED: false,
  productionEnabled: false,
  publicOverrideAllowed: false,
  HSK_CURRICULUM_V2_PROGRESS_WRITES_ENABLED: false,
  writesProgress: false,
  qualityGate: 'locked'
});

class SimulationError extends Error {
  constructor(code, message, detail) {
    super(message);
    this.name = 'SimulationError';
    this.code = code;
    this.detail = detail || null;
  }
}

function copy(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function text(value) {
  return String(value == null ? '' : value).trim();
}

function sortedEntries(target) {
  return Array.from(target.values()).sort((left, right) => left.profileId.localeCompare(right.profileId));
}

function targetHash(target) {
  return fixtureTools.hash(sortedEntries(target));
}

function sanitizeTelemetry(value) {
  if (Array.isArray(value)) return value.map(sanitizeTelemetry);
  if (value && typeof value === 'object') {
    const output = {};
    Object.keys(value).sort().forEach((key) => {
      if (/email|userId|realUser/i.test(key)) return;
      output[key] = sanitizeTelemetry(value[key]);
    });
    return output;
  }
  if (typeof value === 'string' && value.includes('@')) return '[redacted]';
  return value;
}

function createTelemetry(options) {
  options = options || {};
  const maxEvents = Math.max(1, Math.min(Number(options.maxEvents) || MAX_REPORT_EVENTS, MAX_REPORT_EVENTS));
  const events = [];
  const summary = {
    emitted: 0,
    stored: 0,
    dropped: 0,
    errorCount: 0,
    warningCount: 0,
    retryCount: 0,
    rollbackCount: 0,
    blockedWriteCount: 0,
    suppressedProductionCallCount: 0
  };
  let sequence = 0;

  function emit(type, payload, level) {
    sequence += 1;
    summary.emitted += 1;
    if (level === 'error') summary.errorCount += 1;
    if (level === 'warning') summary.warningCount += 1;
    if (type === 'retry_started') summary.retryCount += 1;
    if (type === 'rollback_completed' || type === 'rollback_failed') summary.rollbackCount += 1;
    if (type === 'write_blocked') summary.blockedWriteCount += 1;
    if (type === 'production_call_suppressed') summary.suppressedProductionCallCount += 1;
    const event = {
      schemaVersion: TELEMETRY_VERSION,
      sequence,
      timestamp: SYNTHETIC_CLOCK_START + sequence,
      type,
      level: level || 'info',
      payload: sanitizeTelemetry(payload || {})
    };
    if (events.length < maxEvents) events.push(event);
    else summary.dropped += 1;
    summary.stored = events.length;
    return event;
  }

  return Object.freeze({
    emit,
    events: () => copy(events),
    summary: () => copy(summary),
    sequence: () => sequence,
    maxEvents
  });
}

function createSimulationKillSwitch(config, telemetry) {
  const supplied = arguments.length > 0 && config !== undefined;
  const state = {
    version: config && config.version || null,
    engaged: config && typeof config.engaged === 'boolean' ? config.engaged : true,
    emergencyStop: false,
    permissionRevoked: false
  };

  function reason(context) {
    context = context || {};
    if (!supplied || config == null) return 'KILL_SWITCH_CONFIG_MISSING';
    if (state.version !== SIMULATION_VERSION) return 'KILL_SWITCH_CONFIG_INVALID';
    if (state.permissionRevoked || context.developerAuthorized === false) return 'PERMISSION_REVOKED';
    if (state.emergencyStop) return 'EMERGENCY_STOP';
    if (context.qualityGate !== 'locked') return 'QUALITY_GATE_NOT_LOCKED';
    if (context.productionEnabled !== true) return 'PRODUCTION_DISABLED';
    if (context.progressWritesEnabled !== true) return 'PROGRESS_WRITES_DISABLED';
    if (state.engaged) return 'KILL_SWITCH_ENGAGED';
    return 'SIMULATION_ONLY_NO_PRODUCTION_ADAPTER';
  }

  function assertWriteBlocked(context) {
    const reasonCode = reason(context);
    if (telemetry) {
      telemetry.emit('write_blocked', { reasonCode }, 'warning');
      telemetry.emit('production_call_suppressed', { reasonCode }, 'warning');
    }
    throw new SimulationError(reasonCode, `Simulation kill switch blocked a write: ${reasonCode}.`);
  }

  return Object.freeze({
    isEngaged: () => state.engaged || state.emergencyStop,
    evaluate: (context) => Object.freeze({ allowed: false, reasonCode: reason(context) }),
    assertWriteBlocked,
    engageEmergencyStop() {
      state.emergencyStop = true;
      if (telemetry) telemetry.emit('kill_switch_triggered', { reasonCode: 'EMERGENCY_STOP' }, 'error');
    },
    revokePermission() {
      state.permissionRevoked = true;
    },
    snapshot: () => copy(state)
  });
}

function createWriteIsolationSpies(telemetry, killSwitch) {
  const counts = {
    canonicalProductionWrites: 0,
    storageCanonicalWrites: 0,
    supabaseWrites: 0,
    rpcWrites: 0,
    expWrites: 0,
    simulatedPreviewCaptures: 0,
    blockedAttempts: 0
  };

  function blocked(kind) {
    counts.blockedAttempts += 1;
    if (telemetry) telemetry.emit('production_call_suppressed', { kind }, 'warning');
    return killSwitch.assertWriteBlocked(EXPECTED_FLAGS);
  }

  return Object.freeze({
    capturePreview() {
      counts.simulatedPreviewCaptures += 1;
    },
    canonicalWrite() { return blocked('canonical-production-write'); },
    storageWrite() { return blocked('canonical-storage-write'); },
    supabaseWrite() { return blocked('supabase-write'); },
    rpcWrite() { return blocked('rpc-write'); },
    expWrite() { return blocked('exp-write'); },
    snapshot: () => copy(counts)
  });
}

function createFailureInjector(specifications, seed) {
  const specs = (Array.isArray(specifications) ? specifications : specifications ? [specifications] : []).map((spec, index) => ({
    id: text(spec.id) || `failure-${index + 1}`,
    eventType: text(spec.eventType) || 'profile',
    code: text(spec.code) || 'INJECTED_FAILURE',
    profileIndex: spec.profileIndex == null ? null : Number(spec.profileIndex),
    batchIndex: spec.batchIndex == null ? null : Number(spec.batchIndex),
    times: Math.max(1, Number(spec.times) || 1),
    consumed: 0,
    seed: spec.seed == null ? Number(seed || fixtureTools.DEFAULT_SEED) : Number(spec.seed),
    message: text(spec.message) || null
  }));

  function maybeInject(context) {
    context = context || {};
    const match = specs.find((spec) => {
      if (spec.consumed >= spec.times || spec.eventType !== context.eventType) return false;
      if (spec.profileIndex != null && spec.profileIndex !== context.profileIndex) return false;
      if (spec.batchIndex != null && spec.batchIndex !== context.batchIndex) return false;
      return true;
    });
    if (!match) return null;
    match.consumed += 1;
    throw new SimulationError(match.code, match.message || `Injected ${match.code} at ${match.eventType}.`, {
      failureId: match.id,
      eventType: match.eventType,
      profileIndex: context.profileIndex == null ? null : context.profileIndex,
      batchIndex: context.batchIndex == null ? null : context.batchIndex,
      seed: match.seed,
      occurrence: match.consumed
    });
  }

  return Object.freeze({
    maybeInject,
    reset(code) {
      specs.forEach((spec) => {
        if (!code || spec.code === code) spec.consumed = 0;
      });
    },
    snapshot: () => specs.map((spec) => copy(spec))
  });
}

function validateFlags(flags) {
  const actual = flags || {};
  Object.keys(EXPECTED_FLAGS).forEach((key) => {
    if (actual[key] !== EXPECTED_FLAGS[key]) {
      throw new SimulationError(
        key === 'qualityGate' ? 'QUALITY_GATE_NOT_LOCKED' : `UNSAFE_FLAG_${key}`,
        `Simulation refused unsafe runtime flag ${key}=${String(actual[key])}.`
      );
    }
  });
}

function validateProfile(profile) {
  if (!profile || typeof profile !== 'object') return { valid: false, reason: 'profile-not-object' };
  if (!/^synthetic-hsk1-\d{6}$/.test(text(profile.profileId))) return { valid: false, reason: 'invalid-synthetic-profile-id' };
  if (profile.ownerKey !== profile.profileId) return { valid: false, reason: 'owner-mismatch' };
  if (profile.legacy == null) return { valid: true, skipped: true, reason: 'no-hsk1-progress' };
  if (typeof profile.legacy !== 'object' || Array.isArray(profile.legacy)) return { valid: false, reason: 'legacy-not-object' };
  if (!Array.isArray(profile.legacy.wordRows)) return { valid: false, reason: 'word-rows-not-array' };
  for (const row of profile.legacy.wordRows) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return { valid: false, reason: 'invalid-progress-record' };
    if (Object.prototype.hasOwnProperty.call(row, 'word_key') && !text(row.word_key)) return { valid: false, reason: 'invalid-legacy-id' };
  }
  const hasWordProgress = profile.legacy.wordRows.some((row) => row.is_known === true || row.is_saved === true);
  const hasCompletion = profile.legacy.completed && Object.keys(profile.legacy.completed).some((id) => profile.legacy.completed[id]);
  if (!hasWordProgress && !hasCompletion) return { valid: true, skipped: true, reason: 'no-migratable-hsk1-progress' };
  return { valid: true, skipped: false, reason: null };
}

function profilePreview(profile, mappingReport, migrationApi, contractApi) {
  const validation = validateProfile(profile);
  if (!validation.valid) {
    return {
      profileId: profile && text(profile.profileId) || 'synthetic-invalid',
      status: 'invalid',
      invalidReason: validation.reason,
      recordCount: 0,
      recordHash: fixtureTools.hash([]),
      reviewRequired: false,
      unmatched: 0,
      conflicts: 0,
      duplicateTargets: 0
    };
  }
  if (validation.skipped) {
    return {
      profileId: profile.profileId,
      status: 'skipped',
      skipReason: validation.reason,
      recordCount: 0,
      recordHash: fixtureTools.hash([]),
      reviewRequired: false,
      unmatched: 0,
      conflicts: 0,
      duplicateTargets: 0
    };
  }
  const dryRun = migrationApi.runDryRun({
    mappingReport,
    wordRows: profile.legacy.wordRows,
    completed: profile.legacy.completed,
    ownerKey: profile.ownerKey,
    contractApi
  });
  const unmatched = dryRun.skipped.filter((item) => item.reason === 'unmatched-progress-source').length;
  const conflicts = dryRun.conflicts.length;
  const invalid = dryRun.invalidRecords.length;
  const reviewRequired = unmatched > 0 || conflicts > 0 || invalid > 0;
  return {
    profileId: profile.profileId,
    status: invalid ? 'invalid' : conflicts ? 'conflict' : reviewRequired ? 'review-required' : 'succeeded',
    recordCount: dryRun.previewRecords.length,
    recordHash: fixtureTools.hash(dryRun.previewRecords),
    deterministicSignature: dryRun.deterministicSignature,
    reviewRequired,
    unmatched,
    conflicts,
    invalidReason: invalid ? dryRun.invalidRecords.map((item) => item.error).join('; ') : null,
    duplicateTargets: dryRun.mappingSummary.duplicateTargets,
    staleCanonicalIgnored: Boolean(profile.legacy.canonicalLikeStale),
    outsideHskIgnored: Boolean(profile.legacy.outsideHsk)
  };
}

function emptyMetrics(totalProfiles) {
  return {
    totalProfiles,
    processed: 0,
    succeeded: 0,
    skipped: 0,
    reviewRequired: 0,
    unmatched: 0,
    invalid: 0,
    conflicts: 0,
    duplicateTargets: 0,
    failed: 0,
    retried: 0,
    rolledBack: 0,
    batchCount: 0,
    peakInMemoryRecordCount: 0
  };
}

function applyOutcome(metrics, outcome) {
  metrics.processed += 1;
  if (outcome.status === 'skipped') metrics.skipped += 1;
  else if (outcome.status === 'invalid') metrics.invalid += 1;
  else metrics.succeeded += 1;
  if (outcome.reviewRequired) metrics.reviewRequired += 1;
  metrics.unmatched += Number(outcome.unmatched || 0);
  if (outcome.status === 'conflict') metrics.conflicts += 1;
  metrics.duplicateTargets = Math.max(metrics.duplicateTargets, Number(outcome.duplicateTargets || 0));
}

function createSimulationSession(options) {
  options = options || {};
  const fixture = options.fixture;
  const mappingReport = options.mappingReport;
  const migrationApi = options.migrationApi || migration;
  const contractApi = options.contractApi || contract;
  const batchSize = Number(options.batchSize || DEFAULT_BATCH_SIZE);
  const maxRetries = Math.max(0, Math.min(Number(options.maxRetries == null ? MAX_RETRY_COUNT : options.maxRetries), MAX_RETRY_COUNT));
  const runtimeStateProvider = options.runtimeStateProvider || (() => Object.assign({
    developerAuthorized: true,
    ownerKey: options.ownerKey || 'synthetic-simulation-owner'
  }, EXPECTED_FLAGS));
  const simulationId = text(options.simulationId) || `hsk1-sim-${fixture && fixture.seed}-${fixture && fixture.size}`;
  const ownerKey = text(options.ownerKey) || 'synthetic-simulation-owner';
  const telemetry = options.telemetry || createTelemetry({ maxEvents: options.maxEvents });
  const killSwitch = options.killSwitch || createSimulationKillSwitch({
    version: SIMULATION_VERSION,
    engaged: true
  }, telemetry);
  const spies = options.spies || createWriteIsolationSpies(telemetry, killSwitch);
  const injector = options.failureInjector || createFailureInjector(options.failures, fixture && fixture.seed);

  if (!fixture || !Array.isArray(fixture.profiles) || !Number.isInteger(fixture.size)) {
    throw new SimulationError('MALFORMED_FIXTURE', 'Simulation fixture is malformed.');
  }
  if (fixture.size !== fixture.profiles.length) throw new SimulationError('FIXTURE_SIZE_MISMATCH', 'Fixture size does not match profile count.');
  if (fixture.size > fixtureTools.MAX_FIXTURE_SIZE) throw new SimulationError('MAX_FIXTURE_SIZE', 'Fixture exceeds the maximum simulation size.');
  const computedFixtureHash = fixtureTools.hashFixture(fixture);
  if (fixture.fixtureHash && fixture.fixtureHash !== computedFixtureHash) {
    throw new SimulationError('FIXTURE_HASH_MISMATCH', 'Fixture content does not match its deterministic hash.');
  }
  if (!Number.isInteger(batchSize) || batchSize <= 0 || batchSize > MAX_BATCH_SIZE) {
    throw new SimulationError('INVALID_BATCH_SIZE', `Batch size must be between 1 and ${MAX_BATCH_SIZE}.`);
  }
  if (!mappingReport || !Array.isArray(mappingReport.mappings) || !mappingReport.summary) {
    throw new SimulationError('MAPPING_REPORT_INVALID', 'Simulation requires a valid deterministic mapping report.');
  }

  const profiles = fixture.profiles.slice().sort((left, right) => text(left && left.profileId).localeCompare(text(right && right.profileId)));
  const fixtureHash = computedFixtureHash;
  const mappingHash = fixtureTools.hash(mappingReport);
  const legacyBeforeHash = fixtureTools.hash(fixture.profiles);
  const initialTarget = new Map();
  const target = new Map(initialTarget);
  const initialTargetHash = targetHash(target);
  const metrics = emptyMetrics(profiles.length);
  let state = 'ready';
  let nextProfileIndex = 0;
  let failedBatchIndex = null;
  let failureState = null;
  let retryCount = 0;
  let completionReported = false;
  let rollbackResult = null;
  let rollbackFailed = false;
  let preflightComplete = false;
  let emergencyStopped = false;

  function runtimeState() {
    const current = runtimeStateProvider() || {};
    if (current.developerAuthorized !== true) throw new SimulationError('DEVELOPER_UNAUTHORIZED', 'Simulation requires a verified developer session.');
    if (text(current.ownerKey) !== ownerKey) throw new SimulationError('SIMULATION_OWNER_MISMATCH', 'Simulation owner/session changed.');
    validateFlags(current);
    if (emergencyStopped) throw new SimulationError('KILL_SWITCH_TRIGGERED', 'Simulation emergency stop is engaged.');
    return current;
  }

  function inject(eventType, detail) {
    const context = Object.assign({ eventType }, detail || {});
    try {
      return injector.maybeInject(context);
    } catch (error) {
      telemetry.emit('failure_injected', {
        code: error.code || 'INJECTED_FAILURE',
        eventType,
        batchIndex: context.batchIndex == null ? null : context.batchIndex,
        profileIndex: context.profileIndex == null ? null : context.profileIndex
      }, 'error');
      throw error;
    }
  }

  function preflight() {
    if (preflightComplete) return;
    runtimeState();
    inject('preflight', { batchIndex: 0, profileIndex: 0 });
    telemetry.emit('simulation_started', {
      simulationId,
      fixtureSeed: fixture.seed,
      fixtureHash,
      mappingHash,
      batchSize
    });
    telemetry.emit('fixture_generated', {
      fixtureSeed: fixture.seed,
      fixtureHash,
      totalProfiles: profiles.length,
      syntheticOnly: true
    });
    preflightComplete = true;
  }

  function processBatch(batchIndex) {
    runtimeState();
    const start = batchIndex * batchSize;
    const end = Math.min(start + batchSize, profiles.length);
    const batch = profiles.slice(start, end);
    if (!batch.length) return false;
    telemetry.emit('batch_started', { batchIndex, start, end, size: batch.length });
    inject('before_batch', { batchIndex, profileIndex: start });
    const outcomes = [];

    for (let offset = 0; offset < batch.length; offset += 1) {
      const profileIndex = start + offset;
      inject('profile', { batchIndex, profileIndex });
      const outcome = profilePreview(batch[offset], mappingReport, migrationApi, contractApi);
      outcomes.push(outcome);
      if (outcome.status === 'skipped') telemetry.emit('profile_skipped', { profileId: outcome.profileId, reason: outcome.skipReason }, 'warning');
      if (outcome.status === 'invalid') telemetry.emit('profile_invalid', { profileId: outcome.profileId, reason: outcome.invalidReason }, 'warning');
      if (outcome.reviewRequired) telemetry.emit('review_required', { profileId: outcome.profileId, unmatched: outcome.unmatched }, 'warning');
      if (outcome.conflicts) telemetry.emit('conflict_detected', { profileId: outcome.profileId, conflicts: outcome.conflicts }, 'warning');
      inject('after_profile', { batchIndex, profileIndex });
    }

    inject('after_records', { batchIndex, profileIndex: end - 1 });
    inject('adapter_preview', { batchIndex, profileIndex: end - 1 });
    inject('after_batch', { batchIndex, profileIndex: end - 1 });
    outcomes.forEach((outcome) => {
      if (target.has(outcome.profileId)) throw new SimulationError('DUPLICATE_SIMULATED_TARGET', `Duplicate simulated target for ${outcome.profileId}.`);
      target.set(outcome.profileId, outcome);
      applyOutcome(metrics, outcome);
      spies.capturePreview();
    });
    nextProfileIndex = end;
    metrics.batchCount += 1;
    const currentRecords = sortedEntries(target).reduce((total, item) => total + 1 + Number(item.recordCount || 0), 0);
    metrics.peakInMemoryRecordCount = Math.max(metrics.peakInMemoryRecordCount, currentRecords + outcomes.length);
    telemetry.emit('batch_completed', {
      batchIndex,
      processed: metrics.processed,
      targetHash: targetHash(target)
    });
    return true;
  }

  function fail(error, batchIndex) {
    failureState = {
      code: error && error.code || 'SIMULATION_FAILURE',
      message: error && error.message || String(error),
      batchIndex,
      detail: copy(error && error.detail || null)
    };
    failedBatchIndex = batchIndex;
    metrics.failed = Math.min(batchSize, profiles.length - (batchIndex * batchSize));
    state = 'failed';
    telemetry.emit('simulation_failed', failureState, 'error');
  }

  function finish() {
    if (completionReported) return;
    state = 'completed';
    metrics.failed = 0;
    completionReported = true;
    telemetry.emit('simulation_completed', {
      simulationId,
      processed: metrics.processed,
      outputHash: targetHash(target)
    });
  }

  function step(batchLimit) {
    batchLimit = Math.max(1, Number(batchLimit) || 1);
    if (state === 'completed' || state === 'cancelled' || state === 'rolled-back') return report();
    if (state === 'paused') throw new SimulationError('SIMULATION_PAUSED', 'Resume the simulation before processing another batch.');
    if (state === 'failed' || state === 'rollback-failed') throw new SimulationError('SIMULATION_FAILED', 'Retry or rollback the failed simulation before continuing.');
    preflight();
    state = 'running';
    let processedBatches = 0;
    while (nextProfileIndex < profiles.length && processedBatches < batchLimit) {
      const batchIndex = Math.floor(nextProfileIndex / batchSize);
      try {
        processBatch(batchIndex);
      } catch (error) {
        if (error && error.code === 'PAUSE_REQUESTED') {
          state = 'paused';
          return report();
        }
        if (error && error.code === 'CANCEL_REQUESTED') {
          state = 'cancelled';
          telemetry.emit('cancel_requested', { batchIndex }, 'warning');
          return report();
        }
        fail(error, batchIndex);
        throw error;
      }
      processedBatches += 1;
      if (telemetry.sequence() > MAX_SIMULATION_TICKS) {
        const timeout = new SimulationError('SIMULATION_TIMEOUT', 'Simulation exceeded its deterministic duration guard.');
        fail(timeout, batchIndex);
        throw timeout;
      }
    }
    if (nextProfileIndex >= profiles.length) finish();
    return report();
  }

  function run() {
    if (state === 'cancelled' || state === 'rolled-back') return report();
    while (state !== 'completed') step(Number.MAX_SAFE_INTEGER);
    return report();
  }

  function pause() {
    if (state !== 'running' && state !== 'ready') throw new SimulationError('PAUSE_NOT_ALLOWED', `Cannot pause simulation in state ${state}.`);
    state = 'paused';
    return report();
  }

  function resume() {
    if (state !== 'paused') throw new SimulationError('RESUME_NOT_ALLOWED', `Cannot resume simulation in state ${state}.`);
    state = 'running';
    return report();
  }

  function cancel() {
    if (state === 'completed' || state === 'rolled-back') return report();
    state = 'cancelled';
    telemetry.emit('cancel_requested', { processed: metrics.processed }, 'warning');
    return report();
  }

  function retry() {
    if (state !== 'failed') throw new SimulationError('NO_FAILED_BATCH', 'There is no failed batch to retry.');
    if (retryCount >= maxRetries) throw new SimulationError('RETRY_CAP_EXCEEDED', `Retry cap ${maxRetries} exceeded.`);
    retryCount += 1;
    metrics.retried += 1;
    telemetry.emit('retry_started', { batchIndex: failedBatchIndex, retry: retryCount }, 'warning');
    state = 'running';
    failureState = null;
    metrics.failed = 0;
    const retryBatch = failedBatchIndex;
    try {
      processBatch(retryBatch);
      telemetry.emit('retry_completed', { batchIndex: retryBatch, retry: retryCount });
      failedBatchIndex = null;
      if (nextProfileIndex >= profiles.length) finish();
      return report();
    } catch (error) {
      fail(error, retryBatch);
      throw error;
    }
  }

  function createCheckpoint() {
    if (state === 'ready') preflight();
    inject('checkpoint', { batchIndex: Math.floor(nextProfileIndex / batchSize), profileIndex: nextProfileIndex });
    const checkpoint = {
      version: CHECKPOINT_VERSION,
      simulationId,
      ownerKey,
      fixtureSeed: fixture.seed,
      fixtureHash,
      mappingHash,
      batchSize,
      completedBatch: nextProfileIndex ? Math.floor((nextProfileIndex - 1) / batchSize) : -1,
      processedCount: nextProfileIndex,
      resultHash: targetHash(target),
      failureState: copy(failureState),
      state,
      retryCount,
      metrics: copy(metrics),
      targetEntries: sortedEntries(target),
      createdAt: SYNTHETIC_CLOCK_START + telemetry.sequence() + 1
    };
    checkpoint.signature = fixtureTools.hash(checkpoint);
    telemetry.emit('checkpoint_created', {
      processedCount: checkpoint.processedCount,
      resultHash: checkpoint.resultHash
    });
    return copy(checkpoint);
  }

  function restoreCheckpoint(checkpoint) {
    if (!checkpoint || typeof checkpoint !== 'object') throw new SimulationError('CHECKPOINT_CORRUPT', 'Checkpoint is missing or corrupt.');
    const unsigned = copy(checkpoint);
    const signature = unsigned.signature;
    delete unsigned.signature;
    if (signature !== fixtureTools.hash(unsigned)) throw new SimulationError('CHECKPOINT_CORRUPT', 'Checkpoint signature is invalid.');
    if (checkpoint.version !== CHECKPOINT_VERSION) throw new SimulationError('CHECKPOINT_VERSION_MISMATCH', 'Checkpoint version is not supported.');
    if (checkpoint.simulationId !== simulationId) throw new SimulationError('CHECKPOINT_SIMULATION_MISMATCH', 'Checkpoint belongs to another simulation.');
    if (checkpoint.ownerKey !== ownerKey) throw new SimulationError('CHECKPOINT_OWNER_MISMATCH', 'Checkpoint belongs to another owner/session.');
    if (checkpoint.fixtureSeed !== fixture.seed || checkpoint.fixtureHash !== fixtureHash) throw new SimulationError('CHECKPOINT_FIXTURE_MISMATCH', 'Checkpoint fixture is stale.');
    if (checkpoint.mappingHash !== mappingHash) throw new SimulationError('CHECKPOINT_MAPPING_MISMATCH', 'Checkpoint mapping is stale.');
    if (checkpoint.batchSize !== batchSize) throw new SimulationError('CHECKPOINT_BATCH_MISMATCH', 'Checkpoint batch size is incompatible.');
    if (!Array.isArray(checkpoint.targetEntries) || checkpoint.processedCount < 0 || checkpoint.processedCount > profiles.length) {
      throw new SimulationError('CHECKPOINT_CORRUPT', 'Checkpoint result state is malformed.');
    }
    if (
      checkpoint.targetEntries.length !== checkpoint.processedCount ||
      !checkpoint.metrics ||
      Number(checkpoint.metrics.processed) !== checkpoint.processedCount ||
      !Number.isInteger(checkpoint.retryCount) ||
      checkpoint.retryCount < 0 ||
      checkpoint.retryCount > maxRetries
    ) {
      throw new SimulationError('CHECKPOINT_CORRUPT', 'Checkpoint counters are inconsistent.');
    }
    const expectedProfileIds = profiles.slice(0, checkpoint.processedCount).map((profile) => profile.profileId);
    const checkpointProfileIds = checkpoint.targetEntries.map((entry) => text(entry && entry.profileId));
    if (fixtureTools.stableStringify(checkpointProfileIds) !== fixtureTools.stableStringify(expectedProfileIds)) {
      throw new SimulationError('CHECKPOINT_CORRUPT', 'Checkpoint target profiles are incomplete or out of order.');
    }
    const restored = new Map(checkpoint.targetEntries.map((entry) => [entry.profileId, copy(entry)]));
    if (targetHash(restored) !== checkpoint.resultHash) throw new SimulationError('CHECKPOINT_CORRUPT', 'Checkpoint result hash is invalid.');
    target.clear();
    restored.forEach((value, key) => target.set(key, value));
    Object.assign(metrics, copy(checkpoint.metrics));
    nextProfileIndex = checkpoint.processedCount;
    retryCount = checkpoint.retryCount || 0;
    failureState = copy(checkpoint.failureState);
    failedBatchIndex = failureState && failureState.batchIndex != null ? failureState.batchIndex : null;
    state = checkpoint.state === 'completed' ? 'completed' : checkpoint.state === 'failed' ? 'failed' : 'paused';
    preflightComplete = true;
    telemetry.emit('checkpoint_restored', {
      processedCount: nextProfileIndex,
      resultHash: targetHash(target)
    });
    return report();
  }

  function rollback(options) {
    options = options || {};
    if (rollbackResult && !rollbackFailed) return copy(rollbackResult);
    const beforeHash = targetHash(target);
    telemetry.emit('rollback_started', { beforeHash, retry: options.retry === true });
    try {
      inject('rollback', {
        batchIndex: failedBatchIndex == null ? Math.floor(nextProfileIndex / batchSize) : failedBatchIndex,
        profileIndex: nextProfileIndex
      });
      target.clear();
      initialTarget.forEach((value, key) => target.set(key, copy(value)));
      const afterHash = targetHash(target);
      metrics.rolledBack = 1;
      state = 'rolled-back';
      rollbackFailed = false;
      rollbackResult = {
        pass: afterHash === initialTargetHash,
        idempotent: true,
        beforeHash,
        expectedHash: initialTargetHash,
        afterHash,
        legacyHash: fixtureTools.hash(fixture.profiles),
        productionWrites: 0
      };
      telemetry.emit('rollback_completed', rollbackResult);
      return copy(rollbackResult);
    } catch (error) {
      rollbackFailed = true;
      state = 'rollback-failed';
      rollbackResult = {
        pass: false,
        beforeHash,
        expectedHash: initialTargetHash,
        afterHash: targetHash(target),
        errorCode: error.code || 'ROLLBACK_FAILED',
        error: error.message || String(error),
        productionWrites: 0
      };
      telemetry.emit('rollback_failed', rollbackResult, 'error');
      throw error;
    }
  }

  function retryRollback() {
    if (state !== 'rollback-failed') throw new SimulationError('ROLLBACK_RETRY_NOT_ALLOWED', 'Rollback has not failed.');
    rollbackResult = null;
    return rollback({ retry: true });
  }

  function triggerKillSwitch() {
    emergencyStopped = true;
    killSwitch.engageEmergencyStop();
    if (state === 'running' || state === 'ready' || state === 'paused') state = 'failed';
    failureState = { code: 'KILL_SWITCH_TRIGGERED', message: 'Emergency simulation kill switch engaged.', batchIndex: Math.floor(nextProfileIndex / batchSize) };
    return report();
  }

  function report() {
    const entries = sortedEntries(target);
    const outputHash = fixtureTools.hash(entries);
    const legacyAfterHash = fixtureTools.hash(fixture.profiles);
    const durationMs = Math.max(1, telemetry.sequence());
    const writeIsolation = spies.snapshot();
    return {
      simulationVersion: SIMULATION_VERSION,
      simulationId,
      mode: 'read-only-memory-simulation',
      state,
      fixtureSeed: fixture.seed,
      fixtureHash,
      mappingHash,
      batchSize,
      summary: copy(metrics),
      durationMs,
      profilesPerSecond: Math.round((metrics.processed / durationMs) * 100000) / 100,
      outputHash,
      resultHash: targetHash(target),
      legacyBeforeHash,
      legacyAfterHash,
      legacyUnchanged: legacyBeforeHash === legacyAfterHash,
      simulatedTargetHash: targetHash(target),
      simulatedTargetEntries: target.size,
      estimatedTargetBytes: Buffer.byteLength(fixtureTools.stableStringify(entries)),
      writeCount: writeIsolation.canonicalProductionWrites,
      storageCanonicalWriteCount: writeIsolation.storageCanonicalWrites,
      supabaseWriteCount: writeIsolation.supabaseWrites,
      rpcWriteCount: writeIsolation.rpcWrites,
      expWriteCount: writeIsolation.expWrites,
      writeIsolation,
      failureState: copy(failureState),
      telemetry: {
        summary: telemetry.summary(),
        events: telemetry.events()
      },
      killSwitch: {
        defaultEngaged: true,
        snapshot: killSwitch.snapshot(),
        evaluation: killSwitch.evaluate(EXPECTED_FLAGS)
      },
      productionBlocked: true,
      realMigrationPerformed: false
    };
  }

  if (options.checkpoint) restoreCheckpoint(options.checkpoint);

  return Object.freeze({
    run,
    step,
    pause,
    resume,
    cancel,
    retry,
    createCheckpoint,
    restoreCheckpoint,
    rollback,
    retryRollback,
    triggerKillSwitch,
    report,
    dispose: typeof options.onDispose === 'function' ? options.onDispose : () => {},
    spies,
    telemetry,
    killSwitch,
    failureInjector: injector
  });
}

function createSimulationCoordinator(options) {
  options = options || {};
  const maximum = Math.min(Number(options.maxConcurrentSessions || MAX_CONCURRENT_SESSIONS), MAX_CONCURRENT_SESSIONS);
  const active = new Map();

  function createSession(sessionOptions) {
    const id = text(sessionOptions && sessionOptions.simulationId);
    if (!id) throw new SimulationError('SIMULATION_ID_REQUIRED', 'Coordinator requires a simulationId.');
    if (active.has(id)) throw new SimulationError('DUPLICATE_SIMULATION_SESSION', 'Simulation session already exists.');
    if (active.size >= maximum) throw new SimulationError('CONCURRENT_SESSION_LIMIT', `Concurrent simulation limit ${maximum} reached.`);
    let disposed = false;
    const session = createSimulationSession(Object.assign({}, sessionOptions, {
      onDispose() {
        if (!disposed) {
          disposed = true;
          active.delete(id);
        }
      }
    }));
    active.set(id, session);
    return session;
  }

  return Object.freeze({
    createSession,
    activeCount: () => active.size,
    disposeAll() {
      Array.from(active.values()).forEach((session) => session.dispose());
    }
  });
}

module.exports = Object.freeze({
  SIMULATION_VERSION,
  CHECKPOINT_VERSION,
  TELEMETRY_VERSION,
  DEFAULT_BATCH_SIZE,
  MAX_BATCH_SIZE,
  MAX_REPORT_EVENTS,
  MAX_RETRY_COUNT,
  MAX_CONCURRENT_SESSIONS,
  MAX_SIMULATION_TICKS,
  EXPECTED_FLAGS,
  SimulationError,
  createTelemetry,
  createSimulationKillSwitch,
  createWriteIsolationSpies,
  createFailureInjector,
  createSimulationSession,
  createSimulationCoordinator,
  validateFlags,
  validateProfile,
  targetHash
});
