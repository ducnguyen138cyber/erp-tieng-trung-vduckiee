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
    } else if (expectedType === 'hsk1-content-index') {
      errors = requiredFields(value, ['schemaVersion', 'level', 'expectedVocabulary', 'expectedSentences', 'vocabularyIndex', 'sentenceIndex', 'productionEnabled', 'publicOverrideAllowed', 'writesProgress', 'developerOnly', 'readOnly', 'qualityGate']);
      if (value && Number(value.level) !== 1) errors.push('level must be 1');
      if (value && value.productionEnabled !== false) errors.push('productionEnabled must be false');
      if (value && value.publicOverrideAllowed !== false) errors.push('publicOverrideAllowed must be false');
      if (value && value.writesProgress !== false) errors.push('writesProgress must be false');
      if (value && value.developerOnly !== true) errors.push('developerOnly must be true');
      if (value && value.readOnly !== true) errors.push('readOnly must be true');
      if (value && value.qualityGate !== 'locked') errors.push('qualityGate must be locked');
    } else if (expectedType === 'collection-index') {
      errors = requiredFields(value, ['schemaVersion', 'level', 'expectedCount', 'actualCount', 'shards']);
      if (value && !Array.isArray(value.shards)) errors.push('shards must be an array');
    } else if (expectedType === 'collection') {
      errors = requiredFields(value, ['schemaVersion', 'collectionType', 'level', 'records']);
      if (value && !Array.isArray(value.records)) errors.push('records must be an array');
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
    var canonicalHsk1Promise = null;

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

    function loadCollection(indexPath, expectedCollectionType) {
      var indexResource = resolveResource(baseUrl, indexPath);
      return fetchJson(indexResource, 'collection-index').then(function (index) {
        var directory = dirname(indexPath);
        return Promise.all((index.shards || []).map(function (shard) {
          if (!shard || !shard.file) throw new HskContentError('INDEX_INVALID', 'Canonical collection shard is missing its file path.', { indexPath: indexPath, shard: shard || null });
          return fetchJson(resolveResource(baseUrl, directory + shard.file), 'collection').then(function (collection) {
            if (collection.collectionType !== expectedCollectionType) {
              throw new HskContentError('COLLECTION_MISMATCH', 'Canonical collection type does not match its index.', {
                indexPath: indexPath,
                expected: expectedCollectionType,
                actual: collection.collectionType
              });
            }
            if (Number(collection.level) !== 1) throw new HskContentError('LEVEL_MISMATCH', 'Canonical HSK 1 collection has a different level.', { indexPath: indexPath, actual: collection.level });
            return collection.records;
          });
        })).then(function (shards) {
          var records = [];
          shards.forEach(function (items) { records = records.concat(items); });
          if (records.length !== Number(index.expectedCount) || records.length !== Number(index.actualCount)) {
            throw new HskContentError('COUNT_MISMATCH', 'Canonical collection count does not match its index.', {
              indexPath: indexPath,
              expected: Number(index.expectedCount),
              actual: records.length
            });
          }
          return { index: index, records: records };
        });
      });
    }

    function loadCanonicalHsk1() {
      if (canonicalHsk1Promise) return canonicalHsk1Promise;
      var contentIndexPath = 'hsk1/content-index.json';
      var contentIndexResource = resolveResource(baseUrl, contentIndexPath);
      canonicalHsk1Promise = fetchJson(contentIndexResource, 'hsk1-content-index').then(function (contentIndex) {
        var directory = dirname(contentIndexPath);
        return Promise.all([
          loadCollection(directory + contentIndex.vocabularyIndex, 'vocabulary'),
          loadCollection(directory + contentIndex.sentenceIndex, 'sentence')
        ]).then(function (collections) {
          var vocabulary = collections[0];
          var sentences = collections[1];
          if (vocabulary.records.length !== Number(contentIndex.expectedVocabulary) || sentences.records.length !== Number(contentIndex.expectedSentences)) {
            throw new HskContentError('COUNT_MISMATCH', 'Canonical HSK 1 dataset does not match its content index.', {
              expectedVocabulary: Number(contentIndex.expectedVocabulary),
              actualVocabulary: vocabulary.records.length,
              expectedSentences: Number(contentIndex.expectedSentences),
              actualSentences: sentences.records.length
            });
          }
          return Object.freeze({
            contentIndex: contentIndex,
            vocabularyIndex: vocabulary.index,
            sentenceIndex: sentences.index,
            vocabulary: Object.freeze(vocabulary.records.slice()),
            sentences: Object.freeze(sentences.records.slice())
          });
        });
      });
      canonicalHsk1Promise.catch(function () { canonicalHsk1Promise = null; });
      return canonicalHsk1Promise;
    }

    function clearHskContentCache() {
      cache.clear();
      levelResources.clear();
      canonicalHsk1Promise = null;
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
      loadCanonicalHsk1: loadCanonicalHsk1,
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
