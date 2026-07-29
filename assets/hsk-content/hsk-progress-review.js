(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.VDuckieHskProgressReview = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var SCHEMA_VERSION = '1.0.0';
  var REVIEW_MODE = 'developer-in-memory-only';

  function text(value) { return String(value == null ? '' : value).trim(); }
  function clone(value) { return JSON.parse(JSON.stringify(value == null ? null : value)); }
  function asArray(value) { return Array.isArray(value) ? value : []; }
  function normalizeHanzi(value) { return text(value).replace(/[\s，。！？、,.!?；;：:（）()【】\[\]"“”'‘’·]/g, ''); }
  function normalizeLatin(value) {
    var output = text(value).toLowerCase();
    if (output.normalize) output = output.normalize('NFD');
    return output.replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/ü/g, 'v').replace(/[^a-z0-9]/g, '');
  }
  function normalizeMeaning(value) {
    return text(value).toLowerCase().replace(/[.,/#!$%\^&\*;:{}=\-_`~()，。！？、；：]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function stableStringify(value) {
    if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']';
    if (value && typeof value === 'object') {
      return '{' + Object.keys(value).sort().map(function (key) { return JSON.stringify(key) + ':' + stableStringify(value[key]); }).join(',') + '}';
    }
    return JSON.stringify(value);
  }
  function hash(value) {
    value = text(value);
    var result = 2166136261;
    for (var i = 0; i < value.length; i += 1) {
      result ^= value.charCodeAt(i);
      result += (result << 1) + (result << 4) + (result << 7) + (result << 8) + (result << 24);
    }
    return (result >>> 0).toString(36);
  }
  function freeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.keys(value).forEach(function (key) { freeze(value[key]); });
    return Object.freeze(value);
  }
  function meaningOverlap(left, right) {
    var leftTokens = normalizeMeaning(left).split(' ').filter(Boolean);
    var rightTokens = normalizeMeaning(right).split(' ').filter(Boolean);
    if (!leftTokens.length || !rightTokens.length) return 0;
    var leftSeen = Object.create(null), rightSeen = Object.create(null), intersection = 0, union;
    leftTokens.forEach(function (token) { leftSeen[token] = true; });
    rightTokens.forEach(function (token) { rightSeen[token] = true; });
    Object.keys(leftSeen).forEach(function (token) { if (rightSeen[token]) intersection += 1; });
    union = Object.keys(leftSeen).length + Object.keys(rightSeen).length - intersection;
    return union ? intersection / union : 0;
  }
  function characterOverlap(left, right) {
    var leftChars = normalizeHanzi(left).split(''), rightChars = normalizeHanzi(right).split('');
    var seen = Object.create(null), intersection = 0;
    leftChars.forEach(function (character) { seen[character] = true; });
    rightChars.forEach(function (character) {
      if (seen[character]) {
        intersection += 1;
        delete seen[character];
      }
    });
    return Math.max(leftChars.length, rightChars.length) ? intersection / Math.max(leftChars.length, rightChars.length) : 0;
  }

  function targetIndex(canonicalVocabulary) {
    var output = asArray(canonicalVocabulary).map(function (item) {
      return {
        id: text(item && item.id),
        simplified: text(item && item.simplified),
        traditional: text(item && item.traditional),
        pinyin: text(item && (item.pinyin || item.pinyinTone || item.pinyinNormalized)),
        meaningVi: text(item && item.meaningVi)
      };
    }).filter(function (item) { return item.id && item.simplified; });
    output.sort(function (left, right) { return left.id.localeCompare(right.id); });
    return output;
  }

  function candidateSuggestions(mapping, targets, limit) {
    var byId = Object.create(null);
    var direct = Object.create(null);
    asArray(mapping.candidates).forEach(function (id) { direct[text(id)] = true; });

    function add(target, score, evidence, kind) {
      if (!target || !target.id || score <= 0) return;
      var existing = byId[target.id];
      if (!existing) {
        existing = byId[target.id] = {
          canonicalVocabularyId: target.id,
          simplified: target.simplified,
          pinyin: target.pinyin,
          meaningVi: target.meaningVi,
          score: 0,
          evidence: [],
          kind: kind || 'suggestion'
        };
      }
      existing.score = Math.max(existing.score, Math.round(score * 100) / 100);
      asArray(evidence).forEach(function (reason) {
        if (existing.evidence.indexOf(reason) < 0) existing.evidence.push(reason);
      });
      if (kind === 'mapping-engine-candidate') existing.kind = kind;
    }

    targets.forEach(function (target) {
      var sourceHanzi = normalizeHanzi(mapping.simplified);
      var targetHanzi = normalizeHanzi(target.simplified);
      var sourcePinyin = normalizeLatin(mapping.pinyin);
      var targetPinyin = normalizeLatin(target.pinyin);
      var score = 0, evidence = [], overlap, ratio, meaningRatio = 0;

      if (direct[target.id]) add(target, 100, ['mapping-engine-candidate'], 'mapping-engine-candidate');
      if (sourceHanzi && sourceHanzi === targetHanzi) {
        score += 90;
        evidence.push('hanzi-exact');
      } else if (sourceHanzi && targetHanzi && (sourceHanzi.indexOf(targetHanzi) >= 0 || targetHanzi.indexOf(sourceHanzi) >= 0)) {
        ratio = Math.min(sourceHanzi.length, targetHanzi.length) / Math.max(sourceHanzi.length, targetHanzi.length);
        score += 30 * ratio;
        evidence.push('hanzi-contained');
      } else {
        overlap = characterOverlap(sourceHanzi, targetHanzi);
        if (overlap >= 0.5) {
          score += 20 * overlap;
          evidence.push('hanzi-overlap');
        }
      }
      if (sourcePinyin && sourcePinyin === targetPinyin) {
        score += 45;
        evidence.push('pinyin-exact');
      } else if (sourcePinyin && targetPinyin && (sourcePinyin.indexOf(targetPinyin) === 0 || targetPinyin.indexOf(sourcePinyin) === 0)) {
        score += 15;
        evidence.push('pinyin-prefix');
      }
      meaningRatio = meaningOverlap(mapping.meaningVi, target.meaningVi);
      if (meaningRatio > 0) {
        score += 60 * meaningRatio;
        evidence.push('meaning-overlap');
      }
      if (score >= 20 && (evidence.length > 1 || evidence[0] !== 'meaning-overlap' || meaningRatio >= 0.5)) {
        add(target, score, evidence, 'suggestion');
      }
    });

    return Object.keys(byId).map(function (id) { return byId[id]; }).sort(function (left, right) {
      return right.score - left.score || left.canonicalVocabularyId.localeCompare(right.canonicalVocabularyId);
    }).slice(0, limit);
  }

  function createReviewQueue(options) {
    options = options || {};
    var report = options.mappingReport;
    if (!report || !report.summary || !Array.isArray(report.mappings)) throw new Error('A deterministic mapping report is required.');
    var targets = targetIndex(options.canonicalVocabulary);
    var limit = Math.max(1, Math.min(10, Number(options.candidateLimit || 5)));
    var items = report.mappings.filter(function (mapping) {
      return mapping && (mapping.status === 'ambiguous' || mapping.status === 'unmatched');
    }).map(function (mapping) {
      return {
        reviewId: 'review-' + text(mapping.legacyVocabularyId),
        legacyVocabularyId: text(mapping.legacyVocabularyId),
        legacyLessonId: text(mapping.legacyLessonId),
        simplified: text(mapping.simplified),
        pinyin: text(mapping.pinyin),
        meaningVi: text(mapping.meaningVi),
        mappingStatus: text(mapping.status),
        mappingRule: text(mapping.mappingRule),
        candidates: candidateSuggestions(mapping, targets, limit),
        requiresHumanDecision: true
      };
    });
    items.sort(function (left, right) { return left.reviewId.localeCompare(right.reviewId); });
    var duplicateTargets = clone(asArray(report.duplicateTargets));
    duplicateTargets.sort(function (left, right) {
      return text(left && left.canonicalVocabularyId).localeCompare(text(right && right.canonicalVocabularyId));
    });
    var summary = {
      total: items.length,
      ambiguous: items.filter(function (item) { return item.mappingStatus === 'ambiguous'; }).length,
      unmatched: items.filter(function (item) { return item.mappingStatus === 'unmatched'; }).length,
      withSuggestions: items.filter(function (item) { return item.candidates.length > 0; }).length,
      withoutSuggestions: items.filter(function (item) { return item.candidates.length === 0; }).length,
      duplicateTargets: duplicateTargets.length,
      reviewed: 0,
      unresolved: items.length,
      productionBlocked: true
    };
    var queue = {
      schemaVersion: SCHEMA_VERSION,
      mode: REVIEW_MODE,
      writesPerformed: false,
      apiWrites: 0,
      storageWrites: 0,
      canonicalVocabularyCount: targets.length,
      sourceSummary: clone(report.summary),
      summary: summary,
      items: items,
      duplicateTargets: duplicateTargets
    };
    queue.deterministicSignature = hash(stableStringify({ items: items, duplicateTargets: duplicateTargets, sourceSummary: queue.sourceSummary }));
    return freeze(queue);
  }

  function createReviewSession(queue) {
    if (!queue || queue.mode !== REVIEW_MODE || !Array.isArray(queue.items)) throw new Error('A valid in-memory review queue is required.');
    var source = clone(queue);
    var decisions = Object.create(null);

    function itemById(reviewId) {
      return source.items.find(function (item) { return item.reviewId === reviewId; }) || null;
    }
    function summary() {
      var values = Object.keys(decisions).sort().map(function (id) { return decisions[id]; });
      var reviewed = values.length;
      return {
        total: source.items.length,
        approvedMappings: values.filter(function (decision) { return decision.decision === 'map'; }).length,
        keptUnmatched: values.filter(function (decision) { return decision.decision === 'keep-unmatched'; }).length,
        reviewed: reviewed,
        unresolved: source.items.length - reviewed,
        productionBlocked: true,
        writesPerformed: false,
        apiWrites: 0,
        storageWrites: 0
      };
    }
    function recordDecision(reviewId, input) {
      input = input || {};
      var item = itemById(text(reviewId));
      var decision = text(input.decision);
      var reviewer = text(input.reviewer);
      var note = text(input.note);
      var targetId = text(input.canonicalVocabularyId) || null;
      if (!item) throw new Error('Unknown review item.');
      if (decision !== 'map' && decision !== 'keep-unmatched') throw new Error('Review decision must be map or keep-unmatched.');
      if (!reviewer) throw new Error('Reviewer identity is required.');
      if (!note) throw new Error('A human review note is required.');
      if (decision === 'map') {
        if (!targetId || !item.candidates.some(function (candidate) { return candidate.canonicalVocabularyId === targetId; })) {
          throw new Error('Mapped target must be an explicit review candidate.');
        }
        Object.keys(decisions).forEach(function (id) {
          var existing = decisions[id];
          if (id !== item.reviewId && existing.decision === 'map' && existing.canonicalVocabularyId === targetId) {
            throw new Error('Duplicate reviewed canonical target is not allowed.');
          }
        });
      } else {
        targetId = null;
      }
      decisions[item.reviewId] = {
        reviewId: item.reviewId,
        legacyVocabularyId: item.legacyVocabularyId,
        decision: decision,
        canonicalVocabularyId: targetId,
        reviewer: reviewer,
        note: note,
        mode: REVIEW_MODE,
        applied: false
      };
      return exportManifest();
    }
    function exportManifest() {
      var values = Object.keys(decisions).sort().map(function (id) { return clone(decisions[id]); });
      var manifest = {
        schemaVersion: SCHEMA_VERSION,
        mode: REVIEW_MODE,
        queueSignature: source.deterministicSignature,
        summary: summary(),
        decisions: values,
        unresolvedReviewIds: source.items.map(function (item) { return item.reviewId; }).filter(function (id) { return !decisions[id]; }),
        writesPerformed: false,
        apiWrites: 0,
        storageWrites: 0,
        appliedToMapping: false
      };
      manifest.deterministicSignature = hash(stableStringify({ queue: manifest.queueSignature, decisions: values }));
      return freeze(manifest);
    }
    function reset() {
      decisions = Object.create(null);
      return exportManifest();
    }

    return Object.freeze({
      recordDecision: recordDecision,
      exportManifest: exportManifest,
      reset: reset,
      getQueue: function () { return freeze(clone(source)); }
    });
  }

  return Object.freeze({
    SCHEMA_VERSION: SCHEMA_VERSION,
    REVIEW_MODE: REVIEW_MODE,
    stableStringify: stableStringify,
    createReviewQueue: createReviewQueue,
    createReviewSession: createReviewSession
  });
});
