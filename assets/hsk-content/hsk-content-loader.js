(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.VDuckieHskContentLoader = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function HskContentError(code, message, detail) {
    this.name = 'HskContentError';
    this.code = code;
    this.message = message;
    this.detail = detail || null;
    if (Error.captureStackTrace) Error.captureStackTrace(this, HskContentError);
  }
  HskContentError.prototype = Object.create(Error.prototype);
  HskContentError.prototype.constructor = HskContentError;

  function trimSlashes(value) {
    return String(value || '').replace(/^\/+|\/+$/g, '');
  }

  function dirname(resourcePath) {
    var clean = String(resourcePath || '').split('?')[0];
    var index = clean.lastIndexOf('/');
    return index < 0 ? '' : clean.slice(0, index + 1);
  }

  function resolveResource(baseUrl, resourcePath) {
    var resource = String(resourcePath || '');
    if (/^[a-z][a-z0-9+.-]*:/i.test(resource)) return resource;
    var base = String(baseUrl || './data/hsk/');
    if (/^[a-z][a-z0-9+.-]*:/i.test(base)) return new URL(resource, base.endsWith('/') ? base : base + '/').toString();
    var prefix = base.endsWith('/') ? base : base + '/';
    var stack = [];
    (prefix + resource).split('/').forEach(function (part) {
      if (!part || part === '.') return;
      if (part === '..') stack.pop();
      else stack.push(part);
    });
    return (prefix.charAt(0) === '.' ? './' : '') + stack.join('/');
  }

  function requiredFields(value, fields) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return ['record must be an object'];
    return fields.filter(function (field) { return !Object.prototype.hasOwnProperty.call(value, field); })
      .map(function (field) { return 'missing ' + field; });
  }

  function validateRuntimeShape(value, expectedType) {
    var errors = [];
    if (expectedType === 'manifest') {
      errors = requiredFields(value, ['schemaVersion', 'curriculumId', 'qualityGate', 'productionEnabled', 'levels']);
      if (value && !Array.isArray(value.levels)) errors.push('levels must be an array');
    } else if (expectedType === 'level') {
      errors = requiredFields(value, ['recordType', 'id', 'level', 'unitRefs', 'lessonIndex', 'contentStatus']);
      if (value && value.recordType !== 'level') errors.push('recordType must be level');
    } else if (expectedType === 'unit') {
      errors = requiredFields(value, ['recordType', 'id', 'level', 'lessonRefs', 'checkpointRef']);
      if (value && value.recordType !== 'unit') errors.push('recordType must be unit');
    } else if (expectedType === 'lesson') {
      errors = requiredFields(value, ['recordType', 'id', 'level', 'unitId', 'sections', 'practiceRefs']);
      if (value && value.recordType !== 'lesson') errors.push('recordType must be lesson');
    } else if (expectedType === 'assessment') {
      errors = requiredFields(value, ['recordType', 'id', 'level', 'exerciseRefs']);
      if (value && value.recordType !== 'assessment') errors.push('recordType must be assessment');
    }
    return errors;
  }

  function createHskContentLoader(options) {
    options = options || {};
    var baseUrl = options.baseUrl || './data/hsk/';
    var manifestPath = options.manifestPath || 'manifest.json';
    var timeoutMs = Number(options.timeoutMs || 8000);
    var fetchImpl = options.fetchImpl || (typeof fetch === 'function' ? fetch.bind(typeof globalThis !== 'undefined' ? globalThis : null) : null);
    var runtimeValidator = options.runtimeValidator || validateRuntimeShape;
    var cache = new Map();
    var state = { status: 'idle', error: null, lastResource: null };
    var manifestResource = resolveResource(baseUrl, manifestPath);
    var manifestDirectory = dirname(manifestPath);
    var levelResources = new Map();

    if (!fetchImpl) throw new HskContentError('FETCH_UNAVAILABLE', 'No fetch implementation is available.');

    function setState(status, resource, error) {
      state = { status: status, error: error || null, lastResource: resource || null };
    }

    function fetchJson(resourcePath, expectedType) {
      var resource = /^[a-z][a-z0-9+.-]*:/i.test(resourcePath) || resourcePath.indexOf('./') === 0
        ? resourcePath
        : resolveResource(baseUrl, resourcePath);
      if (cache.has(resource)) return cache.get(resource);
      var pending = new Promise(function (resolve, reject) {
        var controller = typeof AbortController === 'function' ? new AbortController() : null;
        var timer = setTimeout(function () {
          if (controller) controller.abort();
          reject(new HskContentError('TIMEOUT', 'Timed out while loading ' + resource, { resource: resource, timeoutMs: timeoutMs }));
        }, timeoutMs);
        setState('loading', resource, null);
        Promise.resolve(fetchImpl(resource, controller ? { signal: controller.signal, cache: 'no-store' } : { cache: 'no-store' }))
          .then(function (response) {
            if (!response || response.ok !== true) {
              var status = response && response.status;
              var code = status === 404 ? 'FILE_NOT_FOUND' : 'HTTP_ERROR';
              throw new HskContentError(code, 'Unable to load ' + resource, { resource: resource, status: status || null });
            }
            return response.text();
          })
          .then(function (text) {
            var value;
            try { value = JSON.parse(text); }
            catch (error) { throw new HskContentError('INVALID_JSON', 'Invalid JSON in ' + resource, { resource: resource, cause: error.message }); }
            var schemaErrors = runtimeValidator(value, expectedType || null) || [];
            if (schemaErrors.length) throw new HskContentError('SCHEMA_INVALID', 'Runtime schema check failed for ' + resource, { resource: resource, errors: schemaErrors });
            clearTimeout(timer);
            setState('ready', resource, null);
            resolve(value);
          })
          .catch(function (error) {
            clearTimeout(timer);
            var normalized = error instanceof HskContentError ? error : new HskContentError('LOAD_FAILED', error && error.message || String(error), { resource: resource });
            setState('error', resource, normalized);
            reject(normalized);
          });
      });
      cache.set(resource, pending);
      pending.catch(function () { cache.delete(resource); });
      return pending;
    }

    function loadHskManifest() {
      return fetchJson(manifestResource, 'manifest');
    }

    function findLevelEntry(manifest, level) {
      var number = Number(level);
      var entry = (manifest.levels || []).find(function (item) { return Number(item.level) === number; });
      if (!entry) throw new HskContentError('LEVEL_NOT_FOUND', 'HSK level ' + level + ' is not listed in the manifest.', { level: level });
      if (!entry.path) throw new HskContentError('LEVEL_PLANNED', 'HSK level ' + level + ' has no content path yet.', { level: level, status: entry.status });
      return entry;
    }

    function loadHskLevel(level) {
      return loadHskManifest().then(function (manifest) {
        var entry = findLevelEntry(manifest, level);
        var resourcePath = manifestDirectory + entry.path;
        var resource = resolveResource(baseUrl, resourcePath);
        levelResources.set(Number(level), resourcePath);
        return fetchJson(resource, 'level').then(function (value) {
          if (Number(value.level) !== Number(level)) throw new HskContentError('LEVEL_MISMATCH', 'Loaded level does not match the requested level.', { requested: Number(level), actual: value.level });
          return value;
        });
      });
    }

    function resolveLevelChild(level, childPath) {
      var levelResourcePath = levelResources.get(Number(level));
      if (!levelResourcePath) throw new HskContentError('LEVEL_NOT_LOADED', 'Load the level before resolving child content.', { level: level });
      return resolveResource(baseUrl, dirname(levelResourcePath) + childPath);
    }

    function loadHskUnit(level, unitId) {
      return loadHskLevel(level).then(function (levelRecord) {
        var ref = (levelRecord.unitRefs || []).find(function (item) { return item.id === unitId; });
        if (!ref) throw new HskContentError('UNIT_NOT_FOUND', 'Unit ' + unitId + ' is not referenced by HSK ' + level + '.', { level: level, unitId: unitId });
        return fetchJson(resolveLevelChild(level, ref.path), 'unit').then(function (unit) {
          if (unit.id !== unitId || Number(unit.level) !== Number(level)) throw new HskContentError('UNIT_MISMATCH', 'Loaded unit metadata does not match the requested unit.', { level: level, unitId: unitId });
          return unit;
        });
      });
    }

    function loadHskLesson(level, lessonId) {
      return loadHskLevel(level).then(function (levelRecord) {
        var ref = (levelRecord.lessonIndex || []).find(function (item) { return item.id === lessonId; });
        if (!ref) throw new HskContentError('LESSON_NOT_FOUND', 'Lesson ' + lessonId + ' is not indexed by HSK ' + level + '.', { level: level, lessonId: lessonId });
        return fetchJson(resolveLevelChild(level, ref.path), 'lesson').then(function (lesson) {
          if (lesson.id !== lessonId || Number(lesson.level) !== Number(level)) throw new HskContentError('LESSON_MISMATCH', 'Loaded lesson metadata does not match the requested lesson.', { level: level, lessonId: lessonId });
          return lesson;
        });
      });
    }

    function loadHskAssessment(level, assessmentId) {
      return loadHskLevel(level).then(function (levelRecord) {
        var ref = (levelRecord.assessmentRefs || []).find(function (item) { return item.id === assessmentId; });
        if (!ref) throw new HskContentError('ASSESSMENT_NOT_FOUND', 'Assessment ' + assessmentId + ' is not referenced by HSK ' + level + '.', { level: level, assessmentId: assessmentId });
        return fetchJson(resolveLevelChild(level, ref.path), 'assessment');
      });
    }

    function clearHskContentCache() {
      cache.clear();
      levelResources.clear();
      setState('idle', null, null);
    }

    function getHskContentLoaderState() {
      return {
        status: state.status,
        error: state.error,
        lastResource: state.lastResource,
        cacheEntries: cache.size,
        cachedResources: Array.from(cache.keys()).sort()
      };
    }

    return Object.freeze({
      loadHskManifest: loadHskManifest,
      loadHskLevel: loadHskLevel,
      loadHskUnit: loadHskUnit,
      loadHskLesson: loadHskLesson,
      loadHskAssessment: loadHskAssessment,
      clearHskContentCache: clearHskContentCache,
      getHskContentLoaderState: getHskContentLoaderState
    });
  }

  return Object.freeze({
    HskContentError: HskContentError,
    createHskContentLoader: createHskContentLoader,
    validateRuntimeShape: validateRuntimeShape,
    resolveResource: resolveResource,
    trimSlashes: trimSlashes
  });
});
