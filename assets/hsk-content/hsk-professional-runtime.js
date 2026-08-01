(function (root, factory) {
  'use strict';
  var api = factory(root || {});
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.VDuckieHskProfessionalRuntime = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  var COURSE_CONFIG = Object.freeze({
    1: Object.freeze({ base: './data/hsk/hsk1/', phase: 'C2', label: '10 unit · 24 bài · C2' }),
    2: Object.freeze({ base: './data/hsk/hsk2/', phase: 'C3', label: '10 unit · 28 bài · C3' })
  });
  var SUPPORT_GLOSSES = Object.freeze({
    '不喜欢': 'không thích',
    '不能': 'không thể',
    '吃饭': 'ăn cơm; ăn',
    '回家': 'về nhà',
    '杯': 'cốc; ly; lượng từ cho đồ uống',
    '看电影': 'xem phim',
    '越南': 'Việt Nam',
    '面条': 'mì sợi'
  });
  var state = {
    status: 'idle',
    error: null,
    data: null,
    courseCache: Object.create(null),
    selectedLevel: 1,
    selectedLessonId: null,
    selectedAssessmentId: null,
    mounted: false,
    readOnly: true
  };
  var listenersBound = false;
  var introObserver = null;

  function text(value) { return String(value == null ? '' : value).trim(); }
  function esc(value) {
    return text(value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }
  function attr(value) { return esc(value).replace(/`/g, '&#96;'); }
  function byId(id) { return root.document && root.document.getElementById ? root.document.getElementById(id) : null; }
  function array(value) { return Array.isArray(value) ? value : []; }
  function mapBy(records, field) {
    var result = Object.create(null);
    array(records).forEach(function (record) { if (record && record[field] != null) result[String(record[field])] = record; });
    return result;
  }
  function normalizeAnswer(value) {
    var output = text(value).toLowerCase();
    if (output.normalize) output = output.normalize('NFC');
    return output.replace(/[\s，。！？、,.!?;；:：'“”"‘’（）()\-]/g, '');
  }
  function pinyinFor(value) {
    var zh = text(value);
    if (!zh) return '';
    try {
      if (root.pinyinPro && typeof root.pinyinPro.pinyin === 'function') {
        return root.pinyinPro.pinyin(zh, { toneType: 'symbol', type: 'string' });
      }
    } catch (error) {}
    return '';
  }
  function speak(value, rate) {
    var zh = text(value);
    if (!zh || !root.speechSynthesis || typeof root.SpeechSynthesisUtterance !== 'function') return false;
    try {
      root.speechSynthesis.cancel();
      var utterance = new root.SpeechSynthesisUtterance(zh);
      utterance.lang = 'zh-CN';
      utterance.rate = Number(rate || 0.72);
      root.speechSynthesis.speak(utterance);
      return true;
    } catch (error) { return false; }
  }

  function fetchJson(path) {
    if (typeof root.fetch !== 'function') return Promise.reject(new Error('Trình duyệt không hỗ trợ fetch.'));
    return root.fetch(path, { cache: 'no-store' }).then(function (response) {
      if (!response || !response.ok) throw new Error('Không tải được ' + path + ' (HTTP ' + (response && response.status || '?') + ').');
      return response.json();
    });
  }
  function loadIndexedCollection(indexPath, expectedType) {
    return fetchJson(indexPath).then(function (index) {
      var slash = indexPath.lastIndexOf('/');
      var dir = slash >= 0 ? indexPath.slice(0, slash + 1) : '';
      return Promise.all(array(index.shards).map(function (shard) {
        return fetchJson(dir + shard.file).then(function (collection) {
          if (collection.collectionType !== expectedType) throw new Error('Sai collection type tại ' + shard.file + '.');
          return array(collection.records);
        });
      })).then(function (parts) {
        var records = [];
        parts.forEach(function (part) { records = records.concat(part); });
        if (Number(index.expectedCount || records.length) !== records.length) throw new Error('Sai số lượng ' + expectedType + ': ' + records.length + '.');
        return records;
      });
    });
  }

  function verifyCourse(manifest, units, lessons, grammar, characters, exercises, assessments, enrichment, vocabulary, expectedLevel) {
    expectedLevel = Number(expectedLevel || (manifest && manifest.level));
    var config = COURSE_CONFIG[expectedLevel];
    if (!config || !manifest || Number(manifest.level) !== Number(expectedLevel) || manifest.phase !== config.phase) throw new Error('HSK' + expectedLevel + ' course manifest ' + (config && config.phase || '') + ' không hợp lệ.');
    if (manifest.writesProgress !== false || manifest.readOnly !== true || manifest.productionEnabled !== false) throw new Error('HSK' + expectedLevel + ' phải giữ read-only và production lock.');
    var collections = manifest.collections || {};
    var checks = [
      ['units', units], ['lessons', lessons], ['grammar', grammar], ['characters', characters], ['exercises', exercises], ['assessments', assessments]
    ];
    checks.forEach(function (item) {
      var expected = collections[item[0]] && Number(collections[item[0]].count);
      if (expected && item[1].length !== expected) throw new Error('Sai số lượng ' + item[0] + ': cần ' + expected + ', nhận ' + item[1].length + '.');
    });
    if (collections.vocabularyEnrichment && enrichment.length !== Number(collections.vocabularyEnrichment.count)) throw new Error('Sai số lượng vocabulary enrichment.');
    var expectedVocabulary = collections.vocabulary && Number(collections.vocabulary.count);
    if (!expectedVocabulary) expectedVocabulary = Number(expectedLevel) === 1 ? 300 : 200;
    if (vocabulary.length !== expectedVocabulary) throw new Error('Canonical HSK' + expectedLevel + ' vocabulary phải có ' + expectedVocabulary + ' record.');
  }

  function loadCourse(level) {
    level = Number(level || state.selectedLevel || 1);
    var config = COURSE_CONFIG[level];
    if (!config) return Promise.reject(new Error('HSK' + level + ' chưa có learner course.'));
    if (state.courseCache[level]) {
      state.data = state.courseCache[level];
      state.selectedLevel = level;
      state.status = 'ready';
      state.error = null;
      return Promise.resolve(state.data);
    }
    state.status = 'loading';
    state.error = null;
    var base = config.base;
    return Promise.all([
      fetchJson(base + 'course-manifest.json'),
      fetchJson(base + 'units.json'),
      fetchJson(base + 'lessons.json'),
      fetchJson(base + 'grammar.json'),
      fetchJson(base + 'characters.json'),
      fetchJson(base + 'exercises.json'),
      fetchJson(base + 'assessments.json'),
      fetchJson(base + 'vocabulary-enrichment.json'),
      loadIndexedCollection(base + 'vocabulary/index.json', 'vocabulary')
    ]).then(function (parts) {
      var manifest = parts[0];
      var units = array(parts[1].records);
      var lessons = array(parts[2].records);
      var grammar = array(parts[3].records);
      var characters = array(parts[4].records);
      var exercises = array(parts[5].records);
      var assessments = array(parts[6].records);
      var enrichment = array(parts[7].entries);
      var vocabulary = parts[8];
      verifyCourse(manifest, units, lessons, grammar, characters, exercises, assessments, enrichment, vocabulary, level);
      var data = {
        manifest: manifest,
        units: units.slice().sort(function (a, b) { return Number(a.order) - Number(b.order); }),
        lessons: lessons,
        grammar: grammar,
        characters: characters,
        exercises: exercises,
        assessments: assessments,
        enrichment: enrichment,
        vocabulary: vocabulary,
        lessonById: mapBy(lessons, 'id'),
        grammarById: mapBy(grammar, 'id'),
        characterById: mapBy(characters, 'id'),
        exerciseById: mapBy(exercises, 'id'),
        assessmentById: mapBy(assessments, 'id'),
        vocabularyById: mapBy(vocabulary, 'id'),
        vocabularyBySimplified: mapBy(vocabulary, 'simplified'),
        enrichmentById: mapBy(enrichment, 'canonicalId'),
        enrichmentBySimplified: mapBy(enrichment, 'simplified')
      };
      state.courseCache[level] = data;
      state.data = data;
      state.selectedLevel = level;
      state.status = 'ready';
      return data;
    }).catch(function (error) {
      state.status = 'error';
      state.error = error;
      throw error;
    });
  }

  function resolveFocusWord(data, focus) {
    focus = focus || {};
    var canonicalId = text(focus.canonicalId || (focus.canonicalLookup && focus.canonicalLookup.field === 'id' && focus.canonicalLookup.value));
    var simplified = text(focus.simplified || (focus.canonicalLookup && focus.canonicalLookup.field !== 'id' && focus.canonicalLookup.value));
    var canonical = canonicalId && data && data.vocabularyById ? data.vocabularyById[canonicalId] : null;
    if (!canonical) canonical = data && data.vocabularyBySimplified && data.vocabularyBySimplified[simplified];
    if (canonical && !simplified) simplified = canonical.simplified;
    var enrichment = canonicalId && data && data.enrichmentById ? data.enrichmentById[canonicalId] : null;
    if (!enrichment) enrichment = data && data.enrichmentBySimplified && data.enrichmentBySimplified[simplified];
    var collocations = array(focus.collocations).length ? focus.collocations : array(enrichment && enrichment.collocations);
    var commonErrors = array(focus.commonErrorsVi).length ? focus.commonErrorsVi : array(enrichment && enrichment.commonErrorsVi);
    return {
      simplified: simplified,
      pinyin: canonical ? canonical.pinyin : pinyinFor(simplified),
      meaningVi: canonical ? canonical.meaningVi : (SUPPORT_GLOSSES[simplified] || 'Cụm hỗ trợ — học theo ngữ cảnh trong bài'),
      partOfSpeech: canonical ? array(canonical.partOfSpeech) : [],
      measureWord: text(canonical && canonical.measureWord || enrichment && enrichment.measureWord),
      usageNoteVi: text(canonical && canonical.usageNoteVi || enrichment && enrichment.usageNoteVi),
      confusables: array(canonical && canonical.confusables).length ? canonical.confusables : array(enrichment && enrichment.confusables),
      collocations: collocations,
      commonErrorsVi: commonErrors,
      lexicalStatus: focus.lexicalStatus || (canonical ? 'canonical' : 'support-only'),
      supportReason: text(focus.supportReason),
      assessmentEligible: focus.assessmentEligible !== false
    };
  }

  function list(items, className) {
    if (!array(items).length) return '';
    return '<ul class="' + (className || 'hsk-pro-list') + '">' + items.map(function (item) { return '<li>' + esc(item) + '</li>'; }).join('') + '</ul>';
  }
  function sectionCard(title, body, extraClass) {
    return '<section class="hsk-pro-section ' + (extraClass || '') + '"><h4>' + esc(title) + '</h4>' + body + '</section>';
  }
  function speakButton(zh, label) {
    if (!text(zh)) return '';
    return '<button type="button" class="hsk-pro-inline-button" data-pro-speak="' + attr(zh) + '">🔊 ' + esc(label || 'Nghe') + '</button>';
  }

  function renderVocabulary(data, section) {
    var words = array(section.content && section.content.focusWords).map(function (focus) { return resolveFocusWord(data, focus); });
    var html = '<p class="hsk-pro-help">' + esc(section.content && section.content.instructionVi || 'Học từ theo cụm và câu.') + '</p><div class="hsk-pro-vocab-grid">';
    html += words.map(function (word) {
      var status = word.lexicalStatus === 'canonical' ? 'HSK' + data.manifest.level + ' canonical' : 'Từ/cụm hỗ trợ';
      return '<article class="hsk-pro-vocab-card"><div class="hsk-pro-vocab-head"><div><strong class="hsk-pro-hanzi">' + esc(word.simplified) + '</strong><span class="hsk-pro-pinyin">' + esc(word.pinyin) + '</span></div>' + speakButton(word.simplified, 'Nghe') + '</div>' +
        '<p class="hsk-pro-meaning">' + esc(word.meaningVi) + '</p>' +
        (word.partOfSpeech.length ? '<small>' + esc(word.partOfSpeech.join(', ')) + '</small>' : '') +
        '<span class="hsk-pro-status">' + esc(status) + '</span>' +
        (word.measureWord && word.measureWord !== '—' ? '<p class="hsk-pro-note"><b>Lượng từ khi đếm:</b> ' + esc(word.measureWord) + '</p>' : '') +
        (word.usageNoteVi ? '<p class="hsk-pro-note"><b>Cách dùng:</b> ' + esc(word.usageNoteVi) + '</p>' : '') +
        (word.confusables.length ? '<p class="hsk-pro-note"><b>Dễ nhầm:</b> ' + esc(word.confusables.join(' · ')) + '</p>' : '') +
        (word.collocations.length ? '<div class="hsk-pro-mini"><b>Mẫu dùng tự nhiên</b>' + word.collocations.map(function (c) { return '<p><span lang="zh-CN">' + esc(c.zh) + '</span> — ' + esc(c.vi) + '</p>'; }).join('') + '</div>' : '') +
        (word.commonErrorsVi.length ? '<div class="hsk-pro-warning"><b>Lỗi dễ mắc</b>' + list(word.commonErrorsVi) + '</div>' : '') +
        (word.supportReason ? '<p class="hsk-pro-note">' + esc(word.supportReason) + '</p>' : '') +
      '</article>';
    }).join('') + '</div>';
    return sectionCard(section.titleVi || 'Từ vựng', html, 'hsk-pro-section-vocab');
  }

  function renderCharacters(data, section) {
    var refs = array(section.content && section.content.characterRefs);
    var cards = refs.map(function (id) {
      var item = data.characterById[id];
      if (!item) return '';
      return '<article class="hsk-pro-character"><strong>' + esc(item.character) + '</strong><span>' + esc(array(item.readings).join(' / ')) + '</span><p>Bộ: <b>' + esc(item.radical || '—') + '</b></p>' +
        (item.structure ? '<p>Cấu trúc: ' + esc(item.structure) + '</p>' : '') + (item.strokeCount ? '<p>Số nét: ' + esc(item.strokeCount) + '</p>' : '') +
        (array(item.components).length ? '<p>Thành phần: ' + esc(item.components.join(' · ')) + '</p>' : '') +
        (array(item.confusables).length ? '<p>Dễ nhầm: ' + esc(item.confusables.join(' · ')) + '</p>' : '') +
        (item.mnemonic && item.mnemonic.noteVi ? '<p class="hsk-pro-note">' + esc(item.mnemonic.noteVi) + '</p>' : '') +
        '<small>Thứ tự nét: ' + esc(item.strokeOrderStatus || 'chưa xác minh') + '</small>' + speakButton(item.character, 'Nghe chữ') + '</article>';
    }).join('');
    var note = section.content && section.content.noteVi ? '<p class="hsk-pro-note">' + esc(section.content.noteVi) + '</p>' : '';
    return sectionCard(section.titleVi || 'Chữ Hán', '<div class="hsk-pro-character-grid">' + cards + '</div>' + note);
  }

  function renderGrammar(data, section) {
    var refs = array(section.content && section.content.grammarRefs);
    var html = refs.map(function (id) {
      var g = data.grammarById[id];
      if (!g) return '';
      return '<article class="hsk-pro-grammar"><header><span lang="zh-CN">' + esc(g.nameZh) + '</span><h5>' + esc(g.nameVi) + '</h5></header>' +
        '<code>' + esc(g.formula) + '</code><p>' + esc(g.meaningVi) + '</p><p><b>Vị trí:</b> ' + esc(g.positionVi) + '</p>' +
        (array(g.usageVi).length ? '<div><b>Cách dùng</b>' + list(g.usageVi) + '</div>' : '') +
        '<div class="hsk-pro-example-grid">' + array(g.correctExamples).map(function (ex) { return '<div class="hsk-pro-example good"><span lang="zh-CN">' + esc(ex.zh) + '</span><p>' + esc(ex.vi) + '</p>' + speakButton(ex.zh, 'Nghe câu') + '</div>'; }).join('') + '</div>' +
        (array(g.incorrectExamples).length ? '<div class="hsk-pro-warning"><b>Sửa lỗi</b>' + array(g.incorrectExamples).map(function (ex) { return '<p><s lang="zh-CN">' + esc(ex.zh) + '</s><br>' + esc(ex.explanationVi) + '</p>'; }).join('') + '</div>' : '') +
        (array(g.commonErrorsVi).length ? '<div><b>Người Việt dễ mắc</b>' + list(g.commonErrorsVi) + '</div>' : '') +
      '</article>';
    }).join('');
    return sectionCard(section.titleVi || 'Ngữ pháp', html);
  }

  function renderDialogue(section) {
    var content = section.content || {};
    var zh = text(content.scriptZh);
    return sectionCard(section.titleVi || 'Hội thoại', '<div class="hsk-pro-script"><pre lang="zh-CN">' + esc(zh) + '</pre>' + speakButton(zh, 'Nghe hội thoại bằng TTS') + '</div>' + (array(content.tasks).length ? '<b>Nhiệm vụ</b>' + list(content.tasks) : ''));
  }

  function renderReading(section) {
    var content = section.content || {};
    var key = array(content.answerKey);
    var body = '<div class="hsk-pro-reading" lang="zh-CN">' + esc(content.textZh) + '</div>' + speakButton(content.textZh, 'Nghe đoạn đọc') +
      '<ol class="hsk-pro-questions">' + array(content.questionsVi).map(function (q, index) {
        var answer = key[index] || {};
        return '<li><p>' + esc(q) + '</p><button type="button" class="hsk-pro-inline-button" data-pro-toggle-answer="reading-' + index + '">Xem đáp án + bằng chứng</button><div class="hsk-pro-answer hidden" data-pro-answer-box="reading-' + index + '"><b>' + esc(answer.answerVi || answer.answer || '') + '</b>' + (answer.evidenceZh ? '<span lang="zh-CN">Bằng chứng: ' + esc(answer.evidenceZh) + '</span>' : '') + '</div></li>';
      }).join('') + '</ol>';
    return sectionCard(section.titleVi || 'Đọc hiểu', body);
  }

  function renderListening(section) {
    var content = section.content || {};
    var key = array(content.answerKey);
    var body = '<div class="hsk-pro-audio-state"><b>Audio chuẩn:</b> ' + esc(content.audioStatus || 'pending') + '<span> · Có thể dùng TTS hỗ trợ và transcript trong lúc chờ audio đã kiểm duyệt.</span></div>' +
      speakButton(content.scriptZh, 'Phát transcript bằng TTS') +
      '<button type="button" class="hsk-pro-inline-button" data-pro-toggle-transcript>Hiện/ẩn transcript</button><pre class="hsk-pro-transcript hidden" lang="zh-CN">' + esc(content.scriptZh) + '</pre>' +
      '<ol class="hsk-pro-questions">' + array(content.questionsVi).map(function (q, index) {
        var answer = key[index] || {};
        return '<li><p>' + esc(q) + '</p><button type="button" class="hsk-pro-inline-button" data-pro-toggle-answer="listening-' + index + '">Xem đáp án</button><div class="hsk-pro-answer hidden" data-pro-answer-box="listening-' + index + '"><b>' + esc(answer.answer || answer.answerVi || '') + '</b></div></li>';
      }).join('') + '</ol>';
    return sectionCard(section.titleVi || 'Nghe', body);
  }

  function renderGenericSection(section) {
    var content = section.content || {};
    var chunks = [];
    ['promptVi','successCriterionVi','coachingVi','speakingVi','writingVi','canDoVi','realWorldTaskVi','reviewPolicyVi'].forEach(function (key) {
      if (content[key]) chunks.push('<p>' + esc(content[key]) + '</p>');
    });
    ['workflow','teachingFlow','passes','selfCheck','steps','checklist','retrievalMix','tasks'].forEach(function (key) {
      if (array(content[key]).length) chunks.push('<div><b>' + esc(key.replace(/([A-Z])/g, ' $1')) + '</b>' + list(content[key]) + '</div>');
    });
    return sectionCard(section.titleVi || section.type || 'Nội dung', chunks.join(''));
  }

  function exerciseStimulus(exercise) {
    var s = exercise.stimulus || {};
    var html = '';
    if (s.scriptZh) html += '<div class="hsk-pro-stimulus"><pre lang="zh-CN">' + esc(s.scriptZh) + '</pre>' + speakButton(s.scriptZh, 'Nghe bằng TTS') + '</div>';
    if (s.textZh) html += '<div class="hsk-pro-reading" lang="zh-CN">' + esc(s.textZh) + '</div>';
    if (s.dialogueZh) html += '<div class="hsk-pro-stimulus"><pre lang="zh-CN">' + esc(s.dialogueZh) + '</pre></div>';
    if (array(s.tokens).length) html += '<div class="hsk-pro-tokens">' + s.tokens.map(function (token) { return '<span>' + esc(token) + '</span>'; }).join('') + '</div>';
    if (s.questionVi) html += '<p class="hsk-pro-help">' + esc(s.questionVi) + '</p>';
    if (s.evidenceZh) html += '<p class="hsk-pro-evidence hidden" data-pro-evidence>Gợi ý bằng chứng: <span lang="zh-CN">' + esc(s.evidenceZh) + '</span></p>';
    return html;
  }

  function renderExercise(exercise, compact) {
    if (!exercise) return '';
    var open = exercise.answer && typeof exercise.answer === 'object' && !Array.isArray(exercise.answer);
    var options = array(exercise.options);
    var input = '';
    if (options.length) {
      input = '<div class="hsk-pro-options">' + options.map(function (option, index) {
        var value = typeof option === 'object' ? (option.value != null ? option.value : option.text || option.label || JSON.stringify(option)) : option;
        return '<label><input type="radio" name="' + attr(exercise.id) + '" value="' + attr(value) + '"><span>' + esc(value) + '</span></label>';
      }).join('') + '</div>';
    } else if (!open) {
      input = '<input class="hsk-pro-answer-input" data-pro-input-for="' + attr(exercise.id) + '" autocomplete="off" placeholder="Nhập câu trả lời">';
    } else {
      input = '<textarea class="hsk-pro-answer-input" data-pro-input-for="' + attr(exercise.id) + '" rows="3" placeholder="Tự làm nhiệm vụ rồi ghi câu/ý chính của bạn ở đây"></textarea>';
    }
    var action = open ? 'Xem rubric tự đối chiếu' : 'Kiểm tra';
    return '<article class="hsk-pro-exercise' + (compact ? ' compact' : '') + '" data-pro-exercise="' + attr(exercise.id) + '"><header><span>' + esc(exercise.skill) + ' · ' + esc(exercise.format) + '</span><b>Độ khó ' + esc(exercise.difficulty) + '</b></header><p class="hsk-pro-prompt">' + esc(exercise.prompt) + '</p>' + exerciseStimulus(exercise) + input +
      '<div class="hsk-pro-exercise-actions"><button type="button" class="accent" data-pro-check="' + attr(exercise.id) + '">' + action + '</button>' + (exercise.stimulus && exercise.stimulus.evidenceZh ? '<button type="button" class="muted" data-pro-show-evidence>Gợi ý bằng chứng</button>' : '') + '</div><div class="hsk-pro-feedback hidden" data-pro-feedback="' + attr(exercise.id) + '"></div></article>';
  }

  function renderPractice(data, lesson) {
    var exercises = array(lesson.practiceRefs).map(function (id) { return data.exerciseById[id]; }).filter(Boolean);
    return sectionCard('Bài tập của lesson', '<p class="hsk-pro-help">Làm trực tiếp trên web. Kết quả chỉ tồn tại trong phiên hiện tại; VDuckie chưa ghi progress HSK.</p><div class="hsk-pro-exercises">' + exercises.map(function (exercise) { return renderExercise(exercise, false); }).join('') + '</div>', 'hsk-pro-practice');
  }

  function lessonIndex(data, id) {
    for (var i = 0; i < data.lessons.length; i++) if (data.lessons[i].id === id) return i;
    return 0;
  }
  function unitForLesson(data, lesson) {
    for (var i = 0; i < data.units.length; i++) if (data.units[i].id === lesson.unitId) return data.units[i];
    return null;
  }

  function renderLesson(data, lesson) {
    var index = lessonIndex(data, lesson.id);
    var unit = unitForLesson(data, lesson);
    var body = '<div class="hsk-pro-lesson-head"><div><span class="step">UNIT ' + esc(unit && unit.order || '') + ' · BÀI ' + (index + 1) + ' / ' + data.lessons.length + '</span><h3><span lang="zh-CN">' + esc(lesson.titleZh) + '</span><small>' + esc(lesson.titleVi) + '</small></h3><p>' + esc(lesson.topic) + ' · khoảng ' + esc(lesson.estimatedMinutes) + ' phút</p></div><span class="hsk-pro-readonly">🔒 READ-ONLY ' + esc(data.manifest.phase) + '</span></div>' +
      '<section class="hsk-pro-objectives"><b>Sau bài này bạn làm được gì?</b>' + list(lesson.objectives) + '</section>';
    array(lesson.sections).forEach(function (section) {
      if (section.type === 'vocabulary') body += renderVocabulary(data, section);
      else if (section.type === 'character') body += renderCharacters(data, section);
      else if (section.type === 'grammar') body += renderGrammar(data, section);
      else if (section.type === 'dialogue') body += renderDialogue(section);
      else if (section.type === 'reading') body += renderReading(section);
      else if (section.type === 'listening') body += renderListening(section);
      else body += renderGenericSection(section);
    });
    body += renderPractice(data, lesson);
    body += '<nav class="hsk-pro-bottom-nav">' +
      '<button type="button" class="muted" data-pro-prev ' + (index <= 0 ? 'disabled' : '') + '>← Bài trước</button>' +
      '<span>' + (index + 1) + ' / ' + data.lessons.length + '</span>' +
      '<button type="button" class="accent" data-pro-next ' + (index >= data.lessons.length - 1 ? 'disabled' : '') + '>Bài sau →</button></nav>';
    return body;
  }

  function renderAssessment(data, assessment) {
    var refs = array(assessment.exerciseRefs);
    var exercises = refs.map(function (id) { return data.exerciseById[id]; }).filter(Boolean);
    var sections = assessment.sections || {};
    var weights = assessment.skillWeights || {};
    return '<div class="hsk-pro-lesson-head"><div><span class="step">' + esc(assessment.assessmentType) + '</span><h3><span lang="zh-CN">' + esc(assessment.titleZh) + '</span><small>' + esc(assessment.titleVi) + '</small></h3></div><span class="hsk-pro-readonly">🔒 READ-ONLY</span></div>' +
      '<section class="hsk-pro-objectives"><b>Cấu trúc đánh giá</b><div class="hsk-pro-metrics">' + Object.keys(sections).map(function (key) { return '<span><strong>' + esc(sections[key]) + '</strong>' + esc(key) + '</span>'; }).join('') + '</div><p>Điểm đạt: <b>' + esc(assessment.rubric && assessment.rubric.pass) + '%</b>. ' + esc(assessment.rubric && assessment.rubric.remediation) + '</p><p>Trọng số: ' + Object.keys(weights).map(function (key) { return esc(key) + ' ' + esc(weights[key]) + '%'; }).join(' · ') + '</p></section>' +
      '<section class="hsk-pro-section hsk-pro-practice"><h4>Làm assessment</h4><p class="hsk-pro-help">Không lưu điểm lên tài khoản. Các bài nói/viết mở dùng rubric để tự đối chiếu.</p><div class="hsk-pro-exercises">' + exercises.map(function (exercise) { return renderExercise(exercise, true); }).join('') + '</div></section>';
  }

  function renderLevels(data) {
    var node = byId('hskLevels');
    if (!node) return;
    var html = '';
    for (var level = 1; level <= 9; level++) {
      var config = COURSE_CONFIG[level];
      var active = level === state.selectedLevel ? ' active' : '';
      if (config) html += '<button type="button" class="hsk-level hsk-pro-level' + active + '" data-pro-level="' + level + '"><strong>HSK ' + level + '</strong><small>' + esc(config.label) + '</small></button>';
      else html += '<button type="button" class="hsk-level hsk-pro-level locked" disabled aria-disabled="true"><strong>HSK ' + level + '</strong><small>Sắp mở</small></button>';
    }
    node.innerHTML = html;
  }

  function renderSidebar(data) {
    var progress = byId('hskProgress');
    if (progress) progress.innerHTML = '<div class="hsk-pro-sidebar-status"><strong>HSK ' + esc(data.manifest.level) + ' Professional</strong><span>' + esc(data.units.length) + ' unit · ' + esc(data.lessons.length) + ' lesson · ' + esc(data.exercises.length) + ' bài tập</span><small>Read-only · chưa ghi progress</small></div>';
    var node = byId('hskLessonList');
    if (!node) return;
    var html = '';
    data.units.forEach(function (unit) {
      html += '<section class="hsk-pro-unit"><header><span>UNIT ' + esc(unit.order) + '</span><strong>' + esc(unit.titleVi) + '</strong><small lang="zh-CN">' + esc(unit.titleZh) + '</small></header>';
      array(unit.lessonRefs).forEach(function (ref) {
        var lesson = data.lessonById[ref.id];
        if (!lesson) return;
        var active = state.selectedLessonId === lesson.id ? ' active' : '';
        html += '<button type="button" class="hsk-pro-lesson-link' + active + '" data-pro-lesson="' + attr(lesson.id) + '"><span>' + esc(lesson.order) + '</span><b>' + esc(lesson.titleVi) + '</b><small lang="zh-CN">' + esc(lesson.titleZh) + '</small></button>';
      });
      var checkpoint = unit.checkpointRef && data.assessmentById[unit.checkpointRef.id];
      if (checkpoint) html += '<button type="button" class="hsk-pro-assessment-link' + (state.selectedAssessmentId === checkpoint.id ? ' active' : '') + '" data-pro-assessment="' + attr(checkpoint.id) + '">✓ Checkpoint Unit ' + esc(unit.order) + '</button>';
      html += '</section>';
      var midpointId = 'hsk' + state.selectedLevel + '-assessment-midpoint';
      if (Number(unit.order) === 5 && data.assessmentById[midpointId]) html += '<button type="button" class="hsk-pro-assessment-link major' + (state.selectedAssessmentId === midpointId ? ' active' : '') + '" data-pro-assessment="' + attr(midpointId) + '">◈ Midpoint Assessment</button>';
    });
    ['hsk' + state.selectedLevel + '-assessment-final','hsk' + state.selectedLevel + '-assessment-mastery'].forEach(function (id) {
      var assessment = data.assessmentById[id];
      if (assessment) html += '<button type="button" class="hsk-pro-assessment-link major' + (state.selectedAssessmentId === id ? ' active' : '') + '" data-pro-assessment="' + attr(id) + '">' + (id.indexOf('final') >= 0 ? '★ Final Assessment' : '◆ Mastery Review') + '</button>';
    });
    node.innerHTML = html;
  }

  function updateIntro(data) {
    var intro = root.document && root.document.querySelector ? root.document.querySelector('.hsk-intro') : null;
    if (intro) {
      var strong = intro.querySelector('strong');
      var paragraph = intro.querySelector('p');
      var badge = intro.querySelector('.hsk-standard');
      var title = 'HSK ' + data.manifest.level + ' Professional · ' + data.manifest.phase + ' learner-facing';
      var summary = data.units.length + ' unit · ' + data.lessons.length + ' lesson · ' + data.grammar.length + ' điểm ngữ pháp · ' + data.characters.length + ' chữ Hán · ' + data.exercises.length + ' bài tập · ' + data.assessments.length + ' assessment. Read-only: không ghi progress, không migration.';
      var status = data.manifest.phase + ' · READ-ONLY TEST';
      if (strong && strong.textContent !== title) strong.textContent = title;
      if (paragraph && paragraph.textContent !== summary) paragraph.textContent = summary;
      if (badge && badge.textContent !== status) badge.textContent = status;
    }
    var home = root.document && root.document.querySelector ? root.document.querySelector('.home-resource-tile.resource-hsk') : null;
    if (home) {
      var count = home.querySelector('strong');
      var label = home.querySelector('span');
      if (count && count.textContent !== '52') count.textContent = '52';
      if (label && label.textContent !== 'Bài HSK1–2') label.textContent = 'Bài HSK1–2';
    }
  }

  function observeIntro() {
    if (introObserver || !root.MutationObserver || !root.document || !root.document.querySelector) return;
    var intro = root.document.querySelector('.hsk-intro');
    if (!intro) return;
    introObserver = new root.MutationObserver(function () { if (state.data) updateIntro(state.data); });
    introObserver.observe(intro, { childList: true, subtree: true, characterData: true });
  }

  function writeUrl() {
    if (!root.history || !root.location) return;
    try {
      var url = new URL(root.location.href);
      url.searchParams.set('area', 'hsk');
      url.searchParams.set('hskLevel', String(state.selectedLevel));
      if (state.selectedLessonId) {
        url.searchParams.set('hskLesson', state.selectedLessonId);
        url.searchParams.delete('hskAssessment');
      } else if (state.selectedAssessmentId) {
        url.searchParams.set('hskAssessment', state.selectedAssessmentId);
        url.searchParams.delete('hskLesson');
      }
      root.history.replaceState(null, '', url.pathname + '?' + url.searchParams.toString() + (url.hash || ''));
    } catch (error) {}
  }

  function renderCurrent() {
    if (!state.data) return;
    renderLevels(state.data);
    renderSidebar(state.data);
    updateIntro(state.data);
    var node = byId('hskLesson');
    if (!node) return;
    if (state.selectedAssessmentId) {
      var assessment = state.data.assessmentById[state.selectedAssessmentId];
      node.innerHTML = assessment ? renderAssessment(state.data, assessment) : '<div class="hsk-pro-error">Không tìm thấy assessment.</div>';
    } else {
      var lesson = state.data.lessonById[state.selectedLessonId] || state.data.lessons[0];
      state.selectedLessonId = lesson && lesson.id;
      node.innerHTML = lesson ? renderLesson(state.data, lesson) : '<div class="hsk-pro-error">Không tìm thấy lesson.</div>';
    }
    if (root.document && root.document.body) {
      root.document.body.setAttribute('data-hsk-professional', 'c2-readonly');
      root.document.body.setAttribute('data-hsk-course-level', String(state.selectedLevel));
      root.document.body.setAttribute('data-hsk-prof-ready', 'true');
    }
    writeUrl();
  }

  function selectLesson(id, shouldScroll) {
    if (!state.data || !state.data.lessonById[id]) return false;
    state.selectedLessonId = id;
    state.selectedAssessmentId = null;
    renderCurrent();
    if (shouldScroll !== false) {
      var node = byId('hskLesson');
      if (node && node.scrollIntoView) node.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    return true;
  }
  function selectAssessment(id, shouldScroll) {
    if (!state.data || !state.data.assessmentById[id]) return false;
    state.selectedAssessmentId = id;
    state.selectedLessonId = null;
    renderCurrent();
    if (shouldScroll !== false) {
      var node = byId('hskLesson');
      if (node && node.scrollIntoView) node.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    return true;
  }

  function selectLevel(level, shouldScroll) {
    level = Number(level);
    if (!COURSE_CONFIG[level]) return Promise.resolve(false);
    if (level === state.selectedLevel && state.data) {
      if (state.data.lessons[0]) selectLesson(state.data.lessons[0].id, shouldScroll);
      return Promise.resolve(true);
    }
    state.selectedLevel = level;
    state.selectedLessonId = null;
    state.selectedAssessmentId = null;
    showLoading();
    return loadCourse(level).then(function (data) {
      state.selectedLessonId = data.lessons[0] && data.lessons[0].id;
      renderCurrent();
      if (shouldScroll !== false) {
        var node = byId('hskLesson');
        if (node && node.scrollIntoView) node.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return true;
    }).catch(function (error) { showError(error); throw error; });
  }

  function checkExercise(id, article) {
    var exercise = state.data && state.data.exerciseById[id];
    if (!exercise || !article) return;
    var feedback = article.querySelector('[data-pro-feedback="' + id + '"]');
    if (!feedback) return;
    var open = exercise.answer && typeof exercise.answer === 'object' && !Array.isArray(exercise.answer);
    if (open) {
      var rubric = exercise.answer.rubric || {};
      feedback.className = 'hsk-pro-feedback';
      feedback.innerHTML = '<b>Rubric tự đối chiếu</b><p>' + Object.keys(rubric).map(function (key) { return esc(key) + ': ' + esc(rubric[key]) + '%'; }).join(' · ') + '</p><p>' + esc(exercise.explanationVi) + '</p>';
      return;
    }
    var selected = article.querySelector('input[type="radio"]:checked');
    var input = article.querySelector('[data-pro-input-for="' + id + '"]');
    var value = selected ? selected.value : (input ? input.value : '');
    if (!text(value)) {
      feedback.className = 'hsk-pro-feedback bad';
      feedback.textContent = 'Hãy nhập/chọn câu trả lời trước.';
      return;
    }
    var accepted = array(exercise.acceptedAnswers).slice();
    if (typeof exercise.answer === 'string') accepted.push(exercise.answer);
    var normalized = normalizeAnswer(value);
    var correct = accepted.some(function (answer) { return normalizeAnswer(answer) === normalized; });
    feedback.className = 'hsk-pro-feedback ' + (correct ? 'good' : 'bad');
    feedback.innerHTML = '<b>' + (correct ? 'Đúng.' : 'Chưa khớp.') + '</b><p>Đáp án: ' + esc(typeof exercise.answer === 'string' ? exercise.answer : accepted[0] || '') + '</p><p>' + esc(exercise.explanationVi) + '</p>';
  }

  function bindEvents() {
    if (listenersBound || !root.document || !root.document.addEventListener) return;
    listenersBound = true;
    root.document.addEventListener('click', function (event) {
      var target = event.target && event.target.closest ? event.target.closest('button') : null;
      if (!target) return;
      if (target.hasAttribute('data-pro-retry')) {
        delete state.courseCache[state.selectedLevel];
        state.data = null;
        state.status = 'idle';
        state.error = null;
        mount(true).catch(function (error) { if (root.console && root.console.error) root.console.error('HSK learner retry:', error); });
        return;
      }
      var level = Number(target.getAttribute('data-pro-level'));
      if (level && COURSE_CONFIG[level]) {
        selectLevel(level, true).catch(function (error) { if (root.console && root.console.error) root.console.error('HSK level switch:', error); });
        return;
      }
      var lessonId = target.getAttribute('data-pro-lesson');
      if (lessonId) { selectLesson(lessonId, true); return; }
      var assessmentId = target.getAttribute('data-pro-assessment');
      if (assessmentId) { selectAssessment(assessmentId, true); return; }
      var speech = target.getAttribute('data-pro-speak');
      if (speech) { speak(speech); return; }
      var answerId = target.getAttribute('data-pro-toggle-answer');
      if (answerId) {
        var answerBox = root.document.querySelector('[data-pro-answer-box="' + answerId + '"]');
        if (answerBox) answerBox.classList.toggle('hidden');
        return;
      }
      if (target.hasAttribute('data-pro-toggle-transcript')) {
        var transcript = target.parentNode && target.parentNode.querySelector ? target.parentNode.querySelector('.hsk-pro-transcript') : null;
        if (transcript) transcript.classList.toggle('hidden');
        return;
      }
      if (target.hasAttribute('data-pro-show-evidence')) {
        var evidence = target.closest('.hsk-pro-exercise').querySelector('[data-pro-evidence]');
        if (evidence) evidence.classList.toggle('hidden');
        return;
      }
      var checkId = target.getAttribute('data-pro-check');
      if (checkId) { checkExercise(checkId, target.closest('.hsk-pro-exercise')); return; }
      if (target.hasAttribute('data-pro-prev') || target.hasAttribute('data-pro-next')) {
        if (!state.selectedLessonId) return;
        var index = lessonIndex(state.data, state.selectedLessonId) + (target.hasAttribute('data-pro-next') ? 1 : -1);
        if (index >= 0 && index < state.data.lessons.length) selectLesson(state.data.lessons[index].id, true);
      }
    });
  }

  function initialSelection(data) {
    var lessonId = null, assessmentId = null;
    try {
      var params = new URLSearchParams(root.location && root.location.search || '');
      lessonId = params.get('hskLesson');
      assessmentId = params.get('hskAssessment');
    } catch (error) {}
    if (assessmentId && data.assessmentById[assessmentId]) state.selectedAssessmentId = assessmentId;
    else {
      state.selectedAssessmentId = null;
      state.selectedLessonId = lessonId && data.lessonById[lessonId] ? lessonId : data.lessons[0].id;
    }
  }

  function initialLevel() {
    var level = 1;
    try {
      var params = new URLSearchParams(root.location && root.location.search || '');
      var requested = Number(params.get('hskLevel'));
      var contentId = params.get('hskLesson') || params.get('hskAssessment') || '';
      if (COURSE_CONFIG[requested]) level = requested;
      else if (/^hsk2-/.test(contentId)) level = 2;
    } catch (error) {}
    return level;
  }

  function showLoading() {
    var node = byId('hskLesson');
    var config = COURSE_CONFIG[state.selectedLevel] || COURSE_CONFIG[1];
    if (node) node.innerHTML = '<div class="hsk-pro-loading"><b>Đang nạp HSK' + esc(state.selectedLevel) + ' Professional ' + esc(config.phase) + '…</b><span>' + esc(config.label) + ' · read-only</span></div>';
    if (root.document && root.document.body) root.document.body.setAttribute('data-hsk-prof-ready', 'loading');
  }
  function showError(error) {
    var node = byId('hskLesson');
    if (node) node.innerHTML = '<div class="hsk-pro-error"><b>Không nạp được HSK' + esc(state.selectedLevel) + '.</b><p>' + esc(error && error.message || error) + '</p><button class="accent" type="button" data-pro-retry>Thử lại</button></div>';
    if (root.document && root.document.body) root.document.body.setAttribute('data-hsk-prof-ready', 'error');
  }

  function mount(force) {
    var flags = root.VDuckieHskContentFlags && root.VDuckieHskContentFlags.FLAGS;
    if (!force && (!flags || flags.HSK_CURRICULUM_V2_LEARNER_READONLY_ENABLED !== true)) return Promise.resolve({ mounted: false, reason: 'flag-disabled' });
    if (!byId('hskLesson') || !byId('hskLevels') || !byId('hskLessonList')) return Promise.resolve({ mounted: false, reason: 'dom-unavailable' });
    bindEvents();
    observeIntro();
    if (!state.data) state.selectedLevel = initialLevel();
    showLoading();
    return loadCourse(state.selectedLevel).then(function (data) {
      if (!state.selectedLessonId && !state.selectedAssessmentId) initialSelection(data);
      state.mounted = true;
      renderCurrent();
      return getState();
    }).catch(function (error) {
      showError(error);
      throw error;
    });
  }

  function getState() {
    return {
      status: state.status,
      mounted: state.mounted,
      readOnly: true,
      progressWritesEnabled: false,
      selectedLevel: state.selectedLevel,
      selectedLessonId: state.selectedLessonId,
      selectedAssessmentId: state.selectedAssessmentId,
      counts: state.data ? {
        units: state.data.units.length,
        lessons: state.data.lessons.length,
        grammar: state.data.grammar.length,
        characters: state.data.characters.length,
        exercises: state.data.exercises.length,
        assessments: state.data.assessments.length,
        vocabulary: state.data.vocabulary.length
      } : null,
      error: state.error ? (state.error.message || String(state.error)) : null
    };
  }

  function boot() {
    if (!root.document) return;
    var start = function () {
      mount(false).catch(function (error) { if (root.console && root.console.error) root.console.error('HSK learner runtime:', error); });
      if (root.PinyinEngineReady && typeof root.PinyinEngineReady.then === 'function') {
        root.PinyinEngineReady.then(function () { if (state.data) renderCurrent(); }).catch(function () {});
      }
    };
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', start, { once: true });
    else root.setTimeout(start, 0);
  }

  if (root.document) boot();

  return Object.freeze({
    mount: mount,
    getState: getState,
    selectLesson: selectLesson,
    selectAssessment: selectAssessment,
    selectLevel: selectLevel,
    normalizeAnswer: normalizeAnswer,
    resolveFocusWord: resolveFocusWord,
    verifyCourse: verifyCourse,
    SUPPORT_GLOSSES: SUPPORT_GLOSSES
  });
});

(function (root) {
  'use strict';
  if (!root || !root.document) return;
  var style = root.document.createElement('style');
  style.id = 'hsk-pro-c2-mobile-containment';
  style.textContent = `
body[data-hsk-professional="c2-readonly"] #hsk,
body[data-hsk-professional="c2-readonly"] #hsk .hsk-layout,
body[data-hsk-professional="c2-readonly"] #hskLesson,
body[data-hsk-professional="c2-readonly"] #hskLesson > * {
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
}
body[data-hsk-professional="c2-readonly"] #hskLesson {
  overflow-x: hidden;
}
body[data-hsk-professional="c2-readonly"] #hskLesson pre,
body[data-hsk-professional="c2-readonly"] #hskLesson code,
body[data-hsk-professional="c2-readonly"] #hskLesson p,
body[data-hsk-professional="c2-readonly"] #hskLesson li {
  overflow-wrap: anywhere;
  word-break: break-word;
  max-width: 100%;
}
body[data-hsk-professional="c2-readonly"] .hsk-pro-script,
body[data-hsk-professional="c2-readonly"] .hsk-pro-stimulus,
body[data-hsk-professional="c2-readonly"] .hsk-pro-reading,
body[data-hsk-professional="c2-readonly"] .hsk-pro-exercise,
body[data-hsk-professional="c2-readonly"] .hsk-pro-vocab-card,
body[data-hsk-professional="c2-readonly"] .hsk-pro-character,
body[data-hsk-professional="c2-readonly"] .hsk-pro-grammar {
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
}
@media (max-width: 700px) {
  body[data-hsk-professional="c2-readonly"] #hsk .hsk-layout {
    display: block !important;
    width: 100% !important;
  }
  body[data-hsk-professional="c2-readonly"] #hskLesson {
    width: 100% !important;
  }
  .hsk-pro-bottom-nav {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
  }
  .hsk-pro-bottom-nav button,
  .hsk-pro-inline-button,
  .hsk-pro-exercise-actions button {
    min-width: 0;
    max-width: 100%;
    white-space: normal;
  }
  .hsk-pro-vocab-head,
  .hsk-pro-exercise header {
    min-width: 0;
    flex-wrap: wrap;
  }
}
`;
  root.document.head.appendChild(style);
})(typeof globalThis !== 'undefined' ? globalThis : this);

(function (root) {
  'use strict';
  if (!root || !root.document) return;
  var style = root.document.createElement('style');
  style.id = 'hsk-pro-c2-journey-containment';
  style.textContent = `
body[data-hsk-professional="c2-readonly"] #studyRail,
body[data-hsk-professional="c2-readonly"] #hskJourney,
body[data-hsk-professional="c2-readonly"] #hskJourney > *,
body[data-hsk-professional="c2-readonly"] #hskJourney .journey-kicker,
body[data-hsk-professional="c2-readonly"] #hskJourney .hsk-levels,
body[data-hsk-professional="c2-readonly"] #hskJourney #hskProgress,
body[data-hsk-professional="c2-readonly"] #hskJourney #hskLessonList {
  min-width: 0 !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
}
body[data-hsk-professional="c2-readonly"] #hskJourney {
  width: 100% !important;
  overflow-x: hidden !important;
}
body[data-hsk-professional="c2-readonly"] #hskJourney .journey-kicker {
  display: block !important;
  width: auto !important;
  white-space: normal !important;
  overflow-wrap: anywhere !important;
  word-break: break-word !important;
}
@media (max-width: 700px) {
  body[data-hsk-professional="c2-readonly"] #studyRail,
  body[data-hsk-professional="c2-readonly"] #hskJourney {
    width: 100% !important;
    overflow-x: hidden !important;
  }
}
`;
  root.document.head.appendChild(style);
})(typeof globalThis !== 'undefined' ? globalThis : this);

(function (root) {
  'use strict';
  if (!root || !root.document) return;
  var style = root.document.createElement('style');
  style.id = 'hsk-pro-c2-touch-targets';
  style.textContent = `
@media (max-width: 700px) {
  body[data-hsk-professional="c2-readonly"] #hskLesson button:not([disabled]) {
    min-height: 44px !important;
    padding-top: 10px !important;
    padding-bottom: 10px !important;
  }
}
`;
  root.document.head.appendChild(style);
})(typeof globalThis !== 'undefined' ? globalThis : this);
