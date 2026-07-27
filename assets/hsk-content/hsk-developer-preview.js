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
    var runtimeApi = options.runtimeApi || root.VDuckieHskRuntime;
    var loader = options.loader || (loaderApi && loaderApi.createHskContentLoader ? loaderApi.createHskContentLoader({ baseUrl: './data/hsk/' }) : null);
    var runtimeBridge = null;
    var active = false;
    var modelPromise = null;
    var state = {
      mode: 'legacy',
      status: 'idle',
      readOnly: true,
      progressWritesEnabled: false,
      qualityGate: 'locked',
      vocabulary: 0,
      sentences: 0,
      lessons: 0,
      error: null
    };

    function copy(value) {
      return JSON.parse(JSON.stringify(value));
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

    function loadModel() {
      if (modelPromise) return modelPromise;
      if (!loader || !adapterApi || typeof adapterApi.adaptCanonicalHsk1 !== 'function') return Promise.reject(new Error('Canonical HSK 1 loader is unavailable.'));
      modelPromise = loader.loadCanonicalHsk1().then(function (dataset) {
        return adapterApi.adaptCanonicalHsk1(dataset);
      });
      modelPromise.catch(function () { modelPromise = null; });
      return modelPromise;
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
      var access = flags && flags.resolveHskCurriculumAccess ? flags.resolveHskCurriculumAccess({ developerAuthorized: true, previewRequested: true }) : null;
      if (!access || access.mode !== 'developer-preview' || access.readOnly !== true || access.progressWritesEnabled !== false || access.qualityGate !== 'locked') {
        return Promise.reject(new Error('Canonical HSK 1 access gate is locked.'));
      }
      state.status = 'loading';
      state.error = null;
      publish();
      return loadModel().then(function (model) {
        guard();
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
      return loadModel().then(function (model) {
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

    function createBridge(bridge) {
      runtimeBridge = bridge;
      active = true;
      return Object.freeze({
        select: select,
        smokeCheck: smokeCheck,
        getState: function () { guard(); return copy(state); },
        disable: function () {
          if (!active) return;
          try { runtimeBridge.useLegacy(); } catch (error) {}
          try { runtimeBridge.disable(); } catch (error) {}
          active = false;
          runtimeBridge = null;
          state.mode = 'legacy';
          state.status = 'idle';
          state.vocabulary = 0;
          state.sentences = 0;
          state.lessons = 0;
          state.error = null;
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
