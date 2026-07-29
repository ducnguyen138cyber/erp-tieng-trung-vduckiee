(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.VDuckieHskProgressMigration = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var DRY_RUN_ONLY = true;

  function clone(value) { return JSON.parse(JSON.stringify(value == null ? null : value)); }
  function text(value) { return String(value == null ? '' : value).trim(); }
  function normalizeHanzi(value) { return text(value).replace(/[\s，。！？、,.!?；;：:（）()【】\[\]"“”'‘’·]/g, ''); }
  function normalizeLatin(value) {
    var output = text(value).toLowerCase();
    if (output.normalize) output = output.normalize('NFD');
    return output.replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/ü/g, 'v').replace(/[^a-z0-9]/g, '');
  }
  function normalizeMeaning(value) {
    var output = text(value).toLowerCase();
    if (output.normalize) output = output.normalize('NFD');
    return output.replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
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
    for (var i = 0; i < value.length; i++) {
      result ^= value.charCodeAt(i);
      result += (result << 1) + (result << 4) + (result << 7) + (result << 8) + (result << 24);
    }
    return (result >>> 0).toString(36);
  }
  function ratio(part, total) { return total ? Math.round((part / total) * 10000) / 100 : 0; }
  function asArray(value) { return Array.isArray(value) ? value : []; }

  function inventoryLegacyVocabulary(lessons) {
    var output = [];
    asArray(lessons).forEach(function (lesson) {
      var occurrences = Object.create(null);
      asArray(lesson && lesson.words).forEach(function (word) {
        if (!Array.isArray(word) || !text(word[0])) return;
        var signature = [normalizeHanzi(word[0]), normalizeLatin(word[1]), normalizeMeaning(word[2])].join('|');
        occurrences[signature] = (occurrences[signature] || 0) + 1;
        output.push({
          legacyVocabularyId: 'legacy-' + hash(text(lesson.id) + '|' + signature + '|' + occurrences[signature]),
          legacyLessonId: text(lesson.id),
          simplified: text(word[0]),
          pinyin: text(word[1]),
          meaningVi: text(word[2]),
          sourceSignature: signature
        });
      });
    });
    return output.sort(function (a, b) {
      return a.legacyLessonId.localeCompare(b.legacyLessonId) || a.legacyVocabularyId.localeCompare(b.legacyVocabularyId);
    });
  }

  function targetIndex(canonicalVocabulary) {
    var targets = asArray(canonicalVocabulary).map(function (item) {
      return {
        id: text(item.id),
        simplified: text(item.simplified),
        traditional: text(item.traditional),
        pinyin: text(item.pinyin || item.pinyinTone || item.pinyinNormalized),
        meaningVi: text(item.meaningVi),
        hanzi: normalizeHanzi(item.simplified),
        traditionalNormalized: normalizeHanzi(item.traditional),
        pinyinNormalized: normalizeLatin(item.pinyinNormalized || item.pinyin || item.pinyinTone),
        meaningNormalized: normalizeMeaning(item.meaningVi)
      };
    }).filter(function (item) { return item.id && item.hanzi; });
    targets.sort(function (a, b) { return a.id.localeCompare(b.id); });
    return targets;
  }

  function meaningOverlap(left, right) {
    var leftTokens = normalizeMeaning(left).split(' ').filter(Boolean);
    var rightTokens = normalizeMeaning(right).split(' ').filter(Boolean);
    if (!leftTokens.length || !rightTokens.length) return 0;
    var seen = Object.create(null), intersection = 0;
    leftTokens.forEach(function (token) { seen[token] = true; });
    rightTokens.forEach(function (token) { if (seen[token]) intersection += 1; });
    return intersection / Math.max(leftTokens.length, rightTokens.length);
  }

  function classifyLegacyItem(legacy, targets) {
    var hanzi = normalizeHanzi(legacy.simplified);
    var pinyin = normalizeLatin(legacy.pinyin);
    var exact = targets.filter(function (target) { return target.simplified === legacy.simplified; });
    if (exact.length === 1) return { status: 'exact', target: exact[0], candidates: exact, rule: 'simplified-exact' };
    if (exact.length > 1) return { status: 'ambiguous', target: null, candidates: exact, rule: 'simplified-exact-multiple' };

    var normalizedHanzi = targets.filter(function (target) {
      return target.hanzi === hanzi || (target.traditionalNormalized && target.traditionalNormalized === hanzi);
    });
    if (pinyin && normalizedHanzi.length > 1) {
      normalizedHanzi = normalizedHanzi.filter(function (target) { return target.pinyinNormalized === pinyin; });
    }
    if (normalizedHanzi.length === 1) return { status: 'normalized', target: normalizedHanzi[0], candidates: normalizedHanzi, rule: 'hanzi-traditional-or-normalized' };
    if (normalizedHanzi.length > 1) return { status: 'ambiguous', target: null, candidates: normalizedHanzi, rule: 'hanzi-normalized-multiple' };

    var semantic = targets.filter(function (target) {
      return pinyin && target.pinyinNormalized === pinyin && meaningOverlap(legacy.meaningVi, target.meaningVi) >= 0.5;
    });
    if (semantic.length === 1) return { status: 'normalized', target: semantic[0], candidates: semantic, rule: 'pinyin-and-meaning-normalized' };
    if (semantic.length > 1) return { status: 'ambiguous', target: null, candidates: semantic, rule: 'pinyin-and-meaning-multiple' };
    return { status: 'unmatched', target: null, candidates: [], rule: 'no-deterministic-match' };
  }

  function lessonByVocabulary(canonicalLessons) {
    var output = Object.create(null);
    asArray(canonicalLessons).forEach(function (lesson) {
      asArray(lesson && lesson.words).forEach(function (word) {
        var id = Array.isArray(word) ? text(word[6]) : '';
        if (id && output[id]) throw new Error('Canonical vocabulary ID is assigned to multiple preview lessons: ' + id);
        if (id) output[id] = text(lesson.id);
      });
    });
    return output;
  }

  function buildMappingReport(options) {
    options = options || {};
    var legacyItems = inventoryLegacyVocabulary(options.legacyLessons);
    var targets = targetIndex(options.canonicalVocabulary);
    var lessonLookup = lessonByVocabulary(options.canonicalLessons);
    var mappings = legacyItems.map(function (legacy) {
      var classified = classifyLegacyItem(legacy, targets);
      return {
        legacyVocabularyId: legacy.legacyVocabularyId,
        legacyLessonId: legacy.legacyLessonId,
        simplified: legacy.simplified,
        pinyin: legacy.pinyin,
        meaningVi: legacy.meaningVi,
        status: classified.status,
        canonicalVocabularyId: classified.target ? classified.target.id : null,
        canonicalLessonId: classified.target ? (lessonLookup[classified.target.id] || null) : null,
        mappingRule: classified.rule,
        candidates: classified.candidates.map(function (item) { return item.id; })
      };
    });
    var targetUsage = Object.create(null);
    mappings.forEach(function (item) {
      if (!item.canonicalVocabularyId) return;
      targetUsage[item.canonicalVocabularyId] = targetUsage[item.canonicalVocabularyId] || [];
      targetUsage[item.canonicalVocabularyId].push(item.legacyVocabularyId);
    });
    var duplicateTargets = Object.keys(targetUsage).sort().filter(function (id) { return targetUsage[id].length > 1; }).map(function (id) {
      return { canonicalVocabularyId: id, legacyVocabularyIds: targetUsage[id].slice().sort() };
    });
    var summary = {
      totalLegacyItems: mappings.length,
      exactMapped: mappings.filter(function (item) { return item.status === 'exact'; }).length,
      normalizedMapped: mappings.filter(function (item) { return item.status === 'normalized'; }).length,
      ambiguous: mappings.filter(function (item) { return item.status === 'ambiguous'; }).length,
      unmatched: mappings.filter(function (item) { return item.status === 'unmatched'; }).length,
      duplicateTargets: duplicateTargets.length
    };
    summary.mapped = summary.exactMapped + summary.normalizedMapped;
    summary.coveragePercent = ratio(summary.mapped, summary.totalLegacyItems);
    return {
      schemaVersion: '1.0.0',
      generatedMode: 'deterministic-dry-run',
      summary: summary,
      mappings: mappings,
      duplicateTargets: duplicateTargets,
      lessonMapping: {
        status: 'not-migrated',
        reason: 'Legacy V75 lesson completion is not semantically equivalent to canonical 20-word preview lessons.'
      }
    };
  }

  function readKnownSavedRows(wordRows) {
    return asArray(wordRows).filter(function (row) {
      return row && text(row.word_key || row.hanzi) && (row.is_known === true || row.is_saved === true);
    }).map(function (row) {
      return {
        key: text(row.word_key || row.hanzi),
        hanzi: text(row.hanzi || row.word_key),
        pinyin: text(row.pinyin),
        meaningVi: text(row.meaning_vi || row.meaningVi),
        learned: row.is_known === true,
        saved: row.is_saved === true,
        knownUpdatedAt: row.known_updated_at || null,
        savedUpdatedAt: row.saved_updated_at || null
      };
    }).sort(function (left, right) {
      return left.key.localeCompare(right.key) ||
        left.hanzi.localeCompare(right.hanzi) ||
        left.pinyin.localeCompare(right.pinyin);
    });
  }

  function latestTime(left, right) {
    var leftTime = Date.parse(left || '') || Number(left || 0) || 0;
    var rightTime = Date.parse(right || '') || Number(right || 0) || 0;
    return Math.max(leftTime, rightTime) || null;
  }

  function runDryRun(options) {
    options = options || {};
    if (DRY_RUN_ONLY !== true) throw new Error('Progress migration guard is not locked to dry-run.');
    var contract = options.contractApi;
    if (!contract || typeof contract.createProgressRecord !== 'function') throw new Error('Canonical progress contract is unavailable.');
    var report = options.mappingReport || buildMappingReport(options);
    var mappingByHanzi = Object.create(null);
    report.mappings.forEach(function (mapping) {
      var key = normalizeHanzi(mapping.simplified);
      mappingByHanzi[key] = mappingByHanzi[key] || [];
      mappingByHanzi[key].push(mapping);
    });
    var recordsByTarget = Object.create(null);
    var skipped = [];
    var conflicts = [];
    var invalidRecords = [];
    var rows = readKnownSavedRows(options.wordRows);

    rows.forEach(function (row) {
      var candidates = mappingByHanzi[normalizeHanzi(row.hanzi)] || [];
      var mapped = candidates.filter(function (item) { return item.status === 'exact' || item.status === 'normalized'; });
      if (mapped.length !== 1 || !mapped[0].canonicalVocabularyId) {
        skipped.push({ sourceKey: row.key, reason: mapped.length > 1 ? 'ambiguous-progress-source' : 'unmatched-progress-source' });
        return;
      }
      var mapping = mapped[0];
      var targetId = mapping.canonicalVocabularyId;
      var existing = recordsByTarget[targetId];
      if (existing && (existing.learned !== row.learned || existing.saved !== row.saved)) {
        conflicts.push({ canonicalVocabularyId: targetId, sourceKeys: [existing.sourceKey, row.key].sort(), reason: 'duplicate-source-state-conflict' });
      }
      var merged = {
        sourceKey: existing ? existing.sourceKey + ',' + row.key : row.key,
        learned: Boolean((existing && existing.learned) || row.learned),
        saved: Boolean((existing && existing.saved) || row.saved),
        updatedAt: latestTime(existing && existing.updatedAt, latestTime(row.knownUpdatedAt, row.savedUpdatedAt))
      };
      try {
        recordsByTarget[targetId] = Object.assign(merged, {
          record: contract.createProgressRecord({
            ownerKey: text(options.ownerKey) || 'guest',
            lessonId: mapping.canonicalLessonId,
            vocabularyId: targetId,
            learned: merged.learned,
            saved: merged.saved,
            mastered: false,
            quizAttempts: 0,
            quizCorrect: 0,
            dictationAttempts: 0,
            dictationCorrect: 0,
            completion: false,
            updatedAt: merged.updatedAt,
            lastSeenAt: merged.updatedAt,
            source: 'legacy-user-words-dry-run',
            migration: {
              legacyLessonId: mapping.legacyLessonId,
              legacyVocabularyId: mapping.legacyVocabularyId,
              mappingStatus: mapping.status,
              mappingRule: mapping.mappingRule
            }
          })
        });
      } catch (error) {
        invalidRecords.push({ sourceKey: row.key, canonicalVocabularyId: targetId, error: error && error.message || String(error) });
      }
    });

    var completed = options.completed && typeof options.completed === 'object' ? options.completed : {};
    Object.keys(completed).sort().forEach(function (lessonId) {
      if (completed[lessonId]) skipped.push({ sourceKey: lessonId, reason: 'legacy-lesson-completion-not-migrated' });
    });
    report.duplicateTargets.forEach(function (duplicate) {
      conflicts.push({ canonicalVocabularyId: duplicate.canonicalVocabularyId, sourceKeys: duplicate.legacyVocabularyIds, reason: 'duplicate-target-mapping' });
    });

    var records = Object.keys(recordsByTarget).sort().map(function (id) { return recordsByTarget[id].record; });
    return {
      schemaVersion: '1.0.0',
      mode: 'dry-run',
      guard: 'writes-disabled-hard-coded',
      writesPerformed: false,
      apiWrites: 0,
      canonicalStorageWrites: 0,
      mappingSummary: clone(report.summary),
      previewRecords: records,
      skipped: skipped,
      ambiguous: report.mappings.filter(function (item) { return item.status === 'ambiguous'; }),
      unmatched: report.mappings.filter(function (item) { return item.status === 'unmatched'; }),
      conflicts: conflicts,
      invalidRecords: invalidRecords,
      notMigrated: ['legacyLessonCompletion', 'mastered', 'completion', 'xp', 'leaderboard', 'streak', 'selectedLevel', 'selectedLesson'],
      deterministicSignature: hash(stableStringify({ records: records, skipped: skipped, conflicts: conflicts, invalidRecords: invalidRecords }))
    };
  }

  return Object.freeze({
    DRY_RUN_ONLY: DRY_RUN_ONLY,
    stableStringify: stableStringify,
    inventoryLegacyVocabulary: inventoryLegacyVocabulary,
    buildMappingReport: buildMappingReport,
    runDryRun: runDryRun
  });
});
