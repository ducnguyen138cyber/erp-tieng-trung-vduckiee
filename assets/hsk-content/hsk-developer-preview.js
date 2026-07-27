(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.VDuckieHskDeveloperPreview = api.createHskDeveloperPreview({ root: root });
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function createHskDeveloperPreview(options) {
    options = options || {};
    var root = options.root || {};
    var flags = options.flags || root.VDuckieHskContentFlags;
    var loaderApi = options.loaderApi || root.VDuckieHskContentLoader;
    var adapterApi = options.adapterApi || root.VDuckieHskContentAdapter;
    var contractApi = options.contractApi || root.VDuckieHskProgressContract;
    var migrationApi = options.migrationApi || root.VDuckieHskProgressMigration;
    var runtimeApi = options.runtimeApi || root.VDuckieHskRuntime;
    var loader = options.loader || (loaderApi && loaderApi.createHskContentLoader ? loaderApi.createHskContentLoader({ baseUrl: './data/hsk/' }) : null);
    var runtimeBridge = null;
    var active = false;
    var bundlePromise = null;
    var legacyInventory = null;
    var mappingReport = null;
    var lastDryRun = null;
    var state = {
      mode: 'legacy',
      status: 'idle',
      readOnly: true,
      progressWritesEnabled: false,
      qualityGate: 'locked',
      vocabulary: 0,
      sentences: 0,
      lessons: 0,
      error: null,
      progress: emptyProgressState()
    };

    function emptyProgressState() {
      return {
        status: 'idle',
        totalLegacyItems: 0,
        exactMapped: 0,
        normalizedMapped: 0,
        ambiguous: 0,
        unmatched: 0,
        duplicateTargets: 0,
        coveragePercent: 0,
        previewRecords: 0,
        conflicts: 0,
        invalidRecords: 0,
        writesDisabled: true,
        beforeAfterEqual: null,
        rollback: 'not-run'
      };
    }

    function copy(value) { return JSON.parse(JSON.stringify(value)); }
    function text(value) { return String(value == null ? '' : value).trim(); }
    function parseJson(value, fallback) {
      try {
        var parsed = JSON.parse(value || '');
        return parsed && typeof parsed === 'object' ? parsed : fallback;
      } catch (error) { return fallback; }
    }
    function stableStringify(value) {
      if (migrationApi && typeof migrationApi.stableStringify === 'function') return migrationApi.stableStringify(value);
      if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']';
      if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(function (key) { return JSON.stringify(key) + ':' + stableStringify(value[key]); }).join(',') + '}';
      return JSON.stringify(value);
    }

    function publish() {
      if (options.onChange) options.onChange(copy(state));
      else if (root.document && typeof root.CustomEvent === 'function') {
        root.document.dispatchEvent(new root.CustomEvent('vduckie:hsk-curriculum-preview-changed', { detail: copy(state) }));
      }
    }

    function refreshDictionary() {
      if (options.refreshDictionary) options.refreshDictionary();
      else if (root.VDuckieDictionary && typeof root.VDuckieDictionary.refresh === 'function') root.VDuckieDictionary.refresh();
    }

    function guard() {
      if (!active || !runtimeBridge) throw new Error('Canonical HSK 1 Developer Preview is not authorized.');
    }

    function loadBundle() {
      if (bundlePromise) return bundlePromise;
      if (!loader || !adapterApi || typeof adapterApi.adaptCanonicalHsk1 !== 'function') return Promise.reject(new Error('Canonical HSK 1 loader is unavailable.'));
      bundlePromise = loader.loadCanonicalHsk1().then(function (dataset) {
        return { dataset: dataset, model: adapterApi.adaptCanonicalHsk1(dataset) };
      });
      bundlePromise.catch(function () { bundlePromise = null; });
      return bundlePromise;
    }

    function storageValue(key) {
      try { return root.localStorage && root.localStorage.getItem ? root.localStorage.getItem(key) : null; }
      catch (error) { return null; }
    }

    function currentOwnerKey() {
      var core = root.VDuckieEXPCore;
      var session = core && typeof core.session === 'function' ? core.session() : null;
      var user = session && session.user;
      return text(user && (user.id || user.email)) || 'guest';
    }

    function currentWordRows() {
      var bridge = root.VDuckieLocalLearning;
      if (!bridge || typeof bridge.prepareForCloud !== 'function') return [];
      try {
        var rows = bridge.prepareForCloud();
        return Array.isArray(rows) ? copy(rows) : [];
      } catch (error) { return []; }
    }

    function effectiveLegacyLessons() {
      var lessons = Array.isArray(root.HSK1_V75_LESSONS) ? root.HSK1_V75_LESSONS : null;
      if (!lessons && root.HSKCurriculum && root.HSKCurriculum.levels) lessons = root.HSKCurriculum.levels[1];
      lessons = Array.isArray(lessons) ? lessons : [];
      var count = lessons.reduce(function (total, lesson) { return total + (Array.isArray(lesson && lesson.words) ? lesson.words.length : 0); }, 0);
      if (lessons.length !== 15 || count !== 150) throw new Error('Legacy HSK 1 V75 inventory must contain 15 lessons and 150 vocabulary items.');
      return copy(lessons);
    }

    function captureLegacyInventory(force) {
      if (!force && legacyInventory) return copy(legacyInventory);
      if (state.mode === 'canonical' && legacyInventory) return copy(legacyInventory);
      var activeUser = storageValue('vduckie-hsk-active-user-v1');
      var cacheKey = activeUser ? 'vduckie-hsk-account-cache-v1:' + activeUser : null;
      legacyInventory = {
        curriculumId: 'hsk1-legacy-v75',
        ownerKey: currentOwnerKey(),
        lessons: effectiveLegacyLessons(),
        completed: parseJson(storageValue('erp-hsk-progress-v2'), {}),
        selectedState: parseJson(storageValue('erp-hsk-state-v2'), { level: 0, lesson: 0 }),
        progressMeta: parseJson(storageValue('vduckie-hsk-progress-meta-v1'), {}),
        sectionProgress: parseJson(storageValue('vduckie-hsk-section-progress-v1'), {}),
        exerciseResults: parseJson(storageValue('vduckie-exercise-results-v1'), {}),
        reviewSrs: parseJson(storageValue('vduckie-review-srs-v1'), {}),
        accountCache: cacheKey ? parseJson(storageValue(cacheKey), {}) : {},
        wordRows: currentWordRows()
      };
      return copy(legacyInventory);
    }

    function curriculumSignature() {
      var lessons = state.mode === 'canonical' && legacyInventory ? legacyInventory.lessons : effectiveLegacyLessons();
      return lessons.map(function (lesson) {
        return [text(lesson.id), text(lesson.title), Array.isArray(lesson.words) ? lesson.words.length : 0];
      });
    }

    function captureSafetySnapshot() {
      var activeUser = storageValue('vduckie-hsk-active-user-v1');
      var cacheKey = activeUser ? 'vduckie-hsk-account-cache-v1:' + activeUser : null;
      var canonicalKey = contractApi && contractApi.CANONICAL_STORAGE_KEY || 'vduckie-hsk-canonical-progress-v1';
      return {
        storage: {
          progress: storageValue('erp-hsk-progress-v2'),
          state: storageValue('erp-hsk-state-v2'),
          meta: storageValue('vduckie-hsk-progress-meta-v1'),
          section: storageValue('vduckie-hsk-section-progress-v1'),
          exercises: storageValue('vduckie-exercise-results-v1'),
          review: storageValue('vduckie-review-srs-v1'),
          accountCache: cacheKey ? storageValue(cacheKey) : null,
          canonical: storageValue(canonicalKey)
        },
        legacyCurriculum: curriculumSignature(),
        wordRows: currentWordRows().sort(function (a, b) { return text(a.word_key || a.hanzi).localeCompare(text(b.word_key || b.hanzi)); })
      };
    }

    function select(mode) {
      guard();
      mode = mode === 'canonical' ? 'canonical' : 'legacy';
      if (mode === 'legacy') {
        runtimeBridge.useLegacy();
        state.mode = 'legacy';
        state.status = 'ready';
        state.vocabulary = 0;
        state.sentences = 0;
        state.lessons = 0;
        state.error = null;
        refreshDictionary();
        publish();
        return Promise.resolve(copy(state));
      }
      if (migrationApi && contractApi) captureLegacyInventory(true);
      var access = flags && flags.resolveHskCurriculumAccess ? flags.resolveHskCurriculumAccess({ developerAuthorized: true, previewRequested: true }) : null;
      if (!access || access.mode !== 'developer-preview' || access.readOnly !== true || access.progressWritesEnabled !== false || access.qualityGate !== 'locked') {
        return Promise.reject(new Error('Canonical HSK 1 access gate is locked.'));
      }
      state.status = 'loading';
      state.error = null;
      publish();
      return loadBundle().then(function (bundle) {
        guard();
        var model = bundle.model;
        runtimeBridge.useCanonical(model.lessons, {
          standard: 'HSK 1 canonical · 300 từ · 900 câu · DEV ONLY',
          vocabulary: model.metrics.vocabulary,
          sentences: model.metrics.sentences,
          lessons: model.metrics.lessons,
          readOnly: true
        });
        state.mode = 'canonical';
        state.status = 'ready';
        state.vocabulary = model.metrics.vocabulary;
        state.sentences = model.metrics.sentences;
        state.lessons = model.metrics.lessons;
        state.error = null;
        refreshDictionary();
        publish();
        return copy(state);
      }).catch(function (error) {
        state.status = 'error';
        state.error = error && error.message || String(error);
        publish();
        throw error;
      });
    }

    function smokeCheck() {
      guard();
      return loadBundle().then(function (bundle) {
        var model = bundle.model;
        var search = model.search('爱', 5);
        return Object.freeze({
          loader: model.metrics.vocabulary === 300 && model.metrics.sentences === 900,
          lessonList: model.metrics.lessons === 15,
          vocabulary: model.flashcards.length === 300,
          sentences: model.dictations.length === 900,
          audio: model.flashcards.every(function (item) { return Boolean(item.audioText); }) && model.dictations.every(function (item) { return Boolean(item.audioText); }),
          search: search.length > 0,
          flashcard: Boolean(model.flashcards[0] && model.flashcards[0].examples.length === 3),
          quiz: Boolean(model.quizItems[0] && model.quizItems[0].options.length === 4),
          dictation: Boolean(model.dictations[0] && model.dictations[0].chinese)
        });
      });
    }

    function applyMappingState(report, status) {
      state.progress.status = status || 'mapping-ready';
      state.progress.totalLegacyItems = report.summary.totalLegacyItems;
      state.progress.exactMapped = report.summary.exactMapped;
      state.progress.normalizedMapped = report.summary.normalizedMapped;
      state.progress.ambiguous = report.summary.ambiguous;
      state.progress.unmatched = report.summary.unmatched;
      state.progress.duplicateTargets = report.summary.duplicateTargets;
      state.progress.coveragePercent = report.summary.coveragePercent;
    }

    function analyzeLegacyProgress() {
      guard();
      if (!migrationApi || typeof migrationApi.buildMappingReport !== 'function') return Promise.reject(new Error('HSK progress mapping engine is unavailable.'));
      var inventory = captureLegacyInventory(true);
      state.progress.status = 'analyzing';
      publish();
      return loadBundle().then(function (bundle) {
        mappingReport = migrationApi.buildMappingReport({
          legacyLessons: inventory.lessons,
          canonicalVocabulary: bundle.dataset.vocabulary,
          canonicalLessons: bundle.model.lessons
        });
        applyMappingState(mappingReport, 'mapping-ready');
        state.error = null;
        publish();
        return copy(mappingReport);
      }).catch(function (error) {
        state.progress.status = 'error';
        state.error = error && error.message || String(error);
        publish();
        throw error;
      });
    }

    function getMappingReport() {
      guard();
      return mappingReport ? Promise.resolve(copy(mappingReport)) : analyzeLegacyProgress();
    }

    function runMigrationDryRun() {
      guard();
      if (!migrationApi || typeof migrationApi.runDryRun !== 'function' || !contractApi) return Promise.reject(new Error('HSK migration dry-run engine is unavailable.'));
      var before = captureSafetySnapshot();
      var inventory = captureLegacyInventory(true);
      return getMappingReport().then(function (report) {
        lastDryRun = migrationApi.runDryRun({
          mappingReport: report,
          completed: inventory.completed,
          wordRows: inventory.wordRows,
          ownerKey: inventory.ownerKey,
          contractApi: contractApi
        });
        var after = captureSafetySnapshot();
        var equal = stableStringify(before) === stableStringify(after);
        if (!equal) throw new Error('Migration dry-run changed legacy state.');
        state.progress.status = 'dry-run-ready';
        state.progress.previewRecords = lastDryRun.previewRecords.length;
        state.progress.conflicts = lastDryRun.conflicts.length;
        state.progress.invalidRecords = lastDryRun.invalidRecords.length;
        state.progress.writesDisabled = lastDryRun.writesPerformed === false && lastDryRun.apiWrites === 0 && lastDryRun.canonicalStorageWrites === 0;
        state.progress.beforeAfterEqual = equal;
        publish();
        return copy(lastDryRun);
      }).catch(function (error) {
        state.progress.status = 'error';
        state.progress.beforeAfterEqual = false;
        state.error = error && error.message || String(error);
        publish();
        throw error;
      });
    }

    function verifyRollback() {
      guard();
      var originalMode = state.mode;
      var start = originalMode === 'canonical' ? select('legacy') : Promise.resolve();
      return start.then(function () {
        var before = captureSafetySnapshot();
        return select('canonical').then(function () { return select('legacy'); }).then(function () {
          var after = captureSafetySnapshot();
          var equal = stableStringify(before) === stableStringify(after);
          state.progress.beforeAfterEqual = equal;
          state.progress.rollback = equal ? 'pass' : 'fail';
          state.progress.status = equal ? 'rollback-pass' : 'rollback-fail';
          publish();
          if (!equal) throw new Error('Rollback verification changed legacy state.');
          return { pass: true, before: before, after: after, canonicalWrites: 0, apiWrites: 0 };
        });
      });
    }

    function createBridge(bridge) {
      runtimeBridge = bridge;
      active = true;
      return Object.freeze({
        select: select,
        smokeCheck: smokeCheck,
        analyzeLegacyProgress: analyzeLegacyProgress,
        runMigrationDryRun: runMigrationDryRun,
        getMappingReport: getMappingReport,
        verifyRollback: verifyRollback,
        getState: function () { guard(); return copy(state); },
        disable: function () {
          if (!active) return;
          try { runtimeBridge.useLegacy(); } catch (error) {}
          try { runtimeBridge.disable(); } catch (error) {}
          active = false;
          runtimeBridge = null;
          legacyInventory = null;
          mappingReport = null;
          lastDryRun = null;
          state.mode = 'legacy';
          state.status = 'idle';
          state.vocabulary = 0;
          state.sentences = 0;
          state.lessons = 0;
          state.error = null;
          state.progress = emptyProgressState();
          refreshDictionary();
          publish();
        }
      });
    }

    function requestDeveloperBridge() {
      if (!runtimeApi || typeof runtimeApi.requestDeveloperBridge !== 'function') return Promise.reject(new Error('HSK runtime bridge is unavailable.'));
      return runtimeApi.requestDeveloperBridge().then(createBridge);
    }

    return Object.freeze({
      requestDeveloperBridge: requestDeveloperBridge,
      getPublicState: function () {
        return Object.freeze({ mode: 'legacy', canonicalAvailable: false, publicOverrideAllowed: false, progressWritesEnabled: false, qualityGate: 'locked' });
      }
    });
  }

  return Object.freeze({ createHskDeveloperPreview: createHskDeveloperPreview });
});
