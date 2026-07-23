(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.VDuckieHskLegacyCompat = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function clone(value) {
    return JSON.parse(JSON.stringify(value == null ? null : value));
  }

  function wildcardMatch(pattern, value) {
    if (pattern === value) return true;
    if (pattern.slice(-1) !== '*') return false;
    return value.indexOf(pattern.slice(0, -1)) === 0;
  }

  function findMapping(legacyId, mappings) {
    var list = Array.isArray(mappings) ? mappings : [];
    var exact = list.find(function (item) { return item.legacyId === legacyId; });
    if (exact) return exact;
    return list.find(function (item) { return wildcardMatch(item.legacyId || '', legacyId); }) || null;
  }

  function mapLegacyHskLessonId(legacyId, mappings) {
    var mapping = findMapping(String(legacyId || ''), mappings);
    if (!mapping) return { legacyId: legacyId, canonicalId: null, status: 'unmapped', confidence: 0, mappingRule: null };
    if (mapping.status === 'mapped' && mapping.canonicalId) {
      return { legacyId: legacyId, canonicalId: mapping.canonicalId, status: 'mapped', confidence: Number(mapping.confidence || 0), mappingRule: mapping.mappingRule || null };
    }
    return { legacyId: legacyId, canonicalId: null, status: mapping.status || 'review-required', confidence: Number(mapping.confidence || 0), mappingRule: mapping.mappingRule || null, candidateCanonicalId: mapping.canonicalId || null };
  }

  function mapLegacyHskProgress(legacyProgress, mappings) {
    var source = legacyProgress && typeof legacyProgress === 'object' ? legacyProgress : {};
    var canonicalProgress = {};
    var unresolved = [];
    var preservedLegacy = clone(source) || {};
    Object.keys(source).forEach(function (legacyId) {
      var result = mapLegacyHskLessonId(legacyId, mappings);
      if (result.status === 'mapped') canonicalProgress[result.canonicalId] = Boolean(source[legacyId]);
      else unresolved.push({ legacyId: legacyId, legacyCompleted: Boolean(source[legacyId]), status: result.status, confidence: result.confidence, candidateCanonicalId: result.candidateCanonicalId || null });
    });
    return {
      canonicalProgress: canonicalProgress,
      unresolved: unresolved,
      preservedLegacy: preservedLegacy,
      writesPerformed: false
    };
  }

  function resolveLegacyCompletion(legacyId, legacyProgress, canonicalProgress, mappings) {
    var mapping = mapLegacyHskLessonId(legacyId, mappings);
    var legacyCompleted = Boolean(legacyProgress && legacyProgress[legacyId]);
    if (mapping.status !== 'mapped') {
      return {
        status: mapping.status,
        completed: null,
        legacyCompleted: legacyCompleted,
        canonicalId: null,
        preserved: true
      };
    }
    var hasCanonical = canonicalProgress && Object.prototype.hasOwnProperty.call(canonicalProgress, mapping.canonicalId);
    return {
      status: 'mapped',
      completed: hasCanonical ? Boolean(canonicalProgress[mapping.canonicalId]) : legacyCompleted,
      legacyCompleted: legacyCompleted,
      canonicalId: mapping.canonicalId,
      preserved: true
    };
  }

  return Object.freeze({
    mapLegacyHskLessonId: mapLegacyHskLessonId,
    mapLegacyHskProgress: mapLegacyHskProgress,
    resolveLegacyCompletion: resolveLegacyCompletion
  });
});
