(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.VDuckieHskContentAdapter = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var GRAMMAR_LABELS = {
    'subject-verb-object': ['Chủ ngữ + động từ + tân ngữ', 'Cấu trúc câu trần thuật cơ bản.'],
    'number-classifier': ['Số + lượng từ + danh từ', 'Dùng lượng từ phù hợp giữa số và danh từ.'],
    'possessive-de': ['Danh từ/đại từ + 的', 'Biểu thị quan hệ sở hữu hoặc bổ nghĩa.'],
    'suggestion-ba': ['Động từ/câu + 吧', 'Đưa ra lời đề nghị hoặc gợi ý nhẹ.'],
    'question-ma': ['Câu trần thuật + 吗', 'Chuyển câu trần thuật thành câu hỏi có/không.'],
    'negation-bu': ['不 + động từ/tính từ', 'Phủ định thói quen, ý định hoặc trạng thái.'],
    'negation-meiyou': ['没（有）+ động từ/danh từ', 'Phủ định việc đã xảy ra hoặc sự sở hữu.'],
    'location-zai': ['Chủ ngữ + 在 + nơi chốn', 'Nói một người hoặc vật đang ở đâu.']
  };

  function text(value) {
    return String(value == null ? '' : value).trim();
  }

  function normalize(value) {
    var output = text(value).toLowerCase();
    if (output.normalize) output = output.normalize('NFD');
    return output.replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/ü/g, 'v').replace(/\s+/g, '');
  }

  function ensureDataset(dataset) {
    if (!dataset || !Array.isArray(dataset.vocabulary) || !Array.isArray(dataset.sentences)) throw new Error('Canonical HSK 1 dataset is unavailable.');
    if (dataset.vocabulary.length !== 300) throw new Error('Canonical HSK 1 vocabulary must contain 300 records.');
    if (dataset.sentences.length !== 900) throw new Error('Canonical HSK 1 sentence bank must contain 900 records.');
  }

  function linkedSentences(vocabulary, sentenceById) {
    return (vocabulary.sentenceIds || []).map(function (id) { return sentenceById[id]; }).filter(Boolean);
  }

  function grammarRules(sentences) {
    var seen = Object.create(null);
    var rules = [];
    for (var i = 0; i < sentences.length && rules.length < 4; i++) {
      var tags = sentences[i].grammarTags || [];
      for (var t = 0; t < tags.length && rules.length < 4; t++) {
        var tag = tags[t];
        if (tag === 'hsk1-original' || seen[tag]) continue;
        seen[tag] = true;
        var label = GRAMMAR_LABELS[tag] || [tag.replace(/-/g, ' '), 'Nhãn cấu trúc từ sentence bank canonical.'];
        rules.push([label[0], label[1], sentences[i].chinese, sentences[i].vietnamese]);
      }
    }
    if (!rules.length && sentences[0]) rules.push(['Câu HSK 1 canonical', 'Quan sát trật tự từ trong câu mẫu.', sentences[0].chinese, sentences[0].vietnamese]);
    return rules;
  }

  function quizOptions(vocabulary, index) {
    var options = [vocabulary[index]];
    var cursor = (index * 17 + 11) % vocabulary.length;
    while (options.length < 4) {
      var candidate = vocabulary[cursor % vocabulary.length];
      if (!options.some(function (item) { return item.meaningVi === candidate.meaningVi; })) options.push(candidate);
      cursor += 29;
    }
    return options.map(function (item) { return item.meaningVi; });
  }

  function adaptCanonicalHsk1(dataset, options) {
    ensureDataset(dataset);
    options = options || {};
    var lessonSize = Number(options.lessonSize || 20);
    if (lessonSize < 5 || dataset.vocabulary.length % lessonSize !== 0) throw new Error('Canonical lesson size must divide 300 vocabulary records.');
    var sentenceById = Object.create(null);
    dataset.sentences.forEach(function (sentence) { sentenceById[sentence.id] = sentence; });
    var lessons = [];
    var flashcards = [];
    var quizItems = [];
    var dictations = dataset.sentences.map(function (sentence) {
      return { id: sentence.id, chinese: sentence.chinese, pinyin: sentence.pinyin, vietnamese: sentence.vietnamese, audioText: sentence.chinese };
    });
    var searchIndex = [];

    dataset.vocabulary.forEach(function (vocabulary, index) {
      var examples = linkedSentences(vocabulary, sentenceById);
      if (examples.length !== 3) throw new Error('Vocabulary ' + vocabulary.id + ' must resolve exactly three canonical sentences.');
      flashcards.push({
        id: vocabulary.id,
        simplified: vocabulary.simplified,
        traditional: vocabulary.traditional,
        pinyin: vocabulary.pinyin,
        meaningVi: vocabulary.meaningVi,
        examples: examples.map(function (sentence) { return { id: sentence.id, chinese: sentence.chinese, pinyin: sentence.pinyin, vietnamese: sentence.vietnamese }; }),
        audioText: vocabulary.simplified
      });
      quizItems.push({
        id: 'quiz-' + vocabulary.id,
        prompt: vocabulary.simplified,
        pinyin: vocabulary.pinyin,
        answer: vocabulary.meaningVi,
        options: quizOptions(dataset.vocabulary, index)
      });
      searchIndex.push({
        type: 'vocabulary',
        id: vocabulary.id,
        searchText: normalize([vocabulary.simplified, vocabulary.traditional || '', vocabulary.pinyin, vocabulary.meaningVi].join(' ')),
        record: vocabulary
      });
    });
    dataset.sentences.forEach(function (sentence) {
      searchIndex.push({
        type: 'sentence',
        id: sentence.id,
        searchText: normalize([sentence.chinese, sentence.pinyin, sentence.vietnamese].join(' ')),
        record: sentence
      });
    });

    for (var offset = 0; offset < dataset.vocabulary.length; offset += lessonSize) {
      var vocabularySlice = dataset.vocabulary.slice(offset, offset + lessonSize);
      var lessonSentences = [];
      var words = vocabularySlice.map(function (vocabulary) {
        var examples = linkedSentences(vocabulary, sentenceById);
        examples.forEach(function (sentence) { lessonSentences.push(sentence); });
        return [
          vocabulary.simplified,
          vocabulary.pinyin,
          vocabulary.meaningVi,
          examples[0].chinese,
          examples[0].vietnamese,
          examples.map(function (sentence) { return [sentence.id, sentence.chinese, sentence.pinyin, sentence.vietnamese]; }),
          vocabulary.id
        ];
      });
      var lessonNumber = lessons.length + 1;
      var start = String(offset + 1).padStart(3, '0');
      var end = String(offset + vocabularySlice.length).padStart(3, '0');
      var dialogue = lessonSentences.slice(0, 4).map(function (sentence, index) {
        return [index % 2 ? 'B' : 'A', sentence.chinese, sentence.vietnamese];
      });
      lessons.push({
        id: 'hsk1-canonical-preview-' + String(lessonNumber).padStart(2, '0'),
        title: 'Canonical ' + start + '–' + end + ' · ' + vocabularySlice[0].simplified + ' → ' + vocabularySlice[vocabularySlice.length - 1].simplified,
        goal: 'Kiểm thử ' + vocabularySlice.length + ' từ canonical và ' + lessonSentences.length + ' câu liên kết.',
        words: words,
        grammar: grammarRules(lessonSentences),
        dialogue: dialogue,
        reading: { zh: dialogue.map(function (line) { return line[1]; }).join(' '), vi: dialogue.map(function (line) { return line[2]; }).join(' ') },
        dictation: { zh: lessonSentences[0].chinese, vi: lessonSentences[0].vietnamese },
        canonicalPreview: true,
        canonicalVocabularyCount: vocabularySlice.length,
        canonicalSentenceCount: lessonSentences.length,
        canonicalSentences: lessonSentences
      });
    }

    function search(query, limit) {
      var normalized = normalize(query);
      if (!normalized) return [];
      return searchIndex.filter(function (item) { return item.searchText.indexOf(normalized) !== -1; }).slice(0, Number(limit || 50));
    }

    return Object.freeze({
      lessons: Object.freeze(lessons),
      flashcards: Object.freeze(flashcards),
      quizItems: Object.freeze(quizItems),
      dictations: Object.freeze(dictations),
      search: search,
      metrics: Object.freeze({
        lessons: lessons.length,
        vocabulary: dataset.vocabulary.length,
        sentences: dataset.sentences.length,
        flashcards: flashcards.length,
        quizItems: quizItems.length,
        dictations: dictations.length,
        audioTexts: flashcards.length + dictations.length
      })
    });
  }

  return Object.freeze({
    adaptCanonicalHsk1: adaptCanonicalHsk1,
    normalizeSearch: normalize
  });
});
